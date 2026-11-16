"""Carte 2 de RISK OP — les 53 îles de la liste de l'utilisateur (classement « Top 1 à 53 »), placées dans leur mer canonique.

Règles suivies :
- une île déjà dans le jeu garde sa position, son rayon, son type et sa forme si sa mer actuelle est compatible avec l'œuvre ;
- une île dans la mauvaise mer est déplacée (La Ruche, Sphinx, Lulusia, Rusukaina, Kamabakka, Sorbet) ;
- 11 îles quittent la carte (Orange Town, Lvneel, Spider Miles, Mirrorball, Raijin, Karate, Briss, Torino, Birka, Baltigo ;
  Goa et Foosha deviennent une seule « Île de Dawn ») et 11 arrivent ;
- les noms sont ceux de la liste ; une île renommée garde la graine de forme de son ancien nom (SHAPE_KEY).
Mer de chaque île : [C] One Piece Wiki, [C?] de mémoire, [I] interprétation (lieu inconnu dans l'œuvre). Sources dans SOURCES.

Usage : python3 carte_canon.py → vérifie (chevauchements, routes qui traversent une île, connexité), écrit carte2.json
et apercu_carte2.png à côté de ce fichier.
"""
import json, math, os, sys
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
W, H = 1400, 860
RL_X, RL_HW, BELTS = 700, 17, [(290, 335), (550, 595)]
REG = ['East Blue', 'West Blue', 'North Blue', 'South Blue', 'Paradise', 'Nouveau Monde', 'Red Line']

# une île déplacée l'est d'un nombre pair d'unités (grille de 2) et garde son rayon : même forme, mêmes zones de clic à translation près
# ancien nom → nouveau nom (îles qui restent, renommées selon la liste)
RENAME = {
    'Elbaf': 'Elbaph', 'Wano': 'Pays des Wa', 'Hachinosu': 'La Ruche', 'Fish-Man': 'Île des Hommes-Poissons',
    'Whole Cake': 'Whole Cake Island', 'Kamabakka': 'Royaume de Kamabakka', 'New Marineford': 'Nouveau Marineford',
    'Sabaody': 'Archipel des Sabaody', 'Reverse Mountain': 'Cap des Jumeaux', 'Sorbet': 'Royaume de Sorbet',
    'Sphinx': 'Île de Sphinx', 'Drum': 'Île de Drum', 'Cocoyasi': 'Archipel des Konomi', 'Germa': 'Royaume de Germa',
    'Kuraigana': 'Île de Kuraigana', 'Ruskaina': 'Rusukaina', 'Syrup': 'Archipel des Gecko',
}
SHAPE_KEY = {v: k for k, v in RENAME.items()}
SHAPE_KEY['Alabasta'] = 'Arabasta'

# [nom, x, y, rayon, type, région, mer canonique]  — ordre = ordre de la liste (Top 1 → 53)
I = [
    ['Laugh Tale', 600, 385, 31, 'm', 5, '[C] Nouveau Monde'],
    ['Mary Geoise', 700, 330, 29, 'm', 6, '[C] Red Line'],
    ['Elbaph', 200, 385, 34, 'm', 5, '[C] Nouveau Monde'],
    ['Egghead', 500, 370, 31, 'p', 5, '[C] Nouveau Monde'],
    ['Pays des Wa', 85, 445, 36, 'm', 5, '[C] Nouveau Monde'],
    ['La Ruche', 400, 386, 31, 'f', 5, '[C] Nouveau Monde (déplacée depuis West Blue, prend la place de Baltigo)'],
    ['Île des Hommes-Poissons', 700, 670, 31, 'p', 6, '[C] sous la Red Line'],
    ['Whole Cake Island', 300, 530, 34, 'p', 5, '[C] Nouveau Monde'],
    ['Alabasta', 1100, 370, 34, 'p', 4, '[C] Paradise'],
    ['Marineford', 760, 620, 31, 'p', 6, '[C] près de Sabaody, à côté de Mary Geoise sur la Red Line'],
    ['Ohara', 440, 745, 34, 'f', 1, '[C] West Blue'],
    ['Water 7', 1205, 525, 31, 'p', 4, '[C] Paradise'],
    ['Zou', 400, 515, 31, 'f', 5, '[C] Nouveau Monde'],
    ['God Valley', 300, 650, 31, 'f', 1, "[I] lieu inconnu dans l'œuvre ; placée en West Blue"],
    ['Archipel des Sabaody', 700, 565, 31, 'f', 6, '[C] au pied de la Red Line'],
    ['Royaume de Kamabakka', 950, 448, 29, 'f', 4, '[C] Paradise (Momoiro, déplacée depuis South Blue)'],
    ['Nouveau Marineford', 200, 515, 34, 'p', 5, '[C] Nouveau Monde (G-1)'],
    ['Enies Lobby', 1100, 510, 31, 'm', 4, '[C] Paradise'],
    ['Impel Down', 900, 510, 29, 'm', 4, '[C] Calm Belt, côté Paradise'],
    ['Dressrosa', 500, 530, 34, 'p', 5, '[C] Nouveau Monde'],
    ['Skypiea', 1305, 370, 31, 'p', 4, '[C] Paradise (au-dessus de Jaya)'],
    ['Lodestar', 550, 448, 29, 'p', 5, '[C] Nouveau Monde, dernière île avant Laugh Tale'],
    ['Île de Dawn', 1270, 155, 38, 'f', 0, '[C] East Blue (royaume de Goa, Fuschia)'],
    ['Onigashima', 160, 452, 24, 'm', 5, '[C] Nouveau Monde, au large du Pays des Wa'],
    ['Punk Hazard', 600, 520, 31, 'm', 5, '[C] Nouveau Monde'],
    ['Karai Bari', 350, 448, 29, 'p', 5, '[C] Nouveau Monde'],
    ['Royaume de Sorbet', 1031, 655, 31, 'p', 3, '[C] South Blue (déplacé depuis West Blue)'],
    ['Lulusia', 1051, 449, 31, 'f', 4, '[C] Paradise, près de Momoiro (déplacée depuis North Blue)'],
    ['Amazon Lily', 800, 525, 31, 'f', 4, '[C] Calm Belt, côté Paradise'],
    ['Loguetown', 800, 250, 34, 'p', 0, '[C] East Blue'],
    ['Île de Winner', 250, 448, 29, 'f', 5, '[C?] Nouveau Monde'],
    ['Thriller Bark', 1000, 525, 31, 'f', 4, '[C] Paradise (Triangle de Florian)'],
    ['Île de Sphinx', 60, 546, 31, 'm', 5, "[C?] Nouveau Monde (déplacée depuis West Blue)"],
    ['Île de Drum', 1000, 390, 31, 'm', 4, '[C] Paradise'],
    ['Archipel des Konomi', 1170, 250, 31, 'f', 0, '[C] East Blue'],
    ['Royaume de Germa', 380, 250, 34, 'p', 2, '[C] North Blue (royaume mobile, originaire de North Blue)'],
    ['Île de Kuraigana', 300, 370, 29, 'f', 5, "[C] Grand Line ; moitié inconnue, reste dans le Nouveau Monde"],
    ['Jaya', 1200, 390, 31, 'f', 4, '[C] Paradise'],
    ['Little Garden', 900, 370, 31, 'f', 4, '[C] Paradise'],
    ['Flevance', 490, 150, 31, 'm', 2, '[C] North Blue'],
    ['Weatheria', 855, 452, 29, 'p', 4, "[C] île céleste vue au-dessus de Sabaody ; [I] placée en Paradise"],
    ['Île de Karakuri', 1255, 448, 29, 'm', 4, '[C] Paradise'],
    ['Baratie', 1085, 140, 29, 'p', 0, '[C] East Blue'],
    ['Cap des Jumeaux', 700, 445, 34, 'm', 6, '[C] au pied de Reverse Mountain'],
    ['Tequila Wolf', 905, 170, 31, 'p', 0, '[C] East Blue'],
    ['Rusukaina', 850, 600, 29, 'f', 4, '[C] Calm Belt, au nord-ouest d\'Amazon Lily (déplacée depuis North Blue)'],
    ['Archipel des Boin', 1150, 448, 29, 'f', 4, '[C] Paradise'],
    ['Whisky Peak', 800, 390, 34, 'm', 4, '[C] Paradise'],
    ['Archipel des Gecko', 1015, 250, 31, 'f', 0, '[C] East Blue'],
    ['Green Bit', 450, 448, 29, 'f', 5, '[C] Nouveau Monde, juste au nord de Dressrosa'],
    ['Long Ring Long Land', 1310, 510, 31, 'p', 4, '[C] Paradise'],
    ['Shells Town', 940, 70, 29, 'f', 0, '[C] East Blue'],
    ['Baterilla', 910, 765, 31, 'p', 3, '[C] South Blue'],
]
# routes ordinaires
E = [
    # East Blue
    ['Loguetown', 'Tequila Wolf'], ['Tequila Wolf', 'Shells Town'], ['Tequila Wolf', 'Archipel des Gecko'], ['Shells Town', 'Baratie'],
    ['Archipel des Gecko', 'Baratie'], ['Archipel des Gecko', 'Archipel des Konomi'], ['Baratie', 'Île de Dawn'],
    ['Archipel des Konomi', 'Île de Dawn'], ['Baratie', 'Archipel des Konomi'],
    # les Blues vers Reverse Mountain
    ['Loguetown', 'Cap des Jumeaux'], ['Flevance', 'Cap des Jumeaux'],
    # North, West, South Blue
    ['Flevance', 'Royaume de Germa'], ['Ohara', 'God Valley'], ['Baterilla', 'Royaume de Sorbet'],
    # Paradise : l'anneau d'origine
    ['Whisky Peak', 'Little Garden'], ['Little Garden', 'Île de Drum'], ['Île de Drum', 'Alabasta'], ['Alabasta', 'Jaya'], ['Jaya', 'Skypiea'],
    ['Skypiea', 'Long Ring Long Land'], ['Long Ring Long Land', 'Water 7'], ['Water 7', 'Enies Lobby'], ['Enies Lobby', 'Thriller Bark'],
    ['Thriller Bark', 'Impel Down'], ['Impel Down', 'Amazon Lily'], ['Île de Drum', 'Thriller Bark'], ['Alabasta', 'Enies Lobby'],
    # Paradise : les nouvelles îles du milieu
    ['Weatheria', 'Whisky Peak'], ['Weatheria', 'Amazon Lily'], ['Weatheria', 'Royaume de Kamabakka'],
    ['Royaume de Kamabakka', 'Little Garden'], ['Royaume de Kamabakka', 'Impel Down'],
    ['Lulusia', 'Île de Drum'], ['Lulusia', 'Thriller Bark'],
    ['Archipel des Boin', 'Jaya'], ['Archipel des Boin', 'Enies Lobby'], ['Archipel des Boin', 'Île de Karakuri'],
    ['Île de Karakuri', 'Water 7'], ['Île de Karakuri', 'Long Ring Long Land'],
    ['Rusukaina', 'Impel Down'], ['Rusukaina', 'Marineford'],
    # Red Line
    ['Mary Geoise', 'Cap des Jumeaux'], ['Cap des Jumeaux', 'Whisky Peak'], ['Amazon Lily', 'Archipel des Sabaody'],
    ['Archipel des Sabaody', 'Île des Hommes-Poissons'], ['Marineford', 'Archipel des Sabaody'], ['Marineford', 'Impel Down'],
    # Nouveau Monde : l'anneau d'origine
    ['Île des Hommes-Poissons', 'Punk Hazard'], ['Punk Hazard', 'Dressrosa'], ['Dressrosa', 'Zou'], ['Zou', 'Whole Cake Island'],
    ['Whole Cake Island', 'Nouveau Marineford'], ['Nouveau Marineford', 'Pays des Wa'], ['Pays des Wa', 'Elbaph'], ['Elbaph', 'Île de Kuraigana'],
    ['Île de Kuraigana', 'La Ruche'], ['La Ruche', 'Egghead'], ['Egghead', 'Laugh Tale'], ['Zou', 'La Ruche'],
    ['Whole Cake Island', 'Île de Kuraigana'], ['Dressrosa', 'Egghead'],
    # Nouveau Monde : les nouvelles îles
    ['Onigashima', 'Pays des Wa'], ['Onigashima', 'Île de Winner'], ['Île de Winner', 'Elbaph'], ['Île de Winner', 'Nouveau Marineford'],
    ['Karai Bari', 'Île de Kuraigana'], ['Karai Bari', 'Whole Cake Island'], ['Green Bit', 'Dressrosa'], ['Green Bit', 'La Ruche'],
    ['Lodestar', 'Laugh Tale'], ['Lodestar', 'Egghead'], ['Lodestar', 'Punk Hazard'],
    ['Île de Sphinx', 'Nouveau Marineford'], ['Île de Sphinx', 'Pays des Wa'],
]
# traversées de Calm Belt (routes marquées)
B = [['Île de Dawn', 'Skypiea'], ['Archipel des Konomi', 'Jaya'], ['Royaume de Germa', 'Île de Kuraigana'], ['God Valley', 'Nouveau Marineford'],
     ['Royaume de Sorbet', 'Water 7'], ['Baterilla', 'Rusukaina'], ['Ohara', 'Punk Hazard']]
CAPS = {'marine': 'Nouveau Marineford', 'pirate': 'Île de Dawn', 'revo': 'Royaume de Kamabakka', 'chasseur': 'Whisky Peak'}
PONE = ['Zou', 'Whole Cake Island', 'Pays des Wa', 'Île des Hommes-Poissons']
# étiquettes de région : Paradise et Nouveau Monde passent dans la Calm Belt nord, à côté des mots « CALM BELT » (leur rangée du milieu est maintenant occupée)
LAB = [[1075, 36], [430, 838], [400, 38], [1075, 838], [1235, 312], [140, 312], [700, 150]]   # « CALM BELT » est écrit en (1000, 312) et (440, 312)
# ancienne île → île qui la remplace (pour les textes et les correspondances, pas pour les sauvegardes : elles gardent l'ancienne carte)
GONE = {'Orange Town': 'Tequila Wolf', 'Goa': 'Île de Dawn', 'Foosha': 'Île de Dawn', 'Baltigo': 'Royaume de Kamabakka'}
SOURCES = [
    'https://onepiece.fandom.com/wiki/Karai_Bari_Island', 'https://onepiece.fandom.com/wiki/Lulusia_Kingdom',
    'https://onepiece.fandom.com/wiki/Kuraigana_Island', 'https://onepiece.fandom.com/wiki/Momoiro_Island',
    'https://onepiece.fandom.com/wiki/Karakuri_Island', 'https://onepiece.fandom.com/wiki/Rusukaina',
    'https://onepiece.fandom.com/wiki/Sorbet_Kingdom', 'https://onepiece.fandom.com/wiki/Tequila_Wolf',
    'https://onepiece.fandom.com/wiki/Lodestar_Island', 'https://onepiece.fandom.com/wiki/Boin_Archipelago',
    'https://onepiece.fandom.com/wiki/Green_Bit', 'https://onepiece.fandom.com/wiki/Baterilla',
    'https://onepiece.fandom.com/wiki/Marineford', 'https://onepiece.fandom.com/wiki/God_Valley', 'https://onepiece.fandom.com/wiki/Weatheria',
]

WOB = 1.17   # contour : jusqu'à +17 % du rayon (somme des ondulations de generateMap)


def check():
    err = []; names = [d[0] for d in I]; P = {d[0]: d for d in I}
    if len(I) != 53 or len(set(names)) != 53: err.append('53 îles distinctes attendues (%d, %d)' % (len(I), len(set(names))))
    for a in range(len(I)):
        n, x, y, r = I[a][:4]
        if x - r * WOB < 2 or x + r * WOB > W - 2 or y - r * WOB < 2 or y + r * WOB > H - 2: err.append('hors carte : ' + n)
        if n not in ('Mary Geoise', 'Cap des Jumeaux', 'Archipel des Sabaody', 'Île des Hommes-Poissons') and abs(x - RL_X) < RL_HW + r * WOB:
            err.append('touche la Red Line : ' + n)
        for b in range(a + 1, len(I)):
            m, x2, y2, r2 = I[b][:4]; d = math.hypot(x - x2, y - y2)
            if d < (r + r2) * WOB + 4: err.append('chevauchement %s / %s (%.0f < %.0f)' % (n, m, d, (r + r2) * WOB + 4))
    seen = set()
    for a, b in E + B:
        if a not in P or b not in P: err.append('route inconnue %s – %s' % (a, b)); continue
        k = tuple(sorted((a, b)))
        if k in seen: err.append('route en double %s – %s' % k)
        seen.add(k)
        (x1, y1), (x2, y2) = P[a][1:3], P[b][1:3]; L = math.hypot(x2 - x1, y2 - y1)
        for d in I:                                                     # la route ne doit traverser aucune autre île
            if d[0] in (a, b): continue
            t = max(0, min(1, ((d[1] - x1) * (x2 - x1) + (d[2] - y1) * (y2 - y1)) / L / L))
            q = math.hypot(x1 + t * (x2 - x1) - d[1], y1 + t * (y2 - y1) - d[2])
            if q < d[3] * WOB + 3: err.append('la route %s – %s traverse %s (%.0f px)' % (a, b, d[0], q))
    segs = [(P[a][1:3], P[b][1:3], a, b) for a, b in E + B if a in P and b in P]
    def cross(p, q, r, s):
        def o(a, b, c): return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
        return o(p, q, r) * o(p, q, s) < 0 and o(r, s, p) * o(r, s, q) < 0
    for i in range(len(segs)):
        for j in range(i + 1, len(segs)):
            A, Bs = segs[i], segs[j]
            if len({A[2], A[3], Bs[2], Bs[3]}) < 4: continue
            if cross(A[0], A[1], Bs[0], Bs[1]): err.append('routes croisées %s – %s / %s – %s' % (A[2], A[3], Bs[2], Bs[3]))
    adj = defaultdict(set)
    for a, b in E + B: adj[a].add(b); adj[b].add(a)
    st, vu = [names[0]], {names[0]}
    while st:
        for v in adj[st.pop()]:
            if v not in vu: vu.add(v); st.append(v)
    if len(vu) != 53: err.append('carte non connexe : ' + ', '.join(sorted(set(names) - vu)))
    for n in names:
        if len(adj[n]) < 2 and n != 'Mary Geoise': err.append('île avec moins de 2 routes : ' + n)
    for c in list(CAPS.values()) + PONE:
        if c not in P: err.append('capitale ou Poneglyphe inconnu : ' + c)
    cnt = defaultdict(int)
    for d in I: cnt[REG[d[5]]] += 1
    return err, cnt, adj


def apercu(adj):
    from PIL import Image, ImageDraw, ImageFont
    F = lambda s: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', s)
    k = 1.2; im = Image.new('RGB', (int(W * k), int(H * k)), (40, 96, 150)); d = ImageDraw.Draw(im)
    for y0, y1 in BELTS: d.rectangle((0, y0 * k, W * k, y1 * k), fill=(30, 74, 112))
    d.rectangle(((RL_X - RL_HW) * k, 0, (RL_X + RL_HW) * k, H * k), fill=(150, 70, 60))
    P = {x[0]: x for x in I}
    for a, b in E: d.line((P[a][1] * k, P[a][2] * k, P[b][1] * k, P[b][2] * k), fill=(220, 220, 200), width=2)
    for a, b in B: d.line((P[a][1] * k, P[a][2] * k, P[b][1] * k, P[b][2] * k), fill=(250, 200, 90), width=2)
    RC = [(214, 196, 150), (176, 150, 214), (160, 200, 230), (230, 170, 140), (150, 200, 110), (110, 160, 90), (200, 120, 110)]
    for n, x, y, r, ty, rg, _ in I:
        d.ellipse(((x - r) * k, (y - r) * k, (x + r) * k, (y + r) * k), fill=RC[rg], outline=(20, 20, 20), width=2)
        if n in CAPS.values(): d.ellipse(((x - r - 4) * k, (y - r - 4) * k, (x + r + 4) * k, (y + r + 4) * k), outline=(255, 60, 60), width=3)
        lab = n if n not in SHAPE_KEY else n
        w = d.textlength(lab, font=F(12)); d.text((x * k - w / 2, (y + r + 4) * k), lab, font=F(12), fill=(255, 255, 255), stroke_width=2, stroke_fill=(10, 20, 30))
    for i, (x, y) in enumerate(LAB):
        w = d.textlength(REG[i].upper(), font=F(16)); d.text((x * k - w / 2, y * k - 8), REG[i].upper(), font=F(16), fill=(255, 240, 200), stroke_width=2, stroke_fill=(10, 20, 30))
    p = os.path.join(HERE, 'apercu_carte2.png'); im.save(p); return p


if __name__ == '__main__':
    err, cnt, adj = check()
    print('îles par région :', dict(cnt))
    for e in err: print('ERREUR', e)
    js = {'I': [d[:6] for d in I], 'E': E, 'B': B, 'CAPS': CAPS, 'PONE': PONE, 'LAB': LAB, 'RENAME': RENAME, 'SHAPE_KEY': SHAPE_KEY, 'GONE': GONE,
          'mer': {d[0]: d[6] for d in I}, 'sources': SOURCES}
    open(os.path.join(HERE, 'carte2.json'), 'w').write(json.dumps(js, ensure_ascii=False, indent=1))
    print('aperçu', apercu(adj)); sys.exit(1 if err else 0)
