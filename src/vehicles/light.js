// Scooter et quad – générateurs paramétriques (cotes en mm)
// Repère : X avant, Y haut, Z droite. Origine au sol, au milieu de l'empattement.
import { Assembly, S, SIDES, boltCircle, axisRot } from '../core/builder.js';
import { wheel } from '../core/parts.js';

export const LIGHT_TYPES = {
  scooter: {
    label: 'Scooter 125 cm³', desc: 'Scooter à roues de 12" – monocylindre 4 temps 125 cm³ refroidi par liquide – variateur CVT – 130 kg',
    makers: ['Honda (PCX / SH)', 'Yamaha (NMAX)', 'Piaggio (Liberty / Medley)', 'Kymco (Agility)', 'Peugeot (Django)', 'Vespa (Primavera – caisse acier)', 'Sym (Jet)'],
  },
  scooterElec: {
    label: 'Scooter électrique', desc: 'Scooter électrique équivalent 125 – moteur-roue 4 kW – batterie lithium amovible 2,3 kWh – 95 kg',
    elec: true,
    makers: ['Niu (NQi / MQi)', 'Silence (S01)', 'Yamaha (Neo\'s)', 'Piaggio (1)', 'Super Soco (CPx)', 'Horwin (EK3)', 'Vespa (Elettrica)'],
  },
  quad: {
    label: 'Quad utilitaire 4×4', desc: 'Quad / VTT 4 roues motrices – monocylindre 4 temps 500 cm³ – transmission par arbres – variateur CVT – 300 kg',
    makers: ['Polaris (Sportsman)', 'Can-Am (Outlander)', 'Yamaha (Grizzly / Kodiak)', 'Honda (TRX Foreman)', 'Kawasaki (Brute Force)', 'CFMoto (CForce)', 'Suzuki (KingQuad)'],
  },
};

export function buildLight(type = 'scooter') {
  return type === 'quad' ? buildQuad(LIGHT_TYPES.quad) : buildScooter(LIGHT_TYPES[type] || LIGHT_TYPES.scooter);
}

// ============================================================================ Scooter
function buildScooter(P) {
  const RF = (12 * 25.4 + 2 * 120 * 0.7) / 2, RR = (12 * 25.4 + 2 * 130 * 0.7) / 2;
  const XF = 670, XR = -670;
  const PAINT = P.elec ? 0x3aa7c9 : 0xe8e6e1, DARK = 0x2a2c30;
  const s = new Assembly(P.label, { prefix: 'SC', code: 'GEN', layer: 'meca', desc: `${P.desc} – empattement ${XF - XR} mm – pneus 120/70-12 et 130/70-12` });

  // Cadre
  const cad = s.group('Cadre', { code: 'CAD', layer: 'struct' });
  cad.part('Tube de direction', S.rod([520, 960, 0], [565, 800, 0], 55, 40), { mat: 'acier', color: DARK, desc: 'Angle de chasse 26°' });
  for (const sd of SIDES) {
    cad.part(`Tube principal ${sd.m}`, S.pipe([[520, 880, sd.s * 25], [430, 450, sd.s * 90], [380, 260, sd.s * 140], [-150, 250, sd.s * 140], [-330, 450, sd.s * 120], [-650, 800, sd.s * 80]], 28), { mat: 'acier', color: DARK });
  }
  cad.part('Traverse de plancher avant', S.cyl(25, 300, 'z'), { pos: [300, 260, 0], mat: 'acier', color: DARK });
  cad.part('Traverse de plancher arrière', S.cyl(25, 300, 'z'), { pos: [-150, 260, 0], mat: 'acier', color: DARK });
  cad.part('Support moteur (biellette)', S.box(80, 60, 220), { pos: [-260, 380, 0], mat: 'acier', color: DARK });
  cad.part('Boucle arrière', S.cyl(25, 180, 'z'), { pos: [-650, 800, 0], mat: 'acier', color: DARK });

  // Train avant
  const ta = s.group('Train avant', { code: 'TAV', layer: 'sol' });
  for (const sd of SIDES) ta.part(`Fourreau de fourche ${sd.m}`, S.rod([545, 800, sd.s * 75], [XF, RF + 30, sd.s * 75], 33), { mat: 'aluminium' });
  ta.part('Té de fourche inférieur', S.box(60, 30, 200), { pos: [560, 780, 0], mat: 'aluminium' });
  ta.part('Colonne de direction', S.cyl(28, 260, 'y'), { pos: [543, 880, 0], rot: [0, 0, -26], mat: 'acier' });
  ta.part('Garde-boue avant', S.extrude(Array.from({ length: 12 }, (_, i) => { const a = Math.PI * (0.2 + 0.6 * i / 11); return [XF + (RF + 40) * Math.cos(a), RF + (RF + 40) * Math.sin(a)]; }).concat(Array.from({ length: 12 }, (_, i) => { const a = Math.PI * (0.8 - 0.6 * i / 11); return [XF + (RF + 34) * Math.cos(a), RF + (RF + 34) * Math.sin(a)]; })), 140), { mat: 'abs', color: PAINT, layer: 'ext' });
  wheel(ta, 'Roue avant', 1, { pos: [XF, RF, 0], D: Math.round(RF * 2), W: 120, rimD: 305, tireRef: '120/70-12 51L', disc: [220, 4], caliperAngle: 150, code: 'ROU', hubD: 60, hubL: 110, spokes: 6, spokeW: 22, cap: false });
  boltCircle(ta, { n: 5, pcd: 80, d: 8, L: 18, axis: 'z', at: [XF, RF, 50], dir: 1, label: 'Vis de disque avant', kind: 'cap', couple: 23 });
  ta.part('Axe de roue avant', S.cyl(14, 210, 'z'), { pos: [XF, RF, 0], mat: 'acierHR' });
  ta.part('Écrou d\'axe de roue avant', S.nut(14, 'z'), { pos: [XF, RF, 108], mat: 'zingue', couple: 60 });

  // Groupe motopropulseur oscillant
  const gmp = s.group(P.elec ? 'Motorisation électrique' : 'Bloc moteur oscillant', { code: 'GMP', layer: 'meca' });
  if (!P.elec) {
    gmp.part('Cylindre (alésage 53,5 mm)', S.cyl(95, 110, 'x'), { pos: [-200, 400, -20], rot: [0, 0, -10], mat: 'aluminium' });
    gmp.part('Culasse 4 soupapes', S.box(110, 120, 120), { pos: [-120, 410, -20], rot: [0, 0, -10], mat: 'aluminium' });
    gmp.part('Couvre-culasse', S.box(60, 110, 110), { pos: [-50, 420, -20], rot: [0, 0, -10], mat: 'aluminium', color: 0x222222 });
    gmp.part('Bougie d\'allumage', S.cyl(12, 60, 'y'), { pos: [-110, 480, -20], mat: 'ceramique' });
    gmp.part('Carter moteur', S.box(260, 220, 200), { pos: [-330, 360, -10], mat: 'aluminium' });
    gmp.part('Carter de variateur (CVT)', S.box(480, 180, 60), { pos: [-470, 330, -120], mat: 'aluminium', desc: 'Variateur à courroie trapézoïdale' });
    gmp.part('Poulie motrice', S.cyl(110, 40, 'z'), { pos: [-300, 330, -110], mat: 'acier' });
    gmp.part('Poulie menée + embrayage centrifuge', S.cyl(150, 40, 'z'), { pos: [XR, RR, -110], mat: 'acier' });
    gmp.part('Courroie de variateur', S.pipe([[-300, 385, -110], [XR, RR + 75, -110], [XR - 70, RR, -110], [XR, RR - 75, -110], [-300, 275, -110], [-245, 330, -110]], 20, true), { mat: 'caoutchouc' });
    gmp.part('Carburateur / corps d\'injection', S.cyl(40, 80, 'z'), { pos: [-160, 480, 40], mat: 'aluminium' });
    gmp.part('Boîte à air', S.box(260, 150, 120), { pos: [-450, 520, 90], mat: 'plastique' });
    gmp.part('Pot d\'échappement', S.cyl(110, 380, 'x'), { pos: [-560, 330, 150], mat: 'inox', color: 0x333333 });
    gmp.part('Collecteur d\'échappement', S.pipe([[-170, 380, -20], [-260, 260, 60], [-380, 300, 150]], 32), { mat: 'inox' });
    gmp.part('Radiateur', S.box(40, 160, 200), { pos: [350, 450, 0], mat: 'aluminium' });
    for (let i = 0; i < 8; i++) gmp.part(`Vis de carter de variateur ${i + 1}`, S.capScrew(6, 30, 'z'), { pos: [-680 + (i % 4) * 140, i < 4 ? 400 : 260, -150], rot: axisRot('z', -1), mat: 'acier', couple: 10 });
    gmp.part('Réservoir de carburant (8 L)', S.box(350, 120, 280), { pos: [100, 300, 0], mat: 'plastique' });
  } else {
    gmp.part('Moteur-roue sans balais 4 kW', S.cyl(220, 90, 'z'), { pos: [XR, RR, 0], mat: 'aluminium', desc: 'Moteur synchrone à aimants – 170 N·m' });
    gmp.part('Bras oscillant monobras', S.box(500, 70, 50), { pos: [XR + 250, RR + 40, -90], rot: [0, 0, 6], mat: 'aluminium' });
    gmp.part('Contrôleur moteur', S.box(200, 60, 120), { pos: [-150, 320, 0], mat: 'aluminium' });
    gmp.part('Batterie lithium amovible 72 V 32 Ah', S.box(380, 200, 180), { pos: [-250, 520, 0], mat: 'electrolyte', desc: '2,3 kWh – 12 kg – poignée de transport' });
    gmp.part('Chargeur embarqué', S.box(180, 60, 120), { pos: [150, 290, 0], mat: 'aluminium' });
    gmp.part('Câble de phase moteur', S.pipe([[-150, 320, 0], [-400, 380, -80], [XR + 50, RR + 50, -60]], 14), { mat: 'plastique', color: 0xd06000 });
  }
  const sar = s.group('Train arrière', { code: 'TAR', layer: 'sol' });
  wheel(sar, 'Roue arrière', 1, { pos: [XR, RR, 0], D: Math.round(RR * 2), W: 130, rimD: 305, tireRef: '130/70-12 62L', disc: P.elec ? [220, 4] : null, drum: P.elec ? null : [130, 30], caliperAngle: 30, code: 'ROU', hubD: 60, hubL: 110, spokes: 6, spokeW: 22, cap: false });
  for (const sd of SIDES) if (!P.elec || sd.s > 0) sar.part(`Amortisseur arrière ${sd.m}`, S.rod([XR + 30, RR + 30, sd.s * 110], [-560, 760, sd.s * 110], 45), { mat: 'chrome' });
  sar.part('Ressort d\'amortisseur', S.spring(55, 6, 220, 8), { pos: [-610, 650, 110], rot: [0, 0, 20], mat: 'acier', color: 0xb3202a });
  sar.part('Écrou d\'axe de roue arrière', S.nut(16, 'z'), { pos: [XR, RR, 85], mat: 'zingue', couple: 118 });

  // Carrosserie
  const car = s.group('Carénages', { code: 'CAR', layer: 'ext' });
  car.part('Tablier avant (protège-jambes)', S.extrude([[440, 250], [560, 980], [630, 980], [660, 700], [580, 250]], 420, 15), { mat: 'abs', color: PAINT });
  car.part('Contre-tablier (boîte à gants)', S.box(30, 400, 380), { pos: [470, 650, 0], rot: [0, 0, -12], mat: 'abs', color: DARK, layer: 'int' });
  car.part('Plancher repose-pieds', S.box(560, 20, 380), { pos: [130, 290, 0], mat: 'abs', color: DARK });
  for (const sd of SIDES) {
    car.part(`Flanc de carénage arrière ${sd.m}`, S.extrude([[-130, 290], [-200, 640], [-760, 860], [-850, 780], [-650, 450], [-320, 290]], 6), { pos: [0, 0, sd.s * 175], mat: 'abs', color: PAINT });
    car.part(`Bas de caisse ${sd.m}`, S.box(560, 120, 6), { pos: [130, 230, sd.s * 190], mat: 'abs', color: DARK });
    car.part(`Rétroviseur ${sd.m}`, S.ellipsoid(40, 80, 140), { pos: [560, 1250, sd.s * 330], mat: 'abs', color: DARK });
    car.part(`Tige de rétroviseur ${sd.m}`, S.rod([540, 1080, sd.s * 280], [560, 1210, sd.s * 320], 12), { mat: 'chrome' });
    car.part(`Clignotant avant ${sd.m}`, S.box(40, 30, 70), { pos: [650, 900, sd.s * 160], mat: 'feuOrange' });
    car.part(`Repose-pied passager ${sd.m}`, S.box(80, 15, 60), { pos: [-250, 330, sd.s * 220], mat: 'aluminium' });
  }
  car.part('Coffre sous selle (casque intégral)', S.box(500, 280, 300), { pos: [-330, 640, 0], mat: 'plastique', color: DARK, layer: 'int', desc: 'Volume 32 L' });
  car.part('Selle biplace', S.extrude([[-50, 800], [-60, 860], [-720, 900], [-780, 860], [-700, 800]], 300, 25), { mat: 'cuir', color: 0x1a1a1a });
  car.part('Charnière de selle', S.box(40, 30, 120), { pos: [-60, 790, 0], mat: 'acier', layer: 'meca' });
  car.part('Poignée passager', S.box(200, 30, 300), { pos: [-760, 910, 0], mat: 'aluminium' });
  car.part('Feu arrière LED', S.box(40, 60, 200), { pos: [-850, 800, 0], mat: 'feuRouge' });
  car.part('Garde-boue arrière / support de plaque', S.box(250, 10, 180), { pos: [-860, 650, 0], rot: [0, 0, -30], mat: 'abs', color: DARK });
  car.part('Plaque d\'immatriculation', S.box(4, 130, 210), { pos: [-940, 560, 0], rot: [0, 0, -15], mat: 'aluminium', color: 0xffffff });
  car.part('Couvre-guidon', S.box(200, 120, 600), { pos: [540, 1090, 0], mat: 'abs', color: PAINT });
  car.part('Projecteur LED', S.box(40, 80, 200), { pos: [640, 1060, 0], mat: 'feuBlanc' });
  car.part('Bulle / saute-vent', S.box(6, 220, 300), { pos: [600, 1210, 0], rot: [0, 0, 20], mat: 'polycarbonate' });

  // Commandes
  const cmd = s.group('Guidon & commandes', { code: 'GUI', layer: 'meca' });
  cmd.part('Guidon', S.cyl(22, 700, 'z'), { pos: [520, 1100, 0], mat: 'aluminium' });
  for (const sd of SIDES) {
    cmd.part(`Poignée ${sd.f}`, S.cyl(32, 120, 'z'), { pos: [520, 1100, sd.s * 300], mat: 'caoutchouc' });
    cmd.part(`Levier de frein ${sd.m}`, S.box(20, 15, 170), { pos: [570, 1110, sd.s * 280], mat: 'aluminium' });
    cmd.part(`Maître-cylindre ${sd.m}`, S.cyl(30, 70, 'z'), { pos: [530, 1120, sd.s * 210], mat: 'aluminium' });
  }
  cmd.part('Combiné d\'instruments (TFT)', S.box(30, 110, 180), { pos: [510, 1170, 0], rot: [0, 0, 30], mat: 'ecran' });
  cmd.part('Béquille centrale', S.box(200, 20, 300), { pos: [-180, 120, 0], rot: [0, 0, 60], mat: 'acier', color: DARK });
  cmd.part('Béquille latérale', S.rod([-80, 240, -150], [-60, 20, -300], 22), { mat: 'acier', color: DARK });
  cmd.part('Batterie 12 V 6 Ah', S.box(110, 90, 70), { pos: [400, 450, 0], mat: 'electrolyte' });
  return s;
}

// ============================================================================ Quad
function buildQuad(P) {
  const WB = 1290, XF = WB / 2, XR = -WB / 2;
  const DF = 660, DR = 660, YF = DF / 2, YR = DR / 2; // 26×8-12 / 26×10-12
  const tF = 940, tR = 940;
  const PAINT = 0x3c5a2a, DARK = 0x2a2c30;
  const q = new Assembly(P.label, { prefix: 'QD', code: 'GEN', layer: 'meca', desc: `${P.desc} – empattement ${WB} mm – pneus 26×8-12 (AV) et 26×10-12 (AR)` });

  const cad = q.group('Cadre tubulaire', { code: 'CAD', layer: 'struct' });
  for (const sd of SIDES) {
    const z = sd.s * 200;
    cad.part(`Longeron inférieur ${sd.m}`, S.pipe([[XF + 200, 330, z], [XF - 200, 260, z], [XR + 150, 260, z], [XR - 150, 330, z]], 35), { mat: 'acier', color: DARK });
    cad.part(`Longeron supérieur ${sd.m}`, S.pipe([[XF + 150, 680, z * 0.8], [XF - 250, 720, z], [XR + 50, 760, z], [XR - 250, 760, z]], 32), { mat: 'acier', color: DARK });
    for (const x of [XF + 100, 0, XR - 100]) cad.part(`Montant ${sd.c}${x > 0 ? 'AV' : x < 0 ? 'AR' : 'C'}`, S.rod([x, 280, z], [x, 700, z * 0.9], 28), { mat: 'acier', color: DARK });
  }
  for (const x of [XF + 150, XF - 200, XR + 150, XR - 200]) cad.part(`Traverse ${x > 0 ? 'avant' : 'arrière'} ${Math.abs(x) > WB / 2 ? 'extrême' : 'intérieure'}`, S.cyl(30, 420, 'z'), { pos: [x, 300, 0], mat: 'acier', color: DARK });
  cad.part('Sabot de protection', S.box(1200, 6, 420), { pos: [0, 240, 0], mat: 'aluminium' });

  // Moteur
  const gmp = q.group('Groupe motopropulseur', { code: 'GMP', layer: 'meca' });
  gmp.part('Carter moteur monocylindre 500 cm³', S.box(360, 300, 300), { pos: [0, 420, 0], mat: 'aluminium', desc: 'Alésage 92 × course 75 mm – 4 soupapes – injection' });
  gmp.part('Cylindre', S.cyl(130, 170, 'y'), { pos: [40, 640, 0], rot: [0, 0, -10], mat: 'aluminium' });
  gmp.part('Culasse', S.box(170, 120, 170), { pos: [60, 770, 0], rot: [0, 0, -10], mat: 'aluminium' });
  gmp.part('Couvre-culasse', S.box(150, 50, 150), { pos: [70, 855, 0], rot: [0, 0, -10], mat: 'aluminium', color: 0x222222 });
  gmp.part('Carter de variateur CVT', S.box(450, 260, 90), { pos: [-40, 450, -210], mat: 'plastique', color: DARK, desc: 'Variateur à courroie + boîte L/H/N/R/P' });
  gmp.part('Arbre de transmission avant', S.cyl(40, XF - 150, 'x'), { pos: [XF / 2 + 50, 350, 60], mat: 'acierHR' });
  gmp.part('Arbre de transmission arrière', S.cyl(40, -XR - 150, 'x'), { pos: [XR / 2 - 50, 350, 60], mat: 'acierHR' });
  gmp.part('Pot d\'échappement', S.cyl(130, 450, 'x'), { pos: [XR - 100, 720, 180], mat: 'inox', color: 0x333333 });
  gmp.part('Collecteur', S.pipe([[100, 760, 60], [0, 700, 160], [XR + 150, 720, 180]], 40), { mat: 'inox' });
  gmp.part('Radiateur', S.box(50, 260, 380), { pos: [XF + 230, 600, 0], mat: 'aluminium' });
  gmp.part('Réservoir de carburant (18 L)', S.box(350, 180, 320), { pos: [180, 880, 0], mat: 'plastique', color: DARK });
  gmp.part('Boîte à air', S.box(250, 150, 250), { pos: [-200, 840, 0], mat: 'plastique', color: DARK });
  gmp.part('Batterie 12 V 18 Ah', S.box(180, 160, 90), { pos: [-300, 680, -120], mat: 'electrolyte' });
  gmp.part('Treuil électrique 1 100 kg', S.cyl(110, 300, 'z'), { pos: [XF + 380, 420, 0], mat: 'peinture', color: 0x111111 });
  for (let i = 0; i < 4; i++) gmp.part(`Vis de fixation moteur ${i + 1}`, S.bolt(10, 90, 'z'), { pos: [i < 2 ? 150 : -150, i % 2 ? 330 : 520, 160], rot: axisRot('z', 1), mat: 'acierHR', couple: 55 });

  // Trains roulants
  const tr = q.group('Trains roulants', { code: 'TRN', layer: 'sol' });
  const tav = tr.group('Train avant à doubles triangles', { code: 'TAV' });
  tav.part('Différentiel avant à blocage', S.box(200, 180, 200), { pos: [XF, YF, 0], mat: 'aluminium' });
  tav.part('Biellette de direction gauche', S.rod([XF - 120, YF + 80, -50], [XF - 100, YF + 40, -tF / 2 + 120], 18), { mat: 'acierHR' });
  tav.part('Biellette de direction droite', S.rod([XF - 120, YF + 80, 50], [XF - 100, YF + 40, tF / 2 - 120], 18), { mat: 'acierHR' });
  tav.part('Colonne de direction', S.rod([XF - 120, YF + 100, 0], [XF - 250, 1000, 0], 30), { mat: 'acier' });
  const tar = tr.group('Train arrière à bras indépendants', { code: 'TAR' });
  tar.part('Pont arrière (couple conique)', S.box(220, 200, 220), { pos: [XR, YR, 0], mat: 'aluminium' });
  tar.part('Frein arrière à bain d\'huile', S.cyl(180, 80, 'z'), { pos: [XR, YR, -150], mat: 'fonte' });
  for (const sd of SIDES) {
    tav.part(`Triangle inférieur ${sd.m}`, S.box(260, 30, tF / 2 - 200), { pos: [XF, YF - 70, sd.s * (tF / 4 + 70)], mat: 'acier', color: 0xb3202a });
    tav.part(`Triangle supérieur ${sd.m}`, S.box(220, 30, tF / 2 - 230), { pos: [XF, YF + 110, sd.s * (tF / 4 + 60)], mat: 'acier', color: 0xb3202a });
    tav.part(`Amortisseur avant ${sd.m}`, S.rod([XF, YF - 40, sd.s * (tF / 2 - 150)], [XF + 30, 650, sd.s * 230], 50), { mat: 'chrome' });
    tav.part(`Ressort avant ${sd.m}`, S.spring(70, 9, 220, 7), { pos: [XF + 15, YF + 180, sd.s * (tF / 2 - 210)], rot: [sd.s * 25, 0, 0], mat: 'acier', color: 0xb3202a });
    tav.part(`Cardan de roue avant ${sd.m}`, S.rod([XF, YF, sd.s * 100], [XF, YF, sd.s * (tF / 2 - 120)], 28), { mat: 'acierHR' });
    tar.part(`Bras arrière ${sd.m}`, S.box(260, 30, tR / 2 - 200), { pos: [XR, YR - 70, sd.s * (tR / 4 + 70)], mat: 'acier', color: 0xb3202a });
    tar.part(`Amortisseur arrière ${sd.m}`, S.rod([XR, YR - 40, sd.s * (tR / 2 - 150)], [XR + 50, 700, sd.s * 210], 50), { mat: 'chrome' });
    tar.part(`Cardan de roue arrière ${sd.m}`, S.rod([XR, YR, sd.s * 110], [XR, YR, sd.s * (tR / 2 - 120)], 30), { mat: 'acierHR' });
    for (const [x, tw, nm, y] of [[XF, 200, 'avant', YF], [XR, 250, 'arrière', YR]]) {
      wheel(tr, `Roue ${nm} ${sd.f}`, sd.s, {
        pos: [x, y, sd.s * (nm === 'avant' ? tF : tR) / 2], D: nm === 'avant' ? DF : DR, W: tw, rimD: 305, tireRef: nm === 'avant' ? '26×8-12 – 6 plis' : '26×10-12 – 6 plis',
        studs: 4, pcd: 137, stud: 10, studL: 25, studKind: 'nut', studLabel: 'Écrou de roue conique', couple: 80, disc: nm === 'avant' ? [180, 4] : null, caliperAngle: 160,
        code: 'ROU', hubD: 90, hubL: 80, spokes: 6, spokeW: 30, rimMat: 'aluminium', cap: false,
      });
      // Crampons tout-terrain
      const cr = tr.group(`Crampons de pneu ${nm} ${sd.m}`, { pos: [x, y, sd.s * (nm === 'avant' ? tF : tR) / 2], code: 'ROU' });
      const R = (nm === 'avant' ? DF : DR) / 2, n = 18;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * 360;
        cr.part(`Crampon ${i + 1}`, S.box(30, 18, tw * 0.75), { pos: [Math.cos(a * Math.PI / 180) * (R + 6), Math.sin(a * Math.PI / 180) * (R + 6), 0], rot: [0, 0, a + 90], mat: 'caoutchouc' });
      }
    }
  }

  // Carrosserie et commandes
  const car = q.group('Carrosserie & équipements', { code: 'CAR', layer: 'ext' });
  car.part('Carénage central', S.extrude([[XF + 300, 750], [XF + 100, 950], [-100, 980], [XR - 150, 820], [XR - 300, 700]], 520, 20), { mat: 'plastique', color: PAINT });
  for (const sd of SIDES) {
    car.part(`Garde-boue avant ${sd.m}`, S.extrude(Array.from({ length: 10 }, (_, i) => { const a = Math.PI * (0.1 + 0.7 * i / 9); return [XF + 400 * Math.cos(a), YF + 400 * Math.sin(a)]; }).concat([[XF - 300, 760], [XF + 380, 760]]), 300), { pos: [0, 0, sd.s * (tF / 2 - 30)], mat: 'plastique', color: PAINT });
    car.part(`Garde-boue arrière ${sd.m}`, S.extrude(Array.from({ length: 10 }, (_, i) => { const a = Math.PI * (0.2 + 0.7 * i / 9); return [XR + 400 * Math.cos(a), YR + 400 * Math.sin(a)]; }).concat([[XR - 380, 760], [XR + 300, 760]]), 320), { pos: [0, 0, sd.s * (tR / 2 - 30)], mat: 'plastique', color: PAINT });
    car.part(`Repose-pied ${sd.m}`, S.box(500, 20, 220), { pos: [-50, 330, sd.s * 330], mat: 'aluminium' });
    car.part(`Phare ${sd.m}`, S.box(50, 80, 150), { pos: [XF + 380, 780, sd.s * 150], mat: 'feuBlanc' });
    car.part(`Feu arrière ${sd.m}`, S.box(40, 60, 100), { pos: [XR - 420, 700, sd.s * 180], mat: 'feuRouge' });
  }
  car.part('Porte-bagages avant', S.box(450, 25, 750), { pos: [XF + 150, 880, 0], mat: 'acier', color: 0x111111 });
  car.part('Porte-bagages arrière', S.box(500, 25, 800), { pos: [XR - 100, 880, 0], mat: 'acier', color: 0x111111 });
  car.part('Pare-buffle', S.pipe([[XF + 500, 350, -250], [XF + 550, 650, -250], [XF + 550, 650, 250], [XF + 500, 350, 250]], 32), { mat: 'acier', color: 0x111111 });
  car.part('Boule d\'attelage', S.sphere(50), { pos: [XR - 480, 420, 0], mat: 'chrome' });
  car.part('Selle', S.extrude([[150, 960], [130, 1010], [-450, 1010], [-500, 960]], 330, 25), { mat: 'cuir', color: 0x1a1a1a, layer: 'int' });
  const gui = q.group('Guidon & commandes', { code: 'GUI', layer: 'meca' });
  gui.part('Guidon', S.cyl(28, 820, 'z'), { pos: [XF - 260, 1070, 0], mat: 'acier', color: 0x111111 });
  for (const sd of SIDES) {
    gui.part(`Poignée ${sd.f}`, S.cyl(34, 130, 'z'), { pos: [XF - 260, 1070, sd.s * 360], mat: 'caoutchouc' });
    gui.part(`Protège-main ${sd.m}`, S.box(150, 60, 120), { pos: [XF - 180, 1080, sd.s * 360], mat: 'plastique', color: PAINT });
  }
  gui.part('Commodo 2RM / 4RM / blocage', S.box(70, 60, 80), { pos: [XF - 260, 1090, 230], mat: 'abs' });
  gui.part('Levier d\'accélérateur au pouce', S.box(40, 10, 50), { pos: [XF - 230, 1070, 300], mat: 'abs' });
  gui.part('Afficheur numérique', S.box(30, 90, 140), { pos: [XF - 250, 1120, 0], rot: [0, 0, 30], mat: 'ecran' });
  gui.part('Levier de sélection L/H/N/R/P', S.cyl(20, 180, 'y'), { pos: [100, 920, -260], rot: [20, 0, 0], mat: 'acier' });
  return q;
}
