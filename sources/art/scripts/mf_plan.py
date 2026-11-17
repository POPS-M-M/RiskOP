"""Marineford — plan de masse et plan de production (île 15, procédure art/PROCEDURE_ILE.md, 17/11/2026).
Fiche canonique : art/data/fiches/marineford.json. Sources (consultées le 17/11/2026) : One Piece Wiki « Marineford », « Marine Headquarters ».
  [C] île en croissant, briques et acier, canons sur les bords ; QG au fond : forteresse + tour-pagode, petite montagne à chaque coin avec un petit
      bâtiment ; échafaud au centre entouré d'une petite ville arborée ; place Oris vide devant, cloche Ox à l'avant ; la ville couvre presque
      toute l'île ; baie fermée par le Mur d'encerclement (acier, sort de la mer, canons aux fenêtres du sommet).
  [I] île intacte (avant la guerre) ; positions et tailles ; plan en damier ; quais ; Mur d'encerclement dressé au niveau 4.
Exclus : personnages, inscriptions, kanji, symbole et drapeaux de la Marine, navires identifiables, Portes de la Justice, copie de tout décor officiel.
Repère du jeu : x vers l'est, y vers le sud, z vers le haut ; centre de l'île = (0, 0).
"""
import json, math, os, random

ART = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
_d = json.load(open(os.path.join(ART, 'data', 'islands.json'), encoding='utf-8'))
ISL = [i for i in _d['iles'] if i['nom'] == 'Marineford'][0]
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
BAIE = (0.0, 15.5, 10.5, 6.0)           # [C : croissant autour d'une baie] centre, rayon, demi-largeur du goulet vers le sud [I]
QG = (0.0, -18.5)                       # [C : QG au fond de l'île] (au nord, face à la baie) [I]
TERRASSE = (13.0, 9.0)                  # [I] terrasse du QG (largeur, profondeur)
MONTAGNES = [(-8.2, -23.2), (8.2, -23.2), (-8.2, -13.8), (8.2, -13.8)]   # [C : une petite montagne à chaque coin]
ECHAFAUD = (0.0, -4.0)                  # [C : échafaud au centre]
PLACE = (0.0, 0.6, 3.4)                 # [C : place Oris, vide, devant l'échafaud] centre, rayon
CLOCHE = (0.0, 3.4)                     # [C : cloche Ox à l'avant de la place]
PARC = 7.5                              # [C : petite ville arborée autour de l'échafaud] rayon du parc [I]
PAS = 4.0                               # [I] damier de la ville
BADGE3D, BADGE25 = (0.0, -9.0), (0.0, .55 * R)


def baie(x, y):
    bx, by, br, bg = BAIE
    return math.hypot(x - bx, y - by) < br or (abs(x - bx) < bg and y > by)


def baie_d(x, y):
    """distance (positive dehors) au bord de la baie"""
    bx, by, br, bg = BAIE
    d1 = math.hypot(x - bx, y - by) - br
    d2 = max(abs(x - bx) - bg, by - y) if y > by - 2 else 99
    return min(d1, d2)


def dans_qg(x, y): return abs(x - QG[0]) < TERRASSE[0] / 2 and abs(y - QG[1]) < TERRASSE[1] / 2


def height(x, y):
    r, th, q = pol(x, y)
    if q >= 1: return -1.8
    if baie(x, y): return -1.8
    h = 1.2 + .05 * math.sin(x * .4) * math.cos(y * .37)                                  # île plate, pavée
    if dans_qg(x, y): h = 2.6                                                             # terrasse du QG
    else:
        e = max(abs(x - QG[0]) - TERRASSE[0] / 2, abs(y - QG[1]) - TERRASSE[1] / 2)
        if e < 1.6: h = 2.6 + (1.2 - 2.6) * ss(0, 1.6, e)
    for mx, my in MONTAGNES:
        dm = math.hypot(x - mx, y - my)
        if dm < 3.2: h = max(h, 1.2 + 4.6 * (1 - ss(0, 3.2, dm)) ** 1.2)                       # petites montagnes des coins
    k = ss(.965, .985, q)                                                                 # quai droit (acier) au bord
    kb = ss(-.6, 0, -baie_d(x, y)) if baie_d(x, y) < .6 else 0
    h = h * (1 - k) + (-1.8) * k
    return h * (1 - kb) + (-1.8) * kb


def zone(x, y):
    r, th, q = pol(x, y)
    if q >= 1: return 'mer'
    if baie(x, y): return 'baie'
    if q > .93 or baie_d(x, y) < 1.4: return 'bord'
    if dans_qg(x, y): return 'qg'
    if any(math.hypot(x - mx, y - my) < 2.8 for mx, my in MONTAGNES): return 'montagne'
    if math.hypot(x - PLACE[0], y - PLACE[1]) < PLACE[2]: return 'place'
    if math.hypot(x - ECHAFAUD[0], y - ECHAFAUD[1]) < 2.2: return 'echafaud'
    if math.hypot(x - ECHAFAUD[0], y - ECHAFAUD[1]) < PARC: return 'parc'
    return 'ville'


def rue_d(x, y):
    """[I] damier : distance à la rue la plus proche"""
    gx = abs((x + PAS / 2) % PAS - PAS / 2); gy = abs(((y - 1.0) + PAS / 2) % PAS - PAS / 2)
    return min(gx, gy)


def obstacle(x, y):
    if zone(x, y) not in ('ville',): return True
    if rue_d(x, y) < .6 or math.hypot(x - BADGE3D[0], y - BADGE3D[1]) < 2.6: return True
    return False


def batiments(seed=1515):
    """[C : ville de briques et d'acier sur la plus grande partie de l'île] immeubles des îlots du damier ; niveau selon la distance à l'échafaud"""
    rnd = random.Random(seed); out = []
    for j in range(-9, 9):
        for i in range(-9, 9):
            bx, by = (i + .5) * PAS, 1.0 + (j + .5) * PAS
            for su, sv in ((-1, -1), (1, -1), (-1, 1), (1, 1)):
                if rnd.random() < .12: continue
                x, y = bx + su * .85, by + sv * .85; w, d = 1.25 + .3 * rnd.random(), 1.25 + .3 * rnd.random()
                if obstacle(x, y) or any(zone(x + a * w / 2, y + b * d / 2) != 'ville' or rue_d(x + a * w / 2, y + b * d / 2) < .3 for a in (-1, 1) for b in (-1, 1)): continue
                ang = math.pi / 2 if sv > 0 else -math.pi / 2
                if rnd.random() < .4: ang = 0.0 if su > 0 else math.pi
                de = math.hypot(x - ECHAFAUD[0], y - ECHAFAUD[1])
                lv = 1 if de < 16 else (2 if de < 21 else 3)
                out.append(dict(x=x, y=y, ang=ang, w=w, d=d, type='immeuble', etages=2 + (rnd.random() < .4) + (de < 12 and rnd.random() < .3), niveau=lv, zone='ville'))
    return out


def canons(n_cote=34):
    """[C : canons sur les bords] le long de la côte et du bord de la baie, tournés vers le large"""
    out = []
    for k in range(n_cote):
        a = k / n_cote * TAU
        x, y = at_coast(a, .945)
        if baie(x, y) or baie_d(x, y) < 1.2 or dans_qg(x, y): continue
        out.append((x, y, a))
    bx, by, br, bg = BAIE
    for k in range(14):
        a = math.pi + k / 13 * math.pi                                                    # rive nord de la baie (demi-cercle)
        x, y = bx + math.cos(a) * (br + 1.0), by + math.sin(a) * (br + 1.0)
        if zone(x, y) == 'mer': continue
        out.append((x, y, a + math.pi))
    return out


def arbres(seed=51):
    """[C : petite ville arborée autour de l'échafaud] arbres ronds du parc ; [I] quelques arbres d'alignement"""
    rnd = random.Random(seed); out = []
    for k in range(1600):
        a = rnd.uniform(0, TAU); d = rnd.uniform(2.6, PARC - .3); x, y = ECHAFAUD[0] + math.cos(a) * d, ECHAFAUD[1] + math.sin(a) * d
        if zone(x, y) != 'parc' or math.hypot(x - BADGE3D[0], y - BADGE3D[1]) < 2.4: continue
        if any(math.hypot(x - ox, y - oy) < 1.0 for ox, oy, *_ in out): continue
        out.append((x, y, .8 + .3 * rnd.random(), 'rond', 1))
    return out


if __name__ == '__main__':
    from collections import Counter
    B = batiments(); print(len(B), 'bâtiments', 'niveaux', dict(Counter(b['niveau'] for b in B)), 'étages', dict(Counter(b['etages'] for b in B)))
    A = arbres(); print(len(A), 'arbres'); print(len(canons()), 'canons')
    print('z qg', round(height(*QG), 2), 'z place', round(height(*PLACE[:2]), 2), 'badge3d', zone(*BADGE3D), 'badge25', zone(*BADGE25), 'echafaud', zone(*ECHAFAUD))
