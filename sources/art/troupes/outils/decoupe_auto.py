"""Découpe de planches de sprites « en vrac » (troupes et commandants) — convention art/troupes/CONVENTION_TROUPES.md, section 13.

Usage : python3 -I decoupe_auto.py <dossier de la troupe>
  Le dossier contient source/ (planche ou images d'animation, jamais modifiées) et poses.json :
    "planche": fichier de source/ ; "zone": [x0,y0,x1,y1] (facultatif, ex. la partie « Left » d'une planche à deux sens) ;
    "dilatation", "alpha_min" : réglage de la détection des blocs (une pose = un bloc de pixels) ;
    "poses": {nom: [cx, cy]} (centre approximatif dans la planche) ou {nom: {"image": "fichier de source/"}} (une image = une pose) ;
    "rect": {nom: [x0,y0,x1,y1]} (facultatif : découpe à la main quand des effets touchent la pose) ;
    "animations": {nom: {"images": [...], "ips": n, "boucle": bool}} ; "ref": pose de référence pour la hauteur ; "echelle": 1 (troupe) ou plus (commandant).
  Les blocs non nommés (effets, icônes, textes) sont ignorés : ils restent dans la planche source mais ne vont pas dans l'atlas.
  Sorties : atlas.webp (sans perte), troupe.json (même format que decoupe_planche.py), apercus/planche.png (poses, boîtes, ancres).
Ancre aux pieds : centre des pixels opaques des 10 rangées du bas de la pose, une rangée sous le dernier pixel.
"""
import hashlib, json, os, sys
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

D = os.path.abspath(sys.argv[1]); P = json.load(open(os.path.join(D, 'poses.json'), encoding='utf-8'))
SRC = os.path.join(D, 'source')
def sha(f): return hashlib.sha256(open(f, 'rb').read()).hexdigest()

crops = {}; info = {}
if P.get('planche'):
    f = os.path.join(SRC, P['planche']); im = Image.open(f).convert('RGBA'); A = np.array(im)
    x0, y0, x1, y1 = P.get('zone') or [0, 0, A.shape[1], A.shape[0]]
    Z = A[y0:y1, x0:x1]; al = Z[..., 3]
    org = (abs(Z[..., 0].astype(int) - 229) < 25) & (abs(Z[..., 1].astype(int) - 152) < 30) & (Z[..., 2] < 60) & (al > 200)   # bandeaux orange des planches à deux sens
    m = (al > P.get('alpha_min', 8)) & ~org
    lab, n = ndimage.label(ndimage.binary_dilation(m, iterations=P.get('dilatation', 6)))
    objs = ndimage.find_objects(lab); blocs = []
    for i, sl in enumerate(objs):
        sub = m[sl] & (lab[sl] == i + 1); ys, xs = np.nonzero(sub)
        if not len(xs): continue
        bx0, by0, bx1, by1 = sl[1].start + xs.min(), sl[0].start + ys.min(), sl[1].start + xs.max(), sl[0].start + ys.max()
        blocs.append(dict(lab=i + 1, x=int(bx0), y=int(by0), w=int(bx1 - bx0 + 1), h=int(by1 - by0 + 1)))
    pris = set()
    for nom, c in P['poses'].items():
        if nom in P.get('rect', {}):
            rx0, ry0, rx1, ry1 = P['rect'][nom]; cr = A[ry0:ry1, rx0:rx1].copy(); cr[org[ry0 - y0:ry1 - y0, rx0 - x0:rx1 - x0]] = 0
            bb = Image.fromarray(cr).getbbox(); cr = cr[bb[1]:bb[3], bb[0]:bb[2]]; crops[nom] = cr; info[nom] = [rx0 + bb[0], ry0 + bb[1], cr.shape[1], cr.shape[0]]; continue
        cx, cy = c[0] - x0, c[1] - y0
        b = min(blocs, key=lambda b: (b['x'] + b['w'] / 2 - cx) ** 2 + (b['y'] + b['h'] / 2 - cy) ** 2)
        if b['lab'] in pris: sys.exit('deux poses sur le même bloc : ' + nom)
        pris.add(b['lab'])
        sl = (slice(b['y'], b['y'] + b['h']), slice(b['x'], b['x'] + b['w']))
        cr = Z[sl].copy(); cr[lab[sl] != b['lab']] = 0   # pixels d'un autre bloc (effet voisin) : transparents
        crops[nom] = cr; info[nom] = [b['x'] + x0, b['y'] + y0, b['w'], b['h']]
    sources = {P['planche']: sha(f)}
else:
    sources = {}
    for nom, c in P['poses'].items():
        f = os.path.join(SRC, c['image']); A = np.array(Image.open(f).convert('RGBA')); bb = Image.fromarray(A).getbbox()
        crops[nom] = A[bb[1]:bb[3], bb[0]:bb[2]].copy(); info[nom] = [bb[0], bb[1], bb[2] - bb[0], bb[3] - bb[1]]; sources[c['image']] = sha(f)

def ancre(cr):
    """pieds du personnage : plus grande composante de pixels pleins (la fumée et les effets détachés ne comptent pas)"""
    op = cr[..., 3] > 200; l, k = ndimage.label(op)
    if k > 1: tailles = ndimage.sum(op, l, range(1, k + 1)); op = l == (int(np.argmax(tailles)) + 1)
    rows = np.nonzero(op.any(1))[0]; bas = rows.max(); bande = op[max(0, bas - 9):bas + 1]
    xs = np.nonzero(bande)[1]; return [round(float(xs.mean()), 1), float(bas + 1)]

utiles = {i for a in P['animations'].values() for i in a['images']}
crops = {k: v for k, v in crops.items() if k in utiles}; info = {k: v for k, v in info.items() if k in utiles}   # poses non animées : hors atlas
# ombre : ellipse douce (aucune ombre n'est prise sur les planches)
ow, oh = 84, 30; yy, xx = np.mgrid[0:oh, 0:ow]; e = ((xx - ow / 2 + .5) / (ow / 2)) ** 2 + ((yy - oh / 2 + .5) / (oh / 2)) ** 2
om = np.zeros((oh, ow, 4), np.uint8); om[..., 3] = np.clip((1 - e) * 1.6, 0, 1) * 110; crops['ombre'] = om; info['ombre'] = None

G = 4; W = 1024; x = y = G; ligne = 0; pos = {}
for nom, cr in sorted(crops.items(), key=lambda kv: -kv[1].shape[0]):
    h, w = cr.shape[:2]
    if x + w + G > W: x = G; y += ligne + 2 * G; ligne = 0
    pos[nom] = [x, y, w, h]; x += w + 2 * G; ligne = max(ligne, h)
H = y + ligne + G; H = 1 << (H - 1).bit_length()
atlas = np.zeros((H, W, 4), np.uint8)
for nom, (x, y, w, h) in pos.items(): atlas[y:y + h, x:x + w] = crops[nom]
Image.fromarray(atlas, 'RGBA').save(os.path.join(D, 'atlas.webp'), lossless=True, quality=100, method=6)

ref = P['ref']; href = crops[ref].shape[0]; ech = P.get('echelle', 1.0)
out = {'troupe': P['troupe'], 'source': {'fichiers': sources, 'zone': P.get('zone')},
       'convention': {'version': 1, 'hauteur_ref_u': 0.54, 'image_ref': ref, 'hauteur_ref_px': round(href / ech, 1), 'regard': 'droite',
                      'note': 'même hauteur de référence que le soldat de la Marine (0,54 u) pour la pose de référence' + (', ×%.2f pour un commandant' % ech if ech != 1 else '')},
       'images': {}, 'animations': P['animations'], 'ombre': 'ombre'}
for nom, (x, y, w, h) in pos.items():
    out['images'][nom] = {'planche': info[nom], 'atlas': [x, y, w, h], 'ancre': ancre(crops[nom]) if nom != 'ombre' else [w / 2, h / 2]}
for a in P['animations'].values():
    for i in a['images']: assert i in out['images'], 'pose inconnue dans une animation : ' + i
json.dump(out, open(os.path.join(D, 'troupe.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

# aperçu : toutes les poses alignées sur leur ancre, avec la ligne du sol
os.makedirs(os.path.join(D, 'apercus'), exist_ok=True)
noms = [n for n in pos if n != 'ombre']; cw = max(crops[n].shape[1] for n in noms) + 20; ch = max(crops[n].shape[0] for n in noms) + 40
cols = 6; rows = (len(noms) + cols - 1) // cols
ap = Image.new('RGBA', (cols * cw, rows * ch), (226, 232, 214, 255)); dr = ImageDraw.Draw(ap)
for k, n in enumerate(noms):
    gx, gy = (k % cols) * cw, (k // cols) * ch; a = out['images'][n]['ancre']; ox, oy = gx + cw // 2 - int(a[0]), gy + ch - 24 - int(a[1])
    ap.alpha_composite(Image.fromarray(crops[n], 'RGBA'), (ox, oy)); dr.line([gx + 4, gy + ch - 24, gx + cw - 4, gy + ch - 24], fill=(120, 60, 40, 255))
    dr.ellipse([ox + a[0] - 3, oy + a[1] - 3, ox + a[0] + 3, oy + a[1] + 3], outline=(220, 30, 30, 255)); dr.text((gx + 4, gy + ch - 18), n, fill=(20, 20, 20, 255))
ap.save(os.path.join(D, 'apercus', 'poses.png'))
print('ok', P['troupe'], len(noms), 'poses, atlas', W, 'x', H, os.path.getsize(os.path.join(D, 'atlas.webp')), 'octets')
