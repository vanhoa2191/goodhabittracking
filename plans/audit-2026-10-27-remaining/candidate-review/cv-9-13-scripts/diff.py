import sys,json,re,collections,statistics as st
sys.path.insert(0,'.')
from load import load
it=load()
def size(i):
    b=i['boardData'];k=b['kind']
    g=lambda k_:b.get(k_)
    if k in('rule-sequence','rule-error','memory-sequence'): return len(b['sequence'])
    if k=='rule-transform': return max(len(b['query']),1)
    if k=='memory-change': return len(b['before'])
    if k=='memory-position': return len(b['targets'])
    if k=='observation-difference': return len(b['left'])*len(b['left'][0])
    if k=='observation-implausible': return len(b['scene'])
    if k in('observation-two-traits','flexibility-classify'): return len(b['items'])
    if k in('reasoning-elimination','reasoning-missing-info'): return len(b['candidates'])
    if k=='reasoning-if-then': return len(b['rules'])
    if k=='quantity-balance': return len(b['left'])+len(b['right'])
    if k=='quantity-grouping': return b['total']
    if k=='quantity-target': return len(b['items'])
    if k=='planning-command-order': return len(b['commands'])
    if k=='planning-fix-step': return len(b['commands'])
    if k in('path-planning','flexibility-alternative'): return b['width']*b['height']
    if k=='flexibility-perspective': return b['width']*b['height']
    if k in('spatial-rotation',): return len(b['shape'])
    if k=='spatial-silhouette': return len(b['target'])
    if k=='spatial-symmetry': return len(b['grid'])*len(b['grid'][0])
bins=[(1,91),(92,182),(183,273),(274,365)]
print('kind | track | mean size by quarter | n')
rows=[]
for kind in sorted({i['boardData']['kind'] for i in it}):
    for t in['age_9_12','age_13_plus']:
        r=[]
        for lo,hi in bins:
            v=[size(i) for i in it if i['boardData']['kind']==kind and i['ageTrack']==t and lo<=i['dayIndex']<=hi]
            r.append(round(st.mean(v),1) if v else None)
        rows.append((kind,t,r))
        print(kind,t,r)
# total explanation length by quarter
for t in['age_9_12','age_13_plus']:
    print(t,'text len by quarter',[round(st.mean(len(i['invitation'])+len(i['tutorial'])+len(i['explanation']) for i in it if i['ageTrack']==t and lo<=i['dayIndex']<=hi),0) for lo,hi in bins])
    print(t,'options count by quarter',[round(st.mean(len(i['boardData'].get('options') or []) for i in it if i['ageTrack']==t and lo<=i['dayIndex']<=hi),2) for lo,hi in bins])
# 13+ vs 9-12 sizes paired
p=collections.defaultdict(list)
d={(i['dayIndex'],i['slotType']):i for i in it if i['ageTrack']=='age_9_12'}
for i in it:
    if i['ageTrack']=='age_13_plus':
        o=d[(i['dayIndex'],i['slotType'])]; p[i['boardData']['kind']].append(size(i)-size(o))
print('13+ minus 9-12 size, mean by kind:',{k:round(st.mean(v),2) for k,v in p.items()})
# number magnitudes quantity
print('quantity-grouping total range', [ (t,min(i['boardData']['total'] for i in it if i['boardData']['kind']=='quantity-grouping' and i['ageTrack']==t),max(i['boardData']['total'] for i in it if i['boardData']['kind']=='quantity-grouping' and i['ageTrack']==t)) for t in ['age_9_12','age_13_plus']])
