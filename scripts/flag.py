import json,re,glob,unicodedata
P="src/data/content.json"
d=json.load(open(P)); items=d["items"] if isinstance(d,dict) and "items" in d else d
def norm(s): return unicodedata.normalize("NFD",str(s)).encode("ascii","ignore").decode().lower()
stat={}
for f in glob.glob("/tmp/q/Q-*.json"):
    for r in json.load(open(f))["values"]:
        if r and len(r)>=8 and re.match(r"A\d+-Q|QC-Q",str(r[0])): stat[r[0]]=norm(r[7])
def txt(it):
    out=[]
    for k in ("question","answer","explanation","source","formula","result","hypotheses","steps","keyPoints","pitfalls","followUps"):
        if it.get(k): out.append(str(it[k]))
    for o in it.get("options") or []: out.append(str(o))
    return " ".join(out)
n0=sum(1 for i in items if i["unverified"])
for it in items:
    t=txt(it); nt=norm(t); r=[]
    if re.search(r"\bxx\b",nt): r.append("XX")
    if re.search(r"deduit|deduction",nt): r.append("déduit")
    if re.search(r"a verifier|a revoir|a recouper|a revérifier|a reverifier|a relire|todo|source a verifier|non source",nt) or "verifier" in stat.get(it["id"],"") or "relire" in stat.get(it["id"],""): r.append("à vérifier")
    if re.search(r"droits?\b.*\bxx|image.*droits|droits.*image|xx.*droits",nt): r.append("droits image")
    if it["kind"]=="calc": r.append("calcul pédagogique")
    it["reasons"]=sorted(set(r))
    if r: it["unverified"]=True
print(n0,"->",sum(1 for i in items if i["unverified"]))
json.dump(d,open(P,"w"),ensure_ascii=False,indent=1)
