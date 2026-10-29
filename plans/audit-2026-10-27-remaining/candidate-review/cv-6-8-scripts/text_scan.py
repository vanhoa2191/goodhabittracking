#!/usr/bin/env python3
import sys
import os
import json
import re
import unicodedata
from collections import defaultdict, Counter

sys.path.insert(0, os.path.dirname(__file__))
from load import load

items = load(['age_6_8'])
print(f"Loaded {len(items)} items for age_6_8.")

flags = defaultdict(list)

def flag(category, item, msg):
    flags[category].append({
        'id': item['id'],
        'dayIndex': item.get('dayIndex'),
        'slotType': item.get('slotType'),
        'gameTypeId': item.get('gameTypeId'),
        'kind': item.get('boardData', {}).get('kind'),
        'message': str(msg)[:300]
    })

def extract_strings(obj, path=''):
    out = []
    if isinstance(obj, str):
        out.append((path, obj))
    elif isinstance(obj, list):
        for idx, val in enumerate(obj):
            out.extend(extract_strings(val, f"{path}[{idx}]"))
    elif isinstance(obj, dict):
        for k, v in obj.items():
            out.extend(extract_strings(v, f"{path}.{k}" if path else k))
    return out

# 1. Foreign / Non-Vietnamese characters and normalization
FOREIGN_SCRIPTS = ('CJK', 'CYRILLIC', 'HANGUL', 'HIRAGANA', 'KATAKANA', 'ARABIC', 'THAI', 'DEVANAGARI', 'HEBREW', 'GREEK')
VIETNAMESE_REDUPLICATIONS = {
    'từ từ', 'chậm chậm', 'nhanh nhanh', 'xanh xanh', 'đều đều', 'nhỏ nhỏ', 'to to',
    'vừa vừa', 'gần gần', 'xa xa', 'đo đỏ', 'vàng vàng', 'trăng trắng', 'tim tím',
    'chút chút', 'lần lần', 'từng từng', 'ngày ngày', 'đêm đêm', 'năm năm'
}

UNTRANSLATED_EN = re.compile(
    r'\b(candidate|item|shape|scene|fact|turn|step|fix|robot|north|south|east|west|left|right|ahead|behind|options?|rules?|commands?|color|pattern|grid)\b',
    re.IGNORECASE
)

SENSITIVE_LEXICON = [
    # violence / danger
    ('violence', r'\b(giết|chết|máu|súng|dao|đánh|đấm|bạo lực|đau đớn|thương tích|hung dữ|tai nạn|vết thương|chém)\b'),
    # fear
    ('fear', r'\b(ma|quỷ|quái vật|rùng rợn|sợ hãi|ác mộng|kinh hãi)\b'),
    # commercial / money / gambling
    ('commercial', r'\b(tiền|giá tiền|mua|bán|khuyến mãi|quảng cáo|đắt đỏ|rẻ tiền|đồng|nghìn|triệu|vay|nợ|lãi|cá cược|đặt cược)\b'),
    # stereotyping / insults
    ('stereotype_insult', r'\b(ngu|dốt|kém cỏi|đần|ngốc|béo|mập|gầy gò|xấu xí|lùn|dị dạng|quê mùa|nhà quê)\b'),
    # gender bias
    ('gender_bias', r'\b(con gái thì|con trai thì|đàn ông phải|phụ nữ phải)\b'),
    # unhealthy items
    ('unhealthy', r'\b(nước có ga|nước ngọt|thuốc lá|rượu|bia|fast food)\b'),
]

# Track-wide scans
for it in items:
    # Check all textual fields
    fields = [
        ('title', it.get('title', '')),
        ('invitation', it.get('invitation', '')),
        ('tutorial', it.get('tutorial', '')),
        ('explanation', it.get('explanation', '')),
    ]
    for idx, h in enumerate(it.get('hints', [])):
        fields.append((f'hints[{idx}]', h))

    # Also extract strings inside boardData
    board_strings = extract_strings(it.get('boardData', {}), 'boardData')
    all_fields = fields + board_strings

    for path, text in all_fields:
        if not text:
            continue

        # Non-NFC
        if not unicodedata.is_normalized('NFC', text):
            flag('unicode_not_nfc', it, f"{path}: Not NFC normalized -> {text[:100]}")

        # Foreign scripts
        for ch in text:
            u_name = unicodedata.name(ch, '')
            if any(s in u_name for s in FOREIGN_SCRIPTS):
                flag('foreign_script', it, f"{path}: Character {ch} ({u_name}) in '{text[:80]}'")
            if ch == '\ufffd':
                flag('replacement_char', it, f"{path}: U+FFFD replacement character in '{text[:80]}'")

        # Spacing / formatting
        if '  ' in text:
            flag('double_space', it, f"{path}: Double space in '{text[:100]}'")
        if text != text.strip():
            flag('leading_trailing_whitespace', it, f"{path}: Leading/trailing whitespace in '{text[:100]}'")
        if re.search(r'\s[,.!?;:]', text):
            flag('space_before_punct', it, f"{path}: Space before punctuation in '{text[:100]}'")

        # Leaked variables or templates
        if re.search(r'\b(undefined|null|NaN|\[object Object\])\b|\$\{', text):
            flag('template_leak', it, f"{path}: Leaked code token in '{text[:100]}'")

        # English words in Vietnamese copy (only user-facing fields)
        if path.startswith(('title', 'invitation', 'tutorial', 'explanation', 'hints', 'boardData.scene', 'boardData.commands', 'boardData.items', 'boardData.rules')):
            m_en = UNTRANSLATED_EN.search(text)
            if m_en:
                # ignore 'robot' if context is child-friendly robot toy
                word = m_en.group(1).lower()
                if word == 'robot':
                    pass # acceptable in Vietnamese kids books
                else:
                    flag('untranslated_en', it, f"{path}: English word '{m_en.group(1)}' in '{text[:100]}'")

        # Repeated words
        m_rep = re.findall(r'\b(\w+)\s+\1\b', text, re.IGNORECASE)
        for w in m_rep:
            pair = f"{w} {w}".lower()
            if pair not in VIETNAMESE_REDUPLICATIONS and not w.isdigit():
                flag('repeated_word', it, f"{path}: Repeated word '{pair}' in '{text[:100]}'")

    # Sensitive lexicon across all user-facing text
    full_user_text = ' '.join([t for p, t in fields] + [t for p, t in board_strings if any(k in p for k in ('text', 'label', 'scenario', 'trait', 'value', 'scene', 'commands'))])
    for cat, pattern in SENSITIVE_LEXICON:
        m = re.search(pattern, full_user_text, re.IGNORECASE)
        if m:
            flag(f'sensitive_{cat}', it, f"Found '{m.group(0)}' in context: {full_user_text[max(0, m.start()-30):min(len(full_user_text), m.end()+50)]}")

    # Check for direct answer leaks in invitation/tutorial/hints
    sol = it.get('solution')
    if isinstance(sol, str) and len(sol) > 1 and not re.match(r'^(opt-|cand-|card-|item-|shape-|fix-|step-|turn-)', sol):
        for fname, fval in [('invitation', it.get('invitation', '')), ('tutorial', it.get('tutorial', ''))]:
            if re.search(r'(?<![\wÀ-ỹ])' + re.escape(sol) + r'(?![\wÀ-ỹ])', fval, re.IGNORECASE):
                # Check kind; in rule-sequence or some kinds it might leak
                flag('solution_leak_in_prompt', it, f"Solution '{sol}' appears in {fname}: {fval[:120]}")
        for idx, h in enumerate(it.get('hints', [])):
            if re.search(r'(?<![\wÀ-ỹ])' + re.escape(sol) + r'(?![\wÀ-ỹ])', h, re.IGNORECASE):
                # Hint 1 shouldn't give away the solution completely
                if idx == 0:
                    flag('solution_leak_in_hint_0', it, f"Solution '{sol}' in hint 0: {h[:120]}")

    # Check "Bạn số N" in explanation vs candidates/options
    expl = it.get('explanation', '')
    m_ban = re.search(r'[Bb]ạn số (\d+)', expl)
    if m_ban:
        ban_num = int(m_ban.group(1))
        # Check boardData candidates
        bdata = it.get('boardData', {})
        cands = bdata.get('candidates') or bdata.get('options')
        sol = it.get('solution')
        flag('ban_so_n_mention', it, f"Mentions 'Bạn số {ban_num}', solution={sol}, candidates_len={len(cands) if cands else 'None'}")

print("\n--- TEXT SCAN SUMMARY ---")
for cat, lst in sorted(flags.items()):
    print(f"{cat}: {len(lst)} occurrences (e.g. {lst[0]['id']}: {lst[0]['message'][:100]})")

out_file = os.path.join(os.path.dirname(__file__), 'text_scan_results.json')
with open(out_file, 'w', encoding='utf-8') as fp:
    json.dump(flags, fp, ensure_ascii=False, indent=2)
print(f"\nWrote full text scan results to {out_file}")
