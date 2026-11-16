"""RISK OP — kit VILLE VICTORIENNE PERCHÉE (Mary Geoise, île 10).
[C] style européen XVIIIe-XIXe, victorien pour le château ; château immense à tours (dont une sur le toit), mur fortifié, deux douves et ponts ;
grandes demeures, rues bordées d'arbres, fontaine ; quatre grandes portes ; trottoirs roulants ; Red Port à toits en cylindre, sur de grands
palétuviers, bulles ; bondolas (cabines-bulles sur câbles) ; escaliers taillés bordés de statues ; nuages (One Piece Wiki).
Aspect [I] : pierre blanche, ardoise bleue, ors ; demeures à toit mansardé, lucarnes, portique à colonnes, tourelle à poivrière ;
parcs clos de murets et de haies ; serre victorienne. Aucun symbole, aucun insigne, aucun personnage, aucune copie de décor officiel.
Repère : x est, y sud, z haut (jeu) ; Frame de rk_port (v = façade avant).
"""
import math, random
import rk_common as C
import rk_lib as L
import rk_port as K
from rk_port import Frame, box, quad, hip, prism_x, mansard, window

H = C.hexc
PIERRE = [H('#f2ede2'), H('#e8e0cf'), H('#efe6d6'), H('#e2d8c4')]
PIERRE_SOMBRE = H('#cfc4ae')
ARDOISE = [H('#4a5a70'), H('#56677e'), H('#3f4d62')]
OR = H('#d4a83c')
ROUGE = [H('#b0483a'), H('#9a3e32'), H('#c25c46'), H('#8a3a30'), H('#d07a5e')]
GAZON = H('#7cb05c')
HAIE = H('#3f7a3c')
EAU = H('#5aa0c8')
BULLE = H('#cfeaf4')
FONTE = H('#3a4048')


def epi(B, p, h=.35, col=OR):
    vs = C.bm_cyl(B.bm, p, (p[0], p[1], p[2] + h), .05, .005, 6); B.paint(vs, col, .03)


def poivriere(B, x, y, z0, r, h, hr, rnd, col=None):
    """tourelle ronde à toit conique d'ardoise et épi doré"""
    col = col or PIERRE[rnd.randrange(4)]
    vs = C.bm_cyl(B.bm, C.g2b(x, y, z0), C.g2b(x, y, z0 + h), r, r, 10); B.paint(vs, col, .03)
    vs = C.bm_cyl(B.bm, C.g2b(x, y, z0 + h), C.g2b(x, y, z0 + h + hr), r * 1.18, .02, 10); B.paint(vs, ARDOISE[rnd.randrange(3)], .04)
    epi(B, C.g2b(x, y, z0 + h + hr - .02))
    return z0 + h + hr


def fontaine(B, x, y, z, s=1.0):
    """fontaine à vasques [C : une fontaine dans les rues ; forme I]"""
    vs = C.bm_cyl(B.bm, C.g2b(x, y, z - .1), C.g2b(x, y, z + .22 * s), .9 * s, .9 * s, 16); B.paint(vs, PIERRE[3], .03)
    vs = C.bm_cyl(B.bm, C.g2b(x, y, z + .22 * s), C.g2b(x, y, z + .24 * s), .8 * s, .8 * s, 16); B.paint(vs, EAU, .02)
    vs = C.bm_cyl(B.bm, C.g2b(x, y, z), C.g2b(x, y, z + .75 * s), .12 * s, .1 * s, 8); B.paint(vs, PIERRE[0], .03)
    vs = C.bm_cyl(B.bm, C.g2b(x, y, z + .7 * s), C.g2b(x, y, z + .8 * s), .42 * s, .3 * s, 12); B.paint(vs, PIERRE[1], .03)
    vs = C.bm_cyl(B.bm, C.g2b(x, y, z + .8 * s), C.g2b(x, y, z + 1.15 * s), .06 * s, .03 * s, 6); B.paint(vs, OR, .03)
    vs = C.bm_ico(B.bm, C.g2b(x, y, z + 1.2 * s), .12 * s, 1, (1, 1, 1.4)); B.paint(vs, H('#e8f6fc'), .02)


def portique(B, F, u, v, w, h, n=4):
    """portique à colonnes et fronton"""
    for k in range(n):
        uu = u - w / 2 + w * (k + .5) / n; vs = C.bm_cyl(B.bm, F.p(uu, v, 0), F.p(uu, v, h), .055, .05, 6); B.paint(vs, PIERRE[0], .02)
    box(B, F, u - w / 2 - .05, u + w / 2 + .05, v - .15, v + .12, h, h + .12, PIERRE[1], .02)
    prism_x(B, F, u - w / 2 - .05, u + w / 2 + .05, v - .16, v + .13, h + .12, .28, PIERRE[2])
    box(B, F, u - w / 2 - .1, u + w / 2 + .1, v - .2, v + .25, -.3, .06, PIERRE_SOMBRE, .02)


def demeure(B, x, y, z0, ang, w, d, lot, rnd, Bp=None):
    """[C : grande demeure du Domaine ; aspect I] parc clos (muret, grille, haie), demeure blanche à toit mansardé d'ardoise,
    lucarnes, portique à colonnes, tourelle à poivrière, perron ; parfois une fontaine devant"""
    Bp = Bp or B
    F = Frame(x, y, z0, ang); G = Frame(x, y, z0, ang)
    # parc : muret bas + haie sur trois côtés, grille sur la rue (façade v+)
    L_ = lot / 2
    for (u0, u1, v0, v1) in ((-L_, L_, -L_, -L_ + .12), (-L_, -L_ + .12, -L_, L_), (L_ - .12, L_, -L_, L_)):
        box(Bp, G, u0, u1, v0, v1, -.3, .22, PIERRE[3], .03); box(Bp, G, u0 + .02, u1 - .02, v0 + .02, v1 - .02, .22, .5, HAIE, .08)
    for s in (-1, 1): box(Bp, G, s * .42 if s > 0 else -L_, L_ if s > 0 else -.42, L_ - .1, L_, -.3, .2, PIERRE[3], .03)
    for s in (-1, 1): box(Bp, G, s * .42 - .08, s * .42 + .08, L_ - .12, L_ + .02, -.3, .62, PIERRE[1], .02); epi(Bp, G.p(s * .42, L_ - .05, .62), .14)
    # demeure, reculée au fond du parc
    v0 = -L_ + .55; cv = v0 + d / 2; h = 1.15 + .45 * (rnd.random() < .5)
    col = PIERRE[rnd.randrange(4)]
    box(B, F, -w / 2, w / 2, cv - d / 2, cv + d / 2, -.4, h, col, .03)
    box(B, F, -w / 2 - .03, w / 2 + .03, cv - d / 2 - .03, cv + d / 2 + .03, h * .5, h * .5 + .06, PIERRE_SOMBRE, .02)   # cordon
    for k in range(int(w / .42)):
        u = -w / 2 + .3 + k * .42
        if abs(u) < .3: continue
        for zz in (h * .28, h * .72): window(B, F, u, cv + d / 2, zz, .15, .26)
    sl = ARDOISE[rnd.randrange(3)]
    mansard(B, F, -w / 2 - .06, w / 2 + .06, cv - d / 2 - .06, cv + d / 2 + .06, h, .5, sl, PIERRE_SOMBRE)
    for u in (-w / 4, w / 4):                                                                         # lucarnes
        box(B, F, u - .12, u + .12, cv + d / 2 - .1, cv + d / 2 + .02, h + .1, h + .38, PIERRE[0], .02)
        prism_x(B, F, u - .15, u + .15, cv + d / 2 - .12, cv + d / 2 + .04, h + .38, .14, sl)
    for s in (-1, 1): box(B, F, s * w * .3 - .08, s * w * .3 + .08, cv - .1, cv + .1, h + .3, h + .75, PIERRE[2], .02)   # cheminées
    portique(B, F, 0, cv + d / 2 + .15, .9, h * .62, 4)
    top = h + .5
    if rnd.random() < .55:
        su = rnd.choice((-1, 1)); top = max(top, poivriere(B, *F_xy(F, su * w / 2, cv + d / 2 - .05), z0 - .3, .32, h + .55, .55, rnd, col) - z0)
    if rnd.random() < .35: fontaine(Bp, *F_xy(G, 0, L_ - .95), z0, .55)
    return top


def F_xy(F, u, v):
    p = F.p(u, v, 0); return p[0], -p[1]


def pavillon(B, x, y, z0, ang, w, d, rnd):
    """[I] kiosque de jardin octogonal"""
    for k in range(8):
        a = k / 8 * 2 * math.pi; vs = C.bm_cyl(B.bm, C.g2b(x + math.cos(a) * .32, y + math.sin(a) * .32, z0), C.g2b(x + math.cos(a) * .32, y + math.sin(a) * .32, z0 + .55), .03, .03, 4); B.paint(vs, PIERRE[0], .02)
    vs = C.bm_cyl(B.bm, C.g2b(x, y, z0 - .2), C.g2b(x, y, z0 + .06), .42, .42, 8); B.paint(vs, PIERRE[3], .02)
    vs = C.bm_cyl(B.bm, C.g2b(x, y, z0 + .55), C.g2b(x, y, z0 + .95), .48, .03, 8); B.paint(vs, ARDOISE[0], .03)
    epi(B, C.g2b(x, y, z0 + .93), .15)
    return .95


def hangar(B, x, y, z0, ang, w, d, rnd):
    """[C : bâtiments bas à toits en cylindre de la Red Port] corps bas enduit, voûte en demi-cylindre"""
    F = Frame(x, y, z0, ang)
    box(B, F, -w / 2, w / 2, -d / 2, d / 2, -.4, .45, H('#e6dccb'), .03)
    n = 8; vs = []
    for k in range(n + 1):
        a = math.pi * k / n; v = -d / 2 * math.cos(a); z = .45 + d / 2 * math.sin(a) * .8
        vs.append((C.mix(H('#b85a3a'), H('#c86a48'), k % 2), [B.bm.verts.new(F.p(u, v, z)) for u in (-w / 2 - .05, w / 2 + .05)]))
    for (c0, a), (c1, b) in zip(vs, vs[1:]):
        f = B.bm.faces.new((a[0], a[1], b[1], b[0])); B.paint(list(f.verts), c0, .03)
    for s in (-1, 1): quad(B, F, [(-.2, d / 2 + .01, 0), (.2, d / 2 + .01, 0), (.2, d / 2 + .01, .38), (-.2, d / 2 + .01, .38)], K.PORTE, .02) if s > 0 else None
    return .45 + d * .4


def chateau(B, x, y, z0, rnd, face=0.0):
    """[C] château de Pangaea : immense, au moins six étages, tours dont une sur le toit, victorien ; mur fortifié ; deux douves
    (eau posée par le sol) franchies par des ponts ; partie extérieure le long des douves, château intérieur entièrement couvert.
    Aspect [I] : pierre blanche, ardoise bleue, ors. face : direction du pont principal (vers le carrefour). Rend la hauteur du sommet."""
    # mur fortifié extérieur (au-delà des douves) à tours rondes
    n = 22; pts = [(x + math.cos(k / n * 2 * math.pi) * 6.0, y + math.sin(k / n * 2 * math.pi) * 6.0) for k in range(n)]
    for k in range(n):
        a, b = pts[k], pts[(k + 1) % n]; am = (k + .5) / n * 2 * math.pi
        if abs(((am - face + math.pi) % (2 * math.pi)) - math.pi) < .2: continue                      # passage du pont
        F = Frame((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, z0, am)
        L_ = math.hypot(b[0] - a[0], b[1] - a[1]) / 2 + .02
        box(B, F, -L_, L_, -.18, .18, -.4, .9, PIERRE[3], .03)
        for u in (-L_ * .5, L_ * .5): box(B, F, u - .1, u + .1, -.2, .2, .9, 1.08, PIERRE[3], .02)
    for k in range(0, n, 4):
        px, py = pts[k]; poivriere(B, px, py, z0 - .4, .38, 1.6, .5, rnd, PIERRE[1])
    # ponts sur les deux douves, vers le carrefour
    Fp = Frame(x, y, z0, face)
    box(B, Fp, -.55, .55, 4.0, 6.4, -.1, .12, PIERRE[2], .02)
    for s in (-1, 1): box(B, Fp, s * .55 - .06, s * .55 + .06, 4.0, 6.4, .12, .4, PIERRE[1], .02)
    for s in (-1, 1): poivriere(B, *F_xy(Fp, s * 1.1, 6.05), z0 - .2, .42, 2.0, .7, rnd, PIERRE[0])          # tours de la porte
    box(B, Fp, -1.1, 1.1, 5.8, 6.3, 1.5, 2.1, PIERRE[1], .02)
    # partie extérieure : galerie en anneau le long de la douve intérieure
    m = 20
    for k in range(m):
        am = (k + .5) / m * 2 * math.pi
        if abs(((am - face + math.pi) % (2 * math.pi)) - math.pi) < .22: continue
        F = Frame(x + math.cos(am) * 3.85, y + math.sin(am) * 3.85, z0, am)
        L_ = 3.85 * math.pi / m + .03
        box(B, F, -L_, L_, -.3, .3, -.4, 1.7, PIERRE[k % 2], .02)
        mansard(B, F, -L_ - .03, L_ + .03, -.35, .35, 1.7, .4, ARDOISE[k % 3], PIERRE_SOMBRE)
        window(B, F, 0, .3, .55, .2, .3); window(B, F, 0, .3, 1.2, .2, .3)
    # château intérieur entièrement couvert : six étages en retraits, tours d'angle, tour sur le toit
    G = Frame(x, y, z0, face)
    tiers = [(2.8, 2.6), (2.3, 1.6), (1.7, 1.2)]; z = 0
    for k, (s_, h) in enumerate(tiers):
        box(B, G, -s_, s_, -s_ * .85, s_ * .85, z - (.4 if k == 0 else 0), z + h, PIERRE[k % 2], .02)
        for kk in range(int(h / .55)):
            for u in [i * .55 - s_ + .4 for i in range(int(2 * s_ / .55))]:
                window(B, G, u, s_ * .85, z + .35 + kk * .55, .16, .26)
        box(B, G, -s_ - .05, s_ + .05, -s_ * .85 - .05, s_ * .85 + .05, z + h, z + h + .1, PIERRE_SOMBRE, .02)
        for su in (-1, 1):
            for sv in (-1, 1): poivriere(B, *F_xy(G, su * s_, sv * s_ * .85), z0 + z, .45 - .08 * k, h + .4, .8 - .1 * k, rnd, PIERRE[2])
        z += h + .1
    mansard(B, G, -1.3, 1.3, -1.1, 1.1, z, .7, ARDOISE[0], PIERRE_SOMBRE)
    top = poivriere(B, x, y, z0 + z, .7, 2.2, 1.6, rnd, PIERRE[0]) - z0                                   # tour du toit [C]
    portique(B, G, 0, 2.8 * .85 + .1, 1.6, 1.4, 6)
    return top


def mur_enceinte(B, pts_z, h=.9, ep=.35):
    """[C] mur d'enceinte ; créneaux [I]. pts_z : liste de (x, y, z) le long de l'anneau (ouvertures déjà retirées)"""
    for (ax, ay, az), (bx, by, bz) in zip(pts_z, pts_z[1:]):
        L_ = math.hypot(bx - ax, by - ay)
        if L_ > 2.5: continue
        F = Frame((ax + bx) / 2, (ay + by) / 2, min(az, bz), math.atan2(by - ay, bx - ax) - math.pi / 2)
        box(B, F, -L_ / 2 - .02, L_ / 2 + .02, -ep / 2, ep / 2, -.5, h, PIERRE[3], .03)
        box(B, F, -L_ / 4, L_ / 4, -ep / 2 - .02, ep / 2 + .02, h, h + .18, PIERRE[3], .02)


def grande_porte(B, x, y, z0, ang, rnd):
    """[C] grande porte du mur d'enceinte ; aspect [I] : deux tours carrées à toit pyramidal, arc, attique, épis dorés"""
    F = Frame(x, y, z0, ang)
    for s in (-1, 1):
        box(B, F, s * 1.15 - .5, s * 1.15 + .5, -.5, .5, -.5, 2.6, PIERRE[0], .02)
        hip(B, F, s * 1.15 - .58, s * 1.15 + .58, -.58, .58, 2.6, .9, ARDOISE[1]); epi(B, F.p(s * 1.15, 0, 3.45), .3)
        for zz in (.9, 1.8): window(B, F, s * 1.15, .5, zz, .18, .3)
    box(B, F, -.65, .65, -.45, .45, 1.7, 2.4, PIERRE[1], .02)
    box(B, F, -.7, .7, -.5, .5, 2.4, 2.55, PIERRE_SOMBRE, .02)
    return 3.5


def trottoir_roulant(B, a, b, z_of, off):
    """[C] trottoir roulant le long d'un axe : bande grise à lattes, garde-corps de fonte"""
    ang = math.atan2(b[1] - a[1], b[0] - a[0]); L_ = math.hypot(b[0] - a[0], b[1] - a[1]); n = max(1, int(L_ / 1.2))
    for k in range(n):
        f = (k + .5) / n; x, y = a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f
        F = Frame(x, y, z_of(x, y), ang - math.pi / 2)
        box(B, F, -L_ / n / 2, L_ / n / 2, off - .22, off + .22, -.1, .06, H('#7a8088') if k % 2 else H('#868c94'), .02)
        for s in (-1, 1): box(B, F, -L_ / n / 2, L_ / n / 2, off + s * .25 - .02, off + s * .25 + .02, .06, .28, FONTE, .02)


def paletuvier(B, x, y, z, s, rnd):
    """[C : la Red Port est bâtie sur deux grands palétuviers] tronc énorme, racines en arcs, couronne"""
    vs = C.bm_tube(B.bm, [C.g2b(x, y, z + .5), C.g2b(x, y, z + 3.5 * s), C.g2b(x + .2, y, z + 5.0 * s)], lambda t: (1.0 - .5 * t) * s, 10); B.paint(vs, H('#8a7a5a'), .05)
    for k in range(7):
        a = k / 7 * 2 * math.pi + rnd.random() * .3; dx, dy = math.cos(a), math.sin(a)
        pts = [C.g2b(x + dx * .6 * s, y + dy * .6 * s, z + 1.4 * s), C.g2b(x + dx * 1.6 * s, y + dy * 1.6 * s, z + 1.1 * s), C.g2b(x + dx * 2.3 * s, y + dy * 2.3 * s, z - .6)]
        vs = C.bm_tube(B.bm, pts, lambda t: (.32 - .12 * t) * s, 5); B.paint(vs, H('#7a6a4c'), .05)
    for k in range(4):
        a = k * 1.57 + rnd.random(); vs = C.bm_ico(B.bm, C.g2b(x + math.cos(a) * 1.3 * s, y + math.sin(a) * 1.3 * s, z + (5.0 + .5 * rnd.random()) * s), 1.6 * s, 1, (1, 1, .55), .25, rnd.random() * 9)
        B.paint(vs, C.mix(H('#4f8a3a'), H('#6a9a4a'), rnd.random()), .08)


def bulle(B, x, y, z, r):
    vs = C.bm_ico(B.bm, C.g2b(x, y, z), r, 2); B.paint(vs, lambda co: C.mix(BULLE, H('#ffffff'), max(0, (co.z - z) / r)), .02)


def bondola(B, bas, haut, t, rnd):
    """[C] bondola : grande cabine-bulle reliée par des câbles, entre la Red Port (bas) et Mary Geoise (haut). t : position sur la ligne"""
    for off in (-.25, .25):                                                                          # deux câbles
        a = (bas[0], bas[1] + off, bas[2]); b = (haut[0], haut[1] + off, haut[2])
        vs = C.bm_cyl(B.bm, C.g2b(*a), C.g2b(*b), .025, .025, 4); B.paint(vs, FONTE, .02)
    p = [bas[i] + (haut[i] - bas[i]) * t for i in range(3)]
    vs = C.bm_cyl(B.bm, C.g2b(p[0], p[1], p[2] + .1), C.g2b(p[0], p[1], p[2] - .5), .05, .05, 4); B.paint(vs, FONTE, .02)
    bulle(B, p[0], p[1], p[2] - 1.2, .75)
    vs = C.bm_cyl(B.bm, C.g2b(p[0], p[1], p[2] - 1.85), C.g2b(p[0], p[1], p[2] - 1.75), .55, .55, 10); B.paint(vs, H('#c8a050'), .03)


def gare_bondola(B, x, y, z0, ang):
    """[I] station de bondola : quai, portique de fonte et poulies"""
    F = Frame(x, y, z0, ang)
    box(B, F, -1.0, 1.0, -.8, .8, -.4, .25, PIERRE[3], .02)
    for s in (-1, 1): box(B, F, s * .9 - .08, s * .9 + .08, -.08, .08, .25, 2.0, FONTE, .02)
    box(B, F, -1.0, 1.0, -.1, .1, 1.95, 2.15, FONTE, .02)
    for s in (-1, 1): vs = C.bm_cyl(B.bm, F.p(s * .25, -.15, 2.05), F.p(s * .25, .15, 2.05), .2, .2, 10); B.paint(vs, OR, .03)


def statue(B, x, y, z, rnd):
    """[C : statues de personnes inconnues le long des escaliers ; forme I, abstraite] socle, silhouette drapée sans visage"""
    vs = C.bm_cyl(B.bm, C.g2b(x, y, z - .1), C.g2b(x, y, z + .35), .2, .2, 6); B.paint(vs, PIERRE[3], .02)
    vs = C.bm_cyl(B.bm, C.g2b(x, y, z + .35), C.g2b(x, y, z + 1.05), .17, .11, 8); B.paint(vs, PIERRE[0], .02)
    vs = C.bm_ico(B.bm, C.g2b(x, y, z + 1.17), .1, 1); B.paint(vs, PIERRE[0], .02)


def nuage(B, x, y, z, s, rnd):
    """[C] nuages et brume autour de la ville perchée"""
    for k in range(3 + rnd.randrange(3)):
        vs = C.bm_ico(B.bm, C.g2b(x + rnd.uniform(-1, 1) * s, y + rnd.uniform(-1, 1) * s, z + rnd.uniform(0, .4) * s), (.7 + .5 * rnd.random()) * s, 1, (1.3, 1.3, .55), .2, rnd.random() * 9)
        B.paint(vs, lambda co: C.mix(H('#d8e2ea'), H('#ffffff'), max(0, min(1, (co.z - z + .3 * s) / (1.2 * s)))), .02)


def serre(B, x, y, z0, ang):
    """[I] niveau 4 : serre victorienne (fonte blanche et verre), nef et coupole"""
    F = Frame(x, y, z0, ang); verre = H('#bfe0e8')
    box(B, F, -1.4, 1.4, -.7, .7, -.3, .15, PIERRE[3], .02)
    box(B, F, -1.3, 1.3, -.6, .6, .15, 1.0, verre, .03)
    for k in range(9):
        u = -1.3 + k * 2.6 / 8; box(B, F, u - .025, u + .025, -.62, .62, .15, 1.02, PIERRE[0], .01)
    prism_x(B, F, -1.32, 1.32, -.62, .62, 1.0, .5, verre)
    vs = C.bm_uvsphere(B.bm, F.p(0, 0, 1.1), 1, 12, 6, (.75, .75, .85)); B.paint(vs, lambda co: verre if int(co.z * 8) % 3 else PIERRE[0], .02)
    epi(B, F.p(0, 0, 1.9), .3)
    return 2.2


# ---------------------------------------------------------------- arbres [C : rues bordées d'arbres, forêt plantée ; formes I]
def arbre_rond(B, x, y, z, s, rnd):
    vs = C.bm_cyl(B.bm, C.g2b(x, y, z - .2), C.g2b(x, y, z + .7 * s), .07 * s, .05 * s, 5); B.paint(vs, H('#6a5040'), .04)
    vs = C.bm_ico(B.bm, C.g2b(x, y, z + 1.05 * s), .55 * s, 1, (1, 1, .9)); B.paint(vs, C.mix(H('#4a8a40'), H('#5f9a4a'), rnd.random()), .08)


def arbre_taille(B, x, y, z, s, rnd):
    """arbre taillé en cône (jardin à la française)"""
    vs = C.bm_cyl(B.bm, C.g2b(x, y, z - .2), C.g2b(x, y, z + .2 * s), .05 * s, .05 * s, 4); B.paint(vs, H('#6a5040'), .04)
    vs = C.bm_cyl(B.bm, C.g2b(x, y, z + .15 * s), C.g2b(x, y, z + 1.3 * s), .38 * s, .03, 8); B.paint(vs, HAIE, .05)


def cypres(B, x, y, z, s, rnd): K.cypres(B, x, y, z, s * .8)
