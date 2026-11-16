"""Laugh Tale — plan de masse (vue de dessus) depuis lt_plan.py : falaises, fjord, grève et camp, porte monumentale, chaussée,
terrasses en ruine, citadelle, massif et tour brisée, forêt, ruisseau, phare-balise, aiguilles, bâtiments par niveau, badges.
→ art/out/laugh_tale/presentation/plan_de_masse.png"""
import os, sys, math
sys.path.insert(0, os.path.dirname(__file__))
from PIL import Image, ImageDraw, ImageFont
import lt_plan as P

OUT = os.path.join(P.ART, 'out', 'laugh_tale', 'presentation'); os.makedirs(OUT, exist_ok=True)
F = lambda s, b=False: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans%s.ttf' % ('-Bold' if b else ''), s)
S, N = 16, 35; W = 2 * N * S
im = Image.new('RGB', (W + 560, W), (246, 241, 230)); d = ImageDraw.Draw(im); d.rectangle((0, 0, W, W), fill=(70, 120, 160))
Z = {'foret': (44, 92, 52), 'altitude': (96, 120, 80), 'rocaille': (150, 142, 128), 'falaise': (200, 192, 172), 'terrasses': (186, 180, 160),
     'citadelle': (160, 156, 146), 'greve': (226, 212, 176), 'fjord': (40, 96, 140)}
X = lambda v: (v + N) * S
for j in range(4 * N):
    for i in range(4 * N):
        x = -N + (i + .5) / 2; y = -N + (j + .5) / 2; z_ = P.zone(x, y)
        if z_ == 'mer': continue
        c = Z.get(z_, (44, 92, 52))
        if P.water_at(x, y) is not None: c = (40, 96, 140)
        elif P.chemin_d(x, y) < .4: c = (214, 200, 168)
        elif P.ruisseau_d(x, y) < .35: c = (80, 150, 190)
        h = P.height(x, y); c = tuple(max(0, min(255, int(v * (.7 + h * .045)))) for v in c)
        d.rectangle((X(x) - S / 4, X(y) - S / 4, X(x) + S / 4, X(y) + S / 4), fill=c)
for a, k, s in P.PITONS:
    x, y = P.at_coast(a, k); d.ellipse((X(x - 1.2 * s), X(y - 1.2 * s), X(x + 1.2 * s), X(y + 1.2 * s)), fill=(190, 182, 164), outline=(60, 50, 40))
LVC = {1: (176, 60, 50), 2: (204, 132, 70), 3: (150, 112, 168), 4: (64, 80, 190)}
for b in P.batiments():
    a = b['ang']; c, s = math.cos(a), math.sin(a); q = []
    for su, sv in ((-1, -1), (1, -1), (1, 1), (-1, 1)):
        u = su * b['w'] / 2; v = sv * b['d'] / 2; q.append((X(b['x'] - s * u + c * v), X(b['y'] + c * u + s * v)))
    lv = b.get('restaure') or b['niveau'] if b['type'] == 'coquille' else b['niveau']
    d.polygon(q, fill=LVC[lv] if (b['type'] != 'coquille' or b.get('restaure')) else (120, 116, 108), outline=(40, 30, 20))
for x, y, sz, kind, lv in P.arbres():
    r = (.55 if kind == 'geant' else .35) * sz; d.ellipse((X(x - r), X(y - r), X(x + r), X(y + r)), fill=(28, 70, 36) if kind != 'conifere' else (40, 80, 56))
labels = [(P.FOND[0], P.FOND[1], .9, (226, 212, 176), '1'), (P.PORTE[0], P.PORTE[1], .9, (180, 170, 150), '2'), (P.TERRASSES[0], P.TERRASSES[1], 1.0, (186, 180, 160), '3'),
          (P.CITADELLE[0], P.CITADELLE[1], 1.2, (160, 156, 146), '4'), (P.SOMMET[0], P.SOMMET[1], 1.0, (150, 142, 128), '5'), (P.PHARE[0], P.PHARE[1], .9, (64, 80, 190), '6'),
          (P.RUISSEAU[-1][0], P.RUISSEAU[-1][1], .8, (80, 150, 190), '7'), (24.0, 1.0, .9, (40, 96, 140), '8'), (-6.0, 18.0, 1.0, (44, 92, 52), '9')]
x9, y9 = P.at_coast(P.PITONS[6][0], P.PITONS[6][1]); labels.append((x9, y9, .9, (190, 182, 164), '10'))
for (x, y, r, col, lab) in labels:
    w = d.textlength(lab, font=F(24, True)); d.rounded_rectangle((X(x) - w / 2 - 8, X(y) - 16, X(x) + w / 2 + 8, X(y) + 16), 8, fill=(29, 42, 54)); d.text((X(x) - w / 2, X(y) - 14), lab, font=F(24, True), fill=(255, 255, 255))
for (x, y), lab in ((P.BADGE3D, '3D'), (P.BADGE25, '2.5D')):
    d.ellipse((X(x - 2.6), X(y - 2.6), X(x + 2.6), X(y + 2.6)), outline=(220, 40, 40), width=4); d.text((X(x) + 44, X(y) - 12), 'badge ' + lab, font=F(20, True), fill=(220, 40, 40))
d.text((20, 18), 'N ↑', font=F(36, True), fill=(255, 255, 255))
x0 = W + 30; y = 30
d.text((x0, y), 'LAUGH TALE', font=F(40, True), fill=(29, 42, 54)); y += 56
d.text((x0, y), 'Plan de masse (vue de dessus)', font=F(24), fill=(93, 107, 120)); y += 50
for k, t in (('1', 'Grève et camp d\'expédition [I]'), ('2', 'Porte monumentale [I]'), ('3', 'Quartier en terrasses, en ruine [C : forme de bâtiments]'),
             ('4', 'Citadelle à double enceinte [C : forme de fortifications]'), ('5', 'Massif central et tour brisée [I]'), ('6', 'Phare-balise, niveau 4 [I]'),
             ('7', 'Cascade dans le fjord [I]'), ('8', 'Fjord, seul accès [I]'), ('9', 'Forêt sauvage [C : nature sauvage]'), ('10', 'Aiguilles rocheuses [I]')):
    d.rounded_rectangle((x0, y, x0 + 46, y + 32), 8, fill=(29, 42, 54)); d.text((x0 + 23 - d.textlength(k, font=F(20, True)) / 2, y + 4), k, font=F(20, True), fill=(255, 255, 255))
    d.text((x0 + 58, y + 3), t, font=F(19), fill=(29, 42, 54)); y += 40
y += 10; d.text((x0, y), 'Zones', font=F(24, True), fill=(29, 42, 54)); y += 36
for nm, lab in (('falaise', 'falaises abruptes [C]'), ('foret', 'forêt sauvage [C]'), ('altitude', 'conifères d\'altitude [I]'), ('rocaille', 'rocaille du massif [I]'),
                ('terrasses', 'terrasses en ruine [I]'), ('citadelle', 'citadelle [I]'), ('greve', 'grève du fjord [I]')):
    d.rectangle((x0, y, x0 + 32, y + 26), fill=Z[nm], outline=(60, 40, 30)); d.text((x0 + 44, y), lab, font=F(21), fill=(29, 42, 54)); y += 32
d.line((x0, y + 13, x0 + 32, y + 13), fill=(214, 200, 168), width=6); d.text((x0 + 44, y), 'chaussée et sentiers [I]', font=F(21), fill=(29, 42, 54)); y += 42
d.text((x0, y), 'Bâtiments par niveau de ville', font=F(24, True), fill=(29, 42, 54)); y += 36
d.rectangle((x0, y, x0 + 32, y + 26), fill=(120, 116, 108), outline=(60, 40, 30)); d.text((x0 + 44, y), 'ruine non restaurée (décor)', font=F(21), fill=(29, 42, 54)); y += 32
for lv, t in ((1, 'niveau 1 (camp)'), (2, 'niveau 2'), (3, 'niveau 3'), (4, 'niveau 4')):
    d.rectangle((x0, y, x0 + 32, y + 26), fill=LVC[lv], outline=(60, 40, 30)); d.text((x0 + 44, y), t, font=F(21), fill=(29, 42, 54)); y += 32
d.ellipse((x0, y + 4, x0 + 30, y + 34), outline=(220, 40, 40), width=4); d.text((x0 + 44, y + 6), "emprise du badge d'armée", font=F(21), fill=(29, 42, 54))
p = os.path.join(OUT, 'plan_de_masse.png'); im.save(p, optimize=True); print('PLAN', p, im.size)
