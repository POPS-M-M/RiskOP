"""RISK OP — kit architectural VILLAGE ANGLAIS (Syrup, île 7 ; réutilisable pour Foosha [C : aussi inspiré de villages anglais,
Rurubu One Piece] avec une identité propre).
Pièces : cottages de pierre à toit de chaume ou d'ardoise, maisons à colombages à étage en encorbellement, ferme, grange,
manoir géorgien et clôture de domaine (Syrup [C : grand manoir élégant sur une colline, domaine clôturé ; aspect I / C?]),
auberge (Meshi [C], aspect I), chapelle de pierre à tour crénelée [I], puits, meule de foin, muret de pierre sèche, haies,
jetée, phare ; chênes et hêtres. Formes génériques [I], aucune copie de décor officiel.
Repère : x est, y sud, z haut (jeu) ; u = le long de la façade, v = vers la rue (Frame de rk_port).
"""
import math, random
import rk_common as C
import rk_port as K
from rk_port import Frame, box, quad, hip, prism_x, window

H = C.hexc
PIERRES = [H('#d9c08a'), H('#cfb47e'), H('#c9bea6'), H('#d6cbb2'), H('#e2d6b8')]   # pierre miel (Cotswolds) et pierre grise [I]
CHAUX = [H('#efe8d8'), H('#f3eee2'), H('#ece0c6')]
CHAUME, CHAUME2 = [H('#b39a66'), H('#a88e5c'), H('#bea572'), H('#9e8858')], H('#7a6440')
ARDOISE = [H('#5f6a74'), H('#566069'), H('#6a7076')]
TUILE = [H('#a8503a'), H('#b25e40'), H('#9a4a36')]
COLOMBE = H('#4a3426')
PORTES = [H('#2f5a3a'), H('#7a2f2a'), H('#2e4f7a'), H('#3a3a3a'), H('#6b4a30')]
FLEURS = [H('#e85a7a'), H('#f2c14a'), H('#e8784a'), H('#b45ad8'), H('#f4f0e8')]
HAIE, GAZON = H('#4f7a3a'), H('#7fb05a')


def _cheminee(B, F, u, top, h, col):
    box(B, F, u - .11, u + .11, -.12, .12, top - .2, top + h, col, .04)
    box(B, F, u - .14, u + .14, -.15, .15, top + h, top + h + .06, C.mix(col, H('#ffffff'), .2), .03)


def _toit(B, F, w, d, top, toit, rnd, o=.16):
    """toit à deux pans raide ; chaume : épais, débord arrondi, faîtage roulé ; ardoise / tuile : fin"""
    hh = .52 * d + .2
    if toit == 'chaume':
        col = CHAUME[rnd.randrange(len(CHAUME))]
        prism_x(B, F, -w / 2 - o - .05, w / 2 + o + .05, -d / 2 - o - .08, d / 2 + o + .08, top - .12, hh + .16, C.mix(col, CHAUME2, .55))   # sous-face sombre
        prism_x(B, F, -w / 2 - o, w / 2 + o, -d / 2 - o, d / 2 + o, top - .02, hh + .1, col)
        vs = C.bm_cyl(B.bm, F.p(-w / 2 - o, 0, top + hh + .06), F.p(w / 2 + o, 0, top + hh + .06), .08, .08, 6); B.paint(vs, C.mix(col, H('#fff0c8'), .25), .03)
    else:
        col = (ARDOISE if toit == 'ardoise' else TUILE)[rnd.randrange(3)]
        prism_x(B, F, -w / 2 - o, w / 2 + o, -d / 2 - o, d / 2 + o, top, hh, col)
    return top + hh


def cottage(B, x, y, z0, ang, w, d, rnd, toit='chaume', mur=None, jardin=True):
    """cottage d'un niveau et combles : pierre ou chaux, petites fenêtres à cadre blanc, porte colorée, cheminée de pignon"""
    F = Frame(x, y, z0, ang); mur = mur or (PIERRES + CHAUX)[rnd.randrange(len(PIERRES) + len(CHAUX))]; h = .92
    box(B, F, -w / 2, w / 2, -d / 2, d / 2, -.6, h, mur, .07)
    quad(B, F, [(-.13, d / 2 + .02, 0), (.13, d / 2 + .02, 0), (.13, d / 2 + .02, .55), (-.13, d / 2 + .02, .55)], PORTES[rnd.randrange(len(PORTES))], .03)
    for u in (-w / 3, w / 3):
        window(B, F, u, d / 2, .42, .2, .22)
    top = _toit(B, F, w, d, h, toit, rnd)
    _cheminee(B, F, (w / 2 - .12) * (1 if rnd.random() < .5 else -1), h, .62 * d + .5, C.mix(mur, H('#8a7a6a'), .35))
    if jardin and rnd.random() < .6:                                                      # jardinet : haie basse et fleurs [I]
        box(B, F, -w / 2, w / 2, d / 2 + .5, d / 2 + .6, -.2, .2, HAIE, .1)
        for k in range(3): box(B, F, -w / 2 + .15 + k * (w - .3) / 2 - .08, -w / 2 + .15 + k * (w - .3) / 2 + .08, d / 2 + .12, d / 2 + .3, -.1, .12, FLEURS[rnd.randrange(len(FLEURS))], .12)
    return top


def colombage(B, x, y, z0, ang, w, d, rnd, toit='tuile'):
    """maison à colombages : rez-de-chaussée en pierre, étage en encorbellement, pans de bois sombres sur enduit clair"""
    F = Frame(x, y, z0, ang); base = PIERRES[rnd.randrange(len(PIERRES))]; enduit = CHAUX[rnd.randrange(len(CHAUX))]
    box(B, F, -w / 2, w / 2, -d / 2, d / 2, -.6, .78, base, .06)
    j = .12; box(B, F, -w / 2 - .04, w / 2 + .04, -d / 2 - .04, d / 2 + j, .78, 1.6, enduit, .04)               # étage en saillie
    box(B, F, -w / 2 - .05, w / 2 + .05, d / 2 + j, d / 2 + j + .03, .76, .84, COLOMBE, .02)                    # sablière
    n = max(3, int(w / .28))
    for k in range(n + 1):                                                                                      # poteaux
        u = -w / 2 - .04 + k * (w + .08) / n; box(B, F, u - .025, u + .025, d / 2 + j, d / 2 + j + .025, .84, 1.6, COLOMBE, .02)
    for k in range(n):                                                                                          # écharpes en diagonale
        if k % 2: continue
        u0 = -w / 2 - .04 + k * (w + .08) / n; u1 = u0 + (w + .08) / n
        quad(B, F, [(u0, d / 2 + j + .03, .86), (u0 + .05, d / 2 + j + .03, .86), (u1, d / 2 + j + .03, 1.56), (u1 - .05, d / 2 + j + .03, 1.56)], COLOMBE, .02)
    for s in (-1, 1):                                                                                           # pans latéraux
        for k in range(3):
            v = -d / 2 + (k + .5) * (d + j) / 3; quad(B, F, [(s * (w / 2 + .045), v - .025, .84), (s * (w / 2 + .045), v + .025, .84), (s * (w / 2 + .045), v + .025, 1.6), (s * (w / 2 + .045), v - .025, 1.6)], COLOMBE, .02)
    quad(B, F, [(-.14, d / 2 + .02, 0), (.14, d / 2 + .02, 0), (.14, d / 2 + .02, .58), (-.14, d / 2 + .02, .58)], PORTES[rnd.randrange(len(PORTES))], .03)
    window(B, F, -w / 3, d / 2, .42, .22, .22); window(B, F, w / 3, d / 2, .42, .22, .22)
    for u in (-w / 4, w / 4): window(B, F, u, d / 2 + j + .03, 1.22, .2, .2)
    top = _toit(B, F, w + .08, d + j + .08, 1.6, toit, rnd, .12)
    _cheminee(B, F, (w / 2 - .1) * (1 if rnd.random() < .5 else -1), 1.6, .62 * d + .5, H('#9a6a52'))
    return top


def ferme(B, x, y, z0, ang, w, d, rnd):
    """corps de ferme : deux niveaux en pierre, toit de chaume, cour fermée par un muret"""
    F = Frame(x, y, z0, ang); mur = PIERRES[rnd.randrange(len(PIERRES))]; h = 1.45
    box(B, F, -w / 2, w / 2, -d / 2, d / 2, -.6, h, mur, .06)
    quad(B, F, [(-.14, d / 2 + .02, 0), (.14, d / 2 + .02, 0), (.14, d / 2 + .02, .58), (-.14, d / 2 + .02, .58)], PORTES[rnd.randrange(len(PORTES))], .03)
    for u in (-w / 3, w / 3): window(B, F, u, d / 2, .45, .22, .22); window(B, F, u, d / 2, 1.1, .22, .22)
    _toit(B, F, w, d, h, 'chaume', rnd)
    _cheminee(B, F, w / 2 - .12, h, .62 * d + .5, C.mix(mur, H('#8a7a6a'), .35))
    for k in range(10):                                                                   # muret de la cour [I]
        a0, a1 = k / 10 * math.pi, (k + 1) / 10 * math.pi
        quad(B, F, [(math.cos(a0) * w * .9, d / 2 + .2 + math.sin(a0) * d * 1.1, -.2), (math.cos(a1) * w * .9, d / 2 + .2 + math.sin(a1) * d * 1.1, -.2),
                    (math.cos(a1) * w * .9, d / 2 + .2 + math.sin(a1) * d * 1.1, .22), (math.cos(a0) * w * .9, d / 2 + .2 + math.sin(a0) * d * 1.1, .22)], H('#b4ab98'), .08)


def grange(B, x, y, z0, ang, w, d, rnd):
    """grange : bardage de bois sombre, grand toit, portes charretières"""
    F = Frame(x, y, z0, ang); bois = [H('#6a4a32'), H('#5a3e2c'), H('#7a5236')][rnd.randrange(3)]; h = 1.15
    box(B, F, -w / 2, w / 2, -d / 2, d / 2, -.6, h, bois, .06)
    for k in range(int(w / .2)):
        u = -w / 2 + (k + .5) * w / int(w / .2); quad(B, F, [(u - .01, d / 2 + .015, 0), (u + .01, d / 2 + .015, 0), (u + .01, d / 2 + .015, h), (u - .01, d / 2 + .015, h)], C.mix(bois, H('#000000'), .3), .02)
    quad(B, F, [(-.32, d / 2 + .02, 0), (.32, d / 2 + .02, 0), (.32, d / 2 + .02, .85), (-.32, d / 2 + .02, .85)], H('#3a2a1e'), .02)
    prism_x(B, F, -w / 2 - .12, w / 2 + .12, -d / 2 - .14, d / 2 + .14, h, .55 * d + .3, [H('#7a3a2e'), ARDOISE[0]][rnd.randrange(2)])


def meule(B, x, y, z, s, rnd):
    vs = C.bm_cyl(B.bm, C.g2b(x, y, z - .1), C.g2b(x, y, z + .45 * s), .38 * s, .4 * s, 10); B.paint(vs, H('#d8b860'), .08)
    vs = C.bm_uvsphere(B.bm, C.g2b(x, y, z + .45 * s), 1, 10, 5, (.4 * s, .4 * s, .32 * s)); B.paint(vs, H('#cfae58'), .08)


def puits(B, x, y, z):
    vs = C.bm_cyl(B.bm, C.g2b(x, y, z - .2), C.g2b(x, y, z + .35), .32, .32, 12); B.paint(vs, H('#b9ae98'), .06)
    for s in (-1, 1): box(B, Frame(x, y, z, 0), s * .28 - .03, s * .28 + .03, -.03, .03, .3, .95, H('#5a3e2c'), .03)
    prism_x(B, Frame(x, y, z, 0), -.4, .4, -.3, .3, .9, .28, ARDOISE[0])


def chene(B, x, y, z, s, rnd, clair=False):
    """chêne : tronc court, houppier large en boules irrégulières ; hêtre (clair=True) : plus rond et plus clair"""
    vs = C.bm_tube(B.bm, [C.g2b(x, y, z - .2), C.g2b(x + .05 * s, y, z + .7 * s), C.g2b(x, y + .05 * s, z + 1.1 * s)], lambda t: .13 * s * (1 - .45 * t), 6); B.paint(vs, H('#5a4432'), .06)
    greens = [H('#9cc070'), H('#86b062'), H('#a8c878')] if clair else [H('#4f7a3a'), H('#5f8a42'), H('#466e34'), H('#6a944a')]
    for k in range(4 if clair else 5):
        a = rnd.uniform(0, 6.283); r = (.25 + .35 * rnd.random()) * s
        c = C.g2b(x + math.cos(a) * r, y + math.sin(a) * r, z + (1.25 + .45 * rnd.random()) * s)
        vs = C.bm_ico(B.bm, c, (.55 + .25 * rnd.random()) * s, 1, (1, 1, .82)); B.paint(vs, greens[rnd.randrange(len(greens))], .08)


def muret(B, pts, z_of, col=H('#b4ab98'), h=.3):
    """muret de pierre sèche le long d'une polyligne"""
    for (ax, ay), (bx, by) in zip(pts, pts[1:]):
        L_ = math.hypot(bx - ax, by - ay); n = max(1, int(L_ / .8))
        for k in range(n):
            x0, y0 = ax + (bx - ax) * k / n, ay + (by - ay) * k / n; x1, y1 = ax + (bx - ax) * (k + 1) / n, ay + (by - ay) * (k + 1) / n
            F = Frame((x0 + x1) / 2, (y0 + y1) / 2, z_of((x0 + x1) / 2, (y0 + y1) / 2), math.atan2(y1 - y0, x1 - x0) + math.pi / 2)
            box(B, F, -L_ / n / 2 - .02, L_ / n / 2 + .02, -.09, .09, -.3, h, col, .1)


def haie(B, x0, y0, x1, y1, z_of, h=.24):
    L_ = math.hypot(x1 - x0, y1 - y0); n = max(1, int(L_ / .9))
    for k in range(n):
        xa, ya = x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n; xb, yb = x0 + (x1 - x0) * (k + 1) / n, y0 + (y1 - y0) * (k + 1) / n
        F = Frame((xa + xb) / 2, (ya + yb) / 2, z_of((xa + xb) / 2, (ya + yb) / 2), math.atan2(yb - ya, xb - xa) + math.pi / 2)
        box(B, F, -L_ / n / 2, L_ / n / 2, -.1, .1, -.25, h, HAIE, .14)


def manoir(B, x, y, z0, ang, rnd):
    """manoir géorgien [I ; C? murs clairs, toits rouges] : corps central à trois niveaux, deux ailes, portique à colonnes et fronton,
    toit à croupes, lucarnes, souches de cheminée par paires. Retourne la hauteur du faîte."""
    F = Frame(x, y, z0, ang); mur, corn, toit = H('#f2eee4'), H('#e2d8c2'), H('#c0563a'); W_, D_, hf = 4.4, 2.3, .95
    box(B, F, -W_ / 2 - .05, W_ / 2 + .05, -D_ / 2 - .05, D_ / 2 + .05, -.6, .3, H('#cfc4ae'), .03)                # soubassement
    box(B, F, -W_ / 2, W_ / 2, -D_ / 2, D_ / 2, .3, .3 + 3 * hf, mur, .03)
    for k in range(1, 3): box(B, F, -W_ / 2 - .03, W_ / 2 + .03, D_ / 2, D_ / 2 + .04, .3 + k * hf - .04, .3 + k * hf + .03, corn, .02)
    box(B, F, -W_ / 2 - .08, W_ / 2 + .08, -D_ / 2 - .08, D_ / 2 + .08, .3 + 3 * hf, .3 + 3 * hf + .14, corn, .02)     # corniche
    for su in (-1, 1):                                                                                              # chaînes d'angle
        box(B, F, su * W_ / 2 - .08, su * W_ / 2 + .08, D_ / 2 - .08, D_ / 2 + .04, .3, .3 + 3 * hf, corn, .02)
    for k in range(3):
        z = .3 + k * hf + hf * .52
        for q in range(7):
            u = -W_ / 2 + (q + .5) * W_ / 7
            if k == 0 and q == 3: continue
            window(B, F, u, D_ / 2, z, .24, .46 if k < 2 else .34)
            window(B, F.__class__(x, y, z0, ang + math.pi), -u, D_ / 2, z, .24, .46 if k < 2 else .34)
        for q in range(3):
            v = -D_ / 2 + (q + .5) * D_ / 3; window(B, F, W_ / 2, v, z, .22, .4, '+u'); window(B, F, -W_ / 2, v, z, .22, .4, '-u')
    for su in (-1, 1):                                                                                              # ailes basses
        F2 = Frame(x + su * (W_ / 2 + .75) * -math.sin(ang), y + su * (W_ / 2 + .75) * math.cos(ang), z0, ang)
        box(B, F2, -.75, .75, -D_ / 2 + .25, D_ / 2 - .25, -.6, .3 + 2 * hf, mur, .03)
        box(B, F2, -.8, .8, -D_ / 2 + .2, D_ / 2 - .2, .3 + 2 * hf, .3 + 2 * hf + .1, corn, .02)
        for k in range(2):
            for q in (-.38, .38): window(B, F2, q, D_ / 2 - .25, .3 + k * hf + hf * .52, .22, .42)
        hip(B, F2, -.85, .85, -D_ / 2 + .15, D_ / 2 - .15, .3 + 2 * hf + .1, .7, toit)
    zt = .3 + 3 * hf + .14
    hip(B, F, -W_ / 2 - .12, W_ / 2 + .12, -D_ / 2 - .12, D_ / 2 + .12, zt, 1.15, toit)
    for q in (-1.2, 0, 1.2):                                                                                        # lucarnes
        box(B, F, q - .2, q + .2, D_ / 2 - .5, D_ / 2 - .15, zt, zt + .42, mur, .02); prism_x(B, F, q - .26, q + .26, D_ / 2 - .55, D_ / 2 - .1, zt + .42, .2, toit)
        window(B, F, q, D_ / 2 - .15, zt + .22, .18, .2)
    for su in (-1, 1): _cheminee(B, F, su * (W_ / 2 - .3), zt + .3, 1.0, H('#d8cfbe'))
    # portique : 4 colonnes, fronton triangulaire, perron [I]
    box(B, F, -.85, .85, D_ / 2, D_ / 2 + .9, .02, .3, H('#e6ddca'), .02)
    for k in range(3): box(B, F, -.75 + k * .1, .75 - k * .1, D_ / 2 + .9 + k * .18, D_ / 2 + 1.08 + k * .18, -.3, .22 - k * .1, H('#ddd2bc'), .02)
    for u in (-.7, -.24, .24, .7):
        vs = C.bm_cyl(B.bm, F.p(u, D_ / 2 + .72, .3), F.p(u, D_ / 2 + .72, .3 + 1.7), .08, .07, 10); B.paint(vs, H('#f6f2ea'), .02)
    box(B, F, -.92, .92, D_ / 2, D_ / 2 + .86, 2.0, 2.16, corn, .02)
    vs = [B.bm.verts.new(F.p(*p)) for p in ((-.95, D_ / 2 + .86, 2.16), (.95, D_ / 2 + .86, 2.16), (0, D_ / 2 + .86, 2.62))]; B.bm.faces.new(vs); B.paint(vs, mur, .02)
    quad(B, F, [(-.24, D_ / 2 + .02, .3), (.24, D_ / 2 + .02, .3), (.24, D_ / 2 + .02, 1.05), (-.24, D_ / 2 + .02, 1.05)], H('#3a4a3a'), .02)
    return zt + 1.15


def cloture(B, cx, cy, r, z_of, porte_ang, col=H('#2f3336')):
    """grille du domaine : barreaux et lisses en fer sombre, piliers de pierre à la porte"""
    n = int(6.283 * r / .5)
    for k in range(n):
        a0, a1 = k / n * 6.283, (k + 1) / n * 6.283; am = (a0 + a1) / 2
        if K_angd(am, porte_ang) < .16: continue
        x0, y0, x1, y1 = cx + math.cos(a0) * r, cy + math.sin(a0) * r, cx + math.cos(a1) * r, cy + math.sin(a1) * r
        F = Frame((x0 + x1) / 2, (y0 + y1) / 2, z_of((x0 + x1) / 2, (y0 + y1) / 2), am)
        box(B, F, -r * (a1 - a0) / 2, r * (a1 - a0) / 2, -.02, .02, .5, .55, col, .02)
        box(B, F, -.025, .025, -.025, .025, -.3, .62, col, .02)
    for s in (-1, 1):
        a = porte_ang + s * .17; px, py = cx + math.cos(a) * r, cy + math.sin(a) * r
        F = Frame(px, py, z_of(px, py), porte_ang); box(B, F, -.14, .14, -.14, .14, -.3, .85, H('#d8cfbe'), .03)
        vs = C.bm_uvsphere(B.bm, F.p(0, 0, .95), .1, 8, 5); B.paint(vs, H('#d8cfbe'), .02)


def K_angd(a, b): return abs((a - b + math.pi) % (2 * math.pi) - math.pi)


def auberge(B, x, y, z0, ang, rnd):
    """auberge-restaurant (Meshi [C]) : grande maison à colombages, enseigne pendue (sans texte), bancs et tonneaux [I]"""
    top = colombage(B, x, y, z0, ang, 2.1, 1.25, rnd, 'tuile')
    F = Frame(x, y, z0, ang)
    box(B, F, -.03, .03, .62, 1.05, 1.0, 1.04, COLOMBE, .02)                                     # potence
    box(B, F, -.02, .02, .85, 1.05, .62, .95, H('#c8962a'), .04)                                 # enseigne (sans texte)
    for u in (-.7, .7):
        box(B, F, u - .35, u + .35, 1.15, 1.45, .3, .36, H('#8a6440'), .04)                       # table
        for dv in (1.0, 1.6): box(B, F, u - .35, u + .35, dv, dv + .12, .18, .22, H('#7a5638'), .04)
    for u in (-1.2, 1.2):
        vs = C.bm_cyl(B.bm, F.p(u, .8, -.05), F.p(u, .8, .38), .15, .15, 10); B.paint(vs, H('#7a5236'), .05)
    return top


def chapelle(B, x, y, z0, ang, rnd):
    """chapelle de pierre [I] : nef à toit d'ardoise, tour carrée crénelée à l'ouest, fenêtres en arc"""
    F = Frame(x, y, z0, ang); pierre = H('#c2b9a6')
    box(B, F, -.9, .9, -1.6, 1.0, -.6, 1.2, pierre, .05)
    vs = [B.bm.verts.new(F.p(*p)) for p in ((-1.0, -1.7, 1.2), (1.0, -1.7, 1.2), (1.0, 1.1, 1.2), (-1.0, 1.1, 1.2), (0, -1.7, 2.1), (0, 1.1, 2.1))]
    for f in ((0, 4, 5, 3), (1, 2, 5, 4), (0, 1, 4), (3, 5, 2)): B.bm.faces.new([vs[i] for i in f])
    B.paint(vs, ARDOISE[1], .04)
    for v in (-1.0, -.2, .6):
        for s in (-1, 1): quad(B, F, [(s * .92, v - .12, .45), (s * .92, v + .12, .45), (s * .92, v + .12, .95), (s * .92, v - .12, .95)], H('#2b3f55'), .02)
    box(B, F, -.6, .6, 1.0, 2.0, -.6, 2.6, pierre, .05)                                         # tour
    for k in range(4):
        for s in (-1, 1): box(B, F, s * .6 - (.18 if s > 0 else 0), s * .6 + (.18 if s < 0 else 0), 1.0 + k * .25, 1.0 + k * .25 + .14, 2.6, 2.82, pierre, .04)
    for k in range(4): box(B, F, -.6 + k * .32, -.6 + k * .32 + .16, 1.86, 2.0, 2.6, 2.82, pierre, .04)
    quad(B, F, [(-.16, 2.02, 1.7), (.16, 2.02, 1.7), (.16, 2.02, 2.15), (-.16, 2.02, 2.15)], H('#2b3f55'), .02)
    quad(B, F, [(-.2, 2.02, 0), (.2, 2.02, 0), (.2, 2.02, .75), (-.2, 2.02, .75)], H('#5a3e2c'), .02)
    return 2.82


def phare(B, x, y, z):
    vs = C.bm_cyl(B.bm, C.g2b(x, y, z - .4), C.g2b(x, y, z + 3.4), .5, .36, 14); B.paint(vs, H('#f3eee2'), .02)
    vs = C.bm_cyl(B.bm, C.g2b(x, y, z + 1.6), C.g2b(x, y, z + 2.2), .44, .42, 14); B.paint(vs, H('#b84a3a'), .02)
    vs = C.bm_cyl(B.bm, C.g2b(x, y, z + 3.4), C.g2b(x, y, z + 3.9), .3, .3, 10); B.paint(vs, H('#ffe08a'), .02)
    vs = C.bm_cyl(B.bm, C.g2b(x, y, z + 3.9), C.g2b(x, y, z + 4.3), .38, .02, 10); B.paint(vs, H('#3a3a3a'), .02)


def jetee(B, x, y, ang, L_, z=.45):
    F = Frame(x, y, 0, ang); box(B, F, -.3, .3, 0, L_, z - .08, z, K.BOIS, .05)
    for k in range(int(L_ / .7) + 1):
        for s in (-1, 1):
            vs = C.bm_cyl(B.bm, F.p(s * .27, k * .7, -1.0), F.p(s * .27, k * .7, z + .1), .05, .05, 6); B.paint(vs, K.BOIS2, .04)
