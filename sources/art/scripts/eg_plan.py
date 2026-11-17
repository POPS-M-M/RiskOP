"""Egghead — plan de masse et plan de production (île 12, procédure art/PROCEDURE_ILE.md, 17/11/2026).
Fiche canonique : art/data/fiches/egghead.json. Source (consultée le 17/11/2026) : One Piece Wiki « Egghead ».
  [C] île d'hiver rendue tropicale (climatisation), petite, parsemée d'arbres ; icebergs et tourbillons chauds en colonnes autour ;
  [C] œuf géant fendu au-dessus des nuages ; laboratoire (bâtiments A, B, C) sur un nuage fabriqué ; deux bandes laser autour du nuage ;
      tube de verre entre les deux niveaux ; Ville du futur (dômes de verre, fusées, manettes), hologrammes, usine centrale ; Raygun Gothic.
  [I] positions, couleurs, plan circulaire, colonne de nuage, soucoupes sur pied, pas de tir (niveau 4).
Exclus : personnages, Séraphins, robots, monstres, symboles, navires identifiables, copie de tout décor officiel.
Repère du jeu : x vers l'est, y vers le sud, z vers le haut ; centre de l'île = (0, 0).
"""
import json, math, os, random

ART = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
_d = json.load(open(os.path.join(ART, 'data', 'islands.json'), encoding='utf-8'))
ISL = [i for i in _d['iles'] if i['nom'] == 'Egghead'][0]
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
OEUF = (-9.0, -4.0, 5.2, 6.0, 8.2)                 # [C] œuf : centre, rayon, demi-axe vertical, base (sur le nuage) [mesures I]
NUAGE = (-9.0, -4.0, 6.6, 7.8)                      # [C] nuage d'île fabriqué (centre, rayon, altitude)
LABS = [('A', -9.0, -4.0), ('B', -11.4, -2.4), ('C', -7.0, -6.2)]   # [C] bâtiments A (le plus haut), B, C
TUBE = ((2.0, -1.0), (-4.2, -2.8))                  # [C] tube de verre : station au sol → bord du nuage [tracé I]
PLACE = (7.0, 8.0, 2.4)                             # [I] place centrale de la ville, hologramme
USINE = (14.0, 2.0)                                 # [C] usine centrale [position I]
PAS_DE_TIR = (13.0, -14.0)                          # [I] pas de tir (niveau 4)
JUNGLE = (-15.0, 9.0, 8.0)                          # [C : île parsemée d'arbres, climat tropical] jungle à l'ouest [I]
ICEBERGS = [(D(a), k, s) for a, k, s in ((-160, 1.12, 1.2), (-120, 1.18, .8), (-60, 1.14, 1.0), (20, 1.15, .9), (70, 1.12, 1.3), (115, 1.2, .7), (165, 1.15, 1.0), (-15, 1.22, .6))]
TOURBILLONS = [(D(a), 1.1) for a in (-95, 45, 140)]  # [C] tourbillons chauds qui montent en colonnes
BADGE3D, BADGE25 = (0.0, -9.0), (0.0, .55 * R)


def height(x, y):
    r, th, q = pol(x, y)
    if q >= 1: return -1.8
    h = 1.0 + .35 * math.sin(x * .25 + math.cos(y * .2)) * math.cos(y * .22)
    dj = math.hypot(x - JUNGLE[0], y - JUNGLE[1]) / JUNGLE[2]
    if dj < 1.4: h += 1.6 * (1 - ss(0, 1.4, dj))                                        # collines boisées de l'ouest
    de = math.hypot(x - NUAGE[0], y - NUAGE[1])
    h += .8 * (1 - ss(2, 6, de))                                                            # butte sous la colonne de nuage
    dp = math.hypot(x - PLACE[0], y - PLACE[1]);
    if dp < 12: h = h * ss(4, 12, dp) + 1.0 * (1 - ss(4, 12, dp))                            # ville à plat
    return h * (1 - ss(.9, .98, q)) + .15 * ss(.9, .98, q) if q < .99 else -1.8 + (h + 1.8) * (1 - ss(.99, 1, q))


def zone(x, y):
    r, th, q = pol(x, y)
    if q >= 1: return 'mer'
    if q > .91: return 'plage'
    if math.hypot(x - NUAGE[0], y - NUAGE[1]) < NUAGE[2] * .55: return 'colonne'
    if math.hypot(x - PLACE[0], y - PLACE[1]) < PLACE[2]: return 'place'
    if math.hypot(x - USINE[0], y - USINE[1]) < 3.6: return 'usine'
    if math.hypot(x - PAS_DE_TIR[0], y - PAS_DE_TIR[1]) < 3.0: return 'pas_de_tir'
    if math.hypot(x - JUNGLE[0], y - JUNGLE[1]) < JUNGLE[2] * (1 + .12 * math.sin(3 * math.atan2(y - JUNGLE[1], x - JUNGLE[0]))): return 'jungle'
    if math.hypot(x - PLACE[0], y - PLACE[1]) < 15.5: return 'ville'
    return 'campagne'


def rue_d(x, y):
    """[I] plan circulaire : anneaux autour de la place et rayons"""
    d = math.hypot(x - PLACE[0], y - PLACE[1]); a = math.atan2(y - PLACE[1], x - PLACE[0])
    ring = min(abs(d - rr) for rr in (4.2, 8.6, 13.0))
    ray = min(angd(a, k * math.pi / 3) for k in range(6)) * d
    return min(ring, ray) if d > PLACE[2] else 0


def obstacle(x, y):
    if zone(x, y) in ('mer', 'plage', 'colonne', 'place', 'usine', 'pas_de_tir'): return True
    if rue_d(x, y) < .7 or math.hypot(x - BADGE3D[0], y - BADGE3D[1]) < 2.6: return True
    if math.hypot(x - TUBE[0][0], y - TUBE[0][1]) < 1.6: return True
    return False


def batiments(seed=1212):
    """dômes de verre, tours-fusées, bâtiments « manette », soucoupes sur pied, panneaux holographiques ; niveau selon la distance à la place"""
    rnd = random.Random(seed); out = []; pris = []
    plan = [t for t, n in (('dome', 24), ('manette', 8), ('soucoupe', 9), ('fusee', 12), ('holo', 8)) for _ in range(n)]   # quotas : les plus grands d'abord
    for t in plan:
      for k in range(400):
        a = rnd.uniform(0, TAU); d = rnd.uniform(PLACE[2] + 1, 15.0); x, y = PLACE[0] + math.cos(a) * d, PLACE[1] + math.sin(a) * d
        if zone(x, y) not in ('ville', 'campagne') or obstacle(x, y): continue
        s = {'dome': 1.0 + .5 * rnd.random(), 'fusee': .55, 'manette': 1.1, 'soucoupe': .9, 'holo': .5}[t]
        if any(math.hypot(x - px, y - py) < s + ps + .45 for px, py, ps in pris): continue
        if any(obstacle(x + math.cos(b) * s, y + math.sin(b) * s) for b in (0, 1.57, 3.14, 4.71)): continue
        pris.append((x, y, s))
        lv = 1 if d < 8.0 else (2 if d < 11.5 else 3)
        if t in ('soucoupe', 'holo') and lv < 3 and rnd.random() < .5: lv = 3
        out.append(dict(x=x, y=y, ang=a + math.pi, w=2 * s, d=2 * s, type=t, s=s, niveau=lv, zone='ville')); break
    return out


def arbres(seed=43):
    """jungle et arbres épars [C : île parsemée d'arbres, climat tropical], palmiers des plages [I]"""
    rnd = random.Random(seed); out = []; B = batiments()
    for k in range(9000):
        x, y = rnd.uniform(-30, 30), rnd.uniform(-30, 30); z_ = zone(x, y)
        if z_ in ('mer', 'colonne', 'place', 'usine', 'pas_de_tir') or rue_d(x, y) < .7: continue
        if any(math.hypot(x - b['x'], y - b['y']) < b['s'] + .5 for b in B): continue
        if math.hypot(x - BADGE3D[0], y - BADGE3D[1]) < 2.4: continue
        if z_ == 'jungle' and rnd.random() < .35: out.append((x, y, .9 + .4 * rnd.random(), 'jungle', 1))
        elif z_ == 'plage' and rnd.random() < .08: out.append((x, y, .9 + .3 * rnd.random(), 'palmier', 1))
        elif z_ == 'campagne' and rnd.random() < .06: out.append((x, y, .8 + .3 * rnd.random(), rnd.choice(('jungle', 'palmier')), 1))
        elif z_ == 'ville' and rnd.random() < .02: out.append((x, y, .7, 'palmier', 1))
    return out


if __name__ == '__main__':
    from collections import Counter
    B = batiments(); print(len(B), 'bâtiments', dict(Counter(b['type'] for b in B)), 'niveaux', dict(Counter(b['niveau'] for b in B)))
    A = arbres(); print(len(A), 'arbres', dict(Counter(a[3] for a in A)))
    print('z place', round(height(*PLACE[:2]), 2), 'badge3d', zone(*BADGE3D), 'badge25', zone(*BADGE25))
