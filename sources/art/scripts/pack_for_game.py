"""Copie les sorties de la chaîne Blender à côté de la page du jeu (dossier iles/) et écrit l'index.

Format 2 (par défaut, étape P4 : versionnage du cache)
  - chaque fichier publié porte une empreinte de son contenu : l3.3f9a2c1b.webp, lod0.8d41e0aa.glb
    (8 premiers caractères du SHA-256 du contenu binaire) ; un contenu différent a donc toujours un nom différent,
    et un ancien fichier gardé en cache ne peut plus être lu avec un nouveau manifeste ;
  - le manifeste reprend tous les champs produits par Blender, remplace chaque « fichier » par son nom publié,
    et ajoute « format »: 2 et la table « fichiers » (taille, SHA-256, encodage) ; il est lui-même publié sous
    un nom à empreinte : manifest.<empreinte>.json ;
  - index.json (seul fichier relu à chaque ouverture) donne pour chaque île son dossier, le nom, la taille,
    le SHA-256 et la version de son manifeste.
Format 1 (--format1) : ancienne copie à noms fixes, conservée pour les tests de compatibilité.

Usage : python3 art/scripts/pack_for_game.py [dossier_cible] [--b64] [--format1] [--nettoyer] [--hauteurs-incluses]
  dossier_cible : défaut dist/ ; --b64 : glTF publiés en base64 (.glb.txt) pour les hébergeurs sans type glTF (artefact de test) ;
  --nettoyer : retire du dossier de chaque île les fichiers que le nouveau manifeste ne cite plus.
  --hauteurs-incluses : garde les cartes de hauteurs en base64 dans le manifeste (paquet d'avant le socle technique, pour comparaison).
Les sorties Blender (art/out/<île>/) ne sont jamais modifiées ; les PNG maîtres n'y sont pas copiés.
"""
import os, sys, json, shutil, hashlib, base64, copy

ART = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
args = [a for a in sys.argv[1:] if not a.startswith('--')]
B64, FORMAT1, NETTOYER, INLINE_H = '--b64' in sys.argv, '--format1' in sys.argv, '--nettoyer' in sys.argv, '--hauteurs-incluses' in sys.argv
dest = os.path.abspath(args[0] if args else os.path.join(ART, '..', 'dist'))
NAMES = {'zou': 'Zou', 'whole_cake': 'Whole Cake Island', 'water_7': 'Water 7', 'loguetown': 'Loguetown', 'wano': 'Pays des Wa', 'alabasta': 'Alabasta', 'syrup': 'Archipel des Gecko', 'cocoyasi': 'Archipel des Konomi', 'laugh_tale': 'Laugh Tale', 'mary_geoise': 'Mary Geoise', 'elbaph': 'Elbaph', 'egghead': 'Egghead'}   # îles produites par la chaîne (prototypes, Water 7, puis île par île)


def sha(b):
    return hashlib.sha256(b).hexdigest()


def jdump(o):
    """JSON déterministe (même contenu → mêmes octets → même empreinte)."""
    return json.dumps(o, ensure_ascii=False, separators=(',', ':')).encode('utf-8')


def pack_v1(slug, src, d):
    tot = 0
    for f in os.listdir(src):
        if f.endswith('.glb') and B64:
            open(os.path.join(d, f + '.txt'), 'w').write(base64.b64encode(open(os.path.join(src, f), 'rb').read()).decode())
            tot += os.path.getsize(os.path.join(d, f + '.txt'))
        elif f.endswith(('.webp', '.glb')) or f == 'manifest.json':
            shutil.copy2(os.path.join(src, f), os.path.join(d, f)); tot += os.path.getsize(os.path.join(d, f))
    return slug, tot


def pack_v2(name, slug, src, d):
    man = json.load(open(os.path.join(src, 'manifest.json'), encoding='utf-8'))
    m2 = copy.deepcopy(man); table = {}; tot = 0; garder = set()

    def publie(ref):
        nonlocal tot
        orig = ref['fichier']; raw = open(os.path.join(src, orig), 'rb').read(); h = sha(raw)
        stem, ext = os.path.splitext(orig); nom = '%s.%s%s' % (stem, h[:8], ext)
        enc = 'binaire'
        if ext == '.glb' and B64:
            nom += '.txt'; enc = 'base64'; data = base64.b64encode(raw)
        else:
            data = raw
        open(os.path.join(d, nom), 'wb').write(data); tot += len(data); garder.add(nom)
        table[nom] = {'source': orig, 'octets': len(raw), 'sha256': h, 'encodage': enc, 'octets_publies': len(data)}
        ref['fichier'] = nom

    for grp in ('images25d', 'ville25d', 'glb'):
        for ref in (m2.get(grp) or {}).values():
            publie(ref)
    # socle technique (chargement progressif) : les cartes de hauteurs, utiles à la 3D seulement, sortent du manifeste
    # (≈ 87 Ko de texte par île lus au démarrage même en 2.5D) vers un fichier binaire à empreinte, lu avec le premier modèle 3D.
    H = m2.get('hauteurs')
    if H and 'sol' in H and not INLINE_H:
        n = H['n']; sol = base64.b64decode(H['sol']); obs = base64.b64decode(H['obstacles'])
        assert len(sol) == len(obs) == n * n * 2, 'cartes de hauteurs de taille inattendue'
        raw = sol + obs; h = sha(raw); nom = 'hauteurs.%s.bin' % h[:8]; enc = 'binaire'; data = raw
        if B64:
            nom += '.txt'; enc = 'base64'; data = base64.b64encode(raw)
        open(os.path.join(d, nom), 'wb').write(data); tot += len(data); garder.add(nom)
        table[nom] = {'source': 'manifest.json (hauteurs)', 'octets': len(raw), 'sha256': h, 'encodage': enc, 'octets_publies': len(data)}
        m2['hauteurs'] = {'n': n, 'ext': H['ext'], 'code': H['code'], 'fichier': nom, 'sol': [0, n * n * 2], 'obstacles': [n * n * 2, n * n * 2]}
    # le nom du jeu fait foi (NAMES) : une île renommée garde ses sorties Blender, seul son manifeste publié change de nom
    m2['ile'] = name
    try:
        m2['id'] = [i for i in json.load(open(os.path.join(ART, 'data', 'islands.json'), encoding='utf-8'))['iles'] if i['nom'] == name][0]['id']
    except (IndexError, OSError, KeyError):
        pass
    m2['format'] = 2; m2['fichiers'] = table
    mb = jdump(m2); mh = sha(mb); mnom = 'manifest.%s.json' % mh[:8]
    open(os.path.join(d, mnom), 'wb').write(mb); tot += len(mb); garder.add(mnom)
    if NETTOYER:
        for f in os.listdir(d):
            if f not in garder:
                os.remove(os.path.join(d, f))
    return {'dossier': slug, 'manifeste': mnom, 'octets': len(mb), 'sha256': mh, 'version': man.get('version')}, tot


idx = {} if FORMAT1 else {'format': 2, 'iles': {}}
total = 0
for slug, name in NAMES.items():
    src = os.path.join(ART, 'out', slug)
    if not os.path.exists(os.path.join(src, 'manifest.json')):
        continue
    d = os.path.join(dest, 'iles', slug); os.makedirs(d, exist_ok=True)
    if FORMAT1:
        idx[name], t = pack_v1(slug, src, d)
    else:
        idx['iles'][name], t = pack_v2(name, slug, src, d)
    total += t
open(os.path.join(dest, 'iles', 'index.json'), 'wb').write(jdump(idx))
print('îles copiées (format %d) :' % (1 if FORMAT1 else 2), ', '.join(NAMES[s] for s in NAMES if os.path.exists(os.path.join(ART, 'out', s, 'manifest.json'))),
      round(total / 1048576, 2), 'Mo →', dest)
