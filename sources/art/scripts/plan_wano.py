"""Wano — plan de masse (vue de dessus) depuis wa_plan.py : six régions, rivière en anneau et bras, murs de roche, cascades,
monuments légendés, bâtiments par niveau, emprise du badge d'armée du jeu. → art/out/wano/presentation/plan_de_masse.png"""
import os, sys, math
sys.path.insert(0, os.path.dirname(__file__))
from PIL import Image, ImageDraw, ImageFont
import wa_plan as P

OUT = os.path.join(P.ART, 'out', 'wano', 'presentation'); os.makedirs(OUT, exist_ok=True)
F = lambda s, b=False: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans%s.ttf' % ('-Bold' if b else ''), s)
S, N = 15, 39; W = 2 * N * S
im = Image.new('RGB', (W + 540, W), (246, 241, 230)); d = ImageDraw.Draw(im); d.rectangle((0, 0, W, W), fill=(88, 150, 186))
Z = {'capitale': (232, 214, 210), 'ebisu': (204, 186, 160), 'fuji': (160, 170, 150), 'ringo': (238, 241, 246), 'hakumai': (214, 152, 84),
     'udon': (104, 166, 80), 'kuri': (176, 142, 100), 'kibi': (156, 150, 138), 'mur': (120, 112, 100)}
X = lambda v: (v + N) * S
for j in range(4 * N):
    for i in range(4 * N):
        x = -N + (i + .5) / 2; y = -N + (j + .5) / 2
        if P.dcoast(x, y) >= 1: continue
        c = Z.get(P.zone(x, y), (120, 112, 100))
        if P.water_at(x, y) is not None or P.riviere_at(x, y): c = (54, 120, 170)
        h = P.height(x, y); c = tuple(min(255, int(v * (.78 + h * .025))) for v in c)
        if P.zone(x, y) == 'fuji' and h > 17.5: c = (248, 250, 252)
        d.rectangle((X(x) - S / 4, X(y) - S / 4, X(x) + S / 4, X(y) + S / 4), fill=c)
LVC = {1: (176, 60, 50), 2: (204, 132, 70), 3: (150, 112, 168), 4: (64, 80, 190)}
for b in P.batiments():
    a = b['ang']; c, s = math.cos(a), math.sin(a); q = []
    for su, sv in ((-1, -1), (1, -1), (1, 1), (-1, 1)):
        u = su * b['w'] / 2; v = sv * b['d'] / 2; q.append((X(b['x'] - s * u + c * v), X(b['y'] + c * u + s * v)))
    d.polygon(q, fill=LVC[b['niveau']], outline=(40, 30, 20))
labels = []
ox, oy = P.at_q(P.ODEN[1], P.ODEN[0]); gx, gy = P.at_q(P.CIMETIERE[1], P.CIMETIERE[0]); mx, my = P.at_q(.97, P.MOGURA[0]); ux, uy = P.at_q(P.MINE[1], P.MINE[0])
tx, ty = P.at_q(P.TORII_KURI[1], P.TORII_KURI[0]); bx, by = P.at_q(P.BAKURA[1], P.BAKURA[0]); kx, ky = P.at_q(.6, math.radians(185))
for (x, y, r, col, lab) in ((P.FUJI[0], P.FUJI[1], 1.6, (248, 250, 252), '1'), (P.CHATEAU[0], P.CHATEAU[1], 2.0, (241, 236, 226), '2'), (P.PAGODE[0], P.PAGODE[1], 1.0, LVC[4], '3'),
                            (ox, oy, 2.0, (90, 80, 70), '4'), (tx, ty, 1.0, (207, 67, 44), '5'), (bx, by, 1.0, (160, 120, 90), '6'), (gx, gy, 1.4, (200, 200, 205), '7'),
                            (ux, uy, 1.0, (70, 120, 60), '8'), (mx, my, 1.2, (200, 106, 42), '9'), (kx, ky, 1.0, (140, 74, 56), '10'), (P.EBISU[0], P.EBISU[1], 1.0, (200, 180, 150), '11')):
    d.ellipse((X(x - r), X(y - r), X(x + r), X(y + r)), fill=col, outline=(40, 30, 20), width=2); labels.append((x, y, lab))
for a in P.RIVIERES:
    x, y = P.at_q(1.0, a); d.ellipse((X(x) - 12, X(y) - 12, X(x) + 12, X(y) + 12), fill=(230, 246, 252), outline=(40, 90, 140), width=3)
for x, y, lab in labels:
    w = d.textlength(lab, font=F(24, True)); d.rounded_rectangle((X(x) - w / 2 - 8, X(y) - 16, X(x) + w / 2 + 8, X(y) + 16), 8, fill=(29, 42, 54)); d.text((X(x) - w / 2, X(y) - 14), lab, font=F(24, True), fill=(255, 255, 255))
for (x, y, lab) in ((0, -10.2, '3D'), (0, .55 * P.R, '2.5D')):
    d.ellipse((X(x - 2.6), X(y - 2.6), X(x + 2.6), X(y + 2.6)), outline=(220, 40, 40), width=4); d.text((X(x) + 44, X(y) - 12), 'badge ' + lab, font=F(20, True), fill=(220, 40, 40))
for nm, a, q in (('RINGO', -95, .74), ('HAKUMAI', -35, .74), ('UDON', 30, .73), ('KURI', 97, .78), ('KIBI', 180, .75), ('CAPITALE', -60, .2)):
    x, y = P.at_q(q, math.radians(a)); w = d.textlength(nm, font=F(22, True)); d.text((X(x) - w / 2, X(y) - 11), nm, font=F(22, True), fill=(29, 42, 54))
d.text((20, 18), 'N ↑', font=F(36, True), fill=(255, 255, 255))
x0 = W + 30; y = 30
d.text((x0, y), 'WANO', font=F(40, True), fill=(29, 42, 54)); y += 56
d.text((x0, y), 'Plan de masse (vue de dessus)', font=F(24), fill=(93, 107, 120)); y += 50
for k, t in (('1', 'Mont Fuji [C]'), ('2', 'Château du shogun [C?]'), ('3', 'Pagode (niveau 4) [I]'), ('4', "Ruines du château d'Oden [C]"), ('5', 'Grand torii de Kuri [C?]'),
             ('6', 'Bakura [C]'), ('7', 'Cimetière du nord, pont Oihagi [C]'), ('8', "Mine détruite d'Udon [C]"), ('9', 'Port de Mogura, télécabine [C]'),
             ('10', 'Usines sur les rochers de Kibi [C]'), ('11', 'Ebisu [C]')):
    d.rounded_rectangle((x0, y, x0 + 46, y + 32), 8, fill=(29, 42, 54)); d.text((x0 + 23 - d.textlength(k, font=F(20, True)) / 2, y + 4), k, font=F(20, True), fill=(255, 255, 255))
    d.text((x0 + 58, y + 3), t, font=F(21), fill=(29, 42, 54)); y += 42
d.ellipse((x0 + 8, y + 4, x0 + 32, y + 28), fill=(230, 246, 252), outline=(40, 90, 140), width=3); d.text((x0 + 58, y + 3), 'Cascades vers la mer [C]', font=F(21), fill=(29, 42, 54)); y += 50
d.text((x0, y), 'Régions [C]', font=F(24, True), fill=(29, 42, 54)); y += 38
for nm, lab in (('capitale', 'Capitale des Fleurs (cerisiers)'), ('ringo', 'Ringo (neige)'), ('hakumai', 'Hakumai (automne)'), ('udon', 'Udon (reverdie)'),
                ('kuri', 'Kuri (friche)'), ('kibi', 'Kibi (désolation)'), ('mur', 'murs de roche')):
    d.rectangle((x0, y, x0 + 32, y + 26), fill=Z[nm], outline=(60, 40, 30)); d.text((x0 + 44, y), lab, font=F(21), fill=(29, 42, 54)); y += 34
y += 12; d.text((x0, y), 'Bâtiments par niveau de ville', font=F(24, True), fill=(29, 42, 54)); y += 38
for lv in (1, 2, 3):
    d.rectangle((x0, y, x0 + 32, y + 26), fill=LVC[lv], outline=(60, 40, 30)); d.text((x0 + 44, y), 'niveau %d' % lv, font=F(21), fill=(29, 42, 54)); y += 34
d.ellipse((x0, y + 4, x0 + 30, y + 34), outline=(220, 40, 40), width=4); d.text((x0 + 44, y + 6), "emprise du badge d'armée", font=F(21), fill=(29, 42, 54))
p = os.path.join(OUT, 'plan_de_masse.png'); im.save(p, optimize=True); print('PLAN', p, im.size)
