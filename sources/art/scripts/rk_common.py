"""RISK OP — outils communs de la chaîne Blender (une seule source 3D, deux sorties).

Repère : les scènes Blender sont dans le repère de l'île, en UNITÉS DE CARTE du jeu.
    Blender X = x jeu (est), Blender Y = -y jeu (le sud du jeu est vers -Y), Blender Z = z jeu (haut).
Une scène d'île est organisée en collections :
    RK_SOL        terrain praticable (sert à la carte des hauteurs des unités)
    RK_DECOR      monument, végétation, accessoires (ombrent, mais on ne marche pas dessus)
    RK_VILLE_2..4 constructions ajoutées aux niveaux de ville 2, 3 et 4 (le niveau 1 est dans RK_DECOR)
    RK_REPERES    empties : DRAPEAU_* (bannière du camp), PONTON (arrivée des navires)
Toutes les couleurs sont dans l'attribut de couleur « Col » (albédo peint par sommet) : le même attribut sert
au rendu Blender (2.5D) et au glTF (3D WebGL), qui le rééclaire avec le soleil du jeu.
Un modèle importé d'un artiste (glTF/FBX/.blend) se range dans RK_DECOR ; s'il a des textures peintes,
`bake_to_color()` les transfère dans « Col » avant export.
"""
import bpy, bmesh, math, json, os, time, random, base64, struct
from mathutils import Vector, Matrix, noise
from mathutils.bvhtree import BVHTree

ART = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SUN_GAME = (-.55, .42, .72)          # même soleil que le moteur 3D du jeu (R3_SUN), repère jeu
LOD_K = {'l1': 2, 'l2': 6, 'l3': 12}  # pixels par unité de carte des rendus 2.5D

# ---------------------------------------------------------------- données du jeu
def island(name):
    d = json.load(open(os.path.join(ART, 'data', 'islands.json')))
    for i in d['iles']:
        if i['nom'] == name:
            pts = i['cote3d']; i['coast'] = [(pts[k], pts[k + 1]) for k in range(0, len(pts), 2)]
            return i
    raise KeyError(name)

def coast_r(isl, th):
    """rayon de la côte (repère jeu) dans la direction th, interpolé comme dans le jeu"""
    P = isl['coast']; B = len(P); f = ((th + math.pi) / (2 * math.pi)) * B
    i = int(math.floor(f)) % B; j = (i + 1) % B; k = f - math.floor(f)
    r0 = math.hypot(*P[i]); r1 = math.hypot(*P[j]); return r0 + (r1 - r0) * k

def g2b(x, y, z=0.0):
    return Vector((x, -y, z))

# ---------------------------------------------------------------- scène
def new_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    for n in ['RK_SOL', 'RK_DECOR', 'RK_VILLE_2', 'RK_VILLE_3', 'RK_VILLE_4', 'RK_REPERES']:
        c = bpy.data.collections.new(n); sc.collection.children.link(c)
    sc.unit_settings.system = 'NONE'
    sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'
    sc.view_settings.exposure = 0.0; sc.view_settings.gamma = 1.0
    w = bpy.data.worlds.new('RK_Ciel'); sc.world = w; w.use_nodes = True
    bg = w.node_tree.nodes['Background']; bg.inputs[0].default_value = (0.62, 0.78, 0.95, 1); bg.inputs[1].default_value = 0.55
    return sc

def normals_up(o):
    """terrain : faces orientées vers le haut (le moteur 3D du jeu éclaire selon la normale)"""
    me = o.data
    if sum(p.normal.z * p.area for p in me.polygons) < 0:
        for p in me.polygons: p.flip()
        me.update()

def coll(name):
    return bpy.data.collections[name]

# ---------------------------------------------------------------- matériaux communs
def mat_vcol(name='RK_Peint', rough=0.85, spec=0.15, emit=0.0):
    """matériau commun : albédo = attribut de couleur « Col » ; même rendu pour toutes les îles"""
    m = bpy.data.materials.get(name)
    if m: return m
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree
    bsdf = nt.nodes['Principled BSDF']
    a = nt.nodes.new('ShaderNodeVertexColor'); a.layer_name = 'Col'
    nt.links.new(a.outputs['Color'], bsdf.inputs['Base Color'])
    bsdf.inputs['Roughness'].default_value = rough
    if 'Specular IOR Level' in bsdf.inputs: bsdf.inputs['Specular IOR Level'].default_value = spec
    if emit > 0:
        nt.links.new(a.outputs['Color'], bsdf.inputs['Emission Color']); bsdf.inputs['Emission Strength'].default_value = emit
    return m

def materials():
    return {'peint': mat_vcol('RK_Peint'), 'brillant': mat_vcol('RK_Glace', rough=.35, spec=.6),
            'lueur': mat_vcol('RK_Lueur', emit=2.5), 'eau': mat_vcol('RK_Eau', rough=.15, spec=.8)}

# ---------------------------------------------------------------- géométrie peinte
def _lin(c):
    return c / 12.92 if c <= .04045 else ((c + .055) / 1.055) ** 2.4

def hexc(h, k=1.0):
    """couleur de palette (hex sRGB) → valeurs LINÉAIRES (attributs de couleur Blender et glTF sont linéaires)"""
    h = h.lstrip('#'); return (_lin(int(h[0:2], 16) / 255) * k, _lin(int(h[2:4], 16) / 255) * k, _lin(int(h[4:6], 16) / 255) * k, 1.0)

def mix(a, b, t):
    return tuple(a[i] + (b[i] - a[i]) * t for i in range(4))

def paint(obj, fn):
    """remplit l'attribut « Col » : fn(co_monde, normale_monde) -> (r,g,b,a) ; ajoute une variation « coup de pinceau »"""
    me = obj.data
    if 'Col' not in me.color_attributes: me.color_attributes.new('Col', 'BYTE_COLOR', 'POINT')
    ca = me.color_attributes['Col']; me.color_attributes.active_color = ca
    mw = obj.matrix_world; nm = mw.to_3x3().inverted().transposed()
    for v in me.vertices:
        co = mw @ v.co; n = (nm @ v.normal).normalized()
        c = fn(co, n)
        j = 1 + .07 * noise.noise(co * .45) + .04 * noise.noise(co * 2.1)       # pinceau : variation douce de valeur
        ca.data[v.index].color = (min(1, c[0] * j), min(1, c[1] * j), min(1, c[2] * j), 1)

def solid(col):
    return lambda co, n: col

def shade_soft(col, dark=.82):
    """couleur peinte avec un léger dégradé de valeur (dessous un peu plus sombre) — reste léger car le jeu rééclaire"""
    return lambda co, n: mix(tuple(c * dark for c in col[:3]) + (1,), col, max(0, min(1, .5 + .5 * n.z)))

def mk_obj(name, bm, collection, mat, smooth=True):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    if smooth:
        for p in me.polygons: p.use_smooth = True
    o = bpy.data.objects.new(name, me); collection.objects.link(o)
    o.data.materials.append(mat)
    return o

def bm_uvsphere(bm, loc, r, seg=16, rings=10, scale=(1, 1, 1)):
    g = bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=rings, radius=1)
    M = Matrix.Translation(loc) @ Matrix.Diagonal((r * scale[0], r * scale[1], r * scale[2], 1))
    bmesh.ops.transform(bm, matrix=M, verts=g['verts']); return g['verts']

def bm_ico(bm, loc, r, sub=2, scale=(1, 1, 1), jit=0.0, seed=0):
    g = bmesh.ops.create_icosphere(bm, subdivisions=sub, radius=1)
    for v in g['verts']:
        d = v.co.normalized(); k = 1 + jit * noise.noise(d * 2.3 + Vector((seed, seed * .7, 0)))
        v.co = Vector((loc[0] + d.x * r * scale[0] * k, loc[1] + d.y * r * scale[1] * k, loc[2] + d.z * r * scale[2] * k))
    return g['verts']

def bm_cyl(bm, a, b, r0, r1, seg=12, cap=True):
    """tronc / colonne de a à b, rayon r0 → r1"""
    a = Vector(a); b = Vector(b); d = b - a; L = d.length
    g = bmesh.ops.create_cone(bm, cap_ends=cap, cap_tris=False, segments=seg, radius1=r0, radius2=r1, depth=L)
    q = d.normalized().to_track_quat('Z', 'Y')
    M = Matrix.Translation((a + b) / 2) @ q.to_matrix().to_4x4()
    bmesh.ops.transform(bm, matrix=M, verts=g['verts']); return g['verts']

def bm_box(bm, c, s):
    g = bmesh.ops.create_cube(bm, size=1)
    bmesh.ops.transform(bm, matrix=Matrix.Translation(c) @ Matrix.Diagonal((s[0], s[1], s[2], 1)), verts=g['verts']); return g['verts']

def bm_tube(bm, pts, rf, seg=8):
    """tube lisse le long d'une polyligne ; rf(t) rayon"""
    pts = [Vector(p) for p in pts]; N = len(pts); rings = []
    for i, p in enumerate(pts):
        T = (pts[min(N - 1, i + 1)] - pts[max(0, i - 1)]).normalized()
        U = Vector((0, 0, 1)) if abs(T.z) < .9 else Vector((1, 0, 0))
        S = T.cross(U).normalized(); V = T.cross(S).normalized(); r = rf(i / (N - 1))
        rings.append([bm.verts.new(p + (S * math.cos(a) + V * math.sin(a)) * r) for a in [k / seg * 2 * math.pi for k in range(seg)]])
    for i in range(N - 1):
        for k in range(seg):
            bm.faces.new((rings[i][k], rings[i][(k + 1) % seg], rings[i + 1][(k + 1) % seg], rings[i + 1][k]))
    bm.faces.new(list(reversed(rings[0]))); bm.faces.new(rings[-1])
    return [v for r in rings for v in r]

def catmull(pts, n=6):
    P = [Vector(p) for p in pts]; out = []
    for i in range(len(P) - 1):
        p0 = P[max(0, i - 1)]; p1 = P[i]; p2 = P[i + 1]; p3 = P[min(len(P) - 1, i + 2)]
        for k in range(n):
            t = k / n; t2 = t * t; t3 = t2 * t
            out.append(.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3))
    out.append(P[-1]); return out

# ---------------------------------------------------------------- lancer de rayons (pose sur le relief)
class Ground:
    """pose des objets sur une surface : z(x_jeu, y_jeu) par lancer de rayon vertical"""
    def __init__(self, objs):
        dg = bpy.context.evaluated_depsgraph_get(); V = []; F = []
        for o in objs:
            ev = o.evaluated_get(dg); me = ev.to_mesh(); mw = o.matrix_world; b = len(V)
            V += [mw @ v.co for v in me.vertices]; F += [[b + i for i in p.vertices] for p in me.polygons]; ev.to_mesh_clear()
        self.t = BVHTree.FromPolygons(V, F)
    def z(self, x, y, default=None):
        hit = self.t.ray_cast(Vector((x, -y, 500)), Vector((0, 0, -1)))
        return hit[0].z if hit[0] is not None else default
    def hit(self, x, y):
        return self.t.ray_cast(Vector((x, -y, 500)), Vector((0, 0, -1)))

# ---------------------------------------------------------------- éclairage commun et rendu 2.5D
SHEAR = Matrix(((1, 0, 0, 0), (0, 1, 1, 0), (0, 0, 1, 0), (0, 0, 0, 1)))   # Y' = Y + Z : projection oblique du mode 2.5D

def light_rig(sheared=True):
    """soleil commun à toutes les îles (même direction que le jeu) + ciel ; en espace cisaillé la direction est cisaillée aussi"""
    L = Vector((SUN_GAME[0], -SUN_GAME[1], SUN_GAME[2])).normalized()
    if sheared: L = (SHEAR.to_3x3() @ L).normalized()
    sun = bpy.data.lights.get('RK_Soleil') or bpy.data.lights.new('RK_Soleil', 'SUN')
    sun.energy = 3.2; sun.angle = math.radians(3.5); sun.color = (1.0, .95, .86)
    o = bpy.data.objects.get('RK_Soleil') or bpy.data.objects.new('RK_Soleil', sun)
    if o.name not in bpy.context.scene.collection.objects: bpy.context.scene.collection.objects.link(o)
    o.rotation_euler = (-L).to_track_quat('-Z', 'Y').to_euler()
    return o

def render_settings(samples=32):
    sc = bpy.context.scene; sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'
    sc.cycles.samples = samples; sc.cycles.use_denoising = True
    try: sc.cycles.denoiser = 'OPENIMAGEDENOISE'
    except Exception: pass
    sc.cycles.max_bounces = 4; sc.cycles.diffuse_bounces = 2; sc.cycles.glossy_bounces = 1; sc.cycles.transmission_bounces = 1
    sc.render.film_transparent = True; sc.render.image_settings.file_format = 'PNG'; sc.render.image_settings.color_mode = 'RGBA'
    sc.render.use_freestyle = True; sc.render.line_thickness_mode = 'ABSOLUTE'
    vl = sc.view_layers[0]; vl.use_freestyle = True
    fs = vl.freestyle_settings; fs.crease_angle = math.radians(120)
    ls = fs.linesets[0] if len(fs.linesets) else fs.linesets.new('RK_Contour')
    ls.select_by_visibility = True; ls.select_silhouette = True; ls.select_border = True; ls.select_crease = False
    if ls.linestyle is None: ls.linestyle = bpy.data.linestyles.new('RK_Trait')
    ls.linestyle.color = (.16, .11, .14); ls.linestyle.alpha = .55
    return sc

def frame_info(isl, objs_all, K):
    """cadre de l'image 2.5D, identique à celui attendu par le jeu : Wc=2·ext·K, Hc=(2·ext+zmax)·K, C=ext·K, CY=(ext+zmax)·K"""
    xs = []; ys = []; zs = []
    dg = bpy.context.evaluated_depsgraph_get()
    for o in objs_all:
        if o.type != 'MESH': continue
        for c in o.bound_box:
            w = o.matrix_world @ Vector(c); xs.append(abs(w.x)); ys.append(abs(w.y)); zs.append(w.z)
    ext = max(isl['rayon'] * 1.24, max(xs) + 1, max(ys) + 1); zmax = max(8, max(zs) + 2)
    return {'ext': round(ext, 3), 'zmax': round(zmax, 3), 'K': K, 'Wc': math.ceil(2 * ext * K), 'Hc': math.ceil((2 * ext + zmax) * K),
            'C': ext * K, 'CY': (ext + zmax) * K}

def sheared_copy(objs, name):
    """copie « cuite » (modificateurs appliqués) et cisaillée de la scène, pour la caméra 2.5D"""
    dg = bpy.context.evaluated_depsgraph_get(); out = []
    rc = bpy.data.collections.get(name) or bpy.data.collections.new(name)
    if rc.name not in bpy.context.scene.collection.children: bpy.context.scene.collection.children.link(rc)
    for o in objs:
        if o.type not in ('MESH', 'CURVE', 'META'): continue
        ev = o.evaluated_get(dg); me = bpy.data.meshes.new_from_object(ev, preserve_all_data_layers=True, depsgraph=dg)
        me.transform(o.matrix_world)
        bm = bmesh.new(); bm.from_mesh(me)                       # sous l'eau : rien à dessiner (le jeu peint sa mer et son écume)
        g = bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=(0, 0, -.03), plane_no=(0, 0, 1), clear_inner=True)
        bm.to_mesh(me); bm.free()
        if not me.vertices: bpy.data.meshes.remove(me); continue
        me.transform(SHEAR)
        c = bpy.data.objects.new(o.name + '_25d', me); rc.objects.link(c); out.append(c)
    return rc, out

def camera_25d(fr):
    cam = bpy.data.cameras.get('RK_Cam25') or bpy.data.cameras.new('RK_Cam25'); cam.type = 'ORTHO'
    W = 2 * fr['ext']; H = 2 * fr['ext'] + fr['zmax']; cam.ortho_scale = max(W, H); cam.sensor_fit = 'AUTO'
    cam.clip_start = .1; cam.clip_end = 2000
    o = bpy.data.objects.get('RK_Cam25') or bpy.data.objects.new('RK_Cam25', cam)
    if o.name not in bpy.context.scene.collection.objects: bpy.context.scene.collection.objects.link(o)
    o.location = (0, fr['zmax'] / 2, 600); o.rotation_euler = (0, 0, 0)
    sc = bpy.context.scene; sc.camera = o; sc.render.resolution_x = fr['Wc']; sc.render.resolution_y = fr['Hc']; sc.render.resolution_percentage = 100
    return o

def render_png(path, line_px):
    sc = bpy.context.scene; sc.render.line_thickness = line_px; sc.render.filepath = path
    t = time.time(); bpy.ops.render.render(write_still=True); return time.time() - t

def png_to_webp(png, webp, q=86):
    from PIL import Image
    im = Image.open(png); im.save(webp, 'WEBP', quality=q, method=5); return os.path.getsize(webp)

# ---------------------------------------------------------------- export glTF (mode 3D) et cartes de hauteur
def unify_color(me):
    """ramène l'attribut « Col » en couleur flottante par sommet (types/domaines mélangés → un seul calque à la fusion)"""
    src = me.color_attributes.get('Col'); n = len(me.vertices); out = [(.8, .8, .8, 1.0)] * n
    if src is not None:
        if src.domain == 'POINT': out = [tuple(src.data[i].color) for i in range(n)]
        else:
            acc = [[0, 0, 0, 0] for _ in range(n)]
            for l in me.loops:
                c = src.data[l.index].color; a = acc[l.vertex_index]
                for k in range(3): a[k] += c[k]
                a[3] += 1
            out = [(a[0] / a[3], a[1] / a[3], a[2] / a[3], 1.0) if a[3] else (.8, .8, .8, 1.0) for a in acc]
        me.color_attributes.remove(src)
    ca = me.color_attributes.new('Col', 'FLOAT_COLOR', 'POINT')
    for i in range(n): ca.data[i].color = out[i]
    me.color_attributes.active_color = ca

def export_glb(objs_by_node, path, ratio=1.0):
    """objs_by_node : {'BASE': [obj…], 'VILLE_2': […]} ; ratio < 1 : réduction de polygones (niveaux de détail)"""
    dg = bpy.context.evaluated_depsgraph_get(); tmp = []
    for node, objs in objs_by_node.items():
        bm = bmesh.new()
        for o in objs:
            if o.type not in ('MESH', 'CURVE', 'META'): continue
            ev = o.evaluated_get(dg); me = bpy.data.meshes.new_from_object(ev, preserve_all_data_layers=True, depsgraph=dg)
            me.transform(o.matrix_world)
            unify_color(me)
            bm.from_mesh(me); bpy.data.meshes.remove(me)
        if not bm.verts: bm.free(); continue
        me = bpy.data.meshes.new(node); bm.to_mesh(me); bm.free()
        if 'Col' in me.color_attributes:
            me.color_attributes.active_color = me.color_attributes['Col']; me.color_attributes.render_color_index = me.color_attributes.active_color_index
        ob = bpy.data.objects.new(node, me); bpy.context.scene.collection.objects.link(ob); tmp.append(ob)
        if ratio < 1:
            m = ob.modifiers.new('lod', 'DECIMATE'); m.ratio = ratio; m.use_collapse_triangulate = True
        ob.modifiers.new('tri', 'TRIANGULATE')
    bpy.ops.object.select_all(action='DESELECT')
    for o in tmp: o.select_set(True)
    bpy.context.view_layer.objects.active = tmp[0]
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, export_apply=True, export_normals=True,
                              export_materials='NONE', export_vertex_color='ACTIVE', export_all_vertex_colors=False, export_yup=True)
    tris = 0
    for o in tmp:
        ev = o.evaluated_get(bpy.context.evaluated_depsgraph_get()); me = ev.to_mesh(); tris += sum(len(p.vertices) - 2 for p in me.polygons); ev.to_mesh_clear()
        bpy.data.objects.remove(o)
    return tris, os.path.getsize(path)

def heightfield(objs, ext, n=128):
    """hauteurs sur une grille n×n couvrant [-ext, ext]² (repère jeu) ; renvoie base64 d'Uint16 (h+4)/96·65535"""
    g = Ground(objs); a = []
    for j in range(n):
        for i in range(n):
            x = -ext + (i + .5) * 2 * ext / n; y = -ext + (j + .5) * 2 * ext / n
            z = g.z(x, y, -1.0); a.append(max(0, min(65535, int(round((z + 4) / 96 * 65535)))))
    return base64.b64encode(struct.pack('<%dH' % len(a), *a)).decode()

def flags_and_marks():
    out = {'drapeaux': [], 'ponton': None}
    for o in coll('RK_REPERES').objects:
        p = o.matrix_world.translation; gp = [round(p.x, 3), round(-p.y, 3), round(p.z, 3)]
        if o.name.startswith('DRAPEAU'): out['drapeaux'].append(gp)
        if o.name.startswith('PONTON'): out['ponton'] = gp
    return out

def mark(name, x, y, z):
    e = bpy.data.objects.new(name, None); e.location = g2b(x, y, z); coll('RK_REPERES').objects.link(e); return e
