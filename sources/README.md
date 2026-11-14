# RISK OP — organisation du projet

Jeu de stratégie en un seul fichier HTML, assemblé à partir de sources rangées par rôle.
Projet distinct de « moba-one piece ».

## Arborescence

```
src/
  base/grand_line_origine.html   Socle du jeu (carte, règles, IA, diplomatie, âges, réseau, mini-jeu arcade). Jamais modifié à la main.
  styles/risk-op.css             Styles de la couche RISK OP.
  js/
    00-son.js                          Moteur sonore : 5 ambiances, volumes musique / effets.
    10-economie-phases-ia.js           Détail des revenus, budget, bandeau de phase, IA par tour, annonces de mouvements.
    11-recap-objectifs-heros.js        Butin de conquête, fiche de boss, conseils, objectifs, fiches de personnages.
    12-interface-onglets-minicarte.js  Onglets groupés, notifications, journal, mini-carte déplaçable.
    13-tutoriel.js                     Guide interactif en 10 étapes.
    14-sauvegardes.js                  Sauvegardes de partie (3 emplacements + auto).
    15-ages.js                         Écran de transition d'âge.
    16-multijoueur-factions.js         Multijoueur : choix de la faction dans la salle d'attente.
    17-multijoueur-web.js              Multijoueur hors claude.ai : salle pair-à-pair PeerJS (même interface que la salle claude.ai).
    20-rendu25d-biomes.js              Rendu 2.5D : biomes (relief, couleurs).
    21-rendu25d-decors.js              Rendu 2.5D : bâtiments, arbres, monuments.
    22-rendu25d-iles.js                Rendu 2.5D : fiche d'environnement de chacune des 53 îles.
    23-rendu25d-moteur.js              Rendu 2.5D : calcul en tâche de fond, cache navigateur, dessin, fiche d'île.
    30-illustrations.js                Illustrations de héros importées (IndexedDB), export / réimport.
    40-menu-boutons.js                 Boutons de l'en-tête et de l'écran d'accueil.
tools/
  build.js            Assemble dist/risk_op.html (et dist/risk_test.html avec `test`).
  shake.js            Retire les anciennes versions de fonctions et les fonctions mortes (analyse acorn).
  expose-tests.txt    Accès de test ajouté uniquement à risk_test.html.
  eslintrc.json       Règles d'analyse statique.
  vendor/             PeerJS 1.5.5 (licence MIT), inclus seulement dans dist/index.html.
tests/                Tests Playwright (interface, logique, tutoriel, illustrations, rendu 2.5D, temps réel).
dist/                 Fichiers assemblés.
```

## Principes

- **Logique, rendu et ressources séparés.** Les modules 20 à 23 ne font que dessiner : ils lisent l'état du jeu et ne le modifient pas. Les clics passent par la grille logique du socle.
- **Le socle n'est pas édité.** `build.js` y applique une liste de retouches nommées ; chaque retouche vérifie que son point d'ancrage existe exactement le nombre de fois attendu, sinon la construction échoue.
- **Pas de code mort.** Quand un module remplace une fonction du socle, `shake.js` retire l'ancienne version et tout ce qui n'est plus appelé.

## Commandes

```
node tools/build.js          # dist/risk_op.html
node tools/build.js test     # dist/risk_test.html
node tools/build.js web      # dist/index.html : version à héberger (GitHub Pages…), PeerJS inclus
npx eslint -c tools/eslintrc.json <script extrait>   # analyse statique
cd dist && python3 -m http.server 8766               # requis par t_ill, t_25, t_ara
node tests/t_ui.js           # etc.
```

Pour modifier l'apparence d'une île : éditer sa fiche dans `src/js/22-rendu25d-iles.js`, puis changer `R25.ver` dans `23-rendu25d-moteur.js` pour forcer le recalcul du cache.
