"""RISK OP — kit architectural JAPON FÉODAL (Wano, île 5 ; réutilisable pour Karate et d'autres îles d'inspiration japonaise).
Pièces : machiya (maison de ville en bois, treillis, enduit blanc, toit de tuiles grises à larges avant-toits), maison rurale
à toit de chaume (minka), cabanes, château à étages sur socle de pierre [C?], pagode, torii, pont arqué, long pont de bois,
cimetière de stèles, usine sur rocher, ruines brûlées, télécabine, lanternes de pierre, cascades ; arbres : cerisiers, pins
japonais, pins enneigés, érables d'automne, feuillus, bambous, arbres morts. Formes génériques : aucun décor officiel copié.
Repère : x est, y sud, z haut (jeu) ; u = le long de la façade, v = vers la rue (Frame de rk_port).
"""
import math, random
import rk_common as C
import rk_port as K
from rk_port import Frame, box, quad, hip, prism_x

H = C.hexc
BOIS_F, BOIS_C, ENDUIT, TUILE, TUILE2, CHAUME = H('#4e3324'), H('#7a5638'), H('#efe8d8'), H('#4b5058'), H('#5d636c'), H('#a88d55')
PIERRE_J, VERMILLON, NOIR, OR = H('#9a958a'), H('#cf432c'), H('#2a2624'), H('#e2b33c')
NOREN = [H('#2d4a7a'), H('#7a2d2d'), H('#2f5d4a'), H('#5a3a6a'), H('#c86a2a')]


def toit_jp(B, F, u0, u1, v0, v1, z, col, o=.3, pente=.42, neige=False):
    """toit à croupes à larges avant-toits relevés aux angles (lecture « japonaise » : avant-toit fin + faîtage sombre)"""
    w, d = u1 - u0, v1 - v0; h = pente * min(w, d) + .15
    box(B, F, u0 - o, u1 + o, v0 - o, v1 + o, z - .06, z + .02, col, .03)                          # avant-toit fin
    hip(B, F, u0 - o * .7, u1 + o * .7, v0 - o * .7, v1 + o * .7, z + .02, h, H('#f4f6fa') if neige else col)
    for su in (-1, 1):                                                                              # coins relevés
        for sv in (-1, 1):
            box(B, F, (u1 + o if su > 0 else u0 - o) - .08, (u1 + o if su > 0 else u0 - o) + .08, (v1 + o if sv > 0 else v0 - o) - .08, (v1 + o if sv > 0 else v0 - o) + .08, z, z + .14, col, .02)
    if w >= d: box(B, F, u0 + (v1 - v0) / 2 - .05, u1 - (v1 - v0) / 2 + .05, -.06, .06, z + h - .02, z + h + .1, NOIR, .02)   # faîtage
    return z + h


def machiya(B, x, y, z0, ang, w, d, etages, rnd, neige=False):
    """maison de ville : rez-de-chaussée à treillis de bois et rideau d'entrée, étage en enduit blanc à poteaux sombres, auvent"""
    F = Frame(x, y, z0, ang); u0, u1, v0, v1 = -w / 2, w / 2, -d / 2, d / 2; h1 = .95; Ht = .25 + h1 * etages
    box(B, F, u0 - .02, u1 + .02, v0 - .02, v1 + .02, -.6, .25, PIERRE_J, .05)
    box(B, F, u0, u1, v0, v1, .25, .25 + h1, BOIS_F, .05)
    for k in range(int(w / .1)):                                                                    # treillis (koshi)
        u = u0 + .08 + k * .1
        if u > u1 - .08: break
        box(B, F, u - .015, u + .015, v1, v1 + .03, .3, .25 + h1 * .85, BOIS_C, .02)
    quad(B, F, [(-.25, v1 + .035, .55), (.25, v1 + .035, .55), (.25, v1 + .035, 1.05), (-.25, v1 + .035, 1.05)], NOREN[rnd.randrange(len(NOREN))], .03)
    if etages > 1:
        box(B, F, u0, u1, v0, v1, .25 + h1, Ht, ENDUIT, .03)
        for u in (u0, 0, u1): box(B, F, u - .04, u + .04, v1, v1 + .03, .25 + h1, Ht, BOIS_F, .02)
        for q in (-1, 1): quad(B, F, [(q * w / 4 - .2, v1 + .035, .25 + h1 + .3), (q * w / 4 + .2, v1 + .035, .25 + h1 + .3), (q * w / 4 + .2, v1 + .035, .25 + h1 + .7), (q * w / 4 - .2, v1 + .035, .25 + h1 + .7)], H('#3a2e26'), .02)
        box(B, F, u0 - .05, u1 + .05, v1, v1 + .45, .25 + h1 - .02, .25 + h1 + .05, TUILE, .03)      # auvent (hisashi)
    return toit_jp(B, F, u0, u1, v0, v1, Ht, TUILE if rnd.random() < .7 else TUILE2, .3, .38, neige)


def minka(B, x, y, z0, ang, w, d, rnd, neige=False, automne=False):
    """maison rurale à haut toit de chaume (ou de tuiles), murs de bois et enduit"""
    F = Frame(x, y, z0, ang); u0, u1, v0, v1 = -w / 2, w / 2, -d / 2, d / 2
    box(B, F, u0, u1, v0, v1, -.6, 1.0, BOIS_C if rnd.random() < .5 else ENDUIT, .06)
    for u in (u0, u1): box(B, F, u - .05, u + .05, v1, v1 + .03, 0, 1.0, BOIS_F, .02)
    quad(B, F, [(-.25, v1 + .03, 0), (.25, v1 + .03, 0), (.25, v1 + .03, .75), (-.25, v1 + .03, .75)], H('#3a2e26'), .03)
    K.window(B, F, u0 + w * .25, v1, .6, .25, .25)
    col = H('#f2f4f8') if neige else (C.mix(CHAUME, H('#9a6a3a'), .3) if automne else CHAUME)
    hip(B, F, u0 - .25, u1 + .25, v0 - .25, v1 + .25, 1.0, .75 * min(w, d) + .2, col)
    box(B, F, -w * .3, w * .3, -.08, .08, 1.0 + .75 * min(w, d) + .1, 1.0 + .75 * min(w, d) + .3, BOIS_F if not neige else H('#f2f4f8'), .02)


def cabane(B, x, y, z0, ang, w, d, rnd):
    """cabane de planches délabrée (Ebisu, Bakura, Kibi)"""
    F = Frame(x, y, z0, ang, (rnd.random() - .5) * .06, (rnd.random() - .5) * .06)
    col = C.mix(H('#7a5a3e'), H('#9a8a70'), rnd.random())
    box(B, F, -w / 2, w / 2, -d / 2, d / 2, -.6, .85, col, .1)
    for k in range(int(w / .3)): box(B, F, -w / 2 + k * .3 + .13, -w / 2 + k * .3 + .16, d / 2, d / 2 + .02, 0, .85, C.mix(col, NOIR, .3), .05)
    quad(B, F, [(-.2, d / 2 + .03, 0), (.2, d / 2 + .03, 0), (.2, d / 2 + .03, .6), (-.2, d / 2 + .03, .6)], H('#2e2622'), .03)
    prism_x(B, F, -w / 2 - .12, w / 2 + .12, -d / 2 - .12, d / 2 + .12, .85, .3 + .1 * rnd.random(), C.mix(H('#6b5a48'), H('#8a7a5a'), rnd.random()))


def chateau(B, x, y, z, rnd, etages=4):
    """château à étages [C?] : socle de pierre en talus, donjon à 4 niveaux blancs, toits gris à avant-toits, pignons, ornements dorés"""
    F = Frame(x, y, z, math.pi / 2); bw, bd, bh = 3.6, 3.0, 2.4
    n = 6                                                                                          # socle en talus (ishigaki) : tranches qui se resserrent
    for k in range(n):
        t0, t1 = k / n, (k + 1) / n; i0, i1 = .55 * (t0 ** 1.6), .55 * (t1 ** 1.6)
        box(B, F, -bw - .55 + i0, bw + .55 - i0, -bd - .55 + i0, bd + .55 - i0, -.6 + t0 * (bh + .6), -.6 + t1 * (bh + .6), C.mix(PIERRE_J, H('#7e786c'), (k % 2) * .4), .05)
    zz = bh; w, d = bw - .2, bd - .2
    for k in range(etages):
        hh = 1.25 if k < etages - 1 else 1.05
        box(B, F, -w, w, -d, d, zz, zz + hh, ENDUIT, .02)
        for s_, L_ in ((d, w), (-d, w)):
            for q in range(max(2, int(2 * L_ / .55))):
                u = -L_ + (q + .5) * 2 * L_ / max(2, int(2 * L_ / .55)); quad(B, F, [(u - .12, s_ + (.02 if s_ > 0 else -.02), zz + .45), (u + .12, s_ + (.02 if s_ > 0 else -.02), zz + .45), (u + .12, s_ + (.02 if s_ > 0 else -.02), zz + .85), (u - .12, s_ + (.02 if s_ > 0 else -.02), zz + .85)], NOIR, .02)
        top = toit_jp(B, F, -w, w, -d, d, zz + hh, H('#3f4a4c'), .55, .22 if k < etages - 1 else .5)
        if k < etages - 1:                                                                             # pignon décoratif (chidori)
            for s_ in (-1, 1):
                P3 = [F.p(-w * .45, s_ * (d + .5), zz + hh + .05), F.p(w * .45, s_ * (d + .5), zz + hh + .05), F.p(0, s_ * (d + .2), zz + hh + .75)]
                vs = [B.bm.verts.new(p) for p in P3]; B.bm.faces.new(vs); B.paint(vs, H('#3f4a4c'), .02)
                P3 = [F.p(-w * .3, s_ * (d + .52), zz + hh + .12), F.p(w * .3, s_ * (d + .52), zz + hh + .12), F.p(0, s_ * (d + .3), zz + hh + .55)]
                vs = [B.bm.verts.new(p) for p in P3]; B.bm.faces.new(vs); B.paint(vs, ENDUIT, .02)
        zz += hh + (.45 if k < etages - 1 else 0); w *= .78; d *= .78
    for s_ in (-1, 1): box(B, F, s_ * (w + .1) - .1, s_ * (w + .1) + .1, -.06, .06, top - .1, top + .35, OR, .02)
    return top + .35


def enceinte_jp(B, pts, z_of, h=1.0, col=ENDUIT):
    """mur blanc couvert de tuiles"""
    for (ax, ay), (bx, by) in zip(pts, pts[1:]):
        L_ = math.hypot(bx - ax, by - ay); mx, my = (ax + bx) / 2, (ay + by) / 2
        F = Frame(mx, my, z_of(mx, my), math.atan2(by - ay, bx - ax) + math.pi / 2)
        box(B, F, -L_ / 2, L_ / 2, -.15, .15, -.6, h, col, .03); prism_x(B, F, -L_ / 2 - .02, L_ / 2 + .02, -.28, .28, h, .22, TUILE)


def pagode(B, x, y, z, niveaux=5):
    F = Frame(x, y, z, 0); w = 1.15; zz = 0
    box(B, F, -w - .3, w + .3, -w - .3, w + .3, -.5, .3, PIERRE_J, .03)
    for k in range(niveaux):
        hh = .85 - .05 * k; box(B, F, -w * .78, w * .78, -w * .78, w * .78, .3 + zz, .3 + zz + hh, VERMILLON if k % 2 == 0 else H('#b8452f'), .03)
        hip(B, F, -w - .35, w + .35, -w - .35, w + .35, .3 + zz + hh, .32, H('#3f4a4c')); zz += hh + .3; w *= .86
    vs = C.bm_cyl(B.bm, F.p(0, 0, .3 + zz), F.p(0, 0, .3 + zz + 1.6), .07, .04, 6); B.paint(vs, OR, .02)
    for k in range(5): vs = C.bm_cyl(B.bm, F.p(0, 0, .45 + zz + k * .25), F.p(0, 0, .5 + zz + k * .25), .14, .14, 8); B.paint(vs, OR, .02)
    return .3 + zz + 1.6


def torii(B, x, y, z, ang, s=1.0, col=VERMILLON):
    F = Frame(x, y, z, ang)
    for su in (-1, 1):
        vs = C.bm_cyl(B.bm, F.p(su * 1.0 * s, 0, -.3), F.p(su * .92 * s, 0, 2.6 * s), .12 * s, .1 * s, 10); B.paint(vs, col, .02)
        box(B, F, su * 1.0 * s - .16 * s, su * 1.0 * s + .16 * s, -.16 * s, .16 * s, -.3, .15, NOIR, .02)
    box(B, F, -1.2 * s, 1.2 * s, -.08 * s, .08 * s, 2.05 * s, 2.2 * s, col, .02)
    box(B, F, -1.45 * s, 1.45 * s, -.14 * s, .14 * s, 2.55 * s, 2.72 * s, col, .02)
    box(B, F, -1.6 * s, 1.6 * s, -.17 * s, .17 * s, 2.72 * s, 2.86 * s, NOIR, .02)
    for su in (-1, 1): box(B, F, su * 1.5 * s - .12 * s, su * 1.6 * s + .02, -.17 * s, .17 * s, 2.86 * s, 2.98 * s, NOIR, .02)


def pont_jp(B, x, y, ang, L_, w, z0, h=.8, col=VERMILLON):
    """pont arqué (taiko-bashi) à garde-corps vermillon ; ang = direction de traversée"""
    F = Frame(x, y, 0, ang - math.pi / 2); n = 10
    for k in range(n):
        u0, u1 = -L_ / 2 + k * L_ / n, -L_ / 2 + (k + 1) * L_ / n
        za, zb = z0 + h * math.sin(math.pi * k / n), z0 + h * math.sin(math.pi * (k + 1) / n)
        quad(B, F, [(u0, -w / 2, za), (u1, -w / 2, zb), (u1, w / 2, zb), (u0, w / 2, za)], H('#8a6440'), .04)
        quad(B, F, [(u0, -w / 2, za - .15), (u1, -w / 2, zb - .15), (u1, w / 2, zb - .15), (u0, w / 2, za - .15)], H('#6b4a30'), .04)
        for s_ in (-1, 1): box(B, F, u0, u1, s_ * w / 2 - .04, s_ * w / 2 + .04, (za + zb) / 2 + .32, (za + zb) / 2 + .38, col, .02)
        for s_ in (-1, 1): box(B, F, u0 - .03, u0 + .03, s_ * w / 2 - .04, s_ * w / 2 + .04, za, za + .38, col, .02)
    for su in (-1, 1): box(B, F, su * L_ / 2 * .7 - .08, su * L_ / 2 * .7 + .08, -.08, .08, z0 - 1.2, z0 + h * .6, H('#5a4030'), .02)


def pont_long(B, a, b, z, w=.8):
    """long pont de bois sur chevalets (pont Oihagi [C] : forme [I])"""
    L_ = math.hypot(b[0] - a[0], b[1] - a[1]); F = Frame((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, z, math.atan2(b[1] - a[1], b[0] - a[0]) - math.pi / 2)
    box(B, F, -L_ / 2, L_ / 2, -w / 2, w / 2, -.12, 0, H('#8a6a48'), .06)
    for k in range(int(L_ / .9) + 1):
        u = -L_ / 2 + k * L_ / int(L_ / .9)
        for s_ in (-1, 1): box(B, F, u - .04, u + .04, s_ * w / 2 - .04, s_ * w / 2 + .04, 0, .5, H('#6b4a30'), .02)
        box(B, F, u - .06, u + .06, -w / 2 + .1, w / 2 - .1, -2.4, -.12, H('#5a4030'), .02)
    for s_ in (-1, 1): box(B, F, -L_ / 2, L_ / 2, s_ * w / 2 - .03, s_ * w / 2 + .03, .45, .5, H('#6b4a30'), .02)


def stele(B, x, y, z, rnd):
    F = Frame(x, y, z, rnd.uniform(-.2, .2) + math.pi / 2)
    box(B, F, -.22, .22, -.15, .15, -.2, .12, H('#8a867e'), .04)
    box(B, F, -.12, .12, -.08, .08, .12, .55 + .2 * rnd.random(), H('#a6a29a'), .05)


def lanterne(B, x, y, z):
    vs = C.bm_cyl(B.bm, C.g2b(x, y, z - .1), C.g2b(x, y, z + .45), .07, .07, 6); B.paint(vs, PIERRE_J, .03)
    F = Frame(x, y, z, 0); box(B, F, -.16, .16, -.16, .16, .45, .7, H('#f2e2a8'), .02); hip(B, F, -.24, .24, -.24, .24, .7, .16, PIERRE_J)


def usine(B, x, y, z, ang, w, d, rnd):
    """usine sur rocher (Kibi) [C] : halle à toit en sheds rouillés, cheminées de brique"""
    F = Frame(x, y, z, ang)
    box(B, F, -w / 2, w / 2, -d / 2, d / 2, -.6, 1.2, H('#8a7a6a'), .06)
    n = max(2, int(w / .9))
    for k in range(n):
        u0 = -w / 2 + k * w / n; u1 = u0 + w / n
        P = [F.p(u0, -d / 2, 1.2), F.p(u1, -d / 2, 1.2), F.p(u1, d / 2, 1.2), F.p(u0, d / 2, 1.2), F.p(u1, -d / 2, 1.75), F.p(u1, d / 2, 1.75)]
        vs = [B.bm.verts.new(p) for p in P]
        for f in ((0, 1, 4), (3, 5, 2), (0, 4, 5, 3), (1, 2, 5, 4)): B.bm.faces.new([vs[i] for i in f])
        B.paint(vs, C.mix(H('#8a4a30'), H('#6a5a50'), rnd.random()), .06)
    for k in range(2 + rnd.randrange(2)):
        u = rnd.uniform(-w / 2 + .3, w / 2 - .3); vs = C.bm_cyl(B.bm, F.p(u, -d / 2 + .3, 1.0), F.p(u, -d / 2 + .3, 3.2 + rnd.random()), .2, .15, 8); B.paint(vs, H('#8a4a38'), .05)
        vs = C.bm_cyl(B.bm, F.p(u, -d / 2 + .3, 3.2 + .9), F.p(u, -d / 2 + .3, 3.4 + .9), .18, .18, 8); B.paint(vs, NOIR, .02)


def ruine_brulee(B, x, y, z, rnd):
    """ruines du château d'Oden [C : détruit] : socle de pierre, poteaux calcinés, poutres tombées [forme I]"""
    F = Frame(x, y, z, math.pi / 2)
    for k in range(3): box(B, F, -2.4 + k * .3, 2.4 - k * .3, -2.0 + k * .3, 2.0 - k * .3, -.6 + k * .5, -.1 + k * .5, C.mix(PIERRE_J, H('#6a645a'), .4), .05)
    for k in range(9):
        u, v = rnd.uniform(-1.4, 1.4), rnd.uniform(-1.1, 1.1); hh = .4 + rnd.random() * 1.6
        box(B, F, u - .09, u + .09, v - .09, v + .09, .9, .9 + hh, H('#2e2622'), .08)
    for k in range(5):
        u, v = rnd.uniform(-1.4, 1.4), rnd.uniform(-1.1, 1.1); Fb = Frame(x + u, y + v, z + 1.0, rnd.uniform(0, 6.28), rnd.uniform(-.2, .2))
        box(B, Fb, -.08, .08, -.9, .9, 0, .14, H('#3a2e28'), .06)


def telecabine(B, a, b, za, zb, n=3):
    """télécabine du port de Mogura [C] : pylônes, câble, cabines"""
    L_ = math.hypot(b[0] - a[0], b[1] - a[1]); ang = math.atan2(b[1] - a[1], b[0] - a[0])
    for k in range(n + 1):
        t = k / n; x, y = a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t; zt = za + (zb - za) * t + 1.6
        vs = C.bm_cyl(B.bm, C.g2b(x, y, za + (zb - za) * t - .6), C.g2b(x, y, zt), .08, .06, 6); B.paint(vs, H('#5a4030'), .02)
    vs = C.bm_tube(B.bm, [C.g2b(a[0], a[1], za + 1.6), C.g2b(b[0], b[1], zb + 1.6)], lambda t: .025, 4); B.paint(vs, NOIR)
    for k in (1, 2):
        t = k / 3 + .05; x, y = a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t; zc = za + (zb - za) * t + 1.0
        F = Frame(x, y, zc, ang); box(B, F, -.25, .25, -.3, .3, 0, .45, H('#c86a2a'), .03); box(B, F, -.28, .28, -.33, .33, .45, .52, NOIR, .02)


# ---------------------------------------------------------------- végétation
def sakura(B, x, y, z, s, rnd):
    vs = C.bm_tube(B.bm, [C.g2b(x, y, z - .2), C.g2b(x + .1 * s, y, z + .7 * s), C.g2b(x - .1 * s, y + .05 * s, z + 1.1 * s)], lambda t: .1 * s * (1 - .4 * t), 6); B.paint(vs, H('#4e3a32'), .04)
    for k in range(4):
        a = k * 1.6 + rnd.random(); r = .45 * s
        vs = C.bm_ico(B.bm, C.g2b(x + math.cos(a) * r, y + math.sin(a) * r, z + (1.25 + .25 * (k % 2)) * s), (.55 - .05 * k) * s, 1, (1, 1, .75))
        B.paint(vs, C.mix(H('#f2b5c8'), H('#fbd6e2'), rnd.random()), .06)


def pin_jp(B, x, y, z, s, rnd, neige=False):
    vs = C.bm_tube(B.bm, [C.g2b(x, y, z - .2), C.g2b(x + .25 * s, y, z + .9 * s), C.g2b(x - .1 * s, y + .1 * s, z + 1.8 * s)], lambda t: .09 * s * (1 - .5 * t), 6); B.paint(vs, H('#5a4030'), .04)
    for k in range(3):
        a = rnd.random() * 6.28; r = .35 * s
        p = C.g2b(x + math.cos(a) * r, y + math.sin(a) * r, z + (1.0 + .45 * k) * s)
        vs = C.bm_uvsphere(B.bm, p, 1, 10, 4, ((.6 - .12 * k) * s, (.6 - .12 * k) * s, .18 * s)); B.paint(vs, H('#2f5a34'), .07)
        if neige: vs = C.bm_uvsphere(B.bm, p + C.g2b(0, 0, .12 * s), 1, 10, 4, ((.5 - .12 * k) * s, (.5 - .12 * k) * s, .1 * s)); B.paint(vs, H('#f4f6fa'), .02)


def pin_neige(B, x, y, z, s):
    vs = C.bm_cyl(B.bm, C.g2b(x, y, z - .2), C.g2b(x, y, z + .4 * s), .07 * s, .07 * s, 5); B.paint(vs, H('#4e3a32'))
    for k in range(3):
        z0 = z + (.35 + k * .55) * s; r = (.7 - k * .18) * s
        vs = C.bm_cyl(B.bm, C.g2b(x, y, z0), C.g2b(x, y, z0 + .75 * s), r, .03, 8); B.paint(vs, H('#2e4e3a'), .05)
        vs = C.bm_cyl(B.bm, C.g2b(x, y, z0 + .3 * s), C.g2b(x, y, z0 + .78 * s), r * .62, .02, 8); B.paint(vs, H('#f4f6fa'), .02)


def erable(B, x, y, z, s, rnd):
    vs = C.bm_cyl(B.bm, C.g2b(x, y, z - .2), C.g2b(x, y, z + .9 * s), .08 * s, .06 * s, 6); B.paint(vs, H('#4e3a32'))
    col = rnd.choice([H('#d0502a'), H('#e08a30'), H('#c23a2a'), H('#e8b040')])
    for k in range(3):
        a = rnd.random() * 6.28; vs = C.bm_ico(B.bm, C.g2b(x + math.cos(a) * .3 * s, y + math.sin(a) * .3 * s, z + (1.15 + .25 * k) * s), (.5 - .08 * k) * s, 1); B.paint(vs, C.mix(col, H('#f0c060'), rnd.random() * .3), .07)


def feuillu(B, x, y, z, s, rnd):
    vs = C.bm_cyl(B.bm, C.g2b(x, y, z - .2), C.g2b(x, y, z + 1.0 * s), .09 * s, .07 * s, 6); B.paint(vs, H('#5a4030'))
    for k in range(3):
        a = rnd.random() * 6.28; vs = C.bm_ico(B.bm, C.g2b(x + math.cos(a) * .35 * s, y + math.sin(a) * .35 * s, z + (1.25 + .3 * k) * s), (.65 - .1 * k) * s, 1); B.paint(vs, C.mix(H('#3e8a3a'), H('#6aae4a'), rnd.random()), .08)


def bambou(B, x, y, z, s, rnd):
    for k in range(6):
        a = rnd.random() * 6.28; r = rnd.random() * .4 * s; hh = (2.0 + rnd.random()) * s
        vs = C.bm_cyl(B.bm, C.g2b(x + math.cos(a) * r, y + math.sin(a) * r, z - .2), C.g2b(x + math.cos(a) * r * 1.2, y + math.sin(a) * r * 1.2, z + hh), .035, .03, 5); B.paint(vs, H('#7aa64a'), .05)
        vs = C.bm_ico(B.bm, C.g2b(x + math.cos(a) * r * 1.2, y + math.sin(a) * r * 1.2, z + hh), .25 * s, 1, (1, 1, .6)); B.paint(vs, H('#6a9a3a'), .06)


def arbre_mort(B, x, y, z, s, rnd):
    vs = C.bm_tube(B.bm, [C.g2b(x, y, z - .2), C.g2b(x + .1 * s, y, z + .8 * s), C.g2b(x - .05 * s, y + .1 * s, z + 1.5 * s)], lambda t: .08 * s * (1 - .6 * t), 5); B.paint(vs, H('#5a4a40'), .05)
    for k in range(3):
        a = rnd.random() * 6.28; zb = z + (.8 + .3 * k) * s
        vs = C.bm_tube(B.bm, [C.g2b(x, y, zb), C.g2b(x + math.cos(a) * .5 * s, y + math.sin(a) * .5 * s, zb + .4 * s)], lambda t: .04 * s * (1 - .7 * t), 4); B.paint(vs, H('#5a4a40'), .05)
