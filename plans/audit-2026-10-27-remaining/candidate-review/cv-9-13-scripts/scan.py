import sys,json,re,collections,unicodedata
sys.path.insert(0,'.')
from load import load
it=load()
F=collections.defaultdict(list)  # code -> [(id,msg)]
def flag(code,i,msg=''): F[code].append((i['id'],str(msg)[:200]))
def texts(i):
    t=[i['title'],i['invitation'],i['tutorial'],i['explanation']]+i['hints']
    b=i['boardData']
    def walk(o):
        if isinstance(o,str): t.append(o)
        elif isinstance(o,list): [walk(x) for x in o]
        elif isinstance(o,dict): [walk(v) for v in o.values()]
    walk(b); return t
VI=re.compile(r"^[0-9A-Za-zÀ-ỹĐđ\s.,;:!?'\"“”‘’()\-–—→·…/%+×÷=<>*_\[\]&$#@^|~`°²³]*$")
for i in it:
    for t in texts(i):
        # non-vietnamese script
        for ch in t:
            n=unicodedata.name(ch,'')
            if any(s in n for s in('CJK','CYRILLIC','HANGUL','HIRAGANA','KATAKANA','ARABIC','THAI','DEVANAGARI')): flag('T1-foreign-script',i,t)
        if '�' in t or '  ' in t: flag('T2-bad-char-or-double-space',i,t)
        if re.search(r'\b(\w+)\s+\1\b',t,re.I) and not re.search(r'\d',t): flag('T3-repeated-word',i,t)
        if t!=t.strip() or re.search(r'\s[,.!?;:]',t): flag('T4-spacing-punct',i,t)
        if not unicodedata.is_normalized('NFC',t): flag('T5-not-NFC',i,t)
        if re.search(r'(undefined|null|NaN|\{|\}|\[object)',t): flag('T6-template-leak',i,t)
    # age-appropriateness lexicon
    allt=' '.join(texts(i)).lower()
    for w in ['giết','chết','máu','súng','dao','đánh nhau','ma ','quỷ','sợ hãi','bạo lực','rượu','bia','thuốc lá','mua','bán','giá tiền','khuyến mãi','quảng cáo','tiền','vay','lãi','cá cược','con trai','con gái','đàn ông','phụ nữ','miền bắc','miền nam','người nghèo','béo','xấu','ngu','dốt','nước có ga','bánh ngọt','kẹo']:
        if re.search(r'(?<![\wÀ-ỹ])'+re.escape(w.strip())+r'(?![\wÀ-ỹ])',allt): flag('A1-lexicon:'+w.strip(),i,allt[:150])
    ln=sum(len(t) for t in [i['invitation'],i['tutorial'],i['explanation']])
    i['_len']=ln
# structure
for i in it:
    b=i['boardData'];k=b['kind'];sol=i['solution']
    if i['status']!='design_only': flag('S0-status',i,i['status'])
    if i['targetSeconds'] is None: flag('S0-ts',i)
    if len(i['hints'])<2: flag('S1-hints<2',i)
    if not i['explanation'].strip(): flag('S2-empty-explanation',i)
    if i['explanation']==i['tutorial']: flag('S3-expl==tutorial',i,i['explanation'][:120])
    # hint leak: solution text in hints/tutorial/invitation
    if isinstance(sol,str) and not re.fullmatch(r'(candidate|item|scene|fact|turn|shape|step|fix)-.*',sol) and len(sol)>1:
        for fld in [i['invitation'],i['tutorial']]+i['hints']:
            if re.search(r'(?<![\wÀ-ỹ])'+re.escape(sol)+r'(?![\wÀ-ỹ])',fld) and k not in('rule-sequence',):
                flag('L1-solution-leak-in-text',i,sol+' | '+fld[:100]);break
import pickle
pickle.dump(F,open('/tmp/claude-1000/-home-opc-orca-workspaces-goodhabittracking-audit-remaining/8099551c-a659-46c2-a5a4-8a5e761c8219/scratchpad/F1.pkl','wb'))
for c,v in sorted(F.items()): print(c,len(v),v[:2])
lens=collections.defaultdict(list)
for i in it: lens[i['ageTrack']].append(i['_len'])
for t,v in lens.items(): print(t,min(v),sum(v)/len(v),max(v))
