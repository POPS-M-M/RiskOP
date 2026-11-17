"""God Valley — scène Blender détaillée (île 17), kit rk_valley.py (+ pièces génériques de rk_port, rk_savoir), plan gv_plan.py.
Canon [C] / [C?] / [I] : voir gv_plan.py et art/data/fiches/god_valley.json. Exclus : personnages, Dragons Célestes, navires, emblèmes,
scènes de chasse ou de combat, copie de l'image de référence.
Usage : python3 build_god_valley.py → art/blender/islands/god_valley.blend   (puis export_island.py god_valley)
"""
import sys, os, math, random, time
sys.path.insert(0, os.path.dirname(__file__))
import bpy, bmesh
import rk_common as C, rk_lib as L, rk_port as K, rk_savoir as Q, rk_valley as V
import gv_plan as P

T0 = time.time(); rnd = random.Random(1717)
sc = C.new_scene(); M = C.materials()
SOL, DECOR, V2, V3, V4 = C.coll('RK_SOL'), C.coll('RK_DECOR'), C.coll('RK_VILLE_2'), C.coll('RK_VILLE_3'), C.coll('RK_VILLE_4')
LV = {1: DECOR, 2: V2, 3: V3, 4: V4}; H = C.hexc; G = C.g2b
B = {k: L.Batch('GV_ville_%d' % k, LV[k], M['peint']) for k in LV}
BA = L.Batch('GV_aiguilles', DECOR, M['peint'], False); BV = L.Batch('GV_vegetation', DECOR, M['peint']); BR = L.Batch('GV_rues', DECOR, M['peint'], False)
zg = P.height

# ------------------------------------------------------------------ 1. sol : pied rocheux, avancée, quai au ras de l'eau, plages
bm = bmesh.new(); colL = bm.verts.layers.float_color.new('Col'); step = .5; ext = 34.0; n = int(2 * ext / step) + 1; grid = {}
for j in range(n):
    for i in range(n):
        x = -ext + i * step; y = -ext + j * step; r, th, q = P.pol(x, y)
        if q > 1.1: continue
        h = zg(x, y); v = bm.verts.new(G(x, y, h)); grid[(i, j)] = v; z_ = P.zone(x, y)
        e = P.mont_e(x, y)
        c = C.mix(H('#b8783e'), H('#a8682e'), .5 + .5 * math.sin(x * 1.3 + y * .7))                    # éboulis ocre
        if z_ in ('pied', 'palais') and (1.15 < e or math.sin(x * .9) * math.cos(y * .8) > .2): c = C.mix(c, H('#5a8a3c'), .7)   # touffes vertes (le palais n'apparaît qu'au niveau 4)
        if z_ == 'avancee': c = V.eclaire(C.mix(H('#c27c3e'), H('#a8642e'), .5 + .5 * math.sin(x * 2)), -1 if y < P.AVANCEE[0][1] + (x - 13) * .36 else .2, .4)
        elif z_ == 'quai': c = C.mix(H('#e2dccc'), H('#d6cfbc'), .5 + .5 * math.sin(x * 2.1 + y * 1.3))
        elif z_ == 'port': c = C.mix(H('#d8c49a'), H('#c8b48a'), .5 + .5 * math.sin(x * 2))
        if z_ == 'plage' or q > .94: c = C.mix(H('#d8c49a'), H('#c8b48a'), .5 + .5 * math.sin(x * 3 + y))
        if h < .15: c = C.mix(H('#b8a888'), H('#d8c49a'), max(0, h + .6))
        v[colL] = c
for (i, j), v in grid.items():
    qd = [(i, j), (i + 1, j), (i + 1, j + 1), (i, j + 1)]
    if all(k in grid for k in qd): bm.faces.new([grid[k] for k in qd])
ground = C.mk_obj('GV_sol', bm, SOL, M['peint'], smooth=False); ground.data.color_attributes.active_color = ground.data.color_attributes['Col']; C.normals_up(ground)

# quai circulaire [I] en ruban lisse, au ras de l'eau
def ruban(pts, w, zoff, col, ferme=False):
    prev = None; first = None
    for k, (x, y) in enumerate(pts):
        x2, y2 = pts[(k + 1) % len(pts)] if ferme else pts[min(k + 1, len(pts) - 1)]; x1, y1 = pts[k - 1] if ferme else pts[max(k - 1, 0)]
        tx, ty = x2 - x1, y2 - y1; l = math.hypot(tx, ty) or 1; nx_, ny_ = -ty / l * w / 2, tx / l * w / 2
        row = (BR.bm.verts.new(G(x + nx_, y + ny_, zg(x + nx_, y + ny_) + zoff)), BR.bm.verts.new(G(x - nx_, y - ny_, zg(x - nx_, y - ny_) + zoff)))
        BR.paint(row, col, .04)
        if prev and P.zone((x + pts[k - 1][0]) / 2, (y + pts[k - 1][1]) / 2) in ('quai', 'pied', 'port'): BR.bm.faces.new((prev[0], prev[1], row[1], row[0]))
        prev = row
ruban([P.at_coast(a, .9) for a in [k / 160 * 2 * math.pi for k in range(161)]], 1.0, .08, H('#cfc4aa'))

# ------------------------------------------------------------------ 2. la montagne coupée en deux [I d'après la description ; C : falaises, montagnes]
mx, my = P.MONT
for side in (-1, 1):
    top = V.demi_mont(BA, mx, my, P.PIED - .2, P.PROFIL, side, P.FAILLE / 2, rnd)
    C.mark('DRAPEAU_tour_%d' % side, mx + side * 4.5, my, top + 1.0)
for k, (ax, ay, rb, hh, lx, ly, tp) in enumerate(P.PITONS):                       # piton moyen à gauche, petit à droite
    z0 = min(zg(ax + math.cos(a) * rb, ay + math.sin(a) * rb) for a in [t / 8 * 2 * math.pi for t in range(8)])
    V.aiguille(BA, ax, ay, z0, rb, hh, lx, ly, rnd, None, 18, 13, tp); V.touffes(BV, ax, ay, z0, rb, hh, lx, ly, rnd, 6)
(x0, y0), (x1, y1), w_, hh_ = P.AVANCEE                                             # avancée rocheuse : blocs le long de la crête
for k in range(12):
    t = k / 11; x, y = x0 + (x1 - x0) * t, y0 + (y1 - y0) * t
    vs = C.bm_ico(BA.bm, G(x, y, zg(x, y) - .4), (2.2 - 1.2 * t) * (.9 + .2 * rnd.random()), 1, (1.2, 1, .65), .25, rnd.random() * 9)
    BA.paint(vs, lambda co: V.eclaire(V.ROCHE[1], -1, .2) if co.x < x - .2 else V.eclaire(V.ROCHE[1], 1, 0), .06)
for k in range(16):                                                                  # éboulis au pied des falaises
    a = rnd.uniform(0, 2 * math.pi); x, y = mx + math.cos(a) * 17.5, my + math.sin(a) * 14.5
    if P.zone(x, y) in ('pied',):
        vs = C.bm_ico(BA.bm, G(x, y, zg(x, y) + .1), .7 + .6 * rnd.random(), 1, (1, 1, .7), .3, rnd.random() * 9); BA.paint(vs, V.ROCHE[rnd.randrange(4)], .08)

# ------------------------------------------------------------------ 3. ceinture portuaire, palais du roi, port, bateaux de bois
nb = 0; cnt = {}
for b in P.batiments():
    t = b['type']; z0 = zg(b['x'], b['y'])
    if t == 'pavillon': V.pavillon(B[b['niveau']], b['x'], b['y'], z0, b['ang'], b['s'] * 1.1, b['etages'], rnd)
    elif t == 'entrepot': K.entrepot(B[b['niveau']], b['x'], b['y'], z0, b['ang'], 1.9 * b['s'], 1.5 * b['s'], 1.0, V.BLANC[rnd.randrange(4)], V.TOIT[rnd.randrange(4)], rnd)
    else: top = V.palais(B[4], b['x'], b['y'], z0, b['ang'], rnd); C.mark('DRAPEAU_palais', b['x'], b['y'], top + .4)
    nb += 1; cnt[t] = cnt.get(t, 0) + 1
pa = P.PORT_A
for kk in (-1, 0, 1):
    a = pa + kk * .09; x, y = P.at_coast(a, .95); Q.jetee(B[1], x, y, a, 3.0 - abs(kk) * .5, rnd)
for x, y, ang, kind, lv in P.bateaux():
    if kind == 'barque': K.barque(B[lv], x, y, -.05, ang, 1.1 + .4 * rnd.random(), V.BOIS if rnd.random() < .7 else H('#7a5232'))
    else: K.navire(B[lv], x, y, ang, 2.2 + .6 * rnd.random(), rnd, V.BLANC[0], V.BOIS, 1)
    cnt[kind] = cnt.get(kind, 0) + 1
C.mark('PONTON', *P.at_coast(pa, 1.1), 0)

# ------------------------------------------------------------------ 4. végétation [C : falaises couvertes de végétation]
for x, y, s, kind, lv in P.arbres():
    z = zg(x, y)
    if kind == 'palmier': V.palmier(BV, x, y, z, s, rnd)
    elif kind == 'jungle': V.arbre_jungle(BV, x, y, z, s * 1.1, rnd)
    else: Q.arbre_rond(BV, x, y, z, s, rnd)

for Bt in list(B.values()) + [BA, BV, BR]: Bt.done()
os.makedirs(os.path.join(C.ART, 'blender', 'islands'), exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(C.ART, 'blender', 'islands', 'god_valley.blend'))
tris = sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in bpy.data.objects if o.type == 'MESH')
per = {o.name: sum(len(p.vertices) - 2 for p in o.data.polygons) for o in bpy.data.objects if o.type == 'MESH'}
print('GOD VALLEY ok', round(time.time() - T0, 1), 's · bâtiments', nb, cnt, '· triangles', tris, per)
