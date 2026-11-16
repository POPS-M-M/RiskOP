"""Arabasta — plan de masse (vue de dessus) depuis ar_plan.py : désert, fleuve Sandora, rocher d'Alubarna, villes, oasis,
pistes, monuments légendés, bâtiments par niveau, emprise du badge d'armée du jeu. → art/out/arabasta/presentation/plan_de_masse.png"""
import os, sys, math
sys.path.insert(0, os.path.dirname(__file__))
from PIL import Image, ImageDraw, ImageFont
import ar_plan as P

OUT = os.path.join(P.ART, 'out', 'arabasta', 'presentation'); os.makedirs(OUT, exist_ok=True)
F = lambda s, b=False: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans%s.ttf' % ('-Bold' if b else ''), s)
S, N = 15, 38; W = 2 * N * S
im = Image.new('RGB', (W + 540, W), (246, 241, 230)); d = ImageDraw.Draw(im); d.rectangle((0, 0, W, W), fill=(88, 150, 186))
Z = {'alubarna': (240, 230, 215), 'rocher': (190, 150, 110), 'nanohana': (235, 225, 205), 'katorea': (222, 204, 172), 'rainbase': (246, 242, 232), 'yuba': (196, 166, 124),
     'erumalu': (176, 156, 124), 'suiren': (184, 164, 132), 'port_sud': (226, 212, 182), 'tombeau': (96, 146, 76), 'oasis': (110, 160, 80), 'rive': (122, 172, 82),
     'plage': (242, 226, 182), 'desert': (232, 204, 146)}
X = lambda v: (v + N) * S
for j in range(4 * N):
    for i in range(4 * N):
        x = -N + (i + .5) / 2; y = -N + (j + .5) / 2
        if P.dcoast(x, y) >= 1: continue
        c = Z.get(P.zone(x, y), (232, 204, 146))
        if P.water_at(x, y) is not None: c = (54, 120, 170)
        elif P.piste_at(x, y) and P.zone(x, y) in ('desert', 'rive'): c = (205, 176, 122)
        h = P.height(x, y); c = tuple(min(255, int(v * (.86 + h * .02))) for v in c)
        d.rectangle((X(x) - S / 4, X(y) - S / 4, X(x) + S / 4, X(y) + S / 4), fill=c)
LVC = {1: (176, 60, 50), 2: (204, 132, 70), 3: (150, 112, 168), 4: (64, 80, 190)}
for b in P.batiments():
    a = b['ang']; c, s = math.cos(a), math.sin(a); q = []
    for su, sv in ((-1, -1), (1, -1), (1, 1), (-1, 1)):
        u = su * b['w'] / 2; v = sv * b['d'] / 2; q.append((X(b['x'] - s * u + c * v), X(b['y'] + c * u + s * v)))
    d.polygon(q, fill=LVC[b['niveau']], outline=(40, 30, 20))
labels = []
for (x, y, r, col, lab) in ((P.PALAIS[0], P.PALAIS[1], 1.8, (246, 241, 230), '1'), (P.HORLOGE[0], P.HORLOGE[1], .8, (232, 214, 178), '2'), (P.PLACE[0], P.PLACE[1], .9, (232, 216, 180), '3'),
                            (P.ALUBARNA[0] - P.ALUBARNA[2] - 1.2, P.ALUBARNA[1], .9, (216, 196, 154), '4'), (P.TOMBEAU[0], P.TOMBEAU[1], 1.0, (96, 146, 76), '5'),
                            (P.CASINO[0], P.CASINO[1], 1.4, (216, 180, 106), '6'), (P.NANOHANA[0], P.NANOHANA[1], 1.0, (235, 225, 205), '7'), (P.KATOREA[0], P.KATOREA[1], .9, (222, 204, 172), '8'),
                            (P.YUBA[0], P.YUBA[1], .9, (196, 166, 124), '9'), (P.ERUMALU[0], P.ERUMALU[1], .9, (176, 156, 124), '10'), (P.SUIREN[0], P.SUIREN[1], .9, (184, 164, 132), '11'),
                            (P.PORT_SUD[0], P.PORT_SUD[1], .9, (226, 212, 182), '12')):
    d.ellipse((X(x - r), X(y - r), X(x + r), X(y + r)), fill=col, outline=(40, 30, 20), width=2); labels.append((x, y, lab))
for x, y, lab in labels:
    w = d.textlength(lab, font=F(24, True)); d.rounded_rectangle((X(x) - w / 2 - 8, X(y) - 16, X(x) + w / 2 + 8, X(y) + 16), 8, fill=(29, 42, 54)); d.text((X(x) - w / 2, X(y) - 14), lab, font=F(24, True), fill=(255, 255, 255))
for (x, y, lab) in ((0, -9.0, '3D'), (0, .55 * P.R, '2.5D')):
    d.ellipse((X(x - 2.6), X(y - 2.6), X(x + 2.6), X(y + 2.6)), outline=(220, 40, 40), width=4); d.text((X(x) + 44, X(y) - 12), 'badge ' + lab, font=F(20, True), fill=(220, 40, 40))
d.text((X(-3) - 140, X(-30)), 'fleuve Sandora', font=F(22, True), fill=(29, 42, 54)); d.text((20, 18), 'N ↑', font=F(36, True), fill=(255, 255, 255))
x0 = W + 30; y = 30
d.text((x0, y), 'ARABASTA', font=F(40, True), fill=(29, 42, 54)); y += 56
d.text((x0, y), 'Plan de masse (vue de dessus)', font=F(24), fill=(93, 107, 120)); y += 50
for k, t in (('1', "Palais royal blanc [C]"), ('2', "Tour de l'horloge [C]"), ('3', 'Place centrale [C]'), ('4', 'Escaliers taillés [C]'), ('5', 'Tombeau royal boisé [C]'),
             ('6', 'Casino en pyramide, Rainbase [C]'), ('7', 'Nanohana, port principal [C]'), ('8', 'Katorea [C]'), ('9', 'Yuba, ville ronde ensablée [C]'),
             ('10', "Erumalu, ruines [C]"), ('11', 'Suiren, ville asséchée [C]'), ('12', 'Port du sud [C : 2 ports]')):
    d.rounded_rectangle((x0, y, x0 + 46, y + 32), 8, fill=(29, 42, 54)); d.text((x0 + 23 - d.textlength(k, font=F(20, True)) / 2, y + 4), k, font=F(20, True), fill=(255, 255, 255))
    d.text((x0 + 58, y + 3), t, font=F(21), fill=(29, 42, 54)); y += 42
y += 10; d.text((x0, y), 'Zones', font=F(24, True), fill=(29, 42, 54)); y += 38
for nm, lab in (('desert', 'désert de Sandora [C]'), ('rive', 'rives fertiles du fleuve [I]'), ('oasis', 'oasis [C]'), ('rocher', "rocher d'Alubarna [C]")):
    d.rectangle((x0, y, x0 + 32, y + 26), fill=Z[nm], outline=(60, 40, 30)); d.text((x0 + 44, y), lab, font=F(21), fill=(29, 42, 54)); y += 34
d.line((x0, y + 13, x0 + 32, y + 13), fill=(205, 176, 122), width=6); d.text((x0 + 44, y), 'pistes caravanières [I]', font=F(21), fill=(29, 42, 54)); y += 46
d.text((x0, y), 'Bâtiments par niveau de ville', font=F(24, True), fill=(29, 42, 54)); y += 38
for lv in (1, 2, 3):
    d.rectangle((x0, y, x0 + 32, y + 26), fill=LVC[lv], outline=(60, 40, 30)); d.text((x0 + 44, y), 'niveau %d' % lv, font=F(21), fill=(29, 42, 54)); y += 34
d.ellipse((x0, y + 4, x0 + 30, y + 34), outline=(220, 40, 40), width=4); d.text((x0 + 44, y + 6), "emprise du badge d'armée", font=F(21), fill=(29, 42, 54))
p = os.path.join(OUT, 'plan_de_masse.png'); im.save(p, optimize=True); print('PLAN', p, im.size)
