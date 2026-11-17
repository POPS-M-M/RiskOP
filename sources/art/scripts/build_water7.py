"""Water 7 — scène Blender DÉTAILLÉE (production, après validation G1/G2), construite avec le kit portuaire rk_port.py
sur le plan de production w7_plan.py (composition G1/G2 conservée ; ajustements validés : massif décalé au nord, densité,
viaduc raccourci).
Canon [C?] (à revérifier) / interprétations [I] : voir w7_plan_g1g2.py et w7_plan.py. Exclus : personnages, logo, locomotive officielle.
Usage : python3 build_water7.py → art/blender/islands/water_7.blend   (puis export_island.py water_7)
"""
import sys, os, math, random, time
sys.path.insert(0, os.path.dirname(__file__))
import bpy, bmesh
from mathutils import Vector
import rk_common as C, rk_lib as L, rk_port as K
import w7_plan as W

T0 = time.time(); rnd = random.Random(2077)
sc = C.new_scene(); M = C.materials()
SOL, DECOR, V2, V3, V4 = C.coll('RK_SOL'), C.coll('RK_DECOR'), C.coll('RK_VILLE_2'), C.coll('RK_VILLE_3'), C.coll('RK_VILLE_4')
LV = {1: DECOR, 2: V2, 3: V3, 4: V4}; H = C.hexc; P = C.g2b
B = {k: L.Batch('W7_ville_%d' % k, LV[k], M['peint']) for k in LV}                      # architecture, par niveau de ville
BS = L.Batch('W7_pierre', DECOR, M['peint'])                                             # quais, ponts, murs, balustrades
BE = L.Batch('W7_eau', DECOR, M['eau'], False); BF = L.Batch('W7_fontaine', DECOR, M['brillant'])
BV = {k: L.Batch('W7_vegetation_%d' % k, LV[k], M['peint']) for k in LV}
zg = W.height

# ------------------------------------------------------------------ 1. sol : terrasses, pavés, rues, quais, murs de soutènement
PAL = {'plateau': H('#efe4cc'), 'ville_haute': H('#e7d8bb'), 'ville_moyenne': H('#ddcdac'), 'port': H('#d4c19c'), 'ville_nord': H('#d4c19c'),
       'chantiers': H('#bba383'), 'gare': H('#cdbc9a'), 'basfonds': H('#9f927b')}
bm = bmesh.new(); colL = bm.verts.layers.float_color.new('Col'); step = .5; ext = 35.0; n = int(2 * ext / step) + 1; grid = {}
for j in range(n):
    for i in range(n):
        x = -ext + i * step; y = -ext + j * step; d = W.dcoast(x, y)
        if d > 1.12: continue
        rho, phi = W.pol(x, y); h = zg(x, y); v = bm.verts.new(P(x, y, h)); grid[(i, j)] = v
        c = PAL[W.zone(x, y)] if d < 1 else H('#c2b08e')
        if rho < W.T3: c = C.mix(H('#f3ead6'), H('#d8c9a8'), .5 + .5 * math.sin(rho * 3.2))                      # dallage concentrique du plateau
        elif (int(x * 1.6) + int(y * 1.6)) % 2: c = C.mix(c, H('#ffffff'), .06)                                # pavés
        for T in (W.T3, W.T2, W.T1):
            if abs(rho - T) < W.WALL / 2 + .3: c = C.mix(H('#b9ab92'), H('#a29579'), (int(h * 3) % 2) * .6)       # murs en pierre appareillée
        for a in W.RUES:
            if W.angd(phi, a) * rho < W.RUE_L / 2 and rho > W.T3 - .3: c = H('#efe6d2') if (int(rho * 2) % 2) else H('#e4d8bf')
        if rho > W.T1 and .9 < d < 1: c = H('#b8a688')                                                         # quais
        if W.secteur(phi) == 'basfonds' and rho > W.T1: c = C.mix(c, H('#7d7262'), .35 + .3 * ((i * 7 + j * 3) % 5) / 5)
        if W.water_at(x, y) is not None: c = H('#6f8f98')
        v[colL] = c
for (i, j), v in grid.items():
    q = [(i, j), (i + 1, j), (i + 1, j + 1), (i, j + 1)]
    if all(k in grid for k in q): bm.faces.new([grid[k] for k in q])
ground = C.mk_obj('W7_sol', bm, SOL, M['peint'], smooth=False); ground.data.color_attributes.active_color = ground.data.color_attributes['Col']; C.normals_up(ground)

# ------------------------------------------------------------------ 2. eau des canaux, cascades, quartier inondé
EAU_C, EAU_B, EAU_F = H('#2b8cc4'), H('#4fb3e0'), H('#bfeefa')
st = .5
for j in range(int(2 * ext / st)):
    for i in range(int(2 * ext / st)):
        x = -ext + (i + .5) * st; y = -ext + (j + .5) * st; w = W.water_at(x, y)
        if w is None: continue
        if W.zone(x, y) == 'basfonds' and W.pol(x, y)[0] > W.T1 + .9 and abs(w - (W.EAU - .05)) < 1e-6: continue   # (plan continu ci-dessous)
        q = [BE.bm.verts.new(P(-ext + (i + a) * st, -ext + (j + b) * st, w)) for a, b in ((0, 0), (1, 0), (1, 1), (0, 1))]
        BE.bm.faces.new(q); rho, _ = W.pol(x, y)
        BE.paint(q, EAU_B if rho < W.FONTAINE['r_bassin'] else (EAU_C if W.zone(x, y) != 'basfonds' else H('#3f8fa8')), .05)
fl = []                                                                                        # plan d'eau continu des bas quartiers inondés : la rive suit le sol
for k in range(41):
    phi = -2.62 + k / 40 * 1.4; r1 = W.T1 + 2
    while W.dcoast(*W.at(r1, phi)) < 1.0 and r1 < 40: r1 += .25
    fl.append((W.at(W.T1 + 1.0, phi), W.at(r1 + .3, phi)))
for (a0, b0), (a1, b1) in zip(fl, fl[1:]):
    q = [BE.bm.verts.new(P(*a0, W.EAU - .05)), BE.bm.verts.new(P(*b0, W.EAU - .05)), BE.bm.verts.new(P(*b1, W.EAU - .05)), BE.bm.verts.new(P(*a1, W.EAU - .05))]
    BE.bm.faces.new(q); BE.paint(q, H('#3f8fa8'), .04)
for a in W.CANAUX_RAY:
    for T, z_hi, z_lo in ((W.T3, W.Z3 - .35, W.Z2 - .45), (W.T2, W.Z2 - .45, W.Z1 - .45), (W.T1, W.Z1 - .45, W.EAU)):
        F = K.Frame(*W.at(T + .25, a), 0, a)
        K.quad(BE, F, [(-W.CANAL_RAY_L / 2 + .05, 0, z_hi), (W.CANAL_RAY_L / 2 - .05, 0, z_hi), (W.CANAL_RAY_L / 2 - .05, .35, z_lo), (-W.CANAL_RAY_L / 2 + .05, .35, z_lo)], EAU_F, .05)
        for k in range(4):                                                                         # écume au pied de la cascade
            vs = C.bm_uvsphere(BE.bm, F.p(-.55 + k * .37, .7, z_lo + .05), 1, 8, 4, (.32, .32, .12)); BE.paint(vs, H('#eafaff'), .03)

# ------------------------------------------------------------------ 3. la fontaine géante (élément dominant)  [C?] ; forme [I]
FX, FY = W.CX, W.CY; z = W.Z3; rb = W.FONTAINE['r_bassin']; PI1, PI2, OR = H('#efe8d8'), H('#d6ccb6'), H('#e2c27a')
def ring(Bt, r, z0, z1, col, seg=40): Bt.paint(C.bm_cyl(Bt.bm, P(FX, FY, z0), P(FX, FY, z1), r, r, seg), col, .03)
ring(BF, rb + .55, z - .3, z + .85, PI1, 48); ring(BF, rb + .7, z + .85, z + 1.05, PI2, 48)                           # margelle
for k in range(24):                                                                                                 # margelle festonnée
    a = k / 24 * 6.283; vs = C.bm_uvsphere(BF.bm, P(FX + math.cos(a) * (rb + .62), FY + math.sin(a) * (rb + .62), z + 1.08), 1, 8, 4, (.22, .22, .16)); BF.paint(vs, PI1, .02)
for k in range(8):                                                                                                  # piédestal à pilastres
    a = k / 8 * 6.283 + .39; px, py = FX + math.cos(a) * 1.15, FY + math.sin(a) * 1.15
    BF.paint(C.bm_box(BF.bm, P(px, py, z + 2.7), (.42, .42, 3.6)), PI1, .02); BF.paint(C.bm_box(BF.bm, P(px, py, z + 4.55), (.56, .56, .25)), OR, .02)
    BE.paint(C.bm_tube(BE.bm, [P(px * 1.0 + math.cos(a) * .3 - FX * 0, py + math.sin(a) * .3, z + 2.4), P(FX + math.cos(a) * 2.2, FY + math.sin(a) * 2.2, z + 1.6), P(FX + math.cos(a) * 2.9, FY + math.sin(a) * 2.9, z + .6)], lambda t: .12, 6), EAU_F, .03)
ring(BF, 1.05, z + .8, z + 4.6, PI2, 16)
for k, (r_, zz, h_) in enumerate(((2.9, z + 4.8, .7), (1.75, z + 9.0, .55))):
    BF.paint(C.bm_cyl(BF.bm, P(FX, FY, zz - h_), P(FX, FY, zz), r_ * .45, r_, 32), PI1, .03); ring(BF, r_ + .08, zz - .08, zz + .14, OR, 32)
    for q in range(16):                                                                                             # rebord festonné
        a = q / 16 * 6.283; vs = C.bm_uvsphere(BF.bm, P(FX + math.cos(a) * r_, FY + math.sin(a) * r_, zz + .1), 1, 6, 3, (.18, .18, .12)); BF.paint(vs, PI1, .02)
    BE.paint(C.bm_cyl(BE.bm, P(FX, FY, zz + .05), P(FX, FY, zz + .07), r_ - .12, r_ - .12, 32), EAU_B, .03)
    nf = 22 if k == 0 else 16; drop = 3.55 if k == 0 else 3.35
    for q in range(nf):                                                                      # filets d'eau qui retombent du rebord (on voit la pierre entre eux)
        a = (q + .5) / nf * 6.283; c_, s_ = math.cos(a), math.sin(a); ww = .16
        top = (FX + c_ * (r_ + .12), FY + s_ * (r_ + .12)); bot = (FX + c_ * (r_ + .42), FY + s_ * (r_ + .42))
        tg = (-s_ * ww, c_ * ww)
        vs = [BE.bm.verts.new(P(top[0] - tg[0], top[1] - tg[1], zz + .05)), BE.bm.verts.new(P(top[0] + tg[0], top[1] + tg[1], zz + .05)),
              BE.bm.verts.new(P(bot[0] + tg[0] * 1.4, bot[1] + tg[1] * 1.4, zz - drop)), BE.bm.verts.new(P(bot[0] - tg[0] * 1.4, bot[1] - tg[1] * 1.4, zz - drop))]
        BE.bm.faces.new(vs); BE.paint(vs, EAU_F, .05)
        vs = C.bm_uvsphere(BE.bm, P(bot[0], bot[1], zz - drop + .05), 1, 6, 3, (.2, .2, .1)); BE.paint(vs, H('#f2fdff'), .02)
    if k == 0: ring(BF, .7, zz, zz + 3.6, PI2, 14)
jt = z + W.FONTAINE['jet']
BE.paint(C.bm_cyl(BE.bm, P(FX, FY, z + 9.1), P(FX, FY, jt), .42, .22, 12), H('#c9f1fb'), .04)
for k in range(6):                                                                                                  # gerbes en arc depuis la 2e vasque
    a = k / 6 * 6.283 + .3; c_, s_ = math.cos(a), math.sin(a)
    BE.paint(C.bm_tube(BE.bm, [P(FX + c_ * .5, FY + s_ * .5, z + 9.3), P(FX + c_ * 1.3, FY + s_ * 1.3, z + 11.2), P(FX + c_ * 2.2, FY + s_ * 2.2, z + 10.6), P(FX + c_ * 2.6, FY + s_ * 2.6, z + 9.1)], lambda t: .1 - .04 * t, 6), EAU_F, .03)
for k in range(10):                                                                                                 # couronne d'embruns
    a = k / 10 * 6.283; vs = C.bm_uvsphere(BE.bm, P(FX + math.cos(a) * 1.4, FY + math.sin(a) * 1.4, jt - .8 - (k % 2) * .5), 1, 10, 6, (.9, .9, .7)); BE.paint(vs, H('#e8fbff'), .03)
vs = C.bm_uvsphere(BE.bm, P(FX, FY, jt + .2), 1, 14, 8, (1.5, 1.5, 1.0)); BE.paint(vs, H('#f4feff'), .02)
C.mark('DRAPEAU_fontaine', FX, FY + 1.2, z + 4.8)

# ------------------------------------------------------------------ 4. plateau : colonnade circulaire ; ville haute de prestige (niveau 4)
libre = lambda ph: not any(W.angd(ph, a) * 5.95 < 1.25 for a in W.CANAUX_RAY + W.RUES)
for k in range(48):
    phi = k / 48 * 6.283
    if not libre(phi): continue
    x, y = W.at(5.95, phi); F = K.Frame(x, y, W.Z3, phi)
    K.box(B[1], F, -.11, .11, -.11, .11, 0, 1.7, PI1, .02)
    if not libre(phi + 6.283 / 48): continue                                                    # entablement : un seul bloc par travée (pas de doublon)
    pm = phi + 6.283 / 96; x2, y2 = W.at(5.95, pm); F2 = K.Frame(x2, y2, W.Z3, pm); half = 5.95 * math.sin(6.283 / 96) + .03
    K.box(B[1], F2, -half, half, -.3, .3, 1.7, 1.95, PI2, .02); K.box(B[1], F2, -half, half, -.33, .33, 1.95, 2.05, OR, .02)
for k, ph in enumerate((math.radians(22.5), math.radians(112.5), math.radians(202.5), math.radians(292.5))):     # kiosques à coupole (niveau 4)
    x, y = W.at(5.25, ph); K.maison(B[4], x, y, W.Z3, ph, 1.2, 1.2, 2, 'dome', K.MURS['blanc'], K.TOITS['sarcelle'] if k % 2 else K.TOITS['bleu'], rnd, cheminee=False, socle=False, fenetres_arriere=False)
tx, ty = W.at(10.6, math.radians(-112)); K.tour(B[4], tx, ty, zg(tx, ty), 9.5, .75, K.MURS['creme'], K.TOITS['bleu'], horloge=True)   # campanile [I]
tx, ty = W.at(10.6, math.radians(68)); K.tour(B[4], tx, ty, zg(tx, ty), 7.5, .65, K.MURS['blanc'], K.TOITS['sarcelle'])

# ------------------------------------------------------------------ 5. maisons accolées (plan de production)
nb = 0
for b in W.batiments():
    lv = b['niveau']; zn = b['zone']
    mur = K.MURS[b['mur']]; couv = K.TOITS[b['couv']]
    if zn == 'basfonds': mur = C.mix(mur, H('#8e8272'), .35 + .3 * rnd.random()); couv = C.mix(couv, H('#6e6458'), .4)
    z0 = min(zg(b['x'] + dx, b['y'] + dy) for dx in (-b['w'] / 2, b['w'] / 2) for dy in (-b['d'] / 2, b['d'] / 2))
    tilt = roll = 0.0
    if b['penche']: z0 = W.EAU - .55 - rnd.random() * .45; tilt = (rnd.random() - .5) * .16; roll = (rnd.random() - .5) * .16
    if b['toit'] == 'entrepot':
        K.entrepot(B[lv], b['x'], b['y'], z0, b['ang'], b['w'], b['d'], 1.9 + b['etages'] * .5, mur, couv, rnd)
    else:
        K.maison(B[lv], b['x'], b['y'], z0, b['ang'], b['w'], b['d'], b['etages'], b['toit'], mur, couv, rnd,
                 volet=K.VOLETS[rnd.randrange(len(K.VOLETS))] if zn not in ('basfonds',) else None, balcon=b['balcon'], arcades=b['arcades'],
                 tilt=tilt, roll=roll, lucarne=zn in ('ville_haute', 'ville_moyenne') and rnd.random() < .35, hfloor=.95 if zn != 'basfonds' else .85)
    nb += 1

# ------------------------------------------------------------------ 6. canaux : quais, ponts, lampadaires, barques
for a in W.CANAUX_RAY:                                                                    # bordures de quai le long des canaux rayonnants
    for s in (-1, 1):
        for rr0, rr1 in ((W.FONTAINE['r_bassin'] + .7, W.T3 - .3), (W.T3 + .3, W.T2 - .3), (W.T2 + .3, W.T1 - .3), (W.T1 + .3, 31.0)):
            pts = []
            for k in range(9):
                rr = rr0 + (rr1 - rr0) * k / 8; x, y = W.at(rr, a); t = (-math.sin(a), math.cos(a)); off = s * (W.CANAL_RAY_L / 2 + .1)
                px, py = x + t[0] * off, y + t[1] * off
                if W.dcoast(px, py) < .97: pts.append((px, py))
            if len(pts) > 1: K.balustrade(BS, pts, lambda x, y: zg(x + 0 * y, y) if False else W.height(x, y) + .02, .22, K.PIERRE)
for rr, w, t in W.ANNEAUX:                                                                  # quais des canaux en anneau
    for s in (-1, 1):
        pts = []
        for k in range(97):
            phi = k / 96 * 6.283; x, y = W.at(rr + s * (w / 2 + .1), phi)
            if any(W.angd(phi, a) * rr < W.CANAL_RAY_L / 2 + .1 for a in W.CANAUX_RAY) or W.dcoast(x, y) > .96 or (W.secteur(phi) == 'basfonds' and t == 'T0'):
                if len(pts) > 1: K.balustrade(BS, pts, lambda x, y: W.height(x, y) + .02, .22, K.PIERRE)
                pts = []; continue
            pts.append((x, y))
        if len(pts) > 1: K.balustrade(BS, pts, lambda x, y: W.height(x, y) + .02, .22, K.PIERRE)
for a in W.RUES:                                                                            # grands ponts en arche (rues × anneaux)
    for rr, w, t in W.ANNEAUX:
        x, y = W.at(rr, a); zw = (W.Z1 - .45) if t == 'T1' else W.EAU
        if W.dcoast(x, y) < .95 and not (t == 'T0' and W.secteur(a) == 'basfonds' and False): K.pont_arche(BS, x, y, a, w + .4, W.RUE_L, zw + 1.0 if t == 'T0' else W.Z1 + .1, zw, K.PIERRE)
for a in W.CANAUX_RAY:                                                                      # passerelles (ruelles × canaux rayonnants)
    for rr in (9.3, 13.2, 16.95, 21.9, 24.4, 26.6, 28.8):
        x, y = W.at(rr, a)
        if W.dcoast(x, y) > .9 or W.water_at(x, y) is None: continue
        zw = W.canal_eau(rr); zt = W.height(*W.at(rr, a + 1.6 / rr)) + .12
        K.pont_arche(BS, x, y, a + math.pi / 2, W.CANAL_RAY_L + .3, .9, zt, zw, C.mix(K.PIERRE, K.MURS['ocre'], .3))
for k in range(int(6.283 * (W.ANNEAUX[1][0] + 1.3) / 3.2)):                                 # lampadaires de la promenade basse
    phi = k * 3.2 / (W.ANNEAUX[1][0] + 1.3); x, y = W.at(W.ANNEAUX[1][0] + 1.3, phi)
    if not W.obstacle(x, y) and W.dcoast(x, y) < .93: K.lampadaire(B[1], x, y, W.height(x, y))
for x, y, zw, ang, lv in W.barques():
    K.barque(B[lv], x, y, zw, ang, 1.15, [H('#3d64b8'), H('#a0453a'), H('#2e8a9a'), H('#f2c14a')][int(abs(x * 3 + y)) % 4])

# ------------------------------------------------------------------ 7. escaliers des grandes rues et balustrades des terrasses
for a in W.RUES:
    for T, z_lo, z_hi in ((W.T1, W.Z0, W.Z1), (W.T2, W.Z1, W.Z2), (W.T3, W.Z2, W.Z3)):
        x0, y0 = W.at(T + 1.4, a); x1, y1 = W.at(T - 1.2, a)
        if W.dcoast(x0, y0) < .95: K.escalier(BS, x0, y0, x1, y1, z_lo + .02, z_hi - .05, W.RUE_L - .2, K.PIERRE, 9)   # dessus sous le sol (pas de faces coplanaires)
for T, zt in ((W.T3, W.Z3), (W.T2, W.Z2), (W.T1, W.Z1)):
    pts = []
    for k in range(int(6.283 * T / .6) + 1):
        phi = k * .6 / T; x, y = W.at(T - .12, phi)
        if any(W.angd(phi, a) * T < (W.RUE_L / 2 + .2 if a in W.RUES else W.CANAL_RAY_L / 2 + .2) for a in W.RUES + W.CANAUX_RAY) or W.dcoast(x, y) > .95:
            if len(pts) > 1: K.balustrade(BS, pts, lambda x, y, zt=zt: zt, .3, K.CADRE)
            pts = []; continue
        pts.append((x, y))
    if len(pts) > 1: K.balustrade(BS, pts, lambda x, y, zt=zt: zt, .3, K.CADRE)
    for k in range(int(6.283 * T / 2.4)):                                                    # contreforts du mur de soutènement
        phi = k * 2.4 / T
        if any(W.angd(phi, a) * T < 1.6 for a in W.RUES + W.CANAUX_RAY): continue
        x, y = W.at(T + .15, phi)
        if W.dcoast(x, y) < .95: K.box(BS, K.Frame(x, y, 0, phi), -.18, .18, -.1, .22, zt - (W.Z3 - W.Z2 if T == W.T3 else (W.Z2 - W.Z1 if T == W.T2 else W.Z1 - W.Z0)) - .3, zt - .05, H('#a99b80'), .03)

# ------------------------------------------------------------------ 8. chantiers navals n° 1 à 3 [C?] (numéros peints sur les pignons)
def chiffre(Bt, F, n_, u, v, z, s=.55, col=H('#f7f3ea')):
    """chiffre en segments (lisible à l'échelle du jeu)"""
    seg = {1: 'bc', 2: 'abged', 3: 'abgcd'}[n_]
    S = {'a': (0, 1, 1, 1), 'b': (1, .5, 1, 1), 'c': (1, 0, 1, .5), 'd': (0, 0, 1, 0), 'e': (0, 0, 0, .5), 'f': (0, .5, 0, 1), 'g': (0, .5, 1, .5)}
    for k in seg:
        x0, y0, x1, y1 = S[k]; x0, x1 = 1 - x0, 1 - x1                                            # vu de face, u va vers la gauche
        uu0, uu1 = u + (min(x0, x1) - .5) * s * .6 - .05, u + (max(x0, x1) - .5) * s * .6 + .05
        zz0, zz1 = z + min(y0, y1) * s - .05, z + max(y0, y1) * s + .05
        K.quad(Bt, F, [(uu0, v, zz0), (uu1, v, zz0), (uu1, v, zz1), (uu0, v, zz1)], col, .01)
for n_, a, rd, lv in W.DOCKS:
    Bt = B[lv]; x, y = W.at(rd, a)
    K.hangar_naval(Bt, x, y, W.Z0 - .05, a, W.DOCK_L, W.DOCK_W, 3.2, H('#8a6a4c'), H('#5d4636'))
    F = K.Frame(x, y, W.Z0 - .05, a)
    K.box(Bt, F, -1.0, 1.0, W.DOCK_L / 2 + .2, W.DOCK_L / 2 + .3, 3.6, 4.6, H('#3d4f6a'), .02)       # panneau du numéro
    chiffre(Bt, F, n_, 0, W.DOCK_L / 2 + .32, 3.75, .7)
    for k in range(9):                                                                          # cale de lancement en planches, inclinée jusque sous l'eau
        v0 = W.DOCK_L / 2 - 1.2 + k * .7; zz = W.Z0 - .1 - k * .16
        K.box(Bt, F, -1.4, 1.4, v0, v0 + .62, zz - .12, zz, K.BOIS if k % 2 else K.BOIS2, .04)
    cx, cy = W.at(rd + 2.4, a); K.coque(Bt, cx, cy, W.Z0 + 1.0, a, 6.0, 2.0, 1.5, [.65, .45, .8][n_ - 1], K.BOIS)
    for s in (-1, 1):
        gx, gy = W.at(rd + 4.4, a + s * 2.9 / rd); K.grue(Bt, gx, gy, W.Z0 - .05, a + math.pi, 6.8 + n_ * .4, 3.2)
    for k in range(3):                                                                          # piles de bois de construction
        lx, ly = W.at(rd - 2.0 + k * 1.3, a + 3.0 / rd)
        for q in range(3): K.box(Bt, K.Frame(lx, ly, W.Z0, a), -.5, .5, -.12 + q * .0, .12, q * .18, q * .18 + .16, K.BOIS, .06)
sx, sy = W.at(*W.SIEGE)                                                                          # siège de la compagnie [C?]
K.maison(B[1], sx, sy, W.Z0, W.SIEGE[1], 3.8, 2.8, 4, 'mansarde', H('#f1e6cf'), K.TOITS['bleu'], rnd, volet=K.VOLETS[0], balcon=True, arcades=True, lucarne=True)
F = K.Frame(sx, sy, W.Z0, W.SIEGE[1])
for q in range(6): K.box(B[1], F, -1.6 + q * .64 - .09, -1.6 + q * .64 + .09, 1.45, 1.63, 0, 2.2, K.CADRE, .02)    # portique
K.box(B[1], F, -1.8, 1.8, 1.4, 1.75, 2.2, 2.45, K.CADRE, .02)
C.mark('DRAPEAU_siege', sx, sy, W.Z0 + 6.6)

# ------------------------------------------------------------------ 9. gare du train des mers [C?] + viaduc raccourci + train générique
K.gare(B[1], W.GX, W.GY, W.Z0, math.pi / 2, W.GARE['w'], W.GARE['d'], rnd)
K.tour(B[1], W.GX + 1.6, W.GY - W.GARE['w'] / 2 + .2, W.Z0, 7.4, .7, H('#c25a44'), H('#4a3a36'), horloge=True)
C.mark('DRAPEAU_gare', W.GX + 1.6, W.GY - W.GARE['w'] / 2 + .2, W.Z0 + 9.2)
vpts = [(W.GX + W.GARE['d'] / 2 - .2, W.GY - .4)] + W.VIADUC
K.viaduc(B[1], vpts, 1.6, K.PIERRE2, 1.8)
(ax0, ay0), (ax1, ay1) = W.VIADUC; ang = math.atan2(ay1 - ay0, ax1 - ax0)
K.train(B[1], ax0 + math.cos(ang) * 3.2, ay0 + math.sin(ang) * 3.2, 1.68, ang, 2)

# ------------------------------------------------------------------ 10. port de commerce (sud) : quais, pontons, navires, entrepôts, marché
for q in range(3):
    t = W.PORT_PHI + (q - 1) * .19; x0, y0 = W.at(26.5, t); x1, y1 = W.at(33.2, t); L_ = math.hypot(x1 - x0, y1 - y0)
    F = K.Frame((x0 + x1) / 2, (y0 + y1) / 2, 0, t + math.pi / 2)
    K.box(B[1], F, -L_ / 2, L_ / 2, -.5, .5, .1, .32, K.BOIS, .05)
    for k in range(int(L_ / 1.2)): K.box(B[1], F, -L_ / 2 + k * 1.2 - .08, -L_ / 2 + k * 1.2 + .08, -.58, .58, -1, .1, K.BOIS2, .03)
for k, (q, lv, Lb) in enumerate(((0, 1, 4.6), (1, 2, 3.8), (2, 4, 5.2))):
    t = W.PORT_PHI + (q - 1) * .19 + .095; x, y = W.at(31.0, t)
    K.navire(B[lv], x, y, t, Lb, rnd, mats=2 if Lb > 4 else 1, coque_col=[K.BOIS, H('#3d5a7a'), H('#7a3a2a')][k])
for k in range(4):                                                                              # entrepôts du port
    t = W.PORT_PHI + (k - 1.5) * .22; x, y = W.at(25.6, t)
    if not W.obstacle(x, y): K.entrepot(B[1 if k % 2 else 2], x, y, W.Z0, t, 2.6, 1.6, 2.2, K.MURS['sable'], K.TOITS['tuile'], rnd)
for k in range(8):                                                                              # étals du marché (niveau 2)
    t = W.PORT_PHI + (k - 3.5) * .05; x, y = W.at(24.6, t); F = K.Frame(x, y, W.Z0, t)
    K.box(B[2], F, -.35, .35, -.25, .25, 0, .45, K.BOIS, .05); K.prism_x(B[2], F, -.45, .45, -.38, .38, .9, .22, [H('#e85a4a'), H('#f2f0e6'), H('#2e8a9a')][k % 3])
    for s in (-1, 1): K.box(B[2], F, s * .4 - .03, s * .4 + .03, -.03, .03, 0, .9, K.FER, .02)
C.mark('PONTON', *W.PONTON)

# ------------------------------------------------------------------ 11. bas quartiers [C?] : cabanes sur pilotis, passerelles, ferraille
nc = 0
for k in range(70):
    phi = -2.55 + rnd.random() * 1.25; rr = W.T1 + 1.6 + rnd.random() * 7
    x, y = W.at(rr, phi); d = W.dcoast(x, y)
    if d < W.INONDE_D or d > .985 or W.obstacle(x, y, inonde_ok=True): continue
    lv = 1 if rnd.random() < .6 else 3; ang = phi + (rnd.random() - .5) * .5
    for s, t_ in ((-1, -1), (-1, 1), (1, -1), (1, 1)):
        px, py = x + s * .45, y + t_ * .45; vs = C.bm_cyl(B[lv].bm, P(px, py, -.9), P(px, py, .75), .06, .06, 5); B[lv].paint(vs, K.BOIS2, .03)
    K.maison(B[lv], x, y, .75, ang, .9 + rnd.random() * .4, .9, 1, 'pignon', C.mix(K.MURS[rnd.choice(['sable', 'gris', 'brique'])], H('#8e8272'), .4),
             C.mix(K.TOITS[rnd.choice(['ardoise', 'tuile'])], H('#6e6458'), .4), rnd, socle=False, cheminee=False, tilt=(rnd.random() - .5) * .1, fenetres_arriere=False)
    nc += 1
    if nc >= 22: break
for k in range(10):                                                                             # passerelles en planches sur pieux (dans la zone inondée)
    phi = -2.5 + k * .11; r0 = W.T1 + 1.6
    while W.dcoast(*W.at(r0, phi)) < W.INONDE_D - .03 and r0 < 30: r0 += .3
    r1 = r0
    while W.dcoast(*W.at(r1 + .3, phi)) < .97 and r1 - r0 < 4.5: r1 += .3
    if r1 - r0 < 1.2: continue
    x0, y0 = W.at(r0 - .6, phi); x1, y1 = W.at(r1, phi); L_ = math.hypot(x1 - x0, y1 - y0)
    F = K.Frame((x0 + x1) / 2, (y0 + y1) / 2, 0, math.atan2(y1 - y0, x1 - x0) + math.pi / 2)
    K.box(B[1], F, -L_ / 2, L_ / 2, -.22, .22, .5, .6, K.BOIS, .08)
    for q in range(int(L_ / 1.1) + 1): K.box(B[1], F, -L_ / 2 + q * 1.1 - .06, -L_ / 2 + q * 1.1 + .06, -.2, -.08, -.8, .5, K.BOIS2, .03)
fx, fy = W.FERRAILLE
for k in range(26):
    a = rnd.random() * 6.283; r_ = rnd.random() * 2.0; x, y = fx + math.cos(a) * r_, fy + math.sin(a) * r_
    zz = W.height(x, y)
    if rnd.random() < .5: B[1].paint(C.bm_ico(B[1].bm, P(x, y, zz + .2), .35 + rnd.random() * .45, 1), C.mix(H('#5d554c'), H('#8a6a4a'), rnd.random()), .12)
    else: K.box(B[1], K.Frame(x, y, zz, a), -.3, .3, -.2, .2, 0, .4, C.mix(H('#6a5040'), H('#4a4f57'), rnd.random()), .1)
K.coque(B[1], fx + 1.2, fy - .6, W.height(fx, fy) + .6, -2.2, 3.4, 1.2, .9, .4, H('#6b5a48'))     # épave en démolition

# ------------------------------------------------------------------ 12. végétation (platanes des quais, cyprès de la ville haute, palmiers du port)
for x, y, s, kind, lv in W.arbres():
    zz = W.height(x, y)
    if kind == 'platane': K.platane(BV[lv], x, y, zz, s, rnd)
    elif kind == 'cypres': K.cypres(BV[lv], x, y, zz, s)
    else: L.palm(BV[lv], P(x, y, zz - .1), s, H('#4a9a3a'), rnd)

for Bt in list(B.values()) + list(BV.values()) + [BS, BE, BF]: Bt.done()
for o in bpy.data.objects:                                                                     # arêtes vives au-delà de 40° : évite les normales lissées qui
    if o.type == 'MESH' and o.name in ('W7_sol', 'W7_pierre'):                                   # plongent dans la pierre (taches noires) ; limité au sol et à la pierre (poids des glTF)
        o.data.set_sharp_from_angle(angle=math.radians(40))
os.makedirs(os.path.join(C.ART, 'blender', 'islands'), exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(C.ART, 'blender', 'islands', 'water_7.blend'))
tris = sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in bpy.data.objects if o.type == 'MESH')
print('WATER 7 (détaillé) ok', round(time.time() - T0, 1), 's · maisons', nb, '· cabanes', nc, '· triangles', tris)
