"""Loguetown — plan de masse et plan de production (île 4, méthode d'industrialisation, 16/11/2026).
Fiche canonique : projet « claude/risk-op-fiches-iles-4-6.md ».
  [C] ville qui occupe presque toute l'île, à part quelques collines escarpées ; proche de l'entrée de Reverse Mountain (Sportskeeda)
  [C] ville modelée sur Florence : tour qui rappelle le Palazzo Vecchio, édifice dans le style de la cathédrale de Florence,
      villa de type Médicis (Sportskeeda)
  [C] l'échafaud au milieu de la ville, où Gol D. Roger a été exécuté (Sportskeeda, Netflix Tudum)
  [C] base de la Marine, boutiques, marché aux poissons, opéra (Sportskeeda, Netflix Tudum)
  [I] tout le reste : place décalée au nord (le badge d'armée du jeu, au centre de l'île, ne la couvre pas), rues en étoile,
      enceinte et portes, port au sud-sud-ouest tourné vers Reverse Mountain, phare sur la jetée, collines au nord-est,
      villa sur la colline nord-ouest, campagne toscane (oliviers, vignes, cyprès, pins parasols).
Différences voulues avec Water 7 (même famille « ville européenne ») : ville de plaine sans terrasses ni canaux, rues en étoile
vers une place, toits de tuiles presque partout, enduits ocre / sienne, palais à corniches débordantes, deux verticales (tour et
dôme) au lieu d'une fontaine, campagne autour de l'enceinte.
Repère du jeu : x vers l'est, y vers le sud, z vers le haut ; centre de l'île = (0, 0).
"""
import json, math, os, random

ART = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
_d = json.load(open(os.path.join(ART, 'data', 'islands.json'), encoding='utf-8'))
ISL = [i for i in _d['iles'] if i['nom'] == 'Loguetown'][0]
COAST = [(ISL['cote3d'][k], ISL['cote3d'][k + 1]) for k in range(0, len(ISL['cote3d']), 2)]
R = ISL['rayon']; TAU = 2 * math.pi


def coast_r(th):
    B = len(COAST); f = ((th + math.pi) / TAU) * B; i = int(math.floor(f)) % B; j = (i + 1) % B; k = f - math.floor(f)
    return math.hypot(*COAST[i]) + (math.hypot(*COAST[j]) - math.hypot(*COAST[i])) * k


def ss(a, b, x):
    t = max(0.0, min(1.0, (x - a) / (b - a))); return t * t * (3 - 2 * t)


def angd(a, b):
    return abs((a - b + math.pi) % TAU - math.pi)


def dcoast(x, y):
    return math.hypot(x, y) / coast_r(math.atan2(y, x))


def seg_dist(px, py, ax, ay, bx, by):
    vx, vy = bx - ax, by - ay; L2 = vx * vx + vy * vy
    t = 0 if L2 < 1e-9 else max(0, min(1, ((px - ax) * vx + (py - ay) * vy) / L2))
    return math.hypot(px - ax - t * vx, py - ay - t * vy), t


def poly_dist(px, py, pts):
    return min(seg_dist(px, py, *a, *b)[0] for a, b in zip(pts, pts[1:]))


# ---------------------------------------------------------------- éléments signature (positions [I])
DY = 8.5                                # tout le cœur monumental est décalé de 8,5 vers le sud : en 3D, le badge d'armée du jeu (posé en
                                        # hauteur au centre) masque le sol vers y ≈ -9 ; en 2.5D il est posé au sud (y ≈ +19). L'échafaud reste dégagé dans les deux modes.
PL = (0.0, -6.5 + DY)                  # centre de la place de l'échafaud [C : au milieu de la ville] [position I]
PLW, PLH = 5.2, 3.9                     # demi-dimensions de la place (est-ouest, nord-sud)
ECHAFAUD = (0.0, -6.9 + DY)                  # [C] échafaud au centre de la place
PALAIS = (-8.6, -8.4 + DY, 4.2, 3.4)         # [C] palais à tour (rappel du Palazzo Vecchio) : centre x, y, demi-largeur, demi-profondeur ; à l'ouest de la place [I]
TOUR = (-8.6, -6.2 + DY)                     # tour du palais, en façade sur la place [I]
DOME = (7.6, -14.2 + DY)                     # [C] cathédrale (style de Florence) : centre du dôme ; au nord-est de la place [I]
NEF = (7.6, -9.6 + DY, 2.0, 4.0)             # nef devant le dôme, façade tournée vers la place (sud) : centre, demi-largeur, demi-longueur [I]
CAMPANILE = (12.1, -8.6 + DY)                # campanile à côté de la façade [I]
OPERA = (-6.6, 13.6, 2.6, 2.0)           # [C] opéra (Netflix Tudum) ; position [I] (niveau 4)
LOGGIA = (-3.2, -11.2 + DY, 2.4, 1.0)        # loggia au nord-ouest de la place [I] (niveau 4)
VILLA = (-17.5, -17.5)                  # [C] villa de type Médicis ; sur la colline nord-ouest [I]
COLLINE_NE = [(18.5, -17.0, 6.5, 9.0), (24.0, -8.5, 4.8, 6.5), (13.5, -24.0, 4.5, 5.5)]   # [C] collines escarpées : x, y, rayon, hauteur [I]
COLLINE_NO = (-17.5, -17.5, 6.8, 3.6)
PORT_A = math.radians(112)              # port tourné vers Reverse Mountain (117° sur la carte) [I]
BASSIN = (-11.0, 24.0, 5.6)             # bassin du port : centre, rayon [I]
JETEE = [(-17.2, 21.5), (-19.6, 27.0), (-17.4, 31.8)]   # jetée ouest avec le phare au bout [I]
PHARE = (-17.0, 32.4)
MARINE = (-23.0, 13.0, 3.6, 3.0)        # [C] base de la Marine (sans emblème) ; position à l'ouest du port [I]
MARCHE = (-2.6, 21.6, 2.6, 1.2)         # [C] marché aux poissons, sur le quai est du bassin [I]
PONTON = (-11.0, 31.0, 0.0)
CHAPELLE = (18.2, -18.6)                # chapelle / tour de guet sur la colline nord-est [I] (niveau 3)

# ---------------------------------------------------------------- rues (polylignes) et enceinte
MURS_R = 19.5                           # enceinte : ellipse autour de la place [I]
MURS_C = (0.0, -4.5 + DY * .75)
MURS_K = (1.0, .88)                     # aplatissement (x, y)


def enceinte(a):
    return MURS_C[0] + math.cos(a) * MURS_R * MURS_K[0], MURS_C[1] + math.sin(a) * MURS_R * MURS_K[1]


def murs_d(x, y):
    """position relative à l'enceinte (1 sur le mur)"""
    return math.hypot((x - MURS_C[0]) / MURS_K[0], (y - MURS_C[1]) / MURS_K[1]) / MURS_R


def ray(a, r0, r1, n=6, wob=0.0, seed=0):
    rnd = random.Random(seed); out = []
    for k in range(n + 1):
        r = r0 + (r1 - r0) * k / n; aa = a + (math.sin(k * 1.7 + seed) * wob if 0 < k < n else 0)
        out.append((PL[0] + math.cos(aa) * r, PL[1] + math.sin(aa) * r * .92))
    return out


RUES = [  # (nom, polyligne, largeur, porte dans l'enceinte ?)
    ('via_maestra', [(0.0, PL[1] + PLH), (-1.4, 9.6), (-3.6, 13.6), (-6.4, 17.0), (-8.6, 19.4)], 2.0, True),   # vers le port (sud-sud-ouest)
    ('rue_sud_est', ray(math.radians(48), PLW + .5, 24.5, 6, .05, 1), 1.3, True),
    ('rue_est', ray(math.radians(-8), PLW + .3, 23.0, 6, .06, 2), 1.3, True),
    ('rue_nord_est', ray(math.radians(-58), PLH + 2.2, 19.5, 5, .04, 3), 1.2, True),
    ('rue_nord', ray(math.radians(-100), PLH + .3, 19.0, 5, .05, 4), 1.2, True),
    ('rue_ouest', ray(math.radians(-170), PLW + .3, 23.5, 6, .05, 5), 1.3, True),
    ('rue_sud_ouest', ray(math.radians(135), PLW + .5, 23.0, 6, .05, 6), 1.3, True),
]
ANNEAUX = [8.7, 13.4]                   # rues en anneau (rayon depuis la place, ellipse ×0.92 en y)
ANNEAU_L = 1.0
QUAI_L = 1.4                            # quai autour du bassin
EAU = .3


def anneau_pts(r, n=72):
    return [(PL[0] + math.cos(k / n * TAU) * r, PL[1] + math.sin(k / n * TAU) * r * .92) for k in range(n + 1)]


ANNEAUX_PTS = [anneau_pts(r) for r in ANNEAUX]


def in_place(x, y, m=0.0):
    return abs(x - PL[0]) < PLW + m and abs(y - PL[1]) < PLH + m


def rue_at(x, y, m=0.0):
    for nm, pts, w, _ in RUES:
        if poly_dist(x, y, pts) < w / 2 + m: return nm
    for p in ANNEAUX_PTS:
        if poly_dist(x, y, p) < ANNEAU_L / 2 + m: return 'anneau'
    return None


def in_rect(x, y, r, m=0.0):
    cx, cy, hw, hh = r; return abs(x - cx) < hw + m and abs(y - cy) < hh + m


# ---------------------------------------------------------------- relief
def bassin_d(x, y):
    return math.hypot(x - BASSIN[0], y - BASSIN[1]) / BASSIN[2]


def water_at(x, y):
    d = dcoast(x, y)
    if d >= 1: return None
    if bassin_d(x, y) < 1 and not jetee_at(x, y): return EAU
    if passe(x, y): return EAU                                                                # passe vers la mer
    return None


def passe(x, y):
    return abs(x - BASSIN[0]) < 2.6 and BASSIN[1] < y < BASSIN[1] + 14


def jetee_at(x, y):
    return poly_dist(x, y, JETEE) < .9


def height(x, y):
    d = dcoast(x, y)
    if d >= 1: return -1.2 * ss(1, 1.12, d) - .05
    # plaine : légère montée vers le nord, plate dans la ville
    h = 1.0 + .9 * ss(10, -26, y) + .25 * math.sin(x * .21) * math.cos(y * .17)
    md = murs_d(x, y)
    if md < 1.02: h = 1.0 + .55 * ss(14, -24, y)                                            # ville intra-muros quasi plate
    for cx, cy, r, hh in COLLINE_NE:                                                          # collines escarpées : plateaux + falaises
        q = math.hypot(x - cx, y - cy) / r
        if q < 1.25:
            rough = .55 * math.sin(x * 1.3 + y * .7) * math.cos(y * 1.1 - x * .4)
            h = max(h, hh * ss(1.2, .55, q) + rough * ss(1.25, .7, q))
    cx, cy, r, hh = COLLINE_NO                                                                # colline douce de la villa
    q = math.hypot(x - cx, y - cy) / r
    if q < 1.5: h = max(h, 1.2 + hh * ss(1.5, .45, q))
    h -= 1.0 * ss(.84, 1.0, d)                                                                # plage / côte
    bd = bassin_d(x, y)
    if bd < 1.35: h = min(h, .9) if bd > 1 else min(h, EAU - .8)                             # bassin du port (fond) et quais
    if water_at(x, y) is not None: h = min(h, EAU - .8)
    if jetee_at(x, y): h = .7                                                                 # sous le dessus de la jetée (pas de faces coplanaires)
    return h


def zone(x, y):
    d = dcoast(x, y); md = murs_d(x, y)
    if in_place(x, y): return 'place'
    if d > .9: return 'cote'
    if bassin_d(x, y) < 1.8 or (y > 13 and -20 < x < 4 and d > .55): return 'port'
    if md < .98: return 'centre' if md < .62 else 'ville'
    for cx, cy, r, hh in COLLINE_NE:
        if math.hypot(x - cx, y - cy) < r * 1.05: return 'colline'
    if math.hypot(x - COLLINE_NO[0], y - COLLINE_NO[1]) < COLLINE_NO[2] * 1.1: return 'villa'
    return 'faubourg' if md < 1.42 else 'campagne'          # [C] la ville occupe presque toute l'île


def pente(x, y):
    e = .35; return math.hypot(height(x + e, y) - height(x - e, y), height(x, y + e) - height(x, y - e)) / (2 * e)


def obstacle(x, y):
    d = dcoast(x, y)
    if d > .93: return True
    if water_at(x, y) is not None or bassin_d(x, y) < 1 + QUAI_L / BASSIN[2] + .05: return True
    if in_place(x, y, .35): return True
    if rue_at(x, y, .15): return True
    if abs(murs_d(x, y) - 1) * MURS_R < .75: return True
    for r in (PALAIS, NEF, OPERA, LOGGIA, MARINE, MARCHE):
        if in_rect(x, y, r, .45): return True
    if math.hypot(x - DOME[0], y - DOME[1]) < 4.4 or math.hypot(x - CAMPANILE[0], y - CAMPANILE[1]) < 1.5: return True
    if math.hypot(x - VILLA[0], y - VILLA[1]) < 6.2: return True
    if math.hypot(x - CHAPELLE[0], y - CHAPELLE[1]) < 2.4: return True
    if jetee_at(x, y) or poly_dist(x, y, JETEE) < 1.6: return True
    if pente(x, y) > .55: return True
    return False


# ---------------------------------------------------------------- bâtiments : rangées le long des rues
STYLE = {  # largeur de façade, profondeur, étages, types
    'centre':   ((1.3, 2.4), (2.0, 2.8), (3, 4), ('palais', 'palais', 'maison', 'maison', 'maison_tour')),
    'ville':    ((1.0, 1.9), (1.7, 2.4), (2, 4), ('maison', 'maison', 'palais', 'maison')),
    'faubourg': ((1.0, 1.8), (1.5, 2.2), (2, 3), ('maison', 'maison', 'maison', 'maison', 'magasin')),
    'port':     ((1.0, 1.8), (1.6, 2.2), (2, 3), ('maison', 'maison', 'magasin')),
    'campagne': ((1.4, 2.2), (1.6, 2.2), (1, 2), ('ferme',)),
    'villa':    ((1.2, 1.8), (1.6, 2.0), (1, 2), ('ferme',)),
    'colline':  ((1.0, 1.4), (1.4, 1.8), (1, 2), ('maison',)),
}
NIVEAUX = {'centre': {1: 1.0}, 'ville': {1: .85, 2: .15}, 'port': {1: .75, 2: .25}, 'faubourg': {1: .5, 2: .3, 3: .2},
           'campagne': {2: .4, 3: .6}, 'villa': {3: 1.0}, 'colline': {3: 1.0}}   # le niveau 1 (début de partie) montre déjà une ville dense


def tirer(rnd, dist):
    k = rnd.random(); acc = 0
    for L_, p in sorted(dist.items()):
        acc += p
        if k <= acc: return L_
    return max(dist)


class Occupation:
    """grille d'occupation (pas de 0,2) pour que les rangées de rues différentes ne se chevauchent pas"""
    def __init__(self): self.s = set(); self.k = 5.0
    def cells(self, x, y, ang, w, d, m=.06):
        c, s = math.cos(ang), math.sin(ang); out = []; n_u = int((w + 2 * m) * self.k) + 1; n_v = int((d + 2 * m) * self.k) + 1
        for i in range(n_u + 1):
            for j in range(n_v + 1):
                u = -w / 2 - m + i * (w + 2 * m) / n_u; v = -d / 2 - m + j * (d + 2 * m) / n_v
                out.append((int(math.floor((x - s * u + c * v) * self.k)), int(math.floor((y + c * u + s * v) * self.k))))
        return out
    def libre(self, x, y, ang, w, d): return not any(q in self.s for q in self.cells(x, y, ang, w, d, .03))
    def prendre(self, x, y, ang, w, d): self.s.update(self.cells(x, y, ang, w, d, 0.0))


def _rangee(rnd, occ, pts, off, cote, out, lots_min=3, lots_max=7, gap=.5):
    """remplit un côté d'une polyligne : façade tournée vers la rue (cote = +1 / -1)"""
    L_tot = sum(math.hypot(b[0] - a[0], b[1] - a[1]) for a, b in zip(pts, pts[1:]))
    s = rnd.random() * .8; reste = 0; lvl = 1; ilot = 0
    while s < L_tot:
        acc = 0; seg = None
        for a, b in zip(pts, pts[1:]):
            l = math.hypot(b[0] - a[0], b[1] - a[1])
            if acc + l >= s: seg = (a, b, (s - acc) / max(l, 1e-6)); break
            acc += l
        if seg is None: break
        (ax, ay), (bx, by), t = seg; tx, ty = (bx - ax), (by - ay); ln = math.hypot(tx, ty) or 1; tx /= ln; ty /= ln
        nx, ny = -ty * cote, tx * cote                                                       # normale vers le lot
        px, py = ax + (bx - ax) * t, ay + (by - ay) * t
        z0 = zone(px + nx * (off + 1), py + ny * (off + 1))
        if z0 not in STYLE: s += .4; reste = 0; continue
        (w0, w1), (d0, d1), (f0, f1), types = STYLE[z0]
        w = w0 + (w1 - w0) * rnd.random(); dep = d0 + (d1 - d0) * rnd.random()
        typ = rnd.choice(types)
        if typ == 'palais': w = max(w, 2.3); dep = max(dep, 2.5)
        cx, cy = px + nx * (off + dep / 2) + tx * w / 2, py + ny * (off + dep / 2) + ty * w / 2
        ang = math.atan2(-ny, -nx)                                                          # façade (v) vers la rue
        corners = [(cx + su * w / 2 * -math.sin(ang) + sv * dep / 2 * math.cos(ang), cy + su * w / 2 * math.cos(ang) + sv * dep / 2 * math.sin(ang)) for su in (-1, 1) for sv in (-1, 1)]
        ok = all(not obstacle(qx, qy) for qx, qy in corners + [(cx, cy)]) and occ.libre(cx, cy, ang, w, dep)
        if ok:
            if reste <= 0:
                ilot += 1; reste = rnd.randint(lots_min, lots_max); lvl = tirer(rnd, NIVEAUX[z0])
            occ.prendre(cx, cy, ang, w, dep)
            out.append({'x': cx, 'y': cy, 'ang': ang, 'w': w * .985, 'd': dep, 'etages': rnd.randint(f0, f1), 'type': typ, 'zone': z0,
                        'niveau': lvl, 'loggia': typ == 'palais' and rnd.random() < .3, 'altana': typ == 'palais' and rnd.random() < .35})
            reste -= 1; s += w
            if reste <= 0: s += gap                                                       # ruelle entre deux îlots
        else:
            reste = 0; s += .25


def batiments(seed=1871):
    rnd = random.Random(seed); occ = Occupation(); out = []
    # façades sur la place (palais), puis rues principales, anneaux, et 2e rangée (dos à dos) quand la place le permet
    place = [(PL[0] - PLW - .2, PL[1] - PLH - .2), (PL[0] + PLW + .2, PL[1] - PLH - .2), (PL[0] + PLW + .2, PL[1] + PLH + .2), (PL[0] - PLW - .2, PL[1] + PLH + .2), (PL[0] - PLW - .2, PL[1] - PLH - .2)]
    _rangee(rnd, occ, place, .2, -1, out, 2, 4, .6)
    for nm, pts, w, _ in RUES:
        for cote in (-1, 1): _rangee(rnd, occ, pts, w / 2 + .22, cote, out)
    for p in ANNEAUX_PTS:
        for cote in (-1, 1): _rangee(rnd, occ, p, ANNEAU_L / 2 + .22, cote, out)
    # ruelles secondaires (arcs entre les anneaux et dans les faubourgs) : façades sur des ruelles étroites
    for r in (6.4, 11.0, 15.8, 17.6, 22.0, 24.6, 27.0, 29.6, 32.2):
        p = anneau_pts(r, 96)
        for cote in (-1, 1): _rangee(rnd, occ, p, .35, cote, out, 2, 5, .55)
    rb = BASSIN[2] + QUAI_L + .3                                                            # front de quai autour du bassin (façades vers l'eau)
    quai = [(BASSIN[0] + math.cos(a) * rb, BASSIN[1] + math.sin(a) * rb) for a in [math.radians(150 + k * 7.5) for k in range(33)]]
    _rangee(rnd, occ, quai, .1, 1, out, 3, 6, .45)
    _rangee(rnd, occ, quai, .1, -1, out, 3, 6, .45)
    # remplissage : cœurs d'îlots denses intra-muros et au port (maisons tournées vers la place), comme une ville médiévale
    pts = [(x * .3, y * .3) for x in range(-100, 101) for y in range(-100, 101)]; rnd.shuffle(pts)
    for x, y in pts:
        z_ = zone(x, y)
        if z_ not in ('centre', 'ville', 'port') or obstacle(x, y): continue
        ang = math.atan2(PL[1] - y, PL[0] - x) if z_ != 'port' else math.atan2(BASSIN[1] - y, BASSIN[0] - x)
        (w0, w1), (d0, d1), (f0, f1), types = STYLE[z_]
        for tr in range(5):
            w = max(.85, (w0 + (w1 - w0) * rnd.random()) * (1 - .14 * tr)); dep = max(1.15, (d0 + (d1 - d0) * rnd.random()) * (1 - .12 * tr))
            corners = [(x + su * w / 2 * -math.sin(ang) + sv * dep / 2 * math.cos(ang), y + su * w / 2 * math.cos(ang) + sv * dep / 2 * math.sin(ang)) for su in (-1, 1) for sv in (-1, 1)]
            if all(not obstacle(qx, qy) for qx, qy in corners) and occ.libre(x, y, ang, w, dep):
                occ.prendre(x, y, ang, w, dep)
                out.append({'x': x, 'y': y, 'ang': ang, 'w': w * .985, 'd': dep, 'etages': rnd.randint(f0, f1), 'type': 'maison' if rnd.random() < .93 else 'maison_tour',
                            'zone': z_, 'niveau': tirer(rnd, NIVEAUX[z_]), 'loggia': False, 'altana': rnd.random() < .15, 'coeur': True})
                break
    return out


_OCC = None


def occupation_bati():
    global _OCC
    if _OCC is None:
        _OCC = Occupation()
        for b in batiments(): _OCC.prendre(b['x'], b['y'], b['ang'], b['w'] + .5, b['d'] + .5)
    return _OCC


def arbres(seed=23):
    rnd = random.Random(seed); out = []; occ = occupation_bati()
    for k in range(900):
        x, y = rnd.uniform(-33, 33), rnd.uniform(-33, 33); z_ = zone(x, y)
        if z_ not in ('campagne', 'colline', 'villa', 'faubourg') or obstacle(x, y) or dcoast(x, y) > .9 or not occ.libre(x, y, 0, 1.2, 1.2): continue
        if z_ == 'faubourg' and rnd.random() < .7: continue
        kind = 'olivier' if z_ in ('campagne', 'faubourg') and rnd.random() < .7 else ('pin' if rnd.random() < .45 else 'cypres')
        if z_ == 'colline': kind = 'pin' if rnd.random() < .5 else 'maquis'
        out.append((x, y, .75 + .4 * rnd.random(), kind, 1 if rnd.random() < .6 else 2))
    for k in range(14):                                                                     # allée de cyprès vers la villa [I]
        t = k / 13; x = VILLA[0] + 3.0 + t * 9.0; y = VILLA[1] + 4.0 + t * 7.5
        for s in (-1, 1): out.append((x + s * .7 * .64, y - s * .7 * .77, .95, 'cypres', 1))
    return out


def vignes():
    """rangs de vigne sur une trame de parcelles (3,3 × 2,5, tournée comme les champs) : (x, y, ang, longueur, type)"""
    rnd = random.Random(7); out = []; occ = occupation_bati(); a = .35
    for i in range(-12, 13):
        for j in range(-14, 15):
            u, v = (i + .5) * 3.3, (j + .5) * 2.5; x = u * math.cos(a) - v * math.sin(a); y = u * math.sin(a) + v * math.cos(a)
            if zone(x, y) != 'campagne' or obstacle(x, y) or dcoast(x, y) > .86 or not occ.libre(x, y, a, 2.6, 1.9): continue
            if rnd.random() < .5: out.append((x, y, a, 2.6, 'vigne'))
    return out


if __name__ == '__main__':
    from collections import Counter
    B = batiments(); print(len(B), 'bâtiments', dict(Counter(b['zone'] for b in B)), 'niveaux', dict(Counter(b['niveau'] for b in B)), dict(Counter(b['type'] for b in B)))
    print(len(arbres()), 'arbres ;', len(vignes()), 'vignes/champs')
