"""God Valley — plan de masse (vue de dessus) depuis gv_plan.py : montagne coupée et faille, pitons, avancée, pied rocheux, quai, port,
bâtiments par niveau, bateaux, badges. → art/out/god_valley/presentation/plan_de_masse.png"""
import os, sys, math
sys.path.insert(0, os.path.dirname(__file__))
from PIL import Image, ImageDraw, ImageFont
import gv_plan as P

OUT = os.path.join(P.ART, 'out', 'god_valley', 'presentation'); os.makedirs(OUT, exist_ok=True)
F = lambda s, b=False: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans%s.ttf' % ('-Bold' if b else ''), s)
S, N = 16, 34; W = 2 * N * S
im = Image.new('RGB', (W + 600, W), (246, 241, 230)); d = ImageDraw.Draw(im, 'RGBA'); d.rectangle((0, 0, W, W), fill=(50, 110, 160))
Z = {'plage': (216, 196, 154), 'port': (220, 200, 160), 'mont': (214, 128, 62), 'piton': (200, 120, 60), 'avancee': (184, 116, 60),
     'pied': (170, 140, 96), 'palais': (214, 200, 168), 'quai': (226, 222, 210)}
X = lambda v: (v + N) * S
for j in range(4 * N):
    for i in range(4 * N):
        x = -N + (i + .5) / 2; y = -N + (j + .5) / 2; z_ = P.zone(x, y)
        if z_ == 'mer': continue
        c = Z[z_]
        if z_ == 'mont': c = (240, 160, 80) if x < P.MONT[0] else (176, 96, 50)          # lumière de gauche
        if z_ in ('quai', 'pied') and P.rue_d(x, y) < .5: c = (200, 190, 168)
        d.rectangle((X(x) - S / 4, X(y) - S / 4, X(x) + S / 4, X(y) + S / 4), fill=c)
mx, my = P.MONT
d.rectangle((X(mx - P.FAILLE / 2), X(my - 12.6), X(mx + P.FAILLE / 2), X(my + 12.6)), fill=(30, 16, 10))
for px, py, rb, hh, lx, ly, tp in P.PITONS:
    d.ellipse((X(px - rb), X(py - rb), X(px + rb), X(py + rb)), fill=(214, 128, 62), outline=(110, 58, 30), width=4)
    d.text((X(px) - 12, X(py) - 10), '%d' % round(hh), font=F(18, True), fill=(60, 30, 14))
d.text((X(mx - 7), X(my) - 10), '46', font=F(22, True), fill=(60, 30, 14)); d.text((X(mx + 5), X(my) - 10), '46', font=F(22, True), fill=(240, 220, 200))
LVC = {1: (176, 60, 50), 2: (204, 132, 70), 3: (150, 112, 168), 4: (64, 80, 190)}
for b in P.batiments():
    s = b['s']; d.rectangle((X(b['x'] - s), X(b['y'] - s * .8), X(b['x'] + s), X(b['y'] + s * .8)), fill=LVC[b['niveau']], outline=(40, 30, 20))
for x, y, a, k, lv in P.bateaux(): d.ellipse((X(x - .5), X(y - .5), X(x + .5), X(y + .5)), fill=(120, 80, 46) if k == 'barque' else (240, 236, 226), outline=(60, 40, 20))
for x, y, s, k, lv in P.arbres(): d.ellipse((X(x - .35), X(y - .35), X(x + .35), X(y + .35)), fill=(40, 100, 45))
for k in (-1, 0, 1):
    a = P.PORT_A + k * .09; x, y = P.at_coast(a, .95); d.line((X(x), X(y), X(x + math.cos(a) * 3.2), X(y + math.sin(a) * 3.2)), fill=(140, 100, 60), width=10)
lab = [(mx - 8, my - 9, '1'), (mx + 1.4, my + 11.5, '2'), (P.PITONS[0][0], P.PITONS[0][1] - 5.5, '3'), (P.PITONS[1][0] + 3, P.PITONS[1][1] - 4, '4'), (24, 12.5, '5'),
       (*P.at_coast(P.PORT_A, .8), '6'), (16, -21, '7'), (P.PALAIS[0], P.PALAIS[1] - 4.2, '8')]
for x, y, t in lab:
    w = d.textlength(t, font=F(24, True)); d.rounded_rectangle((X(x) - w / 2 - 8, X(y) - 16, X(x) + w / 2 + 8, X(y) + 16), 8, fill=(29, 42, 54)); d.text((X(x) - w / 2, X(y) - 14), t, font=F(24, True), fill=(255, 255, 255))
for (x, y), t in ((P.BADGE3D, '3D'), (P.BADGE25, '2.5D')):
    d.ellipse((X(x - 2.6), X(y - 2.6), X(x + 2.6), X(y + 2.6)), outline=(220, 40, 40), width=4); d.text((X(x) + 44, X(y) - 12), 'badge ' + t, font=F(20, True), fill=(220, 40, 40))
d.text((20, 18), 'N ↑', font=F(36, True), fill=(255, 255, 255))
x0 = W + 30; y = 30
d.text((x0, y), 'GOD VALLEY', font=F(40, True), fill=(29, 42, 54)); y += 56
d.text((x0, y), 'Plan de masse (vue de dessus)', font=F(24), fill=(93, 107, 120)); y += 50
for k, t in (('1', 'Montagne coupée en deux (2 tours de 46) [I, réf.]'), ('2', 'Faille droite jusqu\'à la base [I, réf.]'), ('3', 'Piton moyen à gauche [I, réf.]'),
             ('4', 'Petit piton à droite [I, réf.]'), ('5', 'Avancée rocheuse basse [I, réf.]'), ('6', 'Port [I]'), ('7', 'Quai, bâtiments et bateaux [I, réf.]'), ('8', 'Palais du roi, niveau 4 [C : roi ; I]')):
    d.rounded_rectangle((x0, y, x0 + 46, y + 32), 8, fill=(29, 42, 54)); d.text((x0 + 23 - d.textlength(k, font=F(20, True)) / 2, y + 4), k, font=F(20, True), fill=(255, 255, 255))
    d.text((x0 + 58, y + 3), t, font=F(18), fill=(29, 42, 54)); y += 40
y += 10; d.text((x0, y), 'Bâtiments par niveau de ville', font=F(24, True), fill=(29, 42, 54)); y += 36
for lv in (1, 2, 3, 4):
    d.rectangle((x0, y, x0 + 32, y + 26), fill=LVC[lv], outline=(60, 40, 30)); d.text((x0 + 44, y), 'niveau %d' % lv, font=F(21), fill=(29, 42, 54)); y += 32
d.ellipse((x0, y + 4, x0 + 30, y + 34), outline=(220, 40, 40), width=4); d.text((x0 + 44, y + 6), "emprise du badge d'armée", font=F(21), fill=(29, 42, 54)); y += 40
d.ellipse((x0 + 8, y + 10, x0 + 22, y + 24), fill=(120, 80, 46), outline=(60, 40, 20)); d.text((x0 + 44, y + 6), "barque / petit voilier de bois", font=F(21), fill=(29, 42, 54)); y += 40
d.rectangle((x0, y + 4, x0 + 14, y + 34), fill=(240, 160, 80)); d.rectangle((x0 + 16, y + 4, x0 + 30, y + 34), fill=(176, 96, 50)); d.text((x0 + 44, y + 6), "roche : côté éclairé / côté ombre", font=F(21), fill=(29, 42, 54))
p = os.path.join(OUT, 'plan_de_masse.png'); im.save(p, optimize=True); print('PLAN', p, im.size)
