"""Water 7 — planche G2 (silhouette) : maquette en volumes comparée à Zou et Whole Cake, mêmes échelles, dans le jeu.
Usage : python3 planche_g2_water7.py <dossier des captures>   → art/out/water_7/presentation/G2_silhouette.png
Captures attendues (t_shots.js) : avant_w7_*, apres_w7_*, zou_*, wc_* (modes 25 et 3d ; vues vue, moyen, proche)."""
import os, sys
from PIL import Image, ImageDraw, ImageFont
ART = os.path.abspath(os.path.join(os.path.dirname(__file__), '..')); CAP = sys.argv[1]
OUT = os.path.join(ART, 'out', 'water_7', 'presentation'); os.makedirs(OUT, exist_ok=True)
F = lambda s, b=False: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans%s.ttf' % ('-Bold' if b else ''), s)
PAPER, INK, MUTED, GOLD, SEA = (246, 241, 230), (29, 42, 54), (93, 107, 120), (176, 122, 28), (124, 195, 214)
W_ = 2400; board = Image.new('RGB', (W_, 6000), PAPER); d = ImageDraw.Draw(board)
d.text((40, 28), 'WATER 7 — G2 · Silhouette (maquette en volumes)', font=F(48, True), fill=INK)
d.text((40, 92), "Volumes simples issus du plan de masse G1, passés par la chaîne complète (Cycles 2.5D + glTF 3D) et affichés dans le jeu (copie de test). "
       "Ce n'est PAS la finition : il s'agit de juger silhouette, proportions et lisibilité.", font=F(20), fill=MUTED)
y = 140


def section(t, sub=''):
    global y
    d.text((40, y), t, font=F(30, True), fill=INK)
    if sub: d.text((40, y + 40), sub, font=F(19), fill=MUTED)
    y += 82 if sub else 50


def fit(p, w, crop=None):
    im = Image.open(p).convert('RGB')
    if crop:   # crop = (fraction de largeur, fraction de hauteur) gardée autour du centre
        fw, fh = crop[:2]; cx, cy = (crop[2], crop[3]) if len(crop) > 2 else (.47, .5); cw, ch = int(im.width * fw), int(im.height * fh)
        x0, y0 = max(0, min(im.width - cw, int(im.width * cx - cw / 2))), max(0, min(im.height - ch, int(im.height * cy - ch / 2)))
        im = im.crop((x0, y0, x0 + cw, y0 + ch))
    return im.resize((w, int(im.height * w / im.width)), Image.LANCZOS)


def label(x, yy, t, c=INK, s=22, b=True):
    d.text((x, yy), t, font=F(s, b), fill=c)


# ---- 1. test des 2 secondes : vue d'ensemble dans le jeu
section('1 · Test des 2 secondes : vue d\'ensemble du jeu (l\'île doit se reconnaître sans lire son nom)', 'À gauche le Water 7 actuel du jeu, à droite la maquette G2 · captures réelles de la copie de test, écran 1400×860 ×2')
for k, (mode, t) in enumerate((('25', '2.5D'), ('3d', '3D'))):
    for j, (pre, tt) in enumerate((('avant', 'aujourd\'hui'), ('apres', 'maquette G2'))):
        im = fit(os.path.join(CAP, '%s_w7_%s_vue.png' % (pre, mode)), 575, crop=(.5, .6, .7, .52))
        x = 40 + (k * 2 + j) * 590; board.paste(im, (x, y + 34)); label(x, y, '%s · %s' % (t, tt), GOLD if pre == 'apres' else INK)
y += 34 + im.height + 40

# ---- 2. même échelle que Zou et Whole Cake (rendus 2.5D l2, 6 px par unité ; l1 = taille réelle en vue d'ensemble)
section('2 · Même échelle que Zou et Whole Cake', 'Rendus 2.5D de la chaîne au même nombre de pixels par unité de carte (l2 = 6 px/unité, zoom moyen ; l1 = 2 px/unité, vue d\'ensemble, agrandi ×2)')
x = 40
for nm, slug in (('Zou', 'zou'), ('Whole Cake Island', 'whole_cake'), ('Water 7 (maquette)', 'water_7')):
    im = Image.open(os.path.join(ART, 'out', slug, 'l2.png')).convert('RGBA'); bb = im.getbbox(); im = im.crop(bb)
    bg = Image.new('RGB', (im.width + 40, 700), SEA); bg.paste(im, (20, 700 - im.height - 20), im); board.paste(bg, (x, y + 34)); label(x, y, nm, GOLD if slug == 'water_7' else INK)
    l1 = Image.open(os.path.join(ART, 'out', slug, 'l1.png')).convert('RGBA'); l1 = l1.crop(l1.getbbox()); l1 = l1.resize((l1.width * 2, l1.height * 2), Image.NEAREST)
    bg2 = Image.new('RGB', (l1.width + 20, l1.height + 20), SEA); bg2.paste(l1, (10, 10), l1); board.paste(bg2, (x + bg.width + 14, y + 34 + 700 - bg2.height))
    label(x + bg.width + 14, y + 34 + 700 - bg2.height - 28, 'l1 ×2', MUTED, 18, False)
    x += bg.width + bg2.width + 50
y += 34 + 700 + 40

# ---- 3. dans le jeu, même zoom : 3D moyen et 2.5D proche
section('3 · Dans le jeu, au même zoom : Zou · Whole Cake · Water 7 (maquette)', '3D zoom moyen (haut) et 2.5D zoom proche (bas) · mêmes réglages de caméra pour les trois îles')
for row, (mode, vue) in enumerate((('3d', 'moyen'), ('25', 'proche'))):
    for k, (pre, nm) in enumerate((('zou', 'Zou'), ('wc', 'Whole Cake Island'), ('apres_w7', 'Water 7 (maquette)'))):
        p = os.path.join(CAP, '%s_%s_%s.png' % (pre, mode, vue))
        if not os.path.exists(p): continue
        im = fit(p, 770, crop=(.62, .62)); x = 40 + k * 785; board.paste(im, (x, y + 30)); label(x, y, nm + (' · 3D' if mode == '3d' else ' · 2.5D'), GOLD if pre == 'apres_w7' else INK, 20)
    y += 30 + im.height + 24
y += 10

# ---- 4. évolution par niveau de ville (rendus 2.5D l3 + calques de ville)
section('4 · Niveaux de ville 1 → 4 (maquette)', 'Base + calques de ville rendus par la chaîne (2.5D l3, réduits) · niveau 2 : port, chantier n° 2 · niveau 3 : ville basse nord, chantier n° 3 · niveau 4 : édifices de prestige')
base = Image.open(os.path.join(ART, 'out', 'water_7', 'l3.png')).convert('RGBA'); bb = base.getbbox()
acc = base.copy()
for k in range(1, 5):
    if k > 1: acc.alpha_composite(Image.open(os.path.join(ART, 'out', 'water_7', 'ville%d.png' % k)).convert('RGBA'))
    im = acc.crop(bb); im = im.resize((560, int(im.height * 560 / im.width)), Image.LANCZOS)
    bg = Image.new('RGB', im.size, SEA); bg.paste(im, (0, 0), im); x = 40 + (k - 1) * 590; board.paste(bg, (x, y + 30)); label(x, y, 'Niveau de ville %d' % k)
y += 30 + bg.height + 30

# ---- 5. à juger
section('5 · Points à valider (G2)')
PTS = ["Silhouette : cône de terrasses blanches + fontaine géante au centre, gare et viaduc à l'ouest, chantiers à l'est, port au sud — lisible en vue d'ensemble ?",
       "Hauteur de la fontaine (jet ≈ 27 unités au-dessus de la mer) : trop haute, juste, pas assez ? En 2.5D elle domine ; en 3D, vue de haut, elle se lit moins.",
       "Le badge d'armée du jeu (au centre de l'île) recouvre le pied de la fontaine : proposition [I] décaler le massif de 3 à 4 unités vers le nord (gameplay inchangé).",
       "Densité : 155 volumes dans la maquette ; la version détaillée visera 350 à 500 bâtiments (ruelles, maisons accolées, façades, balcons, arcades).",
       "Le viaduc élargit le cadre de l'image d'environ 40 % (plus de mémoire 2.5D) : je propose de le raccourcir dans la version détaillée.",
       "Canon : tout ce qui est [C?] reste à confirmer — écris le lien https://onepiece.fandom.com/wiki/Water_7 dans un message pour m'autoriser à le lire."]
for t in PTS:
    d.text((50, y), '•  ' + t, font=F(20), fill=INK); y += 34
board = board.crop((0, 0, W_, y + 30)); p = os.path.join(OUT, 'G2_silhouette.png'); board.save(p, optimize=True); print(p, board.size)
