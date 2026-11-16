"""Syrup — plan de masse (vue de dessus) depuis sy_plan.py : plateau, falaises, deux pentes et criques, colline et domaine du
manoir, village, forêt, champs et haies, chemins, ruisseau, monuments légendés, bâtiments par niveau, emprise du badge d'armée.
→ art/out/syrup/presentation/plan_de_masse.png"""
import os, sys, math
sys.path.insert(0, os.path.dirname(__file__))
from PIL import Image, ImageDraw, ImageFont
import sy_plan as P

OUT = os.path.join(P.ART, 'out', 'syrup', 'presentation'); os.makedirs(OUT, exist_ok=True)
F = lambda s, b=False: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans%s.ttf' % ('-Bold' if b else ''), s)
S, N = 16, 35; W = 2 * N * S
im = Image.new('RGB', (W + 540, W), (246, 241, 230)); d = ImageDraw.Draw(im); d.rectangle((0, 0, W, W), fill=(88, 150, 186))
Z = {'pres': (150, 190, 104), 'village': (196, 204, 150), 'foret': (74, 120, 62), 'colline': (130, 172, 92), 'domaine': (176, 206, 120),
     'falaise': (150, 140, 124), 'crique': (238, 222, 176)}
X = lambda v: (v + N) * S
for j in range(4 * N):
    for i in range(4 * N):
        x = -N + (i + .5) / 2; y = -N + (j + .5) / 2
        if P.dcoast(x, y) >= 1: continue
        z_ = P.zone(x, y); c = Z.get(z_, (150, 190, 104))
        ch = P.champ_of(x, y)
        if ch is not None: c = [(188, 196, 104), (140, 180, 90), (206, 186, 110), (160, 194, 100)][(ch[0] * 3 + ch[1]) % 4]
        if P.haie_at(x, y): c = (70, 112, 56)
        if P.water_at(x, y) is not None: c = (54, 120, 170)
        elif P.chemin_d(x, y) < .35: c = (200, 176, 130)
        h = P.height(x, y); c = tuple(min(255, int(v * (.84 + h * .03))) for v in c)
        d.rectangle((X(x) - S / 4, X(y) - S / 4, X(x) + S / 4, X(y) + S / 4), fill=c)
LVC = {1: (176, 60, 50), 2: (204, 132, 70), 3: (150, 112, 168), 4: (64, 80, 190)}
for b in P.batiments():
    a = b['ang']; c, s = math.cos(a), math.sin(a); q = []
    for su, sv in ((-1, -1), (1, -1), (1, 1), (-1, 1)):
        u = su * b['w'] / 2; v = sv * b['d'] / 2; q.append((X(b['x'] - s * u + c * v), X(b['y'] + c * u + s * v)))
    d.polygon(q, fill=LVC[b['niveau']], outline=(40, 30, 20))
mx, my = P.MANOIR
d.ellipse((X(mx - P.DOMAINE_R), X(my - P.DOMAINE_R), X(mx + P.DOMAINE_R), X(my + P.DOMAINE_R)), outline=(60, 50, 40), width=3)
labels = [(mx, my, 2.0, (246, 241, 230), '1'), (P.CN[0], P.CN[1], 1.2, (238, 222, 176), '2'), (P.CS[0], P.CS[1], 1.2, (238, 222, 176), '3'),
          (P.MESHI[0], P.MESHI[1], .8, (232, 214, 178), '4'), (P.GREEN[0], P.GREEN[1], 1.0, (176, 206, 120), '5'), (P.CHAPELLE[0], P.CHAPELLE[1], .9, (216, 200, 170), '6'),
          (P.FORET[0][0], P.FORET[0][1], 1.0, (74, 120, 62), '7'), (P.RUISSEAU[-1][0] - 1.5, P.RUISSEAU[-1][1], .9, (54, 120, 170), '8')]
lx, ly = P.at_coast(P.PHARE, .9); labels.append((lx, ly, .8, (64, 80, 190), '9'))
for fx, fy in P.FERMES[:1]: labels.append((fx, fy, .8, (204, 132, 70), '10'))
for (x, y, r, col, lab) in labels:
    d.ellipse((X(x - r), X(y - r), X(x + r), X(y + r)), fill=col, outline=(40, 30, 20), width=2)
for (x, y, r, col, lab) in labels:
    w = d.textlength(lab, font=F(24, True)); d.rounded_rectangle((X(x) - w / 2 - 8, X(y) - 16, X(x) + w / 2 + 8, X(y) + 16), 8, fill=(29, 42, 54)); d.text((X(x) - w / 2, X(y) - 14), lab, font=F(24, True), fill=(255, 255, 255))
for (x, y, lab) in ((0, -9.0, '3D'), (0, .55 * P.R, '2.5D')):
    d.ellipse((X(x - 2.6), X(y - 2.6), X(x + 2.6), X(y + 2.6)), outline=(220, 40, 40), width=4); d.text((X(x) + 44, X(y) - 12), 'badge ' + lab, font=F(20, True), fill=(220, 40, 40))
d.text((20, 18), 'N ↑', font=F(36, True), fill=(255, 255, 255))
x0 = W + 30; y = 30
d.text((x0, y), 'SYRUP', font=F(40, True), fill=(29, 42, 54)); y += 56
d.text((x0, y), 'Plan de masse (vue de dessus)', font=F(24), fill=(93, 107, 120)); y += 50
for k, t in (('1', 'Manoir sur la colline, domaine clos [C]'), ('2', 'Pente nord et crique [C]'), ('3', 'Pente sud et crique [C]'), ('4', 'Restaurant Meshi [C]'),
             ('5', 'Pré communal, puits, grand chêne [I]'), ('6', 'Chapelle de pierre [I]'), ('7', 'Forêt [C]'), ('8', 'Ruisseau et cascade [I]'),
             ('9', 'Phare du cap ouest (niveau 4) [I]'), ('10', 'Fermes et granges [I]')):
    d.rounded_rectangle((x0, y, x0 + 46, y + 32), 8, fill=(29, 42, 54)); d.text((x0 + 23 - d.textlength(k, font=F(20, True)) / 2, y + 4), k, font=F(20, True), fill=(255, 255, 255))
    d.text((x0 + 58, y + 3), t, font=F(21), fill=(29, 42, 54)); y += 42
y += 10; d.text((x0, y), 'Zones', font=F(24, True), fill=(29, 42, 54)); y += 38
for nm, lab in (('pres', 'prairies ondulées [C]'), ('foret', 'forêt [C]'), ('falaise', 'hautes falaises [C]'), ('crique', 'criques au pied des pentes [I]'), ('village', 'village [C]')):
    d.rectangle((x0, y, x0 + 32, y + 26), fill=Z[nm], outline=(60, 40, 30)); d.text((x0 + 44, y), lab, font=F(21), fill=(29, 42, 54)); y += 34
d.rectangle((x0, y, x0 + 32, y + 26), fill=(188, 196, 104), outline=(60, 40, 30)); d.text((x0 + 44, y), 'champs et haies [I]', font=F(21), fill=(29, 42, 54)); y += 34
d.line((x0, y + 13, x0 + 32, y + 13), fill=(200, 176, 130), width=6); d.text((x0 + 44, y), 'chemins de terre [C]', font=F(21), fill=(29, 42, 54)); y += 46
d.text((x0, y), 'Bâtiments par niveau de ville', font=F(24, True), fill=(29, 42, 54)); y += 38
for lv in (1, 2, 3, 4):
    d.rectangle((x0, y, x0 + 32, y + 26), fill=LVC[lv], outline=(60, 40, 30)); d.text((x0 + 44, y), 'niveau %d' % lv, font=F(21), fill=(29, 42, 54)); y += 34
d.ellipse((x0, y + 4, x0 + 30, y + 34), outline=(220, 40, 40), width=4); d.text((x0 + 44, y + 6), "emprise du badge d'armée", font=F(21), fill=(29, 42, 54))
p = os.path.join(OUT, 'plan_de_masse.png'); im.save(p, optimize=True); print('PLAN', p, im.size)
