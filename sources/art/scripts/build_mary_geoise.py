"""Mary Geoise — scène Blender détaillée (île 10), kit rk_victorien.py (+ pièces génériques de rk_port), plan mg_plan.py.
Canon [C] / [I] : voir mg_plan.py et art/data/fiches/mary_geoise.json. Exclus : personnages, symboles et insignes, intérieurs,
esclaves, navires identifiables, copie de tout décor officiel.
Usage : python3 build_mary_geoise.py → art/blender/islands/mary_geoise.blend   (puis export_island.py mary_geoise)
"""
import sys, os, math, random, time
sys.path.insert(0, os.path.dirname(__file__))
import bpy, bmesh
import rk_common as C, rk_lib as L, rk_port as K, rk_victorien as V
import mg_plan as P

T0 = time.time(); rnd = random.Random(1010)
sc = C.new_scene(); M = C.materials()
SOL, DECOR, V2, V3, V4 = C.coll('RK_SOL'), C.coll('RK_DECOR'), C.coll('RK_VILLE_2'), C.coll('RK_VILLE_3'), C.coll('RK_VILLE_4')
LV = {1: DECOR, 2: V2, 3: V3, 4: V4}; H = C.hexc; G = C.g2b
B = {k: L.Batch('MG_ville_%d' % k, LV[k], M['peint']) for k in LV}
BM = L.Batch('MG_monuments', DECOR, M['peint']); BE = L.Batch('MG_eau', DECOR, M['eau'], False)
BN = L.Batch('MG_nuages', DECOR, M['peint'])
BV = {k: L.Batch('MG_vegetation_%d' % k, LV[k], M['peint']) for k in LV}
zg = P.height; TOP = P.TOP
LOTS = P.lots()


def in_lot(x, y, m=0.0):
    return any(abs(x - cx) < w / 2 + m and abs(y - cy) < w / 2 + m for cx, cy, w in LOTS)


# ------------------------------------------------------------------ 1. sol : Red Line à strates, plateau, parcs, rues, ports
bm = bmesh.new(); colL = bm.verts.layers.float_color.new('Col'); step = .5; ext = 34.0; n = int(2 * ext / step) + 1; grid = {}
for j in range(n):
    for i in range(n):
        x = -ext + i * step; y = -ext + j * step; r, th, q = P.pol(x, y)
        if q > 1.08: continue
        h = zg(x, y); v = bm.verts.new(G(x, y, h)); grid[(i, j)] = v; z_ = P.zone(x, y)
        c = C.mix(V.GAZON, H('#8aba64'), .5 + .5 * math.sin(x * .8 + y * .5))
        e_ = .3; pe = math.hypot(zg(x + e_, y) - zg(x - e_, y), zg(x, y + e_) - zg(x, y - e_)) / (2 * e_)
        if z_ in ('falaise', 'mer') or (q > P.Q_RIM and h < TOP - .3 and z_ != 'port') or (pe > 1.2 and z_ != 'port'):
            c = C.mix(V.ROUGE[int(h * 1.6 + 20) % 4], V.ROUGE[4], .3 * (int(h * 5) % 2))                        # minéral rougeâtre [C], strates [I]
        elif z_ == 'port': c = C.mix(H('#a8a49a'), H('#bab4a6'), (int(x * 2) + int(y * 2)) % 2 * .5)
        elif z_ in ('rebord', 'place', 'avenue'): c = C.mix(H('#e4dccb'), H('#d8cfba'), (int(x * 1.5) + int(y * 1.5)) % 2 * .6)
        elif z_ == 'chateau': c = H('#ddd4c2') if P.chateau_d(x, y) < 4.3 or P.chateau_d(x, y) > 5.75 else H('#9ab47a')
        elif z_ == 'foret': c = C.mix(H('#4a7a3c'), H('#5a8a44'), .5 + .5 * math.sin(x * 1.3 + y))
        elif not in_lot(x, y) and in_lot(x, y, .6): c = H('#e0d8c6')                                               # rues du damier
        if P.riviere_d(x, y) < .6 and q < P.Q_RIM: c = H('#6a9a7a')
        v[colL] = c
for (i, j), v in grid.items():
    qd = [(i, j), (i + 1, j), (i + 1, j + 1), (i, j + 1)]
    if all(k in grid for k in qd): bm.faces.new([grid[k] for k in qd])
ground = C.mk_obj('MG_sol', bm, SOL, M['peint'], smooth=False); ground.data.color_attributes.active_color = ground.data.color_attributes['Col']; C.normals_up(ground)

# ------------------------------------------------------------------ 2. eau : douves [C], rivière plantée [C], bassin [I]
st = .5
for j in range(int(-26 / st), int(26 / st)):
    for i in range(int(-26 / st), int(26 / st)):
        x, y = i * st + st / 2, j * st + st / 2; wz = P.water_at(x, y)
        if wz is None: continue
        vs = [BE.bm.verts.new(G(x + a, y + b, wz)) for a, b in ((-st / 2, -st / 2), (st / 2, -st / 2), (st / 2, st / 2), (-st / 2, st / 2))]
        BE.bm.faces.new(vs); BE.paint(vs, H('#4a90b8'), .03)

# ------------------------------------------------------------------ 3. château de Pangaea [C], carrefour et fontaine [C], trottoirs roulants [C]
cx, cy, _ = P.CHATEAU; face = math.atan2(-cy, -cx)
top = V.chateau(BM, cx, cy, TOP, rnd, face)
C.mark('DRAPEAU_chateau', cx, cy, TOP + top)
V.fontaine(BM, 0, 0, TOP, 1.9)
for a in range(4):
    x, y = math.cos(a * math.pi / 2 + math.pi / 4) * 2.6, math.sin(a * math.pi / 2 + math.pi / 4) * 2.6; K.lampadaire(BM, x, y, TOP)
re = P.coast_r(0) * P.Q_MUR - .6; rw = P.coast_r(math.pi) * P.Q_MUR - .6; rn = P.coast_r(-math.pi / 2) * P.Q_MUR - .6; rs = P.coast_r(math.pi / 2) * P.Q_MUR - .6
for (a, b) in (((P.PLACE[2], 0), (re, 0)), ((-P.PLACE[2], 0), (-rw, 0)), ((0, -P.PLACE[2]), (0, -rn)), ((0, P.PLACE[2]), (0, rs))):
    for off in (-.55, .55): V.trottoir_roulant(BM, a, b, zg, off)
bx, by = cx + math.cos(face) * 6.4, cy + math.sin(face) * 6.4                                  # du carrefour au pont du château
for off in (-.4, .4): V.trottoir_roulant(BM, (-math.cos(face) * P.PLACE[2], -math.sin(face) * P.PLACE[2]), (bx, by), zg, off)

# ------------------------------------------------------------------ 4. mur d'enceinte et quatre grandes portes [C]
PORTES = [0.0, math.pi / 2, math.pi, -math.pi / 2]
pts = []
for k in range(0, 361, 3):
    a = math.radians(k - 180)
    if any(P.angd(a, g) < math.radians(7) for g in PORTES): pts.append(None); continue
    x, y = P.at_coast(a, P.Q_MUR)
    if P.chateau_d(x, y) < 6.3: pts.append(None); continue
    pts.append((x, y, zg(x, y)))
seg = []
for p_ in pts + [None]:
    if p_ is None:
        if len(seg) > 1: V.mur_enceinte(BM, seg)
        seg = []
    else: seg.append(p_)
for g in PORTES:
    x, y = P.at_coast(g, P.Q_MUR); V.grande_porte(BM, x, y, TOP, g, rnd)
for k in range(0, 360, 4):                                                                                    # parapet du rebord
    a = math.radians(k - 180)
    if any(P.angd(a, pa) < P.PORT_W + .03 for pa in P.PORTS): continue
    x, y = P.at_coast(a, P.Q_RIM - .015); F = K.Frame(x, y, TOP, a)
    K.box(BM, F, -.42, .42, -.08, .08, -.3, .35, V.PIERRE[3], .02)

# ------------------------------------------------------------------ 5. Red Ports [C] : palétuviers, bulles, bondolas, hangars à toit en cylindre
for pa in P.PORTS:
    for s in (-1, 1):
        x, y = P.at_coast(pa + s * .2, .96); V.paletuvier(BM, x, y, .3, .8, rnd)
    for k in range(7):
        x, y = P.at_coast(pa + rnd.uniform(-.3, .3), rnd.uniform(.92, 1.06)); V.bulle(BM, x, y, rnd.uniform(1.0, 4.0), rnd.uniform(.2, .45))
    for s in (-1, 1):
        a_ = pa + s * .12; bx_, by_ = P.at_coast(a_, .9); hx, hy = P.at_coast(a_, P.Q_RIM - .045)
        V.gare_bondola(BM, bx_, by_, .45, a_ + math.pi / 2); V.gare_bondola(BM, hx, hy, TOP, a_ + math.pi / 2)
        V.bondola(BM, (bx_, by_, 2.5), (hx, hy, TOP + 2.05), .3 if s < 0 else .62, rnd)
C.mark('PONTON', *P.at_coast(0.0, 1.0), 0)

# ------------------------------------------------------------------ 6. escalier taillé dans la Red Line, bordé de statues [C]
def q_pour_z(z):
    lo, hi = P.Q_RIM, P.Q_PIED
    for _ in range(30):
        m = (lo + hi) / 2
        if P.falaise_h(m) > z: lo = m
        else: hi = m
    return (lo + hi) / 2


a0, a1 = P.ESCALIER; NM = 44
for k in range(NM):
    t = k / (NM - 1); a = a0 + (a1 - a0) * t; z = .35 + (TOP - .35) * t; q = q_pour_z(z - .2) + .012
    x, y = P.at_coast(a, q); F = K.Frame(x, y, z, a); dl = P.coast_r(a) * q * abs(a1 - a0) / (NM - 1) / 2 + .03
    K.box(BM, F, -dl, dl, -.5, .4, -1.2, 0, V.ROUGE[1] if k % 2 else V.ROUGE[0], .03)
    if k % 6 == 3: V.statue(BM, *P.at_coast(a, q + .014), z, rnd)
x, y = P.at_coast(a0 - .02, .985); K.box(BM, K.Frame(x, y, 0, a0), -1.0, 1.0, -.6, .6, -1.5, .35, V.ROUGE[3], .03)       # palier au ras de l'eau

# ------------------------------------------------------------------ 7. nuages et brume autour de la falaise [C]
for k in range(30):
    a = rnd.uniform(-math.pi, math.pi)
    if any(P.angd(a, pa) < .45 for pa in P.PORTS) or P.angd(a, (a0 + a1) / 2) < .3: continue
    x, y = P.at_coast(a, rnd.uniform(1.0, 1.12)); V.nuage(BN, x, y, rnd.uniform(2.2, 4.5), rnd.uniform(.9, 1.5), rnd)

# ------------------------------------------------------------------ 8. bâtiments du Domaine (niveaux 1-3), pavillons, hangars du port
nb = 0; cnt = {}
lotw = {(round(cx, 2), round(cy, 2)): w for cx, cy, w in LOTS}
for b in P.batiments():
    lv = b['niveau']; typ = b['type']
    if typ == 'demeure': V.demeure(B[lv], b['x'], b['y'], TOP, b['ang'], b['w'], b['d'], b['lot'], rnd)
    elif typ == 'pavillon': V.pavillon(B[lv], b['x'], b['y'], TOP, b['ang'], b['w'], b['d'], rnd)
    else: V.hangar(B[lv], b['x'], b['y'], zg(b['x'], b['y']), b['ang'], b['w'], b['d'], rnd)
    nb += 1; cnt[typ] = cnt.get(typ, 0) + 1

# ------------------------------------------------------------------ 9. serre victorienne (niveau 4) ; pont sur la rivière
sx, sy = P.SERRE; V.serre(B[4], sx, sy, TOP, 0.3)
for xx in (-18.6,):
    F = K.Frame(xx, 0, TOP, 0); K.box(BM, F, -.9, .9, -.7, .7, -.4, .1, V.PIERRE[2], .02)

# ------------------------------------------------------------------ 10. arbres
TREE = {'rond': V.arbre_rond, 'taille': V.arbre_taille, 'cypres': V.cypres}
for x, y, sz, kind, lv in P.arbres(): TREE[kind](BV[lv], x, y, zg(x, y), sz, rnd)

for Bt in list(B.values()) + list(BV.values()) + [BM, BE, BN]: Bt.done()
os.makedirs(os.path.join(C.ART, 'blender', 'islands'), exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(C.ART, 'blender', 'islands', 'mary_geoise.blend'))
tris = sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in bpy.data.objects if o.type == 'MESH')
per = {o.name: sum(len(p.vertices) - 2 for p in o.data.polygons) for o in bpy.data.objects if o.type == 'MESH'}
print('MARY GEOISE ok', round(time.time() - T0, 1), 's · bâtiments', nb, cnt, '· triangles', tris, per)
