# Historique des mesures (copie de test, branche locale `essai/etape0-mesure`)

Chaque étape du plan de correction (`risk-op-plan-correction-blender.md`) ajoute ici un dossier daté contenant les sorties brutes du banc ⏱. **On ne réécrit jamais un dossier existant** : on ajoute le suivant.

## Références
| Dossier | Version mesurée | Environnement |
|---|---|---|
| `2026-11-15_etape0/reference_A_avant_etape0.txt`, `reference_B_…` | commit `8d03df9` : prototype Blender **avant** l'instrumentation (banc d'origine), deux passages | Chromium sans interface, rendu logiciel (SwiftShader), 1000×640, devicePixelRatio 1, `Math.random` à graine fixe |
| `2026-11-15_etape0/etape0_banc_complet.txt` / `.json` | étape 0 (instrumentation) | idem |
| `2026-11-15_etape1_P4/` | étape 1 (P4, versionnage du cache), branche `essai/etape1-cache` | idem ; comparée à `2440e51` |
| *(provisoire)* | les relevés sur la machine du joueur n'ont pas été faits : **ces mesures en rendu logiciel ne représentent pas les performances réelles de sa machine** | — |

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

## Tests du versionnage (étape 1, P4) — `outils/cache/`
```
python3 art/scripts/pack_for_game.py <travail>/v2b64 --b64      # format 2, glTF en base64 (artefact)
python3 art/scripts/pack_for_game.py <travail>/v2bin            # format 2, glTF binaires (hébergement statique)
python3 art/scripts/pack_for_game.py <travail>/v1 --b64 --format1   # ancien format (compatibilité)
cp dist/essai_test.html <travail>/ ; python3 tests/mesures/outils/cache/preparer_scenarios.py <travail>
node tests/mesures/outils/cache/t_cache.js <travail>/sc         # 8 scénarios : normal, octet changé, manifeste modifié, version incohérente, ancien format, fichier absent, fichier non déclaré
node tests/mesures/outils/cache/t_maj.js <travail> v1|v2        # mise à jour avec un hébergeur qui met en cache 10 min (serveur.py) ; attend <travail>/maj/art1 et art2 (copies de art/ : état 1 et état 2 modifié)
```
