"""La Ruche — scène Blender détaillée (île 13), kit rk_repaire.py (+ Frame/box/quad de rk_port), plan lr_plan.py.
Canon [C] / [I] : voir lr_plan.py et art/data/fiches/la_ruche.json. Exclus : personnages, pavillons, emblèmes, bandana et nœud sculptés,
navires identifiables, Poneglyph, or, copie de tout décor officiel.
Usage : python3 build_la_ruche.py → art/blender/islands/la_ruche.blend   (puis export_island.py la_ruche)
"""
import sys, os, math, random, time
sys.path.insert(0, os.path.dirname(__file__))
import bpy, bmesh
from mathutils import Vector
import rk_common as C, rk_lib as L, rk_port as K, rk_repaire as Q
import lr_plan as P

T0 = time.time(); rnd = random.Random(1313)
sc = C.new_scene(); M = C.materials()
SOL, DECOR, V2, V3, V4 = C.coll('RK_SOL'), C.coll('RK_DECOR'), C.coll('RK_VILLE_2'), C.coll('RK_VILLE_3'), C.coll('RK_VILLE_4')
LV = {1: DECOR, 2: V2, 3: V3, 4: V4}; H = C.hexc; G = C.g2b
B = {k: L.Batch('LR_ville_%d' % k, LV[k], M['peint']) for k in LV}
BM = L.Batch('LR_monuments', DECOR, M['peint']); BG = L.Batch('LR_verre', DECOR, M['brillant']); BL = L.Batch('LR_lueur', DECOR, M['lueur'])
BL4 = L.Batch('LR_lueur_4', V4, M['lueur']); BP = L.Batch('LR_pansements', DECOR, M['peint'], False); BR = L.Batch('LR_rochers', DECOR, M['peint'], False)
BV = L.Batch('LR_vegetation', DECOR, M['peint'])
zg = P.height; R_ = Q.ROCHE

# ------------------------------------------------------------------ 1. sol : socle de roche brun (gris sombre selon le wiki ; brun à la demande de l'utilisateur), ville de terre battue [I], quais
bm = bmesh.new(); colL = bm.verts.layers.float_color.new('Col'); step = .5; ext = 35.0; n = int(2 * ext / step) + 1; grid = {}
for j in range(n):
    for i in range(n):
        x = -ext + i * step; y = -ext + j * step; r, th, q = P.pol(x, y)
        if q > 1.1: continue
        h = zg(x, y); v = bm.verts.new(G(x, y, h)); grid[(i, j)] = v; z_ = P.zone(x, y)
        c = C.mix(R_[1], R_[3], .5 + .5 * math.sin(x * .9 + y * .5) * math.cos(y * .7))
        if z_ == 'ville': c = C.mix(H('#9a8c74'), H('#8a7c66'), .5 + .5 * math.sin(x * 2.1 + y)) if P.rue_d(x, y) < .45 else C.mix(H('#a89a7c'), H('#9c8e72'), .5 + .5 * math.sin(x * 1.3 + y * 1.7))
        elif z_ in ('mont', 'crane'): c = C.mix(H('#7a6452'), H('#8a725c'), .5 + .5 * math.sin(x * 1.4 + y))
        elif z_ == 'port': c = C.mix(H('#7a6450'), H('#86705a'), .5 + .5 * math.sin(x * 3))
        elif z_ == 'arene': c = C.mix(R_[1], H('#8a7c66'), .5)
        e_ = .35; pe = math.hypot(zg(x + e_, y) - zg(x - e_, y), zg(x, y + e_) - zg(x, y - e_)) / (2 * e_)
        if pe > .9 and z_ not in ('ville',): c = C.mix(R_[2], R_[0], (int(h * 3) % 2) * .6)                 # falaises et pentes raides
        if h < .05: c = C.mix(R_[2], H('#4a3628'), .5)
        v[colL] = c
for (i, j), v in grid.items():
    qd = [(i, j), (i + 1, j), (i + 1, j + 1), (i, j + 1)]
    if all(k in grid for k in qd): bm.faces.new([grid[k] for k in qd])
ground = C.mk_obj('LR_sol', bm, SOL, M['peint'], smooth=False); ground.data.color_attributes.active_color = ground.data.color_attributes['Col']; C.normals_up(ground)

# ------------------------------------------------------------------ 2. crâne-forteresse [C] : orbites traversantes, baie vitrée du nez, fenêtres, fissure et pansements
cx, cy, Rk = P.CRANE; z0 = zg(cx, cy) - .6
sk, bvh, k = Q.crane(DECOR, M['peint'], cx, cy, z0, Rk, rnd); zc = k['zc']
C.mark('DRAPEAU_crane', cx, cy, zc + Rk + .3)
Q.baie_vitree(BG, BM, cx, cy, Rk, k)
Q.porte(BM, cx, cy, zg(cx, cy + .6 * Rk + 1.0), Rk, rnd)
Q.noeud(BM, cx, cy, zc, Rk, rnd)                                                                      # [C] bosses en bouts de nœud, sans bandana
for ax_, ay_, s_ in P.AIGUILLES: Q.aiguille(BR, ax_, ay_, zg(ax_, ay_), s_, rnd)
nwin = 0; Hk = 1.15 * Rk
crack = []                                                                                              # fissure en zigzag du sommet vers l'orbite droite [C]
for i in range(13):
    t = i / 12; u = -.9 + (k['ex'] - .4 + .9) * t; w = Hk * .93 + (k['ez'] - zc + k['er'] * 1.25 - Hk * .93) * t
    crack.append((u + (.3 if i % 2 else -.3) * (1 if 0 < i < 12 else 0), w))
def ruban(pts, larg):
    for a_, b_ in zip(pts, pts[1:]):
        du, dw = b_[0] - a_[0], b_[1] - a_[1]
        Q.plaque_face(BM, bvh, cx, cy, zc, Rk, 1, (a_[0] + b_[0]) / 2, (a_[1] + b_[1]) / 2, math.atan2(dw, du), math.hypot(du, dw) / 2 + .1, larg * (.7 + .6 * rnd.random()), Q.NOIR, .03, 2)
ruban(crack, .13)
ruban([crack[4]] + [(crack[4][0] - 1.0 * j - (.25 if j % 2 else 0), crack[4][1] - .9 * j) for j in range(1, 5)], .1)   # branche
for idx, rot in ((2, .15), (6, -.2), (10, .3)):                                                        # pansements [C], en travers de la fissure
    a_, b_ = crack[idx - 1], crack[idx + 1]; tg = math.atan2(b_[1] - a_[1], b_[0] - a_[0]); u, w = crack[idx]
    Q.plaque_face(BP, bvh, cx, cy, zc, Rk, 1, u, w, tg + math.pi / 2 + rot, 1.35, .42, Q.PANSEMENT[0], .08, 6)
    Q.plaque_face(BP, bvh, cx, cy, zc, Rk, 1, u, w, tg + math.pi / 2 + rot, .38, .36, Q.PANSEMENT[1], .13, 2)
    if idx == 6: Q.plaque_face(BP, bvh, cx, cy, zc, Rk, 1, u, w, tg + .25, 1.35, .42, Q.PANSEMENT[2], .11, 6)   # pansement en croix
for t in range(400):                                                                                    # petites fenêtres [C] sur les deux faces
    if nwin >= 26: break
    side = 1 if t % 3 else -1; u = rnd.uniform(-.8, .8) * Rk; w = rnd.uniform(-.55, .95) * Rk
    if Q.dans_trou(u, w, k, .7) or (side > 0 and min(math.hypot(u - a_, w - b_) for a_, b_ in crack) < 1.0): continue
    lit = rnd.random() < .35
    if Q.plaque_face(BL if lit else BM, bvh, cx, cy, zc, Rk, side, u, w, 0, .2, .28, H('#f0b84a') if lit else Q.NOIR, .05, 2): nwin += 1

# ------------------------------------------------------------------ 3. palmiers démesurés autour du crâne [C], palmiers et buissons des landes
TREE = {'geant': Q.palmier_geant, 'palmier': Q.palmier, 'buisson': Q.buisson}
for x, y, s, kind, lv in P.arbres(): TREE[kind](BV, x, y, zg(x, y), s * (.72 if kind == 'geant' else 1), rnd)

# ------------------------------------------------------------------ 4. ville carrée de briques [C] par niveau ; arène (niveau 4) [I]
nb = 0
for b in P.batiments():
    (Q.terrasse if b['type'] == 'terrasse' else Q.maison)(B[b['niveau']], b['x'], b['y'], zg(b['x'], b['y']), b['ang'], b['w'], b['d'], b['etages'], rnd); nb += 1
ax, ay, ar = P.ARENE; Q.arene(B[4], BL4, ax, ay, zg(ax, ay), ar, rnd)

# ------------------------------------------------------------------ 5. rochers [C : roche sombre], quais et jetées [I]
for a, kq, s in P.ROCHERS:
    x, y = P.at_coast(a, kq); Q.rocher(BR, x, y, zg(x, y), s, rnd)
cr = P.coast_r(P.PORT_A); Q.quai(BM, 0, 0, P.PORT_A - .3, P.PORT_A + .3, cr * .97, .5)
for kk in (-1, 0, 1):
    a = P.PORT_A + kk * .14; x, y = P.at_coast(a, .96); Q.jetee(BM, x, y, a, 4.0 - abs(kk) * .8, rnd)
C.mark('PONTON', *P.at_coast(P.PORT_A, 1.12), 0)
for da, kq in ((-.2, .85), (.2, .85), (-.08, .84), (.1, .84)):                                             # [I] entrepôts des quais
    x, y = P.at_coast(P.PORT_A + da, kq); Q.maison(B[1], x, y, zg(x, y), P.PORT_A + math.pi, 1.5, 1.1, 1, rnd)

for Bt in list(B.values()) + [BM, BG, BL, BL4, BP, BR, BV]: Bt.done()
os.makedirs(os.path.join(C.ART, 'blender', 'islands'), exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(C.ART, 'blender', 'islands', 'la_ruche.blend'))
tris = sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in bpy.data.objects if o.type == 'MESH')
per = {o.name: sum(len(p.vertices) - 2 for p in o.data.polygons) for o in bpy.data.objects if o.type == 'MESH'}
print('LA RUCHE ok', round(time.time() - T0, 1), 's · bâtiments', nb, '· fenêtres', nwin, '· triangles', tris, per)
