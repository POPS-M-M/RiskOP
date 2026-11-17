"""Wano — plan de masse et plan de production (île 5, méthode d'industrialisation, 16/11/2026).
Fiche canonique : art/data/fiches/wano.json. Source principale : One Piece Wiki, « Wano Country » (consultée le 16/11/2026).
  [C] pays en cuvette : centre et bords en plateaux surélevés, l'entre-deux descend près du niveau de la mer et se remplit d'eau de pluie
  [C] murs de roche (bâtis) tout autour ; l'eau douce sort par des cascades vers la mer, tourbillons au pied
  [C] accès : cascade remontée par des carpes géantes (non représentées) ou tunnel derrière une cascade vers le port de Mogura, télécabine
  [C] une rivière divise le pays en six régions : Capitale des Fleurs (centre, mont Fuji, Ebisu, cerisiers), Kuri (sud, château
      d'Oden détruit sur une montagne, ville de Bakura au pied), Ringo (nord, froid et neige, cimetière du nord, pont Oihagi),
      Udon (sud-est, mine détruite, végétation luxuriante), Hakumai (nord-est, structures délabrées, ports de Mogura et Habu,
      climat d'automne), Kibi (ouest, terres désolées, usines sur des formations rocheuses, port de Neko)
  [C?] château du shogun dans la Capitale des Fleurs ; grand torii de Kuri (programme du 15/11, à revérifier)
  [I] état représenté : après le conflit (Udon reverdie) ; rivière = anneau autour de la capitale + 5 bras rayonnants qui sortent
      par 5 cascades ; positions ; échelle (rayon ≈ 33) ; télécabine et port de Mogura au nord-est (vers les voisines de la carte).
Différences voulues avec Water 7 et Loguetown : relief en cuvette fermée par des murs de roche, cascades vers la mer, six régions
aux climats différents (neige, automne, friche, forêt), architecture japonaise en bois et toits de tuiles grises, château à étages.
Repère du jeu : x vers l'est, y vers le sud, z vers le haut ; centre de l'île = (0, 0).
"""
import json, math, os, random

ART = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
_d = json.load(open(os.path.join(ART, 'data', 'islands.json'), encoding='utf-8'))
ISL = [i for i in _d['iles'] if i['nom'] == 'Wano'][0]
COAST = [(ISL['cote3d'][k], ISL['cote3d'][k + 1]) for k in range(0, len(ISL['cote3d']), 2)]
R = ISL['rayon']; TAU = 2 * math.pi
D = math.radians


def coast_r(th):
    B = len(COAST); f = ((th + math.pi) / TAU) * B; i = int(math.floor(f)) % B; j = (i + 1) % B; k = f - math.floor(f)
    return math.hypot(*COAST[i]) + (math.hypot(*COAST[j]) - math.hypot(*COAST[i])) * k


def ss(a, b, x):
    t = max(0.0, min(1.0, (x - a) / (b - a))); return t * t * (3 - 2 * t)


def angd(a, b):
    return abs((a - b + math.pi) % TAU - math.pi)


def pol(x, y):
    r = math.hypot(x, y); th = math.atan2(y, x); return r, th, r / coast_r(th)


def dcoast(x, y):
    return pol(x, y)[2]


def seg_dist(px, py, ax, ay, bx, by):
    vx, vy = bx - ax, by - ay; L2 = vx * vx + vy * vy
    t = 0 if L2 < 1e-9 else max(0, min(1, ((px - ax) * vx + (py - ay) * vy) / L2))
    return math.hypot(px - ax - t * vx, py - ay - t * vy), t


def poly_dist(px, py, pts):
    return min(seg_dist(px, py, *a, *b)[0] for a, b in zip(pts, pts[1:]))


def at_q(q, phi):
    r = q * coast_r(phi); return math.cos(phi) * r, math.sin(phi) * r


# ---------------------------------------------------------------- niveaux et grandes lignes [I]
Z_CAP, Z_LOW, Z_EAU, Z_MUR = 8.6, 5.6, 5.0, 11.4
Q_CAP, Q_ANNEAU, Q_MUR0, Q_MUR1, Q_FAL = .39, .455, .80, .87, .955
RIVIERES = [D(-125), D(-65), D(-5), D(65), D(130)]                # bras rayonnants (frontières des régions) → cascades
RIV_L, ANNEAU_L = 1.5, 1.7
ROUTES = {'ringo': D(-95), 'hakumai': D(-35), 'udon': D(30), 'kuri': D(97), 'kibi': D(180)}   # routes et ponts depuis la capitale
FUJI = (-8.6, -9.6, 6.2, 23.5)                                      # [C] mont Fuji dans la Capitale des Fleurs : x, y, rayon de base, sommet
CHATEAU = (7.6, -2.6)                                               # [C?] château du shogun ; position [I]
PAGODE = (-2.0, 6.2)                                                # pagode (niveau 4) [I]
EBISU = (-8.5, 4.0, 3.6)                                            # [C] Ebisu (quartier pauvre de la capitale) : centre, rayon [position I]
ODEN = (D(100), .65, 4.6, 6.0)                                      # [C] montagne du château d'Oden (Kuri) : angle, q, rayon, hauteur au-dessus de la plaine
BAKURA = (D(83), .60)                                               # [C] ville de Bakura au pied de la montagne
TORII_KURI = (D(114), .53)                                          # [C?] grand torii de Kuri
CIMETIERE = (D(-95), .65, 2.8)                                      # [C] cimetière du nord (Ringo), sur un plateau entouré d'une gorge
GORGE_L = 1.3
MINE = (D(28), .64, 2.4)                                            # [C] mine détruite d'Udon (fosse envahie par la végétation)
MOGURA = (D(-38), .985)                                             # [C] port de Mogura (tunnel derrière une cascade) au pied du mur nord-est [I]
KIBI_ROCS = [(D(148), .60, 2.0, 5.2), (D(166), .70, 1.8, 4.6), (D(185), .58, 2.2, 5.6), (D(204), .69, 1.9, 4.8), (D(222), .60, 1.7, 4.2), (D(178), .76, 1.5, 4.0)]   # [C] formations rocheuses de Kibi
RIZIERES = [(D(45), .58, 2.6), (D(-20), .58, 2.4), (D(130), .72, 2.0)]   # [I] rizières inondées dans les basses terres (eau de pluie [C])
PONTON = None                                                       # posé au port de Mogura (voir plus bas)


def region(phi):
    a = math.degrees(phi)
    if -125 <= a < -65: return 'ringo'
    if -65 <= a < -5: return 'hakumai'
    if -5 <= a < 65: return 'udon'
    if 65 <= a < 130: return 'kuri'
    return 'kibi'


def riviere_at(x, y, m=0.0):
    r, th, q = pol(x, y)
    if abs(q - Q_ANNEAU) * coast_r(th) < ANNEAU_L / 2 + m: return 'anneau'
    if q > Q_ANNEAU:
        for a in RIVIERES:
            if angd(th, a) * r < RIV_L / 2 + m: return 'bras'
    return None


def cascade_at(x, y):
    r, th, q = pol(x, y)
    return q > Q_FAL - .02 and any(angd(th, a) * r < RIV_L / 2 + .2 for a in RIVIERES)


def gorge_at(x, y):
    a, q, rr = CIMETIERE; cx, cy = at_q(q, a); d = math.hypot(x - cx, y - cy)
    return rr < d < rr + GORGE_L


def mogura_at(x, y):
    a, q = MOGURA; r, th, qq = pol(x, y)
    return angd(th, a) * r < 2.6 and qq > .9


def roc_h(x, y):
    h = 0.0
    for a, q, rr, hh in KIBI_ROCS:
        cx, cy = at_q(q, a); d = math.hypot(x - cx, y - cy) / rr
        if d < 1.25: h = max(h, hh * ss(1.25, .92, d))
    return h


def height(x, y):
    r, th, q = pol(x, y)
    if q >= 1: return -1.5 * ss(1, 1.1, q) - .05
    reg = region(th)
    n1 = math.sin(x * .9 + y * .4) * math.cos(y * .8 - x * .3); n2 = math.sin(x * 2.3 - y * 1.7) * .5
    low = Z_LOW + .35 * n1
    if reg == 'ringo': low += .5 + .4 * n1
    if reg == 'kuri':
        a, qq, rr, hh = ODEN; cx, cy = at_q(qq, a); d = math.hypot(x - cx, y - cy) / rr
        low += hh * ss(1.2, .25, d) + .3 * n2 * ss(1.2, .5, d)
    if reg == 'kibi': low += roc_h(x, y)
    h = Z_CAP + .2 * n1 if q < Q_CAP else low + (Z_CAP - low) * ss(Q_CAP + .045, Q_CAP, q)
    fx, fy, fr, fh = FUJI; d = math.hypot(x - fx, y - fy) / fr
    if d < 1.15: h = max(h, Z_CAP + (fh - Z_CAP) * (1 - min(1, d)) ** 1.55 + .25 * n2 * ss(1.15, .4, d))
    mur = Z_MUR + .9 * n1 + .5 * n2
    h = h + (mur - h) * ss(Q_MUR0, Q_MUR1, q)                                                   # murs de roche (flanc intérieur raide)
    h = h * (1 - ss(Q_FAL, .995, q)) + .25 * ss(Q_FAL, .995, q)                                # falaise extérieure
    rv = riviere_at(x, y, .35)
    if rv: h = min(h, Z_EAU - .7 + .35 * (1 - (riviere_at(x, y) is not None)))
    if rv and q > Q_FAL - .02: h = min(h, .2)
    if gorge_at(x, y): h = min(h, Z_EAU - 1.4)
    a, qq, rr = MINE; cx, cy = at_q(qq, a); d = math.hypot(x - cx, y - cy) / rr
    if d < 1: h -= 1.4 * ss(1, .5, d)
    if mogura_at(x, y): h = min(h, .6 if q > .95 else h)
    for a, qq, rr in RIZIERES:
        cx, cy = at_q(qq, a)
        if math.hypot(x - cx, y - cy) < rr: h = min(h, Z_EAU + .05 - .02 * ((int(x) + int(y)) % 2))
    return h


def water_at(x, y):
    r, th, q = pol(x, y)
    if q >= 1: return None
    if riviere_at(x, y) and q < Q_FAL - .01: return Z_EAU
    if riviere_at(x, y) and q >= Q_FAL - .01: return .05
    if gorge_at(x, y): return Z_EAU - .9
    for a, qq, rr in RIZIERES:
        cx, cy = at_q(qq, a)
        if math.hypot(x - cx, y - cy) < rr - .2: return Z_EAU + .12
    return None


def zone(x, y):
    r, th, q = pol(x, y)
    if q >= 1: return 'mer'
    if q < Q_CAP + .02:
        if math.hypot(x - EBISU[0], y - EBISU[1]) < EBISU[2]: return 'ebisu'
        if math.hypot(x - FUJI[0], y - FUJI[1]) < FUJI[2] * .95: return 'fuji'
        return 'capitale'
    if q > Q_MUR0 + .02: return 'mur'
    return region(th)


def pente(x, y):
    e = .35; return math.hypot(height(x + e, y) - height(x - e, y), height(x, y + e) - height(x, y - e)) / (2 * e)


def route_at(x, y, m=0.0):
    r, th, q = pol(x, y)
    if q > Q_MUR0 or q < Q_CAP - .02: return None
    for nm, a in ROUTES.items():
        if angd(th, a) * r < .6 + m: return nm
    return None


def obstacle(x, y):
    r, th, q = pol(x, y)
    if q > Q_MUR0 - .01: return True
    if riviere_at(x, y, .45) or water_at(x, y) is not None or gorge_at(x, y): return True
    if route_at(x, y, .2): return True
    if math.hypot(x - FUJI[0], y - FUJI[1]) < FUJI[2] * .9: return True
    if math.hypot(x - CHATEAU[0], y - CHATEAU[1]) < 3.4 or math.hypot(x - PAGODE[0], y - PAGODE[1]) < 1.6: return True
    a, qq, rr = CIMETIERE; cx, cy = at_q(qq, a)
    if math.hypot(x - cx, y - cy) < rr + GORGE_L + .4: return True
    a, qq, rr = MINE; cx, cy = at_q(qq, a)
    if math.hypot(x - cx, y - cy) < rr + .3: return True
    if pente(x, y) > 1.1: return True
    return False


# ---------------------------------------------------------------- bâtiments
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


def _place(rnd, occ, out, x, y, ang, w, d, **kw):
    c, s = math.cos(ang), math.sin(ang)
    corners = [(x + su * w / 2 * -s + sv * d / 2 * c, y + su * w / 2 * c + sv * d / 2 * s) for su in (-1, 1) for sv in (-1, 1)]
    if any(obstacle(qx, qy) for qx, qy in corners + [(x, y)]) or not occ.libre(x, y, ang, w, d): return False
    occ.prendre(x, y, ang, w, d); out.append(dict(x=x, y=y, ang=ang, w=w, d=d, **kw)); return True


def batiments(seed=1192):
    """capitale : îlots en damier (rues nord-sud / est-ouest) ; villages des régions autour de leur centre [I]"""
    rnd = random.Random(seed); occ = Occupation(); out = []
    # capitale : machiya alignées sur une trame orthogonale : colonnes de 2 rangées dos à dos (4,4) + rue (1,0) ; rues transversales tous les 5,5
    for gx in range(-4, 5):
        xc = gx * 4.6 + .6
        for side in (-1, 1):
            x0 = xc + side * .98; ang = 0.0 if side > 0 else math.pi                          # façade vers la rue (est ou ouest)
            yy = -14.0 + rnd.random() * .6
            while yy < 14.0:
                w = 1.15 + .35 * rnd.random(); d = 1.55 + .25 * rnd.random()
                if (yy + 14) % 5.5 < 1.0: yy += 1.0; continue                                   # rue transversale
                y1 = yy + w / 2; z_ = zone(x0, y1)
                if pol(x0, y1)[2] < Q_CAP - .01:
                    pauvre = z_ == 'ebisu'
                    _place(rnd, occ, out, x0 + side * (d / 2 - .78), y1, ang, w * .98, d * (.85 if pauvre else 1), type='cabane' if pauvre else ('machiya2' if rnd.random() < .35 else 'machiya'),
                           zone=z_, niveau=1 if (rnd.random() < .82 or pauvre) else 2, etages=1 if pauvre else (2 if rnd.random() < .5 else 1))
                yy += w
    villages = [  # (région, angle, q, nombre, rayon, type)
        ('kuri', BAKURA[0], BAKURA[1], 28, 3.2, 'cabane'), ('hakumai', D(-42), .64, 22, 3.2, 'maison'), ('hakumai', D(-20), .70, 10, 2.2, 'maison'),
        ('ringo', D(-112), .62, 12, 2.6, 'maison'), ('ringo', D(-76), .60, 8, 2.2, 'maison'), ('udon', D(8), .60, 10, 2.6, 'maison'),
        ('udon', D(52), .70, 6, 2.0, 'maison'), ('kuri', D(122), .66, 10, 2.4, 'maison'), ('kibi', D(160), .52, 8, 2.0, 'cabane'), ('kibi', D(195), .74, 8, 2.0, 'cabane')]
    for reg, a, q, n, rr, typ in villages:
        cx, cy = at_q(q, a); k = 0; tries = 0
        while k < n and tries < 1500:
            tries += 1; ang = rnd.uniform(0, TAU); dd = rr * math.sqrt(rnd.random())
            x, y = cx + math.cos(ang) * dd, cy + math.sin(ang) * dd; fa = math.atan2(cy - y, cx - x) + rnd.uniform(-.3, .3)
            w, d = (1.0 + .3 * rnd.random(), 1.2 + .3 * rnd.random()) if typ == 'cabane' else (1.2 + .4 * rnd.random(), 1.5 + .4 * rnd.random())
            u_ = rnd.random(); lv = 1 if u_ < .55 else (2 if u_ < .78 else 3)                       # villages : ils grossissent avec la ville
            if _place(rnd, occ, out, x, y, fa, w, d, type=typ, zone=reg, niveau=lv, etages=1): k += 1
    for a, q, rr, hh in KIBI_ROCS:                                                               # usines sur les rochers de Kibi [C]
        cx, cy = at_q(q, a); out.append(dict(x=cx, y=cy, ang=rnd.uniform(0, TAU), w=rr * 1.1, d=rr * .8, type='usine', zone='kibi', niveau=1 if hh > 4.5 else 2, etages=1))
    return out


def arbres(seed=31):
    rnd = random.Random(seed); out = []; occ = Occupation()
    for b in batiments(): occ.prendre(b['x'], b['y'], b['ang'], b['w'] + .4, b['d'] + .4)
    for k in range(2600):
        x, y = rnd.uniform(-36, 36), rnd.uniform(-36, 36); r, th, q = pol(x, y)
        if q > Q_MUR0 + .06 or water_at(x, y) is not None or riviere_at(x, y, .3) or gorge_at(x, y) or route_at(x, y, .1) or not occ.libre(x, y, 0, .9, .9): continue
        if math.hypot(x - CHATEAU[0], y - CHATEAU[1]) < 4.4: continue
        z_ = zone(x, y)
        dens = {'capitale': .25, 'ebisu': .1, 'fuji': .35, 'ringo': .55, 'hakumai': .7, 'udon': .95, 'kuri': .12, 'kibi': .1, 'mur': .25}.get(z_, 0)
        if q > Q_MUR0 - .02: dens = .5
        if rnd.random() > dens: continue
        if z_ in ('capitale', 'ebisu'): kind = 'sakura' if rnd.random() < .75 else 'pin'
        elif z_ == 'fuji': kind = 'pin' if height(x, y) < 15 else None
        elif z_ == 'ringo': kind = 'pin_neige'
        elif z_ == 'hakumai': kind = 'erable' if rnd.random() < .75 else 'pin'
        elif z_ == 'udon': kind = 'feuillu' if rnd.random() < .7 else ('pin' if rnd.random() < .5 else 'bambou')
        elif z_ == 'kuri': kind = 'mort' if rnd.random() < .6 else 'pin'
        elif z_ == 'kibi': kind = 'mort'
        else: kind = 'pin_neige' if region(th) == 'ringo' else ('erable' if region(th) == 'hakumai' else 'pin')
        if kind: out.append((x, y, .75 + .45 * rnd.random(), kind, 1 if rnd.random() < .65 else (2 if rnd.random() < .6 else 3))); occ.prendre(x, y, 0, .8, .8)
    # [C] cerisiers de la Capitale des Fleurs : rangées sur la berge intérieure de la rivière, au pied du Fuji, autour du château
    rings = [(lambda t: at_q(Q_CAP - .022, t), 96), (lambda t: (FUJI[0] + math.cos(t) * FUJI[2] * 1.02, FUJI[1] + math.sin(t) * FUJI[2] * 1.02), 40),
             (lambda t: (CHATEAU[0] + math.cos(t) * 3.9, CHATEAU[1] + math.sin(t) * 3.5), 30)]
    for f, n in rings:
        for k in range(n):
            x, y = f(k / n * TAU + rnd.random() * .03)
            if pol(x, y)[2] > Q_CAP or water_at(x, y) is not None or riviere_at(x, y, .3) or route_at(x, y, .1) or not occ.libre(x, y, 0, .8, .8): continue
            out.append((x, y, .8 + .35 * rnd.random(), 'sakura', 1)); occ.prendre(x, y, 0, .75, .75)
    return out


if __name__ == '__main__':
    from collections import Counter
    B = batiments(); print(len(B), 'bâtiments', dict(Counter(b['zone'] for b in B)), 'niveaux', dict(Counter(b['niveau'] for b in B)), dict(Counter(b['type'] for b in B)))
    A = arbres(); print(len(A), 'arbres', dict(Counter(a[3] for a in A)))
    print('hauteur max approx', max(height(x * .5, y * .5) for x in range(-70, 71, 2) for y in range(-70, 71, 2)))
