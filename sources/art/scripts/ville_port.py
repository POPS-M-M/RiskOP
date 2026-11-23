"""RISK OP — Ville portuaire (écran « Ville » : Économie, Équipage, Diplomatie, Monde par les bâtiments).
Vue plongeante 3/4 d'une ville portuaire dense : place à fontaine, marché, capitainerie, banque, taverne, bibliothèque à coupole,
chantier naval, port à jetées, phare, remparts, palmiers. Kits du projet (rk_port, rk_toscane, rk_anglais, rk_savoir, rk_victorien, rk_lib).
Ville générique [I] : aucun personnage, aucun emblème (ni Marine ni pirate), aucun navire identifiable, aucune copie de décor officiel.
Usage : python3 ville_port.py <sortie.png> [pourcentage] [échantillons] → image + <sortie>.json (zones cliquables, pixels d'une image 1400 × 860)
Repère du jeu : x est, y sud, z haut ; Blender par C.g2b. Mer au nord-ouest, caméra au sud-est.
"""
import sys, os, math, random, json, time
sys.path.insert(0, '/home/claude/riskop-mcc/sources/art/scripts')
import bpy, bmesh
from mathutils import Vector, noise
from bpy_extras.object_utils import world_to_camera_view
import rk_common as C, rk_lib as L, rk_port as K, rk_toscane as T, rk_anglais as A, rk_savoir as S, rk_victorien as V
from rk_retrofutur import revolve

OUT = sys.argv[1] if len(sys.argv) > 1 else '/home/claude/ville/ville.png'
PCT = int(sys.argv[2]) if len(sys.argv) > 2 else 100
SPP = int(sys.argv[3]) if len(sys.argv) > 3 else 48
H = C.hexc; G = C.g2b; rnd = random.Random(2611)
sc = C.new_scene(); M = C.materials()
DEC = C.coll('RK_DECOR')
B = L.Batch('VP_ville', DEC, M['peint']); BG = L.Batch('VP_or', DEC, M['brillant']); BL = L.Batch('VP_lueur', DEC, M['lueur'])
BV = L.Batch('VP_vegetation', DEC, M['peint']); BS = L.Batch('VP_sol', DEC, M['peint']); BE = L.Batch('VP_bassin', DEC, M['eau'], False)
Z0 = .6                                                   # niveau de la ville

# ------------------------------------------------------------------ rivage (mer au nord-ouest) et sol
def cote(x, y):            # > 0 : terre
    return (x + y) + 16 + 2.2 * math.sin(x * .21) + 1.6 * math.cos(y * .27)
def ilot_phare(x, y): return math.hypot(x + 15, y + 18) < 3.2
def zg(x, y):
    if ilot_phare(x, y): return Z0 + .9
    c = cote(x, y)
    if c < 0: return -1.6
    return Z0 + max(0, (x + y - 40) * .25) + .6 * max(0, math.sin(x * .12) * math.cos(y * .1)) * min(1, max(0, (x + y - 18) / 10))
PLACE = (0.0, 0.0, 6.2)
def sol(x, y):
    c = cote(x, y)
    if ilot_phare(x, y): return H('#a59a86')
    if c < 0: return H('#7f735e')
    if c < 3.2: return H('#d6cbb2') if (int(x * 1.5) + int(y * 1.5)) % 2 else H('#cbbfa4')          # quai
    d = math.hypot(x - PLACE[0], y - PLACE[1])
    if d < PLACE[2]:
        ring = int(d * 1.6) % 2; return H('#e6d9bb') if ring else H('#dacbab')                    # place pavée en anneaux
    if abs(x - PLACE[0]) < 1.1 or abs(y - PLACE[1]) < 1.1 or abs((x - y) * .7071) < .9: return H('#dccdac')   # rues
    if x + y > 40: return C.mix(H('#7fbd5c'), H('#a3cf72'), .5 + .5 * noise.noise(Vector((x * .2, y * .2, 0))))
    n = noise.noise(Vector((x * .35, y * .35, 3)))
    if n > .18: return C.mix(H('#8cc865'), H('#a8d47a'), .5 + .5 * noise.noise(Vector((x, y, 0))))              # jardins et cours
    return H('#e0d3b4') if (int(x * 1.1) + int(y * 1.1)) % 3 else H('#d6c7a5')                       # ruelles pavées

bm = BS.bm; st = .5; NX = int(84 / st) + 1; NY = int(84 / st) + 1; grid = {}
for j in range(NY):
    for i in range(NX):
        x = -42 + i * st; y = -42 + j * st; v = bm.verts.new(G(x, y, zg(x, y))); grid[(i, j)] = v; v[BS.col] = sol(x, y)
for j in range(NY - 1):
    for i in range(NX - 1): bm.faces.new((grid[(i, j)], grid[(i + 1, j)], grid[(i + 1, j + 1)], grid[(i, j + 1)]))
for v in bm.verts:
    if -1.5 < v.co.z < Z0 - .05: v[BS.col] = H('#b3a68e')                                           # parement des quais

ANCRES = {}
def ancre(k, pts): ANCRES[k] = [G(*p) for p in pts]
def bloque(x, y, r): RES.append((x, y, r))
RES = []
murs_clairs = [K.MURS['blanc'], K.MURS['creme'], K.MURS['ciel'], K.MURS['sable'], H('#f6f1e6')]
toits_bleus = [K.TOITS['bleu'], K.TOITS['sarcelle'], H('#2f5f9e'), H('#3a72b8')]
toits_chauds = [K.TOITS['tuile'], H('#c4663e'), H('#d07a4a')]

# ------------------------------------------------------------------ place, fontaine, marché
x, y = PLACE[0], PLACE[1]
vs = C.bm_cyl(B.bm, G(x, y, Z0 - .1), G(x, y, Z0 + .35), 2.2, 2.2, 32); B.paint(vs, H('#e8e0cc'), .03)
vs = C.bm_cyl(BE.bm, G(x, y, Z0 + .3), G(x, y, Z0 + .33), 2.0, 2.0, 32); BE.paint(vs, H('#4fb3d9'), .02)
vs = C.bm_cyl(B.bm, G(x, y, Z0 + .3), G(x, y, Z0 + 1.2), .35, .28, 12); B.paint(vs, H('#efe7d4'), .03)
vs = C.bm_cyl(B.bm, G(x, y, Z0 + 1.2), G(x, y, Z0 + 1.35), 1.0, .8, 20); B.paint(vs, H('#e3d9c2'), .03)
vs = C.bm_cyl(BE.bm, G(x, y, Z0 + 1.33), G(x, y, Z0 + 1.36), .85, .85, 20); BE.paint(vs, H('#6cc6e6'), .02)
vs = C.bm_cyl(BG.bm, G(x, y, Z0 + 1.35), G(x, y, Z0 + 3.1), .16, .05, 8); BG.paint(vs, H('#f2c230'), .02)   # obélisque doré
vs = C.bm_ico(BE.bm, G(x, y, Z0 + 3.3), .32, 2, (1, 1, 1.5)); BE.paint(vs, H('#dff4fb'), .02)
bloque(x, y, 2.6)
STRIPES = [('#d62828', '#f6f0e2'), ('#2f74c8', '#f6f0e2'), ('#e09b0b', '#f6f0e2'), ('#2e8b57', '#f6f0e2')]
def etal(x, y, ang, k):
    F = K.Frame(x, y, Z0, ang); a, b = STRIPES[k % 4]
    K.box(B, F, -.75, .75, -.45, .45, 0, .6, H('#9a6a3e'), .05)
    for q in range(6):
        u0 = -.85 + q * .283
        K.quad(B, F, [(u0, -.55, 1.45), (u0 + .283, -.55, 1.45), (u0 + .283, .7, 1.0), (u0, .7, 1.0)], H(a if q % 2 else b), .02)
    for u in (-.8, .8):
        for v in (-.5, .65): vs = C.bm_cyl(B.bm, F.p(u, v, 0), F.p(u, v, 1.45 if v < 0 else 1.0), .04, .04, 5); B.paint(vs, H('#6b4a30'))
    for q in range(4):
        vs = C.bm_ico(B.bm, F.p(-.5 + q * .33, .1, .7), .14, 1); B.paint(vs, H(['#e34b2a', '#f2b632', '#7fbf3a', '#e8853a'][q]), .05)
MARCHE = [(-8.6, 3.0), (-8.4, 5.4), (-10.8, 4.2), (-6.4, 5.2), (-10.6, 1.8), (-6.6, 7.4)]
for k, (mx, my) in enumerate(MARCHE): etal(mx, my, math.pi / 2 if k % 2 else 0, k); bloque(mx, my, 1.1)

# ------------------------------------------------------------------ bâtiments cliquables
# Capitainerie (grand siège du port) : au nord de la place, perron vers la place, deux tours, bannières aux couleurs du joueur
x, y = 0.0, -11.5
T.palazzo(B, x, y, Z0, math.pi / 2, 8.6, 5.0, 3, H('#f3eee2'), K.TOITS['bleu'], rnd, loggia=True)
for s in (-1, 1):
    K.tour(B, x + s * 5.4, y - .6, Z0, 6.6, 1.15, H('#f3eee2'), K.TOITS['bleu'])
    K.hip(B, K.Frame(x + s * 5.4, y - .6, Z0, math.pi / 2), -1.35, 1.35, -1.35, 1.35, 6.6, 1.6, K.TOITS['bleu'])
F = K.Frame(x, y, Z0, math.pi / 2)
for q in range(6): K.box(B, F, -2.4 + q * .1, 2.4 - q * .1, 2.5 + q * .35, 2.5 + (q + 1) * .35, -.6, .35 - q * .06, H('#e8e0cc'), .02)   # perron
for u in (-3.2, -1.1, 1.1, 3.2):
    K.box(B, F, u - .45, u + .45, 2.55, 2.62, 1.4, 3.6, H('#c22e2e'), .02)
    K.box(BG, F, u - .2, u + .2, 2.63, 2.66, 2.6, 3.0, H('#f5c518'), .02)
vs = C.bm_cyl(B.bm, G(x, y - 2.2, Z0 + 3.6), G(x, y - 2.2, Z0 + 7.6), .06, .05, 6); B.paint(vs, K.FER)
K.quad(B, K.Frame(x, y - 2.2, Z0, 0), [(0, 0, 7.5), (0, 1.4, 7.2), (0, 0, 6.8)], H('#c22e2e'), .02)
bloque(x, y, 6.5)
ancre('capitainerie', [(x - 6.6, y + 2.6, Z0), (x + 6.6, y + 2.6, Z0), (x - 5.4, y - .6, Z0 + 8.2), (x + 5.4, y - .6, Z0 + 8.2), (x, y, Z0 + 6), (x, y + 4.6, Z0)])

# Banque : à l'est de la place, colonnade, fronton, pièce d'or, coffres
x, y = 10.5, -4.5; ang = math.pi / 2
T.palazzo(B, x, y, Z0, ang, 5.2, 4.0, 2, H('#f7f2e6'), K.TOITS['sarcelle'], rnd, loggia=True)
F = K.Frame(x, y, Z0, ang); zt = 2.65
K.quad(B, F, [(-2.7, 2.06, zt), (2.7, 2.06, zt), (0, 2.06, zt + 1.3)], H('#f4ecd8'), .02)
vs = C.bm_cyl(BG.bm, F.p(0, 2.08, zt + .55), F.p(0, 2.24, zt + .55), .46, .46, 28); BG.paint(vs, H('#f5c518'), .02)
for q in range(4):
    vs = C.bm_cyl(BG.bm, G(x + 3.1, y + 2.4, Z0 + q * .1), G(x + 3.1, y + 2.4, Z0 + q * .1 + .09), .3, .3, 16); BG.paint(vs, H('#f2b81c'), .03)
for q in range(2): K.box(B, K.Frame(x - 3.2 + q * .8, y + 2.6, Z0, ang), -.35, .35, -.25, .25, 0, .45, H('#6b4a30'), .04); K.box(BG, K.Frame(x - 3.2 + q * .8, y + 2.6, Z0, ang), -.36, .36, -.05, .05, .3, .36, H('#f2c230'), .02)
bloque(x, y, 3.6)
ancre('banque', [(x - 2.8, y + 2.2, Z0), (x + 2.8, y + 2.2, Z0), (x, y + 2.1, Z0 + 4.2), (x - 2.6, y - 2, Z0 + 3), (x + 2.6, y - 2, Z0 + 3)])

# Taverne : au sud-ouest de la place, auberge à colombages, tonneaux, terrasse
x, y = -4.5, 11.0
A.auberge(B, x, y, Z0, 0.0, rnd)
for (dx, dy) in [(1.6, -1.4), (1.6, 1.4), (2.0, 0)]:
    vs = C.bm_cyl(B.bm, G(x + dx, y + dy, Z0), G(x + dx, y + dy, Z0 + .5), .22, .22, 10); B.paint(vs, H('#8a4f24'))
for (dx, dy) in [(2.8, -1.0), (2.8, 1.0)]:
    K.box(B, K.Frame(x + dx, y + dy, Z0, 0), -.35, .35, -.35, .35, 0, .42, H('#9a6a3e'), .04)
    vs = C.bm_cyl(B.bm, G(x + dx, y + dy, Z0 + .42), G(x + dx, y + dy, Z0 + 1.6), .03, .03, 4); B.paint(vs, K.BOIS2)
    vs = C.bm_cyl(B.bm, G(x + dx, y + dy, Z0 + 1.55), G(x + dx, y + dy, Z0 + 1.7), .7, .1, 10); B.paint(vs, H('#d62828'), .03)
bloque(x, y, 3.0)
ancre('taverne', [(x - 1.4, y - 1.6, Z0), (x + 3.3, y + 1.6, Z0), (x, y, Z0 + 3.0), (x + 1, y - 1.2, Z0 + 2.2), (x - 1, y + 1.2, Z0 + 2.2)])

# Bibliothèque : rotonde à colonnes et coupole, sud-est de la place
x, y = 13.0, 7.5
F = K.Frame(x, y, Z0, math.pi * .75)
K.box(B, F, -2.7, 2.7, -2.1, 2.1, -.6, .4, K.PIERRE, .04)
revolve(B, x, y, [(2.3, Z0 + .4), (2.3, Z0 + 2.7)], H('#efe3c6'), 28, False)
for k in range(12):
    a = k / 12 * 2 * math.pi; vs = C.bm_cyl(B.bm, G(x + math.cos(a) * 2.55, y + math.sin(a) * 2.55, Z0 + .4), G(x + math.cos(a) * 2.55, y + math.sin(a) * 2.55, Z0 + 2.7), .14, .14, 8); B.paint(vs, H('#fbf7ee'), .02)
revolve(B, x, y, [(2.8, Z0 + 2.7), (2.8, Z0 + 2.95), (2.3, Z0 + 2.95)], H('#e2d6b8'), 28)
revolve(B, x, y, [(2.2, Z0 + 2.95), (2.15, Z0 + 3.5), (1.9, Z0 + 4.2), (1.35, Z0 + 4.8), (.65, Z0 + 5.15), (0, Z0 + 5.22)], H('#3f86b8'), 28)
revolve(BG, x, y, [(.3, Z0 + 5.2), (.3, Z0 + 5.7), (0, Z0 + 5.9)], H('#f5c518'), 12)
for k, col in enumerate(['#d62828', '#2f74c8', '#2e8b57', '#e09b0b', '#9b59d0']):
    a = math.pi * (.55 + k * .14); K.box(B, K.Frame(x + math.cos(a) * 2.32, y + math.sin(a) * 2.32, Z0, a), -.3, .3, -.03, .03, 1.0, 2.4, H(col), .03)
bloque(x, y, 3.6)
ancre('bibli', [(x - 2.8, y - 2.8, Z0), (x + 2.8, y + 2.8, Z0), (x, y, Z0 + 5.9), (x - 2.6, y + 2.6, Z0 + 3), (x + 2.6, y - 2.6, Z0 + 3)])

# Chantier naval : sur la rive ouest, cale vers la mer, coque en construction, grue, planches
x, y = -14.0, 1.5; ang = math.atan2(-1, -1)                         # ouvert vers le nord-ouest (la mer)
K.hangar_naval(B, x, y, Z0, ang, 7.0, 4.8, 3.8, K.BOIS, K.TOITS['tuile'])
K.coque(B, x - 3.4, y - 3.4, .2, ang, 6.2, 2.0, 1.4, .6)
K.box(B, K.Frame(x - 3.0, y - 3.0, 0, ang), -1.4, 1.4, -4.5, 3.5, -1.4, .15, K.BOIS2, .05)
K.grue(B, x + 1.5, y - 5.8, Z0, ang, 7.5, 4.0)
for k in range(5): K.box(B, K.Frame(x + 3.6, y + 1.2, Z0 + k * .16, .3), -1, 1, -.35, .35, 0, .15, H('#c9a36a'), .05)
bloque(x, y, 5.0); bloque(x - 3.4, y - 3.4, 3.0)
ancre('chantier', [(x - 7, y - 7, 0), (x + 4, y + 4, Z0), (x + 1.5, y - 5.8, Z0 + 7.5), (x, y, Z0 + 4), (x - 3.5, y + 3.5, Z0)])

# Phare sur son îlot, au bout de la passe
x, y = -15.0, -18.0
vs = C.bm_ico(B.bm, G(x, y, -.2), 3.2, 2, (1, 1, .42), .25, 3); B.paint(vs, H('#9a8f7f'), .06)
top = S.phare((B, BG, BL), x, y, Z0 + .9, rnd)
ancre('phare', [(x - 2.5, y + 2, Z0), (x + 3.5, y + 2, Z0), (x, y, Z0 + .9 + top), (x - 1, y, Z0 + 4), (x + 1.6, y + .6, Z0 + 2)])

# ------------------------------------------------------------------ port : jetées, navires, barques, entrepôts
for (jx, jy, ja, jl) in [(-13.5, -8.5, math.atan2(-1, -1), 8.0), (-6.0, -15.5, math.atan2(-1, -1), 7.0), (2.5, -21.5, math.atan2(-1, -1), 6.0)]:
    F = K.Frame(jx, jy, 0, ja)
    K.box(B, F, -.7, .7, -1.5, jl, .3, Z0, K.BOIS, .05)
    for v in range(-1, int(jl) + 1, 1):
        for u in (-.6, .6): vs = C.bm_cyl(B.bm, F.p(u, v, -1.4), F.p(u, v, Z0 + .05), .09, .09, 6); B.paint(vs, K.BOIS2)
    for v in (jl * .4, jl * .9): K.bitte(B, *[F.x + F.f[0] * v + F.t[0] * .5, F.y + F.f[1] * v + F.t[1] * .5], Z0)
K.navire(B, -22.0, -9.5, math.atan2(-1, -1) + math.pi / 2, 9.0, rnd)
K.navire(B, -8.5, -24.0, math.atan2(-1, -1) + math.pi / 2, 7.5, rnd, voiles=H('#f1e6cc'), coque_col=H('#7a4a2a'))
K.navire(B, -30.0, -26.0, .9, 6.0, rnd)
for (bx, by, ba) in [(-11.0, -12.5, .4), (-3.5, -19.0, -.3), (-15.0, -6.0, .9), (5.0, -24.0, .2)]: K.barque(B, bx, by, 0.05, ba)
for (ex, ey) in [(-9.0, -6.5), (-3.0, -10.5)]:
    K.entrepot(B, ex, ey, Z0, math.atan2(-1, -1), 3.4, 2.4, 2.0, H('#c98a64'), K.TOITS['tuile'], rnd); bloque(ex, ey, 2.4)
    for q in range(3): K.box(B, K.Frame(ex - 2.2 + q * .9, ey - 2.4, Z0, .4), -.3, .3, -.3, .3, 0, .55, H('#b07a44'), .05)

# ------------------------------------------------------------------ remparts (sud et est) et porte
WALL = []
for k in range(64):
    t = k / 63; px = -2 + t * 30; py = 30 - t * 2                       # sud
    WALL.append((px, py))
for k in range(56):
    t = k / 55; WALL.append((28 + t * 1.5, 28 - t * 52))                 # est
pts = [(px, py, Z0) for px, py in WALL]
for (ax, ay, az), (bx, by, bz) in zip(pts, pts[1:]):
    Lg = math.hypot(bx - ax, by - ay)
    if Lg > 2.0: continue
    F = K.Frame((ax + bx) / 2, (ay + by) / 2, Z0, math.atan2(by - ay, bx - ax) - math.pi / 2)
    K.box(B, F, -Lg / 2 - .02, Lg / 2 + .02, -.45, .45, -.5, 2.4, H('#e9e1cf'), .03)
    K.box(B, F, -Lg / 4, Lg / 4, -.5, .5, 2.4, 2.75, H('#e2d8c2'), .02)
for (tx, ty) in [(-2, 30), (12, 29), (28, 28), (28.6, 8), (29.2, -10), (29.5, -24)]:
    revolve(B, tx, ty, [(1.3, Z0 - .5), (1.3, Z0 + 3.4), (1.5, Z0 + 3.5), (1.5, Z0 + 3.9)], H('#e9e1cf'), 16)
    revolve(B, tx, ty, [(1.55, Z0 + 3.9), (0, Z0 + 5.6)], K.TOITS['bleu'], 16)
for p in WALL[::3]: bloque(p[0], p[1], 1.0)

# ------------------------------------------------------------------ quartiers denses
def libre(x, y, r):
    if cote(x, y) < 3.4 + r or ilot_phare(x, y): return False
    if math.hypot(x - PLACE[0], y - PLACE[1]) < PLACE[2] + r: return False
    if abs(x - PLACE[0]) < 1.2 + r * .4 or abs(y - PLACE[1]) < 1.2 + r * .4: return False
    if x > 27 - r or y > 28.5 - r: return False
    return all(math.hypot(x - a, y - b) > c + r for a, b, c in RES)
LOTS = [(-26 + i * 2.35 + rnd.uniform(-.3, .3), -34 + j * 2.45 + rnd.uniform(-.3, .3)) for i in range(24) for j in range(27)]
rnd.shuffle(LOTS)
for (x, y) in LOTS:
    w = rnd.uniform(1.8, 2.3); d = rnd.uniform(1.7, 2.1); r = max(w, d) * .5
    if not libre(x, y, r): continue
    near = math.hypot(x, y)
    et = rnd.choice([1, 2, 2, 3]) if near < 20 else rnd.choice([1, 1, 2])
    ang = rnd.choice([0, math.pi / 2, math.pi, -math.pi / 2]) + rnd.uniform(-.05, .05)
    z0 = zg(x, y) - .05
    if rnd.random() < .62:
        K.maison(B, x, y, z0, ang, w, d, et, rnd.choice(['croupe', 'croupe', 'pignon', 'terrasse']), rnd.choice(murs_clairs),
                 rnd.choice(toits_bleus if rnd.random() < .7 else toits_chauds), rnd, volet=rnd.choice(K.VOLETS), balcon=rnd.random() < .35)
    else:
        T.casa(B, x, y, z0, ang, w, d, et, rnd.choice(murs_clairs), rnd.choice(toits_bleus if rnd.random() < .6 else toits_chauds), rnd)
    bloque(x, y, r)
# végétation : palmiers sur la place et le long des quais, arbres dans les jardins, campagne au-delà des remparts
for k in range(10):
    a = k / 10 * 2 * math.pi + .2; L.palm(BV, G(math.cos(a) * 5.6, math.sin(a) * 5.6, Z0), .42, H('#3f9a3a'), rnd)
for _ in range(160):
    x, y = rnd.uniform(-28, 40), rnd.uniform(-40, 42)
    if cote(x, y) < 1 or ilot_phare(x, y): continue
    if x + y > 44 or x > 31 or y > 31:
        K.platane(BV, x, y, zg(x, y), rnd.uniform(1.0, 1.5), rnd) if rnd.random() < .7 else K.cypres(BV, x, y, zg(x, y), 1.2)
    elif libre(x, y, .7) and rnd.random() < .5:
        L.palm(BV, G(x, y, zg(x, y)), rnd.uniform(.32, .45), H('#3f9a3a'), rnd); bloque(x, y, .7)
for k in range(-14, 6, 3): K.lampadaire(B, k - 4.0, -k - 13.5, Z0)

def tonneau(x, y): vs = C.bm_cyl(B.bm, G(x, y, Z0), G(x, y, Z0 + .45), .2, .2, 10); B.paint(vs, H('#8a4f24'), .06)
def caisse(x, y, a): K.box(B, K.Frame(x, y, Z0, a), -.25, .25, -.25, .25, 0, .45, H('#b88a52'), .07)
def jardiniere(x, y, a):
    F = K.Frame(x, y, Z0, a); K.box(B, F, -.6, .6, -.25, .25, 0, .3, H('#c9b28a'), .03)
    for q in range(4):
        vs = C.bm_ico(BV.bm, F.p(-.45 + q * .3, 0, .42), .2, 1); BV.paint(vs, H(['#e8536a', '#f2b632', '#ffffff', '#d95fb0'][q]) if q % 2 else H('#4f9a3a'), .06)
def banc(x, y, a): F = K.Frame(x, y, Z0, a); K.box(B, F, -.55, .55, -.15, .15, .25, .33, H('#8a6440'), .04); [K.box(B, F, u - .05, u + .05, -.12, .12, 0, .25, K.FER, .02) for u in (-.45, .45)]
for k in range(16):
    a = k / 16 * 2 * math.pi + .1; r = PLACE[2] - .5
    if k % 4 == 0: K.lampadaire(B, math.cos(a) * r, math.sin(a) * r, Z0)
    elif k % 4 == 2: jardiniere(math.cos(a) * (r - .4), math.sin(a) * (r - .4), a + math.pi / 2)
    else: banc(math.cos(a) * (r - .6), math.sin(a) * (r - .6), a + math.pi / 2)
for k in range(260):
    x, y = rnd.uniform(-22, 24), rnd.uniform(-26, 24)
    if not (abs(x) < 1.15 or abs(y) < 1.15 or abs((x - y) * .7071) < .9 or 2.2 < cote(x, y) < 3.4): continue
    if any(math.hypot(x - a, y - b) < c + .3 for a, b, c in RES): continue
    r_ = rnd.random()
    if r_ < .3: tonneau(x, y)
    elif r_ < .6: caisse(x, y, rnd.random())
    elif r_ < .8: jardiniere(x, y, rnd.choice([0, math.pi / 2]))
    else: K.lampadaire(B, x, y, Z0)
for b in (BS, B, BG, BL, BV, BE): b.done()

# ------------------------------------------------------------------ mer
EAU = bpy.data.collections.new('VP_EAU'); sc.collection.children.link(EAU)
me = bpy.data.meshes.new('VP_mer'); bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=400); bm.to_mesh(me); bm.free()
mer = bpy.data.objects.new('VP_mer', me); EAU.objects.link(mer)
m = bpy.data.materials.new('VP_Mer'); m.use_nodes = True; nt = m.node_tree; bs = nt.nodes['Principled BSDF']
bs.inputs['Roughness'].default_value = .1
if 'Specular IOR Level' in bs.inputs: bs.inputs['Specular IOR Level'].default_value = .55
nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 3.0; nz.inputs['Detail'].default_value = 5
tc = nt.nodes.new('ShaderNodeTexCoord'); mp = nt.nodes.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (1, 2.5, 1)
nt.links.new(tc.outputs['Object'], mp.inputs['Vector']); nt.links.new(mp.outputs['Vector'], nz.inputs['Vector'])
bp = nt.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = .35; bp.inputs['Distance'].default_value = .1
nt.links.new(nz.outputs['Fac'], bp.inputs['Height']); nt.links.new(bp.outputs['Normal'], bs.inputs['Normal'])
# couleur : turquoise près des quais (eau peu profonde), bleu profond au large
gw = nt.nodes.new('ShaderNodeTexGradient'); gw.gradient_type = 'SPHERICAL'
mp2 = nt.nodes.new('ShaderNodeMapping'); mp2.inputs['Location'].default_value = (.0, .0, 0); mp2.inputs['Scale'].default_value = (1 / 60, 1 / 60, 1)
nt.links.new(tc.outputs['Object'], mp2.inputs['Vector']); nt.links.new(mp2.outputs['Vector'], gw.inputs['Vector'])
cr = nt.nodes.new('ShaderNodeValToRGB'); e = cr.color_ramp.elements
e[0].position = .0; e[0].color = (.008, .1, .26, 1); e[1].position = .78; e[1].color = (.04, .5, .6, 1)
nt.links.new(gw.outputs['Fac'], cr.inputs['Fac']); nt.links.new(cr.outputs['Color'], bs.inputs['Base Color'])
me.materials.append(m)
BF = L.Batch('VP_ecume', EAU, M['peint'], True)
for i in range(420):
    x = -42 + i * .2; lo, hi = -60.0, 40.0
    for _ in range(40):
        mid = (lo + hi) / 2
        if cote(x, mid) > 0: hi = mid
        else: lo = mid
    y = (lo + hi) / 2 - .25
    if y < -42: continue
    for q in range(2):
        vs = C.bm_ico(BF.bm, G(x + rnd.uniform(-.2, .2), y - q * .55 - rnd.uniform(0, .3), .03 - q * .01), rnd.uniform(.35, .6), 1, (1, 1, .05)); BF.paint(vs, C.mix(H('#ffffff'), H('#bfeef0'), q * .7), .03)
for k in range(80):
    a = k / 80 * 2 * math.pi; vs = C.bm_ico(BF.bm, G(-15 + math.cos(a) * 3.4, -18 + math.sin(a) * 3.4, .03), rnd.uniform(.3, .55), 1, (1, 1, .05)); BF.paint(vs, H('#f4fbfc'), .03)
BF.done()

# ------------------------------------------------------------------ ciel, soleil, rendu
w = sc.world; nt = w.node_tree; bg = nt.nodes['Background']
sky = nt.nodes.new('ShaderNodeTexSky'); sky.sky_type = 'HOSEK_WILKIE'
try: sky.turbidity = 2.6; sky.sun_direction = Vector((-.5, .35, .55)).normalized()
except Exception: pass
nt.links.new(sky.outputs['Color'], bg.inputs['Color']); bg.inputs['Strength'].default_value = .1
sun = bpy.data.lights.new('VP_Soleil', 'SUN'); sun.energy = 5.6; sun.angle = math.radians(2.0); sun.color = (1.0, .86, .68)
so = bpy.data.objects.new('VP_Soleil', sun); sc.collection.objects.link(so)
Ldir = Vector((-.78, -.22, .58)).normalized()                       # soleil d'après-midi au sud-ouest (Blender : x est, y nord)
so.rotation_euler = (-Ldir).to_track_quat('-Z', 'Y').to_euler()

for mn in ('RK_Peint', 'RK_Glace'):
    mt = bpy.data.materials[mn]; nt2 = mt.node_tree; bsdf = nt2.nodes['Principled BSDF']; vc = [n for n in nt2.nodes if n.bl_idname == 'ShaderNodeVertexColor'][0]
    tc2 = nt2.nodes.new('ShaderNodeTexCoord'); n1 = nt2.nodes.new('ShaderNodeTexNoise'); n1.inputs['Scale'].default_value = 9; n1.inputs['Detail'].default_value = 6
    nt2.links.new(tc2.outputs['Object'], n1.inputs['Vector'])
    mr = nt2.nodes.new('ShaderNodeMapRange'); mr.inputs['To Min'].default_value = .86; mr.inputs['To Max'].default_value = 1.1
    nt2.links.new(n1.outputs['Fac'], mr.inputs['Value'])
    mx = nt2.nodes.new('ShaderNodeMix'); mx.data_type = 'RGBA'; mx.blend_type = 'MULTIPLY'; mx.inputs['Factor'].default_value = 1.0
    nt2.links.new(vc.outputs['Color'], mx.inputs['A']); nt2.links.new(mr.outputs['Result'], mx.inputs['B'])
    nt2.links.new(mx.outputs['Result'], bsdf.inputs['Base Color'])
C.render_settings(SPP)
sc.render.film_transparent = False
sc.cycles.max_bounces = 6; sc.cycles.diffuse_bounces = 3
sc.render.line_thickness = 1.35 * PCT / 100 * 1.25
vl = sc.view_layers[0]; fs = vl.freestyle_settings; ls = fs.linesets[0]
ls.select_by_collection = True; ls.collection = EAU; ls.collection_negation = 'EXCLUSIVE'
ls.linestyle.alpha = .62; ls.linestyle.color = (.16, .1, .08)
sc.view_settings.view_transform = 'AgX'
try: sc.view_settings.look = 'AgX - Punchy'
except Exception:
    try: sc.view_settings.look = 'Punchy'
    except Exception: pass
sc.view_settings.exposure = .45
cam = bpy.data.cameras.new('VP_Cam'); cam.lens = 30; cam.clip_end = 2000
co = bpy.data.objects.new('VP_Cam', cam); sc.collection.objects.link(co); sc.camera = co
co.location = G(23.0, 29.0, 24.0); tgt = G(-.8, -.6, 0.0)
co.rotation_euler = (tgt - co.location).to_track_quat('-Z', 'Y').to_euler()
sc.render.resolution_x = 1600; sc.render.resolution_y = 983; sc.render.resolution_percentage = PCT
t = time.time(); sc.render.filepath = OUT; bpy.ops.render.render(write_still=True)
Z = {}
for k, pts in ANCRES.items():
    P = [world_to_camera_view(sc, co, p) for p in pts]
    xs = [p.x * 1400 for p in P]; ys2 = [(1 - p.y) * 860 for p in P]
    Z[k] = {'x0': round(min(xs)), 'y0': round(min(ys2)), 'x1': round(max(xs)), 'y1': round(max(ys2))}
json.dump(Z, open(os.path.splitext(OUT)[0] + '.json', 'w'), indent=1)
print('rendu', round(time.time() - t, 1), 's', Z)
