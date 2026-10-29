import sys,json,re,collections,statistics as st
sys.path.insert(0,'.')
from load import load
it=load()
T=lambda t:[i for i in it if i['ageTrack']==t]
for t in ['age_9_12','age_13_plus']:
    xs=T(t);print('==',t,len(xs))
    print('targetSeconds',collections.Counter(i['targetSeconds'] for i in xs))
    print('distinct fingerprints',len({i['fingerprint'] for i in xs}),'distinct titles',len({i['title'] for i in xs}),'inv',len({i['invitation'] for i in xs}),'tut',len({i['tutorial'] for i in xs}),'expl',len({i['explanation'] for i in xs}),'hints',len({tuple(i['hints']) for i in xs}))
    # voice markers
    for w in ['nha','nhé','nào bạn','bạn nhỏ','cùng mình','Chào bạn','nhỉ','nè','đấy']:
        print('  voice',w,sum(1 for i in xs if re.search(w,i['invitation']+i['tutorial'])))
    fp=collections.Counter(i['fingerprint'] for i in xs)
    print('dup fingerprints',sum(1 for v in fp.values() if v>1), 'items in dup',sum(v for v in fp.values() if v>1))
    # exact same boardData
    bd=collections.Counter(json.dumps(i['boardData'],sort_keys=True,ensure_ascii=False) for i in xs)
    print('identical boardData groups',sum(1 for v in bd.values() if v>1),'items',sum(v for v in bd.values() if v>1))
    inv=collections.Counter(i['invitation'] for i in xs);print('  most common invitation',inv.most_common(3))
    tt=collections.Counter(i['tutorial'] for i in xs);print('  tutorial top',[(a[:70],b) for a,b in tt.most_common(4)])
    hh=collections.Counter(tuple(i['hints']) for i in xs);print('  hint-pair top',[(a[0][:50],b) for a,b in hh.most_common(3)])
    ex=collections.Counter(re.sub(r'\d+','#',i['explanation']) for i in xs);print('  expl-template top',[(a[:70],b) for a,b in ex.most_common(3)])
# cross track
a={i['id'][:-3 if i['id'].endswith('912') else -3]:i for i in T('age_9_12')}
same=0
d913={}
for i in T('age_9_12'): d913[(i['dayIndex'],i['slotType'])]=i
cnt=collections.Counter()
for i in T('age_13_plus'):
    o=d913[(i['dayIndex'],i['slotType'])]
    cnt['same_gameType']+= o['gameTypeId']==i['gameTypeId']
    cnt['same_variant']+= o['ruleVariantId']==i['ruleVariantId']
    cnt['same_boardData']+= o['boardData']==i['boardData']
    cnt['same_title']+= o['title']==i['title']
    cnt['same_invitation']+=o['invitation']==i['invitation']
    cnt['same_explanation']+=o['explanation']==i['explanation']
    cnt['same_hints']+=o['hints']==i['hints']
    cnt['same_tutorial']+=o['tutorial']==i['tutorial']
print(cnt)
