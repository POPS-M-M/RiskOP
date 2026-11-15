"""Whole Cake — scène source Blender (prototype, direction artistique contrastée avec Zou).
Canon (à ma connaissance) : territoire de Big Mom ; château en forme de gâteau géant (Whole Cake Chateau) ; ville de
pâtisseries (Sweet City) ; forêt merveilleuse (Seducing Woods) ; architecture et paysages en sucreries.
[I] interprétation : plan de l'île, étages et couleurs du château, flèche en crème fouettée, tourelles-cupcakes, rivière et
fontaine de chocolat, falaises en couches de génoise, champs de glaçage, arches en beignets, port en biscuit.
Usage : python3 build_whole_cake.py → art/blender/islands/whole_cake.blend
"""
import sys, os, math, random, time
sys.path.insert(0, os.path.dirname(__file__))
import bpy, bmesh
from mathutils import Vector, Matrix, noise
import rk_common as C, rk_lib as L
K_ = L.CANDY

T0 = time.time(); rnd = random.Random(1210)
isl = C.island('Whole Cake'); R = isl['rayon']
sc = C.new_scene(); M = C.materials()
SOL, DECOR, V2, V3, V4 = C.coll('RK_SOL'), C.coll('RK_DECOR'), C.coll('RK_VILLE_2'), C.coll('RK_VILLE_3'), C.coll('RK_VILLE_4')
P = lambda x, y, z: C.g2b(x, y, z)
CX, CY = 0, -.1 * R                                                    # centre du château
RIVER = [(-.2 * R, -.02 * R), (-.42 * R, .18 * R), (-.5 * R, .42 * R), (-.66 * R, .62 * R), (-.86 * R, .78 * R)]
def seg_d(x, y, pts):
    m = 1e9
    for (ax_, ay_), (bx, by) in zip(pts, pts[1:]):
        vx, vy = bx - ax_, by - ay_; t = max(0, min(1, ((x - ax_) * vx + (y - ay_) * vy) / (vx * vx + vy * vy)))
        m = min(m, math.hypot(x - ax_ - vx * t, y - ay_ - vy * t))
    return m
ROADS = [[(CX, CY + 10), (0, .45 * R), (.05 * R, .92 * R)], [(CX + 10, CY), (.45 * R, .05 * R), (.66 * R, .3 * R)], [(CX - 8, CY + 6), (-.3 * R, .45 * R)]]
def ss(a, b, x):
    t = max(0, min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t)
def height(x, y):
    th = math.atan2(y, x); d = math.hypot(x, y) / C.coast_r(isl, th)
    if d >= 1: return -1.2 * ss(1, 1.15, d) - .02
    h = .35 * ss(1, .94, d) + 2.4 * ss(.96, .82, d)                                  # falaises de génoise au bord
    h += 1.4 * max(0, noise.noise(Vector((x * .06, y * .06, 2)))) * ss(.85, .5, d)    # collines de crème
    h += 3.2 * ss(.62, .32, max(0, (math.hypot(x - CX, y - CY) - 6) / R * 2.2)) * 0     # (réservé)
    pc = math.hypot(x - CX, y - CY); h = h * (1 - ss(14, 11, pc)) + 4.2 * ss(14, 11, pc)  # plateau du château (assiette)
    for hx, hy, hh, hr in ((.1, -.68, 4.5, .2), (-.38, -.55, 3.4, .16), (.48, -.42, 3.0, .15)):   # monts chantilly au nord
        q = math.hypot(x - hx * R, y - hy * R); h += hh * math.exp(-q * q / (2 * (hr * R) ** 2)) * ss(.98, .7, d)
    rv = seg_d(x, y, RIVER); h -= 1.6 * ss(3.2, 1.4, rv) * ss(.99, .9, d) * (1 - ss(14, 11, pc))
    return h

# ------------------------------------------------------------------ sol : champs de glaçage, plages de sucre, falaises en couches
bm = bmesh.new(); colL = bm.verts.layers.float_color.new('Col'); step = .75; ext = 1.18 * R; n = int(2 * ext / step) + 1; grid = {}
FIELDS = [K_['rose'], K_['menthe'], K_['citron'], K_['creme'], K_['lavande']]
for j in range(n):
    for i in range(n):
        x = -ext + i * step; y = -ext + j * step; th = math.atan2(y, x); d = math.hypot(x, y) / C.coast_r(isl, th)
        if d > 1.16: continue
        h = height(x, y); v = bm.verts.new(P(x, y, h)); grid[(i, j)] = v
        if h < .5: c = C.hexc('#fbe9c8')                                                          # sucre glace (plage)
        elif d > .84 and h < 2.9:                                                                # tranche de gâteau : couches
            band = int((h * 2.2) % 3); c = [K_['genoise'], K_['creme'], K_['fraise']][band]
        else:
            f = noise.noise(Vector((x * .045, y * .045, 7))) * 2.5 + 2.5; k = int(f) % 5; t = f - int(f)
            c = C.mix(FIELDS[k], FIELDS[(k + 1) % 5], ss(.7, 1, t))
            if math.hypot(x - CX, y - CY) < 13: c = C.mix(K_['blanc'], K_['creme'], .5 + .5 * math.sin(math.atan2(y - CY, x - CX) * 12))   # assiette
            for road in ROADS:
                if seg_d(x, y, road) < 1.6: c = K_['biscuit'] if (int(x / 1.5) + int(y / 1.5)) % 2 else C.mix(K_['biscuit'], K_['choco2'], .3)
        v[colL] = c
for (i, j), v in grid.items():
    q = [(i, j), (i + 1, j), (i + 1, j + 1), (i, j + 1)]
    if all(k in grid for k in q): bm.faces.new([grid[k] for k in q])
ground = C.mk_obj('WC_sol', bm, SOL, M['peint']); ground.data.color_attributes.active_color = ground.data.color_attributes['Col']; C.normals_up(ground)
gs = C.Ground([ground])

# rivière de chocolat (ruban brillant) et fontaine de chocolat au départ
Bw = L.Batch('WC_chocolat', DECOR, M['brillant'], True)
pts = C.catmull([Vector(p) for p in RIVER], 5); prev = None
for k, p in enumerate(pts):
    nx_ = (pts[min(k + 1, len(pts) - 1)] - pts[max(k - 1, 0)]); nx_ = Vector((-nx_.y, nx_.x, 0)).normalized() * 2.6
    zb = max(.25, min(gs.z(p.x + nx_.x, p.y + nx_.y, .5), gs.z(p.x - nx_.x, p.y - nx_.y, .5)) - .55)
    a = Bw.bm.verts.new(P(p.x + nx_.x, p.y + nx_.y, zb)); b = Bw.bm.verts.new(P(p.x - nx_.x, p.y - nx_.y, zb)); Bw.paint([a, b], K_['choco2'], .03)
    if prev: Bw.bm.faces.new((prev[0], prev[1], b, a))
    prev = (a, b)
fx, fy = RIVER[0]; fz = gs.z(fx, fy, 2)
Bw.paint(C.bm_cyl(Bw.bm, P(fx, fy, fz - .2), P(fx, fy, fz + .8), 3.2, 3.4, 28), K_['choco'])
for k, (r, h) in enumerate(((2.4, 2.4), (1.6, 4.0), (.9, 5.3))):
    Bw.paint(C.bm_cyl(Bw.bm, P(fx, fy, fz), P(fx, fy, fz + h), .35, .35, 10), K_['choco2'])
    Bw.paint(C.bm_uvsphere(Bw.bm, P(fx, fy, fz + h), 1, 20, 8, (r, r, .4)), K_['choco2'])
Bw.done()

# ------------------------------------------------------------------ le château-gâteau (élément héros)
Bc = L.Batch('WC_chateau', DECOR, M['brillant']); Bg = L.Batch('WC_vitraux', DECOR, M['lueur'])
z = gs.z(CX, CY, 4.2) - .1; c0 = P(CX, CY, 0)
tiers = [(12.5, 4.2, K_['rose'], K_['creme']), (10.2, 3.9, K_['genoise'], K_['fraise']), (8.0, 3.7, K_['rose'], K_['blanc']), (6.0, 3.4, K_['creme'], K_['rose']), (4.4, 3.1, K_['lavande'], K_['creme'])]
for k, (r, h, body, ice) in enumerate(tiers):
    L.cake_tier(Bc, c0 + Vector((0, 0, z)), r, h, body, ice, rnd, True, [K_['fraise'], K_['cerise'], K_['menthe']] if k % 2 == 0 else [K_['citron'], K_['blanc']])
    nwin = int(r * 1.4)
    for q in range(nwin):                                                              # fenêtres en bonbon (lumineuses)
        a = q / nwin * 6.283 + k * .2; d = Vector((math.cos(a), math.sin(a), 0))
        if d.y > .55: continue                                                         # (face nord peu visible)
        w = C.bm_box(Bg.bm, c0 + d * (r + .02) + Vector((0, 0, z + h * .45)), (.9, .9, 1.5))
        bmesh.ops.rotate(Bg.bm, verts=w, cent=c0 + d * (r + .02) + Vector((0, 0, z + h * .45)), matrix=Matrix.Rotation(a, 3, 'Z'))
        Bg.paint(w, [K_['citron'], K_['menthe'], K_['rose'], K_['bleu']][(q + k) % 4])
    z += h + .55
# flèche en crème fouettée + cerise, mât du drapeau
for k in range(7):
    r = 3.6 - k * .5; Bc.paint(C.bm_uvsphere(Bc.bm, c0 + Vector((0, 0, z + .9 + k * 1.15)), 1, 24, 10, (r, r, 1.0)), K_['blanc'] if k % 2 else K_['creme'])
zt = z + 9.6; Bc.paint(C.bm_ico(Bc.bm, c0 + Vector((0, 0, zt)), 1.5, 2), K_['cerise'])
Bc.paint(C.bm_tube(Bc.bm, [c0 + Vector((0, 0, zt + 1.2)), c0 + Vector((.6, .3, zt + 3)), c0 + Vector((1.4, .4, zt + 4))], lambda t: .18, 6), C.hexc('#4a7a2a'))
C.mark('DRAPEAU_chateau', CX, CY, zt + 6)
# tourelles-cupcakes aux quatre coins du premier étage, tours-cornets de part et d'autre de la porte
for k in range(4):
    a = k / 4 * 6.283 + .785; p = c0 + Vector((math.cos(a) * 13.6, math.sin(a) * 13.6, gs.z(CX + math.cos(a) * 13.6, CY - math.sin(a) * 13.6, 4)))
    L.cupcake(Bc, p, 1.7, [K_['menthe'], K_['citron'], K_['lavande'], K_['rose']][k], K_['blanc'] if k % 2 else K_['rose'])
for sg in (-1, 1):
    x = CX + sg * 6; y = CY + 15; L.cone_tower(Bc, P(x, y, gs.z(x, y, 4)), 1.5, [K_['fraise'], K_['menthe'], K_['blanc']])
# porte en tablette de chocolat et escalier de macarons vers la ville (sud)
gz = gs.z(CX, CY + 13, 4)
Bc.paint(C.bm_box(Bc.bm, P(CX, CY + 12.6, gz + 2.2), (5, .8, 4.4)), K_['choco'])
for q in range(6): Bc.paint(C.bm_box(Bc.bm, P(CX - 1.6 + (q % 3) * 1.6, CY + 13.05, gz + 1 + (q // 3) * 2), (1.3, .3, 1.6)), K_['choco2'])
for q in range(5):
    y = CY + 15.5 + q * 1.6; L.macaron(Bc, P(CX, y, max(.3, gz - q * .8) - .5), 1.6 - q * .05, [K_['rose'], K_['menthe'], K_['citron'], K_['lavande'], K_['fraise']][q])
Bc.done(); Bg.done()

# ------------------------------------------------------------------ Sweet City : maisons en pain d'épices, cupcakes, macarons
busy = [(CX, CY, 16), (fx, fy, 5)]
def free(x, y, r): return all(math.hypot(x - a, y - b) > c + r for a, b, c in busy) and seg_d(x, y, RIVER) > r + 2.6
def scatter(n, rmin, fn, region, tries=5000):
    c = 0
    for _ in range(tries):
        if c >= n: break
        x = (rnd.random() * 2 - 1) * R; y = (rnd.random() * 2 - 1) * R
        th = math.atan2(y, x); d = math.hypot(x, y) / C.coast_r(isl, th)
        if d > .84 or not region(x, y) or not free(x, y, rmin): continue
        if any(seg_d(x, y, rd) < rmin + 1.2 for rd in ROADS): continue
        z = gs.z(x, y)
        if z is None or z < .6: continue
        fn(x, y, z); busy.append((x, y, rmin)); c += 1
city = lambda x, y: y > CY + 4 or x > .3 * R
woods = lambda x, y: x < -.2 * R and y > -.5 * R
hills = lambda x, y: y < -.35 * R
WALLS = [K_['biscuit'], K_['caramel'], K_['genoise']]; ROOFS = [K_['rose'], K_['menthe'], K_['blanc'], K_['lavande'], K_['choco2']]
def house(batch):
    def f(x, y, z):
        t = rnd.random()
        if t < .55: L.ginger_house(batch, P(x, y, z - .1), .85 + rnd.random() * .25, WALLS[rnd.randrange(3)], ROOFS[rnd.randrange(5)], K_['blanc'], rnd.random() * .5 - .25, rnd)
        elif t < .8: L.cupcake(batch, P(x, y, z - .1), 1.0 + rnd.random() * .3, [K_['menthe'], K_['rose'], K_['citron']][rnd.randrange(3)], [K_['blanc'], K_['rose'], K_['choco2']][rnd.randrange(3)])
        else:
            for q in range(2 + rnd.randrange(2)): L.macaron(batch, P(x, y, z - .1 + q * 1.5), 1.1, [K_['rose'], K_['menthe'], K_['citron'], K_['lavande']][rnd.randrange(4)])
    return f
Bh = L.Batch('WC_ville', DECOR, M['peint']); scatter(16, 2.2, house(Bh), city)
for col, n, reg in ((V2, 8, city), (V3, 7, lambda x, y: True), (V4, 7, lambda x, y: True)):
    bv = L.Batch('WC_' + col.name, col, M['peint']); scatter(n, 1.9, house(bv), reg); bv.done()
# arches en beignets sur les routes, tours-cornets en ville
Bm = L.Batch('WC_monuments', DECOR, M['brillant'])
for road in ROADS:
    (ax_, ay_), (bx, by) = road[0], road[1]; x = (ax_ + bx) / 2; y = (ay_ + by) / 2; z = gs.z(x, y, 2)
    L.donut_arch(Bm, P(x, y, z - .3), 1.1, K_['caramel'], [K_['rose'], K_['choco2'], K_['menthe']][ROADS.index(road)], None); busy.append((x, y, 4))
scatter(3, 3, lambda x, y, z: L.cone_tower(Bm, P(x, y, z - .1), 1.15, [K_['menthe'], K_['rose'], K_['citron']]), city)
# ------------------------------------------------------------------ forêt merveilleuse (ouest) et monts chantilly (nord)
Bv = L.Batch('WC_vegetation', DECOR, M['brillant'])
scatter(16, 1.6, lambda x, y, z: L.lollipop_tree(Bv, P(x, y, z - .1), .8 + rnd.random() * .3, [K_['fraise'], K_['blanc'], K_['menthe'], K_['blanc']] if rnd.random() < .5 else [K_['lavande'], K_['citron'], K_['rose'], K_['blanc']], rnd), woods)
scatter(14, 1.8, lambda x, y, z: L.cotton_tree(Bv, P(x, y, z - .1), .8 + rnd.random() * .3, [K_['rose'], K_['bleu'], K_['lavande']][rnd.randrange(3)], rnd), woods)
scatter(10, 1.0, lambda x, y, z: L.candy_cane(Bv, P(x, y, z - .1), .7, rnd), lambda x, y: True)
scatter(22, .8, lambda x, y, z: L.gumdrop(Bv, P(x, y, z), .8 + rnd.random() * .3, [K_['fraise'], K_['menthe'], K_['citron'], K_['lavande'], K_['bleu']][rnd.randrange(5)]), lambda x, y: True)
def meringue(x, y, z):
    s = 1.2 + rnd.random() * .8
    for q in range(4): Bv.paint(C.bm_uvsphere(Bv.bm, P(x, y, z + q * .9 * s), 1, 16, 8, ((1.6 - q * .38) * s, (1.6 - q * .38) * s, .8 * s)), K_['blanc'] if q % 2 else K_['creme'])
scatter(12, 1.8, meringue, hills)
scatter(10, 1.8, lambda x, y, z: L.cotton_tree(Bv, P(x, y, z - .1), .9, K_['rose'], rnd), hills)
Bv.done(); Bm.done(); Bh.done()
# ------------------------------------------------------------------ port en biscuit (sud)
Bp = L.Batch('WC_port', DECOR, M['peint']); pa = math.pi / 2; px, py = math.cos(pa) * .8 * R, math.sin(pa) * .8 * R
for k in range(9):
    Bp.paint(C.bm_box(Bp.bm, P(px + .05 * R, py + k * 1.5, .35), (3.2, 1.4, .5)), K_['biscuit'] if k % 2 else C.mix(K_['biscuit'], K_['choco2'], .25))
C.mark('PONTON', px + .05 * R, py + 15, 0); C.mark('DRAPEAU_port', px + .05 * R + 2, py + 12, 3)
Bp.done()
os.makedirs(os.path.join(C.ART, 'blender', 'islands'), exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(C.ART, 'blender', 'islands', 'whole_cake.blend'))
tris = sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in bpy.data.objects if o.type == 'MESH')
print('WHOLE CAKE ok', round(time.time() - T0, 1), 's', 'triangles', tris)
