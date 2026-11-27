// Fusées et moteurs-fusées – générateur paramétrique (cotes en mm)
// Repère : Y = axe de la fusée (vers le haut), origine au sol sous les tuyères.
import * as THREE from 'three';
import { Assembly, S, boltCircle } from '../core/builder.js';
import { ROCKET_TYPES } from './meta/rocket.js';

const D2R = Math.PI / 180;
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

/** Corps de révolution partiel autour de Y (pour les demi-coiffes) */
function halfLathe(points, phiStart, phiLength = Math.PI, seg = 32) {
  const g = new THREE.LatheGeometry(points.map(([r, y]) => new THREE.Vector2(Math.max(r, 0.01), y)), seg, phiStart, phiLength);
  g.computeBoundingBox();
  const bb = g.boundingBox;
  return { geo: g, dims: { Hauteur: Math.round(bb.max.y - bb.min.y), 'Diamètre': Math.round(Math.max(...points.map((p) => p[0])) * 2) } };
}
const dome = (R, h, up = true, n = 12) => { const pts = []; for (let i = 0; i <= n; i++) { const t = (i / n) * Math.PI / 2; pts.push([R * Math.cos(t), (up ? 1 : -1) * h * Math.sin(t)]); } return up ? pts : pts.reverse(); };

/**
 * Moteur-fusée : origine au cardan, tuyère vers −Y. s = échelle (diamètre de sortie / 2 100 mm)
 * Retourne { group, spin: [], flame }
 */
function rocketEngine(parent, name, pos, nozD, L, opts = {}) {
  const e = parent.group(name, { code: opts.code || 'MOT', pos, layer: 'meca', desc: opts.desc || '' });
  const s = nozD / 2100;
  const rt = nozD * 0.11, rc = nozD * 0.2, re = nozD / 2;
  const yInj = -L * 0.08, yCh = -L * 0.12, yTh = -L * 0.3, yEx = -L;
  const spin = [];
  e.part('Cardan (rotule d\'orientation)', S.sphere(Math.max(60, 180 * s)), { pos: [0, 0, 0], mat: 'titane', desc: 'Débattement ±6° sur deux axes' });
  e.part('Dôme d\'injection (oxygène)', S.revolve([[0, 0], [rc * 0.8, -rc * 0.15], [rc, -rc * 0.4]], 'y', 32), { pos: [0, yInj + rc * 0.4, 0], mat: 'inox' });
  e.part('Plaque d\'injection', S.cyl(rc * 2, 30 * s + 8, 'y', 48), { pos: [0, yInj - 10, 0], mat: 'inox', desc: `${opts.detail ? 516 : Math.round(120 * s + 40)} injecteurs coaxiaux` });
  if (opts.detail) {
    const ring = [[0, 1], [rc * 0.3, 8], [rc * 0.55, 14], [rc * 0.78, 20]];
    let k = 0;
    for (const [rr, nn] of ring) for (let i = 0; i < nn; i++) { const a = (i / nn) * Math.PI * 2; k++; e.part(`Injecteur coaxial n°${k}`, S.cyl(18 * s + 4, 60 * s + 10, 'y', 12), { pos: [Math.cos(a) * rr, yInj - 40 * s, Math.sin(a) * rr], mat: 'cuivre', desc: 'Oxygène liquide au centre, hydrogène gazeux en couronne' }); }
  }
  const chamber = [[rc, yCh], [rc, yCh - L * 0.1], [rt * 1.15, yTh + L * 0.04], [rt, yTh], [rt * 1.3, yTh - L * 0.05]];
  e.part('Chambre de combustion (cuivre refroidi)', S.revolve(chamber.map(([r, y]) => [r, y - yCh]), 'y', 48), { pos: [0, yCh, 0], mat: 'cuivre', desc: 'Alliage CuAgZr – canaux de refroidissement fraisés, pression 115 bar, 3 300 °C' });
  const bell = [];
  for (let i = 0; i <= 16; i++) { const t = i / 16; bell.push([rt * 1.3 + (re - rt * 1.3) * Math.sqrt(t) * (1 - 0.15 * (1 - t)), (yTh - L * 0.05) + (yEx - (yTh - L * 0.05)) * t]); }
  e.part('Divergent de tuyère (refroidi par régénération)', S.revolve(bell.map(([r, y]) => [r, y]), 'y', 64), { pos: [0, 0, 0], mat: 'nimonic', color: 0x6b5d50, desc: `Rapport de section ${Math.round((re / rt) ** 2)} : 1 – sortie Ø${Math.round(nozD)} mm` });
  if (opts.detail) for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2;
    e.part(`Tube de refroidissement du divergent n°${i + 1}`, S.pipe(bell.filter((_, j) => j % 4 === 0).map(([r, y]) => [Math.cos(a) * (r + 6), y, Math.sin(a) * (r + 6)]), 10), { mat: 'inox', desc: 'Hydrogène circulant dans la paroi avant d\'aller à la chambre' });
  }
  e.part('Anneau de col (bride)', S.tube(rt * 2.8, rt * 2.2, 40 * s + 10, 'y', 48), { pos: [0, yTh, 0], mat: 'inox' });
  if (opts.detail) boltCircle(e, { n: 24, pcd: rt * 2.5, d: 10, L: 40, axis: 'y', at: [0, yTh + 25 * s, 0], dir: 1, label: 'Boulon de bride de col', mat: 'nimonic', couple: 40 });
  // turbopompes
  const tp = (lab, side, fuel) => {
    const g = e.group(`Turbopompe ${lab}`, { code: opts.code || 'MOT', desc: fuel ? 'Hydrogène : 33 000 tr/min – 2 étages' : 'Oxygène : 13 000 tr/min – 1 étage' });
    const px = side * (rc + 260 * s + 40), py = yCh - L * 0.05;
    g.part('Carter de pompe', S.cyl(330 * s + 60, 420 * s + 60, 'y', 32), { pos: [px, py, 0], mat: 'aluminium' });
    g.part('Volute de refoulement', S.torus(330 * s + 60, 80 * s + 20, 'y', 32), { pos: [px, py - 120 * s, 0], mat: 'aluminium' });
    g.part('Carter de turbine', S.cyl(280 * s + 40, 220 * s + 40, 'y', 32), { pos: [px, py + 330 * s + 20, 0], mat: 'nimonic' });
    const nb = opts.detail ? 14 : 6;
    for (let i = 0; i < nb; i++) {
      const a = (i / nb) * Math.PI * 2;
      spin.push({ o: g.part(`Aube de turbine ${lab} ${i + 1}`, S.box(80 * s + 20, 60 * s + 10, 6 * s + 2), { pos: [px + Math.cos(a) * 90 * s, py + 330 * s + 20, Math.sin(a) * 90 * s], rot: [0, -a / D2R, 0], mat: 'nimonic' }), C: V3(px, 0, 0), k: fuel ? 20 : 9 });
      if (opts.detail) spin.push({ o: g.part(`Aube d'inducteur ${lab} ${i + 1}`, S.box(70 * s + 15, 40 * s + 10, 5 * s + 2), { pos: [px + Math.cos(a) * 70 * s, py - 230 * s, Math.sin(a) * 70 * s], rot: [20, -a / D2R, 0], mat: 'titane' }), C: V3(px, 0, 0), k: fuel ? 20 : 9 });
    }
    g.part('Arbre de turbopompe', S.cyl(40 * s + 10, 700 * s + 80, 'y'), { pos: [px, py + 100 * s, 0], mat: 'acierForge' });
    g.part(`Conduite d'alimentation ${fuel ? 'hydrogène' : 'oxygène'}`, S.pipe([[px, py + 600 * s + 60, 0], [px * 0.6, 200 * s, 0], [0, 260 * s + 60, side * 40]], 160 * s + 30), { mat: 'inox' });
    g.part(`Conduite de refoulement vers ${fuel ? 'la tuyère (refroidissement)' : 'le dôme d\'injection'}`, S.pipe([[px, py - 120 * s, 0], [px * 0.7, yTh, 0], [rt * 1.6 * side, yTh - L * 0.06, 0]], 110 * s + 20), { mat: 'inox' });
    g.part(`Vanne principale ${fuel ? 'hydrogène' : 'oxygène'}`, S.box(160 * s + 30, 160 * s + 30, 160 * s + 30), { pos: [px * 0.6, yInj, 0], mat: 'aluminium' });
  };
  tp('hydrogène', 1, true);
  tp('oxygène', -1, false);
  e.part('Générateur de gaz', S.cyl(180 * s + 40, 400 * s + 60, 'y'), { pos: [0, yCh - L * 0.04, rc + 220 * s + 40], mat: 'nimonic' });
  e.part('Échappement de turbine', S.pipe([[0, yCh, rc + 220 * s + 40], [0, yTh, rc + 300 * s + 40], [0, yEx * 0.75, re * 0.8]], 140 * s + 30), { mat: 'nimonic' });
  e.part('Allumeur pyrotechnique', S.cyl(60 * s + 15, 200 * s + 30, 'y'), { pos: [0, yInj + 60 * s, -rc * 0.6], mat: 'inox' });
  for (const k of [0, 1]) e.part(`Vérin d'orientation de poussée ${k ? 'tangage' : 'lacet'}`, S.rod(k ? [rc + 40, yCh - L * 0.08, 0] : [0, yCh - L * 0.08, rc + 40], k ? [rc + 420 * s + 120, 0, 0] : [0, 0, rc + 420 * s + 120], 70 * s + 20), { mat: 'chrome', desc: 'Vérin électromécanique – course ±6°' });
  const fl = S.cone(nozD * 0.95, L * 1.6, 'y', 32);
  fl.geo.rotateX(Math.PI); fl.geo.translate(0, -L * 0.8, 0);
  const flame = e.part('Jet propulsif (visualisation de la flamme)', fl, { pos: [0, yEx, 0], scale: [1, 0.001, 1], mat: 'feuOrange', layer: 'ext', desc: 'Représentation du jet de gaz – ce n\'est pas une pièce' });
  flame.material.transparent = true; flame.material.opacity = 0.75; flame.material.userData.base.opacity = 0.75; flame.material.userData.base.transparent = true;
  return { group: e, spin, flame };
}

/** Réservoir : virole + 2 dômes. Retourne la hauteur occupée */
function tank(g, name, y0, h, D, wall, mat, desc) {
  const t = g.group(name, { code: g.code, layer: 'struct', desc });
  const R = D / 2 - wall, dh = D * 0.18;
  t.part('Virole (paroi cylindrique)', S.tube(D, D - wall * 2, h, 'y', 64), { pos: [0, y0 + h / 2, 0], mat, desc: `Paroi ${wall} mm – usinée en nid d'abeille (isogrid)` });
  t.part('Dôme inférieur', S.revolve(dome(R, dh, false), 'y', 48), { pos: [0, y0 + dh * 0.1, 0], mat });
  t.part('Dôme supérieur', S.revolve(dome(R, dh, true), 'y', 48), { pos: [0, y0 + h - dh * 0.1, 0], mat });
  t.part('Anti-vortex & crépine de sortie', S.cyl(D * 0.15, 80, 'y'), { pos: [0, y0 - dh * 0.8, 0], mat: 'aluminium' });
  return t;
}

export function buildRocket(type = 'lanceur') {
  const P = ROCKET_TYPES[type] || ROCKET_TYPES.lanceur;
  if (type === 'moteur') return buildRocketEngine(P);
  const { D } = P;
  const rk = new Assembly(P.label, { prefix: 'FU', code: 'GEN', layer: 'struct', desc: P.desc });
  const AN = { gimbal: [], spin: [], flames: [], boosters: [], fairing: [], legs: [], grid: [] };
  const wall = D > 5000 ? 6 : 5;
  const y0 = P.engL;
  // ======================================================================= Premier étage
  const s1 = rk.group('Premier étage', { code: 'E1' });
  const aftH = P.s1H * 0.1;
  s1.part('Jupe arrière (baie de propulsion)', S.tube(D, D - 20, aftH, 'y', 64), { pos: [0, y0 + aftH / 2, 0], mat: 'alu2024', layer: 'ext' });
  s1.part('Bouclier thermique arrière', S.cyl(D - 40, 30, 'y', 64), { pos: [0, y0 + 60, 0], mat: 'composite', color: 0x2a2c30 });
  s1.part('Structure de poussée (bâti moteurs)', S.cyl(D * 0.75, aftH * 0.4, 'y', 8), { pos: [0, y0 + aftH * 0.35, 0], mat: 'titane' });
  const tanks = P.s1Fuel === 'H2' ? [['Réservoir d\'oxygène liquide (LOX)', 0.22, '−183 °C'], ['Réservoir d\'hydrogène liquide (LH2)', 0.55, '−253 °C – isolation mousse 25 mm']] : [['Réservoir de kérosène (RP-1)', 0.32, 'Kérosène raffiné – 20 °C'], ['Réservoir d\'oxygène liquide (LOX)', 0.45, '−207 °C (densifié)']];
  let y = y0 + aftH;
  tanks.forEach(([nm, f, d], i) => {
    const h = P.s1H * f;
    tank(s1, nm, y + D * 0.18, h - D * 0.36, D, wall, 'alu2024', d);
    y += h;
    if (i === 0) { s1.part('Inter-réservoir', S.tube(D, D - 20, P.s1H * 0.06, 'y', 64), { pos: [0, y + P.s1H * 0.03, 0], mat: 'composite', color: 0x2a2c30, layer: 'ext' }); y += P.s1H * 0.06; }
  });
  s1.part('Conduite d\'alimentation traversante (tunnel)', S.cyl(D * 0.09, y - y0 - aftH, 'y'), { pos: [D * 0.18, (y + y0 + aftH) / 2, 0], mat: 'inox', layer: 'meca', desc: 'Amène l\'ergol du réservoir supérieur aux moteurs à travers le réservoir inférieur' });
  for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + 0.4; s1.part(`Bouteille d'hélium haute pression (COPV) ${i + 1}`, S.sphere(D * 0.14), { pos: [Math.cos(a) * D * 0.25, y - D * 0.6, Math.sin(a) * D * 0.25], mat: 'carbone', layer: 'meca', desc: 'Pressurisation des réservoirs – 300 bar' }); }
  const fwdH = P.s1H * 0.07;
  s1.part('Jupe avant', S.tube(D, D - 20, fwdH, 'y', 64), { pos: [0, y + fwdH / 2, 0], mat: 'alu2024', layer: 'ext' });
  y += fwdH;
  for (let k = 0; k < Math.floor((y - y0) / 3000); k++) s1.part(`Cadre de renfort n°${k + 1}`, S.tube(D - 10, D - 140, 60, 'y', 64), { pos: [0, y0 + 1500 + k * 3000, 0], mat: 'alu2024' });
  s1.part('Revêtement / isolation extérieure', S.tube(D + 50, D + 10, y - y0 - aftH, 'y', 64), { pos: [0, (y + y0 + aftH) / 2, 0], mat: 'peintureAlu', color: P.paint, layer: 'ext' });
  s1.part('Gaine de câbles (raceway)', S.box(180, y - y0 - 600, 120), { pos: [0, (y + y0) / 2, D / 2 + 85], mat: 'composite', color: 0x2a2c30, layer: 'ext' });
  const s1Top = y;
  // moteurs du 1er étage
  const engPos = P.s1Eng === 1 ? [[0, 0]] : [[0, 0], ...Array.from({ length: 8 }, (_, i) => [Math.cos(i / 8 * Math.PI * 2) * D * 0.34, Math.sin(i / 8 * Math.PI * 2) * D * 0.34])];
  const me = s1.group(P.s1Eng === 1 ? 'Moteur principal' : 'Moteurs du premier étage (×9, « octaweb »)', { code: 'M1', layer: 'meca' });
  engPos.forEach(([x, z], i) => {
    const r = rocketEngine(me, P.s1Eng === 1 ? 'Moteur cryogénique (étage principal)' : `Moteur n°${i + 1}${i === 0 ? ' (central, rallumable)' : ''}`, [x, y0 + 200, z], P.nozD, P.engL, { code: 'M1' });
    AN.gimbal.push({ o: r.group.object, ph: i }); AN.spin.push(...r.spin); AN.flames.push(r.flame);
  });
  // boosters
  for (let b = 0; b < P.boosters; b++) {
    const a = b * Math.PI * 2 / P.boosters;
    const rr = D / 2 + P.bD / 2 + 150;
    const bg = rk.group(`Propulseur d'appoint à poudre n°${b + 1}`, { code: `B${b + 1}`, pos: [Math.cos(a) * rr, 0, Math.sin(a) * rr], layer: 'struct', desc: 'Moteur à propergol solide – 142 t de propergol – 4 500 kN au décollage' });
    const by0 = P.engL * 0.6;
    bg.part('Enveloppe bobinée (fibre de carbone)', S.tube(P.bD, P.bD - 30, P.bH, 'y', 48), { pos: [0, by0 + P.bH / 2, 0], mat: 'carbone', layer: 'ext' });
    bg.part('Chargement de propergol (canal étoilé)', S.tube(P.bD - 40, P.bD * 0.35, P.bH * 0.9, 'y', 12), { pos: [0, by0 + P.bH / 2, 0], mat: 'composite', color: 0x6b6355, layer: 'meca', desc: 'Perchlorate d\'ammonium + aluminium + liant PBHT' });
    bg.part('Ogive', S.revolve([[P.bD / 2, 0], [P.bD * 0.42, P.bD * 0.5], [P.bD * 0.2, P.bD * 1.0], [0, P.bD * 1.2]], 'y', 48), { pos: [0, by0 + P.bH, 0], mat: 'composite', color: P.paint, layer: 'ext' });
    bg.part('Tuyère (col en carbone-carbone)', S.revolve([[P.bD * 0.18, 0], [P.bD * 0.15, -P.bD * 0.15], [P.bD * 0.4, -P.engL * 0.6]], 'y', 48), { pos: [0, by0, 0], mat: 'carbone', layer: 'meca' });
    bg.part('Allumeur', S.cyl(220, 600, 'y'), { pos: [0, by0 + P.bH - 300, 0], mat: 'inox', layer: 'meca' });
    for (const [nm, yy] of [['avant', by0 + P.bH * 0.85], ['arrière', by0 + 600]]) {
      bg.part(`Bielle d'attache ${nm}`, S.rod([-Math.cos(a) * P.bD / 2, yy, -Math.sin(a) * P.bD / 2], [-Math.cos(a) * (rr - D / 2), yy, -Math.sin(a) * (rr - D / 2)], 200), { mat: 'titane' });
      bg.part(`Système de séparation pyrotechnique ${nm}`, S.box(300, 250, 300), { pos: [-Math.cos(a) * (P.bD / 2 + 80), yy, -Math.sin(a) * (P.bD / 2 + 80)], mat: 'acier' });
    }
    const fl = S.cone(P.bD * 0.9, P.engL * 3, 'y', 24); fl.geo.rotateX(Math.PI); fl.geo.translate(0, -P.engL * 1.5, 0);
    const f = bg.part('Jet propulsif (visualisation de la flamme)', fl, { pos: [0, by0 - P.engL * 0.6, 0], scale: [1, 0.001, 1], mat: 'feuOrange', layer: 'ext' });
    f.material.transparent = true; f.material.opacity = 0.75; f.material.userData.base.opacity = 0.75; f.material.userData.base.transparent = true;
    AN.flames.push(f);
    AN.boosters.push({ o: bg.object, dir: V3(Math.cos(a), 0, Math.sin(a)) });
  }
  // jambes & grilles
  if (P.legs) for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 + Math.PI / 4;
    const e = V3(Math.cos(a), 0, Math.sin(a));
    const hinge = e.clone().multiplyScalar(D / 2 + 60).add(V3(0, y0 + 300, 0));
    const lg = s1.group(`Jambe d'atterrissage n°${i + 1}`, { code: 'JA', pos: hinge.toArray(), layer: 'sol', desc: 'Repliée contre l\'étage pendant la montée, déployée par vérin pneumatique' });
    const Ll = P.s1H * 0.22;
    lg.part('Jambe principale (fibre de carbone / nid d\'abeille)', S.box(700, Ll, 260), { pos: [0, Ll / 2, 0], rot: [0, -a / D2R, 0], mat: 'carbone' });
    lg.part('Vérin télescopique de déploiement', S.rod([e.x * -40, Ll * 0.65, e.z * -40], [e.x * -40, Ll * 1.25, e.z * -40], 160), { mat: 'chrome' });
    lg.part('Patin d\'atterrissage (amortisseur à nid d\'abeille)', S.box(500, 150, 900), { pos: [0, Ll + 75, 0], rot: [0, -a / D2R, 0], mat: 'aluminium' });
    lg.part('Ferrure d\'articulation', S.box(500, 300, 500), { pos: [0, 0, 0], rot: [0, -a / D2R, 0], mat: 'titane' });
    AN.legs.push({ o: lg.object, axis: V3(-Math.sin(a), 0, Math.cos(a)) });
  }
  if (P.grid) for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2;
    const e = V3(Math.cos(a), 0, Math.sin(a));
    const hinge = e.clone().multiplyScalar(D / 2 + 40).add(V3(0, s1Top - 1600, 0));
    const gf = s1.group(`Grille de pilotage n°${i + 1}`, { code: 'GR', pos: hinge.toArray(), layer: 'sol', desc: 'Grille en titane forgé – orientable pour piloter le retour de l\'étage' });
    const W = 1200, Hh = 1500;
    const t = V3(-Math.sin(a), 0, Math.cos(a));
    gf.part('Cadre de grille', S.box(W, 80, 80), { pos: e.clone().multiplyScalar(0).add(V3(0, Hh, 0)).toArray(), rot: [0, -a / D2R + 90, 0], mat: 'titane' });
    for (let k = 0; k <= 6; k++) gf.part(`Lame longitudinale ${k + 1}`, S.box(20, Hh, 120), { pos: t.clone().multiplyScalar(-W / 2 + k * W / 6).add(V3(0, Hh / 2, 0)).toArray(), rot: [0, -a / D2R, 0], mat: 'titane' });
    for (let k = 0; k <= 7; k++) gf.part(`Lame transversale ${k + 1}`, S.box(20, 20, W), { pos: [0, k * Hh / 7, 0], rot: [0, -a / D2R + 90, 0], mat: 'titane' });
    gf.part('Actionneur hydraulique de grille', S.cyl(160, 400, 'y'), { pos: e.clone().multiplyScalar(-150).add(V3(0, -200, 0)).toArray(), mat: 'aluminium', layer: 'meca' });
    AN.grid.push({ o: gf.object, axis: t });
  }
  if (P.grid) for (let i = 0; i < 2; i++) rk.part(`Propulseurs à gaz froid (azote) ${i + 1}`, S.box(300, 400, 300), { pos: [(i ? 1 : -1) * (D / 2 + 100), s1Top - 900, 0], mat: 'aluminium', layer: 'meca' });

  // ======================================================================= Inter-étage & second étage
  const ie = rk.group('Inter-étage', { code: 'IE', layer: 'struct' });
  ie.part('Inter-étage (composite carbone)', S.tube(D, D - 30, P.interH, 'y', 64), { pos: [0, s1Top + P.interH / 2, 0], mat: 'carbone', color: P.accent, layer: 'ext' });
  ie.part('Anneau de séparation', S.tube(D - 20, D - 200, 120, 'y', 64), { pos: [0, s1Top + P.interH, 0], mat: 'acier' });
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.3; ie.part(`Pousseur pneumatique de séparation ${i + 1}`, S.cyl(140, 600, 'y'), { pos: [Math.cos(a) * (D / 2 - 250), s1Top + P.interH - 300, Math.sin(a) * (D / 2 - 250)], mat: 'chrome', layer: 'meca' }); }
  const s2 = rk.group('Second étage', { code: 'E2', layer: 'struct' });
  const s2y0 = s1Top + P.interH;
  const vac = rocketEngine(s2, 'Moteur d\'étage supérieur (tuyère à vide, rallumable)', [0, s2y0 - 150, 0], P.vacD, Math.max(P.engL, P.interH - 300), { code: 'M2' });
  AN.gimbal.push({ o: vac.group.object, ph: 3 }); AN.spin.push(...vac.spin);
  let y2 = s2y0;
  const t2 = P.s2Fuel === 'H2' ? [['Réservoir d\'oxygène liquide (LOX)', 0.3], ['Réservoir d\'hydrogène liquide (LH2)', 0.45]] : [['Réservoir de kérosène (RP-1)', 0.3], ['Réservoir d\'oxygène liquide (LOX)', 0.45]];
  t2.forEach(([nm, f]) => { const h = P.s2H * f; tank(s2, nm, y2 + D * 0.18, h - D * 0.36, D, wall - 1, 'alu2024', ''); y2 += h; });
  s2.part('Revêtement du second étage', S.tube(D + 40, D + 10, y2 - s2y0, 'y', 64), { pos: [0, (y2 + s2y0) / 2, 0], mat: 'peintureAlu', color: P.paint, layer: 'ext' });
  const av = s2.group('Case à équipements (avionique)', { code: 'AV', layer: 'int' });
  const avH = P.s2H * 0.12;
  av.part('Anneau de case à équipements', S.tube(D, D - 300, avH, 'y', 64), { pos: [0, y2 + avH / 2, 0], mat: 'alu2024', layer: 'struct' });
  const eq = [['Ordinateur de bord (triple redondance)', [600, 300, 400]], ['Centrale inertielle (gyrolasers)', [400, 400, 400]], ['Batterie lithium-ion', [500, 250, 300]], ['Émetteur de télémesure', [400, 200, 300]], ['Récepteur GNSS', [300, 150, 250]], ['Unité de sauvegarde (neutralisation)', [400, 300, 300]], ['Calculateur de pilotage des vérins', [400, 250, 300]], ['Centrale de distribution électrique', [500, 250, 300]]];
  eq.forEach(([nm, sz], i) => { const a = (i / eq.length) * Math.PI * 2; av.part(nm, S.box(...sz), { pos: [Math.cos(a) * (D / 2 - 450), y2 + avH / 2, Math.sin(a) * (D / 2 - 450)], rot: [0, -a / D2R, 0], mat: 'aluminium' }); });
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; av.part(`Bloc de propulseurs de contrôle d'attitude ${i + 1}`, S.box(250, 300, 250), { pos: [Math.cos(a) * (D / 2 + 60), y2 + avH / 2, Math.sin(a) * (D / 2 + 60)], mat: 'aluminium', layer: 'meca' }); }
  for (const sd of [-1, 1]) av.part(`Antenne de télémesure ${sd < 0 ? 'A' : 'B'}`, S.box(120, 300, 60), { pos: [sd * (D / 2 + 40), y2 + avH * 0.3, 0], mat: 'composite', color: 0xdddddd, layer: 'ext' });
  y2 += avH;
  // ======================================================================= Charge utile & coiffe
  const cu = rk.group('Charge utile', { code: 'CU', layer: 'int' });
  cu.part('Adaptateur de charge utile (cône 1 194 mm)', S.revolve([[D / 2 - 100, 0], [700, 1500]], 'y', 48), { pos: [0, y2, 0], mat: 'carbone', layer: 'struct' });
  cu.part('Système de séparation (sangle Marman)', S.tube(1500, 1380, 120, 'y', 48), { pos: [0, y2 + 1520, 0], mat: 'titane' });
  const sy = y2 + 1580, sw = Math.min(P.fairD * 0.55, 3000), sh = Math.min(P.fairH * 0.4, 5500);
  cu.part('Satellite – structure (plateforme)', S.box(sw, sh, sw * 0.9), { pos: [0, sy + sh / 2, 0], mat: 'feutre', color: 0xc9a53c, desc: 'Isolation multicouche (MLI) dorée' });
  for (const sd of [-1, 1]) cu.part(`Générateur solaire replié ${sd < 0 ? 'gauche' : 'droit'}`, S.box(60, sh * 0.9, sw * 0.8), { pos: [sd * (sw / 2 + 40), sy + sh / 2, 0], mat: 'ecran', color: 0x1a2b55 });
  cu.part('Réflecteur d\'antenne', S.revolve([[0, 0], [sw * 0.35, sw * 0.08]], 'y', 32), { pos: [0, sy + sh + 50, sw * 0.1], mat: 'composite', color: 0xf0f0f0 });
  cu.part('Moteur d\'apogée', S.cyl(400, 600, 'y'), { pos: [0, sy - 100, 0], mat: 'nimonic', layer: 'meca' });
  cu.part('Réservoirs d\'ergols du satellite', S.sphere(sw * 0.45), { pos: [0, sy + sh * 0.4, 0], mat: 'titane', layer: 'meca' });
  const fr = rk.group('Coiffe', { code: 'CF', layer: 'ext', desc: `Coiffe en 2 demi-coques composite – Ø${P.fairD} mm × ${P.fairH} mm – largage à ≈ 110 km d'altitude` });
  const fR = P.fairD / 2, cyl = P.fairH * 0.55, fy0 = y2;
  const prof = [[D / 2, 0], [fR, (fR - D / 2) * 1.2], [fR, cyl], [fR * 0.85, cyl + P.fairH * 0.17], [fR * 0.55, cyl + P.fairH * 0.31], [fR * 0.15, cyl + P.fairH * 0.43], [0, P.fairH]];
  for (const [nm, ph] of [['Demi-coiffe gauche', Math.PI], ['Demi-coiffe droite', 0]]) {
    const sd = ph === 0 ? 1 : -1;
    const hg = fr.group(nm, { code: 'CF', pos: [0, fy0, 0] });
    hg.part('Coque composite (nid d\'abeille aluminium / carbone)', halfLathe(prof, ph, Math.PI, 40), { mat: 'composite', color: P.paint });
    hg.part('Protection acoustique interne', halfLathe(prof.map(([r, yy]) => [Math.max(0, r - 60), yy]), ph, Math.PI, 40), { mat: 'mousse', layer: 'int' });
    for (let k = 0; k < 3; k++) hg.part(`Vérin de séparation ${k + 1}`, S.cyl(120, 400, 'y'), { pos: [Math.cos(ph + Math.PI / 2) * 0, 600 + k * cyl * 0.4, sd * (fR - 150)], mat: 'chrome', layer: 'meca' });
    AN.fairing.push({ o: hg.object, sd });
  }
  fr.part('Cordeau de séparation longitudinal', S.box(40, P.fairH * 0.9, 40), { pos: [fR, fy0 + P.fairH * 0.45, 0], mat: 'acier', layer: 'meca' });

  // ======================================================================= Animation
  const q = (axis, ang) => new THREE.Quaternion().setFromAxisAngle(axis, ang);
  const set = (o, pos, quat, sy) => { o.userData.anim = { pos: pos || V3(0, 0, 0), quat: quat || new THREE.Quaternion(), sy }; };
  const spinAbout = (o, C, axis, ang) => { const R = q(axis, ang); const p0 = o.userData.base.pos; set(o, C.clone().add(p0.clone().sub(C).applyQuaternion(R)).sub(p0), R); };
  const ease = (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a)));
  const smooth = (x) => x * x * (3 - 2 * x);
  rk.object.userData.animate = (deg) => {
    const T = (deg % 2880) / 2880;
    const thrust = T < 0.48 ? 1 : 0;
    const d = deg * D2R;
    AN.gimbal.forEach(({ o, ph }) => set(o, null, q(V3(1, 0, 0), Math.sin(d * 2 + ph) * 3 * D2R).multiply(q(V3(0, 0, 1), Math.cos(d * 1.6 + ph) * 3 * D2R))));
    for (const sp of AN.spin) spinAbout(sp.o, sp.C, V3(0, 1, 0), d * sp.k * (thrust || 0.05));
    AN.flames.forEach((f, i) => set(f, null, null, Math.max(0.001, thrust * (0.85 + 0.15 * Math.sin(d * 9 + i * 1.7)))));
    AN.boosters.forEach(({ o, dir }) => { const k = smooth(ease(T, 0.3, 0.45)); set(o, dir.clone().multiplyScalar(k * 6000).add(V3(0, -k * 4000, 0)), q(V3(-dir.z, 0, dir.x), -k * 25 * D2R)); });
    AN.fairing.forEach(({ o, sd }) => { const k = smooth(ease(T, 0.5, 0.65)); set(o, V3(0, 0, sd * k * 4500), q(V3(1, 0, 0), sd * k * 30 * D2R)); });
    AN.grid.forEach(({ o, axis }) => set(o, null, q(axis, -smooth(ease(T, 0.7, 0.78)) * 95 * D2R)));
    AN.legs.forEach(({ o, axis }) => set(o, null, q(axis, -smooth(ease(T, 0.85, 0.95)) * 115 * D2R)));
  };
  const phases = [[0.3, 'Ascension – moteurs à pleine poussée, tuyères orientées pour piloter'], [0.45, P.boosters ? 'Séparation des propulseurs d\'appoint' : 'Fin de combustion du premier étage'], [0.5, 'Séparation des étages'], [0.65, 'Largage de la coiffe – la charge utile est exposée'], [0.8, P.grid ? 'Retour du premier étage : déploiement des grilles de pilotage' : 'Mise en orbite par le second étage'], [1, P.legs ? 'Atterrissage : déploiement des jambes' : 'Séparation du satellite']];
  rk.object.userData.phases = (deg) => { const T = (deg % 2880) / 2880; return [{ label: 'Phase', value: phases.find((p) => T < p[0])[1], color: '#ffb020' }]; };
  rk.object.userData.animTitle = (deg) => `Vol : ${Math.round(((deg % 2880) / 2880) * 100)} % de la séquence`;
  rk.object.userData.animInfo = 'Séquence de vol simplifiée (accélérée). Les turbopompes tournent, les tuyères s\'orientent, puis les éléments se séparent.';
  return rk;
}

function buildRocketEngine(P) {
  const rk = new Assembly(P.label, { prefix: 'MF', code: 'GEN', layer: 'meca', desc: P.desc });
  const r = rocketEngine(rk, 'Moteur-fusée', [0, 3800, 0], 2100, 3400, { code: 'MF', detail: true, desc: 'Masse ≈ 2 100 kg – Isp 431 s dans le vide' });
  for (const [nm, p, sz] of [['avant', [1400, 3900, 0], [120, 120, 2900]], ['arrière', [-1400, 3900, 0], [120, 120, 2900]], ['gauche', [0, 3900, -1400], [2900, 120, 120]], ['droite', [0, 3900, 1400], [2900, 120, 120]], ['central (support de cardan)', [0, 3950, 0], [2900, 120, 160]]]) rk.part(`Poutre de bâti d'essai ${nm}`, S.box(...sz), { pos: p, mat: 'acier', color: 0x2a2c30, layer: 'struct' });
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; rk.part(`Pied de bâti ${i + 1}`, S.box(150, 3900, 150), { pos: [Math.cos(a) * 1900, 1950, Math.sin(a) * 1900], mat: 'acier', color: 0x2a2c30, layer: 'struct' }); }
  const set = (o, pos, quat, sy) => { o.userData.anim = { pos: pos || V3(0, 0, 0), quat: quat || new THREE.Quaternion(), sy }; };
  rk.object.userData.animate = (deg) => {
    const d = deg * D2R;
    set(r.group.object, null, new THREE.Quaternion().setFromAxisAngle(V3(1, 0, 0), Math.sin(d * 1.5) * 5 * D2R));
    for (const sp of r.spin) { const R = new THREE.Quaternion().setFromAxisAngle(V3(0, 1, 0), d * sp.k); const p0 = sp.o.userData.base.pos; set(sp.o, sp.C.clone().add(p0.clone().sub(sp.C).applyQuaternion(R)).sub(p0), R); }
    set(r.flame, null, null, 0.85 + 0.15 * Math.sin(d * 9));
  };
  rk.object.userData.phases = () => [{ label: 'Hydrogène', value: 'pompé à 33 000 tr/min, refroidit la tuyère puis brûle', color: '#3d8bff' }, { label: 'Oxygène', value: 'pompé à 13 000 tr/min vers l\'injecteur', color: '#9ad' }, { label: 'Tuyère', value: 'orientée par vérins ±5°', color: '#ffb020' }];
  rk.object.userData.animTitle = () => 'Moteur-fusée en fonctionnement';
  rk.object.userData.animInfo = 'Cycle générateur de gaz : une petite partie des ergols brûle pour entraîner les turbines des pompes.';
  return rk;
}
