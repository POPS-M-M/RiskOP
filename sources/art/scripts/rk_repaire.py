"""RISK OP — kit REPAIRE DE ROCHE (La Ruche, île 13).
[C] socle de roche gris sombre ; formation de roche jaunâtre en forme de crâne au centre, forteresse à l'intérieur ; baie vitrée géante dans le nez,
petites fenêtres, orbites qui traversent toute la structure ; ville de petits bâtiments carrés en briques grossières ; palmiers démesurés autour du
crâne ; crâne fendu puis rafistolé avec des pansements (One Piece Wiki, « Hachinosu », consulté le 17/11/2026).
[I] Toutes les formes, proportions et couleurs ; dents ; porte ; quais ; arène. Le bandana et le nœud sculptés du crâne ne sont PAS représentés
(motif trop proche d'un emblème pirate). Aucun personnage, pavillon, emblème, navire identifiable, ni copie de décor officiel.
Repère : x est, y sud, z haut (jeu) ; Frame de rk_port (v = façade avant).
"""
import math, random
import bpy, bmesh
from mathutils import Vector, Matrix, noise
from mathutils.bvhtree import BVHTree
import rk_common as C
from rk_port import Frame, box, quad

H = C.hexc
G = C.g2b
ROCHE = [H('#7a5a44'), H('#8c6c52'), H('#5e4636'), H('#9c7c5e')]      # [I, à la demande de l'utilisateur d'après sa photo : socle brun comme le crâne ; le wiki dit « gris sombre »]
CRANE = [H('#b89470'), H('#a07a5a'), H('#7e5c44'), H('#3a2a24')]          # brun-ocre [I : image de référence ; le wiki dit « jaunâtre »]
BRIQUE = [H('#c49a6c'), H('#b08460'), H('#9a7050'), H('#c8a070'), H('#a87a56')]
TOIT = [H('#7a5a3a'), H('#8a4a32'), H('#5a4a3a'), H('#b89a74')]
PANSEMENT = [H('#e8c8a0'), H('#f4e4c8'), H('#c8a07a')]
FEUILLE = [H('#4a8a3a'), H('#5a9a44'), H('#3a6a30')]
BOIS, BOIS2, VITRE, NOIR = H('#7a5634'), H('#4a3424'), H('#2a3442'), H('#2a2622')


# ------------------------------------------------------------------ crâne-forteresse
EP = .36                                                                        # demi-épaisseur du crâne (× rayon)


def crane(coll, mat, cx, cy, z0, Rk, rnd):
    """[C] formation en crâne : dalle épaisse de roche (forme plate, faces avant et arrière planes, bords arrondis) [forme : I d'après l'image
    de référence et la demande de l'utilisateur], orbites qui traversent toute la structure (booléen), nez creusé pour la baie vitrée,
    bouche et dents [I] ; renvoie (objet, bvh, centre, cotes utiles)"""
    zc = z0 + .8 * Rk
    bm = bmesh.new(); g = bmesh.ops.create_uvsphere(bm, u_segments=64, v_segments=40, radius=1)
    for v in g['verts']:
        dx, fy, dz = v.co.x, -v.co.y, v.co.z                                       # fy > 0 : face (sud)
        sx = Rk * (1 - .36 * max(0, -dz) ** 1.2)
        if dz < -.1: sx *= 1 - .18 * min(1, (-dz - .1) / .5)                        # mâchoire plus étroite
        if -.35 < dz < 0: sx *= 1 + .07 * math.exp(-((abs(dx) - .55) / .2) ** 2)   # pommettes
        q = Vector((dx, fy, dz)); k = 1 + .05 * noise.noise(q * 2.2) + .025 * noise.noise(q * 5.5)   # contour de roche irrégulier
        x = dx * sx * .95 * k; z = dz * Rk * (1.15 if dz > 0 else 1.04) * k
        f = math.copysign(EP * Rk * abs(fy) ** .3, fy) + .035 * Rk * noise.noise(q * 3.1 + Vector((4, 0, 0))) * abs(fy)   # dalle épaisse : faces plates
        if fy > .5 and .2 < dz < .5: f += .04 * Rk * math.exp(-((dz - .34) / .07) ** 2)   # arcade sourcilière
        z = max(z, -.8 * Rk)
        v.co = Vector((cx + x, -(cy + f), zc + z))
    sk = C.mk_obj('LR_crane', bm, coll, mat, True)
    # découpes : orbites traversantes, cavité du nez, bouche et interstices des dents
    cb = bmesh.new(); ex, ez, er = .35 * Rk, zc + .08 * Rk, .25 * Rk
    for s in (-1, 1):
        vs = C.bm_cyl(cb, G(cx + s * ex, cy - 2 * Rk, ez), G(cx + s * ex, cy + 2 * Rk, ez), er, er, 28)
        for v in vs: v.co.z = ez + (v.co.z - ez) * 1.12; v.co.x = cx + s * ex + (v.co.x - cx - s * ex) * .95
    nz0, nz1, nw = zc - .44 * Rk, zc - .14 * Rk, .16 * Rk
    tri = [(-nw, nz0), (nw, nz0), (0, nz1)]
    vf = [cb.verts.new(G(cx + u, cy + .12 * Rk, z)) for u, z in tri]; vb = [cb.verts.new(G(cx + u, cy + 1.6 * Rk, z)) for u, z in tri]
    cb.faces.new(vf); cb.faces.new(list(reversed(vb)))
    for i in range(3): cb.faces.new((vf[i], vf[(i + 1) % 3], vb[(i + 1) % 3], vb[i]))
    mz = zc - .62 * Rk; mw = .36 * Rk
    C.bm_box(cb, G(cx, cy + .6 * Rk, mz), (2 * mw, .9 * Rk, .06 * Rk))
    for k in range(8):
        u = -mw + (k + .5) * 2 * mw / 8
        C.bm_box(cb, G(cx + u, cy + .6 * Rk, mz), (.035 * Rk, .9 * Rk, .3 * Rk))
    cut = C.mk_obj('LR_decoupe', cb, coll, mat, False)
    m = sk.modifiers.new('trous', 'BOOLEAN'); m.object = cut; m.operation = 'DIFFERENCE'; m.solver = 'EXACT'
    if hasattr(m, 'use_self'): m.use_self = True
    dg = bpy.context.evaluated_depsgraph_get(); me = bpy.data.meshes.new_from_object(sk.evaluated_get(dg)); old = sk.data
    sk.modifiers.clear(); sk.data = me; bpy.data.meshes.remove(old); bpy.data.objects.remove(cut)
    for p in me.polygons: p.use_smooth = True

    def col(co, n):
        gx, gy, z = co.x, -co.y, co.z
        for s in (-1, 1):
            if (gx - cx - s * ex) ** 2 / (er * .97) ** 2 + (z - ez) ** 2 / (er * 1.1) ** 2 < 1.04 and abs(gy - cy) < Rk * .95: return CRANE[3]
        if gy > cy + .1 * Rk and nz0 - .1 < z < nz1 + .1 and abs(gx - cx) < nw * (1 - (z - nz0) / (nz1 - nz0)) + .15: return C.mix(CRANE[3], CRANE[2], .4)
        if gy > cy + .12 * Rk and abs(z - mz) < .2 * Rk and abs(gx - cx) < mw + .05: return C.mix(CRANE[2], CRANE[3], .5) if abs(z - mz) < .04 * Rk else CRANE[1]
        base = C.mix(CRANE[2], CRANE[0], max(0, min(1, (z - z0) / (Rk * .9))))
        return C.mix(base, CRANE[2], max(0, .6 * noise.noise(Vector((gx * .5, gy * .5, z * 1.4)))))
    C.paint(sk, col)
    bvh = BVHTree.FromPolygons([v.co.copy() for v in me.vertices], [tuple(p.vertices) for p in me.polygons])
    return sk, bvh, dict(zc=zc, ex=ex, ez=ez, er=er, nz0=nz0, nz1=nz1, nw=nw, mz=mz, mw=mw)


def surf(bvh, cx, cy, zc, d):
    """point de la surface du crâne dans la direction d (repère jeu dx, dy, dz depuis le centre)"""
    dv = Vector((d[0], -d[1], d[2])).normalized(); o = Vector((cx, -cy, zc)) + dv * 30
    hit = bvh.ray_cast(o, -dv, 60)
    return (hit[0], hit[1].normalized()) if hit[0] is not None else (None, None)


def plaque(B, bvh, cx, cy, zc, d, du, w, h, col, off=.04, n=4):
    """rectangle collé à la surface (fenêtre, pansement) : direction centrale d, axe long du (jeu), demi-tailles w (long) et h"""
    p0, nrm = surf(bvh, cx, cy, zc, d)
    if p0 is None: return []
    U = Vector((du[0], -du[1], du[2])); U = (U - nrm * U.dot(nrm)).normalized(); V = nrm.cross(U).normalized()
    top, bot = [], []
    for i in range(n + 1):
        t = -w + 2 * w * i / n
        for s, lst in ((1, top), (-1, bot)):
            row = []
            for e in (-h, h):
                q = p0 + U * t + V * e; dd = (q - Vector((cx, -cy, zc))).normalized()
                hit = bvh.ray_cast(Vector((cx, -cy, zc)) + dd * 30, -dd, 60)
                base = hit[0] if hit[0] is not None else q
                row.append(B.bm.verts.new(base + nrm * (off if s > 0 else off * .3)))
            lst.append(row)
    for i in range(n):
        B.bm.faces.new((top[i][0], top[i + 1][0], top[i + 1][1], top[i][1]))
        B.bm.faces.new((bot[i][1], bot[i + 1][1], bot[i + 1][0], bot[i][0]))
        B.bm.faces.new((top[i][0], bot[i][0], bot[i + 1][0], top[i + 1][0])); B.bm.faces.new((top[i + 1][1], bot[i + 1][1], bot[i][1], top[i][1]))
    B.bm.faces.new((top[0][1], bot[0][1], bot[0][0], top[0][0])); B.bm.faces.new((top[n][0], bot[n][0], bot[n][1], top[n][1]))
    vs = [v for r in top + bot for v in r]; B.paint(vs, col, .03); return vs


def plaque_face(B, bvh, cx, cy, zc, Rk, side, u, w, ang, hl, hh, col, off=.05, n=4):
    """rectangle collé à une face plate du crâne (side +1 : face sud, -1 : arrière), centré en (u, w) dans le plan de la face
    (u vers l'est, w vers le haut depuis le centre), axe long incliné de 'ang' ; projeté rayon par rayon pour épouser la roche"""
    ca, sa = math.cos(ang), math.sin(ang); rows_t, rows_b = [], []
    for i in range(n + 1):
        t = -hl + 2 * hl * i / n; rt, rb = [], []
        for e in (-hh, hh):
            uu, ww = u + ca * t - sa * e, w + sa * t + ca * e
            hit = bvh.ray_cast(G(cx + uu, cy + side * 3 * Rk, zc + ww), Vector((0, side, 0)), 6 * Rk)
            if hit[0] is None: return []
            nrm = hit[1].normalized()
            rt.append(B.bm.verts.new(hit[0] + nrm * off)); rb.append(B.bm.verts.new(hit[0] + nrm * off * .3))
        rows_t.append(rt); rows_b.append(rb)
    T, Bo = rows_t, rows_b
    for i in range(n):
        B.bm.faces.new((T[i][0], T[i + 1][0], T[i + 1][1], T[i][1])); B.bm.faces.new((Bo[i][1], Bo[i + 1][1], Bo[i + 1][0], Bo[i][0]))
        B.bm.faces.new((T[i][0], Bo[i][0], Bo[i + 1][0], T[i + 1][0])); B.bm.faces.new((T[i + 1][1], Bo[i + 1][1], Bo[i][1], T[i][1]))
    B.bm.faces.new((T[0][1], Bo[0][1], Bo[0][0], T[0][0])); B.bm.faces.new((T[n][0], Bo[n][0], Bo[n][1], T[n][1]))
    vs = [v for r in T + Bo for v in r]; B.paint(vs, col, .03); return vs


def dans_trou(u, w, k, marge=.5):
    """(u, w) sur la face tombe-t-il dans une orbite, le nez ou la bouche (avec une marge) ?"""
    zc = k['zc']
    for s in (-1, 1):
        if (u - s * k['ex']) ** 2 / (k['er'] + marge) ** 2 + (w - (k['ez'] - zc)) ** 2 / (k['er'] * 1.12 + marge) ** 2 < 1: return True
    if k['nz0'] - zc - marge < w < k['nz1'] - zc + marge and abs(u) < k['nw'] + marge: return True
    if abs(w - (k['mz'] - zc)) < .3 * 7 * .15 + marge and abs(u) < k['mw'] + marge: return True
    return False


def fissure(B, bvh, cx, cy, zc, Rk, pts, larg, rnd):
    """[C] fissure du crâne : ruban sombre en zigzag collé à la surface (pts : directions depuis le centre, repère jeu)"""
    for k in range(len(pts) - 1):
        a, b = Vector(pts[k]).normalized(), Vector(pts[k + 1]).normalized(); d = a.lerp(b, .5)
        plaque(B, bvh, cx, cy, zc, tuple(d), tuple(b - a), (b - a).length * Rk * .78 + .1, larg * (.7 + .6 * rnd.random()), NOIR, .03, 3)


def baie_vitree(Bg, Bp, cx, cy, Rk, k):
    """[C] baie vitrée géante dans le nez : triangle de verre en retrait, montants"""
    y = cy + .16 * Rk; nz0, nz1, nw = k['nz0'] + .1, k['nz1'] - .12, k['nw'] - .12
    vs = [Bg.bm.verts.new(G(cx + u, y, z)) for u, z in ((-nw, nz0), (nw, nz0), (0, nz1))]; Bg.bm.faces.new(vs)
    Bg.paint(vs, lambda co: C.mix(VITRE, H('#6a8ca8'), max(0, min(1, (co.z - nz0) / (nz1 - nz0)))), .05)
    for u in (-nw * .5, 0, nw * .5):
        zt = nz0 + (nz1 - nz0) * (1 - abs(u) / nw)
        box(Bp, Frame(cx + u, y + .03, 0, math.pi / 2), -.05, .05, -.03, .03, nz0, zt, BOIS2, .02, True, True)
    box(Bp, Frame(cx, y + .03, 0, math.pi / 2), -nw, nw, -.03, .03, nz0 + (nz1 - nz0) * .45, nz0 + (nz1 - nz0) * .45 + .1, BOIS2, .02, True, True)


def porte(B, cx, cy, z0, Rk, rnd):
    """[I] porte de la forteresse au pied de la mâchoire, perron et marches vers la grande rue"""
    yf = cy + .34 * Rk; F = Frame(cx, yf, z0, math.pi / 2)
    box(B, F, -1.1, 1.1, -.6, .25, -.6, .2, ROCHE[3], .04)
    box(B, F, -.75, .75, .2, .3, .2, 1.9, BOIS2, .03)
    for u in (-.5, 0, .5): box(B, F, u - .04, u + .04, .3, .34, .2, 1.9, BOIS, .02)
    for k in range(5): box(B, F, -.9, .9, .25 + k * .45, .7 + k * .45, -.6, .1 - k * .18, ROCHE[1], .03)


# ------------------------------------------------------------------ ville de briques
def maison(B, x, y, z0, ang, w, d, etages, rnd):
    """[C : bâtiment carré, briques grossières] cube de briques légèrement de travers, soubassement sombre, toit plat à rebord,
    porte de planches, petites fenêtres ; étage en retrait, appentis, tonneaux et caisses sur les toits [I]"""
    F = Frame(x, y, z0, ang + (rnd.random() - .5) * .12, (rnd.random() - .5) * .03, (rnd.random() - .5) * .03)
    c = BRIQUE[rnd.randrange(5)]; h = .7 + .2 * rnd.random()
    box(B, F, -w / 2, w / 2, -d / 2, d / 2, -.5, h, lambda co, z_=z0: C.mix(c, C.mix(c, ROCHE[2], .45), 1.0 if co.z < z_ + .12 else 0), .07)
    box(B, F, -w / 2 - .04, w / 2 + .04, -d / 2 - .04, d / 2 + .04, h, h + .07, TOIT[3], .04, True, True)
    quad(B, F, [(-.13, d / 2 + .01, 0), (.13, d / 2 + .01, 0), (.13, d / 2 + .01, .48), (-.13, d / 2 + .01, .48)], BOIS2, .04)
    for u in ((-w / 2 + .2,) if w < 1 else (-w / 2 + .2, w / 2 - .2)):
        quad(B, F, [(u - .08, d / 2 + .01, .4), (u + .08, d / 2 + .01, .4), (u + .08, d / 2 + .01, .58), (u - .08, d / 2 + .01, .58)], NOIR, .02)
    if rnd.random() < .3:                                                                           # pièce de briques rapiécée
        u = (rnd.random() - .5) * w * .5; quad(B, F, [(u - .15, d / 2 + .012, .1), (u + .15, d / 2 + .012, .1), (u + .15, d / 2 + .012, .32), (u - .15, d / 2 + .012, .32)], BRIQUE[(BRIQUE.index(c) + 2) % 5], .04)
    top = h + .07
    if etages > 1:
        w2, d2 = w * .7, d * .7; ou = (rnd.random() - .5) * (w - w2); h2 = .55 + .15 * rnd.random(); c2 = BRIQUE[rnd.randrange(5)]
        box(B, F, ou - w2 / 2, ou + w2 / 2, -d2 / 2, d2 / 2, top, top + h2, c2, .07)
        quad(B, F, [(ou - .07, d2 / 2 + .01, top + .2), (ou + .07, d2 / 2 + .01, top + .2), (ou + .07, d2 / 2 + .01, top + .38), (ou - .07, d2 / 2 + .01, top + .38)], NOIR, .02)
        box(B, F, ou - w2 / 2 - .04, ou + w2 / 2 + .04, -d2 / 2 - .04, d2 / 2 + .04, top + h2, top + h2 + .06, TOIT[3], .04, True, True)
        top += h2 + .06
    r_ = rnd.random()
    if r_ < .22:                                                                                    # appentis de planches
        vs = [B.bm.verts.new(F.p(u, v, z)) for u, v, z in ((-w / 2, -d / 2 - .02, h + .07), (w / 2, -d / 2 - .02, h + .07), (w / 2, -d / 2 - .45, h * .55), (-w / 2, -d / 2 - .45, h * .55))]
        B.bm.faces.new(vs); B.paint(vs, TOIT[rnd.randrange(3)], .05)
        for u in (-w / 2 + .05, w / 2 - .05): box(B, F, u - .03, u + .03, -d / 2 - .45, -d / 2 - .39, 0, h * .55, BOIS, .02)
    elif r_ < .55:                                                                                  # tonneau ou caisse sur le toit
        px, py = x + F.t[0] * (rnd.random() - .5) * w * .4, y + F.t[1] * (rnd.random() - .5) * w * .4
        if rnd.random() < .5:
            vs = C.bm_cyl(B.bm, G(px, py, z0 + top), G(px, py, z0 + top + .28), .12, .12, 6); B.paint(vs, BOIS, .05)
        else:
            box(B, Frame(px, py, z0 + top, ang + rnd.random()), -.13, .13, -.13, .13, 0, .24, H('#9a7a50'), .05)
    return top


def noeud(B, cx, cy, zc, Rk, rnd):
    """[C] saillie rocheuse en forme de bouts de nœud sur le côté gauche du crâne (à droite vu de face) : simples bosses de roche,
    sans le bandana sculpté"""
    for dx, fy, dz, r in ((.98, -.12, .3, .3), (1.02, .05, -.02, .26), (.9, -.3, .55, .18)):
        vs = C.bm_ico(B.bm, G(cx + dx * Rk, cy + fy * Rk, zc + dz * Rk), r * Rk, 2, (.8, 1, 1.05), .18, rnd.random() * 9)
        B.paint(vs, lambda co: C.mix(CRANE[1], CRANE[2], max(0, .7 * noise.noise(co * .6))), .05)


def aiguille(B, x, y, z, s, rnd):
    """[I d'après l'image de référence] aiguille de roche brune empilée"""
    zz = z - .5
    for k in range(3):
        h = (2.0 - .4 * k) * s; r = (1.1 - .25 * k) * s
        vs = C.bm_ico(B.bm, G(x + (rnd.random() - .5) * .4 * s, y + (rnd.random() - .5) * .4 * s, zz + h * .5), r, 1, (1, 1, h / r / 2), .25, rnd.random() * 9)
        B.paint(vs, lambda co: C.mix(CRANE[2], CRANE[1], max(0, min(1, .5 + noise.noise(co * .8)))), .06); zz += h * .8


def terrasse(B, x, y, z0, ang, w, d, etages, rnd):
    """[I d'après l'image de référence ; C : briques grossières] maison serrée au pied du crâne : blocs empilés en retrait, petites fenêtres,
    porte cintrée sombre"""
    F = Frame(x, y, z0, ang); top = -.6; hs = 0
    for e in range(etages):
        c = BRIQUE[rnd.randrange(5)]; s_ = 1 - .16 * e; h = .7 + .2 * rnd.random(); ov = -.12 * e
        box(B, F, -w / 2 * s_, w / 2 * s_, -d / 2 * s_ + ov, d / 2 * s_ + ov, top, hs + h, c, .07)
        for u in ((-w * .22 * s_, w * .22 * s_) if w * s_ > .8 else (0,)):
            quad(B, F, [(u - .08, d / 2 * s_ + ov + .01, hs + .3), (u + .08, d / 2 * s_ + ov + .01, hs + .3), (u + .08, d / 2 * s_ + ov + .01, hs + .52), (u - .08, d / 2 * s_ + ov + .01, hs + .52)], NOIR, .02)
        top = hs + h - .05; hs += h
    box(B, F, -w / 2 * s_ - .04, w / 2 * s_ + .04, -d / 2 * s_ + ov - .04, d / 2 * s_ + ov + .04, hs, hs + .06, TOIT[3], .04, True, True)
    quad(B, F, [(-.14, d / 2 + .01, 0), (.14, d / 2 + .01, 0), (.14, d / 2 + .01, .42), (0, d / 2 + .01, .52), (-.14, d / 2 + .01, .42)], NOIR, .02)
    return hs + .06


# ------------------------------------------------------------------ végétation, roche, mer
def palmier_geant(B, x, y, z, s, rnd):
    """[C : palmiers démesurés] stipe annelé haut de 9 à 11, couronne de grandes palmes retombantes, noix"""
    h = (9 + 2 * rnd.random()) * s; a0 = rnd.random() * 6.28; bend = .12 * h
    pts = C.catmull([G(x, y, z - .3), G(x + math.cos(a0) * bend * .2, y + math.sin(a0) * bend * .2, z + h * .5), G(x + math.cos(a0) * bend, y + math.sin(a0) * bend, z + h)], 4)
    vs = C.bm_tube(B.bm, pts, lambda t: (.5 - .22 * t) * s, 8); B.paint(vs, lambda co: H('#8a6a44') if int(co.z * 2.2) % 2 else H('#6a5034'), .04)
    top = pts[-1]
    for k in range(9):
        a = k / 9 * 6.283 + rnd.random() * .3; dv = Vector((math.cos(a), math.sin(a), 0)); side = Vector((-dv.y, dv.x, 0))
        p1 = top + dv * 2.0 * s + Vector((0, 0, .7 * s)); p2 = top + dv * 4.2 * s + Vector((0, 0, -.9 * s)); g = FEUILLE[k % 3]
        vs = [B.bm.verts.new(q) for q in (top, p1 + side * .55 * s, p2, p1 - side * .55 * s)]; B.bm.faces.new(vs); B.paint(vs, g, .05)
        vs = [B.bm.verts.new(q) for q in (top + Vector((0, 0, -.02)), p1 - side * .55 * s + Vector((0, 0, -.04)), p2 + Vector((0, 0, -.04)), p1 + side * .55 * s + Vector((0, 0, -.04)))]
        B.bm.faces.new(vs); B.paint(vs, C.mix(g, (0, 0, 0, 1), .25), .05)
    for k in range(4):
        a = k * 1.57 + .3; vs = C.bm_ico(B.bm, top + Vector((math.cos(a) * .35 * s, math.sin(a) * .35 * s, -.35 * s)), .25 * s, 1); B.paint(vs, H('#6a5a2a'), .04)
    return top.z


def palmier(B, x, y, z, s, rnd):
    top = G(x + (rnd.random() - .5) * .5, y + (rnd.random() - .5) * .5, z + (1.7 + .4 * rnd.random()) * s)
    vs = C.bm_cyl(B.bm, G(x, y, z - .2), top, .09 * s, .06 * s, 4); B.paint(vs, H('#8a6a44'), .04)
    for k in range(6):
        a = k / 6 * 6.283 + rnd.random() * .3; dv = Vector((math.cos(a), math.sin(a), 0)); side = Vector((-dv.y, dv.x, 0)) * .18 * s
        tip = top + dv * 1.1 * s + Vector((0, 0, -.45 * s)); mid = top + dv * .6 * s + Vector((0, 0, .12 * s))
        vs = [B.bm.verts.new(q) for q in (top, mid + side, tip, mid - side)]; B.bm.faces.new(vs); B.paint(vs, FEUILLE[k % 3], .04)


def buisson(B, x, y, z, s, rnd):
    vs = C.bm_ico(B.bm, G(x, y, z + .2 * s), .45 * s, 1, (1, 1, .7), .3, rnd.random() * 9); B.paint(vs, C.mix(H('#7a7448'), H('#5a6a3a'), rnd.random()), .06)


def rocher(B, x, y, z, s, rnd):
    """[C : roche gris sombre] aiguille de roche facettée"""
    vs = C.bm_ico(B.bm, G(x, y, z + 1.0 * s), 1.3 * s, 1, (1, .9, 2.0), .35, rnd.random() * 9)
    B.paint(vs, lambda co: C.mix(ROCHE[2], ROCHE[3], max(0, min(1, (co.z - z) / (3.5 * s)))), .06)


def jetee(B, x, y, ang, L_, rnd):
    """[I] jetée de bois sur pieux, bittes, caisses et tonneaux"""
    F = Frame(x, y, 0, ang)
    box(B, F, -.45, .45, -.6, L_, .32, .45, BOIS, .05, True, True)
    for v in [k * .9 for k in range(int(L_ / .9) + 1)]:
        for u in (-.4, .4): box(B, F, u - .06, u + .06, v - .06, v + .06, -1.0, .38, BOIS2, .03)
    for k in range(2):
        v = L_ * (.3 + .4 * k); u = (-1) ** k * .25
        box(B, F, u - .14, u + .14, v - .14, v + .14, .45, .72, H('#9a7a50'), .05)
    box(B, F, -.08, .08, L_ - .2, L_ - .04, .45, .65, BOIS2, .02)


def quai(B, cx, cy, a0, a1, r, z):
    """[I] quai de pierre sombre le long de la côte du port"""
    n = 16; pts_o = []; pts_i = []
    for k in range(n + 1):
        a = a0 + (a1 - a0) * k / n; pts_o.append((math.cos(a) * r, math.sin(a) * r)); pts_i.append((math.cos(a) * (r - 1.6), math.sin(a) * (r - 1.6)))
    rows = [[B.bm.verts.new(G(px, py, zz)) for (px, py), zz in ((pts_i[k], z), (pts_o[k], z), (pts_o[k], -1.2))] for k in range(n + 1)]
    for k in range(n):
        B.bm.faces.new((rows[k][0], rows[k + 1][0], rows[k + 1][1], rows[k][1])); B.bm.faces.new((rows[k][1], rows[k + 1][1], rows[k + 1][2], rows[k][2]))
    B.paint([v for r_ in rows for v in r_], lambda co: ROCHE[1] if co.z > z - .1 else ROCHE[2], .05)


def arene(B, Bl, x, y, z0, r, rnd):
    """[I] niveau 4 : arène ronde de roche, gradins, sol de sable, torches"""
    prof = [(r * .62, z0 + .05), (r * .7, z0 + .45), (r * .8, z0 + .45), (r * .82, z0 + .85), (r * .92, z0 + .85), (r * .94, z0 + 1.3), (r, z0 + 1.45), (r * 1.04, z0 - .5)]
    seg = 32; rings = [[B.bm.verts.new(G(x + math.cos(k / seg * 6.283) * rr, y + math.sin(k / seg * 6.283) * rr, zz)) for k in range(seg)] for rr, zz in prof]
    for i in range(len(rings) - 1):
        for k in range(seg): B.bm.faces.new((rings[i][k], rings[i][(k + 1) % seg], rings[i + 1][(k + 1) % seg], rings[i + 1][k]))
    B.paint([v for r_ in rings for v in r_], lambda co: ROCHE[3] if co.z > z0 + .2 else ROCHE[1], .05)
    vs = [B.bm.verts.new(G(x + math.cos(k / seg * 6.283) * r * .62, y + math.sin(k / seg * 6.283) * r * .62, z0 + .05)) for k in range(seg)]
    B.bm.faces.new(vs); B.paint(vs, H('#c8b48a'), .05)
    for k in range(6):
        a = k / 6 * 6.283; tx, ty = x + math.cos(a) * r * .97, y + math.sin(a) * r * .97
        vs = C.bm_cyl(B.bm, G(tx, ty, z0 + 1.3), G(tx, ty, z0 + 2.1), .05, .05, 5); B.paint(vs, BOIS2, .02)
        vs = C.bm_ico(Bl.bm, G(tx, ty, z0 + 2.2), .14, 1, (1, 1, 1.5)); Bl.paint(vs, H('#ff9a3a'), .03)
    return 2.3
