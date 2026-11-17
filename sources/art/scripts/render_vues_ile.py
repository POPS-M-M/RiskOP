"""Vues de contrôle et de présentation d'une île (Cycles, caméra perspective), depuis sa scène détaillée.
Usage : python3 render_vues_ile.py <slug> [rapide] [vues…] → art/out/<slug>/presentation/vue_*.png (ou $RK_OUT)
Ces vues servent à juger les détails de près ; les captures DANS LE JEU restent la référence de la planche."""
import sys, os, math
sys.path.insert(0, os.path.dirname(__file__))
import bpy
from mathutils import Vector
import rk_common as C
slug = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else [a for a in sys.argv[1:] if not a.startswith('-')][0]
rapide = 'rapide' in sys.argv


def vues(slug):
    if slug == 'loguetown':
        import lg_plan as P
        return {  # nom : (cible x, y, z du jeu), (azimut depuis la cible en degrés du jeu, élévation), distance, focale
            'generale': ((0, -1, 2), (100, 40), 120, 45),
            'place': ((P.PL[0] - 2, P.PL[1] - 1, 3), (95, 30), 30, 45),
            'cathedrale': ((P.DOME[0], P.DOME[1] + 2, 5), (60, 26), 30, 45),
            'ville': ((-6, -14, 2), (150, 36), 26, 45),
            'port': ((P.BASSIN[0] + 1, P.BASSIN[1] - 1, 1), (70, 34), 30, 45),
            'villa': ((P.VILLA[0] + 2, P.VILLA[1] + 3, 3), (130, 42), 26, 45),
            'collines': ((19, -14, 4), (70, 32), 30, 45),
        }
    if slug == 'wano':
        import wa_plan as P
        cx, cy = P.CHATEAU; ox, oy = P.at_q(P.ODEN[1], P.ODEN[0]); gx, gy = P.at_q(P.CIMETIERE[1], P.CIMETIERE[0]); mx, my = P.at_q(.9, P.MOGURA[0])
        return {
            'generale': ((0, 0, 5), (100, 42), 130, 45),
            'capitale': ((cx - 2, cy, 10), (100, 30), 30, 45),
            'fuji': ((P.FUJI[0], P.FUJI[1], 12), (80, 22), 42, 45),
            'kuri': ((ox, oy - 2, 8), (95, 30), 30, 45),
            'ringo': ((gx, gy, 7), (-90, 36), 28, 45),
            'mogura': ((mx, my, 4), (-40, 30), 30, 45),
            'cascade': (P.at_q(.96, P.RIVIERES[3]) + (3,), (65, 18), 22, 45),
        }
    if slug == 'alabasta':
        import al_plan as P
        return {
            'generale': ((0, 0, 3), (100, 42), 125, 45),
            'alubarna': ((P.ALUBARNA[0], P.ALUBARNA[1], 8), (110, 32), 30, 45),
            'escaliers': ((P.ALUBARNA[0] - 7, P.ALUBARNA[1], 6), (175, 26), 26, 45),
            'rainbase': ((P.RAINBASE[0], P.RAINBASE[1], 3), (80, 32), 24, 45),
            'nanohana': ((P.NANOHANA[0], P.NANOHANA[1], 2), (60, 32), 26, 45),
            'fleuve': ((-1.5, 4, 2), (90, 24), 30, 45),
            'yuba': ((P.YUBA[0], P.YUBA[1], 2), (120, 34), 20, 45),
        }
    if slug == 'syrup':
        import sy_plan as P
        return {
            'generale': ((0, 0, 3), (100, 42), 120, 45),
            'manoir': ((P.MANOIR[0], P.MANOIR[1], 8), (120, 30), 24, 45),
            'village': ((P.VILLAGE[0], P.VILLAGE[1], 3), (90, 34), 26, 45),
            'pente_sud': (P.at_coast(P.PENTE_S, .8) + (2,), (60, 24), 24, 45),
            'pente_nord': (P.at_coast(P.PENTE_N, .8) + (2,), (-60, 28), 24, 45),
            'champs': ((12, 6, 3), (60, 30), 26, 45),
            'cascade': (P.at_coast(math.atan2(P.RUISSEAU[-1][1], P.RUISSEAU[-1][0]), .95) + (2,), (20, 18), 18, 45),
        }
    if slug == 'cocoyasi':
        import co_plan as P
        return {
            'generale': ((0, 0, 3), (100, 42), 120, 45),
            'village': ((P.VILLAGE[0], P.VILLAGE[1], 2), (80, 34), 26, 45),
            'temple': ((P.TEMPLE[0], P.TEMPLE[1], 2), (60, 26), 16, 45),
            'rizieres': ((P.COLLINE[0], P.COLLINE[1] + 2, 6), (100, 30), 30, 45),
            'arlong': ((P.ARLONG[0] - 1.5, P.ARLONG[1], 1), (40, 24), 18, 45),
            'gosa': ((P.GOSA[0], P.GOSA[1], 2), (120, 34), 20, 45),
            'quai': (P.at_coast(P.QUAI_A, .9) + (1,), (150, 26), 20, 45),
        }
    if slug == 'laugh_tale':
        import lt_plan as P
        return {
            'generale': ((0, 0, 4), (100, 42), 130, 45),
            'fjord': ((P.PORTE[0] + 4, P.PORTE[1], 2), (5, 20), 30, 45),
            'citadelle': ((P.CITADELLE[0], P.CITADELLE[1], 6), (135, 30), 26, 45),
            'terrasses': ((P.TERRASSES[0], P.TERRASSES[1], 4), (85, 30), 24, 45),
            'camp': ((P.FOND[0] - 1, P.FOND[1], 1), (-25, 32), 16, 45),
            'sommet': ((P.SOMMET[0], P.SOMMET[1], 10), (-80, 22), 30, 45),
            'falaises': (P.at_coast(math.radians(80), .95) + (2,), (80, 12), 32, 45),
        }
    if slug == 'mary_geoise':
        import mg_plan as P
        T = P.TOP
        return {
            'generale': ((0, 0, 5), (100, 42), 120, 45),
            'chateau': ((P.CHATEAU[0], P.CHATEAU[1], T + 3), (135, 30), 26, 45),
            'domaine': ((-8, -8, T + 1), (180, 34), 22, 45),
            'carrefour': ((0, 0, T + 1), (90, 30), 22, 45),
            'port_est': (P.at_coast(0, .85) + (3,), (0, 22), 28, 45),
            'escalier': (P.at_coast(math.radians(89), .88) + (3,), (90, 14), 26, 45),
            'foret': ((P.FORET[0], P.FORET[1], T + 1), (-135, 30), 24, 45),
        }
    if slug == 'elbaph':
        import eb_plan as P
        sx, sy, sr, sz, sa = P.plateforme('source'); wx, wy, wr, wz, wa = P.plateforme('ouest'); ex, ey, er, ez, ea = P.plateforme('est')
        return {
            'generale': ((0, 0, 8), (100, 38), 150, 45),
            'arbre': ((0, 3, 9), (90, 20), 50, 45),
            'village_ouest': ((wx - 2, wy, wz + 1), (180, 30), 30, 45),
            'source': ((sx, sy, sz + 2), (85, 30), 28, 45),
            'aurust': ((ex + 3, ey, ez + 3), (0, 22), 24, 45),
            'road': ((P.ROAD[0], P.ROAD[1], 8), (-135, 26), 28, 45),
            'underworld': ((14, 12, 4), (45, 22), 30, 45),
        }
    if slug == 'egghead':
        import eg_plan as P
        nx, ny, nr, nz = P.NUAGE; px, py, pr = P.PLACE; ux, uy = P.USINE; lx, ly = P.PAS_DE_TIR
        return {
            'generale': ((0, 0, 6), (100, 42), 140, 45),
            'oeuf': ((nx, ny, 11), (90, 24), 36, 45),
            'frontier': ((nx, ny, 7), (10, 14), 36, 45),
            'ville': ((px, py, 1.5), (90, 34), 32, 45),
            'usine': ((ux, uy, 2), (0, 28), 20, 45),
            'fusee': ((lx, ly, 4), (-45, 22), 24, 45),
            'icebergs': (P.at_coast(math.radians(180), 1.0) + (2,), (180, 18), 34, 45),
        }
    if slug == 'la_ruche':
        import lr_plan as P
        cx, cy, Rk = P.CRANE; ax, ay, ar = P.ARENE
        return {
            'generale': ((0, 0, 6), (100, 42), 140, 45),
            'crane': ((cx, cy, 9), (90, 16), 38, 45),
            'mer': ((cx, cy, 6.5), (80, 4), 62, 45),
            'fissure': ((cx, cy, 12), (15, 34), 26, 45),
            'ville': ((10, 12, 2), (55, 32), 28, 45),
            'palmiers': ((cx - 8, cy, 6), (180, 18), 30, 45),
            'arene': ((ax, ay, 2), (-90, 34), 20, 45),
        }
    if slug == 'hommes_poissons':
        import hp_plan as P
        ax, ay, ar = P.PALAIS; az = P.z_bulle(ax, ay); px, py, pr = P.PLACE
        return {
            'generale': ((0, 0, 6), (100, 42), 140, 45),
            'palais': ((ax, ay, az + 2), (80, 18), 30, 45),
            'place': ((px, py, 2), (90, 34), 30, 45),
            'port': (P.at_coast(P.PORT_A, .82) + (1,), (90, 26), 26, 45),
            'moulins': ((P.MOULINS[0], P.MOULINS[1], 1.5), (-90, 30), 26, 45),
            'recif': ((-23, 8, 1), (180, 22), 26, 45),
        }
    if slug == 'marineford':
        import mf_plan as P
        qx, qy = P.QG; ex, ey = P.ECHAFAUD; bx, by, br, bg = P.BAIE
        return {
            'generale': ((0, 0, 6), (100, 42), 140, 45),
            'qg': ((qx, qy, 5), (90, 16), 30, 45),
            'echafaud': ((ex, ey + 2, 2.5), (90, 22), 22, 45),
            'baie': ((bx, by, 1), (90, 34), 34, 45),
            'ville': ((15, 0, 1.5), (0, 30), 26, 45),
            'canons': ((-24, 6, 1), (180, 20), 22, 45),
        }
    if slug == 'ohara':
        import oh_plan as P
        ax, ay, ar, ah = P.ARBRE; lx, ly, lr = P.LAC
        return {
            'generale': ((0, 0, 6), (100, 42), 145, 45),
            'arbre': ((ax, ay, 9), (90, 14), 42, 45),
            'bibliotheque': ((ax, ay + 3, 4), (90, 8), 20, 45),
            'lac': ((lx, ly, 1), (0, 30), 26, 45),
            'village': ((ax - 9, ay + 8, 1.5), (135, 30), 24, 45),
            'port': (P.at_coast(P.PORT_A, .85) + (1,), (90, 26), 26, 45),
        }
    raise KeyError(slug)


V = vues(slug)
bpy.ops.wm.open_mainfile(filepath=os.path.join(C.ART, 'blender', 'islands', slug + '.blend'))
OUT = os.environ.get('RK_OUT') or os.path.join(C.ART, 'out', slug, 'presentation'); os.makedirs(OUT, exist_ok=True)
sc = bpy.context.scene
C.render_settings(16 if rapide else 48); C.light_rig(sheared=False)
sc.render.film_transparent = False
w = sc.world or bpy.data.worlds.new('W'); sc.world = w; w.use_nodes = True
w.node_tree.nodes['Background'].inputs[0].default_value = (.36, .62, .74, 1); w.node_tree.nodes['Background'].inputs[1].default_value = .9
bpy.ops.mesh.primitive_plane_add(size=170, location=(0, 0, -.15)); mer = bpy.context.object
mat = bpy.data.materials.new('Mer'); mat.use_nodes = True; bs = mat.node_tree.nodes['Principled BSDF']
bs.inputs['Base Color'].default_value = (.12, .45, .62, 1); bs.inputs['Roughness'].default_value = .25; mer.data.materials.append(mat)
cam = bpy.data.cameras.new('Cam'); co = bpy.data.objects.new('Cam', cam); sc.collection.objects.link(co); sc.camera = co
only = [a for a in sys.argv[1:] if a in V]
for nm, (tg, (az, el), dist, foc) in V.items():
    if only and nm not in only: continue
    t = C.g2b(*tg); a = math.radians(az); e = math.radians(el)
    off = Vector((math.cos(a) * math.cos(e), -math.sin(a) * math.cos(e), math.sin(e))) * dist
    co.location = t + off; co.rotation_euler = (t - co.location).to_track_quat('-Z', 'Y').to_euler(); cam.lens = foc
    sc.render.resolution_x, sc.render.resolution_y = (960, 600) if rapide else (1600, 1000); sc.render.resolution_percentage = 100
    sc.render.filepath = os.path.join(OUT, 'vue_%s.png' % nm); sc.render.line_thickness = 1.2
    bpy.ops.render.render(write_still=True); print('VUE', nm, sc.render.filepath)
