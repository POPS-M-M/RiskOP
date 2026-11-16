"""Loguetown — plan de masse (vue de dessus) depuis lg_plan.py : zones, rues, enceinte, bâtiments par niveau de ville,
monuments signature légendés, badge d'armée du jeu (positions 2.5D et 3D). Usage : python3 plan_loguetown.py
→ art/out/loguetown/presentation/plan_de_masse.png"""
import os, sys, math
sys.path.insert(0, os.path.dirname(__file__))
from PIL import Image, ImageDraw, ImageFont
import lg_plan as P

OUT = os.path.join(P.ART, 'out', 'loguetown', 'presentation'); os.makedirs(OUT, exist_ok=True)
F = lambda s, b=False: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans%s.ttf' % ('-Bold' if b else ''), s)
S, N = 16, 37; W = 2 * N * S
im = Image.new('RGB', (W + 520, W), (246, 241, 230)); d = ImageDraw.Draw(im)
d.rectangle((0, 0, W, W), fill=(88, 150, 186))
Z = {'place': (232, 222, 200), 'centre': (226, 206, 168), 'ville': (220, 200, 162), 'faubourg': (206, 198, 150), 'campagne': (168, 186, 110),
     'colline': (160, 148, 118), 'villa': (150, 186, 110), 'port': (210, 200, 176), 'cote': (232, 218, 172)}
X = lambda x: (x + N) * S
for j in range(4 * N):
    for i in range(4 * N):
        x = -N + (i + .5) / 2; y = -N + (j + .5) / 2
        if P.dcoast(x, y) >= 1: continue
        c = Z[P.zone(x, y)]
        if P.water_at(x, y) is not None: c = (54, 120, 170)
        elif P.rue_at(x, y): c = (238, 230, 210)
        h = P.height(x, y); c = tuple(min(255, int(v * (.92 + h * .012))) for v in c)
        d.rectangle((X(x) - S / 4, X(y) - S / 4, X(x) + S / 4, X(y) + S / 4), fill=c)
pts = [P.enceinte(k / 200 * 2 * math.pi) for k in range(201)]
d.line([(X(a), X(b)) for a, b in pts], fill=(150, 112, 70), width=5)
LVC = {1: (176, 84, 58), 2: (204, 132, 70), 3: (150, 112, 168), 4: (64, 80, 190)}
for b in P.batiments():
    a = b['ang']; c, s = math.cos(a), math.sin(a); q = []
    for su, sv in ((-1, -1), (1, -1), (1, 1), (-1, 1)):
        u = su * b['w'] / 2; v = sv * b['d'] / 2; q.append((X(b['x'] - s * u + c * v), X(b['y'] + c * u + s * v)))
    d.polygon(q, fill=LVC[b['niveau']], outline=(60, 40, 30))


def rect(r, col, lab):
    cx, cy, hw, hh = r; d.rectangle((X(cx - hw), X(cy - hh), X(cx + hw), X(cy + hh)), fill=col, outline=(40, 30, 20), width=2); return (cx, cy, lab)


labels = [rect(P.PALAIS, (201, 165, 110), '1'), rect(P.NEF, (240, 236, 228), '2'), rect(P.OPERA, LVC[4], '7'), rect(P.LOGGIA, LVC[4], '6'),
          rect(P.MARINE, (242, 240, 234), '8'), rect(P.MARCHE, (190, 120, 90), '9')]
for (x, y, r, col, lab) in ((P.DOME[0], P.DOME[1], 2.4, (196, 98, 62), '2'), (P.CAMPANILE[0], P.CAMPANILE[1], .9, (240, 236, 228), '3'),
                            (P.TOUR[0], P.TOUR[1], 1.0, (201, 165, 110), '1'), (P.ECHAFAUD[0], P.ECHAFAUD[1], 1.6, (110, 80, 50), '4'),
                            (P.VILLA[0], P.VILLA[1], 3.0, (240, 226, 190), '5'), (P.PHARE[0], P.PHARE[1], 1.0, (255, 224, 138), '10'),
                            (P.CHAPELLE[0], P.CHAPELLE[1], 1.0, LVC[3], '11')):
    d.ellipse((X(x - r), X(y - r), X(x + r), X(y + r)), fill=col, outline=(40, 30, 20), width=2); labels.append((x, y, lab))
d.line([(X(a), X(b)) for a, b in P.JETEE], fill=(180, 165, 133), width=22)
for x, y, lab in labels:
    w = d.textlength(lab, font=F(26, True)); d.rounded_rectangle((X(x) - w / 2 - 8, X(y) - 17, X(x) + w / 2 + 8, X(y) + 17), 8, fill=(29, 42, 54)); d.text((X(x) - w / 2, X(y) - 15), lab, font=F(26, True), fill=(255, 255, 255))
for (x, y, lab) in ((0, -9.4, '3D'), (0, .55 * P.R, '2.5D')):                              # emprise du badge d'armée du jeu
    d.ellipse((X(x - 2.6), X(y - 2.6), X(x + 2.6), X(y + 2.6)), outline=(220, 40, 40), width=4); d.text((X(x) - 22, X(y) + 40), 'badge ' + lab, font=F(20, True), fill=(220, 40, 40))
d.text((X(P.PONTON[0]) - 40, X(P.PONTON[1]) + 10), 'ponton', font=F(20, True), fill=(255, 255, 255))
d.text((20, 18), 'N ↑', font=F(36, True), fill=(255, 255, 255))
x0 = W + 30; y = 30
d.text((x0, y), 'LOGUETOWN', font=F(40, True), fill=(29, 42, 54)); y += 56
d.text((x0, y), 'Plan de masse (vue de dessus)', font=F(24), fill=(93, 107, 120)); y += 50
for k, t in (('1', 'Palais à tour crénelée [C]'), ('2', 'Cathédrale à dôme [C]'), ('3', 'Campanile [I]'), ('4', 'Échafaud, place centrale [C]'),
             ('5', 'Villa et jardins [C]'), ('6', 'Loggia (niveau 4) [I]'), ('7', 'Opéra (niveau 4) [C]'), ('8', 'Base de la Marine [C]'),
             ('9', 'Marché aux poissons [C]'), ('10', 'Phare sur la jetée [I]'), ('11', 'Chapelle et tour de guet [I]')):
    d.rounded_rectangle((x0, y, x0 + 46, y + 32), 8, fill=(29, 42, 54)); d.text((x0 + 23 - d.textlength(k, font=F(20, True)) / 2, y + 4), k, font=F(20, True), fill=(255, 255, 255))
    d.text((x0 + 58, y + 3), t, font=F(22), fill=(29, 42, 54)); y += 42
y += 16; d.text((x0, y), 'Bâtiments par niveau de ville', font=F(24, True), fill=(29, 42, 54)); y += 40
for lv in (1, 2, 3, 4):
    d.rectangle((x0, y, x0 + 32, y + 26), fill=LVC[lv], outline=(60, 40, 30)); d.text((x0 + 44, y), 'niveau %d' % lv, font=F(22), fill=(29, 42, 54)); y += 36
y += 16; d.text((x0, y), 'Zones', font=F(24, True), fill=(29, 42, 54)); y += 40
for nm, lab in (('centre', 'ville intra-muros'), ('faubourg', 'faubourgs'), ('port', 'port'), ('colline', 'collines escarpées [C]'), ('villa', 'jardins de la villa'), ('campagne', 'oliveraies')):
    d.rectangle((x0, y, x0 + 32, y + 26), fill=Z[nm], outline=(60, 40, 30)); d.text((x0 + 44, y), lab, font=F(22), fill=(29, 42, 54)); y += 36
d.line((x0, y + 14, x0 + 32, y + 14), fill=(150, 112, 70), width=5); d.text((x0 + 44, y), 'enceinte et portes [I]', font=F(22), fill=(29, 42, 54)); y += 44
d.ellipse((x0, y, x0 + 32, y + 32), outline=(220, 40, 40), width=4); d.text((x0 + 44, y + 2), 'emprise du badge d\'armée', font=F(22), fill=(29, 42, 54)); y += 40
d.text((x0, y), '(le décor signature l\'évite)', font=F(20), fill=(93, 107, 120))
p = os.path.join(OUT, 'plan_de_masse.png'); im.save(p, optimize=True); print('PLAN', p, im.size)
