// Hélicoptère léger monoturbine – 6 places (cotes en mm)
// Longueur fuselage 10 900 mm (rotors tournants 12 900 mm) · rotor principal Ø10 700 mm · hauteur 3 300 mm
import { Assembly, S, SIDES, boltCircle, axisRot, airfoil } from '../core/builder.js';

import { HELI_TYPES } from './meta/helico.js';

export { HELI_TYPES };

export function buildHelico() {
  const PAINT = 0xd4202a, DARK = 0x222428;
  const h = new Assembly('Hélicoptère léger monoturbine', { prefix: 'HL', code: 'GEN', layer: 'meca', desc: 'Hélicoptère 6 places – MTOW 2 250 kg – rotor principal tripale Ø10 690 mm' });

  // ------------------------------------------------------------------ Cellule
  const ce = h.group('Cellule', { code: 'CEL', layer: 'ext' });
  ce.part('Cabine (coque composite)', S.lathe([[0, 2700], [500, 2600], [850, 2250], [950, 1500], [950, 0], [900, -900], [700, -1500], [420, -1900]], 48, 1.0, 1.0), { pos: [0, 1500, 0], mat: 'composite', color: PAINT, desc: 'Coque composite carbone / Kevlar' });
  ce.part('Capotage moteur & boîte de transmission', S.box(2300, 650, 1100), { pos: [-300, 2650, 0], mat: 'composite', color: PAINT });
  ce.part('Poutre de queue', S.lathe([[420, 0], [300, -2500], [200, -5200]], 32), { pos: [-1700, 1700, 0], mat: 'alu2024', color: PAINT });
  const vit = ce.group('Verrière', { code: 'VIT' });
  vit.part('Pare-brise gauche', S.box(1100, 6, 900), { pos: [2150, 2050, -400], rot: [-20, 0, -40], mat: 'polycarbonate' });
  vit.part('Pare-brise droit', S.box(1100, 6, 900), { pos: [2150, 2050, 400], rot: [20, 0, -40], mat: 'polycarbonate' });
  vit.part('Hublot de plancher (vision basse)', S.box(600, 6, 500), { pos: [2300, 750, -350], rot: [0, 0, 30], mat: 'polycarbonate' });
  for (const sd of SIDES) {
    for (const [nm, x0, x1] of [['avant', 700, 1900], ['arrière', -700, 650]]) {
      const pt = ce.group(`Porte ${nm} ${sd.f}`, { code: 'POR' });
      pt.part('Cadre de porte', S.extrude([[x0, 800], [x0, 2200], [x1, 2200], [x1 + 200, 1500], [x1, 800]], 10, 3), { pos: [0, 0, sd.s * 955], mat: 'composite', color: PAINT });
      pt.part('Vitre de porte', S.extrude([[x0 + 60, 1350], [x0 + 60, 2150], [x1 - 40, 2150], [x1 + 120, 1500], [x1 - 40, 1350]], 6), { pos: [0, 0, sd.s * 965], mat: 'polycarbonate' });
      pt.part('Poignée', S.box(140, 30, 30), { pos: [x0 + 120, 1400, sd.s * 980], mat: 'aluminium' });
      for (const y of [1100, 1900]) pt.part(`Charnière ${y < 1500 ? 'basse' : 'haute'}`, S.box(60, 80, 30), { pos: [x1, y, sd.s * 960], mat: 'inox' });
    }
  }
  const emp = ce.group('Empennage', { code: 'EMP' });
  emp.part('Dérive', S.loft([{ x: -6400, y: 1750, z: 0, chord: 900 }, { x: -6900, y: 3000, z: 0, chord: 600 }], airfoil(0.12), 'y'), { mat: 'composite', color: PAINT });
  emp.part('Dérive ventrale', S.loft([{ x: -6600, y: 1650, z: 0, chord: 700 }, { x: -6800, y: 1000, z: 0, chord: 500 }], airfoil(0.12), 'y'), { mat: 'composite', color: PAINT });
  emp.part('Patin de queue', S.pipe([[-6550, 1000, 0], [-6800, 900, 0], [-7000, 960, 0]], 30), { mat: 'acier' });
  for (const sd of SIDES) {
    emp.part(`Stabilisateur horizontal ${sd.m}`, S.loft([{ x: -5000, y: 1720, z: sd.s * 150, chord: 600 }, { x: -5050, y: 1720, z: sd.s * 1300, chord: 450 }], airfoil(0.12, 0.04), 'z'), { mat: 'composite', color: PAINT });
    emp.part(`Plaque d'extrémité ${sd.m}`, S.box(500, 450, 10), { pos: [-5300, 1800, sd.s * 1300], mat: 'composite', color: PAINT });
  }
  emp.part('Feu anticollision', S.ellipsoid(100, 50, 100), { pos: [-6700, 3020, 0], mat: 'feuRouge' });
  for (const sd of SIDES) emp.part(sd.s < 0 ? 'Feu de position rouge' : 'Feu de position vert', S.ellipsoid(60, 40, 40), { pos: [-5050, 1720, sd.s * 1320], mat: sd.s < 0 ? 'feuRouge' : 'feuVert' });

  const str = h.group('Structure', { code: 'STR', layer: 'struct' });
  str.part('Plancher mécanique (plateforme de transmission)', S.box(2400, 40, 1300), { pos: [-200, 2300, 0], mat: 'alu2024' });
  str.part('Plancher cabine', S.box(3800, 30, 1700), { pos: [300, 700, 0], mat: 'alu2024' });
  for (let i = 0; i < 5; i++) str.part(`Cadre de cabine n°${i + 1}`, S.tube(1880, 1800, 30, 'x', 40), { pos: [1600 - i * 700, 1500, 0], mat: 'alu2024' });
  for (let i = 0; i < 6; i++) str.part(`Cadre de poutre n°${i + 1}`, S.tube(780 - i * 90, 740 - i * 90, 20, 'x', 32), { pos: [-1900 - i * 850, 1700, 0], mat: 'alu2024' });
  boltCircle(str, { n: 12, pcd: 800, d: 8, L: 30, axis: 'x', at: [-1700, 1700, 0], dir: 1, label: 'Boulon de jonction poutre/cabine', mat: 'titane', couple: 25 });

  // ------------------------------------------------------------------ Rotor principal
  const rp = h.group('Rotor principal tripale Ø10 690', { code: 'ROT', layer: 'meca' });
  const MX = 0, MY = 3350;
  rp.part('Mât rotor', S.cyl(140, 900, 'y'), { pos: [MX, MY - 350, 0], mat: 'acierHR' });
  rp.part('Moyeu rotor (étoile Starflex)', S.cyl(700, 80, 'y', 3), { pos: [MX, MY + 80, 0], mat: 'composite', color: DARK });
  rp.part('Écrou de mât', S.nut(24), { pos: [MX, MY + 140, 0], mat: 'acierHR', couple: 450 });
  rp.part('Plateau cyclique fixe', S.tube(520, 180, 50, 'y'), { pos: [MX, MY - 400, 0], mat: 'aluminium' });
  rp.part('Plateau cyclique tournant', S.tube(560, 200, 40, 'y'), { pos: [MX, MY - 340, 0], mat: 'aluminium' });
  for (let b = 0; b < 3; b++) {
    const a = (b / 3) * Math.PI * 2 + 0.4;
    const ca = Math.cos(a), sa = Math.sin(a);
    const bl = rp.group(`Pale ${['A (rouge)', 'B (bleue)', 'C (jaune)'][b]}`, { code: 'PAL' });
    const secs = [];
    for (let i = 0; i <= 4; i++) {
      const r = 450 + i * (5345 - 450) / 4;
      secs.push({ r, chord: 350 });
    }
    // pale le long de l'axe X local, puis tournée autour de Y
    const g = S.loft(secs.map((s) => ({ x: s.r, y: 0, z: 175, chord: 350 })), airfoil(0.12), 'x');
    bl.part('Pale composite', g, { pos: [MX, MY + 100, 0], rot: [0, a * 180 / Math.PI, 0], mat: 'composite', color: 0x2a2c30, desc: 'Profil OA2 – corde 350 mm – vrillage −12°' });
    bl.part('Bord d\'attaque (bande titane)', S.box(4900, 10, 20), { pos: [MX + ca * 2900, MY + 108, -sa * 2900 + ca * 0], rot: [0, a * 180 / Math.PI, 0], mat: 'titane' });
    bl.part('Manchon de pale', S.cyl(150, 500, 'x'), { pos: [MX + ca * 450, MY + 100, -sa * 450], rot: [0, a * 180 / Math.PI, 0], mat: 'aluminium' });
    bl.part('Bielle de commande de pas', S.rod([MX + ca * 250 - sa * 120, MY - 330, -sa * 250 - ca * 120], [MX + ca * 400 - sa * 150, MY + 70, -sa * 400 - ca * 150], 25), { mat: 'acierHR' });
    bl.part('Butée sphérique élastomère', S.sphere(160), { pos: [MX + ca * 300, MY + 90, -sa * 300], mat: 'caoutchouc' });
    for (const k of [1, 2]) bl.part(`Boulon d'attache de pale ${k}`, S.bolt(16, 120, 'y'), { pos: [MX + ca * (580 + k * 70), MY + 170, -sa * (580 + k * 70)], mat: 'acierHR', couple: 120 });
    bl.part('Saumon de pale', S.box(250, 30, 350), { pos: [MX + ca * 5400, MY + 100, -sa * 5400], rot: [0, a * 180 / Math.PI, 0], mat: 'composite', color: [0xc0262d, 0x1f4fbf, 0xd4a017][b] });
  }

  // ------------------------------------------------------------------ Motorisation & transmission
  const mo = h.group('Motorisation & transmission', { code: 'MOT', layer: 'meca' });
  const tu = mo.group('Turbomoteur à turbine libre 630 kW', { code: 'TUR' });
  tu.part('Entrée d\'air', S.box(400, 300, 900), { pos: [-750, 2700, 0], mat: 'aluminium' });
  tu.part('Compresseur centrifuge', S.cyl(450, 300, 'x'), { pos: [-1000, 2650, 0], mat: 'titane' });
  tu.part('Chambre de combustion annulaire', S.cyl(500, 350, 'x'), { pos: [-1320, 2650, 0], mat: 'inox' });
  tu.part('Turbine haute pression', S.cyl(400, 150, 'x'), { pos: [-1570, 2650, 0], mat: 'inox' });
  tu.part('Turbine libre', S.cyl(420, 200, 'x'), { pos: [-1740, 2650, 0], mat: 'inox' });
  tu.part('Tuyère d\'éjection', S.pipe([[-1850, 2650, 0], [-2100, 2750, 150], [-2300, 2800, 400]], 300), { mat: 'inox' });
  tu.part('Boîtier d\'accessoires', S.box(300, 250, 300), { pos: [-900, 2400, 0], mat: 'aluminium' });
  tu.part('Régulateur numérique (FADEC)', S.box(300, 80, 250), { pos: [-1200, 2950, 300], mat: 'aluminium' });
  boltCircle(tu, { n: 8, pcd: 470, d: 8, L: 30, axis: 'x', at: [-1150, 2650, 0], dir: 1, label: 'Boulon de bride compresseur/chambre', mat: 'inox', couple: 20 });
  const bt = mo.group('Boîte de transmission principale', { code: 'BTP' });
  bt.part('Carter de BTP', S.box(700, 600, 650), { pos: [MX, 2620, 0], mat: 'aluminium', desc: 'Réduction 6 000 → 390 tr/min' });
  bt.part('Couple conique d\'entrée', S.cyl(220, 120, 'x'), { pos: [MX - 400, 2550, 0], mat: 'acierHR' });
  bt.part('Train épicycloïdal', S.cyl(450, 150, 'y'), { pos: [MX, 2850, 0], mat: 'acierHR' });
  bt.part('Arbre de liaison moteur/BTP', S.rod([-850, 2550, 0], [MX - 400, 2550, 0], 60), { mat: 'acierHR' });
  for (const sd of SIDES) for (const xx of [-1, 1]) bt.part(`Barre de suspension BTP ${sd.c}${xx < 0 ? 'AR' : 'AV'}`, S.rod([MX + xx * 300, 2900, sd.s * 280], [MX + xx * 550, 2320, sd.s * 450], 40), { mat: 'acierHR' });
  boltCircle(bt, { n: 10, pcd: 500, d: 10, L: 40, axis: 'y', at: [MX, 2330, 0], dir: -1, label: 'Vis de fixation BTP', mat: 'acierHR', couple: 50 });
  const ar = mo.group('Transmission arrière', { code: 'TRA' });
  ar.part('Arbre de transmission arrière', S.rod([-400, 2350, 0], [-6300, 2100, 0], 60), { mat: 'aluminium' });
  for (let i = 0; i < 5; i++) ar.part(`Palier d'arbre arrière ${i + 1}`, S.box(80, 120, 120), { pos: [-1200 - i * 1000, 2330 - i * 40, 0], mat: 'aluminium' });
  ar.part('Boîte de transmission arrière (BTA)', S.box(300, 300, 250), { pos: [-6400, 2150, 0], mat: 'aluminium' });
  const ra = mo.group('Rotor anticouple', { code: 'RAC' });
  ra.part('Moyeu rotor anticouple', S.cyl(180, 120, 'z'), { pos: [-6550, 2250, 230], mat: 'aluminium' });
  for (let b = 0; b < 2; b++) {
    ra.part(`Pale anticouple ${b + 1}`, S.box(160, 900, 30), { pos: [-6550, 2250 + (b ? 1 : -1) * 500, 260], rot: [0, 0, 0], mat: 'composite', color: 0xffffff });
  }
  ra.part('Bielle de pas anticouple', S.rod([-6400, 2150, 150], [-6550, 2250, 230], 20), { mat: 'acierHR' });
  ra.part('Écrou de moyeu anticouple', S.nut(16, 'z'), { pos: [-6550, 2250, 300], mat: 'acierHR', couple: 90 });
  const ca = mo.group('Carburant & huile', { code: 'CAR' });
  ca.part('Réservoir de carburant 540 L (anti-crash)', S.box(1100, 500, 1200), { pos: [-300, 1000, 0], mat: 'composite', color: 0x55595e, desc: 'Réservoir souple résistant à l\'impact' });
  ca.part('Réservoir d\'huile moteur', S.cyl(200, 300, 'y'), { pos: [-1300, 2450, 350], mat: 'aluminium' });
  ca.part('Radiateur d\'huile', S.box(80, 400, 400), { pos: [-2000, 2650, 0], mat: 'aluminium' });

  // ------------------------------------------------------------------ Atterrisseur à patins
  const pa = h.group('Atterrisseur à patins', { code: 'ATT', layer: 'sol' });
  for (const sd of SIDES) {
    pa.part(`Patin ${sd.m}`, S.pipe([[2400, 140, sd.s * 1150], [2200, 60, sd.s * 1150], [0, 50, sd.s * 1150], [-1600, 50, sd.s * 1150]], 90), { mat: 'aluminium' });
    pa.part(`Sabot d'usure ${sd.m}`, S.box(1500, 15, 90), { pos: [300, 8, sd.s * 1150], mat: 'acierHR' });
    pa.part(`Marchepied ${sd.m}`, S.box(500, 20, 160), { pos: [900, 400, sd.s * 1060], mat: 'aluminium' });
  }
  for (const [nm, x] of [['avant', 1200], ['arrière', -900]]) {
    pa.part(`Traverse ${nm}`, S.pipe([[x, 50, -1150], [x, 500, -900], [x, 720, -500], [x, 720, 500], [x, 500, 900], [x, 50, 1150]], 100), { mat: 'aluminium' });
    for (const sd of SIDES) for (const k of [1, 2]) pa.part(`Boulon de fixation de traverse ${nm} ${sd.c}${k}`, S.bolt(12, 70, 'y'), { pos: [x + (k === 1 ? -50 : 50), 780, sd.s * 500], mat: 'acierHR', couple: 55 });
  }

  // ------------------------------------------------------------------ Cabine
  const cb = h.group('Cabine & commandes de vol', { code: 'CAB', layer: 'int' });
  cb.part('Console d\'instruments', S.box(300, 500, 1300), { pos: [1900, 1450, 0], rot: [0, 0, 15], mat: 'abs', color: DARK });
  for (let s = 0; s < 2; s++) cb.part(`Écran multifonction ${s + 1}`, S.box(20, 220, 260), { pos: [1770, 1550, (s ? 1 : -1) * 250], rot: [0, 0, 15], mat: 'ecran' });
  for (const sd of SIDES) {
    cb.part(`Siège pilote ${sd.m}`, S.box(480, 900, 480), { pos: [1100, 1150, sd.s * 420], mat: 'cuir', color: DARK });
    cb.part(`Manche cyclique ${sd.m}`, S.rod([1450, 750, sd.s * 420], [1350, 1300, sd.s * 420], 30), { mat: 'abs', color: DARK });
    cb.part(`Levier de pas collectif ${sd.m}`, S.rod([900, 800, sd.s * 640], [1300, 1050, sd.s * 700], 30), { mat: 'aluminium' });
    cb.part(`Palonnier anticouple ${sd.m}`, S.box(80, 150, 300), { pos: [2000, 850, sd.s * 420], mat: 'aluminium' });
  }
  cb.part('Banquette arrière 4 places', S.box(500, 450, 1700), { pos: [-500, 950, 0], mat: 'cuir', color: DARK });
  cb.part('Dossier de banquette', S.box(120, 700, 1700), { pos: [-800, 1450, 0], mat: 'cuir', color: DARK });
  cb.part('Batterie 24 V', S.box(250, 220, 200), { pos: [-1400, 1100, 300], mat: 'electrolyte', layer: 'meca' });
  void axisRot;
  return h;
}
