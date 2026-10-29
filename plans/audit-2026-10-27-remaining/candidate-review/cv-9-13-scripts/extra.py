import sys,json,re,collections,itertools
from collections import deque
sys.path.insert(0,'.')
from load import load
it=load()
out=collections.defaultdict(list)
def bfs(W,w,h,a,b):
    q=deque([(a,0)]);seen={a}
    while q:
        c,d=q.popleft()
        if c==b: return d
        for dx,dy in((1,0),(-1,0),(0,1),(0,-1)):
            n=(c[0]+dx,c[1]+dy)
            if 0<=n[0]<w and 0<=n[1]<h and n not in W and n not in seen: seen.add(n);q.append((n,d+1))
    return None
for i in it:
    b=i['boardData'];k=b['kind']
    if k=='path-planning':
        W={(p['x'],p['y']) for p in b['walls']};w,h=b['width'],b['height'];st=(b['start']['x'],b['start']['y']);g=(b['goal']['x'],b['goal']['y'])
        path=[(p['x'],p['y']) for p in i['solution']]
        pts=[st]+[(x['x'],x['y']) for x in b['waypoints']]+[g]
        if b['waypoints']:
            # ordered?
            idx=[path.index(p) for p in pts[1:-1]]
            if b.get('waypointOrder')=='ordered' and idx!=sorted(idx): out['path-waypoint-order-wrong'].append(i['id'])
            # shortest through ordered waypoints
            tot=0
            for a,c in zip(pts,pts[1:]):
                d=bfs(W,w,h,a,c); tot=None if d is None or tot is None else tot+d
            if tot is None: out['path-unreachable'].append(i['id'])
            if tot is not None and len(path)-1!=tot: out['path-solution-not-shortest(waypoints)'].append((i['id'],len(path)-1,tot))
        d=bfs(W,w,h,st,g)
        if d is None: out['path-unreachable'].append(i['id'])
        if b.get('shortestPathOnly'):
            if len(path)-1!=d: out['path-solution-not-shortest'].append((i['id'],len(path)-1,d))
            n=re.findall(r'\d+',i['explanation'])
            if n and int(n[0])!=d: out['path-expl-steps-mismatch'].append((i['id'],n,d))
        else:
            out['path-plain-or-waypoint-items'].append(i['id'])
        if st==(0,0) and g==(w-1,h-1): out['path-start-goal-always-corners'].append(1)
    if k=='flexibility-alternative':
        if (b['start']['x'],b['start']['y'])==(0,0) and (b['goal']['x'],b['goal']['y'])==(b['width']-1,b['height']-1): out['alt-corners'].append(1)
        kp=[(p['x'],p['y']) for p in b['knownPath']]
        if len(kp)-1!=(b['width']-1)*2: out['alt-known-not-monotone'].append(i['id'])
    if k=='flexibility-perspective':
        d=abs(b['target']['x']-b['viewer']['x'])+abs(b['target']['y']-b['viewer']['y'])
        out['persp-dist'].append(d)
    if k=='planning-command-order':
        txt={c['id']:c['text'] for c in b['commands']}
        chain=' → '.join(txt[x] for x in i['solution'])
        rules='; '.join(f'{txt[a]} → {txt[c]}' for a,c in b['before'])
        # does tutorial list rules in solution order (adjacent chain)?
        adj=[(a,c) for a,c in b['before'] if i['solution'].index(c)-i['solution'].index(a)==1]
        order=[i['solution'].index(a) for a,c in adj]
        if len(adj)==len(i['solution'])-1 and order==sorted(order) and rules.split('; ')[0].startswith(txt[i['solution'][0]]):
            out['order-tutorial-lists-chain-in-solution-order'].append(i['id'])
        if i['tutorial'] in i['explanation']: out['order-tutorial-contained-in-explanation'].append(i['id'])
        # transitive redundancy rule count
        if len(b['before'])>len(i['solution'])-1: out['order-has-redundant-rule'].append(i['id'])
        # unique linear extension?
        cnt=0
        for perm in itertools.permutations([c['id'] for c in b['commands']]):
            p={x:n for n,x in enumerate(perm)}
            if all(p[a]<p[c] for a,c in b['before']): cnt+=1
        out['order-linext'].append(cnt)
    if k=='quantity-grouping':
        out['group-tut-vs-mode'].append((b['mode'],i['tutorial'][:40]))
        out['group-groupSize'].append(b['groupSize'])
    if k=='memory-sequence':
        out['memseq-tut-vs-mode'].append((b.get('mode'),i['tutorial'][:45]))
    if k=='observation-implausible':
        out['impl-tut'].append(i['tutorial'][:60])
    if k=='quantity-target':
        out['target-variant-vs-mode'].append((i['ruleVariantId'].split(':')[1],b['mode']))
    # variant vs mode contingency
    mode=b.get('mode') or b.get('ruleKind') or b.get('transform') or b.get('turn') or b.get('change') or b.get('axis')
    out['variant-mode'].append((i['gameTypeId'],i['ruleVariantId'].split(':')[1],str(mode),i['ageTrack']))
for k,v in out.items():
    if k in('variant-mode','group-tut-vs-mode','memseq-tut-vs-mode','impl-tut','target-variant-vs-mode','persp-dist','order-linext','group-groupSize'): continue
    print(k,len(v),v[:3])
print('persp dist',collections.Counter(out['persp-dist']))
print('order linext',collections.Counter(out['order-linext']))
print('group size',collections.Counter(out['group-groupSize']))
c=collections.Counter(out['group-tut-vs-mode']);
for kk,vv in sorted(c.items()): print(' grp',kk,vv)
c=collections.Counter(out['memseq-tut-vs-mode'])
for kk,vv in sorted(c.items(),key=str): print(' memseq',kk,vv)
c=collections.Counter(out['impl-tut']);print(c.most_common(6))
# variant label vs mode: how many distinct modes per variant label (9-12 only)
vm=collections.defaultdict(collections.Counter)
for g,v,m,t in out['variant-mode']:
    if t=='age_9_12': vm[(g,v)][m]+=1
mixed=sum(1 for k,c in vm.items() if len(c)>1);print('variants',len(vm),'mapping to >1 mode/rule-kind',mixed)
for k in [('g05-t2',),]: pass
for (g,v),c in sorted(vm.items()):
    if g in('g05-t2','g05-t3','g03-t1','g04-t2'): print(g,v,dict(c))
