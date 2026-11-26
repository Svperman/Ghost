// Berline compacte 5 places – traction, moteur 4 cylindres 1,6 L transversal
// Longueur 4 520 mm · largeur 1 780 mm · hauteur 1 440 mm · empattement 2 700 mm · voie 1 550 mm
import { Assembly, S, SIDES, boltRow, axisRot } from '../core/builder.js';
import { wheel, inlineEngine, seat } from '../core/parts.js';

const PAINT = 0x1d5fa8;
const WB = 2700, TRACK = 1550, WY = 316; // empattement, voie, hauteur axe de roue

export function buildCar() {
  const car = new Assembly('Berline compacte', { prefix: 'VT', code: 'GEN', desc: 'Berline 5 portes – 4 520 × 1 780 × 1 440 mm – masse à vide ≈ 1 250 kg' });
  const XF = WB / 2, XR = -WB / 2;

  // ------------------------------------------------------------------ Carrosserie
  const body = car.group('Carrosserie', { code: 'CAR' });
  const arch = (cx, from, to) => {
    const pts = [];
    for (let i = 0; i <= 20; i++) {
      const a = from + (to - from) * (i / 20);
      pts.push([cx + 375 * Math.cos(a), WY + 375 * Math.sin(a)]);
    }
    return pts;
  };
  const caisse = [
    [-2230, 300], [-2262, 520], [-2240, 930], [-1450, 960], [950, 950], [2180, 790], [2262, 560], [2240, 330], [XF + 375, 180],
    ...arch(XF, 0, Math.PI), [XR + 375, 180], ...arch(XR, 0, Math.PI), [-2000, 180],
  ];
  body.part('Caisse en blanc (structure)', S.extrude(caisse, 1780, 40), { mat: 'peinture', color: PAINT, desc: 'Structure monocoque acier THLE soudée par points' });
  body.part('Pavillon / habitacle', S.extrude([[-1450, 950], [-900, 1420], [350, 1440], [950, 955]], 1400, 60), { mat: 'peinture', color: PAINT });
  body.part('Capot moteur', S.box(1240, 10, 1600), { pos: [1565, 878, 0], rot: [0, 0, -7.41], mat: 'peinture', color: PAINT });
  body.part('Hayon / couvercle de coffre', S.box(790, 10, 1580), { pos: [-1845, 952, 0], rot: [0, 0, 2.2], mat: 'peinture', color: PAINT });
  body.part('Bouclier avant', S.box(130, 300, 1790), { pos: [2235, 440, 0], mat: 'abs', color: PAINT });
  body.part('Bouclier arrière', S.box(130, 300, 1790), { pos: [-2235, 440, 0], mat: 'abs', color: PAINT });
  body.part('Calandre', S.box(30, 170, 720), { pos: [2268, 640, 0], mat: 'abs', color: 0x111111 });
  body.part('Logo de calandre', S.cyl(90, 8, 'x'), { pos: [2285, 650, 0], mat: 'chrome' });
  body.part('Grille de bouclier inférieure', S.box(20, 110, 900), { pos: [2305, 380, 0], mat: 'abs', color: 0x111111 });
  body.part('Plaque d\'immatriculation avant', S.box(4, 110, 520), { pos: [2303, 480, 0], mat: 'aluminium', color: 0xffffff });
  body.part('Plaque d\'immatriculation arrière', S.box(4, 110, 520), { pos: [-2303, 560, 0], mat: 'aluminium', color: 0xffffff });
  body.part('Becquet de pavillon', S.box(200, 20, 1200), { pos: [-950, 1420, 0], rot: [0, 0, 8], mat: 'abs', color: PAINT });
  body.part('Antenne de toit', S.box(140, 60, 40), { pos: [-600, 1460, 0], mat: 'abs', color: 0x111111 });

  const vit = body.group('Vitrage', { code: 'VIT' });
  vit.part('Pare-brise', S.box(768, 6, 1320), { pos: [654, 1205, 0], rot: [0, 0, -38.66], mat: 'verre' });
  vit.part('Lunette arrière', S.box(723, 6, 1300), { pos: [-1180, 1190, 0], rot: [0, 0, 40.5], mat: 'verre' });
  for (const sd of SIDES) {
    const z = sd.s * 703;
    vit.part(`Vitre de porte avant ${sd.f}`, S.extrude([[-230, 990], [-230, 1405], [330, 1410], [900, 990]], 5), { pos: [0, 0, z], mat: 'verre' });
    vit.part(`Vitre de porte arrière ${sd.f}`, S.extrude([[-1360, 990], [-900, 1390], [-290, 1400], [-290, 990]], 5), { pos: [0, 0, z], mat: 'verre' });
    vit.part(`Montant B ${sd.m}`, S.box(60, 420, 8), { pos: [-260, 1195, z], mat: 'abs', color: 0x111111 });
  }
  const ess = vit.group('Essuie-glaces', { code: 'VIT' });
  for (const sd of SIDES) {
    ess.part(`Bras d'essuie-glace ${sd.m}`, S.box(14, 10, 480), { pos: [935, 1000, sd.s * 300 - 60], rot: [0, 0, -38.66], mat: 'plastique' });
    ess.part(`Balai d'essuie-glace ${sd.m}`, S.box(18, 14, 560), { pos: [915, 1022, sd.s * 300 - 60], rot: [0, 0, -38.66], mat: 'caoutchouc' });
    ess.part(`Écrou d'axe d'essuie-glace ${sd.m}`, S.nut(10), { pos: [985, 958, sd.s * 300 - 300], mat: 'zingue', couple: 20 });
  }

  for (const sd of SIDES) {
    const z = sd.s * 894;
    for (const [nom, x0, x1] of [['avant', -250, 975], ['arrière', -1000, -255]]) {
      const pg = body.group(`Portière ${nom} ${sd.f}`, { code: 'POR' });
      pg.part('Panneau de porte', S.extrude([[x0, 330], [x0, 955], [x1, 955], [x1, 330]], 8, 2), { pos: [0, 0, z], mat: 'peinture', color: PAINT });
      pg.part('Garniture intérieure', S.box(x1 - x0 - 60, 520, 30), { pos: [(x0 + x1) / 2, 650, sd.s * 850], mat: 'abs' });
      pg.part('Poignée extérieure', S.box(160, 30, 25), { pos: [x0 + 120, 860, sd.s * 910], mat: 'chrome' });
      pg.part('Serrure de porte', S.box(60, 90, 50), { pos: [x0 + 30, 800, sd.s * 860], mat: 'zingue' });
      pg.part('Lève-vitre électrique', S.box(400, 300, 20), { pos: [(x0 + x1) / 2, 650, sd.s * 870], mat: 'zingue' });
      for (const [k, y] of [['supérieure', 820], ['inférieure', 480]]) {
        pg.part(`Charnière ${k}`, S.box(60, 80, 30), { pos: [x1 - 20, y, sd.s * 880], mat: 'acier' });
        pg.part(`Vis de charnière ${k} 1`, S.bolt(8, 25, 'z'), { pos: [x1 - 30, y + 20, sd.s * 900], rot: axisRot('z', sd.s), mat: 'acierHR', couple: 25 });
        pg.part(`Vis de charnière ${k} 2`, S.bolt(8, 25, 'z'), { pos: [x1 - 30, y - 20, sd.s * 900], rot: axisRot('z', sd.s), mat: 'acierHR', couple: 25 });
      }
      if (nom === 'avant') {
        const rv = pg.group(`Rétroviseur extérieur ${sd.m}`, { code: 'POR' });
        rv.part('Coque de rétroviseur', S.ellipsoid(150, 115, 230), { pos: [880, 1010, sd.s * 1010], mat: 'peinture', color: PAINT });
        rv.part('Miroir', S.box(6, 95, 190), { pos: [805, 1010, sd.s * 1015], mat: 'chrome' });
        rv.part('Répétiteur de clignotant', S.box(20, 15, 120), { pos: [900, 965, sd.s * 1030], mat: 'feuOrange' });
        rv.part('Pied de rétroviseur', S.box(90, 70, 110), { pos: [860, 990, sd.s * 925], mat: 'abs' });
      }
    }
    body.part(`Bas de caisse ${sd.m}`, S.box(1960, 90, 40), { pos: [-15, 225, sd.s * 880], mat: 'abs', color: 0x111111 });
  }

  const ecl = body.group('Éclairage & signalisation', { code: 'ECL' });
  for (const sd of SIDES) {
    ecl.part(`Projecteur avant ${sd.m}`, S.ellipsoid(180, 130, 380), { pos: [2190, 720, sd.s * 610], rot: [0, 0, -15], mat: 'feuBlanc' });
    ecl.part(`Ampoule H7 ${sd.f}`, S.cyl(12, 50, 'x'), { pos: [2120, 720, sd.s * 610], mat: 'verre' });
    ecl.part(`Antibrouillard ${sd.m}`, S.cyl(80, 40, 'x'), { pos: [2290, 330, sd.s * 700], mat: 'feuBlanc' });
    ecl.part(`Feu arrière ${sd.m}`, S.box(80, 140, 330), { pos: [-2220, 840, sd.s * 690], mat: 'feuRouge' });
    ecl.part(`Clignotant arrière ${sd.m}`, S.box(80, 40, 150), { pos: [-2215, 750, sd.s * 750], mat: 'feuOrange' });
    ecl.part(`Catadioptre ${sd.m}`, S.box(10, 30, 120), { pos: [-2305, 380, sd.s * 700], mat: 'feuRouge' });
  }
  ecl.part('Troisième feu stop', S.box(30, 30, 400), { pos: [-1440, 1340, 0], rot: [0, 0, 40], mat: 'feuRouge' });

  // ------------------------------------------------------------------ Plateforme / châssis
  const ch = car.group('Plateforme & soubassement', { code: 'CHS' });
  for (const sd of SIDES) {
    ch.part(`Longeron ${sd.m}`, S.box(4200, 120, 80), { pos: [0, 260, sd.s * 560], mat: 'acier' });
    boltRow(ch, { from: [-1800, 200, sd.s * 560], to: [1800, 200, sd.s * 560], n: 8, d: 10, L: 30, axis: 'y', dir: -1, label: `Vis de fixation longeron ${sd.c}`, couple: 60 });
  }
  for (const [nom, x] of [['avant', 1900], ['centrale avant', 600], ['centrale', -300], ['arrière', -1900]]) ch.part(`Traverse ${nom}`, S.box(90, 90, 1040), { pos: [x, 260, 0], mat: 'acier' });
  ch.part('Plancher', S.box(3200, 4, 1600), { pos: [-200, 300, 0], mat: 'acier' });
  ch.part('Tunnel central', S.box(2200, 180, 240), { pos: [0, 360, 0], mat: 'acier' });
  ch.part('Tablier / cloison pare-feu', S.box(20, 520, 1500), { pos: [950, 640, 0], mat: 'acier' });
  ch.part('Berceau moteur', S.box(700, 60, 1100), { pos: [1500, 260, 0], mat: 'acier' });
  for (const [x, z] of [[1200, -500], [1200, 500], [1800, -500], [1800, 500]]) ch.part(`Vis de berceau ${x > 1500 ? 'AV' : 'AR'}${z < 0 ? 'G' : 'D'}`, S.bolt(14, 90, 'y'), { pos: [x, 230, z], rot: [180, 0, 0], mat: 'acierHR', couple: 180 });

  // ------------------------------------------------------------------ Groupe motopropulseur
  const gmp = car.group('Groupe motopropulseur', { code: 'GMP' });
  inlineEngine(gmp, 'Moteur 1,6 L 4 cylindres essence', {
    n: 4, bore: 79, stroke: 81.4, pitch: 88, pos: [1550, 600, 0], rot: [0, 90, 0], code: 'MOT', valves: 2, turbo: true,
    desc: '1 598 cm³ – 16 soupapes – 85 kW', headTorque: '30 N·m + 90° + 90°',
  });
  const bv = gmp.group('Boîte de vitesses manuelle 6 rapports', { code: 'BV' });
  bv.part('Carter d\'embrayage', S.cyl(300, 120, 'z', 40), { pos: [1520, 520, -330], mat: 'aluminium' });
  bv.part('Carter de boîte', S.box(340, 330, 300), { pos: [1520, 500, -540], mat: 'aluminium' });
  bv.part('Disque d\'embrayage', S.tube(228, 60, 10, 'z'), { pos: [1520, 520, -290], mat: 'feutre' });
  bv.part('Mécanisme d\'embrayage', S.cyl(240, 40, 'z'), { pos: [1520, 520, -315], mat: 'acier' });
  bv.part('Butée d\'embrayage', S.tube(70, 35, 30, 'z'), { pos: [1520, 520, -350], mat: 'acier' });
  bv.part('Arbre primaire', S.cyl(30, 380, 'z'), { pos: [1520, 520, -520], mat: 'acierHR' });
  bv.part('Arbre secondaire', S.cyl(35, 360, 'z'), { pos: [1520, 420, -520], mat: 'acierHR' });
  bv.part('Différentiel – couronne', S.cyl(200, 30, 'z'), { pos: [1440, 400, -480], mat: 'acierHR' });
  bv.part('Bouchon de remplissage BV', S.bolt(16, 14, 'x'), { pos: [1700, 450, -540], mat: 'acier', couple: 35 });
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    bv.part(`Vis de cloche ${String(i + 1).padStart(2, '0')}`, S.bolt(10, 45, 'z'), { pos: [1520 + Math.cos(a) * 160, 520 + Math.sin(a) * 160, -270], rot: axisRot('z', 1), mat: 'acierHR', couple: 48 });
  }
  const tr = gmp.group('Transmissions', { code: 'TRA' });
  for (const sd of SIDES) {
    const zIn = sd.s < 0 ? -560 : -100;
    tr.part(`Arbre de transmission ${sd.m}`, S.rod([1440, 400, zIn], [XF, WY, sd.s * 650], 30), { mat: 'acierHR' });
    tr.part(`Joint homocinétique côté roue ${sd.m}`, S.cyl(95, 90, 'z'), { pos: [XF, WY, sd.s * 640], mat: 'caoutchouc', desc: 'Joint Rzeppa + soufflet' });
    tr.part(`Tripode côté boîte ${sd.m}`, S.cyl(90, 80, 'z'), { pos: [1430, 400, zIn + sd.s * 30], mat: 'caoutchouc' });
    tr.part(`Écrou de moyeu ${sd.m}`, S.nut(22, 'z'), { pos: [XF, WY, sd.s * 700], mat: 'acierHR', couple: '280 N·m' });
  }

  const ref = gmp.group('Refroidissement', { code: 'REF' });
  ref.part('Radiateur', S.box(40, 420, 660), { pos: [2120, 560, 0], mat: 'aluminium' });
  ref.part('Motoventilateur', S.cyl(330, 60, 'x'), { pos: [2060, 560, 0], mat: 'plastique' });
  ref.part('Vase d\'expansion', S.box(150, 140, 200), { pos: [1850, 800, 500], mat: 'composite' });
  ref.part('Durite supérieure', S.pipe([[2100, 720, -150], [1900, 760, -100], [1700, 780, -60]], 38), { mat: 'caoutchouc' });
  ref.part('Durite inférieure', S.pipe([[2100, 380, 150], [1900, 360, 120], [1680, 440, 80]], 38), { mat: 'caoutchouc' });
  ref.part('Condenseur de climatisation', S.box(25, 380, 640), { pos: [2165, 560, 0], mat: 'aluminium' });
  ref.part('Compresseur de climatisation', S.cyl(120, 160, 'z'), { pos: [1700, 420, 260], mat: 'aluminium' });

  const al = gmp.group('Alimentation & électricité', { code: 'ALM' });
  al.part('Boîte à air / filtre à air', S.box(260, 150, 320), { pos: [1180, 830, 300], mat: 'plastique' });
  al.part('Élément filtrant', S.box(200, 40, 260), { pos: [1180, 840, 300], mat: 'tissu', color: 0xe9d8a0 });
  al.part('Conduit d\'admission', S.pipe([[1180, 830, 140], [1250, 820, 50], [1350, 800, 0]], 70), { mat: 'caoutchouc' });
  al.part('Batterie 12 V 60 Ah', S.box(242, 175, 175), { pos: [1700, 760, 590], mat: 'electrolyte', desc: '12 V – 60 Ah – 540 A EN' });
  al.part('Borne + de batterie', S.cyl(18, 20, 'y'), { pos: [1640, 858, 640], mat: 'cuivre' });
  al.part('Borne − de batterie', S.cyl(17, 20, 'y'), { pos: [1760, 858, 640], mat: 'laiton' });
  al.part('Bride de batterie', S.box(260, 10, 30), { pos: [1700, 852, 590], mat: 'acier' });
  al.part('Calculateur moteur (ECU)', S.box(200, 40, 160), { pos: [1300, 840, -500], mat: 'aluminium' });
  al.part('Boîte à fusibles', S.box(150, 80, 200), { pos: [1300, 840, 600], mat: 'abs' });
  al.part('Réservoir de carburant 50 L', S.box(620, 230, 820), { pos: [-1050, 330, 0], mat: 'plastique', desc: 'PEHD multicouche – 50 L' });
  al.part('Pompe à carburant immergée', S.cyl(90, 200, 'y'), { pos: [-1050, 360, 250], mat: 'plastique' });
  al.part('Goulotte de remplissage', S.pipe([[-1300, 380, 400], [-1600, 600, 700], [-1700, 820, 860]], 45), { mat: 'plastique' });
  al.part('Trappe à carburant', S.cyl(170, 6, 'z'), { pos: [-1700, 840, 892], mat: 'peinture', color: PAINT });
  al.part('Canalisation de carburant', S.pipe([[-1050, 380, 300], [0, 300, 300], [1000, 380, 300], [1300, 750, 0]], 10), { mat: 'inox' });

  const ech = gmp.group('Ligne d\'échappement', { code: 'ECH' });
  const ex = [[1700, 400, 60], [1640, 280, 60], [1300, 220, 60], [600, 210, 80], [-500, 210, 120], [-1300, 290, 300], [-1700, 290, 380]];
  ech.part('Tube avant', S.pipe(ex.slice(0, 4), 55), { mat: 'inox' });
  ech.part('Catalyseur', S.cyl(140, 320, 'x'), { pos: [1300, 220, 60], mat: 'inox', desc: 'Catalyseur 3 voies + filtre à particules essence' });
  ech.part('Sonde lambda amont', S.cyl(18, 60, 'y'), { pos: [1520, 270, 60], mat: 'inox' });
  ech.part('Sonde lambda aval', S.cyl(18, 60, 'y'), { pos: [1080, 260, 60], mat: 'inox' });
  ech.part('Tube intermédiaire', S.pipe(ex.slice(3), 55), { mat: 'inox' });
  ech.part('Silencieux intermédiaire', S.cyl(160, 400, 'x'), { pos: [0, 210, 100], mat: 'inox' });
  ech.part('Silencieux arrière', S.box(420, 220, 520), { pos: [-1900, 300, 420], mat: 'inox' });
  ech.part('Embout d\'échappement', S.cyl(80, 120, 'x'), { pos: [-2190, 290, 520], mat: 'chrome' });
  for (const [i, x] of [[1, 900], [2, -800], [3, -1700]]) ech.part(`Silent-bloc de suspension d'échappement ${i}`, S.cyl(40, 25, 'z'), { pos: [x, 240, 200], mat: 'caoutchouc' });
  ech.part('Collier de serrage', S.tube(70, 56, 30, 'x'), { pos: [600, 210, 80], mat: 'inox' });

  // ------------------------------------------------------------------ Liaisons au sol
  const ls = car.group('Liaisons au sol', { code: 'LAS' });
  for (const [ax, nomAx] of [[XF, 'avant'], [XR, 'arrière']]) {
    for (const sd of SIDES) {
      wheel(ls, `Roue ${nomAx} ${sd.f}`, sd.s, {
        pos: [ax, WY, sd.s * TRACK / 2], tire: [205, 55, 16], studs: 5, pcd: 108, stud: 12, studL: 26, couple: 110,
        disc: ax > 0 ? [283, 26] : [268, 12], caliperAngle: ax > 0 ? 150 : 30, code: 'ROU', hubD: 120,
      });
    }
  }
  const sav = ls.group('Train avant pseudo-McPherson', { code: 'TAV' });
  for (const sd of SIDES) {
    const z = sd.s * 640;
    const g = sav.group(`Jambe de force ${sd.f}`, { code: 'TAV' });
    g.part('Amortisseur', S.rod([XF - 20, 420, z], [XF - 60, 900, sd.s * 600], 52), { mat: 'peinture', color: 0x222222 });
    g.part('Tige d\'amortisseur', S.rod([XF - 60, 900, sd.s * 600], [XF - 65, 960, sd.s * 595], 22), { mat: 'chrome' });
    g.part('Ressort hélicoïdal', S.spring(150, 13, 300, 6), { pos: [XF - 45, 740, sd.s * 615], mat: 'peinture', color: 0xd8b10f });
    g.part('Coupelle supérieure', S.cyl(160, 30, 'y'), { pos: [XF - 65, 960, sd.s * 595], mat: 'acier' });
    g.part('Butée à billes', S.tube(130, 40, 20, 'y'), { pos: [XF - 60, 940, sd.s * 597], mat: 'acier' });
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      g.part(`Écrou de coupelle ${i + 1}`, S.nut(8), { pos: [XF - 65 + Math.cos(a) * 55, 980, sd.s * 595 + Math.sin(a) * 55], mat: 'zingue', couple: 25 });
    }
    g.part('Pivot / porte-moyeu', S.box(80, 260, 80), { pos: [XF, WY + 20, sd.s * 690], mat: 'fonte' });
    g.part('Vis de pivot sur jambe 1', S.bolt(14, 80, 'x'), { pos: [XF + 50, 450, z], mat: 'acierHR', couple: 200 });
    g.part('Vis de pivot sur jambe 2', S.bolt(14, 80, 'x'), { pos: [XF + 50, 400, z], mat: 'acierHR', couple: 200 });
    const tr2 = sav.group(`Triangle inférieur ${sd.m}`, { code: 'TAV' });
    tr2.part('Bras avant', S.rod([XF, 230, sd.s * 690], [XF + 120, 240, sd.s * 360], 35), { mat: 'acier' });
    tr2.part('Bras arrière', S.rod([XF, 230, sd.s * 690], [XF - 250, 240, sd.s * 380], 35), { mat: 'acier' });
    tr2.part('Rotule de triangle', S.sphere(45), { pos: [XF, 230, sd.s * 690], mat: 'acier' });
    tr2.part('Silent-bloc avant', S.tube(60, 20, 50, 'x'), { pos: [XF + 120, 240, sd.s * 360], mat: 'caoutchouc' });
    tr2.part('Silent-bloc arrière', S.tube(70, 20, 60, 'y'), { pos: [XF - 250, 240, sd.s * 380], mat: 'caoutchouc' });
    tr2.part('Vis de silent-bloc avant', S.bolt(12, 80, 'x'), { pos: [XF + 160, 240, sd.s * 360], mat: 'acierHR', couple: '100 N·m + 90°' });
    tr2.part('Vis de silent-bloc arrière', S.bolt(12, 90, 'y'), { pos: [XF - 250, 190, sd.s * 380], rot: [180, 0, 0], mat: 'acierHR', couple: '120 N·m + 90°' });
    tr2.part('Écrou de rotule', S.nut(14), { pos: [XF, 190, sd.s * 690], mat: 'acierHR', couple: 70 });
  }
  sav.part('Barre stabilisatrice avant', S.pipe([[XF - 180, 280, -620], [XF - 150, 300, -300], [XF - 150, 300, 300], [XF - 180, 280, 620]], 22), { mat: 'peinture', color: 0x222222 });
  for (const sd of SIDES) sav.part(`Biellette de barre stabilisatrice ${sd.f}`, S.rod([XF - 180, 280, sd.s * 620], [XF - 40, 560, sd.s * 630], 14), { mat: 'acier' });

  const dir = ls.group('Direction', { code: 'DIR' });
  dir.part('Crémaillère de direction assistée', S.cyl(60, 720, 'z'), { pos: [XF - 160, 360, 0], mat: 'aluminium' });
  dir.part('Moteur d\'assistance électrique', S.cyl(90, 180, 'x'), { pos: [XF - 260, 380, -200], mat: 'aluminium' });
  for (const sd of SIDES) {
    dir.part(`Biellette de direction ${sd.f}`, S.rod([XF - 160, 360, sd.s * 360], [XF - 120, 380, sd.s * 690], 18), { mat: 'acierHR' });
    dir.part(`Rotule de direction ${sd.f}`, S.sphere(40), { pos: [XF - 120, 380, sd.s * 690], mat: 'acier' });
    dir.part(`Soufflet de crémaillère ${sd.m}`, S.cyl(55, 120, 'z', 16, 30), { pos: [XF - 160, 360, sd.s * 420], rot: sd.s > 0 ? [0, 0, 0] : [180, 0, 0], mat: 'caoutchouc' });
    dir.part(`Contre-écrou de biellette ${sd.f}`, S.nut(14, 'z'), { pos: [XF - 140, 370, sd.s * 520], mat: 'zingue', couple: 50 });
  }
  dir.part('Colonne de direction', S.rod([XF - 220, 400, -300], [430, 980, -370], 30), { mat: 'acier' });
  dir.part('Cardan de colonne', S.sphere(45), { pos: [XF - 220, 400, -300], mat: 'acier' });

  const sar = ls.group('Train arrière à traverse déformable', { code: 'TAR' });
  sar.part('Traverse déformable', S.box(110, 90, 1300), { pos: [XR + 300, 290, 0], mat: 'acier' });
  for (const sd of SIDES) {
    sar.part(`Bras tiré ${sd.m}`, S.rod([XR + 650, 300, sd.s * 640], [XR, WY, sd.s * 640], 60), { mat: 'acier' });
    sar.part(`Silent-bloc de bras ${sd.m}`, S.tube(80, 20, 60, 'z'), { pos: [XR + 650, 300, sd.s * 640], mat: 'caoutchouc' });
    sar.part(`Vis d'articulation de bras ${sd.m}`, S.bolt(14, 110, 'z'), { pos: [XR + 650, 300, sd.s * 700], rot: axisRot('z', sd.s), mat: 'acierHR', couple: 110 });
    sar.part(`Amortisseur arrière ${sd.m}`, S.rod([XR - 80, 300, sd.s * 600], [XR - 140, 760, sd.s * 580], 48), { mat: 'peinture', color: 0x222222 });
    sar.part(`Ressort arrière ${sd.m}`, S.spring(140, 12, 260, 6), { pos: [XR + 150, 440, sd.s * 600], mat: 'peinture', color: 0xd8b10f });
    sar.part(`Vis d'amortisseur inférieure ${sd.m}`, S.bolt(12, 70, 'z'), { pos: [XR - 80, 300, sd.s * 640], rot: axisRot('z', sd.s), mat: 'acierHR', couple: 75 });
    sar.part(`Fusée arrière ${sd.f}`, S.cyl(45, 120, 'z'), { pos: [XR, WY, sd.s * 690], mat: 'acierHR' });
  }

  // ------------------------------------------------------------------ Habitacle
  const hab = car.group('Habitacle', { code: 'HAB' });
  for (const sd of SIDES) seat(hab, `Siège avant ${sd.m}`, [-150, 340, sd.s * 370], { code: 'SIE', w: 520 });
  const banq = hab.group('Banquette arrière', { code: 'SIE' });
  banq.part('Assise de banquette', S.box(480, 120, 1300), { pos: [-1020, 400, 0], mat: 'tissu' });
  banq.part('Dossier de banquette 60 %', S.box(110, 600, 770), { pos: [-1280, 720, -250], rot: [0, 0, -15], mat: 'tissu' });
  banq.part('Dossier de banquette 40 %', S.box(110, 600, 520), { pos: [-1280, 720, 400], rot: [0, 0, -15], mat: 'tissu' });
  const pb = hab.group('Planche de bord', { code: 'PDB' });
  pb.part('Planche de bord', S.box(320, 230, 1560), { pos: [770, 920, 0], mat: 'abs', color: 0x1f2124 });
  pb.part('Combiné d\'instruments', S.box(30, 120, 300), { pos: [600, 1010, -370], rot: [0, 0, -10], mat: 'ecran' });
  pb.part('Écran multimédia 9"', S.box(20, 130, 220), { pos: [620, 1050, 0], rot: [0, 0, -10], mat: 'ecran' });
  pb.part('Aérateur central', S.box(20, 50, 200), { pos: [615, 960, 0], mat: 'abs' });
  pb.part('Boîte à gants', S.box(30, 160, 450), { pos: [610, 860, 380], mat: 'abs', color: 0x1f2124 });
  pb.part('Traverse de planche de bord', S.cyl(60, 1450, 'z'), { pos: [800, 880, 0], mat: 'acier' });
  pb.part('Module airbag passager', S.box(150, 90, 300), { pos: [760, 1020, 380], mat: 'abs' });
  const vol = hab.group('Poste de conduite', { code: 'PDC' });
  vol.part('Volant', S.torus(370, 30, 'x'), { pos: [440, 990, -370], rot: [0, 0, -22], mat: 'cuir', color: 0x151515 });
  vol.part('Moyeu de volant / airbag conducteur', S.cyl(160, 80, 'x'), { pos: [450, 990, -370], rot: [0, 0, -22], mat: 'abs' });
  vol.part('Écrou de volant', S.nut(16, 'x'), { pos: [480, 1000, -370], rot: [0, 0, -22], mat: 'acierHR', couple: 50 });
  vol.part('Levier de vitesses', S.rod([350, 520, 0], [300, 720, 0], 16), { mat: 'chrome' });
  vol.part('Pommeau de levier', S.sphere(55), { pos: [300, 730, 0], mat: 'cuir', color: 0x151515 });
  vol.part('Frein de stationnement', S.box(250, 40, 50), { pos: [100, 520, 0], rot: [0, 0, 15], mat: 'abs' });
  for (const [i, nom, z] of [[0, 'Pédale d\'embrayage', -500], [1, 'Pédale de frein', -380], [2, 'Pédale d\'accélérateur', -260]]) {
    void i;
    vol.part(nom, S.box(20, 90, 70), { pos: [800, 480, z], rot: [0, 0, 20], mat: 'caoutchouc' });
    vol.part(`Bras de ${nom.toLowerCase()}`, S.rod([800, 480, z], [860, 760, z], 16), { mat: 'acier' });
  }
  vol.part('Maître-cylindre de frein', S.cyl(60, 200, 'x'), { pos: [1050, 760, -380], mat: 'aluminium' });
  vol.part('Servofrein', S.cyl(250, 120, 'x'), { pos: [990, 760, -380], mat: 'peinture', color: 0x222222 });
  vol.part('Réservoir de liquide de frein', S.box(100, 80, 80), { pos: [1080, 850, -380], mat: 'composite' });
  return car;
}
