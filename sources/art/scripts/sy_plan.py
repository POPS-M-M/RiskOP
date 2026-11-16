"""Syrup — plan de masse et plan de production (île 7, méthode d'industrialisation, 16/11/2026).
Fiche canonique : art/data/fiches/syrup.json. Sources (consultées le 16/11/2026) :
  One Piece Wiki, « Syrup Village » et « Gecko Islands » ; One Place (site de fans), « Syrup Village ».
  [C] le village est sur les îles Gecko ; deux pentes, de part et d'autre de l'île, sont les seuls accès au village
  [C] de hautes falaises bordent tout le reste de l'île
  [C] pentes au nord et au sud, à environ trois minutes à pied l'une de l'autre (One Place)
  [C] village inspiré des villages anglais (Rurubu One Piece, cité par le One Piece Wiki)
  [C] maisons modestes ; grand manoir élégant de Kaya au sommet d'une colline, au-dessus du village, domaine clôturé et gardé (One Place)
  [C] prairies ondulées, chemins de terre, collines et forêts (One Place) ; une forêt et une colline remarquable (One Piece Wiki)
  [C] Meshi, un restaurant du village (One Piece Wiki)
  [C?] manoir aux murs clairs et toits rouges (de mémoire, non vérifié)
  [I] tout le placement : pente nord au nord-ouest, pente sud au sud, colline du manoir au nord-est, village au centre-ouest,
      forêt à l'ouest, champs et haies à l'est et au sud, ruisseau et cascade sur la falaise est, chapelle, fermes, phare.
Différences voulues avec les autres îles : plateau vert entouré de falaises (pas de port ouvert), deux criques au pied des pentes,
cottages de pierre à toits de chaume ou d'ardoise, maisons à colombages, manoir géorgien clôturé, haies et murets, chênes.
Repère du jeu : x vers l'est, y vers le sud, z vers le haut ; centre de l'île = (0, 0).
"""
import json, math, os, random

ART = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
_d = json.load(open(os.path.join(ART, 'data', 'islands.json'), encoding='utf-8'))
ISL = [i for i in _d['iles'] if i['nom'] == 'Syrup'][0]
COAST = [(ISL['cote3d'][k], ISL['cote3d'][k + 1]) for k in range(0, len(ISL['cote3d']), 2)]
R = ISL['rayon']; TAU = 2 * math.pi; D = math.radians


def coast_r(th):
    B = len(COAST); f = ((th + math.pi) / TAU) * B; i = int(math.floor(f)) % B; j = (i + 1) % B; k = f - math.floor(f)
    return math.hypot(*COAST[i]) + (math.hypot(*COAST[j]) - math.hypot(*COAST[i])) * k


def ss(a, b, x):
    t = max(0.0, min(1.0, (x - a) / (b - a))); return t * t * (3 - 2 * t)


def angd(a, b): return abs((a - b + math.pi) % TAU - math.pi)


def pol(x, y):
    r = math.hypot(x, y); th = math.atan2(y, x); return r, th, r / coast_r(th)


def dcoast(x, y): return pol(x, y)[2]


def seg_dist(px, py, ax, ay, bx, by):
    vx, vy = bx - ax, by - ay; L2 = vx * vx + vy * vy
    t = 0 if L2 < 1e-9 else max(0, min(1, ((px - ax) * vx + (py - ay) * vy) / L2))
    return math.hypot(px - ax - t * vx, py - ay - t * vy), t


def poly_dist(px, py, pts): return min(seg_dist(px, py, *a, *b)[0] for a, b in zip(pts, pts[1:]))


def at_coast(a, k): r = coast_r(a) * k; return (math.cos(a) * r, math.sin(a) * r)


# ---------------------------------------------------------------- éléments [C] placés [I]
Z_P = 3.4                                         # plateau au-dessus des falaises [C : hautes falaises]
PENTE_N, PENTE_S = D(-108), D(84)                 # [C] deux pentes de part et d'autre de l'île (nord et sud)
PENTE_W = .17                                     # demi-largeur angulaire d'une pente (rad)
COLLINE = (9.5, -14.5, 7.0, 8.6)                  # [C] colline du manoir au-dessus du village : centre, rayon, hauteur du sommet
MANOIR = (9.5, -15.0)                             # [C] manoir de Kaya au sommet [aspect I / C?]
DOMAINE_R = 4.3                                   # [C] domaine clôturé
VILLAGE = (-5.0, 2.5, 7.5)                        # [C] village (centre, rayon) [position I]
GREEN = (-5.2, 1.6, 1.7)                          # [I] pré communal avec puits et grand chêne
MESHI = (-2.4, 4.6)                               # [C] restaurant Meshi, face au pré [I]
CHAPELLE = (-10.5, -1.0)                          # [I] chapelle de pierre (village anglais)
FORET = [(-19.0, -6.0, 8.5), (-15.0, 9.0, 7.0), (-9.0, -19.0, 5.5)]   # [C : une forêt] positions [I]
PHARE = D(-160)                                   # [I] phare sur le cap ouest (niveau 4)
RUISSEAU = [(5.0, -8.6), (9.0, -6.0), (13.5, -4.5), (18.0, -2.0), (22.5, .5), (27.5, 1.6), (32.0, 2.1)]    # [I] ruisseau, cascade dans la falaise est
FERMES = [(14.0, 8.0), (-14.5, 18.5), (19.0, -10.0), (4.0, 15.0), (-21.0, 4.5)]                # [I] fermes isolées


def crique(a): return at_coast(a, .97)


CN, CS = crique(PENTE_N), crique(PENTE_S)
HAUT_N, HAUT_S = at_coast(PENTE_N, .62), at_coast(PENTE_S, .62)
CHEMINS = [  # chemins de terre [C], tracés [I]
    [CN, at_coast(PENTE_N, .8), HAUT_N, (-6.0, -8.0), (-5.0, -1.0)],                  # pente nord → village
    [CS, at_coast(PENTE_S, .8), HAUT_S, (1.0, 11.0), (-3.0, 6.5)],                    # pente sud → village
    [(-2.0, 0.0), (2.5, -4.0), (5.0, -8.0), (7.4, -11.2)],                           # village → grille du domaine
    [(-5.0, -1.0), (-9.0, -1.2), CHAPELLE],                                           # vers la chapelle
    [(-1.0, 4.0), (6.0, 5.0), (12.0, 7.0), FERMES[0]],                                # vers la ferme de l'est
    [(-8.0, 6.5), (-11.0, 12.0), FERMES[1]],                                          # vers la ferme du sud-ouest
    [(6.0, 5.0), (5.0, 11.0), FERMES[3]],
    [(-12.0, 2.0), (-17.0, 3.5), FERMES[4]],
    [(12.0, -9.0), (16.0, -10.0), FERMES[2]]]


def chemin_d(x, y): return min(poly_dist(x, y, c) for c in CHEMINS)


def ruisseau_d(x, y): return poly_dist(x, y, RUISSEAU)


def pente_t(x, y):
    """0 hors des pentes ; sinon 1 au centre de la pente nord ou sud"""
    r, th, q = pol(x, y); best = 0
    for a in (PENTE_N, PENTE_S):
        d = angd(th, a)
        if d < PENTE_W * 1.6 and q > .55: best = max(best, ss(PENTE_W * 1.6, PENTE_W * .6, d))
    return best


def colline_d(x, y): return math.hypot(x - COLLINE[0], y - COLLINE[1]) / COLLINE[2]


def ondul(x, y): return .55 * math.sin(x * .19 + math.sin(y * .13) * 1.6) * math.cos(y * .17 - .4) + .25 * math.sin(x * .41 + y * .33)


def height(x, y):
    r, th, q = pol(x, y)
    if q >= 1: return -1.4 * ss(1, 1.1, q) - .1
    h = Z_P + ondul(x, y) * ss(.92, .6, q)                                     # prairies ondulées [C]
    d = colline_d(x, y)
    if d < 1.4: h = max(h, Z_P + (COLLINE[3] - Z_P) * (1 - ss(0.0, 1.35, d)) ** 1.15)
    hm = math.hypot(x - MANOIR[0], y - MANOIR[1])
    if hm < 3.2: h = h + (COLLINE[3] - h) * ss(3.2, 2.2, hm)                  # sommet aplani pour le manoir
    cliff = ss(.955, .99, q)                                                    # hautes falaises [C]
    h = h * (1 - cliff) + (-.6) * cliff
    t = pente_t(x, y)                                                           # deux pentes [C] : rampe du plateau à la plage
    if t > 0:
        ramp = Z_P * ss(.97, .62, q) + .25
        h = h * (1 - t) + ramp * t
    rd = ruisseau_d(x, y)
    if rd < .9 and q < .985: h -= .45 * ss(.9, .2, rd)                          # lit du ruisseau (entaille jusqu'au bord de la falaise)
    return h


def water_at(x, y):
    r, th, q = pol(x, y)
    if q >= 1 or q > .975: return None
    if ruisseau_d(x, y) < .32: return height(x, y) + .12
    return None


def zone(x, y):
    r, th, q = pol(x, y)
    if q >= 1: return 'mer'
    t = pente_t(x, y)
    if t > .5 and q > .88: return 'crique'
    if q > .955: return 'falaise'
    if math.hypot(x - MANOIR[0], y - MANOIR[1]) < DOMAINE_R: return 'domaine'
    if colline_d(x, y) < 1.0: return 'colline'
    if math.hypot(x - VILLAGE[0], y - VILLAGE[1]) < VILLAGE[2]: return 'village'
    for cx, cy, rr in FORET:
        if math.hypot(x - cx, y - cy) < rr * (1 + .12 * math.sin(math.atan2(y - cy, x - cx) * 3 + cx)): return 'foret'
    return 'pres'


FC, FS, FU, FV = math.cos(.3), math.sin(.3), 3.6, 2.8      # parcellaire : grille tournée, rangées décalées (comme des briques)


def _uv(x, y): return x * FC + y * FS, -x * FS + y * FC
def _xy(u, v): return u * FC - v * FS, u * FS + v * FC
def _off(iv): return (iv * .37) % 1.0


def _cell(x, y):
    u, v = _uv(x, y); iv = int(math.floor(v / FV)); iu = int(math.floor(u / FU - _off(iv))); return iu, iv


def champ_of(x, y):
    """parcelle agricole (indice) ; None hors des prés cultivés de l'est et du sud [I]"""
    if zone(x, y) != 'pres' or not (x > 1 or y > 9): return None
    return _cell(x, y)


def _skip(iu, iv, k): return ((iu * 73856093) ^ (iv * 19349663) ^ (k * 83492791)) % 10 < 3     # 30 % des haies absentes (champs ouverts)


def haies_segments():
    """segments de haies vives [C : village anglais] entre les parcelles : ((xa, ya), (xb, yb))"""
    out = []
    for iv in range(-16, 16):
        o = _off(iv)
        for iu in range(-14, 14):
            u0, u1, v0, v1 = (iu + o) * FU, (iu + 1 + o) * FU, iv * FV, (iv + 1) * FV
            for k, (a, b) in enumerate((((u0, v0), (u0, v1)), ((u0, v0), (u1, v0)))):
                if _skip(iu, iv, k): continue
                xa, ya = _xy(*a); xb, yb = _xy(*b); xm, ym = (xa + xb) / 2, (ya + yb) / 2
                if champ_of(xm + .3, ym + .3) is None and champ_of(xm - .3, ym - .3) is None: continue
                out.append(((xa, ya), (xb, yb)))
    return out


def haie_at(x, y):
    if champ_of(x, y) is None: return False
    u, v = _uv(x, y); iv = int(math.floor(v / FV)); fu = (u / FU - _off(iv)) % 1; fv = (v / FV) % 1
    iu = int(math.floor(u / FU - _off(iv)))
    return (fu < .05 and not _skip(iu, iv, 0)) or (fv < .06 and not _skip(iu, iv, 1))


def pente(x, y):
    e = .35; return math.hypot(height(x + e, y) - height(x - e, y), height(x, y + e) - height(x, y - e)) / (2 * e)


def obstacle(x, y, pmax=.75):
    r, th, q = pol(x, y)
    if q > .93: return True
    if chemin_d(x, y) < .55 or ruisseau_d(x, y) < .9: return True
    if math.hypot(x - MANOIR[0], y - MANOIR[1]) < DOMAINE_R + .4: return True
    if math.hypot(x - GREEN[0], y - GREEN[1]) < GREEN[2] + .3: return True
    if math.hypot(x - CHAPELLE[0], y - CHAPELLE[1]) < 1.9 or math.hypot(x - MESHI[0], y - MESHI[1]) < 1.3: return True
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


def batiments(seed=731):
    rnd = random.Random(seed); occ = Occupation(); out = []
    vx, vy, vr = VILLAGE
    # village [C] : maisons modestes le long des chemins, façades tournées vers le chemin [I] ; niveau 1 au cœur, 2-3 vers l'extérieur
    for ci, c in enumerate(CHEMINS):
        for x, y, a in _chemin_pts(c, .55):
            dv = math.hypot(x - vx, y - vy)
            if dv > vr + 4.5: continue
            for side in (-1, 1):
                if rnd.random() < .25: continue
                off = 1.15 + .25 * rnd.random(); px, py = x + math.cos(a + side * math.pi / 2) * off, y + math.sin(a + side * math.pi / 2) * off
                lv = 1 if dv < vr + .8 else (2 if dv < vr + 2.6 else 3)
                typ = 'colombage' if (dv < vr * .8 and rnd.random() < .35) else 'cottage'
                w, d = (1.05 + .35 * rnd.random(), .85 + .2 * rnd.random()) if typ == 'cottage' else (1.1 + .3 * rnd.random(), .95 + .15 * rnd.random())
                _place(occ, out, px, py, a + side * math.pi / 2 + math.pi, w, d, type=typ, zone='village', niveau=lv if rnd.random() < .85 else min(4, lv + 1),
                       toit=('chaume' if rnd.random() < .55 else 'ardoise') if typ == 'cottage' else 'tuile')
    # remplissage autour du pré communal (niveau 1 dense, lisible au zoom du jeu)
    for k in range(4000):
        a = rnd.uniform(0, TAU); d = (vr + 1.0) * math.sqrt(rnd.random()); x, y = vx + math.cos(a) * d, vy + math.sin(a) * d
        lv = 1 if d < vr + .6 else 2
        col = d < vr * .8 and rnd.random() < .35
        _place(occ, out, x, y, math.atan2(GREEN[1] - y, GREEN[0] - x) + rnd.uniform(-.3, .3), (1.15 if col else 1.0) + .3 * rnd.random(), .85 + .2 * rnd.random(),
               type='colombage' if col else 'cottage', zone='village', niveau=lv, toit='tuile' if col else ('chaume' if rnd.random() < .5 else 'ardoise'))
    # fermes isolées [I] : corps de ferme + grange, niveau 1 (2 et 3 pour les plus lointaines)
    for i, (fx, fy) in enumerate(FERMES):
        lv = (1, 2, 1, 2, 3)[i]; ok = 0
        for k in range(60):                                           # autour du bout du chemin, sans le recouvrir
            a = rnd.uniform(0, TAU); dd = 1.3 + 1.5 * rnd.random(); x, y = fx + math.cos(a) * dd, fy + math.sin(a) * dd
            if _place(occ, out, x, y, math.atan2(fy - y, fx - x), 1.4, 1.0, type='ferme', zone='pres', niveau=lv, toit='chaume'): ok = 1; break
        for k in range(60):
            a = rnd.uniform(0, TAU); dd = 2.0 + 1.8 * rnd.random(); x, y = fx + math.cos(a) * dd, fy + math.sin(a) * dd
            if _place(occ, out, x, y, math.atan2(fy - y, fx - x), 2.0, 1.25, type='grange', zone='pres', niveau=lv, toit='ardoise'): break
    # hameaux du niveau 3-4 le long des chemins extérieurs [I]
    for x, y, a in _chemin_pts(CHEMINS[4] + CHEMINS[5][1:], .9):
        if math.hypot(x - vx, y - vy) < vr + 4: continue
        if rnd.random() < .45:
            side = rnd.choice((-1, 1)); px, py = x + math.cos(a + side * math.pi / 2) * 1.3, y + math.sin(a + side * math.pi / 2) * 1.3
            _place(occ, out, px, py, a + side * math.pi / 2 + math.pi, 1.0, .85, type='cottage', zone='pres', niveau=rnd.choice((3, 3, 4)), toit='chaume')
    return out


def arbres(seed=17):
    rnd = random.Random(seed); out = []; occ = Occupation()
    for b in batiments(): occ.prendre(b['x'], b['y'], b['ang'], b['w'] + .5, b['d'] + .5)
    occ.prendre(MANOIR[0], MANOIR[1], 0, 5.4, 3.6)
    for k in range(14000):
        x, y = rnd.uniform(-33, 33), rnd.uniform(-33, 33); z_ = zone(x, y)
        if z_ in ('mer', 'crique', 'falaise') or chemin_d(x, y) < .6 or ruisseau_d(x, y) < .5 or not occ.libre(x, y, 0, .8, .8): continue
        dens = {'foret': .75, 'colline': .12, 'domaine': .16, 'village': .06, 'pres': .035}.get(z_, 0)
        if champ_of(x, y) is not None and not haie_at(x, y): dens = .004
        if rnd.random() > dens: continue
        kind = 'chene' if rnd.random() < (.75 if z_ == 'foret' else .9) else 'hetre'
        lv = 1 if z_ in ('foret', 'domaine', 'colline') or rnd.random() < .6 else 2
        out.append((x, y, .85 + .45 * rnd.random(), kind, lv)); occ.prendre(x, y, 0, .75, .75)
    return out


if __name__ == '__main__':
    from collections import Counter
    B = batiments(); print(len(B), 'bâtiments', dict(Counter(b['type'] for b in B)), 'niveaux', dict(Counter(b['niveau'] for b in B)))
    A = arbres(); print(len(A), 'arbres', dict(Counter(a[3] for a in A)))
    print('pentes', [tuple(round(v, 1) for v in p) for p in (CN, CS, HAUT_N, HAUT_S)], 'z manoir', round(height(*MANOIR), 2), 'z village', round(height(VILLAGE[0], VILLAGE[1]), 2))
