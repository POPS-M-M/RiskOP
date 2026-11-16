"""RISK OP — kit NORDIQUE SUR ARBRE GÉANT (Elbaph, île 11).
[C] Arbre au Trésor Adam colossal, branches portant des étages de terre ; maisons de bois, tours de guet, châteaux de pierre, ports ;
château bâti dans un arbre immense au bord d'une falaise ; bibliothèque sur une branche au-dessus d'un lac ; installation ancienne
dans l'arbre ; épée géante plantée ; cascades vers des lacs de nuage ; arc-en-ciel vers le port ; pont de corde ; neige ; pins géants
(One Piece Wiki). Culture viking [C] ; aspect viking des bâtiments [I] : longues maisons de bois sombre, toits de gazon ou de bardeaux
enneigés, pignons croisés. Aucun personnage, aucun géant, aucune bête, aucun emblème, aucune brique de jouet, aucune copie de décor officiel.
Repère : x est, y sud, z haut (jeu) ; Frame de rk_port (v = façade avant).
"""
import math, random
import rk_common as C
import rk_lib as L
from rk_port import Frame, box, quad, hip, prism_x, window

H = C.hexc
ECORCE = [H('#6a5038'), H('#7a5e42'), H('#584230')]
FEUILLE = [H('#3e7a3c'), H('#4f8a44'), H('#2f6234')]
NEIGE = [H('#f4f6f8'), H('#e6ecf2'), H('#d8e0e8')]
BOIS = [H('#5a3e2a'), H('#7a5634'), H('#8a6a44'), H('#4a3424')]
GAZON = H('#6a8a4a')
PIERRE = [H('#9a9a94'), H('#84847e'), H('#b0aea6'), H('#74746e')]
ACIER = [H('#b8c0c8'), H('#9aa4ae'), H('#d4dade')]
NUAGE = [H('#ffffff'), H('#eef4f8'), H('#d8e4ee')]


def enneige(col, z_neige):
    """blanc au-dessus de z_neige (neige posée sur les toits et les sommets)"""
    return lambda co: NEIGE[0] if co.z > z_neige else col


def longue_maison(B, x, y, z0, ang, w, d, rnd, h=.55, toit=None):
    """[I, style viking] longue maison : murs de planches sombres, toit à deux pans de gazon ou de bardeaux, neige au faîte, pignons croisés"""
    F = Frame(x, y, z0, ang); bois = BOIS[rnd.randrange(4)]
    box(B, F, -w / 2, w / 2, -d / 2, d / 2, -.4, h, bois, .05)
    for k in range(int(w / .3)):
        u = -w / 2 + .15 + k * .3; quad(B, F, [(u - .01, d / 2 + .01, 0), (u + .01, d / 2 + .01, 0), (u + .01, d / 2 + .01, h), (u - .01, d / 2 + .01, h)], BOIS[3], .02)
    quad(B, F, [(-.14, d / 2 + .02, 0), (.14, d / 2 + .02, 0), (.14, d / 2 + .02, h * .8), (-.14, d / 2 + .02, h * .8)], BOIS[3], .02)
    tc = toit or (GAZON if rnd.random() < .5 else BOIS[0]); hr = .42 * d + .2
    vs = prism_x(B, F, -w / 2 - .12, w / 2 + .12, -d / 2 - .16, d / 2 + .16, h, hr, tc); B.paint(vs, enneige(tc, F.z0 + h + hr * .62), .04)
    for s in (-1, 1):                                                                    # pignons croisés
        for sg in (-1, 1): box(B, F, s * (w / 2 + .1) - .03, s * (w / 2 + .1) + .03, sg * .12 - .03, sg * .12 + .03, h + hr - .05, h + hr + .3, BOIS[1], .02)
    return h + hr + .3


def maison(B, x, y, z0, ang, w, d, rnd):
    """[I] maison de bois à toit raide enneigé, cheminée de pierre"""
    F = Frame(x, y, z0, ang); bois = BOIS[rnd.randrange(4)]; h = .6
    box(B, F, -w / 2, w / 2, -d / 2, d / 2, -.4, h, bois, .05)
    window(B, F, -w / 4, d / 2, h * .55, .16, .18); quad(B, F, [(.05, d / 2 + .02, 0), (.3, d / 2 + .02, 0), (.3, d / 2 + .02, .45), (.05, d / 2 + .02, .45)], BOIS[3], .02)
    tc = BOIS[0] if rnd.random() < .6 else GAZON; hr = .55 * d + .15
    vs = prism_x(B, F, -w / 2 - .1, w / 2 + .1, -d / 2 - .12, d / 2 + .12, h, hr, tc); B.paint(vs, enneige(tc, F.z0 + h + hr * .5), .04)
    box(B, F, w / 4 - .08, w / 4 + .08, -.1, .1, h, h + hr + .2, PIERRE[1], .03)
    return h + hr + .2


def guet(B, x, y, z0, ang, w, d, rnd):
    """[C : tours de guet ; aspect I] tour de bois sur socle de pierre, toit pointu enneigé"""
    F = Frame(x, y, z0, ang)
    box(B, F, -.42, .42, -.42, .42, -.5, .35, PIERRE[0], .04)
    for su in (-1, 1):
        for sv in (-1, 1): box(B, F, su * .3 - .05, su * .3 + .05, sv * .3 - .05, sv * .3 + .05, .35, 2.0, BOIS[1], .03)
    box(B, F, -.42, .42, -.42, .42, 1.95, 2.05, BOIS[0], .03)
    box(B, F, -.38, .38, -.38, .38, 2.05, 2.45, BOIS[2], .03)
    vs = C.bm_cyl(B.bm, F.p(0, 0, 2.45), F.p(0, 0, 3.3), .58, .02, 4); B.paint(vs, enneige(BOIS[0], F.z0 + 2.95), .03)
    return 3.3


def grande_halle(B, x, y, z0, ang, rnd):
    """[I] niveau 4 : grande halle des fêtes, longue de 3,6, toit haut à bardeaux enneigé, poteaux sculptés, portes doubles"""
    F = Frame(x, y, z0, ang); h = 1.0
    box(B, F, -1.8, 1.8, -.9, .9, -.4, h, BOIS[3], .04)
    for u in (-1.4, -.7, 0, .7, 1.4): box(B, F, u - .07, u + .07, .9, 1.0, -.2, h + .1, BOIS[1], .02)
    quad(B, F, [(-.3, .92, 0), (.3, .92, 0), (.3, .92, .8), (-.3, .92, .8)], BOIS[0], .02)
    vs = prism_x(B, F, -1.95, 1.95, -1.1, 1.1, h, 1.2, BOIS[0]); B.paint(vs, enneige(BOIS[0], F.z0 + h + .8), .04)
    for s in (-1, 1):
        for sg in (-1, 1): box(B, F, s * 1.95 - .04, s * 1.95 + .04, sg * .18 - .04, sg * .18 + .04, h + 1.1, h + 1.65, BOIS[2], .02)
    return h + 1.65


def plateforme(B, cx, cy, r, z, k, ep=1.1, wob=None, col_dessus=None):
    """[C : les branches forment des étages de terre] plateforme épaisse au contour irrégulier : dessus d'herbe enneigé, tranche et dessous d'écorce"""
    n = 56; ring_t, ring_b = [], []
    for i in range(n):
        a = i / n * 2 * math.pi; rr = r * (wob(a, k) if wob else 1); x, y = cx + math.cos(a) * rr, cy + math.sin(a) * rr
        ring_t.append(B.bm.verts.new(C.g2b(x, y, z))); ring_b.append(B.bm.verts.new(C.g2b(cx + math.cos(a) * rr * .8, cy + math.sin(a) * rr * .8, z - ep - .6 * abs(math.sin(a * 3)))))
    B.bm.faces.new(ring_t); B.bm.faces.new(list(reversed(ring_b)))                    # dessus et dessous d'un seul tenant (pas d'arêtes en étoile au rendu)
    for i in range(n):
        j = (i + 1) % n; B.bm.faces.new((ring_t[i], ring_b[i], ring_b[j], ring_t[j]))
    dessus = col_dessus or (lambda co: C.mix(H('#7aa05a'), NEIGE[1], .55 if math.sin(co.x * 1.3) * math.cos(co.y * 1.1) > .35 else 0))
    B.paint(ring_t, lambda co: dessus(co) if co.z > z - .05 else ECORCE[0], .05)
    B.paint(ring_b, lambda co: C.mix(ECORCE[1], ECORCE[2], .5 + .5 * math.sin(co.z * 4)), .06)


def arbre_adam(B, x, y, z0, r, h, branches, rnd):
    """[C] Arbre au Trésor Adam : fût colossal à contreforts de racines, branches vers les plateformes, cimes (Heaven World) enneigées.
    branches : liste de (x, y, z) des points d'attache sous les plateformes. Rend la hauteur des cimes."""
    vs = C.bm_tube(B.bm, [C.g2b(x, y, z0 - 1.0), C.g2b(x, y, z0 + h * .45), C.g2b(x + .3, y - .2, z0 + h * .8), C.g2b(x + .2, y - .3, z0 + h * .92)],
                   lambda t: r * (1.25 - .55 * t), 18)
    B.paint(vs, lambda co: C.mix(ECORCE[0], ECORCE[2], .5 + .5 * math.sin(math.atan2(co.y - (-y), co.x - x) * 9 + co.z * .3)), .05)
    for k in range(9):                                                                        # contreforts de racines
        a = k / 9 * 2 * math.pi + rnd.random() * .2; dx, dy = math.cos(a), math.sin(a)
        pts = [C.g2b(x + dx * r * .8, y + dy * r * .8, z0 + 3.0), C.g2b(x + dx * (r + 2.2), y + dy * (r + 2.2), z0 + .8), C.g2b(x + dx * (r + 4.5), y + dy * (r + 4.5), z0 - 1.2)]
        vs = C.bm_tube(B.bm, pts, lambda t: (1.1 - .6 * t), 7); B.paint(vs, ECORCE[1], .05)
    for bx, by, bz in branches:                                                               # maîtresses branches
        a = math.atan2(by - y, bx - x); s = C.g2b(x + math.cos(a) * r * .6, y + math.sin(a) * r * .6, bz - 2.5)
        m = C.g2b(x + (bx - x) * .55, y + (by - y) * .55, bz - 2.2); e = C.g2b(bx, by, bz - 1.4)
        vs = C.bm_tube(B.bm, [s, m, e], lambda t: (1.5 - .8 * t), 10); B.paint(vs, ECORCE[0], .05)
    zt = z0 + h * .9
    for k in range(4):                                                                        # hautes branches nues sous la couronne
        a = k / 4 * 2 * math.pi + .4; vs = C.bm_tube(B.bm, [C.g2b(x, y, zt - 4), C.g2b(x + math.cos(a) * 5, y + math.sin(a) * 5, zt - .5)], lambda t: .9 - .5 * t, 6); B.paint(vs, ECORCE[2], .05)
    for k in range(14):                                                                       # cimes : Heaven World [C : peu connu]
        a = k / 14 * 2 * math.pi + rnd.random() * .3; d = 3.5 + 4.5 * (k % 3) / 2
        c = C.g2b(x + math.cos(a) * d, y + math.sin(a) * d, zt + rnd.uniform(-.6, 2.2))
        vs = C.bm_ico(B.bm, c, 3.4 + rnd.random(), 1, (1, 1, .5), .25, rnd.random() * 9)
        B.paint(vs, (lambda cz: lambda co: NEIGE[1] if co.z > cz + 1.0 else C.mix(FEUILLE[0], FEUILLE[2], .5 + .5 * math.sin(co.x)))(c[2]), .06)
    vs = C.bm_ico(B.bm, C.g2b(x, y, zt + 2.6), 4.2, 1, (1, 1, .55), .25, 3); B.paint(vs, lambda co: NEIGE[0] if co.z > zt + 3.4 else FEUILLE[1], .05)
    return zt + 4.9 - z0


def installation_ancienne(B, x, y, z0, ang):
    """[C : installation ancienne bâtie dans l'arbre, faite pour des géants ; aspect I] grande façade de pierre et porte, marches"""
    F = Frame(x, y, z0, ang)
    box(B, F, -2.2, 2.2, -1.0, .4, -.6, 4.2, PIERRE[3], .04)
    for s in (-1, 1): box(B, F, s * 1.6 - .35, s * 1.6 + .35, .3, .65, -.4, 4.4, PIERRE[2], .03)
    quad(B, F, [(-.9, .42, 0), (.9, .42, 0), (.9, .42, 2.9), (-.9, .42, 2.9)], H('#2a2a2c'), .02)
    box(B, F, -1.2, 1.2, .3, .6, 2.9, 3.4, PIERRE[0], .03)
    for k in range(4): box(B, F, -1.4 + k * .1, 1.4 - k * .1, .6 + k * .35, .95 + k * .35, -.6, .3 - k * .25, PIERRE[1], .03)


def chateau_pierre(B, x, y, z0, ang, rnd, ruine=False):
    """[C : châteaux de pierre ; aspect I] donjon carré, quatre tours rondes à toits coniques enneigés, courtine. ruine : pans effondrés"""
    F = Frame(x, y, z0, ang)
    for su in (-1, 1):
        for sv in (-1, 1):
            if ruine and su > 0 and sv > 0: continue
            px, py = F.p(su * 1.6, sv * 1.6, 0)[0], -F.p(su * 1.6, sv * 1.6, 0)[1]
            vs = C.bm_cyl(B.bm, C.g2b(px, py, z0 - .8), C.g2b(px, py, z0 + 2.4), .55, .5, 10); B.paint(vs, PIERRE[0], .04)
            vs = C.bm_cyl(B.bm, C.g2b(px, py, z0 + 2.4), C.g2b(px, py, z0 + 3.5), .68, .02, 10); B.paint(vs, enneige(BOIS[3], z0 + 3.0), .03)
    for (u0, u1, v0, v1) in ((-1.6, 1.6, -1.75, -1.45), (-1.6, 1.6, 1.45, 1.75), (-1.75, -1.45, -1.6, 1.6), (1.45, 1.75, -1.6, 1.6)):
        top = 1.5 if not (ruine and (u0 > 0 or v0 > 0)) else .6
        box(B, F, u0, u1, v0, v1, -.6, top, PIERRE[1], .04)
    box(B, F, -.9, .9, -.9, .9, -.6, 3.4 if not ruine else 2.2, PIERRE[2], .03)
    if not ruine:
        hip(B, F, -1.05, 1.05, -1.05, 1.05, 3.4, 1.2, BOIS[3]); vs = C.bm_ico(B.bm, F.p(0, 0, 4.3), .3, 1); B.paint(vs, NEIGE[0], .02)
    else:
        for k in range(10):
            vs = C.bm_ico(B.bm, F.p(rnd.uniform(.4, 2.2), rnd.uniform(.4, 2.2), 0), rnd.uniform(.2, .4), 0, (1.3, 1, .7)); B.paint(vs, PIERRE[k % 4], .05)
    for u in (-.5, .5): window(B, F, u, .9, 2.4 if not ruine else 1.6, .18, .3)
    return 4.6 if not ruine else 3.5


def arbre_geant(B, x, y, z, s, rnd):
    """[C : château d'Aurust bâti dans un arbre immense] arbre immense isolé, couronne large enneigée"""
    vs = C.bm_tube(B.bm, [C.g2b(x, y, z - 1), C.g2b(x + .2, y, z + 4 * s), C.g2b(x, y + .2, z + 6.5 * s)], lambda t: (1.1 - .5 * t) * s, 10); B.paint(vs, ECORCE[1], .05)
    for k in range(5):
        a = k * 1.256 + rnd.random() * .4; c = C.g2b(x + math.cos(a) * 1.8 * s, y + math.sin(a) * 1.8 * s, z + (6.2 + rnd.random()) * s)
        vs = C.bm_ico(B.bm, c, 2.0 * s, 1, (1, 1, .55), .25, rnd.random() * 9); B.paint(vs, (lambda cz: lambda co: NEIGE[1] if co.z > cz + .6 * s else FEUILLE[k % 3])(c[2]), .06)


def bibliotheque(B, x, y, z0, ang, rnd):
    """[C : bibliothèque sur une branche au-dessus de la Source ; aspect I] grande salle de bois et pierre, hautes fenêtres, toit enneigé"""
    F = Frame(x, y, z0, ang)
    box(B, F, -1.6, 1.6, -1.0, 1.0, -.3, 1.6, PIERRE[2], .03)
    for k in range(5):
        u = -1.2 + k * .6; window(B, F, u, 1.0, .85, .26, .9)
    quad(B, F, [(-.25, 1.02, 0), (.25, 1.02, 0), (.25, 1.02, .7), (-.25, 1.02, .7)], BOIS[0], .02)
    vs = prism_x(B, F, -1.75, 1.75, -1.15, 1.15, 1.6, 1.0, BOIS[3]); B.paint(vs, enneige(BOIS[3], F.z0 + 2.3), .03)
    vs = C.bm_cyl(B.bm, F.p(0, 0, 2.4), F.p(0, 0, 3.2), .45, .45, 10); B.paint(vs, PIERRE[0], .03)
    vs = C.bm_cyl(B.bm, F.p(0, 0, 3.2), F.p(0, 0, 3.9), .6, .02, 10); B.paint(vs, enneige(BOIS[3], F.z0 + 3.55), .03)
    return 3.9


def ecole(B, x, y, z0, ang, rnd):
    """[C : grande école près de la bibliothèque ; aspect I] bâtiment en L, toits enneigés, cour"""
    F = Frame(x, y, z0, ang)
    longue_maison(B, x, y, z0, ang, 3.0, 1.2, rnd, h=.9, toit=BOIS[0])
    G = Frame(*(lambda p: (p[0], -p[1]))(F.p(1.2, -1.1, 0)), z0, ang + math.pi / 2)
    longue_maison(B, *(lambda p: (p[0], -p[1]))(F.p(1.2, -1.1, 0)), z0, ang + math.pi / 2, 1.8, 1.1, rnd, h=.9, toit=BOIS[0])


def epee(B, x, y, z_bas, z_garde, ang):
    """[C] épée géante qui semble transpercer le Sun World jusqu'à l'Underworld : lame, garde, poignée, pommeau"""
    F = Frame(x, y, 0, ang)
    vs = [B.bm.verts.new(F.p(u, v, z)) for z in (z_bas, z_garde) for (u, v) in ((-.5, 0), (0, -.12), (.5, 0), (0, .12))]
    for i in range(4):
        j = (i + 1) % 4; B.bm.faces.new((vs[i], vs[j], vs[4 + j], vs[4 + i]))
    B.bm.faces.new(vs[4:8]); B.paint(vs, lambda co: ACIER[2] if abs(co.z) > 0 and int(co.z * 2) % 7 == 0 else ACIER[0], .03)
    box(B, F, -1.6, 1.6, -.25, .25, z_garde, z_garde + .4, ACIER[1], .03)
    vs = C.bm_cyl(B.bm, F.p(0, 0, z_garde + .4), F.p(0, 0, z_garde + 2.4), .2, .2, 8); B.paint(vs, H('#3a2a20'), .03)
    vs = C.bm_ico(B.bm, F.p(0, 0, z_garde + 2.6), .34, 1); B.paint(vs, ACIER[1], .03)
    return z_garde + 2.9


def pin_geant(B, x, y, z, s, rnd):
    """[C : pins géants] pin à étages coniques, neige sur les pointes"""
    vs = C.bm_cyl(B.bm, C.g2b(x, y, z - .3), C.g2b(x, y, z + .6 * s), .14 * s, .1 * s, 5); B.paint(vs, ECORCE[2], .04)
    g = C.mix(H('#1f4a34'), H('#2c5a3c'), rnd.random())
    for k in range(3):
        z0 = z + (.45 + k * .75) * s; zt = z0 + 1.25 * s
        vs = C.bm_cyl(B.bm, C.g2b(x, y, z0), C.g2b(x, y, zt), (.95 - k * .22) * s, .03, 7)
        B.paint(vs, (lambda zz: lambda co: NEIGE[1] if co.z > zz else g)(zt - .45 * s), .05)


def feuillu(B, x, y, z, s, rnd):
    vs = C.bm_cyl(B.bm, C.g2b(x, y, z - .2), C.g2b(x, y, z + .8 * s), .1 * s, .07 * s, 5); B.paint(vs, ECORCE[2], .04)
    vs = C.bm_ico(B.bm, C.g2b(x, y, z + 1.15 * s), .7 * s, 1, (1, 1, .8)); B.paint(vs, lambda co: NEIGE[1] if co.z > z + 1.45 * s else FEUILLE[1], .06)


def cascade_nuage(B, x, y, z_haut, z_bas, ang, w, rnd):
    """[C] cascade qui tombe des branches vers un lac de nuage : rideau d'eau blanche, nuages en pied"""
    F = Frame(x, y, 0, ang)
    for k in range(3):
        u0 = -w / 2 + k * w / 3
        quad(B, F, [(u0, .05 * k, z_bas + .5), (u0 + w / 3, .05 * k, z_bas + .5), (u0 + w / 3, 0, z_haut), (u0, 0, z_haut)], C.mix(H('#e8f4fa'), H('#bcdcec'), (k % 2) * .5), .05)
    for k in range(6):
        vs = C.bm_ico(B.bm, F.p(rnd.uniform(-w, w), rnd.uniform(-.3, .8), z_bas + rnd.uniform(.2, .7)), rnd.uniform(.6, 1.0), 1, (1.3, 1.3, .55), .2, rnd.random() * 9)
        B.paint(vs, NUAGE[k % 3], .02)


def nuage_plat(B, cx, cy, r, z, rnd, n=7):
    """[C : lacs de nuage] nappe de nuage posée sur une plateforme"""
    for k in range(n):
        a = rnd.uniform(0, 2 * math.pi); d = r * math.sqrt(rnd.random()) * .8
        vs = C.bm_ico(B.bm, C.g2b(cx + math.cos(a) * d, cy + math.sin(a) * d, z + .05), r * rnd.uniform(.35, .55), 1, (1.3, 1.3, .22), .15, rnd.random() * 9)
        B.paint(vs, NUAGE[k % 3], .02)


def arc_en_ciel(B, a, b, h):
    """[C : on passe par un arc-en-ciel avant d'accoster au village de l'Ouest] ruban à six bandes de a (pied en mer) vers b (port), cintré"""
    cols = [H('#e04a4a'), H('#f08a3a'), H('#f4d04a'), H('#5ab85a'), H('#4a8ad8'), H('#8a5ac8')]
    n = 24; ang = math.atan2(b[1] - a[1], b[0] - a[0]); nx, ny = -math.sin(ang), math.cos(ang)
    for i in range(n):
        t0, t1 = i / n, (i + 1) / n
        for k, c in enumerate(cols):
            o0, o1 = (k - 3) * .22, (k - 2) * .22
            P = []
            for t, o in ((t0, o0), (t1, o0), (t1, o1), (t0, o1)):
                x = a[0] + (b[0] - a[0]) * t; y = a[1] + (b[1] - a[1]) * t; z = a[2] + (b[2] - a[2]) * t + h * 4 * t * (1 - t)
                P.append(C.g2b(x + nx * o, y + ny * o, z))
            vs = [B.bm.verts.new(p) for p in P]; B.bm.faces.new(vs); B.paint(vs, c, .02)


def ponton_nuage(B, x, y, z, ang, L_):
    """[C : port du village de l'Ouest ; aspect I] jetée de bois sur pilotis, au bord de la plateforme"""
    F = Frame(x, y, z, ang)
    box(B, F, -.35, .35, 0, L_, -.12, .02, BOIS[1], .04)
    for k in range(int(L_ / .7) + 1):
        for s in (-1, 1): vs = C.bm_cyl(B.bm, F.p(s * .3, k * .7, -.8), F.p(s * .3, k * .7, .15), .05, .05, 5); B.paint(vs, BOIS[3], .03)


def barque(B, x, y, z, ang, L_=1.4):
    """barque de bois à proue relevée (générique)"""
    F = Frame(x, y, z, ang)
    box(B, F, -.25, .25, -L_ / 2, L_ / 2, -.1, .18, BOIS[2], .05)
    for s in (-1, 1): box(B, F, -.06, .06, s * L_ / 2 - .08, s * L_ / 2 + .08, .1, .45, BOIS[0], .03)
