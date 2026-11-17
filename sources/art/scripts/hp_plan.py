"""Île des Hommes-Poissons — plan de masse et plan de production (île 14, procédure art/PROCEDURE_ILE.md, 17/11/2026).
Fiche canonique : art/data/fiches/hommes_poissons.json. Sources (consultées le 17/11/2026) : One Piece Wiki « Fish-Man Island », « Ryugu Palace ».
  [C] bulle géante à double couche, moitié eau et récif, moitié air ; palais Ryugu dans une petite bulle au sommet de la bulle principale,
      seul accès par le couloir de liaison ; tour de la Coquille dure au nord-est du château ; place Gyoncorde au centre ; Coral Hill, ville
      portuaire ; ville des Moulins à eau au nord ; ville de l'Usine de bonbons au nord-ouest ; centre commercial à l'ouest ; salle de réunion
      au sud-ouest ; collines Gyoverly ; crique des Sirènes ; dojo.
  [C?] maisons en coquillages et en bulles, coraux et algues (de mémoire).
  [I] positions non données par le wiki, relief, rues, aspect des bâtiments, dojo (niveau 4).
Exclus : personnages, monstres, navires identifiables (arche Noah), Poneglyph, symboles, copie de tout décor officiel.
Repère du jeu : x vers l'est, y vers le sud, z vers le haut ; centre de l'île = (0, 0).
"""
import json, math, os, random

ART = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
_d = json.load(open(os.path.join(ART, 'data', 'islands.json'), encoding='utf-8'))
ISL = [i for i in _d['iles'] if i['nom'] == 'Île des Hommes-Poissons'][0]
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
BULLE = (40.0, -24.0)                    # [C : bulle géante] [I : calotte de sphère de rayon 40, centre à z = -24 → sommet à 16, bord sur la côte]
def z_bulle(x, y): r2 = BULLE[0] ** 2 - x * x - y * y; return math.sqrt(r2) + BULLE[1] if r2 > 0 else -99
PALAIS = (-8.0, -14.0, 6.0)             # [C : palais dans une petite bulle au sommet de la bulle principale] centre, rayon de sa bulle [I]
COULOIR = ((-8.0, -14.0), (-6.5, -9.0), (-4.0, -5.5))   # [C : couloir de liaison, seul accès] [tracé I] du palais à l'île
PLACE = (1.0, 3.0, 3.4)                 # [C : place Gyoncorde au centre]
PORT_A = D(90)                          # [C : Coral Hill, ville portuaire] [au sud : I]
MOULINS = (8.0, -18.0)                  # [C : ville des Moulins à eau, au nord]
USINE = (-17.0, -9.0)                   # [C : ville de l'Usine de bonbons, au nord-ouest]
MALL = (-20.0, 4.0)                     # [C : centre commercial, à l'ouest]
SALLE = (-12.0, 16.0)                   # [C : salle de réunion, au sud-ouest]
GYOVERLY = (16.0, -6.0, 5.0)            # [C : collines Gyoverly] [position I]
CRIQUE = (23.5, 9.0, 4.0)               # [C : crique des Sirènes] [position I]
DOJO = (13.0, 15.0)                     # [C : dojo] [I : niveau 4]
CANAL = [(-1.0, -21.0), (4.0, -19.5), (9.0, -18.5), (14.0, -17.0), (18.0, -14.5)]   # [I] canal des moulins
BADGE3D, BADGE25 = (0.0, -9.0), (0.0, .55 * R)
ANNEAUX = (7.5, 13.5, 19.0); RAYONS = 7  # [I] rues : anneaux et rayons autour de la place


def canal_d(x, y):
    best = 99
    for (ax, ay), (bx, by) in zip(CANAL, CANAL[1:]):
        dx, dy = bx - ax, by - ay; t = max(0, min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)))
        best = min(best, math.hypot(x - ax - t * dx, y - ay - t * dy))
    return best


def height(x, y):
    r, th, q = pol(x, y)
    if q >= 1: return -1.8
    dp = math.hypot(x - PLACE[0], y - PLACE[1])
    h = .9 + 1.6 * (1 - ss(4, 22, dp)) + .08 * math.sin(x * .33 + math.cos(y * .29)) * math.cos(y * .31)   # butte de récif en pente douce, lisse
    h += 1.6 * (1 - ss(1, GYOVERLY[2] + 2, math.hypot(x - GYOVERLY[0], y - GYOVERLY[1])))              # collines Gyoverly
    if dp < PLACE[2] + 1.5: h = 2.5 * (1 - ss(PLACE[2], PLACE[2] + 1.5, dp)) + h * ss(PLACE[2], PLACE[2] + 1.5, dp)   # place plane
    dc = math.hypot(x - CRIQUE[0], y - CRIQUE[1])
    if dc < CRIQUE[2] + 2: h = h * ss(CRIQUE[2] - .5, CRIQUE[2] + 2, dc) + (-.7) * (1 - ss(CRIQUE[2] - .5, CRIQUE[2] + 2, dc))   # crique
    if canal_d(x, y) < 1.4: h = min(h, .2 + .5 * ss(.7, 1.4, canal_d(x, y)))                          # canal des moulins
    port = angd(th, PORT_A) < .3
    k = ss(.86, .98, q) if not port else ss(.9, .99, q); edge = .25 if port else -.4                 # récif peu profond au bord
    if q < .99: return h * (1 - k) + edge * k
    return edge + (-1.8 - edge) * ss(.99, 1, q)


def eau(x, y):
    """zones d'eau intérieures : crique, canal"""
    return math.hypot(x - CRIQUE[0], y - CRIQUE[1]) < CRIQUE[2] or canal_d(x, y) < .7


def zone(x, y):
    r, th, q = pol(x, y)
    if q >= 1: return 'mer'
    if angd(th, PORT_A) < .3 and q > .82: return 'port'
    if q > .9: return 'recif'
    if eau(x, y): return 'eau'
    if math.hypot(x - PLACE[0], y - PLACE[1]) < PLACE[2]: return 'place'
    if math.hypot(x - DOJO[0], y - DOJO[1]) < 3.0: return 'dojo'
    if math.hypot(x - USINE[0], y - USINE[1]) < 3.2: return 'usine'
    if math.hypot(x - MALL[0], y - MALL[1]) < 3.0: return 'mall'
    if math.hypot(x - SALLE[0], y - SALLE[1]) < 2.6: return 'salle'
    if math.hypot(x - GYOVERLY[0], y - GYOVERLY[1]) < GYOVERLY[2]: return 'gyoverly'
    if canal_d(x, y) < 2.6: return 'moulins'
    return 'ville' if math.hypot(x - PLACE[0], y - PLACE[1]) < 21 else 'recif_haut'


def rue_d(x, y):
    """[I] rues : anneaux et rayons autour de la place, légèrement ondulés"""
    d = math.hypot(x - PLACE[0], y - PLACE[1]); a = math.atan2(y - PLACE[1], x - PLACE[0])
    ring = min(abs(d - rr - .4 * math.sin(a * 3 + rr)) for rr in ANNEAUX)
    ray = min(angd(a + .12 * math.sin(d * .3), k * TAU / RAYONS + .3) for k in range(RAYONS)) * d
    return min(ring, ray) if d > PLACE[2] else 0


def obstacle(x, y, marge=0.0):
    z_ = zone(x, y)
    if z_ in ('mer', 'port', 'recif', 'eau', 'place', 'dojo', 'usine', 'mall', 'salle'): return True
    if rue_d(x, y) < .7 + marge or math.hypot(x - BADGE3D[0], y - BADGE3D[1]) < 2.6: return True
    if canal_d(x, y) < 1.5: return True
    (ex, ey) = COULOIR[-1]
    if math.hypot(x - ex, y - ey) < 2.0: return True
    return False


def batiments(seed=1414):
    """[C?] maisons rondes en coquillages ('coquille'), grappes de bulles ('bulle'), tours en conques ('conque') ;
    manoirs des collines Gyoverly ; maisons du port ; niveau selon la distance à la place"""
    rnd = random.Random(seed); out = []; pris = []
    def libre(x, y, s): return not any(math.hypot(x - px, y - py) < s + ps + .22 for px, py, ps in pris)
    for k in range(12):                                                         # Coral Hill : maisons du port (niveau 1)
        a = PORT_A + (k - 5.5) * .055; x, y = at_coast(a, .74 + .06 * (k % 2))
        if obstacle(x, y) or not libre(x, y, .9): continue
        pris.append((x, y, .9)); out.append(dict(x=x, y=y, ang=a, s=.9, type='coquille', niveau=1, zone='port'))
    for k in range(3):                                                          # manoirs des collines Gyoverly (niveau 3)
        a = k * TAU / 3 + .5; x, y = GYOVERLY[0] + math.cos(a) * 2.6, GYOVERLY[1] + math.sin(a) * 2.6
        pris.append((x, y, 1.5)); out.append(dict(x=x, y=y, ang=a, s=1.5, type='manoir', niveau=3, zone='gyoverly'))
    plan = [t for t, n in (('conque', 18), ('bulle', 36), ('coquille', 110)) for _ in range(n)]
    for t in plan:
        for essai in range(900):
            a = rnd.uniform(0, TAU); d = rnd.uniform(PLACE[2] + 1, 20.5); x, y = PLACE[0] + math.cos(a) * d, PLACE[1] + math.sin(a) * d
            if zone(x, y) not in ('ville', 'moulins') or obstacle(x, y): continue
            s = {'coquille': .7 + .3 * rnd.random(), 'bulle': .85, 'conque': .7}[t]
            if not libre(x, y, s) or any(obstacle(x + math.cos(b) * s, y + math.sin(b) * s) for b in (0, 1.57, 3.14, 4.71)): continue
            pris.append((x, y, s))
            lv = 1 if d < 13 else (2 if d < 17.5 else 3)
            out.append(dict(x=x, y=y, ang=a + math.pi, s=s, type=t, niveau=lv, zone=zone(x, y))); break
    return out


def arbres(seed=41):
    """[C?] coraux branchus et algues géantes à la place des arbres ; [I] éponges et anémones du récif"""
    rnd = random.Random(seed); out = []; B = batiments()
    for k in range(9000):
        x, y = rnd.uniform(-33, 33), rnd.uniform(-33, 33); z_ = zone(x, y)
        if z_ in ('mer', 'eau', 'place', 'dojo', 'usine', 'mall', 'salle', 'port') or rue_d(x, y) < .75 or canal_d(x, y) < 1.5: continue
        if any(math.hypot(x - b['x'], y - b['y']) < b['s'] + .4 for b in B): continue
        if math.hypot(x - BADGE3D[0], y - BADGE3D[1]) < 2.4 or math.hypot(x - COULOIR[-1][0], y - COULOIR[-1][1]) < 2.0: continue
        p = {'recif': .12, 'recif_haut': .08, 'gyoverly': .05, 'ville': .015, 'moulins': .02}.get(z_, 0)
        if rnd.random() < p:
            kind = rnd.choices(('corail', 'algue', 'eponge'), (5, 3, 2) if z_ == 'recif' else (6, 4, 1))[0]
            out.append((x, y, .7 + .5 * rnd.random(), kind, 1))
    return out


if __name__ == '__main__':
    from collections import Counter
    B = batiments(); print(len(B), 'bâtiments', dict(Counter(b['type'] for b in B)), 'niveaux', dict(Counter(b['niveau'] for b in B)))
    A = arbres(); print(len(A), 'végétaux', dict(Counter(a[3] for a in A)))
    print('z place', round(height(*PLACE[:2]), 2), 'z bulle palais', round(z_bulle(*PALAIS[:2]), 1), 'badge3d', zone(*BADGE3D), 'badge25', zone(*BADGE25),
          {n: zone(*p[:2]) for n, p in (('usine', USINE), ('mall', MALL), ('salle', SALLE), ('dojo', DOJO), ('moulins', MOULINS), ('crique', CRIQUE))})
