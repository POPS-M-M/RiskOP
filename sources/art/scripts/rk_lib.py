"""RISK OP — bibliothèque de pièces réutilisables (arbres, rochers, huttes, ponts, pâtisseries…).

Règle : la bibliothèque fournit des PIÈCES paramétrées, jamais des compositions d'île.
Toutes les pièces sont construites en coordonnées monde Blender dans un « lot » (Batch) qui regroupe la géométrie
d'une catégorie (moins d'objets = export et rendu plus rapides) et peint l'albédo dans l'attribut « Col ».
"""
import bmesh, math, random
from mathutils import Vector, Matrix, noise
import rk_common as C

class Batch:
    def __init__(self, name, collection, mat, smooth=True):
        self.name = name; self.coll = collection; self.mat = mat; self.smooth = smooth
        self.bm = bmesh.new(); self.col = self.bm.verts.layers.float_color.new('Col')
    def paint(self, verts, c, var=.07):
        for v in verts:
            col = c(v.co) if callable(c) else c
            j = 1 + var * noise.noise(v.co * .5) + var * .5 * noise.noise(v.co * 2.3)
            v[self.col] = (min(1, col[0] * j), min(1, col[1] * j), min(1, col[2] * j), 1)
        return verts
    def done(self):
        if not self.bm.verts: self.bm.free(); return None
        bmesh.ops.recalc_face_normals(self.bm, faces=self.bm.faces)
        o = C.mk_obj(self.name, self.bm, self.coll, self.mat, self.smooth)
        o.data.color_attributes.active_color = o.data.color_attributes['Col']
        return o

def grad(c_low, c_high, z0, z1):
    return lambda co: C.mix(c_low, c_high, max(0, min(1, (co.z - z0) / max(1e-3, z1 - z0))))

# ---------------------------------------------------------------- végétation
def jungle_tree(B, p, s, greens, bark=C.hexc('#6b4a30'), rnd=random):
    """arbre de jungle : tronc légèrement courbé, 3 à 5 masses de feuillage bosselées, dessous plus sombre"""
    x, y, z = p; h = (5 + rnd.random() * 3) * s; lean = Vector(((rnd.random() - .5) * 1.2 * s, (rnd.random() - .5) * 1.2 * s, 0))
    pts = [Vector((x, y, z - .3)), Vector((x, y, z + h * .5)) + lean * .4, Vector((x, y, z + h)) + lean]
    B.paint(C.bm_tube(B.bm, C.catmull(pts, 3), lambda t: (.55 - .3 * t) * s, 7), bark)
    top = pts[-1]; g = greens[rnd.randrange(len(greens))]
    for k in range(3 + rnd.randrange(3)):
        a = rnd.random() * 6.283; d = (.8 + rnd.random() * 1.4) * s
        c = top + Vector((math.cos(a) * d, math.sin(a) * d, (rnd.random() - .2) * 1.2 * s))
        r = (1.6 + rnd.random() * 1.1) * s
        vs = C.bm_ico(B.bm, c, r, 2, (1, 1, .78), .22, rnd.random() * 9)
        B.paint(vs, grad(C.mix(g, (0, .08, .06, 1), .38), C.mix(g, (1, 1, .8, 1), .12), c.z - r * .7, c.z + r * .8))
    return top.z + 2 * s

def palm(B, p, s, green=C.hexc('#3f9a3a'), rnd=random):
    x, y, z = p; h = (4.5 + rnd.random() * 2.5) * s; bend = Vector(((rnd.random() - .5) * 2 * s, (rnd.random() - .5) * 2 * s, 0))
    pts = C.catmull([Vector((x, y, z - .2)), Vector((x, y, z + h * .5)) + bend * .3, Vector((x, y, z + h)) + bend], 3)
    B.paint(C.bm_tube(B.bm, pts, lambda t: (.32 - .12 * t) * s, 6), C.hexc('#8a6a44'))
    top = pts[-1]
    for k in range(7):
        a = k / 7 * 6.283 + rnd.random() * .3; d = Vector((math.cos(a), math.sin(a), 0))
        side = Vector((-d.y, d.x, 0)) * .45 * s
        tip = top + d * 3.2 * s + Vector((0, 0, -1.3 * s)); mid = top + d * 1.7 * s + Vector((0, 0, .35 * s))
        vs = [B.bm.verts.new(top), B.bm.verts.new(mid + side), B.bm.verts.new(tip), B.bm.verts.new(mid - side)]
        B.bm.faces.new(vs); B.paint(vs, C.mix(green, (1, 1, .7, 1), .1 * (k % 2)))
    return top.z

def fern(B, p, s, green=C.hexc('#4fa84a')):
    x, y, z = p; c = Vector((x, y, z + .1))
    for k in range(6):
        a = k / 6 * 6.283; d = Vector((math.cos(a), math.sin(a), 0))
        vs = [B.bm.verts.new(c), B.bm.verts.new(c + d * .8 * s + Vector((-d.y, d.x, 0)) * .35 * s + Vector((0, 0, .7 * s))), B.bm.verts.new(c + d * 1.8 * s + Vector((0, 0, .3 * s))), B.bm.verts.new(c + d * .8 * s - Vector((-d.y, d.x, 0)) * .35 * s + Vector((0, 0, .7 * s)))]
        B.bm.faces.new(vs); B.paint(vs, green)

def rock(B, p, r, col=C.hexc('#7d7a72'), moss=None, rnd=random):
    vs = C.bm_ico(B.bm, Vector((p[0], p[1], p[2] + r * .25)), r, 2, (1, .85, .7), .35, rnd.random() * 20)
    B.paint(vs, (lambda co: C.mix(col, moss, max(0, min(1, (co.z - p[2] - r * .3) / (r * .4))))) if moss else col)

def flower_patch(B, p, s, cols, rnd=random):
    for k in range(5):
        a = rnd.random() * 6.283; d = rnd.random() * 1.2 * s
        vs = C.bm_ico(B.bm, Vector((p[0] + math.cos(a) * d, p[1] + math.sin(a) * d, p[2] + .25 * s)), .28 * s, 1)
        B.paint(vs, cols[k % len(cols)])

# ---------------------------------------------------------------- constructions
def round_hut(B, p, s, wall, roof, trim=C.hexc('#5a3c24'), rnd=random):
    """hutte ronde à toit de feuilles en cloche (peuple des Minks [interprétation])"""
    x, y, z = p; c = Vector((x, y, z))
    B.paint(C.bm_cyl(B.bm, c + Vector((0, 0, -.2)), c + Vector((0, 0, 1.7 * s)), 1.3 * s, 1.2 * s, 12), wall)
    r = C.bm_cyl(B.bm, c + Vector((0, 0, 1.5 * s)), c + Vector((0, 0, 3.6 * s)), 1.9 * s, .15 * s, 14)
    B.paint(r, grad(C.mix(roof, (0, 0, 0, 1), .25), roof, z + 1.5 * s, z + 3.6 * s))
    B.paint(C.bm_box(B.bm, c + Vector((0, -1.22 * s, .6 * s)), (.7 * s, .12 * s, 1.1 * s)), trim)       # porte (face sud = -Y)
    B.paint(C.bm_ico(B.bm, c + Vector((0, 0, 3.75 * s)), .25 * s, 1), C.hexc('#e8b830'))

def platform(B, p, r, h, wood=C.hexc('#8a5f38')):
    c = Vector(p)
    B.paint(C.bm_cyl(B.bm, c + Vector((0, 0, -.25)), c, r, r, 14), wood)
    for k in range(5):
        a = k / 5 * 6.283; q = c + Vector((math.cos(a) * r * .8, math.sin(a) * r * .8, 0))
        B.paint(C.bm_cyl(B.bm, q - Vector((0, 0, h)), q, .12 * r / 2, .12 * r / 2, 5, False), C.hexc('#5a3c24'))

def rope_bridge(B, a, b, w, sag, col=C.hexc('#a0784a')):
    a = Vector(a); b = Vector(b); d = b - a; side = Vector((-d.y, d.x, 0)).normalized() * w / 2; n = 10
    prev = None
    for k in range(n + 1):
        t = k / n; p = a + d * t - Vector((0, 0, sag * 4 * t * (1 - t)))
        v1 = B.bm.verts.new(p + side); v2 = B.bm.verts.new(p - side); B.paint([v1, v2], col if k % 2 else C.mix(col, (0, 0, 0, 1), .2))
        if prev: B.bm.faces.new((prev[0], prev[1], v2, v1))
        prev = (v1, v2)

def stairs_spiral(B, c, r0, z0, z1, turns, w, col=C.hexc('#9a7048')):
    """escalier en colimaçon autour d'un pilier (patte de Zunesha, tronc…)"""
    n = int(turns * 26); c = Vector(c)
    for k in range(n):
        t = k / n; a = t * turns * 6.283; z = z0 + (z1 - z0) * t
        q = c + Vector((math.cos(a) * (r0 + w / 2), math.sin(a) * (r0 + w / 2), z))
        vs = C.bm_box(B.bm, q, (w, w * .55, .25)); B.paint(vs, col if k % 2 else C.mix(col, (0, 0, 0, 1), .15))

def lantern(B, p, s, col=C.hexc('#ffcf6a')):
    B.paint(C.bm_ico(B.bm, Vector(p), .35 * s, 1), col)

# ---------------------------------------------------------------- confiseries (Whole Cake)
CANDY = {'creme': C.hexc('#fff1dc'), 'rose': C.hexc('#f7a8c4'), 'fraise': C.hexc('#e8506e'), 'menthe': C.hexc('#9fe0c8'), 'choco': C.hexc('#6b3b26'),
         'choco2': C.hexc('#8a5236'), 'caramel': C.hexc('#d99a4e'), 'citron': C.hexc('#f8e27a'), 'lavande': C.hexc('#c9a8e8'), 'biscuit': C.hexc('#e2b06a'),
         'genoise': C.hexc('#f2cf8a'), 'cerise': C.hexc('#c8202e'), 'blanc': C.hexc('#fffaf4'), 'bleu': C.hexc('#9cc8f0')}

def cake_tier(B, c, r, h, body, icing, rnd=random, drips=True, deco=None):
    """étage de gâteau : génoise, nappage débordant qui coule, perles de décor"""
    c = Vector(c)
    B.paint(C.bm_cyl(B.bm, c, c + Vector((0, 0, h)), r, r * .99, 40), body)
    top = C.bm_cyl(B.bm, c + Vector((0, 0, h - .05)), c + Vector((0, 0, h + .55)), r * 1.05, r * .98, 40)
    B.paint(top, icing)
    if drips:
        n = int(10 + r * 1.3)
        for k in range(n):
            a = k / n * 6.283 + rnd.random() * .1; L = (.5 + rnd.random() * 1.6) * min(h * .45, 2.4)
            q = c + Vector((math.cos(a) * r * 1.035, math.sin(a) * r * 1.035, h + .1))
            vs = C.bm_uvsphere(B.bm, q - Vector((0, 0, L / 2)), 1, 8, 6, (.42, .42, L / 2 + .3)); B.paint(vs, icing)
    if deco:
        n = int(8 + r * 1.1)
        for k in range(n):
            a = k / n * 6.283; q = c + Vector((math.cos(a) * r * .9, math.sin(a) * r * .9, h + .75))
            B.paint(C.bm_ico(B.bm, q, .45, 1), deco[k % len(deco)])

def cupcake(B, p, s, wrap, cream, top=None):
    c = Vector(p)
    B.paint(C.bm_cyl(B.bm, c, c + Vector((0, 0, 1.6 * s)), 1.1 * s, 1.5 * s, 16), wrap)
    for k in range(3):
        B.paint(C.bm_uvsphere(B.bm, c + Vector((0, 0, (1.9 + k * .7) * s)), (1.55 - k * .4) * s, 16, 8, (1, 1, .55)), cream)
    B.paint(C.bm_ico(B.bm, c + Vector((0, 0, 3.7 * s)), .38 * s, 1), top or CANDY['cerise'])

def macaron(B, p, s, col, fill=CANDY['creme']):
    c = Vector(p)
    B.paint(C.bm_uvsphere(B.bm, c + Vector((0, 0, .45 * s)), 1.2 * s, 16, 8, (1, 1, .38)), col)
    B.paint(C.bm_cyl(B.bm, c + Vector((0, 0, .8 * s)), c + Vector((0, 0, 1.05 * s)), 1.05 * s, 1.05 * s, 16), fill)
    B.paint(C.bm_uvsphere(B.bm, c + Vector((0, 0, 1.4 * s)), 1.2 * s, 16, 8, (1, 1, .38)), col)

def donut_arch(B, p, s, dough, glaze, sprinkles):
    """beignet dressé en arche"""
    c = Vector(p); R = 2.4 * s; r = .85 * s; n = 28; m = 10; rings = []
    for i in range(n):
        a = i / n * 6.283; ctr = c + Vector((math.cos(a) * R, 0, math.sin(a) * R + R * .75))
        ring = []
        for j in range(m):
            b = j / m * 6.283; d = Vector((math.cos(a) * math.cos(b), math.sin(b), math.sin(a) * math.cos(b)))
            v = B.bm.verts.new(ctr + d * r); ring.append(v)
            B.paint([v], glaze if d.y < .1 else dough)
        rings.append(ring)
    for i in range(n):
        for j in range(m):
            B.bm.faces.new((rings[i][j], rings[(i + 1) % n][j], rings[(i + 1) % n][(j + 1) % m], rings[i][(j + 1) % m]))

def lollipop_tree(B, p, s, cols, rnd=random):
    c = Vector(p); h = (4 + rnd.random() * 2.5) * s
    B.paint(C.bm_cyl(B.bm, c, c + Vector((0, 0, h)), .22 * s, .2 * s, 8), CANDY['blanc'])
    # disque en spirale : anneaux colorés alternés
    ctr = c + Vector((0, 0, h + 1.4 * s)); R = 1.8 * s; rings = 6
    for k in range(rings):
        r0 = R * k / rings; r1 = R * (k + 1) / rings
        vs = C.bm_cyl(B.bm, ctr + Vector((0, -.25 * s, 0)), ctr + Vector((0, .25 * s, 0)), r1, r1, 24, k == rings - 1)
        B.paint(vs, cols[k % len(cols)])

def candy_cane(B, p, s, rnd=random):
    c = Vector(p); h = 5 * s; a = rnd.random() * 6.283; d = Vector((math.cos(a), math.sin(a), 0))
    pts = [c, c + Vector((0, 0, h * .5)), c + Vector((0, 0, h))] + [c + Vector((0, 0, h)) + d * (1 - math.cos(t)) * 1.1 * s + Vector((0, 0, math.sin(t) * 1.1 * s)) for t in [.6, 1.3, 2.0, 2.6, 3.1]]
    vs = C.bm_tube(B.bm, C.catmull(pts, 3), lambda t: .38 * s, 10)
    B.paint(vs, lambda co: CANDY['fraise'] if math.sin((co.z * 1.6 + co.x * .8 + co.y * .8) * 2.2 / s) > 0 else CANDY['blanc'], .02)

def cotton_tree(B, p, s, col, rnd=random):
    c = Vector(p); h = (3 + rnd.random() * 2) * s
    B.paint(C.bm_cyl(B.bm, c, c + Vector((0, 0, h)), .25 * s, .2 * s, 8), CANDY['biscuit'])
    for k in range(4):
        a = k * 1.7; q = c + Vector((math.cos(a) * .9 * s, math.sin(a) * .9 * s, h + .6 * s + (k % 2) * .8 * s))
        B.paint(C.bm_ico(B.bm, q, (1.4 + .3 * (k % 2)) * s, 2, (1, 1, .9), .15, k), col)

def gumdrop(B, p, s, col):
    c = Vector(p); B.paint(C.bm_uvsphere(B.bm, c + Vector((0, 0, .3 * s)), .9 * s, 14, 7, (1, 1, 1.15)), col)

def cone_tower(B, p, s, scoops, rnd=random):
    """tour en cornet de glace : cornet gaufré à l'endroit, boules empilées"""
    c = Vector(p); h = 5 * s
    vs = C.bm_cyl(B.bm, c, c + Vector((0, 0, h)), .35 * s, 1.6 * s, 18)
    B.paint(vs, lambda co: CANDY['biscuit'] if (math.sin(co.z * 3 / s + math.atan2(co.y - c.y, co.x - c.x) * 4) > 0) else C.mix(CANDY['biscuit'], CANDY['choco2'], .35), .02)
    z = h
    for k, col in enumerate(scoops):
        r = (1.7 - k * .25) * s; B.paint(C.bm_ico(B.bm, c + Vector((0, 0, z + r * .55)), r, 2, (1, 1, .9), .1, k), col); z += r * 1.1
    return z

def ginger_house(B, p, s, wall, roof, trim, yaw=0, rnd=random):
    """maison en pain d'épices : murs, toit à deux pans glacé, bordures de glaçage, bonbons"""
    c = Vector(p); w = 2.6 * s; d = 2.2 * s; h = 2.2 * s
    R = Matrix.Rotation(yaw, 4, 'Z')
    vs = C.bm_box(B.bm, Vector((0, 0, h / 2)), (w, d, h))
    bmesh.ops.transform(B.bm, matrix=Matrix.Translation(c) @ R, verts=vs); B.paint(vs, wall)
    # toit
    rv = [B.bm.verts.new(c + R.to_3x3() @ Vector(q)) for q in [(-w * .62, -d * .62, h), (w * .62, -d * .62, h), (w * .62, 0, h + 1.5 * s), (-w * .62, 0, h + 1.5 * s), (-w * .62, d * .62, h), (w * .62, d * .62, h)]]
    B.bm.faces.new((rv[0], rv[1], rv[2], rv[3])); B.bm.faces.new((rv[3], rv[2], rv[5], rv[4]))
    B.bm.faces.new((rv[0], rv[3], rv[4])); B.bm.faces.new((rv[1], rv[5], rv[2]))
    B.paint(rv, roof)
    for k in range(6):
        q = c + R.to_3x3() @ Vector((-w * .62 + k * w * .25, -d * .64, h + .05))
        B.paint(C.bm_uvsphere(B.bm, q, .28 * s, 8, 5, (1, 1, .7)), trim)
    B.paint(C.bm_box(B.bm, c + R.to_3x3() @ Vector((0, -d / 2 - .02, .7 * s)), (.7 * s, .08 * s, 1.3 * s)), CANDY['choco'])
    for sg in (-1, 1):
        B.paint(C.bm_box(B.bm, c + R.to_3x3() @ Vector((sg * .8 * s, -d / 2 - .02, 1.4 * s)), (.55 * s, .08 * s, .55 * s)), CANDY['citron'])
