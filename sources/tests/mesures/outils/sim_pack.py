"""Paquet SIMULÉ de 53 îles (test du socle seulement, jamais publié) : chaque île du jeu reçoit une copie du manifeste
d'une des 6 îles Blender (fichiers partagés), sous son propre nom. Sert à mesurer chargement et mémoire à l'échelle."""
import json, os, sys, shutil, hashlib, glob
src, dst, islands = sys.argv[1], sys.argv[2], sys.argv[3]
names = [i['nom'] for i in json.load(open(islands))['iles']]
idx0 = json.load(open(os.path.join(src, 'iles', 'index.json')))
if os.path.exists(dst): shutil.rmtree(dst)
os.makedirs(os.path.join(dst, 'iles'))
shutil.copy(os.path.join(src, 'essai_test.html'), dst)
reals = list(idx0['iles'].items())
idx = {'format': 2, 'iles': {}}
for k, n in enumerate(names):
    rn, e = reals[k % len(reals)]
    d = os.path.join(dst, 'iles', e['dossier'])
    if not os.path.exists(d): shutil.copytree(os.path.join(src, 'iles', e['dossier']), d)
    if n == rn:
        idx['iles'][n] = e; continue
    m = json.load(open(os.path.join(src, 'iles', e['dossier'], e['manifeste']), encoding='utf-8'))
    m['ile'] = n
    b = json.dumps(m, ensure_ascii=False, separators=(',', ':')).encode()
    h = hashlib.sha256(b).hexdigest(); nom = 'manifest.%s.json' % h[:8]
    open(os.path.join(d, nom), 'wb').write(b)
    idx['iles'][n] = {'dossier': e['dossier'], 'manifeste': nom, 'octets': len(b), 'sha256': h, 'version': m.get('version')}
open(os.path.join(dst, 'iles', 'index.json'), 'w').write(json.dumps(idx, ensure_ascii=False))
print(len(idx['iles']), 'îles simulées')
