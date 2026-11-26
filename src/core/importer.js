// Import de modèles 3D réels au format glTF binaire (.glb) ou glTF (.gltf autonome).
// Le modèle est converti en arborescence « ensembles → pièces » compatible avec l'explorateur :
// chaque maillage devient une pièce sélectionnable, cotée par son encombrement mesuré (mm).
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

const DEG = Math.PI / 180;
let loader;
function getLoader() {
  if (loader) return loader;
  loader = new GLTFLoader();
  // Décodeur Draco fourni avec three.js (servi localement), chargé seulement pour les fichiers compressés
  loader.setDRACOLoader(new DRACOLoader());
  loader.setMeshoptDecoder(MeshoptDecoder);
  return loader;
}

/** Lit un fichier (File) et renvoie la scène glTF */
export async function readModelFile(file) {
  const buf = await file.arrayBuffer();
  const gltf = await getLoader().parseAsync(buf, '');
  const scene = gltf.scene || gltf.scenes?.[0];
  if (!scene) throw new Error('Aucune scène dans le fichier.');
  let meshes = 0, tris = 0;
  scene.traverse((o) => {
    if (!o.isMesh) return;
    meshes++;
    const g = o.geometry;
    tris += (g.index ? g.index.count : g.attributes.position.count) / 3;
  });
  if (!meshes) throw new Error('Le fichier ne contient aucun maillage.');
  return { scene, meshes, tris: Math.round(tris), animations: gltf.animations?.length || 0 };
}

// Couche d'épluchage devinée d'après le nom (français / anglais)
const LAYER_RULES = [
  ['sol', /(wheel|tire|tyre|rim|brake|disc|caliper|hub|axle|suspension|shock|spring|roue|pneu|jante|frein|disque|etrier|moyeu|essieu|amortisseur|ressort|bogie|landing|train)/],
  ['meca', /(engine|motor|gear|exhaust|radiator|battery|pipe|turbo|piston|crank|moteur|boite|echappement|radiateur|batterie|durite|transmission|propeller|helice)/],
  ['int', /(seat|interior|dash|steering|carpet|pedal|cockpit|siege|interieur|tableau|volant|moquette|pedale|habitacle|planche)/],
  ['struct', /(frame|chassis|subframe|structure|longeron|cadre|berceau|spar|rib|keel|quille)/],
  ['ext', /(body|door|hood|bonnet|bumper|fender|wing|roof|glass|window|light|lamp|mirror|panel|trunk|boot|grille|carrosserie|porte|capot|pare|aile|toit|vitre|feu|phare|retro|coffre|calandre|hull|coque|fuselage)/],
];
const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
function guessLayer(name, inherited) {
  const n = norm(name || '');
  for (const [layer, re] of LAYER_RULES) if (re.test(n)) return layer;
  return inherited || 'ext';
}

function convertMaterial(src) {
  let mat;
  if (src && (src.isMeshStandardMaterial || src.isMeshPhysicalMaterial)) mat = src.clone();
  else {
    mat = new THREE.MeshStandardMaterial({
      color: src?.color ? src.color.clone() : new THREE.Color(0xb0b4ba), map: src?.map || null,
      transparent: !!src?.transparent, opacity: src?.opacity ?? 1, metalness: 0.2, roughness: 0.6,
    });
  }
  mat.side = THREE.DoubleSide;
  mat.userData.base = {
    color: mat.color.getHex(), emissive: mat.emissive.getHex(), emissiveIntensity: mat.emissiveIntensity,
    opacity: mat.opacity, transparent: mat.transparent, depthWrite: mat.depthWrite,
  };
  mat.userData.label = src?.name ? `Matériau d'origine « ${src.name} »` : 'Matériau d\'origine (non nommé)';
  return mat;
}

const hasMesh = (o) => { let r = false; o.traverse((c) => { if (c.isMesh) r = true; }); return r; };

/**
 * Convertit une scène glTF en assemblage { object, node }.
 * opts.unit : facteur vers le millimètre (glTF = mètres → 1000) ; opts.rotY : rotation autour de Y (degrés).
 */
export function gltfToAssembly(source, { name = 'Modèle importé', unit = 1000, rotY = 90 } = {}) {
  // Transformation globale : unités → mm, orientation, posé au sol et centré
  const holder = new THREE.Group();
  const scene = source.clone(true);
  holder.add(scene);
  holder.scale.setScalar(unit);
  holder.rotation.y = rotY * DEG;
  holder.updateMatrixWorld(true);
  const box = new THREE.Box3();
  scene.traverse((o) => { if (o.isMesh) box.expandByObject(o, true); });
  const off = new THREE.Matrix4().makeTranslation(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2);

  let counter = 0;
  const mkGroup = (nm, parentNode, layer) => {
    const obj = new THREE.Group();
    obj.name = nm;
    const node = { kind: 'group', name: nm, ref: `IMP-${String(++counter).padStart(4, '0')}`, desc: '', children: [], object: obj, parent: parentNode, layer };
    obj.userData.node = node;
    return node;
  };
  const rootNode = mkGroup(name, null, 'ext');
  rootNode.desc = 'Modèle importé (.glb) – maillages d\'origine. Les cotes affichées sont des encombrements mesurés, pas des cotes de plan.';
  let partNo = 0;

  const addPart = (mesh, parentNode) => {
    const world = new THREE.Matrix4().multiplyMatrices(off, mesh.matrixWorld);
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const groups = Array.isArray(mesh.material) && mesh.geometry.groups.length ? mesh.geometry.groups : [{ start: 0, count: Infinity, materialIndex: 0 }];
    const base = mesh.name || mesh.parent?.name || `Pièce ${partNo + 1}`;
    groups.forEach((grp, gi) => {
      partNo++;
      const geo = mesh.geometry.clone();
      geo.clearGroups();
      if (groups.length > 1) geo.setDrawRange(grp.start, grp.count);
      if (mesh.isSkinnedMesh) { geo.deleteAttribute('skinIndex'); geo.deleteAttribute('skinWeight'); }
      geo.computeBoundingBox();
      const srcMat = mats[grp.materialIndex ?? 0] || mats[0];
      const mat = convertMaterial(srcMat);
      const m = new THREE.Mesh(geo, mat);
      world.decompose(m.position, m.quaternion, m.scale);
      const nm = groups.length > 1 ? `${base} – ${srcMat?.name || `matériau ${gi + 1}`}` : base;
      m.name = nm;
      const bb = geo.boundingBox.clone().applyMatrix4(world);
      const sz = bb.getSize(new THREE.Vector3());
      const tris = Math.round((grp.count !== Infinity ? grp.count : geo.index ? geo.index.count : geo.attributes.position.count) / 3);
      const node = {
        kind: 'part', name: nm, ref: `IMP-${String(++counter).padStart(4, '0')}`,
        material: mat.userData.label, type: 'pièce importée',
        dims: { 'Longueur (X)': Math.round(sz.x * 10) / 10, 'Hauteur (Y)': Math.round(sz.y * 10) / 10, 'Largeur (Z)': Math.round(sz.z * 10) / 10, Triangles: String(tris) },
        desc: 'Maillage importé – encombrement mesuré', norme: '', couple: null,
        object: m, parent: parentNode, children: [], layer: guessLayer(`${nm} ${srcMat?.name || ''}`, parentNode.layer),
      };
      m.userData.node = node;
      parentNode.object.add(m);
      parentNode.children.push(node);
    });
  };

  const visit = (obj, parentNode) => {
    for (const c of obj.children) {
      if (c.isLight || c.isCamera) continue;
      if (c.isMesh) addPart(c, parentNode);
      if (!c.children.length || !hasMesh(c)) continue;
      // Les maillages enfants d'un maillage, et les nœuds « relais » à un seul enfant utile, sont aplatis
      const useful = c.children.filter(hasMesh);
      if (c.isMesh || useful.length === 1 || !c.name) { visit(c, parentNode); continue; }
      const g = mkGroup(c.name, parentNode, guessLayer(c.name, parentNode.layer));
      parentNode.object.add(g.object);
      parentNode.children.push(g);
      visit(c, g);
      if (!g.children.length) { parentNode.children.pop(); parentNode.object.remove(g.object); }
    }
  };
  visit(scene, rootNode);
  // Ensemble racine à un seul sous-ensemble : on le remonte
  while (rootNode.children.length === 1 && rootNode.children[0].kind === 'group') {
    const only = rootNode.children[0];
    rootNode.children = only.children;
    rootNode.object.remove(only.object);
    for (const ch of [...only.object.children]) rootNode.object.add(ch);
    for (const ch of rootNode.children) ch.parent = rootNode;
  }
  return { object: rootNode.object, node: rootNode };
}
