"""Marineford — plan de masse (vue de dessus) depuis mf_plan.py : croissant et baie, QG et montagnes, échafaud, place Oris, cloche, parc, damier,
canons, Mur d'encerclement (niveau 4), bâtiments par niveau, badges. → art/out/marineford/presentation/plan_de_masse.png"""
import os, sys, math
sys.path.insert(0, os.path.dirname(__file__))
from PIL import Image, ImageDraw, ImageFont
import mf_plan as P

OUT = os.path.join(P.ART, 'out', 'marineford', 'presentation'); os.makedirs(OUT, exist_ok=True)
F = lambda s, b=False: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans%s.ttf' % ('-Bold' if b else ''), s)
S, N = 16, 35; W = 2 * N * S
im = Image.new('RGB', (W + 560, W), (246, 241, 230)); d = ImageDraw.Draw(im, 'RGBA'); d.rectangle((0, 0, W, W), fill=(50, 100, 150))
Z = {'bord': (140, 150, 162), 'qg': (216, 210, 200), 'montagne': (130, 120, 100), 'place': (236, 230, 218), 'echafaud': (200, 190, 176),
     'parc': (120, 170, 100), 'ville': (190, 140, 118)}
X = lambda v: (v + N) * S
for j in range(4 * N):
    for i in range(4 * N):
        x = -N + (i + .5) / 2; y = -N + (j + .5) / 2; z_ = P.zone(x, y)
        if z_ in ('mer', 'baie'): continue
        c = Z[z_]
        if z_ == 'ville' and P.rue_d(x, y) < .6: c = (224, 214, 200)
        d.rectangle((X(x) - S / 4, X(y) - S / 4, X(x) + S / 4, X(y) + S / 4), fill=c)
LVC = {1: (176, 60, 50), 2: (204, 132, 70), 3: (150, 112, 168), 4: (64, 80, 190)}
for b in P.batiments():
    d.rectangle((X(b['x'] - b['w'] / 2), X(b['y'] - b['d'] / 2), X(b['x'] + b['w'] / 2), X(b['y'] + b['d'] / 2)), fill=LVC[b['niveau']], outline=(40, 30, 20))
for x, y, s, k, lv in P.arbres(): d.ellipse((X(x - .5), X(y - .5), X(x + .5), X(y + .5)), fill=(50, 120, 50), outline=(20, 50, 20))
for x, y, a in P.canons(): d.ellipse((X(x - .45), X(y - .45), X(x + .45), X(y + .45)), fill=(40, 44, 50))
qx, qy = P.QG; tw, td = P.TERRASSE; d.rectangle((X(qx - 4.2), X(qy - 3.2), X(qx + 4.2), X(qy + 3.2)), fill=LVC[1], outline=(40, 30, 20), width=3)
d.ellipse((X(qx - 1.8), X(qy - 1.8), X(qx + 1.8), X(qy + 1.8)), fill=(60, 95, 158), outline=(20, 30, 60), width=3)
for mx, my in P.MONTAGNES: d.ellipse((X(mx - 1), X(my - 1), X(mx + 1), X(my + 1)), fill=LVC[1], outline=(40, 30, 20))
ex, ey = P.ECHAFAUD; d.rectangle((X(ex - 1.2), X(ey - 1.2), X(ex + 1.2), X(ey + 1.2)), fill=LVC[1], outline=(40, 30, 20), width=3)
cx, cy = P.CLOCHE; d.ellipse((X(cx - .7), X(cy - .7), X(cx + .7), X(cy + .7)), fill=(200, 160, 60), outline=(60, 40, 20))
bx, by, br, bg = P.BAIE; d.arc((X(bx - br + .6), X(by - br + .6), X(bx + br - .6), X(by + br - .6)), 180, 360, fill=LVC[4], width=8)
for k in (-1, 0, 1):
    a = -math.pi / 2 + k * .5; x, y = bx + math.cos(a) * br, by + math.sin(a) * br; d.line((X(x), X(y), X(x + math.cos(a + math.pi) * -3), X(y + math.sin(a + math.pi) * -3)), fill=(150, 110, 70), width=10)
lab = [(qx, qy - 4.5, '1'), (P.MONTAGNES[0][0] - 2, P.MONTAGNES[0][1], '2'), (ex + 2.2, ey, '3'), (P.PLACE[0] + 3, P.PLACE[1], '4'), (cx + 1.6, cy, '5'),
       (bx, by + 4, '6'), (12, 2, '7'), (*P.at_coast(math.radians(170), .9), '8'), (bx + br * .7, by - br * .75, '9')]
for x, y, t in lab:
    w = d.textlength(t, font=F(24, True)); d.rounded_rectangle((X(x) - w / 2 - 8, X(y) - 16, X(x) + w / 2 + 8, X(y) + 16), 8, fill=(29, 42, 54)); d.text((X(x) - w / 2, X(y) - 14), t, font=F(24, True), fill=(255, 255, 255))
for (x, y), t in ((P.BADGE3D, '3D'), (P.BADGE25, '2.5D')):
    d.ellipse((X(x - 2.6), X(y - 2.6), X(x + 2.6), X(y + 2.6)), outline=(220, 40, 40), width=4); d.text((X(x) + 44, X(y) - 12), 'badge ' + t, font=F(20, True), fill=(220, 40, 40))
d.text((20, 18), 'N ↑', font=F(36, True), fill=(255, 255, 255))
x0 = W + 30; y = 30
d.text((x0, y), 'MARINEFORD', font=F(40, True), fill=(29, 42, 54)); y += 56
d.text((x0, y), 'Plan de masse (vue de dessus)', font=F(24), fill=(93, 107, 120)); y += 50
for k, t in (('1', 'QG : forteresse et tour-pagode [C]'), ('2', 'Montagnes des 4 coins [C]'), ('3', 'Échafaud au centre [C]'), ('4', 'Place Oris, vide [C]'),
             ('5', 'Cloche Ox [C]'), ('6', 'Baie du croissant, quais [C ; quais I]'), ('7', 'Ville de briques et d\'acier [C ; damier I]'), ('8', 'Canons des bords [C]'),
             ('9', 'Mur d\'encerclement, niveau 4 [C ; niveau I]')):
    d.rounded_rectangle((x0, y, x0 + 46, y + 32), 8, fill=(29, 42, 54)); d.text((x0 + 23 - d.textlength(k, font=F(20, True)) / 2, y + 4), k, font=F(20, True), fill=(255, 255, 255))
    d.text((x0 + 58, y + 3), t, font=F(19), fill=(29, 42, 54)); y += 40
y += 10; d.text((x0, y), 'Bâtiments par niveau de ville', font=F(24, True), fill=(29, 42, 54)); y += 36
for lv in (1, 2, 3, 4):
    d.rectangle((x0, y, x0 + 32, y + 26), fill=LVC[lv], outline=(60, 40, 30)); d.text((x0 + 44, y), 'niveau %d' % lv, font=F(21), fill=(29, 42, 54)); y += 32
d.ellipse((x0, y + 4, x0 + 30, y + 34), outline=(220, 40, 40), width=4); d.text((x0 + 44, y + 6), "emprise du badge d'armée", font=F(21), fill=(29, 42, 54))
p = os.path.join(OUT, 'plan_de_masse.png'); im.save(p, optimize=True); print('PLAN', p, im.size)
