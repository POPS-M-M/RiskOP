"""Île des Hommes-Poissons — plan de masse (vue de dessus) depuis hp_plan.py : récif, rues, place Gyoncorde, palais Ryugu et sa bulle (emprise),
couloir, quartiers nommés, bâtiments par niveau, badges. → art/out/hommes_poissons/presentation/plan_de_masse.png"""
import os, sys, math
sys.path.insert(0, os.path.dirname(__file__))
from PIL import Image, ImageDraw, ImageFont
import hp_plan as P

OUT = os.path.join(P.ART, 'out', 'hommes_poissons', 'presentation'); os.makedirs(OUT, exist_ok=True)
F = lambda s, b=False: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans%s.ttf' % ('-Bold' if b else ''), s)
S, N = 16, 35; W = 2 * N * S
im = Image.new('RGB', (W + 560, W), (246, 241, 230)); d = ImageDraw.Draw(im, 'RGBA'); d.rectangle((0, 0, W, W), fill=(40, 90, 140))
Z = {'recif': (240, 200, 170), 'recif_haut': (232, 178, 168), 'ville': (246, 226, 206), 'port': (240, 226, 190), 'eau': (90, 170, 210), 'place': (250, 240, 228),
     'dojo': (200, 190, 170), 'usine': (230, 200, 220), 'mall': (220, 210, 240), 'salle': (210, 230, 220), 'gyoverly': (214, 196, 200), 'moulins': (226, 214, 196)}
X = lambda v: (v + N) * S
for j in range(4 * N):
    for i in range(4 * N):
        x = -N + (i + .5) / 2; y = -N + (j + .5) / 2; z_ = P.zone(x, y)
        if z_ == 'mer': continue
        c = Z[z_]
        if z_ in ('ville', 'moulins', 'gyoverly') and P.rue_d(x, y) < .55: c = (252, 248, 236)
        d.rectangle((X(x) - S / 4, X(y) - S / 4, X(x) + S / 4, X(y) + S / 4), fill=c)
d.ellipse((X(-P.coast_r(0) - .5), X(-P.coast_r(0) - .5), X(P.coast_r(0) + .5), X(P.coast_r(0) + .5)), outline=(170, 230, 250), width=6)   # bord de bulle (indicatif)
for x, y, s, k, lv in P.arbres():
    c = {'corail': (230, 90, 120), 'algue': (60, 150, 100), 'eponge': (240, 190, 60)}[k]; d.ellipse((X(x - .35), X(y - .35), X(x + .35), X(y + .35)), fill=c)
LVC = {1: (176, 60, 50), 2: (204, 132, 70), 3: (150, 112, 168), 4: (64, 80, 190)}
for b in P.batiments():
    s = b['s']; d.ellipse((X(b['x'] - s), X(b['y'] - s), X(b['x'] + s), X(b['y'] + s)), fill=LVC[b['niveau']], outline=(40, 30, 20))
for (x, y, r), lv in ((P.USINE + (2.6,), 3), (P.MALL + (2.4,), 2), (P.SALLE + (2.0,), 2), (P.DOJO + (2.2,), 4)):
    d.rectangle((X(x - r), X(y - r), X(x + r), X(y + r)), fill=LVC[lv], outline=(40, 30, 20))
px, py, pr = P.PALAIS; d.ellipse((X(px - pr), X(py - pr), X(px + pr), X(py + pr)), fill=(255, 255, 255, 120), outline=(110, 200, 240), width=5)
d.rectangle((X(px - 3), X(py - 2.2), X(px + 3), X(py + 2.2)), fill=LVC[1], outline=(40, 30, 20))
d.line([(X(x), X(y)) for x, y in P.COULOIR], fill=(140, 210, 236), width=8)
for k in range(4):
    a, b_ = P.CANAL[k], P.CANAL[k + 1]; mx, my = (a[0] + b_[0]) / 2, (a[1] + b_[1]) / 2; d.ellipse((X(mx - .8), X(my - .8), X(mx + .8), X(my + .8)), outline=(90, 60, 30), width=4)
lab = [(px, py - 3.5, '1'), (P.COULOIR[1][0] + 1.5, P.COULOIR[1][1], '2'), (P.PLACE[0], P.PLACE[1], '3'), (*P.at_coast(P.PORT_A, .8), '4'), (P.MOULINS[0], P.MOULINS[1] + 2.5, '5'),
       (P.USINE[0], P.USINE[1], '6'), (P.MALL[0], P.MALL[1], '7'), (P.SALLE[0], P.SALLE[1], '8'), (P.GYOVERLY[0], P.GYOVERLY[1], '9'), (P.CRIQUE[0], P.CRIQUE[1], '10'), (P.DOJO[0], P.DOJO[1], '11')]
for x, y, t in lab:
    w = d.textlength(t, font=F(24, True)); d.rounded_rectangle((X(x) - w / 2 - 8, X(y) - 16, X(x) + w / 2 + 8, X(y) + 16), 8, fill=(29, 42, 54)); d.text((X(x) - w / 2, X(y) - 14), t, font=F(24, True), fill=(255, 255, 255))
for (x, y), t in ((P.BADGE3D, '3D'), (P.BADGE25, '2.5D')):
    d.ellipse((X(x - 2.6), X(y - 2.6), X(x + 2.6), X(y + 2.6)), outline=(220, 40, 40), width=4); d.text((X(x) + 44, X(y) - 12), 'badge ' + t, font=F(20, True), fill=(220, 40, 40))
d.text((20, 18), 'N ↑', font=F(36, True), fill=(255, 255, 255))
x0 = W + 30; y = 30
d.text((x0, y), 'ÎLE DES HOMMES-POISSONS', font=F(32, True), fill=(29, 42, 54)); y += 50
d.text((x0, y), 'Plan de masse (vue de dessus)', font=F(24), fill=(93, 107, 120)); y += 46
for k, t in (('1', 'Palais Ryugu dans sa bulle [C]'), ('2', 'Couloir de liaison [C ; tracé I]'), ('3', 'Place Gyoncorde, au centre [C]'), ('4', 'Coral Hill, ville portuaire [C ; sud I]'),
             ('5', 'Ville des Moulins à eau, nord [C]'), ('6', 'Usine de bonbons, nord-ouest [C]'), ('7', 'Centre commercial, ouest [C]'), ('8', 'Salle de réunion, sud-ouest [C]'),
             ('9', 'Collines Gyoverly [C ; position I]'), ('10', 'Crique des Sirènes [C ; position I]'), ('11', 'Dojo, niveau 4 [C ; aspect I]')):
    d.rounded_rectangle((x0, y, x0 + 46, y + 32), 8, fill=(29, 42, 54)); d.text((x0 + 23 - d.textlength(k, font=F(20, True)) / 2, y + 4), k, font=F(20, True), fill=(255, 255, 255))
    d.text((x0 + 58, y + 3), t, font=F(19), fill=(29, 42, 54)); y += 38
y += 8; d.text((x0, y), 'Bâtiments par niveau de ville', font=F(24, True), fill=(29, 42, 54)); y += 34
for lv in (1, 2, 3, 4):
    d.rectangle((x0, y, x0 + 32, y + 26), fill=LVC[lv], outline=(60, 40, 30)); d.text((x0 + 44, y), 'niveau %d' % lv, font=F(21), fill=(29, 42, 54)); y += 32
d.ellipse((x0, y + 4, x0 + 30, y + 34), outline=(220, 40, 40), width=4); d.text((x0 + 44, y + 6), "emprise du badge d'armée", font=F(21), fill=(29, 42, 54)); y += 40
d.ellipse((x0, y + 4, x0 + 30, y + 34), outline=(110, 200, 240), width=5); d.text((x0 + 44, y + 6), "bulles (bord)", font=F(21), fill=(29, 42, 54))
p = os.path.join(OUT, 'plan_de_masse.png'); im.save(p, optimize=True); print('PLAN', p, im.size)
