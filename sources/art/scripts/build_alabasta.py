"""Alabasta — scène Blender détaillée (île 6), kit désert rk_desert.py (+ pièces génériques de rk_port), plan al_plan.py.
Canon [C] / [I] : voir al_plan.py et art/data/fiches/alabasta.json. Exclus : personnages, animaux identifiables, emblèmes royaux,
emblème du casino, copie de tout décor officiel.
Usage : python3 build_alabasta.py → art/blender/islands/alabasta.blend   (puis export_island.py alabasta)
"""
import sys, os, math, random, time
sys.path.insert(0, os.path.dirname(__file__))
import bpy, bmesh
import rk_common as C, rk_lib as L, rk_port as K, rk_desert as D
import al_plan as P

T0 = time.time(); rnd = random.Random(1305)
sc = C.new_scene(); M = C.materials()
SOL, DECOR, V2, V3, V4 = C.coll('RK_SOL'), C.coll('RK_DECOR'), C.coll('RK_VILLE_2'), C.coll('RK_VILLE_3'), C.coll('RK_VILLE_4')
LV = {1: DECOR, 2: V2, 3: V3, 4: V4}; H = C.hexc; G = C.g2b
B = {k: L.Batch('AR_ville_%d' % k, LV[k], M['peint']) for k in LV}
BM = L.Batch('AR_monuments', DECOR, M['peint']); BE = L.Batch('AR_eau', DECOR, M['eau'], False)
BV = {k: L.Batch('AR_vegetation_%d' % k, LV[k], M['peint']) for k in LV}
zg = P.height


def zfoot(x, y, ang, w, d):
    c, s = math.cos(ang), math.sin(ang)
    return min(zg(x + su * w / 2 * -s + sv * d / 2 * c, y + su * w / 2 * c + sv * d / 2 * s) for su in (-1, 1) for sv in (-1, 1))


# ------------------------------------------------------------------ 1. sol : dunes, rives vertes, rocher d'Alubarna, villes
CHAMPS = P.champs()
bm = bmesh.new(); colL = bm.verts.layers.float_color.new('Col'); step = .5; ext = 37.0; n = int(2 * ext / step) + 1; grid = {}
for j in range(n):
    for i in range(n):
        x = -ext + i * step; y = -ext + j * step; r, th, q = P.pol(x, y)
        if q > 1.1: continue
        h = zg(x, y); v = bm.verts.new(G(x, y, h)); grid[(i, j)] = v; z_ = P.zone(x, y)
        du = P.dunes(x, y); c = C.mix(H('#e8cf96'), H('#d6b273'), .5 + .5 * math.tanh(du * 2))             # crêtes et creux des dunes
        if z_ == 'rive':
            fd = P.fleuve_d(x, y); c = C.mix(H('#7aa64a'), H('#a8b86a'), min(1, max(0, (fd - P.FLEUVE_L / 2) / P.RIVE_L)))
        elif z_ in ('oasis', 'tombeau'): c = C.mix(H('#7aa64a'), H('#cfc07a'), .3 + .3 * math.sin(x * 2 + y))
        elif z_ == 'rocher': c = C.mix(H('#c79a6a'), H('#b0845a'), (int(h * 2.2) % 2) * .6)
        elif z_ == 'alubarna': c = H('#efe2c6') if (i + j) % 3 else H('#e6d6b6')
        elif z_ in ('nanohana', 'katorea', 'port_sud'): c = H('#e6d4ae')
        elif z_ == 'rainbase': c = H('#e2cfa2')
        elif z_ in ('yuba', 'suiren', 'erumalu'): c = C.mix(H('#d8bc84'), H('#c6a670'), .5 + .5 * math.sin(x * 1.7))
        elif z_ == 'plage': c = H('#f0dcaa')
        if P.piste_at(x, y) and z_ in ('desert', 'rive', 'oasis'): c = H('#cdb07a')
        if any(abs(x - cx) < w / 2 and abs(y - cy) < d / 2 for cx, cy, a, w, d in CHAMPS): c = C.mix(H('#6a9a3a'), H('#a8b050'), ((i // 2 + j) % 3) / 2)
        if P.water_at(x, y) is not None: c = H('#5f8a98')
        v[colL] = c
for (i, j), v in grid.items():
    qd = [(i, j), (i + 1, j), (i + 1, j + 1), (i, j + 1)]
    if all(k in grid for k in qd): bm.faces.new([grid[k] for k in qd])
ground = C.mk_obj('AR_sol', bm, SOL, M['peint'], smooth=False); ground.data.color_attributes.active_color = ground.data.color_attributes['Col']; C.normals_up(ground)

# ------------------------------------------------------------------ 2. eau : fleuve Sandora [C] (lit lissé), oasis
st = .5
for j in range(int(2 * ext / st)):
    for i in range(int(2 * ext / st)):
        x = -ext + (i + .5) * st; y = -ext + (j + .5) * st; w = P.water_at(x, y)
        if w is None or not P.oasis_at(x, y): continue                                        # (le fleuve est un ruban lisse, ci-dessous)
        qd = [BE.bm.verts.new(G(-ext + (i + a) * st, -ext + (j + b) * st, w)) for a, b in ((0, 0), (1, 0), (1, 1), (0, 1))]
        BE.bm.faces.new(qd); BE.paint(qd, H('#2f86b0') if not P.oasis_at(x, y) else H('#3aa0b8'), .05)
pts = []                                                                                      # fleuve : ruban continu qui suit le tracé (rives lisses)
for (ax, ay), (bx, by) in zip(P.FLEUVE, P.FLEUVE[1:]):
    for k in range(8): pts.append((ax + (bx - ax) * k / 8, ay + (by - ay) * k / 8))
pts.append(P.FLEUVE[-1]); prev = None
for k, (x, y) in enumerate(pts):
    x2, y2 = pts[min(k + 1, len(pts) - 1)]; x0, y0 = pts[max(k - 1, 0)]; tx, ty = x2 - x0, y2 - y0; ln = math.hypot(tx, ty) or 1
    nx, ny = -ty / ln * P.FLEUVE_L / 2, tx / ln * P.FLEUVE_L / 2; q = P.dcoast(x, y); wz = P.Z_EAU * (1 - P.ss(.75, 1.0, q)) + .05
    cur = (BE.bm.verts.new(G(x - nx, y - ny, wz)), BE.bm.verts.new(G(x + nx, y + ny, wz)))
    if prev: f = BE.bm.faces.new((prev[0], prev[1], cur[1], cur[0])); BE.paint(list(prev) + list(cur), H('#2f86b0'), .04)
    prev = cur
for k in range(10):                                                                           # felouques
    t = (k + .5) / 10; seg = min(len(P.FLEUVE) - 2, int(t * (len(P.FLEUVE) - 1))); f = t * (len(P.FLEUVE) - 1) - seg
    (ax, ay), (bx, by) = P.FLEUVE[seg], P.FLEUVE[seg + 1]; x, y = ax + (bx - ax) * f + rnd.uniform(-.4, .4), ay + (by - ay) * f
    D.felouque(B[1 if k % 3 else 2], x, y, P.water_at(x, y) or .4, math.atan2(by - ay, bx - ax) + math.pi / 2, 1.3, rnd)

# ------------------------------------------------------------------ 3. Alubarna [C] : rocher, escaliers taillés, ville circulaire, palais, place, tour de l'horloge
ax_, ay_, ar_, ah_ = P.ALUBARNA
zp = zg(*P.PALAIS); top = D.palais(BM, P.PALAIS[0], P.PALAIS[1], zp)
C.mark('DRAPEAU_palais', P.PALAIS[0], P.PALAIS[1], zp + top + .3)
zh = zg(*P.HORLOGE); D.tour_horloge(BM, P.HORLOGE[0], P.HORLOGE[1], zh)
px, py, pr = P.PLACE
vs = C.bm_cyl(BM.bm, G(px, py, zg(px, py) - .1), G(px, py, zg(px, py) + .04), pr, pr, 24); BM.paint(vs, H('#e8d8b4'), .02)
vs = C.bm_cyl(BM.bm, G(px, py, zg(px, py)), G(px, py, zg(px, py) + .35), .5, .5, 16); BM.paint(vs, H('#d8c49a'), .02)
vs = C.bm_cyl(BM.bm, G(px, py, zg(px, py) + .3), G(px, py, zg(px, py) + .33), .42, .42, 16); BM.paint(vs, H('#4fb3e0'), .02)
for k in range(48):                                                                           # rempart circulaire au bord du rocher [I]
    a0, a1 = k / 48 * 6.283, (k + 1) / 48 * 6.283; rr = ar_ * .93
    if P.angd((a0 + a1) / 2, P.ESCALIER_A) < .12: continue
    xm, ym = ax_ + math.cos((a0 + a1) / 2) * rr, ay_ + math.sin((a0 + a1) / 2) * rr; F = K.Frame(xm, ym, zg(xm, ym), (a0 + a1) / 2)
    K.box(BM, F, -rr * (a1 - a0) / 2 - .02, rr * (a1 - a0) / 2 + .02, -.15, .15, -.5, .7, H('#e8dcc2'), .03)
    if k % 2 == 0: K.box(BM, F, -.1, .1, -.15, .15, .7, .9, H('#e8dcc2'), .03)
    if k % 8 == 4: vs = C.bm_cyl(BM.bm, G(xm, ym, zg(xm, ym) - .4), G(xm, ym, zg(xm, ym) + 1.3), .35, .32, 10); BM.paint(vs, H('#efe4cf'), .02); D.dome(BM, xm, ym, zg(xm, ym) + 1.3, .32, H('#2f8a9a'), True)
a = P.ESCALIER_A                                                                               # escaliers taillés [C]
for k in range(16):
    t0 = 1.0 + k * .33 / 16; x, y = ax_ + math.cos(a) * ar_ * t0, ay_ + math.sin(a) * ar_ * t0
    F = K.Frame(x, y, 0, a); zz = zg(x, y)
    K.box(BM, F, -.8, .8, -.16, .16, zz - 1.0, zz + .02, H('#d8c49a'), .03)
for s_ in (-1, 1):
    for k in range(4):
        t0 = 1.0 + k * .1; x, y = ax_ + math.cos(a) * ar_ * t0 + math.cos(a + 1.57) * 1.0 * s_, ay_ + math.sin(a) * ar_ * t0 + math.sin(a + 1.57) * 1.0 * s_
        vs = C.bm_cyl(BM.bm, G(x, y, zg(x, y) - .4), G(x, y, zg(x, y) + .8), .14, .12, 8); BM.paint(vs, H('#e8dcc2'), .02)
tx, ty, tr = P.TOMBEAU                                                                         # tombeau royal boisé [C] + tombeaux [I]
for k in range(6):
    t = rnd.uniform(0, 6.283); d = tr * .6 * math.sqrt(rnd.random()); D.tombeau(BM, tx + math.cos(t) * d, ty + math.sin(t) * d, zg(tx, ty), rnd)

# ------------------------------------------------------------------ 4. Rainbase [C] : casino pyramide, Nanohana [C] : port, phare (niveau 4) [I]
cx, cy = P.CASINO; D.pyramide(BM, cx, cy, zg(cx, cy))
C.mark('DRAPEAU_casino', cx + 2.6, cy, zg(cx, cy) + 2.2)
nx, ny, nr = P.NANOHANA; a = math.atan2(ny, nx); r1 = P.coast_r(a)
for k in range(3):                                                                            # jetées
    aa = a + (k - 1) * .16; x0, y0 = math.cos(aa) * (r1 - 1.2), math.sin(aa) * (r1 - 1.2); F = K.Frame(x0, y0, 0, aa)
    K.box(BM, F, -.35, .35, -.5, 3.8, -.8, .85, K.PIERRE2 if k == 1 else K.BOIS, .04)
for k in range(3): K.navire(BM if k == 1 else B[2], math.cos(a + (k - 1) * .2) * (r1 + 2.6), math.sin(a + (k - 1) * .2) * (r1 + 2.6), a + math.pi / 2, 3.0, rnd, H('#f4efe2'), H('#7a5638'), 1)
lx, ly = math.cos(a + .3) * (r1 - .8), math.sin(a + .3) * (r1 - .8)
F = K.Frame(lx, ly, zg(lx, ly), 0); K.box(B[4], F, -.5, .5, -.5, .5, -.6, 4.0, H('#efe4cf'), .03); D.dome(B[4], lx, ly, zg(lx, ly) + 4.0, .45, H('#2f8a9a'), True)
C.mark('PONTON', math.cos(a) * (r1 + 1.6), math.sin(a) * (r1 + 1.6), 0)
for k in range(10):                                                                           # étals du bazar de Nanohana [I]
    t = rnd.uniform(0, 6.283); d = rnd.uniform(1.0, nr * .7); x, y = nx + math.cos(t) * d, ny + math.sin(t) * d
    if not P.obstacle(x, y): D.etal(B[1 if k < 6 else 2], x, y, zg(x, y), rnd.uniform(0, 6.28), rnd)
bx, by, br = P.PORT_SUD                                                                       # port du sud [C : 2 ports, sud et est]
F = K.Frame(bx, by + br, 0, math.pi / 2); K.box(BM, F, -.35, .35, -.5, 3.4, -.8, .85, K.BOIS, .04)
K.navire(B[2], bx + 1.5, by + br + 3.6, 0.0, 2.6, rnd, H('#f4efe2'), H('#7a5638'), 1)

# ------------------------------------------------------------------ 5. bâtiments (plan de production)
nb = 0; cnt = {}
for b in P.batiments():
    lv = b['niveau']; typ = b['type']; z0 = zfoot(b['x'], b['y'], b['ang'], b['w'], b['d'])
    if typ in ('alubarna', 'nanohana'): D.maison_blanche(B[lv], b['x'], b['y'], z0, b['ang'], b['w'], b['d'], b['etages'], rnd, b.get('dome'))
    elif typ == 'rainbase': D.maison_ouest(B[lv], b['x'], b['y'], z0, b['ang'], b['w'], b['d'], rnd)
    elif typ == 'yuba': D.hutte_ronde(B[lv], b['x'], b['y'], z0, .48, rnd, .25 + .3 * rnd.random())
    elif typ == 'ruine': D.ruine(B[lv], b['x'], b['y'], z0, b['ang'], b['w'] * 1.2, b['d'] * 1.2, rnd)
    else: D.maison_terre(B[lv], b['x'], b['y'], z0, b['ang'], b['w'], b['d'], b['etages'], rnd)
    nb += 1; cnt[typ] = cnt.get(typ, 0) + 1

# ------------------------------------------------------------------ 6. végétation : palmiers des rives et des oasis, buissons, arbres morts d'Erumalu
for x, y, s, kind, lv in P.arbres():
    z = zg(x, y)
    if kind == 'palmier': D.palmier(BV[lv], x, y, z, s, rnd)
    elif kind == 'buisson': D.buisson(BV[lv], x, y, z, s, rnd)
    else:
        vs = C.bm_tube(BV[lv].bm, [G(x, y, z - .2), G(x + .1, y, z + .8 * s), G(x - .1, y + .1, z + 1.3 * s)], lambda t: .07 * (1 - .6 * t), 5); BV[lv].paint(vs, H('#6a5a48'), .05)
for k in range(30):                                                                           # rochers épars du désert
    x, y = rnd.uniform(-30, 30), rnd.uniform(-30, 30)
    if P.zone(x, y) == 'desert' and not P.obstacle(x, y) and P.dcoast(x, y) < .85:
        vs = C.bm_ico(BM.bm, G(x, y, zg(x, y) - .1), .3 + .4 * rnd.random(), 1, (1.2, 1, .6)); BM.paint(vs, C.mix(H('#c79a6a'), H('#a8825a'), rnd.random()), .08)

for Bt in list(B.values()) + list(BV.values()) + [BM, BE]: Bt.done()
os.makedirs(os.path.join(C.ART, 'blender', 'islands'), exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(C.ART, 'blender', 'islands', 'alabasta.blend'))
tris = sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in bpy.data.objects if o.type == 'MESH')
print('ALABASTA ok', round(time.time() - T0, 1), 's · bâtiments', nb, cnt, '· triangles', tris, '· palais', round(zp + top, 1))
