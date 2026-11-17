# RISK OP — travail de Macéo

Cette version associe les règles et fonctionnalités du jeu repris de la dernière base validée Syrup aux modèles Blender déjà produits, avec notre carte d’aventure Three.js, la traversée en bateau et le combat rapproché sur l’île.

Les changements sont destinés exclusivement à la branche `maceo`. Aucun déploiement n’est effectué. Le fichier public `sources/dist/risk_op.html` reste identique.

## Préparer la copie de test

Depuis la racine du dépôt :

```sh
npm --prefix sources ci
npm --prefix maceo ci
node maceo/build-preview.mjs --output-dir /tmp/riskop-maceo
python3 -m http.server 8766 --bind 127.0.0.1 --directory /tmp/riskop-maceo
```

Ouvrir `http://127.0.0.1:8766/`. Le dossier de sortie contient la page, les modules compilés et le paquet des huit îles. Les modèles Blender originaux restent dans `sources/art/` ; il n’est pas nécessaire de régénérer leurs scènes pour cette intégration. Une compilation sans installation est possible si les dépendances sont déjà présentes.

Le mode `essai-test` expose les accès de diagnostic du projet. Il sert à la copie de vérification locale. Le mode public historique n’a pas été remplacé.

## Commandes de jeu conservées

- Sélectionner une île de son camp, choisir une voisine puis **Envoyer les troupes** : les ordres passent par la commande existante du jeu.
- Clic gauche : rotation ; clic droit ou molette maintenue : déplacement ; ZQSD/WASD/flèches : navigation ; **T** : vue tactique.
- Double clic ou **Explorer en 3D** : scène détaillée de l’île. La partie solo est suspendue pendant cette exploration.
- Une attaque impliquant le joueur rejoue le résultat réel : traversée, arrivée, charge, affrontement, capture et retour. **Passer** ou **Échap** restitue la main.
- **Carte 2D** conserve le rendu 2.5D, les sauvegardes, les panneaux, l’économie, les tours, la diplomatie et la progression du socle.

## Îles Blender et limites

Zou, Whole Cake, Water 7, Loguetown, Wano, Alabasta et Syrup sont repris sans modifier leurs scènes ou exports validés. Cocoyasi est repris depuis sa branche de production comme **candidate à validation** ; cette intégration ne vaut pas validation artistique de l’île.

Les GLB, manifestes et cartes de hauteur sont vérifiés par taille et SHA-256. Les niveaux de ville restent séparés. La carte utilise les vraies côtes du jeu ; les unités d’exploration et de bataille utilisent la carte du sol, distincte des obstacles. Les champs de bataille sont recherchés sur le terrain existant, sans aplatir ni refaire les modèles. L’échelle des figurines et le recul de la caméra s’adaptent à la place disponible.

Si un modèle manque ou ne se charge pas, le décor procédural précédent sert de secours ; le bouton Passer reste disponible pendant le chargement. Les îles non produites dans Blender conservent ce décor de secours. Les 60 images/s restent une cible dépendant du matériel et du mode de qualité.

## Vérifications reproductibles

```sh
node sources/tools/build.js
sha256sum sources/dist/risk_op.html
# attendu : 08e04954f44d2a37882a37b8e60684917bf2f13661512c458951adb060315ebc

node maceo/tests/blender-battles.mjs /tmp/riskop-maceo/iles
```

Ce dernier contrôle charge les huit GLB, vérifie les formations de 20 + 20 soldats, le sol, les obstacles et l’annulation d’une cinématique pendant le chargement. Les résultats de l’intégration et leurs limites sont consignés dans `claude/risk-op-maceo-integration.md` et `maceo/verification/`.
