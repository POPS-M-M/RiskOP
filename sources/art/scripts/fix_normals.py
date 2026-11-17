import sys, os
sys.path.insert(0, os.path.dirname(__file__))
import bpy, rk_common as C
f = os.path.join(C.ART, 'blender', 'islands', sys.argv[1] + '.blend'); bpy.ops.wm.open_mainfile(filepath=f)
for o in C.coll('RK_SOL').objects:
    if o.type == 'MESH' and o.name.endswith('_sol'): C.normals_up(o); print('normales', o.name)
bpy.ops.wm.save_as_mainfile(filepath=f)
