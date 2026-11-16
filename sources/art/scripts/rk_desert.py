"""RISK OP — kit architectural DÉSERT (Arabasta, île 6 ; réutilisable pour d'autres îles désertiques, ex. Sphinx).
Pièces : maisons de terre crue à toits plats (parapets, poutres saillantes), maisons blanches à arcs et dômes (Alubarna,
Nanohana), maisons de bois blanches à fausses façades et vérandas (Rainbase [C : « ville américaine du XIXᵉ siècle »]),
huttes rondes à perches (Yuba [C]), ruines, palais blanc à dômes [C], tour de l'horloge [C : rappelle Big Ben], pyramide
du casino [C], tombeaux, phare, felouques, étals à auvents ; palmiers, buissons, arbres morts. Formes génériques [I].
Repère : x est, y sud, z haut (jeu) ; u = le long de la façade, v = vers la rue (Frame de rk_port).
"""
import math, random
import rk_common as C
import rk_port as K
import rk_lib as L
from rk_port import Frame, box, quad, hip, prism_x

H = C.hexc
TERRE = [H('#d9b27a'), H('#cfa46a'), H('#e2bf88'), H('#c89a62')]
BLANC = [H('#f3ede0'), H('#efe4cf'), H('#f6f1e6'), H('#eadcc2')]
PORTES = [H('#2f7a8a'), H('#3d64b8'), H('#a8443a'), H('#c8962a'), H('#2f6a4a')]
SOMBRE, BOIS_D, OR = H('#3a2e26'), H('#7a5638'), H('#e2b33c')
DOMES = [H('#f3ede0'), H('#2f8a9a'), H('#e2b33c'), H('#3d6ab8')]


def arc_porte(B, F, u, v, z, w, h, col):
    quad(B, F, [(u - w / 2, v + .02, z), (u + w / 2, v + .02, z), (u + w / 2, v + .02, z + h), (u - w / 2, v + .02, z + h)], col, .03)
    for k in range(4):
        a0, a1 = math.pi * k / 4, math.pi * (k + 1) / 4
        quad(B, F, [(u, v + .02, z + h), (u - math.cos(a0) * w / 2, v + .02, z + h + math.sin(a0) * w / 2), (u - math.cos(a1) * w / 2, v + .02, z + h + math.sin(a1) * w / 2), (u, v + .02, z + h)], col, .03)


def dome(B, x, y, z, r, col, bulbe=False, k=1.0):
    """dôme sur tambour ; bulbe = forme en oignon (Alubarna [C : dômes comparés à des bulbes indiens])"""
    vs = C.bm_cyl(B.bm, C.g2b(x, y, z - .02), C.g2b(x, y, z + .18 * r), r * 1.02, r * 1.02, 14); B.paint(vs, H('#efe4cf'), .02)
    sc = (r, r, r * (1.25 if bulbe else .85) * k)
    vs = C.bm_uvsphere(B.bm, C.g2b(x, y, z + .18 * r), 1, 14, 7, sc); B.paint(vs, col, .03)
    if bulbe:
        vs = C.bm_cyl(B.bm, C.g2b(x, y, z + .18 * r + r * 1.1 * k), C.g2b(x, y, z + .18 * r + r * 1.9 * k), r * .28, .01, 8); B.paint(vs, col, .03)
    vs = C.bm_uvsphere(B.bm, C.g2b(x, y, z + .18 * r + r * (2.0 if bulbe else .95) * k), .06 + .04 * r, 6, 4); B.paint(vs, OR, .02)


def maison_terre(B, x, y, z0, ang, w, d, etages, rnd, col=None):
    """terre crue : volumes cubiques, parapet, poutres saillantes, petites fenêtres sombres, porte cintrée"""
    F = Frame(x, y, z0, ang); col = col or TERRE[rnd.randrange(len(TERRE))]; h = .9 + .75 * (etages - 1)
    box(B, F, -w / 2, w / 2, -d / 2, d / 2, -.6, h, col, .06)
    box(B, F, -w / 2 - .02, w / 2 + .02, -d / 2 - .02, d / 2 + .02, h, h + .14, C.mix(col, H('#fff2d8'), .25), .04)
    for k in range(max(2, int(w / .4))):
        u = -w / 2 + (k + .5) * w / max(2, int(w / .4)); box(B, F, u - .03, u + .03, d / 2, d / 2 + .14, h - .2, h - .14, BOIS_D, .02)
    arc_porte(B, F, rnd.uniform(-w / 4, w / 4), d / 2, 0, .3, .45, SOMBRE)
    for k in range(etages):
        for q in (-1, 1):
            if rnd.random() < .7: quad(B, F, [(q * w / 3 - .08, d / 2 + .02, .55 + k * .75), (q * w / 3 + .08, d / 2 + .02, .55 + k * .75), (q * w / 3 + .08, d / 2 + .02, .75 + k * .75), (q * w / 3 - .08, d / 2 + .02, .75 + k * .75)], SOMBRE, .02)
    if rnd.random() < .35:                                                                  # petit volume sur le toit
        box(B, F, -w / 2 + .1, -w / 2 + .1 + w * .4, -d / 2 + .1, -d / 2 + .1 + d * .45, h, h + .55, col, .06)
    if rnd.random() < .25:                                                                  # auvent de toile
        box(B, F, -w * .35, w * .35, d / 2, d / 2 + .35, .7, .74, [H('#c84a3a'), H('#e2b33c'), H('#3d64b8'), H('#f3ede0')][rnd.randrange(4)], .03)


def maison_blanche(B, x, y, z0, ang, w, d, etages, rnd, avec_dome=False):
    """pierre blanche : arcs, bandeau coloré, terrasse à créneaux arrondis, parfois un dôme (Alubarna, Nanohana)"""
    F = Frame(x, y, z0, ang); col = BLANC[rnd.randrange(len(BLANC))]; h = 1.0 + .85 * (etages - 1); tr = PORTES[rnd.randrange(len(PORTES))]
    box(B, F, -w / 2, w / 2, -d / 2, d / 2, -.6, h, col, .03)
    box(B, F, -w / 2 - .02, w / 2 + .02, -d / 2 - .02, d / 2 + .02, h - .12, h - .05, tr, .02)
    for k in range(max(2, int(w / .32))):
        u = -w / 2 + (k + .5) * w / max(2, int(w / .32)); box(B, F, u - .07, u + .07, d / 2 - .06, d / 2, h, h + .14, col, .02)
    arc_porte(B, F, 0, d / 2, 0, .32, .5, tr)
    for k in range(etages):
        for q in (-1, 1):
            arc_porte(B, F, q * w / 3.2, d / 2, .55 + k * .85, .16, .22, SOMBRE)
    if avec_dome: dome(B, x, y, z0 + h, min(w, d) * .3, DOMES[rnd.randrange(len(DOMES))], rnd.random() < .5)


def maison_ouest(B, x, y, z0, ang, w, d, rnd):
    """Rainbase [C] : bois peint en blanc, fausse façade, véranda à poteaux, toit à deux pans derrière"""
    F = Frame(x, y, z0, ang); col = C.mix(H('#f4f1ea'), H('#e8e0d0'), rnd.random()); etg = 1 + (rnd.random() < .5); h = .95 * etg
    box(B, F, -w / 2, w / 2, -d / 2, d / 2, -.6, h, col, .03)
    for k in range(int(h / .12)): box(B, F, -w / 2 - .01, w / 2 + .01, d / 2, d / 2 + .015, .1 + k * .12, .115 + k * .12, C.mix(col, H('#b8b0a0'), .5), .02)
    prism_x(B, F, -w / 2 - .05, w / 2 + .05, -d / 2 - .05, d / 2 - .2, h, .35, H('#6e5a4a'))
    box(B, F, -w / 2, w / 2, d / 2 - .05, d / 2 + .02, h, h + .45, col, .03)                    # fausse façade
    box(B, F, -w / 2 - .02, w / 2 + .02, d / 2 - .06, d / 2 + .04, h + .45, h + .52, H('#8a6a48'), .02)
    box(B, F, -w / 2, w / 2, d / 2, d / 2 + .55, .62, .67, H('#7a5638'), .03)                 # véranda
    for q in (-1, 0, 1): box(B, F, q * (w / 2 - .06) - .03, q * (w / 2 - .06) + .03, d / 2 + .5, d / 2 + .56, 0, .62, H('#7a5638'), .02)
    quad(B, F, [(-.18, d / 2 + .02, 0), (.18, d / 2 + .02, 0), (.18, d / 2 + .02, .55), (-.18, d / 2 + .02, .55)], H('#5a4030'), .02)
    for q in (-1, 1): K.window(B, F, q * w / 3, d / 2, .4 if etg == 1 else 1.3, .2, .3)


def hutte_ronde(B, x, y, z0, r, rnd, enfouie=.0):
    """Yuba [C] : bâtiment rond de terre coiffé de fines perches ; en partie ensablé (tempêtes de sable [C])"""
    col = C.mix(H('#c9a06a'), H('#b8905a'), rnd.random()); h = .9 + .3 * rnd.random()
    vs = C.bm_cyl(B.bm, C.g2b(x, y, z0 - .6 - enfouie), C.g2b(x, y, z0 + h - enfouie), r, r * .9, 12); B.paint(vs, col, .06)
    vs = C.bm_cyl(B.bm, C.g2b(x, y, z0 + h - enfouie), C.g2b(x, y, z0 + h + .05 - enfouie), r * .92, r * .92, 12); B.paint(vs, C.mix(col, H('#fff2d8'), .2), .04)
    for k in range(7):
        a = k / 7 * 6.283 + rnd.random() * .3; p0 = C.g2b(x + math.cos(a) * r * .5, y + math.sin(a) * r * .5, z0 + h - .1 - enfouie)
        p1 = C.g2b(x + math.cos(a) * r * 1.15, y + math.sin(a) * r * 1.15, z0 + h + .55 - enfouie)
        vs = C.bm_tube(B.bm, [p0, p1], lambda t: .022, 4); B.paint(vs, H('#8a6a48'), .05)
    F = Frame(x, y, z0 - enfouie, rnd.uniform(0, 6.28)); quad(B, F, [(-.15, r + .01, 0), (.15, r + .01, 0), (.15, r + .01, .5), (-.15, r + .01, .5)], SOMBRE, .02)


def ruine(B, x, y, z0, ang, w, d, rnd, col=None):
    """murs effondrés (Erumalu, Suiren [C : villes en ruines / asséchées]) ; hauteurs irrégulières, colonnes tombées"""
    F = Frame(x, y, z0, ang); col = col or C.mix(TERRE[rnd.randrange(4)], H('#b8a488'), .4)
    for (u0, u1, v0, v1) in ((-w / 2, w / 2, d / 2 - .14, d / 2), (-w / 2, w / 2, -d / 2, -d / 2 + .14), (-w / 2, -w / 2 + .14, -d / 2, d / 2), (w / 2 - .14, w / 2, -d / 2, d / 2)):
        n = 4
        for k in range(n):
            if rnd.random() < .3: continue
            a0 = u0 + (u1 - u0) * k / n if u1 - u0 > v1 - v0 else u0; a1 = u0 + (u1 - u0) * (k + 1) / n if u1 - u0 > v1 - v0 else u1
            b0 = v0 if u1 - u0 > v1 - v0 else v0 + (v1 - v0) * k / n; b1 = v1 if u1 - u0 > v1 - v0 else v0 + (v1 - v0) * (k + 1) / n
            box(B, F, a0, a1, b0, b1, -.4, .2 + rnd.random() * .9, col, .08)
    if rnd.random() < .4:
        vs = C.bm_cyl(B.bm, F.p(-w / 3, d / 2 + .5, .12), F.p(w / 3, d / 2 + .7, .12), .12, .12, 8); B.paint(vs, C.mix(col, H('#e8dcc2'), .4), .05)


def palais(B, x, y, z):
    """palais royal [C : grand, blanc, plus coloré qu'Enies Lobby] : socle à degrés, corps à arcades, tours d'angle à bulbes,
    grand dôme central [forme I]"""
    F = Frame(x, y, z, math.pi / 2); col = H('#f6f1e6'); tr = H('#2f7a8a')
    box(B, F, -2.6, 2.6, -2.1, 2.1, -.6, .4, H('#e8dcc2'), .03)
    box(B, F, -2.2, 2.2, -1.7, 1.7, .4, 2.6, col, .02)
    box(B, F, -2.22, 2.22, -1.72, 1.72, 2.35, 2.48, tr, .02)
    for k in range(7): arc_porte(B, F, -1.8 + k * .6, 1.7, .4, .32, .7, H('#3a3a46'))
    for k in range(7): arc_porte(B, F, -1.8 + k * .6, 1.7, 1.55, .22, .4, H('#3a3a46'))
    box(B, F, -1.2, 1.2, -1.0, 1.0, 2.6, 3.5, col, .02)
    dome(B, x, y, z + 3.5, 1.05, H('#f3ede0'), True)
    for su in (-1, 1):
        for sv in (-1, 1):
            tx, ty = F.p(su * 2.2, sv * 1.7, 0).x, -F.p(su * 2.2, sv * 1.7, 0).y
            vs = C.bm_cyl(B.bm, C.g2b(tx, ty, z - .6), C.g2b(tx, ty, z + 4.0), .42, .38, 10); B.paint(vs, col, .02)
            vs = C.bm_cyl(B.bm, C.g2b(tx, ty, z + 3.7), C.g2b(tx, ty, z + 3.82), .46, .46, 10); B.paint(vs, tr, .02)
            dome(B, tx, ty, z + 4.0, .42, H('#e2b33c') if su * sv > 0 else H('#2f8a9a'), True)
    for su in (-1, 1): dome(B, *(lambda p: (p.x, -p.y))(F.p(su * 1.3, 0, 0)), z + 2.6, .5, H('#2f8a9a'), True)
    return 3.5 + 2.6


def tour_horloge(B, x, y, z):
    """tour de l'horloge [C : haute, rappelle Big Ben] : fût carré, cadrans sur 4 faces, flèche pointue"""
    F = Frame(x, y, z, math.pi / 2); s = .6; Ht = 7.2; col = H('#e8d6b2')
    box(B, F, -s, s, -s, s, -.6, Ht, col, .03)
    for k in range(5): box(B, F, -s - .03, s + .03, -s - .03, s + .03, 1.0 + k * 1.3, 1.06 + k * 1.3, H('#c8b08a'), .02)
    box(B, F, -s - .12, s + .12, -s - .12, s + .12, Ht, Ht + 1.3, col, .03)
    for q in range(4):
        Fq = Frame(x, y, z, q * math.pi / 2)
        vs = C.bm_cyl(B.bm, Fq.p(0, s + .12, Ht + .65), Fq.p(0, s + .16, Ht + .65), .45, .45, 20); B.paint(vs, H('#f4f0e2'), .01)
        quad(B, Fq, [(-.02, s + .17, Ht + .65), (.02, s + .17, Ht + .65), (.02, s + .17, Ht + 1.0), (-.02, s + .17, Ht + .65)], SOMBRE)
        quad(B, Fq, [(-.02, s + .17, Ht + .63), (.26, s + .17, Ht + .63), (.26, s + .17, Ht + .67), (-.02, s + .17, Ht + .67)], SOMBRE)
    box(B, F, -s - .16, s + .16, -s - .16, s + .16, Ht + 1.3, Ht + 1.45, H('#c8b08a'), .02)
    vs = C.bm_cyl(B.bm, F.p(0, 0, Ht + 1.45), F.p(0, 0, Ht + 3.6), .62, .02, 4); B.paint(vs, H('#3a4a5a'), .03)
    return Ht + 3.6


def pyramide(B, x, y, z, base=2.2, h=2.6, col=H('#d8b46a')):
    """casino de Rainbase [C : en forme de pyramide] (sans emblème)"""
    F = Frame(x, y, z, math.pi / 2); n = 6
    for k in range(n):
        t0, t1 = k / n, (k + 1) / n; b0, b1 = base * (1 - t0), base * (1 - t1)
        box(B, F, -b0, b0, -b0, b0, -.5 + h * t0 if k else -.5, h * t1, C.mix(col, H('#f0d896'), (k % 2) * .4), .02)
    quad(B, F, [(-.4, base + .02, 0), (.4, base + .02, 0), (.4, base * .82, .9), (-.4, base * .82, .9)], H('#2a2420'), .02)
    for k in range(4): vs = C.bm_uvsphere(B.bm, F.p(-1.2 + k * .8, base + .1, .1), .08, 6, 4); B.paint(vs, H('#ffe08a'), .01)
    vs = C.bm_uvsphere(B.bm, F.p(0, 0, h + .05), .18, 8, 4); B.paint(vs, OR, .02)
    return h


def tombeau(B, x, y, z, rnd):
    F = Frame(x, y, z, rnd.uniform(0, .4))
    if rnd.random() < .5:
        box(B, F, -.6, .6, -.45, .45, -.4, .5, H('#d8c49a'), .04); box(B, F, -.5, .5, -.35, .35, .5, .62, H('#cbb48a'), .03)
    else:
        for k in range(3): box(B, F, -.6 + k * .2, .6 - k * .2, -.6 + k * .2, .6 - k * .2, -.4 + k * .35, -.05 + k * .35, H('#d8c49a'), .03)


def felouque(B, x, y, z, ang, L_=1.4, rnd=random):
    """bateau du fleuve à voile triangulaire"""
    F = Frame(x, y, z, ang); K.box(B, F, -.22, .22, -L_ / 2, L_ / 2, -.05, .22, H('#7a5a3e'), .05)
    vs = C.bm_cyl(B.bm, F.p(0, 0, .2), F.p(0, 0, 1.6), .03, .03, 5); B.paint(vs, BOIS_D)
    vs = [B.bm.verts.new(F.p(0, -L_ * .4, .45)), B.bm.verts.new(F.p(0, L_ * .45, 1.75)), B.bm.verts.new(F.p(0, L_ * .2, .4))]
    B.bm.faces.new(vs); B.paint(vs, H('#f4efe2'), .03)


def etal(B, x, y, z, ang, rnd):
    F = Frame(x, y, z, ang); col = [H('#c84a3a'), H('#e2b33c'), H('#3d64b8'), H('#2f8a7a')][rnd.randrange(4)]
    for su in (-1, 1):
        for sv in (-1, 1): box(B, F, su * .4 - .03, su * .4 + .03, sv * .3 - .03, sv * .3 + .03, -.2, .75, BOIS_D, .02)
    prism_x(B, F, -.5, .5, -.4, .4, .75, .25, col)
    box(B, F, -.35, .35, -.2, .2, .3, .38, C.mix(H('#e8c070'), H('#c86a3a'), rnd.random()), .1)


def palmier(B, x, y, z, s, rnd):
    return L.palm(B, C.g2b(x, y, z), .32 * s, C.mix(H('#4f8a3a'), H('#6a9a3a'), rnd.random()), rnd)


def buisson(B, x, y, z, s, rnd):
    vs = C.bm_ico(B.bm, C.g2b(x, y, z + .15 * s), .35 * s, 1, (1, 1, .6)); B.paint(vs, C.mix(H('#8a9a5a'), H('#a8a26a'), rnd.random()), .08)
