import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import './style.css';
import { buildCar } from './vehicles/car.js';
import { buildTruck } from './vehicles/truck.js';
import { buildMoto } from './vehicles/moto.js';
import { buildPlane } from './vehicles/plane.js';

const VEHICLES = {
  avion: { build: buildPlane, label: 'Avion' },
  voiture: { build: buildCar, label: 'Voiture' },
  camion: { build: buildTruck, label: 'Camion' },
  moto: { build: buildMoto, label: 'Moto' },
};

// ============================================================================ Utilitaires
const $ = (s) => document.querySelector(s);
const nf = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });
const mm = (v) => `${nf.format(v)} mm`;
const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const FASTENER_RE = /^(vis|boulon|ecrou|rondelle|goujon|rivet|fixation quart)/;
const isFastener = (n) => n.kind === 'part' && (['vis', 'écrou', 'rondelle', 'rivet'].includes(n.type) || FASTENER_RE.test(norm(n.name)));
function walk(node, fn, depth = 0) { fn(node, depth); node.children.forEach((c) => walk(c, fn, depth + 1)); }
function partsOf(node) { const r = []; walk(node, (n) => n.kind === 'part' && r.push(n)); return r; }
function pathOf(node) { const p = []; for (let n = node; n; n = n.parent) p.unshift(n); return p; }

// ============================================================================ Scène
const viewport = $('#viewport');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, logarithmicDepthBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
viewport.prepend(renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.domElement.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;';
viewport.appendChild(labelRenderer.domElement);

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
const sun = new THREE.DirectionalLight(0xffffff, 1.6);
sun.position.set(0.6, 1, 0.4);
scene.add(sun, new THREE.HemisphereLight(0xdde6ff, 0x30281e, 0.6));

const camera = new THREE.PerspectiveCamera(40, 1, 5, 200000);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.12;
controls.screenSpacePanning = true;

const gizmo = new TransformControls(camera, renderer.domElement);
gizmo.setSize(0.9);
gizmo.addEventListener('dragging-changed', (e) => { controls.enabled = !e.value; });
gizmo.addEventListener('objectChange', () => {
  const o = gizmo.object;
  if (!o) return;
  const b = o.userData.base;
  o.userData.user.copy(o.position).sub(b.pos).sub(b.explode.clone().multiplyScalar(explodeT()));
  updateDimsOverlay();
});
scene.add(gizmo.getHelper());

const helpers = new THREE.Group();
scene.add(helpers);

// ============================================================================ État
const state = {
  key: null, root: null, rootNode: null, meshes: [], rowByNode: new Map(),
  selected: null, selectedMeshes: new Set(), hovered: null,
  xray: false, wire: false, dims: false, labels: false, measure: false,
  explode: 0, expanded: new Set(), filter: '',
};
const explodeT = () => state.explode * 1.4;

// ============================================================================ Chargement d'un véhicule
function loadVehicle(key) {
  if (!VEHICLES[key]) key = 'voiture';
  $('#loading').style.display = 'grid';
  document.querySelectorAll('#vehicle-tabs button').forEach((b) => b.classList.toggle('active', b.dataset.v === key));
  requestAnimationFrame(() => setTimeout(() => {
    if (state.root) {
      gizmo.detach();
      scene.remove(state.root);
      state.root.traverse((o) => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } });
    }
    clearMeasure();
    const t0 = performance.now();
    const asm = VEHICLES[key].build();
    state.key = key;
    state.root = asm.object;
    state.rootNode = asm.node;
    scene.add(state.root);
    state.meshes = [];
    state.root.traverse((o) => { if (o.isMesh) state.meshes.push(o); });
    prepareExplode(state.root);
    applyExplode();
    setupGround();
    state.selected = null;
    state.selectedMeshes.clear();
    state.expanded = new Set([state.rootNode]);
    state.rootNode.children.forEach((c) => c.kind === 'group' && state.expanded.add(c));
    $('#search').value = '';
    state.filter = '';
    buildTree();
    renderDetails();
    refreshMaterials();
    updateLabels();
    updateDimsOverlay();
    const parts = partsOf(state.rootNode);
    const fast = parts.filter(isFastener).length;
    const box = new THREE.Box3().setFromObject(state.root);
    const sz = box.getSize(new THREE.Vector3());
    $('#stats').innerHTML = `<b>${parts.length}</b> pièces · <b>${fast}</b> fixations · hors-tout <b>${nf.format(Math.round(sz.x))} × ${nf.format(Math.round(sz.z))} × ${nf.format(Math.round(sz.y))}</b> mm`;
    setView('iso', false);
    $('#loading').style.display = 'none';
    console.info(`[Ghost] ${key} construit en ${Math.round(performance.now() - t0)} ms – ${parts.length} pièces`);
    if (location.hash.slice(1) !== key) history.replaceState(null, '', `#${key}`);
  }, 10));
}

let ground;
function setupGround() {
  if (ground) { helpers.remove(ground); ground.traverse((o) => o.geometry?.dispose()); }
  ground = new THREE.Group();
  const box = new THREE.Box3().setFromObject(state.root);
  const size = Math.ceil(Math.max(box.max.x - box.min.x, box.max.z - box.min.z) * 1.6 / 1000) * 1000;
  const major = new THREE.GridHelper(size, size / 1000, 0x4a5462, 0x3a424e);
  const minor = new THREE.GridHelper(size, size / 100, 0x262c35, 0x262c35);
  minor.material.transparent = true; minor.material.opacity = 0.35;
  minor.position.y = -1; major.position.y = -0.5;
  ground.add(minor, major);
  const axes = new THREE.AxesHelper(600);
  axes.position.y = 1;
  ground.add(axes);
  helpers.add(ground);
}

// ============================================================================ Vue éclatée
function prepareExplode(root) {
  root.updateMatrixWorld(true);
  const centers = new Map();
  const box = new THREE.Box3();
  root.traverse((o) => { if (o.userData.node) centers.set(o, box.setFromObject(o).getCenter(new THREE.Vector3())); });
  root.traverse((o) => {
    if (!o.userData.node) return;
    const base = { pos: o.position.clone(), quat: o.quaternion.clone(), explode: new THREE.Vector3() };
    if (o !== root && o.parent && centers.has(o.parent)) {
      const off = centers.get(o).clone().sub(centers.get(o.parent));
      const q = new THREE.Quaternion(), s = new THREE.Vector3();
      o.parent.matrixWorld.decompose(new THREE.Vector3(), q, s);
      off.applyQuaternion(q.invert()).divide(s);
      base.explode.copy(off);
    }
    o.userData.base = base;
    o.userData.user = new THREE.Vector3();
  });
}
function applyExplode() {
  const t = explodeT();
  state.root.traverse((o) => {
    const b = o.userData.base;
    if (!b) return;
    o.position.copy(b.pos).addScaledVector(b.explode, t).add(o.userData.user);
  });
  updateDimsOverlay();
}

// ============================================================================ Matériaux (sélection, survol, rayons X, filaire)
const SEL_COLOR = new THREE.Color(0x3d8bff), HOV_COLOR = new THREE.Color(0x8899aa);
function refreshMaterials() {
  for (const m of state.meshes) {
    const mat = m.material, b = mat.userData.base;
    const sel = state.selectedMeshes.has(m);
    const hov = state.hovered && state.hovered === m.userData.node;
    mat.emissive.setHex(b.emissive);
    mat.emissiveIntensity = b.emissiveIntensity;
    mat.opacity = b.opacity; mat.transparent = b.transparent; mat.depthWrite = b.depthWrite;
    if (sel) { mat.emissive.copy(SEL_COLOR); mat.emissiveIntensity = 0.55; }
    else if (hov) { mat.emissive.copy(HOV_COLOR); mat.emissiveIntensity = 0.35; }
    if (state.xray && state.selectedMeshes.size && !sel) { mat.transparent = true; mat.opacity = 0.08; mat.depthWrite = false; }
    else if (state.xray && !state.selectedMeshes.size) { mat.transparent = true; mat.opacity = Math.min(b.opacity, 0.35); mat.depthWrite = false; }
    mat.wireframe = state.wire;
    mat.needsUpdate = true;
  }
}

// ============================================================================ Sélection
function select(node, { focus = false, fromTree = false } = {}) {
  state.selected = node;
  state.selectedMeshes.clear();
  if (node) walk(node, (n) => n.kind === 'part' && state.selectedMeshes.add(n.object));
  if (gizmo.object && (!node || gizmo.object !== node.object)) gizmo.detach();
  refreshMaterials();
  renderDetails();
  if (node) {
    for (let p = node.parent; p; p = p.parent) state.expanded.add(p);
    if (state.filter) applyFilter(); else renderTreeVisibility();
    markTreeSelection(!fromTree);
    if (window.matchMedia('(max-width: 800px)').matches) document.body.classList.add('show-details');
  } else markTreeSelection(false);
  updateDimsOverlay();
  updateLabels();
  if (focus && node) frameObject(node.object);
}

function frameObject(obj, animate = true) {
  const box = new THREE.Box3();
  obj.traverse((o) => { if (o.isMesh && isVisible(o)) box.expandByObject(o); });
  if (box.isEmpty()) box.setFromObject(obj);
  const c = box.getCenter(new THREE.Vector3());
  const r = Math.max(box.getSize(new THREE.Vector3()).length() / 2, 60);
  const dist = r / Math.sin((camera.fov * Math.PI) / 360) * 1.6;
  const dir = camera.position.clone().sub(controls.target).normalize();
  animateCamera(c, c.clone().addScaledVector(dir, dist), animate);
}

let camAnim = null;
function animateCamera(target, pos, animate = true) {
  if (!animate) { controls.target.copy(target); camera.position.copy(pos); controls.update(); return; }
  camAnim = { t0: performance.now(), d: 550, ft: controls.target.clone(), fp: camera.position.clone(), tt: target, tp: pos };
}
function stepCamAnim(now) {
  if (!camAnim) return;
  let k = Math.min(1, (now - camAnim.t0) / camAnim.d);
  k = 1 - (1 - k) ** 3;
  controls.target.lerpVectors(camAnim.ft, camAnim.tt, k);
  camera.position.lerpVectors(camAnim.fp, camAnim.tp, k);
  if (k >= 1) camAnim = null;
}

function setView(v, animate = true) {
  if (!state.root) return;
  const box = new THREE.Box3().setFromObject(state.root);
  const c = box.getCenter(new THREE.Vector3());
  const r = box.getSize(new THREE.Vector3()).length() / 2;
  const d = r / Math.sin((camera.fov * Math.PI) / 360) * 0.95;
  const dirs = { iso: [1, 0.55, 1.1], front: [1, 0.08, 0], side: [0, 0.08, -1], top: [0.0001, 1, 0] };
  const dir = new THREE.Vector3(...dirs[v]).normalize();
  animateCamera(c, c.clone().addScaledVector(dir, d), animate);
}

function isVisible(o) { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; }

// ============================================================================ Picking
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
function hitsAt(ev) {
  const r = renderer.domElement.getBoundingClientRect();
  ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  const hits = raycaster.intersectObjects(state.meshes, false).filter((h) => isVisible(h.object));
  const seen = new Set();
  return hits.filter((h) => !seen.has(h.object) && seen.add(h.object));
}

let hoverPending = null;
renderer.domElement.addEventListener('pointermove', (ev) => { hoverPending = ev; });
renderer.domElement.addEventListener('pointerleave', () => { hoverPending = null; setHover(null); $('#tooltip').style.display = 'none'; });
function processHover() {
  if (!hoverPending || !state.root) return;
  const ev = hoverPending; hoverPending = null;
  if (gizmo.dragging) return;
  let h = hitsAt(ev);
  if (state.xray && state.selectedMeshes.size) h = h.filter((x) => state.selectedMeshes.has(x.object)).concat(h);
  const node = h[0]?.object.userData.node || null;
  setHover(node);
  const tt = $('#tooltip');
  if (node) {
    const path = pathOf(node).slice(1, -1).map((n) => n.name).join(' › ');
    tt.innerHTML = `<b>${esc(node.name)}</b><div class="p">${esc(path)}</div><div class="p">${esc(node.ref)}${state.measure ? ` · point (${h[0].point.toArray().map((v) => Math.round(v)).join(', ')}) mm` : ''}</div>`;
    const r = viewport.getBoundingClientRect();
    tt.style.left = `${Math.min(ev.clientX - r.left + 14, r.width - 260)}px`;
    tt.style.top = `${ev.clientY - r.top + 14}px`;
    tt.style.display = 'block';
  } else tt.style.display = 'none';
}
function setHover(node) {
  if (state.hovered === node) return;
  state.hovered = node;
  refreshMaterials();
  renderer.domElement.style.cursor = node ? 'pointer' : 'default';
}

let down = null, lastClick = null;
renderer.domElement.addEventListener('pointerdown', (ev) => { down = { x: ev.clientX, y: ev.clientY }; });
renderer.domElement.addEventListener('pointerup', (ev) => {
  if (!down || Math.hypot(ev.clientX - down.x, ev.clientY - down.y) > 5 || ev.button !== 0) return;
  if (gizmo.dragging || gizmo.axis) return;
  const hits = hitsAt(ev);
  if (state.measure) { if (hits[0]) addMeasurePoint(hits[0].point); return; }
  if (!hits.length) { select(null); lastClick = null; return; }
  let idx = 0;
  if (lastClick && Math.hypot(ev.clientX - lastClick.x, ev.clientY - lastClick.y) < 4 && performance.now() - lastClick.t < 4000) {
    idx = (lastClick.idx + 1) % hits.length;
  } else if (state.xray && state.selectedMeshes.size) {
    const i = hits.findIndex((h) => state.selectedMeshes.has(h.object));
    idx = i >= 0 ? i : 0;
  }
  lastClick = { x: ev.clientX, y: ev.clientY, idx, t: performance.now() };
  let node = hits[idx].object.userData.node;
  if (ev.shiftKey && node.parent) node = node.parent;
  select(node);
});
renderer.domElement.addEventListener('dblclick', () => { if (state.selected && !state.measure) frameObject(state.selected.object); });

// ============================================================================ Arborescence
const treeEl = $('#tree');
function buildTree() {
  treeEl.innerHTML = '';
  state.rowByNode.clear();
  const frag = document.createDocumentFragment();
  walk(state.rootNode, (n, depth) => {
    const row = document.createElement('div');
    row.className = 'row';
    row.setAttribute('role', 'treeitem');
    row.style.paddingLeft = `${depth * 14 + 4}px`;
    const isG = n.kind === 'group';
    const cnt = isG ? partsOf(n).length : 0;
    row.innerHTML = `<span class="caret">${isG ? '▸' : ''}</span><span class="ico">${isG ? '📦' : isFastener(n) ? '🔩' : '▫️'}</span><span class="name"></span>${isG ? `<span class="cnt">${cnt}</span>` : ''}<button class="eye" title="Afficher / masquer">👁</button>`;
    row.querySelector('.name').textContent = n.name;
    row._node = n;
    n._row = row;
    state.rowByNode.set(n, row);
    frag.appendChild(row);
  });
  treeEl.appendChild(frag);
  renderTreeVisibility();
}
function renderTreeVisibility() {
  walk(state.rootNode, (n) => {
    const row = n._row;
    let show = true;
    for (let p = n.parent; p; p = p.parent) if (!state.expanded.has(p)) { show = false; break; }
    row.style.display = show ? '' : 'none';
    if (n.kind === 'group') row.querySelector('.caret').textContent = state.expanded.has(n) ? '▾' : '▸';
    row.classList.toggle('hidden-part', !n.object.visible);
    const nm = row.querySelector('.name');
    if (nm.childElementCount) nm.textContent = n.name;
  });
}
function markTreeSelection(scroll) {
  treeEl.querySelectorAll('.row.sel').forEach((r) => r.classList.remove('sel'));
  const row = state.selected?._row;
  if (row) { row.classList.add('sel'); if (scroll) row.scrollIntoView({ block: 'nearest' }); }
}
treeEl.addEventListener('click', (ev) => {
  const row = ev.target.closest('.row');
  if (!row) return;
  const n = row._node;
  if (ev.target.classList.contains('eye')) { setNodeVisible(n, !n.object.visible); return; }
  if (ev.target.classList.contains('caret') && n.kind === 'group') {
    state.expanded.has(n) ? state.expanded.delete(n) : state.expanded.add(n);
    state.filter ? applyFilter() : renderTreeVisibility();
    return;
  }
  if (n.kind === 'group' && state.selected === n) state.expanded.has(n) ? state.expanded.delete(n) : state.expanded.add(n);
  select(n, { focus: true, fromTree: true });
});

function setNodeVisible(n, v) {
  n.object.visible = v;
  if (v) for (let p = n.parent; p; p = p.parent) p.object.visible = true;
  renderTreeVisibility();
  updateDimsOverlay();
}

// Recherche
const searchEl = $('#search');
searchEl.addEventListener('input', () => { state.filter = norm(searchEl.value.trim()); applyFilter(); });
searchEl.addEventListener('keydown', (ev) => {
  if (ev.key === 'Enter') {
    const first = [...treeEl.querySelectorAll('.row.match')][0];
    if (first) select(first._node, { focus: true });
    searchEl.blur();
  }
  if (ev.key === 'Escape') { searchEl.value = ''; state.filter = ''; applyFilter(); searchEl.blur(); }
});
function applyFilter() {
  const q = state.filter;
  const terms = q.split(/\s+/).filter(Boolean);
  let count = 0;
  if (!terms.length) {
    treeEl.querySelectorAll('.row').forEach((r) => { r.classList.remove('match'); r.querySelector('.name').textContent = r._node.name; });
    renderTreeVisibility();
    $('#search-info').textContent = '';
    return;
  }
  const visible = new Set();
  walk(state.rootNode, (n) => {
    const hay = norm(`${n.name} ${n.ref} ${n.material || ''} ${n.parent ? n.parent.name : ''}`);
    const ok = terms.every((t) => hay.includes(t));
    const row = n._row;
    row.classList.toggle('match', ok);
    const nm = row.querySelector('.name');
    if (ok) {
      count++;
      visible.add(n);
      for (let p = n.parent; p; p = p.parent) visible.add(p);
      nm.innerHTML = highlight(n.name, terms);
    } else nm.textContent = n.name;
  });
  walk(state.rootNode, (n) => { n._row.style.display = visible.has(n) ? '' : 'none'; if (n.kind === 'group') n._row.querySelector('.caret').textContent = '▾'; });
  $('#search-info').textContent = count ? `${count} résultat${count > 1 ? 's' : ''} – Entrée pour sélectionner le premier` : 'Aucun résultat';
}
function highlight(text, terms) {
  const n = norm(text);
  const marks = new Array(text.length).fill(false);
  for (const t of terms) { let i = n.indexOf(t); while (i >= 0) { for (let k = i; k < i + t.length; k++) marks[k] = true; i = n.indexOf(t, i + 1); } }
  let out = '', open = false;
  for (let i = 0; i < text.length; i++) {
    if (marks[i] && !open) { out += '<mark>'; open = true; }
    if (!marks[i] && open) { out += '</mark>'; open = false; }
    out += esc(text[i]);
  }
  return out + (open ? '</mark>' : '');
}

$('#btn-expand').onclick = () => { walk(state.rootNode, (n) => n.kind === 'group' && state.expanded.add(n)); renderTreeVisibility(); };
$('#btn-collapse').onclick = () => { state.expanded = new Set([state.rootNode]); renderTreeVisibility(); };
$('#btn-showall').onclick = showAll;
function showAll() { state.root.traverse((o) => { if (o.userData.node) o.visible = true; }); renderTreeVisibility(); updateDimsOverlay(); }

// ============================================================================ Panneau de détails
function renderDetails() {
  const n = state.selected;
  $('#details-empty').hidden = !!n;
  const el = $('#details-content');
  el.hidden = !n;
  if (!n) return;
  const crumbs = pathOf(n).slice(0, -1).map((p) => `<a data-ref="${esc(p.ref)}">${esc(p.name)}</a>`).join(' › ');
  const box = worldBox(n.object);
  const sz = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
  let html = `<div class="crumbs">${crumbs || '&nbsp;'}</div><h2>${esc(n.name)}</h2>`;
  html += `<div><span class="badge ref">${esc(n.ref)}</span><span class="badge">${n.kind === 'group' ? 'Ensemble' : esc(n.type)}</span></div>`;
  if (n.desc) html += `<p class="desc">${esc(n.desc)}</p>`;
  html += '<div class="actions">';
  html += '<button data-a="focus">🎯 Centrer (F)</button><button data-a="isolate">🔍 Isoler (I)</button>';
  html += `<button data-a="hide">${n.object.visible ? '🙈 Masquer (H)' : '👁 Afficher (H)'}</button><button data-a="parent" ${n.parent ? '' : 'disabled'}>⬆ Ensemble parent</button>`;
  html += '<button data-a="move">✥ Déplacer (G)</button><button data-a="rotate">⟳ Pivoter (R)</button>';
  html += '<button data-a="reset">↺ Remettre en place</button><button data-a="copy">📋 Copier la fiche</button>';
  html += '</div><table class="kv">';
  if (n.kind === 'part') {
    html += `<tr><th colspan="2">Caractéristiques</th></tr><tr><td>Matériau</td><td>${esc(n.material)}</td></tr>`;
    if (n.norme) html += `<tr><td>Norme</td><td>${esc(n.norme)}</td></tr>`;
    if (n.couple != null) html += `<tr><td>Couple de serrage</td><td>${esc(typeof n.couple === 'number' ? `${n.couple} N·m` : n.couple)}</td></tr>`;
    const dims = Object.entries(n.dims || {});
    if (dims.length) {
      html += '<tr><th colspan="2">Cotes nominales</th></tr>';
      for (const [k, v] of dims) html += `<tr><td>${esc(k)}</td><td>${typeof v === 'number' ? (k === 'Spires' ? nf.format(v) : mm(v)) : esc(v)}</td></tr>`;
    }
  } else {
    const parts = partsOf(n);
    const fast = parts.filter(isFastener).length;
    html += `<tr><th colspan="2">Composition</th></tr><tr><td>Pièces</td><td>${parts.length}</td></tr><tr><td>dont fixations</td><td>${fast}</td></tr><tr><td>Sous-ensembles directs</td><td>${n.children.filter((x) => x.kind === 'group').length}</td></tr>`;
  }
  html += `<tr><th colspan="2">Encombrement mesuré (repère véhicule)</th></tr>`;
  html += `<tr><td>Longueur (X)</td><td>${mm(sz.x)}</td></tr><tr><td>Hauteur (Y)</td><td>${mm(sz.y)}</td></tr><tr><td>Largeur (Z)</td><td>${mm(sz.z)}</td></tr>`;
  html += `<tr><td>Centre X / Y / Z</td><td>${[c.x, c.y, c.z].map((v) => nf.format(Math.round(v))).join(' / ')}</td></tr>`;
  html += '</table>';
  if (n.kind === 'group') {
    html += '<table class="kv"><tr><th>Contenu</th></tr></table><ul class="children">';
    for (const ch of n.children) html += `<li data-ref="${esc(ch.ref)}" data-i="${n.children.indexOf(ch)}">${esc(ch.name)}<span>${ch.kind === 'group' ? `${partsOf(ch).length} pcs` : esc(ch.ref)}</span></li>`;
    html += '</ul>';
  }
  el.innerHTML = html;
  el.querySelectorAll('.crumbs a').forEach((a, i) => { a.onclick = () => select(pathOf(n)[i], { focus: true }); });
  el.querySelectorAll('.children li').forEach((li) => { li.onclick = () => select(n.children[+li.dataset.i], { focus: true }); });
  el.querySelectorAll('.actions button').forEach((b) => { b.onclick = () => action(b.dataset.a); });
}
function worldBox(obj) {
  const box = new THREE.Box3();
  obj.updateMatrixWorld(true);
  obj.traverse((o) => { if (o.isMesh) box.expandByObject(o, true); });
  return box;
}

function action(a) {
  const n = state.selected;
  if (!n) return;
  switch (a) {
    case 'focus': frameObject(n.object); break;
    case 'isolate': {
      state.root.traverse((o) => { if (o.userData.node) o.visible = false; });
      n.object.traverse((o) => { if (o.userData.node) o.visible = true; });
      for (let p = n.parent; p; p = p.parent) p.object.visible = true;
      renderTreeVisibility(); frameObject(n.object); updateDimsOverlay(); renderDetails();
      break;
    }
    case 'hide': setNodeVisible(n, !n.object.visible); renderDetails(); break;
    case 'parent': if (n.parent) select(n.parent, { focus: true }); break;
    case 'move': gizmo.attach(n.object); gizmo.setMode('translate'); break;
    case 'rotate': gizmo.attach(n.object); gizmo.setMode('rotate'); break;
    case 'reset': {
      n.object.traverse((o) => { if (o.userData.base) { o.userData.user.set(0, 0, 0); o.quaternion.copy(o.userData.base.quat); } });
      applyExplode(); renderDetails();
      break;
    }
    case 'copy': {
      const lines = [`${n.name} (${n.ref})`, pathOf(n).map((p) => p.name).join(' > ')];
      if (n.kind === 'part') {
        lines.push(`Matériau : ${n.material}`);
        if (n.couple != null) lines.push(`Couple : ${typeof n.couple === 'number' ? `${n.couple} N·m` : n.couple}`);
        for (const [k, v] of Object.entries(n.dims)) lines.push(`${k} : ${typeof v === 'number' && k !== 'Spires' ? mm(v) : v}`);
      }
      navigator.clipboard?.writeText(lines.join('\n'));
      break;
    }
  }
}

// ============================================================================ Cotes d'encombrement
const dimsGroup = new THREE.Group();
helpers.add(dimsGroup);
function updateDimsOverlay() {
  dimsGroup.children.slice().forEach((c) => { dimsGroup.remove(c); if (c.element) c.element.remove(); c.traverse?.((o) => { if (o.element) o.element.remove(); }); });
  if (!state.dims || !state.selected) return;
  const box = worldBox(state.selected.object);
  if (box.isEmpty()) return;
  dimsGroup.add(new THREE.Box3Helper(box, 0xffb020));
  const { min, max } = box, sz = box.getSize(new THREE.Vector3());
  const lab = (txt, p) => { const d = document.createElement('div'); d.className = 'lbl dim'; d.textContent = txt; const o = new CSS2DObject(d); o.position.copy(p); dimsGroup.add(o); };
  lab(`X ${mm(sz.x)}`, new THREE.Vector3((min.x + max.x) / 2, min.y, max.z));
  lab(`Y ${mm(sz.y)}`, new THREE.Vector3(max.x, (min.y + max.y) / 2, max.z));
  lab(`Z ${mm(sz.z)}`, new THREE.Vector3(max.x, min.y, (min.z + max.z) / 2));
}

// ============================================================================ Étiquettes
const labelsGroup = new THREE.Group();
helpers.add(labelsGroup);
function updateLabels() {
  labelsGroup.children.slice().forEach((c) => { labelsGroup.remove(c); c.element.remove(); });
  if (!state.labels || !state.root) return;
  const base = state.selected ? (state.selected.kind === 'group' ? state.selected : state.selected.parent) : state.rootNode;
  const list = base.children.slice(0, 60);
  for (const ch of list) {
    if (!isVisible(ch.object)) continue;
    const d = document.createElement('div');
    d.className = 'lbl';
    d.textContent = ch.name;
    d.onclick = (e) => { e.stopPropagation(); select(ch, { focus: true }); };
    const o = new CSS2DObject(d);
    o.userData.target = ch.object;
    labelsGroup.add(o);
  }
}
function positionLabels() {
  for (const o of labelsGroup.children) worldBox(o.userData.target).getCenter(o.position);
}

// ============================================================================ Mesure
const measureGroup = new THREE.Group();
helpers.add(measureGroup);
let measurePts = [];
function addMeasurePoint(p) {
  const dot = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, depthTest: false }));
  dot.renderOrder = 999;
  dot.position.copy(p);
  dot.userData.screenScale = true;
  measureGroup.add(dot);
  measurePts.push(p.clone());
  if (measurePts.length === 2) {
    const [a, b] = measurePts;
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), new THREE.LineBasicMaterial({ color: 0xffffff, depthTest: false }));
    line.renderOrder = 999;
    measureGroup.add(line);
    const d = document.createElement('div');
    d.className = 'lbl meas';
    const dv = b.clone().sub(a);
    d.innerHTML = `${mm(a.distanceTo(b))}<br><small>ΔX ${nf.format(Math.abs(dv.x))} · ΔY ${nf.format(Math.abs(dv.y))} · ΔZ ${nf.format(Math.abs(dv.z))}</small>`;
    const o = new CSS2DObject(d);
    o.position.copy(a).add(b).multiplyScalar(0.5);
    measureGroup.add(o);
    measurePts = [];
    $('#measure-hint').textContent = 'Mesure terminée – cliquez deux nouveaux points (Échap pour quitter)';
  } else $('#measure-hint').textContent = 'Cliquez le second point';
}
function clearMeasure() {
  measureGroup.children.slice().forEach((c) => { measureGroup.remove(c); if (c.element) c.element.remove(); c.geometry?.dispose(); });
  measurePts = [];
}

// ============================================================================ Barre d'outils
function toggle(name, v = !state[name]) {
  state[name] = v;
  $(`#t-${name === 'wire' ? 'wire' : name}`)?.classList.toggle('on', v);
  if (name === 'xray' || name === 'wire') refreshMaterials();
  if (name === 'dims') updateDimsOverlay();
  if (name === 'labels') updateLabels();
  if (name === 'measure') {
    $('#measure-hint').style.display = v ? 'block' : 'none';
    $('#measure-hint').textContent = 'Cliquez le premier point sur une pièce';
    if (!v) clearMeasure();
  }
}
['xray', 'wire', 'dims', 'labels', 'measure'].forEach((k) => { $(`#t-${k}`).onclick = () => toggle(k); });
const explodeEl = $('#explode');
explodeEl.oninput = () => { state.explode = explodeEl.value / 100; applyExplode(); };
let explodeAnim = null;
function animateExplode(to) {
  explodeAnim = { from: state.explode, to, t0: performance.now() };
}
$('#v-iso').onclick = () => setView('iso');
$('#v-front').onclick = () => setView('front');
$('#v-side').onclick = () => setView('side');
$('#v-top').onclick = () => setView('top');
$('#b-help').onclick = () => { $('#help').hidden = false; };
$('#help-close').onclick = () => { $('#help').hidden = true; };
$('#help').onclick = (e) => { if (e.target.id === 'help') $('#help').hidden = true; };
$('#b-shot').onclick = () => {
  renderer.render(scene, camera);
  const a = document.createElement('a');
  a.href = renderer.domElement.toDataURL('image/png');
  a.download = `ghost-${state.key}${state.selected ? `-${state.selected.ref}` : ''}.png`;
  a.click();
};
$('#b-csv').onclick = () => {
  const rows = [['Chemin', 'Désignation', 'Référence', 'Type', 'Matériau', 'Norme', 'Couple de serrage', 'Cotes (mm)']];
  walk(state.rootNode, (n) => {
    if (n.kind !== 'part') return;
    rows.push([
      pathOf(n).slice(0, -1).map((p) => p.name).join(' > '), n.name, n.ref, n.type, n.material, n.norme || '',
      n.couple == null ? '' : typeof n.couple === 'number' ? `${n.couple} N·m` : n.couple,
      Object.entries(n.dims).map(([k, v]) => `${k}=${typeof v === 'number' ? nf.format(v) : v}`).join(' ; '),
    ]);
  });
  const csv = '﻿' + rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = `nomenclature-${state.key}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};
document.querySelectorAll('#vehicle-tabs button').forEach((b) => { b.onclick = () => loadVehicle(b.dataset.v); });
window.addEventListener('hashchange', () => { const k = location.hash.slice(1); if (k !== state.key && VEHICLES[k]) loadVehicle(k); });

// Boutons mobiles
const mobileBar = document.createElement('div');
mobileBar.id = 'mobile-bar';
mobileBar.innerHTML = '<button id="m-tree">☰ Pièces</button><button id="m-details">ℹ Fiche</button>';
$('#topbar').appendChild(mobileBar);
$('#m-tree').onclick = () => { document.body.classList.toggle('show-tree'); document.body.classList.remove('show-details'); };
$('#m-details').onclick = () => { document.body.classList.toggle('show-details'); document.body.classList.remove('show-tree'); };

// Clavier
window.addEventListener('keydown', (ev) => {
  if (ev.target.tagName === 'INPUT') return;
  const k = ev.key.toLowerCase();
  if (k === 'escape') {
    if (!$('#help').hidden) { $('#help').hidden = true; return; }
    if (state.measure) { toggle('measure', false); return; }
    if (gizmo.object) { gizmo.detach(); return; }
    select(null);
  } else if (k === 'f') { state.selected ? frameObject(state.selected.object) : setView('iso'); }
  else if (k === 'i') action('isolate');
  else if (k === 'h') action('hide');
  else if (k === 'g') action('move');
  else if (k === 'r') action('rotate');
  else if (k === 'x') toggle('xray');
  else if (k === 'w') toggle('wire');
  else if (k === 'c') toggle('dims');
  else if (k === 'l') toggle('labels');
  else if (k === 'm') toggle('measure');
  else if (k === 'e') animateExplode(state.explode > 0.01 ? 0 : 0.6);
  else if (k === '/' ) { ev.preventDefault(); searchEl.focus(); }
  else if (k === '?') $('#help').hidden = false;
});

// ============================================================================ Boucle de rendu
function resize() {
  const w = viewport.clientWidth, h = viewport.clientHeight;
  renderer.setSize(w, h);
  labelRenderer.setSize(w, h);
  camera.aspect = w / Math.max(1, h);
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(viewport);
resize();

const tmpV = new THREE.Vector3();
function tick(now) {
  requestAnimationFrame(tick);
  if (explodeAnim) {
    let k = Math.min(1, (now - explodeAnim.t0) / 600);
    k = 1 - (1 - k) ** 3;
    state.explode = explodeAnim.from + (explodeAnim.to - explodeAnim.from) * k;
    explodeEl.value = Math.round(state.explode * 100);
    applyExplode();
    if (k >= 1) explodeAnim = null;
  }
  stepCamAnim(now);
  controls.update();
  processHover();
  // les points de mesure gardent une taille constante à l'écran
  for (const o of measureGroup.children) if (o.userData.screenScale) o.scale.setScalar(camera.position.distanceTo(o.position) * 0.006);
  sun.position.copy(camera.position).sub(controls.target).normalize().add(tmpV.set(0, 0.8, 0)).normalize();
  if (state.labels) positionLabels();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}
requestAnimationFrame(tick);

loadVehicle(location.hash.slice(1) || 'voiture');
