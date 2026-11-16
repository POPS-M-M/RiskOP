"""Loguetown — scène Blender détaillée (île 4), construite avec le kit toscan rk_toscane.py (+ pièces génériques de rk_port)
sur le plan lg_plan.py. Canon [C] / interprétations [I] : voir lg_plan.py et la fiche « claude/risk-op-fiches-iles-4-6.md ».
Exclus : personnages, emblème de la Marine, copie de tout décor officiel.
Usage : python3 build_loguetown.py → art/blender/islands/loguetown.blend   (puis export_island.py loguetown)
"""
import sys, os, math, random, time
sys.path.insert(0, os.path.dirname(__file__))
import bpy, bmesh
import rk_common as C, rk_lib as L, rk_port as K, rk_toscane as T
import lg_plan as P

T0 = time.time(); rnd = random.Random(1871)
sc = C.new_scene(); M = C.materials()
SOL, DECOR, V2, V3, V4 = C.coll('RK_SOL'), C.coll('RK_DECOR'), C.coll('RK_VILLE_2'), C.coll('RK_VILLE_3'), C.coll('RK_VILLE_4')
LV = {1: DECOR, 2: V2, 3: V3, 4: V4}; H = C.hexc; G = C.g2b
B = {k: L.Batch('LG_ville_%d' % k, LV[k], M['peint']) for k in LV}
BM = L.Batch('LG_monuments', DECOR, M['peint'])                                           # palais, cathédrale, enceinte, villa, port
BE = L.Batch('LG_eau', DECOR, M['eau'], False)
BV = {k: L.Batch('LG_vegetation_%d' % k, LV[k], M['peint']) for k in LV}
zg = P.height


def zfoot(x, y, ang, w, d):
    c, s = math.cos(ang), math.sin(ang)
    return min(zg(x + su * w / 2 * -s + sv * d / 2 * c, y + su * w / 2 * c + sv * d / 2 * s) for su in (-1, 1) for sv in (-1, 1))


# ------------------------------------------------------------------ 1. sol : place, rues, ville, campagne en mosaïque de champs, collines, port
CHAMPS = [H('#d8c27a'), H('#a9b664'), H('#8fa457'), H('#a98058'), H('#b9b47c'), H('#c9b56a'), H('#97a86a')]
VIGNES = P.vignes()


def champ(x, y):
    u = x * math.cos(.35) + y * math.sin(.35); v = -x * math.sin(.35) + y * math.cos(.35)
    i, j = math.floor(u / 3.3), math.floor(v / 2.5); hsh = (i * 73856093 ^ j * 19349663) & 0xffff
    c = CHAMPS[hsh % len(CHAMPS)]
    if abs(u / 3.3 - i - .5) > .46 or abs(v / 2.5 - j - .5) > .45: c = C.mix(c, H('#7d8a50'), .45)          # haies entre les champs
    return c


bm = bmesh.new(); colL = bm.verts.layers.float_color.new('Col'); step = .5; ext = 37.0; n = int(2 * ext / step) + 1; grid = {}
for j in range(n):
    for i in range(n):
        x = -ext + i * step; y = -ext + j * step; d = P.dcoast(x, y)
        if d > 1.12: continue
        h = zg(x, y); v = bm.verts.new(G(x, y, h)); grid[(i, j)] = v
        z_ = P.zone(x, y) if d < 1 else 'cote'
        if z_ == 'place':
            c = H('#cdb894') if (int((x - P.PL[0]) * 1.3) + int((y - P.PL[1]) * 1.3)) % 2 else H('#c4ad88')
            if abs(x - P.PL[0]) > P.PLW - .6 or abs(y - P.PL[1]) > P.PLH - .6: c = H('#a99a7f')
        elif z_ in ('centre', 'ville'): c = H('#ddd0b0') if (i + j) % 3 else H('#d6c8a6')
        elif z_ == 'port': c = H('#d8caa6')
        elif z_ == 'faubourg': c = C.mix(H('#d6caa2'), H('#cfc79a'), .5 + .5 * math.sin(x * .9) * math.cos(y * .7))
        elif z_ == 'campagne': c = champ(x, y)
        elif z_ == 'colline':
            c = C.mix(H('#bdb093'), H('#94a064'), .5 + .5 * math.sin(x * 1.7 + y * .6) * math.cos(y * 1.3))
            if P.pente(x, y) > .9: c = C.mix(H('#a89a7e'), H('#c4b597'), (int(h * 2.5) % 2) * .6)                  # falaises
        elif z_ == 'villa': c = C.mix(H('#93ad5c'), H('#a8b86a'), .5 + .5 * math.sin(x * 2) * math.cos(y * 2))
        else: c = H('#e2d3a8') if d < 1 else H('#d8c69a')                                                       # côte / plage
        r_ = P.rue_at(x, y)
        if r_ and z_ not in ('cote',):
            c = H('#d8cbae') if (int(x * 2) + int(y * 2)) % 2 else H('#d0c2a3')
            if r_ != 'anneau' and P.murs_d(x, y) > 1.05 and z_ in ('campagne', 'faubourg'): c = H('#cbb98f')        # chemins de terre
        if P.bassin_d(x, y) < 1 + P.QUAI_L / P.BASSIN[2] + .05 and P.water_at(x, y) is None: c = H('#bfae8c')   # quais
        if P.jetee_at(x, y): c = H('#b6a585')
        if P.water_at(x, y) is not None: c = H('#5f8a98')
        v[colL] = c
for (i, j), v in grid.items():
    q = [(i, j), (i + 1, j), (i + 1, j + 1), (i, j + 1)]
    if all(k in grid for k in q): bm.faces.new([grid[k] for k in q])
ground = C.mk_obj('LG_sol', bm, SOL, M['peint'], smooth=False); ground.data.color_attributes.active_color = ground.data.color_attributes['Col']; C.normals_up(ground)

# ------------------------------------------------------------------ 2. eau du port (bassin et passe)
bx, by, br = P.BASSIN                                                                      # bassin : disque lisse + passe vers la mer
ctr = BE.bm.verts.new(G(bx, by, P.EAU)); ring = [BE.bm.verts.new(G(bx + math.cos(k / 48 * 6.283) * (br + .05), by + math.sin(k / 48 * 6.283) * (br + .05), P.EAU)) for k in range(48)]
BE.paint([ctr] + ring, H('#2f86b0'), .05)
for k in range(48): BE.bm.faces.new((ctr, ring[k], ring[(k + 1) % 48]))
q = [BE.bm.verts.new(G(x, y, P.EAU - .01)) for x, y in ((bx - 2.6, by + br - .6), (bx + 2.6, by + br - .6), (bx + 2.6, by + 14), (bx - 2.6, by + 14))]
BE.bm.faces.new(q); BE.paint(q, H('#2f86b0'), .05)

# ------------------------------------------------------------------ 3. place de l'échafaud [C] et monuments signature
zp = zg(*P.PL)
ztop_ech = T.echafaud(BM, P.ECHAFAUD[0], P.ECHAFAUD[1], zp)
for k in range(10):                                                                        # bornes et lampadaires autour de la place
    a = k / 10 * 6.283; x, y = P.PL[0] + math.cos(a) * (P.PLW - .5), P.PL[1] + math.sin(a) * (P.PLH - .5)
    if k % 2: K.lampadaire(BM, x, y, zp)
cx, cy, hw, hh = P.PALAIS
ztour = T.palais_tour(BM, cx, cy, hw, hh, P.TOUR[0], P.TOUR[1], zg(cx, cy), zg(*P.TOUR))
C.mark('DRAPEAU_tour', P.TOUR[0], P.TOUR[1], zg(*P.TOUR) + ztour + .3)
zc = zg(*P.DOME)
zdome = T.cathedrale(BM, P.NEF, P.DOME, P.CAMPANILE, zc)
T.loggia(B[4], *P.LOGGIA, zg(P.LOGGIA[0], P.LOGGIA[1]))
T.opera(B[4], *P.OPERA, zg(P.OPERA[0], P.OPERA[1]), rnd)
zv = zg(*P.VILLA)
T.villa(BM, P.VILLA[0], P.VILLA[1], zv, rnd)
C.mark('DRAPEAU_villa', P.VILLA[0], P.VILLA[1], zv + 6.2)
# chapelle / tour de guet sur la colline nord-est (niveau 3) [I]
xc, yc = P.CHAPELLE; zch = zg(xc, yc)
T.casa(B[3], xc, yc, zch, 2.6, 1.8, 3.0, 2, T.MURS['pierre'], T.TUILES[2], rnd, None, 1.0, 'pignon')
T.casatorre(B[3], xc + 1.6, yc - 1.2, zch, 2.6, 1.0, 1.0, 5, rnd)

# ------------------------------------------------------------------ 4. enceinte et portes [I]
portes = []
for nm, pts, w, porte in P.RUES:
    for a, b in zip(pts, pts[1:]):
        if (P.murs_d(*a) - 1) * (P.murs_d(*b) - 1) <= 0:
            t = (1 - P.murs_d(*a)) / (P.murs_d(*b) - P.murs_d(*a)); x, y = a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t
            portes.append(math.atan2((y - P.MURS_C[1]) / P.MURS_K[1], (x - P.MURS_C[0]) / P.MURS_K[0])); break
T.enceinte(BM, P.enceinte, zg, portes)

# ------------------------------------------------------------------ 5. maisons, palais, tours-maisons, fermes (plan de production)
nb = 0; cnt = {}
for b in P.batiments():
    lv = b['niveau']; z0 = zfoot(b['x'], b['y'], b['ang'], b['w'], b['d']); typ = b['type']
    mur = list(T.MURS.values())[rnd.randrange(6)]; couv = T.TUILES[rnd.randrange(len(T.TUILES))]
    if typ == 'palais':
        T.palazzo(B[lv], b['x'], b['y'], z0, b['ang'], b['w'], b['d'], max(3, b['etages']), C.mix(mur, T.FORTE, .3), couv, rnd, b['loggia'], b['altana'])
    elif typ == 'maison_tour':
        T.casatorre(B[lv], b['x'], b['y'], z0, b['ang'], b['w'], b['d'], 5 + rnd.randint(0, 2), rnd)
    elif typ == 'ferme':
        T.ferme(B[lv], b['x'], b['y'], z0, b['ang'], b['w'] * .9, b['d'] * .9, rnd)
    elif typ == 'magasin':
        K.entrepot(B[lv], b['x'], b['y'], z0, b['ang'], b['w'], b['d'], 2.0, T.MURS['pierre'], couv, rnd)
    else:
        T.casa(B[lv], b['x'], b['y'], z0, b['ang'], b['w'], b['d'], b['etages'], mur, couv, rnd, T.PERSIENNES[rnd.randrange(len(T.PERSIENNES))],
               .9, 'croupe' if rnd.random() < .6 else 'pignon', b['zone'] in ('centre', 'ville') and rnd.random() < .3)
    if b.get('altana') and typ == 'maison': T.altana(B[lv], K.Frame(b['x'], b['y'], z0, b['ang']), 0, 0, .3 + b['etages'] * .9 + .2, couv, mur)
    nb += 1; cnt[typ] = cnt.get(typ, 0) + 1

# ------------------------------------------------------------------ 6. port : quais, jetée et phare, base de la Marine, marché, navires
bx, by, br = P.BASSIN
for k in range(64):                                                                       # parement du quai
    a0, a1 = k / 64 * 6.283, (k + 1) / 64 * 6.283; xm, ym = bx + math.cos((a0 + a1) / 2) * br, by + math.sin((a0 + a1) / 2) * br
    if P.dcoast(xm, ym) > .93: continue
    F = K.Frame(xm, ym, 0, (a0 + a1) / 2 + math.pi); L_ = br * (a1 - a0)
    K.box(BM, F, -L_ / 2 - .02, L_ / 2 + .02, -.25, .1, P.EAU - .8, .95, K.PIERRE2, .04)
    if k % 4 == 0: K.bitte(BM, bx + math.cos(a0) * (br + .4), by + math.sin(a0) * (br + .4), .95)
for sx in (-1, 1):                                                                         # quais de la passe
    for k in range(5):
        y0 = by + br + .2 + k * 1.6; x0 = bx + sx * 2.75
        if P.dcoast(x0, y0 + .8) > .97: continue
        K.box(BM, K.Frame(x0, y0 + .8, 0, 0), -.18, .18, -.8, .8, P.EAU - .8, .95 + .01 * (k % 2), K.PIERRE2, .04)
for kj, ((ax, ay), (cx2, cy2)) in enumerate(zip(P.JETEE, P.JETEE[1:])):                  # jetée (segments sans recouvrement coplanaire)
    Lj = math.hypot(cx2 - ax, cy2 - ay); F = K.Frame((ax + cx2) / 2, (ay + cy2) / 2, 0, math.atan2(cy2 - ay, cx2 - ax) + math.pi / 2)
    K.box(BM, F, -Lj / 2, Lj / 2, -.85, .85, -.8, .95 + .02 * kj, K.PIERRE2, .04)
    K.box(BM, F, -Lj / 2, Lj / 2, -.85, -.6, .95 + .02 * kj, 1.3, K.PIERRE, .03)
    vs = C.bm_cyl(BM.bm, G(cx2, cy2, -.8), G(cx2, cy2, 1.0), .9, .9, 12); BM.paint(vs, K.PIERRE2, .04)
    for q in range(int(Lj / .8)):
        vs = C.bm_uvsphere(BM.bm, G(ax + (cx2 - ax) * q / int(Lj / .8) + .9, ay + (cy2 - ay) * q / int(Lj / .8), -.1), 1, 6, 4, (.5, .45, .35)); BM.paint(vs, H('#8a8478'), .08)
T.phare(BM, P.PHARE[0], P.PHARE[1], .95)
T.caserne(BM, *P.MARINE, zg(P.MARINE[0], P.MARINE[1]), rnd)
T.marche(B[2], *P.MARCHE, zg(P.MARCHE[0], P.MARCHE[1]), rnd)
for k, (a, L_) in enumerate(((math.radians(205), 2.2), (math.radians(335), 2.4))):          # pontons de bois dans le bassin
    x0, y0 = bx + math.cos(a) * br, by + math.sin(a) * br; F = K.Frame(x0 - math.cos(a) * L_ / 2, y0 - math.sin(a) * L_ / 2, 0, a)
    K.box(BM, F, -.35, .35, -L_ / 2, L_ / 2, .7, .8, K.BOIS, .06)
    for q in range(4): K.box(BM, F, -.4, -.3, -L_ / 2 + q * L_ / 3 - .05, -L_ / 2 + q * L_ / 3 + .05, -.6, .85, K.BOIS2, .03)
K.navire(BM, bx - 1.0, by - .6, math.radians(80), 4.2, rnd, H('#f4efe2'), K.BOIS)
K.navire(B[2], bx + 2.4, by + 1.2, math.radians(250), 3.4, rnd, H('#e9d9b8'), H('#7a5a3a'), 1)
K.navire(B[3], bx - 3.0, by + 2.6, math.radians(15), 3.0, rnd, H('#f4efe2'), H('#5a4a3a'), 1)
for k in range(5):
    a = rnd.uniform(0, 6.283); x, y = bx + math.cos(a) * br * .55, by + math.sin(a) * br * .55
    K.barque(B[1 if k < 3 else 2], x, y, P.EAU, a + 1.4, 1.2, [H('#3d64b8'), H('#a0453a'), H('#f2c14a'), H('#3e6b4a')][k % 4])
for k in range(12):                                                                       # caisses et tonneaux sur les quais
    a = math.radians(150 + k * 18); x, y = bx + math.cos(a) * (br + .9), by + math.sin(a) * (br + .9)
    if P.dcoast(x, y) < .92 and not P.jetee_at(x, y):
        K.box(B[1 if k % 2 else 2], K.Frame(x, y, .95, a), -.18, .18, -.18, .18, 0, .34, H('#a87a4a'), .1)
C.mark('PONTON', *P.PONTON)

# ------------------------------------------------------------------ 7. rues : lampadaires de la grande rue, puits
for k in range(9):
    pts = P.RUES[0][1]; t = (k + .5) / 9; seg = min(len(pts) - 2, int(t * (len(pts) - 1))); f = t * (len(pts) - 1) - seg
    x = pts[seg][0] + (pts[seg + 1][0] - pts[seg][0]) * f + 1.15; y = pts[seg][1] + (pts[seg + 1][1] - pts[seg][1]) * f
    if not P.obstacle(x + .3, y) or True: K.lampadaire(BM, x, y, zg(x, y))

# ------------------------------------------------------------------ 8. campagne : vignes, oliviers, pins parasols, cyprès, maquis
for x, y, a, L_, typ in VIGNES:
    if typ == 'vigne': T.vigne(BV[1 if rnd.random() < .5 else 2], x, y, zg, a, L_)

for x, y, s, kind, lv in P.arbres():
    z = zg(x, y)
    if kind == 'olivier': T.olivier(BV[lv], x, y, z, s, rnd)
    elif kind == 'pin': T.pin_parasol(BV[lv], x, y, z, s * .9, rnd)
    elif kind == 'cypres': K.cypres(BV[lv], x, y, z, s)
    else: T.maquis(BV[lv], x, y, z, s, rnd)
for nm, pts, w, porte in P.RUES:                                                             # allées de cyprès le long des routes hors les murs
    if nm not in ('rue_est', 'rue_nord_est', 'rue_sud_est'): continue
    for a, b in zip(pts, pts[1:]):
        for q in range(3):
            t = q / 3; x, y = a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t
            if P.murs_d(x, y) < 1.12 or P.dcoast(x, y) > .9: continue
            ang = math.atan2(b[1] - a[1], b[0] - a[0])
            for s_ in (-1, 1):
                xx, yy = x - math.sin(ang) * (w / 2 + .5) * s_, y + math.cos(ang) * (w / 2 + .5) * s_
                if not P.obstacle(xx, yy) or P.rue_at(xx, yy, .1) is None: K.cypres(BV[1], xx, yy, zg(xx, yy), .85)

for Bt in list(B.values()) + list(BV.values()) + [BM, BE]: Bt.done()
os.makedirs(os.path.join(C.ART, 'blender', 'islands'), exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(C.ART, 'blender', 'islands', 'loguetown.blend'))
tris = sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in bpy.data.objects if o.type == 'MESH')
print('LOGUETOWN ok', round(time.time() - T0, 1), 's · bâtiments', nb, cnt, '· triangles', tris, '· tour', round(ztour, 1), '· dôme', round(zdome, 1))
