import json
d=json.load(open('/downloads/questionnaire-source-acab8f83.json'))['Légendes schémas'][1:]
c=json.load(open('src/data/content.json'))
c['items']=[i for i in c['items'] if not i['id'].startswith('LG-')]
for r in d:
    if not r[0]: continue
    v2='v2' in r[5] or ' XX' in r[5]
    c['items'].append({"id":r[0],"kind":"flashcard","group":"Légendes schémas","theme":str(r[2]),"level":2,
     "question":f"Schéma « {r[2]} » (slide {int(float(r[1]))}) : quelle est l'étiquette de l'élément « {r[3]} » ?",
     "answer":r[4],"source":r[5]+(" - à revérifier (v2 ou droits XX)" if v2 else ""),"qtype":"Légende de schéma","unverified":v2})
json.dump(c,open('src/data/content.json','w'),ensure_ascii=False,indent=1)
print(len(c['items']))
