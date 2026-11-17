"""Water 7 — plan de PRODUCTION (scène détaillée), dérivé du plan validé en G1/G2 (w7_plan_g1g2.py) avec les ajustements validés :
  · massif de la fontaine décalé de 3,5 unités vers le nord (le badge d'armée du jeu, au centre de l'île, ne le recouvre plus) ;
  · densité 350 à 500 bâtiments : maisons ACCOLÉES par îlots, ruelles, rangées doubles ;
  · viaduc raccourci (cadre de l'image réduit).
Composition inchangée : terrasses et hiérarchie, fontaine dominante, canaux (4 rayonnants + 2 anneaux), quartiers, chantiers à
l'est, gare et viaduc à l'ouest, port au sud, bas quartiers au nord-ouest (en partie sous l'eau).
Repère du jeu : x vers l'est, y vers le sud, z vers le haut. Centre de l'ÎLE (jeu) = (0, 0) ; centre de la VILLE = (CX, CY).
Canon : [C?] = à revérifier (voir w7_plan_g1g2.py) ; [I] = interprétation à l'échelle de la carte.
"""
import json, math, os, random

ART = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
_d = json.load(open(os.path.join(ART, 'data', 'islands.json'), encoding='utf-8'))
ISL = [i for i in _d['iles'] if i['nom'] == 'Water 7'][0]
COAST = [(ISL['cote3d'][k], ISL['cote3d'][k + 1]) for k in range(0, len(ISL['cote3d']), 2)]
R = ISL['rayon']; TAU = 2 * math.pi
CX, CY = 0.0, -3.5                                     # [I] ajustement validé : massif décalé vers le nord


def coast_r(th):
    B = len(COAST); f = ((th + math.pi) / TAU) * B; i = int(math.floor(f)) % B; j = (i + 1) % B; k = f - math.floor(f)
    return math.hypot(*COAST[i]) + (math.hypot(*COAST[j]) - math.hypot(*COAST[i])) * k


def ss(a, b, x):
    t = max(0.0, min(1.0, (x - a) / (b - a))); return t * t * (3 - 2 * t)


def angd(a, b):
    return abs((a - b + math.pi) % TAU - math.pi)


def pol(x, y):
    """coordonnées polaires autour du centre de la ville"""
    return math.hypot(x - CX, y - CY), math.atan2(y - CY, x - CX)


def at(rho, phi):
    return CX + math.cos(phi) * rho, CY + math.sin(phi) * rho


def dcoast(x, y):
    """position relative à la côte (0 au centre de l'île, 1 sur la côte)"""
    return math.hypot(x, y) / coast_r(math.atan2(y, x))


# ---------------------------------------------------------------- terrasses, canaux, rues (rayons depuis le centre de la ville)
T3, T2, T1 = 6.6, 12.0, 18.2                         # plateau de la fontaine, ville haute, ville moyenne  [I]
Z3, Z2, Z1, Z0 = 9.8, 6.4, 3.2, 0.9
WALL = .5
FONTAINE = {'r_bassin': 4.0, 'z': Z3, 'jet': 17.0}   # [C?] fontaine géante ; dimensions [I]
CANAUX_RAY = [-math.pi / 4, math.pi / 4, 3 * math.pi / 4, -3 * math.pi / 4]; CANAL_RAY_L = 1.6
ANNEAUX = [(15.1, 1.2, 'T1'), (19.25, 1.7, 'T0')]
RUES = [0.0, math.pi / 2, math.pi, -math.pi / 2]; RUE_L = 2.0
EAU = .34


def secteur(phi):
    if -0.62 <= phi <= 0.62: return 'chantiers'
    if 0.62 < phi <= 2.36: return 'port'
    if phi > 2.36 or phi < -2.6: return 'gare'
    if -2.6 <= phi < -1.25: return 'basfonds'
    return 'ville_nord'


TH_EL = math.atan2(-15, -105)                                     # direction d'Enies Lobby sur la carte
GARE = {'rho': 23.2, 'phi': math.pi, 'w': 6.4, 'd': 3.6}         # [C?] gare du train des mers ; position [I]
GX, GY = at(GARE['rho'], GARE['phi'])
VIADUC = [(GX - GARE['d'] / 2 - .2, GY - .4), (GX - GARE['d'] / 2 - .2 + 8.5 * math.cos(TH_EL), GY - .4 + 8.5 * math.sin(TH_EL))]   # raccourci [I]
DOCKS = [(1, 0.05, 23.4, 1), (2, -0.46, 23.0, 2), (3, 0.52, 23.4, 3)]   # [C?] chantiers numérotés ; 3 visibles [I] (n°, phi, rho, niveau)
DOCK_L, DOCK_W = 7.6, 4.4
SIEGE = (22.3, 0.30)                                               # [C?] siège de la compagnie près du chantier n° 1 [position I]
PORT_PHI = math.pi / 2
PONTON = (0.0, 35.0, 0.0)
FERRAILLE = at(22.2, -2.2)                                         # [C?] dépôt de ferraille des bas quartiers [I]
INONDE_D = .86                                                     # [C?] ville qui s'enfonce : bas quartiers sous l'eau au-delà


def height(x, y):
    rho, phi = pol(x, y); d = dcoast(x, y)
    if d >= 1: return -1.2 * ss(1, 1.12, d) - .05
    wl = WALL
    for a in RUES:
        if rho > T3 - 1 and angd(phi, a) * rho < RUE_L / 2 + .1: wl = 2.6           # escaliers dans les grandes rues
    h = Z0 + (Z1 - Z0) * ss(T1 + wl, T1, rho) + (Z2 - Z1) * ss(T2 + wl, T2, rho) + (Z3 - Z2) * ss(T3 + wl, T3, rho)
    if rho > T1: h = Z0 - .25 * ss(.9, 1, d)
    if rho > T1 and secteur(phi) == 'basfonds': h = .45 - .9 * ss(INONDE_D - .04, INONDE_D + .04, d)
    for a in CANAUX_RAY:
        if angd(phi, a) * rho < CANAL_RAY_L / 2 + .15 and rho > FONTAINE['r_bassin'] - .2: h = min(h, canal_eau(rho) - .55)
    for rr, w, t in ANNEAUX:
        if abs(rho - rr) < w / 2 + .1: h = min(h, (Z1 if t == 'T1' else EAU + .3) - .9)
    return h


def canal_eau(rho):
    if rho < T3: return Z3 - .35
    if rho < T2: return Z2 - .45
    if rho < T1: return Z1 - .45
    return EAU


def water_at(x, y):
    rho, phi = pol(x, y); d = dcoast(x, y)
    if d >= 1: return None
    if rho < FONTAINE['r_bassin']: return Z3 + .55
    for a in CANAUX_RAY:
        if angd(phi, a) * rho < CANAL_RAY_L / 2 and rho > FONTAINE['r_bassin']: return canal_eau(rho)
    for rr, w, t in ANNEAUX:
        if abs(rho - rr) < w / 2: return (Z1 - .45) if t == 'T1' else EAU
    if rho > T1 and secteur(phi) == 'basfonds' and d > INONDE_D: return EAU - .05
    return None


def zone(x, y):
    rho, phi = pol(x, y)
    if rho < T3: return 'plateau'
    if rho < T2: return 'ville_haute'
    if rho < T1: return 'ville_moyenne'
    return secteur(phi)


def dock_frame(n):
    _, a, rd, _ = [q for q in DOCKS if q[0] == n][0]; x, y = at(rd, a); return x, y, a


def obstacle(x, y, inonde_ok=False):
    """point occupé (eau, rue, mur, quai, élément signature) ?"""
    rho, phi = pol(x, y); d = dcoast(x, y)
    if d > .95: return True
    w = water_at(x, y)
    if w is not None and not (inonde_ok and rho > T1 and secteur(phi) == 'basfonds'): return True
    if rho < T3: return True
    for a in RUES:
        if angd(phi, a) * rho < RUE_L / 2 + .15: return True
    for a in CANAUX_RAY:
        if angd(phi, a) * rho < CANAL_RAY_L / 2 + .3: return True
    for rr, ww, t in ANNEAUX:
        if abs(rho - rr) < ww / 2 + .28: return True
    for T in (T3, T2, T1):
        if abs(rho - T) < .28: return True
    if abs(x - GX) < GARE['d'] / 2 + 1.6 and abs(y - GY) < GARE['w'] / 2 + 1.6: return True
    for n, a, rd, lv in DOCKS:
        cx, cy = at(rd, a); u = (x - cx) * math.cos(a) + (y - cy) * math.sin(a); v = -(x - cx) * math.sin(a) + (y - cy) * math.cos(a)
        if abs(v) < DOCK_W / 2 + .9 and u > -DOCK_L / 2 - .8: return True
    sx, sy = at(*SIEGE)
    if math.hypot(x - sx, y - sy) < 2.6: return True
    if angd(phi, PORT_PHI) * rho < 4.6 and rho > 25.0: return True
    if math.hypot(x - FERRAILLE[0], y - FERRAILLE[1]) < 2.4: return True
    return False


# ---------------------------------------------------------------- îlots et maisons accolées
STYLE = {  # largeur de façade, étages, toits, murs, couvertures
    'ville_haute':   ((1.25, 2.0), (3, 4), ('croupe', 'mansarde', 'terrasse', 'pignon'), ('blanc', 'creme', 'ciel', 'rose'), ('bleu', 'sarcelle', 'ardoise')),
    'ville_moyenne': ((.95, 1.6), (2, 4), ('pignon', 'pignon', 'croupe', 'mansarde', 'terrasse'), ('blanc', 'creme', 'ocre', 'rose', 'ciel'), ('bleu', 'sarcelle', 'tuile')),
    'port':          ((.95, 1.55), (2, 3), ('pignon', 'pignon', 'croupe', 'terrasse'), ('creme', 'ocre', 'blanc', 'rose', 'sable'), ('tuile', 'bleu', 'sarcelle')),
    'ville_nord':    ((.95, 1.55), (2, 3), ('pignon', 'croupe', 'terrasse'), ('blanc', 'creme', 'ocre', 'ciel'), ('bleu', 'tuile', 'sarcelle')),
    'gare':          ((1.0, 1.6), (2, 3), ('pignon', 'croupe'), ('brique', 'creme', 'ocre'), ('tuile', 'ardoise')),
    'chantiers':     ((2.4, 3.4), (1, 2), ('entrepot',), ('sable', 'brique'), ('ardoise', 'tuile')),
    'basfonds':      ((.75, 1.2), (1, 2), ('pignon', 'pignon', 'terrasse'), ('sable', 'gris', 'brique'), ('ardoise', 'tuile')),
}
NIVEAUX = {'ville_haute': {1: .8, 4: .2}, 'ville_moyenne': {1: .7, 2: .15, 3: .15}, 'port': {1: .4, 2: .6}, 'ville_nord': {1: .3, 3: .7},
           'gare': {1: .6, 2: .4}, 'chantiers': {1: .6, 3: .4}, 'basfonds': {1: .6, 3: .4}}
RANGEES = [  # (rayon du centre de la rangée, profondeur) ; deux rangées dos à dos par bande quand la place le permet
    (7.85, 1.9), (10.75, 1.8),                    # ville haute (ruelle 8.8–9.85)
    (13.2, 1.6), (16.95, 1.9),                    # ville moyenne (canal en anneau 14.5–15.7)
    (21.25, 1.5), (23.3, 1.7), (25.5, 1.7), (27.7, 1.7), (29.9, 1.6)]   # ville basse (ruelles entre rangées)


def tirer(rnd, dist):
    k = rnd.random(); acc = 0
    for L_, p in sorted(dist.items()):
        acc += p
        if k <= acc: return L_
    return max(dist)


def batiments(seed=77):
    rnd = random.Random(seed); out = []
    for rr, dep in RANGEES:
        phi = rnd.random() * TAU; parc = 0.0; ilot = 0; reste = 0; lvl = 1; zprev = None
        while parc < TAU * rr:
            x, y = at(rr, phi); z_ = zone(x, y)
            if z_ == 'plateau': phi += .3 / rr; parc += .3; continue
            (w0, w1), (f0, f1), toits, murs, couv = STYLE[z_]
            w = w0 + (w1 - w0) * rnd.random()
            if reste <= 0 or z_ != zprev:                                              # nouvel îlot : niveau de ville et longueur
                ilot += 1; reste = rnd.randint(3, 7); lvl = tirer(rnd, NIVEAUX[z_]); zprev = z_
                if out and out[-1]['ilot'] == ilot - 1: phi += .55 / rr; parc += .55     # ruelle entre îlots
            pc = math.cos(phi); ps = math.sin(phi); t = (-ps, pc)
            pts = [(x, y)] + [(x + su * w / 2 * t[0] + sv * dep / 2 * pc, y + su * w / 2 * t[1] + sv * dep / 2 * ps) for su in (-1, 1) for sv in (-1, 1)]
            ok = all(not obstacle(px, py, inonde_ok=True) for px, py in pts)
            if ok:
                d_ = dcoast(x, y); penche = z_ == 'basfonds' and d_ > INONDE_D - .02
                out.append({'x': x, 'y': y, 'w': w * .985, 'd': dep, 'etages': rnd.randint(f0, f1), 'ang': phi, 'toit': rnd.choice(toits),
                            'mur': rnd.choice(murs), 'couv': rnd.choice(couv), 'niveau': lvl, 'zone': z_, 'ilot': ilot, 'penche': penche,
                            'balcon': z_ in ('ville_haute', 'ville_moyenne', 'port', 'ville_nord') and rnd.random() < .45,
                            'arcades': z_ in ('ville_haute', 'port') and rnd.random() < .3, 'rang': rr})
                reste -= 1
            else:
                reste = 0; phi += .22 / rr; parc += .22; continue                     # obstacle : l'îlot s'arrête, on avance finement
            phi += w / rr; parc += w
    return out


def arbres(seed=11):
    rnd = random.Random(seed); out = []
    for rr in (ANNEAUX[0][0] - .95, ANNEAUX[0][0] + .95, ANNEAUX[1][0] - 1.18, ANNEAUX[1][0] + 1.2, T3 - .55, 9.35):
        n = int(TAU * rr / 2.6)
        for q in range(n):
            phi = q / n * TAU + rnd.random() * .04; x, y = at(rr, phi)
            if any(angd(phi, a) * rr < 1.3 for a in CANAUX_RAY + RUES): continue
            if dcoast(x, y) > .93 or (abs(x - GX) < 4 and abs(y - GY) < 5): continue
            if any(math.hypot(x - at(rd, a)[0], y - at(rd, a)[1]) < 5 for n_, a, rd, lv in DOCKS): continue
            kind = 'cypres' if rr in (T3 - .55, 9.35) else 'platane'
            out.append((x, y, .7 + .3 * rnd.random(), kind, 1 if rr != 9.35 else 4))
    for q in range(9):                                                             # palmiers du port [I]
        phi = PORT_PHI + (q - 4) * .085; x, y = at(26.0 + rnd.random(), phi)
        if q != 4 and dcoast(x, y) < .95: out.append((x, y, .85, 'palmier', 1 if q % 2 else 2))
    return out


def barques(seed=5):
    rnd = random.Random(seed); out = []
    for a in CANAUX_RAY:
        for rr in (13.0, 16.8, 21.5, 24.5, 27.0):
            x, y = at(rr, a + (rnd.random() - .5) * .02)
            if water_at(x, y) is not None and rnd.random() < .8: out.append((x, y, canal_eau(rr), a + (0 if rnd.random() < .5 else math.pi), 1 if rr < 20 else 3))
    for rr, w, t in ANNEAUX:
        for q in range(6 if t == 'T0' else 4):
            phi = rnd.random() * TAU; x, y = at(rr, phi)
            if water_at(x, y) is not None: out.append((x, y, (Z1 - .45) if t == 'T1' else EAU, phi + math.pi / 2, 1 if q < 2 else 3))
    return out


if __name__ == '__main__':
    from collections import Counter
    B = batiments(); print(len(B), 'bâtiments', dict(Counter(b['zone'] for b in B)), 'niveaux', dict(Counter(b['niveau'] for b in B)))
    print(len(arbres()), 'arbres ;', len(barques()), 'barques ; gare', (round(GX, 1), round(GY, 1)), 'viaduc', [tuple(round(v, 1) for v in p) for p in VIADUC])
