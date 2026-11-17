"""Ohara — plan de masse et plan de production (île 16, procédure art/PROCEDURE_ILE.md, 17/11/2026).
Fiche canonique : art/data/fiches/ohara.json. Sources (consultées le 17/11/2026) : One Piece Wiki « Ohara », « Tree of Knowledge ».
  [C] petite île de West Blue ; Arbre de la Connaissance (5 000 ans) entouré de maisons ; bibliothèque dans l'arbre ; lac près de l'arbre ;
      île trop petite pour avoir d'autres lieux.
  [C?] portes et fenêtres dans le tronc, large couronne (de mémoire).
  [I] île intacte (avant le Buster Call) ; relief, chemins, champs, port, phare (niveau 4), aspect des maisons.
Exclus : personnages, géants, navires de la Marine, Poneglyph, copie de tout décor officiel.
Repère du jeu : x vers l'est, y vers le sud, z vers le haut ; centre de l'île = (0, 0).
"""
import json, math, os, random

ART = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
_d = json.load(open(os.path.join(ART, 'data', 'islands.json'), encoding='utf-8'))
ISL = [i for i in _d['iles'] if i['nom'] == 'Ohara'][0]
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
ARBRE = (0.0, -1.0, 3.2, 12.0)          # [C : arbre géant entouré de maisons] centre, rayon du tronc, hauteur du tronc [I]
COURONNE = 10.5                         # [C?] rayon de la couronne [I]
LAC = (11.5, 5.0, 4.2)                  # [C : lac près de l'arbre] [position I]
PORT_A = D(100)                         # [I] petit port au sud
PHARE = (D(-38), .9)                    # [I] phare (niveau 4) au nord-est
VILLAGE = (5.5, 17.0)                   # [C : maisons autour de l'arbre] anneau du village [I]
RUES = 8                                # [I] ruelles rayonnantes
BADGE3D, BADGE25 = (0.0, -9.0), (0.0, .55 * R)


def lac_d(x, y): return math.hypot(x - LAC[0], (y - LAC[1]) * 1.25) - LAC[2]


def height(x, y):
    r, th, q = pol(x, y)
    if q >= 1: return -1.8
    da = math.hypot(x - ARBRE[0], y - ARBRE[1])
    h = 1.0 + 1.0 * (1 - ss(4, 24, da)) + .22 * math.sin(x * .21 + math.cos(y * .18) * 2) * math.cos(y * .2 - x * .07)   # campagne vallonnée douce
    h += .5 * (1 - ss(2, 7, da))                                                          # petite butte de l'arbre
    ld = lac_d(x, y)
    if ld < 1.5: h = h * ss(-.4, 1.5, ld) + (-.5) * (1 - ss(-.4, 1.5, ld))              # lac
    port = angd(th, PORT_A) < .16
    k = ss(.88, .985, q) if not port else ss(.92, .99, q); edge = .2 if port else -.6       # plages, petites falaises
    if q < .99: return h * (1 - k) + edge * k
    return edge + (-1.8 - edge) * ss(.99, 1, q)


def zone(x, y):
    r, th, q = pol(x, y)
    if q >= 1: return 'mer'
    if angd(th, PORT_A) < .16 and q > .88: return 'port'
    if q > .9: return 'plage'
    if lac_d(x, y) < 0: return 'lac'
    if lac_d(x, y) < 1.2: return 'rive'
    da = math.hypot(x - ARBRE[0], y - ARBRE[1])
    if da < ARBRE[2] + 1.6: return 'arbre'
    px, py = at_coast(*PHARE)
    if math.hypot(x - px, y - py) < 2.2: return 'phare'
    if da < VILLAGE[1]: return 'village'
    return 'campagne'


def rue_d(x, y):
    """[I] ruelles rayonnantes autour de l'arbre, deux tours de village"""
    da = math.hypot(x - ARBRE[0], y - ARBRE[1]); a = math.atan2(y - ARBRE[1], x - ARBRE[0])
    ray = min(angd(a + .1 * math.sin(da * .4), k * TAU / RUES + .2) for k in range(RUES)) * da
    ring = min(abs(da - rr - .5 * math.sin(a * 2 + rr)) for rr in (7.0, 12.5))
    return min(ray, ring) if da > ARBRE[2] + 1.6 else 0


def champ(x, y):
    """[I] champs en lanières dans la campagne : indice de bande (couleur) ou None"""
    if zone(x, y) != 'campagne': return None
    u = x * .8 + y * .6; v = -x * .6 + y * .8
    if (int(math.floor(v / 6.0)) + int(math.floor(u / 9.0))) % 3 == 0: return None   # prés et bosquets
    return int(math.floor(u / 2.2)) % 4


def obstacle(x, y):
    if zone(x, y) not in ('village', 'campagne'): return True
    if rue_d(x, y) < .7 or math.hypot(x - BADGE3D[0], y - BADGE3D[1]) < 2.6: return True
    return False


def batiments(seed=1616):
    """[C : maisons autour de l'arbre] maisons du village (niveaux 1 et 2), fermes de la campagne (niveau 3), maisons du port (niveau 1)"""
    rnd = random.Random(seed); out = []; pris = []
    def libre(x, y, s): return not any(math.hypot(x - px, y - py) < s + ps + .22 for px, py, ps in pris)
    for k in range(7):                                                                     # port
        a = PORT_A + (k - 3) * .07; x, y = at_coast(a, .8 + .04 * (k % 2))
        if obstacle(x, y) or not libre(x, y, .8): continue
        pris.append((x, y, .8)); out.append(dict(x=x, y=y, ang=a, w=1.3, d=1.0, type='maison', etages=1 + (k % 3 == 0), niveau=1, zone='port'))
    for essai in range(14000):
        a = rnd.uniform(0, TAU); d = rnd.uniform(ARBRE[2] + 2.2, 27); x, y = ARBRE[0] + math.cos(a) * d, ARBRE[1] + math.sin(a) * d
        z_ = zone(x, y)
        if obstacle(x, y): continue
        if z_ == 'campagne':
            if champ(x, y) is not None or rnd.random() < .93: continue
            s = 1.5; t = 'ferme'
        else:
            s = .75 + .2 * rnd.random(); t = 'maison'
        if not libre(x, y, s) or any(obstacle(x + math.cos(b) * s, y + math.sin(b) * s) for b in (0, 1.57, 3.14, 4.71)): continue
        pris.append((x, y, s))
        lv = 3 if t == 'ferme' else (1 if d < 14.5 else 2)
        ang = a + math.pi
        out.append(dict(x=x, y=y, ang=ang, w=2 * s * .85, d=2 * s * .7, type=t, etages=1 + (rnd.random() < (.5 if d < 10 else .25)), niveau=lv, zone=z_))
    return out


def arbres(seed=61):
    """[I] bosquets, haies d'arbres et vergers de la campagne ; arbres du village"""
    rnd = random.Random(seed); out = []; B = batiments()
    for k in range(9000):
        x, y = rnd.uniform(-35, 35), rnd.uniform(-35, 35); z_ = zone(x, y)
        if z_ not in ('campagne', 'village', 'rive', 'plage') or rue_d(x, y) < .7: continue
        if any(math.hypot(x - b['x'], y - b['y']) < max(b['w'], b['d']) * .6 + .4 for b in B): continue
        if math.hypot(x - BADGE3D[0], y - BADGE3D[1]) < 2.4: continue
        p = {'campagne': .14 if champ(x, y) is None else .006, 'village': .015, 'rive': .08, 'plage': .012}[z_]
        if rnd.random() < p: out.append((x, y, .75 + .4 * rnd.random(), 'rond' if rnd.random() < .7 else 'cypres', 1))
    return out


if __name__ == '__main__':
    from collections import Counter
    B = batiments(); print(len(B), 'bâtiments', dict(Counter(b['type'] for b in B)), 'niveaux', dict(Counter(b['niveau'] for b in B)))
    A = arbres(); print(len(A), 'arbres', dict(Counter(a[3] for a in A)))
    print('z arbre', round(height(*ARBRE[:2]), 2), 'badge3d', zone(*BADGE3D), 'badge25', zone(*BADGE25), 'lac', zone(*LAC[:2]), 'phare', zone(*at_coast(*PHARE)))
