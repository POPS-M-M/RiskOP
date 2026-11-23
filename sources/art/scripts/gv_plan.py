"""God Valley — plan de masse et plan de production (île 17, procédure art/PROCEDURE_ILE.md, 17/11/2026).
Fiche canonique : art/data/fiches/god_valley.json. Sources (consultées le 17/11/2026) : One Piece Wiki « God Valley », « God Valley Incident » ;
Beebom « God Valley Incident explained » ; image de référence et description fournies par l'utilisateur (17/11/2026).
  [C] île de West Blue ; falaises hautes et abruptes, canyons couverts de végétation ; montagnes ; habitants et roi de l'île.
  [I, d'après la description de l'utilisateur] une montagne ocre coupée en deux par une faille verticale étroite et droite qui descend
      jusqu'à la base sans couper le sol (deux tours très hautes et étroites) ; un piton moyen à gauche, un plus petit à droite, une avancée
      rocheuse basse vers la droite ; une ceinture serrée de bâtiments portuaires et de petits bateaux de bois au pied des falaises, au ras de l'eau.
  [I] île avant l'incident ; palais du roi (niveau 4) ; positions et proportions.
Exclus : personnages, Dragons Célestes, navires identifiables, emblèmes, scènes de chasse ou de combat, copie de l'image de référence.
Repère du jeu : x vers l'est, y vers le sud, z vers le haut ; centre de l'île = (0, 0). « Gauche / droite » : vue du sud (ouest / est).
"""
import json, math, os, random

ART = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
_d = json.load(open(os.path.join(ART, 'data', 'islands.json'), encoding='utf-8'))
ISL = [i for i in _d['iles'] if i['nom'] == 'God Valley'][0]
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


# ---------------------------------------------------------------- éléments [I]
MONT = (0.0, -3.0)            # centre de la montagne coupée
FAILLE = 1.1                  # largeur de la faille (droite, nord-sud, jusqu'à la base)
PROFIL = [(-1.0, 15.2, 12.6), (1.5, 14.6, 12.0), (3.0, 13.6, 11.2), (3.05, 12.9, 10.6), (8.0, 12.2, 10.0), (8.05, 11.5, 9.4),
          (14.0, 11.0, 9.0), (20.0, 10.5, 8.5), (20.05, 9.9, 8.0), (27.0, 9.5, 7.6), (34.0, 9.0, 7.1), (34.05, 8.4, 6.6),
          (40.0, 7.6, 6.0), (44.0, 6.4, 5.0), (46.0, 5.0, 3.9)]   # (hauteur au-dessus du pied, demi-axe x, demi-axe y) ; paires à 0,05 près = corniches
PIED = 3.0                    # altitude du pied de la montagne
PITONS = [(-19.5, -1.0, 3.8, 21.0, -.04, .0, .45), (17.5, 2.5, 2.6, 12.0, .04, .01, .5)]   # (x, y, rayon, hauteur, inclinaisons, effilement)
AVANCEE = ((13.0, 5.0), (25.5, 9.5), 3.2, 4.2)   # avancée rocheuse basse vers la droite : de, à, demi-largeur, hauteur
PORT_A = D(92)                # port principal au sud
PALAIS = (-12.0, 14.5)        # palais du roi (niveau 4), sur le pied de la falaise, au sud-ouest
BADGE3D, BADGE25 = (0.0, -9.0), (0.0, .55 * R)


def mont_e(x, y):
    """norme elliptique de la base de la montagne (1 = pied des falaises), contour irrégulier"""
    a = math.atan2(y - MONT[1], x - MONT[0]); _, rx, ry = PROFIL[1]; rx, ry = rx * 1.04, ry * 1.04
    return math.hypot((x - MONT[0]) / rx, (y - MONT[1]) / ry) * (1 + .05 * math.sin(6 * a + .7) + .03 * math.sin(13 * a))


def avancee_d(x, y):
    (x0, y0), (x1, y1), w, hh = AVANCEE; dx, dy = x1 - x0, y1 - y0; L2 = dx * dx + dy * dy
    t = max(0, min(1, ((x - x0) * dx + (y - y0) * dy) / L2)); px, py = x0 + dx * t, y0 + dy * t
    return math.hypot(x - px, y - py) / (w * (1 - .45 * t)), t


def height(x, y):
    r, th, q = pol(x, y)
    if q >= 1: return -1.8
    e = mont_e(x, y)
    h = 1.0 + .2 * math.sin(x * .3 + math.cos(y * .25) * 2) * math.cos(y * .27 - x * .1)
    h += (PIED - .3) * (1 - ss(.95, 1.45, e))                                          # éboulis du pied des falaises
    ad, t = avancee_d(x, y); hh = AVANCEE[3] * (1 - .55 * t)
    h = max(h, 1.0 + hh * (1 - ss(.55, 1.0, ad)))                                      # avancée rocheuse
    port = angd(th, PORT_A) < .2
    k = ss(.9, .985, q) if not port else ss(.92, .99, q); edge = .25 if port else .0
    if q < .99: return max(.45, h) * (1 - k) + edge * k
    return edge + (-1.8 - edge) * ss(.99, 1, q)


def zone(x, y):
    r, th, q = pol(x, y)
    if q >= 1: return 'mer'
    if angd(th, PORT_A) < .2 and q > .88: return 'port'
    if q > .94: return 'plage'
    if mont_e(x, y) < 1.0: return 'mont'
    for px, py, rb, hh, lx, ly, tp in PITONS:
        if math.hypot(x - px, y - py) < rb + .6: return 'piton'
    if avancee_d(x, y)[0] < .8: return 'avancee'
    if math.hypot(x - PALAIS[0], y - PALAIS[1]) < 4.2: return 'palais'
    if q > .73: return 'quai'
    return 'pied'


def rue_d(x, y):
    """[I] quai circulaire au ras de l'eau et quelques ruelles vers le pied des falaises"""
    r, th, q = pol(x, y); rc = coast_r(th)
    quai = abs(r - rc * .9)
    ray = min(angd(th, a) for a in [D(k) for k in range(0, 360, 30)]) * r
    return min(quai, ray if q > .74 else 9.0)


def obstacle(x, y):
    z_ = zone(x, y)
    if z_ in ('mer', 'port', 'plage', 'mont', 'piton', 'avancee'): return True
    if rue_d(x, y) < .5 or math.hypot(x - BADGE25[0], y - BADGE25[1]) < 2.3: return True
    return False


def batiments(seed=1717):
    """[I d'après la description] ceinture serrée de bâtiments portuaires (pavillons blancs, entrepôts) tout autour, au ras de l'eau ;
    niveau 1 : moitié sud, niveau 2 : moitié nord, niveau 3 : deuxième rang sur le pied des falaises, niveau 4 : palais du roi"""
    rnd = random.Random(seed); out = []; pris = [(PALAIS[0], PALAIS[1], 3.6)]
    def libre(x, y, s): return not any(math.hypot(x - px, y - py) < s + ps + .2 for px, py, ps in pris)
    for essai in range(22000):
        a = rnd.uniform(-math.pi, math.pi); q = rnd.uniform(.6, .9); x, y = at_coast(a, q)
        z_ = zone(x, y)
        if obstacle(x, y) or z_ not in ('quai', 'pied'): continue
        s = .62 + .2 * rnd.random()
        if not libre(x, y, s) or any(obstacle(x + math.cos(b) * s, y + math.sin(b) * s) for b in (0, 1.57, 3.14, 4.71)): continue
        pris.append((x, y, s))
        if z_ == 'quai': lv = 1 if y > -2 else 2; ty = 'pavillon' if rnd.random() < .7 else 'entrepot'
        else: lv = 3; ty = 'entrepot' if rnd.random() < .5 else 'pavillon'
        out.append(dict(x=x, y=y, ang=a + math.pi, s=s, type=ty, etages=1 + (rnd.random() < .3), niveau=lv, zone=z_))
    out.append(dict(x=PALAIS[0], y=PALAIS[1], ang=math.atan2(-PALAIS[1], -PALAIS[0]) + math.pi, s=3.0, type='palais', etages=2, niveau=4, zone='palais'))
    return out


def bateaux(seed=1718):
    """[I d'après la description] petits bateaux de bois serrés tout autour de l'île (aucun navire identifiable)"""
    rnd = random.Random(seed); out = []; a = -math.pi
    while a < math.pi:
        if angd(a, PORT_A) > .12:
            k = rnd.uniform(1.03, 1.1); x, y = at_coast(a, k)
            out.append((x, y, a + math.pi / 2 + rnd.uniform(-.4, .4), 'barque' if rnd.random() < .78 else 'voilier', 1 if y > -2 else 2))
        a += rnd.uniform(.045, .075)
    return out


def arbres(seed=71):
    """[C : falaises et canyons couverts de végétation] touffes et arbres au pied des falaises et sur l'avancée ; palmiers au quai"""
    rnd = random.Random(seed); out = []; B = batiments()
    for k in range(9000):
        x, y = rnd.uniform(-31, 31), rnd.uniform(-31, 31); z_ = zone(x, y)
        if z_ not in ('pied', 'quai', 'avancee', 'palais') or rue_d(x, y) < .6: continue
        if any(math.hypot(x - b['x'], y - b['y']) < b['s'] * 1.1 + .3 for b in B): continue
        if math.hypot(x - BADGE25[0], y - BADGE25[1]) < 2.2: continue
        p = {'pied': .2, 'quai': .02, 'avancee': .1, 'palais': .03}[z_]
        if rnd.random() < p: out.append((x, y, .6 + .4 * rnd.random(), 'palmier' if z_ == 'quai' else ('jungle' if rnd.random() < .75 else 'rond'), 1))
    return out


if __name__ == '__main__':
    from collections import Counter
    B = batiments(); print(len(B), 'bâtiments', dict(Counter(b['type'] for b in B)), 'niveaux', dict(Counter(b['niveau'] for b in B)))
    print(len(bateaux()), 'bateaux'); A = arbres(); print(len(A), 'arbres', dict(Counter(a[3] for a in A)))
    print('badge3d', zone(*BADGE3D), 'badge25', zone(*BADGE25), 'palais', zone(*PALAIS), 'port', zone(*at_coast(PORT_A, .93)), 'avancée', zone(19, 7))
