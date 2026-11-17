# RiskOP

Jeu de stratégie au tour par tour inspiré de One Piece (fan-game non officiel), jouable dans le navigateur, en solo ou en ligne jusqu'à 4 joueurs.

- **Jouer** : `index.html` (servi par GitHub Pages).
- **Multijoueur** : un joueur clique « Créer une partie » et partage le code ; les autres font « Rejoindre ». Connexion pair-à-pair via PeerJS, sans compte.
- **Sources** : dossier `sources/` (voir `sources/README.md`). Reconstruire le fichier : `node sources/tools/build.js web`, puis copier `sources/dist/index.html` à la racine.

## Travail sur la branche `maceo`

La reprise des îles Blender et de la présentation d’aventure 3D se trouve dans [`maceo/`](maceo/README.md). La commande de préparation produit une copie locale isolée ; les pages publiques historiques restent inchangées. Le rapport de vérification est dans [`claude/risk-op-maceo-integration.md`](claude/risk-op-maceo-integration.md).
