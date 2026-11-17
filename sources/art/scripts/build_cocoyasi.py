"""Cocoyasi — scène Blender détaillée (île 8), kit rk_bali.py (+ pièces génériques de rk_port / rk_anglais), plan co_plan.py.
Canon [C] / [I] : voir co_plan.py et art/data/fiches/cocoyasi.json. Exclus : personnages, leurs maisons et leur tombe, emblèmes,
monstres marins, copie de tout décor officiel.
Usage : python3 build_cocoyasi.py → art/blender/islands/cocoyasi.blend   (puis export_island.py cocoyasi)
"""
import sys, os, math, random, time
sys.path.insert(0, os.path.dirname(__file__))
import bpy, bmesh
import rk_common as C, rk_lib as L, rk_port as K, rk_anglais as A, rk_bali as BA
import co_plan as P

T0 = time.time(); rnd = random.Random(508)
sc = C.new_scene(); M = C.materials()
SOL, DECOR, V2, V3, V4 = C.coll('RK_SOL'), C.coll('RK_DECOR'), C.coll('RK_VILLE_2'), C.coll('RK_VILLE_3'), C.coll('RK_VILLE_4')
LV = {1: DECOR, 2: V2, 3: V3, 4: V4}; H = C.hexc; G = C.g2b
B = {k: L.Batch('CO_ville_%d' % k, LV[k], M['peint']) for k in LV}
BM = L.Batch('CO_monuments', DECOR, M['peint']); BE = L.Batch('CO_eau', DECOR, M['eau'], False)
BV = {k: L.Batch('CO_vegetation_%d' % k, LV[k], M['peint']) for k in LV}
zg = P.height


def zfoot(x, y, ang, w, d):
    c, s = math.cos(ang), math.sin(ang)
    return min(zg(x + su * w / 2 * -s + sv * d / 2 * c, y + su * w / 2 * c + sv * d / 2 * s) for su in (-1, 1) for sv in (-1, 1))


# ------------------------------------------------------------------ 1. sol
bm = bmesh.new(); colL = bm.verts.layers.float_color.new('Col'); step = .5; ext = 35.0; n = int(2 * ext / step) + 1; grid = {}
for j in range(n):
    for i in range(n):
        x = -ext + i * step; y = -ext + j * step; r, th, q = P.pol(x, y)
        if q > 1.1 and P.bassin_d(x, y) > 3: continue
        h = zg(x, y); v = bm.verts.new(G(x, y, h)); grid[(i, j)] = v; z_ = P.zone(x, y)
        c = C.mix(H('#7cb850'), H('#94c45a'), .5 + .5 * math.sin(x * .27 + y * .19))                       # campagne tropicale
        if z_ == 'jungle': c = C.mix(H('#2f6a34'), H('#3e7a3a'), .5 + .5 * math.sin(x + y))
        elif z_ == 'verger': c = C.mix(H('#5a8a3a'), H('#6a9a40'), .5 + .5 * math.sin(x * 2))
        elif z_ in ('village', 'gosa'): c = C.mix(H('#b8a878'), H('#a8b070'), .5 + .5 * math.sin(x * 1.1 + y))
        elif z_ == 'rizieres': c = H('#6e9a48')                                                       # sous les terrasses
        elif z_ == 'plage' or (h < .4 and q > .9): c = H('#f0dcae')
        elif z_ == 'falaise': c = C.mix(H('#a08a6c'), H('#8a7660'), (int(h * 2) % 2) * .6) if P.pente(x, y) > .9 else H('#86b058')
        elif z_ == 'arlong': c = H('#a8a6a0') if P.bassin_d(x, y) > 2.6 else H('#5a7a88')
        if q > 1 and P.bassin_d(x, y) > 2.6: c = H('#d8c89a')
        if P.chemin_d(x, y) < .38 and q < .97: c = H('#c4a070')
        v[colL] = c
for (i, j), v in grid.items():
    qd = [(i, j), (i + 1, j), (i + 1, j + 1), (i, j + 1)]
    if all(k in grid for k in qd): bm.faces.new([grid[k] for k in qd])
ground = C.mk_obj('CO_sol', bm, SOL, M['peint'], smooth=False); ground.data.color_attributes.active_color = ground.data.color_attributes['Col']; C.normals_up(ground)

# ------------------------------------------------------------------ 2. eau : rizières en terrasses [C : rizières ; I : terrasses], bassin d'Arlong Park
NA = 96; BT = L.Batch('CO_rizieres', DECOR, M['peint']); nr = 0
for k in range(len(P.RIZ_D) - 1):
    d0, d1 = P.RIZ_D[k], P.RIZ_D[k + 1]
    for i in range(NA):
        a0, a1 = i / NA * 6.283, (i + 1) / NA * 6.283; am = (a0 + a1) / 2
        xm, ym = P.riz_point((d0 + d1) / 2, am)
        if not P.rizieres(xm, ym): continue
        za, zb = P.riz_z(k, a0), P.riz_z(k, a1)
        pts = [P.riz_point(d0, a0) + (za,), P.riz_point(d1, a0) + (za,), P.riz_point(d1, a1) + (zb,), P.riz_point(d0, a1) + (zb,)]
        inonde = (k + i // 24) % 3 != 1                                                      # la plupart inondées, quelques-unes vertes
        col = C.mix(H('#86c2b8'), H('#9ccab0'), (i % 5) / 5) if inonde else C.mix(H('#9ccf6a'), H('#b8d870'), (i % 4) / 4)
        vs = [BT.bm.verts.new(G(*p)) for p in pts]; BT.bm.faces.new(vs); BT.paint(vs, col, .02)
        if inonde:                                                                           # pousses de riz en rangs [I]
            for t in (.3, .7):
                px, py = P.riz_point(d0 + (d1 - d0) * t, am); vs = C.bm_cyl(BT.bm, G(px, py, (za + zb) / 2), G(px, py, (za + zb) / 2 + .1), .06, .01, 4); BT.paint(vs, H('#6aa848'), .04)
        # digue extérieure (bord vert) et contremarche vers l'anneau suivant
        if k + 1 < len(P.RIZ_D) - 1:
            zo0, zo1 = P.riz_z(k + 1, a0), P.riz_z(k + 1, a1)
        else:
            zo0, zo1 = P.height(*P.riz_point(d1 + .02, a0)), P.height(*P.riz_point(d1 + .02, a1))
        o0, o1 = P.riz_point(d1, a0), P.riz_point(d1, a1)
        vs = [BT.bm.verts.new(G(*o0, za + .06)), BT.bm.verts.new(G(*o1, zb + .06)), BT.bm.verts.new(G(*o1, min(zb, zo1) - .3)), BT.bm.verts.new(G(*o0, min(za, zo0) - .3))]
        BT.bm.faces.new(vs); BT.paint(vs, H('#6e9a48'), .05)
        nr += 1
BT.done()
bx, by = P.BASSIN
vs = [BE.bm.verts.new(G(bx + math.cos(a) * 2.5, by + math.sin(a) * 2.5, .02)) for a in [k / 24 * 6.283 for k in range(24)]]
BE.bm.faces.new(vs); BE.paint(vs, H('#2f7aa0'), .03)

# ------------------------------------------------------------------ 3. ruines d'Arlong Park [C : côte, bassin relié à la mer, portes d'acier, détruit]
ax, ay = P.ARLONG; amer = math.atan2(by - ay, bx - ax) - math.pi / 2
BA.ruines_arlong(BM, ax, ay, zg(ax, ay), amer, bx, by, rnd)
C.mark('DRAPEAU_ruines', ax, ay, zg(ax, ay) + 3.6)

# ------------------------------------------------------------------ 4. temple [I], moulin [C?], belvédère de la falaise [C]
tx, ty = P.TEMPLE; at = math.atan2(P.VILLAGE[1] - ty, P.VILLAGE[0] - tx) - math.pi / 2
top = BA.temple(BM, tx, ty, zfoot(tx, ty, at, 4.2, 3.6), at, rnd)
C.mark('DRAPEAU_temple', tx, ty, zg(tx, ty) + top)
mx, my = P.MOULIN; BA.moulin(BM, mx, my, zg(mx, my), math.atan2(-my, -mx))
fx, fy = P.at_coast(P.FALAISE_A, .9)
for k in range(2):                                                                            # belvédère : banc et arbre isolé [I]
    F = K.Frame(fx, fy, zg(fx, fy), P.FALAISE_A); K.box(BM, F, -.4, .4, -.12 + k * .3, .12 + k * .3, .0, .2 if k == 0 else .45, H('#8a6440'), .04)
BA.frangipanier(BM, fx - 1.0, fy - .4, zg(fx - 1.0, fy - .4), 1.4, rnd)

# ------------------------------------------------------------------ 5. quai en bois [C], pirogues [I]
qx, qy = P.at_coast(P.QUAI_A, .985); A.jetee(BM, qx, qy, P.QUAI_A, 3.4)
C.mark('PONTON', *P.at_coast(P.QUAI_A, 1.1), 0)
for k in range(4): BA.pirogue(B[1 if k < 2 else 2], *P.at_coast(P.QUAI_A - .12 + k * .08, 1.04 + .03 * k), .05, P.QUAI_A + 1.4)
for k in range(3): BA.pirogue(B[2], *P.at_coast(P.QUAI_A + .35 + k * .12, .965), .25, P.QUAI_A + 1.6 + k)

# ------------------------------------------------------------------ 6. bâtiments
nb = 0; cnt = {}
FN = {'cour': BA.cour, 'maison_gosa': BA.maison_gosa, 'cabane': BA.cabane, 'clinique': BA.clinique, 'librairie': BA.librairie}
for b in P.batiments():
    lv = b['niveau']; z0 = zfoot(b['x'], b['y'], b['ang'], b['w'], b['d'])
    FN[b['type']](B[lv], b['x'], b['y'], z0, b['ang'], b['w'], b['d'], rnd)
    nb += 1; cnt[b['type']] = cnt.get(b['type'], 0) + 1

# ------------------------------------------------------------------ 7. végétation
TREE = {'mandarinier': BA.mandarinier, 'palmier': BA.palmier, 'frangipanier': BA.frangipanier, 'bananier': BA.bananier, 'jungle': BA.arbre_jungle}
for x, y, sz, kind, lv in P.arbres(): TREE[kind](BV[lv], x, y, zg(x, y), sz, rnd)

for Bt in list(B.values()) + list(BV.values()) + [BM, BE]: Bt.done()
os.makedirs(os.path.join(C.ART, 'blender', 'islands'), exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(C.ART, 'blender', 'islands', 'cocoyasi.blend'))
tris = sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in bpy.data.objects if o.type == 'MESH')
print('COCOYASI ok', round(time.time() - T0, 1), 's · bâtiments', nb, cnt, '· triangles', tris, '· temple', round(top, 1))
