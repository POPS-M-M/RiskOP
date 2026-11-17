"""Ohara — plan de masse (vue de dessus) depuis oh_plan.py : arbre et couronne, lac, village et ruelles, champs, fermes, port, phare,
bâtiments par niveau, badges. → art/out/ohara/presentation/plan_de_masse.png"""
import os, sys, math
sys.path.insert(0, os.path.dirname(__file__))
from PIL import Image, ImageDraw, ImageFont
import oh_plan as P

OUT = os.path.join(P.ART, 'out', 'ohara', 'presentation'); os.makedirs(OUT, exist_ok=True)
F = lambda s, b=False: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans%s.ttf' % ('-Bold' if b else ''), s)
S, N = 16, 37; W = 2 * N * S
im = Image.new('RGB', (W + 560, W), (246, 241, 230)); d = ImageDraw.Draw(im, 'RGBA'); d.rectangle((0, 0, W, W), fill=(50, 110, 160))
Z = {'plage': (236, 222, 180), 'port': (220, 200, 160), 'lac': (80, 150, 200), 'rive': (150, 190, 120), 'arbre': (120, 100, 70), 'phare': (210, 200, 190),
     'village': (176, 200, 130), 'campagne': (140, 186, 104)}
CH = [(214, 196, 110), (178, 196, 100), (222, 206, 130), (160, 180, 96)]
X = lambda v: (v + N) * S
for j in range(4 * N):
    for i in range(4 * N):
        x = -N + (i + .5) / 2; y = -N + (j + .5) / 2; z_ = P.zone(x, y)
        if z_ == 'mer': continue
        c = Z[z_]
        if z_ == 'campagne' and P.champ(x, y) is not None: c = CH[P.champ(x, y)]
        if z_ == 'village' and P.rue_d(x, y) < .6: c = (226, 214, 180)
        d.rectangle((X(x) - S / 4, X(y) - S / 4, X(x) + S / 4, X(y) + S / 4), fill=c)
ax, ay, ar, ah = P.ARBRE; d.ellipse((X(ax - P.COURONNE), X(ay - P.COURONNE), X(ax + P.COURONNE), X(ay + P.COURONNE)), fill=(70, 140, 60, 70), outline=(40, 100, 40), width=4)
LVC = {1: (176, 60, 50), 2: (204, 132, 70), 3: (150, 112, 168), 4: (64, 80, 190)}
for b in P.batiments():
    s = max(b['w'], b['d']) / 2; d.rectangle((X(b['x'] - s), X(b['y'] - s * .8), X(b['x'] + s), X(b['y'] + s * .8)), fill=LVC[b['niveau']], outline=(40, 30, 20))
for x, y, s, k, lv in P.arbres(): d.ellipse((X(x - .45), X(y - .45), X(x + .45), X(y + .45)), fill=(40, 110, 50))
d.ellipse((X(ax - ar), X(ay - ar), X(ax + ar), X(ay + ar)), fill=(110, 80, 50), outline=(50, 30, 20), width=3)
px, py = P.at_coast(*P.PHARE); d.ellipse((X(px - 1), X(py - 1), X(px + 1), X(py + 1)), fill=LVC[4], outline=(40, 30, 20), width=3)
for k in (-1, 0, 1):
    a = P.PORT_A + k * .1; x, y = P.at_coast(a, .95); d.line((X(x), X(y), X(x + math.cos(a) * 3.2), X(y + math.sin(a) * 3.2)), fill=(140, 100, 60), width=10)
lab = [(ax, ay - 2, '1'), (ax + 2.2, ay + 3.6, '2'), (P.LAC[0], P.LAC[1], '3'), (-9, 6, '4'), (*P.at_coast(P.PORT_A, .78), '5'), (-20, -10, '6'), (px - 2, py + 1.5, '7')]
for x, y, t in lab:
    w = d.textlength(t, font=F(24, True)); d.rounded_rectangle((X(x) - w / 2 - 8, X(y) - 16, X(x) + w / 2 + 8, X(y) + 16), 8, fill=(29, 42, 54)); d.text((X(x) - w / 2, X(y) - 14), t, font=F(24, True), fill=(255, 255, 255))
for (x, y), t in ((P.BADGE3D, '3D'), (P.BADGE25, '2.5D')):
    d.ellipse((X(x - 2.6), X(y - 2.6), X(x + 2.6), X(y + 2.6)), outline=(220, 40, 40), width=4); d.text((X(x) + 44, X(y) - 12), 'badge ' + t, font=F(20, True), fill=(220, 40, 40))
d.text((20, 18), 'N ↑', font=F(36, True), fill=(255, 255, 255))
x0 = W + 30; y = 30
d.text((x0, y), 'OHARA', font=F(40, True), fill=(29, 42, 54)); y += 56
d.text((x0, y), 'Plan de masse (vue de dessus)', font=F(24), fill=(93, 107, 120)); y += 50
for k, t in (('1', 'Arbre de la Connaissance [C]'), ('2', 'Porte de la bibliothèque [C ; porte I]'), ('3', 'Lac près de l\'arbre [C]'),
             ('4', 'Village autour de l\'arbre [C ; ruelles I]'), ('5', 'Petit port [I]'), ('6', 'Champs et fermes [I]'), ('7', 'Phare, niveau 4 [I]')):
    d.rounded_rectangle((x0, y, x0 + 46, y + 32), 8, fill=(29, 42, 54)); d.text((x0 + 23 - d.textlength(k, font=F(20, True)) / 2, y + 4), k, font=F(20, True), fill=(255, 255, 255))
    d.text((x0 + 58, y + 3), t, font=F(19), fill=(29, 42, 54)); y += 40
y += 10; d.text((x0, y), 'Bâtiments par niveau de ville', font=F(24, True), fill=(29, 42, 54)); y += 36
for lv in (1, 2, 3, 4):
    d.rectangle((x0, y, x0 + 32, y + 26), fill=LVC[lv], outline=(60, 40, 30)); d.text((x0 + 44, y), 'niveau %d' % lv, font=F(21), fill=(29, 42, 54)); y += 32
d.ellipse((x0, y + 4, x0 + 30, y + 34), outline=(220, 40, 40), width=4); d.text((x0 + 44, y + 6), "emprise du badge d'armée", font=F(21), fill=(29, 42, 54)); y += 40
d.ellipse((x0, y + 4, x0 + 30, y + 34), outline=(40, 100, 40), width=4); d.text((x0 + 44, y + 6), "couronne de l'arbre", font=F(21), fill=(29, 42, 54))
p = os.path.join(OUT, 'plan_de_masse.png'); im.save(p, optimize=True); print('PLAN', p, im.size)
