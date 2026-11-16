"""Exporte une île depuis sa scène source Blender vers les DEUX moteurs du jeu.
  2.5D  : rendus transparents l1/l2/l3 (2, 6, 12 px par unité) + calques de ville niveaux 2–4 (l3) → WebP
  3D    : glTF binaire lod0/lod1/lod2 (nœuds BASE, VILLE_2..4, couleurs de sommets = albédo)
  Commun: cartes de hauteur (sol praticable, obstacles), repères (drapeaux, ponton), manifeste JSON.
Usage : python3 export_island.py zou [--apercu]     (--apercu : rendu rapide Workbench l2 seulement, pour vérifier la composition)
"""
import sys, os, json, time, math, shutil
sys.path.insert(0, os.path.dirname(__file__))
import bpy
import rk_common as C

slug = sys.argv[1]; apercu = '--apercu' in sys.argv; T0 = time.time()
bpy.ops.wm.open_mainfile(filepath=os.path.join(C.ART, 'blender', 'islands', slug + '.blend'))
NAMES = {'zou': 'Zou', 'whole_cake': 'Whole Cake', 'water_7': 'Water 7', 'loguetown': 'Loguetown', 'wano': 'Wano', 'arabasta': 'Arabasta'}
isl = C.island(NAMES[slug]); out = os.path.join(C.ART, 'out', slug); os.makedirs(out, exist_ok=True)
sc = bpy.context.scene
cols = {n: [o for o in C.coll(n).all_objects if o.type == 'MESH'] for n in ['RK_SOL', 'RK_DECOR', 'RK_VILLE_2', 'RK_VILLE_3', 'RK_VILLE_4']}
base = cols['RK_SOL'] + cols['RK_DECOR']; allo = base + cols['RK_VILLE_2'] + cols['RK_VILLE_3'] + cols['RK_VILLE_4']
man = {'ile': isl['nom'], 'id': isl['id'], 'version': time.strftime('%Y%m%d%H%M'), 'repere': 'x est, y sud, z haut, unités de carte', 'genere': {}}
fr1 = C.frame_info(isl, allo, 1); man['cadre'] = {'ext': fr1['ext'], 'zmax': fr1['zmax']}

# ------------------------------------------------------------------ 2.5D
for n in ['RK_SOL', 'RK_DECOR', 'RK_VILLE_2', 'RK_VILLE_3', 'RK_VILLE_4', 'RK_REPERES']: C.coll(n).hide_render = True
rc, copies = C.sheared_copy(allo, 'RK_RENDU25D'); orig = {c.name: o for o, c in zip([o for o in allo if o.type in ('MESH', 'CURVE', 'META')], copies)}
lvl_of = {}
for o in allo:
    lv = 1
    for k in (2, 3, 4):
        if o in cols['RK_VILLE_%d' % k]: lv = k
    lvl_of[o.name + '_25d'] = lv
C.light_rig(sheared=True)
def show_level(only=None):
    """only=None : base (niveau 1) ; only=k : calque du niveau k, le reste en masque (occlusion juste)"""
    for c in copies:
        lv = lvl_of.get(c.name, 1)
        if only is None: c.hide_render = lv != 1; c.is_holdout = False
        else: c.hide_render = False; c.is_holdout = lv != only
if apercu:
    sc.render.engine = 'BLENDER_WORKBENCH'; sc.display.shading.color_type = 'VERTEX'; sc.display.shading.light = 'STUDIO'
    sc.display.shading.show_shadows = True; sc.render.film_transparent = True
    fr = C.frame_info(isl, allo, 4); C.camera_25d(fr); show_level(None)
    sc.render.image_settings.file_format = 'PNG'; sc.render.filepath = os.path.join(out, 'apercu.png'); bpy.ops.render.render(write_still=True)
    print('APERCU', os.path.join(out, 'apercu.png'), round(time.time() - T0, 1)); sys.exit(0)
C.render_settings()
imgs = {}
for lod, K in C.LOD_K.items():
    fr = C.frame_info(isl, allo, K); C.camera_25d(fr); show_level(None)
    sc.cycles.samples = {'l1': 12, 'l2': 20, 'l3': 28}[lod]
    png = os.path.join(out, lod + '.png'); dt = C.render_png(png, {'l1': .9, 'l2': 1.1, 'l3': 1.5}[lod])
    sz = C.png_to_webp(png, os.path.join(out, lod + '.webp'))
    imgs[lod] = {'fichier': lod + '.webp', 'K': K, 'Wc': fr['Wc'], 'Hc': fr['Hc'], 'C': fr['C'], 'CY': fr['CY'], 'octets': sz, 'rendu_s': round(dt, 1)}
    print(lod, fr['Wc'], 'x', fr['Hc'], round(dt, 1), 's', sz, 'o')
ville = {}
fr = C.frame_info(isl, allo, C.LOD_K['l3']); C.camera_25d(fr); sc.cycles.samples = 20
for k in (2, 3, 4):
    if not cols['RK_VILLE_%d' % k]: continue
    show_level(k); png = os.path.join(out, 'ville%d.png' % k); dt = C.render_png(png, 1.5)
    sz = C.png_to_webp(png, os.path.join(out, 'ville%d.webp' % k)); ville[str(k)] = {'fichier': 'ville%d.webp' % k, 'octets': sz, 'rendu_s': round(dt, 1)}
    print('ville', k, round(dt, 1), 's', sz)
man['images25d'] = imgs; man['ville25d'] = ville
for c in copies: bpy.data.objects.remove(c)
bpy.data.collections.remove(rc)

# ------------------------------------------------------------------ 3D (glTF) : niveaux de détail par réduction de polygones
glb = {}
for lod, ratio in (('lod0', .7), ('lod1', .22), ('lod2', .06)):
    nodes = {'BASE': base}
    for k in (2, 3, 4):
        if cols['RK_VILLE_%d' % k]: nodes['VILLE_%d' % k] = cols['RK_VILLE_%d' % k]
    t = time.time(); tris, sz = C.export_glb(nodes, os.path.join(out, lod + '.glb'), ratio)
    glb[lod] = {'fichier': lod + '.glb', 'triangles': tris, 'octets': sz, 'export_s': round(time.time() - t, 1)}
    print(lod, tris, 'tri', sz, 'o')
man['glb'] = glb

# ------------------------------------------------------------------ hauteurs et repères
ext = fr1['ext']; t = time.time()
man['hauteurs'] = {'n': 128, 'ext': ext, 'code': 'Uint16 (h+4)/96*65535, ligne par ligne du nord au sud', 'sol': C.heightfield(cols['RK_SOL'], ext), 'obstacles': C.heightfield(allo, ext)}
man.update(C.flags_and_marks()); man['ponton_angle'] = isl['ponton']
zt = max((o.matrix_world @ __import__('mathutils').Vector(c)).z for o in base for c in o.bound_box); man['sommet'] = round(zt, 2)
man['genere']['duree_s'] = round(time.time() - T0, 1)
json.dump(man, open(os.path.join(out, 'manifest.json'), 'w'), ensure_ascii=False)
print('EXPORT ok', slug, round(time.time() - T0, 1), 's')
