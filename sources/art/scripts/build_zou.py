"""Zou — scène source Blender (prototype).
Canon (à ma connaissance) : l'île est le dos d'un éléphant géant qui marche dans la mer ; jungle dense ; peuple des Minks ;
un arbre géant (l'Arbre-Baleine) ; on monte sur l'éléphant par une patte.
[I] interprétation : silhouette et couleurs de l'éléphant (conception originale, pas une copie du dessin de l'œuvre),
huttes rondes à toit de feuilles, ponts de cordes, plateformes, escalier en colimaçon, lanternes.
Usage : python3 build_zou.py  → art/blender/islands/zou.blend
"""
import sys, os, math, random, time
sys.path.insert(0, os.path.dirname(__file__))
import bpy, bmesh
from mathutils import Vector, Matrix, noise
import rk_common as C, rk_lib as L

T0 = time.time(); rnd = random.Random(1907)
isl = C.island('Zou'); R = isl['rayon']
sc = C.new_scene(); M = C.materials()
SOL, DECOR, V2, V3, V4 = C.coll('RK_SOL'), C.coll('RK_DECOR'), C.coll('RK_VILLE_2'), C.coll('RK_VILLE_3'), C.coll('RK_VILLE_4')
P = lambda x, y, z: C.g2b(x, y, z)            # coordonnées jeu → Blender

# ------------------------------------------------------------------ Zunesha : corps continu (union par remaillage voxel)
bm = bmesh.new()
C.bm_uvsphere(bm, P(0, -.05 * R, 18), 1, 40, 24, (.6 * R, .86 * R, 9))            # corps
C.bm_uvsphere(bm, P(0, .3 * R, 21), 1, 32, 18, (.5 * R, .4 * R, 7.5))            # garrot (épaules plus hautes que les hanches)
C.bm_uvsphere(bm, P(0, -.52 * R, 19), 1, 32, 18, (.5 * R, .36 * R, 7))                # croupe
for sx in (-1, 1):
    for ly, rr in ((.44 * R, 5.4), (-.5 * R, 5.0)):
        x = sx * .5 * R
        C.bm_cyl(bm, P(x, ly, -2.5), P(x, ly, 14), rr * 1.1, rr * 1.02, 28)            # patte
        C.bm_uvsphere(bm, P(x, ly, 14), 1, 24, 12, (rr * 1.35, rr * 1.3, 5.5))          # attache de la patte
        C.bm_cyl(bm, P(x, ly, -2), P(x, ly, 1.6), rr * 1.32, rr * 1.12, 28)            # pied évasé
C.bm_uvsphere(bm, P(0, .92 * R, 19), 1, 32, 20, (9.5, 8.5, 9.2))                   # tête
C.bm_uvsphere(bm, P(0, .94 * R, 24), 1, 24, 14, (7.2, 6.5, 5.2))                   # front bombé
C.bm_uvsphere(bm, P(0, .68 * R, 20), 1, 24, 14, (9, 7, 8))                         # cou
trunk = C.catmull([P(0, 1.1 * R, 16), P(0, 1.22 * R, 12), P(0, 1.29 * R, 6.5), P(0, 1.3 * R, 2.4), P(0, 1.26 * R, .9), P(0, 1.2 * R, 1.9)], 5)
C.bm_tube(bm, trunk, lambda t: 3.5 - 2.3 * t, 16)
tail = C.catmull([P(0, -.9 * R, 19), P(0, -.98 * R, 14), P(0, -1.0 * R, 9)], 4)
C.bm_tube(bm, tail, lambda t: .95 - .45 * t, 8)
body = C.mk_obj('Zunesha_corps', bm, SOL, M['peint'])
m = body.modifiers.new('union', 'REMESH'); m.mode = 'VOXEL'; m.voxel_size = .42; m.adaptivity = 0
m = body.modifiers.new('lisse', 'SMOOTH'); m.factor = .8; m.iterations = 14
tex = bpy.data.textures.new('rides', 'CLOUDS'); tex.noise_scale = 1.6; tex.noise_depth = 2
m = body.modifiers.new('rides', 'DISPLACE'); m.texture = tex; m.strength = .32; m.mid_level = .5
bpy.context.view_layer.objects.active = body
for mm in list(body.modifiers): bpy.ops.object.modifier_apply(modifier=mm.name)
m = body.modifiers.new('allege', 'DECIMATE'); m.ratio = .45; bpy.ops.object.modifier_apply(modifier='allege')
for p in body.data.polygons: p.use_smooth = True
SKIN = C.hexc('#8d8e98'); SKIN_D = C.hexc('#5f606c'); MOSS = C.hexc('#6f8a54'); WET = C.hexc('#4c5060')
def skin(co, n):
    w = abs(noise.noise(co * .55)) ; wr = 1 - min(1, w * 3.2)                         # rides : plis plus sombres
    c = C.mix(SKIN, SKIN_D, .55 * wr + .25 * max(0, -n.z))
    if co.z > 23 and n.z > .5 and co.y > -.5 * R: c = C.mix(c, MOSS, min(1, (co.z - 23) / 4) * .7)       # mousse sur le dos (pas sur la tête)
    if co.z < 1.2: c = C.mix(c, WET, .6)                                              # pieds mouillés
    return c
C.paint(body, skin)

# oreilles déployées face au sud, défenses, yeux, ongles, touffe de la queue
B = L.Batch('Zunesha_details', SOL, M['peint'])
for sx in (-1, 1):
    ear = C.bm_uvsphere(B.bm, P(sx * 14.5, .8 * R, 20.5), 1, 28, 14, (9.2, 1.1, 10))
    bmesh.ops.rotate(B.bm, verts=ear, cent=P(sx * 14.5, .8 * R, 20.5), matrix=Matrix.Rotation(sx * .32, 3, 'Z') @ Matrix.Rotation(-.12, 3, 'X'))
    B.paint(ear, lambda co: C.mix(SKIN, SKIN_D, .3 + .4 * (1 - min(1, abs(noise.noise(co * .7)) * 3))))
    inner = C.bm_uvsphere(B.bm, P(sx * 14.5, .8 * R + 1.15, 20.1), 1, 24, 12, (7, .5, 7.6))
    bmesh.ops.rotate(B.bm, verts=inner, cent=P(sx * 14.5, .8 * R, 20.5), matrix=Matrix.Rotation(sx * .32, 3, 'Z') @ Matrix.Rotation(-.12, 3, 'X'))
    B.paint(inner, C.hexc('#b98a90'))
    tusk = C.catmull([P(sx * 4.8, 1.06 * R, 13), P(sx * 6.6, 1.21 * R, 11.1), P(sx * 6.4, 1.32 * R, 13.1), P(sx * 5.4, 1.36 * R, 15.1)], 4)
    B.paint(C.bm_tube(B.bm, tusk, lambda t: 1.35 - .95 * t, 10), C.hexc('#f3ead2'))
    B.paint(C.bm_uvsphere(B.bm, P(sx * 6.1, 1.11 * R, 21.5), 1, 14, 8, (1.1, .6, 1.1)), C.hexc('#1d1a1c'))
    B.paint(C.bm_uvsphere(B.bm, P(sx * 5.8, 1.13 * R, 21.9), .35, 8, 5), C.hexc('#f4f4f4'))
    for ly in (.44 * R, -.5 * R):
        for k in range(3):
            q = P(sx * .5 * R + (k - 1) * 2.4, ly + 6.8, .9)
            B.paint(C.bm_uvsphere(B.bm, q, 1, 10, 6, (1.2, .6, .9)), C.hexc('#e8dcc0'))
B.paint(C.bm_ico(B.bm, P(0, -1.005 * R, 8), 1.3, 2, (1, 1, 1.4), .3), C.hexc('#3a3436'))
B.paint(C.bm_uvsphere(B.bm, P(0, 1.09 * R, 13.6), 1, 14, 7, (3, 1, 1.2)), C.hexc('#4a2c30'))       # bouche
B.done()

# ------------------------------------------------------------------ l'île sur le dos : chape de jungle
gb = C.Ground([body])
ax, ay, cy0 = .5 * R, .74 * R, -.08 * R
bm = bmesh.new(); colL = bm.verts.layers.float_color.new('Col'); step = 1.0
nx = int(2 * ax / step) + 1; ny = int(2 * ay / step) + 1; grid = {}
for j in range(ny):
    for i in range(nx):
        x = -ax + i * step; y = cy0 - ay + j * step
        e = (x / ax) ** 2 + ((y - cy0) / ay) ** 2
        if e > 1.08: continue
        zs = gb.z(x, y)
        if zs is None: continue
        edge = max(0, min(1, (1.0 - e) / .28))
        h = zs + .5 + edge * (1.4 + 2.2 * noise.noise(Vector((x * .09, y * .09, 3))) + 1.6 * max(0, noise.noise(Vector((x * .05, y * .05, 9))))) - (1 - edge) * .9
        v = bm.verts.new(P(x, y, h)); grid[(i, j)] = v
        g = C.mix(C.hexc('#3f7a34'), C.hexc('#5f9a3c'), .5 + .5 * noise.noise(Vector((x * .15, y * .15, 1))))
        g = C.mix(C.hexc('#7a6a48'), g, edge ** .5)
        v[colL] = g
for (i, j), v in grid.items():
    q = [(i, j), (i + 1, j), (i + 1, j + 1), (i, j + 1)]
    if all(k in grid for k in q): bm.faces.new([grid[k] for k in q])
cap = C.mk_obj('Zou_jungle_sol', bm, SOL, M['peint']); cap.data.color_attributes.active_color = cap.data.color_attributes['Col']; C.normals_up(cap)
gs = C.Ground([cap])                                     # pose des décors sur la jungle

def on_cap(x, y):
    e = (x / ax) ** 2 + ((y - cy0) / ay) ** 2; return e < .86

# ------------------------------------------------------------------ l'Arbre-Baleine (arbre héros) et grands arbres-habitations
BARK = C.hexc('#6b4a30'); BARK2 = C.hexc('#523624'); GREENS = [C.hexc('#2f7a34'), C.hexc('#3f8a3a'), C.hexc('#2a6a3c'), C.hexc('#4f9a3c')]
WALL = C.hexc('#f0dcb0'); ROOF = C.hexc('#d08a3c'); ROOF2 = C.hexc('#e0b048')
Bt = L.Batch('Zou_arbres_geants', DECOR, M['peint']); Bh = L.Batch('Zou_huttes', DECOR, M['peint']); Bb = L.Batch('Zou_ponts', DECOR, M['peint'], False)
Bl = L.Batch('Zou_lanternes', DECOR, M['lueur'])
plat_pts = []
def giant_tree(x, y, h, rt, crown):
    z0 = gs.z(x, y, 20); base = P(x, y, z0 - .5)
    trunk = C.catmull([base, base + Vector((0, 0, h * .4)), base + Vector((.8, -.5, h * .8)), base + Vector((.4, -.2, h))], 4)
    Bt.paint(C.bm_tube(Bt.bm, trunk, lambda t: rt * (1.25 - .55 * t), 18), lambda co: C.mix(BARK2, BARK, .5 + .5 * noise.noise(co * .4)))
    for k in range(7):                                                          # racines contreforts
        a = k / 7 * 6.283 + rnd.random() * .3; d = Vector((math.cos(a), math.sin(a), 0))
        Bt.paint(C.bm_tube(Bt.bm, C.catmull([base + d * rt * .6 + Vector((0, 0, h * .18)), base + d * rt * 1.7 + Vector((0, 0, h * .05)), base + d * rt * 2.6 + Vector((0, 0, -.8))], 3), lambda t: rt * (.42 - .25 * t), 8), BARK2)
    top = trunk[-1]
    for k in range(6):                                                          # branches maîtresses
        a = k / 6 * 6.283 + .4; d = Vector((math.cos(a), math.sin(a), 0)); zz = top.z - h * (.12 + .1 * (k % 2))
        br = C.catmull([Vector((top.x, top.y, zz)), Vector((top.x, top.y, zz)) + d * crown * .55 + Vector((0, 0, crown * .25)), Vector((top.x, top.y, zz)) + d * crown * .95 + Vector((0, 0, crown * .3))], 3)
        Bt.paint(C.bm_tube(Bt.bm, br, lambda t: rt * (.42 - .3 * t), 8), BARK)
        c = br[-1] + Vector((0, 0, crown * .2)); r = crown * (.45 + .1 * (k % 3))
        Bt.paint(C.bm_ico(Bt.bm, c, r, 3, (1, 1, .7), .25, k * 3 + x), L.grad(C.mix(GREENS[k % 4], (0, .06, .05, 1), .4), C.mix(GREENS[k % 4], (1, 1, .8, 1), .15), c.z - r * .6, c.z + r * .7))
    c = top + Vector((0, 0, crown * .35))
    Bt.paint(C.bm_ico(Bt.bm, c, crown * .75, 3, (1, 1, .62), .22, x + y), L.grad(C.mix(GREENS[1], (0, .06, .05, 1), .4), C.mix(GREENS[3], (1, 1, .8, 1), .15), c.z - crown * .5, c.z + crown * .5))
    return z0, top

# l'Arbre-Baleine au centre-nord du dos
wz0, wtop = giant_tree(-.03 * R, -.26 * R, 15, 2.8, 8)
for k, (hz, a) in enumerate([(6, .5), (11, 2.6), (15.5, 4.4)]):                    # plateformes et huttes accrochées au tronc
    c = P(-.03 * R, -.26 * R, wz0 + hz * .72) + Vector((math.cos(a) * 4.2, math.sin(a) * 4.2, 0))
    L.platform(Bh, c, 3.2, 2.5); L.round_hut(Bh, c, .9, WALL, ROOF, rnd=rnd); plat_pts.append(c + Vector((0, 0, .1)))
    L.lantern(Bl, c + Vector((2.6, 0, 1.4)), 1)
C.mark('DRAPEAU_arbre', -.03 * R, -.26 * R, wtop.z + 7)
# grands arbres-habitations en couronne
tree_spots = [(.27, -.5), (-.3, -.46), (.32, .02), (-.34, .04), (.14, .36), (-.17, .38)]
for k, (tx, ty) in enumerate(tree_spots):
    x, y = tx * R, ty * R
    z0, top = giant_tree(x, y, 8 + rnd.random() * 3, 1.4, 4.4)
    c = P(x, y, z0 + 4.6 + rnd.random() * 1.5) + Vector((2.2, 0, 0))
    L.platform(Bh, c, 2.4, 3); L.round_hut(Bh, c, .75, WALL, ROOF if k % 2 else ROOF2, rnd=rnd); plat_pts.append(c + Vector((0, 0, .1)))
    L.lantern(Bl, c + Vector((0, 2, 1.2)), .9)
# ponts de cordes entre plateformes voisines
order = sorted(plat_pts, key=lambda v: math.atan2(v.y, v.x))
for i in range(len(order)):
    a, b = order[i], order[(i + 1) % len(order)]
    if (a - b).length < 26: L.rope_bridge(Bb, a, b, 1.1, 2.2)
for p in plat_pts[3:]:
    if (p - plat_pts[1]).length < 30: L.rope_bridge(Bb, plat_pts[1], p, 1.1, 2.6)

# ------------------------------------------------------------------ jungle : arbres, palmiers, fougères, rochers, fleurs
Bj = L.Batch('Zou_jungle', DECOR, M['peint']); Bf = L.Batch('Zou_sous_bois', DECOR, M['peint'], False)
busy = [(-.03 * R, -.26 * R, 7)] + [(tx * R, ty * R, 4) for tx, ty in tree_spots]
def free(x, y, r):
    return all(math.hypot(x - a, y - b) > c + r for a, b, c in busy)
def scatter(n, rmin, fn, tries=4000):
    c = 0
    for _ in range(tries):
        if c >= n: break
        x = (rnd.random() * 2 - 1) * ax; y = cy0 + (rnd.random() * 2 - 1) * ay
        if not on_cap(x, y) or not free(x, y, rmin): continue
        z = gs.z(x, y)
        if z is None: continue
        fn(x, y, z); busy.append((x, y, rmin)); c += 1
    return c
# ------------------------------------------------------------------ village des Minks au sol (niveau 1) et niveaux de ville 2 à 4
def huts(batch, n):
    scatter(n, 2.7, lambda x, y, z: (L.round_hut(batch, P(x, y, z), .85 + rnd.random() * .2, WALL, ROOF if rnd.random() < .5 else ROOF2, rnd=rnd), L.lantern(Bl, P(x + 1.6, y, z + 1.2), .8)))
huts(Bh, 5)
for li, (col, n) in enumerate(((V2, 4), (V3, 3), (V4, 3))):
    bv = L.Batch('Zou_' + col.name, col, M['peint']); huts(bv, n)
    for tx, ty in tree_spots[li * 2: li * 2 + 2]:                       # le village grimpe aussi dans les arbres
        x, y = tx * R, ty * R; z0 = gs.z(x, y, 22); c = P(x, y, z0 + 8.5 + li) + Vector((-2.4, 0, 0))
        L.platform(bv, c, 2.2, 3); L.round_hut(bv, c, .7, WALL, ROOF2, rnd=rnd); L.lantern(Bl, c + Vector((0, -1.8, 1.1)), .8)
    bv.done()

scatter(80, 1.1, lambda x, y, z: L.jungle_tree(Bj, P(x, y, z), .52 + rnd.random() * .3, GREENS, rnd=rnd))
scatter(18, 1.0, lambda x, y, z: L.palm(Bj, P(x, y, z), .55 + rnd.random() * .25, rnd=rnd))
scatter(70, .5, lambda x, y, z: L.fern(Bf, P(x, y, z), .8 + rnd.random() * .5))
scatter(14, 1.0, lambda x, y, z: L.rock(Bj, P(x, y, z), 1 + rnd.random() * 1.2, C.hexc('#8a8478'), C.hexc('#5f8a44'), rnd))
scatter(26, .6, lambda x, y, z: L.flower_patch(Bf, P(x, y, z), .8, [C.hexc('#f6d24a'), C.hexc('#ff7a9a'), C.hexc('#f0f0f0')], rnd))

# ------------------------------------------------------------------ accès : escalier autour de la patte avant gauche, rampe sur le flanc, ponton
lx, ly = -.5 * R, .44 * R
Bs = L.Batch('Zou_escalier', DECOR, M['peint'])
L.stairs_spiral(Bs, P(lx, ly, 0), 6.2, .6, 12.5, 2.0, 1.8)
for k in range(16):                                                     # rampe en lacets sur le flanc jusqu'à la jungle
    t = k / 15; x = lx + 2 + math.sin(t * 9) * 2.2; y = ly - 3 - t * 6; z = 12.5 + t * 12
    zs = gb.z(x, y) or z; zz = max(z, zs + .3)
    Bs.paint(C.bm_box(Bs.bm, P(x, y, zz), (2.4, 1.6, .35)), C.hexc('#9a7048') if k % 2 else C.hexc('#86603c'))
pa = isl['ponton'] or 1.95; dx, dy = math.cos(pa), math.sin(pa)
px, py = lx - 2, ly + 7
for k in range(9):
    Bs.paint(C.bm_box(Bs.bm, P(px + dx * k * 1.6, py + dy * k * 1.6, .35), (2.6, 1.7, .3)), C.hexc('#9a7048'))
    if k % 2 == 0:
        for sg in (-1, 1): Bs.paint(C.bm_cyl(Bs.bm, P(px + dx * k * 1.6 + sg * 1.4, py + dy * k * 1.6, -1.5), P(px + dx * k * 1.6 + sg * 1.4, py + dy * k * 1.6, 1.2), .25, .25, 6), C.hexc('#5a3c24'))
C.mark('PONTON', px + dx * 12, py + dy * 12, 0); C.mark('DRAPEAU_ponton', px + dx * 13, py + dy * 13, 2.6)
Bs.done()

for b in (Bt, Bh, Bb, Bl, Bj, Bf): b.done()
os.makedirs(os.path.join(C.ART, 'blender', 'islands'), exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(C.ART, 'blender', 'islands', 'zou.blend'))
tris = 0
for o in bpy.data.objects:
    if o.type == 'MESH': tris += sum(len(p.vertices) - 2 for p in o.data.polygons)
print('ZOU ok', round(time.time() - T0, 1), 's', 'triangles', tris)
