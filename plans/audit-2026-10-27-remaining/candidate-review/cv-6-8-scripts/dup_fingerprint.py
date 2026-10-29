#!/usr/bin/env python3
import sys
import os
import json
import re
from collections import defaultdict, Counter

sys.path.insert(0, os.path.dirname(__file__))
from load import load

items = load(['age_6_8'])
print(f"Loaded {len(items)} items for clone and repetition analysis.")

# 1. Exact Fingerprint duplicates in age_6_8
fp_map = defaultdict(list)
for it in items:
    fp = it.get('fingerprint')
    fp_map[fp].append(it['id'])

fp_dups = {k: v for k, v in fp_map.items() if len(v) > 1}
print(f"\n1. Exact Fingerprint duplicates within age_6_8: {len(fp_dups)} groups, {sum(len(v) for v in fp_dups.values())} items")
for fp, ids in sorted(fp_dups.items(), key=lambda kv: -len(kv[1])):
    sample_it = next(i for i in items if i['id'] == ids[0])
    print(f"   Fingerprint {fp[:16]}... ({len(ids)} items) [{sample_it['gameTypeId']}|{sample_it['boardData']['kind']}]: {ids}")

# 2. Structural Fingerprint duplicates
def canonical_skeleton(it):
    b = it.get('boardData', {})
    k = b.get('kind')
    gt = it.get('gameTypeId')
    
    if k in ('rule-sequence', 'rule-error', 'memory-sequence'):
        seq = b.get('sequence', [])
        val_map = {}
        norm_seq = tuple(val_map.setdefault(x, len(val_map)) for x in seq)
        return (gt, k, b.get('ruleKind'), b.get('mode'), b.get('period'), norm_seq)
    
    elif k == 'rule-transform':
        trans = b.get('transform')
        exs = tuple((e.get('input'), e.get('output')) for e in b.get('examples', []))
        return (gt, k, trans, len(exs))
    
    elif k in ('quantity-balance',):
        l_weights = tuple(sorted(x.get('weight', 0) for x in b.get('left', [])))
        r_weights = tuple(sorted(x.get('weight', 0) for x in b.get('right', [])))
        return (gt, k, b.get('mode'), l_weights, r_weights)
    
    elif k in ('quantity-grouping',):
        return (gt, k, b.get('mode'), b.get('total'), b.get('groupSize'))
    
    elif k in ('planning-fix-step',):
        cmds = tuple(c.get('command') if isinstance(c, dict) else str(c) for c in b.get('commands', []))
        return (gt, k, cmds)
    
    elif k in ('planning-command-order',):
        cmds = tuple(sorted(str(c.get('text') if isinstance(c, dict) else c) for c in b.get('commands', [])))
        return (gt, k, cmds)
    
    elif k in ('reasoning-elimination',):
        clues = tuple(sorted((str(c.get('trait')), str(c.get('value')), bool(c.get('negate'))) for c in b.get('clues', [])))
        return (gt, k, len(b.get('candidates', [])), clues)
    
    elif k in ('reasoning-if-then',):
        rules = tuple(sorted((str(r.get('if')), str(r.get('then'))) for r in b.get('rules', [])))
        return (gt, k, rules)
    
    elif k in ('observation-implausible',):
        scene = tuple(sorted(str(s.get('text')) for s in b.get('scene', [])))
        return (gt, k, scene)
    
    b_copy = {k_: v_ for k_, v_ in b.items() if k_ not in ('options',)}
    return (gt, k, json.dumps(b_copy, sort_keys=True, ensure_ascii=False))

skel_map = defaultdict(list)
for it in items:
    skel = canonical_skeleton(it)
    skel_map[skel].append(it['id'])

skel_dups = {k: v for k, v in skel_map.items() if len(v) > 1}
print(f"\n2. Structural skeleton duplicates within age_6_8: {len(skel_dups)} groups, {sum(len(v) for v in skel_dups.values())} items")
for skel, ids in sorted(skel_dups.items(), key=lambda kv: -len(kv[1]))[:15]:
    sample_it = next(i for i in items if i['id'] == ids[0])
    print(f"   [{skel[0]}|{skel[1]}] {len(ids)} items: {ids[:5]} (skeleton: {str(skel[2:])[:75]})")

# 3. Exact Text Duplicates
print("\n3. Text Duplicates:")
for field in ['title', 'invitation', 'tutorial', 'explanation']:
    t_map = defaultdict(list)
    for it in items:
        t_map[it.get(field, '')].append(it['id'])
    dups = {k: v for k, v in t_map.items() if len(v) > 1}
    print(f"   Field '{field}': {len(dups)} duplicate texts covering {sum(len(v) for v in dups.values())} items (distinct values: {len(t_map)})")
    top_dup = sorted(dups.items(), key=lambda kv: -len(kv[1]))[:3]
    for text, ids in top_dup:
        print(f"     -> ({len(ids)} items) \"{text[:70]}...\": {ids[:4]}")

# 4. Duplicate across all 4 text fields combined (identical copy)
full_text_map = defaultdict(list)
for it in items:
    combo = (it.get('title'), it.get('invitation'), it.get('tutorial'), it.get('explanation'), tuple(it.get('hints', [])))
    full_text_map[combo].append(it['id'])
full_text_dups = {k: v for k, v in full_text_map.items() if len(v) > 1}
print(f"\n4. Identical 100% copy across (title, inv, tut, expl, hints): {len(full_text_dups)} groups, {sum(len(v) for v in full_text_dups.values())} items")
for combo, ids in full_text_dups.items():
    print(f"   Title: \"{combo[0]}\" ({len(ids)} items): {ids}")

# Save dup stats
dup_stats = {
    'fingerprint_duplicate_groups': len(fp_dups),
    'fingerprint_duplicate_items': sum(len(v) for v in fp_dups.values()),
    'fingerprint_details': [
        {'fingerprint': fp, 'count': len(ids), 'items': ids}
        for fp, ids in sorted(fp_dups.items(), key=lambda kv: -len(kv[1]))
    ],
    'skeleton_duplicate_groups': len(skel_dups),
    'skeleton_duplicate_items': sum(len(v) for v in skel_dups.values()),
    'full_copy_duplicate_groups': len(full_text_dups),
    'full_copy_duplicate_items': sum(len(v) for v in full_text_dups.values()),
    'top_skeleton_clusters': [
        {'gameTypeId': skel[0], 'kind': skel[1], 'count': len(ids), 'sample_ids': ids[:5], 'skeleton': str(skel[2:])[:120]}
        for skel, ids in sorted(skel_dups.items(), key=lambda kv: -len(kv[1]))[:20]
    ]
}

out_file = os.path.join(os.path.dirname(__file__), 'dup_stats.json')
with open(out_file, 'w', encoding='utf-8') as fp:
    json.dump(dup_stats, fp, ensure_ascii=False, indent=2)
print(f"\nWrote duplicate statistics to {out_file}")
