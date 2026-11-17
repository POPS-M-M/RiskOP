"""RISK OP — kit QUARTIER GÉNÉRAL (Marineford, île 15).
[C] île en croissant faite de briques et d'acier, canons sur les bords ; QG : bâtiment en forteresse surmonté d'une tour à étages de style pagode
japonaise, une petite montagne à chaque coin avec un petit bâtiment ; échafaud au centre ; place Oris ; cloche Ox ; Mur d'encerclement d'acier
avec des fenêtres de tir au sommet (One Piece Wiki, « Marineford », « Marine Headquarters »).
[I] toutes les formes, proportions et couleurs (murs blancs, toits bleu-gris, briques rouges, acier). Ni inscription, ni kanji, ni symbole,
ni drapeau, ni navire, ni personnage, ni copie de décor officiel.
Repère : x est, y sud, z haut (jeu) ; Frame de rk_port (v = façade avant).
"""
import math, random
from mathutils import Vector
import rk_common as C
from rk_port import Frame, box, quad, hip
from rk_retrofutur import revolve

H = C.hexc
G = C.g2b
BRIQUE = [H('#b07a64'), H('#c08a70'), H('#9a6a56'), H('#a8705c')]
ACIER = [H('#8a96a4'), H('#6c7886'), H('#a8b2bc')]
MUR = [H('#f2f0ea'), H('#e4e0d6'), H('#d0ccc2')]
TOIT = [H('#3c5f9e'), H('#4a6aa8'), H('#2e4a7e')]
PIERRE = [H('#d8d0c4'), H('#c4bcb0'), H('#b0a89c')]
VITRE, FER, BRONZE = H('#34485e'), H('#3a3e46'), H('#c89a4a')


def fenetres(B, F, u0, u1, v, z, h, pas=.42, larg=.16):
    n = max(1, int((u1 - u0) / pas))
    for k in range(n):
        u = u0 + (k + .5) * (u1 - u0) / n
        quad(B, F, [(u - larg / 2, v, z), (u + larg / 2, v, z), (u + larg / 2, v, z + h), (u - larg / 2, v, z + h)], VITRE, .02)


def immeuble(B, x, y, z0, ang, w, d, etages, rnd):
    """[C : ville de briques et d'acier] immeuble : rez-de-chaussée de briques, étages blancs ou de briques, bandeaux d'acier, rangées de
    fenêtres sur la façade et un pignon, toit plat à acrotère d'acier ou toit à croupes bleu [I]"""
    F = Frame(x, y, z0, ang); he = .72; brique = BRIQUE[rnd.randrange(4)]; haut = MUR[rnd.randrange(2)] if rnd.random() < .6 else brique
    box(B, F, -w / 2, w / 2, -d / 2, d / 2, -.5, he, brique, .05)
    z = he
    for e in range(1, etages):
        box(B, F, -w / 2 - .03, w / 2 + .03, -d / 2 - .03, d / 2 + .03, z, z + .06, ACIER[0], .03, True, True)
        box(B, F, -w / 2, w / 2, -d / 2, d / 2, z + .06, z + he, haut, .04)
        fenetres(B, F, -w / 2 + .1, w / 2 - .1, d / 2 + .01, z + .26, .3)
        Fs = Frame(x + F.t[0] * (w / 2 + .01), y + F.t[1] * (w / 2 + .01), z0, ang + math.pi / 2)
        fenetres(B, Fs, -d / 2 + .15, d / 2 - .15, 0, z + .26, .3, .5)
        z += he
    quad(B, F, [(-.17, d / 2 + .01, 0), (.17, d / 2 + .01, 0), (.17, d / 2 + .01, .5), (-.17, d / 2 + .01, .5)], FER, .02)
    fenetres(B, F, .3, w / 2 - .1, d / 2 + .01, .2, .32)
    if rnd.random() < .4:
        hip(B, F, -w / 2 - .12, w / 2 + .12, -d / 2 - .12, d / 2 + .12, z, .45, TOIT[rnd.randrange(3)]); return z + .45
    box(B, F, -w / 2 - .04, w / 2 + .04, -d / 2 - .04, d / 2 + .04, z, z + .08, ACIER[1], .03)
    for u0, u1, v0, v1 in ((-w / 2, w / 2, -d / 2, -d / 2 + .08), (-w / 2, w / 2, d / 2 - .08, d / 2), (-w / 2, -w / 2 + .08, -d / 2, d / 2), (w / 2 - .08, w / 2, -d / 2, d / 2)):
        box(B, F, u0, u1, v0, v1, z + .08, z + .22, ACIER[0], .02, True, True)
    if rnd.random() < .35:
        cx, cy = x - F.t[0] * w * .2, y - F.t[1] * w * .2
        revolve(B, cx, cy, [(.16, z0 + z), (.16, z0 + z + .35), (.2, z0 + z + .4)], ACIER[1], 8)
    return z + .22


def qg(T, x, y, z0, rnd):
    """[C : grand bâtiment en forteresse surmonté d'une tour à étages de style pagode japonaise] [I] forteresse blanche à soubassement d'acier,
    rangées de fenêtres, porche, tour à cinq étages à toits bleus débordants, flèche ; aucune inscription ni aucun symbole"""
    Bp, Bg, Bl = T; F = Frame(x, y, z0, math.pi / 2)
    box(Bp, F, -4.4, 4.4, -3.3, 3.3, -.6, .7, ACIER[1], .04)                                         # soubassement
    box(Bp, F, -4.2, 4.2, -3.1, 3.1, .7, 3.4, MUR[0], .03)
    for z in (1.2, 2.2): fenetres(Bg, F, -4.0, 4.0, 3.11, z, .55, .5, .22)
    for s in (-1, 1):
        Fs = Frame(x + F.t[0] * s * 4.21, y + F.t[1] * s * 4.21, z0, math.pi / 2 + s * math.pi / 2)
        for z in (1.2, 2.2): fenetres(Bg, Fs, -2.9, 2.9, 0, z, .55, .5, .22)
    box(Bp, F, -4.35, 4.35, -3.25, 3.25, 3.4, 3.6, ACIER[0], .03)
    for su in (-1, 1):                                                                              # tours d'angle de la forteresse
        for sv in (-1, 1):
            tx, ty = x + F.t[0] * su * 4.0 + F.f[0] * sv * 2.9, y + F.t[1] * su * 4.0 + F.f[1] * sv * 2.9
            box(Bp, Frame(tx, ty, z0, math.pi / 2), -.75, .75, -.75, .75, -.3, 4.2, MUR[1], .03)
            hip(Bp, Frame(tx, ty, z0, math.pi / 2), -.95, .95, -.95, .95, 4.2, .6, TOIT[0])
    box(Bp, F, -1.3, 1.3, 3.1, 3.9, 0, 2.2, MUR[1], .03); quad(Bp, F, [(-.6, 3.91, 0), (.6, 3.91, 0), (.6, 3.91, 1.6), (-.6, 3.91, 1.6)], FER, .02)
    hip(Bp, F, -1.55, 1.55, 2.9, 4.15, 2.2, .5, TOIT[0])
    for k in range(5): box(Bp, F, -1.6, 1.6, 3.9 + k * .35, 4.25 + k * .35, -.6, -.0 - k * .12 + .02, PIERRE[1], .03)   # marches
    z = 3.6; w = 4.4; d_ = 3.4                                                                      # tour-pagode
    for et in range(5):
        hz = 1.25 - .08 * et
        box(Bp, F, -w / 2, w / 2, -d_ / 2, d_ / 2, z, z + hz, MUR[0], .03)
        box(Bp, F, -w / 2 - .02, w / 2 + .02, -d_ / 2 - .02, d_ / 2 + .02, z, z + .12, H('#7a4a3a'), .02, True, True)
        fenetres(Bg, F, -w / 2 + .2, w / 2 - .2, d_ / 2 + .01, z + .35, hz - .65, .45, .2)
        hip(Bp, F, -w / 2 - .55, w / 2 + .55, -d_ / 2 - .55, d_ / 2 + .55, z + hz, .6, TOIT[et % 2])
        z += hz + .45; w *= .8; d_ *= .8
    vs = C.bm_cyl(Bp.bm, F.p(0, 0, z - .3), F.p(0, 0, z + 1.6), .12, .03, 6); Bp.paint(vs, BRONZE, .02)
    return z + 1.6


def pavillon_montagne(B, x, y, z0, ang, rnd):
    """[C : petit bâtiment au sommet de chaque montagne] [I] pavillon blanc à toit bleu (sans drapeau)"""
    F = Frame(x, y, z0, ang)
    box(B, F, -.6, .6, -.5, .5, -.3, .8, MUR[0], .03); fenetres(B, F, -.5, .5, .51, .3, .3, .35, .14)
    hip(B, F, -.8, .8, -.7, .7, .8, .5, TOIT[0])
    return 1.3


def echafaud(B, x, y, z0, rnd):
    """[C : échafaud d'exécution au centre de l'île] [I] socle de pierre, quatre piliers d'acier, croisillons, plate-forme haute à garde-corps"""
    F = Frame(x, y, z0, math.pi / 2); zt = 5.8
    box(B, F, -1.5, 1.5, -1.5, 1.5, -.4, .5, PIERRE[1], .03); box(B, F, -1.2, 1.2, -1.2, 1.2, .5, .8, PIERRE[0], .03)
    for su in (-1, 1):
        for sv in (-1, 1): box(B, F, su * .85 - .12, su * .85 + .12, sv * .85 - .12, sv * .85 + .12, .8, zt, ACIER[1], .02)
    for z in (2.2, 3.7):
        for sv in (-1, 1): box(B, F, -.9, .9, sv * .85 - .05, sv * .85 + .05, z, z + .12, ACIER[0], .02, True, True)
        for su in (-1, 1): box(B, F, su * .85 - .05, su * .85 + .05, -.9, .9, z, z + .12, ACIER[0], .02, True, True)
    box(B, F, -1.25, 1.25, -1.25, 1.25, zt, zt + .25, H('#7a5a40'), .03)
    for u0, u1, v0, v1 in ((-1.25, 1.25, -1.25, -1.17), (-1.25, 1.25, 1.17, 1.25), (-1.25, -1.17, -1.25, 1.25), (1.17, 1.25, -1.25, 1.25)):
        box(B, F, u0, u1, v0, v1, zt + .25, zt + .65, ACIER[1], .02, True, True)
    for k in range(6): box(B, F, -.45, .45, 1.5 + k * .3, 1.8 + k * .3, -.4, .8 - k * .13, PIERRE[1], .02)   # marches du socle
    return zt + .65


def cloche(B, x, y, z0, rnd):
    """[C : cloche Ox à l'avant de la place] [I] deux piliers de pierre, linteau, petit toit, grosse cloche de bronze"""
    F = Frame(x, y, z0, math.pi / 2)
    for su in (-1, 1): box(B, F, su * 1.0 - .2, su * 1.0 + .2, -.25, .25, -.3, 2.6, PIERRE[0], .03)
    box(B, F, -1.3, 1.3, -.3, .3, 2.6, 2.85, PIERRE[1], .03); hip(B, F, -1.5, 1.5, -.55, .55, 2.85, .45, TOIT[0])
    revolve(B, x, y, [(.05, z0 + 2.6), (.22, z0 + 2.55), (.35, z0 + 2.3), (.42, z0 + 1.8), (.6, z0 + 1.35), (.62, z0 + 1.3), (0, z0 + 1.3)], BRONZE, 14, False)
    return 3.3


def canon(B, x, y, z0, ang, rnd):
    """[C : canons sur les bords] affût, roues, fût de fer pointé vers le large"""
    F = Frame(x, y, z0, ang)
    box(B, F, -.22, .22, -.32, .25, -.1, .25, H('#6a4a34'), .03)
    for su in (-1, 1):
        vs = C.bm_cyl(B.bm, F.p(su * .24, 0, .14), F.p(su * .3, 0, .14), .16, .16, 8); B.paint(vs, FER, .02)
    vs = C.bm_cyl(B.bm, F.p(0, -.3, .32), F.p(0, .75, .45), .1, .07, 8); B.paint(vs, FER, .02)


def mur_encerclement(B, cx, cy, r, a0, a1, z0, h, rnd):
    """[C : Mur d'encerclement, épais et hauts murs d'acier sortis de la mer, canons aux fenêtres du sommet] [I] arc d'un seul tenant :
    faces intérieure, extérieure et dessus ; bandeaux ; fenêtres de tir sombres sur la face tournée vers la baie"""
    n = max(8, int(abs(a1 - a0) * r / .8)); ep = .45; rows = []
    for k in range(n + 1):
        a = a0 + (a1 - a0) * k / n
        rows.append([B.bm.verts.new(G(cx + math.cos(a) * rr, cy + math.sin(a) * rr, zz)) for rr, zz in ((r - ep, z0), (r - ep, z0 + h), (r, z0 + h), (r, z0))])
    for k in range(n):
        A, Bb = rows[k], rows[k + 1]
        for i in range(3): B.bm.faces.new((A[i], Bb[i], Bb[i + 1], A[i + 1]))
    B.bm.faces.new(rows[0]); B.bm.faces.new(list(reversed(rows[-1])))
    B.paint([v for r_ in rows for v in r_], lambda co: ACIER[2] if co.z > z0 + h - .05 else ACIER[0 if int((co.z - z0) * 1.6) % 2 else 1], .04)
    for k in range(n):
        if k % 2: continue
        a = a0 + (a1 - a0) * (k + .5) / n; F = Frame(cx + math.cos(a) * (r - ep - .01), cy + math.sin(a) * (r - ep - .01), z0, a + math.pi)
        quad(B, F, [(-.18, 0, h - .75), (.18, 0, h - .75), (.18, 0, h - .35), (-.18, 0, h - .35)], FER, .02)


def jetee(B, x, y, ang, L_, rnd):
    """[I] quai de pierre et d'acier dans la baie, bittes"""
    F = Frame(x, y, 0, ang)
    box(B, F, -.6, .6, -.8, L_, .1, .5, PIERRE[1], .04)
    for v in [k * 1.0 for k in range(int(L_) + 1)]:
        for u in (-.5, .5): box(B, F, u - .08, u + .08, v - .08, v + .08, -.9, .1, ACIER[1], .02)
    for v in (L_ * .4, L_ * .8):
        for u in (-.45, .45):
            vs = C.bm_cyl(B.bm, F.p(u, v, .5), F.p(u, v, .75), .08, .06, 6); B.paint(vs, FER, .02)


def arbre_rond(B, x, y, z, s, rnd):
    """[C : petite ville arborée] arbre rond"""
    vs = C.bm_cyl(B.bm, G(x, y, z - .2), G(x, y, z + .9 * s), .1 * s, .08 * s, 5); B.paint(vs, H('#6a4a30'), .04)
    g = [H('#4a8a44'), H('#5a9a50'), H('#3a7038')][rnd.randrange(3)]
    vs = C.bm_ico(B.bm, G(x, y, z + 1.35 * s), .65 * s, 1, (1, 1, .9), .12, rnd.random() * 9)
    B.paint(vs, lambda co: C.mix(C.mix(g, (0, .05, .03, 1), .3), g, max(0, min(1, (co.z - z - 1.0 * s) / s))), .05)
