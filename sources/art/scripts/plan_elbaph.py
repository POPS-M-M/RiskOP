"""Elbaph — plan de masse (vue de dessus) depuis eb_plan.py : Underworld enneigé (montagnes, forêts de pins), Arbre Adam,
plateformes du Sun World (contours), village de l'Ouest et port de nuage, Source des Guerriers, châteaux, épée, arc-en-ciel, badges.
→ art/out/elbaph/presentation/plan_de_masse.png"""
import os, sys, math
sys.path.insert(0, os.path.dirname(__file__))
from PIL import Image, ImageDraw, ImageFont
import eb_plan as P

OUT = os.path.join(P.ART, 'out', 'elbaph', 'presentation'); os.makedirs(OUT, exist_ok=True)
F = lambda s, b=False: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans%s.ttf' % ('-Bold' if b else ''), s)
S, N = 15, 37; W = 2 * N * S
im = Image.new('RGB', (W + 560, W), (246, 241, 230)); d = ImageDraw.Draw(im, 'RGBA'); d.rectangle((0, 0, W, W), fill=(70, 120, 160))
Z = {'neige': (232, 238, 244), 'foret': (60, 96, 76), 'sommet': (250, 252, 255), 'racines': (180, 170, 150), 'rivage': (150, 156, 160), 'tronc': (106, 80, 56)}
X = lambda v: (v + N) * S
for j in range(4 * N):
    for i in range(4 * N):
        x = -N + (i + .5) / 2; y = -N + (j + .5) / 2; z_ = P.zone(x, y)
        if z_ == 'mer': continue
        c = Z[z_]; h = P.height(x, y); c = tuple(max(0, min(255, int(v * (.78 + h * .03)))) for v in c)
        d.rectangle((X(x) - S / 4, X(y) - S / 4, X(x) + S / 4, X(y) + S / 4), fill=c)
for x, y, z, s, k, lv in P.arbres():
    if P.sur_plateforme(x, y)[0] is None: d.ellipse((X(x - .4), X(y - .4), X(x + .4), X(y + .4)), fill=(30, 66, 44))
for k, (nom, a, dd, r, z) in enumerate(P.PLATEFORMES):                                   # plateformes (semi-transparentes)
    cx, cy = math.cos(a) * dd, math.sin(a) * dd
    pts = [(X(cx + math.cos(t) * r * P.plat_wob(t, k)), X(cy + math.sin(t) * r * P.plat_wob(t, k))) for t in [i / 64 * 6.283 for i in range(64)]]
    d.polygon(pts, fill=(140, 190, 110, 200), outline=(60, 40, 20)); d.line((X(0), X(0), X(cx), X(cy)), fill=(106, 80, 56), width=10)
sx, sy, sr, sz, sa = P.plateforme('source'); d.ellipse((X(sx - P.LAC_SOURCE), X(sy - P.LAC_SOURCE), X(sx + P.LAC_SOURCE), X(sy + P.LAC_SOURCE)), fill=(90, 150, 200))
d.ellipse((X(-P.TRONC[2]), X(-P.TRONC[2]), X(P.TRONC[2]), X(P.TRONC[2])), fill=(106, 80, 56), outline=(40, 30, 20), width=3)
LVC = {1: (176, 60, 50), 2: (204, 132, 70), 3: (150, 112, 168), 4: (64, 80, 190)}
for b in P.batiments():
    a = b['ang']; c, s = math.cos(a), math.sin(a); q = []
    for su, sv in ((-1, -1), (1, -1), (1, 1), (-1, 1)):
        u = su * b['w'] / 2; v = sv * b['d'] / 2; q.append((X(b['x'] - s * u + c * v), X(b['y'] + c * u + s * v)))
    d.polygon(q, fill=LVC[b['niveau']], outline=(40, 30, 20))
gx, gy = P.grande_halle(); d.rectangle((X(gx - 1.8), X(gy - 1), X(gx + 1.8), X(gy + 1)), fill=LVC[4], outline=(40, 30, 20))
ox = math.cos(P.OWL[0]) * P.OWL[1]; oy = math.sin(P.OWL[0]) * P.OWL[1]
ex, ey, er, ez, ea = P.plateforme('est'); ax, ay = ex + math.cos(ea) * er * .62, ey + math.sin(ea) * er * .62
wx, wy, wr, wz, wa = P.plateforme('ouest'); px, py = wx + math.cos(wa) * wr * .6, wy + math.sin(wa) * wr * .6
fx, fy = P.at_coast(P.ARC[0], P.ARC[1]); d.line((X(fx), X(fy), X(px), X(py)), fill=(230, 80, 80), width=8); d.line((X(fx), X(fy + .5), X(px), X(py + .5)), fill=(240, 200, 60), width=6)
lab = [(0, 0, '1'), (px, py, '2'), (sx, sy, '3'), (ox, oy, '4'), (ax, ay, '5'), (P.ROAD[0], P.ROAD[1], '6'), (P.EPEE[0], P.EPEE[1], '7'), (fx, fy, '8'), (gx, gy, '9'), (14.0, 22.0, '10')]
for x, y, t in lab:
    w = d.textlength(t, font=F(24, True)); d.rounded_rectangle((X(x) - w / 2 - 8, X(y) - 16, X(x) + w / 2 + 8, X(y) + 16), 8, fill=(29, 42, 54)); d.text((X(x) - w / 2, X(y) - 14), t, font=F(24, True), fill=(255, 255, 255))
for (x, y), t in ((P.BADGE3D, '3D'), (P.BADGE25, '2.5D')):
    d.ellipse((X(x - 2.6), X(y - 2.6), X(x + 2.6), X(y + 2.6)), outline=(220, 40, 40), width=4); d.text((X(x) + 44, X(y) - 12), 'badge ' + t, font=F(20, True), fill=(220, 40, 40))
d.text((20, 18), 'N ↑', font=F(36, True), fill=(255, 255, 255))
x0 = W + 30; y = 30
d.text((x0, y), 'ELBAPH', font=F(40, True), fill=(29, 42, 54)); y += 56
d.text((x0, y), 'Plan de masse (vue de dessus)', font=F(24), fill=(93, 107, 120)); y += 50
for k, t in (('1', 'Arbre au Trésor Adam [C]'), ('2', "Village de l'Ouest, port de nuage [C]"), ('3', 'Source des Guerriers [C]'), ('4', "Bibliothèque d'Owl, école [C]"),
             ('5', "Château d'Aurust dans son arbre [C]"), ('6', 'Château de Road, pont de corde [C]'), ('7', 'Épée géante [C]'), ('8', 'Arc-en-ciel vers le port [C]'),
             ('9', 'Grande halle, niveau 4 [I]'), ('10', 'Underworld enneigé [C]')):
    d.rounded_rectangle((x0, y, x0 + 46, y + 32), 8, fill=(29, 42, 54)); d.text((x0 + 23 - d.textlength(k, font=F(20, True)) / 2, y + 4), k, font=F(20, True), fill=(255, 255, 255))
    d.text((x0 + 58, y + 3), t, font=F(19), fill=(29, 42, 54)); y += 40
y += 10; d.text((x0, y), 'Zones', font=F(24, True), fill=(29, 42, 54)); y += 36
for col, lb in (((140, 190, 110), 'plateformes du Sun World [C]'), (Z['neige'], 'Underworld : neige [C]'), (Z['foret'], 'forêts de pins géants [C]'), (Z['sommet'], 'sommets enneigés [C]'), (Z['racines'], 'racines de l\'arbre [I]')):
    d.rectangle((x0, y, x0 + 32, y + 26), fill=col, outline=(60, 40, 30)); d.text((x0 + 44, y), lb, font=F(21), fill=(29, 42, 54)); y += 32
y += 10; d.text((x0, y), 'Bâtiments par niveau de ville', font=F(24, True), fill=(29, 42, 54)); y += 36
for lv in (1, 2, 3, 4):
    d.rectangle((x0, y, x0 + 32, y + 26), fill=LVC[lv], outline=(60, 40, 30)); d.text((x0 + 44, y), 'niveau %d' % lv, font=F(21), fill=(29, 42, 54)); y += 32
d.ellipse((x0, y + 4, x0 + 30, y + 34), outline=(220, 40, 40), width=4); d.text((x0 + 44, y + 6), "emprise du badge d'armée", font=F(21), fill=(29, 42, 54))
p = os.path.join(OUT, 'plan_de_masse.png'); im.save(p, optimize=True); print('PLAN', p, im.size)
