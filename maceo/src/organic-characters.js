import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/**
 * Small articulated adventure figures. Each figure owns its render geometry,
 * materials and gradient map. Only unrendered CPU primitive templates are cached,
 * so disposing one figure (or an entire battle) never invalidates another one.
 * Use disposeOrganicCharacter(root) when removing a figure from a long-lived scene.
 * The root transform belongs to the caller; animations affect an internal pose.
 */
const templates = new Map();
const up = new THREE.Vector3(0, 1, 0);
const emptyRotation = new THREE.Euler();
const WHITE = '#fff8e6';
const INK = '#111b29';
const LEATHER = '#553c35';

function primitive(key, factory) {
  if (!templates.has(key)) templates.set(key, factory());
  return templates.get(key).clone();
}

function sphereGeometry() {
  return primitive('sphere', () => new THREE.SphereGeometry(1, 14, 10));
}

function capsuleGeometry(radius, length) {
  return primitive(`capsule:${radius}:${length}`, () => new THREE.CapsuleGeometry(radius, length, 4, 10));
}

function cylinderGeometry(top, bottom, length, radial = 12) {
  return primitive(`cylinder:${top}:${bottom}:${length}:${radial}`, () => new THREE.CylinderGeometry(top, bottom, length, radial));
}

function latheGeometry(points, start = 0, arc = Math.PI * 2) {
  const key = `lathe:${JSON.stringify(points)}:${start}:${arc}`;
  return primitive(key, () => new THREE.LatheGeometry(points.map(([x, y]) => new THREE.Vector2(x, y)), 18, start, arc));
}

class Parts {
  constructor(origin = [0, 0, 0]) {
    this.origin = new THREE.Vector3(...origin);
    this.geometries = [];
  }

  add(geometry, color, position = [0, 0, 0], scale = [1, 1, 1], rotation = emptyRotation) {
    let g = geometry;
    if (g.index) {
      g = geometry.toNonIndexed();
      geometry.dispose();
    }
    for (const attribute of Object.keys(g.attributes)) {
      if (attribute !== 'position' && attribute !== 'normal') g.deleteAttribute(attribute);
    }
    const q = rotation.isQuaternion ? rotation : new THREE.Quaternion().setFromEuler(rotation);
    const matrix = new THREE.Matrix4().compose(
      new THREE.Vector3(...position).sub(this.origin), q, new THREE.Vector3(...scale),
    );
    g.applyMatrix4(matrix);
    const tint = new THREE.Color(color);
    const colors = new Float32Array(g.attributes.position.count * 3);
    for (let i = 0; i < colors.length; i += 3) {
      colors[i] = tint.r;
      colors[i + 1] = tint.g;
      colors[i + 2] = tint.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.geometries.push(g);
    return this;
  }

  ellipsoid(position, scale, color, rotation = emptyRotation) {
    return this.add(sphereGeometry(), color, position, scale, rotation);
  }

  capsule(position, radius, length, color, rotation = emptyRotation, scale = [1, 1, 1]) {
    return this.add(capsuleGeometry(radius, length), color, position, scale, rotation);
  }

  rod(from, to, radius, color, topRadius = radius) {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    const delta = b.clone().sub(a);
    const q = new THREE.Quaternion().setFromUnitVectors(up, delta.clone().normalize());
    return this.add(cylinderGeometry(topRadius, radius, delta.length()), color, a.add(b).multiplyScalar(.5).toArray(), [1, 1, 1], q);
  }

  curve(points, radius, color, segments = 12) {
    const path = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
    return this.add(new THREE.TubeGeometry(path, segments, radius, 5, false), color);
  }

  lathe(points, position, color, start, arc, scale = [1, 1, 1]) {
    return this.add(latheGeometry(points, start, arc), color, position, scale);
  }

  finish() {
    const result = mergeGeometries(this.geometries, false);
    this.geometries.forEach(g => g.dispose());
    this.geometries.length = 0;
    result.computeBoundingSphere();
    result.computeBoundingBox();
    return result;
  }
}

function gradientMap() {
  const values = [64, 126, 191, 255];
  const bytes = new Uint8Array(values.flatMap(v => [v, v, v, 255]));
  const map = new THREE.DataTexture(bytes, values.length, 1, THREE.RGBAFormat);
  map.name = 'Four hand-painted light bands';
  map.magFilter = THREE.NearestFilter;
  map.minFilter = THREE.NearestFilter;
  map.generateMipmaps = false;
  map.needsUpdate = true;
  return map;
}

function normalizeFaction(faction, marine) {
  if (marine || faction === 'marines' || faction === 'navy') return 'marine';
  if (['revo', 'revolutionary', 'revolutionnaire', 'révolutionnaire'].includes(faction)) return 'revolutionary';
  if (['bounty', 'hunter', 'bounty-hunter', 'chasseur', 'chasseurs'].includes(faction)) return 'bounty';
  return faction === 'marine' ? 'marine' : 'pirate';
}

function makeMesh(parts, material, name, parent) {
  const mesh = new THREE.Mesh(parts.finish(), material);
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function silhouette(mesh, material, width) {
  const geometry = mesh.geometry.clone();
  const p = geometry.attributes.position;
  const n = geometry.attributes.normal;
  for (let i = 0; i < p.count; i++) {
    p.setXYZ(i, p.getX(i) + n.getX(i) * width, p.getY(i) + n.getY(i) * width, p.getZ(i) + n.getZ(i) * width);
  }
  geometry.computeBoundingSphere();
  const outline = new THREE.Mesh(geometry, material);
  outline.name = `${mesh.name} · fine ink silhouette`;
  outline.castShadow = false;
  outline.receiveShadow = false;
  outline.renderOrder = 0;
  mesh.add(outline);
  return outline;
}

function joint(parent, name, position) {
  const node = new THREE.Group();
  node.name = name;
  node.position.set(...position);
  parent.add(node);
  return node;
}

function face(parts, skin, variant, luffy) {
  parts.ellipsoid([0, .948, 0], [.137, .158, .119], skin);
  for (const side of [-1, 1]) {
    parts.ellipsoid([side * .135, .945, -.003], [.023, .036, .024], skin);
    parts.ellipsoid([side * .144, .946, .006], [.009, .021, .014], '#d99176');
    parts.ellipsoid([side * .052, .963, .108], [.037, .045, .017], '#fffefa');
    parts.ellipsoid([side * .049, .962, .124], [.022, .031, .008], variant % 3 === 1 ? '#59735c' : '#503b31');
    parts.ellipsoid([side * .049, .962, .131], [.012, .024, .0055], '#17212b');
    parts.ellipsoid([side * .049 - .005, .974, .136], [.006, .009, .003], '#ffffff');
    parts.curve([[side * .024, 1.017, .111], [side * .05, 1.024, .109], [side * .082, 1.016, .101]], .006, '#352d2b', 7);
  }
  parts.ellipsoid([0, .928, .123], [.018, .019, .019], skin);
  parts.curve([[-.039, .898, .108], [0, .886, .122], [.039, .9, .108]], .005, '#693e3a', 9);
  parts.curve([[-.018, .892, .122], [0, .889, .125], [.02, .895, .119]], .0022, '#fff8e8', 6);
  if (luffy) {
    parts.curve([[-.073, .914, .112], [-.04, .908, .122]], .0038, '#74483f', 4);
    for (const x of [-.065, -.05]) parts.rod([x, .905, .12], [x + .004, .919, .121], .0025, '#74483f');
  }
}

function hair(parts, color, variant) {
  parts.ellipsoid([0, 1.044, -.017], [.137, .095, .116], color);
  // Curved locks, rather than a rigid helmet, remain legible below the hat brim.
  for (let i = 0; i < 7; i++) {
    const a = (i / 6 - .5) * 2.4;
    parts.capsule([Math.sin(a) * .112, 1.026 - (i % 2) * .02, .056 + Math.cos(a) * .042], .023, .04, color,
      new THREE.Euler(0, 0, Math.sin(a) * -.55));
  }
  if (variant === 2) {
    parts.curve([[.087, 1.055, .085], [.052, 1.017, .12], [.028, .974, .126]], .024, color, 9);
  }
}

function strawHat(parts) {
  parts.lathe([[0, 0], [.16, 0], [.218, .007], [.232, .018], [.215, .028], [.146, .028], [.14, .106], [.122, .132], [0, .138]], [0, 1.065, -.006], '#e6ba56');
  parts.lathe([[.149, .032], [.1495, .032], [.1465, .065], [.145, .065]], [0, 1.065, -.006], '#bd283d');
  for (let i = 0; i < 14; i++) {
    const a = i / 14 * Math.PI * 2;
    parts.rod([Math.cos(a) * .155, 1.095, Math.sin(a) * .155 - .006], [Math.cos(a) * .211, 1.089, Math.sin(a) * .211 - .006], .0018, '#bd8c3d');
  }
}

function marineCap(parts, officer) {
  parts.lathe([[0, 0], [.126, 0], [.144, .025], [.139, .087], [.096, .112], [0, .115]], [0, 1.057, -.008], '#f2f1e9');
  parts.lathe([[.129, 0], [.131, 0], [.14, .03], [.14, .034]], [0, 1.057, -.008], '#245b94');
  parts.ellipsoid([0, 1.071, .132], [.148, .012, .079], '#e9eef0');
  parts.curve([[-.021, 1.12, .125], [0, 1.136, .132], [.021, 1.12, .125]], .0045, officer ? '#c3a051' : '#285c92', 6);
  parts.rod([0, 1.125, .137], [0, 1.101, .14], .004, officer ? '#c3a051' : '#285c92');
}

function leatherHat(parts) {
  parts.lathe([[0, 0], [.143, 0], [.214, .006], [.22, .022], [.143, .031], [.126, .135], [.108, .154], [0, .154]], [0, 1.052, -.005], '#5d4038');
  parts.lathe([[.133, .037], [.135, .037], [.13, .064], [.128, .064]], [0, 1.052, -.005], '#b98753');
  parts.ellipsoid([0, 1.107, .132], [.023, .026, .008], '#d8b870');
}

function hood(parts, color) {
  parts.lathe([[.109, -.105], [.155, -.08], [.166, .027], [.14, .153], [.035, .19]], [0, .967, -.032], color, Math.PI / 2, Math.PI);
  parts.curve([[-.132, .873, -.018], [-.151, 1.008, .028], [-.102, 1.115, .04], [0, 1.145, .045], [.102, 1.115, .04], [.151, 1.008, .028], [.132, .873, -.018]], .015, color, 24);
}

function longCoat(parts, color, trim = null, justice = false) {
  parts.lathe([[.22, .245], [.214, .28], [.172, .53], [.172, .695], [.202, .756], [.13, .795]], [0, 0, -.018], color, Math.PI / 2, Math.PI);
  // Organic lapels and thick shoulder folds give the open coat volume.
  for (const side of [-1, 1]) {
    parts.ellipsoid([side * .149, .74, -.012], [.096, .062, .105], color);
    parts.capsule([side * .105, .657, .085], .031, .18, color, new THREE.Euler(0, 0, side * -.17), [1, 1, .55]);
    if (trim) {
      parts.curve([[side * .136, .736, .062], [side * .108, .6, .087], [side * .195, .28, .017]], .009, trim, 14);
    }
    if (justice) {
      parts.ellipsoid([side * .192, .782, .008], [.074, .023, .063], '#c6a75d');
      for (let k = 0; k < 5; k++) parts.capsule([side * (.155 + k * .018), .757, .038], .004, .028, '#dec16f');
    }
  }
  if (justice) justiceLetters(parts);
}

function justiceLetters(parts) {
  // Line lettering follows the coat's rounded back; no DOM, canvas, or texture.
  const glyphs = {
    J: [[[0, 1], [1, 1]], [[.75, 1], [.75, .2], [.5, 0], [.15, .1], [0, .3]]],
    U: [[[0, 1], [0, .2], [.2, 0], [.8, 0], [1, .2], [1, 1]]],
    S: [[[1, .9], [.7, 1], [.1, .9], [0, .6], [.9, .4], [1, .1], [.3, 0], [0, .1]]],
    T: [[[0, 1], [1, 1]], [[.5, 1], [.5, 0]]],
    I: [[[0, 1], [1, 1]], [[.5, 1], [.5, 0]], [[0, 0], [1, 0]]],
    C: [[[1, .9], [.7, 1], [.1, .8], [0, .3], [.3, 0], [1, .1]]],
    E: [[[1, 1], [0, 1], [0, 0], [1, 0]], [[0, .5], [.8, .5]]],
  };
  [...'JUSTICE'].forEach((letter, i) => {
    for (const stroke of glyphs[letter]) {
      const points = stroke.map(([x, y]) => {
        const px = -.125 + (i + x * .7) * .037;
        return [px, .59 + y * .068, -.018 - Math.sqrt(Math.max(.012, .173 ** 2 - px ** 2)) - .004];
      });
      parts.curve(points, .0037, '#28496d', Math.max(4, points.length * 2));
    }
  });
}

function sword(parts, hand, color, variant = 0) {
  const [x, y, z] = hand;
  parts.rod([x, y - .035, z], [x, y + .075, z], .013, LEATHER);
  parts.add(new THREE.TorusGeometry(.036, .006, 5, 12), '#d5b16a', [x, y + .07, z], [1, 1, 1], new THREE.Euler(Math.PI / 2, 0, 0));
  parts.curve([[x, y + .077, z], [x + .015, y + .24, z], [x + .05 + variant * .008, y + .43, z]], .011, '#d6e5e4', 18);
  parts.curve([[x + .008, y + .1, z + .006], [x + .022, y + .245, z + .006], [x + .053, y + .421, z + .005]], .0028, '#fff8e7', 12);
  parts.rod([x, y - .045, z], [x, y - .02, z], .017, color);
}

function firearm(parts, hand, rifle, color) {
  const [x, y, z] = hand;
  const length = rifle ? .32 : .17;
  parts.capsule([x, y + .01, z + .025], .022, rifle ? .085 : .04, LEATHER, new THREE.Euler(Math.PI / 2, 0, 0));
  parts.rod([x, y + .03, z + .04], [x, y + .03, z + length], rifle ? .012 : .018, '#56636e');
  parts.rod([x, y + .03, z + length], [x, y + .03, z + length + .014], rifle ? .017 : .023, '#182e3c');
  parts.rod([x, y + .01, z + .045], [x, y - .051, z + .019], .016, LEATHER);
  parts.ellipsoid([x, y + .019, z + .09], [.024, .014, .031], color);
  if (rifle) {
    parts.capsule([x, y + .016, z - .057], .024, .079, LEATHER, new THREE.Euler(Math.PI / 2, 0, 0));
    parts.rod([x, y + .045, z + .205], [x, y + .064, z + .205], .003, '#c9b772');
  }
}

/** Build a roughly 1.2-unit-high, forward (+Z) facing articulated character. */
export function buildOrganicCharacter({ faction = 'pirate', color, leader = false, variant = 0, marine = false } = {}) {
  faction = normalizeFaction(faction, marine);
  variant = Math.abs(Math.trunc(Number(variant) || 0));
  const type = variant % 4;
  const luffy = faction === 'pirate' && leader;
  const officer = faction === 'marine' && (leader || variant % 5 === 0);
  const role = luffy ? 'straw-hat-captain' : faction === 'marine' ? (officer ? 'officer' : 'rifleman')
    : faction === 'revolutionary' ? 'revolutionary' : faction === 'bounty' ? (type % 2 ? 'marksman' : 'hunter')
      : ['swordsman', 'shooter', 'cook', 'sailor'][type];
  const colors = { pirate: '#b84948', marine: '#366eaa', revolutionary: '#496d53', bounty: '#78604d' };
  const accent = color || colors[faction];
  const skin = ['#e5ae83', '#bd835f', '#f0bf94', '#d39a70'][variant % 4];
  const hairColor = luffy ? '#24212b' : faction === 'pirate' && type === 0 ? '#41815b' : type === 2 ? '#d4a553' : '#302b35';
  const shirt = faction === 'marine' ? WHITE : faction === 'revolutionary' ? '#31483d' : faction === 'bounty' ? '#423c3d' : type === 2 ? '#f3e6d2' : accent;
  const trouser = luffy ? '#4176b7' : faction === 'marine' ? '#31517c' : faction === 'revolutionary' ? '#343c3d' : faction === 'bounty' ? '#423434' : type === 0 ? '#343d48' : '#5c5266';
  const root = new THREE.Group();
  root.name = luffy ? 'Monkey D. Luffy · organic toon captain' : `${faction} · ${role} · organic toon`;
  const pose = joint(root, 'Animated pose', [0, 0, 0]);
  const spine = joint(pose, 'Spine', [0, .48, 0]);
  const head = joint(spine, 'Head and expression', [0, .39, 0]);
  const texture = gradientMap();
  const material = new THREE.MeshToonMaterial({ color: '#ffffff', vertexColors: true, gradientMap: texture });
  material.name = 'Saturated cloth, skin and metal · four toon bands';
  material.emissive.setHex(0x000000);
  material.emissiveIntensity = 0;
  const ink = new THREE.MeshBasicMaterial({ color: '#15202e', side: THREE.BackSide, depthWrite: true });
  ink.name = 'Fine inverted hull ink';
  const torsoParts = new Parts([0, .48, 0]);
  torsoParts.capsule([0, .617, 0], .116, .148, luffy ? skin : shirt, emptyRotation, [1.03, 1, .76]);
  torsoParts.rod([0, .772, 0], [0, .824, 0], .043, skin, .038);
  torsoParts.ellipsoid([0, .444, 0], [.115, .075, .084], trouser);
  torsoParts.ellipsoid([0, .468, .002], [.119, .022, .087], luffy ? '#e3af54' : LEATHER);
  torsoParts.ellipsoid([.007, .467, .087], [.023, .018, .009], '#c5ab6e');
  if (luffy) {
    for (const side of [-1, 1]) {
      torsoParts.ellipsoid([side * .084, .645, .063], [.055, .124, .04], '#c5353d', new THREE.Euler(0, 0, side * -.1));
      torsoParts.curve([[side * .082, .752, .085], [side * .05, .64, .094], [side * .062, .529, .081]], .006, '#e55343', 9);
    }
    // A small abdominal scar is baked into the torso, never another draw call.
    torsoParts.curve([[-.033, .603, .093], [.034, .545, .095]], .003, '#b67158', 5);
    torsoParts.curve([[.031, .604, .093], [-.033, .545, .095]], .003, '#b67158', 5);
  } else {
    if (faction === 'pirate' && type === 0) torsoParts.ellipsoid([0, .52, .008], [.123, .055, .092], '#67876c');
    if (faction === 'pirate' && type === 2) {
      for (const x of [-.035, .035]) for (const y of [.58, .65, .72]) torsoParts.ellipsoid([x, y, .096], [.007, .007, .005], '#463c38');
      torsoParts.curve([[-.05, .77, .085], [0, .686, .101], [.052, .77, .085]], .008, '#413b39', 6);
    }
    if (faction === 'marine') {
      torsoParts.curve([[-.09, .75, .057], [0, .654, .1], [.09, .75, .057]], .018, '#315f99', 10);
      torsoParts.ellipsoid([0, .642, .112], [.017, .039, .009], '#326aa3');
    }
    if (faction === 'revolutionary') {
      torsoParts.ellipsoid([0, .768, .006], [.12, .04, .102], '#943c42');
      torsoParts.capsule([-.055, .667, .107], .024, .13, '#923d45', new THREE.Euler(0, 0, -.2), [1, 1, .38]);
    }
    if (faction === 'bounty' || faction === 'pirate' && type === 1) {
      torsoParts.curve([[-.105, .766, .035], [0, .63, .112], [.106, .51, .047]], .018, '#9c7754', 12);
      for (let i = 0; i < 5; i++) torsoParts.rod([-.041 + i * .022, .696 - i * .028, .112], [-.029 + i * .022, .708 - i * .028, .119], .006, '#c9b26c');
    }
  }
  if (faction === 'pirate' && !luffy && type === 0) {
    for (let i = 0; i < 3; i++) {
      torsoParts.rod([-.12, .432 + i * .02, -.015], [-.35, .53 + i * .02, -.065], .015, i === 0 ? '#e4dcca' : '#3a3a45');
      torsoParts.rod([-.35, .53 + i * .02, -.065], [-.417, .559 + i * .02, -.08], .014, '#72554d');
    }
  }
  const torso = makeMesh(torsoParts, material, 'Rounded torso and tailored clothing', spine);
  silhouette(torso, ink, .0035);

  let coat;
  if (officer || faction === 'revolutionary' || faction === 'bounty') {
    coat = joint(spine, 'Flowing shoulder coat', [0, 0, 0]);
    const coatParts = new Parts([0, .48, 0]);
    longCoat(coatParts, officer ? '#eeeadd' : faction === 'revolutionary' ? '#2b423a' : '#4e3934', officer ? '#a9a58e' : faction === 'revolutionary' ? '#798766' : '#9f7a54', officer);
    makeMesh(coatParts, material, officer ? 'Justice coat and gold epaulettes' : 'Curved cloth coat', coat);
  }

  const headParts = new Parts([0, .87, 0]);
  face(headParts, skin, variant, luffy);
  hair(headParts, hairColor, type);
  if (luffy) strawHat(headParts);
  else if (faction === 'marine') marineCap(headParts, officer);
  else if (faction === 'revolutionary') hood(headParts, '#2b423a');
  else if (faction === 'bounty') leatherHat(headParts);
  else if (type === 2) {
    headParts.lathe([[0, 0], [.11, 0], [.116, .04], [.13, .076], [.106, .125], [0, .14]], [0, 1.075, -.006], '#f3ebd9');
    headParts.lathe([[.114, 0], [.115, 0], [.114, .025], [.112, .025]], [0, 1.072, -.006], '#d7d0c1');
  } else if (type === 1) {
    headParts.lathe([[.132, 0], [.136, .012], [.127, .05], [.118, .057]], [0, 1.015, -.008], accent);
    headParts.capsule([.134, 1.05, -.075], .014, .09, accent, new THREE.Euler(.3, 0, -.4));
  }
  const faceMesh = makeMesh(headParts, material, 'Expressive eyes, hair and headwear', head);
  silhouette(faceMesh, ink, .0028);

  const limbs = {};
  const elbows = {};
  const knees = {};
  for (const side of [-1, 1]) {
    const key = side < 0 ? 'left' : 'right';
    const armX = side * .175;
    const arm = joint(spine, `${key} shoulder`, [armX, .252, 0]);
    const elbow = joint(arm, `${key} elbow`, [0, -.16, 0]);
    const upper = new Parts([armX, .732, 0]);
    const sleeve = faction === 'marine' || faction === 'revolutionary' || faction === 'bounty' || !luffy;
    upper.capsule([armX, .662, 0], .041, .095, sleeve ? shirt : skin, emptyRotation, [1, 1, .91]);
    if (sleeve && faction !== 'revolutionary' && faction !== 'bounty') upper.ellipsoid([armX, .637, 0], [.043, .035, .039], skin);
    if (faction === 'marine') upper.ellipsoid([armX + side * .027, .689, .02], [.016, .027, .015], '#3469a5');
    makeMesh(upper, material, `${key} rounded upper arm`, arm);
    const lower = new Parts([armX, .572, 0]);
    lower.capsule([armX, .515, .005], .034, .084, faction === 'revolutionary' || faction === 'bounty' ? shirt : skin, emptyRotation, [1, 1, .92]);
    lower.ellipsoid([armX, .443, .012], [.036, .043, .032], skin);
    // Thumb and rounded knuckles make the hands readable without individual joints.
    lower.ellipsoid([armX - side * .027, .451, .027], [.015, .022, .018], skin);
    if (faction === 'bounty' || faction === 'revolutionary') lower.ellipsoid([armX, .471, .003], [.039, .018, .038], LEATHER);
    makeMesh(lower, material, `${key} forearm and hand`, elbow);
    limbs[`${key}Arm`] = arm;
    elbows[key] = elbow;

    const legX = side * .073;
    const hip = joint(pose, `${key} hip`, [legX, .411, 0]);
    const knee = joint(hip, `${key} knee`, [0, -.176, 0]);
    const thigh = new Parts([legX, .411, 0]);
    thigh.capsule([legX, .337, -.002], .053, .1, trouser, emptyRotation, [1, 1, .94]);
    if (luffy) thigh.ellipsoid([legX, .278, .002], [.056, .025, .054], '#d6ddd4');
    makeMesh(thigh, material, `${key} tailored thigh`, hip);
    const calf = new Parts([legX, .235, 0]);
    calf.capsule([legX, .16, 0], .039, .105, luffy ? skin : trouser, emptyRotation, [.93, 1, .96]);
    if (luffy) {
      calf.ellipsoid([legX, .043, .028], [.052, .024, .079], '#73533f');
      calf.ellipsoid([legX, .06, .035], [.042, .02, .068], skin);
      calf.rod([legX - .033, .067, .005], [legX + .033, .067, .074], .009, '#594434');
      calf.rod([legX + .033, .067, .005], [legX - .033, .067, .074], .009, '#594434');
    } else {
      calf.ellipsoid([legX, .055, .03], [.05, .044, .079], faction === 'marine' ? '#303f53' : '#372f32');
      calf.capsule([legX, .118, 0], .043, .075, faction === 'marine' ? '#344255' : '#453637');
      calf.ellipsoid([legX, .024, .031], [.051, .013, .078], '#27292e');
    }
    makeMesh(calf, material, `${key} calf and organic footwear`, knee);
    limbs[`${key}Leg`] = hip;
    knees[key] = knee;
  }

  let weapon;
  const ranged = faction === 'marine' || faction === 'bounty' && type % 2 === 1 || faction === 'pirate' && type === 1 || faction === 'revolutionary' && type % 2 === 1;
  if (!luffy && !(faction === 'pirate' && type === 2)) {
    weapon = joint(elbows.right, 'Held weapon', [0, 0, 0]);
    const weaponParts = new Parts([.175, .572, 0]);
    if (ranged) firearm(weaponParts, [.175, .443, .04], faction === 'marine' || faction === 'revolutionary', accent);
    else sword(weaponParts, [.175, .443, .037], accent, type);
    makeMesh(weaponParts, material, ranged ? 'Rounded rifle or flintlock' : 'Curved saber and grip', weapon);
  }

  root.userData = {
    ...root.userData,
    organicCharacter: true,
    faction,
    role,
    leader: !!leader,
    luffy,
    index: variant,
    variant,
    characterIdentity: luffy ? 'Monkey D. Luffy' : role,
    wardrobe: luffy ? ['straw-hat', 'red-hat-band', 'open-red-vest', 'blue-shorts', 'sandals', 'left-eye-scar']
      : officer ? ['marine-cap', 'white-justice-coat', 'gold-epaulettes', 'rifle']
        : faction === 'revolutionary' ? ['green-hood', 'dark-long-coat', 'red-scarf']
          : faction === 'bounty' ? ['leather-hat', 'dark-coat', ranged ? 'pistol' : 'saber'] : [role],
    limbs,
    elbows,
    knees,
    weapon,
    torso,
    pose,
    spine,
    head,
    coat,
    ranged,
    _organicOwnedResources: { material, ink, texture },
  };
  animateOrganicCharacter(root, { time: variant * .37, state: 'idle' });
  return root;
}

const clamp01 = n => THREE.MathUtils.clamp(n, 0, 1);
const smooth = x => x * x * (3 - 2 * x);

/**
 * Animate without touching root position, rotation or scale. phase is a normalized
 * attack/death progress; time is elapsed seconds. Every call resets the full pose,
 * so changing state, skipping a shot or replaying a cinematic leaves no stretched limbs.
 */
export function animateOrganicCharacter(root, { time = 0, state = 'idle', phase = 0, intensity = 1 } = {}) {
  const d = root?.userData;
  if (!d?.organicCharacter || d._organicDisposed) return;
  time = Number.isFinite(time) ? time : 0;
  phase = Number.isFinite(phase) ? clamp01(phase) : 0;
  intensity = Number.isFinite(intensity) ? THREE.MathUtils.clamp(intensity, 0, 2) : 1;
  const { pose, spine, head, limbs: l, elbows: e, knees: k, coat } = d;
  pose.position.set(0, 0, 0);
  pose.rotation.set(0, 0, 0);
  pose.scale.set(1, 1, 1);
  spine.rotation.set(0, 0, 0);
  head.rotation.set(0, 0, 0);
  for (const node of [...Object.values(l), ...Object.values(e), ...Object.values(k)]) {
    node.rotation.set(0, 0, 0);
    node.scale.set(1, 1, 1);
  }
  if (d.weapon) d.weapon.rotation.set(0, 0, 0);
  const t = time + d.variant * .71;
  const breath = Math.sin(t * 2.35);
  pose.position.y = breath * .0035;
  spine.rotation.z = Math.sin(t * 1.17) * .014;
  l.leftArm.rotation.z = .085;
  l.rightArm.rotation.z = -.085;
  e.left.rotation.x = -.12;
  e.right.rotation.x = -.12;
  head.rotation.y = Math.sin(t * .63) * .08;
  if (coat) coat.rotation.set(Math.sin(t * 2.2) * .026, Math.sin(t * 1.4) * .025, 0);

  if (state === 'run' || state === 'walk') {
    const speed = state === 'walk' ? 5 : 10.5;
    const gait = Math.sin(t * speed);
    const opposite = Math.sin(t * speed + Math.PI);
    const amplitude = (state === 'walk' ? .35 : .72) * intensity;
    l.leftLeg.rotation.x = gait * amplitude;
    l.rightLeg.rotation.x = opposite * amplitude;
    k.left.rotation.x = Math.max(0, -gait) * .9 * intensity;
    k.right.rotation.x = Math.max(0, -opposite) * .9 * intensity;
    l.leftArm.rotation.x = -gait * amplitude * .77;
    l.rightArm.rotation.x = gait * amplitude * .77;
    e.left.rotation.x = -.48;
    e.right.rotation.x = -.48;
    pose.position.y = Math.abs(Math.cos(t * speed)) * .022 * intensity;
    spine.rotation.x = .12 * intensity;
    spine.rotation.y = gait * .065;
    head.rotation.x = -.07;
    if (coat) coat.rotation.x = -.17 - Math.abs(gait) * .08;
  } else if (state === 'guard') {
    l.leftArm.rotation.set(-.76, -.19, .25);
    l.rightArm.rotation.set(-.66, .18, -.28);
    e.left.rotation.x = -1.04;
    e.right.rotation.x = -.97;
    l.leftLeg.rotation.x = -.14;
    l.rightLeg.rotation.x = .14;
    k.left.rotation.x = .16;
    k.right.rotation.x = .14;
    pose.position.y -= .02;
    spine.rotation.y = -.16;
    head.rotation.y = .13;
  } else if (state === 'melee') {
    const wind = smooth(clamp01(phase / .27));
    const strike = smooth(clamp01((phase - .27) / .25));
    const recover = smooth(clamp01((phase - .62) / .38));
    const power = Math.sin(strike * Math.PI) * (1 - recover) * intensity;
    const extension = strike * (1 - recover);
    spine.rotation.y = (-.48 * wind + 1.02 * strike) * (1 - recover);
    spine.rotation.x = .12 * extension;
    l.leftLeg.rotation.x = -.25 * extension;
    l.rightLeg.rotation.x = .24 * extension;
    k.right.rotation.x = .3 * extension;
    l.leftArm.rotation.set(-.7 * (1 - recover), -.25, .24);
    e.left.rotation.x = -.95 * (1 - recover);
    l.rightArm.rotation.set((.58 * wind - 2.1 * strike) * (1 - recover), .25 * (1 - recover), -.16);
    e.right.rotation.x = (-1.12 * wind + 1.07 * strike) * (1 - recover);
    if (d.luffy) {
      // The stretch is inside the articulated arm; the world root never jumps.
      l.rightArm.scale.y = 1 + power * .52;
      e.right.scale.y = 1 + power * .8;
      e.right.rotation.x *= .18;
      head.rotation.z = -.07 * power;
    } else if (d.role === 'cook') {
      l.rightLeg.rotation.x = -1.7 * extension;
      k.right.rotation.x = .13 * extension;
      spine.rotation.x = -.25 * extension;
      l.rightArm.rotation.x = .55 * extension;
    }
    if (coat) coat.rotation.x = -.12 * power;
  } else if (state === 'ranged') {
    const recoil = Math.exp(-Math.max(0, phase - .32) * 15) * (phase >= .32 ? 1 : 0);
    l.rightArm.rotation.set(-1.28 + recoil * .12, -.05, -.08);
    e.right.rotation.x = -.14;
    l.leftArm.rotation.set(-1.18, -.45, .18);
    e.left.rotation.x = -.58;
    spine.rotation.y = -.11;
    spine.rotation.x = -.07 * recoil;
    head.rotation.set(.055, -.07, .035);
    l.leftLeg.rotation.x = -.12;
    l.rightLeg.rotation.x = .14;
    if (d.weapon) d.weapon.rotation.x = Math.PI / 2;
  } else if (state === 'hit') {
    const impact = Math.sin(phase * Math.PI) * intensity;
    spine.rotation.x = -.38 * impact;
    spine.rotation.z = .18 * impact;
    head.rotation.x = -.22 * impact;
    l.leftArm.rotation.x = -.37 * impact;
    l.rightArm.rotation.x = -.58 * impact;
    k.left.rotation.x = .3 * impact;
    k.right.rotation.x = .19 * impact;
    pose.position.y -= .04 * impact;
  } else if (state === 'ko') {
    const fall = smooth(phase);
    pose.rotation.z = .5 * Math.PI * fall;
    // The fallen silhouette rests above the ground instead of sinking through it.
    pose.position.y = .2 * fall;
    spine.rotation.x = -.23 * fall;
    head.rotation.z = -.15 * fall;
    l.leftArm.rotation.z = .28 + .35 * fall;
    l.rightArm.rotation.z = -.32 - .24 * fall;
    l.leftLeg.rotation.z = .12 * fall;
    l.rightLeg.rotation.x = -.23 * fall;
    k.left.rotation.x = .31 * fall;
    k.right.rotation.x = .47 * fall;
  }
  d.animationState = state;
}

/** Idempotent disposal; remove the root from its parent separately if desired. */
export function disposeOrganicCharacter(root) {
  if (!root?.userData?.organicCharacter || root.userData._organicDisposed) return;
  const geometries = new Set();
  root.traverse(node => {
    if (node.isMesh && node.geometry) geometries.add(node.geometry);
  });
  for (const geometry of geometries) geometry.dispose();
  const resources = root.userData._organicOwnedResources;
  resources?.material.dispose();
  resources?.ink.dispose();
  resources?.texture.dispose();
  root.userData._organicDisposed = true;
}
