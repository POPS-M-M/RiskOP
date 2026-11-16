"""RISK OP — kit RUINES ANCIENNES ET EXPÉDITION (Laugh Tale, île 9).
[C] seulement : « des objets qui ont la forme de bâtiments ou de fortifications », falaises abruptes, nature sauvage (One Piece Wiki).
Tout l'aspect est une interprétation [I] : pierre en gros blocs gris-bleu, murs au sommet déchiqueté, maisons sans toit, bastions ronds
tronqués, citadelle à double enceinte, porte monumentale, tour brisée, mousse ; camp d'expédition (tentes, caisses, postes de guet),
restaurations (rangs de pierre neuve, charpentes), phare-balise ; très grands arbres, feuillus, conifères, aiguilles rocheuses.
Aucune copie de décor officiel, aucun emblème, aucun Poneglyphe, aucun trésor.
Repère : x est, y sud, z haut (jeu) ; Frame de rk_port (v = façade avant).
"""
import math, random
import rk_common as C
import rk_lib as L
from rk_port import Frame, box, quad, hip, prism_x

H = C.hexc
PIERRE = [H('#a9a79c'), H('#9d9b90'), H('#b4b0a2'), H('#8d8b82')]     # pierre ancienne gris-bleu [I]
PIERRE_NEUVE = H('#d6cdb4')                                           # rangs restaurés, plus clairs
MOUSSE = [H('#5f7d3c'), H('#4a6a34'), H('#7c9448')]
BOIS = [H('#7a5636'), H('#8a6440'), H('#6a4a2e')]
BOIS_NEUF = H('#b88a58')
TOILE = [H('#e6dcc2'), H('#d8ccae'), H('#c8562e'), H('#e2d6b8')]
FALAISE = [H('#cfc6b0'), H('#b4aa94'), H('#8e8676'), H('#9a8e78'), H('#e2dccb')]


def moussu(col, z0, h, k=.55):
    """pierre verdie en pied et par plaques (couleur de sommet selon la hauteur et un bruit)"""
    def f(co):
        t = max(0.0, 1 - (co.z - z0) / max(.05, h * .45)); n = .5 + .5 * math.sin(co.x * 3.1 + co.y * 2.3) * math.cos(co.y * 2.7 - co.z * 4)
        return C.mix(col, MOUSSE[int(abs(co.x * 7 + co.y * 3)) % 3], min(k, t * .8 + (n > .82) * .45))
    return f


def profil(n, h, rnd, trou=.12, hmin=.4):
    """hauteurs de n blocs : ligne de sommet déchiquetée mais continue (bruit lissé), brèches de 1 à 3 blocs"""
    ph, f = rnd.uniform(0, 6.3), rnd.uniform(.5, 1.1); out = []
    for k in range(n):
        t = .5 + .5 * math.sin(k * f + ph) * math.cos(k * f * .37 + ph * 2)
        out.append(h * (hmin + (1 - hmin) * (.35 + .65 * t)) * rnd.uniform(.94, 1.0))
    if n > 3 and rnd.random() < trou * n / 3:
        k0 = rnd.randrange(1, n - 1)
        for k in range(k0, min(n - 1, k0 + rnd.randint(1, 3))): out[k] = h * rnd.uniform(.05, .22)
    return out


def courses(col, z0):
    """assises de pierre : bandes horizontales légèrement plus sombres"""
    return lambda co: C.mix(col, PIERRE[3], .18 * (int((co.z - z0) * 3.2) % 2))


def bande(B, pts, zb, zt, ep, col, closed=False):
    """mur d'un seul tenant le long de pts (repère jeu) : base zb[k], sommet zt[k] (ligne de sommet déchiquetée continue), épaisseur ep.
    Un seul maillage : le rendu au trait ne dessine que la silhouette et le sommet, pas chaque bloc."""
    n = len(pts); nr = []
    for k in range(n):
        a = pts[(k - 1) % n] if (closed or k > 0) else pts[k]; b = pts[(k + 1) % n] if (closed or k < n - 1) else pts[k]
        dx, dy = b[0] - a[0], b[1] - a[1]; L_ = math.hypot(dx, dy) or 1; nr.append((-dy / L_ * ep / 2, dx / L_ * ep / 2))
    V = [[B.bm.verts.new(C.g2b(pts[k][0] + sg * nr[k][0], pts[k][1] + sg * nr[k][1], z)) for sg in (-1, 1) for z in (zb[k], zt[k])] for k in range(n)]
    m = n if closed else n - 1
    for k in range(m):
        a, b = V[k], V[(k + 1) % n]
        for f in ((a[0], b[0], b[1], a[1]), (a[3], b[3], b[2], a[2]), (a[1], b[1], b[3], a[3])): B.bm.faces.new(f)
    if not closed:
        for a, rev in ((V[0], True), (V[-1], False)):
            f = (a[0], a[1], a[3], a[2]); B.bm.faces.new(tuple(reversed(f)) if rev else f)
    vs = [v for r in V for v in r]; B.paint(vs, col, .04); return vs


def mur_brise(B, F, u0, u1, v0, v1, z0, h, rnd, col=None, trou=.12, pas=.38, hmin=.4):
    """mur en gros blocs au sommet déchiqueté ; quelques brèches. Rend la hauteur minimale restée debout."""
    col = col or PIERRE[rnd.randrange(len(PIERRE))]; n = max(1, int(round((u1 - u0) / pas))); hs = profil(n + 1, h, rnd, trou, hmin)
    vm = (v0 + v1) / 2; pts = []
    for k in range(n + 1):
        p = F.p(u0 + (u1 - u0) * k / n, vm, 0); pts.append((p[0], -p[1]))
    bande(B, pts, [F.z0 + z0 - .5] * (n + 1), [F.z0 + z0 + hk for hk in hs], abs(v1 - v0), pierre_fn(col, F.z0 + z0, h))
    return min(hs)


def pierre_fn(col, z0, h):
    m = moussu(col, z0, h); return lambda co: C.mix(m(co), PIERRE[3], .16 * (int((co.z - z0) * 3.2) % 2))


def gravats_sol(B, x, y, R_, n, z_of, rnd, r=(.15, .35)):
    """gravats posés sur le terrain autour de (x, y)"""
    for k in range(n):
        a = rnd.uniform(0, 6.283); d = R_ * (.5 + .5 * rnd.random()); px, py = x + math.cos(a) * d, y + math.sin(a) * d
        vs = C.bm_ico(B.bm, C.g2b(px, py, z_of(px, py) + .05), rnd.uniform(*r), 0, (1.3, 1, .7)); B.paint(vs, C.mix(PIERRE[k % 4], MOUSSE[1], .25 * rnd.random()), .08)


def gravats(B, F, n, u0, u1, v0, v1, z, rnd, r=(.08, .22)):
    for k in range(n):
        vs = C.bm_ico(B.bm, F.p(rnd.uniform(u0, u1), rnd.uniform(v0, v1), z), rnd.uniform(*r), 0, (1.3, 1, .7)); B.paint(vs, C.mix(PIERRE[k % 4], MOUSSE[1], .25 * rnd.random()), .08)


def coquille(B, x, y, z0, ang, w, d, rnd):
    """maison sans toit [C : forme de bâtiment ; aspect I] : quatre murs épais au sommet brisé, porte côté façade (v+), gravats dedans.
    Rend la hauteur nominale des murs (la restauration complète jusque-là)."""
    F = Frame(x, y, z0, ang); t = .14; h = .75 + .35 * rnd.random(); col = PIERRE[rnd.randrange(4)]
    mur_brise(B, F, -w / 2, w / 2, -d / 2, -d / 2 + t, 0, h, rnd, col)
    for s in (-1, 1): mur_brise(B, Frame(x, y, z0, ang - math.pi / 2), -d / 2, d / 2, s * w / 2 - t / 2, s * w / 2 + t / 2, 0, h * rnd.uniform(.7, 1), rnd, col)
    for s in (-1, 1): mur_brise(B, F, s * .2 if s > 0 else -w / 2, w / 2 if s > 0 else -.2, d / 2 - t, d / 2, 0, h * .9, rnd, col)
    box(B, F, -.24, .24, d / 2 - t - .02, d / 2 + .02, h * .78, h * .9, C.mix(col, H('#ffffff'), .1), .04) if rnd.random() < .5 else None   # linteau resté
    gravats(B, F, 4, -w / 2 + .2, w / 2 - .2, -d / 2 + .2, d / 2 - .25, .02, rnd)
    return h


def restauration(B, x, y, z0, ang, w, d, h, rnd):
    """[I] maison relevée par l'expédition : rang supérieur en pierre neuve, charpente et toit de planches ou de toile, porte en bois"""
    F = Frame(x, y, z0, ang); t = .15
    for (u0, u1, v0, v1) in ((-w / 2, w / 2, -d / 2, -d / 2 + t), (-w / 2, w / 2, d / 2 - t, d / 2), (-w / 2, -w / 2 + t, -d / 2, d / 2), (w / 2 - t, w / 2, -d / 2, d / 2)):
        box(B, F, u0 - .01, u1 + .01, v0 - .01, v1 + .01, h * .55, h + .08, PIERRE_NEUVE, .05)
    quad(B, F, [(-.18, d / 2 + .02, 0), (.18, d / 2 + .02, 0), (.18, d / 2 + .02, h * .7), (-.18, d / 2 + .02, h * .7)], BOIS[rnd.randrange(3)], .03)
    if rnd.random() < .7: prism_x(B, F, -w / 2 - .12, w / 2 + .12, -d / 2 - .14, d / 2 + .14, h + .08, .32 * d + .1, BOIS_NEUF if rnd.random() < .6 else H('#9a6a3e'))
    else: hip(B, F, -w / 2 - .1, w / 2 + .1, -d / 2 - .1, d / 2 + .1, h + .08, .35, TOILE[rnd.randrange(2)])
    return h + .4


def tente(B, x, y, z0, ang, w, d, rnd):
    """[I] tente d'expédition à deux pans, toile claire ou rouge, mâts, caisses et tonneau"""
    F = Frame(x, y, z0, ang); col = TOILE[rnd.randrange(len(TOILE))]
    box(B, F, -w / 2, w / 2, -d / 2, d / 2, -.3, .02, H('#8a7a5a'), .05)
    prism_x(B, F, -w / 2, w / 2, -d / 2, d / 2, .02, .62, col)
    for u in (-w / 2 - .03, w / 2 + .03):
        vs = C.bm_cyl(B.bm, F.p(u, 0, 0), F.p(u, 0, .75), .025, .02, 5); B.paint(vs, BOIS[2], .03)
    for k in range(2):
        u = w / 2 + .2 + k * .28; box(B, F, u - .12, u + .12, -.2 + k * .15, .05 + k * .15, -.1, .2 + .05 * k, BOIS[k], .05)
    vs = C.bm_cyl(B.bm, F.p(-w / 2 - .25, .2, -.05), F.p(-w / 2 - .25, .2, .28), .11, .11, 7); B.paint(vs, BOIS[0], .05)
    return .7


def feu_de_camp(B, x, y, z):
    for k in range(6):
        a = k * 1.047; vs = C.bm_ico(B.bm, C.g2b(x + math.cos(a) * .32, y + math.sin(a) * .32, z), .09, 0); B.paint(vs, PIERRE[3], .05)
    vs = C.bm_cyl(B.bm, C.g2b(x, y, z), C.g2b(x, y, z + .32), .14, .01, 6); B.paint(vs, H('#f08a2a'), .1)


def palissade(B, pts, z_of, h=.7):
    for (ax, ay), (bx, by) in zip(pts, pts[1:]):
        L_ = math.hypot(bx - ax, by - ay); n = max(1, int(L_ / .16))
        for k in range(n):
            f = (k + .5) / n; x, y = ax + (bx - ax) * f, ay + (by - ay) * f; z = z_of(x, y)
            vs = C.bm_cyl(B.bm, C.g2b(x, y, z - .3), C.g2b(x, y, z + h * (.9 + .1 * (k % 2))), .07, .05, 4); B.paint(vs, BOIS[k % 3], .05)


def guet(B, x, y, z0, ang, w, d, rnd):
    """[I] poste de guet en bois sur le rebord des falaises : quatre poteaux, plate-forme, garde-corps, petit toit de toile"""
    F = Frame(x, y, z0, ang); hp = 1.4
    for su in (-1, 1):
        for sv in (-1, 1): box(B, F, su * .3 - .04, su * .3 + .04, sv * .3 - .04, sv * .3 + .04, -.3, hp + .5, BOIS[1], .03)
    box(B, F, -.42, .42, -.42, .42, hp, hp + .06, BOIS[0], .03)
    for s in (-1, 1): box(B, F, -.42, .42, s * .4 - .02, s * .4 + .02, hp + .25, hp + .3, BOIS[2], .03)
    hip(B, F, -.48, .48, -.48, .48, hp + .5, .3, TOILE[2])
    return hp + .8


def cabane(B, x, y, z0, ang, w, d, rnd):
    """[I] cabane de chantier (planches, toit de toile) et échafaudage contre un pan de mur"""
    F = Frame(x, y, z0, ang)
    box(B, F, -w / 2, w / 2, -d / 2, d / 2, -.3, .55, BOIS[rnd.randrange(3)], .06)
    prism_x(B, F, -w / 2 - .06, w / 2 + .06, -d / 2 - .08, d / 2 + .08, .55, .28, TOILE[rnd.randrange(4)])
    if rnd.random() < .6:
        u = w / 2 + .35; mur_brise(B, Frame(x, y, z0, ang - math.pi / 2), -.5, .5, u - .07, u + .07, 0, 1.0, rnd, hmin=.6)
        for zz in (.45, .9):
            box(B, F, w / 2 + .15, w / 2 + .6, -.55, .55, zz, zz + .04, BOIS_NEUF, .03)
        for sv in (-1, 1): box(B, F, w / 2 + .55 - .03, w / 2 + .55 + .03, sv * .5 - .03, sv * .5 + .03, -.2, 1.05, BOIS[0], .03)
    return .85


def bastion(B, x, y, z0, r, h, rnd, col=None):
    """bastion rond tronqué : fût, cordon, merlons en partie tombés"""
    col = col or PIERRE[rnd.randrange(4)]
    vs = C.bm_cyl(B.bm, C.g2b(x, y, z0 - .8), C.g2b(x, y, z0 + h), r * 1.08, r, 12); B.paint(vs, moussu(col, z0, h, .4), .07)
    vs = C.bm_cyl(B.bm, C.g2b(x, y, z0 + h * .62), C.g2b(x, y, z0 + h * .68), r * 1.06, r * 1.06, 12); B.paint(vs, C.mix(col, H('#ffffff'), .12), .04)
    for k in range(10):
        if rnd.random() < .35: continue
        a = k / 10 * 2 * math.pi; F = Frame(x + math.cos(a) * r * .86, y + math.sin(a) * r * .86, z0 + h, a)
        box(B, F, -.13, .13, -.12, .12, 0, rnd.uniform(.15, .32), col, .06)


def mur_ligne(B, a, b, z_of, h, ep, rnd, col=None, pas=.42):
    """mur d'enceinte suivant le terrain, en tronçons au sommet brisé"""
    ang = math.atan2(b[1] - a[1], b[0] - a[0]); L_ = math.hypot(b[0] - a[0], b[1] - a[1]); n = max(1, int(L_ / pas))
    col = col or PIERRE[rnd.randrange(4)]; hs = profil(n + 1, h, rnd, .3, .55)
    pts = [(a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n) for k in range(n + 1)]; zs = [z_of(x, y) for x, y in pts]
    bande(B, pts, [z - .6 for z in zs], [z + hk for z, hk in zip(zs, hs)], ep, pierre_fn(col, min(zs), h))


def anneau(cx, cy, rx, ry, n, a0=0.0):
    return [(cx + math.cos(a0 + k / n * 2 * math.pi) * rx, cy + math.sin(a0 + k / n * 2 * math.pi) * ry) for k in range(n + 1)]


def citadelle(B, x, y, z_of, R, rnd, porte_a=0.0):
    """[C : forme de fortifications ; aspect I] double enceinte (6 bastions dehors, 4 tours dedans), porte vers porte_a, donjon effondré au centre.
    Rend la hauteur du sommet du donjon."""
    zc = z_of(x, y)
    ext = anneau(x, y, R * .93, R * .84, 12, porte_a + math.pi / 12)
    for k, (a, b) in enumerate(zip(ext, ext[1:])):
        if k == 11: continue                                                       # porte (entre deux bastions)
        mur_ligne(B, a, b, z_of, 1.5, .42, rnd)
    for k in range(0, 12, 2):
        bx, by = ext[k]; bastion(B, bx, by, z_of(bx, by), .78, 1.9, rnd)
    for s in (-1, 1):                                                              # tours de la porte
        a = porte_a + s * math.pi / 12 * .92; px, py = x + math.cos(a) * R * .95, y + math.sin(a) * R * .86
        bastion(B, px, py, z_of(px, py), .6, 2.4, rnd)
    inn = anneau(x, y, R * .45, R * .41, 8, porte_a + math.pi / 8)
    for k, (a, b) in enumerate(zip(inn, inn[1:])):
        if k == 7: continue
        mur_ligne(B, a, b, z_of, 2.0, .38, rnd)
    for k in range(0, 8, 2):
        bx, by = inn[k]; bastion(B, bx, by, z_of(bx, by), .55, 2.6, rnd)
    # donjon carré effondré : trois pans debout, le quatrième tombé en gravats
    F = Frame(x, y, zc, porte_a); s_ = 1.25
    box(B, F, -s_, s_, -s_, s_, -.5, .5, PIERRE[3], .05)
    mur_brise(B, F, -s_, s_, -s_, -s_ + .3, .5, 4.2, rnd, PIERRE[0], 0, .3, .5)
    for sg in (-1, 1): mur_brise(B, Frame(x, y, zc, porte_a - math.pi / 2), -s_, s_, sg * (s_ - .15) - .15, sg * (s_ - .15) + .15, .5, 3.6, rnd, PIERRE[1], .05, .3, .35)
    mur_brise(B, F, -s_, s_, s_ - .3, s_, .5, 1.0, rnd, PIERRE[2], .2, .3, .2)
    gravats(B, F, 14, -s_ - .6, s_ + .6, s_, s_ + 1.4, .5, rnd, (.15, .35))
    gravats(B, F, 26, -R * .7, R * .7, -R * .7, R * .7, .0, rnd, (.08, .2))
    return 4.7


def porte_monumentale(B, x, y, z0, ang, rnd):
    """[I] porte monumentale en haut de la grève : deux piliers massifs, linteau à bandeaux, marches ; ouverte vers la chaussée (v+)"""
    F = Frame(x, y, z0, ang); col = PIERRE[0]
    for s in (-1, 1):
        box(B, F, s * 1.35 - .55, s * 1.35 + .55, -.6, .6, -.6, 5.0, moussu(col, z0, 5, .35), .06)
        box(B, F, s * 1.35 - .68, s * 1.35 + .68, -.72, .72, -.6, .5, PIERRE[3], .05)                    # socle
        for z in (1.6, 3.2): box(B, F, s * 1.35 - .58, s * 1.35 + .58, -.63, .63, z, z + .14, PIERRE[2], .04)   # bandeaux
    box(B, F, -2.1, 2.1, -.7, .7, 5.0, 5.9, PIERRE[1], .05)
    box(B, F, -1.9, 1.9, -.75, .75, 5.25, 5.4, PIERRE[3], .03)
    for k in range(4): box(B, F, -1.0, 1.0, -1.6 + k * .3, -1.3 + k * .3, -.4, -.1 + k * .14, PIERRE[2 - k % 2], .03)   # marches côté grève
    for k in range(3):                                                                                                     # bloc tombé du linteau
        vs = C.bm_ico(B.bm, F.p(rnd.uniform(-2.6, -1.8) + k * 3.6 * (k == 2), rnd.uniform(-1.4, 1.4), .1), .3, 0, (1.4, 1, .8)); B.paint(vs, PIERRE[k], .06)
    return 5.9


def chaussee(B, pts, z_of, w=1.1, pas=.45):
    """chaussée dallée qui suit les terrasses (marches là où le sol monte d'un coup)"""
    for (ax, ay), (bx, by) in zip(pts, pts[1:]):
        L_ = math.hypot(bx - ax, by - ay); n = max(1, int(L_ / pas)); ang = math.atan2(by - ay, bx - ax)
        for k in range(n):
            f = (k + .5) / n; x, y = ax + (bx - ax) * f, ay + (by - ay) * f; z = z_of(x, y)
            F = Frame(x, y, z, ang - math.pi / 2)
            box(B, F, -L_ / n / 2 - .005, L_ / n / 2 + .005, -w / 2, w / 2, -.5, .06, C.mix(PIERRE[k % 4], H('#c8c0a8'), .45), .05)
            if k % 3 == 0:
                for s in (-1, 1): box(B, F, -L_ / n / 2, L_ / n / 2, s * (w / 2 + .06) - .06, s * (w / 2 + .06) + .06, -.3, .22, PIERRE[3], .05)


def tour_brisee(B, x, y, z0, rnd):
    """[I] tour ronde très haute, brisée en biseau, au sommet du massif"""
    col = PIERRE[1]; n = 14; r = .85; h = 7.0
    vs = C.bm_cyl(B.bm, C.g2b(x, y, z0 - 1.0), C.g2b(x, y, z0 + .8), 1.3, 1.15, n); B.paint(vs, PIERRE[3], .06)
    n = 20; pts = [(x + math.cos(k / n * 2 * math.pi) * r, y + math.sin(k / n * 2 * math.pi) * r) for k in range(n)]
    tops = []
    for k in range(n):
        am = k / n * 2 * math.pi; hk = h * (.55 + .45 * (.5 + .5 * math.cos(am - .6))) * rnd.uniform(.97, 1.0)
        if k in (6, 7): hk = h * (.42 if k == 6 else .5)                             # brèche
        tops.append(z0 + .8 + hk)
    bande(B, pts, [z0 + .7] * n, tops, .38, courses(col, z0), closed=True)
    for k in range(0, n, 4):                                                          # meurtrières
        am = k / n * 2 * math.pi; F = Frame(x + math.cos(am) * (r + .2), y + math.sin(am) * (r + .2), z0 + .8, am)
        if tops[k] - z0 > 3: box(B, F, -.07, .07, -.01, .02, h * .35, h * .35 + .4, H('#2a2a2a'), .02)
    return h + .8


def tour_guet_ruine(B, x, y, z0, rnd):
    """[C : fortifications vues du rivage ; aspect I] tour carrée en ruine sur le rebord de la falaise"""
    F = Frame(x, y, z0, rnd.uniform(0, 6.283)); h = 2.6 + rnd.random()
    box(B, F, -.85, .85, -.85, .85, -.8, .3, PIERRE[3], .05)
    mur_brise(B, F, -.75, .75, -.75, -.5, .3, h, rnd, hmin=.5)
    mur_brise(B, F, -.75, .75, .5, .75, .3, h * .8, rnd, hmin=.3)
    for s in (-1, 1): mur_brise(B, Frame(x, y, z0, F_ang(F) - math.pi / 2), -.75, .75, s * .62 - .13, s * .62 + .13, .3, h * rnd.uniform(.5, 1), rnd, hmin=.4)
    return h


def F_ang(F): return math.atan2(F.f[1], F.f[0])


def phare_balise(B, x, y, z0):
    """[I] niveau 4 : phare-balise de l'expédition sur la falaise du fjord — tour de pierre neuve, galerie de bois, brasier"""
    vs = C.bm_cyl(B.bm, C.g2b(x, y, z0 - .6), C.g2b(x, y, z0 + 4.2), .85, .6, 12); B.paint(vs, lambda co: PIERRE_NEUVE if int((co.z - z0) / .6) % 2 else H('#c8bea4'), .04)
    vs = C.bm_cyl(B.bm, C.g2b(x, y, z0 + 4.2), C.g2b(x, y, z0 + 4.35), 1.0, 1.0, 12); B.paint(vs, BOIS[0], .03)
    for k in range(8):
        a = k / 8 * 2 * math.pi; vs = C.bm_cyl(B.bm, C.g2b(x + math.cos(a) * .9, y + math.sin(a) * .9, z0 + 4.35), C.g2b(x + math.cos(a) * .9, y + math.sin(a) * .9, z0 + 4.75), .03, .03, 4); B.paint(vs, BOIS[1], .03)
    vs = C.bm_cyl(B.bm, C.g2b(x, y, z0 + 4.35), C.g2b(x, y, z0 + 4.9), .32, .5, 8); B.paint(vs, H('#3a3430'), .03)
    vs = C.bm_cyl(B.bm, C.g2b(x, y, z0 + 4.9), C.g2b(x, y, z0 + 5.7), .42, .02, 8); B.paint(vs, lambda co: C.mix(H('#ffd060'), H('#f05a1e'), min(1, (co.z - z0 - 4.9) / .8)), .05)
    return 5.7


def piton(B, x, y, s, rnd):
    """[I] aiguille rocheuse au large, à strates"""
    h = (3.2 + 2.6 * rnd.random()) * s; r = (1.7 + .5 * rnd.random()) * s; ox, oy = rnd.uniform(-.6, .6) * s, rnd.uniform(-.6, .6) * s
    vs = C.bm_tube(B.bm, [C.g2b(x, y, -2.0), C.g2b(x + ox * .3, y + oy * .3, h * .45), C.g2b(x + ox, y + oy, h)], lambda t: r * (1 - .62 * t ** .8), 8)
    for v in vs: v.co.x += rnd.uniform(-.22, .22) * s; v.co.y += rnd.uniform(-.22, .22) * s
    B.paint(vs, lambda co: FALAISE[int(co.z * 1.6 + 10) % 4] if co.z > .3 else H('#5e5a50'), .06)
    vs = C.bm_ico(B.bm, C.g2b(x + ox, y + oy, h - .1), r * .42, 1, (1, 1, .45)); B.paint(vs, MOUSSE[1], .08)
    return h


def cascade(B, a, b, w, z_top, z_bot):
    """rideau d'eau vertical de a vers b (repère jeu), avec écume en pied"""
    ang = math.atan2(b[1] - a[1], b[0] - a[0]); F = Frame(b[0], b[1], 0, ang - math.pi / 2)
    for k in range(4):
        u0 = -w / 2 + k * w / 4
        quad(B, F, [(u0, 0, z_bot), (u0 + w / 4, 0, z_bot), (u0 + w / 4, -.05 * k, z_top), (u0, -.05 * k, z_top)], C.mix(H('#e8f4f8'), H('#9cc8d8'), (k % 2) * .5), .05)
    for k in range(5):
        vs = C.bm_ico(B.bm, F.p(-w / 2 + k * w / 4, .25, z_bot + .05), .28, 1, (1.2, 1, .45)); B.paint(vs, H('#f4fafc'), .03)


# ---------------------------------------------------------------- végétation (nature sauvage [C], essences [I])
def arbre_geant(B, x, y, z, s, rnd):
    """très grand arbre : fût droit à contreforts, couronne large et plate en deux étages"""
    h = (2.4 + .7 * rnd.random()) * s
    vs = C.bm_tube(B.bm, [C.g2b(x, y, z - .3), C.g2b(x + .05, y, z + h * .5), C.g2b(x, y + .05, z + h)], lambda t: (.22 - .12 * t) * s, 6); B.paint(vs, H('#5a4a3a'), .05)
    for k in range(3):
        a = k * 2.09 + rnd.random(); vs = C.bm_cyl(B.bm, C.g2b(x, y, z + .5 * s), C.g2b(x + math.cos(a) * .45 * s, y + math.sin(a) * .45 * s, z - .2), .1 * s, .03 * s, 4); B.paint(vs, H('#4e4034'), .05)
    g = C.mix(H('#244f2c'), H('#2f6034'), rnd.random())
    vs = C.bm_ico(B.bm, C.g2b(x, y, z + h), 1.25 * s, 1, (1, 1, .42), .25, rnd.random() * 9); B.paint(vs, g, .1)
    vs = C.bm_ico(B.bm, C.g2b(x + .3 * s, y - .2 * s, z + h + .45 * s), .8 * s, 1, (1, 1, .5), .25, rnd.random() * 9); B.paint(vs, C.mix(g, H('#3c7238'), .5), .1)


def feuillu(B, x, y, z, s, rnd):
    vs = C.bm_cyl(B.bm, C.g2b(x, y, z - .2), C.g2b(x, y, z + 1.1 * s), .1 * s, .06 * s, 5); B.paint(vs, H('#5a4a3a'), .05)
    vs = C.bm_ico(B.bm, C.g2b(x, y, z + 1.45 * s), .75 * s, 1, (1, 1, .8), .3, rnd.random() * 9); B.paint(vs, C.mix(H('#2f6034'), H('#3c7238'), rnd.random()), .1)


def conifere(B, x, y, z, s, rnd):
    vs = C.bm_cyl(B.bm, C.g2b(x, y, z - .2), C.g2b(x, y, z + .5 * s), .07 * s, .05 * s, 4); B.paint(vs, H('#4e4034'), .05)
    g = C.mix(H('#1f4a34'), H('#2c5a3c'), rnd.random())
    for k in range(3):
        z0 = z + (.35 + k * .55) * s; vs = C.bm_cyl(B.bm, C.g2b(x, y, z0), C.g2b(x, y, z0 + .9 * s), (.62 - k * .15) * s, .02, 7); B.paint(vs, C.mix(g, H('#3a6a48'), k * .2), .08)


def rocher(B, x, y, z, r, rnd):
    L.rock(B, (x, y, z), r, PIERRE[3], MOUSSE[1], rnd)
