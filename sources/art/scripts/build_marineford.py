"""Marineford — scène Blender détaillée (île 15), kit rk_marine.py (+ pièces génériques de rk_port, rk_retrofutur), plan mf_plan.py.
Canon [C] / [I] : voir mf_plan.py et art/data/fiches/marineford.json. Exclus : personnages, inscriptions, kanji, symbole et drapeaux de la Marine,
navires identifiables, Portes de la Justice, copie de tout décor officiel.
Usage : python3 build_marineford.py → art/blender/islands/marineford.blend   (puis export_island.py marineford)
"""
import sys, os, math, random, time
sys.path.insert(0, os.path.dirname(__file__))
import bpy, bmesh
import rk_common as C, rk_lib as L, rk_port as K, rk_marine as Q
import mf_plan as P

T0 = time.time(); rnd = random.Random(1515)
sc = C.new_scene(); M = C.materials()
SOL, DECOR, V2, V3, V4 = C.coll('RK_SOL'), C.coll('RK_DECOR'), C.coll('RK_VILLE_2'), C.coll('RK_VILLE_3'), C.coll('RK_VILLE_4')
LV = {1: DECOR, 2: V2, 3: V3, 4: V4}; H = C.hexc; G = C.g2b
B = {k: L.Batch('MF_ville_%d' % k, LV[k], M['peint']) for k in LV}
TM = (L.Batch('MF_monuments', DECOR, M['peint']), L.Batch('MF_monuments_verre', DECOR, M['brillant']), L.Batch('MF_monuments_lueur', DECOR, M['lueur']))
BC = L.Batch('MF_canons', DECOR, M['peint'], False); BV = L.Batch('MF_arbres', DECOR, M['peint'])
zg = P.height

# ------------------------------------------------------------------ 1. sol : briques et acier [C], rues de pierre [I], quai d'acier au bord
bm = bmesh.new(); colL = bm.verts.layers.float_color.new('Col'); step = .5; ext = 35.0; n = int(2 * ext / step) + 1; grid = {}
for j in range(n):
    for i in range(n):
        x = -ext + i * step; y = -ext + j * step; r, th, q = P.pol(x, y)
        if q > 1.1: continue
        h = zg(x, y); v = bm.verts.new(G(x, y, h)); grid[(i, j)] = v; z_ = P.zone(x, y)
        c = C.mix(H('#d2b4a2'), H('#c8a896'), .5 + .5 * math.sin(x * .7 + y * .5))
        if z_ == 'ville' and P.rue_d(x, y) < .6: c = C.mix(Q.PIERRE[0], Q.PIERRE[1], .5 + .5 * math.sin(x + y))
        elif z_ in ('place', 'qg', 'echafaud'): c = C.mix(Q.PIERRE[0], H('#e8e2d8'), (int(x * 1.5) + int(y * 1.5)) % 2 * .6)
        elif z_ == 'parc': c = C.mix(H('#7aa860'), H('#6a9a54'), .5 + .5 * math.sin(x * 1.3 + y))
        elif z_ == 'montagne': c = C.mix(H('#8a8478'), H('#a09886'), .5 + .5 * math.sin(x * 2 + y * 1.4))
        elif z_ == 'bord': c = C.mix(Q.ACIER[0], Q.PIERRE[1], .5)
        if h < .9 and z_ != 'montagne': c = C.mix(Q.ACIER[1], Q.ACIER[0], max(0, (h + 1.8) / 2.7))                # quai d'acier
        v[colL] = c
for (i, j), v in grid.items():
    qd = [(i, j), (i + 1, j), (i + 1, j + 1), (i, j + 1)]
    if all(k in grid for k in qd): bm.faces.new([grid[k] for k in qd])
ground = C.mk_obj('MF_sol', bm, SOL, M['peint'], smooth=False); ground.data.color_attributes.active_color = ground.data.color_attributes['Col']; C.normals_up(ground)

# ------------------------------------------------------------------ 2. QG : forteresse et tour-pagode [C], petites montagnes et leurs pavillons [C]
qx, qy = P.QG; top = Q.qg(TM, qx, qy, zg(qx, qy), rnd)
C.mark('DRAPEAU_qg', qx, qy, zg(qx, qy) + top + .3)
for mx, my in P.MONTAGNES:
    Q.pavillon_montagne(TM[0], mx, my, zg(mx, my) - .1, math.pi / 2, rnd)
    for k in range(5):
        a = k / 5 * 6.283 + rnd.random(); rx, ry = mx + math.cos(a) * 1.9, my + math.sin(a) * 1.9
        vs = C.bm_ico(TM[0].bm, G(rx, ry, zg(rx, ry)), .6 + .3 * rnd.random(), 1, (1, 1, .8), .3, rnd.random() * 9); TM[0].paint(vs, H('#8a8478'), .06)

# ------------------------------------------------------------------ 3. échafaud [C], place Oris vide [C], cloche Ox [C], petite ville arborée [C]
ex, ey = P.ECHAFAUD; Q.echafaud(TM[0], ex, ey, zg(ex, ey), rnd)
cx, cy = P.CLOCHE; Q.cloche(TM[0], cx, cy, zg(cx, cy), rnd)
for x, y, s, kind, lv in P.arbres(): Q.arbre_rond(BV, x, y, zg(x, y), s, rnd)

# ------------------------------------------------------------------ 4. ville de briques et d'acier [C] par niveau
nb = 0
for b in P.batiments():
    Q.immeuble(B[b['niveau']], b['x'], b['y'], zg(b['x'], b['y']), b['ang'], b['w'], b['d'], b['etages'], rnd); nb += 1

# ------------------------------------------------------------------ 5. baie : quais [I], canons des bords [C], Mur d'encerclement (niveau 4) [C]
bx, by, br, bg = P.BAIE
for k in (-1, 0, 1):
    a = -math.pi / 2 + k * .55; x, y = bx + math.cos(a) * (br - .2), by + math.sin(a) * (br - .2); Q.jetee(TM[0], x, y, a + math.pi, 3.2 - abs(k) * .4, rnd)
for x, y, a in P.canons(): Q.canon(BC, x, y, zg(x, y), a, rnd)
cuts = sorted(-math.pi / 2 + k * .55 + 2 * math.pi for k in (-1, 0, 1)); bornes = [math.pi * .98] + [c for c_ in cuts for c in (c_ - .1, c_ + .1)] + [math.pi * 2.02]
for a0, a1 in zip(bornes[::2], bornes[1::2]): Q.mur_encerclement(B[4], bx, by, br - .5, a0, a1, -1.6, 4.2, rnd)        # ouvertures au droit des quais
for s in (-1, 1):                                                                                    # goulet : deux tronçons jusqu'au large
    gx = bx + s * (bg - .6); y0, y1 = by + 1.0, P.coast_r(math.atan2(by + 12, gx)) * .98
    F = K.Frame(gx, (y0 + y1) / 2, -1.6, 0)
    K.box(B[4], F, -(y1 - y0) / 2, (y1 - y0) / 2, -.22, .22, 0, 4.2, Q.ACIER[0], .04)
C.mark('PONTON', *P.at_coast(math.radians(90), 1.08), 0)

for Bt in list(B.values()) + list(TM) + [BC, BV]: Bt.done()
os.makedirs(os.path.join(C.ART, 'blender', 'islands'), exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(C.ART, 'blender', 'islands', 'marineford.blend'))
tris = sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in bpy.data.objects if o.type == 'MESH')
per = {o.name: sum(len(p.vertices) - 2 for p in o.data.polygons) for o in bpy.data.objects if o.type == 'MESH'}
print('MARINEFORD ok', round(time.time() - T0, 1), 's · bâtiments', nb, '· canons', len(P.canons()), '· triangles', tris, per)
