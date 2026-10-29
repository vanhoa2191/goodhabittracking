#!/usr/bin/env python3
import sys
import os
import json
from collections import defaultdict

sys.path.insert(0, os.path.dirname(__file__))
from load import load

items = load(['age_6_8'])
print(f"Loaded {len(items)} items.")

# 24 kinds x 6 items = 144 items (exceeds minimum 120)
kinds = sorted({it['boardData']['kind'] for it in items})
selected = []

for k in kinds:
    k_items = sorted([it for it in items if it['boardData']['kind'] == k], key=lambda x: x['dayIndex'])
    n = len(k_items)
    # pick 6 items distributed across the 365 days: indices 0, ~n/5, ~2n/5, ~3n/5, ~4n/5, n-1
    pick_indices = [
        0,
        int(n * 0.2),
        int(n * 0.4),
        int(n * 0.6),
        int(n * 0.8),
        n - 1
    ]
    # deduplicate indices if any
    seen_idx = set()
    for idx in pick_indices:
        if idx not in seen_idx and idx < n:
            seen_idx.add(idx)
            selected.append(k_items[idx])

# Sort selected by dayIndex then slotType
selected.sort(key=lambda x: (x['dayIndex'], x['slotType']))

print(f"Total stratified items selected: {len(selected)}")
print(f"Covering {len(set(x['dayIndex'] for x in selected))} distinct days and {len(set(x['boardData']['kind'] for x in selected))} distinct mechanics.")

# Save sample metadata
sample_ids = [it['id'] for it in selected]
with open(os.path.join(os.path.dirname(__file__), 'sample_ids.json'), 'w', encoding='utf-8') as fp:
    json.dump(sample_ids, fp, ensure_ascii=False, indent=2)

# Save human-readable cards for eye-review
with open(os.path.join(os.path.dirname(__file__), 'sample_144_review.txt'), 'w', encoding='utf-8') as fp:
    for idx, it in enumerate(selected, 1):
        b = it['boardData']
        k = b['kind']
        fp.write(f"=== [{idx:03d}/144] {it['id']} | Day {it['dayIndex']:03d} | Slot {it['slotType']} | {it['gameTypeId']} | {k} ===\n")
        fp.write(f"Title: {it['title']}\n")
        fp.write(f"Invitation: {it['invitation']}\n")
        fp.write(f"Tutorial: {it['tutorial']}\n")
        fp.write(f"Explanation: {it['explanation']}\n")
        fp.write(f"Hints: {' // '.join(it.get('hints', []))}\n")
        fp.write(f"Board summary: {json.dumps({k_: v_ for k_, v_ in b.items() if k_ != 'options'}, ensure_ascii=False)[:300]}\n")
        fp.write(f"Options: {json.dumps(b.get('options'), ensure_ascii=False)[:180]}\n")
        fp.write(f"Solution: {json.dumps(it.get('solution'), ensure_ascii=False)}\n\n")

print(f"Wrote sample_ids.json and sample_144_review.txt successfully.")
