# RISK OP — Convention des troupes en sprites (version 1, 18/11/2026)

Référence : le soldat de base de la Marine (`marine_recrue`). Il représente l'unité « Recrues » (clé interne `guerrier`, kind 0), appelée « Pirates » dans le jeu d'origine.
Tous les prochains soldats suivent cette convention. Code : `src/essai/77-troupes-sprites.js`. Données : `src/essai/76-troupes-donnees.js`, produit par `art/troupes/outils/vers_jeu.py`.

## 1. Fichiers d'une troupe (`art/troupes/<troupe>/`)
- `source/<planche>.png` : la planche reçue, **jamais modifiée**. Son SHA-256 est noté dans `poses.json` et vérifié par chaque outil.
- `poses.json` (écrit à la main après analyse) : nom, rôle et note de chaque pose ; animations ; convention d'échelle ; taille de l'atlas et marge.
- `outils/decoupe_planche.py` → `sprites/<pose>.png` (copie exacte des pixels utiles), `atlas.png`, `troupe.json`, `apercus/`.
- `outils/vers_jeu.py` → `src/essai/76-troupes-donnees.js` (atlas en PNG base64, dimensions, ancres, animations).

## 2. Échelle
- Unité du monde : 1 u ≈ 3,3 m. Mesuré sur les îles Blender : portes des kits 0,55 à 0,70 u (médiane mesurée dans `water_7/lod0.glb` : 0,62 u), étages 0,80 à 0,95 u.
- **Hauteur de référence : 0,54 u** (soldat de 1,80 m casquette comprise), de la semelle au sommet de la casquette, dans la pose de garde `garde_1` (177 px).
- **Facteur d'échelle : 0,0030508 u par pixel**, le même pour toutes les images d'une troupe. Une pose accroupie est donc plus basse et une pose de course plus large ; aucune image n'est agrandie ni étirée à part.
- La valeur est la même sur toutes les îles. Elle ne dépend ni du rayon de l'île ni de la caméra. Les personnages 3D d'autres types sont ramenés à la même hauteur (échelle `0,54 / PXH`).

## 3. Ancrage aux pieds
- **Ancre = milieu des appuis** : les bottes posées, détectées dans les 30 rangées du bas. Sa hauteur est la moyenne des semelles (+1 px).
- L'ancre est posée sur la carte **« sol »** exportée de Blender, qui ne contient pas les toits. Les cases interdites sont l'eau, les bâtiments et les arbres (« obstacles » − « sol » > 0,1 u) et les pentes de plus de 40° environ.

## 4. Dimensions (marine_recrue)
| Pose | Boîte utile (px) | Rôle |
|---|---|---|
| garde_1 / garde_2 / garde_3 | 101×177 / 100×175 / 100×174 | attente |
| course | 147×172 | déplacement |
| accroupi_1 / accroupi_2 | 96×152 / 98×149 | réaction |
| cri | 125×178 | cri (interprétation) |
| attaque_1 | 111×177 | préparation (pose isolée) |
| attaque_2 / 3 / 4 | 113×178 / 142×174 / 133×172 | attaque |
| ombre | 82×43 | ombre de contact fournie |

Atlas : 1024×1024, pixels copiés sans rééchantillonnage, marges de 16 px. Elles évitent que les niveaux de mipmap mélangent deux poses.

## 5. Transparence
- L'alpha d'origine est conservé (11 045 pixels semi-transparents sur la planche).
- Dans le jeu, l'alpha est prémultiplié au chargement, ce qui évite un liseré sombre. Mipmaps trilinéaires pour les petites tailles. Fusion `ONE, ONE_MINUS_SRC_ALPHA`. Les pixels d'alpha < 0,01 sont rejetés.

## 6. Animations
Seules les images de la planche sont utilisées. Aucune image n'est créée ni déformée.
- `garde` : garde_1 → 2 → 3 → 2 en boucle, 4 images/s. C'est une vraie séquence : mêmes appuis, seul le haut du corps bouge.
- `deplacement` : **image fixe** `course`. La planche ne contient pas de cycle de course.
- `attaque` : attaque_2 → 3 → 4, 8 images/s, une fois, puis retour à la garde. Mêmes appuis sur les trois images.
- `preparation` : attaque_1 seule. Le coup qui suit part de l'autre bras, donc ce n'est pas l'armé de ce coup : elle n'est pas enchaînée à l'attaque.
- `reaction` : accroupi_1 → accroupi_2 (soldat touché ou à terre ; interprétation).
- `cri` : image fixe (fin de débarquement, victoire ; interprétation).

## 7. Orientation
La planche ne montre le soldat que de trois quarts face, tourné vers la droite. Quand il regarde ou marche vers la gauche de l'écran, l'image est retournée en miroir. Conséquence : l'inscription de la casquette apparaît alors à l'envers. Il n'y a pas de vue de dos.

## 8. Profondeur
- Le sprite est un plan face à la caméra, avec une échelle uniforme `cu.z`. Sa hauteur à l'écran est celle d'un poteau vertical de 0,54 u planté à ses pieds : il subit le même raccourci que les murs, quelle que soit l'inclinaison de la caméra.
- La profondeur écrite est celle de l'ancre, avancée de 0,16 u vers la caméra : un mur devant les pieds cache le soldat, un mur derrière non.
- Les sprites sont triés du plus loin au plus proche et ne modifient pas le tampon de profondeur.

## 9. Ombre et contact au sol
- L'ellipse grise de la planche est posée à plat sous les pieds (0,28 × 0,17 u, opacité 0,42), avec un décalage de polygone pour ne pas scintiller.
- Un anneau fin à la couleur du joueur (0,40 × 0,30 u) permet de distinguer les camps. Il est désactivable (`TRP.anneau`).

## 10. Effectifs
- Nombre de figurines = round(effectif^0,62 × 1,1), entre 1 et 30 par île : même courbe que les personnages 3D. Les effectifs réels ne changent pas.
- Les places sont tirées une fois par île (tache compacte près du port, au moins 0,44 u entre deux soldats) ; types d'unité au prorata.
- Rien n'est dessiné en dessous de 1,6 px de haut. La garnison n'apparaît qu'à partir d'environ 2 px.
