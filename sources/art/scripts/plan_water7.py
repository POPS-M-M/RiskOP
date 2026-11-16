"""Water 7 — planche G1 (plan de masse) à partir de w7_plan.py.  Usage : python3 plan_water7.py → art/out/water_7/presentation/G1_plan_de_masse.png"""
import os, math
import matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Polygon, Circle, Rectangle, FancyArrowPatch
from matplotlib.lines import Line2D
import w7_plan_g1g2 as W   # plan figé tel que validé en G1/G2

OUT = os.path.join(W.ART, 'out', 'water_7', 'presentation'); os.makedirs(OUT, exist_ok=True)
plt.rcParams.update({'font.family': 'DejaVu Sans', 'font.size': 10})
INK, MUTED, PAPER = '#1d2a36', '#5d6b78', '#f6f1e6'
SEA, SEA2 = '#7cc3d6', '#5aa9c2'
GROUND = {'plateau': '#efe3cb', 'ville_haute': '#e7d6b6', 'ville_moyenne': '#dccaa6', 'port': '#cfbb95', 'ville_nord': '#cfbb95',
          'chantiers': '#c3ab86', 'gare': '#cdbb98', 'basfonds': '#a99d86'}
CANAL, RUE = '#2f86b8', '#f7f0de'
ROOFS = ['#3d64b8', '#2e8a9a', '#b5533c']


def rect(cx, cy, w, d, rot):
    c, s = math.cos(rot), math.sin(rot); pts = []
    for u, v in ((-w / 2, -d / 2), (w / 2, -d / 2), (w / 2, d / 2), (-w / 2, d / 2)):
        pts.append((cx + u * c - v * s, cy + u * s + v * c))
    return pts


def ground_image(ax, res=0.25, lvl=4, light=False):
    """fond : terrain par zones + eau, rasterisé"""
    import numpy as np
    ext = 36; n = int(2 * ext / res); img = np.zeros((n, n, 3))
    def hx(h): return [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    sea = hx(SEA); sea2 = hx(SEA2); can = hx(CANAL)
    for j in range(n):
        y = -ext + (j + .5) * res
        for i in range(n):
            x = -ext + (i + .5) * res; r = math.hypot(x, y); th = math.atan2(y, x); d = r / W.coast_r(th)
            if d >= 1:
                img[j, i] = sea if d < 1.08 else sea2; continue
            w = W.water_at(x, y)
            if w is not None:
                img[j, i] = can if not (r > W.T1 and W.secteur(th) == 'basfonds' and d > W.INONDE[2]) else hx('#5f9fb8'); continue
            c = hx(GROUND[W.zone(x, y)])
            h = W.height(x, y); k = .86 + .1 * min(1, h / W.Z3)
            for a in W.RUES:
                if W.angd(th, a) * r < W.RUE_L / 2 and r > W.T3 - .2: c = hx(RUE); k = 1
            for rr in (W.T3, W.T2, W.T1):
                if abs(r - rr) < W.WALL / 2 + .05: c = hx('#8b7b66'); k = 1
            img[j, i] = [min(1, v * k) for v in c]
    ax.imshow(img, extent=(-ext, ext, ext, -ext), interpolation='bilinear', zorder=0)


def draw_plan(ax, lvl=4, labels=True, small=False):
    ground_image(ax, res=.25 if not small else .5)
    B = W.batiments()
    for b in B:
        if b['niveau'] > lvl: continue
        col = ROOFS[int((b['x'] * 7 + b['y'] * 13)) % 3] if b['zone'] not in ('chantiers',) else '#8d7a62'
        if b['zone'] == 'basfonds': col = '#8a7e70'
        alpha = 1 if b['niveau'] == 1 else .95
        ax.add_patch(Polygon(rect(b['x'], b['y'], b['w'], b['d'], b['rot']), closed=True, fc=col, ec='#1d2a36' if b['niveau'] == 1 else '#f3c14a',
                             lw=.35 if b['niveau'] == 1 else (.9 if not small else .6), alpha=alpha, zorder=3))
    # chantiers navals : hangars + cales
    for n, a, rd, lv in W.DOCKS:
        if lv > lvl: continue
        cx, cy = math.cos(a) * rd, math.sin(a) * rd
        ax.add_patch(Polygon(rect(cx, cy, 8.2, 4.6, a), closed=True, fc='#7b5f45', ec=INK, lw=.6, zorder=3))
        ex, ey = math.cos(a) * (rd + 8.5), math.sin(a) * (rd + 8.5)
        ax.add_patch(Polygon(rect((cx + ex) / 2 + math.cos(a) * 2, (cy + ey) / 2 + math.sin(a) * 2, 9, 2.6, a), closed=True, fc='#a88c6a', ec=INK, lw=.4, zorder=2))
        ax.add_patch(Polygon(rect(math.cos(a) * (rd + 5.4), math.sin(a) * (rd + 5.4), 4.6, 1.4, a), closed=True, fc='#f2efe8', ec=INK, lw=.4, zorder=4))  # coque en construction
        if labels: ax.text(math.cos(a) * (rd - 1.2), math.sin(a) * (rd - 1.2), 'n° %d' % n, ha='center', va='center', color='white', fontsize=11, fontweight='bold', zorder=9)
    # siège de la compagnie, gare + viaduc, port, ferraille, fontaine
    sx, sy = math.cos(W.SIEGE[1]) * W.SIEGE[0], math.sin(W.SIEGE[1]) * W.SIEGE[0]
    ax.add_patch(Polygon(rect(sx, sy, 3.6, 3.0, W.SIEGE[1]), closed=True, fc='#c9b48e', ec=INK, lw=.7, zorder=4))
    g = W.GARE; ax.add_patch(Polygon(rect(g['x'], g['y'], g['d'], g['w'], 0), closed=True, fc='#9a4a3a', ec=INK, lw=.8, zorder=4))
    (ax0, ay0), (ax1, ay1) = W.VIADUC
    ax.plot([g['x'], ax0, ax1], [g['y'], ay0, ay1], color='#3a2e2a', lw=3.2 if not small else 2, zorder=3, solid_capstyle='butt')
    ax.plot([g['x'], ax0, ax1], [g['y'], ay0, ay1], color='#d9cbb0', lw=1.2 if not small else .7, zorder=3, ls=(0, (1.2, 1.2)))
    for q in range(W.PORT['pontons']):
        t = W.PORT['th'] + (q - 1) * .2; x0, y0 = math.cos(t) * 27.2, math.sin(t) * 27.2
        ax.plot([x0, math.cos(t) * 34], [y0, math.sin(t) * 34], color='#7a5b3c', lw=2.4 if not small else 1.4, zorder=3)
    fx, fy = math.cos(W.FERRAILLE[0]) * W.FERRAILLE[1], math.sin(W.FERRAILLE[0]) * W.FERRAILLE[1]
    ax.add_patch(Circle((fx, fy), 2.2, fc='#6d6458', ec=INK, lw=.5, hatch='xxx' if not small else None, zorder=3))
    ax.add_patch(Circle((0, 0), W.FONTAINE['r_bassin'], fc='#5ec3ea', ec='white', lw=1.6, zorder=5))
    ax.add_patch(Circle((0, 0), 2.3, fc='#9bdcf2', ec='white', lw=1, zorder=6)); ax.add_patch(Circle((0, 0), 1.0, fc='white', ec='#5ec3ea', lw=1, zorder=7))
    for x, y, s, k in W.arbres():
        ax.add_patch(Circle((x, y), .55 * s if k == 'feuillu' else .45, fc='#4f8a3c' if k == 'feuillu' else '#6aa04a', ec='#2e5626', lw=.3, zorder=4))
    # côte réelle du jeu
    P = W.COAST + [W.COAST[0]]; ax.plot([p[0] for p in P], [p[1] for p in P], color='#f4f8f8', lw=1.2, zorder=5)
    px, py, _ = W.PONTON; ax.plot(px, py, marker='v', ms=8 if not small else 5, color='#e0a43c', mec=INK, zorder=8)
    ax.set_xlim(-36, 36); ax.set_ylim(36, -36); ax.set_aspect('equal'); ax.axis('off')


fig = plt.figure(figsize=(24, 15), dpi=100, facecolor=PAPER)
fig.text(.02, .965, 'WATER 7 — G1 · Plan de masse', fontsize=30, fontweight='bold', color=INK)
fig.text(.02, .938, "Pilote graphique n° 3 · contour réel de l'île dans le jeu (rayon 31) · repère du jeu : nord en haut · [C?] canon de mémoire, à confirmer · [I] interprétation à l'échelle de la carte",
         fontsize=12.5, color=MUTED)

# ---- plan principal
ax = fig.add_axes([.01, .02, .58, .90]); draw_plan(ax)
LAB = [  # (x, y, texte, tag)
    (0, -4.9, 'FONTAINE GÉANTE\nsommet de la ville', 'C?'),
    (0, -9.6, 'Ville haute\n(terrasse 2)', 'I'),
    (-4.5, 15.6, 'Ville moyenne\n(terrasse 1)', 'I'),
    (12, -12.5, 'Canal en anneau\n(terrasse 1)', 'I'),
    (29.0, -17.0, 'Chantiers navals\nn° 1 à 3', 'C?'),
    (19.2, 10.2, 'Siège de la\ncompagnie', 'C?'),
    (-24, 6.6, 'Gare du\ntrain des mers', 'C?'),
    (-33.5, -8.6, 'vers Enies Lobby', 'C?'),
    (0, 25.8, 'Port de commerce', 'I'),
    (-15.2, -23.4, 'Bas quartiers\n(pauvres, plus bas)', 'C?'),
    (-22.5, -17.2, 'Quartier inondé\n(ville qui s\'enfonce)', 'C?'),
    (-12.2, -29.4, 'Ferraille', 'C?'),
    (10.5, -24.6, 'Ville basse nord', 'I'),
    (27.6, 2.8, 'Canaux → mer\n(4 sorties)', 'I'),
]
for x, y, t, tag in LAB:
    ax.text(x, y, t + '  [' + tag + ']', ha='center', va='center', fontsize=10.5, color=INK, fontweight='bold', zorder=9,
            bbox=dict(boxstyle='round,pad=.28', fc='white', ec='#e0a43c' if tag == 'C?' else '#8aa0b2', lw=1.2, alpha=.93))
ax.text(2.3, 35, 'PONTON du jeu', fontsize=9.5, color=INK, zorder=9, ha='left', va='center', fontweight='bold')
ax.plot([-34, -24], [34, 34], color=INK, lw=3); ax.text(-29, 32.8, '10 unités', ha='center', fontsize=10, color=INK)
ax.annotate('', xy=(31, -33.5), xytext=(31, -28), arrowprops=dict(arrowstyle='-|>', color=INK, lw=2)); ax.text(31, -34.6, 'N', ha='center', fontsize=12, fontweight='bold')

# ---- situation sur la carte
ax2 = fig.add_axes([.605, .62, .185, .30]); ax2.set_facecolor(SEA); ax2.set_title('Situation sur la carte du jeu', fontsize=13, color=INK, loc='left', fontweight='bold')
NB = [('Water 7', 0, 0), ('Enies Lobby', -105, -15), ('Long Ring\nLong Land', 105, -15), ('Jaya', -5, -135), ('Birka', 40, 135), ('Skypiea', 100, -155), ('Alabasta', -105, -155), ('Briss', -175, 130), ('Thriller Bark', -205, 0)]
for nm, dx, dy in NB:
    ax2.add_patch(Circle((dx, dy), 31, fc='#e7d6b6' if nm != 'Water 7' else '#e0a43c', ec=INK, lw=.8))
    ax2.text(dx, dy + (48 if nm not in ('Water 7',) else 0), nm, ha='center', va='center', fontsize=9 if nm != 'Water 7' else 10, fontweight='bold' if nm == 'Water 7' else 'normal', color=INK)
ax2.plot([-26, -105 + 30], [-1, -12], color='#3a2e2a', lw=2.4); ax2.plot([-26, -105 + 30], [-1, -12], color='#d9cbb0', lw=.9, ls=(0, (1, 1)))
ax2.text(-60, 30, 'train des mers [C?]', fontsize=8.5, ha='center', color=INK)
ax2.set_xlim(-240, 150); ax2.set_ylim(190, -200); ax2.set_aspect('equal'); ax2.set_xticks([]); ax2.set_yticks([])

# ---- coupe ouest–est
ax3 = fig.add_axes([.805, .64, .185, .26]); ax3.set_facecolor('#eaf4f6'); ax3.set_title('Coupe ouest → est (hauteurs)', fontsize=13, color=INK, loc='left', fontweight='bold')
xs = [x / 10 for x in range(-340, 341)]
hs = [W.height(x, 0.5) for x in xs]
ax3.fill_between(xs, -2, hs, color='#d6c3a0', lw=0); ax3.plot(xs, hs, color=INK, lw=1)
ws = [W.water_at(x, 0.5) for x in xs]
ax3.fill_between(xs, [-2] * len(xs), [w if w is not None and w > h else -2 for w, h in zip(ws, hs)], color=CANAL, alpha=.7, lw=0)
ax3.fill_between(xs, -2, 0, where=[abs(x) > W.coast_r(0 if x > 0 else math.pi) for x in xs], color=SEA, lw=0)
for b in W.batiments():
    if abs(b['y']) < 2.2:
        h0 = W.height(b['x'], b['y']); ax3.add_patch(Rectangle((b['x'] - b['w'] / 2, h0), b['w'], b['etages'] * 1.15 + .8, fc='#b5533c', ec=INK, lw=.4))
ax3.add_patch(Rectangle((-1.6, W.Z3), 3.2, 1.0, fc='#5ec3ea', ec=INK, lw=.5)); ax3.add_patch(Rectangle((-.35, W.Z3), .7, W.FONTAINE['jet'], fc='#9bdcf2', ec=INK, lw=.5))
for k, (r, z) in enumerate(((2.6, W.Z3 + 4.5), (1.5, W.Z3 + 9))): ax3.add_patch(Rectangle((-r, z), 2 * r, .7, fc='#5ec3ea', ec=INK, lw=.5))
ax3.text(0, W.Z3 + W.FONTAINE['jet'] + 1.2, 'jet ≈ 27', ha='center', fontsize=9)
for xx, yy, t in ((-25, -1.4, 'gare'), (25, -1.4, 'chantier 1'), (-16, 4.6, 'terrasse 1'), (-9.5, 7.8, 'terrasse 2'), (-4.0, 11.4, 'plateau')):
    ax3.text(xx, yy, t, ha='center', fontsize=8.5, color=INK)
ax3.set_xlim(-34, 34); ax3.set_ylim(-2, 30); ax3.set_xlabel('unités de carte', fontsize=9); ax3.tick_params(labelsize=8)

# ---- évolution par niveau de ville
for k in range(4):
    a = fig.add_axes([.605 + k * .0985, .335, .095, .25]); draw_plan(a, lvl=k + 1, labels=False, small=True)
    a.set_title('Niveau de ville %d' % (k + 1), fontsize=11.5, color=INK, fontweight='bold')
import textwrap
fig.text(.605, .315, textwrap.fill("Contour jaune = bâtiments ajoutés par les niveaux 2 à 4. Niveau 2 : quartier du port et chantier n° 2 ; niveau 3 : ville basse nord, chantier n° 3, bas quartiers plus denses ; niveau 4 : édifices de prestige de la ville haute (coupoles, tours). Gameplay inchangé : seule l'image évolue.", 118), fontsize=10.2, color=INK, va='top')

# ---- canon / interprétation
C1 = ["Ville sur plusieurs niveaux, dominée par une fontaine géante",
      "Canaux dans toute la ville ; ponts et quais",
      "Chantiers navals numérotés (compagnie de construction navale)",
      "Gare du train des mers ; ligne vers Enies Lobby",
      "Quartiers plus pauvres et plus bas ; dépôt de ferraille",
      "Ville qui s'enfonce, inondée par les grandes marées"]
I1 = ["3 terrasses + plateau (hauteurs 3,2 / 6,4 / 9,8 ; jet ≈ 27)",
      "4 canaux rayonnants en cascade + 2 canaux en anneau",
      "3 chantiers visibles (et non 7), à l'est",
      "Gare à l'ouest, face à Enies Lobby, voisine sur la carte",
      "Bas quartiers au nord-ouest, port de commerce au sud (ponton)",
      "Toits bleus, sarcelle, terre cuite (fiche actuelle du jeu)"]
fig.text(.605, .245, 'Canon [C?] — de mémoire, à confirmer', fontsize=13, fontweight='bold', color='#b07a1c')
fig.text(.80, .245, 'Interprétations [I] — échelle de la carte', fontsize=13, fontweight='bold', color='#4c6a82')
for k, (c, i) in enumerate(zip(C1, I1)):
    fig.text(.605, .222 - k * .0285, textwrap.fill('• ' + c, 44, subsequent_indent='   '), fontsize=10.3, color=INK, va='top')
    fig.text(.80, .222 - k * .0285, textwrap.fill('• ' + i, 44, subsequent_indent='   '), fontsize=10.3, color=INK, va='top')
fig.text(.605, .012, textwrap.fill("Exclus : personnages, logo de la compagnie, locomotive officielle (train générique). Coordonnées, rayon, zones de clic et liens de l'île : inchangés.", 118), fontsize=10.2, color=MUTED, va='bottom')
L = [Line2D([0], [0], color=CANAL, lw=6, label='canaux / bassins'), Line2D([0], [0], color='#8b7b66', lw=4, label='murs des terrasses'),
     Line2D([0], [0], color=RUE, lw=6, label='rues et escaliers'), Line2D([0], [0], marker='s', color='w', mfc='#3d64b8', ms=10, label='maisons (niveau 1)'),
     Line2D([0], [0], marker='s', color='w', mfc='#3d64b8', mec='#f3c14a', mew=2, ms=10, label='ajouts niveaux 2–4'), Line2D([0], [0], marker='s', color='w', mfc='#7b5f45', ms=10, label='chantiers navals'),
     Line2D([0], [0], marker='v', color='w', mfc='#e0a43c', ms=10, label='ponton du jeu'), Line2D([0], [0], marker='o', color='w', mfc='#4f8a3c', ms=9, label='arbres')]
ax.legend(handles=L, loc='lower right', fontsize=9.5, framealpha=.92, ncol=2)
p = os.path.join(OUT, 'G1_plan_de_masse.png'); fig.savefig(p, dpi=100, facecolor=PAPER); print(p)
