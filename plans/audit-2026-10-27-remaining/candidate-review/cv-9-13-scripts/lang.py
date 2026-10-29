import sys,re,collections,json
sys.path.insert(0,'.')
from load import load
it=load()
cnt=collections.Counter();where=collections.defaultdict(set)
uniq_text=set()
for i in it:
    for t in [i['title'],i['invitation'],i['tutorial'],i['explanation']]+i['hints']:
        uniq_text.add(t)
for t in uniq_text:
    for w in re.findall(r"[A-Za-zÀ-ỹĐđ]+",t.lower()):
        cnt[w]+=1;where[w].add(t[:80])
rare=[(w,c) for w,c in cnt.items() if c<=2]
print('unique text strings',len(uniq_text),'vocab',len(cnt),'rare(<=2)',len(rare))
print(sorted(w for w,c in rare))
# stiff phrases
for p in ['cân cân','đối tượng','thỏa mãn','phần tử','ván này','thẻ ký hiệu','hướng "bên','bên phải','chắc chắn đúng, không thể sai','nhà lập trình nhí','chuyên gia','nha!','nhỉ','nào bạn','bạn nhỏ','trà sữa','kem phô mai','nước có ga','chạy']:
    n=sum(1 for i in it if p in ' '.join([i['title'],i['invitation'],i['tutorial'],i['explanation']]+i['hints']+[json.dumps(i['boardData'],ensure_ascii=False)]))
    n13=sum(1 for i in it if i['ageTrack']=='age_13_plus' and p in ' '.join([i['invitation'],i['tutorial'],i['explanation']]))
    print(repr(p),n,'13+ text:',n13)
