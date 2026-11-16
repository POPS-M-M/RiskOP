"""Outils de la planche d'une île (étapes 6-7 de la méthode) — sans Blender.

  python3 outils_planche.py recadrer <dossier captures> <préfixe zones>
      recadre chaque gros plan 3D (z_<préfixe>_3d_<zone>.png) en zc_<zone>.png (1200 × 780) autour du point projeté
      lu dans <préfixe>_proj_3d.json (écrit par captures_zones.js).

  python3 outils_planche.py tableau <slug> <dossier captures> <île précédente (slug)> "<Nom affiché>" "<bâtiments>" "<triangles scène>"
      écrit <dossier captures>/tech.json : reprend le tableau de art/out/<île précédente>/presentation/mesures.json,
      ajoute la colonne de l'île (fichiers lus dans art/out/<slug> et son manifest.json), et remplace les lignes mesurées
      avec le socle (mémoire graphique, sommets, cuisson, conquête) par celles de <dossier captures>/iles.json
      (t_socle.js … iles). Les vérifications sont à relire et compléter à la main avant la planche.
"""
import sys, os, json, gzip

ART = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))


def recadrer(cap, pre):
    from PIL import Image
    P = json.load(open(os.path.join(cap, '%s_proj_3d.json' % pre)))
    for k, (x, y) in P.items():
        z = k.split('_', 1)[1]; im = Image.open(os.path.join(cap, '%s_%s.png' % (pre, k))); W, H = im.size
        cx, cy = 2 * x, 2 * y; l = int(min(max(0, cx - 600), W - 1200)); t = int(min(max(0, cy - 390), H - 780))
        im.crop((l, t, l + 1200, t + 780)).save(os.path.join(cap, 'zc_%s.png' % z)); print('zc_%s.png' % z)


def mo(n): return '%.2f Mo' % (n / 1e6) if n >= 1e6 else '%d Ko' % round(n / 1e3)


def tableau(slug, cap, prev, nom, bat, tris):
    T = json.load(open(os.path.join(ART, 'out', prev, 'presentation', 'mesures.json'), encoding='utf-8'))
    d = os.path.join(ART, 'out', slug); m = json.load(open(os.path.join(d, 'manifest.json'), encoding='utf-8'))
    g = m['glb']; sz = lambda f: os.path.getsize(os.path.join(d, f))
    gz = len(gzip.compress(open(os.path.join(d, 'lod0.glb'), 'rb').read()))
    img = sum(sz(f) for f in os.listdir(d) if f.endswith('.webp'))
    new = {'Bâtiments (scène)': bat, 'Triangles scène Blender': tris,
           'lod0 · triangles / fichier / gzip': '%d · %s · %s' % (g['lod0']['triangles'], mo(sz('lod0.glb')), mo(gz)),
           'lod1 · triangles / fichier': '%d · %s' % (g['lod1']['triangles'], mo(sz('lod1.glb'))),
           'lod2 · triangles / fichier': '%d · %s' % (g['lod2']['triangles'], mo(sz('lod2.glb'))),
           'Images 2.5D (webp, total)': mo(img), 'Export Blender (Cycles CPU)': '%d s' % round(m['genere']['duree_s'])}
    T['colonnes'] = T['colonnes'] + [nom]
    R = json.load(open(os.path.join(cap, 'iles.json'), encoding='utf-8'))['iles']
    for row in T['tableau']:
        k = row[0]
        if k in new: row[1] = row[1] + [new[k]]; continue
        vals = []
        for n in T['colonnes']:
            v = R.get(n)
            if not v: vals.append('—'); continue
            G = v['g3']; c = {x['lod']: x['ms'] for x in v['cuisson']}
            if k.startswith('Mémoire graphique'): vals.append('%.2f Mo' % (sum(x['octets'] for x in G.values()) / 1e6))
            elif k.startswith('Sommets indexés'): vals.append(str(sum(x['sommets'] for x in G.values() if x['st'] == 'pret')))
            elif k.startswith('Cuisson lod0'): vals.append('%.1f s' % (c.get('lod0', 0) / 1000))
            elif k.startswith('Conquête'): vals.append('%d ms' % (v['conquete_ms'] or 0))
            else: vals.append('?')
        row[1] = vals
    T['verifs'] = ['À RELIRE ET COMPLÉTER : ' + x for x in T['verifs']]
    json.dump(T, open(os.path.join(cap, 'tech.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    for r in T['tableau']: print(r[0], '→', r[1][-1])


if __name__ == '__main__':
    a = sys.argv[1:]
    if a and a[0] == 'recadrer': recadrer(a[1], a[2])
    elif a and a[0] == 'tableau': tableau(*a[1:7])
    else: print(__doc__)
