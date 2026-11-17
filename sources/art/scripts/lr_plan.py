"""La Ruche — plan de masse et plan de production (île 13, procédure art/PROCEDURE_ILE.md, 17/11/2026).
Fiche canonique : art/data/fiches/la_ruche.json. Source (consultée le 17/11/2026) : One Piece Wiki « Hachinosu ».
  [C] socle de roche gris sombre ; constructions de roche jaunâtre ; formation en crâne au centre, qui domine tout ; forteresse à l'intérieur ;
      baie vitrée géante dans le nez, petites fenêtres, orbites qui traversent toute la structure ;
      ville de nombreux petits bâtiments carrés en briques grossières autour du crâne ; palmiers démesurés autour du crâne ;
      crâne fendu puis rafistolé avec des pansements ; ville remise en place.
  [I] positions, tailles, rues en damier, quais et jetées (le wiki ne parle pas de port), rochers, arène (niveau 4).
Exclus : personnages, pavillons, emblèmes, bandana et nœud sculptés, navires identifiables, Poneglyph, or, copie de tout décor officiel.
Repère du jeu : x vers l'est, y vers le sud, z vers le haut ; centre de l'île = (0, 0).
"""
import json, math, os, random

ART = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
_d = json.load(open(os.path.join(ART, 'data', 'islands.json'), encoding='utf-8'))
ISL = [i for i in _d['iles'] if i['nom'] == 'La Ruche'][0]
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
CRANE = (0.0, 1.0, 7.2)                 # [C] crâne au centre (centre, rayon) [mesures I] ; face tournée vers le sud (caméra 2.5D)
MONT = 11.0                             # [I] butte de roche qui porte le crâne et les terrasses de maisons (d'après l'image de référence de l'utilisateur)
TERRASSES = (1.0, 2.2, 3.4)             # [I] anneaux de maisons serrées au pied du crâne (décalage depuis l'ellipse du crâne)
VILLE = (0.0, 2.0, 21.0, 18.5)          # [C : ville autour du crâne, bâtiments carrés] [I] ville carrée : centre, demi-largeur, demi-hauteur
PAS = 3.4                               # [I] rues en damier
PORT_A = D(90)                          # [I] quais au sud
ARENE = (15.5, -16.5, 3.4)              # [I] arène (niveau 4)
PALMIERS = [(D(a), d) for a, d in ((-150, 12.0), (-110, 12.4), (-70, 12.0), (-30, 12.6), (5, 12.2), (40, 12.8), (138, 12.8), (172, 12.2))]   # aucun devant la face
AIGUILLES = [(-6.8, 4.6, 1.0), (7.2, 4.2, .9), (-5.0, -6.4, .8)]   # [I d'après l'image de référence] aiguilles de roche brune au pied du crâne
ROCHERS = [(D(a), k, s) for a, k, s in ((-170, .9, 1.4), (-130, .92, 1.1), (-95, .9, 1.6), (-55, .88, 1.2), (-20, .92, 1.0), (15, .9, 1.3), (40, .93, 1.1), (140, .9, 1.2), (165, .92, 1.5), (-150, .78, 1.0), (-60, .76, .9), (150, .8, .9))]
BADGE3D, BADGE25 = (0.0, -9.0), (0.0, .55 * R)


def dans_ville(x, y): return abs(x - VILLE[0]) < VILLE[2] and abs(y - VILLE[1]) < VILLE[3]


def height(x, y):
    r, th, q = pol(x, y)
    if q >= 1: return -1.8
    h = 1.3 + .45 * math.sin(x * .31 + math.cos(y * .23) * 2) * math.cos(y * .27 - x * .1)
    if not dans_ville(x, y): h += .7 * max(0, math.sin(x * .5) * math.sin(y * .45)) + .5                 # landes rocheuses hors de la ville
    else: h = 1.4 + .25 * (h - 1.3)                                                                       # ville presque plate
    dc = math.hypot(x - CRANE[0], y - CRANE[1]); h += 3.0 * (1 - ss(5.0, MONT, dc))                       # butte du crâne
    port = angd(th, PORT_A) < .32
    if port: h = h * (1 - ss(.78, .9, q)) + .55 * ss(.78, .9, q)                                         # descente vers les quais
    k = ss(.9, .985, q) if not port else ss(.95, .99, q); edge = .1 if port else -1.8                    # falaises sombres, sauf aux quais
    if q < .99: return h * (1 - k) + edge * k
    return edge + (-1.8 - edge) * ss(.99, 1, q)


def zone(x, y):
    r, th, q = pol(x, y)
    if q >= 1: return 'mer'
    if angd(th, PORT_A) < .32 and q > .8: return 'port'
    if q > .9: return 'falaise'
    dc = math.hypot(x - CRANE[0], y - CRANE[1])
    if dc < CRANE[2] * .62 + .6: return 'crane'
    if dc < MONT: return 'mont'
    if math.hypot(x - ARENE[0], y - ARENE[1]) < ARENE[2] + .8: return 'arene'
    if dans_ville(x, y): return 'ville'
    return 'lande'


def rue_d(x, y):
    """[I] damier : distance à la rue la plus proche ; grande rue nord-sud vers les quais"""
    gx = abs(((x - VILLE[0]) + PAS / 2) % PAS - PAS / 2); gy = abs(((y - VILLE[1]) + PAS / 2) % PAS - PAS / 2)
    return min(gx, gy, abs(x) - .6 if abs(x) > .6 else 0)


def obstacle(x, y):
    if zone(x, y) in ('mer', 'port', 'falaise', 'crane', 'mont', 'arene'): return True
    if rue_d(x, y) < .45 or math.hypot(x - BADGE3D[0], y - BADGE3D[1]) < 2.6: return True
    for a, d in PALMIERS:
        if math.hypot(x - (CRANE[0] + math.cos(a) * d), y - (CRANE[1] + math.sin(a) * d)) < 1.0: return True
    return False


def batiments(seed=1313):
    """[C : petits bâtiments carrés en briques] îlots du damier : 2 à 4 maisons par îlot ; niveau selon la distance au crâne"""
    rnd = random.Random(seed); out = []
    for kr, oo in enumerate(TERRASSES):                                              # [I] maisons serrées en terrasses au pied du crâne (niveau 1), en anneaux
        ax_, ay_ = 6.2 + oo, 3.0 + oo                                                 # elliptiques autour de la dalle du crâne (large est-ouest, mince nord-sud)
        n = int(math.pi * (ax_ + ay_) / 1.35)
        for k in range(n):
            a = k / n * TAU + kr * .4 + (rnd.random() - .5) * .1
            x, y = CRANE[0] + math.cos(a) * ax_, CRANE[1] + math.sin(a) * ay_
            if abs(x - CRANE[0]) < 1.6 and y > CRANE[1]: continue                    # perron et grande rue vers les quais
            if any(math.hypot(x - ax, y - ay) < 1.6 for ax, ay, s_ in AIGUILLES) or math.hypot(x - BADGE3D[0], y - BADGE3D[1]) < 2.6: continue
            if rnd.random() < .12: continue
            w, d = .9 + .35 * rnd.random(), .9 + .3 * rnd.random()
            out.append(dict(x=x, y=y, ang=math.atan2((y - CRANE[1]) / ay_ ** 2, (x - CRANE[0]) / ax_ ** 2), w=w, d=d, type='terrasse', etages=1 + (kr < 2) + (rnd.random() < .4), niveau=1, zone='mont'))
    nx = int(VILLE[2] / PAS) + 1; ny = int(VILLE[3] / PAS) + 1
    for j in range(-ny, ny):
        for i in range(-nx, nx):
            bx, by = VILLE[0] + (i + .5) * PAS, VILLE[1] + (j + .5) * PAS            # centre d'îlot
            for su, sv in ((-1, -1), (1, -1), (-1, 1), (1, 1)):
                if rnd.random() < .22: continue
                x, y = bx + su * .62, by + sv * .62
                w, d = .8 + .35 * rnd.random(), .8 + .35 * rnd.random()
                if obstacle(x, y) or any(zone(x + a * w * .5, y + b * d * .5) != 'ville' or rue_d(x + a * w * .5, y + b * d * .5) < .2 for a in (-1, 1) for b in (-1, 1)): continue
                ang = math.pi / 2 if sv > 0 else -math.pi / 2                            # façade vers la rue la plus proche
                if rnd.random() < .35: ang = 0.0 if su > 0 else math.pi
                dc = math.hypot(x - CRANE[0], y - CRANE[1])
                lv = 1 if dc < 16 else (2 if dc < 19.5 else 3)
                et = 1 + (rnd.random() < (.45 if dc < 15 else .25))
                out.append(dict(x=x, y=y, ang=ang, w=w, d=d, type='maison', etages=et, niveau=lv, zone='ville'))
    return out


def arbres(seed=31):
    """[C] palmiers démesurés autour du crâne ; [I] palmiers ordinaires épars et arbustes secs des landes"""
    rnd = random.Random(seed); out = []
    for a, d in PALMIERS:
        x, y = CRANE[0] + math.cos(a) * d, CRANE[1] + math.sin(a) * d; out.append((x, y, 1.0 + .2 * rnd.random(), 'geant', 1))
    B = batiments()
    for k in range(6000):
        x, y = rnd.uniform(-33, 33), rnd.uniform(-33, 33); z_ = zone(x, y)
        if z_ not in ('lande', 'ville'): continue
        if z_ == 'ville' and (rue_d(x, y) < .45 or rnd.random() > .02): continue
        if any(abs(x - b['x']) < b['w'] / 2 + .4 and abs(y - b['y']) < b['d'] / 2 + .4 for b in B): continue
        if math.hypot(x - BADGE3D[0], y - BADGE3D[1]) < 2.4: continue
        if z_ == 'lande' and rnd.random() < .05: out.append((x, y, .8 + .3 * rnd.random(), rnd.choice(('palmier', 'buisson', 'buisson')), 1))
        elif z_ == 'ville': out.append((x, y, .7, 'palmier', 1))
    return out


if __name__ == '__main__':
    from collections import Counter
    B = batiments(); print(len(B), 'bâtiments', 'niveaux', dict(Counter(b['niveau'] for b in B)), 'étages', dict(Counter(b['etages'] for b in B)))
    A = arbres(); print(len(A), 'arbres', dict(Counter(a[3] for a in A)))
    print('z crane', round(height(*CRANE[:2]), 2), 'z ville', round(height(10, 10), 2), 'z port', round(height(*at_coast(PORT_A, .95)), 2),
          'badge3d', zone(*BADGE3D), 'badge25', zone(*BADGE25), 'arene', zone(*ARENE[:2]))
