import sys,json,re,collections,itertools,pickle
sys.path.insert(0,'.')
from load import load
it=load()
F=collections.defaultdict(list)
def flag(code,i,msg=''): F[code].append((i['id'],str(msg)[:240]))
P=lambda p:(p['x'],p['y'])
def nums(s): return [int(x) for x in re.findall(r'\d+',s)]
def chk(i):
    b=i['boardData'];k=b['kind'];sol=i['solution'];ex=i['explanation']
    opts=b.get('options')
    if opts is not None:
        keyf=(lambda o:json.dumps(o,sort_keys=True))
        ks=[keyf(o) for o in opts]
        if len(set(ks))!=len(ks): flag('P-dup-options',i,k)
    # ---- rule-sequence
    if k=='rule-sequence':
        s=b['sequence'];rk=b['ruleKind']
        if rk=='alternating' and 'đan xen' in ex:
            n=[int(x) for x in s]; d1=n[2]-n[0]; d2=n[3]-n[1]
            ok=all(n[j]-n[j-2]==(d1 if j%2==0 else d2) for j in range(2,len(n))); nxt=str(n[-2]+(d1 if len(n)%2==0 else d2))
            flag('Q-interleaved-two-step-alternating',i,(s,ex[:60]))
        elif rk=='alternating':
            ok=all(s[j]==s[j-2] for j in range(2,len(s))) and s[0]!=s[1]; nxt=s[-2]
        elif rk=='increment':
            d=int(s[1])-int(s[0]); ok=all(int(s[j])-int(s[j-1])==d for j in range(1,len(s))); nxt=str(int(s[-1])+d)
            if str(d) not in ex.replace('tăng thêm','') : flag('E-rule-seq-step-expl',i,ex)
        else:
            p=b['period']; ok=all(s[j]==s[j-p] for j in range(p,len(s))); nxt=s[len(s)-p]
            if len(s)<2*p: flag('Q-repeat-seq-too-short',i,f'len {len(s)} period {p}')
            if len(set(s[:p]))!=p: flag('Q-period-has-dup',i,s)
        if not ok: flag('P-seq-inconsistent',i,s)
        if nxt!=sol: flag('P-seq-sol-wrong',i,(s,sol,nxt))
        if sol not in opts: flag('P-sol-not-in-options',i)
        if sorted(set(opts)-{sol})!=sorted(set(opts)-{sol}) : pass
        if rk=='alternating' and len(s)<5: flag('Q-short-alternating',i,s)
        if sol not in ex: flag('E-expl-mismatch',i,ex)
    if k=='rule-error':
        s=b['sequence'];rk=b['ruleKind']
        def valid(t):
            if rk=='alternating': return all(t[j]==t[j-2] for j in range(2,len(t))) and t[0]!=t[1]
            if rk=='increment':
                d=int(t[1])-int(t[0]); return all(int(t[j])-int(t[j-1])==d for j in range(1,len(t)))
            p=b['period']; return all(t[j]==t[j-p] for j in range(p,len(t)))
        pool=set(s)|({str(x) for x in range(-5,200)} if rk=='increment' else set())
        reps=[]
        for j in range(len(s)):
            for v in pool:
                if v==s[j]: continue
                t=list(s);t[j]=v
                if valid(t): reps.append(j);break
        if valid(s): flag('P-error-seq-has-no-error',i,s)
        if reps!=[sol]: flag('P-error-ambiguous',i,(s,rk,b.get('period'),'sol',sol,'repairable',reps))
        if f'thứ {sol+1} ' not in ex or s[sol] not in ex: flag('E-expl-mismatch',i,ex)
    if k=='rule-transform':
        fn={'add':lambda x:x+1,'subtract':lambda x:x-1,'double':lambda x:x*2,'reverse':lambda x:int(str(x)[::-1])}[b['transform']]
        for e in b['examples']:
            if fn(int(e['input']))!=int(e['output']): flag('P-transform-example-wrong',i,e)
        if str(fn(int(b['query'])))!=sol: flag('P-transform-sol-wrong',i)
        # other transforms consistent with examples?
        alt=[n for n,f in {'add':lambda x:x+1,'subtract':lambda x:x-1,'double':lambda x:x*2,'reverse':lambda x:int(str(x)[::-1])}.items() if all(f(int(e['input']))==int(e['output']) for e in b['examples'])]
        if len(alt)>1: flag('P-transform-ambiguous-rule',i,alt)
        if b['transform']=='reverse':
            if b['query']==b['query'][::-1]: flag('Q-reverse-palindrome-query',i,b['query'])
            if sum(e['input']==e['output'] for e in b['examples'])>0: flag('Q-reverse-example-palindrome',i,[e for e in b['examples']])
            if b['query'].endswith('0'): flag('Q-reverse-trailing-zero',i,b['query'])
        if b['query'] in [e['input'] for e in b['examples']]: flag('L-query-is-example',i)
    # ---- memory
    if k=='memory-sequence':
        if b.get('mode')=='missing':
            if sol!=[b['sequence'][b['missingIndex']]]: flag('P-memseq-sol',i)
            if f"thứ {b['missingIndex']+1} " not in ex or b['sequence'][b['missingIndex']] not in ex: flag('E-expl-mismatch',i,ex)
        elif sol!=b['sequence']: flag('P-memseq-sol',i)
        if not set(b['sequence'])<=set(b['options']): flag('P-memseq-options-missing',i)
        if len(set(b['sequence']))!=len(b['sequence']): flag('P-memseq-dup-elements',i)
        if b['displayMs']<=0: flag('Q-displayMs',i)
    if k=='memory-change':
        bf,af,ch=b['before'],b['after'],b['change']
        if ch=='added': c=set(af)-set(bf)
        elif ch=='removed': c=set(bf)-set(af)
        elif ch=='swapped':
            c=None
        else: c=None
        if ch in('added','removed'):
            if len(c)!=1 or sol not in c: flag('P-memchange-sol',i,(bf,af,ch,sol))
        elif ch=='swapped':
            d=[j for j in range(len(bf)) if bf[j]!=af[j]]
            if len(d)!=2: flag('P-memchange-swap-diff',i,(bf,af))
        else:
            if len(bf)!=len(af): flag('P-memchange-prop-len',i)
            d=[j for j in range(len(bf)) if bf[j]!=af[j]]
            if len(d)!=1: flag('P-memchange-prop',i,(bf,af,sol,opts))
        if sol not in opts: flag('P-sol-not-in-options',i,(ch,sol,opts))
        if len(set(bf))!=len(bf): flag('Q-memchange-before-dups',i,bf)
    if k=='memory-position':
        T={P(p) for p in b['targets']};S={P(p) for p in sol}
        if b['mode']=='missing':
            T=T-{P(p) for p in b['revealed']}
            if len(T)!=1: flag('P-mempos-missing-count',i)
        if T!=S: flag('P-mempos-sol',i)
        if not T<={P(p) for p in b['options']}: flag('P-mempos-options-missing',i)
        words=set()
        for m in re.finditer(r'hàng (\d+), cột (\d+)',ex): words.add((int(m.group(2))-1,int(m.group(1))-1))
        if words!=T: flag('E-expl-mismatch',i,ex)
    # ---- observation
    if k=='observation-difference':
        L,R=b['left'],b['right']
        d={(x,y) for y in range(len(L)) for x in range(len(L[0])) if L[y][x]!=R[y][x]}
        if d!={P(p) for p in sol}: flag('P-diff-sol',i,(d,sol))
        e=set((int(m.group(2))-1,int(m.group(1))-1) for m in re.finditer(r'hàng (\d+), cột (\d+)',ex))
        if e!=d: flag('E-expl-mismatch',i,ex)
        if not d<={P(p) for p in b['options']}: flag('P-diff-options-missing',i)
    if k=='observation-implausible':
        sc=b['scene'];r=b['rule']
        bad=[s['id'] for s in sc if s['traits'][r['trait']]!=r['value']]
        if bad!=[sol]: flag('P-implausible-unique',i,bad)
        pos=[s['id'] for s in sc].index(sol)+1
        if f'Tình huống {pos}:' not in ex: flag('E-expl-mismatch',i,ex)
        if b['options']!=[] and sol not in b['options']: flag('P-sol-not-in-options',i)
        # group trait nonsense check
    if k in('observation-two-traits','flexibility-classify'):
        crit=b['criteria'] if k=='observation-two-traits' else [b['rule']]
        m=[x['id'] for x in b['items'] if all(x['traits'][c['trait']]==c['value'] for c in crit)]
        if sorted(m)!=sorted(sol): flag('P-filter-sol',i,(m,sol))
        ids=[x['id'] for x in b['items']]
        if ids!=[f'item-{n+1}' for n in range(len(ids))]: flag('E-item-id-order',i,ids)
        pos=sorted(ids.index(s)+1 for s in sol)
        if sorted(nums(re.sub(r'\([^)]*\)','',ex)))!=pos: flag('E-expl-mismatch',i,(ex,pos))
        if len(m)==0: flag('Q-empty-answer',i)
        if len(m)==len(ids): flag('Q-all-answer',i)
    # ---- reasoning
    if k=='reasoning-elimination':
        def ok(c): return all((c['traits'][cl['trait']]!=cl['value']) if cl['negate'] else (c['traits'][cl['trait']]==cl['value']) for cl in b['clues'])
        m=[c['id'] for c in b['candidates'] if ok(c)]
        if m!=[sol]: flag('P-elim-not-unique',i,(m,sol))
        pos_opt=b['options'].index(sol)+1; pos_c=[c['id'] for c in b['candidates']].index(sol)+1
        n=nums(re.search(r'Bạn số \d+',ex).group(0))[0]
        if n!=pos_opt: flag('E-elim-number-vs-options-pos',i,(n,pos_opt,pos_c))
        if n!=pos_c: flag('E-elim-number-vs-candidates-pos',i,(n,pos_opt,pos_c))
        # redundant clues
        if len(b['clues'])>1:
            red=[cl for cl in b['clues'] if [c['id'] for c in b['candidates'] if all((c['traits'][x['trait']]==x['value']) != x['negate'] for x in b['clues'] if x is not cl)]==[sol]]
            if red: flag('Q-elim-redundant-clue',i,red)
        if len(b['clues'])==1 and not b['clues'][0]['negate']: flag('Q-elim-single-clue',i)
    if k=='reasoning-missing-info':
        kn=b['known']
        cand=[c for c in b['candidates'] if all(c['traits'][x['trait']]==x['value'] for x in kn)]
        if b['targetId'] not in [c['id'] for c in cand]: flag('P-missing-target-not-in-known',i)
        good=[]
        for o in opts:
            r=[c['id'] for c in cand if c['traits'].get(o['trait'])==o['value']]
            if r==[b['targetId']]: good.append(o['id'])
        if good!=[sol]: flag('P-missing-multiple-valid-or-none',i,(good,sol,[ (o['trait'],o['value']) for o in opts],[(c['id'],c['traits']) for c in cand]))
        if len(cand)<2: flag('Q-missing-already-determined',i)
    if k=='reasoning-if-then':
        reach=set(b['facts'])
        ch=True
        while ch:
            ch=False
            for r in b['rules']:
                if r['if'] in reach and r['then'] not in reach: reach.add(r['then']);ch=True
        good=[o for o in opts if o in reach]
        if good!=[sol]: flag('P-ifthen',i,(good,sol))
        if len(b['rules'])<2: flag('Q-ifthen-short',i)
    # ---- quantity
    if k=='quantity-balance':
        L=sum(x['weight'] for x in b['left']);R=sum(x['weight'] for x in b['right']);m=b['mode']
        if m=='missing' or m=='unknown':
            exp=abs(R-L) 
            if b.get('unknownSide')=='left' and not(R>L): flag('P-balance-neg',i,(L,R))
            if exp!=sol: flag('P-balance-sol',i,(L,R,m,sol))
        elif m=='replace':
            rid=b['replaceId'];w=[x['weight'] for x in b['left']+b['right'] if x['id']==rid][0]
            if rid.startswith('left'): exp=R-(L-w)
            else: exp=L-(R-w)
            if exp!=sol: flag('P-balance-sol',i,(L,R,m,sol,exp))
        elif m=='compare':
            flag('Q-balance-compare-seen',i,(L,R,sol,opts)) if False else None
        if m!='compare' and sol not in opts: flag('P-sol-not-in-options',i)
        if m=='compare': 
            if sol not in opts : flag('P-sol-not-in-options',i,(sol,opts))
    if k=='quantity-grouping':
        t,g,m=b['total'],b['groupSize'],b['mode']
        exp={'exact':t//g,'floor':t//g,'needed':(g-t%g)%g,'remainder':t%g}[m]
        if exp!=sol: flag('P-group-sol',i,(t,g,m,sol))
        if m=='exact' and t%g: flag('P-group-exact-not-divisible',i,(t,g))
        if sol not in opts: flag('P-sol-not-in-options',i)
    if k=='quantity-target':
        v={x['id']:x['value'] for x in b['items']};T=b['target'];m=b['mode'];mx=b['maxItems']
        sums=[]
        for r in range(1,len(v)+1):
            for c in itertools.combinations(v,r):
                s=sum(v[x] for x in c)
                if m=='not-over':
                    pass
                sums.append((c,s))
        S=sum(v[x] for x in sol)
        if m=='exact-two':
            ok=len(sol)==2 and S==T
            allv=[c for c,s in sums if len(c)==2 and s==T]
        elif m=='fewest':
            allv=[c for c,s in sums if s==T and len(c)<=mx]; mn=min(len(c) for c in allv) if allv else None
            allv=[c for c in allv if len(c)==mn]; ok=S==T and len(sol)==mn
        elif m=='any':
            allv=[c for c,s in sums if s==T and len(c)<=mx]; ok=S==T and len(sol)<=mx
        else:
            allv=[c for c,s in sums if s<=T and len(c)<=mx]
            best=max(s for c,s in sums if s<=T and len(c)<=mx)
            allv=[c for c,s in sums if s==best and len(c)<=mx]; ok=S==best and len(sol)<=mx
        if not ok or not allv: flag('P-target-sol',i,(m,T,sol,S))
        if m!='any' and len(allv)>1: flag('Q-target-multiple-answers:'+m,i,(len(allv),'sol',sol))
        if len(set(v.values()))!=len(v): flag('Q-target-dup-values',i,v)
    # ---- planning
    if k=='planning-command-order':
        ids=[c['id'] for c in b['commands']];before=b['before']
        pos={x:n for n,x in enumerate(sol)}
        if sorted(sol)!=sorted(ids): flag('P-order-sol-set',i)
        if not all(pos[a]<pos[c] for a,c in before): flag('P-order-sol-violates',i)
        # count linear extensions
        cnt=0
        for perm in itertools.permutations(ids):
            p={x:n for n,x in enumerate(perm)}
            if all(p[a]<p[c] for a,c in before): cnt+=1
        if cnt>1: flag('Q-order-multiple-valid:%d'%cnt,i)
        txt={c['id']:c['text'] for c in b['commands']}
        chain=' → '.join(txt[x] for x in sol)
        if chain not in ex: flag('E-expl-mismatch',i,ex)
        for a,c in before:
            if f'{txt[a]} → {txt[c]}' not in i['tutorial']: flag('E-tutorial-rules-missing',i,i['tutorial']);break
    if k=='planning-fix-step':
        W={P(p) for p in b['walls']};cmd=b['commands'];g=P(b['goal']);st=P(b['start'])
        d={'right':(1,0),'left':(-1,0),'up':(0,-1),'down':(0,1)}
        def run(c):
            x,y=st
            for m in c:
                x+=d[m][0];y+=d[m][1]
                if not(0<=x<b['width'] and 0<=y<b['height']) or (x,y) in W: return False
            return (x,y)==g
        if run(cmd): flag('P-fix-already-ok',i)
        good=[]
        for o in opts:
            c=list(cmd);c[o['index']]=o['command']
            if run(c): good.append(o['id'])
        if good!=[sol]: flag('P-fix-not-unique',i,(good,sol))
        # any single-step fix possible beyond options?
        n=0
        for j in range(len(cmd)):
            for m in d:
                if m==cmd[j]: continue
                c=list(cmd);c[j]=m
                if run(c): n+=1
        if n>1: flag('Q-fix-multiple-single-edits',i,n)
        o=[o for o in opts if o['id']==sol][0]
        if f"bước {o['index']+1} " not in ex: flag('E-expl-mismatch',i,ex)
        vn={'right':'bên phải','left':'bên trái','up':'lên','down':'xuống'}
        if f'"{vn[o["command"]]}"' not in ex: flag('E-expl-mismatch',i,ex)
    if k in('path-planning','flexibility-alternative'):
        W={P(p) for p in b['walls']};path=[P(p) for p in sol];st=P(b['start']);g=P(b['goal'])
        okp= path[0]==st and path[-1]==g and all(abs(a[0]-c[0])+abs(a[1]-c[1])==1 for a,c in zip(path,path[1:])) and not any(p in W for p in path) and all(0<=x<b['width'] and 0<=y<b['height'] for x,y in path) and len(set(path))==len(path)
        if not okp: flag('P-path-sol-invalid',i)
        if k=='path-planning':
            for w in b['waypoints']:
                if (w['x'],w['y']) not in path: flag('P-path-waypoint-missed',i)
                if (w['x'],w['y']) in W: flag('P-waypoint-on-wall',i)
            if st in W or g in W: flag('P-start-goal-wall',i)
            # BFS shortest dist w/o walls vs with
        else:
            kp=[P(p) for p in b['knownPath']]
            if kp==path: flag('P-alt-same-as-known',i)
            if any(p in W for p in kp): flag('P-alt-known-hits-wall',i)
            if not(kp[0]==st and kp[-1]==g and all(abs(a[0]-c[0])+abs(a[1]-c[1])==1 for a,c in zip(kp,kp[1:]))): flag('P-alt-known-invalid',i)
            # alternatives count
            from collections import deque
            def count_alt():
                # simple paths up to len limit differing from known; count up to 2
                cnt=0
                st_=[(st,[st])]
                lim=len(kp)+4
                while st_ and cnt<2:
                    cur,pth=st_.pop()
                    if cur==g:
                        if pth!=kp: cnt+=1
                        continue
                    if len(pth)>lim: continue
                    for dx,dy in((1,0),(-1,0),(0,1),(0,-1)):
                        n=(cur[0]+dx,cur[1]+dy)
                        if 0<=n[0]<b['width'] and 0<=n[1]<b['height'] and n not in W and n not in pth: st_.append((n,pth+[n]))
                return cnt
            if count_alt()==0: flag('P-alt-none',i)
    if k=='flexibility-perspective':
        v=b['viewer'];t=b['target'];dx=t['x']-v['x'];dy=t['y']-v['y']
        f={'north':(0,-1),'south':(0,1),'east':(1,0),'west':(-1,0)}[v['facing']]
        # right vector: rotate facing clockwise (y down)
        r=(-f[1],f[0]); 
        fwd=dx*f[0]+dy*f[1]; rt=dx*r[0]+dy*r[1]
        if abs(fwd)==0 and abs(rt)>0: ans='right' if rt>0 else 'left'
        elif abs(rt)==0 and abs(fwd)>0: ans='ahead' if fwd>0 else 'behind'
        else: ans=None
        if ans!=sol: flag('P-perspective-sol',i,(v,t,sol,ans,'fwd',fwd,'rt',rt))
        vn={'north':'lên trên','south':'xuống dưới','east':'sang phải','west':'sang trái'}
    # ---- spatial
    if k=='spatial-silhouette':
        T={P(p) for p in b['target']}
        m=[o['id'] for o in opts if {P(p) for p in o['cells']}==T]
        if m!=[sol]: flag('P-silh-sol',i,(m,sol))
        # translation-equivalent matches
        def norm(S):
            mx=min(x for x,y in S);my=min(y for x,y in S); return frozenset((x-mx,y-my) for x,y in S)
        m2=[o['id'] for o in opts if norm({P(p) for p in o['cells']})==norm(T)]
        if len(m2)>1: flag('P-silh-translation-equivalent-options',i,m2)
        pos=[o['id'] for o in opts].index(sol)
        letter=chr(65+pos)
        mm=re.search(r'Hình ([A-Z])',ex)
        if mm.group(1)!=letter: flag('E-letter-vs-position',i,(mm.group(1),letter,sol))
    if k=='spatial-rotation':
        S={P(p) for p in b['shape']}
        mx=max(x for x,y in S);my=max(y for x,y in S)
        def norm(S):
            a=min(x for x,y in S);c=min(y for x,y in S); return frozenset((x-a,y-c) for x,y in S)
        T0=None
        T={'cw':lambda x,y:(-y,x),'ccw':lambda x,y:(y,-x),'r180':lambda x,y:(-x,-y),'fh':lambda x,y:(-x,y),'fv':lambda x,y:(x,-y),'tr':lambda x,y:(y,x),'atr':lambda x,y:(-y,-x)}
        allowed={'quarter':['cw','ccw'],'half':['r180'],'mirror':['fh','fv'],'quarter-mirror':['tr','atr']}[b['turn']]
        res={}
        for n in T:
            res[n]=norm({T[n](x,y) for x,y in S})
        match={}
        for o in opts:
            c=norm({P(p) for p in o['cells']})
            ms=[n for n in T if res[n]==c]
            exact=({P(p) for p in o['cells']}=={tuple(v) for v in [T[n](x,y) for x,y in S for n in ()]})
            match[o['id']]=ms
        mxx=max(x for x,y in S);myy=max(y for x,y in S)
        fn={'quarter':lambda x,y:(myy-y,x),'half':lambda x,y:(mxx-x,myy-y),'mirror':lambda x,y:(mxx-x,y),'quarter-mirror':lambda x,y:(y,mxx-x)}[b['turn']]
        exp={fn(x,y) for x,y in S}
        good=[o['id'] for o in opts if {P(p) for p in o['cells']}==exp]
        if good!=[sol]: flag('P-rot-sol',i,(b['turn'],good,sol))
        # distractor equals the OTHER reading of the same label (mirror axis)
        if b['turn']=='mirror':
            alt={(x,myy-y) for x,y in S}
            if alt!=exp and any({P(p) for p in o['cells']}==alt for o in opts): flag('Q-mirror-axis-ambiguous-distractor',i)
        elif len(set(match[sol])&set(allowed))>=1 and len(allowed)==2:
            # ambiguity if the non-sol option matches the *other* allowed transform
            pass
        # any other option matching ANY other rigid transform (distractor ok)
        # symmetric shape => transform indistinguishable
        if len(set(frozenset(v) for v in res.values()))<len(T): flag('Q-rot-symmetric-shape-weak',i,b['turn'])
        if norm(S)==res.get('r180') and b['turn']=='half': flag('Q-rot-half-invariant',i)
        mm=re.search(r'Hình ([A-Z])',ex)
        pos=[o['id'] for o in opts].index(sol); 
        if mm and mm.group(1)!=chr(65+pos): flag('E-letter-vs-position',i,(mm.group(1),chr(65+pos),sol))
    if k=='spatial-symmetry':
        g=b['grid'];h=len(g);w=len(g[0]);ax=b['axis']
        def mir(x,y): return (w-1-x,y) if ax=='vertical' else (x,h-1-y)
        asym=[]
        for y in range(h):
            for x in range(w):
                mx_,my_=mir(x,y)
                if g[y][x]!=g[my_][mx_]: asym.append((x,y))
        sp=P(sol)
        if b['mode']=='fill':
            nulls=[(x,y) for y in range(h) for x in range(w) if g[y][x] is None]
            if nulls!=[sp]: flag('P-sym-fill-null',i,(nulls,sol))
            else:
                mx_,my_=mir(*sp)
                if g[my_][mx_] is None: flag('P-sym-fill-mirror-null',i)
            if len(asym)!=2 and len(asym)!=1 and True:
                # null counts as mismatch with its mirror, expect exactly [sol, mirror]
                flag('P-sym-fill-asym-count',i,asym)
        else:
            if sp not in asym: flag('P-sym-break-sol-symmetric',i,(asym,sol))
            if len(asym)!=2: flag('P-sym-break-asym-count',i,asym)
            else:
                # both cells of the pair are asymmetric; options should include only one
                inopts=[P(o) for o in opts if P(o) in asym]
                if len(inopts)!=1: flag('P-sym-break-ambiguous-pair',i,(asym,inopts,sol))
        er=re.search(r'hàng (\d+), cột (\d+)',ex)
        if er and (int(er.group(2))-1,int(er.group(1))-1)!=sp: flag('E-expl-mismatch',i,ex)
        if sol not in opts: flag('P-sol-not-in-options',i)
for i in it:
    try: chk(i)
    except Exception as e: flag('X-checker-exception',i,repr(e)+i['boardData']['kind'])
pickle.dump(F,open('/tmp/claude-1000/-home-opc-orca-workspaces-goodhabittracking-audit-remaining/8099551c-a659-46c2-a5a4-8a5e761c8219/scratchpad/F2.pkl','wb'))
for c,v in sorted(F.items()):
    tr=collections.Counter('912' if x[0].endswith('912') else '13p' for x in v)
    print(c,len(v),dict(tr),v[:1])
