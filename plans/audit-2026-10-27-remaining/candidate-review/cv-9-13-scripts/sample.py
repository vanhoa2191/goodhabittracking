import sys,json,re,collections
sys.path.insert(0,'.')
from load import load
it=load()
def pick():
    sel=[]
    types=sorted({i['gameTypeId'] for i in it})
    for gi,g in enumerate(types):
        for tn,t in enumerate(['age_9_12','age_13_plus']):
            xs=sorted([i for i in it if i['gameTypeId']==g and i['ageTrack']==t],key=lambda i:i['dayIndex'])
            n=3 if tn==0 else 2
            # spread quantiles, offset by gi to vary
            idx=[min(len(xs)-1,int((j+0.5+ (gi%3)*0.1)*len(xs)/n)) for j in range(n)]
            for j in idx: sel.append(xs[j])
    return sel
def brief(b):
    s=json.dumps({k:v for k,v in b.items()},ensure_ascii=False,separators=(',',':'))
    return s[:300]
if __name__=='__main__':
    sel=pick();print(len(sel))
    part=int(sys.argv[1]);chunk=sel[part*40:(part+1)*40]
    for i in chunk:
        print(f"[{i['id']}|{i['gameTypeId']}|{i['ruleVariantId'].split(':')[1]}] {i['title']}\n  INV: {i['invitation']}\n  TUT: {i['tutorial'][:200]}\n  EXP: {i['explanation'][:260]}\n  H: {' // '.join(i['hints'])[:260]}\n  B: {brief(i['boardData'])}\n  SOL: {json.dumps(i['solution'],ensure_ascii=False)[:100]}")
    json.dump([i['id'] for i in sel],open('sample_ids.json','w'))
