"""RISK OP — kit architectural TOSCAN (Loguetown, île 4 ; réutilisable pour d'autres villes d'inspiration italienne).
S'appuie sur les pièces génériques de rk_port (repère Frame, box, quad, toits) mais ses bâtiments ont leurs propres volumes :
toits de tuiles à faible pente, corniches très débordantes (« gronda »), rez-de-chaussée à bossages, fenêtres cintrées en
pierre grise, persiennes vertes, loggias, altanas (loggia sur le toit), tours-maisons, fermes à pigeonnier.
Monuments [I] : palais communal à tour crénelée, cathédrale à dôme côtelé et campanile polychrome, villa à jardins en terrasses,
enceinte à portes, échafaud, loggia, opéra, phare, base militaire sans emblème. Aucun n'est la copie d'un modèle officiel.
Repère : x est, y sud, z haut (jeu) ; u = le long de la façade, v = vers la rue (Frame de rk_port).
"""
import math, random
import rk_common as C
import rk_port as K
from rk_port import Frame, box, quad, hip, prism_x

H = C.hexc
MURS = {'ocre': H('#e6c27a'), 'sienne': H('#d39a5f'), 'creme': H('#efdcb4'), 'rose': H('#e3b49a'), 'paille': H('#ead39a'),
        'gris_vert': H('#cfc8a6'), 'pierre': H('#d2bd92'), 'brique': H('#c47f55')}
TUILES = [H('#b85a3a'), H('#a94d33'), H('#c4673f'), H('#9c4a30'), H('#bf6a48')]
PERSIENNES = [H('#4f6b3a'), H('#5d7a45'), H('#3e5530'), H('#6b4a30'), H('#6f7f4a')]
SERENA = H('#8f9089')            # pierre grise des encadrements et corniches
FORTE = H('#c9a56e')             # pierre ocre des palais
BOIS_S = H('#6a4a32')            # dessous des corniches
MARBRE, VERT, ROSE_M = H('#f1ede4'), H('#4d7a5e'), H('#d9a3a0')


def fenetre_arc(B, F, u, v, z, w, h, cadre=SERENA, vitre=K.VITRE, face='v'):
    """fenêtre cintrée : encadrement de pierre + vitre + demi-lune (éventail de 4 triangles)"""
    e = .02
    if face != 'v': return K.window(B, F, u, v, z, w, h, face)
    quad(B, F, [(u - w / 2 - .05, v + e, z - h / 2 - .05), (u + w / 2 + .05, v + e, z - h / 2 - .05), (u + w / 2 + .05, v + e, z + h / 2), (u - w / 2 - .05, v + e, z + h / 2)], cadre, .02)
    quad(B, F, [(u - w / 2, v + 2 * e, z - h / 2), (u + w / 2, v + 2 * e, z - h / 2), (u + w / 2, v + 2 * e, z + h / 2), (u - w / 2, v + 2 * e, z + h / 2)], vitre, .03)
    r0, r1 = w / 2 + .05, w / 2
    for k in range(4):
        a0, a1 = math.pi * k / 4, math.pi * (k + 1) / 4
        quad(B, F, [(u, v + e, z + h / 2), (u - math.cos(a0) * r0, v + e, z + h / 2 + math.sin(a0) * r0), (u - math.cos(a1) * r0, v + e, z + h / 2 + math.sin(a1) * r0), (u, v + e, z + h / 2)], cadre, .02)
        quad(B, F, [(u, v + 2 * e, z + h / 2), (u - math.cos(a0) * r1 * .8, v + 2 * e, z + h / 2 + math.sin(a0) * r1 * .8), (u - math.cos(a1) * r1 * .8, v + 2 * e, z + h / 2 + math.sin(a1) * r1 * .8), (u, v + 2 * e, z + h / 2)], vitre, .03)


def gronda(B, F, u0, u1, v0, v1, z, o=.32, col=BOIS_S):
    """corniche toscane très débordante (dessous en bois sombre)"""
    box(B, F, u0 - o, u1 + o, v0 - o, v1 + o, z - .1, z, col, .03)


def toit_bas(B, F, u0, u1, v0, v1, z, couv, pente=.2, o=.32):
    """toit de tuiles à croupes, faible pente"""
    hip(B, F, u0 - o, u1 + o, v0 - o, v1 + o, z, pente * min(u1 - u0, v1 - v0) + .12, couv)


def altana(B, F, u, v, z, couv, mur):
    """loggia sur le toit : 4 piliers et un petit toit"""
    for su in (-1, 1):
        for sv in (-1, 1): box(B, F, u + su * .35 - .05, u + su * .35 + .05, v + sv * .3 - .05, v + sv * .3 + .05, z, z + .55, mur, .03)
    box(B, F, u - .45, u + .45, v - .4, v + .4, z - .05, z + .02, mur, .03)
    hip(B, F, u - .5, u + .5, v - .45, v + .45, z + .55, .22, couv)


def palazzo(B, x, y, z0, ang, w, d, etages, mur, couv, rnd, loggia=False, alt=False, bossage=True, hfloor=1.0):
    """palais florentin : rez-de-chaussée à bossages, bandeaux de pierre grise, fenêtres cintrées, grande corniche, toit bas"""
    F = Frame(x, y, z0, ang); u0, u1, v0, v1 = -w / 2, w / 2, -d / 2, d / 2; Ht = .3 + etages * hfloor
    box(B, F, u0 - .02, u1 + .02, v0 - .02, v1 + .02, -.6, .3 + hfloor, C.mix(mur, FORTE, .55) if bossage else mur, .06)
    if bossage:
        for k in range(4):                                                                   # joints des bossages
            z = .45 + k * hfloor / 4; box(B, F, u0 - .03, u1 + .03, v1, v1 + .03, z, z + .04, C.mix(FORTE, H('#7a6448'), .5), .02)
    box(B, F, u0, u1, v0, v1, .3 + hfloor, Ht, mur, .05)
    for k in range(1, etages):
        z = .3 + k * hfloor - .05; box(B, F, u0 - .04, u1 + .04, v0 - .04, v1 + .04, z, z + .08, SERENA, .02)
    nwin = max(2, int(w / .75)); ww = min(.3, w / nwin * .45)
    for k in range(etages):
        z = .3 + k * hfloor + hfloor * .48
        for q in range(nwin):
            u = u0 + (q + .5) * w / nwin
            if k == 0:
                if loggia: quad(B, F, [(u - ww * 1.1, v1 + .03, .3), (u + ww * 1.1, v1 + .03, .3), (u + ww * 1.1, v1 + .03, .3 + hfloor * .82), (u - ww * 1.1, v1 + .03, .3 + hfloor * .82)], H('#3a332c'), .03)
                elif q == nwin // 2: quad(B, F, [(u - .22, v1 + .03, .3), (u + .22, v1 + .03, .3), (u + .22, v1 + .03, 1.05), (u - .22, v1 + .03, 1.05)], K.PORTE, .03)
                elif q % 2: K.window(B, F, u, v1, z + .1, ww * .7, .22)                      # petites fenêtres grillagées
                continue
            fenetre_arc(B, F, u, v1, z - .05, ww, .38)
            if rnd.random() < .6: fenetre_arc(B, Frame(x, y, z0, ang + math.pi), -u, v1, z - .05, ww, .38)
        for q in range(max(1, int(d / 1.0))):
            vq = v0 + (q + .5) * d / max(1, int(d / 1.0))
            if k > 0: K.window(B, F, u1, vq, z, ww * .9, .36, '+u'); K.window(B, F, u0, vq, z, ww * .9, .36, '-u')
    gronda(B, F, u0, u1, v0, v1, Ht + .1); toit_bas(B, F, u0, u1, v0, v1, Ht + .1, couv)
    if alt: altana(B, F, u0 + w * .3, 0, Ht + .1 + .12 * min(w, d), couv, mur)


def casa(B, x, y, z0, ang, w, d, etages, mur, couv, rnd, pers=None, hfloor=.9, tetto='croupe', balcon=False):
    """maison de ville toscane : enduit, persiennes vertes, petite corniche, toit de tuiles bas"""
    F = Frame(x, y, z0, ang); u0, u1, v0, v1 = -w / 2, w / 2, -d / 2, d / 2; Ht = .3 + etages * hfloor
    box(B, F, u0 - .02, u1 + .02, v0 - .02, v1 + .02, -.6, .3, C.mix(mur, H('#9a8a70'), .5), .05)
    box(B, F, u0, u1, v0, v1, .3, Ht, mur, .07)
    nwin = max(1, int(w / .7)); ww = min(.28, w / nwin * .45)
    for k in range(etages):
        z = .3 + k * hfloor + hfloor * .5
        for q in range(nwin):
            u = u0 + (q + .5) * w / nwin
            if k == 0 and q == nwin // 2:
                quad(B, F, [(u - .17, v1 + .02, .3), (u + .17, v1 + .02, .3), (u + .17, v1 + .02, .95), (u - .17, v1 + .02, .95)], K.PORTE, .03); continue
            if k == 0 and rnd.random() < .45:                                                # boutique : vitrine sous auvent
                quad(B, F, [(u - ww * 1.2, v1 + .02, .32), (u + ww * 1.2, v1 + .02, .32), (u + ww * 1.2, v1 + .02, .85), (u - ww * 1.2, v1 + .02, .85)], H('#3b3a36'), .03)
                box(B, F, u - ww * 1.4, u + ww * 1.4, v1, v1 + .28, .9, .95, [H('#a8443a'), H('#3e6b4a'), H('#d8b25a'), H('#3d5a8a')][q % 4], .04); continue
            K.window(B, F, u, v1, z, ww, .4, 'v', pers if k > 0 else None)
            if k > 0 and rnd.random() < .5: K.window(B, Frame(x, y, z0, ang + math.pi), -u, v1, z, ww, .4, 'v', None)
    if balcon and etages >= 2:
        z = .3 + hfloor; box(B, F, -w * .25, w * .25, v1, v1 + .25, z - .02, z + .04, SERENA, .02); box(B, F, -w * .25, w * .25, v1 + .22, v1 + .26, z + .04, z + .3, K.FER, .02)
    box(B, F, u0 - .14, u1 + .14, v0 - .14, v1 + .14, Ht - .06, Ht + .02, BOIS_S, .03)
    if tetto == 'croupe': toit_bas(B, F, u0, u1, v0, v1, Ht + .02, couv, .2, .16)
    else: prism_x(B, F, u0 - .16, u1 + .16, v0 - .16, v1 + .16, Ht + .02, .26 * d + .1, couv)
    if rnd.random() < .5:                                                                    # cheminée à petit toit
        u = u0 + w * rnd.uniform(.2, .8); box(B, F, u - .08, u + .08, -.08, .08, Ht, Ht + .45, C.mix(mur, H('#8a6a5a'), .4), .04)
        box(B, F, u - .12, u + .12, -.12, .12, Ht + .45, Ht + .5, couv, .03)


def casatorre(B, x, y, z0, ang, w, d, etages, rnd):
    """tour-maison médiévale : étroite, haute, pierre, petites ouvertures, toit plat crénelé ou bas"""
    F = Frame(x, y, z0, ang); s = min(w, d) * .5; Ht = .3 + etages * .95
    col = C.mix(FORTE, H('#b89464'), rnd.random())
    box(B, F, -s, s, -s, s, -.6, Ht, col, .06)
    for k in range(1, etages):
        z = .3 + k * .95 + .4; K.window(B, F, 0, s, z, .18, .32)
        if k % 2: K.window(B, F, s, 0, z, .16, .28, '+u')
    if rnd.random() < .5:
        box(B, F, -s - .06, s + .06, -s - .06, s + .06, Ht, Ht + .08, SERENA, .02)
        for q in range(4):
            for sgn in (-1, 1):
                p = -s + .15 + q * (2 * s - .3) / 3; box(B, F, p - .08, p + .08, sgn * s - .08, sgn * s + .08, Ht + .08, Ht + .32, col, .03)
                box(B, F, sgn * s - .08, sgn * s + .08, p - .08, p + .08, Ht + .08, Ht + .32, col, .03)
    else:
        gronda(B, F, -s, s, -s, s, Ht + .05, .25); toit_bas(B, F, -s, s, -s, s, Ht + .05, TUILES[rnd.randrange(len(TUILES))], .25, .25)


def ferme(B, x, y, z0, ang, w, d, rnd):
    """ferme toscane (casa colonica) : deux volumes, pigeonnier en tour, escalier extérieur, toits bas"""
    F = Frame(x, y, z0, ang); mur = C.mix(MURS['pierre'], MURS['paille'], rnd.random()); couv = TUILES[rnd.randrange(len(TUILES))]
    box(B, F, -w / 2, w / 2, -d / 2, d / 2, -.6, 1.9, mur, .07)
    for q in range(max(1, int(w / .8))):
        u = -w / 2 + (q + .5) * w / max(1, int(w / .8)); K.window(B, F, u, d / 2, 1.35, .2, .3, 'v', PERSIENNES[q % 3])
    quad(B, F, [(-.2, d / 2 + .02, 0), (.2, d / 2 + .02, 0), (.2, d / 2 + .02, .7), (-.2, d / 2 + .02, .7)], K.PORTE, .03)
    gronda(B, F, -w / 2, w / 2, -d / 2, d / 2, 1.95, .2); toit_bas(B, F, -w / 2, w / 2, -d / 2, d / 2, 1.95, couv, .22, .2)
    box(B, F, w / 2, w / 2 + .9, -d / 2 + .2, d / 2 - .4, -.6, 1.1, C.mix(mur, H('#a08a68'), .3), .06)                 # appentis
    prism_x(B, F, w / 2 - .05, w / 2 + 1.0, -d / 2 + .1, d / 2 - .3, 1.12, .28, C.mix(couv, H('#7a5040'), .25))
    if rnd.random() < .6:                                                                    # pigeonnier
        u = -w / 2 + .45; box(B, F, u - .4, u + .4, -.4, .4, 1.9, 2.9, mur, .05)
        for q in range(3): box(B, F, u - .3 + q * .25, u - .22 + q * .25, .4, .43, 2.55, 2.68, H('#3a332c'), .02)
        toit_bas(B, F, u - .4, u + .4, -.4, .4, 2.95, couv, .3, .15)
    for k in range(4):                                                                       # escalier extérieur
        box(B, F, -w / 2 + .3 + k * .22, -w / 2 + .52 + k * .22, d / 2, d / 2 + .35, 0, .3 + k * .38, SERENA, .03)


# ---------------------------------------------------------------- monuments [I]
def palais_tour(B, cx, cy, hw, hh, tx, ty, z0, z0t):
    """palais communal massif à galerie crénelée sur mâchicoulis, et haute tour en façade (rappel d'un palais toscan) [I]"""
    F = Frame(cx, cy, z0, math.pi / 2)                                                         # façade principale vers le sud (+v) ... la place est à l'est
    Fe = Frame(cx, cy, z0, 0.0)                                                                # repère tourné vers l'est (place)
    Hb = 6.4; col = FORTE
    box(B, Fe, -hh, hh, -hw, hw, -.6, Hb, col, .05)
    for k in range(5):                                                                         # assises de pierre
        box(B, Fe, -hh - .02, hh + .02, -hw - .02, hw + .02, .6 + k * 1.2, .66 + k * 1.2, C.mix(col, H('#8a6a48'), .35), .02)
    for side in range(4):                                                                      # fenêtres géminées des étages, porte
        Fs = Frame(cx, cy, z0, side * math.pi / 2); L_ = hw if side % 2 == 0 else hh; D_ = hh if side % 2 == 0 else hw
        for q in range(int(2 * L_ / 1.4)):
            u = -L_ + (q + .5) * 2 * L_ / int(2 * L_ / 1.4)
            for zz in (3.0, 4.9):
                fenetre_arc(B, Fs, u - .14, D_, zz, .18, .55); fenetre_arc(B, Fs, u + .14, D_, zz, .18, .55)
        if side == 0: quad(B, Fs, [(-.45, D_ + .03, 0), (.45, D_ + .03, 0), (.45, D_ + .03, 1.6), (-.45, D_ + .03, 1.6)], K.PORTE, .03)
    box(B, Fe, -hh - .35, hh + .35, -hw - .35, hw + .35, Hb, Hb + .9, C.mix(col, H('#b08a58'), .3), .04)
    for sgn in (-1, 1):
        for k in range(int(2 * hw / .55)):
            p = -hw - .2 + (k + .5) * (2 * hw + .4) / int(2 * hw / .55)
            box(B, Fe, sgn * (hh + .35) - .1, sgn * (hh + .35) + .1, p - .14, p + .14, Hb - .5, Hb, C.mix(col, H('#6a5038'), .4), .02)
            box(B, Fe, sgn * (hh + .35) - .1, sgn * (hh + .35) + .1, p - .11, p + .11, Hb + .9, Hb + 1.2, col, .03)
        for k in range(int(2 * hh / .55)):
            p = -hh - .2 + (k + .5) * (2 * hh + .4) / int(2 * hh / .55)
            box(B, Fe, p - .14, p + .14, sgn * (hw + .35) - .1, sgn * (hw + .35) + .1, Hb - .5, Hb, C.mix(col, H('#6a5038'), .4), .02)
            box(B, Fe, p - .11, p + .11, sgn * (hw + .35) - .1, sgn * (hw + .35) + .1, Hb + .9, Hb + 1.2, col, .03)
    toit_bas(B, Fe, -hh + .2, hh - .2, -hw + .2, hw - .2, Hb + .9, TUILES[1], .14, 0)
    # tour
    Ft = Frame(tx, ty, z0t, 0.0); s = .95; Ht = 15.5
    box(B, Ft, -s, s, -s, s, Hb, Ht, col, .05)
    for k in range(3): fenetre_arc(B, Ft, 0, s, Hb + 2.0 + k * 2.2, .2, .55)
    box(B, Ft, -s - .45, s + .45, -s - .45, s + .45, Ht, Ht + 1.0, C.mix(col, H('#b08a58'), .3), .04)        # galerie de la tour en saillie
    for sgn in (-1, 1):
        for k in range(4):
            p = -s - .3 + (k + .5) * (2 * s + .6) / 4
            box(B, Ft, sgn * (s + .45) - .1, sgn * (s + .45) + .1, p - .14, p + .14, Ht - .5, Ht, C.mix(col, H('#6a5038'), .4), .02)
            box(B, Ft, p - .14, p + .14, sgn * (s + .45) - .1, sgn * (s + .45) + .1, Ht - .5, Ht, C.mix(col, H('#6a5038'), .4), .02)
            box(B, Ft, sgn * (s + .45) - .12, sgn * (s + .45) + .12, p - .14, p + .14, Ht + 1.0, Ht + 1.4, col, .03)
            box(B, Ft, p - .14, p + .14, sgn * (s + .45) - .12, sgn * (s + .45) + .12, Ht + 1.0, Ht + 1.4, col, .03)
    bs = .55                                                                                   # beffroi à arcades et cadran
    for q in range(4):
        a = q * math.pi / 2; c_, s_ = math.cos(a), math.sin(a)
        box(B, Ft, c_ * bs - s_ * bs - .1, c_ * bs - s_ * bs + .1, s_ * bs + c_ * bs - .1, s_ * bs + c_ * bs + .1, Ht + 1.0, Ht + 3.0, col, .03)
    box(B, Ft, -bs - .12, bs + .12, -bs - .12, bs + .12, Ht + 3.0, Ht + 3.25, col, .03)
    vs = C.bm_cyl(B.bm, Ft.p(0, 0, Ht + 3.25), Ft.p(0, 0, Ht + 4.6), .5, .05, 8); B.paint(vs, TUILES[0], .04)
    vs = C.bm_cyl(B.bm, Ft.p(s + .02, 0, Ht - 1.6), Ft.p(s + .08, 0, Ht - 1.6), .5, .5, 20); B.paint(vs, H('#f2ead8'), .01)
    quad(B, Ft, [(s + .1, -.03, Ht - 1.6), (s + .1, .03, Ht - 1.6), (s + .1, .03, Ht - 1.25), (s + .1, -.03, Ht - 1.25)], H('#222222'))
    return Ht + 4.6


def _bandes(B, F, u0, u1, v, z0, z1, n, cols):
    """placage de marbre polychrome sur une façade (bandes horizontales)"""
    for k in range(n):
        za = z0 + (z1 - z0) * k / n; zb = z0 + (z1 - z0) * (k + 1) / n
        quad(B, F, [(u0, v + .02, za), (u1, v + .02, za), (u1, v + .02, zb), (u0, v + .02, zb)], cols[k % len(cols)], .02)


def cathedrale(B, nef, dome, camp, z0):
    """cathédrale [I] (style toscan) : nef à marbres polychromes, transept, tambour octogonal, dôme côtelé, lanterne, campanile"""
    nx, ny, nw, nl = nef
    F = Frame(nx, ny, z0, math.pi / 2)                                                         # façade vers le sud (+v), u = est-ouest
    box(B, F, -nw, nw, -nl, nl, -.6, 4.6, MARBRE, .03)
    for side in (-1, 1):                                                                       # panneaux verts des flancs
        Fs = Frame(nx, ny, z0, 0 if side > 0 else math.pi)
        for k in range(int(2 * nl / 1.2)):
            u = -nl + (k + .5) * 2 * nl / int(2 * nl / 1.2)
            quad(B, Fs, [(u - .45, nw + .02, .5), (u + .45, nw + .02, .5), (u + .45, nw + .02, 3.9), (u - .45, nw + .02, 3.9)], VERT, .02)
            quad(B, Fs, [(u - .3, nw + .03, .65), (u + .3, nw + .03, .65), (u + .3, nw + .03, 3.75), (u - .3, nw + .03, 3.75)], MARBRE, .02)
            fenetre_arc(B, Fs, u, nw + .04, 2.6, .2, .7, MARBRE)
    prism_x(B, Frame(nx, ny, z0, 0.0), -nl - .1, nl + .1, -nw - .1, nw + .1, 4.6, 1.1, TUILES[2])          # faîtage le long de la nef
    # façade : trois registres, rosace, fronton
    _bandes(B, F, -nw, nw, nl, .0, 4.6, 6, [MARBRE, VERT, MARBRE, ROSE_M])
    for q in (-1, 0, 1):
        quad(B, F, [(q * 1.2 - .3, nl + .04, 0), (q * 1.2 + .3, nl + .04, 0), (q * 1.2 + .3, nl + .04, 1.6 if q == 0 else 1.2), (q * 1.2 - .3, nl + .04, 1.6 if q == 0 else 1.2)], K.PORTE, .03)
    vs = C.bm_cyl(B.bm, F.p(0, nl + .03, 3.2), F.p(0, nl + .08, 3.2), .62, .62, 20); B.paint(vs, ROSE_M, .02)
    vs = C.bm_cyl(B.bm, F.p(0, nl + .06, 3.2), F.p(0, nl + .11, 3.2), .42, .42, 16); B.paint(vs, H('#3a4d6a'), .02)
    P3 = [F.p(-nw, nl + .02, 4.6), F.p(nw, nl + .02, 4.6), F.p(0, nl + .02, 6.0)]
    vs = [B.bm.verts.new(p) for p in P3]; B.bm.faces.new(vs); B.paint(vs, MARBRE, .02)
    # transept et abside
    dx, dy = dome
    Fd = Frame(dx, dy, z0, math.pi / 2)
    box(B, Fd, -4.0, 4.0, -1.5, 1.5, -.6, 4.4, MARBRE, .03); prism_x(B, Fd, -4.1, 4.1, -1.6, 1.6, 4.4, .9, TUILES[2])
    for sgn in (-1, 1):
        _bandes(B, Frame(dx, dy, z0, 0 if sgn > 0 else math.pi), -1.5, 1.5, 4.0, .0, 4.4, 4, [MARBRE, VERT])
    box(B, Fd, -1.6, 1.6, -3.2, -1.4, -.6, 4.0, MARBRE, .03)
    # tambour octogonal
    R0 = 2.35; zt0, zt1 = 4.4, 6.6
    for k in range(8):
        a0, a1 = k * math.pi / 4 + math.pi / 8, (k + 1) * math.pi / 4 + math.pi / 8
        p = [(math.cos(a0) * R0, math.sin(a0) * R0), (math.cos(a1) * R0, math.sin(a1) * R0)]
        for zz0, zz1, cc in ((zt0, zt0 + .7, MARBRE), (zt0 + .7, zt0 + .95, VERT), (zt0 + .95, zt1, MARBRE)):
            quad(B, Fd, [(p[0][0], p[0][1], zz0), (p[1][0], p[1][1], zz0), (p[1][0], p[1][1], zz1), (p[0][0], p[0][1], zz1)], cc, .02)
        m = ((p[0][0] + p[1][0]) / 2 * 1.01, (p[0][1] + p[1][1]) / 2 * 1.01); nrm = math.atan2(m[1], m[0])
        vs = C.bm_cyl(B.bm, Fd.p(m[0], m[1], zt0 + 1.45), Fd.p(m[0] * 1.04, m[1] * 1.04, zt0 + 1.45), .3, .3, 12); B.paint(vs, H('#3a4d6a'), .02)
    # dôme côtelé (8 voûtains de tuiles, nervures blanches), légèrement en ogive
    nseg, nr = 8, 9; Rd = R0 * .97; Hd = 4.6
    for k in range(nseg):
        a0, a1 = k * math.pi / 4 + math.pi / 8, (k + 1) * math.pi / 4 + math.pi / 8
        for j in range(nr):
            t0, t1 = j / nr, (j + 1) / nr
            def pt(a, t):
                rr = Rd * math.cos(t * math.pi / 2) ** .85; zz = zt1 + Hd * math.sin(t * math.pi / 2)
                return Fd.p(math.cos(a) * rr, math.sin(a) * rr, zz)
            for (aa, ab, col) in ((a0, a0 + .07, MARBRE), (a0 + .07, a1 - .07, TUILES[2] if j % 2 else TUILES[0]), (a1 - .07, a1, MARBRE)):
                vs = [B.bm.verts.new(pt(aa, t0)), B.bm.verts.new(pt(ab, t0)), B.bm.verts.new(pt(ab, t1)), B.bm.verts.new(pt(aa, t1))]
                B.bm.faces.new(vs); B.paint(vs, col, .03)
    zl = zt1 + Hd                                                                               # lanterne
    vs = C.bm_cyl(B.bm, Fd.p(0, 0, zl - .05), Fd.p(0, 0, zl + 1.0), .55, .5, 8); B.paint(vs, MARBRE, .02)
    vs = C.bm_cyl(B.bm, Fd.p(0, 0, zl + 1.0), Fd.p(0, 0, zl + 1.9), .55, .05, 8); B.paint(vs, MARBRE, .02)
    vs = C.bm_uvsphere(B.bm, Fd.p(0, 0, zl + 2.0), .14, 8, 5); B.paint(vs, H('#e8c04a'), .02)
    # campanile
    cx, cy = camp; Fc = Frame(cx, cy, z0, math.pi / 2); s = .85; Hc = 12.5
    box(B, Fc, -s, s, -s, s, -.6, Hc, MARBRE, .02)
    for side in range(4):
        Fs = Frame(cx, cy, z0, side * math.pi / 2)
        _bandes(B, Fs, -s, s, s, 0, Hc, 14, [MARBRE, VERT, MARBRE, ROSE_M])
        for k, zz in enumerate((6.6, 8.6, 10.7)): fenetre_arc(B, Fs, 0, s + .03, zz, .28 + .06 * k, .8 + .2 * k, MARBRE, H('#2e2a28'))
    box(B, Fc, -s - .2, s + .2, -s - .2, s + .2, Hc, Hc + .35, MARBRE, .02)
    for sgn in (-1, 1):
        box(B, Fc, -s - .2, s + .2, sgn * (s + .15) - .05, sgn * (s + .15) + .05, Hc + .35, Hc + .65, MARBRE, .02)
        box(B, Fc, sgn * (s + .15) - .05, sgn * (s + .15) + .05, -s - .2, s + .2, Hc + .35, Hc + .65, MARBRE, .02)
    return zl + 2.0


def enceinte(B, pts_fn, z_of, portes, n=160, h=2.0, ep=.55, col=FORTE):
    """mur d'enceinte crénelé + tours carrées ; portes (angles) avec tour-porte et passage"""
    pts = [pts_fn(k / n * 2 * math.pi) for k in range(n + 1)]
    for k, ((ax, ay), (bx, by)) in enumerate(zip(pts, pts[1:])):
        mx, my = (ax + bx) / 2, (ay + by) / 2; a = math.atan2(my - pts_fn(0)[1] * 0, mx) ; t = k / n * 2 * math.pi
        if any(abs((t - p + math.pi) % (2 * math.pi) - math.pi) < .07 for p in portes): continue
        L_ = math.hypot(bx - ax, by - ay); z = z_of(mx, my)
        F = Frame(mx, my, z, math.atan2(by - ay, bx - ax) + math.pi / 2)
        box(B, F, -L_ / 2 - .02, L_ / 2 + .02, -ep / 2, ep / 2, -.8, h, col, .05)
        box(B, F, -L_ / 2 - .02, L_ / 2 + .02, ep / 2 - .02, ep / 2 + .02, h - .45, h - .38, C.mix(col, H('#7a6448'), .4), .02)
        if k % 2 == 0: box(B, F, -.13, .13, -ep / 2, ep / 2, h, h + .32, col, .03)
        if k % 10 == 5:                                                                        # tour carrée
            box(B, F, -.75, .75, -.75, .75, -.8, h + 1.2, C.mix(col, H('#b89464'), .3), .05)
            for su in (-1, 1):
                for sv in (-1, 1): box(B, F, su * .55 - .12, su * .55 + .12, sv * .55 - .12, sv * .55 + .12, h + 1.2, h + 1.5, col, .03)
    for p in portes:                                                                          # tours-portes
        x, y = pts_fn(p); z = z_of(x, y); F = Frame(x, y, z, p)
        box(B, F, -1.5, -.75, -1.0, 1.0, -.8, h + 2.2, col, .05); box(B, F, .75, 1.5, -1.0, 1.0, -.8, h + 2.2, col, .05)
        box(B, F, -1.5, 1.5, -1.0, 1.0, 1.7, h + 2.2, col, .05)
        quad(B, F, [(-.75, 1.03, 0), (.75, 1.03, 0), (.75, 1.03, 1.7), (-.75, 1.03, 1.7)], H('#3a332c'), .02)
        quad(B, F, [(-.75, -1.03, 0), (.75, -1.03, 0), (.75, -1.03, 1.7), (-.75, -1.03, 1.7)], H('#3a332c'), .02)
        gronda(B, F, -1.5, 1.5, -1.0, 1.0, h + 2.3, .25); toit_bas(B, F, -1.5, 1.5, -1.0, 1.0, h + 2.3, TUILES[3], .3, .25)


def echafaud(B, x, y, z):
    """échafaud de la place [C : position] ; forme [I] générique : socle de pierre, plancher, escalier, portique de bois"""
    F = Frame(x, y, z, math.pi / 2)
    box(B, F, -1.6, 1.6, -1.6, 1.6, -.4, .9, SERENA, .04)
    box(B, F, -1.4, 1.4, -1.4, 1.4, .9, 1.05, K.BOIS, .05)
    for k in range(5): box(B, F, -.55, .55, 1.6 + k * .28, 1.88 + k * .28, -.4, .9 - k * .18, SERENA, .03)
    for su in (-1, 1): box(B, F, su * 1.05 - .1, su * 1.05 + .1, -.6, -.4, 1.05, 3.4, K.BOIS2, .03)
    box(B, F, -1.25, 1.25, -.62, -.38, 3.3, 3.55, K.BOIS2, .03)
    for su in (-1, 1):
        for sv in (-1, 1): box(B, F, su * 1.3 - .05, su * 1.3 + .05, sv * 1.3 - .05, sv * 1.3 + .05, 1.05, 1.6, K.BOIS2, .02)
    for sv in (-1, 1): box(B, F, -1.3, 1.3, sv * 1.3 - .04, sv * 1.3 + .04, 1.5, 1.58, K.BOIS2, .02)
    return 3.55


def loggia(B, cx, cy, hw, hh, z, ang=math.pi / 2):
    """loggia ouverte à grandes arcades (niveau 4) [I]"""
    F = Frame(cx, cy, z, ang)
    for k in range(4):
        u = -hw + k * 2 * hw / 3; box(B, F, u - .22, u + .22, -hh, hh, -.4, 3.2, FORTE, .04)
    box(B, F, -hw - .22, hw + .22, -hh - .1, hh + .1, 3.2, 3.9, FORTE, .04)
    for k in range(3):
        u = -hw + (k + .5) * 2 * hw / 3; r = hw / 3 - .22
        for q in range(5):
            a0, a1 = math.pi * q / 5, math.pi * (q + 1) / 5
            quad(B, F, [(u - math.cos(a0) * r, hh + .1, 2.4 + math.sin(a0) * .75), (u - math.cos(a1) * r, hh + .1, 2.4 + math.sin(a1) * .75), (u - math.cos(a1) * r, hh + .1, 3.2), (u - math.cos(a0) * r, hh + .1, 3.2)], FORTE, .03)
    box(B, F, -hw - .25, hw + .25, -hh - .15, hh + .15, 3.9, 4.0, SERENA, .02)
    for k in range(int(2 * hw / .3)):
        u = -hw + k * .3; box(B, F, u - .04, u + .04, hh + .05, hh + .12, 4.0, 4.3, SERENA, .02)
    box(B, F, -hw + .2, hw - .2, -hh + .2, hh - .2, -.05, .05, H('#d8c8a0'), .02)


def opera(B, cx, cy, hw, hh, z, rnd):
    """théâtre d'opéra néoclassique : portique à colonnes, fronton, salle à toit en dôme bas [I]"""
    F = Frame(cx, cy, z, math.pi / 2)
    box(B, F, -hw, hw, -hh, hh - .7, -.5, 3.4, MURS['creme'], .04)
    for k in range(6):
        u = -hw + .4 + k * (2 * hw - .8) / 5; vs = C.bm_cyl(B.bm, F.p(u, hh - .35, 0), F.p(u, hh - .35, 2.6), .14, .14, 10); B.paint(vs, MARBRE, .02)
    box(B, F, -hw, hw, hh - .75, hh, 2.6, 3.0, MARBRE, .02)
    P3 = [F.p(-hw, hh, 3.0), F.p(hw, hh, 3.0), F.p(0, hh, 3.9)]; vs = [B.bm.verts.new(p) for p in P3]; B.bm.faces.new(vs); B.paint(vs, MARBRE, .02)
    prism_x(B, F, -hw, hw, hh - .75, hh + .05, 3.0, .9, TUILES[0])
    vs = C.bm_uvsphere(B.bm, F.p(0, -.3, 3.4), 1, 16, 6, (hw * .75, hh * .75, 1.2)); B.paint(vs, H('#6f8f7a'), .03)
    for k in range(3): fenetre_arc(B, F, -hw + .6 + k * (2 * hw - 1.2) / 2, hh - .72, 1.4, .3, .9)


def villa(B, x, y, z, rnd, couv=TUILES[0]):
    """villa à la toscane [I] : bloc à loggia, altana centrale, jardin en terrasses à parterres de buis, fontaine, citronniers"""
    F = Frame(x, y, z, math.pi / 4 + math.pi / 8)                                              # tournée vers le sud-est (la ville)
    w, d = 5.6, 3.6
    box(B, F, -w / 2, w / 2, -d / 2, d / 2, -.8, 3.4, MURS['creme'], .04)
    for k in (1.15, 2.3): box(B, F, -w / 2 - .03, w / 2 + .03, -d / 2 - .03, d / 2 + .03, k, k + .07, SERENA, .02)
    for q in range(7):
        u = -w / 2 + (q + .5) * w / 7
        if 2 <= q <= 4: quad(B, F, [(u - .3, d / 2 + .02, 0), (u + .3, d / 2 + .02, 0), (u + .3, d / 2 + .02, 1.0), (u - .3, d / 2 + .02, 1.0)], H('#3a332c'), .03)
        else: K.window(B, F, u, d / 2, .65, .26, .4, 'v', PERSIENNES[0])
        K.window(B, F, u, d / 2, 1.75, .26, .42, 'v', PERSIENNES[0]); K.window(B, F, u, d / 2, 2.85, .22, .32, 'v', PERSIENNES[0])
    gronda(B, F, -w / 2, w / 2, -d / 2, d / 2, 3.5, .38); toit_bas(B, F, -w / 2, w / 2, -d / 2, d / 2, 3.5, couv, .2, .38)
    box(B, F, -.9, .9, -.8, .8, 3.5, 5.0, MURS['creme'], .04)                                  # belvédère central
    for q in (-.45, 0, .45): fenetre_arc(B, F, q, .8, 4.3, .16, .5)
    gronda(B, F, -.9, .9, -.8, .8, 5.05, .25); toit_bas(B, F, -.9, .9, -.8, .8, 5.05, couv, .3, .25)
    for t in range(3):                                                                         # jardin en terrasses (descend vers la ville)
        v0 = d / 2 + 1.0 + t * 2.4; zt = -.35 - t * .7
        box(B, F, -w / 2 - 1.5, w / 2 + 1.5, v0, v0 + 2.3, zt - .8, zt, H('#cfc2a0'), .03)
        box(B, F, -w / 2 - 1.5, w / 2 + 1.5, v0 + 2.2, v0 + 2.35, zt - .8, zt + .25, SERENA, .02)
        for pu in (-1, 1):
            for pv in range(2):
                uu = pu * (w / 4 + .4); vv = v0 + .55 + pv * 1.15
                box(B, F, uu - 1.0, uu + 1.0, vv - .35, vv + .35, zt, zt + .22, H('#3f6e3a'), .06)
                box(B, F, uu - .7, uu + .7, vv - .15, vv + .15, zt + .2, zt + .23, H('#e8c95a') if t == 1 else H('#c84a5a'), .2)
        for pu in (-1, 1):
            box(B, F, pu * (w / 2 + 1.2) - .15, pu * (w / 2 + 1.2) + .15, v0 + .3, v0 + .6, zt, zt + .25, H('#b86a40'), .03)
            vs = C.bm_ico(B.bm, F.p(pu * (w / 2 + 1.2), v0 + .45, zt + .55), .3, 1); B.paint(vs, H('#4f8a3a'), .06)
        if t == 1:
            vs = C.bm_cyl(B.bm, F.p(0, v0 + 1.15, zt), F.p(0, v0 + 1.15, zt + .3), .6, .6, 16); B.paint(vs, SERENA, .02)
            vs = C.bm_cyl(B.bm, F.p(0, v0 + 1.15, zt + .3), F.p(0, v0 + 1.15, zt + .31), .5, .5, 16); B.paint(vs, H('#4fb3e0'), .02)
            vs = C.bm_cyl(B.bm, F.p(0, v0 + 1.15, zt + .3), F.p(0, v0 + 1.15, zt + 1.0), .08, .04, 6); B.paint(vs, MARBRE, .02)
    return 5.6


def phare(B, x, y, z):
    """phare de pierre à deux fûts carrés et lanterne [I]"""
    F = Frame(x, y, z, 0)
    box(B, F, -1.1, 1.1, -1.1, 1.1, -.8, 2.0, FORTE, .04)
    box(B, F, -.7, .7, -.7, .7, 2.0, 6.6, FORTE, .04)
    for sgn in (-1, 1):
        for k in range(3): box(B, F, sgn * .72 - .02, sgn * .72 + .02, -.15, .15, 2.6 + k * 1.3, 3.0 + k * 1.3, H('#3a332c'), .02)
    box(B, F, -1.0, 1.0, -1.0, 1.0, 6.6, 6.9, SERENA, .02)
    for su in (-1, 1):
        box(B, F, -1.0, 1.0, su * .95 - .03, su * .95 + .03, 6.9, 7.2, SERENA, .02); box(B, F, su * .95 - .03, su * .95 + .03, -1.0, 1.0, 6.9, 7.2, SERENA, .02)
    vs = C.bm_cyl(B.bm, F.p(0, 0, 6.9), F.p(0, 0, 7.9), .45, .45, 8); B.paint(vs, H('#ffe08a'), .02)
    vs = C.bm_cyl(B.bm, F.p(0, 0, 7.9), F.p(0, 0, 8.6), .55, .05, 8); B.paint(vs, TUILES[3], .02)


def caserne(B, cx, cy, hw, hh, z, rnd):
    """base militaire (Marine) sans emblème [I] : enceinte basse blanche, bâtiment à toits bleu ardoise, tour de guet, cour"""
    F = Frame(cx, cy, z, math.pi / 2); BL, TT = H('#f2f0ea'), H('#4a6a8a')
    for (a, b, c_, e) in ((-hw, hw, hh - .25, hh), (-hw, hw, -hh, -hh + .25), (-hw, -hw + .25, -hh, hh), (hw - .25, hw, -hh, hh)):
        box(B, F, a, b, c_, e, -.6, 1.1, BL, .03)
    quad(B, F, [(-.6, hh + .02, 0), (.6, hh + .02, 0), (.6, hh + .02, 1.0), (-.6, hh + .02, 1.0)], H('#3a4a5a'), .02)
    box(B, F, -hw + .4, hw - .4, -hh + .4, -hh + 2.2, -.6, 2.8, BL, .03)
    for q in range(int((2 * hw - .8) / .6)):
        u = -hw + .7 + q * .6; K.window(B, F, u, -hh + 2.2, 1.0, .22, .36); K.window(B, F, u, -hh + 2.2, 2.0, .22, .36)
    prism_x(B, F, -hw + .3, hw - .3, -hh + .3, -hh + 2.3, 2.8, .7, TT)
    Ft = Frame(cx + hw - 1.0, cy + hh - 1.0, z, 0); box(B, Ft, -.5, .5, -.5, .5, -.6, 4.2, BL, .03); hip(B, Ft, -.65, .65, -.65, .65, 4.2, .7, TT)
    vs = C.bm_cyl(B.bm, F.p(-hw + 1.2, .5, 0), F.p(-hw + 1.2, .5, 4.5), .04, .04, 6); B.paint(vs, H('#d8d8d8'))
    for k in range(5):                                                                         # canons sur le front de mer
        u = -hw + .8 + k * (2 * hw - 1.6) / 4; box(B, F, u - .12, u + .12, hh + .05, hh + .6, .9, 1.15, H('#2e3238'), .02)


def marche(B, cx, cy, hw, hh, z, rnd):
    """halle du marché aux poissons : piliers, toit de tuiles, étals, caisses [C : marché] [forme I]"""
    F = Frame(cx, cy, z, math.pi / 2)
    for su in range(5):
        for sv in (-1, 1):
            u = -hw + su * hw / 2; box(B, F, u - .1, u + .1, sv * hh - .1, sv * hh + .1, -.3, 1.9, SERENA, .03)
    prism_x(B, F, -hw - .25, hw + .25, -hh - .3, hh + .3, 1.9, .6, TUILES[1])
    for k in range(6):
        u = -hw + .5 + k * (2 * hw - 1) / 5; box(B, F, u - .3, u + .3, -.35, .35, 0, .6, K.BOIS, .05)
        box(B, F, u - .25, u + .25, -.3, .3, .6, .7, [H('#cfe6f0'), H('#e8f2f6')][k % 2], .05)
    for k in range(8):
        u = rnd.uniform(-hw, hw); box(B, F, u - .15, u + .15, hh + .2, hh + .5, 0, .3, [H('#3d64b8'), H('#f2f0ea')][k % 2], .05)


# ---------------------------------------------------------------- végétation toscane
def olivier(B, x, y, z, s, rnd):
    vs = C.bm_tube(B.bm, [C.g2b(x, y, z - .2), C.g2b(x + .08 * s, y, z + .5 * s), C.g2b(x - .05 * s, y + .05 * s, z + .85 * s)], lambda t: .11 * s * (1 - .4 * t), 6); B.paint(vs, H('#7a6a54'), .05)
    for k in range(4):
        a = k * 1.7 + rnd.random(); r = .38 * s
        vs = C.bm_ico(B.bm, C.g2b(x + math.cos(a) * r, y + math.sin(a) * r, z + (.95 + .2 * (k % 2)) * s), (.42 - .04 * k) * s, 1, (1, 1, .7))
        B.paint(vs, C.mix(H('#8a9a6a'), H('#a3ad84'), rnd.random()), .08)


def pin_parasol(B, x, y, z, s, rnd):
    vs = C.bm_tube(B.bm, [C.g2b(x, y, z - .2), C.g2b(x + .15 * s, y, z + 1.4 * s), C.g2b(x + .25 * s, y - .1 * s, z + 2.3 * s)], lambda t: .1 * s * (1 - .35 * t), 6); B.paint(vs, H('#8a5a3a'), .04)
    vs = C.bm_uvsphere(B.bm, C.g2b(x + .25 * s, y - .1 * s, z + 2.55 * s), 1, 12, 5, (1.25 * s, 1.25 * s, .38 * s)); B.paint(vs, C.mix(H('#4e6e3a'), H('#5f7f44'), rnd.random()), .07)


def maquis(B, x, y, z, s, rnd):
    for k in range(3):
        a = rnd.random() * 6.283
        vs = C.bm_ico(B.bm, C.g2b(x + math.cos(a) * .3 * s, y + math.sin(a) * .3 * s, z + .2 * s), (.35 + .1 * rnd.random()) * s, 1, (1, 1, .7)); B.paint(vs, C.mix(H('#6f7f4a'), H('#8a8a5a'), rnd.random()), .08)


def vigne(B, x, y, z_of, ang, L_):
    """rangs de vigne (4 rangs parallèles)"""
    c, s = math.cos(ang), math.sin(ang)
    for r in range(4):
        o = (r - 1.5) * .42; ax, ay = x - c * L_ / 2 - s * o, y - s * L_ / 2 + c * o
        F = Frame(ax + c * L_ / 2, ay + s * L_ / 2, z_of(ax + c * L_ / 2, ay + s * L_ / 2), ang + math.pi / 2)
        box(B, F, -L_ / 2, L_ / 2, -.1, .1, 0, .38, H('#5f7f3a'), .1)
