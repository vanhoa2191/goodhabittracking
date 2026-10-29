import sys,json,re,collections
sys.path.insert(0,'.')
from load import load
it=load()
def canon(b):
    b=json.loads(json.dumps(b))
    b.pop('options',None)
    s=json.dumps(b,sort_keys=True,ensure_ascii=False)
    m={}
    def rep(mt):
        w=mt.group(0)
        if w in('kind','mode','ruleKind','transform','turn','axis','change','negate','trait','if','then','true','false','null'): return w
        return m.setdefault(w,'A%d'%len(m))
    # symbols = emoji-words (lá, hoa, ...) -> canonical by first appearance when inside sequence values
    return s
def canon2(i):
    b=i['boardData'];k=b['kind']
    if k in('rule-sequence','rule-error','memory-sequence'):
        seq=b['sequence'];m={}
        c=tuple(m.setdefault(x,len(m)) for x in seq)
        return (k,c,b.get('ruleKind'),b.get('mode'),b.get('period'),str(b.get('missingIndex')),str(b.get('swappedIndices')),i['solution'] if k=='rule-error' else None)
    if k=='rule-transform': return (k,b['transform'],tuple(int(e['output'])-int(e['input']) for e in b['examples']))
    return (k,json.dumps({a:v for a,v in b.items() if a!='options'},sort_keys=True,ensure_ascii=False))
for t in ['age_9_12','age_13_plus']:
    g=collections.defaultdict(list)
    for i in it:
        if i['ageTrack']==t: g[canon2(i)].append(i['id'])
    multi={k:v for k,v in g.items() if len(v)>1}
    print(t,'canonical groups',len(g),'dup groups',len(multi),'items in dup groups',sum(len(v) for v in multi.values()))
    byk=collections.Counter()
    for k,v in multi.items(): byk[k[0]]+=len(v)
    print(byk)
    top=sorted(multi.items(),key=lambda kv:-len(kv[1]))[:5]
    for k,v in top: print(len(v),k[0],str(k[1:])[:90],v[:5])
    # distinct sequences
    for kind in['rule-sequence','rule-error','memory-sequence','rule-transform','quantity-grouping','reasoning-if-then','planning-command-order']:
        n=sum(1 for i in it if i['ageTrack']==t and i['boardData']['kind']==kind)
        d=len({canon2(i) for i in it if i['ageTrack']==t and i['boardData']['kind']==kind})
        print('  ',kind,'items',n,'distinct canonical',d)
# command-order step sets & if-then rule sets reuse
for t in ['age_9_12']:
    c=collections.Counter(tuple(x['text'] for x in sorted(i['boardData']['commands'],key=lambda x:x['id'])) for i in it if i['ageTrack']==t and i['boardData']['kind']=='planning-command-order')
    print('distinct command-order chains',len(c),c.most_common(2))
    c=collections.Counter(json.dumps(i['boardData']['rules'],ensure_ascii=False) for i in it if i['ageTrack']==t and i['boardData']['kind']=='reasoning-if-then')
    print('distinct if-then rule sets',len(c),'of',sum(c.values()),c.most_common(2))
    c=collections.Counter(tuple(i['boardData']['scene'][0]['text'] for _ in[0]) for i in it if i['ageTrack']==t and i['boardData']['kind']=='observation-implausible')
    c=collections.Counter(s['text'] for i in it if i['ageTrack']==t and i['boardData']['kind']=='observation-implausible' for s in i['boardData']['scene'])
    print('implausible scene sentences distinct',len(c),'total',sum(c.values()))
    c=collections.Counter(i['boardData']['rule']['value'] for i in it if i['ageTrack']==t and i['boardData']['kind']=='observation-implausible');print(c)
