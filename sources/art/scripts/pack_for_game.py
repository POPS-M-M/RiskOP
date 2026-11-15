"""Copie les sorties de la chaîne Blender à côté de la page du jeu (dossier iles/) et écrit l'index.
Usage : python3 art/scripts/pack_for_game.py [dossier_cible]   (défaut : dist/)
Seuls les fichiers utiles au jeu sont copiés (WebP, GLB, manifeste) ; les PNG maîtres restent dans art/out/.
"""
import os, sys, json, shutil
ART = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
args = [a for a in sys.argv[1:] if not a.startswith('--')]; B64 = '--b64' in sys.argv   # --b64 : copie .glb en .glb.txt (base64) pour les hébergeurs sans type glTF
dest = os.path.abspath(args[0] if args else os.path.join(ART, '..', 'dist'))
NAMES = {'zou': 'Zou', 'whole_cake': 'Whole Cake'}
idx = {}; total = 0
for slug, name in NAMES.items():
    src = os.path.join(ART, 'out', slug)
    if not os.path.exists(os.path.join(src, 'manifest.json')): continue
    d = os.path.join(dest, 'iles', slug); os.makedirs(d, exist_ok=True)
    for f in os.listdir(src):
        if f.endswith('.glb') and B64:
            import base64; open(os.path.join(d, f + '.txt'), 'w').write(base64.b64encode(open(os.path.join(src, f), 'rb').read()).decode()); total += os.path.getsize(os.path.join(d, f + '.txt'))
        elif f.endswith(('.webp', '.glb')) or f == 'manifest.json':
            shutil.copy2(os.path.join(src, f), os.path.join(d, f)); total += os.path.getsize(os.path.join(d, f))
    idx[name] = slug
json.dump(idx, open(os.path.join(dest, 'iles', 'index.json'), 'w'), ensure_ascii=False)
print('iles copiées :', idx, round(total / 1048576, 2), 'Mo →', dest)
