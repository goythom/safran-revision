import json,glob,os,re
Q="/tmp/q/"
def rows(n):
    v=json.load(open(Q+n+".json"))["values"]
    h=None
    for i,r in enumerate(v):
        if r and r[0]=="ID": h=i;break
    hd=v[h]; out=[]
    for r in v[h+1:]:
        if not r or not str(r[0]).strip(): continue
        r=list(r)+[""]*(len(hd)-len(r))
        out.append({k:str(x).strip() for k,x in zip(hd,r)})
    return out
def lvl(x):
    x=x.lower()
    if x in("1","débutant","debutant","à connaître","a connaitre"):return 1
    if x in("2","intermédiaire","intermediaire"):return 2
    if x in("3","avancé","avance"):return 3
    return 2
def unv(*t):
    s=" ".join(t)
    return bool(re.search(r"\bXX\b|DÉDUIT|DEDUIT|TODO|SOURCE A VERIFIER",s))
items=[]
tabs=["Q-A1 Safran","Q-A2 Vol avion","Q-A3 Moteurs","Q-A4 Anatomie moteur","Q-A5 Systèmes propulsifs","Q-A6 AGB","Q-A7 RGB-PGB","Q-A8 Engrenages","Q-A9 Roulements","Q-A10 Architectures gearbox","Q-A11 Pré-dimensionnement","Q-A12 Vocabulaire","Q-A13 Entretien","Q-QC Transversales","Q-Rapport final"]
groups=[]
for t in tabs:
    g=t[2:] if t.startswith("Q-A") else t[2:]
    if g not in groups: groups.append(g)
    for r in rows(t):
        a=r.get("Réponse attendue","")
        if not r.get("Question") or not a: continue
        items.append(dict(id=r["ID"],kind="open",group=g,theme=r.get("Thème",""),level=lvl(r.get("Niveau","")),question=r["Question"],answer=a,source=r.get("Source",""),qtype=r.get("Type",""),unverified=unv(a,r["Question"]) or r.get("Statut","").lower().startswith("à relire")))
for r in rows("QCM"):
    g="Chapitre "+r["Chapitre"]
    opts=[r["A"],r["B"],r["C"],r["D"]]
    c="ABCD".find(r["Bonne reponse"].strip().upper()[:1])
    if c<0: continue
    items.append(dict(id=r["ID"],kind="qcm",group=g,theme=r["Theme"],level=lvl(r["Niveau"]),question=r["Question"],options=opts,correct=c,explanation=r["Explication"],source=r["Source"],unverified=unv(*opts,r["Explication"])))
for r in rows("Vrai-Faux"):
    v=r["Vrai ou Faux"].strip().lower()
    if v not in("vrai","faux"): continue
    items.append(dict(id=r["ID"],kind="vf",group="Chapitre "+r["Chapitre"],theme=r["Theme"],level=lvl(r["Niveau"]),question=r["Affirmation"],correct=(v=="vrai"),explanation=r["Explication"],source=r["Source"],unverified=unv(r["Affirmation"],r["Explication"])))
for r in rows("Flashcards"):
    items.append(dict(id=r["ID"],kind="flashcard",group="Chapitre "+r["Chapitre"],theme=r["Theme"],level=lvl(r["Niveau"]),question=r["Recto"],answer=r["Verso"],en=r["EN"],source=r["Source"],unverified=unv(r["Recto"],r["Verso"])))
for r in rows("Associations"):
    items.append(dict(id=r["ID"],kind="assoc",group="Chapitre "+r["Chapitre"],theme=r["Theme"],level=lvl(r["Niveau"]),question=r["Terme"],answer=r["Correspondance"],source=r["Source"],unverified=unv(r["Terme"],r["Correspondance"])))
for r in rows("Cas entretien"):
    items.append(dict(id=r["ID"],kind="case",group="Entretien",theme=r["Type"],level=lvl(r["Niveau"]),question=r["Question"],answer=r["Reponse modele (30-60 s)"],keyPoints=r["Points cles"],pitfalls=r["Pieges"],followUps=r["Relances"],source=r["Source"],unverified=unv(r["Reponse modele (30-60 s)"])))
for r in rows("Calculs"):
    items.append(dict(id=r["ID"],kind="calc",group="Calculs",theme=r["Chapitre"],level=lvl(r["Niveau"]),question=r["Enonce"],hypotheses=r["Hypotheses"],formula=r["Formule"],steps=r["Etapes"],result=r["Resultat"]+" "+r["Unite"],explanation=r["Interpretation"],source=r["Source"],unverified=True))
from collections import Counter
print(Counter(i["kind"] for i in items),len(items))
allg=[]
for i in items:
    if i["group"] not in allg: allg.append(i["group"])
json.dump({"generatedAt":"2026-10-06","items":items,"groups":allg},open(os.path.expanduser("~/app/src/data/content.json"),"w"),ensure_ascii=False,indent=0)
