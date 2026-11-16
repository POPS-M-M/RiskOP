"""Mary Geoise — plan de masse et plan de production (île 10, procédure art/PROCEDURE_ILE.md, 16/11/2026).
Fiche canonique : art/data/fiches/mary_geoise.json. Sources (consultées le 16/11/2026) : One Piece Wiki « Mary Geoise »,
« Pangaea Castle », « Red Line », « Red Port » ; Sportskeeda Wiki « Domain of the Gods ».
  [C] au sommet de la Red Line (minéral rougeâtre), très haut, entouré de nuages et de brume ;
  [C] Red Port au pied, bondolas (cabines-bulles sur câbles) ; longs escaliers taillés dans la Red Line, bordés de statues ;
  [C] carrefour principal reliant les deux Red Ports, le château de Pangaea et le Domaine des Dieux ; quatre grandes portes dans le mur ;
  [C] style européen XVIIIe-XIXe ; forêts et rivières plantées ; trottoirs roulants ;
  [C] château de Pangaea : immense, au moins six étages, tours dont une sur le toit, victorien, mur fortifié, deux douves et ponts ;
  [C] Domaine des Dieux : la plus grande partie de la ville, grandes demeures, rues bordées d'arbres, fontaine ;
  [C] Red Port côté Paradise : sur deux grands palétuviers, bulles, bâtiments bas à toits en cylindre.
  [I] couleurs, damier des parcs, positions (château au nord-est, ports est/ouest, escalier au sud, forêt et rivière au sud-ouest),
      port ouest copié sur l'autre, serre victorienne (niveau 4).
Exclus : personnages, symboles et insignes, intérieurs, esclaves, navires identifiables, copie de tout décor officiel.
Repère du jeu : x vers l'est, y vers le sud, z vers le haut ; centre de l'île = (0, 0).
"""
import json, math, os, random

ART = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
_d = json.load(open(os.path.join(ART, 'data', 'islands.json'), encoding='utf-8'))
ISL = [i for i in _d['iles'] if i['nom'] == 'Mary Geoise'][0]
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


# ---------------------------------------------------------------- éléments
TOP = 7.0                                            # sommet du plateau [C : très haut ; hauteur I]
Q_RIM, Q_PIED = .8, .97                              # rebord de la falaise, pied dans la mer
Q_MUR = .73                                          # mur d'enceinte [C] et ses quatre portes [C]
PORTS = [D(0), D(180)]                               # [C] les deux Red Ports (est = Paradise, ouest = Nouveau Monde) [positions I]
PORT_W = .30                                         # demi-ouverture angulaire de l'entaille du port
CHATEAU = (8.8, -6.8, 6.0)                          # [C] château de Pangaea, deux douves [position I : hors du badge 3D (0, −9)]
PLACE = (0.0, 0.0, 3.2)                              # [C] carrefour principal, fontaine [C : fontaine]
FORET = (-12.0, 8.0, 7.5)                            # [C] forêt plantée [position I]
RIVIERE = [(-19.0, -1.0), (-15.5, 3.0), (-12.5, 7.5), (-9.5, 11.5), (-6.5, 14.2)]   # [C] rivière plantée [tracé I]
BASSIN = (-6.0, 14.6, 1.6)                           # bassin où finit la rivière [I]
SERRE = (-13.5, 9.5)                                 # [I] serre victorienne (niveau 4)
ESCALIER = (D(70), D(108))                           # [C] escalier taillé dans la falaise, bordé de statues [position I : face sud]
BADGE3D, BADGE25 = (0.0, -9.0), (0.0, .55 * R)
RUE = 4.1                                            # pas du damier des parcs [I]


def in_port(x, y):
    r, th, q = pol(x, y)
    return any(angd(th, a) < PORT_W for a in PORTS) and q > Q_MUR + .04


def port_t(x, y):
    r, th, q = pol(x, y); return max(ss(PORT_W, PORT_W - .06, angd(th, a)) for a in PORTS)


def chateau_d(x, y): return math.hypot(x - CHATEAU[0], y - CHATEAU[1])


def foret_d(x, y):
    a = math.atan2(y - FORET[1], x - FORET[0]); return math.hypot(x - FORET[0], y - FORET[1]) / (FORET[2] * (1 + .12 * math.sin(3 * a + 1)))


def riviere_d(x, y): return poly_dist(x, y, RIVIERE)


def avenue_d(x, y):
    """axes du carrefour (est-ouest vers les ports, nord-sud vers les portes) et allée vers le château"""
    return min(abs(y), abs(x), seg_dist(x, y, 0, 0, CHATEAU[0], CHATEAU[1])[0])


def falaise_h(q):
    """profil de la falaise : plateau → à-pic → mer"""
    if q <= Q_RIM: return TOP
    t = ss(Q_RIM, Q_PIED, q) ** .8; return TOP + (-1.8 - TOP) * t


def height(x, y):
    r, th, q = pol(x, y)
    if q >= 1.0: return -1.8
    h = falaise_h(q)
    if q < Q_RIM: h = TOP + .08 * math.sin(x * .5) * math.cos(y * .4)
    pt = port_t(x, y)
    if pt > 0 and q > Q_RIM - .06:                                   # entaille du port au niveau de la mer
        k = pt * ss(Q_RIM - .06, Q_RIM + .02, q); h = h * (1 - k) + .45 * k
    if riviere_d(x, y) < .55 and q < Q_RIM: h = TOP - .35
    return h


def water_at(x, y):
    r, th, q = pol(x, y)
    if q >= Q_RIM: return None
    cd = chateau_d(x, y)
    if 4.35 < cd < 4.85 or 5.25 < cd < 5.7: return TOP - .25       # deux douves [C]
    if riviere_d(x, y) < .45 or math.hypot(x - BASSIN[0], y - BASSIN[1]) < BASSIN[2]: return TOP - .25
    return None


def zone(x, y):
    r, th, q = pol(x, y)
    if q >= 1: return 'mer'
    if in_port(x, y) and height(x, y) < 1.2: return 'port'
    if q > Q_RIM: return 'falaise'
    if q > Q_MUR - .03: return 'rebord'
    if chateau_d(x, y) < 6.25: return 'chateau'
    if math.hypot(x, y) < PLACE[2]: return 'place'
    if foret_d(x, y) < 1: return 'foret'
    if avenue_d(x, y) < .95: return 'avenue'
    return 'domaine'


def obstacle(x, y):
    z_ = zone(x, y)
    if z_ in ('mer', 'falaise', 'rebord', 'chateau', 'place', 'foret', 'avenue', 'port'): return True
    if riviere_d(x, y) < 1.0 or math.hypot(x - BASSIN[0], y - BASSIN[1]) < BASSIN[2] + .8: return True
    if math.hypot(x - BADGE3D[0], y - BADGE3D[1]) < 2.6: return True
    return False


def lots():
    """[I] damier de parcs clos du Domaine des Dieux, entre les rues (pas RUE) ; chaque parc garde une demeure"""
    out = []; w = RUE - 1.15
    C_ = [1.0 + w / 2 + k * RUE for k in range(6)]; C_ = [-c for c in reversed(C_)] + C_          # les axes tombent dans une rue large
    for cx in C_:
        for cy in C_:
            pts = [(cx + su * w / 2, cy + sv * w / 2) for su in (-1, 1) for sv in (-1, 1)] + [(cx, cy)]
            if any(obstacle(px, py) for px, py in pts): continue
            out.append((cx, cy, w))
    return out


def batiments(seed=1010):
    """une demeure par parc (niveau selon la distance au carrefour) ; pavillons de jardin (niveau 3) ; bâtiments du port (niveau 1)"""
    rnd = random.Random(seed); out = []
    for cx, cy, w in lots():
        d_ = math.hypot(cx, cy); lv = 1 if d_ < 12.5 else (2 if d_ < 15.2 else 3)
        face = math.atan2(-cy, -cx) if rnd.random() < .5 else (0 if abs(cx) > abs(cy) else math.pi / 2)
        face = round(face / (math.pi / 2)) * math.pi / 2                                   # façade vers la rue la plus proche du centre
        mw, md = w * (.48 + .1 * rnd.random()), w * (.36 + .08 * rnd.random())
        out.append(dict(x=cx, y=cy, ang=face, w=mw, d=md, lot=w, type='demeure', niveau=lv, zone='domaine'))
        if lv >= 2 and rnd.random() < .45:
            ox, oy = rnd.choice(((-1, -1), (1, -1), (-1, 1), (1, 1)))
            out.append(dict(x=cx + ox * w * .32, y=cy + oy * w * .32, ang=face, w=.7, d=.7, type='pavillon', niveau=3, zone='domaine'))
    for a in PORTS:                                                                            # Red Port : bâtiments bas à toits en cylindre [C]
        for k in range(5):
            da = (k - 2) * .1; x, y = at_coast(a + da, .88 + .03 * (k % 2))
            out.append(dict(x=x, y=y, ang=a + da + math.pi, w=1.6, d=1.0, type='hangar', niveau=1, zone='port'))
    return out


def arbres(seed=37):
    """forêt plantée [C], arbres d'alignement [C : rues bordées d'arbres], arbres des parcs [I]"""
    rnd = random.Random(seed); out = []
    for k in range(9000):
        x, y = rnd.uniform(-26, 26), rnd.uniform(-26, 26); z_ = zone(x, y)
        if z_ == 'foret' and riviere_d(x, y) > .9 and math.hypot(x - SERRE[0], y - SERRE[1]) > 2.0 and rnd.random() < .5:
            out.append((x, y, .9 + .35 * rnd.random(), rnd.choice(('rond', 'rond', 'cypres')), 1))
    for axe in (0, 1):                                                                          # alignements le long des deux axes
        for k in range(-11, 12):
            for s in (-1, 1):
                p = k * 1.8; x, y = (p, s * 1.05) if axe == 0 else (s * 1.05, p)
                if abs(p) < PLACE[2] + .5 or zone(x, y) not in ('avenue', 'domaine'): continue
                out.append((x, y, .7, 'taille', 1))
    for cx, cy, w in lots():
        for k in range(rnd.randint(2, 4)):
            u, v = rnd.choice((-1, 1)) * w * rnd.uniform(.3, .42), rnd.uniform(-1, 1) * w * .4
            if rnd.random() < .5: u, v = v, u
            out.append((cx + u, cy + v, .6 + .3 * rnd.random(), rnd.choice(('rond', 'taille', 'cypres')), 1))
    return out


if __name__ == '__main__':
    from collections import Counter
    B = batiments(); print(len(B), 'bâtiments', dict(Counter(b['type'] for b in B)), 'niveaux', dict(Counter(b['niveau'] for b in B)))
    A = arbres(); print(len(A), 'arbres', dict(Counter(a[3] for a in A)))
    print('lots', len(lots()), 'z', round(height(0, 0), 2), 'port', round(height(*at_coast(0, .9)), 2), 'badge3d', zone(*BADGE3D), 'badge25', zone(*BADGE25))
