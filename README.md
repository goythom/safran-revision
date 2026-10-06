# Prépa entretien Safran Aircraft Engines

Application web de révision pour l'entretien d'ingénieur maîtrise d'ouvrage et intégration des transmissions mécaniques.
791 questions issues du rapport technique et du Questionnaire (flashcards, QCM, vrai/faux, questions ouvertes, associations FR-EN, cas d'entretien, calculs).

## Lancer l'app (local)

```bash
git clone https://github.com/goythom/safran-revision.git
cd safran-revision
npm install --legacy-peer-deps
npm run dev          # http://localhost:3000
```

Version statique : `npm run build` produit le dossier `out/` (servir avec `npx serve out`).

## Fonctions

- 9 modes : révision adaptative (boîtes de Leitner), flashcards, QCM, vrai/faux, questions ouvertes, cas techniques, quiz chronométré (25 s), mode examen (30 min, correction à la fin), simulation d'entretien (90 s).
- Bibliothèque : recherche sans accents, filtres type / chapitre / niveau / statut, favoris, maîtrisée, à revoir.
- Tableau de bord : maîtrise globale, points faibles, séries, historique, avancement par chapitre.
- Progression enregistrée dans le navigateur (localStorage), export et import JSON depuis le tableau de bord.
- Les contenus incertains (XX, déduit, à relire) portent un badge « À vérifier » et restent visibles.

## Contenu

`src/data/content.json` est généré par `scripts/import_content.py` depuis le Questionnaire Google Sheet. Aucune information technique n'est ajoutée à la main.

## Qualité

```bash
npm run typecheck && npm test && npm run build
npm run e2e   # smoke test Playwright (serveur statique sur :4173 requis)
```

Design : palette Safran (#1763A9), Inter, contrastes AA, navigation mobile en bas, une action principale par écran (brief design du projet).

## Direction visuelle (final)
Formes et interactions inspirées de Trendtrack.io, palette Safran restreinte (nuit, bleu Safran, acier, brume, sable). Feedback juste/faux/à vérifier dans la même famille de teintes. Schémas recadrés issus de la présentation v3 (page Schémas), affichés après la réponse dans les cartes.
Les statuts « À vérifier » ont des raisons (XX, déduit, à vérifier, droits image, calcul pédagogique). Voir `scripts/flag.py` et `scripts/add_images.py`.
