"""RISK OP — kit VALLÉE DES AIGUILLES (God Valley, île 17).
[C] falaises hautes et abruptes, canyons couverts de végétation, montagnes, habitants et roi de l'île (One Piece Wiki « God Valley »,
« God Valley Incident », consultés le 17/11/2026).
[I] d'après l'image de référence de l'utilisateur : deux aiguilles de roche ocre jumelles séparées par une fente, aiguilles plus petites,
pavillons blancs à toits pointus au pied ; toutes les formes, couleurs et proportions sont interprétées (aucune copie de l'image).
Exclus : personnages, Dragons Célestes, navires, emblèmes, scènes de chasse ou de combat.
Repère : x est, y sud, z haut (jeu) ; Frame de rk_port (v = façade avant).
"""
import math, random
from mathutils import Vector, noise
import rk_common as C
from rk_port import Frame, box, quad, prism_x

H = C.hexc
G = C.g2b
ROCHE = [H('#d0863e'), H('#b86a30'), H('#e2a35a'), H('#c47a38')]
OMBRE = [H('#8a4a2a'), H('#6e3a24'), H('#a85c34')]
VERT = [H('#4f8a3a'), H('#3a6e30'), H('#6aa048'), H('#5a9a40')]
BLANC = [H('#f4f1ea'), H('#ebe7de'), H('#f8f6f0'), H('#e2ddd2')]
TOIT = [H('#c4ced6'), H('#aab6c0'), H('#d6dde2'), H('#b8c2ca')]
BOIS, BOIS2, PAILLE, SABLE = H('#8a6440'), H('#5e4430'), H('#c9a66a'), H('#e6d4a8')


def aiguille(B, ax, ay, z0, rb, h, lx, ly, rnd, coupe=None, n=24, m=18, eff=.5):
    """[I] aiguille de roche : colonnes verticales à arêtes vives, corniches en gradins, sommet déchiqueté, mousse au pied.
    coupe = (px, py, nx, ny, demi_largeur) : le côté de l'aiguille qui dépasse le plan est aplati (fente entre deux aiguilles)."""
    ph = rnd.random() * 9; rings = []; ridge = {}
    tri = lambda u: 2 * abs((u % 1.0) - .5)
    paliers = sorted(rnd.uniform(.18, .85) for _ in range(3))
    zs = []
    for j in range(m + 1):
        t = j / m; zs.append((t, z0 - 1.0 + (h + 1.0) * t))
        for p_ in paliers:                                                    # corniche : deux anneaux presque à la même hauteur
            if t < p_ <= (j + 1) / m: zs.append((p_ - .001, z0 - 1.0 + (h + 1.0) * (p_ - .001))); zs.append((p_, z0 - 1.0 + (h + 1.0) * p_ + .05))
    zs.sort()
    for t, z in zs:
        step = sum(.07 for p_ in paliers if t >= p_)
        rr = rb * (1 - eff * t ** 1.1 - step) * (1.18 if t == 0 else 1) * (1 + .12 * (1 - ss_(0, .12, t))) * (1 + .05 * math.sin(t * 9 + ph))
        cx, cy = ax + lx * (z - z0), ay + ly * (z - z0)
        ring = []
        for i in range(n):
            a = i / n * 2 * math.pi
            rv = tri(a * 7 / (2 * math.pi) + ph * .3)                          # arêtes des colonnes
            k = 1 + .16 * (rv - .5) + .07 * math.sin(3 * a + ph) + .1 * noise.noise(Vector((math.cos(a) * 2, math.sin(a) * 2, z * .15 + ph)))
            px, py = cx + math.cos(a) * rr * k, cy + math.sin(a) * rr * k
            if coupe:
                qx, qy, nx, ny, w = coupe; s_ = (px - qx) * nx + (py - qy) * ny + w
                if s_ > 0: px -= nx * s_; py -= ny * s_
            zz = z + (rnd.uniform(0, min(1.4, rb * .3)) if t >= 1 else 0)          # sommet déchiqueté
            v = B.bm.verts.new(G(px, py, zz)); ring.append(v); ridge[v] = rv
        rings.append(ring)
    for j in range(len(rings) - 1):
        for i in range(n):
            a, b = rings[j][i], rings[j][(i + 1) % n]; c, d = rings[j + 1][(i + 1) % n], rings[j + 1][i]
            B.bm.faces.new((a, b, c, d))
    top = B.bm.verts.new(G(ax + lx * h, ay + ly * h, z0 + h + min(1.6, rb * .35))); ridge[top] = .5
    for i in range(n): B.bm.faces.new((rings[-1][i], rings[-1][(i + 1) % n], top))
    def col(co, v=None):
        z = co.z
        strate = .5 + .5 * math.sin(z * 1.1 + noise.noise(co * .2) * 3)
        c = C.mix(ROCHE[1], ROCHE[2], .3 + strate * .5)
        mousse = max(0, min(1, (z0 + 3.0 - z) / 3.0)) * (.6 + .4 * noise.noise(co * .5))
        return C.mix(c, VERT[1], max(0, min(.85, mousse)))
    allv = [v for r_ in rings for v in r_] + [top]
    B.paint(allv, col, .05)
    for v in allv:                                                            # creux sombres, arêtes claires, lumière de gauche
        rv = ridge.get(v, .5); c = v[B.col]; k = .64 + .58 * rv
        c = (min(1, c[0] * k), min(1, c[1] * k), min(1, c[2] * k), 1)
        dx_, dy_ = v.co.x - ax, -v.co.y - ay; l_ = math.hypot(dx_, dy_) or 1
        v[B.col] = eclaire(c, dx_ / l_, dy_ / l_) if v is not top else c
    return z0 + h


def ss_(a, b, x):
    t = max(0.0, min(1.0, (x - a) / (b - a))); return t * t * (3 - 2 * t)


def touffes(B, ax, ay, z0, rb, h, lx, ly, rnd, nb):
    """[C : falaises couvertes de végétation] touffes vertes accrochées aux corniches de l'aiguille"""
    for k in range(nb):
        t = rnd.uniform(.05, .55); z = z0 + h * t; a = rnd.uniform(0, 2 * math.pi)
        rr = rb * (1 - .5 * t ** 1.1) * .95
        c = G(ax + lx * (z - z0) + math.cos(a) * rr, ay + ly * (z - z0) + math.sin(a) * rr, z)
        vs = C.bm_ico(B.bm, c, .5 + .5 * rnd.random(), 1, (1, 1, .7), .2, rnd.random() * 9)
        B.paint(vs, VERT[rnd.randrange(4)], .08)


def pavillon(B, x, y, z0, ang, s, etages, rnd):
    """[I d'après la référence] pavillon blanc : socle, murs blancs, toit pointu en tente (un ou deux étages), fleuron"""
    F = Frame(x, y, z0, ang); w = s * .95; mur = BLANC[rnd.randrange(4)]; toit = TOIT[rnd.randrange(4)]
    box(B, F, -w - .08, w + .08, -w - .08, w + .08, -.3, .15, H('#d8d0c0'), .03)
    box(B, F, -w, w, -w, w, .15, 1.15, mur, .03)
    quad(B, F, [(-.22 * s, w + .01, .15), (.22 * s, w + .01, .15), (.22 * s, w + .01, .85), (-.22 * s, w + .01, .85)], H('#7a6a5a'), .02)
    def tente(z, ww, hh, col):
        base = [(-ww, -ww), (ww, -ww), (ww, ww), (-ww, ww)]
        apex = B.bm.verts.new(F.p(0, 0, z + hh)); vs = [apex]
        for i in range(4):
            u0, v0 = base[i]; u1, v1 = base[(i + 1) % 4]
            mu, mv = (u0 + u1) / 2 * 1.06, (v0 + v1) / 2 * 1.06
            a_ = B.bm.verts.new(F.p(u0 * 1.12, v0 * 1.12, z - .12)); b_ = B.bm.verts.new(F.p(u1 * 1.12, v1 * 1.12, z - .12))
            m_ = B.bm.verts.new(F.p(mu * .9, mv * .9, z + hh * .18))                      # pans incurvés (toit en tente)
            B.bm.faces.new((a_, m_, apex)); B.bm.faces.new((m_, b_, apex)); vs += [a_, b_, m_]
        B.paint(vs, col, .04)
    tente(1.15, w, 1.3 * s, toit)
    if etages > 1:
        box(B, F, -w * .55, w * .55, -w * .55, w * .55, 1.6 * s, 2.3 * s, mur, .03)
        tente(2.3 * s, w * .6, 1.0 * s, toit)
        zf = 2.3 * s + 1.0 * s
    else: zf = 1.15 + 1.3 * s
    vs = C.bm_cyl(B.bm, F.p(0, 0, zf - .1), F.p(0, 0, zf + .45), .05, .02, 4); B.paint(vs, H('#c9b07a'), .02)


def hutte(B, x, y, z0, ang, s, rnd):
    """[I] hutte des habitants : murs de terre, toit conique de paille"""
    c = G(x, y, z0)
    vs = C.bm_cyl(B.bm, c + Vector((0, 0, -.3)), c + Vector((0, 0, .9 * s)), .95 * s, .9 * s, 8); B.paint(vs, H('#b08a5e'), .05)
    vs = C.bm_cyl(B.bm, c + Vector((0, 0, .8 * s)), c + Vector((0, 0, 2.0 * s)), 1.25 * s, .05, 9); B.paint(vs, PAILLE, .07)
    F = Frame(x, y, z0, ang); quad(B, F, [(-.25 * s, .93 * s, 0), (.25 * s, .93 * s, 0), (.25 * s, .93 * s, .7 * s), (-.25 * s, .93 * s, .7 * s)], BOIS2, .02)


def palais(B, x, y, z0, ang, rnd):
    """[C : un roi de l'île ; I : forme] palais blanc sur terrasse : escalier, salle à trois toits en tente, tour centrale"""
    F = Frame(x, y, z0, ang)
    box(B, F, -3.6, 3.6, -3.0, 3.0, -.6, .7, H('#d6c8a8'), .03)
    for k in range(4): box(B, F, -1.2, 1.2, 3.0 + k * .35, 3.35 + k * .35, -.6, .55 - k * .17, H('#cfc2a2'), .02)
    box(B, F, -3.0, 3.0, -2.2, 2.2, .7, 2.6, BLANC[0], .03)
    for u in (-2.6, -1.3, 0, 1.3, 2.6): box(B, F, u - .15, u + .15, 2.2, 2.45, .7, 2.6, BLANC[3], .02)
    for u in (-1.95, -.65, .65, 1.95):
        quad(B, F, [(u - .3, 2.21, 1.0), (u + .3, 2.21, 1.0), (u + .3, 2.21, 2.0), (u, 2.21, 2.3), (u - .3, 2.21, 2.0)], H('#5a6a7a'), .02)
    for u, ww, hh in ((-2.0, 1.1, 2.0), (2.0, 1.1, 2.0)):
        G_ = Frame(x + u * F.t[0], y + u * F.t[1], z0, ang); pavillon_toit(B, G_, 2.6, ww, hh)
    box(B, F, -1.2, 1.2, -1.2, 1.2, 2.6, 5.2, BLANC[2], .03)
    pavillon_toit(B, F, 5.2, 1.5, 2.8)
    vs = C.bm_cyl(B.bm, F.p(0, 0, 7.9), F.p(0, 0, 8.7), .07, .03, 4); B.paint(vs, H('#d8b860'), .02)
    return z0 + 8.7


def pavillon_toit(B, F, z, ww, hh):
    apex = B.bm.verts.new(F.p(0, 0, z + hh)); vs = [apex]
    base = [(-ww, -ww), (ww, -ww), (ww, ww), (-ww, ww)]
    for i in range(4):
        u0, v0 = base[i]; u1, v1 = base[(i + 1) % 4]
        a_ = B.bm.verts.new(F.p(u0 * 1.15, v0 * 1.15, z - .15)); b_ = B.bm.verts.new(F.p(u1 * 1.15, v1 * 1.15, z - .15))
        m_ = B.bm.verts.new(F.p((u0 + u1) / 2 * .92, (v0 + v1) / 2 * .92, z + hh * .2))
        B.bm.faces.new((a_, m_, apex)); B.bm.faces.new((m_, b_, apex)); vs += [a_, b_, m_]
    B.paint(vs, TOIT[1], .04)


def arbre_jungle(B, x, y, z, s, rnd):
    """[C : végétation] arbre de jungle léger : tronc et deux masses de feuillage"""
    vs = C.bm_cyl(B.bm, G(x, y, z - .2), G(x, y, z + 1.3 * s), .13 * s, .09 * s, 5); B.paint(vs, H('#6a4a30'), .04)
    g = VERT[rnd.randrange(4)]
    for k, (dx, dy, dz, r) in enumerate(((0, 0, 1.75, .85), (.45, .3, 1.4, .6))):
        c = G(x + dx * s * (1 if rnd.random() < .5 else -1), y + dy * s, z + dz * s)
        vs = C.bm_ico(B.bm, c, r * s, 1, (1, 1, .8), .15, rnd.random() * 9)
        B.paint(vs, lambda co, c=c: C.mix(C.mix(g, (0, .05, .03, 1), .35), g, max(0, min(1, (co.z - c.z + .6 * s) / (1.2 * s)))), .05)


def palmier(B, x, y, z, s, rnd):
    """[I] palmier du rivage (léger)"""
    lean = (rnd.random() - .5) * .8
    top = G(x + lean, y + lean * .5, z + 2.6 * s)
    vs = C.bm_cyl(B.bm, G(x, y, z - .2), top, .1 * s, .07 * s, 5); B.paint(vs, H('#8a6a44'), .04)
    for k in range(6):
        a = k / 6 * 2 * math.pi + rnd.random() * .3
        tip = top + Vector((math.cos(a) * 1.5 * s, math.sin(a) * 1.5 * s, -.7 * s)); mid = top + Vector((math.cos(a) * .8 * s, math.sin(a) * .8 * s, .15 * s))
        side = Vector((-math.sin(a), math.cos(a), 0)) * .22 * s
        vs = [B.bm.verts.new(top), B.bm.verts.new(mid + side), B.bm.verts.new(tip), B.bm.verts.new(mid - side)]; B.bm.faces.new(vs); B.paint(vs, VERT[k % 4], .05)


# ---------------------------------------------------------------- lumière peinte [I, d'après la description de l'utilisateur]
# La lumière du jeu est commune à toutes les îles : la « lumière chaude rasante venant de la gauche » est peinte dans les couleurs de la roche
# (parois ouest dorées, flancs est et intérieur de la faille dans l'ombre).
LUM = (-1.0, .08)
OR, OMBRE_CH = H('#f2b35c'), H('#6a3422')


def eclaire(c, nx, ny, creux=0.0):
    l = math.hypot(*LUM); d = (nx * LUM[0] + ny * LUM[1]) / l
    if d > 0: c = C.mix(c, OR, min(.7, d * .75))
    else: c = C.mix(c, OMBRE_CH, min(.62, -d * .7))
    return C.mix(c, OMBRE_CH, creux)


def demi_mont(B, cx, cy, z0, prof, side, w, rnd, n=34):
    """[I] moitié d'une montagne coupée en deux par une faille droite nord-sud (largeur 2w autour de x = cx).
    side = -1 : moitié ouest (gauche vue du sud), +1 : moitié est. Colonnes verticales, gradins, face intérieure plane dans l'ombre."""
    ph = rnd.random() * 9 + side; tri = lambda u: 2 * abs((u % 1.0) - .5)
    xp = cx + side * w                                                    # plan de la faille
    rings = []; meta = {}
    for (zr, rx, ry) in prof:
        z = z0 + zr; ring = []
        # demi-ellipse : du point nord sur le plan de la faille au point sud sur le plan, en passant par l'extérieur
        a0 = math.acos(max(-1, min(1, w / rx)))                            # angle où l'ellipse coupe le plan
        for i in range(n + 1):
            u = i / n
            # side < 0 : de (π − a0) à (π + a0) en passant par π (ouest) ; side > 0 : de a0 à −a0 en passant par 0 (est)
            a = (math.pi - a0) + u * 2 * a0 if side < 0 else a0 - u * 2 * a0
            rv = tri(a * 11 / (2 * math.pi) + ph * .3)
            k = 1 + .17 * (rv - .5) + .05 * math.sin(3 * a + ph) + .07 * noise.noise(Vector((math.cos(a) * 2, math.sin(a) * 2, z * .12 + ph)))
            if i in (0, n): k = 1.0
            px, py = cx + math.cos(a) * rx * k, cy + math.sin(a) * ry * k
            if i in (0, n): px = xp
            elif side < 0 and px > xp: px = xp
            elif side > 0 and px < xp: px = xp
            zz = z + (rnd.uniform(0, 1.2) if zr == prof[-1][0] and 0 < i < n else 0)
            v = B.bm.verts.new(G(px, py, zz)); ring.append(v); meta[v] = (math.cos(a), math.sin(a), rv, 0)
        rings.append(ring)
    for j in range(len(rings) - 1):
        r0, r1 = rings[j], rings[j + 1]
        for i in range(n): B.bm.faces.new((r0[i], r0[i + 1], r1[i + 1], r1[i]) if side < 0 else (r0[i + 1], r0[i], r1[i], r1[i + 1]))
        f = (r0[n], r0[0], r1[0], r1[n]) if side < 0 else (r0[0], r0[n], r1[n], r1[0])   # face intérieure plane (faille)
        B.bm.faces.new(f)
    top = rings[-1]; zt = z0 + prof[-1][0]
    c = B.bm.verts.new(G((cx + xp) / 2 + side * prof[-1][1] * .25, cy, zt + 1.4)); meta[c] = (side * 1.0, 0, .5, 0)
    for i in range(n): B.bm.faces.new((top[i], top[i + 1], c) if side < 0 else (top[i + 1], top[i], c))
    B.bm.faces.new((top[n], top[0], c) if side < 0 else (top[0], top[n], c))
    def col(co):
        z = co.z; strate = .5 + .5 * math.sin(z * .9 + noise.noise(co * .2) * 3)
        cc = C.mix(ROCHE[1], ROCHE[2], .25 + strate * .5)
        mousse = max(0, min(1, (z0 + 3.5 - z) / 3.5)) * (.55 + .45 * noise.noise(co * .5))
        return C.mix(cc, VERT[1], max(0, min(.8, mousse)))
    allv = [v for r_ in rings for v in r_] + [c]
    B.paint(allv, col, .05)
    for v in allv:
        nx, ny, rv, _ = meta[v]; cc = v[B.col]; kk = .6 + .65 * rv
        cc = (min(1, cc[0] * kk), min(1, cc[1] * kk), min(1, cc[2] * kk), 1)
        v[B.col] = eclaire(cc, nx, ny)
    # la faille : les sommets sur le plan reçoivent l'ombre (bord intérieur)
    for r_ in rings:
        for v in (r_[0], r_[-1]): cc = v[B.col]; v[B.col] = C.mix(cc, OMBRE_CH, .55)
    return zt + 1.4
