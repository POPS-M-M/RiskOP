"""RISK OP — kit architectural PORTUAIRE (réutilisable : Water 7, puis villes portuaires d'East Blue et de Paradise).
Règle (comme rk_lib) : le kit fournit des PIÈCES paramétrées, jamais une composition d'île.
Chaque pièce est construite dans un repère local (Frame) : u = latéral (le long de la façade), v = vers l'avant (rue),
z = vertical ; puis placée dans le repère du jeu (x est, y sud, z haut) → Blender par C.g2b.
Style : semi-toon (volumes nets, couleurs franches, contours Freestyle en 2.5D), détails lisibles à 12 px par unité.
"""
import math, random
from mathutils import Vector
import rk_common as C

H = C.hexc
# palettes portuaires (couleurs sRGB, converties en linéaire par hexc)
MURS = {'blanc': H('#f3eee2'), 'creme': H('#efe1c2'), 'ocre': H('#e7c991'), 'rose': H('#efc9b8'), 'ciel': H('#d9e6ee'),
        'sable': H('#e2d1ae'), 'brique': H('#c98a64'), 'gris': H('#cfcac0')}
TOITS = {'bleu': H('#3d64b8'), 'sarcelle': H('#2e8a9a'), 'tuile': H('#b5533c'), 'ardoise': H('#5a6470'), 'vert': H('#4f8a6a')}
VOLETS = [H('#2e6f9e'), H('#2a8a7a'), H('#3d64b8'), H('#a0453a'), H('#6a8a3a')]
VITRE, CADRE, PORTE = H('#2b3f55'), H('#f7f3ea'), H('#6b4a30')
PIERRE, PIERRE2, BOIS, BOIS2, FER = H('#d9cfbb'), H('#b9ac94'), H('#8a6440'), H('#6b4a30'), H('#4a4f57')


class Frame:
    """repère local d'une pièce : centre (x, y) du jeu, altitude z0, angle 'ang' de la façade avant (direction de v)"""
    def __init__(self, x, y, z0, ang, tilt=0.0, roll=0.0):
        self.x, self.y, self.z0 = x, y, z0; self.f = (math.cos(ang), math.sin(ang)); self.t = (-math.sin(ang), math.cos(ang))
        self.tilt, self.roll = tilt, roll
    def p(self, u, v, z):
        z = z + v * self.tilt + u * self.roll
        return C.g2b(self.x + u * self.t[0] + v * self.f[0], self.y + u * self.t[1] + v * self.f[1], self.z0 + z)


def quad(B, F, pts, col, var=.05):
    vs = [B.bm.verts.new(F.p(*q)) for q in pts]; B.bm.faces.new(vs); B.paint(vs, col, var); return vs


def box(B, F, u0, u1, v0, v1, z0, z1, col, var=.06, top=True, bottom=False):
    P = [F.p(u, v, z) for z in (z0, z1) for v in (v0, v1) for u in (u0, u1)]
    vs = [B.bm.verts.new(p) for p in P]
    faces = [(0, 1, 3, 2), (4, 6, 7, 5), (0, 4, 5, 1), (2, 3, 7, 6), (0, 2, 6, 4), (1, 5, 7, 3)]
    for k, f in enumerate(faces):
        if (k == 0 and not bottom) or (k == 1 and not top): continue
        B.bm.faces.new([vs[i] for i in f])
    B.paint(vs, col, var); return vs


def prism_x(B, F, u0, u1, v0, v1, z0, h, col, ridge_u=None):
    """toit à deux pans : faîtage parallèle à u (le long de la façade)"""
    vc = (v0 + v1) / 2
    P = [F.p(u0, v0, z0), F.p(u1, v0, z0), F.p(u1, v1, z0), F.p(u0, v1, z0), F.p(u0, vc, z0 + h), F.p(u1, vc, z0 + h)]
    vs = [B.bm.verts.new(p) for p in P]
    for f in ((0, 1, 5, 4), (3, 4, 5, 2), (0, 4, 3), (1, 2, 5)): B.bm.faces.new([vs[i] for i in f])
    B.paint(vs, col, .05); return vs


def hip(B, F, u0, u1, v0, v1, z0, h, col):
    """toit à croupes"""
    du = max(0.0, ((u1 - u0) - (v1 - v0)) / 2); vc = (v0 + v1) / 2
    P = [F.p(u0, v0, z0), F.p(u1, v0, z0), F.p(u1, v1, z0), F.p(u0, v1, z0), F.p(u0 + (v1 - v0) / 2 + 0 * du, vc, z0 + h), F.p(u1 - (v1 - v0) / 2, vc, z0 + h)]
    if u1 - u0 < v1 - v0: P[4] = P[5] = F.p((u0 + u1) / 2, vc, z0 + h)
    vs = [B.bm.verts.new(p) for p in P]
    for f in ((0, 1, 5, 4), (3, 4, 5, 2), (0, 4, 3), (1, 2, 5)): B.bm.faces.new([vs[i] for i in f])
    B.paint(vs, col, .05); return vs


def mansard(B, F, u0, u1, v0, v1, z0, h, col, col2):
    """toit à la Mansart : brisis raide + terrasson plat"""
    i = min(u1 - u0, v1 - v0) * .22
    box(B, F, u0, u1, v0, v1, z0, z0 + .05, col2)
    P = [F.p(u0, v0, z0), F.p(u1, v0, z0), F.p(u1, v1, z0), F.p(u0, v1, z0),
         F.p(u0 + i, v0 + i, z0 + h), F.p(u1 - i, v0 + i, z0 + h), F.p(u1 - i, v1 - i, z0 + h), F.p(u0 + i, v1 - i, z0 + h)]
    vs = [B.bm.verts.new(p) for p in P]
    for f in ((0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7), (4, 5, 6, 7)): B.bm.faces.new([vs[k] for k in f])
    B.paint(vs, col, .05); return vs


def window(B, F, u, v, z, w, h, face='v', shutter=None):
    """fenêtre : cadre clair + vitre sombre (+ volets) posés en saillie sur la façade (2 quads, lisibles en 2.5D)"""
    e = .02
    if face == 'v':
        quad(B, F, [(u - w / 2 - .05, v + e, z - h / 2 - .05), (u + w / 2 + .05, v + e, z - h / 2 - .05), (u + w / 2 + .05, v + e, z + h / 2 + .05), (u - w / 2 - .05, v + e, z + h / 2 + .05)], CADRE, .02)
        quad(B, F, [(u - w / 2, v + 2 * e, z - h / 2), (u + w / 2, v + 2 * e, z - h / 2), (u + w / 2, v + 2 * e, z + h / 2), (u - w / 2, v + 2 * e, z + h / 2)], VITRE, .03)
        if shutter is not None:
            for s in (-1, 1):
                a = u + s * (w / 2 + .05); b = a + s * w * .45
                quad(B, F, [(min(a, b), v + 2 * e, z - h / 2), (max(a, b), v + 2 * e, z - h / 2), (max(a, b), v + 2 * e, z + h / 2), (min(a, b), v + 2 * e, z + h / 2)], shutter, .03)
    else:   # face latérale (u = constante, normale vers ±u)
        s = 1 if face == '+u' else -1
        quad(B, F, [(u + s * e, v - w / 2 - .05, z - h / 2 - .05), (u + s * e, v + w / 2 + .05, z - h / 2 - .05), (u + s * e, v + w / 2 + .05, z + h / 2 + .05), (u + s * e, v - w / 2 - .05, z + h / 2 + .05)], CADRE, .02)
        quad(B, F, [(u + s * 2 * e, v - w / 2, z - h / 2), (u + s * 2 * e, v + w / 2, z - h / 2), (u + s * 2 * e, v + w / 2, z + h / 2), (u + s * 2 * e, v - w / 2, z + h / 2)], VITRE, .03)


def maison(B, x, y, z0, ang, w, d, etages, toit, mur, couv, rnd, volet=None, balcon=False, arcades=False, cheminee=True,
           tilt=0.0, roll=0.0, socle=True, hfloor=.95, lucarne=False, fenetres_arriere=True):
    """maison de ville portuaire : socle, étages avec bandeaux, fenêtres, porte, balcon, arcades, toit, cheminée.
    (x, y) centre au sol, ang = direction de la façade avant, w = largeur de façade, d = profondeur."""
    F = Frame(x, y, z0, ang, tilt, roll); u0, u1, v0, v1 = -w / 2, w / 2, -d / 2, d / 2; H_ = etages * hfloor + .25
    if socle: box(B, F, u0 - .03, u1 + .03, v0 - .03, v1 + .03, -.6, .32, C.mix(mur, PIERRE2, .55), .05)
    box(B, F, u0, u1, v0, v1, .3, H_, mur, .06)
    for k in range(1, etages):                                                            # bandeaux d'étage
        z = .3 + k * hfloor - .04; box(B, F, u0 - .03, u1 + .03, v1, v1 + .04, z, z + .07, C.mix(mur, CADRE, .6), .02)
    nwin = max(1, int(w / .62)); ww = min(.32, w / nwin * .5); wh = .42
    for k in range(etages):
        z = .3 + k * hfloor + hfloor * .52
        for q in range(nwin):
            u = u0 + (q + .5) * w / nwin
            if k == 0 and q == nwin // 2:                                                 # porte au rez-de-chaussée
                quad(B, F, [(u - .17, v1 + .02, .3), (u + .17, v1 + .02, .3), (u + .17, v1 + .02, .3 + .62), (u - .17, v1 + .02, .3 + .62)], PORTE, .03)
                continue
            if arcades and k == 0:
                quad(B, F, [(u - ww * .8, v1 + .02, .3), (u + ww * .8, v1 + .02, .3), (u + ww * .8, v1 + .02, .3 + hfloor * .8), (u - ww * .8, v1 + .02, .3 + hfloor * .8)], H('#3a3530'), .03)
                continue
            window(B, F, u, v1, z, ww, wh, 'v', volet if k > 0 else None)
            if fenetres_arriere and k > 0:                                                # arrière (vu de l'autre côté des rangées)
                window(B, F.__class__(x, y, z0, ang + math.pi, tilt, roll), -u, v1, z, ww, wh, 'v', None)
        nside = max(1, int(d / .9))
        for q in range(nside):
            v = v0 + (q + .5) * d / nside
            if k > 0 and rnd.random() < .7:
                window(B, F, u1, v, z, ww * .9, wh, '+u'); window(B, F, u0, v, z, ww * .9, wh, '-u')
    if balcon and etages >= 2:                                                            # balcon filant au 1er étage
        z = .3 + hfloor; box(B, F, u0 + .1, u1 - .1, v1, v1 + .28, z - .02, z + .05, CADRE, .02)
        box(B, F, u0 + .1, u1 - .1, v1 + .25, v1 + .29, z + .05, z + .32, FER, .02)
        for q in range(int((w - .2) / .5)):                                               # jardinières fleuries
            u = u0 + .3 + q * .5; box(B, F, u - .08, u + .08, v1 + .16, v1 + .27, z + .32, z + .42, [H('#e85a7a'), H('#f2c14a'), H('#e8784a')][q % 3], .1)
    top = .3 + etages * hfloor + .05; o = .14
    if toit == 'pignon': prism_x(B, F, u0 - o, u1 + o, v0 - o, v1 + o, top, .45 * d + .2, couv)
    elif toit == 'croupe': hip(B, F, u0 - o, u1 + o, v0 - o, v1 + o, top, .42 * min(w, d) + .15, couv)
    elif toit == 'mansarde': mansard(B, F, u0 - o, u1 + o, v0 - o, v1 + o, top, .6, couv, couv)
    elif toit == 'terrasse':
        box(B, F, u0 - .05, u1 + .05, v0 - .05, v1 + .05, top - .05, top + .08, PIERRE, .03)
        for a, b, c_, e in ((u0 - .05, u1 + .05, v1 - .05, v1 + .05), (u0 - .05, u1 + .05, v0 - .05, v0 + .05), (u0 - .05, u0 + .05, v0, v1), (u1 - .05, u1 + .05, v0, v1)):
            box(B, F, a, b, c_, e, top + .08, top + .3, PIERRE, .03)
        if rnd.random() < .6:                                                             # jardin ou pergola sur le toit
            box(B, F, u0 + .25, u0 + .25 + (w - .5) * .55, v0 + .25, v1 - .25, top + .08, top + .26, H('#5c9a48'), .12)
    elif toit == 'dome':
        r = min(w, d) * .42; box(B, F, -r * .95, r * .95, -r * .95, r * .95, top, top + .25, couv, .04)
        vs = C.bm_uvsphere(B.bm, F.p(0, 0, top + .25), 1, 18, 8, (r, r, r * 1.05)); B.paint(vs, couv, .05)
        vs = C.bm_cyl(B.bm, F.p(0, 0, top + .25 + r), F.p(0, 0, top + .25 + r + .55), .14, .1, 8); B.paint(vs, CADRE, .02)
    if cheminee and toit in ('pignon', 'croupe', 'mansarde'):
        u = u0 + w * (.25 + .5 * rnd.random()); box(B, F, u - .1, u + .1, -.1, .1, top + .1, top + .45 * d + .55, C.mix(mur, H('#8a6a5a'), .5), .04)
    if lucarne and toit in ('pignon', 'mansarde') and w > 1.5:
        u = (u0 + u1) / 2; box(B, F, u - .2, u + .2, v1 - .35, v1 + .05, top, top + .45, mur, .03); prism_x(B, F, u - .26, u + .26, v1 - .4, v1 + .1, top + .45, .22, couv)
        window(B, F, u, v1 + .05, top + .22, .2, .22)
    return top


def tour(B, x, y, z0, h, r, mur, couv, horloge=False):
    """campanile / tour d'horloge carrée"""
    F = Frame(x, y, z0, math.pi / 2)
    box(B, F, -r, r, -r, r, -.4, h, mur, .05)
    box(B, F, -r - .08, r + .08, -r - .08, r + .08, h - .6, h - .45, CADRE, .02)
    for s in ('v', '+u', '-u'):
        if s == 'v': quad(B, F, [(-r * .45, r + .02, h - 1.35), (r * .45, r + .02, h - 1.35), (r * .45, r + .02, h - .75), (-r * .45, r + .02, h - .75)], H('#2a2a30'))
    if horloge:
        vs = C.bm_cyl(B.bm, F.p(0, r + .02, h - 2.0), F.p(0, r + .08, h - 2.0), r * .6, r * .6, 20); B.paint(vs, CADRE, .01)
        quad(B, F, [(-.03, r + .1, h - 2.0), (.03, r + .1, h - 2.0), (.03, r + .1, h - 1.6), (-.03, r + .1, h - 1.6)], H('#222222'))
    hip(B, F, -r - .12, r + .12, -r - .12, r + .12, h, r * 1.6, couv)


def balustrade(B, pts, z_of, h=.32, col=PIERRE):
    """garde-corps continu le long d'une polyligne (x, y du jeu)"""
    for (ax_, ay_), (bx, by) in zip(pts, pts[1:]):
        L_ = math.hypot(bx - ax_, by - ay_)
        if L_ < 1e-3: continue
        F = Frame((ax_ + bx) / 2, (ay_ + by) / 2, z_of((ax_ + bx) / 2, (ay_ + by) / 2), math.atan2(by - ay_, bx - ax_) + math.pi / 2)
        box(B, F, -L_ / 2, L_ / 2, -.06, .06, 0, h, col, .03)


def pont_arche(B, x, y, ang, portee, largeur, z_tablier, z_eau, col=PIERRE, parapet=True):
    """pont en arche de pierre ; ang = direction de traversée (le long de la portée)"""
    F = Frame(x, y, 0, ang - math.pi / 2)        # u = le long de la portée, v = largeur
    L2 = portee / 2 + .35; n = 8
    box(B, F, -L2, L2, -largeur / 2, largeur / 2, z_tablier - .18, z_tablier, col, .04)
    for s in (-1, 1):                                                         # tympans (faces latérales en arc)
        for k in range(n):
            a0 = math.pi * k / n; a1 = math.pi * (k + 1) / n; rr = portee / 2; zb = z_eau + .05
            u0, u1 = -math.cos(a0) * rr, -math.cos(a1) * rr; h0, h1 = zb + math.sin(a0) * (z_tablier - .2 - zb), zb + math.sin(a1) * (z_tablier - .2 - zb)
            quad(B, F, [(u0, s * largeur / 2, h0), (u1, s * largeur / 2, h1), (u1, s * largeur / 2, z_tablier - .18), (u0, s * largeur / 2, z_tablier - .18)], C.mix(col, PIERRE2, .3), .04)
            quad(B, F, [(u0, -largeur / 2, h0), (u1, -largeur / 2, h1), (u1, largeur / 2, h1), (u0, largeur / 2, h0)], PIERRE2, .04)    # intrados
    if parapet:
        for s in (-1, 1): box(B, F, -L2, L2, s * largeur / 2 - .06, s * largeur / 2 + .06, z_tablier, z_tablier + .3, col, .03)


def escalier(B, x0, y0, x1, y1, z0, z1, largeur, col=PIERRE, marches=10):
    ang = math.atan2(y1 - y0, x1 - x0); L_ = math.hypot(x1 - x0, y1 - y0)
    for k in range(marches):
        t0 = k / marches; t1 = (k + 1) / marches
        F = Frame(x0 + (x1 - x0) * (t0 + t1) / 2, y0 + (y1 - y0) * (t0 + t1) / 2, 0, ang)
        box(B, F, -largeur / 2, largeur / 2, -L_ / marches / 2, L_ / marches / 2, min(z0, z1) - .3, z0 + (z1 - z0) * t1, col if k % 2 else C.mix(col, PIERRE2, .25), .03)


def bitte(B, x, y, z):
    vs = C.bm_cyl(B.bm, C.g2b(x, y, z), C.g2b(x, y, z + .28), .08, .08, 8); B.paint(vs, FER, .02)


def entrepot(B, x, y, z0, ang, w, d, h, mur, couv, rnd):
    """entrepôt de port : grand volume, portes charretières, toit à deux pans bas"""
    F = Frame(x, y, z0, ang)
    box(B, F, -w / 2, w / 2, -d / 2, d / 2, -.5, h, mur, .06)
    for q in range(max(1, int(w / 1.3))):
        u = -w / 2 + (q + .5) * w / max(1, int(w / 1.3))
        quad(B, F, [(u - .35, d / 2 + .02, 0), (u + .35, d / 2 + .02, 0), (u + .35, d / 2 + .02, 1.1), (u - .35, d / 2 + .02, 1.1)], BOIS2, .04)
        window(B, F, u, d / 2, h - .5, .3, .25)
    prism_x(B, F, -w / 2 - .12, w / 2 + .12, -d / 2 - .12, d / 2 + .12, h, d * .28, couv)
    for q in range(3):                                                        # caisses et tonneaux devant
        u = rnd.uniform(-w / 2, w / 2); box(B, F, u - .18, u + .18, d / 2 + .4, d / 2 + .76, 0, .36, H('#a87a4a'), .1)


def hangar_naval(B, x, y, z0, ang, longueur, largeur, h, mur, toit):
    """hangar de chantier naval : ouvert vers la mer (avant = +v), toit en berceau sur fermes"""
    F = Frame(x, y, z0, ang)                                                  # v = vers la mer (longueur), u = largeur
    L2, W2 = longueur / 2, largeur / 2
    for s in (-1, 1):
        box(B, F, s * W2 - .15 * (s > 0) - 0 * s, s * W2 + .15 * (s < 0), -L2, L2, -.5, h, mur, .05)
        for q in range(int(longueur / 1.5)):                                  # contreforts
            v = -L2 + (q + .5) * longueur / int(longueur / 1.5); box(B, F, s * W2 - .12, s * W2 + .12, v - .12, v + .12, -.5, h + .1, C.mix(mur, BOIS2, .4), .03)
    box(B, F, -W2, W2, -L2 - .15, -L2, -.5, h, mur, .05)                     # mur du fond
    n = 10
    for k in range(n):                                                        # berceau
        a0 = math.pi * k / n; a1 = math.pi * (k + 1) / n
        P = [(-math.cos(a0) * (W2 + .2), -L2 - .2, h + math.sin(a0) * W2 * .7), (-math.cos(a1) * (W2 + .2), -L2 - .2, h + math.sin(a1) * W2 * .7),
             (-math.cos(a1) * (W2 + .2), L2 + .2, h + math.sin(a1) * W2 * .7), (-math.cos(a0) * (W2 + .2), L2 + .2, h + math.sin(a0) * W2 * .7)]
        quad(B, F, P, toit if k % 2 else C.mix(toit, H('#000000'), .12), .04)
    for q in range(int(longueur / 2.2) + 1):                                  # fermes visibles à l'avant
        v = L2 + .2 - q * 2.2
        if v < -L2: break
        for k in range(n):
            a0 = math.pi * k / n; a1 = math.pi * (k + 1) / n
            box(B, F, -math.cos(a0) * W2 - .06, -math.cos(a0) * W2 + .06, v - .06, v + .06, h + math.sin(a0) * W2 * .7 - .1, h + math.sin(a1) * W2 * .7, BOIS2, .03) if q == 0 else None


def coque(B, x, y, z, ang, L_, w, h, avancement=1.0, col=BOIS, membrures=True):
    """coque de navire (en construction si avancement < 1 : membrures visibles à l'avant)"""
    F = Frame(x, y, z, ang)                                                   # v = axe du navire
    n = 12; prev = None
    for k in range(n + 1):
        t = k / n; v = -L_ / 2 + t * L_; s = math.sin(math.pi * min(1, t * 1.15)) ** .6; ww = w / 2 * max(.08, s)
        ring = [F.p(-ww, v, h * .15), F.p(-ww * .7, v, -h * .35 * s), F.p(0, v, -h * .45 * s), F.p(ww * .7, v, -h * .35 * s), F.p(ww, v, h * .15), F.p(ww, v, h * .55), F.p(-ww, v, h * .55)]
        planked = t < avancement
        if planked:
            vs = [B.bm.verts.new(p) for p in ring]; B.paint(vs, col if k % 3 else C.mix(col, BOIS2, .5), .05)
            if prev:
                for i in range(len(vs) - 1): B.bm.faces.new((prev[i], prev[i + 1], vs[i + 1], vs[i]))
            prev = vs
        elif membrures:
            for i in range(len(ring) - 2):
                a, b = ring[i], ring[i + 1]; c = (a + b) / 2
                vs = C.bm_box(B.bm, c, (.09, .09, max(.1, (a - b).length))); B.paint(vs, BOIS2, .03)
            prev = None
    box(B, F, -.08, .08, -L_ / 2, L_ / 2, -h * .5, -h * .38, BOIS2, .03)        # quille


def navire(B, x, y, ang, L_, rnd, voiles=H('#f4efe2'), coque_col=BOIS, mats=2):
    """navire marchand générique au mouillage (pas de navire identifiable)"""
    coque(B, x, y, .15, ang, L_, L_ * .32, L_ * .22, 1.0, coque_col)
    F = Frame(x, y, .15, ang)
    box(B, F, -L_ * .14, L_ * .14, -L_ * .5, -L_ * .3, L_ * .11, L_ * .2, coque_col, .04)        # château arrière
    for m in range(mats):
        v = -L_ * .15 + m * L_ * .35; hm = L_ * (.75 - .1 * m)
        box(B, F, -.05, .05, v - .05, v + .05, 0, hm, BOIS2, .02)
        for k, (zz, ww) in enumerate(((hm * .45, L_ * .2), (hm * .78, L_ * .15))):
            quad(B, F, [(-ww, v + .03, zz - hm * .18), (ww, v + .03, zz - hm * .18), (ww * .9, v + .03, zz + hm * .13), (-ww * .9, v + .03, zz + hm * .13)], voiles, .03)


def barque(B, x, y, z, ang, L_=1.2, col=H('#3d64b8')):
    """barque de canal (navette)"""
    coque(B, x, y, z + .08, ang, L_, L_ * .34, .3, 1.0, col, False)
    F = Frame(x, y, z + .08, ang); box(B, F, -.12, .12, -L_ * .2, L_ * .1, .05, .1, H('#f2c14a'), .05)


def grue(B, x, y, z0, ang, h=7.0, portee=3.6, col=H('#c9452f')):
    F = Frame(x, y, z0, ang)
    for s in (-1, 1):
        for t in (-1, 1): box(B, F, s * .32 - .07, s * .32 + .07, t * .32 - .07, t * .32 + .07, -.4, h, col, .03)
    for q in range(int(h / 1.2)):
        z = .6 + q * 1.2; box(B, F, -.34, .34, -.34, .34, z, z + .08, col, .02)
    box(B, F, -.1, .1, -.5, portee, h - .1, h + .2, col, .03); box(B, F, -.3, .3, -1.0, -.4, h - .6, h, FER, .03)
    vs = C.bm_cyl(B.bm, F.p(0, portee - .2, h - .1), F.p(0, portee - .2, h - 2.4), .02, .02, 4); B.paint(vs, FER)


def gare(B, x, y, z0, ang, w, d, rnd, mur=H('#c25a44'), couv=H('#4a3a36')):
    """gare : hall voyageurs à verrière, tour d'horloge, quai abrité"""
    F = Frame(x, y, z0, ang)
    box(B, F, -w / 2, w / 2, -d / 2, d / 2, -.5, 2.6, mur, .05)
    for q in range(int(w / .9)):
        u = -w / 2 + (q + .5) * w / int(w / .9)
        quad(B, F, [(u - .25, d / 2 + .02, .3), (u + .25, d / 2 + .02, .3), (u + .25, d / 2 + .02, 1.9), (u - .25, d / 2 + .02, 1.9)], VITRE, .03)
        box(B, F, u - .3, u + .3, d / 2, d / 2 + .05, 1.9, 2.05, CADRE, .02)
    n = 8
    for k in range(n):                                                        # verrière en berceau (bleu clair)
        a0 = math.pi * k / n; a1 = math.pi * (k + 1) / n
        P = [(-w / 2 - .1, -math.cos(a0) * d / 2, 2.6 + math.sin(a0) * d * .32), (w / 2 + .1, -math.cos(a0) * d / 2, 2.6 + math.sin(a0) * d * .32),
             (w / 2 + .1, -math.cos(a1) * d / 2, 2.6 + math.sin(a1) * d * .32), (-w / 2 - .1, -math.cos(a1) * d / 2, 2.6 + math.sin(a1) * d * .32)]
        quad(B, F, P, H('#9fd0e6') if k % 2 else H('#7fb8d4'), .03)
    for s in (-1, 1): box(B, F, s * w / 2 - .12, s * w / 2 + .12, -d / 2 - .05, d / 2 + .05, 2.6, 2.6 + d * .34, mur, .03)
    box(B, F, -w / 2 + .3, w / 2 - .3, d / 2 + .05, d / 2 + 1.4, .35, .45, PIERRE, .03)           # marquise
    for q in range(5):
        u = -w / 2 + .5 + q * (w - 1) / 4; box(B, F, u - .05, u + .05, d / 2 + 1.25, d / 2 + 1.35, -.2, 1.6, FER, .02)
    box(B, F, -w / 2 + .3, w / 2 - .3, d / 2 + .05, d / 2 + 1.4, 1.6, 1.7, H('#5a3a30'), .03)


def viaduc(B, pts, z_rail, col=PIERRE2, pile=2.0):
    """viaduc ferroviaire sur arches (polyligne (x, y) du jeu) : piles, tablier, rails"""
    for (ax_, ay_), (bx, by) in zip(pts, pts[1:]):
        L_ = math.hypot(bx - ax_, by - ay_); ang = math.atan2(by - ay_, bx - ax_); n = max(1, int(L_ / pile))
        F = Frame(ax_, ay_, 0, ang - math.pi / 2)                                  # u = le long du viaduc
        box(B, F, 0, L_, -.65, .65, z_rail - .3, z_rail, col, .04)
        for k in range(n + 1):
            u = k * L_ / n; box(B, F, u - .22, u + .22, -.55, .55, -.8, z_rail - .3, C.mix(col, PIERRE, .3), .04)
        for s in (-.32, .32): box(B, F, 0, L_, s - .04, s + .04, z_rail, z_rail + .08, FER, .02)
        for k in range(int(L_ / .5)): box(B, F, k * .5, k * .5 + .14, -.45, .45, z_rail - .02, z_rail + .03, BOIS2, .02)


def train(B, x, y, z, ang, wagons=2, col=H('#2f4f6f')):
    """train générique (locomotive à vapeur stylisée + voitures) — aucune locomotive identifiable"""
    F = Frame(x, y, z, ang - math.pi / 2)                                         # u = sens de marche
    box(B, F, -.9, .9, -.4, .4, 0, .55, H('#3a3a3a'), .03)
    vs = C.bm_cyl(B.bm, F.p(-.9, 0, .78), F.p(.7, 0, .78), .32, .32, 12); B.paint(vs, H('#3a3a3a'), .03)
    vs = C.bm_cyl(B.bm, F.p(.4, 0, 1.0), F.p(.4, 0, 1.55), .12, .17, 8); B.paint(vs, H('#2a2a2a'))
    box(B, F, -1.0, -.45, -.42, .42, .55, 1.35, H('#a0453a'), .03)
    for q in range(wagons):
        u = -1.2 - .1 - q * 2.0; box(B, F, u - 1.8, u, -.42, .42, .1, 1.1, col, .03); box(B, F, u - 1.85, u + .05, -.47, .47, 1.1, 1.22, H('#5a3a30'), .03)
        for k in range(3): window(B, F, u - .3 - k * .55, .42, .7, .3, .25)


def lampadaire(B, x, y, z):
    vs = C.bm_cyl(B.bm, C.g2b(x, y, z), C.g2b(x, y, z + 1.3), .04, .04, 6); B.paint(vs, FER)
    vs = C.bm_uvsphere(B.bm, C.g2b(x, y, z + 1.38), .12, 8, 5); B.paint(vs, H('#ffe9a8'), .02)


def platane(B, x, y, z, s, rnd):
    vs = C.bm_cyl(B.bm, C.g2b(x, y, z - .2), C.g2b(x, y, z + 1.1 * s), .1 * s, .08 * s, 6); B.paint(vs, H('#8a7a5a'))
    for k in range(3):
        a = rnd.random() * 6.283; r = .35 * s
        vs = C.bm_ico(B.bm, C.g2b(x + math.cos(a) * r * .5, y + math.sin(a) * r * .5, z + (1.3 + .3 * k) * s), (.7 - .1 * k) * s, 1)
        B.paint(vs, C.mix(H('#5a9a42'), H('#78b04e'), rnd.random()), .08)


def cypres(B, x, y, z, s):
    vs = C.bm_cyl(B.bm, C.g2b(x, y, z - .2), C.g2b(x, y, z + .4), .06, .06, 5); B.paint(vs, H('#6b4a30'))
    vs = C.bm_uvsphere(B.bm, C.g2b(x, y, z + 1.4 * s), 1, 10, 6, (.32 * s, .32 * s, 1.1 * s)); B.paint(vs, H('#3f6e3a'), .06)
