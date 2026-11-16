"""Arabasta — plan de masse et plan de production (île 6, méthode d'industrialisation, 16/11/2026).
Fiche canonique : art/data/fiches/arabasta.json. Source : One Piece Wiki, « Arabasta Kingdom » (consultée le 16/11/2026).
  [C] grande île désertique : le désert de Sandora couvre presque tout ce qui n'est pas près d'une oasis
  [C] le fleuve Sandora coule au centre et coupe le pays en deux (sens d'écoulement non précisé)
  [C] deux villes portuaires au sud et à l'est ; Nanohana (port principal, commerce, parfum, bâtiments hauts proches d'Alubarna)
  [C] Alubarna : bâtie sur un énorme rocher, escaliers taillés et pavés pour y entrer, ville très circulaire, palais royal blanc,
      place centrale devant le palais, tour de l'horloge haute ; tombeau royal boisé juste hors de la ville ; dômes sur les toits
  [C] Rainbase : ville prospère, casino en forme de pyramide, murs blancs « comme une ville américaine du XIXᵉ siècle »
  [C] Yuba : petite ville de bâtiments ronds coiffés de fines perches, aspect de terre, abandonnée à cause des tempêtes de sable
  [C] Katorea au nord-est de Nanohana (parfum) ; Erumalu, ancienne « ville verte » en ruines ; Suiren, ville asséchée
  [C] architecture égyptienne, moyen-orientale et mauresque, variable selon les villes
  [I] tout le placement : fleuve nord → sud un peu sinueux, Alubarna sur une mesa à l'est du fleuve, Rainbase à l'ouest,
      Nanohana au sud-est (ponton du jeu), port du sud à l'embouchure, Yuba à l'ouest, Erumalu au nord-ouest, Suiren au sud-ouest.
Différences voulues avec les autres îles : désert de dunes ocre, fleuve unique bordé de vert, capitale circulaire sur un rocher,
architecture de terre et de pierre blanche à toits plats et dômes, pyramide, villes aux styles différents (mauresque, western, terre).
Repère du jeu : x vers l'est, y vers le sud, z vers le haut ; centre de l'île = (0, 0).
"""
import json, math, os, random

ART = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
_d = json.load(open(os.path.join(ART, 'data', 'islands.json'), encoding='utf-8'))
ISL = [i for i in _d['iles'] if i['nom'] == 'Arabasta'][0]
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


# ---------------------------------------------------------------- éléments [C] placés [I]
FLEUVE = [(-1.0, -34.0), (-3.2, -25.0), (-.4, -17.0), (-2.8, -9.0), (-.8, -1.0), (-3.4, 7.0), (-.6, 15.0), (-1.6, 23.0), (.6, 34.0)]
FLEUVE_L, RIVE_L = 2.2, 3.4                      # lit du fleuve ; bande fertile de chaque côté
Z_D, Z_EAU = 2.2, .55
ALUBARNA = (13.0, -5.0, 8.2, 8.4)                # [C] sur un énorme rocher : centre, rayon du plateau, hauteur du sommet
PALAIS = (13.0, -5.8)                            # [C] palais royal blanc (centre-est du plateau)
PLACE = (13.0, -2.6, 1.3)                        # [C] place centrale devant le palais
HORLOGE = (11.0, -2.4)                           # [C] tour de l'horloge
ESCALIER_A = math.pi                             # [C] escaliers taillés : face ouest, vers le fleuve [I]
TOMBEAU = (20.5, -11.5, 3.2)                     # [C] tombeau royal boisé, juste hors de la ville [position I]
RAINBASE = (-13.0, -4.5, 4.4)                    # [C] Rainbase (position I)
CASINO = (-11.6, -6.0)                           # [C] casino en forme de pyramide
NANOHANA = (17.0, 15.5, 5.0)                     # [C] port principal au sud-est
KATOREA = (23.5, 6.0, 2.8)                       # [C] au nord-est de Nanohana
YUBA = (-22.0, 9.0, 3.4)                         # [C] ville ronde ensablée (position I)
ERUMALU = (-15.0, -20.0, 4.0)                    # [C] ruines de l'ancienne ville verte (position I)
SUIREN = (-13.0, 20.0, 3.4)                      # [C] ville asséchée (position I)
PORT_SUD = (4.0, 24.5, 2.8)                      # [C] second port au sud [nom non précisé, I]
MESAS = [(-24.0, -10.0, 3.2, 3.4), (7.0, -24.0, 2.8, 3.0), (25.0, -18.0, 2.6, 2.6), (-5.0, 27.0, 1.8, 1.4)]   # [I] rochers isolés
PONTON = None
OASIS = [(-6.0, -26.0, 1.7), (7.5, 9.5, 1.4), (-27.0, -2.0, 1.5)]                 # [C : le désert couvre tout « sauf près des oasis »] positions [I]
PISTES = [[(4.4, -5.0), (-.6, -5.6)], [(-3.6, -5.2), (-8.6, -5.0)], [(13.0, 3.3), (15.0, 10.5)], [(19.5, 13.0), (22.6, 8.4)],
          [(-15.0, -1.0), (-20.0, 6.0)], [(-14.0, -8.5), (-15.0, -16.0)], [(-1.0, 12.0), (-10.5, 18.0)], [(1.0, 18.0), (3.6, 22.0)], [(1.4, 12.0), (12.5, 13.5)]]   # pistes caravanières [I]


def oasis_at(x, y, m=0.0):
    return any(math.hypot(x - cx, y - cy) < rr + m for cx, cy, rr in OASIS)


def piste_at(x, y):
    return any(poly_dist(x, y, p) < .45 for p in PISTES)


def fleuve_d(x, y): return poly_dist(x, y, FLEUVE)


def alubarna_d(x, y): return math.hypot(x - ALUBARNA[0], y - ALUBARNA[1]) / ALUBARNA[2]


def dunes(x, y):
    u = x * .82 + y * .57; v = -x * .57 + y * .82
    return .75 * (abs(math.sin(u * .42 + math.sin(v * .21) * 1.3)) - .5) + .35 * math.sin(v * .33 + u * .07)


def height(x, y):
    r, th, q = pol(x, y)
    if q >= 1: return -1.3 * ss(1, 1.1, q) - .05
    h = Z_D + dunes(x, y)
    fd = fleuve_d(x, y)
    h = h + (Z_D - .8 - h) * ss(FLEUVE_L / 2 + RIVE_L + 1.2, FLEUVE_L / 2 + RIVE_L * .4, fd)              # plaine fertile du fleuve
    if fd < FLEUVE_L / 2 + .5: h = min(h, Z_EAU - .5)
    for cx, cy, rr, hh in MESAS:
        d = math.hypot(x - cx, y - cy) / rr
        if d < 1.3: h = max(h, Z_D + hh * ss(1.25, .85, d))
    d = alubarna_d(x, y)                                                                                    # le rocher d'Alubarna
    if d < 1.35: h = max(h, ALUBARNA[3] * ss(1.3, 1.0, d) + Z_D * (1 - ss(1.3, 1.0, d)) + .15 * math.sin(x * 2 + y))
    if 1.0 < d < 1.33 and angd(math.atan2(y - ALUBARNA[1], x - ALUBARNA[0]), ESCALIER_A) < .13:          # rampe des escaliers taillés
        t = (d - 1.0) / .33; h = ALUBARNA[3] * (1 - t) + (Z_D - .4) * t
    h -= (h - .25) * ss(.88, 1.0, q)                                                                       # plage
    if fd < FLEUVE_L / 2 + .5 and q > .9: h = min(h, -.3)
    for cx, cy, rr in OASIS:
        d = math.hypot(x - cx, y - cy) / rr
        if d < 2.2: h = h + (Z_D - .6 - h) * ss(2.2, 1.2, d)
        if d < 1: h = min(h, Z_D - 1.1)
    return h


def water_at(x, y):
    r, th, q = pol(x, y)
    if q >= 1: return None
    if fleuve_d(x, y) < FLEUVE_L / 2: return Z_EAU * (1 - ss(.75, 1.0, q)) + .05
    if oasis_at(x, y, -.1): return Z_D - .75
    return None


def zone(x, y):
    r, th, q = pol(x, y)
    if q >= 1: return 'mer'
    if alubarna_d(x, y) < .96: return 'alubarna'
    if alubarna_d(x, y) < 1.32: return 'rocher'
    for nm, (cx, cy, rr) in (('nanohana', NANOHANA), ('katorea', KATOREA), ('rainbase', RAINBASE), ('yuba', YUBA), ('erumalu', ERUMALU), ('suiren', SUIREN), ('port_sud', PORT_SUD)):
        if math.hypot(x - cx, y - cy) < rr: return nm
    if math.hypot(x - TOMBEAU[0], y - TOMBEAU[1]) < TOMBEAU[2]: return 'tombeau'
    if oasis_at(x, y, 1.6): return 'oasis'
    if fleuve_d(x, y) < FLEUVE_L / 2 + RIVE_L: return 'rive'
    if q > .92: return 'plage'
    return 'desert'


def pente(x, y):
    e = .35; return math.hypot(height(x + e, y) - height(x - e, y), height(x, y + e) - height(x, y - e)) / (2 * e)


def obstacle(x, y, pmax=.9):
    r, th, q = pol(x, y)
    if q > .9: return True
    if fleuve_d(x, y) < FLEUVE_L / 2 + .55 or oasis_at(x, y, .4): return True
    if math.hypot(x - PALAIS[0], y - PALAIS[1]) < 2.3 or math.hypot(x - HORLOGE[0], y - HORLOGE[1]) < 1.1 or math.hypot(x - PLACE[0], y - PLACE[1]) < PLACE[2]: return True
    if math.hypot(x - CASINO[0], y - CASINO[1]) < 2.3: return True
    d = alubarna_d(x, y)
    if .94 < d < 1.4: return True                                                                          # bord du rocher et falaise
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


def batiments(seed=1305):
    rnd = random.Random(seed); occ = Occupation(); out = []
    ax, ay, ar, ah = ALUBARNA
    # Alubarna [C] : ville très circulaire sur le rocher → anneaux de maisons tournées vers le centre, rues rayonnantes [I]
    for ring, (rr, lv) in enumerate(((3.3, 1), (4.5, 1), (5.7, 1), (6.9, 2))):
        n = int(TAU * rr / 1.42)
        for k in range(n):
            a = k / n * TAU + ring * .17
            if any(angd(a, b) * rr < .55 for b in (0, math.pi / 2, math.pi, -math.pi / 2)): continue      # 4 rues rayonnantes
            x, y = ax + math.cos(a) * rr, ay + math.sin(a) * rr
            _place(occ, out, x, y, a + math.pi, 1.05 + .2 * rnd.random(), .9 + .15 * rnd.random(), type='alubarna', zone='alubarna',
                   niveau=lv if rnd.random() < .85 else min(3, lv + 1), etages=1 + (rnd.random() < .45), dome=rnd.random() < .22)
    towns = [  # (zone, centre, n, type, niveaux, tailles)
        ('nanohana', NANOHANA, 46, 'nanohana', (1, 1, 1, 2, 2, 3)), ('katorea', KATOREA, 16, 'terre', (2, 2, 3)), ('rainbase', RAINBASE, 30, 'rainbase', (1, 1, 2, 2, 3)),
        ('yuba', YUBA, 14, 'yuba', (1, 1, 2)), ('port_sud', PORT_SUD, 16, 'terre', (1, 2, 2, 3)), ('suiren', SUIREN, 10, 'ruine', (1,)), ('erumalu', ERUMALU, 14, 'ruine', (1,))]
    for z_, (cx, cy, rr), n, typ, lvls in towns:
        k = 0; tries = 0
        while k < n and tries < 2000:
            tries += 1; a = rnd.uniform(0, TAU); d = rr * math.sqrt(rnd.random()); x, y = cx + math.cos(a) * d, cy + math.sin(a) * d
            if typ == 'rainbase':                                                                      # trame orthogonale (ville « américaine ») [C]
                x = cx + round((x - cx) / 1.6) * 1.6; ang = 0 if round((y - cy) / 1.6) % 2 else math.pi; y = cy + round((y - cy) / 1.6) * 1.6
            else: ang = math.atan2(cy - y, cx - x) + rnd.uniform(-.4, .4)
            w, dd = ((.95, .95) if typ == 'yuba' else (1.0 + .5 * rnd.random(), 1.0 + .4 * rnd.random()))
            if _place(occ, out, x, y, ang, w, dd, type=typ, zone=z_, niveau=rnd.choice(lvls), etages=(2 if typ in ('nanohana',) and rnd.random() < .5 else 1), dome=typ == 'nanohana' and rnd.random() < .25): k += 1
    for k in range(40):                                                                                  # villages des rives (terre crue) [I]
        t = rnd.random(); seg = min(len(FLEUVE) - 2, int(t * (len(FLEUVE) - 1))); f = t * (len(FLEUVE) - 1) - seg
        (ax_, ay_), (bx_, by_) = FLEUVE[seg], FLEUVE[seg + 1]; px, py = ax_ + (bx_ - ax_) * f, ay_ + (by_ - ay_) * f
        side = rnd.choice((-1, 1)); x, y = px + side * (FLEUVE_L / 2 + 1.2 + rnd.random() * 2.2), py
        if zone(x, y) == 'rive': _place(occ, out, x, y, math.pi if side > 0 else 0, 1.0 + .3 * rnd.random(), 1.0 + .3 * rnd.random(), type='terre', zone='rive', niveau=rnd.choice((2, 2, 3)), etages=1, dome=False)
    return out


def arbres(seed=37):
    rnd = random.Random(seed); out = []; occ = Occupation()
    for b in batiments(): occ.prendre(b['x'], b['y'], b['ang'], b['w'] + .4, b['d'] + .4)
    for k in range(3000):
        x, y = rnd.uniform(-35, 35), rnd.uniform(-35, 35); z_ = zone(x, y)
        if z_ in ('mer', 'plage') or water_at(x, y) is not None or fleuve_d(x, y) < FLEUVE_L / 2 + .3 or not occ.libre(x, y, 0, .8, .8): continue
        dens = {'oasis': .9, 'rive': .5, 'tombeau': .9, 'nanohana': .12, 'katorea': .35, 'rainbase': .08, 'port_sud': .15, 'alubarna': .05, 'erumalu': .25, 'desert': .006}.get(z_, 0)
        if rnd.random() > dens: continue
        if z_ == 'alubarna' and obstacle(x, y): continue
        kind = 'mort' if z_ == 'erumalu' else ('palmier' if rnd.random() < .8 else 'buisson')
        out.append((x, y, .8 + .4 * rnd.random(), kind, 1 if rnd.random() < .7 else 2)); occ.prendre(x, y, 0, .7, .7)
    return out


def champs():
    """parcelles irriguées le long du fleuve [I] : (x, y, ang, w, d)"""
    rnd = random.Random(5); out = []; occ = Occupation()
    for b in batiments(): occ.prendre(b['x'], b['y'], b['ang'], b['w'] + .3, b['d'] + .3)
    for k in range(400):
        t = rnd.random(); seg = min(len(FLEUVE) - 2, int(t * (len(FLEUVE) - 1))); f = t * (len(FLEUVE) - 1) - seg
        (ax_, ay_), (bx_, by_) = FLEUVE[seg], FLEUVE[seg + 1]; px, py = ax_ + (bx_ - ax_) * f, ay_ + (by_ - ay_) * f
        side = rnd.choice((-1, 1)); x, y = px + side * (FLEUVE_L / 2 + .9 + rnd.random() * (RIVE_L - .8)), py
        if zone(x, y) != 'rive' or not occ.libre(x, y, 0, 1.1, 1.0): continue
        occ.prendre(x, y, 0, 1.0, .9); out.append((x, y, 0, 1.0, .9))
    return out


if __name__ == '__main__':
    from collections import Counter
    B = batiments(); print(len(B), 'bâtiments', dict(Counter(b['zone'] for b in B)), 'niveaux', dict(Counter(b['niveau'] for b in B)))
    A = arbres(); print(len(A), 'arbres', dict(Counter(a[3] for a in A)), '·', len(champs()), 'champs')
