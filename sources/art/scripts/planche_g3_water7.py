"""Water 7 — planche G3 (version détaillée) : captures réelles dans le jeu (2.5D et 3D), gros plans, niveaux de ville,
comparaison à Zou et Whole Cake, rendus Blender de contrôle (hors jeu) et rapport technique.
Usage : python3 planche_g3_water7.py <dossier des captures>   → art/out/water_7/presentation/G3_version_detaillee.png
Captures attendues (copie de test, écran 1400×860 ×2) :
  w7_*, zou_*, wc_*          : t_shots.js  (modes 25 / 3d ; vues vue, moyen, proche)
  z_w7_<mode>_<zone>         : t_zones.js  (gros plans : 2.5D zoom 3,5 = maximum du jeu ; 3D zoom 14, maximum 18)
  z_zou_*_centre, z_wc_*_centre : t_zones.js (même zoom que Water 7)
  tech.json                  : mesures du rapport technique (assemblées par le script de vérification)"""
import os, sys, json
from PIL import Image, ImageDraw, ImageFont
ART = os.path.abspath(os.path.join(os.path.dirname(__file__), '..')); CAP = sys.argv[1]
OUT = os.path.join(ART, 'out', 'water_7', 'presentation'); os.makedirs(OUT, exist_ok=True)
F = lambda s, b=False: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans%s.ttf' % ('-Bold' if b else ''), s)
PAPER, INK, MUTED, GOLD, SEA, RED = (246, 241, 230), (29, 42, 54), (93, 107, 120), (176, 122, 28), (124, 195, 214), (170, 60, 40)
W_ = 2400; board = Image.new('RGB', (W_, 16000), PAPER); d = ImageDraw.Draw(board)
T = json.load(open(os.path.join(CAP, 'tech.json')))
y = 28


def txt(x, yy, t, s=20, c=INK, b=False):
    d.text((x, yy), t, font=F(s, b), fill=c)


def section(t, sub=''):
    global y
    y += 20; d.line((40, y, W_ - 40, y), fill=(210, 200, 180), width=2); y += 16
    txt(40, y, t, 32, INK, True)
    if sub: txt(40, y + 44, sub, 19, MUTED)
    y += 92 if sub else 56


def img(p, w, crop=None):
    im = Image.open(p).convert('RGB')
    if crop: im = im.crop(crop)
    return im.resize((w, int(im.height * w / im.width)), Image.LANCZOS)


def row(items, w, gap=20, x0=40):
    """items : liste (chemin ou Image, légende, couleur, crop) ; colle une rangée et avance y"""
    global y
    h = 0; x = x0
    for it in items:
        p, cap = it[0], it[1]; col = it[2] if len(it) > 2 else INK; crop = it[3] if len(it) > 3 else None
        im = p if isinstance(p, Image.Image) else img(p, w, crop)
        if isinstance(p, Image.Image) and im.width != w: im = im.resize((w, int(im.height * w / im.width)), Image.LANCZOS)
        txt(x, y, cap, 21, col, True); board.paste(im, (x, y + 32)); h = max(h, im.height + 32); x += w + gap
    y += h + 26


C = lambda n: os.path.join(CAP, n)
V = lambda n: os.path.join(OUT, 'vue_%s.png' % n)
JEU, BL = 'JEU', 'BLENDER (hors jeu)'
# zc_<zone>.png : recadrage 1200×780 d'une capture 3D zoom 14 autour du quartier (pixels réels, sans retouche) ; caméra tournée vers le quartier (comme Q/E dans le jeu)

txt(40, y, 'WATER 7 — G3 · Version détaillée', 54, INK, True); y += 70
txt(40, y, "Scène Blender détaillée et kit portuaire réutilisable · passée par toute la chaîne (Cycles 2.5D + glTF 3D) · affichée dans la copie de test du jeu.", 21, MUTED); y += 30
txt(40, y, "Étiquettes : « JEU » = capture réelle de la copie de test (écran 1400×860 ×2, carte sans GPU : rendu logiciel) · « BLENDER » = rendu de contrôle hors jeu, pour juger les détails.", 21, MUTED); y += 30
s = T['scene']
txt(40, y, "Ajustements G1/G2 intégrés : massif de la fontaine décalé de %.1f unités vers le nord · viaduc raccourci de %.0f à %.1f unités ·" % (
    s['decalage_nord'], s['viaduc_avant'], s['viaduc_apres']), 21, GOLD, True); y += 30
txt(40, y, "%d bâtiments : %s." % (s['batiments'], s['detail_bat']), 21, GOLD, True); y += 34
txt(40, y, "Inchangés : coordonnées stratégiques, zones de clic, hitboxes, règles, sauvegardes, fichiers de Zou et Whole Cake (empreintes identiques), build public identique.", 21, INK); y += 30

# ---------------------------------------------------------------- 1. vue générale
section('1 · Vue générale', "Dans le jeu au zoom d'ensemble et au zoom maximal de chaque mode · à droite, le rendu Blender de contrôle")
row([(C('w7_25_vue.png'), JEU + ' · 2.5D · vue d\'ensemble', INK, (300, 0, 1700, 1290)),
     (C('w7_3d_vue.png'), JEU + ' · 3D · vue d\'ensemble', INK, (300, 0, 1700, 1290)),
     (V('generale'), BL + ' · vue générale', GOLD)], 760)
row([(C('w7_25_proche.png'), JEU + ' · 2.5D · zoom 3,5 (maximum du mode)', INK, (560, 380, 1500, 880)),
     (C('w7_3d_moyen.png'), JEU + ' · 3D · zoom 5', INK, (380, 190, 1660, 1000)),
     (C('w7_3d_proche.png'), JEU + ' · 3D · zoom 9', INK, (300, 120, 1700, 1010))], 760)

# ---------------------------------------------------------------- 2. quartiers
section('2 · Gros plan des quartiers', "JEU : 3D zoom 14 (maximum du jeu : 18), caméra tournée vers le quartier comme avec Q/E, recadrage sans retouche · BLENDER : caméra rapprochée")
row([(C('zc_quartiers.png'), JEU + ' · ville haute et moyenne (nord-est)'), (V('canaux'), BL + ' · maisons accolées, ruelles, balcons', GOLD)], 1150)
row([(C('zc_basfonds.png'), JEU + ' · bas quartiers inondés (nord-ouest)'), (V('basfonds'), BL + ' · cabanes sur pilotis, ferraille, épave', GOLD)], 1150)

# ---------------------------------------------------------------- 3. fontaine et terrasses
section('3 · Fontaine et terrasses', "La fontaine reste l'élément dominant ; plateau à colonnade, kiosques à coupole, campaniles, terrasses à balustrades et contreforts")
row([(C('zc_fontaine.png'), JEU + ' · 3D zoom 14'), (V('fontaine'), BL + ' · fontaine, colonnade, terrasses', GOLD)], 1150)

# ---------------------------------------------------------------- 4. canaux et chantiers
section('4 · Canaux et chantiers navals', "Canaux rayonnants en cascade, canaux en anneau, ponts en arc ; chantiers n° 1 à 3 à l'est (cales, coques en construction, grues)")
row([(C('zc_canaux.png'), JEU + ' · canaux (sud-est)'), (C('zc_chantiers.png'), JEU + ' · chantiers (est)')], 1150)
row([(V('chantiers'), BL + ' · chantiers n° 1 à 3', GOLD), (V('port'), BL + ' · port de commerce (sud)', GOLD)], 1150)

# ---------------------------------------------------------------- 5. gare et viaduc
section('5 · Gare et viaduc (raccourci)', "Gare du train des mers à l'ouest, verrière et tour d'horloge ; viaduc raccourci vers Enies Lobby ; train générique (pas la locomotive officielle)")
row([(C('zc_gare.png'), JEU + ' · 3D zoom 14'), (V('gare'), BL + ' · gare, viaduc, train', GOLD)], 1150)
row([(C('zc_port.png'), JEU + ' · port de commerce, 3D zoom 14'), (C('z_w7_25_fontaine.png'), JEU + ' · 2.5D zoom 3,5 (maximum) : même échelle que les autres îles', INK, (700, 450, 1400, 900))], 1150)

# ---------------------------------------------------------------- 6. niveaux de ville
section('6 · Niveaux de ville 1 → 4', "Image 2.5D l3 (12 px/unité) + calques de ville du jeu, cumulés · le niveau 1 garde la silhouette, les niveaux 2 à 4 densifient")
base = Image.open(os.path.join(ART, 'out', 'water_7', 'l3.png')).convert('RGBA'); bb = base.getbbox()
cum = base.copy(); ims = []
for lv in (1, 2, 3, 4):
    if lv > 1: cum.alpha_composite(Image.open(os.path.join(ART, 'out', 'water_7', 'ville%d.png' % lv)).convert('RGBA'))
    bg = Image.new('RGB', cum.size, SEA); bg.paste(cum, (0, 0), cum); ims.append(bg.crop(bb))
row([(im, 'Niveau %d' % (k + 1), GOLD if k == 3 else INK) for k, im in enumerate(ims)], 560)

# ---------------------------------------------------------------- 7. comparaison
section('7 · Comparaison avec Zou et Whole Cake (même zoom, mêmes réglages)', "Identité recherchée : ville portuaire claire et dense, toits bleus / sarcelle / terre cuite, pierre blanche — à l'opposé de la jungle de Zou et du sucre de Whole Cake")
row([(C('z_zou_3d_centre.png'), JEU + ' · Zou · 3D zoom 14'), (C('z_wc_3d_centre.png'), JEU + ' · Whole Cake · 3D zoom 14'), (C('z_w7_3d_fontaine.png'), JEU + ' · Water 7 · 3D zoom 14', GOLD)], 760)
row([(C('zou_3d_moyen.png'), JEU + ' · Zou · 3D zoom 5', INK, (380, 190, 1660, 1000)), (C('wc_3d_moyen.png'), JEU + ' · Whole Cake · 3D zoom 5', INK, (380, 190, 1660, 1000)),
     (C('w7_3d_moyen.png'), JEU + ' · Water 7 · 3D zoom 5', GOLD, (380, 190, 1660, 1000))], 760)
row([(C('zou_25_proche.png'), JEU + ' · Zou · 2.5D zoom 3,5', INK, (560, 380, 1500, 880)), (C('wc_25_proche.png'), JEU + ' · Whole Cake · 2.5D zoom 3,5', INK, (560, 380, 1500, 880)),
     (C('w7_25_proche.png'), JEU + ' · Water 7 · 2.5D zoom 3,5', GOLD, (560, 380, 1500, 880))], 760)
x = 40; yy = y; txt(40, y, 'Rendus 2.5D au même nombre de pixels par unité (l2 = 6 px/unité)', 21, INK, True); y += 32
for nm, slug in (('Zou', 'zou'), ('Whole Cake Island', 'whole_cake'), ('Water 7', 'water_7')):
    im = Image.open(os.path.join(ART, 'out', slug, 'l2.png')).convert('RGBA'); im = im.crop(im.getbbox())
    bg = Image.new('RGB', (im.width + 40, 520), SEA); bg.paste(im, (20, 520 - im.height - 20), im); board.paste(bg, (x, y + 30)); txt(x, y, nm, 21, GOLD if slug == 'water_7' else INK, True); x += bg.width + 30
y += 30 + 520 + 26

# ---------------------------------------------------------------- 8. les deux modes
section('8 · Captures dans les deux modes', "Mêmes réglages pour les deux modes : vue d'ensemble, zoom moyen, zoom proche (2.5D : 1,6 / 2,6 / 3,5 · 3D : 2,2 / 5 / 9)")
for mode, t in (('25', '2.5D'), ('3d', '3D')):
    row([(C('w7_%s_%s.png' % (mode, v)), '%s · %s · %s' % (JEU, t, v), INK) for v in ('vue', 'moyen', 'proche')], 760)

# ---------------------------------------------------------------- 9. rapport technique
section('9 · Rapport technique', "Mesures de cet environnement (CPU, rendu WebGL logiciel) : ordres de grandeur, pas des mesures sur ta machine")
x0, cw = 40, [520, 400, 400, 400]
hdr = ['', 'Zou', 'Whole Cake Island', 'Water 7 (G3)']
for k, h in enumerate(hdr): txt(x0 + sum(cw[:k]), y, h, 21, GOLD if k == 3 else INK, True)
y += 34
for lab, vals in T['tableau']:
    for k, v in enumerate([lab] + vals): txt(x0 + sum(cw[:k]), y, str(v), 19, INK if k else MUTED, k == 3)
    y += 28
y += 14
for line in T['verifs']: txt(40, y, '✔ ' + line, 19, INK); y += 28
y += 10
txt(40, y, 'Canon et interprétations', 24, INK, True); y += 36
for line in T['canon']: txt(40, y, line, 19, INK); y += 28
y += 10
txt(40, y, 'Limites', 24, RED, True); y += 36
for line in T['limites']: txt(40, y, '• ' + line, 19, INK); y += 28
y += 30
board = board.crop((0, 0, W_, y))
p = os.path.join(OUT, 'G3_version_detaillee.jpg'); board.save(p, quality=88, optimize=True)
print('PLANCHE', p, board.size)
