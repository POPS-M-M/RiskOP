"""Laugh Tale — plan de masse et plan de production (île 9, procédure art/PROCEDURE_ILE.md, 16/11/2026).
Fiche canonique : art/data/fiches/laugh_tale.json. Sources (consultées le 16/11/2026) : One Piece Wiki « Laugh Tale » ;
Sportskeeda Wiki « Laugh Tale in One Piece » ; Slashfilm (06/01/2026).
  [C] dernière île du Nouveau Monde ; rivage de falaises abruptes et beaucoup de nature sauvage ;
      des objets qui ont la forme de bâtiments ou de fortifications. Climat, taille, intérieur : inconnus.
  [I] tout le reste : anneau de falaises à strates, aiguilles au large, un seul fjord (est) fermé par une porte monumentale,
      massif central et tour brisée, citadelle en ruine à double enceinte (épaulement ouest), quartier en terrasses le long
      d'une chaussée, forêt de très grands arbres, conifères d'altitude, cascade dans le fjord ;
      niveaux de ville = camp d'expédition (1), terrasses restaurées (2), quartier de la citadelle relevé (3), phare-balise (4).
Exclus : personnages, trésor, Poneglyphes, emblèmes, navires identifiables, copie de tout décor officiel.
Repère du jeu : x vers l'est, y vers le sud, z vers le haut ; centre de l'île = (0, 0).
"""
import json, math, os, random

ART = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
_d = json.load(open(os.path.join(ART, 'data', 'islands.json'), encoding='utf-8'))
ISL = [i for i in _d['iles'] if i['nom'] == 'Laugh Tale'][0]
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


def poly_t(px, py, pts):
    """distance à la polyligne et abscisse normalisée (0 au début, 1 à la fin)"""
    L = [math.hypot(b[0] - a[0], b[1] - a[1]) for a, b in zip(pts, pts[1:])]; tot = sum(L); best = (1e9, 0); acc = 0
    for (a, b), l in zip(zip(pts, pts[1:]), L):
        d, t = seg_dist(px, py, *a, *b)
        if d < best[0]: best = (d, (acc + t * l) / tot)
        acc += l
    return best


# ---------------------------------------------------------------- éléments [I] (aucun n'est montré dans l'œuvre)
FJORD = [(36.0, 1.0), (27.0, 0.0), (21.0, 1.6), (16.5, 0.9), (14.8, 1.0)]   # un seul accès, par l'est
FJ_W = (5.2, 2.2)                                   # demi-largeur à l'embouchure → au fond
FOND = (11.4, 1.0)                                  # fond du fjord : grève et camp (niveau 1)
PORTE = (8.0, 1.6)                                  # porte monumentale en haut de la grève
CITADELLE = (-13.5, -1.0, 6.2)                      # épaulement ouest : citadelle à double enceinte (fortification [C : forme])
SOMMET = (7.0, -15.0, 8.5)                          # massif central (île « montagne » dans le jeu) et tour brisée
TERRASSES = (-1.0, 4.5, 9.5, 6.0)                   # quartier en terrasses (ellipse cx, cy, rx, ry)
CHAUSSEE = [PORTE, (6.5, 2.4), (3.0, 3.6), (-1.0, 4.4), (-5.0, 3.4), (-8.6, 1.0), (-10.4, -.4)]   # chaussée et escaliers → porte de la citadelle
SENTIERS = [[(5.0, 3.0), (6.0, -3.5), (6.5, -9.0), (7.0, -13.5)],                      # vers le sommet
            [(-5.0, 3.4), (-6.0, 9.0), (-4.0, 14.5)],                                   # vers les falaises sud
            [(14.0, -1.5), (18.0, -5.5), (22.5, -6.5)]]                                # vers le phare-balise (niveau 4)
RUISSEAU = [(9.0, -11.0), (13.0, -8.0), (16.5, -4.6), (19.0, -2.6)]                  # descend du massif, tombe dans le fjord
PHARE = (23.0, -7.0)                                # phare-balise sur la falaise nord du fjord (niveau 4)
PITONS = [(D(a), k, s) for a, k, s in ((-150, 1.12, 1.0), (-128, 1.08, .7), (-40, 1.1, .9), (55, 1.1, 1.1), (75, 1.14, .7), (112, 1.09, .9),
                                        (160, 1.1, 1.2), (172, 1.17, .6), (-95, 1.1, .8), (25, 1.12, .6))]   # aiguilles au large
TOURS = [(D(a), .9) for a in (-118, -52, 38, 96, 148, -170)]           # tours de guet en ruine sur le rebord (vues de la mer) [C : forme de fortifications]
BADGE3D, BADGE25 = (0.0, -9.0), (0.0, .55 * R)


def fjord(x, y):
    """(distance au chenal, abscisse 0 embouchure → 1 fond, demi-largeur locale)"""
    d, t = poly_t(x, y, FJORD); return d, t, FJ_W[0] + (FJ_W[1] - FJ_W[0]) * t


def in_fjord(x, y):
    d, t, w = fjord(x, y); return d < w and (t < .999 or math.hypot(x - FJORD[-1][0], y - FJORD[-1][1]) < w)


def chemin_d(x, y): return min(poly_dist(x, y, c) for c in [CHAUSSEE] + SENTIERS)


def terr_d(x, y):
    return math.hypot((x - TERRASSES[0]) / TERRASSES[2], (y - TERRASSES[1]) / TERRASSES[3])


def cit_d(x, y): return math.hypot(x - CITADELLE[0], (y - CITADELLE[1]) * 1.1) / CITADELLE[2]


def ondul(x, y): return .4 * math.sin(x * .27 + math.cos(y * .19) * 1.3) * math.cos(y * .23 + .5) + .2 * math.sin(x * .7 + y * .5)


def rugos(x, y): return .35 * abs(math.sin(x * 1.3 + y * .4)) * abs(math.cos(y * 1.1 - x * .3))


FALAISE_TOP = 4.2


def height_lisse(x, y):
    r, th, q = pol(x, y)
    if q >= 1.0 and not in_fjord(x, y): return -1.8
    # plateau sauvage, plus haut vers le massif
    h = 3.4 + ondul(x, y)
    ds = math.hypot(x - SOMMET[0], (y - SOMMET[1]) * 1.15)
    h += SOMMET[2] * (1 - ss(0, 10.5, ds)) ** 1.6 + rugos(x, y) * (1 - ss(4, 9, ds)) * 2
    # quartier en terrasses : marches de .7, montant du fjord vers la citadelle
    td = terr_d(x, y)
    if td < 1.25:
        raw = 3.3 + (8.0 - x) / 18.0 * 2.4; step = round(raw / .7) * .7
        k = 1 - ss(.85, 1.25, td); h = h * (1 - k) + step * k
    # citadelle : table plate dominant le reste
    cd = cit_d(x, y)
    if cd < 1.45: k = 1 - ss(1.0, 1.45, cd); h = h * (1 - k) + 6.0 * k
    # rebord de falaise : le sommet monte un peu, puis à-pic sur la mer (strates peintes à part)
    rim = ss(.8, .95, q); h = max(h, h * (1 - rim) + (FALAISE_TOP + .6 * math.sin(th * 7) + .3 * math.sin(th * 17)) * rim)
    if q > .965: h = h + (-1.8 - h) * ss(.965, .99, q)
    # fjord : parois verticales, eau au fond ; grève et terre-plein au fond
    d, t, w = fjord(x, y)
    if d < w + 1.8:
        if d < w and math.hypot(x - FOND[0], y - FOND[1]) > 2.6: h = -1.2
        elif d < w: h = .3
        else: h = min(h, -1.2 + (h + 1.2) * ss(w, w + 1.8, d) ** .35)
    df = math.hypot(x - FOND[0], y - FOND[1])
    if df < 4.2:
        g = .45 + .25 * ss(1.5, 4.0, df); k = 1 - ss(3.0, 4.2, df); h = h * (1 - k) + g * k
    # rampe de la grève à la porte puis aux terrasses (la chaussée se pose dessus)
    dp, tp = poly_t(x, y, CHAUSSEE[:3])
    if dp < 1.6 and tp < 1: k = 1 - ss(.9, 1.6, dp); h = h * (1 - k) + (.5 + 3.0 * ss(0, 1, tp)) * k
    return h


def height(x, y): return height_lisse(x, y)


def water_at(x, y):
    if in_fjord(x, y) and math.hypot(x - FOND[0], y - FOND[1]) > 2.6: return 0.0
    return None


def zone(x, y):
    r, th, q = pol(x, y)
    if in_fjord(x, y) and math.hypot(x - FOND[0], y - FOND[1]) > 2.6: return 'fjord'
    if q >= 1: return 'mer'
    if math.hypot(x - FOND[0], y - FOND[1]) < 3.6: return 'greve'
    if cit_d(x, y) < 1.1: return 'citadelle'
    if terr_d(x, y) < 1.0: return 'terrasses'
    if q > .9: return 'falaise'
    if math.hypot(x - SOMMET[0], (y - SOMMET[1]) * 1.15) < 5.0 or height_lisse(x, y) > 9.0: return 'rocaille'
    if math.hypot(x - SOMMET[0], (y - SOMMET[1]) * 1.15) < 8.5: return 'altitude'
    return 'foret'


def pente(x, y):
    e = .35; return math.hypot(height_lisse(x + e, y) - height_lisse(x - e, y), height_lisse(x, y + e) - height_lisse(x, y - e)) / (2 * e)


def ruisseau_d(x, y): return poly_dist(x, y, RUISSEAU)


def obstacle(x, y, pmax=.75):
    r, th, q = pol(x, y)
    if q > .9 or zone(x, y) in ('fjord', 'mer'): return True
    if any(math.hypot(x - tx, y - ty) < 1.4 for tx, ty in (at_coast(a, k) for a, k in TOURS)): return True
    if chemin_d(x, y) < .75 or ruisseau_d(x, y) < .8: return True
    if math.hypot(x - PORTE[0], y - PORTE[1]) < 1.8 or math.hypot(x - PHARE[0], y - PHARE[1]) < 1.6: return True
    if math.hypot(x - BADGE3D[0], y - BADGE3D[1]) < 2.4: return True
    if pente(x, y) > pmax: return True
    return False


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


def _place(occ, out, x, y, ang, w, d, pmax=.75, dz=.55, **kw):
    c, s = math.cos(ang), math.sin(ang)
    corners = [(x + su * w / 2 * -s + sv * d / 2 * c, y + su * w / 2 * c + sv * d / 2 * s) for su in (-1, 1) for sv in (-1, 1)]
    if any(obstacle(qx, qy, pmax) for qx, qy in corners + [(x, y)]) or not occ.libre(x, y, ang, w, d): return False
    hs = [height(qx, qy) for qx, qy in corners]
    if max(hs) - min(hs) > dz: return False
    occ.prendre(x, y, ang, w, d); out.append(dict(x=x, y=y, ang=ang, w=w, d=d, **kw)); return True


def _occ_fixes(occ):
    occ.prendre(CITADELLE[0], CITADELLE[1], 0, 2 * CITADELLE[2] * .48, 2 * CITADELLE[2] * .44)
    occ.prendre(PORTE[0], PORTE[1], 0, 3.0, 3.0); occ.prendre(PHARE[0], PHARE[1], 0, 2.4, 2.4)
    occ.prendre(SOMMET[0], SOMMET[1], 0, 3.0, 3.0)
    for a, k in TOURS: x, y = at_coast(a, k); occ.prendre(x, y, 0, 2.0, 2.0)


def batiments(seed=909):
    """coquilles en ruine (maisons sans toit, décor) ; leur restauration (toit neuf) arrive aux niveaux 2 (terrasses basses) et 3 (près de la citadelle) ;
    camp d'expédition au fond du fjord (niveau 1) ; postes de guet sur les falaises (niveau 2)"""
    rnd = random.Random(seed); occ = Occupation(); out = []; _occ_fixes(occ)
    # camp d'expédition : tentes en arc sur la grève [I]
    for k in range(60):
        if len([b for b in out if b['type'] == 'tente']) >= 9: break
        a = D(rnd.uniform(-170, 170)); d_ = 1.4 + 2.2 * rnd.random()
        x, y = FOND[0] + math.cos(a) * d_, FOND[1] + math.sin(a) * d_
        if math.hypot(x - FOND[0], y - FOND[1]) > 3.4 or in_fjord(x, y) and math.hypot(x - FOND[0], y - FOND[1]) > 2.6: continue
        _place(occ, out, x, y, a + math.pi / 2, .85, .85, pmax=2.5, type='tente', zone='camp', niveau=1)
    # coquilles le long de la chaussée (de part et d'autre), puis remplissage des terrasses ; quelques-unes autour de la citadelle
    pts = []
    for (ax, ay), (bx, by) in zip(CHAUSSEE, CHAUSSEE[1:]):
        L_ = math.hypot(bx - ax, by - ay); n = max(1, int(L_ / .9))
        for k in range(n): f = k / n; pts.append((ax + (bx - ax) * f, ay + (by - ay) * f, math.atan2(by - ay, bx - ax)))
    for x, y, a in pts:
        for side in (-1, 1):
            if rnd.random() < .2: continue
            off = 1.55 + .35 * rnd.random(); px, py = x + math.cos(a + side * math.pi / 2) * off, y + math.sin(a + side * math.pi / 2) * off
            w = 1.3 + .5 * rnd.random()
            lv = 2 if px > -4 else 3
            _place(occ, out, px, py, a, w, w * (.75 + .2 * rnd.random()), dz=.8, type='coquille', zone='terrasses', niveau=1, restaure=lv if rnd.random() < .75 else 0)
    for k in range(3000):
        x, y = rnd.uniform(-14, 10), rnd.uniform(-9, 12)
        td, cd = terr_d(x, y), cit_d(x, y)
        if not (td < 1.05 or 1.05 < cd < 1.6 or .5 < cd < .78): continue
        w = 1.0 + .5 * rnd.random(); lv = 2 if (td < 1.05 and x > -4) else 3
        ang = round(rnd.uniform(0, 4)) * math.pi / 2 + rnd.uniform(-.08, .08) + (.4 if cd < 1.6 else 0)
        _place(occ, out, x, y, ang, w, w * (.75 + .2 * rnd.random()), dz=.8, type='coquille', zone='terrasses' if td < 1.05 else 'citadelle',
               niveau=1, restaure=lv if rnd.random() < (.7 if lv == 2 else .65) else 0)
    # postes de guet en bois sur le rebord des falaises (niveau 2) et cabanes de chantier (niveau 3) [I]
    for k in range(400):
        a = rnd.uniform(-math.pi, math.pi); x, y = at_coast(a, .84 + .03 * rnd.random())
        if angd(a, 0) < .5: continue
        if len([b for b in out if b['type'] == 'guet']) >= 6: break
        if all(math.hypot(x - b['x'], y - b['y']) > 9 for b in out if b['type'] == 'guet'):
            _place(occ, out, x, y, a, .8, .8, pmax=1.2, type='guet', zone='falaise', niveau=2)
    for k in range(1500):
        if len([b for b in out if b['type'] == 'cabane']) >= 14: break
        x, y = rnd.uniform(-20, 12), rnd.uniform(-12, 12)
        if not (1.15 < cit_d(x, y) < 1.7 or 1.0 < terr_d(x, y) < 1.25) or rnd.random() > .25: continue
        _place(occ, out, x, y, rnd.uniform(0, TAU), .9, .8, type='cabane', zone='chantier', niveau=3 if cit_d(x, y) < 2.2 else 2)
    return out


def arbres(seed=31):
    """forêt sauvage [C : beaucoup de nature sauvage] de très grands arbres [I], conifères d'altitude [I], arbres dans les ruines [I]"""
    rnd = random.Random(seed); out = []; occ = Occupation(); _occ_fixes(occ)
    for b in batiments(): occ.prendre(b['x'], b['y'], b['ang'], b['w'] + .3, b['d'] + .3)
    for k in range(14000):
        x, y = rnd.uniform(-33, 33), rnd.uniform(-33, 33); z_ = zone(x, y); r, th, q = pol(x, y)
        if z_ in ('mer', 'fjord', 'greve', 'rocaille') or chemin_d(x, y) < .8 or ruisseau_d(x, y) < .6: continue
        if math.hypot(x - BADGE3D[0], y - BADGE3D[1]) < 2.2: continue
        if z_ == 'foret' and rnd.random() < .5: kind, sz, lv = ('geant' if rnd.random() < .55 else 'feuillu'), 1.0, 1
        elif z_ == 'altitude' and rnd.random() < .3: kind, sz, lv = 'conifere', .9, 1
        elif z_ == 'falaise' and q < .95 and rnd.random() < .12: kind, sz, lv = rnd.choice(('conifere', 'feuillu')), .8, 1
        elif z_ in ('terrasses', 'citadelle') and rnd.random() < .05: kind, sz, lv = 'feuillu', .8, 1
        else: continue
        sz *= .85 + .4 * rnd.random(); wd = 1.5 * sz if kind == 'geant' else .9 * sz
        if not occ.libre(x, y, 0, wd, wd): continue
        out.append((x, y, sz, kind, lv)); occ.prendre(x, y, 0, wd, wd)
    return out


if __name__ == '__main__':
    from collections import Counter
    B = batiments(); print(len(B), 'bâtiments', dict(Counter(b['type'] for b in B)), 'niveaux', dict(Counter(b['niveau'] for b in B)),
                          'restaurées', dict(Counter(b.get('restaure') for b in B if b['type'] == 'coquille')))
    A = arbres(); print(len(A), 'arbres', dict(Counter(a[3] for a in A)))
    print('z sommet', round(height(SOMMET[0], SOMMET[1]), 1), 'citadelle', round(height(CITADELLE[0], CITADELLE[1]), 1), 'fond', round(height(*FOND), 2),
          'porte', round(height(*PORTE), 2), 'phare', round(height(*PHARE), 2), 'badge3d', round(height(*BADGE3D), 1))
