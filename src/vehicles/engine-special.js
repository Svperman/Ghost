// Moteurs non conventionnels : rotatif Wankel et moteur électrique synchrone (cotes en mm)
// Repère : X = axe de l'arbre, Y = haut, Z = droite.
import * as THREE from 'three';
import { Assembly, S, boltCircle } from '../core/builder.js';

const D2R = Math.PI / 180;
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const PERM_X = new THREE.Matrix4().set(0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1);
const r1 = (v) => Math.round(v * 10) / 10;

/** Profil 2D (plan YZ, liste de points [y, z]) avec trous éventuels, extrudé de t selon X */
function slab(outer, holes, t, dims) {
  const sh = new THREE.Shape(outer.map(([a, b]) => new THREE.Vector2(a, b)));
  for (const h of holes || []) sh.holes.push(new THREE.Path(h.map(([a, b]) => new THREE.Vector2(a, b))));
  const g = new THREE.ExtrudeGeometry(sh, { depth: t, bevelEnabled: false, curveSegments: 24 });
  g.translate(0, 0, -t / 2);
  g.applyMatrix4(PERM_X);
  return { geo: g, dims: dims || { Épaisseur: r1(t) } };
}
const circle = (r, n = 48, c = [0, 0]) => Array.from({ length: n }, (_, i) => [c[0] + r * Math.cos((i / n) * Math.PI * 2), c[1] + r * Math.sin((i / n) * Math.PI * 2)]);
function ringX(rOut, rIn, a0, a1, t, seg = 40) {
  const pts = [];
  for (let i = 0; i <= seg; i++) { const a = (a0 + (a1 - a0) * i / seg) * D2R; pts.push([rOut * Math.cos(a), rOut * Math.sin(a)]); }
  for (let i = seg; i >= 0; i--) { const a = (a0 + (a1 - a0) * i / seg) * D2R; pts.push([rIn * Math.cos(a), rIn * Math.sin(a)]); }
  return slab(pts, null, t, { 'Diamètre extérieur': r1(rOut * 2), 'Diamètre intérieur': r1(rIn * 2), Largeur: r1(t) });
}
const setAnim = (o, pos, quat, sy) => { o.userData.anim = { pos: pos || V3(0, 0, 0), quat: quat || new THREE.Quaternion(), sy }; };
const qx = (a) => new THREE.Quaternion().setFromAxisAngle(V3(1, 0, 0), a);
function spinX(o, C, ang) {
  const R = qx(ang), p0 = o.userData.base.pos;
  setAnim(o, C.clone().add(p0.clone().sub(C).applyQuaternion(R)).sub(p0), R);
}

// ============================================================================ Wankel
export function buildWankel(P) {
  const { R, e, b } = P;                     // rayon générateur, excentricité, largeur du rotor
  const Yc = 330;
  const w = new Assembly(P.label, { prefix: 'WK', code: 'WKL', layer: 'meca', desc: `${P.desc} – R = ${R} mm, excentricité e = ${e} mm, largeur ${b} mm` });
  const troch = (k = 0) => Array.from({ length: 120 }, (_, i) => { const t = (i / 120) * Math.PI * 2; return [e * Math.cos(3 * t) + (R + k) * Math.cos(t), e * Math.sin(3 * t) + (R + k) * Math.sin(t)]; });
  const outer = (() => { const pts = []; const a = R + e + 45, c = R - e + 55; for (let i = 0; i < 64; i++) { const t = (i / 64) * Math.PI * 2; pts.push([a * Math.cos(t), c * Math.sin(t)]); } return pts; })();
  // flancs du rotor : arcs passant par les 3 sommets
  const rotorPts = (() => {
    const pts = [], Rr = R - 1.5, sag = R * 0.13;
    for (let k = 0; k < 3; k++) {
      const a0 = (k * 120) * D2R, a1 = ((k + 1) * 120) * D2R;
      const p0 = [Rr * Math.cos(a0), Rr * Math.sin(a0)], p1 = [Rr * Math.cos(a1), Rr * Math.sin(a1)];
      const m = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2], ml = Math.hypot(...m), nrm = [m[0] / ml, m[1] / ml];
      for (let i = 0; i < 16; i++) { const t = i / 16, s = Math.sin(Math.PI * t) * sag; pts.push([p0[0] + (p1[0] - p0[0]) * t + nrm[0] * s, p0[1] + (p1[1] - p0[1]) * t + nrm[1] * s]); }
    }
    return pts;
  })();
  const AN = { rotors: [], shaft: [] };
  const rx = [-(b / 2 + 10), b / 2 + 10];
  const sideT = 60, midT = 40;
  const cas = w.group('Carters', { code: 'CAR', layer: 'struct' });
  cas.part('Carter latéral avant', slab(outer, [circle(55)], sideT), { pos: [rx[0] - b / 2 - sideT / 2, Yc, 0], mat: 'fonte', desc: 'Fonte – surface nitrurée au contact des segments latéraux' });
  cas.part('Carter intermédiaire', slab(outer, [circle(55)], midT), { pos: [0, Yc, 0], mat: 'fonte' });
  cas.part('Carter latéral arrière', slab(outer, [circle(55)], sideT), { pos: [rx[1] + b / 2 + sideT / 2, Yc, 0], mat: 'fonte' });
  const Ltot = 2 * b + midT + 2 * sideT + 40;
  for (let i = 0; i < 12; i++) {
    const t = (i / 12) * Math.PI * 2, a = R + e + 28, c = R - e + 38;
    const sh = S.bolt(10, Ltot);
    sh.geo.rotateZ(Math.PI / 2);
    cas.part(`Tirant d'assemblage ${i + 1}`, sh, { pos: [rx[0] - b / 2 - sideT - 5, Yc + a * Math.cos(t), c * Math.sin(t)], mat: 'acierHR', couple: '30 N·m', desc: 'Traverse les 5 carters' });
  }
  rx.forEach((x, k) => {
    const st = w.group(`Stator trochoïdal n°${k + 1}`, { code: `ST${k + 1}`, layer: 'struct' });
    st.part('Carter de rotor (épitrochoïde)', slab(outer, [troch(0.6)], b, { 'Rayon générateur R': R, 'Excentricité e': e, Largeur: b, 'Cylindrée par rotor': '654 cm³' }), { pos: [x, Yc, 0], mat: 'aluminium', desc: 'Surface intérieure chromée dure – profil épitrochoïde à 2 lobes' });
    for (const [nm, ang] of [['principale (leading)', 200], ['secondaire (trailing)', 225]]) st.part(`Bougie ${nm}`, S.cyl(14, 60, 'z'), { pos: [x, Yc + (R + e + 30) * Math.cos(ang * D2R), (R - e + 30) * Math.sin(ang * D2R)], mat: 'ceramique', layer: 'int' });
    st.part('Lumière d\'échappement', S.box(b * 0.6, 40, 60), { pos: [x, Yc - 40, R - e + 50], mat: 'inox', layer: 'int' });
    st.part('Injecteur (lumière d\'admission latérale)', S.cyl(14, 70, 'z'), { pos: [x, Yc + 60, -(R - e + 50)], mat: 'inox', layer: 'int' });
    st.part('Joint torique d\'eau', ringX(R + e + 25, R + e + 21, 0, 360, 3), { pos: [x - b / 2, Yc, 0], mat: 'fkm' });
    // rotor
    const ph = k === 0 ? 0 : Math.PI;          // les deux excentriques sont décalés de 180°
    const c = V3(x, Yc + e * Math.cos(ph), e * Math.sin(ph));
    const ro = w.group(`Rotor n°${k + 1}`, { code: `RO${k + 1}`, pos: c.toArray(), rot: [(ph / 3) / D2R, 0, 0], layer: 'sol', desc: 'Tourne à 1/3 de la vitesse de l\'arbre excentrique, 3 combustions par tour de rotor' });
    ro.part('Rotor (fonte)', slab(rotorPts, [circle(52)], b - 1, { 'Rayon aux sommets': r1(R - 1.5), Largeur: b - 1 }), { mat: 'fonte' });
    for (let f = 0; f < 3; f++) { const a = (f * 120 + 60) * D2R; ro.part(`Poche de combustion (face ${'ABC'[f]})`, S.box(b * 0.55, 6, R * 0.45), { pos: [0, Math.cos(a) * R * 0.52, Math.sin(a) * R * 0.52], rot: [-(f * 120 + 60), 0, 0], mat: 'fonte', color: 0x3a3a3a }); }
    for (let f = 0; f < 3; f++) {
      const a = f * 120 * D2R;
      ro.part(`Segment d'apex ${'ABC'[f]}`, S.box(b - 1, 8, 2.5), { pos: [0, Math.cos(a) * (R - 1), Math.sin(a) * (R - 1)], rot: [-f * 120, 0, 0], mat: 'ceramique', desc: 'Segment de sommet en carbone / céramique – 2,5 mm, ressort de rappel' });
      for (const sd of [-1, 1]) ro.part(`Segment latéral ${'ABC'[f]} ${sd < 0 ? 'avant' : 'arrière'}`, S.box(1.2, 4, R * 1.4), { pos: [sd * (b / 2 - 0.6), Math.cos(a + Math.PI / 3) * R * 0.42, Math.sin(a + Math.PI / 3) * R * 0.42], rot: [-(f * 120 + 150), 0, 0], mat: 'fonte' });
    }
    ro.part('Couronne dentée interne du rotor', ringX(52, 44, 0, 360, 20), { pos: [b / 2 - 12, 0, 0], mat: 'acierHR', desc: '51 dents – rapport 3:2 avec le pignon fixe' });
    ro.part('Roulement de rotor', ringX(52, 46, 0, 360, b - 20), { mat: 'regule' });
    AN.rotors.push({ o: ro.object, x, ph });
    st.part('Pignon fixe (engrenage de phasage)', ringX(36, 26, 0, 360, 18), { pos: [x + b / 2 - 12, Yc, 0], mat: 'acierHR', desc: '34 dents – solidaire du carter latéral' });
  });
  const sh = w.group('Arbre excentrique', { code: 'ARB', layer: 'sol' });
  AN.shaft.push(sh.object);
  sh.part('Arbre principal', S.cyl(43, Ltot + 160, 'x', 40), { pos: [0, Yc, 0], mat: 'acierForge' });
  rx.forEach((x, k) => sh.part(`Excentrique n°${k + 1}`, S.cyl(92, b - 4, 'x', 48), { pos: [x, Yc + e * (k === 0 ? 1 : -1), 0], mat: 'acierForge', desc: `Excentrique de ${e} mm` }));
  sh.part('Volant moteur', S.cyl(300, 30, 'x', 64), { pos: [Ltot / 2 + 50, Yc, 0], mat: 'fonte' });
  sh.part('Contrepoids avant', S.box(25, 80, 140), { pos: [-Ltot / 2 - 40, Yc - 60, 0], mat: 'acierForge' });
  sh.part('Poulie d\'arbre excentrique', S.cyl(140, 25, 'x'), { pos: [-Ltot / 2 - 70, Yc, 0], mat: 'fonte' });
  const per = w.group('Périphériques', { code: 'PER', layer: 'int' });
  per.part('Collecteur d\'admission', S.box(Ltot * 0.8, 80, 120), { pos: [0, Yc + 60, -(R - e + 130)], mat: 'aluminium' });
  per.part('Collecteur d\'échappement', S.pipe([[rx[0], Yc - 40, R - e + 80], [rx[0], Yc - 80, R - e + 180], [0, Yc - 120, R - e + 240], [rx[1], Yc - 80, R - e + 180], [rx[1], Yc - 40, R - e + 80]], 48), { mat: 'inox' });
  per.part('Pompe à huile', S.box(80, 70, 80), { pos: [-Ltot / 2 - 20, Yc - 120, 0], mat: 'aluminium' });
  per.part('Injecteur d\'huile de dosage (lubrification des apex)', S.cyl(30, 60, 'y'), { pos: [0, Yc + R + 60, 0], mat: 'aluminium' });
  per.part('Carter d\'huile', S.box(Ltot, 70, 2 * (R - e) + 40), { pos: [0, Yc - (R - e + 55) - 35, 0], mat: 'aluminium', layer: 'ext' });
  per.part('Démarreur', S.cyl(80, 180, 'x'), { pos: [Ltot / 2 - 40, Yc - 120, -(R + 60)], mat: 'peinture', color: 0x222222 });
  per.part('Alternateur', S.cyl(110, 130, 'x'), { pos: [-Ltot / 2 + 30, Yc + 150, R + 60], mat: 'aluminium' });

  w.object.userData.animate = (deg) => {
    const d = deg * D2R;
    for (const o of AN.shaft) spinX(o, V3(0, Yc, 0), d);
    for (const r of AN.rotors) {
      const c0 = V3(r.x, Yc + e * Math.cos(r.ph), e * Math.sin(r.ph));
      const c1 = V3(r.x, Yc + e * Math.cos(r.ph + d), e * Math.sin(r.ph + d));
      setAnim(r.o, c1.sub(c0), qx(d / 3));
    }
  };
  const PH = ['Admission', 'Compression', 'Combustion – détente', 'Échappement'];
  const COL = ['#3d8bff', '#ffb020', '#ff6a3d', '#9aa0a6'];
  w.object.userData.phases = (deg) => {
    const out = [];
    for (let k = 0; k < 2; k++) for (let f = 0; f < 3; f++) {
      const cyc = ((deg + f * 360 + k * 180) % 1080 + 1080) % 1080;
      const i = Math.floor(cyc / 270);
      out.push({ label: `Rotor ${k + 1} face ${'ABC'[f]}`, value: PH[i], color: COL[i] });
    }
    return out;
  };
  w.object.userData.animTitle = (deg) => `Arbre excentrique : ${Math.round(deg % 360)}° · rotors : ${Math.round((deg / 3) % 360)}°`;
  w.object.userData.animInfo = 'Chaque face du rotor réalise un cycle complet (admission, compression, combustion, échappement) par tour de rotor, soit 3 tours d\'arbre.';
  return w;
}

// ============================================================================ Moteur électrique
export function buildElectric(P) {
  const Yc = 260;
  const m = new Assembly(P.label, { prefix: 'ME', code: 'MEL', layer: 'meca', desc: P.desc });
  const sOD = 220, sID = 152, Ls = 150, rOD = 150, slots = 48, poles = 8;
  const AN = { rotor: [], gears: [] };
  const car = m.group('Carter & refroidissement', { code: 'CAR', layer: 'ext' });
  car.part('Carter moteur (aluminium coulé)', S.tube(270, 236, Ls + 70, 'x', 64), { pos: [0, Yc, 0], mat: 'aluminium', desc: 'Chemise d\'eau intégrée – refroidissement liquide 65 °C' });
  for (let i = 0; i < 10; i++) car.part(`Nervure de carter ${i + 1}`, S.tube(286, 270, 6, 'x', 64), { pos: [-Ls / 2 - 20 + i * (Ls + 40) / 9, Yc, 0], mat: 'aluminium' });
  car.part('Canal de refroidissement hélicoïdal', S.spring(250, 14, Ls, 5, 'x'), { pos: [0, Yc, 0], mat: 'cuivre', color: 0x2f6fb0, layer: 'meca' });
  for (const [nm, x] of [['avant', -(Ls / 2 + 45)], ['arrière', Ls / 2 + 45]]) {
    car.part(`Flasque ${nm}`, ringX(140, 32, 0, 360, 18), { pos: [x, Yc, 0], mat: 'aluminium', layer: 'struct' });
    boltCircle(car, { n: 8, pcd: 250, d: 8, L: 30, axis: 'x', at: [x + (x < 0 ? -9 : 9), Yc, 0], dir: x < 0 ? -1 : 1, label: `Vis de flasque ${nm}`, kind: 'cap', couple: 25 });
  }
  const st = m.group('Stator', { code: 'STA', layer: 'struct', desc: `${slots} encoches – bobinage triphasé en épingles (hairpin) 4 couches – tôles FeSi 0,25 mm` });
  st.part('Paquet de tôles statoriques', S.tube(sOD, sID + 40, Ls, 'x', 96), { mat: 'acier', color: 0x5a5f66, pos: [0, Yc, 0], desc: `≈ ${Math.round(Ls / 0.25)} tôles de 0,25 mm empilées` });
  for (let i = 0; i < slots; i++) {
    const a = (i / slots) * Math.PI * 2 + Math.PI / slots;
    st.part(`Dent statorique ${i + 1}`, S.box(Ls, 18, 6), { pos: [0, Yc + Math.cos(a) * (sID / 2 + 10), Math.sin(a) * (sID / 2 + 10)], rot: [-a / D2R, 0, 0], mat: 'acier', color: 0x5a5f66 });
    const b = (i / slots) * Math.PI * 2;
    const ph = 'UVW'[Math.floor(i / 2) % 3];
    st.part(`Épingle de cuivre – encoche ${i + 1} (phase ${ph})`, S.box(Ls + 24, 16, 5), { pos: [0, Yc + Math.cos(b) * (sID / 2 + 11), Math.sin(b) * (sID / 2 + 11)], rot: [-b / D2R, 0, 0], mat: 'cuivre', color: { U: 0xc26a2a, V: 0xb87333, W: 0xa65a20 }[ph], desc: 'Conducteur rectangulaire 4 × 2,5 mm émaillé' });
  }
  for (const [nm, x] of [['côté connexions', -(Ls / 2 + 14)], ['côté opposé', Ls / 2 + 14]]) st.part(`Chignon de bobinage ${nm}`, S.tube(sOD - 20, sID + 6, 26, 'x', 64), { pos: [x, Yc, 0], mat: 'cuivre' });
  const ro = m.group('Rotor', { code: 'ROT', layer: 'sol', desc: `${poles} pôles – aimants NdFeB en V – vitesse maximale 18 000 tr/min` });
  AN.rotor.push(ro.object);
  ro.part('Paquet de tôles rotoriques', S.tube(rOD, 54, Ls, 'x', 96), { pos: [0, Yc, 0], mat: 'acier', color: 0x6b7077 });
  for (let p = 0; p < poles; p++) for (const k of [-1, 1]) {
    const a = (p / poles) * Math.PI * 2 + k * 0.17;
    ro.part(`Aimant permanent NdFeB pôle ${p + 1}${k < 0 ? 'a' : 'b'} (${p % 2 ? 'sud' : 'nord'})`, S.box(Ls - 4, 6, 22), { pos: [0, Yc + Math.cos(a) * 58, Math.sin(a) * 58], rot: [-(a / D2R) + k * 25, 0, 0], mat: 'peinture', color: p % 2 ? 0x2a5fb0 : 0xc0262d, desc: 'Néodyme-fer-bore grade N48SH – 6 × 22 × 146 mm' });
  }
  ro.part('Arbre rotor (cannelé)', S.cyl(40, 420, 'x', 32), { pos: [40, Yc, 0], mat: 'acierForge' });
  for (const [nm, x] of [['avant', -(Ls / 2 + 45)], ['arrière', Ls / 2 + 45]]) ro.part(`Roulement à billes ${nm} (céramique)`, ringX(36, 20, 0, 360, 16), { pos: [x, Yc, 0], mat: 'inox', desc: 'Billes céramique isolantes – évitent l\'érosion électrique' });
  ro.part('Disque d\'équilibrage', S.cyl(130, 8, 'x', 48), { pos: [Ls / 2 + 8, Yc, 0], mat: 'laiton' });
  ro.part('Rotor du résolveur', ringX(30, 20, 0, 360, 10), { pos: [-(Ls / 2 + 70), Yc, 0], mat: 'acier' });
  m.part('Stator du résolveur (capteur de position)', ringX(48, 32, 0, 360, 12), { pos: [-(Ls / 2 + 70), Yc, 0], mat: 'cuivre', layer: 'meca' });
  // onduleur
  const ond = m.group('Onduleur carbure de silicium 800 V', { code: 'OND', layer: 'int', desc: 'Convertit le courant continu de la batterie en courant alternatif triphasé – fréquence de découpage 10 kHz' });
  const oy = Yc + 150;
  ond.part('Boîtier d\'onduleur', S.box(300, 90, 250), { pos: [0, oy + 45, 0], mat: 'aluminium' });
  for (const [k, ph] of ['U', 'V', 'W'].entries()) ond.part(`Module de puissance SiC – phase ${ph}`, S.box(70, 14, 60), { pos: [-80 + k * 80, oy + 20, -50], mat: 'ceramique' });
  ond.part('Condensateur de bus continu (DC-link)', S.box(200, 50, 70), { pos: [0, oy + 50, 70], mat: 'plastique', color: 0xd4a017 });
  ond.part('Carte de commande', S.box(240, 4, 180), { pos: [0, oy + 82, 0], mat: 'ecran', color: 0x1e5b2a });
  ond.part('Connecteur haute tension (batterie)', S.box(60, 40, 50), { pos: [160, oy + 45, 0], mat: 'abs', color: 0xff7a00 });
  for (const [k, ph] of ['U', 'V', 'W'].entries()) ond.part(`Barre de connexion phase ${ph}`, S.pipe([[-80 + k * 80, oy + 20, -50], [-(Ls / 2 + 20), Yc + 120, -40 + k * 40], [-(Ls / 2 + 14), Yc + 95, -40 + k * 40]], 10), { mat: 'cuivre' });
  // réducteur
  const red = m.group('Réducteur à 1 rapport et différentiel', { code: 'RED', layer: 'meca', desc: 'Rapport total 9,1 : 1' });
  const gx = Ls / 2 + 110;
  const gear = (nm, D, w, pos, k, teeth) => { const o = red.part(nm, S.cyl(D, w, 'x', teeth), { pos, mat: 'acierHR', desc: `${teeth} dents` }); AN.gears.push({ o, C: V3(0, pos[1], pos[2]), k }); return o; };
  gear('Pignon d\'entrée', 50, 30, [gx, Yc, 0], 1, 19);
  gear('Roue intermédiaire', 160, 26, [gx, Yc - 105, 0], -50 / 160, 61);
  gear('Pignon intermédiaire', 60, 34, [gx + 40, Yc - 105, 0], -50 / 160, 22);
  gear('Couronne de différentiel', 210, 30, [gx + 40, Yc - 240, 0], (50 / 160) * (60 / 210), 79);
  red.part('Carter de réducteur', S.box(140, 380, 260), { pos: [gx + 20, Yc - 130, 0], mat: 'aluminium', layer: 'ext' });
  red.part('Boîtier de différentiel', S.sphere(110), { pos: [gx + 40, Yc - 240, 0], mat: 'fonte' });
  for (const sd of [-1, 1]) {
    red.part(`Planétaire ${sd < 0 ? 'gauche' : 'droit'}`, S.cyl(60, 20, 'z', 16), { pos: [gx + 40, Yc - 240, sd * 30], mat: 'acierHR' });
    red.part(`Satellite ${sd < 0 ? 'supérieur' : 'inférieur'}`, S.cyl(40, 18, 'y', 12), { pos: [gx + 40, Yc - 240 + sd * 30, 0], mat: 'acierHR' });
    red.part(`Arbre de sortie ${sd < 0 ? 'gauche' : 'droit'}`, S.cyl(30, 260, 'z'), { pos: [gx + 40, Yc - 240, sd * 160], mat: 'acierForge' });
  }
  m.part('Support de fixation (silent-bloc)', S.box(120, 40, 300), { pos: [0, Yc - 160, 0], mat: 'acier', layer: 'struct' });

  m.object.userData.animate = (deg) => {
    const d = deg * D2R;
    for (const o of AN.rotor) spinX(o, V3(0, Yc, 0), d);
    for (const g of AN.gears) spinX(g.o, g.C, d * g.k);
  };
  m.object.userData.phases = (deg) => ['U', 'V', 'W'].map((ph, k) => {
    const i = Math.sin(((deg * poles) / 2 - k * 120) * D2R);
    return { label: `Phase ${ph}`, value: `${i >= 0 ? '+' : '−'}${Math.round(Math.abs(i) * 450)} A`, color: ['#c26a2a', '#ffb020', '#3d8bff'][k] };
  });
  m.object.userData.animTitle = (deg) => `Rotor : ${Math.round(deg % 360)}° · champ tournant à ${poles / 2} paires de pôles`;
  m.object.userData.animInfo = 'Les 3 phases du stator créent un champ magnétique tournant que les aimants du rotor suivent. Le réducteur divise la vitesse par 9,1.';
  return m;
}
