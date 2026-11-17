"""RISK OP — kit CORAIL ET BULLES (Île des Hommes-Poissons, île 14).
[C] île sous une bulle géante à double couche (moitié eau et récif, moitié air) ; palais Ryugu dans une petite bulle au sommet de la bulle
principale, seul accès par le couloir de liaison ; tour de la Coquille dure au nord-est du château ; tour-prison ; place Gyoncorde au centre ;
Coral Hill, ville portuaire ; moulins à eau ; usine de bonbons ; centre commercial ; salle de réunion ; dojo (One Piece Wiki).
[C?] maisons en coquillages et en bulles, coraux et algues (de mémoire). [I] toutes les formes, couleurs et proportions.
Aucun personnage, aucune sirène, aucun monstre, aucun navire identifiable, aucun symbole, aucune copie de décor officiel.
Les bulles en volume n'existent qu'en 2.5D (verre rendu par Cycles) : objets marqués « rk_25d_seul », exclus du glTF et des cartes de hauteur ;
en 3D (sans matériaux) leur bord est figuré par des anneaux.
Repère : x est, y sud, z haut (jeu) ; Frame de rk_port (v = façade avant). Lots T = (peint, verre, lueur).
"""
import math, random
import bpy, bmesh
from mathutils import Vector, noise
import rk_common as C
from rk_port import Frame, box, quad, hip
from rk_retrofutur import torus, revolve, coupole

H = C.hexc
G = C.g2b
CORAIL = [H('#f58aa0'), H('#f7b2a0'), H('#e86a7a'), H('#f49a8a')]
NACRE = [H('#fff0f0'), H('#f7e6dc'), H('#e8d4c8'), H('#fbe8f0')]
RECIF = [H('#ffb04a'), H('#c86ad8'), H('#f4d84a'), H('#f26a5a'), H('#ff8ac8'), H('#6ac8e8')]
ALGUE = [H('#3a9a6a'), H('#5ab47a'), H('#2a7a5a')]
PASTEL = [H('#f7c6d0'), H('#c8e8f0'), H('#f8e0b0'), H('#d8c8f0'), H('#c8f0d8'), H('#ffd0b8')]
BULLE_C = [H('#bfefff'), H('#e8fbff'), H('#8ad8f0')]
VITRE, NOIR, BOIS = H('#3a5a78'), H('#3a3040'), H('#8a6440')


# ------------------------------------------------------------------ matériau des bulles (2.5D seulement)
def mat_bulle():
    """verre de bulle pour Cycles : quasi transparent de face, reflet bleuté sur les bords (poids de couche)"""
    m = bpy.data.materials.get('RK_Bulle')
    if m: return m
    m = bpy.data.materials.new('RK_Bulle'); m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial'); mix = nt.nodes.new('ShaderNodeMixShader'); tr = nt.nodes.new('ShaderNodeBsdfTransparent')
    em = nt.nodes.new('ShaderNodeEmission'); em.inputs['Color'].default_value = (.75, .95, 1.0, 1); em.inputs['Strength'].default_value = .9
    lw = nt.nodes.new('ShaderNodeLayerWeight'); lw.inputs['Blend'].default_value = .18
    mp = nt.nodes.new('ShaderNodeMapRange'); mp.inputs['From Min'].default_value = .0; mp.inputs['From Max'].default_value = 1.0
    mp.inputs['To Min'].default_value = .05; mp.inputs['To Max'].default_value = .55
    nt.links.new(lw.outputs['Facing'], mp.inputs['Value']); nt.links.new(mp.outputs['Result'], mix.inputs['Fac'])
    nt.links.new(tr.outputs[0], mix.inputs[1]); nt.links.new(em.outputs[0], mix.inputs[2]); nt.links.new(mix.outputs[0], out.inputs['Surface'])
    if hasattr(m, 'blend_method'): m.blend_method = 'BLEND'
    return m


def calotte(coll, name, cx, cy, Rs, zc, zmin, seg=64, rings=28):
    """calotte de sphère (centre cx, cy, zc ; rayon Rs) au-dessus de zmin ; objet 2.5D seul"""
    bm = bmesh.new(); thm = math.acos(max(-1, min(1, (zmin - zc) / Rs))); rows = []
    for i in range(rings + 1):
        th = thm * i / rings; rr = Rs * math.sin(th); z = zc + Rs * math.cos(th)
        rows.append([bm.verts.new(G(cx + math.cos(k / seg * 2 * math.pi) * rr, cy + math.sin(k / seg * 2 * math.pi) * rr, z)) for k in range(seg)] if i else [bm.verts.new(G(cx, cy, z))])
    for k in range(seg): bm.faces.new((rows[0][0], rows[1][k], rows[1][(k + 1) % seg]))
    for i in range(1, rings):
        for k in range(seg): bm.faces.new((rows[i][k], rows[i + 1][k], rows[i + 1][(k + 1) % seg], rows[i][(k + 1) % seg]))
    o = C.mk_obj(name, bm, coll, mat_bulle(), True); o['rk_25d_seul'] = True; return o


def sphere_bulle(coll, name, cx, cy, cz, r):
    bm = bmesh.new(); C.bm_uvsphere(bm, G(cx, cy, cz), r, 48, 24)
    o = C.mk_obj(name, bm, coll, mat_bulle(), True); o['rk_25d_seul'] = True; return o


# ------------------------------------------------------------------ pièces de base
def dome_cotes(B, cx, cy, z0, r, h, cotes, col, seg=32, n=7):
    """dôme de coquille Saint-Jacques : côtes rayonnantes (rayon modulé) ; col(co) ou couleur"""
    rows = []
    for i in range(n + 1):
        t = i / n; rr = r * math.cos(t * math.pi / 2); z = z0 + h * math.sin(t * math.pi / 2)
        if i == n: rows.append([B.bm.verts.new(G(cx, cy, z))]); break
        rows.append([B.bm.verts.new(G(cx + math.cos(a) * rr * (1 + .1 * max(0, math.cos(cotes * a)) * (1 - t)), cy + math.sin(a) * rr * (1 + .1 * max(0, math.cos(cotes * a)) * (1 - t)), z))
                     for a in [k / seg * 2 * math.pi for k in range(seg)]])
    for i in range(n - 1):
        for k in range(seg): B.bm.faces.new((rows[i][k], rows[i][(k + 1) % seg], rows[i + 1][(k + 1) % seg], rows[i + 1][k]))
    for k in range(seg): B.bm.faces.new((rows[n - 1][k], rows[n - 1][(k + 1) % seg], rows[n][0]))
    vs = [v for r_ in rows for v in r_]; B.paint(vs, col, .04); return vs


def hublot(B, F, u, v, z, r, col=VITRE):
    """fenêtre ronde (octogone) sur une façade"""
    vs = [B.bm.verts.new(F.p(u + math.cos(a) * r, v, z + math.sin(a) * r)) for a in [k / 8 * 2 * math.pi for k in range(8)]]
    B.bm.faces.new(vs); B.paint(vs, col, .02); return vs


# ------------------------------------------------------------------ maisons [C?] et tours
def maison_coquille(T, x, y, z0, ang, s, rnd):
    """[C?] maison ronde : mur nacré ou pastel, toit-coquille à côtes, hublots, porte cintrée, perle au sommet"""
    Bp, Bg, Bl = T; c = PASTEL[rnd.randrange(6)] if rnd.random() < .6 else NACRE[rnd.randrange(4)]; hm = (.7 + .3 * rnd.random()) * s + .2
    revolve(Bp, x, y, [(s, z0 - .4), (s, z0 + hm), (s * 1.05, z0 + hm + .05)], c, 16, False)
    toit = CORAIL[rnd.randrange(4)] if rnd.random() < .6 else RECIF[rnd.randrange(6)]
    dome_cotes(Bp, x, y, z0 + hm, s * 1.12, s * (.75 + .3 * rnd.random()), 9 + rnd.randrange(4), lambda co, z_=z0 + hm: C.mix(toit, NACRE[0], max(0, min(1, (co.z - z_) / (1.6 * s)))), 18, 5)
    F = Frame(x, y, z0, ang)
    hublot(Bg, F, -s * .45, s * .93, hm * .55, .13 * s + .04); hublot(Bg, F, s * .45, s * .93, hm * .55, .13 * s + .04)
    vs = [Bp.bm.verts.new(F.p(u, s * .98 + .01, z)) for u, z in ((-.16, 0), (.16, 0), (.16, .38), (0, .5), (-.16, .38))]; Bp.bm.faces.new(vs); Bp.paint(vs, NOIR, .02)
    vs = C.bm_ico(Bl.bm, G(x, y, z0 + hm + s * 1.0 + .08), .12 + .05 * s, 1); Bl.paint(vs, H('#fff4e0'), .02)
    return hm + s * 1.1


def grappe_bulles(T, x, y, z0, ang, s, rnd):
    """[C?] maison-bulle : deux ou trois sphères nacrées sur des tiges de corail, bandeau de hublots"""
    Bp, Bg, Bl = T; n = 2 + rnd.randrange(2); top = 0
    for k in range(n):
        a = ang + k * 2 * math.pi / n; d = .45 * s if n > 1 else 0; r = (.55 + .25 * rnd.random()) * s; zz = z0 + .5 + r + k * .25
        bx, by = x + math.cos(a) * d, y + math.sin(a) * d
        vs = C.bm_cyl(Bp.bm, G(bx, by, z0 - .3), G(bx, by, zz - r * .6), .14, .1, 6); Bp.paint(vs, CORAIL[2], .05)
        vs = C.bm_uvsphere(Bp.bm, G(bx, by, zz), r, 12, 8); Bp.paint(vs, lambda co, zz=zz: C.mix(NACRE[2], NACRE[0], max(0, min(1, (co.z - zz + r) / (2 * r)))), .03)
        revolve(Bg, bx, by, [(r * 1.01, zz - .06), (r * 1.01, zz + .1)], VITRE, 16, False)
        top = max(top, zz + r - z0)
    return top


def conque(T, x, y, z0, s, rnd, h=None):
    """[C?] tour en conque : cône spiralé (spire en relief), ouverture rose au pied, pointe nacrée"""
    Bp, Bg, Bl = T; h = h or (3.0 + 1.4 * rnd.random()) * s / .7; r = 1.0 * s / .7 * .75
    prof = [(r, z0 - .4), (r, z0 + .3)] + [(r * (1 - t) ** 1.1 + .05, z0 + .3 + h * t) for t in [k / 8 for k in range(1, 9)]]
    revolve(Bp, x, y, prof, lambda co: C.mix(NACRE[1], H('#f0c8a8'), .5 + .5 * math.sin(co.z * 3.0)), 12, False)
    pts = []; a0 = rnd.random() * 6.28
    for k in range(36):
        t = k / 35; rr = (r * (1 - t) ** 1.1 + .05) * 1.06; a = a0 + t * 2 * math.pi * 4.5
        pts.append(G(x + math.cos(a) * rr, y + math.sin(a) * rr, z0 + .3 + h * t))
    vs = C.bm_tube(Bp.bm, pts, lambda t: .12 * s / .7 * (1 - .7 * t) + .02, 4); Bp.paint(vs, H('#e8b090'), .03)
    F = Frame(x, y, z0, a0)
    vs = [Bp.bm.verts.new(F.p(math.cos(b) * .35 * r, r * 1.01, .55 + math.sin(b) * .45)) for b in [k / 10 * 2 * math.pi for k in range(10)]]; Bp.bm.faces.new(vs); Bp.paint(vs, CORAIL[0], .03)
    for z in (.4, .55):
        hublot(Bg, F, 0, r * (1 - z) ** 1.1 + .08, h * z + .3, .12)
    return h + .3


def manoir(T, x, y, z0, ang, s, rnd):
    """[C : collines Gyoverly, manoirs ; aspect I] grande demeure : corps rond à colonnes, deux toits-coquilles, perron"""
    Bp, Bg, Bl = T; F = Frame(x, y, z0, ang)
    revolve(Bp, x, y, [(s * 1.1, z0 - .4), (s * 1.1, z0 + .3), (s, z0 + .35)], NACRE[2], 20)
    revolve(Bp, x, y, [(s * .9, z0 + .3), (s * .9, z0 + 1.6)], NACRE[0], 20, False)
    for k in range(10):
        a = k / 10 * 2 * math.pi; cx_, cy_ = x + math.cos(a) * s, y + math.sin(a) * s
        vs = C.bm_cyl(Bp.bm, G(cx_, cy_, z0 + .3), G(cx_, cy_, z0 + 1.6), .07, .07, 6); Bp.paint(vs, NACRE[1], .02)
    dome_cotes(Bp, x, y, z0 + 1.6, s * 1.15, s * .9, 12, lambda co: C.mix(CORAIL[0], NACRE[0], max(0, min(1, (co.z - z0 - 1.6) / (s * 1.2)))), 28, 7)
    ox, oy = x + F.t[0] * s * .9, y + F.t[1] * s * .9
    revolve(Bp, ox, oy, [(s * .45, z0 + 1.6), (s * .45, z0 + 2.4)], PASTEL[1], 14, False)
    dome_cotes(Bp, ox, oy, z0 + 2.4, s * .55, s * .5, 9, CORAIL[1], 18, 5)
    box(Bp, F, -.5, .5, s * .9, s * 1.6, -.4, .15, NACRE[2], .03)
    return 1.6 + s * .9


# ------------------------------------------------------------------ monuments
def place_gyoncorde(T, x, y, z0, r, rnd):
    """[C : place Gyoncorde au centre, avec ses toits] [I] place ronde dallée, anneau d'arcades à toits plats, fontaine en coquille géante"""
    Bp, Bg, Bl = T
    for k, (rr, col) in enumerate(((r, NACRE[1]), (r * .78, PASTEL[2]), (r * .55, NACRE[0]))):
        vs = [Bp.bm.verts.new(G(x + math.cos(a) * rr, y + math.sin(a) * rr, z0 + .02 + .015 * k)) for a in [j / 48 * 2 * math.pi for j in range(48)]]; Bp.bm.faces.new(vs); Bp.paint(vs, col, .02)
    ri, ro, hh = r + .3, r + 1.3, 1.1; seg = 40                                                       # anneau d'arcades d'un seul tenant (sans piliers séparés)
    for k in range(seg):
        a0, a1 = k / seg * 2 * math.pi, (k + 1) / seg * 2 * math.pi
        if k % 10 in (0, 9): continue                                                                  # quatre passages
        P_ = lambda a, rr, z: G(x + math.cos(a) * rr, y + math.sin(a) * rr, z)
        vs = [Bp.bm.verts.new(P_(a, rr, z)) for a, rr, z in ((a0, ri, z0 - .3), (a1, ri, z0 - .3), (a1, ri, z0 + hh), (a0, ri, z0 + hh), (a0, ro, z0 - .3), (a1, ro, z0 - .3), (a1, ro, z0 + hh), (a0, ro, z0 + hh))]
        for f in ((0, 1, 2, 3), (5, 4, 7, 6), (3, 2, 6, 7), (4, 5, 1, 0)): Bp.bm.faces.new([vs[i] for i in f])
        if k % 10 == 1: Bp.bm.faces.new([vs[i] for i in (4, 0, 3, 7)])
        if k % 10 == 8: Bp.bm.faces.new([vs[i] for i in (1, 5, 6, 2)])
        Bp.paint(vs, lambda co: CORAIL[1] if co.z > z0 + hh - .05 else PASTEL[(k // 10) % 6], .03)
        am = (a0 + a1) / 2; F = Frame(x + math.cos(am) * (ri - .01), y + math.sin(am) * (ri - .01), z0, am + math.pi)
        quad(Bp, F, [(-.1, 0, 0), (.1, 0, 0), (.1, 0, .55), (-.1, 0, .55)], NOIR, .02)
    revolve(Bp, x, y, [(1.3, z0), (1.3, z0 + .35), (1.15, z0 + .35), (1.15, z0 + .15)], NACRE[2], 24, False)          # fontaine
    revolve(Bg, x, y, [(1.15, z0 + .2), (0, z0 + .2)], BULLE_C[0], 24, False)
    F = Frame(x, y, z0 + .2, 0)
    for k in range(9):                                                                                 # coquille dressée
        a = math.pi * (k / 8); vs = [Bp.bm.verts.new(F.p(0, 0, 0)), Bp.bm.verts.new(F.p(math.cos(a - .17) * 1.1, -.1, math.sin(a - .17) * 1.1 + .1)), Bp.bm.verts.new(F.p(math.cos(a + .17) * 1.1, -.1, math.sin(a + .17) * 1.1 + .1))]
        Bp.bm.faces.new(vs); Bp.paint(vs, CORAIL[1] if k % 2 else NACRE[0], .02)
    return 1.6


def corail(B, x, y, z, s, rnd):
    """[C?] corail branchu coloré"""
    c = RECIF[rnd.randrange(6)]
    def br(p, d, l, r, n):
        q = p + d * l; vs = C.bm_tube(B.bm, [p, q], lambda t: r * (1 - .4 * t), 4); B.paint(vs, c, .05)
        if n == 0:
            vs = C.bm_cyl(B.bm, q - d * .05, q + d * r * 1.2, r * .9, r * .4, 5); B.paint(vs, C.mix(c, (1, 1, 1, 1), .3), .03); return
        for k in range(2 + (n > 1)):
            a = rnd.uniform(0, 6.28); nd = (d * .6 + Vector((math.cos(a) * .6, math.sin(a) * .6, .5))).normalized()
            br(q, nd, l * .7, r * .7, n - 1)
    br(G(x, y, z - .2), Vector((0, 0, 1)), 1.1 * s, .17 * s, 1)


def algue(B, x, y, z, s, rnd):
    """[C?] algue géante ondulante"""
    h = (2.2 + 1.2 * rnd.random()) * s; ph = rnd.random() * 6
    pts = [G(x + .25 * s * math.sin(ph + t * 5), y + .2 * s * math.cos(ph + t * 4), z - .2 + h * t) for t in [k / 7 for k in range(8)]]
    vs = C.bm_tube(B.bm, pts, lambda t: (.12 - .07 * t) * s + .02, 4); B.paint(vs, ALGUE[rnd.randrange(3)], .06)


def eponge(B, x, y, z, s, rnd):
    c = RECIF[rnd.choice((0, 2, 3))]
    for k in range(3):
        a = k * 2.1 + rnd.random(); d = .25 * s if k else 0; bx, by = x + math.cos(a) * d, y + math.sin(a) * d; h = (.5 + .4 * rnd.random()) * s
        revolve(B, bx, by, [(.16 * s, z - .2), (.2 * s, z + h), (.13 * s, z + h), (.12 * s, z + h - .15)], lambda co, h=h: c if co.z < z + h - .01 else C.mix(c, (0, 0, 0, 1), .35), 6, False)


def roue_a_aubes(B, x, y, z, ang, r, rnd):
    """[C : ville des Moulins à eau ; aspect I] roue à aubes à demi dans le canal (axe le long du canal), jantes, palettes, petite maison"""
    F = Frame(x, y, z, ang); n = 12
    for su in (-.28, .28):                                                                             # deux jantes
        pts = [F.p(su, math.cos(k / 24 * 2 * math.pi) * r, r * .55 + math.sin(k / 24 * 2 * math.pi) * r) for k in range(25)]
        vs = C.bm_tube(B.bm, pts, lambda t: .05, 5); B.paint(vs, H('#6b4a30'), .02)
    for k in range(n):                                                                                 # palettes
        a = k / n * 2 * math.pi; v, w_ = math.cos(a) * r * .8, r * .55 + math.sin(a) * r * .8
        box(B, F, -.3, .3, v - .05, v + .05, w_ - .3, w_ + .3, BOIS, .03, True, True)
    vs = C.bm_cyl(B.bm, F.p(-.5, 0, r * .55), F.p(.5, 0, r * .55), .08, .08, 6); B.paint(vs, H('#4a3424'), .02)
    box(B, F, .6, 2.0, -.7, .7, -.3, 1.0, PASTEL[rnd.randrange(6)], .04)
    hx, hy = x + F.t[0] * 1.3, y + F.t[1] * 1.3
    dome_cotes(B, hx, hy, z + 1.0, .8, .5, 8, CORAIL[rnd.randrange(4)], 16, 4)


def usine_bonbons(T, x, y, z0, ang, rnd):
    """[C : usine de bonbons ; aspect I] hall à toit en berceau rose et blanc, cheminées rayées comme des sucres d'orge"""
    Bp, Bg, Bl = T; F = Frame(x, y, z0, ang)
    box(Bp, F, -2.2, 2.2, -1.4, 1.4, -.4, 1.4, NACRE[0], .03)
    n = 10; rings = []
    for i in range(n + 1):
        t = math.pi * i / n; rings.append([Bp.bm.verts.new(F.p(u, -1.4 * math.cos(t), 1.4 + 1.0 * math.sin(t))) for u in (-2.2, 2.2)])
    for i in range(n): Bp.bm.faces.new((rings[i][0], rings[i][1], rings[i + 1][1], rings[i + 1][0]))
    for su in (0, 1): Bp.bm.faces.new([rings[i][su] for i in range(n + 1)])
    Bp.paint([v for r_ in rings for v in r_], lambda co: CORAIL[0] if int(co.x * 2 + co.y * 2) % 2 else NACRE[0], .02)
    for u in (-1.5, -.5, .5, 1.5): hublot(Bg, F, u, 1.41, .8, .3)
    for k, u in enumerate((-1.4, 0.0, 1.4)):
        cx, cy = x + F.t[0] * u - F.f[0] * 1.9, y + F.t[1] * u - F.f[1] * 1.9; hc = 3.4 + .5 * k
        revolve(Bp, cx, cy, [(.32, z0 - .3), (.28, z0 + hc), (.36, z0 + hc + .1), (.26, z0 + hc + .1)],
                lambda co, cx=cx, cy=cy: CORAIL[2] if math.sin(math.atan2(co.y + cy, co.x - cx) * 2 + co.z * 4) > 0 else NACRE[0], 12, False)
    for k in range(3):
        a = ang + 1.2 * k - 1.2; px, py = x + math.cos(a) * 3.0, y + math.sin(a) * 3.0
        vs = C.bm_cyl(Bp.bm, G(px, py, z0 - .2), G(px, py, z0 + 1.6), .06, .06, 6); Bp.paint(vs, NACRE[0], .02)
        vs = C.bm_uvsphere(Bp.bm, G(px, py, z0 + 1.9), .4, 12, 8, (1, .35, 1)); Bp.paint(vs, RECIF[k * 2], .03)
    return 4.5


def centre_commercial(T, x, y, z0, ang, rnd):
    """[C : centre commercial à l'ouest ; aspect I] grand dôme-coquille sur galerie vitrée"""
    Bp, Bg, Bl = T
    revolve(Bp, x, y, [(2.6, z0 - .4), (2.6, z0 + .3), (2.4, z0 + .35)], NACRE[2], 28)
    revolve(Bg, x, y, [(2.3, z0 + .3), (2.3, z0 + 1.2)], VITRE, 28, False)
    revolve(Bp, x, y, [(2.35, z0 + 1.2), (2.45, z0 + 1.35)], NACRE[0], 28)
    dome_cotes(Bp, x, y, z0 + 1.35, 2.5, 2.0, 14, lambda co: C.mix(H('#c8a8e8'), NACRE[0], max(0, min(1, (co.z - z0 - 1.35) / 2.4))), 32, 8)
    return 3.4


def salle_reunion(T, x, y, z0, ang, rnd):
    """[C : salle de réunion au sud-ouest ; aspect I] salle ronde à colonnes, toit conique en coquille"""
    Bp, Bg, Bl = T
    revolve(Bp, x, y, [(2.1, z0 - .4), (2.1, z0 + .25), (1.95, z0 + .3)], NACRE[2], 24)
    revolve(Bp, x, y, [(1.5, z0 + .25), (1.5, z0 + 1.4)], PASTEL[4], 20, False)
    for k in range(12):
        a = k / 12 * 2 * math.pi; cx_, cy_ = x + math.cos(a) * 1.85, y + math.sin(a) * 1.85
        vs = C.bm_cyl(Bp.bm, G(cx_, cy_, z0 + .25), G(cx_, cy_, z0 + 1.45), .09, .09, 6); Bp.paint(vs, NACRE[0], .02)
    dome_cotes(Bp, x, y, z0 + 1.45, 2.2, 1.6, 16, lambda co: C.mix(H('#6ac8b8'), NACRE[0], max(0, min(1, (co.z - z0 - 1.45) / 2.0))), 32, 7)
    return 3.1


def dojo(T, x, y, z0, ang, rnd):
    """[C : dojo de karaté ; aspect I] niveau 4 : cour murée sur socle de corail, grand hall de bois à deux toits superposés de tuiles sombres
    (faîtage nacré), pavillon d'entrée, poteaux d'entraînement, portail rouge corail"""
    Bp, Bg, Bl = T; F = Frame(x, y, z0, ang)
    revolve(Bp, x, y, [(3.4, z0 - .5), (3.4, z0 + .05), (3.2, z0 + .1)], CORAIL[3], 28)                         # socle
    for u0, u1, v0, v1 in ((-2.7, 2.7, -2.8, -2.55), (-2.7, -.7, 2.55, 2.8), (.7, 2.7, 2.55, 2.8), (-2.8, -2.55, -2.8, 2.8), (2.55, 2.8, -2.8, 2.8)):
        box(Bp, F, u0, u1, v0, v1, 0, .65, NACRE[1], .03); box(Bp, F, u0 - .05, u1 + .05, v0 - .05, v1 + .05, .65, .75, H('#4a5868'), .02, True, True)
    vs = [Bp.bm.verts.new(F.p(u, v, .12)) for u, v in ((-2.55, -2.55), (2.55, -2.55), (2.55, 2.55), (-2.55, 2.55))]; Bp.bm.faces.new(vs); Bp.paint(vs, H('#ecdcb4'), .03)
    box(Bp, F, -1.7, 1.7, -2.4, -.4, 0, 1.2, H('#a07a50'), .04)                                                    # hall
    for u in (-1.2, -.4, .4, 1.2): quad(Bp, F, [(u - .25, -.39, .2), (u + .25, -.39, .2), (u + .25, -.39, .95), (u - .25, -.39, .95)], H('#f0e4c8'), .02)
    hip(Bp, F, -2.15, 2.15, -2.85, .05, 1.2, .55, H('#4a5868')); box(Bp, F, -1.2, 1.2, -1.95, -.85, 1.6, 2.1, H('#a07a50'), .03)
    hip(Bp, F, -1.55, 1.55, -2.25, -.55, 2.1, .55, H('#3e4a58')); box(Bp, F, -1.0, 1.0, -1.43, -1.37, 2.62, 2.72, NACRE[0], .02, True, True)
    for k in range(3):                                                                                             # poteaux d'entraînement
        u = -1.4 + k * 1.4; box(Bp, F, u - .07, u + .07, 1.2, 1.34, 0, .9, H('#8a6440'), .02)
    for u in (-.75, .75): box(Bp, F, u - .09, u + .09, 2.62, 2.78, 0, 1.7, CORAIL[2], .02)                           # portail
    box(Bp, F, -1.1, 1.1, 2.58, 2.82, 1.55, 1.7, CORAIL[2], .02); box(Bp, F, -.9, .9, 2.62, 2.78, 1.3, 1.38, CORAIL[2], .02)
    return 2.8


def palais(T, x, y, z0, rnd):
    """[C : palais Ryugu ; tour de la Coquille dure au nord-est du château ; tour-prison] [C? palais du dragon aux toits courbes roses ;
    aspect I] sol de corail, enceinte, donjon à trois étages de toits roses, tours d'angle, tour-coquille au nord-est, tour-prison sombre"""
    Bp, Bg, Bl = T; R_ = 4.6
    vs = [Bp.bm.verts.new(G(x + math.cos(a) * R_, y + math.sin(a) * R_, z0)) for a in [k / 40 * 2 * math.pi for k in range(40)]]; Bp.bm.faces.new(vs); Bp.paint(vs, NACRE[1], .03)
    for k in range(18):                                                                                # dessous en massif de corail
        a = k / 18 * 2 * math.pi + rnd.random() * .2; d = R_ * (.55 + .4 * rnd.random())
        vs = C.bm_ico(Bp.bm, G(x + math.cos(a) * d, y + math.sin(a) * d, z0 - .6 - .5 * rnd.random()), .9 + .5 * rnd.random(), 1, (1, 1, .8), .25, rnd.random() * 9)
        Bp.paint(vs, CORAIL[rnd.randrange(4)], .05)
    vs = C.bm_ico(Bp.bm, G(x, y, z0 - 1.5), 2.6, 2, (1.4, 1.4, 1.0), .2, 3); Bp.paint(vs, CORAIL[2], .05)
    revolve(Bp, x, y, [(R_ - .1, z0), (R_ - .1, z0 + .6), (R_ - .35, z0 + .6), (R_ - .35, z0)], NACRE[0], 40, False)   # enceinte
    F = Frame(x, y, z0, math.pi / 2); ROSE = H('#f58aa0')
    w, d_, z = 3.0, 2.2, 0.0
    for et in range(3):                                                                                # donjon à trois étages
        hz = 1.2 - .2 * et
        box(Bp, F, -w / 2, w / 2, -d_ / 2, d_ / 2, z - (.3 if et == 0 else 0), z + hz, NACRE[0], .03)
        for u in [(-w / 2 + .3 + k * (w - .6) / 3) for k in range(4)]: quad(Bg, F, [(u - .12, d_ / 2 + .01, z + .3), (u + .12, d_ / 2 + .01, z + .3), (u + .12, d_ / 2 + .01, z + hz - .25), (u - .12, d_ / 2 + .01, z + hz - .25)], VITRE, .02)
        hip(Bp, F, -w / 2 - .45, w / 2 + .45, -d_ / 2 - .45, d_ / 2 + .45, z + hz, .55, ROSE)
        z += hz + .45; w *= .72; d_ *= .72
    vs = C.bm_cyl(Bp.bm, F.p(0, 0, z), F.p(0, 0, z + 1.0), .08, .02, 6); Bp.paint(vs, H('#f4d27a'), .02)
    for su, sv in ((-1, 1), (1, 1), (-1, -1)):                                                         # tours d'angle
        tx, ty = x + F.t[0] * su * 3.1 + F.f[0] * sv * 2.4, y + F.t[1] * su * 3.1 + F.f[1] * sv * 2.4
        revolve(Bp, tx, ty, [(.6, z0 - .2), (.6, z0 + 2.0)], NACRE[0], 14, False)
        revolve(Bp, tx, ty, [(.85, z0 + 2.0), (0, z0 + 2.9)], ROSE, 14, False)
    hx, hy = x + F.t[0] * 3.0 - F.f[0] * 2.6, y + F.t[1] * 3.0 - F.f[1] * 2.6                       # tour de la Coquille dure (nord-est)
    conque(T, hx, hy, z0, 1.0, rnd, h=5.2)
    px_, py_ = x - F.t[0] * 3.2 - F.f[0] * 2.6, y - F.t[1] * 3.2 - F.f[1] * 2.6                     # tour-prison
    revolve(Bp, px_, py_, [(.5, z0 - .2), (.45, z0 + 2.6)], H('#7a7084'), 10, False); revolve(Bp, px_, py_, [(.62, z0 + 2.6), (0, z0 + 3.3)], H('#5a5064'), 10, False)
    box(Bp, F, -.8, .8, R_ - .6, R_ - .2, 0, 1.4, NACRE[0], .03); hip(Bp, F, -1.0, 1.0, R_ - .75, R_ - .05, 1.4, .4, ROSE)   # porte (couloir)
    return z - z0 + 1.0


def bulles_flottantes(B, rnd, n, rmax, zmin, zmax, ok):
    """petites bulles d'air qui montent (décor, visibles en 3D)"""
    k = 0
    while k < n:
        a = rnd.uniform(0, 2 * math.pi); d = rmax * math.sqrt(rnd.random()); x, y = math.cos(a) * d, math.sin(a) * d
        if not ok(x, y): continue
        vs = C.bm_uvsphere(B.bm, G(x, y, rnd.uniform(zmin, zmax)), .12 + .3 * rnd.random() ** 2, 8, 5); B.paint(vs, lambda co: C.mix(BULLE_C[2], BULLE_C[1], .6), .02); k += 1
