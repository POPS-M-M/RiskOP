"""Écrit src/essai/76-troupes-donnees.js à partir des dossiers de troupes (art/troupes/<troupe>/troupe.json + atlas.png).
Usage : python3 -I art/troupes/outils/vers_jeu.py   (depuis sources/)
L'atlas est inclus en PNG base64 (pixels d'origine, sans perte) ; la page d'essai reste un seul fichier.
"""
import base64, hashlib, json, os
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
TR = os.path.join(ROOT, 'art', 'troupes')
out = {}
for nom in sorted(os.listdir(TR)):
    d = os.path.join(TR, nom); j = os.path.join(d, 'troupe.json')
    if not os.path.isfile(j): continue
    t = json.load(open(j, encoding='utf-8'))
    webp = os.path.isfile(os.path.join(d, 'atlas.webp'))   # planches découpées par decoupe_auto.py : atlas WebP sans perte
    png = open(os.path.join(d, 'atlas.webp' if webp else 'atlas.png'), 'rb').read()
    srcs = t['source'].get('fichiers') or {t['source']['fichier']: t['source']['sha256']}
    for f, h in srcs.items():
        assert hashlib.sha256(open(os.path.join(d, 'source', f), 'rb').read()).hexdigest() == h, 'planche source modifiée : ' + nom + '/' + f
    im = {k: {'a': v['atlas'], 'c': v['ancre']} for k, v in t['images'].items()}
    out[nom] = {'conv': t['convention'], 'img': im, 'anim': {k: {'i': v['images'], 'ips': v['ips'], 'b': v['boucle']} for k, v in t['animations'].items()},
                'ombre': t['ombre'], 'atlas': 'data:image/' + ('webp' if webp else 'png') + ';base64,' + base64.b64encode(png).decode(), 'sha': hashlib.sha256(png).hexdigest()[:16]}
js = ('/* ================= TROUPES EN SPRITES — DONNÉES (fichier produit par art/troupes/outils/vers_jeu.py, ne pas modifier à la main) =================\n'
      '   Atlas PNG (pixels d\'origine de la planche, sans rééchantillonnage), positions dans l\'atlas, ancres aux pieds (px depuis le coin haut-gauche\n'
      '   de chaque image), animations réellement présentes dans la planche. Convention : art/troupes/CONVENTION_TROUPES.md. */\n'
      'const TRP_DATA=' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n')
P = os.path.join(ROOT, 'src', 'essai', '76-troupes-donnees.js'); open(P, 'w', encoding='utf-8').write(js)
print('ok', P, len(js), 'octets', list(out))
