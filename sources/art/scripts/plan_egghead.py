"""Egghead — plan de masse (vue de dessus) depuis eg_plan.py : île tropicale, ville du futur en cercles, œuf et nuage (emprise),
tube de verre, usine, pas de tir, jungle, icebergs et tourbillons, bâtiments par niveau, badges. → art/out/egghead/presentation/plan_de_masse.png"""
import os, sys, math
sys.path.insert(0, os.path.dirname(__file__))
from PIL import Image, ImageDraw, ImageFont
import eg_plan as P

OUT = os.path.join(P.ART, 'out', 'egghead', 'presentation'); os.makedirs(OUT, exist_ok=True)
F = lambda s, b=False: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans%s.ttf' % ('-Bold' if b else ''), s)
S, N = 16, 35; W = 2 * N * S
im = Image.new('RGB', (W + 560, W), (246, 241, 230)); d = ImageDraw.Draw(im, 'RGBA'); d.rectangle((0, 0, W, W), fill=(70, 120, 160))
Z = {'campagne': (120, 180, 96), 'ville': (200, 220, 210), 'jungle': (50, 110, 56), 'plage': (240, 226, 180), 'colonne': (236, 240, 246), 'place': (246, 238, 220),
     'usine': (180, 184, 196), 'pas_de_tir': (190, 186, 180)}
X = lambda v: (v + N) * S
for j in range(4 * N):
    for i in range(4 * N):
        x = -N + (i + .5) / 2; y = -N + (j + .5) / 2; z_ = P.zone(x, y)
        if z_ == 'mer': continue
        c = Z[z_]
        if z_ == 'ville' and P.rue_d(x, y) < .5: c = (244, 236, 214)
        d.rectangle((X(x) - S / 4, X(y) - S / 4, X(x) + S / 4, X(y) + S / 4), fill=c)
for x, y, s, k, lv in P.arbres(): d.ellipse((X(x - .4), X(y - .4), X(x + .4), X(y + .4)), fill=(30, 80, 40))
LVC = {1: (176, 60, 50), 2: (204, 132, 70), 3: (150, 112, 168), 4: (64, 80, 190)}
for b in P.batiments():
    s = b['s']; d.ellipse((X(b['x'] - s), X(b['y'] - s), X(b['x'] + s), X(b['y'] + s)), fill=LVC[b['niveau']], outline=(40, 30, 20))
ox, oy, orr, oh, ob = P.OEUF; d.ellipse((X(ox - P.NUAGE[2]), X(oy - P.NUAGE[2]), X(ox + P.NUAGE[2]), X(oy + P.NUAGE[2])), fill=(255, 255, 255, 150), outline=(80, 200, 230), width=5)
d.ellipse((X(ox - orr), X(oy - orr), X(ox + orr), X(oy + orr)), fill=(246, 242, 234, 230), outline=(60, 50, 40), width=3)
(ax, ay), (bx, by) = P.TUBE; d.line((X(ax), X(ay), X(bx), X(by)), fill=(140, 210, 236), width=8)
px, py = P.PAS_DE_TIR; d.rectangle((X(px - 1.2), X(py - 1.2), X(px + 1.2), X(py + 1.2)), fill=LVC[4], outline=(40, 30, 20))
for a, k, s in P.ICEBERGS:
    x, y = P.at_coast(a, k); d.polygon([(X(x - 1.2 * s), X(y)), (X(x), X(y - 1.0 * s)), (X(x + 1.1 * s), X(y + .2)), (X(x), X(y + 1.0 * s))], fill=(255, 255, 255), outline=(120, 170, 200))
for a, k in P.TOURBILLONS:
    x, y = P.at_coast(a, k); d.ellipse((X(x - .9), X(y - .9), X(x + .9), X(y + .9)), outline=(240, 250, 255), width=4)
lab = [(ox, oy, '1'), (P.NUAGE[0] + P.NUAGE[2], P.NUAGE[1], '2'), (ax, ay, '3'), (P.PLACE[0], P.PLACE[1], '4'), (P.USINE[0], P.USINE[1], '5'), (px, py, '6'),
       (P.JUNGLE[0], P.JUNGLE[1], '7'), (*P.at_coast(P.ICEBERGS[0][0], P.ICEBERGS[0][1]), '8'), (*P.at_coast(P.TOURBILLONS[1][0], P.TOURBILLONS[1][1]), '9')]
for x, y, t in lab:
    w = d.textlength(t, font=F(24, True)); d.rounded_rectangle((X(x) - w / 2 - 8, X(y) - 16, X(x) + w / 2 + 8, X(y) + 16), 8, fill=(29, 42, 54)); d.text((X(x) - w / 2, X(y) - 14), t, font=F(24, True), fill=(255, 255, 255))
for (x, y), t in ((P.BADGE3D, '3D'), (P.BADGE25, '2.5D')):
    d.ellipse((X(x - 2.6), X(y - 2.6), X(x + 2.6), X(y + 2.6)), outline=(220, 40, 40), width=4); d.text((X(x) + 44, X(y) - 12), 'badge ' + t, font=F(20, True), fill=(220, 40, 40))
d.text((20, 18), 'N ↑', font=F(36, True), fill=(255, 255, 255))
x0 = W + 30; y = 30
d.text((x0, y), 'EGGHEAD', font=F(40, True), fill=(29, 42, 54)); y += 56
d.text((x0, y), 'Plan de masse (vue de dessus)', font=F(24), fill=(93, 107, 120)); y += 50
for k, t in (('1', 'Œuf géant fendu, laboratoire [C]'), ('2', 'Nuage et anneaux laser [C]'), ('3', 'Tube de verre [C]'), ('4', 'Ville du futur, place [C : ville]'),
             ('5', 'Usine centrale [C]'), ('6', 'Pas de tir, niveau 4 [I]'), ('7', 'Jungle [C : arbres, climat tropical]'), ('8', 'Icebergs [C]'), ('9', 'Colonnes d\'eau chaude [C]')):
    d.rounded_rectangle((x0, y, x0 + 46, y + 32), 8, fill=(29, 42, 54)); d.text((x0 + 23 - d.textlength(k, font=F(20, True)) / 2, y + 4), k, font=F(20, True), fill=(255, 255, 255))
    d.text((x0 + 58, y + 3), t, font=F(19), fill=(29, 42, 54)); y += 40
y += 10; d.text((x0, y), 'Bâtiments par niveau de ville', font=F(24, True), fill=(29, 42, 54)); y += 36
for lv in (1, 2, 3, 4):
    d.rectangle((x0, y, x0 + 32, y + 26), fill=LVC[lv], outline=(60, 40, 30)); d.text((x0 + 44, y), 'niveau %d' % lv, font=F(21), fill=(29, 42, 54)); y += 32
d.ellipse((x0, y + 4, x0 + 30, y + 34), outline=(220, 40, 40), width=4); d.text((x0 + 44, y + 6), "emprise du badge d'armée", font=F(21), fill=(29, 42, 54))
p = os.path.join(OUT, 'plan_de_masse.png'); im.save(p, optimize=True); print('PLAN', p, im.size)
