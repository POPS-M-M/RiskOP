# RISK OP — organisation du projet

Jeu de stratégie en un seul fichier HTML, assemblé à partir de sources rangées par rôle.
Projet distinct de « moba-one piece ».

## Arborescence

```
src/
  base/grand_line_origine.html   Socle du jeu (carte, règles, IA, diplomatie, âges, réseau, mini-jeu arcade). Jamais modifié à la main.
  styles/risk-op.css             Styles de la couche RISK OP.
  js/
    00-son.js                          Moteur sonore : scènes, volumes musique / effets (morceaux : module 52).
    10-economie-phases-ia.js           Détail des revenus, budget, bandeau de phase, IA par tour, annonces de mouvements.
    11-recap-objectifs-heros.js        Butin de conquête, fiche de boss, conseils, objectifs, fiches de personnages.
    12-interface-onglets-minicarte.js  Onglets groupés, notifications, journal, mini-carte déplaçable.
    13-tutoriel.js                     Tutoriel joué : 7 objectifs validés par les actions, Codex consultable dans Règles.
    14-sauvegardes.js                  Sauvegardes de partie (3 emplacements + auto).
    15-ages.js                         Écran de transition d'âge.
    16-multijoueur-factions.js         Multijoueur : choix de la faction dans la salle d'attente.
    17-multijoueur-web.js              Multijoueur hors claude.ai : salle pair-à-pair PeerJS (même interface que la salle claude.ai).
    18-progression.js                  Progression permanente (XP, rangs, collection), commandants proposés par difficulté,
                                       écran Progression, recrutement en 3 sections, difficulté Expert, coalitions, fiche des règles.
    20-rendu25d-biomes.js              Rendu 2.5D : biomes (relief, couleurs).
    21-rendu25d-decors.js              Rendu 2.5D : bâtiments, arbres, monuments.
    22-rendu25d-iles.js                Rendu 2.5D : fiche d'environnement de chacune des 53 îles.
    23-rendu25d-moteur.js              Rendu 2.5D : calcul en tâche de fond, cache navigateur, dessin, fiche d'île.
    30-illustrations.js                Illustrations de héros importées (IndexedDB), export / réimport.
    40-menu-boutons.js                 Boutons de l'en-tête et de l'écran d'accueil.
    50-tableau-ile.js                  Onglet Île : tableau de bord (État · Que faire · Atouts et faiblesses).
    51-economie.js                     Onglet Économie : Berrys, Villes, Techno (faisable d'abord, le reste replié).
    52-musique-medievale.js            Musique : 3 morceaux médiévaux + 1 chant de marins, tous originaux (Web Audio).
tools/
  build.js            Assemble dist/risk_op.html (et dist/risk_test.html avec `test`) ; `essai`, `essai-test`, `essai-web` y ajoutent les modules de src/essai/.
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
node tools/build.js web      # dist/index.html : jeu sans les modules 3D (PeerJS inclus)
node tools/build.js essai-web # dist/index.html : version publiée = jeu + monde 3D, combat 3D, nouveaux personnages et navires (src/essai/), PeerJS inclus
npx eslint -c tools/eslintrc.json <script extrait>   # analyse statique
cd dist && python3 -m http.server 8766               # requis par t_ill, t_25, t_ara
node tests/t_ui.js           # etc.
```

Pour modifier l'apparence d'une île : éditer sa fiche dans `src/js/22-rendu25d-iles.js`, puis changer `R25.ver` dans `23-rendu25d-moteur.js` pour forcer le recalcul du cache.

## Progression (module 18)

- Stockage : clé `rk-prog` (profil de progression) et `rk-tob` (objectifs du tutoriel), séparées du carnet `gl-profile`, jamais réécrit.
- Rythme : une seule constante, `pgCost` (XP pour passer d'un rang au suivant).
- Commandants proposés par camp : `PG_N` (Facile 4, Normal 8, Difficile 16, Expert tous). Une sauvegarde sans liste (`G.rkp` absent) garde tous les commandants.
- En ligne, la liste est calculée à partir de la graine, de la difficulté et des camps : identique chez l'hôte et les invités, sans message réseau.
- Tests : `t_prog` (logique), `t_prog_ui` (écrans, PC et mobile), `t_coal` (difficultés, coalitions), `t_tuto` (7 objectifs).

## Interface et musique (modules 50 à 52)

- Mêmes calculs et mêmes actions (data-act existants) que les anciennes fiches : seule la présentation change.
- Tests : `t_maq` (onglet Île), `t_eco` (Économie), `t_music` (rendu audio hors ligne ; `node tests/t_music.js wav` écrit des extraits .wav).

## src/essai/ (monde 3D et personnages)

Modules ajoutés par les modes `essai*` : `60-rendu3d` (géométrie et relief), `61-monde3d` (carte 3D, caméra libre, îles teintées à la couleur du propriétaire), `62-combat3d` (scène de bataille : navires en caravelle, soldats qui voyagent sur le pont puis débarquent), `63-refonte-iles`, `64-66-persos-*` (personnages stylisés, sprites et débarquements), `67-objectifs-discrets` (fiche d'objectif repliée en pastille). L'atelier de comparaison des personnages s'ouvre avec Maj+P (aucun bouton à l'écran).
