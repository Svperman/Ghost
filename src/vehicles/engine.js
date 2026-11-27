// Moteurs détaillés – générateur paramétrique (cotes en mm)
// Repère moteur : X = axe du vilebrequin (distribution côté −X, volant côté +X), Y = haut, Z = droite.
// Chaque rangée de cylindres est construite dans son propre repère (axe des cylindres = +Y local),
// tourné autour de l'axe du vilebrequin : 0° en ligne, ±45° pour un V8 à 90°, ±90° pour un moteur à plat.
import * as THREE from 'three';
import { Assembly, S } from '../core/builder.js';
import { ENGINE_TYPES } from './meta/engine.js';

const D2R = Math.PI / 180;
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
// profil 2D (x, y) extrudé en z  →  repère moteur : x→Y, y→Z, extrusion→X
const PERM_X = new THREE.Matrix4().set(0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1);
// profil 2D (x, y) extrudé en z  →  x→X, extrusion→Y, y→−Z
const PERM_Y = new THREE.Matrix4().set(1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1);
const r1 = (v) => Math.round(v * 10) / 10;

function extrude(shape, depth, perm, curveSegments = 24) {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments });
  g.translate(0, 0, -depth / 2);
  g.applyMatrix4(perm);
  return g;
}
function polyShape(pts) { return new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y))); }

/** Secteur d'anneau dans le plan YZ (angles depuis +Y vers +Z), épaisseur t selon X */
function ringX(rOut, rIn, a0, a1, t, seg = 32) {
  const pts = [];
  for (let i = 0; i <= seg; i++) { const a = (a0 + (a1 - a0) * i / seg) * D2R; pts.push([rOut * Math.cos(a), rOut * Math.sin(a)]); }
  for (let i = seg; i >= 0; i--) { const a = (a0 + (a1 - a0) * i / seg) * D2R; pts.push([rIn * Math.cos(a), rIn * Math.sin(a)]); }
  return { geo: extrude(polyShape(pts), t, PERM_X), dims: { 'Diamètre extérieur': r1(rOut * 2), 'Diamètre intérieur': r1(rIn * 2), Épaisseur: r1(rOut - rIn), Largeur: r1(t), 'Angle couvert': `${Math.round(a1 - a0)}°` } };
}
/** Secteur d'anneau dans le plan XZ, hauteur h selon Y */
function ringY(rOut, rIn, a0, a1, h, seg = 16) {
  const pts = [];
  for (let i = 0; i <= seg; i++) { const a = (a0 + (a1 - a0) * i / seg) * D2R; pts.push([rOut * Math.cos(a), rOut * Math.sin(a)]); }
  for (let i = seg; i >= 0; i--) { const a = (a0 + (a1 - a0) * i / seg) * D2R; pts.push([rIn * Math.cos(a), rIn * Math.sin(a)]); }
  return { geo: extrude(polyShape(pts), h, PERM_Y), dims: { 'Diamètre extérieur': r1(rOut * 2), 'Diamètre intérieur': r1(rIn * 2), Hauteur: r1(h) } };
}
/** Barre de section rectangulaire entre deux points (largeur w selon Z local, épaisseur t selon X) */
function beam(a, b, w, t) {
  const va = V3(...a), vb = V3(...b), L = va.distanceTo(vb);
  const g = new THREE.BoxGeometry(t, L, w);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), vb.clone().sub(va).normalize()));
  const m = va.clone().add(vb).multiplyScalar(0.5);
  g.translate(m.x, m.y, m.z);
  return { geo: g, dims: { Longueur: r1(L), Largeur: r1(w), Épaisseur: r1(t) } };
}
/** Oriente une forme (axe +Y d'origine vers dir) puis la place en p */
function orient(shape, dir, p) {
  shape.geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), dir.clone().normalize()));
  shape.geo.translate(p.x, p.y, p.z);
  return shape;
}
/** Enveloppe convexe 2D (chaîne monotone) */
function hull(points) {
  const p = points.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const q of p) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (const q of p.reverse()) { while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}

export function buildEngine(type = 'essence4') {
  const P = ENGINE_TYPES[type] || ENGINE_TYPES.essence4;
  const { bore, stroke, rodL, pitch, n } = P;
  const dsl = P.diesel;
  const r = stroke / 2;
  // --- Cotes dérivées (proportions usuelles) ---
  const ch = r1(bore * (dsl ? 0.6 : 0.36));        // hauteur de compression du piston
  const pistonH = r1(bore * (dsl ? 1.05 : 0.62));
  const deck = r1(r + rodL + ch + 0.6);           // hauteur du plan de joint au-dessus de l'axe du vilebrequin
  const mainD = Math.round(bore * (dsl ? 0.8 : 0.66));
  const pinD = Math.round(bore * (dsl ? 0.72 : 0.56));
  const rodW = Math.round(bore * (dsl ? 0.34 : 0.27));
  const webT = Math.round(bore * (dsl ? 0.22 : 0.19));
  const gudD = Math.round(bore * (dsl ? 0.42 : 0.27));
  const stemD = dsl ? 9 : 5.5;
  const vIn = r1(bore * (dsl ? 0.3 : 0.37)), vEx = r1(bore * (dsl ? 0.28 : 0.31));
  const valveL = r1(bore * (dsl ? 1.15 : 1.27));
  const bucketD = Math.round(bore * (dsl ? 0.3 : 0.36)), bucketH = dsl ? 30 : 24;
  const baseR = r1(bore * 0.19), lift = r1(bore * (dsl ? 0.1 : 0.12));
  const camD = Math.round(baseR * 1.45);
  const headFace = deck + 1.2;
  const valveFace = headFace + 2;
  const yTip = valveFace + valveL;
  const camY = r1(yTip + bucketH + baseR + 0.3);
  const coverTop = camY + baseR + lift + 30;
  const headW = r1(bore * 1.55);
  const vz = r1(bore * 0.21);                      // décalage des soupapes de part et d'autre de l'axe du cylindre
  const vx = r1(bore * 0.2);
  const cwR = r1(r * 0.95 + mainD * 0.4);         // rayon des contrepoids
  const sumpD = r1(bore * (dsl ? 1.5 : 1.25));
  const Yc = r1(cwR + 25 + sumpD + 60);           // axe du vilebrequin (moteur posé sur son carter)
  const theta0 = 30;                               // position angulaire du vilebrequin pour la vue
  const bm = dsl ? 14 : 9;                         // vis de bielle
  const hb = dsl ? 18 : 11;                        // vis de culasse

  const AN = { crank: [], cyl: [], valves: [], spin: [] }; // pièces animées
  const eng = new Assembly(P.label, { prefix: 'MO', code: 'MOT', layer: 'meca', desc: `${P.desc} – alésage ${bore} × course ${stroke} mm – entraxe de bielle ${rodL} mm – ordre d'allumage ${P.firing}` });

  // --- Rangées et cylindres ---
  let banks, cyls = [];
  if (P.layout === 'I') {
    banks = [{ a: 0, name: 'Culasse & cylindres', key: '', inSide: -1 }];
    const ph = n === 6 ? [0, 240, 120, 120, 240, 0] : n === 3 ? [0, 240, 120] : [0, 180, 180, 0];
    for (let i = 0; i < n; i++) cyls.push({ no: i + 1, b: 0, x: (i - (n - 1) / 2) * pitch, phi: ph[i] + theta0, throw: i });
  } else if (P.layout === 'V') {
    const A = P.angle / 2, m = n / 2;
    banks = [{ a: A, name: 'Rangée droite (cylindres 1 à 4)', key: 'D', inSide: -1 }, { a: -A, name: 'Rangée gauche (cylindres 5 à 8)', key: 'G', inSide: 1 }];
    const ph = [0, 90, 270, 180];
    for (let b = 0; b < 2; b++) for (let j = 0; j < m; j++) cyls.push({ no: b * m + j + 1, b, x: (j - (m - 1) / 2) * pitch + (b ? 1 : -1) * (rodW / 2 + 1), phi: ph[j] + theta0, throw: j });
  } else {
    const m = n / 2;
    banks = [{ a: 90, name: 'Rangée droite', key: 'D', inSide: -1 }, { a: -90, name: 'Rangée gauche', key: 'G', inSide: 1 }];
    for (let b = 0; b < 2; b++) for (let j = 0; j < m; j++) {
      const a = banks[b].a;
      cyls.push({ no: j * 2 + b + 1, b, x: (j - (m - 1) / 2) * pitch + (b ? 1 : -1) * pitch * 0.25, phi: a + (j % 2) * 180 + theta0, throw: j * 2 + b });
    }
  }
  // manetons du vilebrequin
  const throwMap = new Map();
  for (const c of cyls) {
    const t = throwMap.get(c.throw) || { x: 0, phi: c.phi, cyls: [] };
    t.cyls.push(c);
    throwMap.set(c.throw, t);
  }
  const throws = [...throwMap.values()].map((t) => ({ ...t, x: t.cyls.reduce((s, c) => s + c.x, 0) / t.cyls.length, w: t.cyls.length * (rodW + 1) + 1 })).sort((a, b) => a.x - b.x);
  const xMin = Math.min(...cyls.map((c) => c.x)) - pitch / 2 - 10, xMax = Math.max(...cyls.map((c) => c.x)) + pitch / 2 + 10;
  const xF = xMin - 20, xR = xMax + 20;          // faces avant (distribution) et arrière (volant)

  const bankGroups = banks.map((bk) => eng.group(bk.name, { code: `RG${bk.key}`, pos: [0, Yc, 0], rot: [bk.a, 0, 0], layer: 'struct', desc: P.layout === 'I' ? '' : `Rangée inclinée de ${bk.a > 0 ? '+' : ''}${bk.a}° autour de l'axe du vilebrequin` }));
  const toWorld = (b, v) => v.clone().applyAxisAngle(V3(1, 0, 0), banks[b].a * D2R).add(V3(0, Yc, 0));
  const toLocal = (b, v) => v.clone().sub(V3(0, Yc, 0)).applyAxisAngle(V3(1, 0, 0), -banks[b].a * D2R);

  // ======================================================================= Bloc-cylindres
  const blk = eng.group('Bloc-cylindres', { code: 'BLC', layer: 'struct', desc: P.block === 'fonte' ? 'Fonte à graphite vermiculaire (GJV)' : 'Aluminium AlSi9Cu3 coulé sous pression – chemises en fonte' });
  const bMat = P.block === 'fonte' ? 'fonte' : 'aluminium';
  const L = xMax - xMin;
  if (P.layout === 'I') {
    blk.part('Carter-cylindres (fonderie)', S.box(L, deck + mainD * 0.15, headW), { pos: [(xMin + xMax) / 2, Yc + (deck - mainD * 0.15) / 2, 0], mat: bMat });
  } else {
    const ch2 = P.layout === 'V' ? bore * 0.9 : bore * 0.7;
    blk.part('Carter de vilebrequin central (fonderie)', S.box(L, ch2 + mainD * 0.15, P.layout === 'V' ? bore * 1.5 : bore * 1.3), { pos: [(xMin + xMax) / 2, Yc + (ch2 - mainD * 0.15) / 2, 0], mat: bMat });
    for (let b = 0; b < banks.length; b++) {
      const bc = cyls.filter((c) => c.b === b), bx0 = Math.min(...bc.map((c) => c.x)) - pitch / 2, bx1 = Math.max(...bc.map((c) => c.x)) + pitch / 2;
      const y0 = deck * 0.42;
      bankGroups[b].part('Fût de rangée (fonderie)', S.box(bx1 - bx0, deck - y0, headW), { pos: [(bx0 + bx1) / 2, (deck + y0) / 2, 0], mat: bMat });
    }
    if (P.layout === 'V') blk.part('Couvercle de vallée (V)', S.box(L - 40, 6, bore * 0.9), { pos: [(xMin + xMax) / 2, Yc + bore * 1.05, 0], mat: 'aluminium', layer: 'ext' });
  }
  blk.part('Carter inférieur (bedplate / échelle de paliers)', S.box(L, cwR + 15 - mainD * 0.15, P.layout === 'I' ? headW : bore * 1.4), { pos: [(xMin + xMax) / 2, Yc - mainD * 0.15 - (cwR + 15 - mainD * 0.15) / 2, 0], mat: bMat, desc: 'Rigidifie les paliers de vilebrequin' });
  for (const c of cyls) {
    bankGroups[c.b].part(`Chemise du cylindre n°${c.no}`, S.tube(bore + 6, bore, stroke + pistonH * 0.9, 'y', 48), { pos: [c.x, deck - (stroke + pistonH * 0.9) / 2, 0], mat: 'fonte', desc: `Alésage ${bore} mm (tolérance H7 : +0 / +0,030 mm) – rodage plateau, rugosité Rz 3 à 5 µm` });
    bankGroups[c.b].part(`Gicleur de fond de piston n°${c.no}`, S.pipe([[c.x - bore * 0.3, deck - stroke - pistonH - 15, bore * 0.45], [c.x - bore * 0.25, deck - stroke - pistonH + 10, bore * 0.32], [c.x - bore * 0.15, deck - stroke - pistonH + 20, bore * 0.2]], 5), { mat: 'acier', desc: 'Refroidit le dessous du piston par jet d\'huile' });
  }
  blk.part('Bouchon de noyau (pastille de dessablage)', S.cyl(32, 6, 'z'), { pos: [0, Yc + deck * 0.55, (P.layout === 'I' ? headW : bore * 1.5) / 2 + 1], mat: 'laiton' });
  blk.part('Capteur de cliquetis', S.cyl(26, 22, 'z'), { pos: [0, Yc + deck * 0.4, -((P.layout === 'I' ? headW : bore * 1.5) / 2 + 11)], mat: 'plastique', layer: 'int', desc: 'Capteur piézoélectrique – vis M8, couple 20 N·m' });

  // ======================================================================= Vilebrequin & paliers
  const crk = eng.group(`Vilebrequin (${throws.length} manetons)`, { code: 'VIL', layer: 'sol', desc: `Acier forgé, tourillons Ø${mainD} mm, manetons Ø${pinD} mm, course ${stroke} mm` });
  AN.crank.push(crk.object);
  const mains = [];
  const webPts = (phi) => {
    const pts = [];
    const pr = pinD / 2 + 7;
    for (let t = -90; t <= 90; t += 15) pts.push([r + pr * Math.cos(t * D2R), pr * Math.sin(t * D2R)]);
    for (let t = 110; t <= 250; t += 10) pts.push([cwR * Math.cos(t * D2R), cwR * Math.sin(t * D2R)]);
    const c = Math.cos(phi * D2R), s = Math.sin(phi * D2R);
    return pts.map(([x, y]) => [x * c - y * s, x * s + y * c]);
  };
  throws.forEach((t, i) => {
    const pin = V3(t.x, Yc + r * Math.cos(t.phi * D2R), r * Math.sin(t.phi * D2R));
    const cylNos = t.cyls.map((c) => c.no).join(' et ');
    crk.part(`Maneton n°${i + 1} (cyl. ${cylNos})`, S.cyl(pinD, t.w, 'x', 40), { pos: [pin.x, pin.y, pin.z], mat: 'acierForge', desc: `Ø${pinD} mm (tolérance −0,009 / −0,025 mm) – rectifié, galeté` });
    for (const sd of [-1, 1]) {
      const g = extrude(polyShape(webPts(t.phi)), webT, PERM_X);
      g.translate(t.x + sd * (t.w / 2 + webT / 2), Yc, 0);
      crk.part(`Bras de manivelle avec contrepoids ${i + 1}${sd < 0 ? 'a' : 'b'}`, { geo: g, dims: { Épaisseur: webT, 'Rayon de manivelle': r, 'Rayon de contrepoids': cwR } }, { mat: 'acierForge' });
    }
    crk.part(`Canal de lubrification du maneton ${i + 1}`, S.rod([t.x, Yc, 0], [pin.x, pin.y, pin.z], 6), { mat: 'fonte', color: 0x222222, desc: 'Perçage Ø6 mm amenant l\'huile du tourillon au maneton' });
  });
  // tourillons : extrémités et entre manetons
  const ends = throws.map((t) => [t.x - t.w / 2 - webT, t.x + t.w / 2 + webT]);
  const jl = Math.round(bore * 0.3);
  const spans = [[ends[0][0] - jl, ends[0][0]]];
  for (let i = 0; i < ends.length - 1; i++) if (ends[i + 1][0] - ends[i][1] > 3) spans.push([ends[i][1], ends[i + 1][0]]);
  spans.push([ends[ends.length - 1][1], ends[ends.length - 1][1] + jl]);
  spans.forEach(([a, b], i) => {
    mains.push((a + b) / 2);
    crk.part(`Tourillon n°${i + 1}`, S.cyl(mainD, b - a, 'x', 48), { pos: [(a + b) / 2, Yc, 0], mat: 'acierForge', desc: `Ø${mainD} mm (tolérance −0,010 / −0,028 mm)` });
  });
  crk.part('Nez de vilebrequin', S.cyl(mainD * 0.7, xF - (spans[0][0] - 70) > 0 ? 70 : spans[0][0] - xF + 70, 'x'), { pos: [spans[0][0] - 35, Yc, 0], mat: 'acierForge' });
  crk.part('Plateau de volant (bride arrière)', S.cyl(mainD * 1.5, 14, 'x'), { pos: [spans[spans.length - 1][1] + 7, Yc, 0], mat: 'acierForge' });

  const pal = eng.group('Paliers de vilebrequin', { code: 'PAL', layer: 'struct' });
  const capH = mainD * 0.45, capW = Math.round(bore * 0.3);
  const thrust = Math.floor(mains.length / 2);
  mains.forEach((mx, i) => {
    const w = Math.min(capW, Math.max(12, (spans[i][1] - spans[i][0]) - 2));
    const g = pal.group(`Palier n°${i + 1}${i === thrust ? ' (palier de butée)' : ''}`, { code: 'PAL' });
    g.part('Coussinet supérieur', ringX(mainD / 2 + 2.2, mainD / 2 + 0.03, -90, 90, w - 2), { pos: [mx, Yc, 0], mat: 'regule', layer: 'sol', desc: 'Jeu de fonctionnement 0,025 à 0,060 mm – rainure et trou de graissage' });
    g.part('Coussinet inférieur', ringX(mainD / 2 + 2.2, mainD / 2 + 0.03, 90, 270, w - 2), { pos: [mx, Yc, 0], mat: 'regule', layer: 'sol' });
    g.part('Chapeau de palier', ringX(mainD / 2 + 2.2 + capH, mainD / 2 + 2.2, 90, 270, w), { pos: [mx, Yc, 0], mat: P.block === 'fonte' ? 'fonteGS' : 'fonte' });
    for (const sd of [-1, 1]) {
      const sh = orient(S.bolt(dsl ? 16 : 10, capH + 50), V3(0, -1, 0), V3(mx, Yc - mainD / 2 - capH - 2.2, sd * (mainD / 2 + capH * 0.55)));
      g.part(`Vis de chapeau de palier ${sd < 0 ? 'gauche' : 'droite'}`, sh, { mat: 'acierHR', couple: dsl ? '80 N·m + 90° + 90°' : '25 N·m + 90°', norme: 'ISO 4017' });
    }
    if (i === thrust) for (const sd of [-1, 1]) g.part(`Cale de jeu axial ${sd < 0 ? 'avant' : 'arrière'}`, ringX(mainD / 2 + 12, mainD / 2 + 2.5, 90, 270, 2.5), { pos: [mx + sd * (w / 2 + 1.3), Yc, 0], mat: 'bronze', layer: 'sol', desc: 'Jeu axial du vilebrequin 0,07 à 0,25 mm' });
  });

  // ======================================================================= Équipage mobile (pistons & bielles)
  for (const c of cyls) {
    const bk = banks[c.b], B = bankGroups[c.b];
    const rel = (c.phi - bk.a) * D2R;
    const big = V3(c.x, r * Math.cos(rel), r * Math.sin(rel));
    const pinY = big.y + Math.sqrt(rodL ** 2 - big.z ** 2);
    const small = V3(c.x, pinY, 0);
    const u = small.clone().sub(big).normalize();
    const beta = Math.atan2(u.z, u.y) / D2R;
    const perp = V3(0, -u.z, u.y);
    const yTop = pinY + ch;
    const pg = B.group(`Piston n°${c.no}`, { code: 'PIS', layer: 'sol', desc: `Piston ${dsl ? 'acier / aluminium à bol de combustion' : 'aluminium forgé'} – Ø${bore} mm, hauteur de compression ${ch} mm` });
    const hc = r1(bore * (dsl ? 0.28 : 0.2));
    pg.part('Tête de piston (calotte et porte-segments)', S.cyl(bore - 0.5, hc, 'y', 48), { pos: [c.x, yTop - hc / 2, 0], mat: dsl ? 'acier' : 'alu_forge', desc: 'Jeu piston / cylindre 0,03 à 0,05 mm (mesuré sur la jupe)' });
    if (dsl) pg.part('Bol de combustion (chambre en ω)', S.revolve([[0, -bore * 0.1], [bore * 0.12, -bore * 0.13], [bore * 0.27, -bore * 0.09], [bore * 0.33, -0.5], [bore * 0.34, 0.2]], 'y', 40), { pos: [c.x, yTop, 0], mat: 'fonte', color: 0x3a3a3a });
    else for (const k of [-1, 1]) pg.part(`Évidement de soupape ${k < 0 ? 'admission' : 'échappement'}`, S.cyl(vIn * 0.95, 0.8, 'y', 32), { pos: [c.x, yTop + 0.3, k * bk.inSide * -vz], mat: 'alu_forge', color: 0x9aa0a6 });
    pg.part('Jupe de piston (revêtement graphite)', S.tube(bore - 0.08, bore - 0.08 - bore * 0.1, pistonH - hc, 'y', 48), { pos: [c.x, yTop - hc - (pistonH - hc) / 2, 0], mat: 'alu_forge', color: 0x5a5d62 });
    const rings = dsl
      ? [['Segment de feu trapézoïdal (porte-segment Ni-Resist)', 3, 0.05], ['Segment d\'étanchéité à bec', 2.5, 0.1], ['Segment racleur à ressort', 4, 0.15]]
      : [['Segment de feu (chromé)', 1.2, 0.06], ['Segment d\'étanchéité (bec d\'aigle)', 1.2, 0.1], ['Segment racleur – lame supérieure', 0.4, 0.138], ['Segment racleur – expandeur', 1.5, 0.147], ['Segment racleur – lame inférieure', 0.4, 0.156]];
    for (const [nm, h, f] of rings) {
      const rad = nm.includes('expandeur') ? bore * 0.035 : bore * (dsl ? 0.045 : 0.04);
      pg.part(nm, S.tube(bore - 0.04, bore - 0.04 - 2 * rad, h, 'y', 64), { pos: [c.x, yTop - bore * f, 0], mat: nm.includes('feu') ? 'chrome' : 'fonte', desc: nm.includes('expandeur') ? 'Ressort expandeur ondulé' : `Hauteur ${h} mm – jeu à la coupe 0,20 à 0,40 mm – jeu dans la gorge 0,02 à 0,07 mm` });
    }
    const gl = r1(bore * 0.82);
    pg.part('Axe de piston (flottant)', S.tube(gudD, gudD * 0.55, gl, 'x', 32), { pos: [small.x, small.y, 0], mat: 'acierForge', desc: `Ø${gudD} mm – cémenté, rectifié` });
    for (const sd of [-1, 1]) pg.part(`Jonc d'arrêt d'axe ${sd < 0 ? 'avant' : 'arrière'}`, S.torus(gudD + 1.2, 1.2, 'x', 24), { pos: [small.x + sd * (gl / 2 + 0.7), small.y, 0], mat: 'acierHR' });

    AN.cyl.push({ c, pg: pg.object, rel0: rel, pinY0: pinY, small0: small.clone(), beta0: beta * D2R });
    const rg = B.group(`Bielle n°${c.no}`, { code: 'BIE', layer: 'sol', desc: `Bielle forgée fracturée (cracking) – entraxe ${rodL} mm` });
    AN.cyl[AN.cyl.length - 1].rg = rg.object;
    const bigR = pinD / 2 + 2 + bore * 0.09, smallR = gudD / 2 + 2 + bore * 0.06;
    rg.part('Corps de bielle (section en I)', beam(big.clone().addScaledVector(u, bigR - 3).toArray(), small.clone().addScaledVector(u, -smallR + 3).toArray(), bore * 0.17, rodW * 0.8), { mat: 'acierForge' });
    rg.part('Nervure du corps (âme du I)', beam(big.clone().addScaledVector(u, bigR - 3).toArray(), small.clone().addScaledVector(u, -smallR + 3).toArray(), bore * 0.09, rodW * 0.98), { mat: 'acierForge' });
    rg.part('Pied de bielle', ringX(smallR, gudD / 2 + 2, 0, 360, rodW * 0.75), { pos: [small.x, small.y, 0], mat: 'acierForge' });
    rg.part('Bague de pied de bielle', ringX(gudD / 2 + 2, gudD / 2 + 0.01, 0, 360, rodW * 0.75), { pos: [small.x, small.y, 0], mat: 'bronze', desc: 'Jeu axe / bague 0,005 à 0,015 mm' });
    rg.part('Demi-tête de bielle', ringX(bigR, pinD / 2 + 2, beta - 90, beta + 90, rodW), { pos: [big.x, big.y, big.z], mat: 'acierForge' });
    rg.part('Chapeau de bielle', ringX(bigR, pinD / 2 + 2, beta + 90, beta + 270, rodW), { pos: [big.x, big.y, big.z], mat: 'acierForge' });
    rg.part('Coussinet de bielle supérieur', ringX(pinD / 2 + 2, pinD / 2 + 0.03, beta - 90, beta + 90, rodW - 2), { pos: [big.x, big.y, big.z], mat: 'regule', desc: 'Jeu de fonctionnement 0,020 à 0,055 mm' });
    rg.part('Coussinet de bielle inférieur', ringX(pinD / 2 + 2, pinD / 2 + 0.03, beta + 90, beta + 270, rodW - 2), { pos: [big.x, big.y, big.z], mat: 'regule' });
    for (const sd of [-1, 1]) {
      const p = big.clone().addScaledVector(perp, sd * (pinD / 2 + 2 + bore * 0.045)).addScaledVector(u, -(bigR + 1));
      rg.part(`Vis de bielle ${sd < 0 ? 'A' : 'B'}`, orient(S.bolt(bm, r1(bigR * 1.7)), u.clone().negate(), p), { mat: 'acierHR', couple: dsl ? '60 N·m + 90° + 90°' : '20 N·m + 70°', norme: 'Vis à tige allégée, classe 12.9' });
    }
  }

  // ======================================================================= Culasses, soupapes, arbres à cames
  banks.forEach((bk, b) => {
    const B = bankGroups[b];
    const bc = cyls.filter((c) => c.b === b);
    const bx0 = Math.min(...bc.map((c) => c.x)) - pitch / 2 - 5, bx1 = Math.max(...bc.map((c) => c.x)) + pitch / 2 + 5, bxc = (bx0 + bx1) / 2, bL = bx1 - bx0;
    const cu = B.group('Culasse', { code: `CU${bk.key}`, layer: 'struct', desc: `Culasse aluminium AlSi7Mg T6 – ${bc.length * P.valves} soupapes` });
    cu.part('Culasse (fonderie)', S.box(bL, camY - headFace, headW), { pos: [bxc, (camY + headFace) / 2, 0], mat: 'aluminium', desc: 'Planéité du plan de joint : 0,05 mm maximum' });
    // joint de culasse avec ses perçages
    const gs = new THREE.Shape([V3(bx0, -headW / 2), V3(bx1, -headW / 2), V3(bx1, headW / 2), V3(bx0, headW / 2)].map((v) => new THREE.Vector2(v.x, v.y)));
    for (const c of bc) { const h = new THREE.Path(); h.absarc(c.x, 0, bore / 2 + 0.6, 0, Math.PI * 2, true); gs.holes.push(h); }
    for (let k = 0; k <= bc.length; k++) for (const sd of [-1, 1]) { const h = new THREE.Path(); h.absarc(bx0 + 5 + k * pitch, sd * headW * 0.4, hb / 2 + 1, 0, Math.PI * 2, true); gs.holes.push(h); }
    const gk = new THREE.ExtrudeGeometry(gs, { depth: 1.2, bevelEnabled: false, curveSegments: 32 });
    gk.applyMatrix4(PERM_Y);
    gk.translate(0, deck, 0);
    cu.part('Joint de culasse multicouche (MLS)', { geo: gk, dims: { Longueur: r1(bL), Largeur: headW, 'Épaisseur serrée': 1.2, 'Diamètre des passages de cylindre': r1(bore + 1.2) } }, { mat: 'mls', desc: 'Joint 3 couches acier inoxydable – à remplacer à chaque dépose' });
    for (let k = 0; k <= bc.length; k++) for (const sd of [-1, 1]) {
      const p = V3(bx0 + 5 + k * pitch, camY - 18, sd * headW * 0.4);
      const Lb = r1(camY - 18 - deck + bore * 0.7);
      cu.part(`Vis de culasse ${sd < 0 ? 'A' : 'B'}${k + 1}`, orient(S.bolt(hb, Lb), V3(0, 1, 0), p), { mat: 'acierHR', couple: dsl ? '100 N·m + 150 N·m + 90° + 90°' : '30 N·m + 90° + 90° (vis à usage unique)', norme: 'Vis à étirement contrôlé' });
      cu.part(`Rondelle de vis de culasse ${sd < 0 ? 'A' : 'B'}${k + 1}`, S.washer(hb), { pos: [p.x, p.y - 1, p.z], mat: 'zingue' });
    }
    // bougies / injecteurs
    for (const c of bc) {
      if (dsl) {
        cu.part(`Injecteur piézoélectrique n°${c.no}`, S.cyl(17, valveL * 0.95, 'y'), { pos: [c.x, valveFace + valveL * 0.5, 0], mat: 'inox', layer: 'int', desc: 'Injection directe rampe commune – 8 trous Ø0,13 mm – 2 500 bar' });
        cu.part(`Bride d'injecteur n°${c.no}`, S.box(40, 10, 25), { pos: [c.x + 25, yTip - 10, 0], mat: 'acier', layer: 'int' });
        cu.part(`Rondelle d'étanchéité d'injecteur n°${c.no}`, S.tube(18, 8, 2, 'y'), { pos: [c.x, valveFace + 4, 0], mat: 'cuivre', layer: 'int' });
      } else {
        const ys = headFace + 9;
        cu.part(`Bougie n°${c.no} – culot fileté M12`, S.cyl(12, 19, 'y', 24), { pos: [c.x, ys + 9.5, 0], mat: 'zingue', layer: 'int', desc: 'Filetage M12 × 1,25 – portée 19 mm – écartement des électrodes 0,7 mm – couple 23 N·m' });
        cu.part(`Bougie n°${c.no} – électrodes iridium`, S.cyl(2.5, 3, 'y', 12), { pos: [c.x, ys - 1.5, 0], mat: 'inox', layer: 'int' });
        cu.part(`Bougie n°${c.no} – six pans 14`, S.hex(14, 10), { pos: [c.x, ys + 24, 0], mat: 'zingue', layer: 'int' });
        cu.part(`Bougie n°${c.no} – isolant céramique`, S.cyl(10, 30, 'y', 20), { pos: [c.x, ys + 44, 0], mat: 'ceramique', layer: 'int' });
        cu.part(`Bobine crayon n°${c.no}`, S.cyl(24, coverTop - ys - 40 + 25, 'y', 20), { pos: [c.x, (coverTop + ys + 60) / 2 + 10, 0], mat: 'plastique', layer: 'ext' });
        cu.part(`Injecteur essence haute pression n°${c.no}`, S.cyl(14, 70, 'y'), { pos: [c.x, headFace + 30, bk.inSide * (headW / 2 - 10)], rot: [bk.inSide * -50, 0, 0], mat: 'inox', layer: 'int', desc: 'Injection directe 350 bar – 6 trous' });
      }
    }
    // soupapes
    for (const c of bc) {
      const vg = cu.group(`Soupapes du cylindre n°${c.no}`, { code: `SO${bk.key}`, layer: 'meca' });
      for (const [lab, side, hd] of [['admission', bk.inSide, vIn], ['échappement', -bk.inSide, vEx]]) {
        for (const k of ['a', 'b']) {
          const px = c.x + (k === 'a' ? -vx : vx), pz = side * vz;
          const sg = vg.group(`Soupape d'${lab} ${c.no}${k}`, { code: `SO${bk.key}` });
          const hR = hd / 2, sR = stemD / 2;
          const sv = S.revolve([[0, 0], [hR, 0], [hR, 1.8], [hR * 0.62, hR * 0.38 + 3], [sR, hR * 0.95 + 6], [sR, valveL - 1], [sR - 0.5, valveL], [0, valveL]], 'y', 32);
          sv.dims = { 'Diamètre de tête': r1(hd), 'Diamètre de queue': stemD, Longueur: valveL, 'Angle de portée': '45°', 'Jeu queue / guide': '0,02 à 0,05 mm' };
          const VA = { c, lab, mv: [] };
          AN.valves.push(VA);
          VA.mv.push(sg.part('Soupape', sv, { pos: [px, valveFace, pz], mat: lab === 'admission' ? 'acierSoupape' : 'nimonic', desc: lab === 'échappement' ? 'Queue remplie de sodium (refroidissement)' : '' }));
          sg.part('Siège de soupape rapporté', S.tube(hd + 4, hd - 3, 6, 'y', 40), { pos: [px, valveFace + 3, pz], mat: 'bronze', desc: 'Portée à 45°, largeur 1,2 à 1,6 mm' });
          const gL = r1(valveL * 0.38);
          sg.part('Guide de soupape', S.tube(stemD + 6, stemD + 0.03, gL, 'y', 24), { pos: [px, valveFace + valveL * 0.4, pz], mat: 'bronze' });
          sg.part('Joint de queue de soupape', S.tube(stemD + 9, stemD, 8, 'y', 24), { pos: [px, valveFace + valveL * 0.4 + gL / 2 + 4, pz], mat: 'fkm' });
          const spD = r1(bucketD * 0.74), spH = r1(valveL * 0.36), spW = dsl ? 4.8 : 3.2;
          const ySB = yTip - 8 - spH;
          sg.part('Coupelle inférieure de ressort', S.tube(spD + 5, stemD + 6.5, 1.5, 'y', 32), { pos: [px, ySB - 0.75, pz], mat: 'acier' });
          VA.spH = spH;
          VA.spring = sg.part('Ressort de soupape', S.spring(spD, spW, spH, 6.5), { pos: [px, ySB + spH / 2, pz], mat: 'acier', color: 0x2f6fb0, desc: `Fil Ø${spW} mm – raideur ≈ ${dsl ? 60 : 35} N/mm – tarage fermé ≈ ${dsl ? 450 : 230} N` });
          VA.mv.push(sg.part('Coupelle supérieure', S.revolve([[sR + 1.6, 0], [spD / 2 + 2.5, 0], [spD / 2 + 2.5, 2], [sR + 3.5, 7], [sR + 1.6, 7]], 'y', 32), { pos: [px, yTip - 9, pz], mat: 'titane' }));
          for (const q of [0, 1]) VA.mv.push(sg.part(`Demi-clavette ${q + 1}`, ringY(sR + 1.6, sR + 0.01, q * 180 + 6, q * 180 + 174, 7), { pos: [px, yTip - 5.5, pz], mat: 'acierHR', desc: 'Clavette à 3 gorges' }));
          VA.mv.push(sg.part('Poussoir à coupelle (pastille de réglage intégrée)', S.cyl(bucketD, bucketH, 'y', 32), { pos: [px, yTip + bucketH / 2 + 0.15, pz], mat: 'acierHR', desc: `Jeu aux soupapes à froid : ${lab === 'admission' ? '0,20 à 0,30' : '0,30 à 0,40'} mm` }));
          // came
          const lobeAng = (lab === 'admission' ? 0 : 120) + (c.phi - bk.a) * 0.5 + (k === 'a' ? 0 : 2);
          const pts = [];
          for (let i = 0; i < 72; i++) {
            const th = (i / 72) * Math.PI * 2;
            let d = th - lobeAng * D2R; d = Math.atan2(Math.sin(d), Math.cos(d));
            const rr = baseR + (Math.abs(d) < 1.2 ? lift * (0.5 + 0.5 * Math.cos(Math.PI * d / 1.2)) : 0);
            pts.push([rr * Math.cos(th), rr * Math.sin(th)]);
          }
          const lg = extrude(polyShape(pts), bucketD * 0.55, PERM_X, 4);
          lg.translate(px, camY, pz);
          const camGrp = vg; // les cames sont rangées avec les soupapes qu'elles commandent
          VA.lobeAng = lobeAng; VA.pivot = V3(0, camY, pz);
          VA.lobe = camGrp.part(`Came d'${lab} ${c.no}${k}`, { geo: lg, dims: { 'Rayon de base': baseR, Levée: lift, Largeur: r1(bucketD * 0.55) } }, { mat: 'fonteGS', desc: `Levée de soupape ${lift} mm` });
        }
      }
    }
    // arbres à cames
    const ac = B.group('Arbres à cames', { code: `AC${bk.key}`, layer: 'meca' });
    for (const [lab, side] of [['admission', bk.inSide], ['échappement', -bk.inSide]]) {
      const z = side * vz;
      ac.part(`Arbre à cames d'${lab} (tube)`, S.cyl(camD, bL + 40, 'x', 32), { pos: [bxc - 20, camY, z], mat: 'acierForge', desc: 'Arbre assemblé – cames emmanchées à chaud' });
      bc.forEach((c, i) => {
        ac.part(`Portée d'arbre à cames ${lab} n°${i + 1}`, S.cyl(camD + 6, 18, 'x', 32), { pos: [c.x, camY, z], mat: 'acierForge' });
        ac.part(`Chapeau de palier d'arbre à cames ${lab} n°${i + 1}`, ringX(camD / 2 + 3 + 10, camD / 2 + 3, -90, 90, 20), { pos: [c.x, camY, z], mat: 'aluminium', layer: 'struct' });
        for (const sd of [-1, 1]) ac.part(`Vis de chapeau d'AAC ${lab} ${i + 1}${sd < 0 ? 'a' : 'b'}`, S.bolt(6, 30), { pos: [c.x, camY + 6, z + sd * (camD / 2 + 9)], mat: 'acierHR', couple: '10 N·m' });
      });
      ac.part(`${P.layout === 'I' && dsl ? 'Pignon' : 'Déphaseur VVT (pignon)'} d'arbre à cames ${lab}`, S.cyl(bore * 1.15, 22, 'x', 48), { pos: [bx0 - 50, camY, z], mat: 'acier', desc: dsl ? '' : 'Déphaseur hydraulique à palettes – plage 50° vilebrequin' });
      ac.part(`Vis centrale de pignon d'AAC ${lab}`, orient(S.bolt(12, 40), V3(-1, 0, 0), V3(bx0 - 62, camY, z)), { mat: 'acierHR', couple: '60 N·m + 90°' });
      ac.part(`Cible de capteur d'arbre à cames ${lab}`, ringX(camD / 2 + 14, camD / 2, 0, 200, 4), { pos: [bx1 + 8, camY, z], mat: 'acier' });
    }
    ac.part('Capteur de position d\'arbre à cames', S.cyl(18, 40, 'x'), { pos: [bx1 + 35, camY + 25, bk.inSide * vz], mat: 'plastique', layer: 'int' });
    // couvre-culasse
    const cc = B.group('Couvre-culasse', { code: `CC${bk.key}`, layer: 'ext' });
    cc.part('Couvre-culasse', S.box(bL, coverTop - camY, headW - 6), { pos: [bxc, (coverTop + camY) / 2, 0], mat: dsl ? 'composite' : 'aluminium', color: dsl ? 0x2a2c30 : 0xb31b1b });
    cc.part('Joint de couvre-culasse', S.box(bL - 8, 3, headW - 12), { pos: [bxc, camY + 1.5, 0], mat: 'fkm' });
    cc.part('Bouchon de remplissage d\'huile', S.cyl(45, 22, 'y'), { pos: [bx0 + bL * 0.2, coverTop + 11, 0], mat: 'plastique', color: 0xd4a017 });
    cc.part('Reniflard (séparateur d\'huile)', S.box(80, 30, 50), { pos: [bx1 - 60, coverTop + 15, -bk.inSide * headW * 0.25], mat: 'plastique' });
    const nv = Math.max(4, Math.round(bL / 90));
    for (let k = 0; k < nv; k++) for (const sd of [-1, 1]) cc.part(`Vis de couvre-culasse ${sd < 0 ? 'A' : 'B'}${k + 1}`, S.capScrew(6, 25), { pos: [bx0 + 20 + k * (bL - 40) / (nv - 1), coverTop + 1, sd * (headW / 2 - 12)], mat: 'zingue', couple: '10 N·m' });
  });

  // ======================================================================= Distribution (côté −X)
  const dis = eng.group('Distribution par chaîne', { code: 'DIS', layer: 'meca', desc: 'Chaîne silencieuse à maillons dentés – rapport vilebrequin / arbres à cames 2:1' });
  const rc = r1(bore * 0.27);
  const xd = xF - 15;
  AN.spin.push({ k: 1, C: V3(0, Yc, 0), o: dis.part('Pignon de vilebrequin', S.cyl(rc * 2, 20, 'x', 48), { pos: [xd, Yc, 0], mat: 'acierHR' }) });
  const sprockets = [[0, Yc, rc]];
  banks.forEach((bk, b) => { for (const side of [-1, 1]) { const w = toWorld(b, V3(0, camY, side * vz)); sprockets.push([w.z, w.y, bore * 0.575]); } });
  const hp = [];
  for (const [z0, y0, rr] of sprockets) for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; hp.push([z0 + (rr + 4) * Math.cos(a), y0 + (rr + 4) * Math.sin(a)]); }
  const H = hull(hp);
  dis.part('Chaîne de distribution', S.pipe(H.filter((_, i) => i % 2 === 0).map(([z, y]) => [xd - 30, y, z]), 8, true), { mat: 'acier', desc: `${Math.round(H.length * 3)} maillons environ – allongement maxi 0,5 %` });
  const zr = Math.max(...H.map((p) => p[0])), zl = Math.min(...H.map((p) => p[0]));
  dis.part('Tendeur hydraulique de chaîne', S.cyl(30, 70, 'z'), { pos: [xd - 30, Yc + deck * 0.55, zr + 30], mat: 'aluminium' });
  dis.part('Patin tendeur', S.box(18, deck * 0.7, 16), { pos: [xd - 30, Yc + deck * 0.55, zr + 6], mat: 'plastique', color: 0x2a2c30 });
  dis.part('Guide de chaîne fixe', S.box(18, deck * 0.7, 16), { pos: [xd - 30, Yc + deck * 0.55, zl - 6], mat: 'plastique', color: 0x2a2c30 });
  const yMaxD = Math.max(...H.map((p) => p[1])), yMinD = Math.min(...H.map((p) => p[1]));
  dis.part('Carter de distribution', S.box(8, yMaxD - yMinD + 60, zr - zl + 80), { pos: [xd - 65, (yMaxD + yMinD) / 2, (zr + zl) / 2], mat: 'aluminium', layer: 'ext' });
  dis.part('Joint spi de vilebrequin avant', ringX(mainD * 0.35 + 9, mainD * 0.35, 0, 360, 8), { pos: [xd - 65, Yc, 0], mat: 'fkm', layer: 'ext' });
  AN.spin.push({ k: 1, C: V3(0, Yc, 0), o: dis.part('Poulie d\'amortisseur de vilebrequin (damper)', S.cyl(bore * 1.9, 32, 'x', 64), { pos: [xd - 95, Yc, 0], mat: 'fonte', layer: 'int', desc: 'Amortisseur de vibrations de torsion – masse sur élastomère' }) });
  dis.part('Vis de poulie de vilebrequin', orient(S.bolt(dsl ? 20 : 14, 60), V3(-1, 0, 0), V3(xd - 112, Yc, 0)), { mat: 'acierHR', couple: dsl ? '300 N·m + 90°' : '100 N·m + 180°', layer: 'int' });

  // ======================================================================= Volant moteur (côté +X)
  const vo = eng.group('Volant moteur', { code: 'VOL', layer: 'sol' });
  AN.crank.push(vo.object);
  const fwD = r1(bore * (dsl ? 3.6 : 3.4));
  const xv = spans[spans.length - 1][1] + 14 + 18;
  vo.part('Volant moteur bimasse', S.cyl(fwD, 36, 'x', 72), { pos: [xv, Yc, 0], mat: 'fonte', desc: 'Volant bimasse – ressorts arqués' });
  vo.part('Couronne de démarreur', S.tube(fwD + 20, fwD - 4, 16, 'x', 96), { pos: [xv + 8, Yc, 0], mat: 'acierHR', desc: `${Math.round((fwD + 20) / 2.5)} dents environ – module 2,5` });
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; vo.part(`Vis de volant moteur ${i + 1}`, orient(S.capScrew(10, 22), V3(1, 0, 0), V3(xv + 18, Yc + Math.cos(a) * mainD * 0.55, Math.sin(a) * mainD * 0.55)), { mat: 'acierHR', couple: dsl ? '60 N·m + 90°' : '45 N·m + 90°' }); }
  vo.part('Joint spi de vilebrequin arrière', ringX(mainD * 0.75 + 10, mainD * 0.75, 0, 360, 8), { pos: [xR - 4, Yc, 0], mat: 'fkm', layer: 'ext' });
  vo.part('Cible du capteur de vilebrequin (60−2 dents)', ringX(fwD / 2 - 15, fwD / 2 - 30, 0, 348, 4), { pos: [xv - 22, Yc, 0], mat: 'acier' });
  eng.part('Capteur de position de vilebrequin (PMH)', S.cyl(16, 45, 'y'), { pos: [xv - 22, Yc + fwD / 2 - 10 + 22, 0], mat: 'plastique', layer: 'int', desc: 'Capteur inductif à effet Hall – entrefer 0,5 à 1,5 mm' });

  // ======================================================================= Lubrification
  const lub = eng.group('Lubrification', { code: 'LUB', layer: 'ext' });
  const sumpTop = Yc - cwR - 15;
  const sW = P.layout === 'I' ? headW : bore * 1.4;
  lub.part('Carter d\'huile', S.box(L - 20, sumpD, sW - 10), { pos: [(xMin + xMax) / 2, sumpTop - sumpD / 2, 0], mat: dsl ? 'acier' : 'aluminium', desc: `Capacité ≈ ${dsl ? 38 : P.n * 1.1} L avec filtre` });
  lub.part('Joint de carter d\'huile', S.box(L - 26, 2, sW - 16), { pos: [(xMin + xMax) / 2, sumpTop - 1, 0], mat: 'fkm' });
  const nsv = Math.max(5, Math.round(L / 80));
  for (let k = 0; k < nsv; k++) for (const sd of [-1, 1]) lub.part(`Vis de carter d'huile ${sd < 0 ? 'A' : 'B'}${k + 1}`, orient(S.capScrew(6, 20), V3(0, -1, 0), V3(xMin + 20 + k * (L - 40) / (nsv - 1), sumpTop - 8, sd * (sW / 2 - 12))), { mat: 'zingue', couple: '10 N·m' });
  lub.part('Bouchon de vidange', orient(S.bolt(14, 14), V3(0, -1, 0), V3(xMax - 80, sumpTop - sumpD - 1, 0)), { mat: 'acier', couple: '25 N·m' });
  lub.part('Joint de bouchon de vidange', S.tube(22, 14.2, 2, 'y'), { pos: [xMax - 80, sumpTop - sumpD - 1, 0], mat: 'cuivre' });
  const pm = lub.group('Pompe à huile à rotors', { code: 'LUB', layer: 'meca', desc: 'Pompe à cylindrée variable – pression 1,5 à 5 bar' });
  const pz = 0, py = Yc - cwR + 10;
  pm.part('Corps de pompe à huile', S.cyl(bore * 1.1, 30, 'x', 48), { pos: [xd - 20, py, pz], mat: 'aluminium' });
  pm.part('Rotor extérieur (5 lobes)', ringX(bore * 0.45, bore * 0.32, 0, 360, 14), { pos: [xd - 20, py, pz], mat: 'acierHR' });
  pm.part('Rotor intérieur (4 lobes)', S.cyl(bore * 0.5, 14, 'x', 4), { pos: [xd - 20, py, pz + 3], mat: 'acierHR' });
  pm.part('Clapet de décharge', S.cyl(10, 40, 'z'), { pos: [xd - 20, py - 20, pz + bore * 0.4], mat: 'acier' });
  lub.part('Crépine d\'aspiration', S.pipe([[xd - 20, py, 0], [xd + 30, py - 30, 0], [xd + 100, sumpTop - sumpD + 25, 0]], 18), { mat: 'acier', layer: 'meca' });
  lub.part('Tamis de crépine', S.cyl(70, 8, 'y'), { pos: [xd + 100, sumpTop - sumpD + 20, 0], mat: 'inox', layer: 'meca' });
  const fz = -(sW / 2 + 45);
  lub.part('Filtre à huile (cartouche)', S.cyl(dsl ? 110 : 76, dsl ? 260 : 100, 'z', 32), { pos: [(xMin + xMax) / 2 - bore * 0.5, Yc + 10, fz - (dsl ? 100 : 20)], mat: 'peinture', color: 0x1f4fa0, layer: 'int' });
  lub.part('Support de filtre & échangeur huile / eau', S.box(bore * 1.1, bore, 40), { pos: [(xMin + xMax) / 2 - bore * 0.5, Yc + 10, -(sW / 2 + 20)], mat: 'aluminium', layer: 'int' });
  lub.part('Mano-contact de pression d\'huile', S.cyl(20, 35, 'z'), { pos: [(xMin + xMax) / 2 + bore * 0.5, Yc + 30, -(sW / 2 + 18)], mat: 'laiton', layer: 'int' });
  lub.part('Tube de jauge à huile', S.pipe([[xMin + 60, sumpTop - 20, sW / 2 - 15], [xMin + 60, Yc + deck * 0.5, sW / 2 + 20], [xMin + 50, Yc + deck + 40, sW / 2 + 20]], 12), { mat: 'acier', layer: 'int' });
  lub.part('Jauge à huile (poignée)', S.box(30, 15, 20), { pos: [xMin + 50, Yc + deck + 50, sW / 2 + 20], mat: 'plastique', color: 0xd4a017, layer: 'int' });

  // ======================================================================= Refroidissement
  const ref = eng.group('Refroidissement', { code: 'REF', layer: 'int' });
  const wpY = Yc + deck * 0.45, wpZ = P.layout === 'I' ? bore * 0.45 : 0;
  ref.part('Corps de pompe à eau', S.cyl(bore * 1.15, 40, 'x', 40), { pos: [xd - 60, wpY, wpZ], mat: 'aluminium' });
  AN.spin.push({ k: 1.3, C: V3(0, wpY, wpZ), o: ref.part('Moyeu de turbine de pompe à eau', S.cyl(30, 25, 'x'), { pos: [xd - 40, wpY, wpZ], mat: 'acier' }) });
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    AN.spin.push({ k: 1.3, C: V3(0, wpY, wpZ), o: ref.part(`Aube de turbine de pompe à eau ${i + 1}`, S.box(18, bore * 0.3, 2.5), { pos: [xd - 40, wpY + Math.cos(a) * bore * 0.25, wpZ + Math.sin(a) * bore * 0.25], rot: [-a / D2R, 0, 0], mat: 'acier' }) });
  }
  ref.part('Poulie de pompe à eau', S.cyl(bore * 0.9, 25, 'x'), { pos: [xd - 95, wpY, wpZ], mat: 'acier' });
  ref.part('Boîtier de thermostat', S.box(70, 60, 70), { pos: [xR - 60, Yc + deck + 30, P.layout === 'I' ? -headW / 2 - 20 : 0], mat: 'composite', color: 0x2a2c30 });
  ref.part('Thermostat à cire (ouverture 90 °C)', S.cyl(52, 40, 'z'), { pos: [xR - 60, Yc + deck + 30, P.layout === 'I' ? -headW / 2 - 50 : 40], mat: 'laiton' });
  ref.part('Sonde de température de liquide', S.cyl(14, 35, 'y'), { pos: [xR - 20, Yc + deck + 70, P.layout === 'I' ? -headW / 2 - 20 : 0], mat: 'laiton' });

  // ======================================================================= Admission & injection
  const adm = eng.group('Admission & alimentation', { code: 'ADM', layer: 'int' });
  const portY = headFace + (camY - headFace) * 0.35;
  let plenum;
  if (P.layout === 'V') plenum = V3((xMin + xMax) / 2, Yc + deck * 1.15, 0);
  else if (P.layout === 'B') plenum = V3((xMin + xMax) / 2, Yc + bore * 1.6, 0);
  else plenum = toWorld(0, V3(0, portY + bore * 0.3, banks[0].inSide * (headW / 2 + bore * 1.0)));
  adm.part('Répartiteur d\'admission (plénum)', S.box(L * 0.9, bore * 0.9, bore * 0.9), { pos: plenum.toArray(), mat: dsl ? 'aluminium' : 'composite', color: dsl ? undefined : 0x2a2c30 });
  for (const c of cyls) {
    const port = toWorld(c.b, V3(c.x, portY, banks[c.b].inSide * (headW / 2)));
    const mid = toWorld(c.b, V3(c.x, portY + bore * 0.2, banks[c.b].inSide * (headW / 2 + bore * 0.35)));
    adm.part(`Pipe d'admission n°${c.no}`, S.pipe([port.toArray(), mid.toArray(), [c.x * 0.9 + plenum.x * 0.1, plenum.y, plenum.z]], bore * 0.42), { mat: dsl ? 'aluminium' : 'composite', color: dsl ? undefined : 0x2a2c30 });
    adm.part(`Joint de pipe d'admission n°${c.no}`, S.tube(bore * 0.55, bore * 0.4, 3, 'z'), { pos: toWorld(c.b, V3(c.x, portY, banks[c.b].inSide * (headW / 2 + 1.5))).toArray(), rot: [banks[c.b].a, 0, 0], mat: 'fkm' });
  }
  adm.part(dsl ? 'Volet d\'admission (doseur EGR)' : 'Boîtier papillon motorisé Ø60', S.cyl(bore * 0.95, 60, 'x', 32), { pos: [xMin - 40, plenum.y, plenum.z], mat: 'aluminium' });
  adm.part('Capteur de pression et température d\'air (MAP)', S.box(30, 25, 25), { pos: [plenum.x, plenum.y + bore * 0.5, plenum.z], mat: 'plastique' });
  const rail = dsl ? toWorld(0, V3(0, yTip + 20, -headW / 2 - 30)) : null;
  if (dsl) {
    adm.part('Rampe commune haute pression', S.cyl(28, L - 40, 'x'), { pos: [(xMin + xMax) / 2, rail.y, rail.z], mat: 'acierForge', desc: 'Pression de service 2 500 bar' });
    adm.part('Pompe haute pression', S.box(120, 120, 110), { pos: [xF - 10, Yc + deck * 0.3, -headW / 2 - 70], mat: 'aluminium' });
    for (const c of cyls) adm.part(`Tube haute pression injecteur n°${c.no}`, S.pipe([[c.x, rail.y, rail.z], [c.x, rail.y + 20, -headW / 4], [c.x, Yc + yTip, -10]], 6), { mat: 'inox' });
  } else {
    for (const bk of banks) {
      const b = banks.indexOf(bk);
      const rr = toWorld(b, V3(0, headFace + 45, bk.inSide * (headW / 2 + 15)));
      adm.part(`Rampe d'injection haute pression${bk.key ? ` ${bk.key}` : ''}`, S.cyl(20, L - 40, 'x'), { pos: [(xMin + xMax) / 2, rr.y, rr.z], mat: 'inox' });
    }
    adm.part('Pompe haute pression d\'essence (entraînée par came)', S.cyl(60, 80, 'y'), { pos: toWorld(0, V3(xMax - 30, camY + 20, banks[0].inSide * -vz)).toArray(), rot: [banks[0].a, 0, 0], mat: 'aluminium' });
  }

  // ======================================================================= Échappement & turbo
  const ech = eng.group(P.turbo ? 'Échappement & turbocompresseur' : 'Collecteurs d\'échappement', { code: 'ECH', layer: 'int' });
  const outs = [];
  banks.forEach((bk, b) => {
    const bc = cyls.filter((c) => c.b === b);
    const ex = -bk.inSide;
    const coll = toWorld(b, V3((Math.min(...bc.map((c) => c.x)) + Math.max(...bc.map((c) => c.x))) / 2, portY - bore * 0.7, ex * (headW / 2 + bore * 0.55)));
    outs.push(coll);
    for (const c of bc) {
      const port = toWorld(b, V3(c.x, portY, ex * headW / 2));
      const m1 = toWorld(b, V3(c.x, portY - bore * 0.2, ex * (headW / 2 + bore * 0.35)));
      ech.part(`Tubulure d'échappement n°${c.no}`, S.pipe([port.toArray(), m1.toArray(), coll.toArray()], bore * 0.4), { mat: 'inox', desc: 'Acier inoxydable 1.4512 – ép. 1,5 mm' });
      for (const q of [-1, 1]) ech.part(`Écrou de collecteur n°${c.no}${q < 0 ? 'a' : 'b'}`, S.nut(8, 'y'), { pos: toWorld(b, V3(c.x + q * bore * 0.33, portY, ex * (headW / 2 + 4))).toArray(), rot: [bk.a + ex * 90, 0, 0], mat: 'laiton', couple: '25 N·m' });
    }
    ech.part(`Joint de collecteur d'échappement${bk.key ? ` ${bk.key}` : ''}`, S.box(L * 0.9 / banks.length * (P.layout === 'I' ? 1 : 1), bore * 0.6, 1.5), { pos: toWorld(b, V3((Math.min(...bc.map((c) => c.x)) + Math.max(...bc.map((c) => c.x))) / 2, portY, ex * (headW / 2 + 0.75))).toArray(), rot: [bk.a, 0, 0], mat: 'mls' });
    ech.part(`Sonde lambda${bk.key ? ` ${bk.key}` : ''}`, S.cyl(18, 50, 'y'), { pos: [coll.x + bore * 0.6, coll.y + 20, coll.z], mat: 'inox' });
  });
  if (P.turbo) {
    const tb = ech.group('Turbocompresseur', { code: 'TUR', desc: dsl ? 'Turbo à géométrie variable – 2,8 bar' : 'Turbo à soupape de décharge – 1,6 bar' });
    const tc = outs[0].clone().add(V3(0, -bore * 0.2, Math.sign(outs[0].z || 1) * bore * 0.8));
    const s = bore / 77 * (dsl ? 0.8 : 1);
    tb.part('Carter de turbine (volute)', S.torus(90 * s, 50 * s, 'x', 48), { pos: [tc.x + 40 * s, tc.y, tc.z], mat: 'fonteGS', color: 0x6b5d50 });
    tb.part('Roue de turbine (moyeu)', S.cone(60 * s, 40 * s, 'x', 32), { pos: [tc.x + 40 * s, tc.y, tc.z], mat: 'nimonic' });
    for (let i = 0; i < 11; i++) { const a = (i / 11) * Math.PI * 2; AN.spin.push({ k: 12, C: V3(0, tc.y, tc.z), o: tb.part(`Aube de turbine ${i + 1}`, S.box(36 * s, 24 * s, 1.5), { pos: [tc.x + 40 * s, tc.y + Math.cos(a) * 22 * s, tc.z + Math.sin(a) * 22 * s], rot: [-a / D2R, 0, 20], mat: 'nimonic' }) }); }
    tb.part('Carter central (paliers et refroidissement)', S.cyl(70 * s, 60 * s, 'x', 32), { pos: [tc.x - 20 * s, tc.y, tc.z], mat: 'fonte' });
    tb.part('Arbre de turbocompresseur', S.cyl(8 * s, 140 * s, 'x'), { pos: [tc.x, tc.y, tc.z], mat: 'acierForge', desc: 'Jusqu\'à 230 000 tr/min' });
    tb.part('Roue de compresseur (moyeu)', S.cone(55 * s, 40 * s, 'x', 32), { pos: [tc.x - 75 * s, tc.y, tc.z], rot: [0, 0, 180], mat: 'alu_forge' });
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; AN.spin.push({ k: 12, C: V3(0, tc.y, tc.z), o: tb.part(`Aube de compresseur ${i + 1}`, S.box(34 * s, 22 * s, 1.2), { pos: [tc.x - 75 * s, tc.y + Math.cos(a) * 20 * s, tc.z + Math.sin(a) * 20 * s], rot: [-a / D2R, 0, -25], mat: 'alu_forge' }) }); }
    tb.part('Carter de compresseur (volute)', S.torus(95 * s, 55 * s, 'x', 48), { pos: [tc.x - 75 * s, tc.y, tc.z], mat: 'aluminium' });
    tb.part(dsl ? 'Actionneur de géométrie variable' : 'Soupape de décharge (wastegate)', S.cyl(45 * s, 60 * s, 'y'), { pos: [tc.x + 40 * s, tc.y + 70 * s, tc.z], mat: 'acier' });
    tb.part('Tube de graissage du turbo', S.pipe([[tc.x - 20 * s, tc.y + 35 * s, tc.z], [tc.x - 20 * s, Yc + deck * 0.6, tc.z * 0.7], [0, Yc + deck * 0.5, tc.z * 0.6]], 8), { mat: 'inox' });
    ech.part('Sortie d\'échappement (descente)', S.pipe([[tc.x + 70 * s, tc.y, tc.z], [tc.x + 140 * s, tc.y - 60 * s, tc.z], [xR + 60, Yc - cwR, tc.z]], 60 * s), { mat: 'inox' });
  }

  // ======================================================================= Accessoires & entraînement
  const acc = eng.group('Accessoires & courroie', { code: 'ACC', layer: 'int' });
  const xa = xd - 95;
  const side = P.layout === 'I' ? -banks[0].inSide : 1;
  const altP = [xa, Yc + deck * 0.7, side * headW * 0.75];
  acc.part(dsl ? 'Alternateur 28 V 110 A' : 'Alternateur 14 V 180 A', S.cyl(dsl ? 160 : 130, 150, 'x', 32), { pos: [altP[0] + 85, altP[1], altP[2]], mat: 'aluminium' });
  acc.part('Poulie d\'alternateur (roue libre)', S.cyl(60, 25, 'x'), { pos: altP, mat: 'acier' });
  const acP = [xa, Yc - bore * 0.3, -side * headW * 0.7];
  acc.part('Compresseur de climatisation', S.cyl(120, 160, 'x', 32), { pos: [acP[0] + 90, acP[1], acP[2]], mat: 'aluminium' });
  acc.part('Poulie de compresseur', S.cyl(110, 25, 'x'), { pos: acP, mat: 'acier' });
  const tnP = [xa, Yc + deck * 0.35, side * headW * 0.4];
  acc.part('Galet tendeur automatique', S.cyl(70, 25, 'x'), { pos: tnP, mat: 'acier' });
  const belt = [[Yc, 0, bore * 0.95], [altP[1], altP[2], 30], [tnP[1], tnP[2], 35], [wpY, wpZ, bore * 0.45], [acP[1], acP[2], 55]];
  const bh = [];
  for (const [y0, z0, rr] of belt) for (let i = 0; i < 20; i++) { const a = (i / 20) * Math.PI * 2; bh.push([z0 + (rr + 3) * Math.cos(a), y0 + (rr + 3) * Math.sin(a)]); }
  acc.part('Courroie d\'accessoires poly-V 6 PK', S.pipe(hull(bh).filter((_, i) => i % 2 === 0).map(([z, y]) => [xa, y, z]), 6, true), { mat: 'caoutchouc', desc: 'Courroie striée EPDM – 6 nervures' });
  acc.part(dsl ? 'Démarreur 24 V 6,5 kW' : 'Démarreur 12 V 1,4 kW', S.cyl(dsl ? 120 : 85, dsl ? 300 : 200, 'x', 32), { pos: [xR - (dsl ? 150 : 100), Yc - bore * 0.3, side * (sW / 2 + (dsl ? 60 : 45))], mat: 'peinture', color: 0x222222 });
  acc.part('Pignon lanceur de démarreur', S.cyl(30, 25, 'x', 11), { pos: [xv + 8, Yc - bore * 0.3, side * (sW / 2 + (dsl ? 60 : 45))], mat: 'acierHR' });
  acc.part('Calculateur moteur (ECU)', S.box(180, 150, 40), { pos: [xMax - 120, Yc + bore * 0.2, -side * (sW / 2 + (dsl ? 140 : 95))], mat: 'aluminium', layer: 'ext' });
  acc.part('Support de calculateur', S.box(120, 20, (dsl ? 120 : 75)), { pos: [xMax - 120, Yc + bore * 0.2 - 85, -side * (sW / 2 + (dsl ? 70 : 47))], mat: 'acier', layer: 'ext' });
  // ======================================================================= Cinématique
  // Calage : PMH d'allumage de chaque cylindre réparti sur 720° selon l'ordre d'allumage
  const order = P.firing.split('-').map(Number);
  for (const A of AN.cyl) {
    const tdc = ((-A.rel0 / D2R) % 360 + 360) % 360;
    const target = order.indexOf(A.c.no) * 720 / n;
    const cand = [tdc, tdc + 360];
    const dist = (a) => Math.min(Math.abs(a - target), 720 - Math.abs(a - target));
    A.fire = dist(cand[0]) <= dist(cand[1]) ? cand[0] : cand[1];
  }
  // deux cylindres ne peuvent pas s'allumer au même instant : le second passe au tour suivant
  const seen = new Map();
  for (const A of AN.cyl.slice().sort((a, b) => order.indexOf(a.c.no) - order.indexOf(b.c.no))) {
    const key = Math.round(A.fire) % 720;
    if (seen.has(key)) A.fire = (A.fire + 360) % 720;
    seen.set(Math.round(A.fire) % 720, true);
  }
  const fireOf = new Map(AN.cyl.map((A) => [A.c.no, A.fire]));
  const cycOf = (no, deg) => (((deg - fireOf.get(no)) % 720) + 720) % 720;
  const bump = (x, a, b) => (x > a && x < b ? Math.sin(Math.PI * (x - a) / (b - a)) : 0);
  const X = V3(1, 0, 0), q = new THREE.Quaternion();
  const setAnim = (o, pos, quat, sy) => { o.userData.anim = { pos, quat: quat || new THREE.Quaternion(), sy }; };
  const rotAbout = (o, C, ang) => {
    const R = new THREE.Quaternion().setFromAxisAngle(X, ang);
    const p0 = o.userData.base ? o.userData.base.pos : o.position;
    const pos = C.clone().add(p0.clone().sub(C).applyQuaternion(R)).sub(p0);
    setAnim(o, pos, R);
  };
  eng.object.userData.animate = (deg) => {
    const d = deg * D2R;
    for (const o of AN.crank) rotAbout(o, V3(0, Yc, 0), d);
    for (const sp of AN.spin) rotAbout(sp.o, sp.C, d * sp.k);
    for (const A of AN.cyl) {
      const rel = A.rel0 + d;
      const by = r * Math.cos(rel), bz = r * Math.sin(rel);
      const pinY = by + Math.sqrt(rodL ** 2 - bz ** 2);
      setAnim(A.pg, V3(0, pinY - A.pinY0, 0));
      const beta = Math.atan2(-bz, pinY - by);
      const R = new THREE.Quaternion().setFromAxisAngle(X, beta - A.beta0);
      setAnim(A.rg, V3(A.c.x, pinY, 0).sub(A.small0.clone().applyQuaternion(R)), R);
    }
    for (const VA of AN.valves) {
      const cyc = cycOf(VA.c.no, deg);
      const [a, b, mx] = VA.lab === 'admission' ? [350, 590, 470] : [130, 370, 250];
      const l = lift * bump(cyc, a, b) + (VA.lab === 'admission' && cyc < 10 ? lift * bump(cyc + 720, a, b) : 0);
      for (const o of VA.mv) setAnim(o, V3(0, -l, 0));
      setAnim(VA.spring, V3(0, -l / 2, 0), null, (VA.spH - l) / VA.spH);
      // la came tourne à mi-vitesse ; son nez pointe vers le poussoir (−Y) au maximum de levée
      const nose = 180 + (cyc - mx) / 2;
      rotAbout(VA.lobe, VA.pivot, (nose - VA.lobeAng) * D2R);
    }
  };
  const PH = [[180, 'Combustion – détente', '#ff6a3d'], [360, 'Échappement', '#9aa0a6'], [540, 'Admission', '#3d8bff'], [720, 'Compression', '#ffb020']];
  eng.object.userData.phases = (deg) => cyls.slice().sort((a, b) => a.no - b.no).map((c) => {
    const cyc = cycOf(c.no, deg);
    const ph = PH.find((p) => cyc < p[0]);
    return { label: `Cyl. ${c.no}`, value: ph[1], color: ph[2] };
  });
  eng.object.userData.animTitle = (deg) => `Vilebrequin : ${Math.round(deg % 360)}° · cycle : ${Math.round(deg % 720)}° / 720°`;
  eng.object.userData.animInfo = `Cycle à 4 temps – ordre d'allumage ${P.firing}. Le vilebrequin fait 2 tours par cycle, les arbres à cames 1 tour.`;
  void q;
  return eng;
}
