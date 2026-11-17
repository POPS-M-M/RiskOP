"""Cocoyasi — plan de masse (vue de dessus) depuis co_plan.py : villages de Cocoyasi et de Gosa, ruines d'Arlong Park et son bassin,
rizières en terrasses, vergers de mandariniers, jungle, plages, falaise, chemins, monuments légendés, bâtiments par niveau, badges.
→ art/out/cocoyasi/presentation/plan_de_masse.png"""
import os, sys, math
sys.path.insert(0, os.path.dirname(__file__))
from PIL import Image, ImageDraw, ImageFont
import co_plan as P

OUT = os.path.join(P.ART, 'out', 'cocoyasi', 'presentation'); os.makedirs(OUT, exist_ok=True)
F = lambda s, b=False: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans%s.ttf' % ('-Bold' if b else ''), s)
S, N = 16, 35; W = 2 * N * S
im = Image.new('RGB', (W + 560, W), (246, 241, 230)); d = ImageDraw.Draw(im); d.rectangle((0, 0, W, W), fill=(88, 150, 186))
Z = {'campagne': (150, 194, 100), 'village': (214, 196, 150), 'gosa': (220, 206, 166), 'jungle': (52, 112, 58), 'rizieres': (176, 210, 96),
     'verger': (96, 150, 64), 'plage': (240, 224, 176), 'falaise': (156, 140, 118), 'arlong': (170, 170, 168)}
X = lambda v: (v + N) * S
for j in range(4 * N):
    for i in range(4 * N):
        x = -N + (i + .5) / 2; y = -N + (j + .5) / 2
        if P.dcoast(x, y) >= 1 and P.bassin_d(x, y) > 2.6: continue
        c = Z.get(P.zone(x, y), (150, 194, 100))
        if P.zone(x, y) == 'rizieres': c = (120, 184, 190) if P.riz_anneau(x, y) % 2 == 0 else (176, 214, 100)
        if P.water_at(x, y) is not None: c = (54, 120, 170)
        elif P.chemin_d(x, y) < .35: c = (200, 176, 130)
        h = P.height(x, y); c = tuple(min(255, int(v * (.86 + h * .025))) for v in c)
        d.rectangle((X(x) - S / 4, X(y) - S / 4, X(x) + S / 4, X(y) + S / 4), fill=c)
LVC = {1: (176, 60, 50), 2: (204, 132, 70), 3: (150, 112, 168), 4: (64, 80, 190)}
for b in P.batiments():
    a = b['ang']; c, s = math.cos(a), math.sin(a); q = []
    for su, sv in ((-1, -1), (1, -1), (1, 1), (-1, 1)):
        u = su * b['w'] / 2; v = sv * b['d'] / 2; q.append((X(b['x'] - s * u + c * v), X(b['y'] + c * u + s * v)))
    d.polygon(q, fill=LVC[b['niveau']], outline=(40, 30, 20))
labels = [(P.VILLAGE[0], P.VILLAGE[1], 1.0, (214, 196, 150), '1'), (P.GOSA[0], P.GOSA[1], 1.0, (220, 206, 166), '2'), (P.ARLONG[0], P.ARLONG[1], 1.2, (170, 170, 168), '3'),
          (P.BASSIN[0], P.BASSIN[1], .9, (54, 120, 170), '4'), (P.COLLINE[0], P.COLLINE[1], 1.0, (176, 210, 96), '5'), (P.VERGERS[0][0], P.VERGERS[0][1], .9, (96, 150, 64), '6'),
          (P.TEMPLE[0], P.TEMPLE[1], .9, (200, 160, 120), '7'), (P.MOULIN[0], P.MOULIN[1], .8, (240, 240, 230), '8')]
fx, fy = P.at_coast(P.FALAISE_A, .9); labels.append((fx, fy, .9, (156, 140, 118), '9'))
qx, qy = P.at_coast(P.QUAI_A, .97); labels.append((qx, qy, .9, (170, 130, 90), '10'))
labels.append((P.JUNGLE[0][0], P.JUNGLE[0][1], 1.0, (52, 112, 58), '11'))
for (x, y, r, col, lab) in labels:
    d.ellipse((X(x - r), X(y - r), X(x + r), X(y + r)), fill=col, outline=(40, 30, 20), width=2)
for (x, y, r, col, lab) in labels:
    w = d.textlength(lab, font=F(24, True)); d.rounded_rectangle((X(x) - w / 2 - 8, X(y) - 16, X(x) + w / 2 + 8, X(y) + 16), 8, fill=(29, 42, 54)); d.text((X(x) - w / 2, X(y) - 14), lab, font=F(24, True), fill=(255, 255, 255))
for (x, y, lab) in ((0, -9.0, '3D'), (0, .55 * P.R, '2.5D')):
    d.ellipse((X(x - 2.6), X(y - 2.6), X(x + 2.6), X(y + 2.6)), outline=(220, 40, 40), width=4); d.text((X(x) + 44, X(y) - 12), 'badge ' + lab, font=F(20, True), fill=(220, 40, 40))
d.text((20, 18), 'N ↑', font=F(36, True), fill=(255, 255, 255))
x0 = W + 30; y = 30
d.text((x0, y), 'COCOYASI', font=F(40, True), fill=(29, 42, 54)); y += 56
d.text((x0, y), 'Plan de masse (vue de dessus)', font=F(24), fill=(93, 107, 120)); y += 50
for k, t in (('1', 'Village de Cocoyasi [C]'), ('2', 'Village de Gosa, reconstruit [C]'), ('3', "Ruines d'Arlong Park, sur la côte [C]"), ('4', "Bassin relié à la mer, portes d'acier [C]"),
             ('5', 'Rizières en terrasses [C : rizières]'), ('6', 'Vergers de mandariniers [C]'), ('7', 'Temple à toits superposés [I]'), ('8', 'Moulin à vent [C?]'),
             ('9', "Falaise qui domine l'océan [C]"), ('10', 'Quai en bois [C]'), ('11', 'Jungle [I]')):
    d.rounded_rectangle((x0, y, x0 + 46, y + 32), 8, fill=(29, 42, 54)); d.text((x0 + 23 - d.textlength(k, font=F(20, True)) / 2, y + 4), k, font=F(20, True), fill=(255, 255, 255))
    d.text((x0 + 58, y + 3), t, font=F(21), fill=(29, 42, 54)); y += 40
y += 10; d.text((x0, y), 'Zones', font=F(24, True), fill=(29, 42, 54)); y += 36
for nm, lab in (('campagne', 'campagne [I]'), ('rizieres', 'rizières [C]'), ('verger', 'mandariniers [C]'), ('jungle', 'jungle [I]'), ('plage', 'plages, palmiers [C]'), ('arlong', 'ruines [C]')):
    d.rectangle((x0, y, x0 + 32, y + 26), fill=Z[nm], outline=(60, 40, 30)); d.text((x0 + 44, y), lab, font=F(21), fill=(29, 42, 54)); y += 32
d.line((x0, y + 13, x0 + 32, y + 13), fill=(200, 176, 130), width=6); d.text((x0 + 44, y), 'chemins [I]', font=F(21), fill=(29, 42, 54)); y += 42
d.text((x0, y), 'Bâtiments par niveau de ville', font=F(24, True), fill=(29, 42, 54)); y += 36
for lv in (1, 2, 3, 4):
    d.rectangle((x0, y, x0 + 32, y + 26), fill=LVC[lv], outline=(60, 40, 30)); d.text((x0 + 44, y), 'niveau %d' % lv, font=F(21), fill=(29, 42, 54)); y += 32
d.ellipse((x0, y + 4, x0 + 30, y + 34), outline=(220, 40, 40), width=4); d.text((x0 + 44, y + 6), "emprise du badge d'armée", font=F(21), fill=(29, 42, 54))
p = os.path.join(OUT, 'plan_de_masse.png'); im.save(p, optimize=True); print('PLAN', p, im.size)
