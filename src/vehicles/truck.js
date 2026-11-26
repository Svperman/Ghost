// Camions – générateur paramétrique (cotes en mm)
// Repère : X avant, Y haut, Z droite. Origine au sol.
import { Assembly, S, SIDES, boltRow, boltCircle, axisRot } from '../core/builder.js';
import { wheel, inlineEngine, seat } from '../core/parts.js';

const CHASSIS = 0x202326;
const WY = 538; // pneus 315/80 R22.5

export const TRUCK_TYPES = {
  tracteur: {
    label: 'Tracteur routier 4×2', desc: 'Tracteur de semi-remorque – PTRA 44 t – cabine couchette',
    cab: 'couchette', color: 0xe8e8e6, fronts: [1500], rears: [{ x: -2300, driven: true }], rearEnd: -3050, body: 'sellette', tankX: -250, sideX: -1050,
    makers: ['Renault Trucks (T)', 'Volvo (FH)', 'Scania (série R / S)', 'Mercedes-Benz (Actros)', 'DAF (XF)', 'MAN (TGX)', 'Iveco (S-Way)'],
  },
  tracteur62: {
    label: 'Tracteur 6×2 essieu relevable', desc: 'Tracteur 6×2 avec essieu poussé relevable – PTRA 44 t',
    cab: 'couchette', color: 0x1d3f7a, fronts: [1500], rears: [{ x: -2000, driven: true }, { x: -3350, driven: false, single: true, lift: true }], rearEnd: -4000, body: 'sellette', tankX: -250, sideX: -850,
    makers: ['Volvo (FH 6×2)', 'Scania (R 6×2)', 'DAF (XF FTG)', 'MAN (TGX 6×2)', 'Mercedes-Benz (Actros L 6×2)'],
  },
  benne: {
    label: 'Porteur benne 8×4 (chantier)', desc: 'Porteur 4 essieux 32 t – benne acier 16 m³ – cabine courte',
    cab: 'jour', color: 0xf2a400, fronts: [1500, -400], rears: [{ x: -3300, driven: true }, { x: -4650, driven: true }], rearEnd: -5500, body: 'benne', tankX: -1500, sideX: -2250, tankL: 900,
    makers: ['Volvo (FMX)', 'Scania (XT)', 'Mercedes-Benz (Arocs)', 'Renault Trucks (C)', 'MAN (TGS)', 'Iveco (X-Way)'],
  },
  fourgon: {
    label: 'Porteur fourgon 4×2 (livraison)', desc: 'Porteur 19 t – caisse fourgon 7,5 m avec hayon élévateur',
    cab: 'jour', color: 0xc0262d, fronts: [1500], rears: [{ x: -3400, driven: true }], rearEnd: -6000, body: 'caisse', tankX: -700, sideX: -1800, tankL: 1100,
    makers: ['Renault Trucks (D)', 'Mercedes-Benz (Atego)', 'DAF (LF / CF)', 'MAN (TGL / TGM)', 'Volvo (FL)', 'Iveco (Eurocargo)', 'Isuzu (série F)'],
  },
};

export function buildTruck(type = 'tracteur') {
  const T = TRUCK_TYPES[type] || TRUCK_TYPES.tracteur;
  const CAB = T.color;
  const XF = T.fronts[0];
  const xEnd = T.rearEnd, xFront = 2870;
  const frameL = xFront - xEnd, frameC = (xFront + xEnd) / 2;
  const sleeper = T.cab === 'couchette';
  const cabTop = sleeper ? 3900 : 3100, cabBack = sleeper ? 1050 : 1650;
  const tk = new Assembly(T.label, { prefix: 'CM', code: 'GEN', layer: 'meca', desc: `${T.desc} – longueur hors-tout ${Math.round(3010 - xEnd)} mm` });

  // ------------------------------------------------------------------ Châssis
  const ch = tk.group('Châssis-cadre', { code: 'CHS', layer: 'struct' });
  for (const sd of SIDES) {
    const z = sd.s * 430;
    ch.part(`Longeron ${sd.m}`, S.box(frameL, 300, 8), { pos: [frameC, 950, z], mat: 'peinture', color: CHASSIS, desc: 'Profil en U 300 × 90 × 8 mm – acier S500MC' });
    ch.part(`Aile supérieure de longeron ${sd.m}`, S.box(frameL, 8, 90), { pos: [frameC, 1096, z - sd.s * 41], mat: 'peinture', color: CHASSIS });
    ch.part(`Aile inférieure de longeron ${sd.m}`, S.box(frameL, 8, 90), { pos: [frameC, 804, z - sd.s * 41], mat: 'peinture', color: CHASSIS });
  }
  const nTr = Math.max(6, Math.round(frameL / 900));
  for (let i = 0; i < nTr; i++) {
    const x = xFront - 70 - i * ((frameL - 140) / (nTr - 1));
    const tg = ch.group(`Traverse n°${i + 1}`, { code: 'CHS' });
    tg.part('Traverse', S.box(120, 220, 852), { pos: [x, 950, 0], mat: 'peinture', color: CHASSIS });
    for (const sd of SIDES) {
      tg.part(`Gousset ${sd.m}`, S.box(260, 260, 8), { pos: [x, 950, sd.s * 418], mat: 'peinture', color: CHASSIS });
      for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) {
        tg.part(`Boulon ${sd.c}${r + 1}${c + 1}`, S.bolt(14, 40, 'z'), { pos: [x - 80 + c * 80, 1010 - r * 120, sd.s * 438], rot: axisRot('z', sd.s), mat: 'acierHR', couple: 195 });
        tg.part(`Écrou ${sd.c}${r + 1}${c + 1}`, S.nut(14, 'z'), { pos: [x - 80 + c * 80, 1010 - r * 120, sd.s * 410], rot: axisRot('z', -sd.s), mat: 'zingue', couple: 195 });
      }
    }
  }
  ch.part('Pare-chocs avant', S.box(260, 420, 2480), { pos: [2860, 750, 0], mat: 'composite', color: 0x2a2c30, layer: 'ext' });
  ch.part('Barre anti-encastrement avant', S.box(120, 120, 2300), { pos: [2800, 500, 0], mat: 'acier', color: CHASSIS });
  if (T.body !== 'sellette') {
    ch.part('Barre anti-encastrement arrière', S.box(100, 150, 2300), { pos: [xEnd + 50, 500, 0], mat: 'acier', color: CHASSIS });
    for (const sd of SIDES) ch.part(`Support anti-encastrement ${sd.m}`, S.box(80, 400, 60), { pos: [xEnd + 50, 680, sd.s * 400], mat: 'acier', color: CHASSIS });
  }
  if (T.body === 'caisse') for (const sd of SIDES) ch.part(`Protection latérale ${sd.m}`, S.box(XF - T.rears[0].x - 1300, 250, 20), { pos: [(XF + T.rears[0].x) / 2, 600, sd.s * 1230], mat: 'aluminium' });

  // ------------------------------------------------------------------ Cabine
  const cab = tk.group(sleeper ? 'Cabine couchette' : 'Cabine courte (jour)', { code: 'CAB', layer: 'ext' });
  cab.part('Caisse de cabine', S.extrude([[cabBack, 1350], [cabBack, cabTop - 120], [cabBack + 150, cabTop], [2650, cabTop], [2860, cabTop - 250], [2960, 2400], [2960, 1350]], 2490, 60), { mat: 'peinture', color: CAB, desc: 'Cabine acier galvanisé' });
  if (sleeper) cab.part('Déflecteur de toit', S.extrude([[1300, cabTop], [1300, cabTop + 100], [2200, cabTop + 100], [2650, cabTop]], 2300, 30), { mat: 'composite', color: CAB });
  else cab.part('Gyrophare / rampe de toit', S.box(200, 120, 1200), { pos: [2500, cabTop + 60, 0], mat: 'feuOrange' });
  cab.part('Pare-brise', S.box(12, cabTop - 2750, 2250), { pos: [2918, 2400 + (cabTop - 2400) / 2 - 140, 0], rot: [0, 0, 4.7], mat: 'verre' });
  cab.part('Pare-soleil extérieur', S.box(300, 20, 2400), { pos: [2950, cabTop - 260, 0], rot: [0, 0, -8], mat: 'composite', color: 0x2a2c30 });
  const cal = cab.group('Face avant', { code: 'CAB' });
  cal.part('Calandre', S.box(30, 900, 1700), { pos: [2975, 1950, 0], mat: 'abs', color: 0x2a2c30 });
  for (let i = 0; i < 6; i++) cal.part(`Lame de calandre ${i + 1}`, S.box(20, 30, 1650), { pos: [2995, 1600 + i * 140, 0], mat: 'chrome' });
  cal.part('Emblème constructeur', S.box(10, 120, 500), { pos: [3000, 2350, 0], mat: 'chrome', desc: 'Emplacement du logo constructeur' });
  cal.part('Marchepied de maintenance', S.box(250, 40, 900), { pos: [3010, 1400, 0], mat: 'aluminium' });
  for (const sd of SIDES) {
    cal.part(`Projecteur ${sd.m}`, S.box(60, 200, 450), { pos: [2985, 900, sd.s * 950], mat: 'feuBlanc' });
    cal.part(`Clignotant avant ${sd.m}`, S.box(50, 90, 160), { pos: [2980, 900, sd.s * 1160], mat: 'feuOrange' });
    cal.part(`Feu de gabarit de toit ${sd.m}`, S.box(40, 50, 120), { pos: [2700, cabTop + 60, sd.s * 900], mat: 'feuOrange' });
    const pt = cab.group(`Portière ${sd.f}`, { code: 'POR' });
    pt.part('Panneau de porte', S.extrude([[1850, 1450], [1850, 3000], [2850, 3000], [2900, 2400], [2900, 1450]], 10, 3), { pos: [0, 0, sd.s * 1250], mat: 'peinture', color: CAB });
    pt.part('Vitre de porte', S.extrude([[1900, 2450], [1900, 2950], [2820, 2950], [2860, 2450]], 6), { pos: [0, 0, sd.s * 1258], mat: 'verre' });
    pt.part('Poignée de porte', S.box(160, 40, 30), { pos: [2000, 2250, sd.s * 1270], mat: 'chrome' });
    pt.part('Poignée de maintien', S.rod([1820, 1700, sd.s * 1270], [1820, 2800, sd.s * 1270], 32), { mat: 'chrome' });
    for (const y of [1700, 2800]) {
      pt.part(`Charnière ${y < 2000 ? 'basse' : 'haute'}`, S.box(80, 120, 40), { pos: [2915, y, sd.s * 1235], mat: 'acier' });
      for (let k = 0; k < 3; k++) pt.part(`Vis de charnière ${y < 2000 ? 'basse' : 'haute'} ${k + 1}`, S.bolt(10, 30, 'x'), { pos: [2950, y - 40 + k * 40, sd.s * 1235], mat: 'acierHR', couple: 49 });
    }
    const rv = cab.group(`Rétroviseurs ${sd.m}s`, { code: 'RET' });
    rv.part('Bras de rétroviseur', S.rod([2800, 3000, sd.s * 1245], [2950, 3000, sd.s * 1450], 40), { mat: 'abs' });
    rv.part('Rétroviseur principal', S.box(60, 450, 220), { pos: [2950, 2700, sd.s * 1460], mat: 'abs', color: 0x2a2c30 });
    rv.part('Miroir principal', S.box(5, 420, 200), { pos: [2918, 2700, sd.s * 1460], mat: 'chrome' });
    rv.part('Rétroviseur grand-angle', S.box(60, 180, 200), { pos: [2950, 2350, sd.s * 1460], mat: 'abs', color: 0x2a2c30 });
    rv.part('Rétroviseur d\'accostage', S.box(160, 60, 220), { pos: [3050, cabTop - 200, sd.s * 1050], mat: 'abs', color: 0x2a2c30 });
    const mp = cab.group(`Marchepieds ${sd.m}s`, { code: 'CAB' });
    for (let k = 0; k < 3; k++) {
      mp.part(`Marche ${k + 1}`, S.box(500, 30, 220), { pos: [2380, 650 + k * 380, sd.s * (1150 - k * 20)], mat: 'aluminium' });
      for (const dx of [-200, 200]) mp.part(`Vis de marche ${k + 1}${dx < 0 ? 'a' : 'b'}`, S.capScrew(8, 25, 'y'), { pos: [2380 + dx, 668 + k * 380, sd.s * (1150 - k * 20)], mat: 'inox', couple: 25 });
    }
    mp.part('Support de marchepied', S.box(40, 900, 40), { pos: [2380, 1000, sd.s * 1050], mat: 'acier', color: CHASSIS });
    cab.part(`Aile avant ${sd.f}`, S.box(1300, 30, 400), { pos: [XF, 1170, sd.s * 1050], mat: 'composite', color: 0x2a2c30 });
    cab.part(`Bavette avant ${sd.f}`, S.box(10, 400, 380), { pos: [XF - 620, 920, sd.s * 1050], mat: 'caoutchouc' });
  }
  const susp = cab.group('Suspension de cabine', { code: 'SCA', layer: 'meca' });
  for (const [x, nom] of [[2700, 'avant'], [cabBack + 150, 'arrière']]) {
    for (const sd of SIDES) {
      susp.part(`Amortisseur de cabine ${nom} ${sd.m}`, S.cyl(60, 280, 'y'), { pos: [x, 1220, sd.s * 480], mat: 'peinture', color: 0x222222 });
      susp.part(`Ressort de cabine ${nom} ${sd.m}`, S.spring(110, 10, 220, 5), { pos: [x, 1220, sd.s * 480], mat: 'peinture', color: 0xc0262d });
      susp.part(`Vis de silent-bloc ${nom} ${sd.m}`, S.bolt(16, 80, 'z'), { pos: [x, 1340, sd.s * 520], rot: axisRot('z', sd.s), mat: 'acierHR', couple: 240 });
    }
  }
  susp.part('Barre de basculement de cabine', S.cyl(50, 1100, 'z'), { pos: [2700, 1180, 0], mat: 'acier' });
  susp.part('Vérin de basculement', S.rod([2400, 900, 520], [2650, 1350, 520], 50), { mat: 'peinture', color: 0x222222 });

  const int = cab.group('Aménagement intérieur', { code: 'INT', layer: 'int' });
  seat(int, 'Siège conducteur suspendu', [2350, 1950, -620], { code: 'SIE', w: 560 });
  seat(int, 'Siège passager', [2350, 1950, 620], { code: 'SIE', w: 540 });
  int.part('Planche de bord', S.box(450, 500, 2300), { pos: [2700, 2250, 0], mat: 'abs', color: 0x2c2e33 });
  int.part('Combiné d\'instruments', S.box(30, 200, 450), { pos: [2470, 2550, -620], rot: [0, 0, 15], mat: 'ecran' });
  int.part('Volant', S.torus(470, 34, 'x'), { pos: [2470, 2420, -620], rot: [0, 0, 35], mat: 'cuir', color: 0x151515 });
  int.part('Colonne de direction', S.rod([2470, 2420, -620], [2850, 1500, -620], 40), { mat: 'acier' });
  int.part('Capot moteur intérieur (tunnel)', S.box(800, 300, 700), { pos: [2000, 1500, 0], mat: 'abs', color: 0x2c2e33 });
  if (sleeper) {
    int.part('Couchette inférieure', S.box(700, 150, 2000), { pos: [1400, 1950, 0], mat: 'mousse' });
    int.part('Couchette supérieure', S.box(650, 120, 2000), { pos: [1400, 3000, 0], mat: 'mousse' });
    int.part('Réfrigérateur', S.box(500, 350, 400), { pos: [1450, 1650, 0], mat: 'abs' });
  }

  // ------------------------------------------------------------------ Groupe motopropulseur
  const gmp = tk.group('Groupe motopropulseur', { code: 'GMP', layer: 'meca' });
  inlineEngine(gmp, 'Moteur diesel 6 cylindres 12,8 L', {
    n: 6, bore: 131, stroke: 158, pitch: 155, pos: [1450, 1150, 0], rot: [0, 180, 0], code: 'MOT', valves: 2, diesel: true, turbo: true,
    journal: 100, pin: 50, rodD: 45, flywheel: 480, headBolt: 18, headTorque: '100 N·m + 150 N·m + 90° + 90°', alt: 160,
    desc: '12 777 cm³ – 24 soupapes – 375 kW – Euro VI', blockMat: 'fonte',
  });
  const bv = gmp.group('Boîte de vitesses robotisée 12 rapports', { code: 'BV' });
  bv.part('Carter d\'embrayage', S.cyl(560, 200, 'x'), { pos: [780, 1040, 0], mat: 'aluminium' });
  bv.part('Disque d\'embrayage Ø430', S.tube(430, 100, 16, 'x'), { pos: [820, 1040, 0], mat: 'feutre' });
  bv.part('Mécanisme d\'embrayage', S.cyl(450, 60, 'x'), { pos: [770, 1040, 0], mat: 'acier' });
  bv.part('Carter de boîte', S.box(700, 450, 480), { pos: [330, 1000, 0], mat: 'aluminium' });
  bv.part('Relais (range) planétaire', S.cyl(400, 200, 'x'), { pos: [-110, 1000, 0], mat: 'aluminium' });
  bv.part('Unité de commande de boîte', S.box(300, 150, 250), { pos: [330, 1290, 0], mat: 'aluminium' });
  bv.part('Ralentisseur hydraulique (retarder)', S.cyl(380, 160, 'x'), { pos: [-290, 980, 0], mat: 'fonte' });
  bv.part('Bride de sortie de boîte', S.cyl(180, 40, 'x'), { pos: [-390, 980, 0], mat: 'acierHR' });
  boltCircle(bv, { n: 16, pcd: 520, d: 12, L: 40, axis: 'x', at: [880, 1040, 0], dir: 1, label: 'Vis de cloche', couple: 85 });
  if (T.fronts.length > 1) bv.part('Prise de force (PTO) pour hydraulique de benne', S.box(200, 150, 150), { pos: [330, 830, 200], mat: 'fonte' });
  const tr = gmp.group('Transmission', { code: 'TRA' });
  const driven = T.rears.filter((r) => r.driven);
  const x1 = driven[0].x;
  tr.part('Arbre de transmission – tronçon avant', S.rod([-410, 980, 0], [(-410 + x1) / 2, 800, 0], 120, 110), { mat: 'acierHR' });
  tr.part('Palier intermédiaire', S.box(120, 160, 300), { pos: [(-410 + x1) / 2, 850, 0], mat: 'peinture', color: 0x222222 });
  tr.part('Arbre de transmission – tronçon arrière', S.rod([(-410 + x1) / 2, 800, 0], [x1 + 380, 640, 0], 120, 110), { mat: 'acierHR' });
  for (const [nom, x, y] of [['avant', -420, 980], ['intermédiaire', (-410 + x1) / 2 - 10, 800], ['arrière', x1 + 370, 640]]) {
    tr.part(`Croisillon de cardan ${nom}`, S.box(80, 160, 160), { pos: [x, y, 0], mat: 'acierHR' });
    boltCircle(tr, { n: 8, pcd: 155, d: 14, L: 50, axis: 'x', at: [x + 25, y, 0], dir: 1, label: `Boulon de bride ${nom}`, couple: 220 });
  }
  if (driven.length > 1) tr.part('Arbre inter-pont', S.rod([x1 - 150, 640, 0], [driven[1].x + 380, 640, 0], 110, 100), { mat: 'acierHR' });

  const ref = gmp.group('Refroidissement', { code: 'REF' });
  ref.part('Radiateur', S.box(60, 1000, 1050), { pos: [2650, 1450, 0], mat: 'aluminium' });
  ref.part('Refroidisseur d\'air de suralimentation', S.box(50, 900, 1050), { pos: [2720, 1450, 0], mat: 'aluminium' });
  ref.part('Ventilateur Ø750 à visco-coupleur', S.cyl(750, 120, 'x'), { pos: [2520, 1350, 0], mat: 'plastique' });
  ref.part('Vase d\'expansion', S.box(250, 250, 500), { pos: [2500, 2000, 300], mat: 'composite' });

  const al = gmp.group('Alimentation & post-traitement', { code: 'ALM' });
  const tL = T.tankL || 1600, tX = T.tankX, sX = T.sideX;
  al.part(`Réservoir de gazole ${Math.round(tL * 680 * 620 * 0.9 / 1e7) * 10} L`, S.box(tL, 680, 620), { pos: [tX, 1000, -860], mat: 'aluminium', desc: 'Réservoir aluminium' });
  al.part('Bouchon de réservoir de gazole', S.cyl(110, 40, 'y'), { pos: [tX - tL / 2 + 200, 1360, -860], mat: 'aluminium' });
  for (const k of [1, 2]) {
    al.part(`Sangle de réservoir ${k}`, S.box(50, 720, 640), { pos: [tX + (k === 1 ? -tL / 3 : tL / 3), 1000, -860], mat: 'inox' });
    al.part(`Tendeur de sangle ${k}`, S.bolt(12, 120, 'y'), { pos: [tX + (k === 1 ? -tL / 3 : tL / 3), 600, -1150], rot: [180, 0, 0], mat: 'inox', couple: 40 });
  }
  al.part('Réservoir AdBlue', S.box(500, 500, 500), { pos: [sX, 1000, 860], mat: 'plastique', color: 0x2a5fb0 });
  const scrL = T.fronts.length > 1 ? 700 : 1000;
  al.part('Silencieux catalytique SCR', S.box(scrL, 650, 600), { pos: [T.fronts.length > 1 ? (T.fronts[0] + T.fronts[1]) / 2 : sX + 1400, 1000, 860], mat: 'inox', desc: 'DOC + FAP + SCR intégrés' });
  al.part('Tube d\'échappement', S.pipe([[1300, 1150, 200], [1100, 900, 400], [700, 900, 700]], 125), { mat: 'inox' });
  al.part('Préfiltre à gazole / séparateur d\'eau', S.cyl(120, 250, 'y'), { pos: [800, 1000, -560], mat: 'plastique' });
  al.part('Filtre à air', S.cyl(400, 700, 'y'), { pos: [cabBack, cabTop - 1200, -1120], mat: 'abs', color: 0x2a2c30 });
  if (!sleeper) al.part('Échappement vertical', S.cyl(130, 1600, 'y'), { pos: [cabBack - 120, 2400, 1000], mat: 'chrome' });

  const pn = gmp.group('Circuit pneumatique & électrique', { code: 'PNE' });
  pn.part('Compresseur d\'air', S.cyl(160, 250, 'x'), { pos: [1150, 1300, 300], mat: 'fonte' });
  pn.part('Dessiccateur d\'air', S.cyl(180, 280, 'y'), { pos: [500, 900, 600], mat: 'peinture', color: 0x222222 });
  for (let i = 0; i < 4; i++) pn.part(`Réservoir d'air ${i + 1} (30 L)`, S.cyl(246, 800, 'x'), { pos: [tX - 500 + (i % 2) * 900, 700 + Math.floor(i / 2) * 270, i < 2 ? 600 : -600], mat: 'acier', color: CHASSIS });
  const bat = pn.group('Coffre à batteries', { code: 'ELE' });
  bat.part('Coffre', S.box(600, 320, 560), { pos: [sX + 650, 1000, 860], mat: 'abs', color: 0x2a2c30 });
  for (const k of [1, 2]) bat.part(`Batterie 12 V 225 Ah n°${k}`, S.box(518, 242, 276), { pos: [sX + 650, 990, 860 + (k === 1 ? -140 : 140)], mat: 'electrolyte' });
  bat.part('Coupe-batterie', S.box(80, 120, 80), { pos: [sX + 950, 1100, 1150], mat: 'abs', color: 0xc0262d });

  // ------------------------------------------------------------------ Essieux & suspensions
  const ls = tk.group('Essieux & suspensions', { code: 'LAS', layer: 'sol' });
  T.fronts.forEach((fx, i) => {
    const eav = ls.group(`Essieu avant directeur ${T.fronts.length > 1 ? `n°${i + 1} ` : ''}8 t`, { code: 'EAV' });
    eav.part('Corps d\'essieu (poutre en I)', S.box(140, 150, 1800), { pos: [fx, WY - 40, 0], mat: 'acierHR', color: CHASSIS });
    eav.part('Barre d\'accouplement', S.cyl(45, 1700, 'z'), { pos: [fx - 220, WY - 60, 0], mat: 'acierHR' });
    if (i === 0) {
      eav.part('Bielle de direction', S.rod([fx + 300, 950, -560], [fx - 50, WY + 120, -900], 45), { mat: 'acierHR' });
      eav.part('Boîtier de direction', S.box(250, 250, 200), { pos: [fx + 350, 980, -560], mat: 'fonte' });
    } else eav.part('Bielle de renvoi entre essieux directeurs', S.rod([T.fronts[0] - 50, WY + 120, -900], [fx - 50, WY + 120, -900], 40), { mat: 'acierHR' });
    for (const sd of SIDES) {
      eav.part(`Pivot de fusée ${sd.m}`, S.cyl(55, 280, 'y'), { pos: [fx, WY, sd.s * 900], mat: 'acierHR' });
      eav.part(`Fusée ${sd.f}`, S.cyl(90, 180, 'z'), { pos: [fx, WY, sd.s * 980], mat: 'acierHR' });
      const lr = eav.group(`Ressort à lames avant ${sd.m}`, { code: 'EAV' });
      for (let k = 0; k < 3; k++) lr.part(`Lame ${k + 1}`, S.box(1650 - k * 400, 22, 90), { pos: [fx, WY + 114 - k * 22, sd.s * 430], mat: 'acierHR', color: CHASSIS });
      lr.part('Main de ressort avant', S.box(120, 200, 110), { pos: [fx + 830, 860, sd.s * 430], mat: 'fonte', color: CHASSIS });
      lr.part('Jumelle de ressort arrière', S.box(60, 200, 110), { pos: [fx - 830, 860, sd.s * 430], mat: 'fonte', color: CHASSIS });
      for (let k = 0; k < 2; k++) {
        lr.part(`Bride de ressort (étrier en U) ${k + 1}`, S.box(20, 300, 120), { pos: [fx + (k ? 70 : -70), WY + 20, sd.s * 430], mat: 'acierHR' });
        for (const dz of [-1, 1]) lr.part(`Écrou d'étrier ${k + 1}${dz < 0 ? 'a' : 'b'}`, S.nut(22), { pos: [fx + (k ? 70 : -70), WY - 140, sd.s * 430 + dz * 60], rot: [180, 0, 0], mat: 'acierHR', couple: 550 });
      }
      eav.part(`Amortisseur avant ${sd.m}`, S.rod([fx + 200, WY + 40, sd.s * 480], [fx + 280, 1000, sd.s * 480], 70), { mat: 'peinture', color: 0x222222 });
      wheel(ls, `Roue avant ${T.fronts.length > 1 ? `${i + 1} ` : ''}${sd.f}`, sd.s, {
        pos: [fx, WY, sd.s * 1025], tire: [315, 80, 22.5], studs: 10, pcd: 335, stud: 22, studL: 30, studKind: 'nut', studLabel: 'Écrou de roue', couple: 600,
        disc: [430, 45], caliperAngle: 180, code: 'ROU', hubD: 220, hubL: 120, spokes: 10, spokeW: 40, rimMat: 'acier', cap: false,
      });
      ls.part(`Garde-boue avant ${i + 1} ${sd.m}`, S.box(1200, 20, 420), { pos: [fx, 1160, sd.s * 1040], mat: 'composite', color: 0x2a2c30, layer: 'ext' });
    }
  });
  T.rears.forEach((ra, i) => {
    const XR = ra.x;
    const n = T.rears.length > 1 ? ` n°${i + 1}` : '';
    const ear = ls.group(ra.driven ? `Pont arrière moteur${n} 13 t` : `Essieu poussé relevable${n} 7,5 t`, { code: 'PAR' });
    if (ra.driven) {
      ear.part('Carter de pont (banjo)', S.cyl(200, 1700, 'z'), { pos: [XR, WY, 0], mat: 'acierHR', color: CHASSIS });
      ear.part('Carter de différentiel', S.sphere(520), { pos: [XR, WY, 0], mat: 'fonte', color: CHASSIS });
      ear.part('Couvercle de différentiel', S.cyl(400, 40, 'x'), { pos: [XR + 250, WY, 0], mat: 'fonte', color: CHASSIS });
      boltCircle(ear, { n: 12, pcd: 340, d: 14, L: 40, axis: 'x', at: [XR + 275, WY, 0], dir: 1, label: 'Vis de couvercle de pont', couple: 210 });
      ear.part('Couple conique – pignon d\'attaque', S.cyl(130, 200, 'x', 24, 90), { pos: [XR + 150, WY, 0], mat: 'acierHR' });
      ear.part('Couple conique – couronne', S.cyl(440, 60, 'z'), { pos: [XR, WY, -120], mat: 'acierHR' });
      if (T.rears.length > 1 && i === 0 && T.rears[1].driven) ear.part('Différentiel inter-pont', S.box(250, 300, 300), { pos: [XR + 300, WY + 100, 0], mat: 'fonte', color: CHASSIS });
    } else {
      ear.part('Corps d\'essieu tubulaire', S.cyl(150, 1900, 'z'), { pos: [XR, WY, 0], mat: 'acierHR', color: CHASSIS });
      ear.part('Coussin de relevage', S.cyl(260, 200, 'y'), { pos: [XR, WY + 300, 0], mat: 'caoutchouc' });
    }
    for (const sd of SIDES) {
      if (ra.driven) {
        ear.part(`Arbre de roue ${sd.m}`, S.cyl(55, 850, 'z'), { pos: [XR, WY, sd.s * 450], mat: 'acierHR' });
        ear.part(`Réducteur de moyeu ${sd.m}`, S.cyl(300, 120, 'z'), { pos: [XR, WY, sd.s * 860], mat: 'fonte' });
      }
      const sp = ear.group(`Suspension pneumatique ${sd.f}`, { code: 'PAR' });
      sp.part('Bras longitudinal', S.box(1200, 80, 100), { pos: [XR + 200, WY - 80, sd.s * 480], mat: 'acierHR', color: CHASSIS });
      for (const [x, k] of [[XR - 300, 'arrière'], [XR + 650, 'avant']]) {
        sp.part(`Coussin d'air ${k}`, S.cyl(300, 280, 'y'), { pos: [x, 860, sd.s * 480], mat: 'caoutchouc' });
        sp.part(`Piston de coussin ${k}`, S.cyl(220, 120, 'y'), { pos: [x, 680, sd.s * 480], mat: 'composite' });
        for (const dx of [-90, 90]) sp.part(`Écrou de coussin ${k} ${dx < 0 ? 'a' : 'b'}`, S.nut(12), { pos: [x + dx, 1006, sd.s * 480], mat: 'zingue', couple: 66 });
      }
      sp.part('Amortisseur', S.rod([XR - 150, WY - 40, sd.s * 380], [XR - 180, 1000, sd.s * 380], 75), { mat: 'peinture', color: 0x222222 });
      sp.part('Valve de nivellement', S.box(80, 80, 60), { pos: [XR + 300, 900, sd.s * 380], mat: 'abs' });
      sp.part('Cylindre de frein combiné (ressort/membrane)', S.cyl(220, 320, 'x'), { pos: [XR + 280, WY + 40, sd.s * 640], mat: 'peinture', color: 0x222222 });
      const wheels = ra.single ? [['', 0]] : [['extérieure', 170], ['intérieure', -170]];
      for (const [lab, dz] of wheels) {
        wheel(ls, `Roue arrière${n} ${sd.f}${lab ? ` ${lab}` : ''}`, sd.s, {
          pos: [XR, WY, sd.s * (ra.single ? 1025 : 915 + dz)], tire: ra.single ? [385, 55, 22.5] : [315, 80, 22.5], studs: dz >= 0 ? 10 : 0, pcd: 335, stud: 22, studL: 30, studKind: 'nut', studLabel: 'Écrou de roue', couple: 600,
          disc: dz <= 0 ? [430, 45] : null, caliperAngle: 0, code: 'ROU', hub: dz <= 0, hubD: 220, hubL: 120, spokes: 10, spokeW: 40, rimMat: 'acier', cap: false,
        });
      }
      ls.part(`Garde-boue arrière${n} ${sd.m}`, S.box(1300, 20, 700), { pos: [XR, 1150, sd.s * 920], mat: 'composite', color: 0x2a2c30, layer: 'ext' });
    }
  });
  const lastX = T.rears[T.rears.length - 1].x;
  for (const sd of SIDES) {
    ls.part(`Bavette arrière ${sd.f}`, S.box(10, 500, 650), { pos: [lastX - 640, 900, sd.s * 920], mat: 'caoutchouc', layer: 'ext' });
    ls.part(`Feu arrière combiné ${sd.m}`, S.box(80, 150, 450), { pos: [xEnd - 30, 900, sd.s * 950], mat: 'feuRouge', layer: 'ext' });
  }

  // ------------------------------------------------------------------ Équipement arrière
  if (T.body === 'sellette') {
    const sx = T.rears[0].x + (T.rears.length > 1 ? -500 : 450);
    const sel = tk.group('Sellette d\'attelage', { code: 'SEL', layer: 'struct' });
    sel.part('Plateau de sellette', S.cyl(880, 60, 'y', 48), { pos: [sx, 1290, 0], mat: 'fonte', color: 0x2a2c30, desc: 'Hauteur 150 mm – charge verticale 20 t – valeur D 152 kN' });
    sel.part('Rampe d\'introduction', S.box(500, 40, 300), { pos: [sx - 350, 1260, 0], rot: [0, 0, 12], mat: 'fonte', color: 0x2a2c30 });
    sel.part('Verrou de pivot (mâchoire)', S.box(200, 60, 140), { pos: [sx, 1250, 0], mat: 'acierHR' });
    sel.part('Poignée de déverrouillage', S.rod([sx + 50, 1260, 300], [sx + 150, 1240, 650], 25), { mat: 'acier', color: 0xc0262d });
    sel.part('Plaque de montage', S.box(700, 40, 960), { pos: [sx, 1150, 0], mat: 'acier', color: CHASSIS });
    for (const sd of SIDES) {
      sel.part(`Palier de sellette ${sd.m}`, S.box(250, 110, 150), { pos: [sx, 1205, sd.s * 380], mat: 'fonte', color: 0x2a2c30 });
      boltRow(sel, { from: [sx - 300, 1170, sd.s * 430], to: [sx + 300, 1170, sd.s * 430], n: 6, d: 16, L: 60, axis: 'y', dir: 1, label: `Boulon de plaque ${sd.c}`, couple: 260 });
    }
    sel.part('Têtes d\'accouplement pneumatiques', S.box(100, 120, 300), { pos: [cabBack - 40, 1750, 0], mat: 'abs', color: 0xc0262d });
    sel.part('Spirale pneumatique', S.spring(180, 14, 600, 8, 'x'), { pos: [cabBack - 370, 1650, -150], mat: 'plastique', color: 0xc0262d });
  } else {
    const bx0 = cabBack - 80, bL = bx0 - xEnd;
    const fc = tk.group('Faux-châssis', { code: 'FCH', layer: 'struct' });
    for (const sd of SIDES) {
      fc.part(`Longeron de faux-châssis ${sd.m}`, S.box(bL, 160, 80), { pos: [bx0 - bL / 2, 1180, sd.s * 430], mat: 'acier', color: CHASSIS });
      for (let k = 0; k < 6; k++) {
        const x = bx0 - 300 - k * (bL - 600) / 5;
        fc.part(`Console de fixation ${sd.c}${k + 1}`, S.box(120, 200, 12), { pos: [x, 1080, sd.s * 470], mat: 'acier', color: CHASSIS });
        for (const dy of [-50, 50]) fc.part(`Boulon de console ${sd.c}${k + 1}${dy < 0 ? 'b' : 'h'}`, S.bolt(16, 50, 'z'), { pos: [x, 1080 + dy, sd.s * 480], rot: axisRot('z', sd.s), mat: 'acierHR', couple: 260 });
      }
    }
    if (T.body === 'benne') {
      const bn = tk.group('Benne basculante acier 16 m³', { code: 'BEN', layer: 'ext', desc: 'Acier HARDOX 450 – fond 8 mm, ridelles 6 mm' });
      const fy = 1300, hb = 1350;
      bn.part('Fond de benne', S.box(bL - 100, 8, 2400), { pos: [bx0 - bL / 2 - 50, fy, 0], mat: 'peinture', color: T.color });
      for (const sd of SIDES) bn.part(`Ridelle ${sd.f}`, S.box(bL - 100, hb, 6), { pos: [bx0 - bL / 2 - 50, fy + hb / 2, sd.s * 1197], mat: 'peinture', color: T.color });
      bn.part('Paroi avant', S.box(6, hb, 2400), { pos: [bx0 - 100, fy + hb / 2, 0], mat: 'peinture', color: T.color });
      bn.part('Pare-cabine (casquette)', S.box(600, 6, 2400), { pos: [bx0 + 150, fy + hb + 50, 0], rot: [0, 0, -8], mat: 'peinture', color: T.color });
      bn.part('Porte arrière', S.box(8, hb, 2400), { pos: [xEnd + 4, fy + hb / 2, 0], mat: 'peinture', color: T.color });
      for (let k = 0; k < 8; k++) for (const sd of SIDES) bn.part(`Raidisseur de ridelle ${sd.c}${k + 1}`, S.box(60, hb, 30), { pos: [bx0 - 300 - k * (bL - 500) / 7, fy + hb / 2, sd.s * 1215], mat: 'peinture', color: T.color });
      bn.part('Vérin de bennage télescopique 4 tubes', S.cyl(220, 1400, 'y'), { pos: [bx0 - 250, 1500, 0], mat: 'chrome', desc: 'Vérin hydraulique télescopique – course 5 200 mm' });
      bn.part('Réservoir hydraulique', S.box(500, 400, 300), { pos: [cabBack - 400, 1100, -860], mat: 'acier', color: CHASSIS });
      bn.part('Pompe hydraulique sur prise de force', S.cyl(140, 200, 'x'), { pos: [0, 830, 200], mat: 'fonte' });
      for (const sd of SIDES) {
        bn.part(`Charnière de bennage ${sd.m}`, S.box(200, 150, 80), { pos: [xEnd + 250, 1240, sd.s * 380], mat: 'acierHR' });
        bn.part(`Axe de bennage ${sd.m}`, S.cyl(60, 160, 'z'), { pos: [xEnd + 250, 1260, sd.s * 380], mat: 'acierHR' });
        bn.part(`Écrou d'axe de bennage ${sd.m}`, S.nut(24, 'z'), { pos: [xEnd + 250, 1260, sd.s * 470], mat: 'acierHR', couple: 400 });
      }
    } else {
      const cs = tk.group('Caisse fourgon 7,5 m', { code: 'CAI', layer: 'ext', desc: 'Panneaux sandwich polyester / mousse PU 40 mm' });
      const fy = 1300, hc = 2500, cL = bL - 60;
      const cx = bx0 - cL / 2 - 30;
      cs.part('Plancher (contreplaqué antidérapant)', S.box(cL, 30, 2480), { pos: [cx, fy, 0], mat: 'bois' });
      for (const sd of SIDES) cs.part(`Paroi latérale ${sd.f}`, S.box(cL, hc, 40), { pos: [cx, fy + hc / 2, sd.s * 1220], mat: 'composite', color: 0xf4f4f2 });
      cs.part('Toit translucide', S.box(cL, 30, 2480), { pos: [cx, fy + hc, 0], mat: 'composite', color: 0xf4f4f2 });
      cs.part('Face avant de caisse', S.box(40, hc, 2480), { pos: [bx0 - 50, fy + hc / 2, 0], mat: 'composite', color: 0xf4f4f2 });
      for (const sd of SIDES) {
        cs.part(`Porte arrière ${sd.f}`, S.box(40, hc - 60, 1220), { pos: [xEnd + 20, fy + hc / 2, sd.s * 615], mat: 'composite', color: 0xf4f4f2 });
        for (let k = 0; k < 4; k++) cs.part(`Charnière de porte ${sd.c}${k + 1}`, S.box(60, 80, 30), { pos: [xEnd, fy + 300 + k * 600, sd.s * 1225], mat: 'inox' });
        cs.part(`Crémone de fermeture ${sd.c}`, S.cyl(25, hc - 100, 'y'), { pos: [xEnd - 10, fy + hc / 2, sd.s * 300], mat: 'inox' });
        boltRow(cs, { from: [bx0 - 100, fy - 10, sd.s * 1220], to: [xEnd + 100, fy - 10, sd.s * 1220], n: 10, d: 8, L: 50, axis: 'y', dir: -1, label: `Rivet de cornière ${sd.c}`, kind: 'rivet', mat: 'alu2024' });
      }
      cs.part('Hayon élévateur 1 500 kg', S.box(40, 1600, 2400), { pos: [xEnd - 40, fy - 450, 0], rot: [0, 0, 0], mat: 'aluminium' });
      cs.part('Vérins de hayon', S.cyl(80, 500, 'y'), { pos: [xEnd + 200, 900, 0], mat: 'chrome' });
      cs.part('Groupe hydraulique de hayon', S.box(400, 250, 300), { pos: [xEnd + 400, 900, 600], mat: 'acier', color: CHASSIS });
      cs.part('Feux de gabarit supérieurs', S.box(30, 40, 2300), { pos: [xEnd, fy + hc - 30, 0], mat: 'feuRouge' });
    }
  }
  return tk;
}
