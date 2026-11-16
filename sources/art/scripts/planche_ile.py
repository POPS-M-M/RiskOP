"""Planche de présentation d'une île (méthode d'industrialisation) : fiche canonique, identité visuelle, plan de masse, captures
réelles du jeu dans les deux modes (vue d'ensemble, gros plans 3D zoom 14 caméra tournée vers chaque quartier), rendus Blender
de contrôle (hors jeu), niveaux de ville 1→4, avant / après, comparaison avec les références (Zou, Whole Cake, Water 7) et
rapport technique.
Usage : python3 planche_ile.py <slug> <dossier des captures de l'île> <dossier des captures de référence> <fiche.json>
  captures de l'île : <p>_25|3d_vue|moyen|proche.png (captures_ile.js), avant_<p>_* (même outil, avant production),
                      zc_<zone>.png (recadrages 3D zoom 14), tech.json (mesures)
  références         : zou_*, wc_*, w7_*, z_zou_3d_centre.png, z_wc_3d_centre.png, z_w7_3d_fontaine.png
  fiche.json         : nom, préfixe, canon, signature, palette, zones (gros plans), vues Blender, différences, limites
→ art/out/<slug>/presentation/planche_<slug>.jpg"""
import os, sys, json
from PIL import Image, ImageDraw, ImageFont
ART = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
slug, CAP, REF, FICHE = sys.argv[1:5]
Q = json.load(open(FICHE, encoding='utf-8')); T = json.load(open(os.path.join(CAP, 'tech.json'), encoding='utf-8'))
OUT = os.path.join(ART, 'out', slug, 'presentation'); os.makedirs(OUT, exist_ok=True)
F = lambda s, b=False: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans%s.ttf' % ('-Bold' if b else ''), s)
PAPER, INK, MUTED, GOLD, SEA, RED = (246, 241, 230), (29, 42, 54), (93, 107, 120), (176, 122, 28), (124, 195, 214), (170, 60, 40)
W_ = 2400; board = Image.new('RGB', (W_, 20000), PAPER); d = ImageDraw.Draw(board); y = 28
JEU, BL = 'JEU', 'BLENDER (hors jeu)'; pre = Q['prefixe']


def txt(x, yy, t, s=20, c=INK, b=False): d.text((x, yy), t, font=F(s, b), fill=c)


def para(lines, s=20, c=INK, dy=29, x=40):
    global y
    for l in lines: txt(x, y, l, s, c); y += dy


def section(t, sub=''):
    global y
    y += 20; d.line((40, y, W_ - 40, y), fill=(210, 200, 180), width=2); y += 16
    txt(40, y, t, 32, INK, True)
    if sub: txt(40, y + 44, sub, 19, MUTED)
    y += 92 if sub else 56


def img(p, w, crop=None):
    im = p if isinstance(p, Image.Image) else Image.open(p).convert('RGB')
    if crop: im = im.crop(crop)
    return im.resize((w, int(im.height * w / im.width)), Image.LANCZOS)


def row(items, w, gap=20, x0=40):
    global y
    h = 0; x = x0
    for it in items:
        p, cap = it[0], it[1]; col = it[2] if len(it) > 2 else INK; crop = it[3] if len(it) > 3 else None
        im = img(p, w, crop); txt(x, y, cap, 21, col, True); board.paste(im, (x, y + 32)); h = max(h, im.height + 32); x += w + gap
    y += h + 26


C = lambda n: os.path.join(CAP, n); R_ = lambda n: os.path.join(REF, n); V = lambda n: os.path.join(OUT, 'vue_%s.png' % n)
CR25, CR3 = (560, 380, 1500, 880), (380, 190, 1660, 1000)
I25, I3 = tuple(Q.get('crop25', CR25)), tuple(Q.get('crop3', CR3))   # recadrage des captures de l'île (îles au bord de la carte)

txt(40, y, '%s — île %s · planche de présentation' % (Q['nom'].upper(), Q['numero']), 54, INK, True); y += 72
para(["Méthode « une île = 7 étapes, puis arrêt » : fiche canonique · identité et plan de masse · modélisation · exports 2.5D/3D · intégration test · planche · vérifications.",
      "« JEU » = capture réelle de la copie de test (écran 1400×860 ×2, rendu WebGL logiciel) · « BLENDER » = rendu de contrôle hors jeu, pour juger les détails."], 21, MUTED)

# ---------------------------------------------------------------- 1. fiche canonique et identité
section('1 · Fiche canonique et identité visuelle', '[C] canon confirmé par une source citée · [C?] canon de mémoire, à vérifier · [I] interprétation')
y0 = y
for l in Q['canon']: txt(40, y, l, 20, INK if l.startswith('[C]') else (RED if l.startswith('[C?]') else MUTED)); y += 29
y += 10; y0 = y; txt(40, y, 'Éléments signature (lisibles à distance)', 24, INK, True); y += 36
for k, l in enumerate(Q['signature']): txt(40, y, '%d. %s' % (k + 1, l), 20); y += 29
ya = y; y = y0; x = 1100; txt(x, y, 'Palette', 24, INK, True); y += 38
for nm, hexs in Q['palette']:
    txt(x, y + 6, nm, 19, MUTED)
    for k, h in enumerate(hexs):
        c = tuple(int(h[i:i + 2], 16) for i in (1, 3, 5)); d.rounded_rectangle((x + 230 + k * 64, y, x + 284 + k * 64, y + 40), 6, fill=c, outline=(120, 110, 100))
    y += 52
y = max(ya, y) + 10

# ---------------------------------------------------------------- 2. plan de masse
section('2 · Plan de masse', "Sur le contour réel de l'île dans le jeu (coordonnées, zones de clic et hitboxes inchangées)")
row([(os.path.join(OUT, 'plan_de_masse.png'), 'Plan de masse : zones, rues, monuments, bâtiments par niveau de ville, emprise du badge du jeu')], 1600)

# ---------------------------------------------------------------- 3. vue générale
section('3 · Vue générale', "Dans le jeu au zoom d'ensemble et au zoom maximal du mode 2.5D · à droite, le rendu Blender de contrôle")
row([(C('%s_25_proche.png' % pre), JEU + ' · 2.5D · zoom 3,5 (maximum)', INK, I25), (C('%s_3d_moyen.png' % pre), JEU + ' · 3D · zoom 5', INK, I3), (V('generale'), BL + ' · vue générale', GOLD)], 760)
row([(C('%s_3d_proche.png' % pre), JEU + ' · 3D · zoom 9', INK, (300, 120, 1700, 1010)), (C('zc_%s.png' % Q['zones'][0][0]), JEU + ' · 3D · zoom 14 · ' + Q['zones'][0][1])], 1150)

# ---------------------------------------------------------------- 4. gros plans
section('4 · Gros plans des quartiers et des monuments', "JEU : 3D zoom 14 (maximum 18), caméra tournée vers chaque zone comme avec Q/E, recadrage sans retouche · BLENDER : caméra rapprochée")
zs = Q['zones'][1:]
for k in range(0, len(zs), 2):
    row([(C('zc_%s.png' % z[0]), JEU + ' · ' + z[1]) for z in zs[k:k + 2]], 1150)
vb = Q['vues_blender']
for k in range(0, len(vb), 2):
    row([(V(v[0]), BL + ' · ' + v[1], GOLD) for v in vb[k:k + 2]], 1150)

# ---------------------------------------------------------------- 5. niveaux de ville
section('5 · Niveaux de ville 1 → 4', "Image 2.5D l3 (12 px/unité) + calques de ville du jeu, cumulés")
base = Image.open(os.path.join(ART, 'out', slug, 'l3.png')).convert('RGBA'); bb = base.getbbox(); cum = base.copy(); ims = []
for lv in (1, 2, 3, 4):
    pv = os.path.join(ART, 'out', slug, 'ville%d.png' % lv)
    if lv > 1 and os.path.exists(pv): cum.alpha_composite(Image.open(pv).convert('RGBA'))
    bg = Image.new('RGB', cum.size, SEA); bg.paste(cum, (0, 0), cum); ims.append(bg.crop(bb))
row([(im, 'Niveau %d · %s' % (k + 1, Q['niveaux'][k]), GOLD if k == 3 else INK) for k, im in enumerate(ims)], 560)

# ---------------------------------------------------------------- 6. avant / après
section('6 · Avant / après dans le jeu', "Même partie, mêmes réglages de caméra")
row([(C('avant_%s_3d_proche.png' % pre), JEU + ' · 3D zoom 9 · avant', MUTED, (300, 120, 1700, 1010)), (C('%s_3d_proche.png' % pre), JEU + ' · 3D zoom 9 · après', GOLD, (300, 120, 1700, 1010))], 1150)
row([(C('avant_%s_25_proche.png' % pre), JEU + ' · 2.5D zoom 3,5 · avant', MUTED, I25), (C('%s_25_proche.png' % pre), JEU + ' · 2.5D zoom 3,5 · après', GOLD, I25)], 1150)

# ---------------------------------------------------------------- 7. comparaison avec les références
section('7 · Comparaison avec les références (même zoom, mêmes réglages)', "Zou (organique), Whole Cake (fantaisie), Water 7 (ville architecturée) et l'île présentée")
row([(R_('z_zou_3d_centre.png'), 'Zou · 3D zoom 14'), (R_('z_wc_3d_centre.png'), 'Whole Cake · 3D zoom 14'), (R_('z_w7_3d_fontaine.png'), 'Water 7 · 3D zoom 14'), (C('z_%s_3d_%s.png' % (pre, Q['zones'][0][0])), Q['nom'] + ' · 3D zoom 14', GOLD)], 565)
row([(R_('zou_3d_moyen.png'), 'Zou · 3D zoom 5', INK, CR3), (R_('wc_3d_moyen.png'), 'Whole Cake · 3D zoom 5', INK, CR3), (R_('w7_3d_moyen.png'), 'Water 7 · 3D zoom 5', INK, CR3), (C('%s_3d_moyen.png' % pre), Q['nom'] + ' · 3D zoom 5', GOLD, I3)], 565)
row([(R_('zou_25_proche.png'), 'Zou · 2.5D zoom 3,5', INK, CR25), (R_('wc_25_proche.png'), 'Whole Cake · 2.5D zoom 3,5', INK, CR25), (R_('w7_25_proche.png'), 'Water 7 · 2.5D zoom 3,5', INK, CR25), (C('%s_25_proche.png' % pre), Q['nom'] + ' · 2.5D zoom 3,5', GOLD, I25)], 565)
x = 40; txt(40, y, 'Rendus 2.5D au même nombre de pixels par unité (l2 = 6 px/unité)', 21, INK, True); y += 32
for nm, s_ in (('Zou', 'zou'), ('Whole Cake', 'whole_cake'), ('Water 7', 'water_7'), (Q['nom'], slug)):
    im = Image.open(os.path.join(ART, 'out', s_, 'l2.png')).convert('RGBA'); im = im.crop(im.getbbox())
    bg = Image.new('RGB', (im.width + 40, 520), SEA); bg.paste(im, (20, 520 - im.height - 20), im); board.paste(bg, (x, y + 30)); txt(x, y, nm, 21, GOLD if s_ == slug else INK, True); x += bg.width + 24
y += 30 + 520 + 26
txt(40, y, 'Différences visibles avec %s (même famille de kit)' % Q['voisine'], 24, INK, True); y += 36
for l in Q['differences']: txt(40, y, '• ' + l, 20); y += 29

# ---------------------------------------------------------------- 8. les deux modes
section('8 · Captures dans les deux modes', "Vue d'ensemble, zoom moyen, zoom proche (2.5D : 1,6 / 2,6 / 3,5 · 3D : 2,2 / 5 / 9)")
for mode, t in (('25', '2.5D'), ('3d', '3D')):
    row([(C('%s_%s_%s.png' % (pre, mode, v)), '%s · %s · %s' % (JEU, t, v)) for v in ('vue', 'moyen', 'proche')], 760)

# ---------------------------------------------------------------- 9. rapport technique
section('9 · Vérifications techniques', "Mesures de cet environnement (CPU, rendu WebGL logiciel) : ordres de grandeur, pas des mesures sur ta machine")
cols = T['colonnes']; cw = [560] + [420] * len(cols)
for k, h in enumerate([''] + cols): txt(40 + sum(cw[:k]), y, h, 21, GOLD if k == len(cols) else INK, True)
y += 34
for lab, vals in T['tableau']:
    for k, v in enumerate([lab] + vals): txt(40 + sum(cw[:k]), y, str(v), 19, INK if k else MUTED, k == len(cols))
    y += 28
y += 14
for l in T['verifs']: txt(40, y, '✔ ' + l, 19); y += 28
y += 10; txt(40, y, 'Limites', 24, RED, True); y += 36
for l in Q['limites']: txt(40, y, '• ' + l, 19); y += 28
y += 10; txt(40, y, 'Sources', 24, INK, True); y += 36
for l in Q['sources']: txt(40, y, l, 18, MUTED); y += 27
y += 30
board = board.crop((0, 0, W_, y)); p = os.path.join(OUT, 'planche_%s.jpg' % slug); board.save(p, quality=88, optimize=True)
print('PLANCHE', p, board.size)
