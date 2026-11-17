# RISK OP — OP Adventure (nouvelles règles)

Branche `op-adventure`, créée le 17/11/2026 depuis `essai/ile-ohara` (16 îles Blender, dont Ohara en attente de validation).
Les autres branches, `main` et `gh-pages` ne sont pas touchés. Consigne : document de l'utilisateur du 17/11/2026 (« Nouvelle progression adaptée à One Piece »).

Repères : [C] canon sourcé · [C?] canon de mémoire, à vérifier · [I] interprétation ou choix d'équilibrage. **Tous les chiffres sont des choix d'équilibrage [I].**

## Où sont les changements
- `src/base/grand_line_origine.html` : données et règles du socle, modifiées par `tools/op/edit_base.py` (chaque remplacement vérifié une seule fois), plus quelques retouches (règles affichées, mode ralliement, Poneglyphes).
- `src/js/90-op-adventure.js` : nouveau module (Haki, Fruits, champions au combat, IA, interface, migration des sauvegardes).
- `src/js/12`, `50`, `51` : onglet Haki toujours visible, coût en ⚔ au recrutement, bâtiments améliorés.
- `src/essai/62-combat3d.js` : le boss n'utilise plus le numéro d'unité 5 (pris par les Unités d'élite).
- `tools/build.js` : module ajouté ; textes « Volonté » → « Recrues », « recrues naturelles » → « renforts naturels », unité « Pirates » → « Recrues » là où il s'agit de l'unité.
- Tests : `tests/t_op_adventure.js` (33 vérifications) ; `tests/t_eco.js` compte désormais les technologies au lieu de 26.

## 1. Ressources
| Ressource | Usage | Production |
|---|---|---|
| ฿ Berrys | recrutement, bâtiments, améliorations | inchangée |
| ◈ Savoir | technologies, Haki, Poneglyphes | inchangée |
| ⚔ Recrues | chaque lot recruté en consomme ; entraînement au Haki ; Fruits | îles (jungles surtout), Camps, Bases, QG, Dojos ; départ 24 |
| ⚜ Influence | diplomatie, Ralliement, Fruits | base 0,30/s (au lieu de 0,22) + commerce + Grands ports |

La Volonté disparaît. Techniquement, le champ interne `faith` porte désormais les ⚔ Recrues : sauvegardes, réseau et IA gardent leur forme.
Les Voies (Quête du Trésor, Haki des Rois, Armement, Observation), l'Éveil (Ferveur) et leurs coûts sont retirés. Une ancienne sauvegarde avec une Voie reçoit un rang 1 de Haki (Observation pour la Voie du Savoir, Armement pour les autres ; rien pour la Quête du Trésor).

## 2. Troupes (coût en ฿ et en ⚔ par lot)
| Unité | Att. | Déf. | Vit. | Lot | ฿ | ⚔ | Technologie |
|---|---|---|---|---|---|---|---|
| Recrues | 1 | 1 | 1 | 5 | 12 | 7 | — |
| Sabreurs | 0,7 | 1,5 | 1 | 5 | 17 | 9 | Sabres (âge I) |
| Tireurs | 1,5 | 0,6 | 1 | 5 | 16 | 9 | Tir de précision (âge I) |
| Unités d'assaut | 2 | 0,8 | 1,5 | 3 | 16 | 9 | Tactiques d'assaut (âge I) |
| Canons | 3,2 | 0,3 | 0,55 | 2 | 14 | 7 | Artillerie (âge II) |
| Unités d'élite | 2,3 | 2,3 | 1,1 | 2 | 30 | 12 | Formations d'élite (âge II) |

« Mangeur de Fruit » n'est plus une troupe ; sa place (et son triangle de contres) revient aux Unités d'assaut. Les Canons sont gardés (non cités par la consigne, pas de suppression sans accord). Élite : sans contre, entretien double, insensible au Haki des Rois.

## 3. Technologies (5 branches, 29 technologies)
Nouvelles : Formations d'élite (II), Doctrine du Nouveau Monde (III, élite +25 %), Le Siècle oublié (III, Poneglyphes ×2).
Revues : Tactiques d'assaut (I, ex-« Fruits artificiels » II), Granit marin (utilisateurs de Fruit ennemis −20 %), Études des Poneglyphes (ex-« Maîtrise du Haki » : déchiffrage −25 %), Recherches historiques (Influence au lieu de Volonté), Installations stratégiques, Réseaux commerciaux, Log Pose avancé.

## 4. Bâtiments par âge (une amélioration remplace le bâtiment d'avant, sans place en plus)
| Âge I | Âge II | Âge III |
|---|---|---|
| Camp d'entraînement | Base militaire | Quartier général avancé |
| Port marchand | Grand port | Centre commercial majeur |
| Archives | Bibliothèque d'archéologie | Centre de recherche avancé |
| Dojo | Centre de maîtrise du Haki | Centre d'entraînement d'élite |
| Fortin (×1,35) | Forteresse (×1,6) | Base stratégique majeure (×1,9) |

Écart avec la consigne : le niveau II du Savoir s'appelle « Bibliothèque d'archéologie » ; « Bibliothèque d'Ohara » reste le lieu légendaire unique (déjà dans le jeu), pour ne pas avoir une Bibliothèque d'Ohara dans chaque ville.

## 5. Haki
- Observation et Armement : rangs 1 à 3, payés en ◈ et ⚔ (40/110/240 ◈, 15/35/70 ⚔). Rang 1 : un Dojo ; rang 2 : Centre de maîtrise du Haki (âge II) ; rang 3 : Centre d'entraînement d'élite (âge III).
- Observation / rang : défense +4 %, pertes de repli −15 %, techniques des champions ennemis −12 %.
- Armement / rang : attaque +4 %, défense +2 %, champions +5 % ; dès le rang 1, les Logia ennemis perdent leur bonus et peuvent être blessés.
- Haki des Rois [C] : liste des utilisateurs du One Piece Wiki, personnages du jeu : Shanks, Luffy, Rayleigh, Doflamingo, Big Mom, Katakuri, Sengoku, Kaido, Zoro, Barbe Blanche, Ace, Oden, Roger. Au combat : 4 % + 1,5 % par niveau (max 12 %) des troupes ordinaires adverses perdent connaissance. Ralliement −30 %.

## 6. Fruits du Démon
- Un Fruit = un utilisateur identifié. Commandants à Fruit (noms et types d'après les textes du jeu ; éveil : Doflamingo [C], Luffy, Law, Katakuri [C?]).
- Les 3 Fruits introuvables de la carte (un par type) ne donnent plus de bonus passif : le camp qui tient l'île peut en faire naître un utilisateur (90 ฿ au rythme Standard, 25 ⚔, 8 ⚜ ; 2 au plus par camp).
- Paramecia : technique +25 %. Zoan : puissance +20 %, blessures deux fois plus courtes. Logia : puissance +35 % et jamais blessé, sauf face au Haki de l'Armement. Granit marin ennemi : −20 %. Éveil (âge III, niveau 4) : +25 %.

## 7. Commandants au combat
- Puissance (en équivalent troupes) = (3 + 1,4 × Force + 0,5 × Défense) × rareté × (1 + 12 % par niveau) ; ex. Zoro ≈ 19, Kaido ≈ 27 (35 avec Zoan) au niveau 1.
- Posté à une île : il la défend. Une armée qui en part avec au moins la moitié des troupes l'emmène (jamais deux fronts ; pas de nouveau poste pendant la traversée).
- Bataille : techniques (frappe, bonus, malus, renforts), Haki des Rois, duel des meilleurs champions (le vainqueur donne +8 % à son camp, le perdant est blessé 3 tours), puis puissance ajoutée aux troupes. Camp vaincu : attaquants blessés, défenseurs repliés sur une île voisine.
- Le rapport de bataille montre les champions, leurs techniques et le duel.

## 8. IA
- Achète le Haki, fait naître des utilisateurs de Fruit, les poste sur le front ; ses commandants partent avec ses armées.
- Recrute avec ฿ et ⚔ ; Ralliement en ⚜.

## Tests (17/11/2026, environnement de la session)
- `t_op_adventure` : 33/33. Parties IA de 110 tours : 3 âges franchis, bâtiments améliorés, Unités d'élite, Haki rang 3, 38 batailles avec champions (2 duels, 11 Haki des Rois, 7 blessures), 0 erreur.
- Suites existantes : t_logic, t_ui, t_eco (24/24), t_prog (30/30), t_prog_ui (26/26), t_tuto (14/14), t_coal, t_cont, t_rt, t_scroll, t_ai_once, t_mp, t_mp2, t_mp_fac, t_maq (34/34) passent.
- Déjà en échec sur la branche de départ (sans rapport avec les règles) : t_25 (délai dépassé), t_ill (« Export hors claude.ai »).
- Correctif en passant : la fiche d'un boss affichait une « meilleure armée voisine » tirée au hasard à chaque image (attTotal avec hasard) ; elle est maintenant stable.
- Version jouable privée : artefact « RISK OP Adventure » (page d'essai + 16 îles Blender).

## Limites connues
- Multijoueur : un client ne voit pas l'état « en mer / blessé » des commandants (non transmis par la vue réseau) ; les règles s'appliquent quand même chez l'hôte.
- L'IA accumule beaucoup de ⚔ en fin de partie (elle manque de Berrys avant de manquer de Recrues).
