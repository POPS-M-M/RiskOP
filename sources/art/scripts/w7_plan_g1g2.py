"""Water 7 — plan de masse FIGÉ tel que validé en G1/G2 (15/11/2026). La production détaillée utilise w7_plan.py.
Repère du jeu : x vers l'est, y vers le sud, z vers le haut, unités de carte. Centre de l'île = (0, 0).

Canon de mémoire, NON revérifié en ligne (marqué [C?] ; à confirmer sur https://onepiece.fandom.com/wiki/Water_7) :
  ville bâtie en étages autour d'une fontaine géante qui la domine ; canaux dans toute la ville (déplacement en bateau) ;
  ponts et quais ; chantiers navals de la compagnie de construction navale, numérotés ; gare du train des mers (ligne vers
  Enies Lobby) ; quartiers bas et pauvres ; ville qui s'enfonce, inondée lors des grandes marées (Aqua Laguna).
Interprétations [I] imposées par l'échelle (rayon 31) : 3 terrasses + plateau de la fontaine ; 4 canaux rayonnants en cascade
  et 2 canaux en anneau ; 3 chantiers visibles (au lieu de 7) ; gare à l'ouest, tournée vers Enies Lobby (voisine sur la
  carte) ; quartier pauvre au nord-ouest, en partie sous l'eau ; port de commerce au sud (côté du ponton du jeu) ;
  architecture : maisons hautes à pignons et toits colorés (bleu, sarcelle, terre cuite, comme la fiche actuelle du jeu).
Exclus : personnages, logo de la compagnie, locomotive officielle (train générique).
"""
import json, math, os, random

ART = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
_d = json.load(open(os.path.join(ART, 'data', 'islands.json'), encoding='utf-8'))
ISL = [i for i in _d['iles'] if i['nom'] == 'Water 7'][0]
COAST = [(ISL['cote3d'][k], ISL['cote3d'][k + 1]) for k in range(0, len(ISL['cote3d']), 2)]
R = ISL['rayon']
TAU = 2 * math.pi


def coast_r(th):
    """rayon de la côte dans la direction th (interpolé comme dans le jeu)"""
    B = len(COAST); f = ((th + math.pi) / TAU) * B; i = int(math.floor(f)) % B; j = (i + 1) % B; k = f - math.floor(f)
    return math.hypot(*COAST[i]) + (math.hypot(*COAST[j]) - math.hypot(*COAST[i])) * k


def ss(a, b, x):
    t = max(0.0, min(1.0, (x - a) / (b - a))); return t * t * (3 - 2 * t)


def angd(a, b):
    return abs((a - b + math.pi) % TAU - math.pi)


# ---------------------------------------------------------------- niveaux de la ville (rayon extérieur, hauteur de la plateforme)
T3, T2, T1 = 6.8, 12.6, 19.4                 # plateau de la fontaine, ville haute, ville moyenne
Z3, Z2, Z1, Z0 = 9.8, 6.4, 3.2, 0.9          # hauteurs ; Z0 = ville basse au niveau des quais
WALL = 0.55                                   # épaisseur des murs de soutènement entre terrasses
FONTAINE = {'r_bassin': 3.9, 'z': Z3, 'jet': 17.0}          # [C?] fontaine géante, élément dominant ; dimensions [I]
# canaux : rayonnants (cascades d'une terrasse à l'autre jusqu'à la mer) et anneaux ; niveau d'eau sous la plateforme
CANAUX_RAY = [-math.pi / 4, math.pi / 4, 3 * math.pi / 4, -3 * math.pi / 4]
CANAL_RAY_L = 1.6
ANNEAUX = [(15.9, 1.25, 'T1'), (20.4, 1.9, 'T0')]           # (rayon, largeur, terrasse)
RUES = [0.0, math.pi / 2, math.pi, -math.pi / 2]            # grandes rues rayonnantes avec escaliers
RUE_L = 2.0
EAU = 0.34                                                  # niveau des canaux de la ville basse
# quartiers de la ville basse (angles en radians ; 0 = est, pi/2 = sud)
def secteur(th):
    if -0.62 <= th <= 0.62: return 'chantiers'
    if 0.62 < th <= 2.36: return 'port'
    if th > 2.36 or th < -2.6: return 'gare'
    if -2.6 <= th < -1.25: return 'basfonds'
    return 'ville_nord'
# éléments signatures
TH_EL = math.atan2(-15, -105)                                 # direction d'Enies Lobby sur la carte
GARE = {'x': -23.6, 'y': -0.8, 'w': 7.0, 'd': 3.8, 'h': 3.4}  # [C?] gare du train des mers ; position [I]
VIADUC = [(-26.0, -1.2), (-26.0 + 18 * math.cos(TH_EL), -1.2 + 18 * math.sin(TH_EL))]   # voie vers Enies Lobby (tronçon visible)
DOCKS = [  # [C?] chantiers navals numérotés ; 3 visibles [I] ; (n°, angle, rayon du hangar, niveau de ville où il apparaît)
    (1, 0.04, 24.2, 1), (2, -0.43, 24.0, 2), (3, 0.47, 24.0, 3)]
SIEGE = (22.8, 0.30)  # [C?] siège de la compagnie près du chantier n° 1 (rayon, angle) [position I]
PORT = {'th': math.pi / 2, 'pontons': 3}                     # port de commerce au sud [I]
PONTON = (0.0, 35.0, 0.0)                                    # repère « PONTON » du jeu (sud)
FERRAILLE = (-2.05, 26.0)                                    # [C?] dépôt de ferraille des bas quartiers (angle, rayon) [I]
INONDE = (-2.45, -1.35, 0.84)                                # [C?] ville qui s'enfonce : bas quartiers sous l'eau au-delà de d=0.84


def height(x, y):
    """hauteur du sol (sans l'eau)"""
    r = math.hypot(x, y); th = math.atan2(y, x); d = r / coast_r(th)
    if d >= 1: return -1.2 * ss(1, 1.12, d) - .05
    wl = WALL
    for a in RUES:                                     # dans les grandes rues, les murs deviennent des escaliers (pente plus douce)
        if r > T3 - 1 and angd(th, a) * r < RUE_L / 2 + .1: wl = 2.6
    h = Z0 + (Z1 - Z0) * ss(T1 + wl, T1, r) + (Z2 - Z1) * ss(T2 + wl, T2, r) + (Z3 - Z2) * ss(T3 + wl, T3, r)
    if r > T1: h = Z0 - .25 * ss(.9, 1, d)                                   # quais au bord de l'eau
    if r > T1 and secteur(th) == 'basfonds': h = .45 - .9 * ss(INONDE[2] - .04, INONDE[2] + .04, d)   # bas quartiers qui s'enfoncent
    # canaux : lit creusé
    for a in CANAUX_RAY:
        if angd(th, a) * r < CANAL_RAY_L / 2 + .15 and r > FONTAINE['r_bassin'] - .2:
            h = min(h, canal_eau(r) - .55)
    for rr, w, t in ANNEAUX:
        if abs(r - rr) < w / 2 + .1: h = min(h, (Z1 if t == 'T1' else EAU + .3) - .9)
    return h


def canal_eau(r):
    """niveau de l'eau d'un canal rayonnant à la distance r (marches = cascades)"""
    if r < T3: return Z3 - .35
    if r < T2: return Z2 - .45
    if r < T1: return Z1 - .45
    return EAU


def water_at(x, y):
    """niveau d'eau visible en (x, y) ou None"""
    r = math.hypot(x, y); th = math.atan2(y, x); d = r / coast_r(th)
    if d >= 1: return None
    if r < FONTAINE['r_bassin']: return Z3 + .55
    for a in CANAUX_RAY:
        if angd(th, a) * r < CANAL_RAY_L / 2 and r > FONTAINE['r_bassin']: return canal_eau(r)
    for rr, w, t in ANNEAUX:
        if abs(r - rr) < w / 2: return (Z1 - .45) if t == 'T1' else EAU
    if r > T1 and secteur(th) == 'basfonds' and d > INONDE[2]: return EAU - .05
    return None


def zone(x, y):
    r = math.hypot(x, y)
    if r < T3: return 'plateau'
    if r < T2: return 'ville_haute'
    if r < T1: return 'ville_moyenne'
    return secteur(math.atan2(y, x))


def libre(x, y, hw, hd=None):
    """emplacement libre pour un objet de demi-largeur hw (le long du rang) et demi-profondeur hd (vers le centre)"""
    hd = hw if hd is None else hd
    r = math.hypot(x, y); th = math.atan2(y, x)
    if (r + hd) / coast_r(th) > .95: return False
    for a in CANAUX_RAY:
        if angd(th, a) * r < CANAL_RAY_L / 2 + hw + .25: return False
    for a in RUES:
        if r > T3 and angd(th, a) * r < RUE_L / 2 + hw + .15: return False   # les rues partent du plateau
    for rr, w, t in ANNEAUX:
        if abs(r - rr) < w / 2 + hd + .2: return False
    for rr in (T3, T2, T1):
        if abs(r - rr) < hd + .15: return False
    if r - hd < FONTAINE['r_bassin'] + .8: return False
    if math.hypot(x - GARE['x'], y - GARE['y']) < 6.0 + hw: return False
    for n, a, rd, lv in DOCKS:                 # emprise d'un chantier : hangar + cale jusqu'à la mer (repère radial u, tangentiel v)
        u = x * math.cos(a) + y * math.sin(a); v = -x * math.sin(a) + y * math.cos(a)
        if abs(v) < 2.7 + hw and rd - 4.6 - hd < u: return False
    if angd(th, PORT['th']) * r < 5.5 + hw and r > 24.5: return False
    if math.hypot(x - math.cos(FERRAILLE[0]) * FERRAILLE[1], y - math.sin(FERRAILLE[0]) * FERRAILLE[1]) < 2.8 + hw: return False
    sx, sy = math.cos(SIEGE[1]) * SIEGE[0], math.sin(SIEGE[1]) * SIEGE[0]
    if math.hypot(x - sx, y - sy) < 2.9 + hw: return False
    return True


# ---------------------------------------------------------------- bâtiments (maquette G2 et densité du plan G1)
STYLE = {  # (largeur min, max), (étages min, max), toits possibles, répartition des niveaux de ville
    'plateau':       ((1.8, 2.6), (3, 4), ('croupe', 'dome', 'plat'), {1: .6, 4: .4}),
    'ville_haute':   ((2.0, 3.2), (2, 4), ('croupe', 'pignon', 'dome'), {1: .6, 4: .4}),
    'ville_moyenne': ((1.6, 2.6), (2, 3), ('pignon', 'croupe'), {1: .55, 2: .25, 3: .2}),
    'port':          ((1.5, 2.5), (2, 3), ('pignon',), {1: .4, 2: .35, 3: .25}),
    'ville_nord':    ((1.5, 2.4), (2, 3), ('pignon',), {2: .5, 3: .5}),
    'chantiers':     ((2.6, 3.8), (1, 2), ('entrepot',), {1: .5, 3: .5}),
    'gare':          ((1.6, 2.4), (1, 2), ('pignon',), {1: .5, 2: .5}),
    'basfonds':      ((1.1, 1.8), (1, 2), ('pignon', 'plat'), {1: .7, 3: .3}),
}
RANGEES = [('plateau', [(5.8, 1.6)]), ('ville_haute', [(8.3, 2.2), (11.1, 2.2)]), ('ville_moyenne', [(13.95, 2.2), (17.9, 2.2)]),
           (None, [(22.9, 2.2), (25.3, 2.2), (27.6, 2.0)])]   # (rayon du rang, profondeur max)


def batiments(seed=7):
    rnd = random.Random(seed); out = []
    for zn, rows in RANGEES:
        for rr, dmax in rows:
            th = rnd.random() * TAU
            arc = 0.0
            while arc < TAU * rr:
                z_ = zn or secteur(math.atan2(math.sin(th), math.cos(th)))
                (w0, w1), (f0, f1), toits, lv = STYLE[z_]
                w = w0 + (w1 - w0) * rnd.random(); dpt = min(dmax, w * (.8 + .3 * rnd.random()))
                x, y = math.cos(th) * rr, math.sin(th) * rr
                if libre(x, y, w / 2, dpt / 2):
                    k = rnd.random(); acc = 0; lvl = 1
                    for L_, p in sorted(lv.items()):
                        acc += p
                        if k <= acc: lvl = L_; break
                    out.append({'x': x, 'y': y, 'w': w, 'd': dpt, 'etages': rnd.randint(f0, f1), 'rot': th + math.pi / 2,
                                'toit': rnd.choice(toits), 'niveau': lvl, 'zone': z_, 'penche': (z_ == 'basfonds' and math.hypot(x, y) / coast_r(th) > INONDE[2] - .02)})
                step = (w + .35) / rr; th += step; arc += w + .35
    return out


def arbres(seed=11):
    rnd = random.Random(seed); out = []
    for rr in (ANNEAUX[0][0] - 1.3, ANNEAUX[0][0] + 1.3, ANNEAUX[1][0] - 1.6):   # promenades plantées le long des canaux [I]
        n = int(TAU * rr / 3.1)
        for q in range(n):
            th = q / n * TAU + rnd.random() * .05; x, y = math.cos(th) * rr, math.sin(th) * rr
            if all(angd(th, a) * rr > 1.6 for a in CANAUX_RAY + RUES) and math.hypot(x - GARE['x'], y - GARE['y']) > 6:
                out.append((x, y, .75 + .3 * rnd.random(), 'feuillu'))
    for q in range(7):                                                              # palmiers du port [I]
        th = PORT['th'] + (q - 3) * .09; rr = 26.5 + rnd.random() * 1.2
        if q != 3: out.append((math.cos(th) * rr, math.sin(th) * rr, .8, 'palmier'))
    for q in range(6):                                                              # jardins de la ville haute [I]
        th = rnd.random() * TAU; rr = 9.7
        x, y = math.cos(th) * rr, math.sin(th) * rr
        if libre(x, y, .6, .6): out.append((x, y, .7, 'feuillu'))
    return out


if __name__ == '__main__':
    B = batiments(); from collections import Counter
    print('rayon', R, 'côte', round(min(math.hypot(*p) for p in COAST), 1), '→', round(max(math.hypot(*p) for p in COAST), 1))
    print(len(B), 'bâtiments', Counter(b['zone'] for b in B), Counter(b['niveau'] for b in B))
    print(len(arbres()), 'arbres')
