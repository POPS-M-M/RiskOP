"""Water 7 — vues de contrôle et de présentation (Cycles, caméra perspective) depuis la scène détaillée.
Usage : python3 render_vues_water7.py [rapide] → art/out/water_7/presentation/vue_*.png
Ces vues servent à juger les détails de près ; les captures DANS LE JEU restent la référence (planche G3)."""
import sys, os, math
sys.path.insert(0, os.path.dirname(__file__))
import bpy
from mathutils import Vector
import rk_common as C
import w7_plan as W
rapide = 'rapide' in sys.argv
bpy.ops.wm.open_mainfile(filepath=os.path.join(C.ART, 'blender', 'islands', 'water_7.blend'))
OUT = os.environ.get('W7_OUT') or os.path.join(C.ART, 'out', 'water_7', 'presentation'); os.makedirs(OUT, exist_ok=True)
sc = bpy.context.scene
C.render_settings(16 if rapide else 48); C.light_rig(sheared=False)
sc.render.film_transparent = False
w = sc.world or bpy.data.worlds.new('W'); sc.world = w; w.use_nodes = True
w.node_tree.nodes['Background'].inputs[0].default_value = (.36, .62, .74, 1); w.node_tree.nodes['Background'].inputs[1].default_value = .9
# mer simple sous l'île (présentation seulement, absente des exports du jeu)
bpy.ops.mesh.primitive_plane_add(size=160, location=(0, 0, -.15)); mer = bpy.context.object
mat = bpy.data.materials.new('Mer'); mat.use_nodes = True; bs = mat.node_tree.nodes['Principled BSDF']
bs.inputs['Base Color'].default_value = (.12, .45, .62, 1); bs.inputs['Roughness'].default_value = .25; mer.data.materials.append(mat)
cam = bpy.data.cameras.new('Cam'); co = bpy.data.objects.new('Cam', cam); sc.collection.objects.link(co); sc.camera = co
VUES = {  # nom : (cible x, y, z du jeu), (azimut depuis la cible en degrés du jeu, élévation), distance, focale
    'generale':    ((0, -1, 3), (95, 40), 118, 45),
    'fontaine':    ((W.CX, W.CY, 11), (100, 24), 32, 50),
    'canaux':      (W.at(17, math.pi / 4) + (3,), (120, 30), 24, 45),
    'chantiers':   (W.at(23, 0.05) + (2,), (60, 32), 30, 45),
    'gare':        ((W.GX - 3, W.GY, 2), (140, 28), 24, 45),
    'basfonds':    (W.at(21, -2.0) + (1,), (-160, 34), 22, 45),
    'port':        (W.at(27, math.pi / 2) + (1,), (100, 26), 24, 45),
}
only = [a for a in sys.argv[1:] if a in VUES]
for nm, (tg, (az, el), dist, foc) in VUES.items():
    if only and nm not in only: continue
    t = C.g2b(*tg); a = math.radians(az); e = math.radians(el)
    off = Vector((math.cos(a) * math.cos(e), -math.sin(a) * math.cos(e), math.sin(e))) * dist   # azimut dans le repère du jeu (y sud)
    co.location = t + off; co.rotation_euler = (t - co.location).to_track_quat('-Z', 'Y').to_euler(); cam.lens = foc
    sc.render.resolution_x, sc.render.resolution_y = (960, 600) if rapide else (1600, 1000); sc.render.resolution_percentage = 100
    sc.render.filepath = os.path.join(OUT, 'vue_%s.png' % nm); sc.render.line_thickness = 1.2
    bpy.ops.render.render(write_still=True); print('VUE', nm, sc.render.filepath)
