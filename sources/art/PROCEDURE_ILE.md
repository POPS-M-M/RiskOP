# RISK OP — Procédure de production d'une île Blender (à redonner tel quel à Claude)

> **Consigne à copier-coller** : « Produis l'île suivante de RISK OP en suivant exactement la procédure `sources/art/PROCEDURE_ILE.md` du dépôt RKS667/RiskOP (copie dans le projet : `claude/risk-op-procedure-ile.md`). Pars de la dernière branche d'île validée. Arrête-toi après la planche et attends ma validation. »

État au 18/11/2026 : îles faites (Zou, Whole Cake Island, Water 7, Loguetown, Pays des Wa, Alabasta, Archipel des Gecko, Archipel des Konomi, Laugh Tale, Mary Geoise, Elbaph, Egghead, La Ruche, Île des Hommes-Poissons, Marineford, Ohara, God Valley) + socle technique validé + carte 2 des 53 îles validée. Dernière branche validée : `essai/ile-god-valley`.

---

## 0. Règles permanentes (ne jamais déroger)
- Ne pas mentir, ne pas flatter, toujours sourcer.
- **Ne supprimer aucune fonctionnalité** sans justification et sans autorisation.
- **Conserver** les règles du jeu, les coordonnées stratégiques, le contour des îles, les zones de clic, les sauvegardes et les mécaniques.
- **Branches isolées** : une branche par île, `essai/ile-<slug>`, créée depuis la dernière île validée. **Aucun merge dans `main`, aucune modification de `gh-pages`, aucun déploiement public** sans autorisation explicite.
- **Les nouvelles îles restent privées** : ne pas publier la page d'essai (artefact) sans demande explicite. On publiera quand toutes les îles seront finies.
- **Canon** : chaque élément est marqué [C] (confirmé par une source citée), [C?] (de mémoire, non vérifié) ou [I] (interprétation). Ne jamais présenter une interprétation comme du canon.
- **Exclus** : personnages, logos, emblèmes, navires de pirates identifiables, animaux identifiables, copies d'images ou de décors officiels.
- **Qualité avant vitesse.** Une île à la fois. Pendant l'attente de validation, seulement la préparation documentaire des îles suivantes.
- **Contre la répétition** : relief propre, au moins 2 monuments propres, architecture différente de l'île du même kit la plus proche (changer les couleurs ne compte pas), comparaison côte à côte sur la planche.
- **Budget par île** : lod0 ≤ 90 000 triangles ; mémoire graphique ≤ 10 Mo ; images 2.5D ≤ 300 Ko ; conquête 3D sans gel.
- Le build public `dist/risk_op.html` doit rester **identique** (sha256 `d7756047…` depuis la carte 2 des 53 îles, validée le 16/11/2026) sauf modification autorisée et justifiée.
- Commit et push réguliers sur la branche de l'île (messages en français, lignes d'attribution).

## 1. Mise en place
```bash
# dépôt : /home/claude/riskop-essai (worktree), sources dans sources/
cd /home/claude/riskop-essai/sources
git fetch -q && git checkout -q essai/ile-<derniere-validee> && git checkout -q -b essai/ile-<slug> && git push -q -u origin essai/ile-<slug>
```
Ordre (demande de l'utilisateur, 16/11/2026) : celui de sa liste de 53 îles (« Top 1 à 53 »), qui est aussi l'ordre de `I` dans `art/data/carte/carte_canon.py`, en sautant les îles déjà faites (Pays des Wa, Alabasta, Water 7, Loguetown, Archipel des Konomi, Archipel des Gecko) et les prototypes Zou et Whole Cake Island (à ne pas modifier). Suite : Laugh Tale, Mary Geoise, Elbaph, Egghead, La Ruche, Île des Hommes-Poissons, Marineford, Ohara, God Valley, Archipel des Sabaody, Royaume de Kamabakka…
Noms : ceux de la carte 2 (`carte2.json`). Le slug Blender reste court (ex. `'syrup': 'Archipel des Gecko'`).
(Ancien ordre, abandonné : vagues par mer du programme `claude/risk-op-programme-production-iles.md`.)

## 2. Les 7 étapes
### Étape 1 — Fiche canonique (`art/data/fiches/<slug>.json`)
- Chercher les sources (WebSearch, puis WebFetch des pages One Piece Wiki `onepiece.fandom.com/wiki/<Lieu>` et d'un second site si besoin). Noter la date de consultation.
- Champs : `nom`, `numero`, `prefixe` (2 lettres), `voisine` (îles du même kit), `canon` (lignes [C]/[C?]/[I] + exclusions), `signature` (3 à 5 éléments lisibles à distance), `palette` (6 groupes × 3 couleurs), `zones` (8 gros plans `[nom, légende]`), `vues_blender` (6 vues `[nom, légende]`), `niveaux` (4 libellés de niveaux de ville), `differences` (avec l'île du même kit la plus proche), `limites` (rempli à l'étape 7), `sources` (URL + date).
- Modèle : `art/data/fiches/syrup.json`.

### Étape 2 — Plan de masse (`art/scripts/<xx>_plan.py` + `plan_<slug>.py`)
- Lire le contour réel dans `art/data/islands.json` (`cote3d`, `rayon`, `ponton`) ; ne jamais le modifier.
- Le module plan définit : relief `height(x,y)`, eau `water_at`, zones `zone(x,y)`, chemins, monuments (positions), `batiments()` (liste `x,y,ang,w,d,type,niveau,…` avec occupation sans recouvrement), `arbres()`. Repère : x est, y sud, z haut, centre (0,0).
- **Niveaux de ville** : le niveau 1 doit être assez dense pour être lisible au départ ; 2, 3, 4 ajoutent des quartiers ; le niveau 4 porte un élément distinctif.
- Éviter de poser un monument sous le **badge d'armée** : 3D vers (0, −9), 2.5D vers (0, +0,55 × rayon).
- `python3 art/scripts/plan_<slug>.py` → `art/out/<slug>/presentation/plan_de_masse.png` ; le regarder.
- Modèles : `sy_plan.py` / `plan_syrup.py`.

### Étape 3 — Modélisation (`art/scripts/build_<slug>.py`)
- Kit propre si l'architecture est nouvelle (`rk_<kit>.py`, modèles : `rk_anglais.py`, `rk_desert.py`, `rk_wano.py`, `rk_toscane.py`) ; pièces génériques de `rk_port.py` (Frame, box, quad, hip, prism_x, window, barque…).
- Collections : `RK_SOL`, `RK_DECOR` (niveau 1), `RK_VILLE_2..4` ; marques `DRAPEAU_*` et `PONTON` (`C.mark`).
- Éviter les faces superposées (taches noires dans Cycles).
- **Objets 2.5D seulement** : le glTF n'a pas de matériaux (couleurs de sommets opaques). Un volume transparent (bulle de verre…) se marque `obj['rk_25d_seul'] = True` : `export_island.py` le garde dans les images 2.5D (Cycles) mais l'exclut du glTF, des cartes de hauteur et des calques de ville ; en 3D, le figurer autrement (anneaux, bord).
- **Île sans fiche 2.5D d'origine** (nouvelle île de la carte 2, ex. Marineford) : le moteur 2.5D ne lui crée pas d'entrée ; depuis Marineford, `src/essai/73-iles-blender.js` lui donne une fiche sobre au chargement de son paquet (version test seulement, build public inchangé). Vérifier dans la capture 2.5D que l'image Blender s'affiche bien (avant / après différents).
- **Niveau 1 vu en jeu** : vérifier dans la capture 3D que la ville du niveau 1 n'est pas vide (leçon La Ruche, Hommes-Poissons) ; terrain lisse (le relief bruité fait des taches grises dans le rendu 3D).
- `python3 art/scripts/build_<slug>.py` → `art/blender/islands/<slug>.blend`.
- Contrôle rapide : ajouter les vues de l'île dans `render_vues_ile.py` (fonction des vues), puis
  `RK_OUT=<dossier temporaire> python3 art/scripts/render_vues_ile.py <slug> rapide generale <vue>…` et regarder les images. Corriger avant d'exporter.

### Étape 4 — Exports
- Ajouter `'<slug>': '<Nom du jeu>'` dans `NAMES` de `art/scripts/export_island.py` **et** `art/scripts/pack_for_game.py`.
- `python3 art/scripts/export_island.py <slug>` (≈ 2–3 min) → `art/out/<slug>/` (l1/l2/l3, ville2–4, lod0/1/2, manifest).
- Regarder `l3.png` seul puis avec `ville2.png` (lisibilité du niveau 1).

### Étape 5 — Intégration (copie de test, paquet format 2)
```bash
G=<scratch>/g; rm -rf $G; mkdir -p $G
python3 art/scripts/pack_for_game.py $G
node tools/build.js essai-test && cp dist/essai_test.html $G/ && rm -f dist/essai_test.html
git status --short dist     # doit être vide
```
Captures « avant » (sans la nouvelle île) : même chose avec le paquet de la branche précédente, préfixe `avant_<xx>`.

### Étape 6 — Captures et planche
Outils dans `tests/mesures/outils/` (lancer depuis le dossier des captures) :
```bash
node captures_ile.js <G> <port> <xx> "<Nom>"                         # vues 2.5D/3D vue, moyen, proche
node captures_zones.js <G> <port> z_<xx> "<Nom>" zones_<slug>.json 3d  # gros plans zoom 14, caméra tournée
node t_socle.js <G> <port> iles iles.json                             # mesures socle de toutes les îles Blender (ajouter la nouvelle au besoin : iles:Zou,…,<Nom>)
python3 art/scripts/outils_planche.py recadrer <captures> z_<xx>
python3 art/scripts/outils_planche.py tableau <slug> <captures> <île précédente> "<Nom>" "<bâtiments>" "<triangles scène>"
```
- `zones_<slug>.json` : `[[nom, dx, dy, zoom2.5D, zoom3D, hauteur, yaw], …]` (yaw 0 = vue du sud, 1,571 = de l'ouest, −1,571 = de l'est, 3,14 = du nord). Copie dans `tests/mesures/outils/`.
- Rendus complets : `python3 art/scripts/render_vues_ile.py <slug>` (≈ 25–40 min) → `art/out/<slug>/presentation/vue_*.png`.
- Relire `tech.json` (vérifications), remplir `limites` dans la fiche, puis :
  `python3 art/scripts/planche_ile.py <slug> <captures> tests/mesures/references art/data/fiches/<slug>.json`
- Regarder toute la planche (découper en bandes) ; corriger ce qui ne va pas (y compris refaire export et captures).
- Copier `tech.json` vers `art/out/<slug>/presentation/mesures.json`.

### Étape 7 — Vérifications techniques
- 0 erreur de page en 2.5D et 3D ; fichiers vérifiés par empreinte, 0 rejet ; l'île 3D construite depuis Blender (`bx`).
- Autres îles inchangées : `git diff --stat essai/ile-<précédente> HEAD -- art/out/<autres> src tools dist` vide.
- Build public identique : `node tools/build.js && sha256sum dist/risk_op.html` → `d7756047…`.
- Budget respecté ; mesures notées (mémoire graphique, cuisson, conquête).

## 3. Livraison puis arrêt
- Commit + push de tout (sans `__pycache__` ni `.blend1`).
- Doc projet `claude/risk-op-ile-<n>-<slug>.md` (modèle : `claude/risk-op-ile-7-syrup.md`) : branche, commit, ce qui est sourcé, les 7 étapes en chiffres, limites, sources.
- Envoyer la planche et le plan de masse ; résumer honnêtement (ce qui est canon, interprété, limites).
- **S'arrêter et attendre la validation.** Après validation : marquer la doc « ✅ Validée », puis île suivante.
