import sys,json,re,collections,statistics as st
sys.path.insert(0,'.')
from load import load
it=load()
bins=[(1,91),(92,182),(183,273),(274,365)]
def modekey(b):
    return tuple(str(b.get(k)) for k in('mode','ruleKind','transform','turn','change','axis','period') if b.get(k) is not None)
for kind in ['rule-sequence','rule-error','rule-transform','quantity-balance','quantity-grouping','quantity-target','memory-change','memory-sequence','memory-position','spatial-rotation','spatial-symmetry','path-planning']:
    for t in['age_9_12']:
        print(kind,[dict(collections.Counter(modekey(i['boardData']) for i in it if i['boardData']['kind']==kind and i['ageTrack']==t and lo<=i['dayIndex']<=hi)) for lo,hi in bins][:4])
# numeric magnitudes
for t in['age_9_12','age_13_plus']:
    q=[int(i['boardData']['query']) for i in it if i['boardData']['kind']=='rule-transform' and i['ageTrack']==t];print(t,'transform query range',min(q),max(q))
    w=[x['weight'] for i in it if i['boardData']['kind']=='quantity-balance' and i['ageTrack']==t for x in i['boardData']['left']+i['boardData']['right']];print(t,'balance weights',min(w),max(w))
    v=[x['value'] for i in it if i['boardData']['kind']=='quantity-target' and i['ageTrack']==t for x in i['boardData']['items']];print(t,'target values',min(v),max(v))
    print(t,'displayMs',collections.Counter(i['boardData'].get('displayMs') for i in it if i['ageTrack']==t))
    print(t,'if-then rules count by q',[round(st.mean(len(i['boardData']['rules']) for i in it if i['boardData']['kind']=='reasoning-if-then' and i['ageTrack']==t and lo<=i['dayIndex']<=hi),2) for lo,hi in bins])
    print(t,'elim clues count',collections.Counter(len(i['boardData']['clues']) for i in it if i['boardData']['kind']=='reasoning-elimination' and i['ageTrack']==t))
    print(t,'walls by q',[round(st.mean(len(i['boardData']['walls']) for i in it if i['boardData']['kind']=='path-planning' and i['ageTrack']==t and lo<=i['dayIndex']<=hi),2) for lo,hi in bins])
    print(t,'waypoints',collections.Counter(len(i['boardData']['waypoints']) for i in it if i['boardData']['kind']=='path-planning' and i['ageTrack']==t))
# gametype per day spacing / variant balance
for t in['age_9_12']:
    v=collections.Counter(i['ruleVariantId'] for i in it if i['ageTrack']==t);print('variants',len(v),min(v.values()),max(v.values()))
    g=collections.Counter(i['gameTypeId'] for i in it if i['ageTrack']==t);print(sorted(g.items()))
    sg=collections.Counter(i['skillGroup'] for i in it if i['ageTrack']==t);print(sg)
# identical boardData groups
bd=collections.defaultdict(list)
for i in it: bd[(i['ageTrack'],json.dumps(i['boardData'],sort_keys=True,ensure_ascii=False))].append(i['id'])
for k,v in bd.items():
    if len(v)>1: print('IDENTICAL',v,k[1][:80])
