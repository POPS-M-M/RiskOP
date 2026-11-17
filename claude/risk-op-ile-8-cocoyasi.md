# Cocoyasi — île 8 · reprise sur maceo · validation en attente

Source de production : `essai/ile-cocoyasi`, commit `dee811bfe1a2b13aa48969f6b477fb17cda509ab`. Dernière base explicitement validée : Syrup `6427276c9a998d887f15155bbf55da159e1452b4`. La branche de livraison est exclusivement `maceo`, conformément à l’instruction directe de l’utilisateur.

## Canon et interprétations

La fiche `sources/art/data/fiches/cocoyasi.json` conserve ses champs canoniques, références datées du 16 novembre et distinctions [C], [C?], [I]. Relief, cours balinaises, rizières en terrasses, temple et répartition des villages sont des interprétations de représentation. Les éléments confirmés et les exclusions sont détaillés dans cette fiche. Le moulin reste [C?] ; aucune validation canonique nouvelle n’est affirmée.

## Sept étapes : origine et contrôles de reprise

0. Dépôt, branche `maceo`, procédure officielle et fiche Syrup lus. L’arbre source de Cocoyasi conserve le code et les sept îles de Syrup ; les variations des autres branches qui changent la géographie ne sont pas importées.
1. Fiche canonique existante reprise, sans inventer de nouvelles sources ; ajout d’une comparaison visuelle facultative avec Syrup. Les recherches d’origine ne sont pas présentées comme refaites.
2. Plan de masse existant repris et inspecté. Coordonnées, contour, rayon et ponton de la chaîne d’origine conservés.
3. Scène Blender existante reprise sans régénération ; rendus Blender de contrôle déjà présents, inspectés avec la planche. Aucune nouvelle modélisation d’une île suivante.
4. Exports GLB/WebP/PNG existants vérifiés. LOD0 **71 019 triangles**, LOD1 **22 319**, LOD2 **6 086** ; images WebP cumulées **229 708 octets**. Les exports et scènes des sept autres îles restent identiques.
5. Paquet format 2 reconstruit dans une copie de test isolée : huit manifestes et 80 fichiers vérifiés par taille/SHA, zéro rejet. Le build public garde l’empreinte `08e04954f44d2a37882a37b8e60684917bf2f13661512c458951adb060315ebc`.
6. Douze vues de jeu avant/après et huit gros plans recapturés dans Chromium logiciel. La planche est complétée avec Cocoyasi/Syrup à même échelle et inspectée en neuf bandes ; les rendus Cycles réutilisés sont identifiés comme antérieurs. Notre nouveau rendu Three.js dispose d’aperçus distincts.
7. Contrôles du socle reproduits : zéro erreur de page 2.5D/3D, zéro rejet, modèle Blender employé ; **4 739 686 octets GPU instrumentés** pour les trois LOD et conquête **3 ms** dans cette session. Le nouveau rendu emploie également Cocoyasi et ses cartes séparées sol/obstacles pour quarante figurines, sans modifier le modèle.

## Livrables

- Plan : `sources/art/out/cocoyasi/presentation/plan_de_masse.png`.
- Planche : `sources/art/out/cocoyasi/presentation/planche_cocoyasi.jpg`.
- Mesures du socle : `sources/art/out/cocoyasi/presentation/mesures.json`.
- Nouveau rendu et contrôles : `maceo/verification/` et `claude/risk-op-maceo-integration.md`.

## Limites et arrêt

La planche principale documente le socle WebGL historique ; elle n’est pas une capture de notre moteur Three.js. Les rendus Blender et sources documentaires d’origine n’ont pas été recréés lors de cette reprise. Les cartes de hauteur simplifient les obstacles fins. Dans les vues du socle, le badge peut couvrir des terrasses ; les eaux sont statiques et des taches subsistent sous certains bosquets. Aucune cadence de 60 images/s sur matériel standard n’est certifiée.

**Cocoyasi n’est pas marquée validée. Attente de validation explicite de l’utilisateur ; aucune autre île ni publication publique n’est lancée.**

Attribution des ressources reprises : Claude Opus 5.5, session de production `https://claude.ai/code/session_011CXwKJiEKSDVLBZk1i8YuP`.
