// Laboratoire de crash test : simulation physique (crash-physics.js) + rendu 3D au ralenti
// Les véhicules sont reconstruits par leurs générateurs ; la carrosserie est déformée sommet par sommet
// selon l'écrasement calculé, les éléments de façade se détachent, un mannequin occupe le poste de conduite.
import * as THREE from 'three';
import { simulate, SCENARIOS, vehicleParams } from './crash-physics.js';

const CATS = ['voiture', 'utilitaire', 'camion', 'bus'];
const DEBRIS = /^(Projecteur|Bouclier|Calandre|Antibrouillard|Emblème|Plaque d'immatriculation|Grille de bouclier|Feu arrière|Clignotant|Catadioptre|Coque de rétroviseur|Miroir|Répétiteur|Logo|Lame de calandre)/;

export function createCrashLab(app) {
  const { scene, camera, controls, CATALOG, esc, nf } = app;
  const lab = {
    active: false, group: new THREE.Group(), debris: new THREE.Group(), v1: null, v2: null, sim: null,
    play: null, loading: 0, statics: [],
  };
  lab.group.add(lab.debris);
  lab.group.visible = false;
  scene.add(lab.group);

  // --------------------------------------------------------------- interface
  const panel = document.createElement('aside');
  panel.id = 'crash-panel';
  panel.hidden = true;
  const vehOpts = CATS.filter((c) => CATALOG[c]).flatMap((c) => Object.entries(CATALOG[c].types).map(([k, t]) => `<option value="${c}/${k}">${CATALOG[c].icon} ${esc(t.label)}</option>`)).join('');
  panel.innerHTML = `
    <h2>💥 Crash test</h2>
    <p class="desc">Simulation physique d'un choc : choisissez le véhicule, l'obstacle et la vitesse, puis lancez l'essai. Les déformations, efforts et accélérations sont calculés à chaque 0,05 ms.</p>
    <label>Véhicule testé<select id="cr-veh">${vehOpts}</select></label>
    <label>Scénario<select id="cr-sc">${Object.entries(SCENARIOS).map(([k, s]) => `<option value="${k}">${esc(s.label)}</option>`).join('')}</select></label>
    <p class="desc" id="cr-sc-desc"></p>
    <label>Vitesse du véhicule testé : <b id="cr-v-val"></b><input id="cr-v" type="range" min="5" max="150" step="1" /></label>
    <div id="cr-other">
      <label>Autre véhicule<select id="cr-veh2">${vehOpts}</select></label>
      <label>Vitesse de l'autre véhicule : <b id="cr-v2-val"></b><input id="cr-v2" type="range" min="5" max="150" step="1" /></label>
    </div>
    <label>Masse du véhicule testé : <b id="cr-m-val"></b><input id="cr-m" type="range" min="500" max="40000" step="10" /></label>
    <div class="cr-row"><label class="chk"><input type="checkbox" id="cr-belt" checked /> Ceinture bouclée</label><label class="chk"><input type="checkbox" id="cr-bag" checked /> Airbags</label><label class="chk"><input type="checkbox" id="cr-xr" /> Carrosserie transparente</label></div>
    <label>Ralenti<select id="cr-slow"><option value="10">× 10</option><option value="25" selected>× 25</option><option value="60">× 60 (très lent)</option></select></label>
    <div class="cr-row"><button id="cr-run" class="primary">▶ Lancer l'essai</button><button id="cr-reset">↺ Réinitialiser</button></div>
    <div class="cr-row cr-views"><span>Caméra :</span><button data-view="side">Côté</button><button data-view="top">Dessus</button><button data-view="front">Face</button><button data-view="cabin">Habitacle</button></div>
    <div id="cr-time">Prêt.</div>
    <canvas id="cr-chart" width="680" height="330"></canvas>
    <div class="cr-legend"><span style="--c:#3d8bff">Décélération véhicule</span><span style="--c:#ffb020">Thorax mannequin</span><span style="--c:#ff5a5a">Tête mannequin</span><span style="--c:#b07cff" id="cr-leg2">Autre véhicule</span></div>
    <table class="kv" id="cr-res"></table>
    <details class="cr-phys"><summary>📘 Comprendre la physique du choc</summary><div id="cr-explain"></div></details>
    <p class="note">Modèle pédagogique à une dimension (masses, ressorts d'écrasement plastiques, retenue de l'occupant). Les ordres de grandeur sont proches des essais réels, mais ce n'est pas un calcul homologué : un vrai crash test utilise des véhicules instrumentés et des mannequins Hybrid III / THOR.</p>
    <button id="cr-close">✕ Quitter le crash test</button>`;
  document.body.appendChild(panel);
  const $ = (s) => panel.querySelector(s);
  const ui = {
    veh: $('#cr-veh'), sc: $('#cr-sc'), v: $('#cr-v'), v2: $('#cr-v2'), veh2: $('#cr-veh2'), m: $('#cr-m'),
    belt: $('#cr-belt'), bag: $('#cr-bag'), xr: $('#cr-xr'), slow: $('#cr-slow'), chart: $('#cr-chart'),
  };
  ui.veh.value = 'voiture/berline';
  ui.veh2.value = 'voiture/berline';
  const syncLabels = () => {
    $('#cr-v-val').textContent = SCENARIOS[ui.sc.value].side === 'rear' ? 'à l\'arrêt' : `${ui.v.value} km/h`;
    $('#cr-v2-val').textContent = `${ui.v2.value} km/h`;
    $('#cr-m-val').textContent = `${nf.format(+ui.m.value)} kg`;
    $('#cr-sc-desc').textContent = SCENARIOS[ui.sc.value].desc;
    $('#cr-other').hidden = SCENARIOS[ui.sc.value].obstacle !== 'vehicule';
    ui.v.disabled = SCENARIOS[ui.sc.value].side === 'rear';
  };
  ui.sc.onchange = () => { const s = SCENARIOS[ui.sc.value]; ui.v.value = s.v || 50; if (s.v2) ui.v2.value = s.v2; syncLabels(); prepare(); };
  ui.veh.onchange = () => prepare(true);
  ui.veh2.onchange = () => prepare();
  for (const el of [ui.v, ui.v2, ui.m]) el.oninput = () => { syncLabels(); lab.sim = null; };
  ui.belt.onchange = ui.bag.onchange = () => { lab.sim = null; };
  ui.xr.onchange = () => xray();
  // carrosserie et vitrages translucides pour voir le mannequin
  function xray() {
    for (const v of [lab.v1, lab.v2]) {
      if (!v) continue;
      for (const m of v.meshes) {
        const n = m.mesh.userData.node, mt = m.mesh.material, b = mt.userData.base || {};
        const ext = n && n.layer === 'ext';
        if (ui.xr.checked && ext) { mt.transparent = true; mt.opacity = 0.05; mt.depthWrite = false; }
        else { mt.transparent = !!b.transparent; mt.opacity = b.opacity ?? 1; mt.depthWrite = b.depthWrite ?? true; }
        mt.needsUpdate = true;
      }
    }
  }
  $('#cr-run').onclick = () => run();
  $('#cr-reset').onclick = () => { lab.play = null; resetPose(); $('#cr-time').textContent = 'Prêt.'; };
  $('#cr-close').onclick = () => close();
  panel.querySelectorAll('[data-view]').forEach((b) => { b.onclick = () => view(b.dataset.view); });
  ui.sc.value = 'mur'; ui.v.value = 56; ui.v2.value = 50;

  // --------------------------------------------------------------- construction des véhicules
  async function buildVehicle(key) {
    const [cat, type] = key.split('/');
    const asm = await CATALOG[cat].types[type].build();
    const obj = asm.object;
    obj.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(obj);
    const size = box.getSize(new THREE.Vector3());
    const meshes = [];
    const tmp = new THREE.Vector3();
    obj.traverse((o) => {
      if (!o.isMesh) return;
      const pos = o.geometry.attributes.position;
      const M = o.matrixWorld.clone();
      const orig = new Float32Array(pos.count * 3);
      for (let i = 0; i < pos.count; i++) { tmp.fromBufferAttribute(pos, i).applyMatrix4(M); orig[i * 3] = tmp.x; orig[i * 3 + 1] = tmp.y; orig[i * 3 + 2] = tmp.z; }
      const local = new Float32Array(pos.array.length); local.set(pos.array);
      const wb = new THREE.Box3().setFromObject(o);
      const ws = wb.getSize(new THREE.Vector3());
      meshes.push({ mesh: o, orig, local, inv: M.clone().invert(), center: wb.getCenter(new THREE.Vector3()), small: Math.max(ws.x, ws.y, ws.z) < 650, parent: o.parent, base: { pos: o.position.clone(), quat: o.quaternion.clone() } });
    });
    const find = (re) => { let r = null; obj.traverse((o) => { if (!r && re.test(o.name)) r = o; }); return r; };
    const wrapper = new THREE.Group();
    wrapper.add(obj);
    const p = vehicleParams(cat, size);
    return { key, cat, obj, wrapper, box, size, meshes, params: p, seat: find(/^Siège (avant gauche|conducteur)/), wheel: find(/^Volant$/), glass: find(/^Pare-brise/), crush: -1 };
  }
  function disposeVehicle(v) {
    if (!v) return;
    v.wrapper.parent?.remove(v.wrapper);
    v.obj.traverse((o) => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } });
    for (const m of v.meshes) if (m.debris) { m.mesh.parent?.remove(m.mesh); m.mesh.geometry.dispose(); m.mesh.material.dispose(); }
  }

  async function prepare(resetMass = false) {
    const token = ++lab.loading;
    lab.play = null; lab.sim = null;
    $('#cr-time').textContent = 'Construction des véhicules…';
    const sc = SCENARIOS[ui.sc.value];
    const need1 = !lab.v1 || lab.v1.key !== ui.veh.value;
    const need2 = sc.obstacle === 'vehicule' && (!lab.v2 || lab.v2.key !== ui.veh2.value);
    const v1 = need1 ? await buildVehicle(ui.veh.value) : lab.v1;
    const v2 = sc.obstacle === 'vehicule' ? (need2 ? await buildVehicle(ui.veh2.value) : lab.v2) : null;
    if (token !== lab.loading) { if (need1) disposeVehicle(v1); if (need2) disposeVehicle(v2); return; }
    if (need1) { disposeVehicle(lab.v1); lab.v1 = v1; }
    if (lab.v2 && lab.v2 !== v2) disposeVehicle(lab.v2);
    lab.v2 = v2;
    if (need1 || resetMass) { ui.m.value = v1.params.m; syncLabels(); }
    layout();
    xray();
    view('side');
    $('#cr-time').textContent = 'Prêt : réglez les paramètres puis lancez l\'essai.';
  }

  // --------------------------------------------------------------- mise en place de la scène
  function clearStatics() { for (const o of lab.statics) { lab.group.remove(o); o.traverse((c) => { c.geometry?.dispose(); c.material?.dispose?.(); }); } lab.statics = []; }
  function addStatic(o) { lab.group.add(o); lab.statics.push(o); return o; }
  const mat = (c, extra = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.8, metalness: 0.1, ...extra });
  function layout() {
    clearStatics();
    const sc = SCENARIOS[ui.sc.value];
    const v1 = lab.v1, b1 = v1.box;
    lab.group.add(v1.wrapper);
    resetPose();
    const floor = addStatic(new THREE.Mesh(new THREE.PlaneGeometry(60000, 30000), mat(0x3a3f45)));
    floor.rotation.x = -Math.PI / 2; floor.position.y = -2;
    for (let i = -20; i <= 20; i++) { const l = addStatic(new THREE.Mesh(new THREE.PlaneGeometry(20, 30000), mat(0xd8c34a))); l.rotation.x = -Math.PI / 2; l.position.set(i * 1000, -1, 0); }
    const W = b1.max.z - b1.min.z;
    lab.axis = sc.side === 'front' ? new THREE.Vector3(1, 0, 0) : sc.side === 'rear' ? new THREE.Vector3(-1, 0, 0) : new THREE.Vector3(0, 0, -1);
    const seatC = v1.seat ? new THREE.Box3().setFromObject(v1.seat).getCenter(new THREE.Vector3()) : new THREE.Vector3(b1.min.x + (b1.max.x - b1.min.x) * 0.55, 0, b1.min.z + W * 0.28);
    lab.poleX = seatC.x;
    if (sc.obstacle === 'rigide' || sc.obstacle === 'barriere') {
      const wall = addStatic(new THREE.Mesh(new THREE.BoxGeometry(1500, 2500, 5000), mat(0x9a9894)));
      wall.position.set(b1.max.x + (sc.obstacle === 'barriere' ? 540 : 0) + 750, 1250, 0);
      for (let k = -2; k <= 2; k++) { const st = addStatic(new THREE.Mesh(new THREE.BoxGeometry(10, 2400, 300), mat(k % 2 ? 0x111111 : 0xf2c200))); st.position.set(wall.position.x - 755, 1250, k * 600); }
      if (sc.obstacle === 'barriere') {
        const hc = addStatic(new THREE.Mesh(new THREE.BoxGeometry(540, 650, 1000), mat(0xc6cbd1, { metalness: 0.6, roughness: 0.4 })));
        hc.position.set(b1.max.x + 270, 200 + 325, b1.min.z + 500);
        lab.barrier = hc;
      }
    } else if (sc.obstacle === 'poteau') {
      const pole = addStatic(new THREE.Mesh(new THREE.CylinderGeometry(127, 127, 3500, 32), mat(0x6b6f75, { metalness: 0.7, roughness: 0.4 })));
      if (sc.side === 'front') pole.position.set(b1.max.x + 127, 1750, 0);
      else pole.position.set(lab.poleX, 1750, b1.min.z - 127);
    }
    if (lab.v2) {
      const v2 = lab.v2;
      lab.group.add(v2.wrapper);
      if (sc.side === 'front') { v2.wrapper.rotation.y = Math.PI; v2.base = new THREE.Vector3(b1.max.x + v2.box.max.x, 0, 0); }
      else { v2.wrapper.rotation.y = 0; v2.base = new THREE.Vector3(b1.min.x - v2.box.max.x, 0, 0); }
      v2.wrapper.position.copy(v2.base);
    }
    buildDummy(seatC, sc);
  }

  // --------------------------------------------------------------- mannequin et airbag
  function buildDummy(seatC, sc) {
    const v1 = lab.v1;
    if (lab.dummy) { lab.dummy.parent?.remove(lab.dummy); lab.dummy.traverse((c) => { c.geometry?.dispose(); c.material?.dispose?.(); }); }
    const Y = mat(0xf2c200, { roughness: 0.5 }), K = mat(0x1a1a1a, { roughness: 0.5 });
    const seatTop = v1.seat ? new THREE.Box3().setFromObject(v1.seat).min.y + 180 : seatC.y;
    const d = new THREE.Group();
    d.name = 'Mannequin Hybrid III (50e centile)';
    d.position.set(seatC.x - 60, seatTop + 90, seatC.z);
    const box = (w, h, l, m) => new THREE.Mesh(new THREE.BoxGeometry(w, h, l), m);
    d.add(box(300, 150, 360, K));
    for (const z of [-95, 95]) {
      const th = box(440, 140, 150, Y); th.position.set(220, 10, z); d.add(th);
      const sh = box(130, 430, 130, Y); sh.position.set(440, -200, z); d.add(sh);
    }
    const torso = new THREE.Group();
    d.add(torso);
    const ch = box(230, 480, 360, Y); ch.position.set(-20, 250, 0); torso.add(ch);
    const mark = box(232, 40, 362, K); mark.position.set(-20, 300, 0); torso.add(mark);
    for (const z of [-205, 205]) { const ar = box(110, 320, 100, Y); ar.position.set(80, 300, z); ar.rotation.z = -0.9; torso.add(ar); }
    const head = new THREE.Group(); head.position.set(-15, 520, 0); torso.add(head);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(45, 45, 90, 16), K); neck.position.y = 40; head.add(neck);
    const hd = new THREE.Mesh(new THREE.SphereGeometry(100, 24, 16), Y); hd.position.y = 150; hd.scale.set(1, 1.2, 0.9); head.add(hd);
    const tgt = new THREE.Mesh(new THREE.CylinderGeometry(40, 40, 4, 24), K); tgt.rotation.x = Math.PI / 2; tgt.position.set(0, 160, 92); head.add(tgt);
    lab.dummy = d; lab.torso = torso; lab.head = head; lab.dummyBase = d.position.clone();
    v1.wrapper.add(d);
    // airbag frontal ou rideau latéral
    if (lab.bag) { lab.bag.parent?.remove(lab.bag); lab.bag.geometry.dispose(); lab.bag.material.dispose(); }
    const wheelC = v1.wheel ? new THREE.Box3().setFromObject(v1.wheel).getCenter(new THREE.Vector3()) : d.position.clone().add(new THREE.Vector3(480, 380, 0));
    const bm = mat(0xf4f4f2, { roughness: 0.9, transparent: true, opacity: 0.92 });
    if (sc.side === 'side') { lab.bag = new THREE.Mesh(new THREE.BoxGeometry(900, 450, 120), bm); lab.bag.position.set(seatC.x, seatTop + 650, v1.box.min.z + 180); }
    else { lab.bag = new THREE.Mesh(new THREE.SphereGeometry(320, 24, 16), bm); lab.bag.position.copy(wheelC).add(new THREE.Vector3(-170, 30, 0)); }
    lab.bag.scale.setScalar(0.001);
    v1.wrapper.add(lab.bag);
  }

  // --------------------------------------------------------------- déformation de la structure
  function deform(v, crushMm, mode) {
    if (Math.abs(crushMm - v.crush) < 0.5) return;
    v.crush = crushMm;
    const { axis, sign, weight } = mode;
    const ai = axis === 'x' ? 0 : 2;
    const faceA = sign > 0 ? v.box.max.getComponent(ai) : -v.box.min.getComponent(ai);
    const p = new THREE.Vector3();
    for (const m of v.meshes) {
      if (m.debris) continue;
      const attr = m.mesh.geometry.attributes.position;
      const arr = attr.array, o = m.orig;
      let changed = false;
      for (let i = 0; i < attr.count; i++) {
        let x = o[i * 3], y = o[i * 3 + 1], z = o[i * 3 + 2];
        const a = sign * (ai === 0 ? x : z);
        const w = crushMm > 0 ? weight(x, y, z) : 0;
        const c = crushMm * w;
        const Lz = 300 + c * 0.6, start = faceA - c - Lz;
        if (c > 0.5 && a > start) {
          const s = (a - start) / (faceA - start);
          const na = start + s * Lz;
          if (ai === 0) { x = sign * na; z += Math.sign(z) * c * 0.04 * s; } else { z = sign * na; x += Math.sin(s * 9 + x * 0.004) * c * 0.03; }
          y += Math.sin(s * Math.PI * 3 + o[i * 3] * 0.011 + o[i * 3 + 2] * 0.013) * c * 0.05 * s;
          changed = true;
        }
        p.set(x, y, z).applyMatrix4(m.inv);
        arr[i * 3] = p.x; arr[i * 3 + 1] = p.y; arr[i * 3 + 2] = p.z;
      }
      if (changed || m.wasChanged) { attr.needsUpdate = true; m.mesh.geometry.computeBoundingSphere(); }
      m.wasChanged = changed;
    }
  }
  function weightFor(role) {
    const sc = SCENARIOS[ui.sc.value];
    const b = lab.v1.box;
    if (role === 2) return () => 1;
    if (ui.sc.value === 'odb') { const zEdge = b.min.z + 0.4 * (b.max.z - b.min.z); return (x, y, z) => Math.max(0, Math.min(1, (zEdge + 250 - z) / 500)); }
    if (sc.obstacle === 'poteau' && sc.side === 'front') return (x, y, z) => Math.exp(-((z / 420) ** 2));
    if (sc.side === 'side') return (x) => Math.exp(-(((x - lab.poleX) / 550) ** 2));
    return () => 1;
  }

  function resetPose() {
    for (const v of [lab.v1, lab.v2]) {
      if (!v) continue;
      for (const m of v.meshes) {
        if (m.debris) { lab.debris.remove(m.mesh); m.parent.add(m.mesh); m.mesh.position.copy(m.base.pos); m.mesh.quaternion.copy(m.base.quat); m.debris = null; }
        m.mesh.geometry.attributes.position.array.set(m.local);
        m.mesh.geometry.attributes.position.needsUpdate = true;
        m.mesh.geometry.computeBoundingSphere();
        m.wasChanged = false;
      }
      v.crush = -1;
      if (v.glass) { v.glass.material.color.setHex(v.glass.material.userData.base?.color ?? 0x9fc6dd); v.glass.material.opacity = v.glass.material.userData.base?.opacity ?? 0.32; }
      v.wrapper.position.copy(v.base || new THREE.Vector3());
    }
    if (lab.dummy) { lab.dummy.position.copy(lab.dummyBase); lab.torso.rotation.set(0, 0, 0); lab.head.rotation.set(0, 0, 0); }
    if (lab.bag) lab.bag.scale.setScalar(0.001);
    if (lab.barrier) lab.barrier.scale.x = 1;
  }

  // --------------------------------------------------------------- essai
  function config() {
    const v1 = lab.v1, v2 = lab.v2;
    return {
      scenario: ui.sc.value, m1: +ui.m.value, k1: v1.params.k * (+ui.m.value / v1.params.m), xl1: v1.params.xl, v1: +ui.v.value,
      m2: v2?.params.m, k2: v2?.params.k, xl2: v2?.params.xl, v2: +ui.v2.value, belt: ui.belt.checked, airbag: ui.bag.checked,
    };
  }
  function run() {
    if (!lab.v1) return;
    resetPose();
    lab.sim = simulate(config());
    lab.play = { t0: performance.now(), slow: +ui.slow.value, lastT: -1 };
    renderResults();
    $('#cr-explain').innerHTML = explain();
  }
  function sample(arr, t) {
    const o = lab.sim.out, dt = o.t[1] - o.t[0];
    if (t <= 0) return arr[0];
    const f = t / dt, i = Math.floor(f);
    if (i >= arr.length - 1) return arr[arr.length - 1];
    return arr[i] + (arr[i + 1] - arr[i]) * (f - i);
  }
  const APPROACH = 1.6; // s réelles d'approche affichées (au tiers de la vitesse)
  function update(now) {
    if (!lab.active || !lab.play || !lab.sim) return;
    const P = lab.play, o = lab.sim.out, sc = SCENARIOS[ui.sc.value];
    const tau = (now - P.t0) / 1000;
    const tEnd = o.t[o.t.length - 1];
    let t = tau < APPROACH ? (tau - APPROACH) / 3 : Math.min(tEnd, (tau - APPROACH) / P.slow);
    const A = lab.axis;
    const w10 = o.v1[0], w20 = o.v2[0];
    const u1 = t < 0 ? w10 * t : sample(o.u1, t), u2 = t < 0 ? w20 * t : sample(o.u2, t);
    lab.v1.wrapper.position.copy(A).multiplyScalar(u1 * 1000);
    if (lab.v2) lab.v2.wrapper.position.copy(lab.v2.base).addScaledVector(A, u2 * 1000);
    const c1 = t < 0 ? 0 : sample(o.c1, t) * 1000, c2 = t < 0 ? 0 : sample(o.c2, t) * 1000;
    const role1 = sc.side === 'front' ? { axis: 'x', sign: 1 } : sc.side === 'rear' ? { axis: 'x', sign: -1 } : { axis: 'z', sign: -1 };
    deform(lab.v1, c1, { ...role1, weight: weightFor(1) });
    if (lab.v2) deform(lab.v2, c2, { axis: 'x', sign: 1, weight: weightFor(2) });
    if (lab.barrier) lab.barrier.scale.x = Math.max(0.15, 1 - (t < 0 ? 0 : Math.min(0.54, sample(o.u1, t)) / 0.54) * 0.85);
    // débris
    const dtR = P.lastT < 0 ? 0 : Math.max(0, t - P.lastT);
    P.lastT = t;
    for (const [v, c, face] of [[lab.v1, c1, role1], [lab.v2, c2, { axis: 'x', sign: 1 }]]) {
      if (!v || !face) continue;
      for (const m of v.meshes) {
        if (!m.debris && c > 90 && m.small && DEBRIS.test(m.mesh.name)) {
          const ai = face.axis === 'x' ? 'x' : 'z';
          const faceA = face.sign > 0 ? v.box.max[ai] : -v.box.min[ai];
          if (face.sign * m.center[ai] > faceA - 450 && (v === lab.v2 || weightFor(1)(m.center.x, m.center.y, m.center.z) > 0.3)) {
            lab.debris.attach(m.mesh);
            const vel = new THREE.Vector3().copy(v === lab.v1 ? A : A.clone().negate()).multiplyScalar((v === lab.v1 ? o.v1[0] : -o.v2[0]) * 600);
            vel.add(new THREE.Vector3((Math.random() - 0.5) * 3000, 1500 + Math.random() * 3000, (Math.random() - 0.5) * 3000));
            m.debris = { vel, rot: new THREE.Vector3((Math.random() - 0.5) * 12, (Math.random() - 0.5) * 12, (Math.random() - 0.5) * 12) };
          }
        }
        if (m.debris && dtR > 0) {
          const d = m.debris;
          d.vel.y -= 9810 * dtR;
          m.mesh.position.addScaledVector(d.vel, dtR);
          if (m.mesh.position.y < 30) { m.mesh.position.y = 30; d.vel.y = Math.abs(d.vel.y) * 0.3; d.vel.x *= 0.6; d.vel.z *= 0.6; d.rot.multiplyScalar(0.6); }
          m.mesh.rotation.x += d.rot.x * dtR; m.mesh.rotation.y += d.rot.y * dtR; m.mesh.rotation.z += d.rot.z * dtR;
        }
      }
      if (v.glass && c > (face.axis === 'x' ? 320 : 200)) { v.glass.material.color.setHex(0xe8eef2); v.glass.material.opacity = 0.75; }
    }
    // mannequin
    const d = t < 0 ? 0 : sample(o.d, t) * 1000;
    if (lab.dummy) {
      lab.dummy.position.copy(lab.dummyBase);
      if (sc.side === 'front') { const a = Math.min(1.25, Math.atan2(d * 1.1, 480)); lab.dummy.position.x += d * 0.35; lab.torso.rotation.set(0, 0, -a); lab.head.rotation.set(0, 0, -a * 0.6); }
      else if (sc.side === 'side') { const a = Math.min(0.9, Math.atan2(d * 1.2, 480)); lab.dummy.position.z -= d * 0.3; lab.torso.rotation.set(-a, 0, 0); lab.head.rotation.set(-a * 0.7, 0, 0); }
      else { const a = Math.min(0.5, Math.atan2(Math.max(0, d) * 1.2, 480)); lab.torso.rotation.set(0, 0, a); lab.head.rotation.set(0, 0, a * 1.4); }
    }
    if (lab.bag) {
      let s = t < 0 ? 0 : sample(o.bag, t);
      if (t > 0.1) s *= Math.max(0.45, 1 - (t - 0.1) * 4);
      lab.bag.scale.setScalar(Math.max(0.001, s));
    }
    const v1k = (t < 0 ? w10 : sample(o.v1, t)) * 3.6;
    $('#cr-time').innerHTML = t < 0 ? `Approche – ${Math.abs(t * w10 * 1000) < 1 ? '' : `${nf.format(Math.round(-t * Math.abs(w10 - w20) * 100) / 100)} m avant le contact`}` : `<b>t = ${nf.format(Math.round(t * 1000 * 10) / 10)} ms</b> · vitesse ${nf.format(Math.round(v1k * 10) / 10)} km/h · écrasement ${nf.format(Math.round(c1))} mm · décélération ${nf.format(Math.round(sample(o.a1, t)))} g`;
    drawChart(t);
  }

  // --------------------------------------------------------------- graphiques et résultats
  function drawChart(t = null) {
    const cv = ui.chart, ctx = cv.getContext('2d');
    const Wc = cv.width, Hc = cv.height, L = 52, R = 10, T = 14, B = 34;
    ctx.clearRect(0, 0, Wc, Hc);
    ctx.font = '20px system-ui, sans-serif';
    if (!lab.sim) { ctx.fillStyle = '#8a94a3'; ctx.fillText('Lancez un essai pour voir les courbes.', L, Hc / 2); return; }
    const o = lab.sim.out, tMax = o.t[o.t.length - 1];
    const series = [[o.a1, '#3d8bff', false], [o.ao, '#ffb020', false], [o.ah, '#ff5a5a', true]];
    if (lab.v2) series.push([o.a2.map(Math.abs), '#b07cff', true]);
    const yMax = Math.max(10, ...series.map(([a]) => Math.max(...a.map(Math.abs)))) * 1.1;
    const X = (tt) => L + (tt / tMax) * (Wc - L - R), Yp = (g) => Hc - B - (g / yMax) * (Hc - B - T);
    ctx.strokeStyle = '#2a3039'; ctx.lineWidth = 1; ctx.fillStyle = '#8a94a3';
    for (let k = 0; k <= 4; k++) { const g = (yMax / 4) * k; ctx.beginPath(); ctx.moveTo(L, Yp(g)); ctx.lineTo(Wc - R, Yp(g)); ctx.stroke(); ctx.fillText(`${Math.round(g)} g`, 2, Yp(g) + 6); }
    for (let k = 0; k <= 4; k++) { const tt = (tMax / 4) * k; ctx.fillText(`${Math.round(tt * 1000)} ms`, X(tt) - 20, Hc - 8); }
    for (const [a, c, dash] of series) {
      ctx.strokeStyle = c; ctx.lineWidth = 3; ctx.setLineDash(dash ? [8, 6] : []);
      ctx.beginPath(); a.forEach((g, i) => { const x = X(o.t[i]), y = Yp(Math.abs(g)); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke();
    }
    ctx.setLineDash([]);
    if (t != null && t >= 0) { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X(t), T); ctx.lineTo(X(t), Hc - B); ctx.stroke(); }
    $('#cr-leg2').hidden = !lab.v2;
  }
  function renderResults() {
    const r = lab.sim.res, cfg = config();
    const f = (v, d = 1) => nf.format(Math.round(v * 10 ** d) / 10 ** d);
    const ok = (b) => (b ? '<span class="ok">✔</span>' : '<span class="ko">✘</span>');
    let h = '<tr><th colspan="2">Véhicule testé</th></tr>';
    h += `<tr><td>Énergie cinétique avant le choc</td><td>${f(r.ke0, 0)} kJ</td></tr>`;
    h += `<tr><td>Variation de vitesse (Δv)</td><td>${f(r.dv1)} km/h</td></tr>`;
    h += `<tr><td>Décélération maximale</td><td>${f(r.peak1)} g</td></tr>`;
    h += `<tr><td>Décélération moyenne</td><td>${f(r.mean1)} g</td></tr>`;
    h += `<tr><td>Écrasement maximal</td><td>${f(r.crush1 * 1000, 0)} mm</td></tr>`;
    h += `<tr><td>Écrasement résiduel</td><td>${f(r.crush1 * 900, 0)} mm</td></tr>`;
    h += `<tr><td>Durée du contact</td><td>${f(r.duration * 1000, 0)} ms</td></tr>`;
    h += `<tr><td>Vitesse de rebond</td><td>${f(r.rebound)} km/h</td></tr>`;
    h += `<tr><td>Énergie absorbée par les déformations</td><td>${f(r.energy, 0)} kJ</td></tr>`;
    if (lab.v2) {
      h += '<tr><th colspan="2">Autre véhicule</th></tr>';
      h += `<tr><td>Masse estimée</td><td>${f(cfg.m2, 0)} kg</td></tr><tr><td>Variation de vitesse (Δv)</td><td>${f(r.dv2)} km/h</td></tr><tr><td>Décélération maximale</td><td>${f(r.peak2)} g</td></tr><tr><td>Écrasement maximal</td><td>${f(r.crush2 * 1000, 0)} mm</td></tr>`;
    }
    h += `<tr><th colspan="2">Mannequin (conducteur, 78 kg)</th></tr>`;
    h += `<tr><td>Déplacement vers ${SCENARIOS[cfg.scenario].side === 'rear' ? 'le dossier' : 'l\'impact'}</td><td>${f(r.excursion * 1000, 0)} mm</td></tr>`;
    h += `<tr><td>Thorax – accélération 3 ms</td><td>${f(r.chest3ms)} g ${ok(r.chestOk)}</td></tr>`;
    h += `<tr><td>Critère de blessure à la tête HIC15</td><td>${f(r.hic, 0)} ${ok(r.hicOk)}</td></tr>`;
    h += `<tr><td>Risque de blessure grave à la tête (AIS 4+)</td><td>${f(r.headRisk * 100, 1)} %</td></tr>`;
    if (r.hardContact) h += `<tr><td colspan="2" class="warn">⚠ Le mannequin heurte une partie rigide (volant, planche de bord, porte ou appui-tête).</td></tr>`;
    h += `<tr><th colspan="2">Bilan indicatif</th></tr><tr><td>Note</td><td class="stars">${'★'.repeat(r.stars)}${'☆'.repeat(5 - r.stars)}</td></tr>`;
    h += `<tr><td colspan="2" class="small">Seuils réglementaires (FMVSS 208) : HIC15 &lt; 700, thorax &lt; 60 g sur 3 ms.</td></tr>`;
    $('#cr-res').innerHTML = h;
  }
  function explain() {
    const r = lab.sim.res, cfg = config(), sc = SCENARIOS[cfg.scenario];
    const v = (sc.side === 'rear' ? cfg.v2 : cfg.v1) / 3.6;
    const f = (x, d = 1) => nf.format(Math.round(x * 10 ** d) / 10 ** d);
    const meanF = r.energy * 1000 / Math.max(0.05, r.crush1 + r.crush2);
    return `
      <p><b>1. Énergie à dissiper.</b> E = ½ m v² = ½ × ${f(cfg.m1, 0)} kg × (${f(v)} m/s)² ≈ <b>${f(r.ke0, 0)} kJ</b>${lab.v2 ? ' (les deux véhicules compris)' : ''}. La vitesse compte au carré : à 2 fois plus vite, il y a 4 fois plus d'énergie.</p>
      <p><b>2. Elle est absorbée en écrasant la structure.</b> Effort moyen ≈ énergie / écrasement = ${f(r.energy, 0)} kJ / ${f((r.crush1 + r.crush2) * 1000, 0)} mm ≈ <b>${f(meanF / 1000, 0)} kN</b>, soit le poids de ${f(meanF / 9.81 / 1000, 1)} tonnes. Plus la zone déformable est longue, plus l'effort (donc la décélération) est faible.</p>
      <p><b>3. Décélération.</b> a = Δv / Δt = ${f(r.dv1 / 3.6, 1)} m/s ÷ ${f(r.duration * 1000, 0)} ms ≈ <b>${f(r.mean1)} g</b> en moyenne, avec un pic à ${f(r.peak1)} g.</p>
      ${lab.v2 ? `<p><b>4. Deux véhicules.</b> La quantité de mouvement se conserve (m₁v₁ + m₂v₂) : le véhicule le plus léger subit la plus forte variation de vitesse (${f(r.dv1)} km/h contre ${f(r.dv2)} km/h ici).</p>` : ''}
      <p><b>${lab.v2 ? 5 : 4}. L'occupant.</b> Le corps continue à sa vitesse jusqu'à ce qu'une retenue l'arrête (1re loi de Newton). La ceinture à prétensionneur le « couple » tôt à la caisse et le limiteur d'effort plafonne la force ; l'airbag répartit l'effort sur la tête et le thorax. Sans ceinture, l'occupant arrive plus tard et plus vite sur des parties rigides : les accélérations explosent.</p>
      <p><b>HIC15</b> (Head Injury Criterion) = max sur 15 ms de (t₂ − t₁) × [moyenne de l'accélération de la tête en g]<sup>2,5</sup>. Au-delà de 700, le risque de blessure grave augmente fortement.</p>`;
  }

  // --------------------------------------------------------------- caméra
  function view(kind) {
    if (!lab.v1) return;
    const b = lab.v1.box, c = new THREE.Vector3((b.min.x + b.max.x) / 2 + (SCENARIOS[ui.sc.value].side === 'front' ? 600 : 0), (b.max.y) * 0.45, 0);
    const L = Math.max(b.max.x - b.min.x, 4000);
    const pos = { side: [c.x, 2000, L * 1.9], top: [c.x + 1, L * 2.2, 0], front: [b.max.x + L * 1.3, 1800, L * 0.7], cabin: [lab.dummyBase.x + 300, lab.dummyBase.y + 700, b.min.z - 2600] }[kind];
    const tgt = kind === 'cabin' ? lab.dummyBase.clone().add(new THREE.Vector3(350, 250, 0)) : c;
    if (kind === 'cabin' && !ui.xr.checked) { ui.xr.checked = true; xray(); }
    app.animateCamera(tgt, new THREE.Vector3(...pos));
  }

  // --------------------------------------------------------------- ouverture / fermeture
  function open() {
    if (lab.active) return;
    lab.active = true;
    panel.hidden = false;
    lab.group.visible = true;
    document.body.classList.add('crash-mode');
    app.onOpen?.();
    syncLabels();
    drawChart();
    if (!lab.v1) prepare(true); else { layout(); view('side'); }
  }
  function close() {
    if (!lab.active) return;
    lab.active = false; lab.play = null;
    panel.hidden = true;
    lab.group.visible = false;
    document.body.classList.remove('crash-mode');
    app.onClose?.();
  }
  return { open, close, toggle: () => (lab.active ? close() : open()), update, get active() { return lab.active; }, get playing() { return !!lab.play; } };
}
