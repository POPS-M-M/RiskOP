"""ré-export glTF seul (sans refaire les rendus 2.5D) : python3 glb_only.py zou"""
import sys, os, json, time
sys.path.insert(0, os.path.dirname(__file__))
import bpy, rk_common as C
slug = sys.argv[1]; bpy.ops.wm.open_mainfile(filepath=os.path.join(C.ART, 'blender', 'islands', slug + '.blend'))
out = os.path.join(C.ART, 'out', slug); man = json.load(open(os.path.join(out, 'manifest.json')))
cols = {n: [o for o in C.coll(n).all_objects if o.type == 'MESH'] for n in ['RK_SOL', 'RK_DECOR', 'RK_VILLE_2', 'RK_VILLE_3', 'RK_VILLE_4']}
base = cols['RK_SOL'] + cols['RK_DECOR']
for lod, ratio in (('lod0', .7), ('lod1', .22), ('lod2', .06)):
    nodes = {'BASE': base}
    for k in (2, 3, 4):
        if cols['RK_VILLE_%d' % k]: nodes['VILLE_%d' % k] = cols['RK_VILLE_%d' % k]
    t = time.time(); tris, sz = C.export_glb(nodes, os.path.join(out, lod + '.glb'), ratio)
    man['glb'][lod] = {'fichier': lod + '.glb', 'triangles': tris, 'octets': sz, 'export_s': round(time.time() - t, 1)}; print(lod, tris, sz)
json.dump(man, open(os.path.join(out, 'manifest.json'), 'w'), ensure_ascii=False)
