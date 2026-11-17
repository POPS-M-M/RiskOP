"""RISK OP — kit architectural VILLAGE TROPICAL INSPIRÉ D'UBUD (Cocoyasi, île 8 [C : inspiré d'Ubud, Indonésie, Rurubu One Piece] ;
réutilisable pour d'autres îles des Conomi avec une identité propre).
Pièces [I] : cour close (mur de briques, porte fendue, maison enduite à toit de chaume, pavillon ouvert sur poteaux, petit autel),
maisons neuves de Gosa (reconstruit [C]), cabanes de rizière sur pilotis, cabinet de médecin et librairie [C : existent ; aspect I],
temple à toits superposés, moulin à vent [C?], ruines d'un complexe côtier à bassin et portes d'acier (Arlong Park [C]),
pirogues à balancier ; mandariniers [C], palmiers [C], frangipaniers, bananiers, arbres de jungle [I].
Aucune copie de décor officiel, aucun emblème. Repère : x est, y sud, z haut (jeu) ; Frame de rk_port (u le long de la façade).
"""
import math, random
import rk_common as C
import rk_lib as L
import rk_port as K
from rk_port import Frame, box, quad, hip, prism_x, window

H = C.hexc
BRIQUE = [H('#b0644a'), H('#a25a42'), H('#bc7254')]
PIERRE_V = [H('#8f8a7c'), H('#9a9484'), H('#7e7a6c')]              # pierre volcanique grise
ENDUIT = [H('#f2ead8'), H('#efe2c4'), H('#e8d8b8'), H('#f4efe4')]
CHAUME = [H('#8c6c3c'), H('#7e6034'), H('#9a7a46')]                 # chaume d'herbe (alang-alang) [I]
IJUK = H('#3a3430')                                                # fibre noire des toits de temple [I]
BOIS = [H('#6a4a30'), H('#7a5638'), H('#5a3e28')]
TOITS_GOSA = [H('#3d64b8'), H('#b5533c'), H('#4a74c4'), H('#a84a36')]   # couleurs du rendu d'origine de l'île dans le jeu (ISLE_ART)
VOLETS = [H('#3a8a9a'), H('#2f6a8a'), H('#6a9a4a'), H('#c8823a')]


def _toit_chaume(B, F, w, d, top, rnd, h=None, o=.22):
    """toit à quatre pans raide et épais, débord large"""
    col = CHAUME[rnd.randrange(len(CHAUME))]; h = h or .5 * min(w, d) + .35
    hip(B, F, -w / 2 - o - .04, w / 2 + o + .04, -d / 2 - o - .04, d / 2 + o + .04, top - .1, .14, C.mix(col, H('#3a2a18'), .45))
    hip(B, F, -w / 2 - o, w / 2 + o, -d / 2 - o, d / 2 + o, top, h, col)
    return top + h


def porte_fendue(B, F, u, v, h=1.1, col=None):
    """porte fendue (deux moitiés de pylône à gradins, passage au milieu) [I]"""
    col = col or BRIQUE[0]
    for s in (-1, 1):
        for k in range(4):
            a = .32 - k * .05; z0 = k * h / 4
            box(B, F, u + s * (.16 + a / 2) - a / 2, u + s * (.16 + a / 2) + a / 2, v - .12 + k * .02, v + .12 - k * .02, z0 - (.3 if k == 0 else 0), z0 + h / 4, C.mix(col, H('#ffffff'), .08 * (k % 2)), .04)


def cour(B, x, y, z0, ang, w, d, rnd):
    """cour close : mur bas, porte fendue sur la rue (v+), maison enduite au fond, pavillon ouvert, petit autel"""
    F = Frame(x, y, z0, ang); mur = BRIQUE[rnd.randrange(3)] if rnd.random() < .6 else PIERRE_V[rnd.randrange(3)]
    t = .1; hm = .42
    box(B, F, -w / 2, w / 2, -d / 2, -d / 2 + t, -.4, hm, mur, .05)                                      # mur du fond
    for s in (-1, 1): box(B, F, s * w / 2 - (t if s > 0 else 0), s * w / 2 + (0 if s > 0 else t), -d / 2, d / 2, -.4, hm, mur, .05)
    for s in (-1, 1): box(B, F, s * .42 if s > 0 else -w / 2, w / 2 if s > 0 else -.42, d / 2 - t, d / 2, -.4, hm, mur, .05)   # façade, ouverte au centre
    porte_fendue(B, F, 0, d / 2 - .05, 1.0, mur)
    # maison principale au fond (enduit, petites fenêtres à volets)
    mw, md = w * .55, d * .38
    cx, cy = -w * .12, -d / 2 + md / 2 + .16
    box(B, F, cx - mw / 2, cx + mw / 2, cy - md / 2, cy + md / 2, -.4, .62, ENDUIT[rnd.randrange(len(ENDUIT))], .04)
    quad(B, F, [(cx - .1, cy + md / 2 + .01, 0), (cx + .1, cy + md / 2 + .01, 0), (cx + .1, cy + md / 2 + .01, .45), (cx - .1, cy + md / 2 + .01, .45)], BOIS[0], .03)
    for du in (-mw / 3, mw / 3):
        quad(B, F, [(cx + du - .08, cy + md / 2 + .01, .25), (cx + du + .08, cy + md / 2 + .01, .25), (cx + du + .08, cy + md / 2 + .01, .45), (cx + du - .08, cy + md / 2 + .01, .45)], VOLETS[rnd.randrange(len(VOLETS))], .03)
    hip(B, F, cx - mw / 2 - .2, cx + mw / 2 + .2, cy - md / 2 - .2, cy + md / 2 + .2, .62, .42 + .2 * rnd.random(), CHAUME[rnd.randrange(3)])
    # pavillon ouvert sur poteaux (plate-forme surélevée) [I]
    px, py, pw, pd = w * .24, d * .12, w * .3, d * .26
    box(B, F, px - pw / 2, px + pw / 2, py - pd / 2, py + pd / 2, -.3, .16, PIERRE_V[0], .04)
    for su in (-1, 1):
        for sv in (-1, 1): box(B, F, px + su * (pw / 2 - .04) - .025, px + su * (pw / 2 - .04) + .025, py + sv * (pd / 2 - .04) - .025, py + sv * (pd / 2 - .04) + .025, .16, .62, BOIS[1], .03)
    hip(B, F, px - pw / 2 - .14, px + pw / 2 + .14, py - pd / 2 - .14, py + pd / 2 + .14, .62, .3, CHAUME[rnd.randrange(3)])
    # petit autel dans l'angle [I]
    ax, ay = w / 2 - .22, -d / 2 + .22
    box(B, F, ax - .08, ax + .08, ay - .08, ay + .08, -.1, .38, PIERRE_V[1], .03); hip(B, F, ax - .13, ax + .13, ay - .13, ay + .13, .38, .14, IJUK)
    for k in range(2):                                                                                   # plantes et fleurs dans la cour
        vs = C.bm_ico(B.bm, F.p(-w / 2 + .3 + k * .25, d / 2 - .3, .1), .14, 1); B.paint(vs, [H('#4f8a3a'), H('#e8607a')][k], .1)
    return .62 + .62


def maison_gosa(B, x, y, z0, ang, w, d, rnd):
    """maison neuve de Gosa (reconstruit [C]) : enduit clair, toit à deux pans bleu ou rouge, volets, perron [I]"""
    F = Frame(x, y, z0, ang); h = .85
    box(B, F, -w / 2, w / 2, -d / 2, d / 2, -.5, h, ENDUIT[rnd.randrange(len(ENDUIT))], .04)
    quad(B, F, [(-.12, d / 2 + .02, 0), (.12, d / 2 + .02, 0), (.12, d / 2 + .02, .55), (-.12, d / 2 + .02, .55)], BOIS[rnd.randrange(3)], .03)
    for u in (-w / 3, w / 3): window(B, F, u, d / 2, .42, .18, .2)
    box(B, F, -.25, .25, d / 2, d / 2 + .25, -.3, .06, H('#c8b898'), .04)
    prism_x(B, F, -w / 2 - .12, w / 2 + .12, -d / 2 - .14, d / 2 + .14, h, .42 * d + .15, TOITS_GOSA[rnd.randrange(len(TOITS_GOSA))])
    return h + .42 * d + .15


def cabane(B, x, y, z0, ang, w, d, rnd):
    """cabane de rizière sur pilotis, toit de chaume [I]"""
    F = Frame(x, y, z0, ang); hp = .38
    for su in (-1, 1):
        for sv in (-1, 1): box(B, F, su * (w / 2 - .06) - .03, su * (w / 2 - .06) + .03, sv * (d / 2 - .06) - .03, sv * (d / 2 - .06) + .03, -.3, hp, BOIS[2], .03)
    box(B, F, -w / 2, w / 2, -d / 2, d / 2, hp, hp + .06, BOIS[1], .03)
    box(B, F, -w / 2 + .06, w / 2 - .06, -d / 2 + .06, d / 2 - .06, hp + .06, hp + .5, H('#c8a878'), .05)
    return _toit_chaume(B, F, w, d, hp + .5, rnd, .45, .16)


def clinique(B, x, y, z0, ang, w, d, rnd):
    """cabinet du médecin [C : existe ; aspect I] : deux niveaux enduits blancs, volets bleu clair, auvent ; aucun symbole"""
    F = Frame(x, y, z0, ang)
    box(B, F, -w / 2, w / 2, -d / 2, d / 2, -.5, 1.55, H('#f6f2ea'), .03)
    for k in range(2):
        for u in (-w / 3, 0, w / 3):
            if k == 0 and u == 0:
                quad(B, F, [(-.14, d / 2 + .02, 0), (.14, d / 2 + .02, 0), (.14, d / 2 + .02, .6), (-.14, d / 2 + .02, .6)], H('#6a8aa8'), .03); continue
            window(B, F, u, d / 2, .4 + k * .72, .2, .26)
    box(B, F, -w / 2 - .05, w / 2 + .05, d / 2, d / 2 + .35, .66, .7, H('#7aaac0'), .04)
    hip(B, F, -w / 2 - .14, w / 2 + .14, -d / 2 - .14, d / 2 + .14, 1.55, .5, TOITS_GOSA[1])


def librairie(B, x, y, z0, ang, w, d, rnd):
    """librairie [C : existe ; aspect I] : boutique enduite, grande vitrine, auvent rayé, étals ; aucun texte"""
    F = Frame(x, y, z0, ang)
    box(B, F, -w / 2, w / 2, -d / 2, d / 2, -.5, 1.2, H('#efe2c4'), .03)
    quad(B, F, [(-w / 2 + .15, d / 2 + .02, .15), (w / 2 - .15, d / 2 + .02, .15), (w / 2 - .15, d / 2 + .02, .75), (-w / 2 + .15, d / 2 + .02, .75)], K.VITRE, .02)
    for k in range(6):
        u0 = -w / 2 + k * w / 6; box(B, F, u0, u0 + w / 6, d / 2, d / 2 + .4, .82, .86, [H('#c84a3a'), H('#f4efe4')][k % 2], .03)
    for u in (-w / 3, w / 3): box(B, F, u - .2, u + .2, d / 2 + .45, d / 2 + .7, -.1, .3, H('#8a6440'), .04)
    prism_x(B, F, -w / 2 - .1, w / 2 + .1, -d / 2 - .12, d / 2 + .12, 1.2, .45, TOITS_GOSA[0])


def meru(B, F, u, v, n, base=.9, col=IJUK):
    """tour à toits superposés (nombre impair de toits) sur socle de pierre [I]"""
    box(B, F, u - base / 2, u + base / 2, v - base / 2, v + base / 2, -.3, .5, PIERRE_V[0], .04)
    box(B, F, u - base * .35, u + base * .35, v - base * .35, v + base * .35, .5, .95, BRIQUE[0], .04)
    z = .95
    for k in range(n):
        s = base * (1.25 - .9 * k / n) / 2; hip(B, F, u - s, u + s, v - s, v + s, z, .16, col); z += .16
        box(B, F, u - s * .45, u + s * .45, v - s * .45, v + s * .45, z, z + .1, BOIS[0], .03); z += .1
    vs = C.bm_cyl(B.bm, F.p(u, v, z), F.p(u, v, z + .3), .05, .01, 6); B.paint(vs, H('#c8a040'), .02)
    return z + .3


def temple(B, x, y, z0, ang, rnd):
    """temple [I, inspiration Ubud] : enceinte de briques, porte fendue, cour, deux tours à toits superposés (11 et 7), pavillons"""
    F = Frame(x, y, z0, ang); W_, D_ = 4.2, 3.6; mur = BRIQUE[1]
    box(B, F, -W_ / 2, W_ / 2, -D_ / 2, -D_ / 2 + .12, -.4, .55, mur, .04)
    for s in (-1, 1): box(B, F, s * W_ / 2 - (.12 if s > 0 else 0), s * W_ / 2 + (0 if s > 0 else .12), -D_ / 2, D_ / 2, -.4, .55, mur, .04)
    for s in (-1, 1): box(B, F, .5 if s > 0 else -W_ / 2, W_ / 2 if s > 0 else -.5, D_ / 2 - .12, D_ / 2, -.4, .55, mur, .04)
    porte_fendue(B, F, 0, D_ / 2 - .06, 1.7, mur)
    top = meru(B, F, -1.1, -.9, 11, 1.0); meru(B, F, .3, -1.0, 7, .8)
    for u in (1.4, -1.4):
        box(B, F, u - .35, u + .35, .5, 1.1, -.3, .2, PIERRE_V[2], .04)
        for su in (-1, 1):
            for sv in (-1, 1): box(B, F, u + su * .3 - .025, u + su * .3 + .025, .8 + sv * .25 - .025, .8 + sv * .25 + .025, .2, .62, BOIS[0], .03)
        hip(B, F, u - .5, u + .5, .4, 1.2, .62, .32, IJUK)
    return top


def moulin(B, x, y, z, ang):
    """moulin à vent [C?] : tour ronde blanche, toit conique, quatre ailes"""
    vs = C.bm_cyl(B.bm, C.g2b(x, y, z - .3), C.g2b(x, y, z + 2.2), .55, .42, 14); B.paint(vs, H('#f4efe4'), .03)
    vs = C.bm_cyl(B.bm, C.g2b(x, y, z + 2.2), C.g2b(x, y, z + 2.85), .5, .04, 14); B.paint(vs, H('#b5533c'), .03)
    F = Frame(x, y, z, ang); hub = F.p(0, .5, 2.15)
    for k in range(4):
        a = k * math.pi / 2 + .3; du, dz = math.cos(a), math.sin(a)
        p0 = F.p(du * .15, .52, 2.15 + dz * .15); p1 = F.p(du * 1.5, .52, 2.15 + dz * 1.5); n = F.p(-dz * .18, .52, 2.15 + du * .18); m = (n[0] - hub[0], n[1] - hub[1], n[2] - hub[2])
        vs = [B.bm.verts.new(p0), B.bm.verts.new(p1), B.bm.verts.new((p1[0] + m[0], p1[1] + m[1], p1[2] + m[2])), B.bm.verts.new((p0[0] + m[0], p0[1] + m[1], p0[2] + m[2]))]
        B.bm.faces.new(vs); B.paint(vs, H('#e8dcc4'), .03)
    vs = C.bm_uvsphere(B.bm, hub, .1, 8, 5); B.paint(vs, BOIS[0], .02)


def ruines_arlong(B, x, y, z0, ang, bx, by, rnd):
    """ruines d'un complexe côtier [C : sur la côte, plusieurs étages, bassin extérieur relié à la mer et fermé par deux portes d'acier,
    bâtiment détruit ; aspect I, aucun emblème] — ang : direction de la mer ; (bx, by) : centre du bassin"""
    F = Frame(x, y, z0, ang); mur = H('#b8b4aa'); mur2 = H('#9c988e')
    for s in (-1, 1):                                                                          # enceinte, ouverte vers le bassin
        box(B, F, s * 2.6 - .2, s * 2.6 + .2, -2.6, 1.6, -.6, 1.1 - .3 * (s > 0), mur2, .06)
    box(B, F, -2.6, 2.6, -2.8, -2.4, -.6, 1.0, mur2, .06)
    # corps principal : quatre niveaux debout, étages supérieurs effondrés (sommet brisé)
    box(B, F, -1.3, 1.3, -1.9, -.1, -.6, 2.8, mur, .04)
    for k in range(3):
        for q in range(4): window(B, F, -1.0 + q * .66, -.1, .5 + k * .8, .26, .4)
    for k in range(7):                                                                         # dents de la cassure
        u = -1.25 + k * .38; box(B, F, u, u + .3, -1.9, -.1, 2.8, 2.8 + rnd.uniform(.1, .7), mur, .05)
    for k in range(22):                                                                        # gravats
        u, v = rnd.uniform(-2.3, 2.3), rnd.uniform(-2.2, 1.4)
        vs = C.bm_ico(B.bm, F.p(u, v, -.1), .12 + .22 * rnd.random(), 1, (1.3, 1, .6)); B.paint(vs, C.mix(mur, mur2, rnd.random()), .08)
    for k in range(3):                                                                         # dalles de toit tombées
        u, v = rnd.uniform(-1.8, 1.8), rnd.uniform(-.2, 1.2)
        box(B, F, u - .5, u + .5, v - .35, v + .35, -.1, .1 + .2 * k, H('#7a8a96'), .04)
    # bassin : quais de pierre et deux portes d'acier sur le chenal vers la mer
    a = math.atan2(by - y, bx - x); G = Frame(bx, by, 0, a - math.pi / 2)
    for s in (-1, 1): box(B, G, s * 2.4 - .25, s * 2.4 + .25, -2.4, 2.2, -.8, .55, mur2, .06)
    for s in (-1, 1): box(B, G, s * .8 - .78, s * .8 + .78, 2.15, 2.3, -.6, 1.1, H('#4a5058'), .03)        # portes d'acier (fermées)
    for s in (-1, 1): box(B, G, s * 1.7 - .14, s * 1.7 + .14, 2.05, 2.4, -.6, 1.4, H('#5a6068'), .03)
    return 2.8


def pirogue(B, x, y, z, ang, L_=1.3):
    """pirogue à balancier [I]"""
    F = Frame(x, y, z, ang)
    box(B, F, -.12, .12, -L_ / 2, L_ / 2, -.05, .12, H('#f2ece0'), .06)
    box(B, F, -.13, .13, -L_ / 2 + .05, L_ / 2 - .05, .12, .14, H('#3a8ab8'), .03)
    for s in (-1, 1):
        box(B, F, s * .55 - .04, s * .55 + .04, -L_ / 2 + .2, L_ / 2 - .2, -.04, .03, H('#d8cfb8'), .03)
        for v in (-.25, .25): box(B, F, -.55, .55, v - .02, v + .02, .1, .13, BOIS[0], .02)


def mandarinier(B, x, y, z, s, rnd):
    vs = C.bm_cyl(B.bm, C.g2b(x, y, z - .1), C.g2b(x, y, z + .35 * s), .05 * s, .04 * s, 5); B.paint(vs, BOIS[0], .04)
    vs = C.bm_ico(B.bm, C.g2b(x, y, z + .62 * s), .36 * s, 1, (1, 1, .9)); B.paint(vs, C.mix(H('#2f6a2c'), H('#3f7a34'), rnd.random()), .08)
    for k in range(5):
        a = rnd.uniform(0, 6.283); e = rnd.uniform(-.2, .25)
        vs = C.bm_ico(B.bm, C.g2b(x + math.cos(a) * .3 * s, y + math.sin(a) * .3 * s, z + (.62 + e) * s), .06 * s, 0); B.paint(vs, H('#f08a1c'), .05)


def frangipanier(B, x, y, z, s, rnd):
    vs = C.bm_tube(B.bm, [C.g2b(x, y, z - .1), C.g2b(x + .1 * s, y, z + .6 * s), C.g2b(x, y + .1 * s, z + .95 * s)], lambda t: .08 * s * (1 - .4 * t), 5); B.paint(vs, H('#8a7a6a'), .05)
    for k in range(4):
        a = k * 1.57 + rnd.random(); c = C.g2b(x + math.cos(a) * .35 * s, y + math.sin(a) * .35 * s, z + 1.0 * s)
        vs = C.bm_ico(B.bm, c, .3 * s, 1, (1, 1, .7)); B.paint(vs, H('#5a9a48'), .08)
        vs = C.bm_ico(B.bm, (c[0], c[1], c[2] + .18 * s), .09 * s, 0); B.paint(vs, [H('#f8f4ec'), H('#f4a6b8')][k % 2], .05)


def bananier(B, x, y, z, s, rnd):
    vs = C.bm_cyl(B.bm, C.g2b(x, y, z - .1), C.g2b(x, y, z + .8 * s), .08 * s, .06 * s, 6); B.paint(vs, H('#7a9a4a'), .05)
    for k in range(6):
        a = k * 1.047 + rnd.random() * .3; d = (math.cos(a), math.sin(a))
        p0 = C.g2b(x, y, z + .8 * s); tip = C.g2b(x + d[0] * .9 * s, y + d[1] * .9 * s, z + .55 * s)
        side = (-d[1] * .18 * s, d[0] * .18 * s); mid = (x + d[0] * .45 * s, y + d[1] * .45 * s)
        vs = [B.bm.verts.new(p0), B.bm.verts.new(C.g2b(mid[0] + side[0], mid[1] + side[1], z + .95 * s)), B.bm.verts.new(tip), B.bm.verts.new(C.g2b(mid[0] - side[0], mid[1] - side[1], z + .95 * s))]
        B.bm.faces.new(vs); B.paint(vs, C.mix(H('#5aa040'), H('#7ab850'), rnd.random()), .06)


def arbre_jungle(B, x, y, z, s, rnd):
    vs = C.bm_tube(B.bm, [C.g2b(x, y, z - .2), C.g2b(x, y, z + 1.4 * s)], lambda t: .12 * s * (1 - .5 * t), 6); B.paint(vs, H('#5a4a3a'), .05)
    for k in range(3):
        a = rnd.uniform(0, 6.283); c = C.g2b(x + math.cos(a) * .4 * s, y + math.sin(a) * .4 * s, z + (1.5 + .3 * rnd.random()) * s)
        vs = C.bm_ico(B.bm, c, (.6 + .2 * rnd.random()) * s, 1, (1, 1, .65)); B.paint(vs, C.mix(H('#2e6a34'), H('#3e7e3a'), rnd.random()), .08)


def palmier(B, x, y, z, s, rnd):
    return L.palm(B, C.g2b(x, y, z), .3 * s, C.mix(H('#3f8a3a'), H('#5a9a3a'), rnd.random()), rnd)
