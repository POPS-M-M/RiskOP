"""Elbaph — scène Blender détaillée (île 11), kit rk_nordique.py (+ pièces génériques de rk_port / rk_lib), plan eb_plan.py.
Canon [C] / [I] : voir eb_plan.py et art/data/fiches/elbaph.json. Exclus : personnages, géants, bêtes, emblèmes, navires identifiables,
briques de jouet, copie de tout décor officiel.
Usage : python3 build_elbaph.py → art/blender/islands/elbaph.blend   (puis export_island.py elbaph)
"""
import sys, os, math, random, time
sys.path.insert(0, os.path.dirname(__file__))
import bpy, bmesh
import rk_common as C, rk_lib as L, rk_port as K, rk_nordique as N
import eb_plan as P

T0 = time.time(); rnd = random.Random(1111)
sc = C.new_scene(); M = C.materials()
SOL, DECOR, V2, V3, V4 = C.coll('RK_SOL'), C.coll('RK_DECOR'), C.coll('RK_VILLE_2'), C.coll('RK_VILLE_3'), C.coll('RK_VILLE_4')
LV = {1: DECOR, 2: V2, 3: V3, 4: V4}; H = C.hexc; G = C.g2b
B = {k: L.Batch('EB_ville_%d' % k, LV[k], M['peint']) for k in LV}
BM = L.Batch('EB_monuments', DECOR, M['peint']); BA = L.Batch('EB_arbre', DECOR, M['peint']); BE = L.Batch('EB_eau', DECOR, M['eau'], False)
BV = {k: L.Batch('EB_vegetation_%d' % k, LV[k], M['peint']) for k in LV}
zg = P.height

# ------------------------------------------------------------------ 1. Underworld : sol enneigé, montagnes, rivage [C]
bm = bmesh.new(); colL = bm.verts.layers.float_color.new('Col'); step = .5; ext = 37.0; n = int(2 * ext / step) + 1; grid = {}
for j in range(n):
    for i in range(n):
        x = -ext + i * step; y = -ext + j * step; r, th, q = P.pol(x, y)
        if q > 1.1: continue
        h = zg(x, y); v = bm.verts.new(G(x, y, h)); grid[(i, j)] = v; z_ = P.zone(x, y)
        c = C.mix(N.NEIGE[0], N.NEIGE[2], .5 + .5 * math.sin(x * .7 + y * .4))
        if z_ == 'foret': c = C.mix(H('#c8d4dc'), H('#aebcc6'), .5 + .5 * math.sin(x * 1.3 + y))                 # neige à l'ombre des pins
        elif z_ == 'racines': c = C.mix(H('#b8b0a0'), N.NEIGE[1], .5 + .5 * math.sin(x * 2 + y * 1.4))
        elif z_ == 'rivage' or h < .2: c = C.mix(H('#7a7c80'), H('#9a9ca0'), .5 + .5 * math.sin(x * 3))
        e_ = .35; pe = math.hypot(zg(x + e_, y) - zg(x - e_, y), zg(x, y + e_) - zg(x, y - e_)) / (2 * e_)
        if pe > 1.1 and h > .5: c = C.mix(H('#7c7e84'), H('#6a6c72'), (int(h * 3) % 2) * .6)                     # rochers des pentes raides
        v[colL] = c
for (i, j), v in grid.items():
    qd = [(i, j), (i + 1, j), (i + 1, j + 1), (i, j + 1)]
    if all(k in grid for k in qd): bm.faces.new([grid[k] for k in qd])
ground = C.mk_obj('EB_sol', bm, SOL, M['peint'], smooth=False); ground.data.color_attributes.active_color = ground.data.color_attributes['Col']; C.normals_up(ground)

# ------------------------------------------------------------------ 2. Arbre Adam [C], plateformes du Sun World [C], installation ancienne [C]
tx, ty, tr, th_ = P.TRONC
attaches = []
for k, (nom, a, d, r, z) in enumerate(P.PLATEFORMES):
    cx, cy = math.cos(a) * d, math.sin(a) * d; attaches.append((cx - math.cos(a) * r * .3, cy - math.sin(a) * r * .3, z))
    N.plateforme(BA, cx, cy, r, z, k, wob=P.plat_wob)
top = N.arbre_adam(BA, tx, ty, zg(tx + tr + .5, ty), tr, th_, attaches, rnd)
C.mark('DRAPEAU_arbre', tx, ty, zg(tx + tr + .5, ty) + top)
N.installation_ancienne(BM, tx, ty + tr * .95, zg(tx, ty + tr + 1.5), math.pi / 2)

# ------------------------------------------------------------------ 3. Source des Guerriers [C] (lac) et bibliothèque d'Owl sur sa branche [C], école [C]
sx, sy, sr, sz, sa = P.plateforme('source')
vs = [BE.bm.verts.new(G(sx + math.cos(k / 48 * 2 * math.pi) * P.LAC_SOURCE, sy + math.sin(k / 48 * 2 * math.pi) * P.LAC_SOURCE, sz + .04)) for k in range(48)]
BE.bm.faces.new(vs); BE.paint(vs, H('#5a9ac8'), .03)                                                 # lac d'un seul tenant
for k in range(48):                                                                                    # rive de particules de bois [C]
    a = k / 48 * 2 * math.pi; F = K.Frame(sx + math.cos(a) * (P.LAC_SOURCE + .35), sy + math.sin(a) * (P.LAC_SOURCE + .35), sz, a)
    K.box(BM, F, -.3, .3, -.35, .35, -.1, .06, H('#c8aa7a'), .05)
oa, od, oz = P.OWL; ox, oy = math.cos(oa) * od, math.sin(oa) * od
N.plateforme(BA, ox, oy, 2.6, oz, 7, ep=.8)
vs = C.bm_tube(BA.bm, [G(tx + math.cos(oa) * tr * .6, ty + math.sin(oa) * tr * .6, oz - 1.6), G(ox, oy, oz - 1.2)], lambda t: 1.0 - .4 * t, 8); BA.paint(vs, N.ECORCE[0], .05)
N.bibliotheque(BM, ox, oy, oz, oa, rnd)
ex_, ey_ = sx + math.cos(sa + 1.9) * sr * .62, sy + math.sin(sa + 1.9) * sr * .62
N.ecole(BM, ex_, ey_, sz, sa + 1.9 + math.pi / 2, rnd)
N.cascade_nuage(BM, *(lambda a_: (sx + math.cos(a_) * sr * 1.02, sy + math.sin(a_) * sr * 1.02))(sa + .5), sz - .4, zg(sx + math.cos(sa + .5) * sr * 1.15, sy + math.sin(sa + .5) * sr * 1.15) + .3, sa + .5, 1.4, rnd)

# ------------------------------------------------------------------ 4. village de l'Ouest : port de nuage [C], arc-en-ciel [C], cascade [C]
wx, wy, wr, wz, wa = P.plateforme('ouest')
px, py = wx + math.cos(wa) * wr * .6, wy + math.sin(wa) * wr * .6
N.nuage_plat(BM, px, py, 2.6, wz, rnd, 8)
N.ponton_nuage(B[1], px - math.cos(wa) * 1.6, py - math.sin(wa) * 1.6, wz + .25, wa, 3.0)
for k in range(2): N.barque(B[1], px + math.cos(wa + 1.57) * (k * 1.2 - .6) + math.cos(wa) * .6, py + math.sin(wa + 1.57) * (k * 1.2 - .6) + math.sin(wa) * .6, wz + .3, wa)
fx, fy = P.at_coast(P.ARC[0], P.ARC[1]); fz = 0.0
N.arc_en_ciel(BM, (fx, fy, fz), (px + math.cos(wa) * 2.6, py + math.sin(wa) * 2.6, wz + .3), 3.0)
C.mark('PONTON', fx, fy, 0)
N.cascade_nuage(BM, *(lambda a_: (wx + math.cos(a_) * wr * 1.0, wy + math.sin(a_) * wr * 1.0))(wa - .9), wz - .4, zg(wx + math.cos(wa - .9) * wr * 1.12, wy + math.sin(wa - .9) * wr * 1.12) + .3, wa - .9, 1.6, rnd)

# ------------------------------------------------------------------ 5. château d'Aurust dans son arbre, au bord de la plateforme est [C] (endommagé)
ex, ey, er, ez, ea = P.plateforme('est'); ax, ay = ex + math.cos(ea) * er * .62, ey + math.sin(ea) * er * .62
N.arbre_geant(BM, ax + math.cos(ea) * .8, ay + math.sin(ea) * .8, ez, 1.0, rnd)
N.chateau_pierre(BM, ax, ay, ez, ea, rnd, ruine=True)

# ------------------------------------------------------------------ 6. château de Road sur un sommet enneigé, pont de corde vers le haut [C]
rx, ry = P.ROAD; rz = zg(rx, ry)
rtop = N.chateau_pierre(BM, rx, ry, rz, .6, rnd)
C.mark('DRAPEAU_road', rx, ry, rz + rtop)
nx, ny, nr, nz, na = P.plateforme('nord'); bx_, by_ = nx + math.cos(na + 1.35) * nr * .95, ny + math.sin(na + 1.35) * nr * .95
L.rope_bridge(BM, G(rx + 1.2, ry + .6, rz + 1.6), G(bx_, by_, nz), 1.0, 1.4, H('#a0784a'))

# ------------------------------------------------------------------ 7. épée géante à travers la plateforme nord jusqu'au sol [C]
ex2, ey2 = P.EPEE; N.epee(BM, ex2, ey2, zg(ex2, ey2) - .5, nz + 3.0, .7)

# ------------------------------------------------------------------ 8. bâtiments des plateformes, grande halle (niveau 4)
nb = 0; cnt = {}
FN = {'longue': N.longue_maison, 'maison': N.maison, 'guet': N.guet}
for b in P.batiments():
    FN[b['type']](B[b['niveau']], b['x'], b['y'], b['z'], b['ang'], b['w'], b['d'], rnd); nb += 1; cnt[b['type']] = cnt.get(b['type'], 0) + 1
gx, gy = P.grande_halle(); N.grande_halle(B[4], gx, gy, nz, na + math.pi / 2, rnd)

# ------------------------------------------------------------------ 9. arbres : pins géants de l'Underworld [C], bosquets des plateformes
TREE = {'pin': N.pin_geant, 'feuillu': N.feuillu}
for x, y, z, sz_, kind, lv in P.arbres(): TREE[kind](BV[lv], x, y, z, sz_, rnd)

for Bt in list(B.values()) + list(BV.values()) + [BM, BA, BE]: Bt.done()
os.makedirs(os.path.join(C.ART, 'blender', 'islands'), exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(C.ART, 'blender', 'islands', 'elbaph.blend'))
tris = sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in bpy.data.objects if o.type == 'MESH')
per = {o.name: sum(len(p.vertices) - 2 for p in o.data.polygons) for o in bpy.data.objects if o.type == 'MESH'}
print('ELBAPH ok', round(time.time() - T0, 1), 's · bâtiments', nb, cnt, '· triangles', tris, per)
