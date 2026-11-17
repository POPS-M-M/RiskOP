"""RISK OP — kit VILLAGE DU SAVOIR (Ohara, île 16).
[C] Arbre de la Connaissance, arbre géant de 5 000 ans entouré de maisons, abritant une bibliothèque ; lac près de l'arbre
(One Piece Wiki, « Ohara », « Tree of Knowledge »). [C?] portes et fenêtres dans le tronc, large couronne (de mémoire).
[I] toutes les formes, couleurs et proportions ; maisons à colombages, fermes, port, phare.
Aucun personnage, aucun géant, aucun navire de la Marine, aucun Poneglyph, aucune copie de décor officiel.
Repère : x est, y sud, z haut (jeu) ; Frame de rk_port (v = façade avant).
"""
import math, random
from mathutils import Vector, noise
import rk_common as C
from rk_port import Frame, box, quad, prism_x
from rk_retrofutur import torus, revolve

H = C.hexc
G = C.g2b
ECORCE = [H('#7a5a3e'), H('#8a6a4a'), H('#5e4430'), H('#6a4e36')]
FEUILLE = [H('#4f8e3e'), H('#62a04a'), H('#3a7034'), H('#58983f')]
MUR = [H('#f2e8d4'), H('#e8dcc0'), H('#f6efe0'), H('#e4d4b4')]
TOIT = [H('#c0603e'), H('#a84e34'), H('#d8784e'), H('#b8664a')]
POUTRE, VITRE, BOIS, LUMIERE = H('#5a3e2a'), H('#34485e'), H('#8a6440'), H('#ffd890')


def arbre_savoir(T, x, y, z0, rt, h, rnd):
    """[C : arbre géant, bibliothèque ; C? portes et fenêtres dans le tronc] tronc évasé à racines, rangées de fenêtres sur quatre étages,
    grande porte au sud et perron, deux galeries de bois, grosses branches, couronne en dôme de touffes"""
    Bp, Bg, Bl = T
    prof = [(rt * 1.75, z0 - .6), (rt * 1.45, z0 + .4), (rt * 1.12, z0 + 1.6), (rt, z0 + 3.0), (rt * .95, z0 + h * .6), (rt * .9, z0 + h)]
    def rad(z):
        for (r0, z0_), (r1, z1_) in zip(prof, prof[1:]):
            if z0_ <= z <= z1_: return r0 + (r1 - r0) * (z - z0_) / (z1_ - z0_)
        return prof[-1][0]
    revolve(Bp, x, y, prof, lambda co: C.mix(ECORCE[2], ECORCE[1], .5 + .5 * math.sin(math.atan2(co.y + y, co.x - x) * 9 + co.z * .6)), 28, False)
    for k in range(9):                                                                               # racines
        a = k / 9 * 2 * math.pi + .3
        if angd_(a, math.pi / 2) < .35: continue
        pts = [G(x + math.cos(a) * rt * 1.2, y + math.sin(a) * rt * 1.2, z0 + 1.2), G(x + math.cos(a) * rt * 1.9, y + math.sin(a) * rt * 1.9, z0 + .1), G(x + math.cos(a) * rt * 2.5, y + math.sin(a) * rt * 2.5, z0 - .4)]
        vs = C.bm_tube(Bp.bm, pts, lambda t: rt * (.24 - .15 * t), 7); Bp.paint(vs, ECORCE[3], .04)
    for e, ze in enumerate((2.2, 4.6, 7.0, 9.4)):                                                    # fenêtres sur quatre étages
        n = 10 - e; rr = rad(z0 + ze + .35) + .04
        for k in range(n):
            a = k / n * 2 * math.pi + e * .3
            if ze < 3 and angd_(a, math.pi / 2) < .5: continue                                      # place de la porte
            F = Frame(x + math.cos(a) * rr, y + math.sin(a) * rr, z0, a)
            lit = rnd.random() < .45
            quad(Bl if lit else Bg, F, [(-.22, 0, ze), (.22, 0, ze), (.22, 0, ze + .55), (0, 0, ze + .7), (-.22, 0, ze + .55)], LUMIERE if lit else VITRE, .03)
            quad(Bp, F, [(-.28, -.01, ze - .08), (.28, -.01, ze - .08), (.28, -.01, ze + .78), (-.28, -.01, ze + .78)], ECORCE[0], .02)
    F = Frame(x, y + rad(z0 + .9) + .05, z0, math.pi / 2)                                             # grande porte et perron
    box(Bp, F, -1.05, 1.05, -.6, .05, -.2, 2.5, ECORCE[3], .03)
    quad(Bp, F, [(-.75, .08, 0), (.75, .08, 0), (.75, .08, 1.7), (0, .08, 2.3), (-.75, .08, 1.7)], H('#3a2a1e'), .02)
    for u in (-.9, .9): box(Bp, F, u - .1, u + .1, 0, .3, -.2, 2.0, BOIS, .02)
    for k in range(4): box(Bp, F, -1.3, 1.3, .3 + k * .35, .65 + k * .35, -.4, .35 - k * .12, H('#c8bca4'), .02)
    for zg_, rr in ((4.1, rt * 1.0 + .7), (8.3, rt * .95 + .7)):                                     # galeries de bois
        torus(Bp, x, y, zg_, rr, .12, BOIS, 40, 4)
        vs = []
        for k in range(40):
            a0, a1 = k / 40 * 2 * math.pi, (k + 1) / 40 * 2 * math.pi
            q = [Bp.bm.verts.new(G(x + math.cos(a) * r_, y + math.sin(a) * r_, zg_ - .08)) for a, r_ in ((a0, rr - .75), (a1, rr - .75), (a1, rr + .05), (a0, rr + .05))]
            Bp.bm.faces.new(q); vs += q
        Bp.paint(vs, H('#a07a50'), .03)
        for k in range(14):
            a = k / 14 * 2 * math.pi; vs = C.bm_cyl(Bp.bm, G(x + math.cos(a) * rr, y + math.sin(a) * rr, zg_ - .1), G(x + math.cos(a) * rr, y + math.sin(a) * rr, zg_ + .5), .05, .05, 4); Bp.paint(vs, BOIS, .02)
        torus(Bp, x, y, zg_ + .5, rr, .05, BOIS, 40, 4)
    zt = z0 + h; blobs = []
    for k in range(6):                                                                               # grosses branches
        a = k / 6 * 2 * math.pi + .5; L_ = 5.5 + 1.5 * rnd.random()
        p1 = G(x + math.cos(a) * rt * .6, y + math.sin(a) * rt * .6, zt - 1.0); p2 = G(x + math.cos(a) * L_ * .55, y + math.sin(a) * L_ * .55, zt + 1.6); p3 = G(x + math.cos(a) * L_, y + math.sin(a) * L_, zt + 2.6)
        vs = C.bm_tube(Bp.bm, [p1, p2, p3], lambda t: rt * (.42 - .28 * t), 7); Bp.paint(vs, ECORCE[1], .04); blobs.append(p3)
    blobs.append(G(x, y, zt + 4.0))
    for k in range(16):                                                                              # couronne en dôme
        a = rnd.uniform(0, 2 * math.pi); dd = rnd.uniform(0, 7.5); bz = zt + 3.6 + 2.2 * (1 - dd / 7.5) + rnd.uniform(-.6, .6)
        blobs.append(G(x + math.cos(a) * dd, y + math.sin(a) * dd, bz))
    for p in blobs:
        r = 2.8 + 1.2 * rnd.random(); g = FEUILLE[rnd.randrange(4)]
        vs = C.bm_ico(Bp.bm, p, r, 2, (1, 1, .72), .12, rnd.random() * 9)
        Bp.paint(vs, lambda co, g=g, p=p: C.mix(C.mix(g, (0, .05, .02, 1), .35), C.mix(g, (1, 1, .8, 1), .12), max(0, min(1, (co.z - p.z + 2.0) / 3.5))), .05)
    return zt + 7.0


def angd_(a, b): return abs((a - b + math.pi) % (2 * math.pi) - math.pi)


def maison(B, x, y, z0, ang, w, d, etages, rnd):
    """[I] maison à colombages : murs crème, pans de bois sombres, toit à deux pans de tuiles, cheminée, fenêtres, porte"""
    F = Frame(x, y, z0, ang, (rnd.random() - .5) * .02, 0); he = .8; c = MUR[rnd.randrange(4)]
    hz = he * etages
    box(B, F, -w / 2, w / 2, -d / 2, d / 2, -.5, hz, c, .04)
    for u in (-w / 2, w / 2):
        box(B, F, u - .05, u + .05, d / 2 - .02, d / 2 + .03, 0, hz, POUTRE, .02)
    for z in [he * k for k in range(1, etages + 1)]: box(B, F, -w / 2, w / 2, d / 2 - .02, d / 2 + .03, z - .06, z, POUTRE, .02)
    if w > 1.1: box(B, F, -.04, .04, d / 2 - .02, d / 2 + .03, he, hz, POUTRE, .02)
    for e in range(etages):
        for u in ((-w * .27, w * .27) if w > 1.1 else (w * .2,)):
            if e == 0 and abs(u) < .3: continue
            quad(B, F, [(u - .12, d / 2 + .035, e * he + .3), (u + .12, d / 2 + .035, e * he + .3), (u + .12, d / 2 + .035, e * he + .6), (u - .12, d / 2 + .035, e * he + .6)], VITRE, .02)
    quad(B, F, [(-.16, d / 2 + .035, 0), (.16, d / 2 + .035, 0), (.16, d / 2 + .035, .55), (-.16, d / 2 + .035, .55)], H('#6a4430'), .03)
    prism_x(B, F, -w / 2 - .14, w / 2 + .14, -d / 2 - .14, d / 2 + .14, hz, .55 + .1 * w, TOIT[rnd.randrange(4)])
    if rnd.random() < .7: box(B, F, w * .25 - .09, w * .25 + .09, -d * .2 - .09, -d * .2 + .09, hz, hz + .7, H('#9a8a7a'), .03)
    return hz + .55 + .1 * w


def ferme(B, x, y, z0, ang, s, rnd):
    """[I] ferme : maison, grange de bois rouge à grand toit, meule de foin"""
    F = Frame(x, y, z0, ang)
    maison(B, x + F.t[0] * s * .55, y + F.t[1] * s * .55, z0, ang, 1.2, 1.0, 1, rnd)
    bx, by = x - F.t[0] * s * .5, y - F.t[1] * s * .5; Fb = Frame(bx, by, z0, ang)
    box(B, Fb, -.8, .8, -.65, .65, -.4, 1.0, H('#a0442e'), .04); prism_x(B, Fb, -.95, .95, -.8, .8, 1.0, .75, H('#6a5040'))
    quad(B, Fb, [(-.35, .66, 0), (.35, .66, 0), (.35, .66, .8), (-.35, .66, .8)], H('#5a2a1e'), .02)
    hx, hy = x + F.f[0] * s * .9, y + F.f[1] * s * .9
    revolve(B, hx, hy, [(.45, z0 - .2), (.45, z0 + .4), (.3, z0 + .75), (0, z0 + .85)], H('#d8c070'), 10, False)


def phare(T, x, y, z0, rnd):
    """[I] niveau 4 : phare blanc à bandes rouges, galerie, lanterne lumineuse, maison du gardien"""
    Bp, Bg, Bl = T
    revolve(Bp, x, y, [(1.0, z0 - .5), (1.0, z0 + .4), (.7, z0 + .5), (.6, z0 + 5.6)], lambda co: TOIT[1] if int((co.z - z0) * .9) % 2 else MUR[2], 16, False)
    revolve(Bp, x, y, [(.95, z0 + 5.6), (.95, z0 + 5.8), (.5, z0 + 5.8)], H('#4a4a50'), 16)
    revolve(Bl, x, y, [(.42, z0 + 5.8), (.42, z0 + 6.6)], H('#ffe8a0'), 12, False)
    revolve(Bp, x, y, [(.55, z0 + 6.6), (0, z0 + 7.3)], TOIT[1], 12, False)
    torus(Bp, x, y, z0 + 6.0, .95, .04, H('#4a4a50'), 24, 4)
    F = Frame(x + 1.6, y + .6, z0, 0); box(Bp, F, -.6, .6, -.5, .5, -.3, .8, MUR[0], .03); prism_x(Bp, F, -.7, .7, -.6, .6, .8, .5, TOIT[0])
    return 7.3


def jetee(B, x, y, ang, L_, rnd):
    """[I] jetée de bois sur pieux"""
    F = Frame(x, y, 0, ang)
    box(B, F, -.45, .45, -.8, L_, .25, .4, BOIS, .05, True, True)
    for v in [k * .9 for k in range(int(L_ / .9) + 1)]:
        for u in (-.38, .38): box(B, F, u - .06, u + .06, v - .06, v + .06, -1.0, .3, POUTRE, .02)


def arbre_rond(B, x, y, z, s, rnd):
    vs = C.bm_cyl(B.bm, G(x, y, z - .2), G(x, y, z + .9 * s), .1 * s, .08 * s, 5); B.paint(vs, H('#6a4a30'), .04)
    g = FEUILLE[rnd.randrange(4)]
    vs = C.bm_ico(B.bm, G(x, y, z + 1.4 * s), .7 * s, 1, (1, 1, .9), .12, rnd.random() * 9)
    B.paint(vs, lambda co: C.mix(C.mix(g, (0, .05, .03, 1), .3), g, max(0, min(1, (co.z - z - 1.0 * s) / s))), .05)


def cypres(B, x, y, z, s, rnd):
    vs = C.bm_cyl(B.bm, G(x, y, z - .2), G(x, y, z + .4), .06, .06, 5); B.paint(vs, H('#6b4a30'), .03)
    vs = C.bm_uvsphere(B.bm, G(x, y, z + 1.4 * s), 1, 10, 6, (.32 * s, .32 * s, 1.1 * s)); B.paint(vs, H('#3f6e3a'), .06)
