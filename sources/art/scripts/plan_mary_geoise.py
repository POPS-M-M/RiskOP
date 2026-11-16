"""Mary Geoise — plan de masse (vue de dessus) depuis mg_plan.py : falaise rouge, plateau, mur d'enceinte et quatre portes,
carrefour, château de Pangaea et ses douves, Domaine des Dieux (parcs, demeures), forêt et rivière, Red Ports, escalier, badges.
→ art/out/mary_geoise/presentation/plan_de_masse.png"""
import os, sys, math
sys.path.insert(0, os.path.dirname(__file__))
from PIL import Image, ImageDraw, ImageFont
import mg_plan as P

OUT = os.path.join(P.ART, 'out', 'mary_geoise', 'presentation'); os.makedirs(OUT, exist_ok=True)
F = lambda s, b=False: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans%s.ttf' % ('-Bold' if b else ''), s)
S, N = 16, 35; W = 2 * N * S
im = Image.new('RGB', (W + 560, W), (246, 241, 230)); d = ImageDraw.Draw(im); d.rectangle((0, 0, W, W), fill=(70, 120, 160))
Z = {'domaine': (132, 182, 104), 'avenue': (228, 220, 203), 'place': (236, 228, 210), 'chateau': (210, 204, 190), 'foret': (52, 104, 60),
     'rebord': (214, 206, 190), 'falaise': (176, 72, 58), 'port': (150, 146, 140)}
X = lambda v: (v + N) * S
for j in range(4 * N):
    for i in range(4 * N):
        x = -N + (i + .5) / 2; y = -N + (j + .5) / 2; z_ = P.zone(x, y)
        if z_ == 'mer': continue
        c = Z.get(z_, (132, 182, 104))
        if P.water_at(x, y) is not None: c = (60, 130, 180)
        d.rectangle((X(x) - S / 4, X(y) - S / 4, X(x) + S / 4, X(y) + S / 4), fill=c)
for cx, cy, w in P.lots():
    d.rectangle((X(cx - w / 2), X(cy - w / 2), X(cx + w / 2), X(cy + w / 2)), outline=(70, 110, 60), width=3)
LVC = {1: (176, 60, 50), 2: (204, 132, 70), 3: (150, 112, 168), 4: (64, 80, 190)}
for b in P.batiments():
    a = b['ang']; c, s = math.cos(a), math.sin(a); q = []
    for su, sv in ((-1, -1), (1, -1), (1, 1), (-1, 1)):
        u = su * b['w'] / 2; v = sv * b['d'] / 2; q.append((X(b['x'] - s * u + c * v), X(b['y'] + c * u + s * v)))
    d.polygon(q, fill=LVC[b['niveau']], outline=(40, 30, 20))
for x, y, sz, kind, lv in P.arbres():
    r = .35 * sz; d.ellipse((X(x - r), X(y - r), X(x + r), X(y + r)), fill=(30, 80, 40))
x4, y4 = P.SERRE; d.rectangle((X(x4 - 1.2), X(y4 - .8), X(x4 + 1.2), X(y4 + .8)), fill=LVC[4], outline=(40, 30, 20))
lab = [(P.CHATEAU[0], P.CHATEAU[1], '1'), (0, 0, '2'), (-6.0, -14.0, '3'), (*P.at_coast(0, .9), '4'), (*P.at_coast(math.pi, .9), '5'),
       (*P.at_coast((P.ESCALIER[0] + P.ESCALIER[1]) / 2, .9), '6'), (P.FORET[0] + 2, P.FORET[1] - 3, '7'), (P.SERRE[0], P.SERRE[1], '8'),
       (*P.at_coast(-math.pi / 2, P.Q_MUR), '9'), (*P.at_coast(-2.3, .99), '10')]
for x, y, t in lab:
    w = d.textlength(t, font=F(24, True)); d.rounded_rectangle((X(x) - w / 2 - 8, X(y) - 16, X(x) + w / 2 + 8, X(y) + 16), 8, fill=(29, 42, 54)); d.text((X(x) - w / 2, X(y) - 14), t, font=F(24, True), fill=(255, 255, 255))
for (x, y), t in ((P.BADGE3D, '3D'), (P.BADGE25, '2.5D')):
    d.ellipse((X(x - 2.6), X(y - 2.6), X(x + 2.6), X(y + 2.6)), outline=(220, 40, 40), width=4); d.text((X(x) + 44, X(y) - 12), 'badge ' + t, font=F(20, True), fill=(220, 40, 40))
d.text((20, 18), 'N ↑', font=F(36, True), fill=(255, 255, 255))
x0 = W + 30; y = 30
d.text((x0, y), 'MARY GEOISE', font=F(40, True), fill=(29, 42, 54)); y += 56
d.text((x0, y), 'Plan de masse (vue de dessus)', font=F(24), fill=(93, 107, 120)); y += 50
for k, t in (('1', 'Château de Pangaea, deux douves [C]'), ('2', 'Carrefour principal, fontaine [C]'), ('3', 'Domaine des Dieux [C]'),
             ('4', 'Red Port est, bondolas [C]'), ('5', 'Red Port ouest [C : deux ports]'), ('6', 'Escalier à statues [C]'),
             ('7', 'Forêt et rivière plantées [C]'), ('8', 'Serre victorienne, niveau 4 [I]'), ('9', 'Mur et quatre portes [C]'), ('10', 'Falaise rouge, nuages [C]')):
    d.rounded_rectangle((x0, y, x0 + 46, y + 32), 8, fill=(29, 42, 54)); d.text((x0 + 23 - d.textlength(k, font=F(20, True)) / 2, y + 4), k, font=F(20, True), fill=(255, 255, 255))
    d.text((x0 + 58, y + 3), t, font=F(19), fill=(29, 42, 54)); y += 40
y += 10; d.text((x0, y), 'Zones', font=F(24, True), fill=(29, 42, 54)); y += 36
for nm, lb in (('domaine', 'parcs du Domaine [C]'), ('avenue', 'axes du carrefour [C]'), ('chateau', 'château et douves [C]'), ('foret', 'forêt plantée [C]'),
               ('rebord', 'mur et chemin de ronde [I]'), ('falaise', 'Red Line, minéral rouge [C]'), ('port', 'Red Ports [C]')):
    d.rectangle((x0, y, x0 + 32, y + 26), fill=Z[nm], outline=(60, 40, 30)); d.text((x0 + 44, y), lb, font=F(21), fill=(29, 42, 54)); y += 32
y += 10; d.text((x0, y), 'Bâtiments par niveau de ville', font=F(24, True), fill=(29, 42, 54)); y += 36
for lv in (1, 2, 3, 4):
    d.rectangle((x0, y, x0 + 32, y + 26), fill=LVC[lv], outline=(60, 40, 30)); d.text((x0 + 44, y), 'niveau %d' % lv, font=F(21), fill=(29, 42, 54)); y += 32
d.ellipse((x0, y + 4, x0 + 30, y + 34), outline=(220, 40, 40), width=4); d.text((x0 + 44, y + 6), "emprise du badge d'armée", font=F(21), fill=(29, 42, 54))
p = os.path.join(OUT, 'plan_de_masse.png'); im.save(p, optimize=True); print('PLAN', p, im.size)
