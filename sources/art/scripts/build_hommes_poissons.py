"""Île des Hommes-Poissons — scène Blender détaillée (île 14), kit rk_corail.py (+ pièces génériques de rk_port, rk_retrofutur), plan hp_plan.py.
Canon [C] / [C?] / [I] : voir hp_plan.py et art/data/fiches/hommes_poissons.json. Exclus : personnages, sirènes, hommes-poissons, monstres,
navires identifiables, Poneglyph, symboles, copie de tout décor officiel.
Usage : python3 build_hommes_poissons.py → art/blender/islands/hommes_poissons.blend   (puis export_island.py hommes_poissons)
"""
import sys, os, math, random, time
sys.path.insert(0, os.path.dirname(__file__))
import bpy, bmesh
import rk_common as C, rk_lib as L, rk_port as K, rk_corail as Q, rk_retrofutur as RF
import hp_plan as P

T0 = time.time(); rnd = random.Random(1414)
sc = C.new_scene(); M = C.materials()
SOL, DECOR, V2, V3, V4 = C.coll('RK_SOL'), C.coll('RK_DECOR'), C.coll('RK_VILLE_2'), C.coll('RK_VILLE_3'), C.coll('RK_VILLE_4')
LV = {1: DECOR, 2: V2, 3: V3, 4: V4}; H = C.hexc; G = C.g2b
T = {k: (L.Batch('HP_ville_%d' % k, LV[k], M['peint']), L.Batch('HP_verre_%d' % k, LV[k], M['brillant']), L.Batch('HP_lueur_%d' % k, LV[k], M['lueur'])) for k in LV}
TM = (L.Batch('HP_monuments', DECOR, M['peint']), L.Batch('HP_monuments_verre', DECOR, M['brillant']), L.Batch('HP_monuments_lueur', DECOR, M['lueur']))
BE = L.Batch('HP_eau', DECOR, M['eau'], False); BV = L.Batch('HP_recif', DECOR, M['peint']); BR = L.Batch('HP_rues', DECOR, M['peint'], False)
BB = L.Batch('HP_bulles', DECOR, M['brillant'])
zg = P.height

# ------------------------------------------------------------------ 1. sol : butte de récif rose et sable [C : récif ; couleurs I]
bm = bmesh.new(); colL = bm.verts.layers.float_color.new('Col'); step = .5; ext = 35.0; n = int(2 * ext / step) + 1; grid = {}
for j in range(n):
    for i in range(n):
        x = -ext + i * step; y = -ext + j * step; r, th, q = P.pol(x, y)
        if q > 1.1: continue
        h = zg(x, y); v = bm.verts.new(G(x, y, h)); grid[(i, j)] = v; z_ = P.zone(x, y)
        c = C.mix(H('#f4dccc'), H('#f0d0c0'), .5 + .5 * math.sin(x * .9 + y * .6))
        if z_ in ('recif', 'recif_haut'): c = C.mix(H('#eebcaa'), H('#f4d0b4'), .5 + .5 * math.sin(x * 1.3 + y * .9) * math.cos(y * .7))
        elif z_ == 'gyoverly': c = C.mix(H('#e8c4c0'), H('#dcb4b4'), .5 + .5 * math.sin(x * 1.1 + y))
        elif z_ == 'port': c = C.mix(H('#f4e4c0'), H('#e8d4a8'), .5 + .5 * math.sin(x * 2))
        elif z_ in ('dojo', 'usine', 'mall', 'salle'): c = H('#f0dccc')
        if h < .15: c = C.mix(H('#e8d4a8'), H('#f4e4c0'), max(0, h + .4))
        if P.eau(x, y) and h < .1: c = H('#c8b890')
        v[colL] = c
for (i, j), v in grid.items():
    qd = [(i, j), (i + 1, j), (i + 1, j + 1), (i, j + 1)]
    if all(k in grid for k in qd): bm.faces.new([grid[k] for k in qd])
ground = C.mk_obj('HP_sol', bm, SOL, M['peint'], smooth=False); ground.data.color_attributes.active_color = ground.data.color_attributes['Col']; C.normals_up(ground)

# rues [I] : anneaux et rayons ondulés en rubans lisses ; place Gyoncorde [C]
def ruban(pts, w, zoff, col, ok=lambda x, y: True):
    prev = None
    for k, (x, y) in enumerate(pts):
        x2, y2 = pts[min(k + 1, len(pts) - 1)]; x1, y1 = pts[max(k - 1, 0)]; tx, ty = x2 - x1, y2 - y1; l = math.hypot(tx, ty) or 1; nx_, ny_ = -ty / l * w / 2, tx / l * w / 2
        row = (BR.bm.verts.new(G(x + nx_, y + ny_, zg(x + nx_, y + ny_) + zoff)), BR.bm.verts.new(G(x - nx_, y - ny_, zg(x - nx_, y - ny_) + zoff)))
        BR.paint(row, col, .03)
        if prev and ok((x + pts[k - 1][0]) / 2, (y + pts[k - 1][1]) / 2): BR.bm.faces.new((prev[0], prev[1], row[1], row[0]))
        prev = row
px, py, pr = P.PLACE
OKR = lambda x, y: P.zone(x, y) in ('ville', 'moulins', 'gyoverly', 'recif_haut') and P.canal_d(x, y) > 1.0
for rr in P.ANNEAUX:
    ring = [(px + math.cos(a) * (rr + .4 * math.sin(a * 3 + rr)), py + math.sin(a) * (rr + .4 * math.sin(a * 3 + rr))) for a in [k / 160 * 2 * math.pi for k in range(161)]]
    ruban(ring, 1.1, .08, H('#fbf4e6'), OKR); ruban(ring, 1.5, .06, H('#e8c8b8'), OKR)
for k in range(P.RAYONS):
    a0 = k * 2 * math.pi / P.RAYONS + .3
    ray = [(px + math.cos(a0 - .12 * math.sin(d * .3)) * d, py + math.sin(a0 - .12 * math.sin(d * .3)) * d) for d in [pr + i * .5 for i in range(int((21 - pr) / .5))]]
    ruban(ray, 1.1, .1, H('#fbf4e6'), OKR); ruban(ray, 1.5, .07, H('#e8c8b8'), OKR)
Q.place_gyoncorde(TM, px, py, zg(px, py), pr, rnd)

# ------------------------------------------------------------------ 2. bulle géante à double couche [C] : verre en 2.5D, bord en anneaux en 3D
Rb, zcb = P.BULLE
for k, dr in enumerate((0, -.8)):
    Q.calotte(DECOR, 'HP_bulle_%d' % k, 0, 0, Rb + dr, zcb, -.05)
rb0 = math.sqrt(Rb ** 2 - zcb ** 2)
for zz, dr in ((.15, 0), (.55, -.6)): RF.torus(BB, 0, 0, zz, rb0 + dr, .14, Q.BULLE_C[0], 72, 5)

# ------------------------------------------------------------------ 3. palais Ryugu dans sa petite bulle au sommet [C], couloir de liaison [C]
ax, ay, ar = P.PALAIS; az = P.z_bulle(ax, ay) - .4
top = Q.palais(T[1], ax, ay, az, rnd)
Q.sphere_bulle(DECOR, 'HP_bulle_palais', ax, ay, az + 1.2, ar)
for zz, dr in ((az + 1.2, 0), (az + 1.6, -.25)): RF.torus(BB, ax, ay, zz, ar + dr, .08, Q.BULLE_C[0], 48, 5)
C.mark('DRAPEAU_palais', ax, ay, az + top + .4)
(c0, c1, c2) = P.COULOIR
RF.tube_verre(TM, [(c0[0] + 1.0, c0[1] + 3.6, az - .5), (c0[0] + 1.5, c0[1] + 4.6, az - 3.5), (c1[0], c1[1], 5.0), (c2[0], c2[1], zg(*c2) + 1.0)], .35)
RF.dome(TM, c2[0], c2[1], zg(*c2), 1.0, rnd)

# ------------------------------------------------------------------ 4. quartiers nommés [C] : port de Coral Hill, moulins, usine, centre commercial, salle, dojo (niveau 4)
for kk in (-1, 0, 1):                                                                                 # jetées de Coral Hill
    a = P.PORT_A + kk * .12; x, y = P.at_coast(a, .95); F = K.Frame(x, y, 0, a)
    K.box(TM[0], F, -.45, .45, -.8, 3.4 - abs(kk) * .6, .3, .45, H('#d8c0a0'), .04, True, True)
    for v in (.6, 1.6, 2.6): K.box(TM[0], F, -.45, .45, v - .07, v + .07, -.8, .3, H('#a08060'), .03)
C.mark('PONTON', *P.at_coast(P.PORT_A, 1.1), 0)
cx_, cy_ = P.at_coast(P.PORT_A + .22, .8); Q.maison_coquille(T[1], cx_, cy_, zg(cx_, cy_), P.PORT_A, 1.1, rnd)      # café de Coral Hill [C : café au port]
for k in range(3):
    a = k * 2.1; ux, uy = cx_ + math.cos(a) * 1.9, cy_ + math.sin(a) * 1.9
    vs = C.bm_cyl(T[1][0].bm, G(ux, uy, zg(ux, uy)), G(ux, uy, zg(ux, uy) + 1.1), .04, .04, 5); T[1][0].paint(vs, Q.NACRE[0], .02)
    Q.dome_cotes(T[1][0], ux, uy, zg(ux, uy) + 1.0, .55, .25, 8, Q.RECIF[k * 2], 14, 3)
for (ax_, ay_), (bx_, by_) in zip(P.CANAL, P.CANAL[1:]):                                              # canal et moulins à eau
    dx, dy = bx_ - ax_, by_ - ay_; l = math.hypot(dx, dy); nx_, ny_ = -dy / l * .75, dx / l * .75
    vs = [BE.bm.verts.new(G(px_, py_, .25)) for px_, py_ in ((ax_ + nx_, ay_ + ny_), (bx_ + nx_, by_ + ny_), (bx_ - nx_, by_ - ny_), (ax_ - nx_, ay_ - ny_))]
    BE.bm.faces.new(vs); BE.paint(vs, H('#5ab4d8'), .03)
for k, ((ax_, ay_), (bx_, by_)) in enumerate(zip(P.CANAL, P.CANAL[1:])):
    mx, my = (ax_ + bx_) / 2, (ay_ + by_) / 2; Q.roue_a_aubes(T[3][0], mx, my, .25, math.atan2(by_ - ay_, bx_ - ax_), .9, rnd)
ux, uy = P.USINE; Q.usine_bonbons(T[3], ux, uy, zg(ux, uy), math.atan2(py - uy, px - ux), rnd)
mx, my = P.MALL; Q.centre_commercial(T[2], mx, my, zg(mx, my), 0, rnd)
sx, sy = P.SALLE; Q.salle_reunion(T[2], sx, sy, zg(sx, sy), 0, rnd)
dx, dy = P.DOJO; Q.dojo(T[4], dx, dy, zg(dx, dy), math.atan2(py - dy, px - dx), rnd)
crx, cry, crr = P.CRIQUE                                                                              # crique des Sirènes : eau, rochers, coquillages [I]
vs = [BE.bm.verts.new(G(crx + math.cos(a) * crr, cry + math.sin(a) * crr, -.05)) for a in [k / 40 * 2 * math.pi for k in range(40)]]; BE.bm.faces.new(vs); BE.paint(vs, H('#4ac0d8'), .03)
for k in range(7):
    a = k / 7 * 2 * math.pi + .3; x, y = crx + math.cos(a) * (crr + .4), cry + math.sin(a) * (crr + .4)
    vs = C.bm_ico(TM[0].bm, G(x, y, zg(x, y) + .1), .5 + .4 * rnd.random(), 1, (1, 1, .6), .3, rnd.random() * 9); TM[0].paint(vs, H('#d8b8b0'), .05)

# ------------------------------------------------------------------ 5. maisons-coquillages, grappes de bulles, tours en conques [C?] ; manoirs Gyoverly [C]
nb = 0; cnt = {}
FN = {'coquille': lambda t, b: Q.maison_coquille(t, b['x'], b['y'], zg(b['x'], b['y']), b['ang'], b['s'], rnd),
      'bulle': lambda t, b: Q.grappe_bulles(t, b['x'], b['y'], zg(b['x'], b['y']), b['ang'], b['s'], rnd),
      'conque': lambda t, b: Q.conque(t, b['x'], b['y'], zg(b['x'], b['y']), b['s'], rnd),
      'manoir': lambda t, b: Q.manoir(t, b['x'], b['y'], zg(b['x'], b['y']), b['ang'], b['s'], rnd)}
for b in P.batiments():
    FN[b['type']](T[b['niveau']], b); nb += 1; cnt[b['type']] = cnt.get(b['type'], 0) + 1

# ------------------------------------------------------------------ 6. récif : coraux, algues, éponges [C?] ; bulles d'air qui montent
VEG = {'corail': Q.corail, 'algue': Q.algue, 'eponge': Q.eponge}
for x, y, s, kind, lv in P.arbres(): VEG[kind](BV, x, y, zg(x, y), s, rnd)
Q.bulles_flottantes(BB, rnd, 30, 28, 3, 13, lambda x, y: P.zone(x, y) != 'mer' and math.hypot(x - P.BADGE3D[0], y - P.BADGE3D[1]) > 3)

for Bt in [b for t in T.values() for b in t] + list(TM) + [BE, BV, BR, BB]: Bt.done()
os.makedirs(os.path.join(C.ART, 'blender', 'islands'), exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(C.ART, 'blender', 'islands', 'hommes_poissons.blend'))
tris = sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in bpy.data.objects if o.type == 'MESH' and not o.get('rk_25d_seul'))
per = {o.name: sum(len(p.vertices) - 2 for p in o.data.polygons) for o in bpy.data.objects if o.type == 'MESH'}
print('HOMMES-POISSONS ok', round(time.time() - T0, 1), 's · bâtiments', nb, cnt, '· triangles (hors bulles 2.5D)', tris, per)
