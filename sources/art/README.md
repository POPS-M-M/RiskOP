# RISK OP — chaîne de production des îles (Blender → 2.5D + 3D)

Une **seule scène source par île** produit les deux sorties du jeu :

| Sortie | Fichiers | Utilisée par |
|---|---|---|
| Images 2.5D | `l1.webp` (2 px/unité), `l2.webp` (6), `l3.webp` (12), `ville2-4.webp` (calques de ville) | mode 2.5D (Canvas) |
| Modèles 3D | `lod0.glb`, `lod1.glb`, `lod2.glb` (nœuds `BASE`, `VILLE_2..4`) | mode 3D (WebGL) |
| Commun | `manifest.json` : cadre, hauteurs (sol / obstacles), drapeaux, ponton, poids, temps | les deux |

Ce qui est partagé : la géométrie, les couleurs (attribut de sommet « Col » = albédo peint), les repères, la lumière (même direction de soleil que le jeu).
Ce qui diffère volontairement : l'éclairage final (Cycles pour le 2.5D, rééclairage du jeu pour la 3D), les contours (Freestyle en 2.5D), les niveaux de détail.

## Organisation

```
art/
  data/islands.json            exporté du jeu (lecture seule) : centre, rayon, contour de côte, ponton…
  scripts/
    export_islands.js          jeu → data/islands.json
    rk_common.py               repère, matériaux communs, lumière, caméra 2.5D (cisaillement), export glTF, hauteurs
    rk_lib.py                  bibliothèque de pièces (arbres, rochers, huttes, ponts, pâtisseries…)
    build_zou.py               scène source de Zou        → blender/islands/zou.blend
    build_whole_cake.py        scène source de Whole Cake → blender/islands/whole_cake.blend
    export_island.py           .blend → out/<île>/ (WebP, GLB, manifeste) ; --apercu pour un rendu rapide
    pack_for_game.py           out/ → dist/iles/ (+ index.json)
  blender/islands/             scènes sources (.blend) — à ouvrir et retoucher dans Blender
  blender/imports/<île>/       modèles d'artiste ou générés (Rodin…) à intégrer
  out/<île>/                   sorties (PNG maîtres + WebP + GLB + manifeste)
```

## Commandes

```bash
node tools/build.js essai-test && node art/scripts/export_islands.js   # données des îles (lecture seule)
python3 art/scripts/build_zou.py                                        # (re)génère la scène source
python3 art/scripts/export_island.py zou --apercu                       # vérification rapide de la composition
python3 art/scripts/export_island.py zou                                # rendus + glTF + manifeste
python3 art/scripts/pack_for_game.py                                    # copie à côté de la page de test
```
Blender 5.x (module `bpy` ou Blender complet). Rendus : Cycles (processeur suffisant ; carte graphique conseillée).

## Conventions d'une scène d'île (pour un artiste ou un modèle importé)

- **Repère** : unités de carte du jeu ; Blender X = est, Blender −Y = sud du jeu, Z = haut ; origine = centre logique de l'île. La mer est à Z = 0.
- **Collections** : `RK_SOL` (terrain où marchent les unités), `RK_DECOR` (monument, végétation, accessoires), `RK_VILLE_2`, `RK_VILLE_3`, `RK_VILLE_4` (constructions des niveaux de ville), `RK_REPERES` (empties `DRAPEAU_*`, `PONTON`).
- **Couleur** : attribut « Col » (couleur par sommet, valeurs linéaires) lu par le matériau commun `RK_Peint`. Un modèle importé avec des **textures peintes** doit être converti : cuisson de la couleur dans « Col » (densité de maillage suffisante) — la 3D du jeu ne lit pas encore de textures.
- **Contour** : rester à l'intérieur du contour de côte (`islands.json`) ; un débord (tête de Zunesha, navire) est permis s'il ne recouvre pas une île voisine.
- **Budgets** : glTF lod0 ≤ ~90 k triangles, lod1 ≈ 25 %, lod2 ≈ 6 % ; WebP l3 ≤ 500 Ko.

## Intégrer un modèle d'artiste ou généré (Hyper3D/Rodin, etc.)

1. Déposer le fichier (`.glb`, `.fbx`, `.obj` ou `.blend`) dans `blender/imports/<île>/`.
2. Dans Blender : l'importer, le mettre à l'échelle du jeu, le poser à l'emplacement du monument, le ranger dans `RK_DECOR`.
3. Nettoyer : réduire les polygones (modificateur Decimate), supprimer l'intérieur caché, reprendre les couleurs dans la palette de l'île (cuisson vers « Col »).
4. Lancer `export_island.py <île>` puis `pack_for_game.py`.

Les scripts `build_*.py` régénèrent une scène procédurale ; une scène retouchée à la main doit être **enregistrée sous un autre nom** ou les scripts doivent être adaptés pour ne pas l'écraser.
