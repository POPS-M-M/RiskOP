"""RISK OP — kit RÉTROFUTURISTE (Egghead, île 12).
[C] Ville du futur : bâtiments en dômes de verre, en fusées et en manettes de jeu ; panneaux holographiques ; usine centrale ;
œuf géant fendu au-dessus des nuages abritant le laboratoire (bâtiments A, B, C) sur un nuage d'île fabriqué ; deux bandes laser
autour du nuage ; tube de verre entre les deux niveaux ; icebergs et colonnes d'eau chaude autour de l'île ; style « Raygun Gothic »
(One Piece Wiki, « Egghead », consulté le 17/11/2026).
[I] Toutes les formes, couleurs, proportions ; soucoupes sur pied ; colonne de nuage ; pas de tir.
Aucun personnage, robot, Séraphin, monstre, symbole, navire identifiable, ni copie de décor officiel.
Repère : x est, y sud, z haut (jeu) ; Frame de rk_port (v = façade avant).
Les pièces reçoivent un trio de lots T = (peint, verre, lueur) pour que le verre et les lumières suivent le niveau de ville.
"""
import math, random
import rk_common as C
from mathutils import Vector
from rk_port import Frame, box, quad

H = C.hexc
G = C.g2b
COQUE = [H('#f6f2ea'), H('#e8e2d6'), H('#c8c2b6'), H('#8a847a')]
VERRE = [H('#a8dcec'), H('#8ccce2'), H('#d4f0f8')]
PASTEL = [H('#f2a6b8'), H('#9ad0c2'), H('#f4d27a'), H('#b8b0e8'), H('#a8c8f0')]
BLANC, METAL, METAL2 = H('#f4f4f2'), H('#b8c0c8'), H('#8a929c')
ROUGE, BLEU, JAUNE = H('#e04a3a'), H('#3a5aa8'), H('#f4c84a')
CYAN, ROSE_L = H('#28c4e8'), H('#e85ab8')
NUAGE = [H('#ffffff'), H('#f0f6fa'), H('#dce8f0')]
GLACE = [H('#ffffff'), H('#d8eef6'), H('#b8dcec'), H('#8cc4dc')]
FEUILLE = [H('#3e8a3c'), H('#5aa04a'), H('#2f6a34'), H('#4a9640')]
ECORCE = H('#7a5a3a')


def P3(x, y, z): return G(x, y, z)


def torus(B, cx, cy, z, R, r, col, seg=48, sec=6, var=.03):
    rings = []
    for k in range(seg):
        a = k / seg * 2 * math.pi; ca, sa = math.cos(a), math.sin(a)
        rings.append([B.bm.verts.new(G(cx + ca * (R + r * math.cos(b)), cy + sa * (R + r * math.cos(b)), z + r * math.sin(b)))
                      for b in [j / sec * 2 * math.pi for j in range(sec)]])
    for k in range(seg):
        A, Bb = rings[k], rings[(k + 1) % seg]
        for j in range(sec): B.bm.faces.new((A[j], Bb[j], Bb[(j + 1) % sec], A[(j + 1) % sec]))
    vs = [v for r_ in rings for v in r_]; B.paint(vs, col, var); return vs


def revolve(B, cx, cy, prof, col, seg=16, cap_top=True, cap_bot=False, var=.04):
    """surface de révolution : prof = [(rayon, z)…] de bas en haut"""
    rings = [[B.bm.verts.new(G(cx + math.cos(k / seg * 2 * math.pi) * r, cy + math.sin(k / seg * 2 * math.pi) * r, z)) for k in range(seg)] for r, z in prof]
    for i in range(len(rings) - 1):
        for k in range(seg): B.bm.faces.new((rings[i][k], rings[i][(k + 1) % seg], rings[i + 1][(k + 1) % seg], rings[i + 1][k]))
    if cap_top and prof[-1][0] > 1e-3: B.bm.faces.new(rings[-1])
    if cap_bot and prof[0][0] > 1e-3: B.bm.faces.new(list(reversed(rings[0])))
    vs = [v for r_ in rings for v in r_]; B.paint(vs, col, var); return vs


def coupole(B, cx, cy, z0, r, col, seg=16, n=5, k=1.0):
    """demi-sphère (k : aplatissement vertical)"""
    return revolve(B, cx, cy, [(r * math.cos(i / n * math.pi / 2), z0 + k * r * math.sin(i / n * math.pi / 2)) for i in range(n)] + [(0.0, z0 + k * r)], col, seg, False)


# ------------------------------------------------------------------ bâtiments de la Ville du futur
def dome(T, x, y, z0, s, rnd):
    """[C : bâtiments en dômes de verre] socle pastel, coupole de verre, anneau et antenne"""
    Bp, Bg, Bl = T; c = PASTEL[rnd.randrange(5)]
    revolve(Bp, x, y, [(s * 1.04, z0 - .4), (s * 1.04, z0 + .32), (s * .98, z0 + .4)], c, 16)
    coupole(Bg, x, y, z0 + .4, s * .92, lambda co: C.mix(VERRE[1], VERRE[2], max(0, min(1, (co.z - z0) / (s * 1.4)))), 16, 5, 1.0 if s < 1.2 else .85)
    revolve(Bp, x, y, [(s * .3, z0 + .4 + s * .9 - .05), (s * .3, z0 + .4 + s * .9 + .08)], BLANC, 10)
    revolve(Bp, x, y, [(.05, z0 + .4 + s * .9), (.03, z0 + .4 + s * .9 + .9)], METAL, 5)
    revolve(Bl, x, y, [(.0, z0 + s * .9 + 1.28), (.12, z0 + s * .9 + 1.34), (.12, z0 + s * .9 + 1.42), (0, z0 + s * .9 + 1.5)], ROSE_L if rnd.random() < .5 else CYAN, 6)
    return s * .9 + 1.5


def fusee(T, x, y, z0, s, rnd, h=None):
    """[C : bâtiments en forme de fusées] corps cylindrique rayé, hublots, ogive, trois ailerons, tuyère"""
    Bp, Bg, Bl = T; r = s * .8; h = h or (2.4 + rnd.random() * 1.2) * s / .55; c2 = BLEU if rnd.random() < .4 else ROUGE
    band = lambda co: c2 if int((co.z - z0) / (h / 5)) % 2 else BLANC
    revolve(Bp, x, y, [(r * .7, z0 - .4), (r * .75, z0 + .2), (r, z0 + .5), (r, z0 + h)], band, 12, False)
    revolve(Bp, x, y, [(r, z0 + h), (r * .8, z0 + h + .45 * r / .44), (r * .45, z0 + h + .85 * r / .44), (0, z0 + h + 1.05 * r / .44)], c2, 12, False)
    revolve(Bg, x, y, [(r + .02, z0 + h * .72), (r + .02, z0 + h * .8)], VERRE[0], 12, False)          # bande de hublots
    a0 = rnd.random() * 2 * math.pi
    for k in range(3):
        F = Frame(x, y, z0, a0 + k * 2 * math.pi / 3)
        vs = [Bp.bm.verts.new(F.p(u, v, z)) for u, v, z in ((-.04, r * .9, .9), (-.04, r + .55, -.1), (-.04, r + .55, -.4), (-.04, r * .9, -.4))]
        vs2 = [Bp.bm.verts.new(F.p(u, v, z)) for u, v, z in ((.04, r * .9, .9), (.04, r + .55, -.1), (.04, r + .55, -.4), (.04, r * .9, -.4))]
        Bp.bm.faces.new(vs); Bp.bm.faces.new(list(reversed(vs2)))
        for i in range(4): Bp.bm.faces.new((vs[i], vs[(i + 1) % 4], vs2[(i + 1) % 4], vs2[i]))
        Bp.paint(vs + vs2, c2, .03)
    return h + 1.05 * r / .44


def manette(T, x, y, z0, ang, s, rnd):
    """[C : bâtiments en forme de manettes de jeu] corps bas arrondi à deux poignées, croix et boutons colorés sur le toit"""
    Bp, Bg, Bl = T; F = Frame(x, y, z0, ang); c = PASTEL[rnd.randrange(5)]; hh = .75
    box(Bp, F, -.7, .7, -.55, .45, -.4, hh, c, .04)
    for su in (-1, 1):
        cx, cy = x + F.t[0] * su * .85 - F.f[0] * .1, y + F.t[1] * su * .85 - F.f[1] * .1
        revolve(Bp, cx, cy, [(.62, z0 - .4), (.62, z0 + hh - .1), (.5, z0 + hh + .08), (0, z0 + hh + .12)], c, 14, False)
    box(Bp, F, -.62, .62, -.5, .4, hh, hh + .06, BLANC, .02)
    cxx, cyy = x - F.t[0] * .85, y - F.t[1] * .85                                                   # croix
    box(Bp, Frame(cxx, cyy, z0, ang), -.3, .3, -.08, .08, hh + .08, hh + .2, METAL2, .02)
    box(Bp, Frame(cxx, cyy, z0, ang), -.08, .08, -.3, .3, hh + .08, hh + .2, METAL2, .02)
    for k, col in enumerate((ROUGE, BLEU, JAUNE, H('#5ac85a'))):                                      # boutons
        a = k * math.pi / 2; bx_, by_ = x + F.t[0] * .85 + math.cos(a + ang) * .26, y + F.t[1] * .85 + math.sin(a + ang) * .26
        revolve(Bl, bx_, by_, [(.11, z0 + hh + .08), (.11, z0 + hh + .2)], col, 8)
    quad(Bp, F, [(-.22, .46, 0), (.22, .46, 0), (.22, .46, .55), (-.22, .46, .55)], VERRE[1], .02)      # porte vitrée
    for u in (-.45, .45): quad(Bg, F, [(u - .14, .46, .25), (u + .14, .46, .25), (u + .14, .46, .55), (u - .14, .46, .55)], VERRE[0], .02)
    return hh + .2


def soucoupe(T, x, y, z0, s, rnd):
    """[I] soucoupe sur pied : mât, disque plat, coupole de verre, couronne de lumières"""
    Bp, Bg, Bl = T; r = s * 1.15; zs = z0 + 2.0 + rnd.random() * .8; c = PASTEL[rnd.randrange(5)]
    revolve(Bp, x, y, [(.45, z0 - .4), (.45, z0 + .2), (.16, z0 + .5), (.16, zs - .2), (.3, zs - .1)], METAL, 10, False)
    revolve(Bp, x, y, [(.3, zs - .12), (r * .7, zs - .02), (r, zs + .12), (r * .92, zs + .24), (r * .55, zs + .3)], c, 18, True)
    coupole(Bg, x, y, zs + .3, r * .5, VERRE[2], 14, 4, .8)
    for k in range(10):
        a = k / 10 * 2 * math.pi
        vs = C.bm_ico(Bl.bm, G(x + math.cos(a) * r * .97, y + math.sin(a) * r * .97, zs + .13), .07, 1); Bl.paint(vs, JAUNE, .02)
    return zs - z0 + .3 + r * .4


def holo(T, x, y, z0, ang, s, rnd):
    """[C : panneaux holographiques] mât et écran lumineux flottant (cyan ou rose)"""
    Bp, Bg, Bl = T; F = Frame(x, y, z0, ang)
    revolve(Bp, x, y, [(.22, z0 - .3), (.22, z0 + .15), (.06, z0 + .25), (.05, z0 + 1.5)], METAL2, 8, True)
    w = .7 + .3 * rnd.random(); zz = 1.4
    box(Bl, F, -w, w, -.02, .02, zz, zz + w * 1.1, CYAN if rnd.random() < .6 else ROSE_L, .06, True, True)
    box(Bp, F, -w - .05, w + .05, -.04, .04, zz - .06, zz, METAL, .02, True, True)
    return zz + w * 1.1


# ------------------------------------------------------------------ monuments
def place_holo(T, x, y, z0, r):
    """[I] place centrale : bassin rond, colonne holographique, deux anneaux lumineux"""
    Bp, Bg, Bl = T
    revolve(Bp, x, y, [(r * .55, z0 - .2), (r * .55, z0 + .25), (r * .48, z0 + .25), (r * .48, z0 + .1)], BLANC, 24, False)
    revolve(Bg, x, y, [(r * .48, z0 + .12), (0, z0 + .12)], VERRE[1], 24, False)
    revolve(Bp, x, y, [(.45, z0), (.45, z0 + .4), (.3, z0 + .5)], METAL, 12)
    revolve(Bl, x, y, [(.28, z0 + .5), (.2, z0 + 2.4), (0, z0 + 2.7)], CYAN, 10, False)
    torus(Bl, x, y, z0 + 1.6, .8, .05, CYAN, 24, 4); torus(Bl, x, y, z0 + 2.2, .55, .04, ROSE_L, 20, 4)
    return 2.7


def usine(T, x, y, z0, ang, rnd):
    """[C : usine centrale ; aspect I] grand hall à toit en berceau, réservoir sphérique, trois cheminées rayées, conduites"""
    Bp, Bg, Bl = T; F = Frame(x, y, z0, ang)
    box(Bp, F, -2.4, 2.4, -1.6, 1.6, -.5, 1.6, COQUE[1], .04)
    n = 10; rings = []
    for i in range(n + 1):                                                                          # berceau (demi-cylindre le long de u)
        t = math.pi * i / n; vv, zz = -1.6 * math.cos(t), 1.6 + 1.1 * math.sin(t)
        rings.append([Bp.bm.verts.new(F.p(u, vv, zz)) for u in (-2.4, 2.4)])
    for i in range(n): Bp.bm.faces.new((rings[i][0], rings[i][1], rings[i + 1][1], rings[i + 1][0]))
    for su in (0, 1): Bp.bm.faces.new([rings[i][su] for i in range(n + 1)])
    Bp.paint([v for r_ in rings for v in r_], lambda co: PASTEL[4] if int(co.z * 3) % 3 else BLANC, .03)
    for u in (-1.6, -.5, .6, 1.7): quad(Bg, F, [(u - .35, 1.62, .4), (u + .35, 1.62, .4), (u + .35, 1.62, 1.3), (u - .35, 1.62, 1.3)], VERRE[1], .02)
    quad(Bp, F, [(-.5, 1.63, 0), (.5, 1.63, 0), (.5, 1.63, 1.1), (-.5, 1.63, 1.1)], METAL2, .02)
    for k, u in enumerate((-1.6, -.2, 1.2)):                                                         # cheminées
        cx, cy = x + F.t[0] * u - F.f[0] * 2.1, y + F.t[1] * u - F.f[1] * 2.1; hc = 4.2 + k * .5
        revolve(Bp, cx, cy, [(.42, z0 - .3), (.36, z0 + hc)], lambda co, z_=z0 + hc: ROUGE if co.z > z_ - .8 else (BLANC if co.z > z_ - 1.4 else COQUE[2]), 10, False)
        revolve(Bp, cx, cy, [(.36, z0 + hc), (.42, z0 + hc + .15), (.3, z0 + hc + .15)], METAL2, 10, False)
    tx, ty = x + F.t[0] * 3.2 - F.f[0] * .3, y + F.t[1] * 3.2 - F.f[1] * .3                         # réservoir
    revolve(Bp, tx, ty, [(.25, z0 - .2), (.25, z0 + .6)], METAL2, 8)
    vs = C.bm_uvsphere(Bp.bm, G(tx, ty, z0 + 1.6), 1.05, 16, 10); Bp.paint(vs, lambda co: JAUNE if abs(co.z - (z0 + 1.6)) < .15 else COQUE[0], .03)
    vs = C.bm_tube(Bp.bm, [G(tx - F.t[0] * .9, ty - F.t[1] * .9, z0 + 1.4), G(x + F.t[0] * 2.4, y + F.t[1] * 2.4, z0 + 1.4)], lambda t: .14, 6); Bp.paint(vs, METAL, .02)
    return 4.2 + 1.0 + .15


def nuage(B, cx, cy, r, z, rnd, n=None):
    """[C : nuage d'île] disque plat au-dessus, bourrelets bosselés au bord et dessous"""
    n = n or int(2 * math.pi * r / 1.1)
    vs = [B.bm.verts.new(G(cx + math.cos(k / 48 * 2 * math.pi) * r * .96, cy + math.sin(k / 48 * 2 * math.pi) * r * .96, z + .3)) for k in range(48)]
    B.bm.faces.new(vs); B.paint(vs, NUAGE[1], .03)
    for k in range(n):
        a = k / n * 2 * math.pi + rnd.random() * .1; d = r * (.92 + .08 * rnd.random()); s = .9 + .6 * rnd.random()
        vs = C.bm_ico(B.bm, G(cx + math.cos(a) * d, cy + math.sin(a) * d, z + .1 * rnd.random()), s, 2, (1, 1, .7), .15, rnd.random() * 9)
        B.paint(vs, lambda co: C.mix(NUAGE[2], NUAGE[0], max(0, min(1, (co.z - z + .8) / 1.2))), .03)
    for k in range(int(n * .6)):
        a = rnd.random() * 2 * math.pi; d = r * math.sqrt(rnd.random()) * .85; s = 1.0 + .8 * rnd.random()
        vs = C.bm_ico(B.bm, G(cx + math.cos(a) * d, cy + math.sin(a) * d, z - .5 - .4 * rnd.random()), s, 1, (1, 1, .6), .15, rnd.random() * 9)
        B.paint(vs, NUAGE[2], .03)


def colonne_nuage(B, cx, cy, z0, z1, r, rnd):
    """[I] colonne de nuage qui porte le nuage d'île jusqu'au sol"""
    nz = int((z1 - z0) / .9)
    for i in range(nz + 1):
        zz = z0 + (z1 - z0) * i / nz; rr = r * (1 + .25 * (1 - i / nz)); m = 6
        for k in range(m):
            a = k / m * 2 * math.pi + i * .5 + rnd.random() * .3
            vs = C.bm_ico(B.bm, G(cx + math.cos(a) * rr * .7, cy + math.sin(a) * rr * .7, zz), rr * .55 + .2 * rnd.random(), 1, (1, 1, .8), .12, rnd.random() * 9)
            B.paint(vs, C.mix(NUAGE[1], NUAGE[0], i / nz), .02)


def oeuf(B, cx, cy, zb, R, A, rnd, n=44, m=14, th0=.30, thm=.78):
    """[C : œuf géant fendu au-dessus des nuages] coque double (épaisseur), bord supérieur cassé en dents, deux grandes fentes ;
    th0, thm : angles depuis le pôle bas (fractions de π) du bas visible et du bord cassé"""
    zc = zb + A * math.cos(th0 * math.pi); ep = .32
    jag = []
    for k in range(n):
        j = thm + (.05 if k % 2 else -.03) + .03 * (rnd.random() - .5)
        if k in (9, 10, 11, 12, 13): j = thm - (.08, .2, .27, .22, .1)[k - 9]           # fente sud, face à la caméra 2.5D (on voit le laboratoire)
        if k in (30, 31): j = thm - (.12, .08)[k - 30]                                # fente nord-ouest
        jag.append(j)

    def pt(k, i, sc):
        th = (th0 + (jag[k] - th0) * i / m) * math.pi; a = k / n * 2 * math.pi
        rr = (R * sc) * math.sin(th) * (1 + .07 * math.cos(th))
        return G(cx + math.cos(a) * rr, cy + math.sin(a) * rr, zc - (A * sc + (1 - sc) * 0) * math.cos(th))
    out = [[B.bm.verts.new(pt(k, i, 1.0)) for i in range(m + 1)] for k in range(n)]
    inn = [[B.bm.verts.new(pt(k, i, 1 - ep / R)) for i in range(m + 1)] for k in range(n)]
    for k in range(n):
        k2 = (k + 1) % n
        for i in range(m):
            B.bm.faces.new((out[k][i], out[k2][i], out[k2][i + 1], out[k][i + 1]))
            B.bm.faces.new((inn[k][i + 1], inn[k2][i + 1], inn[k2][i], inn[k][i]))
        B.bm.faces.new((out[k][m], out[k2][m], inn[k2][m], inn[k][m]))                # tranche cassée
    allv = [v for c_ in out + inn for v in c_]
    B.paint(allv, lambda co: C.mix(COQUE[2], COQUE[0], max(0, min(1, (co.z - zb) / (A * 1.2)))), .04)
    for c_ in inn: B.paint(c_, COQUE[2], .03)
    for k in range(n): B.paint([out[k][m], inn[k][m]], COQUE[3], .02)
    return zc + A * math.cos((1 - thm) * math.pi)


def labo(T, x, y, z0, kind, rnd):
    """[C : laboratoire, bâtiments A (le plus haut, coupole, trois salles en branches), B, C ; aspect I]"""
    Bp, Bg, Bl = T
    if kind == 'A':
        h = 7.0
        revolve(Bp, x, y, [(1.15, z0 - .2), (1.15, z0 + .5), (1.0, z0 + .6), (.9, z0 + h)], lambda co: PASTEL[4] if int((co.z - z0) * 1.4) % 4 == 0 else BLANC, 16, False)
        revolve(Bg, x, y, [(.93, z0 + 1.2), (.91, z0 + 1.7)], VERRE[0], 16, False); revolve(Bg, x, y, [(.9, z0 + 3.2), (.9, z0 + 3.7)], VERRE[0], 16, False)
        revolve(Bp, x, y, [(.9, z0 + h), (1.25, z0 + h + .15), (1.25, z0 + h + .3)], BLANC, 16)
        coupole(Bg, x, y, z0 + h + .3, 1.1, VERRE[2], 18, 5)
        revolve(Bp, x, y, [(.05, z0 + h + 1.3), (.03, z0 + h + 2.3)], METAL, 5); vs = C.bm_ico(Bl.bm, G(x, y, z0 + h + 2.35), .14, 1); Bl.paint(vs, ROUGE, .02)
        for k in range(3):                                                                           # trois salles en branches
            a = k * 2 * math.pi / 3 + .4; zz = z0 + 2.4 + k * .9; ex, ey = x + math.cos(a) * 2.0, y + math.sin(a) * 2.0
            vs = C.bm_cyl(Bp.bm, G(x + math.cos(a) * .8, y + math.sin(a) * .8, zz), G(ex, ey, zz + .2), .22, .22, 8); Bp.paint(vs, METAL, .02)
            vs = C.bm_uvsphere(Bp.bm, G(ex, ey, zz + .2), .6, 12, 8, (1, 1, .8)); Bp.paint(vs, lambda co, zz=zz: VERRE[1] if co.z > zz + .3 else BLANC, .03)
        return h + 2.35
    if kind == 'B':
        F = Frame(x, y, z0, rnd.random() * 6)
        box(Bp, F, -1.0, 1.0, -.8, .8, -.2, 2.4, BLANC, .03)
        for z in (.6, 1.5): box(Bg, F, -1.02, 1.02, -.82, .82, z, z + .4, VERRE[0], .02, False)
        revolve(Bp, x, y, [(1.1, z0 + 2.4), (1.1, z0 + 2.55)], PASTEL[1], 16); coupole(Bp, x, y, z0 + 2.55, 1.0, PASTEL[1], 16, 4, .6)
        return 3.2
    revolve(Bp, x, y, [(1.0, z0 - .2), (1.0, z0 + 1.6), (.8, z0 + 1.8)], lambda co: PASTEL[0] if co.z > z0 + 1.2 else BLANC, 16, False)
    revolve(Bg, x, y, [(1.02, z0 + .5), (1.02, z0 + 1.0)], VERRE[0], 16, False)
    coupole(Bg, x, y, z0 + 1.8, .8, VERRE[2], 14, 4, .7)
    return 2.4


def tube_verre(T, pts, r):
    """[C : tube de verre entre les deux niveaux] tube transparent sur une courbe, colliers et capsule"""
    Bp, Bg, Bl = T
    cv = C.catmull([G(*p) for p in pts], 6)
    vs = C.bm_tube(Bg.bm, cv, lambda t: r, 10); Bg.paint(vs, VERRE[2], .03)
    for i in range(2, len(cv) - 1, 4):
        T_ = (cv[i + 1] - cv[i - 1]).normalized(); vs = C.bm_cyl(Bp.bm, cv[i] - T_ * .08, cv[i] + T_ * .08, r + .06, r + .06, 10, True); Bp.paint(vs, METAL, .02)
    i = len(cv) // 3; vs = C.bm_uvsphere(Bp.bm, cv[i], r * .7, 8, 6, (1, 1, 1.4)); Bp.paint(vs, ROUGE, .02)
    return cv


def iceberg(B, x, y, s, rnd):
    """[C : icebergs autour de l'île] bloc de glace facetté, sommet blanc, flancs bleutés, à moitié immergé"""
    vs = C.bm_ico(B.bm, G(x, y, -.2 * s), 1.6 * s, 1, (1.0, .8, 1.25), .45, rnd.random() * 9)
    B.paint(vs, lambda co: GLACE[0] if co.z > .9 * s else C.mix(GLACE[3], GLACE[1], max(0, min(1, (co.z + .2) / s))), .04)
    for k in range(2):
        a = rnd.random() * 6.28; vs = C.bm_ico(B.bm, G(x + math.cos(a) * 1.5 * s, y + math.sin(a) * 1.5 * s, -.3 * s), .7 * s, 1, (1, 1, 1.1), .3, rnd.random() * 9)
        B.paint(vs, lambda co: GLACE[0] if co.z > .5 * s else GLACE[2], .04)


def colonne_eau(Be, Bm, x, y, h, rnd):
    """[C : tourbillons d'eau chaude qui montent en colonnes] colonne torsadée d'eau, écume au pied, vapeur au sommet"""
    pts = [G(x + .25 * math.sin(i * .9), y + .25 * math.cos(i * .9), -.3 + h * i / 10) for i in range(11)]
    vs = C.bm_tube(Be.bm, pts, lambda t: .75 - .35 * t + .1 * math.sin(t * 9), 10)
    Be.paint(vs, lambda co: C.mix(H('#6ab4d8'), H('#e8f6fc'), max(0, min(1, co.z / h))), .05)
    torus(Bm, x, y, .05, 1.0, .22, NUAGE[1], 20, 5)
    for k in range(4):
        a = k * 1.6 + rnd.random(); vs = C.bm_ico(Bm.bm, G(x + math.cos(a) * .5, y + math.sin(a) * .5, h + .1 + .35 * k), .55 + .15 * rnd.random(), 1, (1, 1, .8), .15, rnd.random() * 9)
        Bm.paint(vs, NUAGE[1], .03)


def pas_de_tir(T, x, y, z0, ang, rnd):
    """[I] niveau 4 : plate-forme ronde, tour de lancement en treillis, grande fusée rayée"""
    Bp, Bg, Bl = T; F = Frame(x, y, z0, ang)
    revolve(Bp, x, y, [(2.7, z0 - .4), (2.7, z0 + .25), (2.5, z0 + .35)], METAL2, 20)
    torus(Bl, x, y, z0 + .37, 2.3, .05, JAUNE, 32, 4)
    gx, gy = x + F.t[0] * 1.7, y + F.t[1] * 1.7; Fg = Frame(gx, gy, z0, ang)
    for su in (-1, 1):
        for sv in (-1, 1): box(Bp, Fg, su * .4 - .06, su * .4 + .06, sv * .4 - .06, sv * .4 + .06, .3, 8.0, ROUGE, .02)
    for k in range(8):
        z = .9 + k * .95; box(Bp, Fg, -.46, .46, -.46, .46, z, z + .1, ROUGE, .02, True, True)
    for z in (3.0, 5.6): box(Bp, Frame(x, y, z0, ang), .3, 1.4, -.06, .06, z, z + .12, METAL, .02, True, True)
    return fusee(T, x, y, z0 + .35, .62, rnd, h=5.8) + .35


def ponton(B, x, y, ang, L_):
    """[I] jetée : tablier sur pieux"""
    F = Frame(x, y, 0, ang)
    box(B, F, -.45, .45, -.3, L_, .25, .4, METAL, .03, True, True)
    for v in (.6, 1.6, 2.6):
        for u in (-.38, .38): box(B, F, u - .06, u + .06, v - .06, v + .06, -.8, .25, METAL2, .02)


# ------------------------------------------------------------------ végétation tropicale (île climatisée [C])
def arbre_tropical(B, x, y, z, s, rnd):
    vs = C.bm_cyl(B.bm, G(x, y, z - .2), G(x, y, z + 1.2 * s), .14 * s, .1 * s, 5); B.paint(vs, ECORCE, .04)
    g = FEUILLE[rnd.randrange(4)]
    for k in range(2):
        a = rnd.random() * 6.28; d = .25 * s
        vs = C.bm_ico(B.bm, G(x + math.cos(a) * d, y + math.sin(a) * d, z + (1.35 + .3 * k) * s), (.75 - .15 * k) * s, 1, (1, 1, .8), .12, rnd.random() * 9)
        B.paint(vs, lambda co, g=g: C.mix(C.mix(g, (0, .05, .04, 1), .3), g, max(0, min(1, (co.z - z - 1.0 * s) / s))), .05)


def palmier(B, x, y, z, s, rnd):
    bx, by = (rnd.random() - .5) * .6 * s, (rnd.random() - .5) * .6 * s; h = (1.7 + .5 * rnd.random()) * s
    top = G(x + bx, y + by, z + h)
    vs = C.bm_cyl(B.bm, G(x, y, z - .2), top, .09 * s, .06 * s, 4); B.paint(vs, H('#8a6a44'), .04)
    g = FEUILLE[rnd.randrange(4)]
    for k in range(6):
        a = k / 6 * 6.283 + rnd.random() * .3; d = Vector((math.cos(a), -math.sin(a), 0)); side = Vector((-d.y, d.x, 0)) * .18 * s
        tip = top + d * 1.1 * s + Vector((0, 0, -.45 * s)); mid = top + d * .6 * s + Vector((0, 0, .12 * s))
        vs = [B.bm.verts.new(top), B.bm.verts.new(mid + side), B.bm.verts.new(tip), B.bm.verts.new(mid - side)]
        B.bm.faces.new(vs); B.paint(vs, g, .04)
