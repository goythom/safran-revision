import json,re,unicodedata
P="src/data/content.json"; d=json.load(open(P)); items=d["items"]
idx={o["page"]:o for o in json.load(open("/tmp/slides_idx.json"))}
json.dump([idx[p] for p in sorted(idx)],open("src/data/slides.json","w"),ensure_ascii=False,indent=1)
LG={"Quatre forces":5,"Deux flux du turbofan":10,"Flux de puissance AGB":24,"Circuit d'huile à carter sec":26,"Épicycloïdal, organes":30,"Roue dentée":33,"Charges et appuis":35,"Train planétaire, rôles":36,"Roulement, vocabulaire":34,"Vidéo ADT (captures)":17}
KW=[("cfm56",12),("leap",14),("m88",15),("quatre forces",5),("carter sec",26),("circuit d'huile",26),("pw1000",28),("tp400",29),("epicycloidal",30),("planetaire",36),("inverseur",19),("turbofan",10),("adour",18),("portance",6),("roue dentee",33),("rouleaux",34),("precharge",35),("agb",24)]
def norm(s): return unicodedata.normalize("NFD",s).encode("ascii","ignore").decode().lower()
n=0
for it in items:
    pg=None; why=""
    if it["group"]=="Légendes schémas":
        m=re.search(r"Schéma « (.*?) »",it["question"])
        if m and m.group(1) in LG: pg=LG[m.group(1)]; why="légende"
    elif it["kind"] in("flashcard","open","qcm","vf","case"):
        q=norm(it["question"])
        for k,p in KW:
            if k in q: pg=p; why="lié"; break
    if pg and pg in idx:
        it["image"]={"src":idx[pg]["file"],"page":pg,"caption":idx[pg]["title"].title(),"source":f"Présentation v3, diapo {pg}","kind":why}; n+=1
    else: it.pop("image",None)
print("images attached:",n)
json.dump(d,open(P,"w"),ensure_ascii=False,indent=1)
