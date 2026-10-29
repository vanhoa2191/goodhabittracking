import sys,collections
sys.path.insert(0,'.')
from load import load
it=load()
res=collections.defaultdict(list)
for i in it:
    b=i['boardData']
    if b['kind']!='spatial-rotation': continue
    S={(p['x'],p['y']) for p in b['shape']};mx=max(x for x,y in S);my=max(y for x,y in S)
    opts={o['id']:{(p['x'],p['y']) for p in o['cells']} for o in b['options']}
    T={'cw':lambda x,y:(my-y,x),'ccw':lambda x,y:(y,mx-x),'r180':lambda x,y:(mx-x,my-y),'fh':lambda x,y:(mx-x,y),'fv':lambda x,y:(x,my-y),'tr':lambda x,y:(y,x),'atr':lambda x,y:(my-y,mx-x)}
    def ap(n,P):
        return {T[n](x,y) for x,y in P}
    mm={n:ap(n,S) for n in T}
    t=b['turn'];sol=i['solution']
    # other readings for each label
    if t=='mirror': others=['fv']
    elif t=='quarter-mirror': others=['tr','atr']  # defined as (y,mx-x)
    elif t=='quarter': others=['ccw']
    else: others=[]
    # note: transposed-based sizes may differ; compare raw sets
    exact={'quarter':'cw','half':'r180','mirror':'fh'}
    for oid,c in opts.items():
        if oid==sol: continue
        for n in others:
            if c==mm[n]: res[t+':option equals alt reading '+n].append(i['id'])
    # quarter-mirror: sol formula (y,mx-x); check which named transform equals it
    if t=='quarter-mirror':
        solc=opts[sol]
        names=[n for n in T if mm[n]==solc]
        res['qm:sol equals named transform(s) '+','.join(names)].append(i['id'])
for k,v in sorted(res.items()): print(k,len(v),v[:6])
