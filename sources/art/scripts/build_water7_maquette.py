"""Water 7 — G2 : maquette de silhouette (volumes simples) construite depuis le plan de masse w7_plan.py.
But : juger la silhouette et la lisibilité en vue d'ensemble et au zoom moyen, dans les deux modes, AVANT la modélisation
détaillée. Ce n'est pas le niveau de finition final : bâtiments en volumes (corps + toit), eau en surfaces simples.
Usage : python3 build_water7_maquette.py → art/blender/islands/water_7.blend   (puis export_island.py water_7)
"""
import sys, os, math, random, time
sys.path.insert(0, os.path.dirname(__file__))
import bpy, bmesh
from mathutils import Vector, Matrix
import rk_common as C, rk_lib as L
import w7_plan_g1g2 as W   # plan figé tel que validé en G1/G2

T0 = time.time(); rnd = random.Random(707)
sc = C.new_scene(); M = C.materials()
SOL, DECOR, V2, V3, V4 = C.coll('RK_SOL'), C.coll('RK_DECOR'), C.coll('RK_VILLE_2'), C.coll('RK_VILLE_3'), C.coll('RK_VILLE_4')
P = lambda x, y, z: C.g2b(x, y, z)
LV = {1: DECOR, 2: V2, 3: V3, 4: V4}
H = C.hexc
PAL = {'plateau': H('#efe2c6'), 'ville_haute': H('#e9d8b8'), 'ville_moyenne': H('#ddcba8'), 'port': H('#d2be98'), 'ville_nord': H('#d2be98'),
       'chantiers': H('#c2aa86'), 'gare': H('#cfbd99'), 'basfonds': H('#a89c86')}
RUE, MUR, QUAI = H('#efe6d2'), H('#9a8a72'), H('#b8a688')
EAU_C, EAU_F = H('#2f8fc4'), H('#8fdcf5')
MURS = [H('#f1ead9'), H('#e9dcc0'), H('#f3e1c4'), H('#e6d2b0'), H('#dfe3e6')]
TOITS = [H('#3d64b8'), H('#2e8a9a'), H('#b5533c')]

# ------------------------------------------------------------------ sol : terrasses, murs de soutènement, rues, quais
bm = bmesh.new(); colL = bm.verts.layers.float_color.new('Col'); step = .5; ext = 34.0; n = int(2 * ext / step) + 1; grid = {}
for j in range(n):
    for i in range(n):
        x = -ext + i * step; y = -ext + j * step; r = math.hypot(x, y); th = math.atan2(y, x); d = r / W.coast_r(th)
        if d > 1.12: continue
        h = W.height(x, y); v = bm.verts.new(P(x, y, h)); grid[(i, j)] = v
        c = PAL[W.zone(x, y)] if d < 1 else H('#b9a888')
        for rr in (W.T3, W.T2, W.T1):
            if abs(r - rr) < W.WALL / 2 + .25: c = MUR
        for a in W.RUES:
            if W.angd(th, a) * r < W.RUE_L / 2 and r > W.T3 - .3: c = RUE
        if r > W.T1 and d > .9 and d < 1: c = QUAI
        if W.water_at(x, y) is not None: c = C.mix(MUR, H('#5c8aa0'), .5)
        v[colL] = c
for (i, j), v in grid.items():
    q = [(i, j), (i + 1, j), (i + 1, j + 1), (i, j + 1)]
    if all(k in grid for k in q): bm.faces.new([grid[k] for k in q])
ground = C.mk_obj('W7_sol', bm, SOL, M['peint'], smooth=False); ground.data.color_attributes.active_color = ground.data.color_attributes['Col']; C.normals_up(ground)

# ------------------------------------------------------------------ eau : canaux, bassin, quartier inondé, cascades
Bw = L.Batch('W7_eau', DECOR, M['eau'], False)
wv = {}
for j in range(n):
    for i in range(n):
        x = -ext + i * step; y = -ext + j * step
        for (a, b) in ((0, 0),):
            pass
for j in range(n - 1):
    for i in range(n - 1):
        x = -ext + (i + .5) * step; y = -ext + (j + .5) * step; w = W.water_at(x, y)
        if w is None: continue
        q = [Bw.bm.verts.new(P(-ext + (i + a) * step, -ext + (j + b) * step, w)) for a, b in ((0, 0), (1, 0), (1, 1), (0, 1))]
        Bw.bm.faces.new(q); Bw.paint(q, EAU_C if math.hypot(x, y) > W.FONTAINE['r_bassin'] else H('#4fb6e6'), .04)
for a in W.CANAUX_RAY:                       # cascades : nappes verticales aux murs des terrasses
    for rr, z_hi, z_lo in ((W.T3, W.Z3 - .35, W.Z2 - .45), (W.T2, W.Z2 - .45, W.Z1 - .45), (W.T1, W.Z1 - .45, W.EAU)):
        t = Vector((-math.sin(a), math.cos(a), 0)) * (W.CANAL_RAY_L / 2 - .05)
        c0 = Vector((math.cos(a) * (rr + .25), math.sin(a) * (rr + .25), 0))
        v = [Bw.bm.verts.new(P(c0.x + s_ * t.x, c0.y + s_ * t.y, z)) for s_, z in ((-1, z_hi), (1, z_hi), (1, z_lo), (-1, z_lo))]
        Bw.bm.faces.new(v); Bw.paint(v, EAU_F, .05)
Bw.done()

# ------------------------------------------------------------------ fontaine géante (élément dominant)
Bf = L.Batch('W7_fontaine', DECOR, M['brillant']); Bj = L.Batch('W7_jet', DECOR, M['eau'])
z = W.Z3; rb = W.FONTAINE['r_bassin']; PIERRE = H('#e4dccb'); PIERRE2 = H('#cfc4ad')
Bf.paint(C.bm_cyl(Bf.bm, P(0, 0, z - .2), P(0, 0, z + 1.0), rb + .5, rb + .5, 40), PIERRE)
for k, (rr, zz) in enumerate(((2.7, z + 4.6), (1.6, z + 9.0))):
    Bf.paint(C.bm_cyl(Bf.bm, P(0, 0, z + .9), P(0, 0, zz), .55 - k * .12, .5 - k * .12, 14), PIERRE2)
    Bf.paint(C.bm_cyl(Bf.bm, P(0, 0, zz - .6), P(0, 0, zz + .3), rr * .55, rr, 32), PIERRE)
    Bj.paint(C.bm_cyl(Bj.bm, P(0, 0, zz + .3), P(0, 0, zz + .32), rr - .15, rr - .15, 32), H('#5ec3ea'))
    Bj.paint(C.bm_cyl(Bj.bm, P(0, 0, zz + .28), P(0, 0, zz - 3.8 + k * .6), rr + .05, rr + .25, 32, cap=False), EAU_F)   # nappe qui retombe
jt = z + W.FONTAINE['jet']
Bj.paint(C.bm_cyl(Bj.bm, P(0, 0, z + 9.2), P(0, 0, jt), .5, .32, 12), H('#bfeefa'))
for k in range(3):
    Bj.paint(C.bm_uvsphere(Bj.bm, P(0, 0, jt - k * .9), 1, 16, 8, (1.6 + k * .9, 1.6 + k * .9, .6)), H('#e6fbff'))
Bf.done(); Bj.done()
C.mark('DRAPEAU_fontaine', 0, -1.2, z + 4.6)

# ------------------------------------------------------------------ bâtiments (volumes : corps + toit)
batches = {k: L.Batch('W7_ville_%d' % k, LV[k], M['peint']) for k in LV}
def maison(B, x, y, w, d, h, rot, toit, wall, roof, z0=None, tilt=0.0):
    z0 = min(W.height(x + dx, y + dy) for dx in (-w / 2, w / 2) for dy in (-d / 2, d / 2)) if z0 is None else z0
    vs = C.bm_box(B.bm, P(x, y, z0 + h / 2 - .3), (w, d, h + .6)); B.paint(vs, wall)
    top = z0 + h + .3; rv = []
    if toit in ('pignon', 'entrepot'):
        hr = (.55 if toit == 'pignon' else .35) * d
        a = B.bm.verts.new(P(x - w / 2 - .1, y - d / 2 - .12, top)); b = B.bm.verts.new(P(x + w / 2 + .1, y - d / 2 - .12, top))
        c = B.bm.verts.new(P(x + w / 2 + .1, y + d / 2 + .12, top)); e = B.bm.verts.new(P(x - w / 2 - .1, y + d / 2 + .12, top))
        f = B.bm.verts.new(P(x - w / 2 - .1, y, top + hr)); g = B.bm.verts.new(P(x + w / 2 + .1, y, top + hr))
        for q in ((a, b, g, f), (e, f, g, c), (a, f, e), (b, c, g), (a, e, c, b)): B.bm.faces.new(q)
        rv = [a, b, c, e, f, g]
    elif toit == 'croupe':
        a = B.bm.verts.new(P(x - w / 2 - .1, y - d / 2 - .1, top)); b = B.bm.verts.new(P(x + w / 2 + .1, y - d / 2 - .1, top))
        c = B.bm.verts.new(P(x + w / 2 + .1, y + d / 2 + .1, top)); e = B.bm.verts.new(P(x - w / 2 - .1, y + d / 2 + .1, top))
        k_ = max(0, (w - d) / 2); f = B.bm.verts.new(P(x - k_, y, top + .5 * d)); g = B.bm.verts.new(P(x + k_, y, top + .5 * d))
        for q in ((a, b, g, f), (e, f, g, c), (a, f, e), (b, c, g), (a, e, c, b)): B.bm.faces.new(q)
        rv = [a, b, c, e, f, g]
    elif toit == 'dome':
        rv = C.bm_uvsphere(B.bm, P(x, y, top), 1, 16, 8, (min(w, d) * .48, min(w, d) * .48, min(w, d) * .5))
        rv += C.bm_cyl(B.bm, P(x, y, top + min(w, d) * .45), P(x, y, top + min(w, d) * .45 + 1.1), .1, .02, 6)
    else:
        rv = C.bm_box(B.bm, P(x, y, top + .12), (w + .15, d + .15, .25))
    B.paint(rv, roof)
    allv = vs + rv
    M_ = Matrix.Translation(P(x, y, 0)) @ Matrix.Rotation(-rot, 4, 'Z') @ (Matrix.Rotation(tilt, 4, 'X') if tilt else Matrix.Identity(4)) @ Matrix.Translation(-P(x, y, 0))
    bmesh.ops.transform(B.bm, matrix=M_, verts=allv)
for b in W.batiments():
    B = batches[b['niveau']]; zn = b['zone']; h = b['etages'] * 1.05 + .4
    wall = MURS[rnd.randrange(len(MURS))] if zn != 'basfonds' else C.mix(H('#b8a98e'), H('#8e8272'), rnd.random())
    roof = TOITS[rnd.randrange(3)] if zn not in ('basfonds', 'chantiers') else (H('#6e6458') if zn == 'basfonds' else H('#7b5f45'))
    tilt = (rnd.random() - .5) * .25 if b['penche'] else 0
    z0 = (W.EAU - .6 - rnd.random() * .5) if b['penche'] else None
    maison(B, b['x'], b['y'], b['w'], b['d'], h, b['rot'], b['toit'], wall, roof, z0, tilt)
    if zn in ('plateau', 'ville_haute') and b['niveau'] == 4 and rnd.random() < .6:      # tours de prestige (niveau 4)
        tz = W.height(b['x'], b['y']) + h + 1.2
        batches[4].paint(C.bm_cyl(batches[4].bm, P(b['x'], b['y'], tz - 1), P(b['x'], b['y'], tz + 2.2), .55, .55, 10), H('#f1ead9'))
        batches[4].paint(C.bm_cyl(batches[4].bm, P(b['x'], b['y'], tz + 2.2), P(b['x'], b['y'], tz + 3.6), .75, .05, 10), TOITS[0])

# ------------------------------------------------------------------ chantiers navals (hangars, cales, coques, grues)
for n_, a, rd, lv in W.DOCKS:
    B = batches[lv]; u = Vector((math.cos(a), math.sin(a), 0)); v = Vector((-math.sin(a), math.cos(a), 0))
    cx, cy = u.x * rd, u.y * rd
    maison(B, cx, cy, 8.2, 4.6, 3.4, a + math.pi / 2, 'entrepot', H('#8a6a4c'), H('#5d4636'), z0=W.Z0 - .1)
    sx0 = rd + 3.6; sx1 = rd + 11.0                                           # cale de lancement vers la mer
    q = [B.bm.verts.new(P(u.x * s1 + v.x * s2, u.y * s1 + v.y * s2, z_)) for s1, s2, z_ in ((sx0, -1.6, W.Z0 - .15), (sx0, 1.6, W.Z0 - .15), (sx1, 1.6, -.8), (sx1, -1.6, -.8))]
    B.bm.faces.new(q); B.paint(q, H('#a88c6a'))
    hc = u * (rd + 6.4); hull = C.bm_uvsphere(B.bm, P(hc.x, hc.y, .9), 1, 20, 8, (1.0, 3.0, .9))   # coque en construction
    bmesh.ops.rotate(B.bm, verts=hull, cent=P(hc.x, hc.y, .9), matrix=Matrix.Rotation(-a + math.pi / 2, 3, 'Z')); B.paint(hull, H('#e9e2d2'))
    for s2 in (-2.4, 2.4):                                                    # grues
        g = u * (rd + 5.2) + v * s2
        B.paint(C.bm_box(B.bm, P(g.x, g.y, 3.5), (.35, .35, 7.0)), H('#c9452f'))
        arm = C.bm_box(B.bm, P(g.x + u.x * 1.4, g.y + u.y * 1.4, 6.9), (3.4, .3, .3))
        bmesh.ops.rotate(B.bm, verts=arm, cent=P(g.x + u.x * 1.4, g.y + u.y * 1.4, 6.9), matrix=Matrix.Rotation(-a, 3, 'Z')); B.paint(arm, H('#c9452f'))
sx, sy = math.cos(W.SIEGE[1]) * W.SIEGE[0], math.sin(W.SIEGE[1]) * W.SIEGE[0]
maison(batches[1], sx, sy, 3.6, 3.0, 4.6, W.SIEGE[1] + math.pi / 2, 'croupe', H('#efe4cc'), TOITS[0])
C.mark('DRAPEAU_siege', sx, sy, W.height(sx, sy) + 7.5)

# ------------------------------------------------------------------ gare du train des mers + viaduc vers Enies Lobby
g = W.GARE; B = batches[1]
maison(B, g['x'], g['y'], g['d'], g['w'], g['h'], 0, 'croupe', H('#c25a44'), H('#5a3a30'))
gz = W.height(g['x'], g['y'])
B.paint(C.bm_box(B.bm, P(g['x'] + 1.0, g['y'] - 2.8, gz + 4.0), (1.3, 1.3, 8.0)), H('#c25a44'))           # tour de l'horloge [I]
B.paint(C.bm_cyl(B.bm, P(g['x'] + 1.0, g['y'] - 2.8, gz + 8.0), P(g['x'] + 1.0, g['y'] - 2.8, gz + 9.6), 1.0, .05, 4), H('#5a3a30'))
C.mark('DRAPEAU_gare', g['x'] + 1.0, g['y'] - 2.8, gz + 11)
(ax0, ay0), (ax1, ay1) = W.VIADUC; Lv = math.hypot(ax1 - ax0, ay1 - ay0); dx, dy = (ax1 - ax0) / Lv, (ay1 - ay0) / Lv
xs0 = g['x'] - g['d'] / 2
for k in range(int(Lv / 2.2) + 1):
    px, py = ax0 + dx * k * 2.2, ay0 + dy * k * 2.2
    B.paint(C.bm_box(B.bm, P(px, py, .1), (.45, .45, 2.4)), H('#7a6a5a'))
deck = C.bm_box(B.bm, P((xs0 + ax1) / 2, (g['y'] + ay1) / 2, 1.45), (math.hypot(ax1 - xs0, ay1 - g['y']), 1.2, .3))
bmesh.ops.rotate(B.bm, verts=deck, cent=P((xs0 + ax1) / 2, (g['y'] + ay1) / 2, 1.45), matrix=Matrix.Rotation(-math.atan2(ay1 - g['y'], ax1 - xs0), 3, 'Z')); B.paint(deck, H('#4a3c34'))
for k in range(3):                                                             # train des mers (générique) [I]
    px, py = ax0 + dx * (2 + k * 2.1), ay0 + dy * (2 + k * 2.1)
    car = C.bm_box(B.bm, P(px, py, 2.25), (1.9, .95, 1.2)); bmesh.ops.rotate(B.bm, verts=car, cent=P(px, py, 2.25), matrix=Matrix.Rotation(-math.atan2(dy, dx), 3, 'Z'))
    B.paint(car, H('#2f4f6f') if k else H('#3a3a3a'))

# ------------------------------------------------------------------ ponts (rues × canaux), port, ferraille
Bb = batches[1]
for a in W.RUES:
    for rr, w, t in W.ANNEAUX:
        z_ = (W.Z1 + .05) if t == 'T1' else (W.Z0 + .2); p0 = Vector((math.cos(a) * rr, math.sin(a) * rr, 0))
        br = C.bm_box(Bb.bm, P(p0.x, p0.y, z_), (w + 1.2, W.RUE_L + .3, .35)); bmesh.ops.rotate(Bb.bm, verts=br, cent=P(p0.x, p0.y, z_), matrix=Matrix.Rotation(-a, 3, 'Z')); Bb.paint(br, H('#d8ccb4'))
for a in W.CANAUX_RAY:
    for rr in (13.95, 17.9, 22.9, 25.3):
        if rr / W.coast_r(a) > .9: continue
        z_ = W.height(math.cos(a + .2) * rr, math.sin(a + .2) * rr) + .15; p0 = Vector((math.cos(a) * rr, math.sin(a) * rr, 0))
        br = C.bm_box(Bb.bm, P(p0.x, p0.y, z_), (1.4, W.CANAL_RAY_L + 1.0, .3)); bmesh.ops.rotate(Bb.bm, verts=br, cent=P(p0.x, p0.y, z_), matrix=Matrix.Rotation(-a, 3, 'Z')); Bb.paint(br, H('#d8ccb4'))
for q in range(W.PORT['pontons']):
    t = W.PORT['th'] + (q - 1) * .2; mid = 30.6
    pi_ = C.bm_box(Bb.bm, P(math.cos(t) * mid, math.sin(t) * mid, .25), (1.0, 7.0, .3)); bmesh.ops.rotate(Bb.bm, verts=pi_, cent=P(math.cos(t) * mid, math.sin(t) * mid, .25), matrix=Matrix.Rotation(-t + math.pi / 2, 3, 'Z')); Bb.paint(pi_, H('#7a5b3c'))
    if q != 1:
        sp = Vector((math.cos(t) * 31.5, math.sin(t) * 31.5, 0)) + Vector((-math.sin(t), math.cos(t), 0)) * 1.5
        hull = C.bm_uvsphere(Bb.bm, P(sp.x, sp.y, .25), 1, 16, 6, (.8, 2.4, .6)); bmesh.ops.rotate(Bb.bm, verts=hull, cent=P(sp.x, sp.y, .25), matrix=Matrix.Rotation(-t + math.pi / 2, 3, 'Z')); Bb.paint(hull, H('#6b4a30'))
        Bb.paint(C.bm_box(Bb.bm, P(sp.x, sp.y, 2.3), (.18, .18, 4)), H('#5a3c24')); Bb.paint(C.bm_box(Bb.bm, P(sp.x, sp.y, 2.6), (1.8, .1, 1.8)), H('#f4efe2'))
C.mark('PONTON', *W.PONTON)
fx, fy = math.cos(W.FERRAILLE[0]) * W.FERRAILLE[1], math.sin(W.FERRAILLE[0]) * W.FERRAILLE[1]
for k in range(14):
    a = rnd.random() * 6.283; rr = rnd.random() * 2.0; x, y = fx + math.cos(a) * rr, fy + math.sin(a) * rr
    Bb.paint(C.bm_ico(Bb.bm, P(x, y, W.height(x, y) + .2), .4 + rnd.random() * .5, 1), C.mix(H('#5d554c'), H('#8a6a4a'), rnd.random()))

# ------------------------------------------------------------------ végétation (arbres simples)
Bv = L.Batch('W7_arbres', DECOR, M['peint'])
for x, y, s, k in W.arbres():
    z_ = W.height(x, y)
    if k == 'feuillu':
        Bv.paint(C.bm_cyl(Bv.bm, P(x, y, z_), P(x, y, z_ + 1.0 * s), .12, .1, 6), H('#6b4a30'))
        Bv.paint(C.bm_ico(Bv.bm, P(x, y, z_ + 1.5 * s), .85 * s, 1), C.mix(H('#4f8a3c'), H('#6aa04a'), rnd.random()))
    else:
        Bv.paint(C.bm_cyl(Bv.bm, P(x, y, z_), P(x + .2, y, z_ + 2.4), .1, .08, 6), H('#7a5a3a'))
        Bv.paint(C.bm_uvsphere(Bv.bm, P(x + .2, y, z_ + 2.4), 1, 10, 5, (1.0, 1.0, .3)), H('#5a9a3a'))
Bv.done()
for B in batches.values(): B.done()

os.makedirs(os.path.join(C.ART, 'blender', 'islands'), exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(C.ART, 'blender', 'islands', 'water_7_maquette.blend'))   # G2 : ne remplace plus la scène détaillée
tris = sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in bpy.data.objects if o.type == 'MESH')
print('WATER 7 (maquette G2) ok', round(time.time() - T0, 1), 's', 'triangles', tris)
