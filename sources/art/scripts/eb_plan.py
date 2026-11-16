"""Elbaph — plan de masse et plan de production (île 11, procédure art/PROCEDURE_ILE.md, 16/11/2026).
Fiche canonique : art/data/fiches/elbaph.json. Source (consultée le 16/11/2026) : One Piece Wiki « Elbaph ».
  [C] Arbre au Trésor Adam au centre, colossal ; ses branches forment des étages de terre ; trois mondes : Underworld (montagnes
      enneigées, forêts, presque sans soleil), Sun World (au-dessus des basses branches : forêts, plaines, villages), Heaven World (cimes) ;
  [C] villages : maisons de bois, tours de guet, châteaux de pierre, ports ; village de l'Ouest et son port, après un arc-en-ciel ;
  [C] château de Road sur une montagne enneigée, pont de corde vers le haut ; château d'Aurust bâti dans un arbre au bord d'une falaise ;
  [C] bibliothèque d'Owl sur une branche au-dessus de la Source des Guerriers (lac) ; école Walrus ; installation ancienne dans l'arbre ;
  [C] épée géante à travers le Sun World ; cascades depuis les branches vers des lacs de nuage ; neige ; pins géants.
  [I] formes, positions, hauteurs ; style viking des bâtiments (culture viking [C]) ; grande halle (niveau 4).
Exclus : personnages, géants, bêtes, emblèmes, navires identifiables, briques de jouet, copie de tout décor officiel.
Repère du jeu : x vers l'est, y vers le sud, z vers le haut ; centre de l'île = (0, 0).
"""
import json, math, os, random

ART = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
_d = json.load(open(os.path.join(ART, 'data', 'islands.json'), encoding='utf-8'))
ISL = [i for i in _d['iles'] if i['nom'] == 'Elbaph'][0]
COAST = [(ISL['cote3d'][k], ISL['cote3d'][k + 1]) for k in range(0, len(ISL['cote3d']), 2)]
R = ISL['rayon']; TAU = 2 * math.pi; D = math.radians


def coast_r(th):
    B = len(COAST); f = ((th + math.pi) / TAU) * B; i = int(math.floor(f)) % B; j = (i + 1) % B; k = f - math.floor(f)
    return math.hypot(*COAST[i]) + (math.hypot(*COAST[j]) - math.hypot(*COAST[i])) * k


def ss(a, b, x):
    t = max(0.0, min(1.0, (x - a) / (b - a))); return t * t * (3 - 2 * t)


def angd(a, b): return abs((a - b + math.pi) % TAU - math.pi)
def pol(x, y): r = math.hypot(x, y); th = math.atan2(y, x); return r, th, r / coast_r(th)
def at_coast(a, k): r = coast_r(a) * k; return (math.cos(a) * r, math.sin(a) * r)


# ---------------------------------------------------------------- éléments
TRONC = (0.0, 0.0, 4.6, 27.0)                       # [C] Arbre Adam (x, y, rayon du fût, hauteur des cimes) [mesures I]
# [C] plateformes des branches (Sun World) : (nom, angle, distance, rayon, altitude du dessus) [I]
PLATEFORMES = [('ouest', D(180), 15.5, 8.6, 9.5), ('source', D(97), 15.5, 8.2, 8.2), ('est', D(8), 15.5, 7.6, 10.6), ('nord', D(-82), 15.0, 7.2, 11.6)]
MONTS = [(-15.0, -15.5, 6.5, 6.5), (17.0, 15.0, 5.5, 6.0), (-19.0, 13.0, 4.5, 5.0), (19.5, -13.0, 4.8, 5.5), (2.0, 22.0, 3.0, 4.0), (-4.0, -24.0, 3.2, 4.5)]   # [C] montagnes enneigées [positions I]
ROAD = MONTS[0][:2]                                  # [C] château de Road sur un sommet enneigé
LAC_SOURCE = 4.2                                     # [C] Source des Guerriers : lac sur la plateforme sud (rayon) [I]
OWL = (D(97), 9.6, 12.4)                             # [C] bibliothèque d'Owl sur une branche au-dessus de la Source (angle, distance, altitude) [I]
EPEE = (6.0, -19.0)                                  # [C] épée géante à travers la plateforme nord jusqu'au sol [position I]
AURUST = 'est'                                       # [C] château d'Aurust, dans un arbre au bord de la plateforme est
ARC = (D(180), 1.18)                                 # [C] arc-en-ciel vers le port du village de l'Ouest (angle, pied en mer)
BADGE3D, BADGE25 = (0.0, -9.0), (0.0, .55 * R)


def plateforme(nom):
    for p in PLATEFORMES:
        if p[0] == nom:
            _, a, d, r, z = p; return math.cos(a) * d, math.sin(a) * d, r, z, a
    raise KeyError(nom)


def plat_wob(a, k=0): return 1 + .1 * math.sin(3 * a + k) + .06 * math.sin(5 * a + 2 * k)


def sur_plateforme(x, y):
    """nom de la plateforme sous (x, y) et sa distance normalisée (contour irrégulier) ; None sinon"""
    for k, (nom, a, d, r, z) in enumerate(PLATEFORMES):
        cx, cy = math.cos(a) * d, math.sin(a) * d; aa = math.atan2(y - cy, x - cx)
        q = math.hypot(x - cx, y - cy) / (r * plat_wob(aa, k))
        if q < 1: return nom, q
    return None, 9


# ---------------------------------------------------------------- Underworld (sol)
def height(x, y):
    r, th, q = pol(x, y)
    if q >= 1: return -1.8
    h = 1.3 + .45 * math.sin(x * .31 + math.cos(y * .23)) * math.cos(y * .27)
    for mx, my, mr, mh in MONTS:
        dm = math.hypot(x - mx, y - my) / mr
        if dm < 2.0:                                                                         # sommet en cône à arêtes [I]
            a_ = math.atan2(y - my, x - mx); ar = .5 + .5 * abs(math.sin(a_ * 2.5 + mx))      # arêtes rayonnantes
            t = 1 - dm / 2.0; h += mh * t ** 1.25 * (.75 + .35 * ar) + .5 * abs(math.sin(x * 1.3 + y * .9)) * t
    dt = math.hypot(x - TRONC[0], y - TRONC[1])
    h += 2.2 * (1 - ss(TRONC[2], TRONC[2] + 7, dt))                                         # le sol monte vers les racines
    h = h * (1 - ss(.9, .99, q)) + (-.6) * ss(.9, .99, q)                                    # rivage rocheux bas
    if q > .985: h = -1.8 + (h + 1.8) * (1 - ss(.985, 1, q))
    return h


def zone(x, y):
    r, th, q = pol(x, y)
    if q >= 1: return 'mer'
    if math.hypot(x, y) < TRONC[2] + .4: return 'tronc'
    if q > .93: return 'rivage'
    h = height(x, y)
    if h > 4.6: return 'sommet'
    if math.hypot(x, y) < TRONC[2] + 6: return 'racines'
    return 'foret' if (math.sin(x * .45) + math.cos(y * .38) + .4 * math.sin(x * y * .02)) > -.3 else 'neige'


def obstacle_sol(x, y):
    return zone(x, y) in ('mer', 'tronc', 'rivage', 'sommet')


# ---------------------------------------------------------------- bâtiments sur les plateformes
QUARTIER = {'ouest': 1, 'source': 2, 'est': 3, 'nord': 3}


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


def reserve(occ):
    """emprises fixes : lac de la Source, château d'Aurust, port de nuage, épée, badge"""
    sx, sy, sr, sz, sa = plateforme('source'); occ.prendre(sx, sy, 0, 2 * LAC_SOURCE + .8, 2 * LAC_SOURCE + .8)
    ex, ey, er, ez, ea = plateforme('est'); ax, ay = ex + math.cos(ea) * er * .62, ey + math.sin(ea) * er * .62; occ.prendre(ax, ay, 0, 5.4, 5.4)
    wx, wy, wr, wz, wa = plateforme('ouest'); px, py = wx + math.cos(wa) * wr * .6, wy + math.sin(wa) * wr * .6; occ.prendre(px, py, 0, 4.4, 6.0)
    occ.prendre(EPEE[0], EPEE[1], 0, 2.4, 2.4); occ.prendre(BADGE3D[0], BADGE3D[1], 0, 4.6, 4.6)
    gx, gy = grande_halle(); occ.prendre(gx, gy, 0, 4.0, 2.4)


def grande_halle():
    nx, ny, nr, nz, na = plateforme('nord'); return nx - 2.6, ny + 1.2


def batiments(seed=1111):
    """longues maisons et maisons de bois sur les plateformes (niveau selon le quartier), tours de guet au bord (niveau 1 à l'ouest)"""
    rnd = random.Random(seed); occ = Occupation(); reserve(occ); out = []
    for nom, a, d, r, z in PLATEFORMES:
        cx, cy = math.cos(a) * d, math.sin(a) * d; lv = QUARTIER[nom]
        for k in range(1400):
            aa = rnd.uniform(0, TAU); dd = r * .82 * math.sqrt(rnd.random()); x, y = cx + math.cos(aa) * dd, cy + math.sin(aa) * dd
            n_, q = sur_plateforme(x, y)
            if n_ != nom or q > .78 or math.hypot(x, y) < TRONC[2] + 1.6: continue
            longue = rnd.random() < .45; w, dp = (2.4, 1.1) if longue else (1.3, 1.0)
            ang = math.atan2(y - cy, x - cx) + math.pi / 2 + rnd.uniform(-.2, .2)
            if not occ.libre(x, y, ang, w + .5, dp + .5): continue
            occ.prendre(x, y, ang, w + .2, dp + .2)
            out.append(dict(x=x, y=y, z=z, ang=ang, w=w, d=dp, type='longue' if longue else 'maison', niveau=lv, zone=nom))
        for k in range(3):                                                                     # tours de guet sur le bord [C : tours de guet]
            aa = a + math.pi + (k - 1) * .9; x, y = cx + math.cos(aa) * r * .86, cy + math.sin(aa) * r * .86
            if math.hypot(x, y) < TRONC[2] + 1.6: aa += math.pi; x, y = cx + math.cos(aa) * r * .86, cy + math.sin(aa) * r * .86
            if occ.libre(x, y, 0, .9, .9): occ.prendre(x, y, 0, .9, .9); out.append(dict(x=x, y=y, z=z, ang=aa, w=.8, d=.8, type='guet', niveau=1 if nom == 'ouest' else lv, zone=nom))
    return out


def arbres(seed=41):
    """pins géants de l'Underworld [C], arbres des plateformes [I]"""
    rnd = random.Random(seed); out = []; occ = Occupation(); reserve(occ)
    for b in batiments(): occ.prendre(b['x'], b['y'], b['ang'], b['w'] + .3, b['d'] + .3)
    for k in range(9000):
        x, y = rnd.uniform(-34, 34), rnd.uniform(-34, 34); z_ = zone(x, y)
        if z_ not in ('foret', 'neige', 'racines') or (z_ == 'neige' and rnd.random() > .05) or (z_ == 'racines' and rnd.random() > .3): continue
        if z_ == 'foret' and rnd.random() > .2: continue
        out.append((x, y, height(x, y), 1.0 + .5 * rnd.random(), 'pin', 1))
    for nom, a, d, r, z in PLATEFORMES:                                                    # bosquets sur les plateformes
        cx, cy = math.cos(a) * d, math.sin(a) * d
        for k in range(260):
            aa = rnd.uniform(0, TAU); dd = r * .9 * math.sqrt(rnd.random()); x, y = cx + math.cos(aa) * dd, cy + math.sin(aa) * dd
            n_, q = sur_plateforme(x, y)
            if n_ != nom or q > .88 or not occ.libre(x, y, 0, .9, .9) or rnd.random() > .35: continue
            occ.prendre(x, y, 0, .9, .9); out.append((x, y, z, .55 + .3 * rnd.random(), rnd.choice(('pin', 'feuillu')), 1))
    return out


if __name__ == '__main__':
    from collections import Counter
    B = batiments(); print(len(B), 'bâtiments', dict(Counter(b['type'] for b in B)), 'niveaux', dict(Counter(b['niveau'] for b in B)))
    A = arbres(); print(len(A), 'arbres', dict(Counter(a[4] for a in A)))
    print('z road', round(height(*ROAD), 1), 'z racines', round(height(5, 0), 1), 'badge3d', sur_plateforme(*BADGE3D)[0], 'badge25', sur_plateforme(*BADGE25)[0], zone(*BADGE25))
