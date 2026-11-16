"""Wano — scène Blender détaillée (île 5), kit japonais rk_wano.py (+ pièces génériques de rk_port), plan wa_plan.py.
Canon [C] / [C?] / [I] : voir wa_plan.py et art/data/fiches/wano.json. Exclus : personnages, carpes géantes, emblèmes, décors officiels.
Usage : python3 build_wano.py → art/blender/islands/wano.blend   (puis export_island.py wano)
"""
import sys, os, math, random, time
sys.path.insert(0, os.path.dirname(__file__))
import bpy, bmesh
import rk_common as C, rk_lib as L, rk_port as K, rk_wano as J
import wa_plan as P

T0 = time.time(); rnd = random.Random(1192)
sc = C.new_scene(); M = C.materials()
SOL, DECOR, V2, V3, V4 = C.coll('RK_SOL'), C.coll('RK_DECOR'), C.coll('RK_VILLE_2'), C.coll('RK_VILLE_3'), C.coll('RK_VILLE_4')
LV = {1: DECOR, 2: V2, 3: V3, 4: V4}; H = C.hexc; G = C.g2b
B = {k: L.Batch('WA_ville_%d' % k, LV[k], M['peint']) for k in LV}
BM = L.Batch('WA_monuments', DECOR, M['peint']); BE = L.Batch('WA_eau', DECOR, M['eau'], False)
BV = {k: L.Batch('WA_vegetation_%d' % k, LV[k], M['peint']) for k in LV}
zg = P.height


def zfoot(x, y, ang, w, d):
    c, s = math.cos(ang), math.sin(ang)
    return min(zg(x + su * w / 2 * -s + sv * d / 2 * c, y + su * w / 2 * c + sv * d / 2 * s) for su in (-1, 1) for sv in (-1, 1))


# ------------------------------------------------------------------ 1. sol : six régions aux climats différents, murs de roche, Fuji enneigé
REG = {'capitale': (H('#d9cfb8'), H('#e2d6c0')), 'ebisu': (H('#c4b090'), H('#b8a482')), 'ringo': (H('#eef1f6'), H('#d8dde6')),
       'hakumai': (H('#c9944a'), H('#b9773a')), 'udon': (H('#5e9a48'), H('#6fae52')), 'kuri': (H('#a8885e'), H('#8f7450')),
       'kibi': (H('#9a9488'), H('#8a8478')), 'fuji': (H('#7f8a6a'), H('#8e967a'))}
bm = bmesh.new(); colL = bm.verts.layers.float_color.new('Col'); step = .5; ext = 38.0; n = int(2 * ext / step) + 1; grid = {}
for j in range(n):
    for i in range(n):
        x = -ext + i * step; y = -ext + j * step; r, th, q = P.pol(x, y)
        if q > 1.1: continue
        h = zg(x, y); v = bm.verts.new(G(x, y, h)); grid[(i, j)] = v
        z_ = P.zone(x, y); reg = P.region(th); t = .5 + .5 * math.sin(x * 1.3 + y * .7) * math.cos(y * 1.1 - x * .5)
        if z_ in REG: c = C.mix(*REG[z_], t)
        else: c = C.mix(H('#7e766a'), H('#948a7c'), (int(h * 1.6) % 2) * .7)                                  # roche des murs (strates)
        if z_ == 'mur' and P.pente(x, y) < .8 and h > P.Z_MUR - 1.2:                                          # dessus des murs : herbe / neige / feuilles
            c = {'ringo': H('#eef1f6'), 'hakumai': H('#b9773a'), 'udon': H('#5e8a48'), 'kuri': H('#8f7a5a'), 'kibi': H('#857f72')}[reg] if True else c
        if z_ == 'fuji':
            if h > 17.5: c = C.mix(H('#f4f6fa'), H('#e6eaf2'), t)                                               # neige du sommet
            elif h > 13: c = C.mix(H('#9a8f80'), H('#857a6c'), t)
        if z_ in ('capitale', 'ebisu') and (abs(((x - .6) % 4.6) - 2.3) > 1.95 or (y + 14) % 5.5 < 1.0): c = H('#e6dfcc')     # rues de la capitale
        if P.route_at(x, y): c = H('#d6c8a6') if reg != 'ringo' else H('#dfe3ea')
        if P.riviere_at(x, y, .35) and not P.riviere_at(x, y): c = H('#8a8478')                                    # berges de pierre
        if P.water_at(x, y) is not None: c = H('#5f8a98')
        if q >= .995: c = H('#6f685e')
        v[colL] = c
for (i, j), v in grid.items():
    qd = [(i, j), (i + 1, j), (i + 1, j + 1), (i, j + 1)]
    if all(k in grid for k in qd): bm.faces.new([grid[k] for k in qd])
ground = C.mk_obj('WA_sol', bm, SOL, M['peint'], smooth=False); ground.data.color_attributes.active_color = ground.data.color_attributes['Col']; C.normals_up(ground)

# ------------------------------------------------------------------ 2. eau : rivière en anneau, bras, rizières, gorge ; cascades vers la mer [C]
st = .5
for j in range(int(2 * ext / st)):
    for i in range(int(2 * ext / st)):
        x = -ext + (i + .5) * st; y = -ext + (j + .5) * st; w = P.water_at(x, y)
        if w is None or P.pol(x, y)[2] >= P.Q_FAL - .01: continue
        qd = [BE.bm.verts.new(G(-ext + (i + a) * st, -ext + (j + b) * st, w)) for a, b in ((0, 0), (1, 0), (1, 1), (0, 1))]
        BE.bm.faces.new(qd); rz = any(math.hypot(x - P.at_q(qq, a)[0], y - P.at_q(qq, a)[1]) < rr for a, qq, rr in P.RIZIERES)
        BE.paint(qd, H('#7fb0a0') if rz else H('#2f86b0'), .05)
for a in P.RIVIERES:                                                                      # cascades : de l'eau intérieure jusqu'à la mer
    r0 = (P.Q_FAL - .02) * P.coast_r(a); r1 = 1.0 * P.coast_r(a) + .6
    F = K.Frame(math.cos(a) * r0, math.sin(a) * r0, 0, a)
    for k in range(5):
        u0 = -P.RIV_L / 2 + k * P.RIV_L / 5; u1 = u0 + P.RIV_L / 5 - .04
        K.quad(BE, F, [(u0, 0, P.Z_EAU), (u1, 0, P.Z_EAU), (u1, r1 - r0, .0), (u0, r1 - r0, .0)], H('#d8f2fa') if k % 2 else H('#bfe6f4'), .04)
    for k in range(7):
        vs = C.bm_uvsphere(BE.bm, F.p(rnd.uniform(-1, 1), r1 - r0 + rnd.uniform(-.2, .8), .05), 1, 8, 4, (.5, .5, .2)); BE.paint(vs, H('#f2fbff'), .02)
    for k in range(10):                                                                     # tourbillon au pied [C]
        t = k / 10 * 6.283; rr = 1.6 + .25 * k / 10
        vs = C.bm_uvsphere(BE.bm, F.p(math.cos(t) * rr, r1 - r0 + 2.2 + math.sin(t) * rr * .7, .02), 1, 6, 3, (.35, .35, .05)); BE.paint(vs, H('#e6f6fb'), .02)

# ------------------------------------------------------------------ 3. Capitale des Fleurs [C] : château du shogun [C?], enceinte, pagode, lanternes
cx, cy = P.CHATEAU; zc = zg(cx, cy)
ztop = J.chateau(BM, cx, cy, zc, rnd)
C.mark('DRAPEAU_chateau', cx, cy, zc + ztop + .4)
pts = [(cx + math.cos(k / 20 * 6.283) * 3.0, cy + math.sin(k / 20 * 6.283) * 2.6) for k in range(21)]
J.enceinte_jp(BM, pts[:9], zg); J.enceinte_jp(BM, pts[11:], zg)
J.torii(BM, cx + math.cos(math.pi * .9) * 3.4, cy + math.sin(math.pi * .9) * 3.0, zg(cx - 3.3, cy + .9), math.pi * .9 + math.pi / 2, .7, H('#3f4a4c'))
zpg = J.pagode(B[4], P.PAGODE[0], P.PAGODE[1], zg(*P.PAGODE))
for k in range(16):
    a = k / 16 * 6.283; x, y = cx + math.cos(a) * 3.6, cy + math.sin(a) * 3.2
    if not P.obstacle(x, y) or True:
        if k % 2: J.lanterne(BM, x, y, zg(x, y))
fx, fy = P.FUJI[0], P.FUJI[1]
J.torii(BM, fx + 4.2, fy + 4.6, zg(fx + 4.2, fy + 4.6), math.radians(-135), .9)                 # torii au pied du Fuji [I]
C.mark('DRAPEAU_fuji', fx + 3.6, fy + 3.6, zg(fx + 3.6, fy + 3.6) + 3.2)

# ------------------------------------------------------------------ 4. ponts sur la rivière en anneau [I], routes
for nm, a in P.ROUTES.items():
    rr = P.Q_ANNEAU * P.coast_r(a); x, y = math.cos(a) * rr, math.sin(a) * rr
    J.pont_jp(BM, x, y, a, P.ANNEAU_L + 1.4, .9, P.Z_EAU + .35, .7)
    for qq in (.55, .7):
        x2, y2 = P.at_q(qq, a); J.lanterne(BM, x2 + math.cos(a + 1.57) * .9, y2 + math.sin(a + 1.57) * .9, zg(x2, y2))
for a in P.RIVIERES:                                                                          # passerelles sur les bras près de l'anneau
    for qq in (.58, .72):
        rr = qq * P.coast_r(a); x, y = math.cos(a) * rr, math.sin(a) * rr
        J.pont_jp(B[2 if qq > .6 else 1], x, y, a + math.pi / 2, P.RIV_L + 1.2, .7, P.Z_EAU + .3, .45, H('#8a6440'))

# ------------------------------------------------------------------ 5. régions [C]
# Kuri : ruines du château d'Oden sur la montagne, grand torii [C?], Bakura au pied
a, qq, rr, hh = P.ODEN; ox, oy = P.at_q(qq, a)
J.ruine_brulee(BM, ox, oy, zg(ox, oy) - .2, rnd)
tx, ty = P.at_q(P.TORII_KURI[1], P.TORII_KURI[0]); J.torii(BM, tx, ty, zg(tx, ty), P.TORII_KURI[0] + math.pi / 2, 1.5)
# Ringo : cimetière du nord sur son plateau, pont Oihagi au-dessus de la gorge [C]
a, qq, rr = P.CIMETIERE; gx, gy = P.at_q(qq, a)
for k in range(46):
    t = rnd.uniform(0, 6.283); d = rr * .85 * math.sqrt(rnd.random()); x, y = gx + math.cos(t) * d, gy + math.sin(t) * d
    J.stele(BM, x, y, zg(x, y), rnd)
ab = (gx + math.cos(a + math.pi) * (rr - .2), gy + math.sin(a + math.pi) * (rr - .2)); bb = (gx + math.cos(a + math.pi) * (rr + P.GORGE_L + .6), gy + math.sin(a + math.pi) * (rr + P.GORGE_L + .6))
J.pont_long(BM, ab, bb, max(zg(*ab), zg(*bb)) + .05)
K.maison  # (pièce générique non utilisée ici : les maisons de Ringo sont des minka enneigées)
# Udon : mine détruite envahie par la végétation [C]
a, qq, rr = P.MINE; mx, my = P.at_q(qq, a)
for k in range(6):
    t = k / 6 * 6.283; x, y = mx + math.cos(t) * rr * .7, my + math.sin(t) * rr * .7; F = K.Frame(x, y, zg(x, y), t)
    K.box(BM, F, -.5, .5, -.06, .06, 0, 1.1, H('#6b5a48'), .05); K.box(BM, F, -.6, .6, -.08, .08, 1.1, 1.22, H('#6b5a48'), .05)
for k in range(10):
    t = rnd.uniform(0, 6.283); d = rnd.uniform(0, rr); x, y = mx + math.cos(t) * d, my + math.sin(t) * d; J.feuillu(BV[1], x, y, zg(x, y), .7 + .3 * rnd.random(), rnd)
# Kibi : usines sur les rochers [C]
# Hakumai : port de Mogura [C] (tunnel derrière une cascade, télécabine) [forme I]
a, qq = P.MOGURA; r1 = P.coast_r(a); dx_, dy_ = math.cos(a), math.sin(a)
F = K.Frame(dx_ * (r1 - 1.2), dy_ * (r1 - 1.2), .6, a)
K.box(BM, F, -2.2, 2.2, -1.2, 1.0, -.8, .65, K.PIERRE2, .04)
for k in range(3): K.box(BM, F, -1.8 + k * 1.6, -1.4 + k * 1.6, .9, 3.4, .5, .62, K.BOIS, .05)
K.quad(BM, F, [(-.9, -1.25, .65), (.9, -1.25, .65), (.9, -1.25, 2.6), (-.9, -1.25, 2.6)], H('#1e1a18'), .02)                  # bouche du tunnel
for k in range(3): K.navire(BM if k == 0 else B[2], dx_ * (r1 + 2.0) + math.cos(a + 1.57) * (k - 1) * 2.6, dy_ * (r1 + 2.0) + math.sin(a + 1.57) * (k - 1) * 2.6, a + math.pi / 2, 2.8, rnd, H('#f0e6d0'), H('#6a4a30'), 1)
inner = P.at_q(P.Q_MUR0 - .04, a)
J.telecabine(BM, (dx_ * (r1 - 1.8), dy_ * (r1 - 1.8)), inner, .65, zg(*inner))
C.mark('PONTON', dx_ * (r1 + 1.5), dy_ * (r1 + 1.5), 0)

# ------------------------------------------------------------------ 6. maisons et usines (plan de production)
nb = 0; cnt = {}
for b in P.batiments():
    lv = b['niveau']; typ = b['type']; z0 = zfoot(b['x'], b['y'], b['ang'], b['w'], b['d']); reg = b['zone']
    if typ == 'usine':
        J.usine(B[lv], b['x'], b['y'], zg(b['x'], b['y']) - .1, b['ang'], b['w'], b['d'], rnd)
    elif typ in ('machiya', 'machiya2'):
        J.machiya(B[lv], b['x'], b['y'], z0, b['ang'], b['w'], b['d'], 2 if typ == 'machiya2' else 1, rnd)
    elif typ == 'cabane':
        J.cabane(B[lv], b['x'], b['y'], z0, b['ang'], b['w'], b['d'], rnd)
    else:
        if rnd.random() < .45 or reg == 'ringo': J.minka(B[lv], b['x'], b['y'], z0, b['ang'], b['w'], b['d'], rnd, reg == 'ringo', reg == 'hakumai')
        else: J.machiya(B[lv], b['x'], b['y'], z0, b['ang'], b['w'], b['d'], 1, rnd, reg == 'ringo')
    nb += 1; cnt[typ] = cnt.get(typ, 0) + 1

# ------------------------------------------------------------------ 7. végétation par région
for x, y, s, kind, lv in P.arbres():
    z = zg(x, y)
    if kind == 'sakura': J.sakura(BV[lv], x, y, z, s, rnd)
    elif kind == 'pin': J.pin_jp(BV[lv], x, y, z, s, rnd, P.region(math.atan2(y, x)) == 'ringo' and P.dcoast(x, y) > P.Q_CAP)
    elif kind == 'pin_neige': J.pin_neige(BV[lv], x, y, z, s)
    elif kind == 'erable': J.erable(BV[lv], x, y, z, s, rnd)
    elif kind == 'feuillu': J.feuillu(BV[lv], x, y, z, s, rnd)
    elif kind == 'bambou': J.bambou(BV[lv], x, y, z, s, rnd)
    else: J.arbre_mort(BV[lv], x, y, z, s, rnd)

for Bt in list(B.values()) + list(BV.values()) + [BM, BE]: Bt.done()
os.makedirs(os.path.join(C.ART, 'blender', 'islands'), exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(C.ART, 'blender', 'islands', 'wano.blend'))
tris = sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in bpy.data.objects if o.type == 'MESH')
print('WANO ok', round(time.time() - T0, 1), 's · bâtiments', nb, cnt, '· triangles', tris, '· château', round(zc + ztop, 1))
