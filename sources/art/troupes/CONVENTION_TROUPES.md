# RISK OP — Convention des troupes en sprites (version 2, 22/11/2026)

Référence : le soldat de base de la Marine (`marine_recrue`). Il représente l'unité « Recrues » (clé interne `guerrier`, kind 0), appelée « Pirates » dans le jeu d'origine, **pour la faction Marine uniquement**.
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

## 11. Faction → troupe → planche (version 2)
- Une planche appartient à une faction. La table `TRP_ASSETS` (`src/essai/77-troupes-sprites.js`) associe la faction réelle du propriétaire (`players[o].crew` → `CREWS[...].id` : `marine`, `pirate`, `revo`, `chasseur` ; `native` pour les îles neutres), puis la catégorie de troupe (kind), à une planche. Aujourd'hui : `{marine: {0: 'marine_recrue'}}`.
- Une faction ou une troupe sans planche garde ses personnages 3D actuels. Il n'y a **aucune planche par défaut** et aucune autre faction ne récupère celle de la Marine.
- Chaque planche a sa texture. La hauteur de référence (0,54 u) est commune : chaque planche donne sa propre `hauteur_ref_px`.
- Pour une nouvelle troupe : dossier `art/troupes/<troupe>/`, découpe, `vers_jeu.py`, puis une ligne dans `TRP_ASSETS`.

## 12. Caméra de combat rapprochée (version 2)
- **Deux modes.** Le mode stratégique (`w3Cam`, réglé par le joueur) n'est jamais modifié par le combat. Le mode combat (`b3Cam` adaptée) n'est actif que pendant la scène de bataille.
- **Entrée** : au début de la scène, la caméra part de la vue stratégique et se rapproche en douceur en 1,9 s. La distance est interpolée en logarithme : pas d'à-coup de zoom.
- **Approche** : vue plus haute (inclinaison 0,8) qui cadre la plage d'abordage, le front et les navires.
- **Mêlée** : la caméra descend (inclinaison 0,5) et cadre les deux camps.
  - Largeur : déciles 1 à 9 des positions des combattants, pour ne pas suivre les traînards sur les ailes.
  - Profondeur : tout le monde reste dans le cadre.
  - Marges ×1,3 et ×1,55 ; distance entre 5,2 et 30 u.
  - Le cadre suit les combattants avec un lissage exponentiel (constante 2,4/s).
- **Côté de vue** : l'axe d'attaque est horizontal à l'écran, avec les deux camps à gauche et à droite. On choisit, parmi 10 angles, celui que les bâtiments masquent le moins (carte « obstacles »). À égalité, le camp du joueur est placé à gauche.
- **Sortie** : à la fin de la scène, ou par clic, Espace ou Échap, retour progressif (1,4 s) vers la caméra stratégique d'origine.
- **Plan proche et brouillard** suivent la distance de la caméra (`near` = 4 % de la distance, `fogD` ≥ 45 u). En mode stratégique, les valeurs d'origine (20 u, 1,8 × distance) sont conservées.
- **Échelle** : seule la caméra se rapproche, les soldats gardent leurs 0,54 u. En mêlée, sur l'essai de Water 7, la caméra est à environ 10–13 u et un soldat mesure environ 40 à 50 px CSS de haut (fenêtre de 1 400 × 860).
- Désactivable pour comparaison : `localStorage['rk-camc']='0'` (caméra d'origine) ; `localStorage['rk-trp']='0'` désactive tout le module.

## 13. Planches « en vrac » et commandants (22/11/2026)

- Outil : `art/troupes/outils/decoupe_auto.py <dossier>`. `poses.json` donne pour chaque pose un centre approximatif sur la planche
  (`poses: {nom: [cx, cy]}`), ou une image d'animation (`{nom: {"image": …}}`) ; `zone` limite la découpe à la partie « Left »
  des planches à deux sens. Les blocs non nommés (effets, icônes, ombres de la planche) sont ignorés ; les poses non animées ne vont pas dans l'atlas.
- Ancre aux pieds : centre des pixels pleins (alpha > 200) des 10 rangées du bas de la plus grande composante de la pose : la fumée et les lueurs ne comptent pas.
- Atlas en WebP sans perte (`atlas.webp`) ; `vers_jeu.py` l'inclut tel quel (data URI WebP). Ombre : ellipse douce générée, la même pour toutes.
- Échelle : la pose de référence de chaque planche a la hauteur du soldat de la Marine (0,54 u) ; commandants ×1,12.
- Table faction → unité → planche (`TRP_ASSETS`, 77-troupes-sprites.js) : Marine 0 Recrues `marine_recrue`, 1 Sabreurs `marine_sabreur` ;
  Pirates 0 `pirate_recrue`, 2 Tireurs `pirate_tireur` ; Révolutionnaires 0 `revo_recrue`. Les autres unités gardent leurs personnages 3D.
- Commandants au combat : les champions du rapport OP Adventure (`r.op.a`, `r.op.d`) qui ont une planche (`TRP_CMD` : Ace, Shanks, Akainu,
  Garp, Luffy, Nami) sont ajoutés derrière la première ligne de leur camp (2 au plus par camp). Pure mise en images : ils ne tombent pas et
  ne changent ni les pertes ni le résultat. Sans les personnages 3D (module désactivé), ils ne sont pas dessinés.
- Planches reçues le 22/11/2026 (pirate_recrues, pirate_tireur, marine_sabreur, revolutionnaire, ace, shanks, akainu, garp, luffy.zip, nami.zip),
  conservées intactes dans `source/` (SHA-256 vérifiés par `vers_jeu.py`).
