"""Egghead — scène Blender détaillée (île 12), kit rk_retrofutur.py (+ Frame/box de rk_port), plan eg_plan.py.
Canon [C] / [I] : voir eg_plan.py et art/data/fiches/egghead.json. Exclus : personnages, Séraphins, robots, monstres, symboles,
navires identifiables, copie de tout décor officiel.
Usage : python3 build_egghead.py → art/blender/islands/egghead.blend   (puis export_island.py egghead)
"""
import sys, os, math, random, time
sys.path.insert(0, os.path.dirname(__file__))
import bpy, bmesh
import rk_common as C, rk_lib as L, rk_port as K, rk_retrofutur as R
import eg_plan as P

T0 = time.time(); rnd = random.Random(1212)
sc = C.new_scene(); M = C.materials()
SOL, DECOR, V2, V3, V4 = C.coll('RK_SOL'), C.coll('RK_DECOR'), C.coll('RK_VILLE_2'), C.coll('RK_VILLE_3'), C.coll('RK_VILLE_4')
LV = {1: DECOR, 2: V2, 3: V3, 4: V4}; H = C.hexc; G = C.g2b
T = {k: (L.Batch('EG_ville_%d' % k, LV[k], M['peint']), L.Batch('EG_verre_%d' % k, LV[k], M['brillant']), L.Batch('EG_lueur_%d' % k, LV[k], M['lueur'])) for k in LV}
TM = (L.Batch('EG_monuments', DECOR, M['peint']), L.Batch('EG_monuments_verre', DECOR, M['brillant']), L.Batch('EG_monuments_lueur', DECOR, M['lueur']))
BN = L.Batch('EG_nuage', DECOR, M['peint']); BO = L.Batch('EG_oeuf', DECOR, M['peint']); BE = L.Batch('EG_eau', DECOR, M['eau'], False)
BV = L.Batch('EG_vegetation', DECOR, M['peint']); BI = L.Batch('EG_glaces', DECOR, M['brillant'], False)
zg = P.height

# ------------------------------------------------------------------ 1. sol : île tropicale verte [C], ville aux rues claires [I], plage
bm = bmesh.new(); colL = bm.verts.layers.float_color.new('Col'); step = .5; ext = 35.0; n = int(2 * ext / step) + 1; grid = {}
for j in range(n):
    for i in range(n):
        x = -ext + i * step; y = -ext + j * step; r, th, q = P.pol(x, y)
        if q > 1.1: continue
        h = zg(x, y); v = bm.verts.new(G(x, y, h)); grid[(i, j)] = v; z_ = P.zone(x, y)
        c = C.mix(H('#6aa850'), H('#86b860'), .5 + .5 * math.sin(x * .6 + y * .35))
        if z_ == 'jungle': c = C.mix(H('#3f7a38'), H('#4e8a40'), .5 + .5 * math.sin(x * 1.1 + y))
        elif z_ == 'colonne': c = C.mix(H('#8cc478'), H('#a0d088'), .5 + .5 * math.sin(x * 2 + y))
        elif z_ in ('ville', 'place'):
            d = P.rue_d(x, y); dp = math.hypot(x - P.PLACE[0], y - P.PLACE[1])
            c = C.mix(H('#8cc89c'), H('#9cd4a8'), .5 + .5 * math.sin(x * 1.5 + y * .8))               # pelouses ; rues et place : géométrie lisse plus bas
        elif z_ == 'usine': c = C.mix(H('#8cc89c'), H('#9cd4a8'), .5 + .5 * math.sin(x * 1.5 + y * .8))
        if z_ == 'plage' or q > .9: c = C.mix(H('#ecdcae'), H('#e2cf9a'), .5 + .5 * math.sin(x * 3 + y))
        if h < .25: c = C.mix(H('#c8b888'), H('#ecdcae'), max(0, h + .5))
        v[colL] = c
for (i, j), v in grid.items():
    qd = [(i, j), (i + 1, j), (i + 1, j + 1), (i, j + 1)]
    if all(k in grid for k in qd): bm.faces.new([grid[k] for k in qd])
ground = C.mk_obj('EG_sol', bm, SOL, M['peint'], smooth=False); ground.data.color_attributes.active_color = ground.data.color_attributes['Col']; C.normals_up(ground)

# rues de la Ville du futur [I] : anneaux et rayons en rubans lisses (le maillage du sol, à 0,5 de pas, les dessinerait en escalier), place pavée
BR = L.Batch('EG_rues', DECOR, M['peint'], False)
px, py, pr = P.PLACE; OK_ = ('ville', 'place', 'usine')
def ruban(pts, w, zoff, col):
    prev = None
    for k, (x, y) in enumerate(pts):
        x2, y2 = pts[min(k + 1, len(pts) - 1)]; x1, y1 = pts[max(k - 1, 0)]; tx, ty = x2 - x1, y2 - y1; l = math.hypot(tx, ty) or 1; nx_, ny_ = -ty / l * w / 2, tx / l * w / 2
        row = (BR.bm.verts.new(G(x + nx_, y + ny_, zg(x + nx_, y + ny_) + zoff)), BR.bm.verts.new(G(x - nx_, y - ny_, zg(x - nx_, y - ny_) + zoff)))
        BR.paint(row, col, .03)
        if prev and P.zone((x + pts[k - 1][0]) / 2, (y + pts[k - 1][1]) / 2) in OK_: BR.bm.faces.new((prev[0], prev[1], row[1], row[0]))
        prev = row
for rr in (4.2, 8.6, 13.0):
    ring = [(px + math.cos(k / 120 * 2 * math.pi) * rr, py + math.sin(k / 120 * 2 * math.pi) * rr) for k in range(121)]
    ruban(ring, 1.1, .07, H('#e4e8ea')); ruban(ring, 1.5, .05, H('#b0bcc4'))
for k in range(6):
    a = k * math.pi / 3; ray = [(px + math.cos(a) * (pr + i * .5), py + math.sin(a) * (pr + i * .5)) for i in range(int((15.2 - pr) / .5))]
    ruban(ray, 1.1, .09, H('#e4e8ea')); ruban(ray, 1.5, .06, H('#b0bcc4'))
for rr, col, zo in ((pr + .3, H('#b0bcc4'), .04), (pr, H('#ece6da'), .06), (pr * .7, H('#c8dce4'), .08)):
    vs = [BR.bm.verts.new(G(px + math.cos(k / 48 * 2 * math.pi) * rr, py + math.sin(k / 48 * 2 * math.pi) * rr, zg(px, py) + zo)) for k in range(48)]; BR.bm.faces.new(vs); BR.paint(vs, col, .02)

# ------------------------------------------------------------------ 2. Labophase : colonne et nuage d'île [C/I], œuf fendu [C], laboratoire A, B, C [C]
nx, ny, nr, nz = P.NUAGE
R.colonne_nuage(BN, nx, ny, zg(nx, ny) + .6, nz - .6, 2.4, rnd)
R.nuage(BN, nx, ny, nr, nz, rnd)
ox, oy, orr, oa, ozb = P.OEUF
vs = [TM[0].bm.verts.new(G(ox + math.cos(k / 40 * 2 * math.pi) * 4.6, oy + math.sin(k / 40 * 2 * math.pi) * 4.6, ozb)) for k in range(40)]
TM[0].bm.faces.new(vs); TM[0].paint(vs, H('#dfe4e8'), .03)                                     # sol du laboratoire
top = R.oeuf(BO, ox, oy, ozb, orr, oa, rnd)
C.mark('DRAPEAU_oeuf', ox, oy, top + .5)
for kind, lx, ly in P.LABS: R.labo(TM, lx, ly, ozb, kind, rnd)
for zz in (7.0, 8.7): R.torus(TM[2], nx, ny, zz, nr + 1.8, .07, R.CYAN, 72, 5)                  # Frontier Dome : deux bandes laser [C]
for k in range(4):                                                                              # émetteurs [I]
    a = k * math.pi / 2 + .4; ex, ey = nx + math.cos(a) * (nr + 1.8), ny + math.sin(a) * (nr + 1.8)
    R.revolve(TM[0], ex, ey, [(.18, 6.6), (.18, 9.1)], R.METAL2, 8)

# ------------------------------------------------------------------ 3. tube de verre entre les deux niveaux [C], station au sol [I]
(tx0, ty0), (tx1, ty1) = P.TUBE; z0t = zg(tx0, ty0)
R.dome(TM, tx0, ty0, z0t, 1.1, rnd)
R.tube_verre(TM, [(tx0, ty0, z0t + 1.2), (tx0 - 1.2, ty0 - .5, z0t + 3.4), (tx0 - 3.8, ty0 - 1.3, 6.2), (tx1, ty1, nz + .3)], .32)

# ------------------------------------------------------------------ 4. Ville du futur [C] : place, usine, bâtiments par niveau, pas de tir (niveau 4)
px, py, pr = P.PLACE; R.place_holo(TM, px, py, zg(px, py), pr)
ux, uy = P.USINE; R.usine(TM, ux, uy, zg(ux, uy), math.atan2(py - uy, px - ux), rnd)
FN = {'dome': lambda t, b: R.dome(t, b['x'], b['y'], zg(b['x'], b['y']), b['s'], rnd),
      'fusee': lambda t, b: R.fusee(t, b['x'], b['y'], zg(b['x'], b['y']), b['s'], rnd),
      'manette': lambda t, b: R.manette(t, b['x'], b['y'], zg(b['x'], b['y']), b['ang'], b['s'], rnd),
      'soucoupe': lambda t, b: R.soucoupe(t, b['x'], b['y'], zg(b['x'], b['y']), b['s'], rnd),
      'holo': lambda t, b: R.holo(t, b['x'], b['y'], zg(b['x'], b['y']), b['ang'], b['s'], rnd)}
nb = 0; cnt = {}
for b in P.batiments():
    FN[b['type']](T[b['niveau']], b); nb += 1; cnt[b['type']] = cnt.get(b['type'], 0) + 1
lx, ly = P.PAS_DE_TIR; R.pas_de_tir(T[4], lx, ly, zg(lx, ly), math.atan2(-ly, -lx), rnd)

# ------------------------------------------------------------------ 5. mer : icebergs [C], colonnes d'eau chaude [C], jetée
for a, k, s in P.ICEBERGS:
    x, y = P.at_coast(a, k); R.iceberg(BI, x, y, s, rnd)
for a, k in P.TOURBILLONS:
    x, y = P.at_coast(a, k); R.colonne_eau(BE, BN, x, y, 4.5 + rnd.random(), rnd)
pa = math.radians(P.ISL.get('ponton') or 95)
fx, fy = P.at_coast(pa, .93); R.ponton(TM[0], fx, fy, pa, 3.2)
C.mark('PONTON', *P.at_coast(pa, 1.05), 0)

# ------------------------------------------------------------------ 6. végétation : jungle et arbres épars [C : île parsemée d'arbres, climatisée], palmiers
for x, y, s, kind, lv in P.arbres():
    (R.arbre_tropical if kind == 'jungle' else R.palmier)(BV, x, y, zg(x, y), s, rnd)

for Bt in [b for t in T.values() for b in t] + list(TM) + [BN, BO, BE, BV, BI, BR]: Bt.done()
os.makedirs(os.path.join(C.ART, 'blender', 'islands'), exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(C.ART, 'blender', 'islands', 'egghead.blend'))
tris = sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in bpy.data.objects if o.type == 'MESH')
per = {o.name: sum(len(p.vertices) - 2 for p in o.data.polygons) for o in bpy.data.objects if o.type == 'MESH'}
print('EGGHEAD ok', round(time.time() - T0, 1), 's · bâtiments', nb, cnt, '· triangles', tris, per)
