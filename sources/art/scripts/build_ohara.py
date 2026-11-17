"""Ohara — scène Blender détaillée (île 16), kit rk_savoir.py (+ pièces génériques de rk_port, rk_retrofutur), plan oh_plan.py.
Canon [C] / [C?] / [I] : voir oh_plan.py et art/data/fiches/ohara.json. Exclus : personnages, géants, navires de la Marine, Poneglyph,
copie de tout décor officiel.
Usage : python3 build_ohara.py → art/blender/islands/ohara.blend   (puis export_island.py ohara)
"""
import sys, os, math, random, time
sys.path.insert(0, os.path.dirname(__file__))
import bpy, bmesh
import rk_common as C, rk_lib as L, rk_port as K, rk_savoir as Q
import oh_plan as P

T0 = time.time(); rnd = random.Random(1616)
sc = C.new_scene(); M = C.materials()
SOL, DECOR, V2, V3, V4 = C.coll('RK_SOL'), C.coll('RK_DECOR'), C.coll('RK_VILLE_2'), C.coll('RK_VILLE_3'), C.coll('RK_VILLE_4')
LV = {1: DECOR, 2: V2, 3: V3, 4: V4}; H = C.hexc; G = C.g2b
B = {k: L.Batch('OH_ville_%d' % k, LV[k], M['peint']) for k in LV}
TM = (L.Batch('OH_arbre', DECOR, M['peint']), L.Batch('OH_arbre_verre', DECOR, M['brillant']), L.Batch('OH_arbre_lueur', DECOR, M['lueur']))
T4 = (B[4], L.Batch('OH_verre_4', V4, M['brillant']), L.Batch('OH_lueur_4', V4, M['lueur']))
BE = L.Batch('OH_eau', DECOR, M['eau'], False); BV = L.Batch('OH_vegetation', DECOR, M['peint']); BR = L.Batch('OH_ruelles', DECOR, M['peint'], False)
zg = P.height
CH = [H('#d6c46e'), H('#b2c464'), H('#dece82'), H('#a0b45e')]

# ------------------------------------------------------------------ 1. sol : campagne verte, champs en lanières [I], plages, lac [C]
bm = bmesh.new(); colL = bm.verts.layers.float_color.new('Col'); step = .5; ext = 37.0; n = int(2 * ext / step) + 1; grid = {}
for j in range(n):
    for i in range(n):
        x = -ext + i * step; y = -ext + j * step; r, th, q = P.pol(x, y)
        if q > 1.1: continue
        h = zg(x, y); v = bm.verts.new(G(x, y, h)); grid[(i, j)] = v; z_ = P.zone(x, y)
        c = C.mix(H('#7cb85a'), H('#8cc464'), .5 + .5 * math.sin(x * .5 + y * .4))
        ch = P.champ(x, y)
        if ch is not None: c = C.mix(CH[ch], CH[(ch + 1) % 4], .15 + .1 * math.sin(x * 3))
        elif z_ == 'village': c = C.mix(H('#9cc474'), H('#a8cc80'), .5 + .5 * math.sin(x * 1.1 + y))
        elif z_ == 'arbre': c = C.mix(H('#8a7a5a'), H('#7a8a58'), .5 + .5 * math.sin(x * 2 + y))
        elif z_ == 'port': c = C.mix(H('#d8c49a'), H('#c8b48a'), .5 + .5 * math.sin(x * 2))
        if z_ == 'plage' or q > .9: c = C.mix(H('#ecdcae'), H('#e2cf9a'), .5 + .5 * math.sin(x * 3 + y))
        if h < .15: c = C.mix(H('#c8b888'), H('#ecdcae'), max(0, h + .6))
        if z_ in ('lac', 'rive') and h < .3: c = C.mix(H('#8a8a60'), H('#a0a070'), .5)
        v[colL] = c
for (i, j), v in grid.items():
    qd = [(i, j), (i + 1, j), (i + 1, j + 1), (i, j + 1)]
    if all(k in grid for k in qd): bm.faces.new([grid[k] for k in qd])
ground = C.mk_obj('OH_sol', bm, SOL, M['peint'], smooth=False); ground.data.color_attributes.active_color = ground.data.color_attributes['Col']; C.normals_up(ground)
lx, ly, lr = P.LAC
vs = [BE.bm.verts.new(G(lx + math.cos(a) * (lr + .4), ly + math.sin(a) * (lr + .4) / 1.25, .02)) for a in [k / 48 * 2 * math.pi for k in range(48)]]; BE.bm.faces.new(vs); BE.paint(vs, H('#4a90c0'), .03)

# ruelles [I] en rubans lisses (rayons et deux tours de village)
ax, ay, ar, ah = P.ARBRE
def ruban(pts, w, zoff, col):
    prev = None
    for k, (x, y) in enumerate(pts):
        x2, y2 = pts[min(k + 1, len(pts) - 1)]; x1, y1 = pts[max(k - 1, 0)]; tx, ty = x2 - x1, y2 - y1; l = math.hypot(tx, ty) or 1; nx_, ny_ = -ty / l * w / 2, tx / l * w / 2
        row = (BR.bm.verts.new(G(x + nx_, y + ny_, zg(x + nx_, y + ny_) + zoff)), BR.bm.verts.new(G(x - nx_, y - ny_, zg(x - nx_, y - ny_) + zoff)))
        BR.paint(row, col, .04)
        if prev and P.zone((x + pts[k - 1][0]) / 2, (y + pts[k - 1][1]) / 2) in ('village', 'arbre', 'campagne'): BR.bm.faces.new((prev[0], prev[1], row[1], row[0]))
        prev = row
for rr in (7.0, 12.5):
    ruban([(ax + math.cos(a) * (rr + .5 * math.sin(a * 2 + rr)), ay + math.sin(a) * (rr + .5 * math.sin(a * 2 + rr))) for a in [k / 120 * 2 * math.pi for k in range(121)]], 1.0, .07, H('#d8c8a0'))
for k in range(P.RUES):
    a0 = k * 2 * math.pi / P.RUES + .2
    ruban([(ax + math.cos(a0 - .1 * math.sin(d * .4)) * d, ay + math.sin(a0 - .1 * math.sin(d * .4)) * d) for d in [ar + 1.6 + i * .5 for i in range(int((17 - ar) / .5))]], 1.0, .09, H('#d8c8a0'))
pa = P.PORT_A; ruban([(math.cos(pa) * d, math.sin(pa) * d) for d in [17 + i * .5 for i in range(16)]], 1.1, .09, H('#d8c8a0'))

# ------------------------------------------------------------------ 2. Arbre de la Connaissance [C] (bibliothèque, porte, fenêtres [C?])
top = Q.arbre_savoir(TM, ax, ay, zg(ax, ay), ar, ah, rnd)
C.mark('DRAPEAU_arbre', ax, ay, top + .3)

# ------------------------------------------------------------------ 3. village, fermes [C : maisons autour de l'arbre] ; port ; phare (niveau 4)
nb = 0; cnt = {}
for b in P.batiments():
    if b['type'] == 'ferme': Q.ferme(B[b['niveau']], b['x'], b['y'], zg(b['x'], b['y']), b['ang'], 1.5, rnd)
    else: Q.maison(B[b['niveau']], b['x'], b['y'], zg(b['x'], b['y']), b['ang'], b['w'], b['d'], b['etages'], rnd)
    nb += 1; cnt[b['type']] = cnt.get(b['type'], 0) + 1
for kk in (-1, 0, 1):
    a = pa + kk * .1; x, y = P.at_coast(a, .95); Q.jetee(B[1], x, y, a, 3.2 - abs(kk) * .5, rnd)
for kk in (-1, 1):
    a = pa + kk * .05; x, y = P.at_coast(a, 1.04); K.barque(B[1], x, y, -.05, a + 1.2, 1.3, H('#8a5a3a'))
C.mark('PONTON', *P.at_coast(pa, 1.1), 0)
px, py = P.at_coast(*P.PHARE); Q.phare(T4, px, py, zg(px, py), rnd)

# ------------------------------------------------------------------ 4. arbres de la campagne et du village [I]
TREE = {'rond': Q.arbre_rond, 'cypres': Q.cypres}
for x, y, s, kind, lv in P.arbres(): TREE[kind](BV, x, y, zg(x, y), s, rnd)

for Bt in list(B.values()) + list(TM) + list(T4[1:]) + [BE, BV, BR]: Bt.done()
os.makedirs(os.path.join(C.ART, 'blender', 'islands'), exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(C.ART, 'blender', 'islands', 'ohara.blend'))
tris = sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in bpy.data.objects if o.type == 'MESH')
per = {o.name: sum(len(p.vertices) - 2 for p in o.data.polygons) for o in bpy.data.objects if o.type == 'MESH'}
print('OHARA ok', round(time.time() - T0, 1), 's · bâtiments', nb, cnt, '· triangles', tris, per)
