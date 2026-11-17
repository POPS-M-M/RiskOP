# RISK OP — intégration de l’aventure 3D sur maceo

## Périmètre et provenance

Travail effectué uniquement sur `maceo`, en conservant son fichier `bla`. Base fonctionnelle : Syrup `6427276c9a998d887f15155bbf55da159e1452b4`, dernière île explicitement validée par la procédure. Ressources de Cocoyasi : `dee811bfe1a2b13aa48969f6b477fb17cda509ab`. L’historique et les attributions des sources importées sont conservés par l’ascendance du commit d’intégration.

Les autres branches ont été lues pour comparaison. Les changements de `essai/carte-canon` qui modifient les coordonnées, contours et sauvegardes n’ont pas été repris. `main` et `gh-pages` ne sont pas modifiées ; aucun déploiement ni publication de la page de test.

L’instruction directe de travailler uniquement sur `maceo` remplace, pour cette intégration, la création d’une autre branche d’île. Aucune île suivante n’est produite. Cocoyasi reste candidate à la validation explicite de l’utilisateur.

## Présentation et autorité du jeu

Le raccord est isolé dans `sources/src/essai/76-maceo-aventure.js`. Il lit l’état du socle et envoie les ordres par `cmd`, après le contrôle normal de lancement. Il conserve les coordonnées, les côtes calculées par `w3Poly`, la grille logique, les règles, les résultats, les sauvegardes, le réseau, la progression, les difficultés et les panneaux existants.

Conformément au choix explicite de l’utilisateur, la présentation reprend **notre** traversée en bateau et notre bataille rapprochée, en six phases : mer, approche, charge, combat, capture, retour. Les effectifs et pertes viennent du rapport déjà calculé ; aucune bataille n’est recalculée par l’animation. Une seule scène est jouée, sans superposer l’ancienne cinématique du socle. La pause du solo, la reprise, la file de rapports, Passer/Échap et l’annulation à la nouvelle partie sont conservées. Le réseau reste actif en multijoueur.

## Modèles et contraintes Blender

Les sept scènes et exports validés sont repris octet pour octet. Le modèle et les exports de Cocoyasi sont également repris sans régénération. Les copies techniques Python et sauvegardes `.blend1` sont exclues.

Le chargeur Three.js respecte les fichiers à empreintes, vérifie les tailles et SHA-256, sépare le sol et les obstacles, applique les niveaux de ville et annule les chargements périmés. La carte utilise l’échelle des coordonnées stratégiques ; l’atlas et le cinéma convertissent uniformément les unités de présentation. Aucun sommet des scènes d’origine n’est déplacé.

Les formations de bataille sont placées dans des zones existantes détectées comme sèches et sans obstacle dans les cartes exportées. La caméra et les figurines sont ajustées à cette aire, sans modifier la côte ni construire une esplanade dans une île validée. Le décor procédural reste un secours en cas d’indisponibilité des fichiers.

## Reconstruction

Le moteur Three.js, esbuild et les personnages reprennent les dépendances de notre version précédente. Acorn, déjà utilisé par l’assembleur, est désormais déclaré en version 8.15.0 au lieu d’être chargé depuis un chemin absolu de l’ancien environnement Claude. Les builds peuvent sortir dans un dossier temporaire avec `--output-dir` ou `RK_BUILD_OUT`.

Le build public demeure strictement identique :

`08e04954f44d2a37882a37b8e60684917bf2f13661512c458951adb060315ebc`.

La commande `node maceo/build-preview.mjs --output-dir <dossier>` prépare uniquement une copie locale complète, sans hébergement.

## Vérifications et limites

Les rapports JSON joints distinguent les mesures du socle historique, les contrôles géométriques natifs et les tests du nouveau rendu dans Chromium logiciel. Les contrôles des cartes de hauteur ne constituent pas une preuve exhaustive pour tous les triangles du décor. Les durées mesurées sur ce moteur logiciel ne certifient pas une cadence sur un PC matériel à 60 images/s.

Le modèle de Cocoyasi et les sept étapes d’origine sont repris depuis la branche de production ; ni les recherches canoniques ni les rendus Cycles de toutes les vues n’ont été présentés comme refaits. La fiche conserve ses annotations [C], [C?] et [I]. Les nouvelles captures vérifient l’intégration, et la comparaison visuelle avec Syrup complète la planche. Attente de validation avant toute nouvelle île.

## Résultats constatés le 17 novembre

- Les huit îles Blender sont chargées dans la carte d’aventure ; les coordonnées, rayons logiques et côtes fournies correspondent au socle.
- 720 routes maritimes et 23 986 positions ont été contrôlées avec les enveloppes réelles des modèles : aucune coupe de côte ou de Red Line dans cet ensemble.
- 6 720 positions de figurines ont été vérifiées sur les huit terrains, avec deux groupes de vingt : sol, obstacles exportés et séparation conformes.
- Chromium a exécuté un envoi par le bouton « Envoyer les troupes », l’exploration Blender avec sauvegarde inchangée, une bataille sur Cocoyasi avec effectifs réels 45/36 → 24/0, l’absence de seconde cinématique, Passer/Échap, la reprise, l’annulation à la nouvelle partie et le retour 2.5D. Zéro erreur JavaScript de page.
- Le socle WebGL historique a été mesuré séparément : Cocoyasi compte 71 019 triangles en LOD0, 4 739 686 octets de buffers instrumentés pour ses trois niveaux et une reconstruction de conquête à 3 ms dans cette session logicielle. Ce chiffre n’est pas présenté comme le temps de notre nouveau moteur.
- Les huit manifestes et leurs 80 fichiers ont été vérifiés ; les sept paquets d’îles antérieurs sont identiques.

Des requêtes de polices externes ont été refusées par le certificat de l’environnement de test ; les polices de secours ont été employées. Aucun fichier du paquet d’îles n’a été rejeté.

## Lisibilité du combat

L’inspection du nouveau rendu a révélé qu’un arbre pouvait masquer une partie des troupes de Cocoyasi. La caméra choisit désormais un azimut et, si nécessaire, une hauteur en contrôlant les obstacles réels du modèle. Mille lignes de vue supplémentaires sur la charge et la capture de Cocoyasi sont dégagées dans le contrôle natif, sans déplacement d’arbre ni modification du terrain. Le coût de sélection est payé une fois pendant la préparation de la séquence.

La nouvelle caméra a également été capturée dans Chromium : le combat utilise le modèle Blender et les deux groupes de vingt soldats, avec zéro erreur de page.
