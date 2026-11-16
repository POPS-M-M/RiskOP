"""Cocoyasi — plan de masse et plan de production (île 8, procédure art/PROCEDURE_ILE.md, 16/11/2026).
Fiche canonique : art/data/fiches/cocoyasi.json. Sources (consultées le 16/11/2026) : One Piece Wiki, « Cocoyasi Village »,
« Conomi Islands », « Arlong Park » ; Sportskeeda Wiki, « Gosa Village ».
  [C] îles Conomi : archipel agricole, plantations de riz et d'oranges, au moins vingt communautés ; inspiré de l'Indonésie (Rurubu)
  [C] Cocoyasi : village tropical en bord de mer, palmiers, mandariniers, rizières ; inspiré d'Ubud (Rurubu) ; simple quai en bois ;
      un cabinet de médecin et une librairie ; un sommet de falaise qui domine l'océan, près du village
  [C] Cocoyasi est à l'ouest de Gosa et à l'est d'Arlong Park (détruit) ; Gosa a été détruit puis reconstruit
  [C] Arlong Park : sur la côte, plusieurs étages ; bassin extérieur relié à la mer, fermé par deux portes d'acier ; bâtiment détruit
  [C?] un moulin à vent (de mémoire, non vérifié)
  [I] tout le placement ; maisons à cour close, porte fendue et pavillons à toit de chaume (inspiration balinaise) ; temple à toits
      superposés ; rizières en terrasses sur la colline ; vergers de mandariniers en rangs ; jungle au nord-ouest.
Exclus : personnages et leurs maisons nommées (verger et maison d'une famille, tombe d'un personnage), emblèmes (pavillon pirate),
monstres marins, copie de tout décor officiel.
Repère du jeu : x vers l'est, y vers le sud, z vers le haut ; centre de l'île = (0, 0).
"""
import json, math, os, random

ART = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
_d = json.load(open(os.path.join(ART, 'data', 'islands.json'), encoding='utf-8'))
ISL = [i for i in _d['iles'] if i['nom'] == 'Archipel des Konomi'][0]
COAST = [(ISL['cote3d'][k], ISL['cote3d'][k + 1]) for k in range(0, len(ISL['cote3d']), 2)]
R = ISL['rayon']; TAU = 2 * math.pi; D = math.radians


def coast_r(th):
    B = len(COAST); f = ((th + math.pi) / TAU) * B; i = int(math.floor(f)) % B; j = (i + 1) % B; k = f - math.floor(f)
    return math.hypot(*COAST[i]) + (math.hypot(*COAST[j]) - math.hypot(*COAST[i])) * k


def ss(a, b, x):
    t = max(0.0, min(1.0, (x - a) / (b - a))); return t * t * (3 - 2 * t)


def angd(a, b): return abs((a - b + math.pi) % TAU - math.pi)
def pol(x, y): r = math.hypot(x, y); th = math.atan2(y, x); return r, th, r / coast_r(th)
def dcoast(x, y): return pol(x, y)[2]
def at_coast(a, k): r = coast_r(a) * k; return (math.cos(a) * r, math.sin(a) * r)


def seg_dist(px, py, ax, ay, bx, by):
    vx, vy = bx - ax, by - ay; L2 = vx * vx + vy * vy
    t = 0 if L2 < 1e-9 else max(0, min(1, ((px - ax) * vx + (py - ay) * vy) / L2))
    return math.hypot(px - ax - t * vx, py - ay - t * vy), t


def poly_dist(px, py, pts): return min(seg_dist(px, py, *a, *b)[0] for a, b in zip(pts, pts[1:]))


# ---------------------------------------------------------------- éléments [C] placés [I]
VILLAGE = (-7.5, 10.0, 8.0)                       # [C] Cocoyasi, en bord de mer [position I]
GOSA = (13.0, 6.0, 5.0)                           # [C] Gosa, à l'est de Cocoyasi, reconstruit [I : plus petit, plus neuf]
ARLONG_A = D(178)                                 # [C] Arlong Park sur la côte, à l'ouest de Cocoyasi [position I]
ARLONG = at_coast(ARLONG_A, .84)                  # centre du complexe en ruines
BASSIN = at_coast(ARLONG_A, .955)                 # [C] bassin extérieur relié à la mer, portes d'acier
COLLINE = (3.0, -11.0, 11.0, 7.5)                 # [I] colline des rizières en terrasses [C : rizières]
FALAISE_A = D(72)                                 # [C] sommet de falaise qui domine l'océan, près du village [position I]
QUAI_A = D(122)                                   # [C] simple quai en bois [position I]
TEMPLE = (-12.5, 4.0)                             # [I] temple à toits superposés (inspiration balinaise, Ubud)
MOULIN = (4.5, 3.0)                               # [C?] moulin à vent
JUNGLE = [(-16.0, -12.0, 9.0), (-6.0, -21.0, 6.0)]   # [I] jungle (île de type « forêt » dans le jeu)
VERGERS = [(-1.0, 14.0, 5.0), (7.0, 13.0, 4.5), (-14.0, 17.0, 3.5), (18.0, -6.0, 4.5)]   # [C] mandariniers [positions I]
Z_TERR = .42                                       # hauteur d'une marche de rizière


CHEMINS = [  # chemins de terre [I]
    [at_coast(QUAI_A, .95), (-10.0, 18.0), (-8.0, 11.5), (-5.0, 8.0), (1.0, 5.0), (8.0, 5.5), GOSA[:2]],      # quai → Cocoyasi → Gosa
    [(-8.0, 11.5), (-14.0, 8.0), (-18.0, 4.0), ARLONG],                                                        # Cocoyasi → ruines d'Arlong Park
    [(-5.0, 8.0), (-3.0, 1.0), (0.0, -4.5), (2.5, -9.5)],                                                     # vers les rizières
    [(1.0, 5.0), MOULIN],
    [(8.0, 5.5), (6.0, 12.0), at_coast(FALAISE_A, .9)],                                                       # vers le belvédère de la falaise
    [GOSA[:2], (18.0, 0.0), (20.0, -6.0)]]


def chemin_d(x, y): return min(poly_dist(x, y, c) for c in CHEMINS)


def _wob(a): return 1 + .08 * math.sin(3 * a + .6) + .05 * math.sin(5 * a + 2.1) + .03 * math.sin(9 * a)   # contour irrégulier [I]


def colline_d(x, y):
    u, v = (x - COLLINE[0]) / 1.15, y - COLLINE[1]
    return math.hypot(u, v) / COLLINE[2] / _wob(math.atan2(v, u))


def falaise_t(x, y):
    r, th, q = pol(x, y); d = angd(th, FALAISE_A)
    return ss(.32, .12, d) * ss(.55, .8, q)


def bassin_d(x, y): return math.hypot(x - BASSIN[0], y - BASSIN[1])


def ondul(x, y): return .35 * math.sin(x * .23 + math.cos(y * .17) * 1.4) * math.cos(y * .21 + .7)


def height_lisse(x, y):
    r, th, q = pol(x, y)
    if q >= 1: return -1.4 * ss(1, 1.1, q) - .1
    h = 1.1 + ondul(x, y) + .9 * ss(.9, .3, q)
    d = colline_d(x, y)
    if d < 1.3: h += (COLLINE[3] - 1.2) * (1 - ss(0.0, 1.25, d)) ** 1.3
    for cx, cy, rr in JUNGLE: h += .9 * (1 - ss(0, rr * 1.2, math.hypot(x - cx, y - cy)))
    f = falaise_t(x, y)
    if f > 0: h += 3.2 * f * ss(.55, .9, q)
    shore = ss(.93, 1.0, q) * (1 - f * ss(.9, .97, q)); h = h * (1 - shore) + .15 * shore      # plages, sauf sous la falaise
    if f > .3: h = h * (1 - ss(.975, .995, q)) + (-.5) * ss(.975, .995, q)
    bd = bassin_d(x, y)
    if bd < 3.4: h = h * ss(2.4, 3.4, bd) + (-.7) * (1 - ss(2.4, 3.4, bd))                      # bassin d'Arlong Park
    return h


RIZ_D = [.25 + k * .1 for k in range(10)]          # [I] rizières en terrasses : anneaux concentriques autour de la colline (en distance colline_d)


def riz_point(d, a):
    r = COLLINE[2] * d * _wob(a); return COLLINE[0] + 1.15 * r * math.cos(a), COLLINE[1] + r * math.sin(a)


def rizieres(x, y):
    """[C] rizières, en terrasses [I] sur les flancs de la colline"""
    d = colline_d(x, y); r, th, q = pol(x, y)
    return RIZ_D[0] < d < RIZ_D[-1] and q < .9 and chemin_d(x, y) > .6


def riz_anneau(x, y):
    d = colline_d(x, y)
    for k in range(len(RIZ_D) - 1):
        if RIZ_D[k] <= d < RIZ_D[k + 1]: return k
    return None


def riz_z(k, a):
    """hauteur (plate en travers) de l'anneau k dans la direction a : sol lisse au milieu de l'anneau"""
    return height_lisse(*riz_point((RIZ_D[k] + RIZ_D[k + 1]) / 2, a))


def height(x, y):
    h = height_lisse(x, y)
    if rizieres(x, y):                                                     # sous les terrasses (modélisées à part) : sol légèrement enfoncé
        k = riz_anneau(x, y); a = math.atan2(y - COLLINE[1], (x - COLLINE[0]) / 1.15)
        h = min(h, riz_z(k, a)) - .25
    return h


def water_at(x, y):
    r, th, q = pol(x, y)
    if q >= 1: return None
    if bassin_d(x, y) < 2.6 and q < 1: return .02
    return None


def zone(x, y):
    r, th, q = pol(x, y)
    if q >= 1: return 'mer'
    if bassin_d(x, y) < 3.6 or math.hypot(x - ARLONG[0], y - ARLONG[1]) < 3.8: return 'arlong'
    if falaise_t(x, y) > .5 and q > .7: return 'falaise'
    if q > .93: return 'plage'
    if math.hypot(x - VILLAGE[0], y - VILLAGE[1]) < VILLAGE[2]: return 'village'
    if math.hypot(x - GOSA[0], y - GOSA[1]) < GOSA[2]: return 'gosa'
    if rizieres(x, y): return 'rizieres'
    for cx, cy, rr in VERGERS:
        if math.hypot(x - cx, y - cy) < rr: return 'verger'
    for cx, cy, rr in JUNGLE:
        if math.hypot(x - cx, y - cy) < rr * (1 + .12 * math.sin(math.atan2(y - cy, x - cx) * 3 + cx)): return 'jungle'
    return 'campagne'


def pente(x, y):
    e = .35; return math.hypot(height_lisse(x + e, y) - height_lisse(x - e, y), height_lisse(x, y + e) - height_lisse(x, y - e)) / (2 * e)


def obstacle(x, y, pmax=.7):
    r, th, q = pol(x, y)
    if q > .92: return True
    if chemin_d(x, y) < .55 or zone(x, y) in ('arlong', 'rizieres', 'falaise'): return True
    if math.hypot(x - TEMPLE[0], y - TEMPLE[1]) < 3.0 or math.hypot(x - MOULIN[0], y - MOULIN[1]) < 1.3: return True
    if pente(x, y) > pmax: return True
    return False


class Occupation:
    def __init__(self): self.s = set(); self.k = 5.0
    def cells(self, x, y, ang, w, d, m=.03):
        c, s = math.cos(ang), math.sin(ang); out = []; n_u = int((w + 2 * m) * self.k) + 1; n_v = int((d + 2 * m) * self.k) + 1
        for i in range(n_u + 1):
            for j in range(n_v + 1):
                u = -w / 2 - m + i * (w + 2 * m) / n_u; v = -d / 2 - m + j * (d + 2 * m) / n_v
                out.append((int(math.floor((x - s * u + c * v) * self.k)), int(math.floor((y + c * u + s * v) * self.k))))
        return out
    def libre(self, x, y, ang, w, d): return not any(q in self.s for q in self.cells(x, y, ang, w, d))
    def prendre(self, x, y, ang, w, d): self.s.update(self.cells(x, y, ang, w, d, 0.0))


def _place(occ, out, x, y, ang, w, d, **kw):
    c, s = math.cos(ang), math.sin(ang)
    corners = [(x + su * w / 2 * -s + sv * d / 2 * c, y + su * w / 2 * c + sv * d / 2 * s) for su in (-1, 1) for sv in (-1, 1)]
    if any(obstacle(qx, qy) for qx, qy in corners + [(x, y)]) or not occ.libre(x, y, ang, w, d): return False
    occ.prendre(x, y, ang, w, d); out.append(dict(x=x, y=y, ang=ang, w=w, d=d, **kw)); return True


def _chemin_pts(c, pas=.5):
    for (ax, ay), (bx, by) in zip(c, c[1:]):
        L_ = math.hypot(bx - ax, by - ay); n = max(1, int(L_ / pas))
        for k in range(n): f = k / n; yield ax + (bx - ax) * f, ay + (by - ay) * f, math.atan2(by - ay, bx - ax)


def batiments(seed=508):
    """cours closes (maison + pavillon + porte fendue) [I] ; Gosa reconstruit : maisons simples et neuves [I]"""
    rnd = random.Random(seed); occ = Occupation(); out = []
    occ.prendre(TEMPLE[0], TEMPLE[1], 0, 5.0, 5.0)
    # deux bâtiments [C] du village : cabinet du médecin et librairie (formes génériques [I])
    for typ in ('clinique', 'librairie'):
        for k in range(200):
            a = rnd.uniform(0, TAU); d = 2.5 + 2 * rnd.random(); x, y = VILLAGE[0] + math.cos(a) * d, VILLAGE[1] + math.sin(a) * d
            if _place(occ, out, x, y, math.atan2(VILLAGE[1] - y, VILLAGE[0] - x), 1.5, 1.2, type=typ, zone='cocoyasi', niveau=1): break
    for (vx, vy, vr), nom in ((VILLAGE, 'cocoyasi'), (GOSA, 'gosa')):
        # le long des chemins, puis remplissage
        for c in CHEMINS:
            for x, y, a in _chemin_pts(c, .7):
                dv = math.hypot(x - vx, y - vy)
                if dv > vr + 3: continue
                for side in (-1, 1):
                    if rnd.random() < .3: continue
                    off = 1.45 + .3 * rnd.random(); px, py = x + math.cos(a + side * math.pi / 2) * off, y + math.sin(a + side * math.pi / 2) * off
                    lv = 1 if dv < vr + .5 else (2 if dv < vr + 2 else 3)
                    w = 1.9 + .4 * rnd.random() if nom == 'cocoyasi' else 1.2 + .3 * rnd.random()
                    _place(occ, out, px, py, a + side * math.pi / 2 + math.pi, w, w * .9, type='cour' if nom == 'cocoyasi' else 'maison_gosa', zone=nom, niveau=lv)
        for k in range(2500):
            a = rnd.uniform(0, TAU); d = (vr + 1) * math.sqrt(rnd.random()); x, y = vx + math.cos(a) * d, vy + math.sin(a) * d
            lv = 1 if d < vr + .3 else 2
            w = 1.6 + .4 * rnd.random() if nom == 'cocoyasi' else 1.2 + .3 * rnd.random()
            _place(occ, out, x, y, math.atan2(vy - y, vx - x) + rnd.uniform(-.25, .25), w, w * .9, type='cour' if nom == 'cocoyasi' else 'maison_gosa', zone=nom, niveau=lv)
    # cabanes de rizière et maisons de verger (niveaux 2 à 4) [I]
    for k in range(3000):
        x, y = rnd.uniform(-28, 28), rnd.uniform(-28, 28); z_ = zone(x, y)
        if z_ not in ('campagne', 'verger') or rnd.random() > .05: continue
        d_r = colline_d(x, y)
        lv = 2 if d_r < 1.5 else (3 if rnd.random() < .7 else 4)
        _place(occ, out, x, y, rnd.uniform(0, TAU), 1.0, .9, type='cabane', zone=z_, niveau=lv)
    return out


def arbres(seed=23):
    """palmiers [C], mandariniers en rangs [C], jungle [I], frangipaniers et bananiers [I]"""
    rnd = random.Random(seed); out = []; occ = Occupation()
    for b in batiments(): occ.prendre(b['x'], b['y'], b['ang'], b['w'] + .3, b['d'] + .3)
    occ.prendre(TEMPLE[0], TEMPLE[1], 0, 5.0, 5.0); occ.prendre(MOULIN[0], MOULIN[1], 0, 1.6, 1.6)
    for cx, cy, rr in VERGERS:                                  # rangs réguliers de mandariniers
        a0 = rnd.uniform(0, math.pi)
        for i in range(-8, 9):
            for j in range(-8, 9):
                u, v = i * .95, j * .95; x, y = cx + u * math.cos(a0) - v * math.sin(a0), cy + u * math.sin(a0) + v * math.cos(a0)
                if math.hypot(x - cx, y - cy) > rr or zone(x, y) != 'verger' or chemin_d(x, y) < .6 or not occ.libre(x, y, 0, .5, .5): continue
                out.append((x, y, .75 + .15 * rnd.random(), 'mandarinier', 1)); occ.prendre(x, y, 0, .5, .5)
    for k in range(16000):
        x, y = rnd.uniform(-34, 34), rnd.uniform(-34, 34); z_ = zone(x, y); r, th, q = pol(x, y)
        if z_ in ('mer', 'arlong', 'rizieres', 'verger') or chemin_d(x, y) < .6 or not occ.libre(x, y, 0, .7, .7): continue
        if z_ == 'plage' and q < .985 and rnd.random() < .55: kind = 'palmier'
        elif z_ == 'jungle' and rnd.random() < .7: kind = rnd.choice(('jungle', 'jungle', 'palmier', 'bananier'))
        elif z_ in ('village', 'gosa') and rnd.random() < .05: kind = rnd.choice(('palmier', 'frangipanier', 'bananier'))
        elif z_ in ('campagne', 'falaise') and rnd.random() < .035: kind = rnd.choice(('palmier', 'jungle', 'frangipanier'))
        else: continue
        lv = 1 if z_ in ('plage', 'jungle') or rnd.random() < .6 else 2
        out.append((x, y, .8 + .45 * rnd.random(), kind, lv)); occ.prendre(x, y, 0, .7, .7)
    return out


if __name__ == '__main__':
    from collections import Counter
    B = batiments(); print(len(B), 'bâtiments', dict(Counter(b['type'] for b in B)), 'niveaux', dict(Counter(b['niveau'] for b in B)))
    A = arbres(); print(len(A), 'arbres', dict(Counter(a[3] for a in A)))
    print('arlong', [round(v, 1) for v in ARLONG], 'bassin', [round(v, 1) for v in BASSIN], 'falaise', [round(v, 1) for v in at_coast(FALAISE_A, .9)], 'z colline', round(height(COLLINE[0], COLLINE[1]), 2))
