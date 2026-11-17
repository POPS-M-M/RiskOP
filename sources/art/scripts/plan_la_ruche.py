"""La Ruche — plan de masse (vue de dessus) depuis lr_plan.py : socle de roche, crâne et sa butte, ville carrée en damier, palmiers démesurés,
quais, arène, rochers, bâtiments par niveau, badges. → art/out/la_ruche/presentation/plan_de_masse.png"""
import os, sys, math
sys.path.insert(0, os.path.dirname(__file__))
from PIL import Image, ImageDraw, ImageFont
import lr_plan as P

OUT = os.path.join(P.ART, 'out', 'la_ruche', 'presentation'); os.makedirs(OUT, exist_ok=True)
F = lambda s, b=False: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans%s.ttf' % ('-Bold' if b else ''), s)
S, N = 16, 35; W = 2 * N * S
im = Image.new('RGB', (W + 560, W), (246, 241, 230)); d = ImageDraw.Draw(im, 'RGBA'); d.rectangle((0, 0, W, W), fill=(70, 100, 130))
Z = {'lande': (140, 108, 82), 'ville': (196, 176, 130), 'falaise': (110, 82, 62), 'port': (150, 120, 84), 'crane': (216, 204, 176), 'mont': (122, 100, 82),
     'arene': (186, 160, 120)}
X = lambda v: (v + N) * S
for j in range(4 * N):
    for i in range(4 * N):
        x = -N + (i + .5) / 2; y = -N + (j + .5) / 2; z_ = P.zone(x, y)
        if z_ == 'mer': continue
        c = Z[z_]
        if z_ == 'ville' and P.rue_d(x, y) < .45: c = (226, 214, 184)
        d.rectangle((X(x) - S / 4, X(y) - S / 4, X(x) + S / 4, X(y) + S / 4), fill=c)
LVC = {1: (176, 60, 50), 2: (204, 132, 70), 3: (150, 112, 168), 4: (64, 80, 190)}
for b in P.batiments():
    d.rectangle((X(b['x'] - b['w'] / 2), X(b['y'] - b['d'] / 2), X(b['x'] + b['w'] / 2), X(b['y'] + b['d'] / 2)), fill=LVC[b['niveau']], outline=(40, 30, 20))
for x, y, s, k, lv in P.arbres():
    r = 1.3 if k == 'geant' else .45; d.ellipse((X(x - r), X(y - r), X(x + r), X(y + r)), fill=(40, 110, 50) if k != 'buisson' else (110, 100, 70), outline=(20, 40, 20))
cx, cy, cr = P.CRANE; d.ellipse((X(cx - cr * .95), X(cy - cr * .36), X(cx + cr * .95), X(cy + cr * .36)), fill=(184, 148, 112), outline=(60, 50, 40), width=4)   # dalle du crâne (vue de dessus)
for s in (-1, 1): d.ellipse((X(cx + s * 2.5 - 1.6), X(cy + 2.2), X(cx + s * 2.5 + 1.6), X(cy + 2.8)), fill=(30, 30, 34))
d.ellipse((X(cx + cr * .9), X(cy - 1.6), X(cx + cr * 1.25), X(cy + .8)), fill=(160, 122, 90), outline=(60, 50, 40))
ax, ay, ar = P.ARENE; d.ellipse((X(ax - ar), X(ay - ar), X(ax + ar), X(ay + ar)), fill=LVC[4], outline=(40, 30, 20), width=3)
for x, y, s in P.AIGUILLES: d.polygon([(X(x - 1.1 * s), X(y + .8 * s)), (X(x), X(y - 1.3 * s)), (X(x + 1.0 * s), X(y + .8 * s))], fill=(150, 100, 70), outline=(60, 40, 30))
for a, k, s in P.ROCHERS:
    x, y = P.at_coast(a, k); d.polygon([(X(x - 1.2 * s), X(y + .8 * s)), (X(x), X(y - 1.2 * s)), (X(x + 1.1 * s), X(y + .8 * s))], fill=(94, 70, 54), outline=(40, 28, 20))
for k in (-1, 0, 1):
    x, y = P.at_coast(P.PORT_A + k * .14, .9); d.rectangle((X(x - .45), X(y), X(x + .45), X(y + 3.6)), fill=(140, 100, 60), outline=(60, 40, 20))
px_, py_ = P.at_coast(P.PORT_A, .9); a0 = P.PALMIERS[0]
lab = [(cx - 2.5, cy - .2, '1'), (cx + 1.5, cy + 4.0, '2'), (cx + 1.5, cy - .2, '3'), (10.2, 13.6, '4'), (cx + math.cos(a0[0]) * a0[1], cy + math.sin(a0[0]) * a0[1], '5'),
       (px_, py_ + 1.5, '6'), (ax, ay, '7'), (*P.at_coast(P.ROCHERS[0][0], P.ROCHERS[0][1]), '8'), (cx - 8.6, cy + 2.0, '9')]
for x, y, t in lab:
    w = d.textlength(t, font=F(24, True)); d.rounded_rectangle((X(x) - w / 2 - 8, X(y) - 16, X(x) + w / 2 + 8, X(y) + 16), 8, fill=(29, 42, 54)); d.text((X(x) - w / 2, X(y) - 14), t, font=F(24, True), fill=(255, 255, 255))
for (x, y), t in ((P.BADGE3D, '3D'), (P.BADGE25, '2.5D')):
    d.ellipse((X(x - 2.6), X(y - 2.6), X(x + 2.6), X(y + 2.6)), outline=(220, 40, 40), width=4); d.text((X(x) + 44, X(y) - 12), 'badge ' + t, font=F(20, True), fill=(220, 40, 40))
d.text((20, 18), 'N ↑', font=F(36, True), fill=(255, 255, 255))
x0 = W + 30; y = 30
d.text((x0, y), 'LA RUCHE', font=F(40, True), fill=(29, 42, 54)); y += 56
d.text((x0, y), 'Plan de masse (vue de dessus)', font=F(24), fill=(93, 107, 120)); y += 50
for k, t in (('1', 'Crâne-forteresse [C]'), ('2', 'Baie vitrée du nez, orbites [C]'), ('3', 'Fissure et pansements [C]'), ('4', 'Ville carrée de briques [C ; damier I]'),
             ('5', 'Palmiers démesurés [C]'), ('6', 'Quais et jetées [I]'), ('7', 'Arène, niveau 4 [I]'), ('8', 'Rochers et falaises de roche brune [I]'), ('9', 'Maisons en terrasses, aiguilles [I]')):
    d.rounded_rectangle((x0, y, x0 + 46, y + 32), 8, fill=(29, 42, 54)); d.text((x0 + 23 - d.textlength(k, font=F(20, True)) / 2, y + 4), k, font=F(20, True), fill=(255, 255, 255))
    d.text((x0 + 58, y + 3), t, font=F(19), fill=(29, 42, 54)); y += 40
y += 10; d.text((x0, y), 'Bâtiments par niveau de ville', font=F(24, True), fill=(29, 42, 54)); y += 36
for lv in (1, 2, 3, 4):
    d.rectangle((x0, y, x0 + 32, y + 26), fill=LVC[lv], outline=(60, 40, 30)); d.text((x0 + 44, y), 'niveau %d' % lv, font=F(21), fill=(29, 42, 54)); y += 32
d.ellipse((x0, y + 4, x0 + 30, y + 34), outline=(220, 40, 40), width=4); d.text((x0 + 44, y + 6), "emprise du badge d'armée", font=F(21), fill=(29, 42, 54))
p = os.path.join(OUT, 'plan_de_masse.png'); im.save(p, optimize=True); print('PLAN', p, im.size)
