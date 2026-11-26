// Tracteurs agricoles – générateur paramétrique (cotes en mm)
// Repère : X avant, Y haut, Z droite. Origine au sol, au milieu de l'empattement.
// Architecture « bloc » : moteur + boîte + pont arrière forment le châssis porteur.
import { Assembly, S, SIDES, boltCircle, boltRow, axisRot } from '../core/builder.js';
import { wheel, inlineEngine } from '../core/parts.js';

import { TRACTOR_TYPES } from './meta/tractor.js';

export { TRACTOR_TYPES };

export function buildTractor(type = 'standard') {
  const P = TRACTOR_TYPES[type] || TRACTOR_TYPES.standard;
  const dia = ([w, ar, inch]) => Math.round(inch * 25.4 + 2 * w * ar / 100);
  const DF = dia(P.front), DR = dia(P.rear);
  const YF = DF / 2, YR = DR / 2;
  const XF = P.WB / 2, XR = -P.WB / 2;
  const PAINT = P.paint, DARK = 0x2a2c30;
  const k = P.narrow ? 0.72 : 1; // échelle des organes
  const bodyY = YR * (P.narrow ? 0.95 : 0.78); // axe du bloc moteur/boîte
  const noseX = XF + DF / 2 + (P.narrow ? 250 : 450);
  const cabX0 = XR + DR * 0.38, cabX1 = XR - DR * 0.36;
  const cabFloor = YR + 220, cabTop = Math.max(cabFloor + 1750, P.narrow ? 2400 : 3050);
  const cw = P.cabW / 2;

  const t = new Assembly(P.label, { prefix: 'TA', code: 'GEN', layer: 'meca', desc: `${P.desc} – empattement ${P.WB} mm – pneus AV ${P.front[0]}/${P.front[1]} R${P.front[2]}, AR ${P.rear[0]}/${P.rear[1]} R${P.rear[2]}` });

  // ------------------------------------------------------------------ Bloc porteur (structure)
  const bloc = t.group('Bloc porteur (châssis)', { code: 'BLC', layer: 'struct' });
  bloc.part('Carter de pont arrière', S.box(700 * k, 650 * k, 900 * k), { pos: [XR, YR, 0], mat: 'fonte', color: PAINT, desc: 'Carter fonte GS – différentiel arrière à blocage hydraulique' });
  for (const sd of SIDES) {
    bloc.part(`Trompette de pont ${sd.m}`, S.cyl(260 * k, P.trackR / 2 - 450 * k - P.rear[0] * 0.3, 'z'), { pos: [XR, YR, sd.s * ((P.trackR / 2 - P.rear[0] * 0.3 + 450 * k) / 2)], mat: 'fonte', color: PAINT });
    bloc.part(`Réducteur final ${sd.m}`, S.cyl(420 * k, 200 * k, 'z'), { pos: [XR, YR, sd.s * (P.trackR / 2 - P.rear[0] * 0.5 - 60)], mat: 'fonte', color: PAINT, desc: 'Réduction finale à train épicycloïdal' });
  }
  bloc.part('Carter de transmission', S.box(XR * -1 + 200, 520 * k, 600 * k), { pos: [XR / 2 + 50, bodyY, 0], mat: 'fonte', color: PAINT });
  bloc.part('Châssis avant (support moteur et essieu)', S.box(noseX - XF + 1100, 250 * k, 700 * k), { pos: [XF + (noseX - XF) / 2 - 450, YF + 80, 0], mat: 'fonte', color: DARK });
  boltRow(bloc, { from: [XR + 380 * k, bodyY + 240 * k, -260 * k], to: [XR + 380 * k, bodyY - 240 * k, -260 * k], n: 4, d: 20, L: 70, axis: 'x', dir: 1, label: 'Vis d\'assemblage pont/boîte G', couple: 560 });
  boltRow(bloc, { from: [XR + 380 * k, bodyY + 240 * k, 260 * k], to: [XR + 380 * k, bodyY - 240 * k, 260 * k], n: 4, d: 20, L: 70, axis: 'x', dir: 1, label: 'Vis d\'assemblage pont/boîte D', couple: 560 });

  // ------------------------------------------------------------------ Groupe motopropulseur
  const gmp = t.group('Groupe motopropulseur', { code: 'GMP', layer: 'meca' });
  const engX = XF - 50 + (P.narrow ? 0 : 100);
  inlineEngine(gmp, `Moteur diesel ${P.eng.n} cylindres ${(P.eng.n * Math.PI * (P.eng.bore / 20) ** 2 * P.eng.stroke / 10000).toFixed(1).replace('.', ',')} L – ${P.kw} kW`, {
    ...P.eng, pos: [engX, YF + 520 * k + 100, 0], rot: [0, 180, 0], code: 'MOT', diesel: true, turbo: true, journal: 80, rodD: 36, pin: 40, flywheel: 380, headBolt: 14, headTorque: '80 N·m + 2 × 90°',
    desc: 'Stage V – turbo + refroidisseur – SCR + filtre à particules',
  });
  gmp.part('Transmission à variation continue (CVT)', S.box(1000 * k, 480 * k, 560 * k), { pos: [XR / 2 + 300, bodyY + 60, 0], mat: 'fonte', color: PAINT, desc: 'Transmission hydromécanique 0,02–50 km/h' });
  gmp.part('Inverseur sous charge', S.cyl(400 * k, 300 * k, 'x'), { pos: [XF - 500, bodyY + 20, 0], mat: 'fonte', color: PAINT });
  gmp.part('Arbre de transmission avant (4RM)', S.cyl(70, XF - XR - 600, 'x'), { pos: [0, YF - 50, -150 * k], mat: 'acierHR' });
  gmp.part('Embrayage de pont avant', S.cyl(260 * k, 200, 'x'), { pos: [XR + 650, YF, -150 * k], mat: 'fonte', color: PAINT });
  const cool = gmp.group('Refroidissement', { code: 'REF' });
  cool.part('Radiateur de refroidissement moteur', S.box(80, 700 * k, 750 * k), { pos: [noseX - 350, YF + 650 * k + 150, 0], mat: 'aluminium' });
  cool.part('Refroidisseur d\'air de suralimentation', S.box(60, 600 * k, 750 * k), { pos: [noseX - 260, YF + 650 * k + 150, 0], mat: 'aluminium' });
  cool.part('Refroidisseur d\'huile hydraulique', S.box(50, 300 * k, 700 * k), { pos: [noseX - 200, YF + 650 * k - 300 * k + 150, 0], mat: 'aluminium' });
  cool.part('Ventilateur à viscocoupleur', S.cyl(650 * k, 120, 'x'), { pos: [noseX - 480, YF + 650 * k + 150, 0], mat: 'plastique' });
  gmp.part('Filtre à air sec', S.cyl(280 * k, 550 * k, 'x'), { pos: [noseX - 700, YF + 1000 * k + 200, 250 * k], mat: 'plastique', color: DARK });
  gmp.part('Pot catalytique (DOC + DPF + SCR)', S.cyl(300 * k, 800 * k, 'y'), { pos: [XF - 350, YF + 1100 * k + 300, cw - 150], mat: 'inox' });
  gmp.part('Tuyau d\'échappement vertical', S.cyl(110 * k, 700, 'y'), { pos: [XF - 350, YF + 1100 * k + 950, cw - 150], mat: 'chrome' });
  gmp.part('Réservoir de carburant', S.box(900 * k, 500 * k, 380 * k), { pos: [XR + DR * 0.55 + 400, bodyY - 50, -(cw + 50 * k)], mat: 'plastique', color: DARK, desc: `${P.narrow ? 80 : 330} litres` });
  gmp.part('Réservoir d\'AdBlue', S.box(400 * k, 400 * k, 250 * k), { pos: [XR + DR * 0.55 + 400, bodyY - 50, cw + 50 * k], mat: 'plastique', color: 0x1f4fa0 });
  gmp.part('Batteries 12 V (2 × 180 Ah)', S.box(500 * k, 250, 350 * k), { pos: [noseX - 900, YF + 300, 0], mat: 'electrolyte' });

  // ------------------------------------------------------------------ Hydraulique & attelages
  const hyd = t.group('Hydraulique, relevage & prise de force', { code: 'HYD', layer: 'meca' });
  hyd.part('Pompe hydraulique à cylindrée variable (Load Sensing)', S.cyl(220 * k, 300 * k, 'x'), { pos: [XF - 900, bodyY - 150, 250 * k], mat: 'fonte', desc: `${P.narrow ? 90 : 160} L/min – 200 bar` });
  const nD = P.narrow ? 3 : 5;
  for (let i = 0; i < nD; i++) hyd.part(`Distributeur auxiliaire ${i + 1}`, S.box(150, 120, 90 * k), { pos: [XR - 250 - i * 10, bodyY + 400 * k, -300 * k + i * 150 * k], mat: 'fonte', color: PAINT });
  for (let i = 0; i < nD * 2; i++) hyd.part(`Coupleur rapide ${i + 1}`, S.cyl(40, 80, 'x'), { pos: [XR - 450 * k, bodyY + 300 * k, -320 * k + i * 70 * k], mat: 'laiton' });
  const rel = hyd.group('Relevage arrière 3 points', { code: 'REL' });
  const hY = YR - 250 * k, hX = XR - 450 * k;
  for (const sd of SIDES) {
    rel.part(`Bras inférieur ${sd.m}`, S.rod([XR - 300 * k, YR - 150 * k, sd.s * 300 * k], [hX - 750 * k, hY - 150, sd.s * 430 * k], 70 * k), { mat: 'acierHR', color: DARK });
    rel.part(`Rotule d'attelage ${sd.m} (cat. ${P.narrow ? '2' : '3'})`, S.sphere(80 * k), { pos: [hX - 750 * k, hY - 150, sd.s * 430 * k], mat: 'acierHR' });
    rel.part(`Bras de relevage ${sd.m}`, S.rod([XR - 150, YR + 380 * k, sd.s * 300 * k], [XR - 700 * k, YR + 280 * k, sd.s * 330 * k], 60 * k), { mat: 'fonte', color: PAINT });
    rel.part(`Chandelle de relevage ${sd.m}`, S.rod([XR - 700 * k, YR + 280 * k, sd.s * 330 * k], [XR - 750 * k, YR - 150 * k, sd.s * 380 * k], 45 * k), { mat: 'acierHR', color: DARK });
    rel.part(`Vérin de relevage ${sd.m}`, S.rod([XR - 300 * k, YR - 300 * k, sd.s * 380 * k], [XR - 550 * k, YR + 300 * k, sd.s * 340 * k], 90 * k), { mat: 'chrome' });
    rel.part(`Stabilisateur latéral ${sd.m}`, S.rod([XR - 200 * k, YR - 250 * k, sd.s * 250 * k], [XR - 650 * k, YR - 300 * k, sd.s * 400 * k], 40 * k), { mat: 'acierHR', color: DARK });
  }
  rel.part('Troisième point hydraulique', S.rod([XR - 350 * k, YR + 300 * k, 0], [hX - 650 * k, YR + 250 * k, 0], 90 * k), { mat: 'chrome' });
  rel.part('Barre d\'attelage oscillante', S.box(700 * k, 60, 120), { pos: [XR - 550 * k, YR - 450 * k, 0], mat: 'acierHR', color: DARK });
  rel.part('Crochet d\'attelage automatique', S.box(200, 250, 150), { pos: [XR - 420 * k, YR - 280 * k, 0], mat: 'acierHR', color: 0xc0262d });
  const pdf = hyd.group('Prise de force arrière', { code: 'PDF' });
  pdf.part('Arbre de prise de force 1 3/8" – 6 cannelures', S.cyl(35, 120, 'x'), { pos: [XR - 400 * k, YR - 180 * k, 0], mat: 'acierHR', desc: '540 / 540E / 1000 tr/min' });
  pdf.part('Carter de prise de force', S.cyl(220 * k, 120, 'x'), { pos: [XR - 300 * k, YR - 180 * k, 0], mat: 'fonte', color: PAINT });
  pdf.part('Bol de protection de prise de force', S.box(150, 30, 280 * k), { pos: [XR - 420 * k, YR - 50 * k, 0], mat: 'peinture', color: 0xf2c200 });
  boltCircle(pdf, { n: 6, pcd: 160 * k, d: 12, L: 30, axis: 'x', at: [XR - 360 * k, YR - 180 * k, 0], dir: -1, label: 'Vis de carter PDF', couple: 85 });
  if (P.frontHitch) {
    const av = hyd.group('Relevage avant & prise de force avant', { code: 'RAV' });
    av.part('Bâti de relevage avant', S.box(250, 500, 800), { pos: [noseX + 50, YF + 150, 0], mat: 'acierHR', color: DARK });
    for (const sd of SIDES) av.part(`Bras inférieur avant ${sd.m}`, S.rod([noseX + 150, YF, sd.s * 350], [noseX + 550, YF - 150, sd.s * 400], 60), { mat: 'acierHR', color: DARK });
    av.part('Prise de force avant 1000 tr/min', S.cyl(35, 120, 'x'), { pos: [noseX + 200, YF - 100, 0], mat: 'acierHR' });
  } else {
    hyd.part('Masse avant porte-masses', S.box(200, 400, 600 * k), { pos: [noseX + 60, YF + 200, 0], mat: 'fonte', color: DARK });
  }
  for (let i = 0; i < P.weights; i++) hyd.part(`Masse d'alestage avant ${i + 1} (${P.narrow ? 25 : 50} kg)`, S.box(100, 350 * k, 600 * k), { pos: [noseX + 250 + (P.frontHitch ? 300 : 0) + (i % 5) * 0, YF + 150 + (i - P.weights / 2) * 0, -280 * k + (i % 5) * 140 * k], rot: [0, 90, 0], mat: 'fonte', color: DARK });

  // ------------------------------------------------------------------ Capot & carrosserie
  const car = t.group('Capot & carrosserie', { code: 'CAR', layer: 'ext' });
  const hoodTop = YF + 1150 * k + 250, hoodX1 = cabX0 - 50;
  car.part('Capot moteur basculant', S.extrude([[hoodX1, hoodTop], [noseX - 80, hoodTop - 40], [noseX, hoodTop - 160], [noseX, YF + 150], [hoodX1, YF + 150]], 760 * k, 30), { mat: 'peinture', color: PAINT, desc: 'Capot monobloc composite – ouverture assistée par vérin à gaz' });
  car.part('Calandre', S.box(30, hoodTop - YF - 400, 650 * k), { pos: [noseX + 5, (hoodTop + YF + 80) / 2, 0], mat: 'abs', color: DARK });
  for (const sd of SIDES) {
    car.part(`Phare de calandre ${sd.m}`, S.box(40, 90, 180 * k), { pos: [noseX + 5, hoodTop - 220, sd.s * 230 * k], mat: 'feuBlanc' });
    car.part(`Aile arrière ${sd.f}`, S.extrude(Array.from({ length: 13 }, (_, i) => { const a = Math.PI * (0.05 + 0.9 * i / 12); return [XR + (YR + 120) * Math.cos(a), YR + (YR + 120) * Math.sin(a)]; }).concat(Array.from({ length: 13 }, (_, i) => { const a = Math.PI * (0.95 - 0.9 * i / 12); return [XR + (YR + 110) * Math.cos(a), YR + (YR + 110) * Math.sin(a)]; })), P.rear[0] + 120), { pos: [0, 0, sd.s * (P.trackR / 2)], mat: 'peinture', color: PAINT });
    car.part(`Garde-boue avant pivotant ${sd.m}`, S.extrude(Array.from({ length: 9 }, (_, i) => { const a = Math.PI * (0.15 + 0.6 * i / 8); return [XF + (YF + 90) * Math.cos(a), YF + (YF + 90) * Math.sin(a)]; }).concat(Array.from({ length: 9 }, (_, i) => { const a = Math.PI * (0.75 - 0.6 * i / 8); return [XF + (YF + 80) * Math.cos(a), YF + (YF + 80) * Math.sin(a)]; })), P.front[0] + 80), { pos: [0, 0, sd.s * (P.trackF / 2)], mat: 'plastique', color: DARK });
    car.part(`Marchepied d'accès ${sd.m}`, S.box(380, 30, 220), { pos: [cabX0 - 150, YR * 0.55, sd.s * (cw + 120)], mat: 'acier', color: DARK });
    car.part(`Marchepied inférieur ${sd.m}`, S.box(380, 30, 220), { pos: [cabX0 - 150, YR * 0.28, sd.s * (cw + 120)], mat: 'acier', color: DARK });
    car.part(`Feu arrière ${sd.m}`, S.box(60, 120, 200), { pos: [XR - YR * 0.8, YR + 200, sd.s * (P.trackR / 2 + 50)], mat: 'feuRouge' });
  }
  car.part('Gyrophare', S.cyl(150, 180, 'y'), { pos: [cabX1 + 300, cabTop + 150, -cw + 200], mat: 'feuOrange' });

  // ------------------------------------------------------------------ Cabine
  const cab = t.group('Cabine', { code: 'CAB', layer: 'ext' });
  for (const sd of SIDES) for (const [x, n] of [[cabX0, 'avant'], [cabX1, 'arrière']]) {
    cab.part(`Montant ${n} ${sd.m}`, S.box(90, cabTop - cabFloor, 90), { pos: [x, (cabTop + cabFloor) / 2, sd.s * cw], mat: 'acierHR', color: DARK, layer: 'struct', desc: 'Structure de protection ROPS / FOPS' });
    for (const dy of [0, 1]) cab.part(`Vis de silentbloc ${n} ${sd.c}${dy + 1}`, S.bolt(16, 60), { pos: [x + (dy ? 40 : -40), cabFloor - 20, sd.s * cw], rot: [180, 0, 0], mat: 'acierHR', couple: 270, layer: 'struct' });
  }
  cab.part('Plancher de cabine', S.box(cabX0 - cabX1 + 60, 40, P.cabW + 60), { pos: [(cabX0 + cabX1) / 2, cabFloor, 0], mat: 'acier', color: DARK, layer: 'struct' });
  cab.part('Toit de cabine', S.box(cabX0 - cabX1 + 400, 160, P.cabW + 260), { pos: [(cabX0 + cabX1) / 2 + 100, cabTop + 80, 0], mat: 'composite', color: PAINT });
  cab.part('Pare-brise monobloc', S.box(8, cabTop - cabFloor - 250, P.cabW - 80), { pos: [cabX0 + 20, (cabTop + cabFloor + 250) / 2, 0], rot: [0, 0, 4], mat: 'verre' });
  cab.part('Lunette arrière ouvrante', S.box(8, cabTop - cabFloor - 600, P.cabW - 80), { pos: [cabX1 - 10, (cabTop + cabFloor + 600) / 2, 0], mat: 'verre' });
  for (const sd of SIDES) {
    cab.part(`Porte vitrée ${sd.f}`, S.box(cabX0 - cabX1 - 120, cabTop - cabFloor - 150, 8), { pos: [(cabX0 + cabX1) / 2, (cabTop + cabFloor + 150) / 2, sd.s * (cw + 10)], mat: 'verre' });
    cab.part(`Poignée de porte ${sd.f}`, S.box(30, 200, 30), { pos: [cabX1 + 150, cabFloor + 900, sd.s * (cw + 40)], mat: 'acier' });
    cab.part(`Rétroviseur ${sd.m}`, S.box(40, 300, 200), { pos: [cabX0 + 150, cabTop - 250, sd.s * (cw + 550)], mat: 'chrome' });
    cab.part(`Bras de rétroviseur ${sd.m}`, S.rod([cabX0, cabTop - 150, sd.s * cw], [cabX0 + 150, cabTop - 250, sd.s * (cw + 450)], 30), { mat: 'acier', color: DARK });
    for (const x of [cabX0 + 150, cabX1 - 50]) cab.part(`Phare de travail de toit ${sd.c}${x > 0 ? 'AV' : 'AR'}`, S.box(60, 100, 160), { pos: [x, cabTop + 80, sd.s * (cw + 60)], mat: 'feuBlanc' });
  }
  const pos = t.group('Poste de conduite', { code: 'PDC', layer: 'int' });
  const seatX = (cabX0 + cabX1) / 2 - 100;
  pos.part('Siège à suspension pneumatique', S.box(500, 120, 520 * Math.min(1, k + 0.15)), { pos: [seatX, cabFloor + 500, 0], mat: 'tissu' });
  pos.part('Dossier de siège', S.box(120, 650, 500 * Math.min(1, k + 0.15)), { pos: [seatX - 260, cabFloor + 880, 0], rot: [0, 0, -10], mat: 'tissu' });
  pos.part('Suspension de siège', S.box(400, 300, 400 * k), { pos: [seatX, cabFloor + 260, 0], mat: 'caoutchouc', layer: 'meca' });
  pos.part('Accoudoir multifonction', S.box(500, 120, 150), { pos: [seatX + 50, cabFloor + 750, cw * 0.55], mat: 'abs' });
  pos.part('Joystick de transmission', S.cyl(45, 150, 'y'), { pos: [seatX + 250, cabFloor + 880, cw * 0.55], mat: 'abs' });
  pos.part('Terminal ISOBUS (écran tactile 12")', S.box(30, 230, 300), { pos: [seatX + 450, cabFloor + 1150, cw * 0.75], rot: [0, -30, 15], mat: 'ecran' });
  pos.part('Siège passager rabattable', S.box(350, 60, 350 * k), { pos: [seatX + 100, cabFloor + 450, -cw * 0.6], mat: 'tissu' });
  pos.part('Volant inclinable', S.torus(420 * Math.min(1, k + 0.15), 30, 'x'), { pos: [cabX0 - 300, cabFloor + 1050, 0], rot: [0, 0, -35], mat: 'abs', color: 0x111111 });
  pos.part('Colonne de direction', S.rod([cabX0 - 300, cabFloor + 1050, 0], [cabX0 - 100, cabFloor + 100, 0], 60), { mat: 'abs', color: 0x111111 });
  pos.part('Tableau de bord sur colonne', S.box(150, 200, 380 * k), { pos: [cabX0 - 200, cabFloor + 900, 0], rot: [0, 0, -35], mat: 'ecran' });
  for (const [n, z] of [['Pédale d\'embrayage / inverseur', -200 * k], ['Pédale de frein gauche', 150 * k], ['Pédale de frein droite', 250 * k], ['Pédale d\'accélérateur', 380 * k]]) pos.part(n, S.box(80, 220, 80), { pos: [cabX0 - 120, cabFloor + 150, z], rot: [0, 0, 35], mat: 'acier', color: DARK });
  pos.part('Climatisation (évaporateur de toit)', S.box(600, 120, 700 * k), { pos: [(cabX0 + cabX1) / 2, cabTop - 80, 0], mat: 'plastique', layer: 'meca' });

  // ------------------------------------------------------------------ Trains roulants
  const tr = t.group('Trains roulants', { code: 'TRN', layer: 'sol' });
  const eav = tr.group('Pont avant moteur oscillant', { code: 'PAV' });
  eav.part('Carter de pont avant', S.cyl(220 * k, P.trackF - P.front[0] - 150, 'z'), { pos: [XF, YF, 0], mat: 'fonte', color: PAINT });
  eav.part('Différentiel avant à glissement limité', S.sphere(380 * k), { pos: [XF, YF, 0], mat: 'fonte', color: PAINT });
  eav.part('Axe d\'oscillation', S.cyl(90, 600, 'x'), { pos: [XF, YF + 150 * k, 0], mat: 'acierHR' });
  eav.part('Vérin de direction double effet', S.cyl(80, P.trackF - P.front[0] - 400, 'z'), { pos: [XF - 220 * k, YF + 50, 0], mat: 'chrome' });
  if (!P.narrow) for (const sd of SIDES) eav.part(`Vérin de suspension de pont ${sd.m}`, S.rod([XF + 200, YF + 150, sd.s * 300], [XF + 300, YF + 500, sd.s * 280], 80), { mat: 'chrome', desc: 'Suspension hydropneumatique ±50 mm' });
  for (const sd of SIDES) {
    eav.part(`Réducteur de roue avant ${sd.m}`, S.cyl(320 * k, 180 * k, 'z'), { pos: [XF, YF, sd.s * (P.trackF / 2 - P.front[0] / 2 - 90 * k)], mat: 'fonte', color: PAINT });
    eav.part(`Pivot de fusée ${sd.m}`, S.cyl(110 * k, 380 * k, 'y'), { pos: [XF, YF, sd.s * (P.trackF / 2 - P.front[0] / 2 - 190 * k)], mat: 'fonte', color: PAINT });
    wheel(tr, `Roue avant ${sd.f}`, sd.s, {
      pos: [XF, YF, sd.s * P.trackF / 2], tire: P.front, studs: P.narrow ? 6 : 8, pcd: P.narrow ? 205 : 275, stud: P.narrow ? 16 : 20, studL: 40, studKind: 'nut', studLabel: 'Écrou de roue', couple: P.narrow ? 300 : 470,
      code: 'ROU', hubD: 240 * k, hubL: 120, spokes: 0, rimMat: 'peinture', cap: false, tireRef: `${P.front[0]}/${P.front[1]} R${P.front[2]} – pneu agraire`,
    });
  }
  const ear = tr.group('Roues arrière & freins', { code: 'PAR' });
  ear.part('Frein multidisques à bain d\'huile', S.cyl(400 * k, 200 * k, 'z'), { pos: [XR, YR, 0], mat: 'fonte', desc: 'Freinage hydraulique assisté – 4 disques par côté' });
  for (const sd of SIDES) {
    wheel(tr, `Roue arrière ${sd.f}`, sd.s, {
      pos: [XR, YR, sd.s * P.trackR / 2], tire: P.rear, studs: P.narrow ? 8 : 10, pcd: P.narrow ? 275 : 335, stud: P.narrow ? 18 : 22, studL: 45, studKind: 'nut', studLabel: 'Écrou de roue', couple: P.narrow ? 400 : 650,
      code: 'ROU', hubD: 320 * k, hubL: 160, spokes: 0, rimMat: 'peinture', cap: false,
    });
    // Crampons : barrettes en chevron sur la bande de roulement
    const nL = P.narrow ? 20 : 26, Rr = DR / 2;
    const cr = ear.group(`Barrettes de pneu arrière ${sd.m}`, { pos: [XR, YR, sd.s * P.trackR / 2], code: 'ROU' });
    for (let i = 0; i < nL; i++) {
      const a = (i / nL) * 360;
      for (const h of [-1, 1]) cr.part(`Barrette ${i + 1}${h < 0 ? 'a' : 'b'}`, S.box(55, 60, P.rear[0] * 0.48), {
        pos: [Math.cos(a * Math.PI / 180) * (Rr + 15), Math.sin(a * Math.PI / 180) * (Rr + 15), h * P.rear[0] * 0.24], rot: [h * 25, 0, a + 90], mat: 'caoutchouc',
      });
    }
  }
  for (const sd of SIDES) {
    const nL = P.narrow ? 16 : 20, Rf = DF / 2;
    const cr = tr.group(`Barrettes de pneu avant ${sd.m}`, { pos: [XF, YF, sd.s * P.trackF / 2], code: 'ROU' });
    for (let i = 0; i < nL; i++) {
      const a = (i / nL) * 360;
      for (const h of [-1, 1]) cr.part(`Barrette ${i + 1}${h < 0 ? 'a' : 'b'}`, S.box(40, 45, P.front[0] * 0.48), {
        pos: [Math.cos(a * Math.PI / 180) * (Rf + 10), Math.sin(a * Math.PI / 180) * (Rf + 10), h * P.front[0] * 0.24], rot: [h * 25, 0, a + 90], mat: 'caoutchouc',
      });
    }
  }
  void axisRot;
  return t;
}
