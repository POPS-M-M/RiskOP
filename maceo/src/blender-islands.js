import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Immutable, verified source bytes are shared. Every loaded diorama owns its
// Three geometries/materials so closing one scene cannot invalidate another.
const indexes = new Map();
const manifests = new Map();
const sourceFiles = new Map();
const aliases = { Arabasta: 'Alabasta' };
const decoder = new TextDecoder();
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

function abortError() {
  const e = new Error('Chargement Blender annulé.');
  e.name = 'AbortError';
  return e;
}
function checkAbort(signal) { if (signal?.aborted) throw abortError(); }
function abortable(promise, signal) {
  if (!signal) return promise;
  checkAbort(signal);
  return new Promise((resolve, reject) => {
    const abort = () => { signal.removeEventListener('abort', abort); reject(abortError()); };
    signal.addEventListener('abort', abort, { once: true });
    promise.then(value => { signal.removeEventListener('abort', abort); resolve(value); }, error => { signal.removeEventListener('abort', abort); reject(error); });
  });
}
function baseUrl() {
  const configured = globalThis.GL_BLENDER_ASSET_BASE;
  const documentUrl = globalThis.document?.baseURI || globalThis.location?.href;
  if (!configured && !documentUrl) throw new Error('URL du paquet Blender manquante.');
  const url = new URL(configured || 'iles/', documentUrl);
  if (!url.pathname.endsWith('/')) url.pathname += '/';
  return url;
}
function fileUrl(base, path) {
  if (typeof path !== 'string' || !path || path.replace(/\/$/, '').split('/').some(p => !p || p === '.' || p === '..') || /[\\?#]/.test(path) || path.startsWith('/')) {
    throw new Error('Chemin de fichier Blender invalide.');
  }
  const url = new URL(path, base);
  if (!url.href.startsWith(base.href)) throw new Error('Fichier extérieur au paquet Blender.');
  return url;
}
function remember(cache, key, fn) {
  if (!cache.has(key)) {
    const promise = Promise.resolve().then(fn).catch(error => { cache.delete(key); throw error; });
    cache.set(key, promise);
  }
  return cache.get(key);
}
async function download(url, missingAllowed = false) {
  const response = await fetch(url, { cache: 'no-cache' });
  if (missingAllowed && response.status === 404) return null;
  if (!response.ok) throw new Error('Fichier Blender indisponible (' + response.status + ') : ' + new URL(url).pathname);
  return response.arrayBuffer();
}
async function verify(buffer, reference, label) {
  if (!reference || !Number.isSafeInteger(reference.octets) || reference.octets < 0 || !/^[a-f0-9]{64}$/i.test(reference.sha256 || '')) {
    throw new Error('Empreinte Blender non déclarée : ' + label);
  }
  if (buffer.byteLength !== reference.octets) throw new Error('Taille Blender incorrecte : ' + label);
  if (!globalThis.crypto?.subtle) throw new Error('Vérification SHA-256 indisponible pour les îles Blender.');
  const digest = await globalThis.crypto.subtle.digest('SHA-256', buffer);
  const hash = Array.from(new Uint8Array(digest), v => v.toString(16).padStart(2, '0')).join('');
  if (hash.toLowerCase() !== reference.sha256.toLowerCase()) throw new Error('Empreinte Blender incorrecte : ' + label);
  return buffer;
}
function parseJson(buffer, label) {
  try { return JSON.parse(decoder.decode(buffer)); }
  catch (_) { throw new Error('JSON Blender invalide : ' + label); }
}
async function getRegistry(base) {
  return remember(indexes, base.href, async () => {
    const buffer = await download(fileUrl(base, 'index.json').href, true);
    if (buffer === null) return { format: 2, iles: {} };
    const index = parseJson(buffer, 'index.json');
    if (index?.format !== 2 || !index.iles || typeof index.iles !== 'object' || Array.isArray(index.iles)) throw new Error('Format du paquet Blender non reconnu.');
    return index;
  });
}

/** Public registry view; callers may preload it before requesting visible models. */
export async function loadBlenderRegistry({ signal } = {}) {
  const base = baseUrl();
  const registry = await abortable(getRegistry(base), signal);
  return { format: registry.format, names: Object.keys(registry.iles), baseUrl: base.href };
}
export async function hasBlenderIsland(name, { signal } = {}) {
  const index = await abortable(getRegistry(baseUrl()), signal);
  return !!index.iles[aliases[name] || name];
}
async function manifestFor(base, name, entry) {
  const folder = fileUrl(base, entry.dossier + '/');
  const url = fileUrl(folder, entry.manifeste);
  return remember(manifests, url.href + ':' + entry.sha256, async () => {
    const bytes = await verify(await download(url.href), entry, entry.manifeste);
    const manifest = parseJson(bytes, entry.manifeste);
    if (manifest.format !== 2 || manifest.ile !== name || String(manifest.version) !== String(entry.version) || !manifest.fichiers || !manifest.glb || !manifest.hauteurs) {
      throw new Error('Manifeste Blender incohérent : ' + name);
    }
    for (const group of ['images25d', 'ville25d', 'glb']) for (const ref of Object.values(manifest[group] || {})) {
      if (!ref || !manifest.fichiers[ref.fichier]) throw new Error('Fichier Blender non déclaré dans le manifeste.');
    }
    if (manifest.hauteurs.fichier && !manifest.fichiers[manifest.hauteurs.fichier]) throw new Error('Carte de hauteur Blender non déclarée.');
    return { manifest, folder };
  });
}
function decodeBase64(text) {
  const binary = atob(text.trim()), bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}
async function getFile(folder, manifest, name) {
  const reference = manifest.fichiers[name];
  if (!reference) throw new Error('Fichier Blender non déclaré : ' + name);
  const url = fileUrl(folder, name);
  return remember(sourceFiles, url.href + ':' + reference.sha256, async () => {
    const raw = await download(url.href);
    if (Number.isSafeInteger(reference.octets_publies) && raw.byteLength !== reference.octets_publies) throw new Error('Taille publiée Blender incorrecte : ' + name);
    const bytes = reference.encodage === 'base64' ? decodeBase64(decoder.decode(raw)) : raw;
    return verify(bytes, reference, name);
  });
}
function validateGlb(bytes) {
  const view = new DataView(bytes);
  if (bytes.byteLength < 20 || view.getUint32(0, true) !== 0x46546c67 || view.getUint32(4, true) !== 2 || view.getUint32(8, true) !== bytes.byteLength || view.getUint32(16, true) !== 0x4e4f534a) throw new Error('Modèle GLB Blender invalide.');
  const length = view.getUint32(12, true);
  if (20 + length > bytes.byteLength) throw new Error('En-tête GLB Blender tronqué.');
  const json = parseJson(bytes.slice(20, 20 + length), 'glTF');
  // The validated production pipeline embeds all data in the GLB. Refuse an
  // external URL that GLTFLoader would otherwise fetch without a manifest hash.
  for (const resource of [...(json.buffers || []), ...(json.images || [])]) {
    if (resource.uri && !resource.uri.startsWith('data:')) throw new Error('Ressource glTF externe non vérifiée.');
  }
  return json;
}
function heightFunction(n, extent, values, unitScale) {
  const cell = extent * 2 / n;
  const decoded = i => Math.fround(values[i] / 65535 * 96 - 4);
  return (x, z) => {
    if (!Number.isFinite(x) || !Number.isFinite(z)) return -.9 * unitScale;
    const fx = (x / unitScale + extent) / cell - .5, fy = (z / unitScale + extent) / cell - .5;
    if (fx < 0 || fy < 0 || fx > n - 1 || fy > n - 1) return -.9 * unitScale;
    const i = Math.floor(fx), j = Math.floor(fy), a = fx - i, b = fy - j, i1 = Math.min(n - 1, i + 1), j1 = Math.min(n - 1, j + 1);
    return (decoded(j * n + i) * (1 - a) * (1 - b) + decoded(j * n + i1) * a * (1 - b) + decoded(j1 * n + i) * (1 - a) * b + decoded(j1 * n + i1) * a * b) * unitScale;
  };
}
function decodeHeights(manifest, bytes, unitScale) {
  const h = manifest.hauteurs, n = Number(h.n), extent = Number(h.ext), count = n * n;
  if (!Number.isSafeInteger(n) || n < 2 || n > 4096 || !Number.isFinite(extent) || extent <= 0) throw new Error('Dimensions des hauteurs Blender invalides.');
  const read = (key, inline) => {
    if (inline) {
      const b = decodeBase64(h[key]);
      if (b.byteLength !== count * 2) throw new Error('Carte de hauteur Blender tronquée.');
      const view = new DataView(b), values = new Uint16Array(count);
      for (let i = 0; i < count; i++) values[i] = view.getUint16(i * 2, true);
      return values;
    }
    const span = h[key];
    if (!Array.isArray(span) || !Number.isSafeInteger(span[0]) || span[0] < 0 || span[1] !== count * 2 || span[0] + span[1] > bytes.byteLength) throw new Error('Plage de hauteur Blender invalide.');
    const view = new DataView(bytes, span[0], span[1]), values = new Uint16Array(count);
    for (let i = 0; i < count; i++) values[i] = view.getUint16(i * 2, true);
    return values;
  };
  const inline = !h.fichier;
  return { groundHeight: heightFunction(n, extent, read('sol', inline), unitScale), obstacleHeight: heightFunction(n, extent, read('obstacles', inline), unitScale) };
}
function release(root) {
  const geometries = new Set(), materials = new Set(), textures = new Set();
  root.traverse(node => {
    if (node.geometry) geometries.add(node.geometry);
    for (const material of node.material ? (Array.isArray(node.material) ? node.material : [node.material]) : []) {
      materials.add(material);
      for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
    }
  });
  textures.forEach(t => t.dispose()); geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose());
}
function modelStats(group, unitScale) {
  const bounds = new THREE.Box3(), point = new THREE.Vector3(), geometries = new Set(), arrays = new Set();
  let radius = 0, navigationRadius = 0, triangles = 0, gpuBytes = 0, meshes = 0;
  group.updateMatrixWorld(true);
  group.traverse(node => {
    if (!node.isMesh || !node.geometry?.attributes.position) return;
    meshes++;
    const geometry = node.geometry, positions = geometry.attributes.position;
    triangles += (geometry.index?.count || positions.count) / 3;
    if (!geometries.has(geometry)) {
      geometries.add(geometry);
      for (const attribute of [...Object.values(geometry.attributes), ...(geometry.index ? [geometry.index] : [])]) {
        const array = attribute.isInterleavedBufferAttribute ? attribute.data.array : attribute.array;
        if (!arrays.has(array)) { arrays.add(array); gpuBytes += array.byteLength; }
      }
    }
    for (let i = 0; i < positions.count; i++) {
      point.fromBufferAttribute(positions, i).applyMatrix4(node.matrixWorld);
      bounds.expandByPoint(point);
      const r = Math.hypot(point.x, point.z); radius = Math.max(radius, r);
      if (point.y <= 24 * unitScale && point.y >= -3 * unitScale) navigationRadius = Math.max(navigationRadius, r);
    }
  });
  return { bounds, radius, navigationRadius: Math.max(navigationRadius, radius * .9), triangles, gpuBytes, meshes };
}

/**
 * Load an unmodified production island in Three's Y-up / Z-south coordinates.
 * Heights, bounds, radius and port are local Three units (unitScale per game unit).
 * The caller may translate the group to its ocean level; add that offset to the
 * returned height functions when placing actors in the parent scene.
 */
export async function loadBlenderDiorama(t, { unitScale = 1 / 30, lod = 'lod0', signal } = {}) {
  checkAbort(signal);
  if (!Number.isFinite(unitScale) || unitScale <= 0) throw new Error('Échelle Blender invalide.');
  if (!['lod0', 'lod1', 'lod2'].includes(lod)) throw new Error('Niveau de détail Blender invalide.');
  const base = baseUrl(), registry = await abortable(getRegistry(base), signal), name = aliases[t?.name] || t?.name;
  const entry = registry.iles[name];
  if (!entry) return null;
  const { manifest, folder } = await abortable(manifestFor(base, name, entry), signal);
  const ref = manifest.glb[lod];
  if (!ref || !manifest.fichiers[ref.fichier]) throw new Error('Niveau Blender absent : ' + name + ' / ' + lod);
  const [glbBytes, heightsBytes] = await abortable(Promise.all([
    getFile(folder, manifest, ref.fichier),
    manifest.hauteurs.fichier ? getFile(folder, manifest, manifest.hauteurs.fichier) : Promise.resolve(null),
  ]), signal);
  checkAbort(signal);
  validateGlb(glbBytes);
  const heights = decodeHeights(manifest, heightsBytes, unitScale);
  // Each parse allocates owned resources. Cached input bytes remain immutable.
  const gltf = await new GLTFLoader().parseAsync(glbBytes.slice(0), folder.href);
  const group = gltf.scene;
  if (signal?.aborted) { release(group); throw abortError(); }
  group.name = 'Île Blender — ' + name;
  group.scale.setScalar(unitScale);
  const replacements = new Map(), previousMaterials = new Set();
  group.traverse(node => {
    if (!node.isMesh) return;
    const adapt = material => {
      previousMaterials.add(material);
      if (!replacements.has(material)) {
        const next = material.clone();
        next.roughness = .92; next.metalness = 0; next.emissiveIntensity = 0;
        if (next.emissive) next.emissive.set(0);
        next.envMapIntensity = .42; next.toneMapped = true;
        replacements.set(material, next);
      }
      return replacements.get(material);
    };
    node.material = Array.isArray(node.material) ? node.material.map(adapt) : adapt(node.material);
    node.castShadow = true; node.receiveShadow = true;
  });
  previousMaterials.forEach(material => material.dispose());
  const measured = modelStats(group, unitScale);
  if (!Number.isFinite(measured.radius) || measured.radius <= 0 || !Number.isFinite(measured.triangles) || Math.abs(measured.triangles - Number(ref.triangles)) > .01 || lod === 'lod0' && measured.triangles > 90000) {
    release(group); throw new Error('Géométrie Blender incohérente ou hors budget : ' + name);
  }
  const cityNodes = [];
  group.traverse(node => { const match = /^VILLE_(\d)(?:\b|_)/.exec(node.name); if (match) cityNodes.push({ node, level: Number(match[1]) }); });
  let cityLevel = 1, disposed = false;
  const setCityLevel = level => {
    if (disposed) return;
    cityLevel = clamp(Math.floor(Number(level) || 1), 1, 4);
    for (const part of cityNodes) part.node.visible = part.level <= cityLevel;
    group.userData.cityLevel = cityLevel;
  };
  const dispose = () => { if (disposed) return; disposed = true; release(group); };
  const rawPort = manifest.ponton || [0, Number(t?.rad) || 30, 0];
  const port = new THREE.Vector3(rawPort[0] * unitScale, rawPort[2] * unitScale, rawPort[1] * unitScale);
  const stats = { name, lod, version: String(manifest.version), triangles: measured.triangles, gpuBytes: measured.gpuBytes, meshes: measured.meshes, glbBytes: glbBytes.byteLength, heightBytes: heightsBytes?.byteLength || 0, verifiedFiles: manifest.hauteurs.fichier ? 3 : 2 };
  const result = { group, ...heights, radius: measured.radius, navigationRadius: measured.navigationRadius, port, bounds: measured.bounds.clone(), waterLevel: 0, setCityLevel, dispose, stats };
  Object.assign(group.userData, { blenderIsland: true, island: name, sourceVersion: stats.version, lod, groundHeight: heights.groundHeight, heightAt: heights.groundHeight, obstacleHeight: heights.obstacleHeight, radius: measured.radius, navigationRadius: measured.navigationRadius, port: port.clone(), bounds: measured.bounds.clone(), waterLevel: 0, setCityLevel, dispose, blenderStats: stats });
  setCityLevel(t?.city?.lvl || 1);
  return result;
}
