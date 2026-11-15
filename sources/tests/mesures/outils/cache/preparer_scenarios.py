"""Prépare les scénarios de test du versionnage (étape P4) à partir de trois paquets produits par pack_for_game.py.
Usage : python3 preparer_scenarios.py <dossier_travail>   (doit contenir essai_test.html, v2b64/, v2bin/, v1/)
  v2b64 : pack_for_game.py <dossier>/v2b64 --b64   ·   v2bin : pack_for_game.py <dossier>/v2bin   ·   v1 : pack_for_game.py <dossier>/v1 --b64 --format1"""
import os, sys, shutil, json, glob, base64, hashlib
P = os.path.abspath(sys.argv[1]); sc = P + '/sc'; shutil.rmtree(sc, ignore_errors=True); os.makedirs(sc)
def mk(n, src):
    d = sc + '/' + n; os.makedirs(d); shutil.copy(P + '/essai_test.html', d); shutil.copytree(src + '/iles', d + '/iles'); return d + '/iles'
def zman(i): return glob.glob(i + '/zou/manifest.*.json')[0]
def idx(i): return json.load(open(i + '/index.json'))
def wjson(p, o): open(p, 'wb').write(json.dumps(o, ensure_ascii=False, separators=(',', ':')).encode())
mk('A_v2_base64', P + '/v2b64'); mk('A_v2_binaire', P + '/v2bin'); mk('E_v1_ancien_format', P + '/v1')
i = mk('B_glb_octet_change', P + '/v2b64'); f = glob.glob(i + '/zou/lod0.*.glb.txt')[0]; raw = bytearray(base64.b64decode(open(f).read())); raw[len(raw) // 2] ^= 0xFF; open(f, 'w').write(base64.b64encode(bytes(raw)).decode())
i = mk('C_manifeste_modifie', P + '/v2b64'); p = zman(i); m = json.load(open(p)); m['sommet'] = 1.0; wjson(p, m)
i = mk('D_version_incoherente', P + '/v2b64'); x = idx(i); x['iles']['Zou']['version'] = '199901010000'; wjson(i + '/index.json', x)
i = mk('F_glb_absent', P + '/v2b64'); os.remove(glob.glob(i + '/zou/lod0.*.glb.txt')[0])
i = mk('G_fichier_non_declare', P + '/v2b64'); p = zman(i); m = json.load(open(p)); m['glb']['lod1']['fichier'] = 'lod1.00000000.glb.txt'
b = json.dumps(m, ensure_ascii=False, separators=(',', ':')).encode(); open(p, 'wb').write(b)
x = idx(i); x['iles']['Zou']['octets'] = len(b); x['iles']['Zou']['sha256'] = hashlib.sha256(b).hexdigest(); wjson(i + '/index.json', x)
print(sorted(os.listdir(sc)))
