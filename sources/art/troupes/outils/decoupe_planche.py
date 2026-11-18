"""Découpe d'une planche de sprites de troupe (RISK OP) — convention art/troupes/CONVENTION_TROUPES.md.

Usage : python3 -I decoupe_planche.py <dossier de la troupe>
  Le dossier contient source/<planche>.png (jamais modifiée) et poses.json (noms et rôles des poses, écrits à la main après analyse).
  Sorties : sprites/<pose>.png (copie exacte des pixels utiles, transparence d'origine), atlas.png (pixels copiés sans
  rééchantillonnage, marges transparentes de « marge » px, 16 ici, pour que les mipmaps ne mélangent pas deux poses), troupe.json (dimensions, positions, ancres aux pieds, animations),
  apercus/ (planche annotée et animations en GIF pour la validation).

Analyse automatique : composantes connexes de l'alpha (> 0) après dilatation de 6 px (une pose = un bloc), boîte utile au pixel près,
appuis = blocs de pixels opaques dans les 30 rangées du bas (les bottes). Chaque pose de poses.json est rattachée au bloc dont le
centre est le plus proche de son « centre_approx » ; un bloc non nommé ou une pose sans bloc arrête le script.
"""
import hashlib, json, os, sys
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

D = os.path.abspath(sys.argv[1]); P = json.load(open(os.path.join(D, 'poses.json'), encoding='utf-8'))
SRC = os.path.join(D, 'source', P['source']); raw = open(SRC, 'rb').read(); sha = hashlib.sha256(raw).hexdigest()
if P.get('sha256') and P['sha256'] != sha: sys.exit('la planche source a changé : ' + sha)
im = Image.open(SRC); assert im.mode == 'RGBA', im.mode
A = np.array(im); al = A[..., 3]; m = al > 0
lab, n = ndimage.label(ndimage.binary_dilation(m, iterations=6))
blocs = []
for i, sl in enumerate(ndimage.find_objects(lab)):
    sub = m[sl] & (lab[sl] == i + 1); ys, xs = np.nonzero(sub)
    x0, y0 = sl[1].start + xs.min(), sl[0].start + ys.min(); x1, y1 = sl[1].start + xs.max(), sl[0].start + ys.max()
    blocs.append(dict(x=int(x0), y=int(y0), w=int(x1 - x0 + 1), h=int(y1 - y0 + 1), px=int(sub.sum()), lab=i + 1))

def centre(b): return (b['x'] + b['w'] / 2, b['y'] + b['h'] / 2)
pris = {}
for nom, p in P['poses'].items():
    cx, cy = p['centre_approx']; b = min(blocs, key=lambda b: (centre(b)[0] - cx) ** 2 + (centre(b)[1] - cy) ** 2)
    if b['lab'] in pris.values(): sys.exit('deux poses sur le même bloc : ' + nom)
    pris[nom] = b['lab']
libres = [b for b in blocs if b['lab'] not in pris.values()]
if libres: sys.exit('blocs non nommés : %s' % libres)

def appuis(b):
    """bottes posées : blocs opaques des 30 rangées du bas de la boîte (≥ 20 px)"""
    sub = (al[b['y']:b['y'] + b['h'], b['x']:b['x'] + b['w']] > 0) & (lab[b['y']:b['y'] + b['h'], b['x']:b['x'] + b['w']] == b['lab'])
    bas = sub[-30:]; l2, k = ndimage.label(bas); out = []
    for i in range(1, k + 1):
        ys, xs = np.nonzero(l2 == i)
        if len(xs) >= 20: out.append(dict(x0=int(xs.min()), x1=int(xs.max()), bas=int(b['h'] - 30 + ys.max()), px=int(len(xs))))
    return sorted(out, key=lambda q: q['x0'])

os.makedirs(os.path.join(D, 'sprites'), exist_ok=True); os.makedirs(os.path.join(D, 'apercus'), exist_ok=True)
G = P.get('marge', 4); AW, AH = P['atlas']; atlas = Image.new('RGBA', (AW, AH), (0, 0, 0, 0)); ax = ay = G; ligne = 0
out = {'troupe': P['troupe'], 'source': {'fichier': P['source'], 'sha256': sha, 'octets': len(raw), 'taille': list(im.size)},
       'convention': P['convention'], 'images': {}, 'animations': P['animations'], 'ombre': None}
for nom, p in P['poses'].items():
    b = next(q for q in blocs if q['lab'] == pris[nom])
    crop = A[b['y']:b['y'] + b['h'], b['x']:b['x'] + b['w']].copy()
    autre = lab[b['y']:b['y'] + b['h'], b['x']:b['x'] + b['w']] != b['lab']; crop[autre & (crop[..., 3] > 0)] = 0   # pixels d'une pose voisine : aucun ici, contrôlé
    assert not (autre & (A[b['y']:b['y'] + b['h'], b['x']:b['x'] + b['w'], 3] > 0)).any(), nom
    spr = Image.fromarray(crop, 'RGBA'); spr.save(os.path.join(D, 'sprites', nom + '.png'), optimize=True)
    if ax + b['w'] + G > AW: ax = G; ay += ligne + 2 * G; ligne = 0
    if ay + b['h'] + G > AH: sys.exit('atlas trop petit')
    atlas.paste(spr, (ax, ay)); ent = {'planche': [b['x'], b['y'], b['w'], b['h']], 'atlas': [ax, ay, b['w'], b['h']], 'role': p['role'], 'note': p.get('note', '')}
    if p['role'] == 'ombre':
        ent['ancre'] = [b['w'] / 2, b['h'] / 2]; out['ombre'] = nom
    else:
        ap = appuis(b); ent['appuis'] = ap
        if not ap: sys.exit('aucun appui trouvé : ' + nom)
        cx = [(q['x0'] + q['x1']) / 2 for q in ap]; ent['ancre'] = [round(sum(cx) / len(cx), 1), round(sum(q['bas'] for q in ap) / len(ap) + 1, 1)]
    out['images'][nom] = ent; ax += b['w'] + 2 * G; ligne = max(ligne, b['h'])
atlas.save(os.path.join(D, 'atlas.png'), optimize=True)
# contrôle : chaque sprite et sa place dans l'atlas sont identiques, pixel pour pixel, à la région de la planche
for nom, e in out['images'].items():
    x, y, w, h = e['planche']; s = np.array(Image.open(os.path.join(D, 'sprites', nom + '.png')))
    a_ = np.array(atlas)[e['atlas'][1]:e['atlas'][1] + h, e['atlas'][0]:e['atlas'][0] + w]
    assert (s == A[y:y + h, x:x + w]).all() and (a_ == s).all(), nom
assert hashlib.sha256(open(SRC, 'rb').read()).hexdigest() == sha
json.dump(out, open(os.path.join(D, 'troupe.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

# ---- aperçus : planche annotée (boîtes utiles, appuis, ancres) et GIF de chaque animation (ancres alignées, aucune déformation)
an = Image.new('RGBA', im.size, (226, 232, 214, 255)); an.alpha_composite(im); dr = ImageDraw.Draw(an)
for nom, e in out['images'].items():
    x, y, w, h = e['planche']; dr.rectangle([x - 1, y - 1, x + w, y + h], outline=(200, 40, 40, 255))
    dr.text((x, y + h + 3), '%s %dx%d' % (nom, w, h), fill=(20, 20, 20, 255))
    if 'appuis' in e:
        for q in e['appuis']: dr.line([x + q['x0'], y + q['bas'] + 1, x + q['x1'], y + q['bas'] + 1], fill=(30, 90, 220, 255), width=2)
    gx, gy = x + e['ancre'][0], y + e['ancre'][1]; dr.ellipse([gx - 3, gy - 3, gx + 3, gy + 3], fill=(250, 200, 0, 255), outline=(0, 0, 0, 255))
an.convert('RGB').save(os.path.join(D, 'apercus', 'analyse_planche.png'))
CW, CH = 260, 220
for anim, a in out['animations'].items():
    frames = []
    for nom in a['images']:
        e = out['images'][nom]; s = Image.open(os.path.join(D, 'sprites', nom + '.png'))
        f = Image.new('RGBA', (CW, CH), (226, 232, 214, 255)); d2 = ImageDraw.Draw(f)
        d2.line([0, CH - 30, CW, CH - 30], fill=(150, 160, 140, 255)); d2.line([CW // 2, CH - 36, CW // 2, CH - 24], fill=(200, 40, 40, 255))
        f.alpha_composite(s, (int(round(CW / 2 - e['ancre'][0])), int(round(CH - 30 - e['ancre'][1]))))
        d2.text((6, 6), '%s : %s' % (anim, nom), fill=(20, 20, 20, 255)); frames.append(f.convert('P', palette=Image.ADAPTIVE))
    ms = int(1000 / a['ips']) if a.get('ips') else 600
    frames[0].save(os.path.join(D, 'apercus', 'anim_%s.gif' % anim), save_all=True, append_images=frames[1:], duration=ms, loop=0, disposal=2)
print('ok', len(out['images']), 'images ; atlas', atlas.size, '; source', sha[:12])
