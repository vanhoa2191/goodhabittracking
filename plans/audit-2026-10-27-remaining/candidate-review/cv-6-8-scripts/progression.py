#!/usr/bin/env python3
import sys
import os
import json
import statistics as st
from collections import defaultdict

sys.path.insert(0, os.path.dirname(__file__))
from load import load

items = load(['age_6_8'])
print(f"Loaded {len(items)} items for difficulty progression analysis.")

# Quarters
BINS = [
    ('Q1 (Day 001-091)', 1, 91),
    ('Q2 (Day 092-182)', 92, 182),
    ('Q3 (Day 183-273)', 183, 273),
    ('Q4 (Day 274-365)', 274, 365)
]

def item_complexity(it):
    b = it.get('boardData', {})
    k = b.get('kind')
    
    if k in ('rule-sequence', 'rule-error', 'memory-sequence'):
        return len(b.get('sequence', []))
    if k == 'rule-transform':
        return len(b.get('examples', []))
    if k == 'memory-change':
        return len(b.get('before', []))
    if k == 'memory-position':
        return len(b.get('targets', []))
    if k == 'observation-difference':
        return len(b.get('left', [])) * len(b.get('left', [[0]])[0])
    if k == 'observation-implausible':
        return len(b.get('scene', []))
    if k in ('observation-two-traits', 'flexibility-classify'):
        return len(b.get('items', []))
    if k in ('reasoning-elimination', 'reasoning-missing-info'):
        return len(b.get('candidates', []))
    if k == 'reasoning-if-then':
        return len(b.get('rules', []))
    if k == 'quantity-balance':
        return len(b.get('left', [])) + len(b.get('right', []))
    if k == 'quantity-grouping':
        return b.get('total', 0)
    if k == 'quantity-target':
        return len(b.get('items', []))
    if k in ('planning-command-order', 'planning-fix-step'):
        return len(b.get('commands', []))
    if k in ('path-planning', 'flexibility-alternative', 'flexibility-perspective'):
        return b.get('width', 0) * b.get('height', 0)
    if k == 'spatial-rotation':
        return len(b.get('shape', []))
    if k == 'spatial-silhouette':
        return len(b.get('target', []))
    if k == 'spatial-symmetry':
        return len(b.get('grid', [])) * len(b.get('grid', [[0]])[0])
    return 0

# 1. Track-wide progression stats by Quarter
quarter_stats = {}
for qname, start, end in BINS:
    q_items = [it for it in items if start <= it['dayIndex'] <= end]
    text_lens = [
        len(it.get('invitation', '')) + len(it.get('tutorial', '')) + len(it.get('explanation', ''))
        for it in q_items
    ]
    opts_counts = [
        len(it.get('boardData', {}).get('options') or [])
        for it in q_items
    ]
    target_secs = [it.get('targetSeconds', 75) for it in q_items]
    
    quarter_stats[qname] = {
        'items_count': len(q_items),
        'mean_text_chars': round(st.mean(text_lens), 1),
        'mean_options_count': round(st.mean(opts_counts), 2),
        'target_seconds': round(st.mean(target_secs), 1)
    }

print("\n--- QUARTERLY MACRO STATS ---")
for qname, stat in quarter_stats.items():
    print(f"{qname}: {stat}")

# 2. Progression by Mechanic / Board Kind
kinds = sorted({it['boardData']['kind'] for it in items})
kind_progression = {}
print("\n--- MEAN BOARD SIZE / COMPLEXITY BY KIND ACROSS QUARTERS ---")
print(f"{'Kind':<28} | {'Q1':<6} | {'Q2':<6} | {'Q3':<6} | {'Q4':<6} | Delta (Q4-Q1)")
print("-" * 65)

for k in kinds:
    row = []
    for qname, start, end in BINS:
        vals = [item_complexity(it) for it in items if it['boardData']['kind'] == k and start <= it['dayIndex'] <= end]
        row.append(round(st.mean(vals), 2) if vals else 0)
    delta = round(row[3] - row[0], 2)
    kind_progression[k] = {'quarters': row, 'delta': delta}
    print(f"{k:<28} | {row[0]:<6} | {row[1]:<6} | {row[2]:<6} | {row[3]:<6} | {delta:+0.2f}")

# 3. Numeric magnitudes in quantity kinds
print("\n--- NUMERIC MAGNITUDES ACROSS QUARTERS ---")
for qname, start, end in BINS:
    q_items = [it for it in items if start <= it['dayIndex'] <= end]
    # quantity-grouping total
    qg_totals = [it['boardData'].get('total') for it in q_items if it['boardData']['kind'] == 'quantity-grouping']
    # quantity-target target
    qt_targets = [it['boardData'].get('target') for it in q_items if it['boardData']['kind'] == 'quantity-target']
    # quantity-balance max weight
    qb_weights = [
        max(x.get('weight', 0) for x in it['boardData'].get('left', []) + it['boardData'].get('right', []))
        for it in q_items if it['boardData']['kind'] == 'quantity-balance'
    ]
    print(f"{qname}:")
    if qg_totals:
        print(f"  quantity-grouping total: min={min(qg_totals)}, mean={round(st.mean(qg_totals),1)}, max={max(qg_totals)}")
    if qt_targets:
        print(f"  quantity-target target: min={min(qt_targets)}, mean={round(st.mean(qt_targets),1)}, max={max(qt_targets)}")
    if qb_weights:
        print(f"  quantity-balance max weight: min={min(qb_weights)}, mean={round(st.mean(qb_weights),1)}, max={max(qb_weights)}")

out_file = os.path.join(os.path.dirname(__file__), 'progression_stats.json')
with open(out_file, 'w', encoding='utf-8') as fp:
    json.dump({
        'quarterly_stats': quarter_stats,
        'kind_progression': kind_progression
    }, fp, ensure_ascii=False, indent=2)
print(f"\nWrote progression statistics to {out_file}")
