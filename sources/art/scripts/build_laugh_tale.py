"""Laugh Tale — scène Blender détaillée (île 9), kit rk_ruines.py (+ pièces génériques de rk_port / rk_anglais), plan lt_plan.py.
Canon [C] / [I] : voir lt_plan.py et art/data/fiches/laugh_tale.json. Exclus : personnages, trésor, Poneglyphes, emblèmes,
navires identifiables, copie de tout décor officiel.
Usage : python3 build_laugh_tale.py → art/blender/islands/laugh_tale.blend   (puis export_island.py laugh_tale)
"""
import sys, os, math, random, time
sys.path.insert(0, os.path.dirname(__file__))
import bpy, bmesh
import rk_common as C, rk_lib as L, rk_port as K, rk_anglais as A, rk_ruines as RU
import lt_plan as P

T0 = time.time(); rnd = random.Random(909)
sc = C.new_scene(); M = C.materials()
SOL, DECOR, V2, V3, V4 = C.coll('RK_SOL'), C.coll('RK_DECOR'), C.coll('RK_VILLE_2'), C.coll('RK_VILLE_3'), C.coll('RK_VILLE_4')
LV = {1: DECOR, 2: V2, 3: V3, 4: V4}; H = C.hexc; G = C.g2b
B = {k: L.Batch('LT_ville_%d' % k, LV[k], M['peint']) for k in LV}
BM = L.Batch('LT_ruines', DECOR, M['peint']); BE = L.Batch('LT_eau', DECOR, M['eau'], False)
BV = {k: L.Batch('LT_vegetation_%d' % k, LV[k], M['peint']) for k in LV}
zg = P.height


def zfoot(x, y, ang, w, d):
    c, s = math.cos(ang), math.sin(ang)
    return min(zg(x + su * w / 2 * -s + sv * d / 2 * c, y + su * w / 2 * c + sv * d / 2 * s) for su in (-1, 1) for sv in (-1, 1))


def near_fjord(x, y):
    d, t, w = P.fjord(x, y); return d < w + 2.2 and x > 8


# ------------------------------------------------------------------ 1. sol : falaises à strates, forêt, terrasses, grève
bm = bmesh.new(); colL = bm.verts.layers.float_color.new('Col'); step = .5; ext = 37.0; n = int(2 * ext / step) + 1; grid = {}
for j in range(n):
    for i in range(n):
        x = -ext + i * step; y = -ext + j * step; r, th, q = P.pol(x, y)
        if q > 1.1 and not near_fjord(x, y): continue
        h = zg(x, y); v = bm.verts.new(G(x, y, h)); grid[(i, j)] = v; z_ = P.zone(x, y); pe = P.pente(x, y)
        c = C.mix(H('#2c5a30'), H('#36683a'), .5 + .5 * math.sin(x * .9 + y * .6) * math.cos(y * .7))         # sous-bois
        if z_ == 'altitude': c = C.mix(H('#5f7d4c'), H('#728e58'), .5 + .5 * math.sin(x * 1.3 + y))
        elif z_ == 'rocaille': c = C.mix(H('#9a9284'), H('#7c8a62'), (.5 + .5 * math.sin(x * 2.1 + y * 1.7)) * .6)
        elif z_ == 'terrasses': c = C.mix(H('#a6a28e'), H('#7c9448'), .35 + .3 * math.sin(x * 2.3 + y * 1.9))
        elif z_ == 'citadelle': c = C.mix(H('#9a988a'), H('#6f8a4a'), .4 + .3 * math.sin(x * 1.7 - y * 2.2))
        elif z_ == 'greve': c = H('#d8c8a0')
        elif z_ == 'falaise': c = C.mix(H('#7a9a58'), H('#8eaa62'), .5 + .5 * math.sin(th * 9))                   # landes du rebord
        if pe > 1.25 and z_ not in ('greve',):                                                                    # parois : strates [I]
            c = C.mix(RU.FALAISE[int(h * 1.4 + 20) % 4], RU.FALAISE[4], .25 * (int(h * 4) % 2))
            if z_ in ('rocaille', 'altitude'):                                                                     # massif : roche sombre et mousse
                c = C.mix(C.mix(H('#7c7668'), H('#666256'), int(h * 1.7) % 2), H('#5f7d3c'), .45 * (math.sin(x * 2.3 + y * 1.9) > .35))
        if h < -.6: c = H('#4f6a6a')                                                                              # pied immergé
        if P.chemin_d(x, y) < .45 and q < .9: c = H('#c8bc9c')
        if P.ruisseau_d(x, y) < .4 and q < .95: c = H('#6aa8c8')
        v[colL] = c
for (i, j), v in grid.items():
    qd = [(i, j), (i + 1, j), (i + 1, j + 1), (i, j + 1)]
    if all(k in grid for k in qd): bm.faces.new([grid[k] for k in qd])
ground = C.mk_obj('LT_sol', bm, SOL, M['peint'], smooth=False); ground.data.color_attributes.active_color = ground.data.color_attributes['Col']; C.normals_up(ground)

# ------------------------------------------------------------------ 2. eau du fjord, cascade
st = .5
for j in range(int(-8 / st), int(10 / st)):
    for i in range(int(10 / st), int(37 / st)):
        x, y = i * st + st / 2, j * st + st / 2; d, t, w = P.fjord(x, y)
        if d < w + .5 and math.hypot(x - P.FOND[0], y - P.FOND[1]) > 2.2 and P.pol(x, y)[2] < 1.02:
            vs = [BE.bm.verts.new(G(x + a, y + b, 0.0)) for a, b in ((-st / 2, -st / 2), (st / 2, -st / 2), (st / 2, st / 2), (-st / 2, st / 2))]
            BE.bm.faces.new(vs); BE.paint(vs, C.mix(H('#2a6a8a'), H('#3a7a98'), t), .03)
ca, cb = P.RUISSEAU[-2], P.RUISSEAU[-1]
RU.cascade(BM, ca, cb, 1.0, zg(*ca) - .1, 0.0)

# ------------------------------------------------------------------ 3. ruines : citadelle, porte monumentale, chaussée, tour brisée, tours de guet [C : forme ; aspect I]
cx, cy, cr = P.CITADELLE; pa = math.atan2(P.CHAUSSEE[-1][1] - cy, P.CHAUSSEE[-1][0] - cx)
top = RU.citadelle(BM, cx, cy, zg, cr, rnd, pa)
C.mark('DRAPEAU_citadelle', cx, cy, zg(cx, cy) + top)
px, py = P.PORTE; ap = math.atan2(P.CHAUSSEE[1][1] - py, P.CHAUSSEE[1][0] - px)
RU.porte_monumentale(BM, px, py, zg(px, py), ap, rnd)
RU.chaussee(BM, P.CHAUSSEE, zg)
sx, sy = P.SOMMET[:2]; ts = RU.tour_brisee(BM, sx, sy, zg(sx, sy), rnd); RU.gravats_sol(BM, sx, sy, 2.4, 10, zg, rnd)
C.mark('DRAPEAU_sommet', sx, sy, zg(sx, sy) + ts)
for a, k in P.TOURS:
    x, y = P.at_coast(a, k); RU.tour_guet_ruine(BM, x, y, zg(x, y), rnd)
for a, k, s in P.PITONS:
    x, y = P.at_coast(a, k); RU.piton(BM, x, y, s, rnd)
for k in range(2600):                                                                                          # rochers du massif et du rebord
    x, y = rnd.uniform(-32, 32), rnd.uniform(-32, 32); z_ = P.zone(x, y)
    if (z_ == 'rocaille' and rnd.random() < .45) or (z_ == 'altitude' and rnd.random() < .06) or (z_ == 'falaise' and rnd.random() < .015):
        if P.chemin_d(x, y) > .8 and zg(x, y) - min(zg(x + .5, y), zg(x - .5, y), zg(x, y + .5), zg(x, y - .5)) < .6: RU.rocher(BM, x, y, zg(x, y), (.45 + .6 * rnd.random()) if z_ == 'rocaille' else (.25 + .35 * rnd.random()), rnd)

# ------------------------------------------------------------------ 4. camp d'expédition (niveau 1), jetée, barques [I]
fx, fy = P.FOND
RU.feu_de_camp(B[1], fx - .6, fy + .3, zg(fx - .6, fy + .3))
arc = [(fx + math.cos(a) * 3.2, fy + math.sin(a) * 3.2) for a in [math.radians(d_) for d_ in range(95, 170, 8)]]
arc2 = [(fx + math.cos(a) * 3.2, fy + math.sin(a) * 3.2) for a in [math.radians(d_) for d_ in range(196, 268, 8)]]
RU.palissade(B[1], arc, zg); RU.palissade(B[1], arc2, zg)
jx, jy = fx + 1.8, fy; A.jetee(B[1], jx, jy, 0.0, 3.2, .35)                                                       # v vers l est
C.mark('PONTON', jx + 3.6, jy, 0)
for k in range(3): K.barque(B[1 if k < 2 else 2], jx + 1.2 + k * .9, jy + (.7 if k % 2 else -.7), .05, rnd.uniform(-.4, .4), 1.1)

# ------------------------------------------------------------------ 5. bâtiments : coquilles (décor) et leur restauration (2, 3), tentes, postes de guet, cabanes
nb = 0; cnt = {}
FN = {'tente': RU.tente, 'guet': RU.guet, 'cabane': RU.cabane}
for b in P.batiments():
    z0 = zfoot(b['x'], b['y'], b['ang'], b['w'], b['d']); typ = b['type']
    if typ == 'coquille':
        h = RU.coquille(BM, b['x'], b['y'], z0, b['ang'], b['w'], b['d'], rnd)
        if b.get('restaure'): RU.restauration(B[b['restaure']], b['x'], b['y'], z0, b['ang'], b['w'], b['d'], h, rnd)
    else:
        FN[typ](B[b['niveau']], b['x'], b['y'], z0, b['ang'], b['w'], b['d'], rnd)
    nb += 1; cnt[typ] = cnt.get(typ, 0) + 1

# ------------------------------------------------------------------ 6. phare-balise (niveau 4)
hx, hy = P.PHARE; RU.phare_balise(B[4], hx, hy, zg(hx, hy))

# ------------------------------------------------------------------ 7. végétation (nature sauvage [C])
TREE = {'geant': RU.arbre_geant, 'feuillu': RU.feuillu, 'conifere': RU.conifere}
for x, y, sz, kind, lv in P.arbres(): TREE[kind](BV[lv], x, y, zg(x, y), sz, rnd)

for Bt in list(B.values()) + list(BV.values()) + [BM, BE]: Bt.done()
os.makedirs(os.path.join(C.ART, 'blender', 'islands'), exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(C.ART, 'blender', 'islands', 'laugh_tale.blend'))
tris = sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in bpy.data.objects if o.type == 'MESH')
per = {o.name: sum(len(p.vertices) - 2 for p in o.data.polygons) for o in bpy.data.objects if o.type == 'MESH'}
print('LAUGH TALE ok', round(time.time() - T0, 1), 's · bâtiments', nb, cnt, '· triangles', tris, per)
