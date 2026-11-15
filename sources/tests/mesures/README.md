# Historique des mesures (copie de test, branche locale `essai/etape0-mesure`)

Chaque étape du plan de correction (`risk-op-plan-correction-blender.md`) ajoute ici un dossier daté contenant les sorties brutes du banc ⏱. **On ne réécrit jamais un dossier existant** : on ajoute le suivant.

## Références
| Dossier | Version mesurée | Environnement |
|---|---|---|
| `2026-11-15_etape0/reference_A_avant_etape0.txt`, `reference_B_…` | commit `8d03df9` : prototype Blender **avant** l'instrumentation (banc d'origine), deux passages | Chromium sans interface, rendu logiciel (SwiftShader), 1000×640, devicePixelRatio 1, `Math.random` à graine fixe |
| `2026-11-15_etape0/etape0_banc_complet.txt` / `.json` | étape 0 (instrumentation) | idem |
| *(à venir)* `…_machine_utilisateur/` | étape 0 sur la machine du joueur | à remplir avec le texte copié depuis ⏱ |

**Bruit de mesure dans cet environnement** : deux passages de la même version diffèrent de 8,5 % en moyenne (jusqu'à 20 %). Un écart plus petit que cela n'est pas significatif ici.

## Rejouer
```
node tools/build.js essai-test            # dist/essai_test.html
# servir dist/ avec le dossier iles/ (copies .glb.txt) puis :
node tests/mesures/outils/t_banc2.js <dossier servi> <port> <sortie>   # banc complet (≈ 5 min en rendu logiciel)
node tests/mesures/outils/t_e0.js <dossier servi> <port>               # exactitude des comptes, gels, interface (3D)
node tests/mesures/outils/t_e0_25.js <dossier servi>                   # niveaux et mémoire 2.5D
node tests/mesures/outils/t_integ.js <public.html> <test.html>         # intégrité : géométrie, grille de clic, sauvegarde
node tests/mesures/outils/t_play.js  <public.html> <test.html>         # partie simulée de 40 tours
```
