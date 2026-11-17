"""Syrup — scène Blender détaillée (île 7), kit village anglais rk_anglais.py (+ pièces génériques de rk_port), plan sy_plan.py.
Canon [C] / [I] : voir sy_plan.py et art/data/fiches/syrup.json. Exclus : personnages (et leurs maisons nommées), animaux identifiables,
emblèmes, navires de pirates identifiables, copie de tout décor officiel.
Usage : python3 build_syrup.py → art/blender/islands/syrup.blend   (puis export_island.py syrup)
"""
import sys, os, math, random, time
sys.path.insert(0, os.path.dirname(__file__))
import bpy, bmesh
import rk_common as C, rk_lib as L, rk_port as K, rk_anglais as A
import sy_plan as P

T0 = time.time(); rnd = random.Random(731)
sc = C.new_scene(); M = C.materials()
SOL, DECOR, V2, V3, V4 = C.coll('RK_SOL'), C.coll('RK_DECOR'), C.coll('RK_VILLE_2'), C.coll('RK_VILLE_3'), C.coll('RK_VILLE_4')
LV = {1: DECOR, 2: V2, 3: V3, 4: V4}; H = C.hexc; G = C.g2b
B = {k: L.Batch('SY_ville_%d' % k, LV[k], M['peint']) for k in LV}
BM = L.Batch('SY_monuments', DECOR, M['peint']); BE = L.Batch('SY_eau', DECOR, M['eau'], False)
BH = L.Batch('SY_haies', DECOR, M['peint'])
BV = {k: L.Batch('SY_vegetation_%d' % k, LV[k], M['peint']) for k in LV}
zg = P.height


def zfoot(x, y, ang, w, d):
    c, s = math.cos(ang), math.sin(ang)
    return min(zg(x + su * w / 2 * -s + sv * d / 2 * c, y + su * w / 2 * c + sv * d / 2 * s) for su in (-1, 1) for sv in (-1, 1))


# ------------------------------------------------------------------ 1. sol : prairies, champs, forêt, colline, falaises, criques, chemins
FIELD_COLS = [H('#b9c468'), H('#8cb45a'), H('#cdb86c'), H('#a2c264'), H('#d6c47a'), H('#9cba5c'), H('#c2a866'), H('#7fae58')]
bm = bmesh.new(); colL = bm.verts.layers.float_color.new('Col'); step = .5; ext = 35.0; n = int(2 * ext / step) + 1; grid = {}
for j in range(n):
    for i in range(n):
        x = -ext + i * step; y = -ext + j * step; r, th, q = P.pol(x, y)
        if q > 1.1: continue
        h = zg(x, y); v = bm.verts.new(G(x, y, h)); grid[(i, j)] = v; z_ = P.zone(x, y)
        c = C.mix(H('#86b85a'), H('#a2c86a'), .5 + .5 * math.sin(x * .3 + y * .2))                       # prairie
        ch = P.champ_of(x, y)
        if ch is not None: c = FIELD_COLS[(ch[0] * 3 + ch[1] * 7) % len(FIELD_COLS)]
        if z_ == 'foret': c = C.mix(H('#4f7a3a'), H('#5f8a42'), .5 + .5 * math.sin(x + y))
        elif z_ == 'colline': c = C.mix(H('#7cb058'), H('#94c068'), .5 + .5 * math.sin(x * .7))
        elif z_ == 'domaine': c = H('#9ccc6a') if (int(x * 2) + int(y * 2)) % 2 else H('#94c464')                # pelouse tondue
        elif z_ == 'village': c = C.mix(H('#94bc64'), H('#a6c070'), .5 + .5 * math.sin(x * 1.3))
        if q > .9 and P.pente(x, y) > 1.2 or z_ == 'falaise' and h < P.Z_P - .4: c = C.mix(H('#a49884'), H('#8e8472'), (int(h * 2.5) % 2) * .7)   # falaise
        if z_ == 'crique' and h < .9 and q > .93: c = H('#e8d6a6')
        if h < .05 and q > .96: c = H('#cbbd9a')
        if P.chemin_d(x, y) < .38 and q < .99: c = H('#c4a878')
        if math.hypot(x - P.GREEN[0], y - P.GREEN[1]) < P.GREEN[2]: c = H('#9cc86c')
        if P.water_at(x, y) is not None: c = H('#5f8a98')
        v[colL] = c
for (i, j), v in grid.items():
    qd = [(i, j), (i + 1, j), (i + 1, j + 1), (i, j + 1)]
    if all(k in grid for k in qd): bm.faces.new([grid[k] for k in qd])
ground = C.mk_obj('SY_sol', bm, SOL, M['peint'], smooth=False); ground.data.color_attributes.active_color = ground.data.color_attributes['Col']; C.normals_up(ground)

# ------------------------------------------------------------------ 2. eau : ruisseau (ruban), cascade dans la falaise est [I]
pts = []
for (ax, ay), (bx, by) in zip(P.RUISSEAU, P.RUISSEAU[1:]):
    for k in range(6): pts.append((ax + (bx - ax) * k / 6, ay + (by - ay) * k / 6))
prev = None
for k, (x, y) in enumerate(pts):
    if P.dcoast(x, y) > .968: break
    x2, y2 = pts[min(k + 1, len(pts) - 1)]; x0, y0 = pts[max(k - 1, 0)]; tx, ty = x2 - x0, y2 - y0; ln = math.hypot(tx, ty) or 1
    nx, ny = -ty / ln * .34, tx / ln * .34; wz = zg(x, y) + .14
    cur = (BE.bm.verts.new(G(x - nx, y - ny, wz)), BE.bm.verts.new(G(x + nx, y + ny, wz)))
    if prev: BE.bm.faces.new((prev[0], prev[1], cur[1], cur[0])); BE.paint(list(prev) + list(cur), H('#3a8ab0'), .04)
    prev = cur; last = (x, y, wz, tx / ln, ty / ln)
x, y, wz, ux, uy = last                                                                       # cascade [I] : rebord, puis rideau vertical devant la falaise
d = 0.0
while P.dcoast(x + ux * d, y + uy * d) < 1.0 and d < 6: d += .05
ex, ey = x + ux * (d + .25), y + uy * (d + .25); wx, wy = -uy * .4, ux * .4
lip = [BE.bm.verts.new(G(px + sx * wx, py + sx * wy, wz)) for (px, py) in ((x, y), (ex, ey)) for sx in (-1, 1)]
BE.bm.faces.new((lip[0], lip[1], lip[3], lip[2])); BE.paint(lip, H('#bfe2f0'), .04)
for k in range(5):
    za, zb = wz - (wz + .3) * k / 5, wz - (wz + .3) * (k + 1) / 5; ka, kb = .25 * k / 5, .25 * (k + 1) / 5
    q = [BE.bm.verts.new(G(ex + ux * kk + sx * wx * (1 + kk), ey + uy * kk + sx * wy * (1 + kk), zz)) for (zz, kk) in ((za, ka), (zb, kb)) for sx in (-1, 1)]
    BE.bm.faces.new((q[0], q[1], q[3], q[2])); BE.paint(q, H('#d6eef6') if k < 4 else H('#eef8fb'), .05)
px, py = ex + ux * .4, ey + uy * .4
for k in range(6):
    vs = C.bm_ico(BM.bm, G(px + rnd.uniform(-.5, .5), py + rnd.uniform(-.5, .5), -.25), .25 + .2 * rnd.random(), 1, (1, 1, .5)); BM.paint(vs, H('#f4f8fa'), .04)
for (x0, y0) in [P.RUISSEAU[2]]:                                                              # pont de pierre là où le chemin croise le ruisseau [I]
    a = math.atan2(P.RUISSEAU[3][1] - P.RUISSEAU[1][1], P.RUISSEAU[3][0] - P.RUISSEAU[1][0])
    F = K.Frame(x0, y0, zg(x0, y0) + .25, a + math.pi / 2); K.box(BM, F, -.5, .5, -.9, .9, -.4, .08, K.PIERRE2, .05)
    for s in (-1, 1): K.box(BM, F, s * .5 - .06, s * .5 + .06, -.9, .9, .08, .3, K.PIERRE2, .05)

# ------------------------------------------------------------------ 3. colline et manoir [C], domaine clos [C], grille, allée, jardins [I]
mx, my = P.MANOIR; porte = math.atan2(P.VILLAGE[1] - my, P.VILLAGE[0] - mx)                  # la grille regarde le village
zm = zg(mx, my); top = A.manoir(BM, mx, my, zm, porte, rnd)
C.mark('DRAPEAU_manoir', mx, my, zm + top + .2)
A.cloture(BM, mx, my, P.DOMAINE_R, zg, porte)
for k in range(9):                                                                            # allée de gravier jusqu'au perron
    t = k / 8; x, y = mx + math.cos(porte) * (P.DOMAINE_R - .2) * (1 - t * .55), my + math.sin(porte) * (P.DOMAINE_R - .2) * (1 - t * .55)
    F = K.Frame(x, y, zg(x, y), porte); K.box(BM, F, -.35, .35, -.25, .25, -.2, .05, H('#d8ccb0'), .04)
for s in (-1, 1):                                                                             # massifs et ifs taillés [I]
    for k in range(3):
        a = porte + s * (.6 + k * .45); x, y = mx + math.cos(a) * 3.2, my + math.sin(a) * 3.2
        vs = C.bm_cyl(BM.bm, G(x, y, zg(x, y) - .2), G(x, y, zg(x, y) + .9), .26, .05, 8); BM.paint(vs, H('#3f6a34'), .05)
        F = K.Frame(x + math.cos(porte) * .6, y + math.sin(porte) * .6, zg(x, y), a); K.box(BM, F, -.3, .3, -.18, .18, -.1, .15, A.FLEURS[k], .12)

# ------------------------------------------------------------------ 4. village [C] : pré communal, puits, grand chêne, Meshi [C], chapelle [I]
gx, gy, gr = P.GREEN
A.puits(BM, gx + .6, gy + .3, zg(gx + .6, gy + .3)); A.chene(BM, gx - .5, gy - .4, zg(gx - .5, gy - .4), 1.6, rnd)
ex, ey = P.MESHI; a = math.atan2(gy - ey, gx - ex); A.auberge(BM, ex, ey, zfoot(ex, ey, a, 2.1, 1.25), a, rnd)
cx, cy = P.CHAPELLE; a = math.atan2(gy - cy, gx - cx) - math.pi / 2; tc = A.chapelle(BM, cx, cy, zfoot(cx, cy, a, 2.0, 3.6), a, rnd)
C.mark('DRAPEAU_chapelle', cx + math.cos(a + math.pi / 2) * 1.5, cy + math.sin(a + math.pi / 2) * 1.5, zg(cx, cy) + tc + .1)
for k in range(14):                                                                           # pierres tombales du petit cimetière [I]
    t = rnd.uniform(0, 6.283); d = 1.6 + rnd.random() * 1.2; x, y = cx + math.cos(t) * d, cy + math.sin(t) * d
    if not P.obstacle(x, y):
        F = K.Frame(x, y, zg(x, y), a); K.box(BM, F, -.1, .1, -.03, .03, -.1, .28, H('#b9b2a2'), .05)

# ------------------------------------------------------------------ 5. criques au pied des deux pentes [C] : jetée, barques ; phare (niveau 4) [I]
for nom, a_ in (('nord', P.PENTE_N), ('sud', P.PENTE_S)):
    x0, y0 = P.at_coast(a_ + .07, .98); A.jetee(BM, x0, y0, a_ + .07, 3.2)
    for k in range(2): K.barque(B[1 if k == 0 else 2], *P.at_coast(a_ - .05 + k * .2, 1.06), .25, a_ + 1.2 + k)
    if nom == 'sud': C.mark('PONTON', *P.at_coast(a_ + .07, 1.12), 0)
lx, ly = P.at_coast(P.PHARE, .9); A.phare(B[4], lx, ly, zg(lx, ly))

# ------------------------------------------------------------------ 6. bâtiments (plan de production)
nb = 0; cnt = {}
for b in P.batiments():
    lv = b['niveau']; typ = b['type']; z0 = zfoot(b['x'], b['y'], b['ang'], b['w'], b['d'])
    if typ == 'colombage': A.colombage(B[lv], b['x'], b['y'], z0, b['ang'], b['w'], b['d'], rnd, b['toit'])
    elif typ == 'ferme':
        A.ferme(B[lv], b['x'], b['y'], z0, b['ang'], b['w'], b['d'], rnd)
        for k in range(2 + rnd.randrange(2)):                                                    # meules de foin [I]
            t = rnd.uniform(0, 6.283); x, y = b['x'] + math.cos(t) * 2.2, b['y'] + math.sin(t) * 2.2
            if not P.obstacle(x, y): A.meule(B[lv], x, y, zg(x, y), 1.0, rnd)
    elif typ == 'grange': A.grange(B[lv], b['x'], b['y'], z0, b['ang'], b['w'], b['d'], rnd)
    else: A.cottage(B[lv], b['x'], b['y'], z0, b['ang'], b['w'], b['d'], rnd, b['toit'])
    nb += 1; cnt[typ] = cnt.get(typ, 0) + 1

# ------------------------------------------------------------------ 7. haies vives entre les champs, murets au bord des chemins du village [C : village anglais]
nh = 0
for (xa, ya), (xb, yb) in P.haies_segments():
    xm, ym = (xa + xb) / 2, (ya + yb) / 2
    if P.dcoast(xm, ym) > .9 or P.chemin_d(xm, ym) < .6 or P.ruisseau_d(xm, ym) < .6: continue
    if any(P.dcoast(*p) > .93 for p in ((xa, ya), (xb, yb))): continue
    A.haie(BH, xa, ya, xb, yb, zg); nh += 1
for ci in (0, 1, 2):                                                                          # murets le long des chemins près du village
    for (ax, ay), (bx, by) in zip(P.CHEMINS[ci], P.CHEMINS[ci][1:]):
        L_ = math.hypot(bx - ax, by - ay); nx, ny = -(by - ay) / L_ * .7, (bx - ax) / L_ * .7
        if math.hypot((ax + bx) / 2 - P.VILLAGE[0], (ay + by) / 2 - P.VILLAGE[1]) > P.VILLAGE[2] + 6: continue
        for sgn in (-1, 1):
            p0, p1 = (ax + sgn * nx, ay + sgn * ny), (bx + sgn * nx, by + sgn * ny)
            if all(P.dcoast(*p) < .9 for p in (p0, p1)): A.muret(BH, [p0, p1], zg)

# ------------------------------------------------------------------ 8. végétation : chênes et hêtres (forêt [C], haies, village)
for x, y, sz, kind, lv in P.arbres():
    A.chene(BV[lv], x, y, zg(x, y), sz, rnd, clair=(kind == 'hetre'))
for k in range(40):                                                                           # rochers au pied des falaises
    a = rnd.uniform(-math.pi, math.pi)
    if min(P.angd(a, P.PENTE_N), P.angd(a, P.PENTE_S)) < .3: continue
    x, y = P.at_coast(a, 1.0 + .03 * rnd.random())
    vs = C.bm_ico(BM.bm, G(x, y, -.3), .4 + .5 * rnd.random(), 1, (1.2, 1, .7)); BM.paint(vs, C.mix(H('#9a8f7e'), H('#7e7464'), rnd.random()), .08)

for Bt in list(B.values()) + list(BV.values()) + [BM, BE, BH]: Bt.done()
os.makedirs(os.path.join(C.ART, 'blender', 'islands'), exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(C.ART, 'blender', 'islands', 'syrup.blend'))
tris = sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in bpy.data.objects if o.type == 'MESH')
print('SYRUP ok', round(time.time() - T0, 1), 's · bâtiments', nb, cnt, '· haies', nh, '· triangles', tris, '· manoir', round(zm + top, 1))
