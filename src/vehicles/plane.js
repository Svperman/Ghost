// Avion léger monomoteur 4 places à aile haute haubanée
// Longueur 8 280 mm · envergure 11 000 mm · hauteur 2 720 mm · moteur 4 cylindres à plat 5,9 L (120 kW)
import { Assembly, S, SIDES, boltCircle, boltRow, axisRot, airfoil, wedge } from '../core/builder.js';
import { wheel } from '../core/parts.js';

export const PLANE_TYPES = {
  monomoteur: {
    label: 'Monomoteur léger à aile haute', desc: 'Avion école / tourisme 4 places',
    makers: ['Cessna (172 Skyhawk)', 'Piper (PA-28 – aile basse)', 'Robin (DR400 – aile basse bois)', 'Diamond (DA40 – composite)', 'Cirrus (SR22 – parachute cellule)', 'Tecnam (P2010)'],
  },
};

const WHITE = 0xf3f3f1, STRIPE = 0x1b3d7a;
const FY = 1300; // axe du fuselage
const WY = 2100; // emplanture de l'aile (intrados)
const DIH = Math.tan(1.7 * Math.PI / 180);

export function buildPlane() {
  const av = new Assembly('Avion léger monomoteur', { prefix: 'AV', code: 'GEN', layer: 'meca', desc: 'Monomoteur 4 places aile haute – 8 280 × 11 000 × 2 720 mm – MTOW 1 157 kg' });

  // ------------------------------------------------------------------ Fuselage
  const fu = av.group('Fuselage', { code: 'FUS', layer: 'ext' });
  const prof = [[0, -5250], [90, -5150], [230, -4300], [380, -3200], [500, -2000], [570, -800], [585, 0], [570, 900], [540, 1500]];
  fu.part('Revêtement de fuselage', S.lathe(prof, 48, 1.22, 1), { pos: [0, FY, 0], mat: 'peintureAlu', color: WHITE, desc: 'Semi-monocoque – revêtement 2024-T3 ép. 0,63 à 0,81 mm' });
  fu.part('Bande décorative', S.lathe([[332, -3900], [474, -2400], [569, -1000], [588, 0], [576, 800]], 48, 1.22, 1.01), { pos: [0, FY, 0], scale: [1, 0.2, 1], mat: 'peintureAlu', color: STRIPE });
  for (let i = 0; i < 9; i++) {
    const x = -4600 + i * 560;
    const r = Math.min(580, 120 + (x + 5200) * 0.12);
    fu.part(`Couple n°${i + 1}`, S.tube(r * 2, r * 2 - 50, 25, 'x', 40), { pos: [x, FY, 0], scale: [1, 1.22, 1], mat: 'alu2024', layer: 'struct' });
  }
  for (const sd of SIDES) for (const y of [-1, 1]) fu.part(`Lisse ${y > 0 ? 'supérieure' : 'inférieure'} ${sd.f}`, S.box(5200, 20, 20), { pos: [-2100, FY + y * 500, sd.s * 470], mat: 'alu2024', layer: 'struct' });
  fu.part('Cloison pare-feu', S.box(25, 1250, 1100), { pos: [1450, FY, 0], mat: 'inox', desc: 'Acier inoxydable 0,4 mm', layer: 'struct' });
  fu.part('Plancher cabine', S.box(2600, 15, 1050), { pos: [100, FY - 520, 0], mat: 'alu2024', layer: 'struct' });
  fu.part('Carénage dorsal', S.extrude([[-1500, 1980], [-4000, 1700], [-4000, 1800], [-1500, 2080]], 220, 20), { mat: 'peintureAlu', color: WHITE });
  const vit = fu.group('Verrière & vitrages', { code: 'VIT' });
  vit.part('Pare-brise', S.box(820, 8, 1080), { pos: [1080, 1960, 0], rot: [0, 0, -42], mat: 'plexi', desc: 'PMMA étiré ép. 4,8 mm' });
  vit.part('Lunette arrière', S.box(900, 6, 900), { pos: [-950, 1940, 0], rot: [0, 0, 18], mat: 'plexi' });
  vit.part('Baguette de pare-brise centrale', S.box(820, 20, 30), { pos: [1080, 1968, 0], rot: [0, 0, -42], mat: 'aluminium' });
  boltRow(vit, { from: [1390, 1680, -520], to: [1390, 1680, 520], n: 9, d: 4, L: 12, axis: 'x', dir: 1, label: 'Vis de baguette de pare-brise', kind: 'cap', mat: 'inox', couple: 2.5 });
  for (const sd of SIDES) {
    const pt = fu.group(`Porte cabine ${sd.f}`, { code: 'POR' });
    pt.part('Panneau de porte', S.extrude([[-100, 900], [-100, 1960], [1150, 1960], [1300, 1600], [1300, 900]], 10, 3), { pos: [0, 0, sd.s * 588], mat: 'peintureAlu', color: WHITE });
    pt.part('Glace de porte', S.extrude([[-50, 1450], [-50, 1920], [1100, 1920], [1220, 1600], [1220, 1450]], 6), { pos: [0, 0, sd.s * 596], mat: 'plexi' });
    pt.part('Poignée de porte', S.box(150, 30, 30), { pos: [0, 1400, sd.s * 610], mat: 'chrome' });
    for (const y of [1150, 1750]) pt.part(`Charnière ${y < 1400 ? 'basse' : 'haute'}`, S.cyl(20, 90, 'y'), { pos: [1300, y, sd.s * 600], mat: 'inox' });
    vit.part(`Glace arrière ${sd.f}`, S.extrude([[-1400, 1500], [-1400, 1900], [-200, 1940], [-200, 1500]], 6), { pos: [0, 0, sd.s * 585], mat: 'plexi' });
    fu.part(`Marchepied ${sd.m}`, S.box(120, 15, 90), { pos: [-300, 650, sd.s * 700], mat: 'aluminium' });
    fu.part(`Jambe de marchepied ${sd.m}`, S.rod([-300, 650, sd.s * 700], [-300, 850, sd.s * 560], 20), { mat: 'acier' });
  }
  const ant = fu.group('Antennes', { code: 'AVI', layer: 'meca' });
  ant.part('Antenne VHF COM 1', S.rod([-1800, 2000, 0], [-2000, 2550, 0], 10), { mat: 'composite', color: 0x222222 });
  ant.part('Antenne VOR (moustaches)', S.rod([-4200, 2400, -350], [-4200, 2400, 350], 8), { mat: 'aluminium' });
  ant.part('Antenne transpondeur', S.cyl(10, 100, 'y'), { pos: [-1500, 640, 0], mat: 'laiton' });
  ant.part('Antenne GPS', S.box(80, 20, 60), { pos: [-600, 2050, 0], mat: 'abs' });
  ant.part('Balise de détresse ELT', S.box(160, 80, 90), { pos: [-3000, 1400, 0], mat: 'abs', color: 0xf2a100 });
  ant.part('Feu anticollision', S.ellipsoid(80, 40, 80), { pos: [-4900, 2780, 0], mat: 'feuRouge' });

  // ------------------------------------------------------------------ Voilure
  const vo = av.group('Voilure', { code: 'AIL', layer: 'ext' });
  const prf = airfoil(0.12, 0.02, 0.4, 20);
  const c = (z) => (Math.abs(z) < 2500 ? 1630 : 1630 - (Math.abs(z) - 2500) * (510 / 2900));
  const ly = (z) => WY + (Math.abs(z) - 550) * DIH;
  for (const sd of SIDES) {
    const aile = vo.group(`Aile ${sd.f}`, { code: `AI${sd.c}` });
    const zs = [550, 2500, 5400].map((z) => z * sd.s);
    aile.part('Caisson d\'aile', S.loft(zs.map((z) => ({ x: 600 - (1630 - c(z)) * 0.3, y: ly(z), z, chord: c(z) * 0.76, tScale: 1 / 0.76 })), prf, 'z'), { mat: 'peintureAlu', color: WHITE, desc: 'Profil NACA 2412 – dièdre 1,7° – vrillage 3°' });
    aile.part('Longeron principal', S.box(30, 150, 4800), { pos: [190, ly(2950) + 28, sd.s * 2950], rot: [-sd.s * 1.7, 0, 0], mat: 'alu2024', layer: 'struct' });
    aile.part('Longeron arrière', S.box(25, 60, 4800), { pos: [-330, ly(2950) + 25, sd.s * 2950], rot: [-sd.s * 1.7, 0, 0], mat: 'alu2024', layer: 'struct' });
    for (let k = 0; k < 10; k++) {
      const z = sd.s * (700 + k * 500);
      aile.part(`Nervure ${k + 1}`, S.loft([{ x: 600 - (1630 - c(z)) * 0.3, y: ly(z), z: z - 4, chord: c(z) * 0.75, tScale: 1 / 0.76 * 0.97 }, { x: 600 - (1630 - c(z)) * 0.3, y: ly(z), z: z + 4, chord: c(z) * 0.75, tScale: 1 / 0.76 * 0.97 }], prf, 'z'), { mat: 'alu2024', layer: 'struct' });
    }
    aile.part('Réservoir structural 106 L', S.box(480, 90, 1500), { pos: [290, ly(1800) + 30, sd.s * 1800], rot: [-sd.s * 1.7, 0, 0], mat: 'alu2024', desc: '106 L dont 102 L utilisables – AVGAS 100LL', layer: 'meca' });
    aile.part('Bouchon de réservoir', S.cyl(70, 20, 'y'), { pos: [250, ly(1800) + 150, sd.s * 1800], mat: 'aluminium' });
    aile.part('Purge de réservoir', S.cyl(15, 30, 'y'), { pos: [100, ly(1100) - 15, sd.s * 1100], mat: 'laiton' });
    aile.part('Saumon d\'aile', S.ellipsoid(c(5400) * 0.8, 130, 220), { pos: [600 - (1630 - c(5400)) * 0.3 - c(5400) * 0.4 + c(5400) * 0.4 * 0.24, ly(5400) + 25, sd.s * 5470], mat: 'composite', color: WHITE });
    aile.part(sd.s < 0 ? 'Feu de navigation rouge (bâbord)' : 'Feu de navigation vert (tribord)', S.ellipsoid(60, 40, 40), { pos: [450, ly(5500) + 30, sd.s * 5560], mat: sd.s < 0 ? 'feuRouge' : 'feuVert' });
    aile.part('Feu à éclats (strobe)', S.ellipsoid(40, 30, 30), { pos: [370, ly(5500) + 50, sd.s * 5580], mat: 'feuBlanc' });
    if (sd.s < 0) {
      aile.part('Tube de Pitot', S.cyl(16, 300, 'x'), { pos: [500, ly(3500) - 120, -3500], mat: 'inox' });
      aile.part('Mât de Pitot', S.box(40, 100, 15), { pos: [380, ly(3500) - 60, -3500], mat: 'aluminium' });
      aile.part('Avertisseur de décrochage', S.box(30, 15, 40), { pos: [620, ly(1600) + 40, -1600], mat: 'inox' });
    } else {
      aile.part('Phare d\'atterrissage', S.cyl(110, 40, 'x'), { pos: [640, ly(2600) + 60, 2600], mat: 'feuBlanc' });
    }
    // Gouvernes
    const te = (z) => 600 - (1630 - c(z)) * 0.3 - c(z) * 0.76;
    const vl = aile.group(`Volet ${sd.m}`, { code: `AI${sd.c}` });
    vl.part('Volet à fente', S.loft([600, 3300].map((z) => z * sd.s).map((z) => ({ x: te(z) - 10, y: ly(z) + 55, z, chord: c(z) * 0.24 })), wedge(0.3), 'z'), { mat: 'peintureAlu', color: WHITE, desc: 'Débattement 0° à 30°' });
    for (const z of [900, 2000, 3100]) {
      vl.part(`Rail de volet ${z}`, S.box(250, 60, 15), { pos: [te(z * sd.s) - 60, ly(z) + 20, sd.s * z], mat: 'acier' });
      vl.part(`Boulon de rail ${z}`, S.bolt(6, 30, 'z'), { pos: [te(z * sd.s) - 100, ly(z) + 30, sd.s * (z + 15)], rot: axisRot('z', sd.s), mat: 'acierHR', couple: 7 });
    }
    vl.part('Vérin électrique de volet', S.cyl(50, 300, 'z'), { pos: [te(800) + 150, ly(800) + 60, sd.s * 800], mat: 'aluminium' });
    const al = aile.group(`Aileron ${sd.m}`, { code: `AI${sd.c}` });
    al.part('Aileron', S.loft([3350, 5300].map((z) => z * sd.s).map((z) => ({ x: te(z) - 10, y: ly(z) + 55, z, chord: c(z) * 0.24 })), wedge(0.3), 'z'), { mat: 'peintureAlu', color: WHITE, desc: 'Débattement +20° / −15°' });
    for (const z of [3500, 4300, 5100]) {
      al.part(`Ferrure de charnière ${z}`, S.box(80, 50, 12), { pos: [te(z * sd.s) + 10, ly(z) + 50, sd.s * z], mat: 'alu2024' });
      al.part(`Boulon de charnière ${z}`, S.bolt(5, 30, 'z'), { pos: [te(z * sd.s) - 5, ly(z) + 55, sd.s * (z + 12)], rot: axisRot('z', sd.s), mat: 'acierHR', couple: 4 });
    }
    al.part('Guignol d\'aileron', S.box(60, 90, 8), { pos: [te(4000 * sd.s) - 30, ly(4000) + 10, sd.s * 4000], mat: 'acier' });
    al.part('Câble de commande d\'aileron', S.pipe([[te(4000 * sd.s) + 50, ly(4000) + 60, sd.s * 4000], [-300, ly(1500) + 60, sd.s * 1500], [-300, WY - 40, sd.s * 450], [700, 1300, sd.s * 200]], 3), { mat: 'inox' });
    // Rivets d'extrados
    const rv = aile.group(`Rivets d'extrados ${sd.m}`, { code: `AI${sd.c}` });
    for (const [nom, x, dy] of [['longeron principal', 190, 120], ['longeron arrière', -330, 105]]) {
      for (let k = 0; k < 20; k++) {
        const z = 650 + k * 240;
        rv.part(`Rivet ${nom} ${String(k + 1).padStart(2, '0')}`, S.rivet(3.2, 8), { pos: [x, ly(z) + dy - (z > 2500 ? (z - 2500) * (x > 0 ? 0.012 : 0.017) : 0), sd.s * z], mat: 'alu2024', desc: 'Rivet universel MS20470AD4' });
      }
    }
    // Hauban
    const hb = aile.group(`Hauban ${sd.m}`, { code: `AI${sd.c}` });
    hb.part('Hauban profilé', S.rod([150, 780, sd.s * 560], [170, ly(3000) - 10, sd.s * 3000], 55), { scale: [1, 1, 1], mat: 'peintureAlu', color: WHITE });
    hb.part('Ferrure de hauban sur fuselage', S.box(100, 60, 40), { pos: [150, 780, sd.s * 570], mat: 'acier' });
    hb.part('Ferrure de hauban sur aile', S.box(100, 40, 60), { pos: [170, ly(3000) - 10, sd.s * 3000], mat: 'acier' });
    hb.part('Boulon de hauban inférieur AN6', S.bolt(10, 60, 'x'), { pos: [210, 780, sd.s * 570], mat: 'acierHR', couple: 18 });
    hb.part('Boulon de hauban supérieur AN6', S.bolt(10, 70, 'x'), { pos: [230, ly(3000) - 10, sd.s * 3000], mat: 'acierHR', couple: 18 });
    hb.part('Carénage de jonction hauban/aile', S.ellipsoid(220, 80, 90), { pos: [170, ly(3000) - 40, sd.s * 3000], mat: 'composite', color: WHITE });
    // Attaches d'aile
    for (const [nom, x] of [['avant', 190], ['arrière', -470]]) {
      aile.part(`Ferrure d'attache ${nom}`, S.box(120, 100, 60), { pos: [x, WY + 60, sd.s * 560], mat: 'acierHR' });
      aile.part(`Boulon d'attache ${nom} AN7`, S.bolt(11, 90, 'x'), { pos: [x + 60, WY + 60, sd.s * 560], mat: 'acierHR', couple: 25 });
      aile.part(`Écrou d'attache ${nom}`, S.nut(11, 'x'), { pos: [x - 60, WY + 60, sd.s * 560], mat: 'acierHR', couple: 25 });
    }
  }

  // ------------------------------------------------------------------ Empennages
  const em = av.group('Empennages', { code: 'EMP', layer: 'ext' });
  const sym = airfoil(0.09, 0, 0.4, 16);
  const hz = em.group('Empennage horizontal', { code: 'EMP' });
  for (const sd of SIDES) {
    hz.part(`Plan fixe horizontal ${sd.m}`, S.loft([{ x: -4250, y: FY + 120, z: sd.s * 90, chord: 900 }, { x: -4350, y: FY + 120, z: sd.s * 1700, chord: 720 }], sym, 'z'), { mat: 'peintureAlu', color: WHITE });
    hz.part(`Gouverne de profondeur ${sd.f}`, S.loft([{ x: -5170, y: FY + 120, z: sd.s * 120, chord: 520 }, { x: -5090, y: FY + 120, z: sd.s * 1720, chord: 360 }], wedge(0.14), 'z'), { mat: 'peintureAlu', color: WHITE, desc: 'Débattement +28° / −23°' });
    for (const z of [300, 900, 1500]) hz.part(`Boulon de charnière de profondeur ${sd.c}${z}`, S.bolt(5, 30, 'z'), { pos: [-5150, FY + 125, sd.s * z], rot: axisRot('z', sd.s), mat: 'acierHR', couple: 4 });
  }
  hz.part('Tab de compensation de profondeur', S.loft([{ x: -5560, y: FY + 120, z: 300, chord: 140 }, { x: -5560, y: FY + 120, z: 900, chord: 140 }], wedge(0.1), 'z'), { mat: 'aluminium' });
  hz.part('Guignol de profondeur', S.box(80, 180, 10), { pos: [-5160, FY + 60, 0], mat: 'acier' });
  const vt = em.group('Empennage vertical', { code: 'EMP' });
  vt.part('Dérive', S.loft([{ x: -4150, y: FY + 450, z: 0, chord: 1150 }, { x: -4780, y: 2650, z: 0, chord: 620 }], sym, 'y'), { mat: 'peintureAlu', color: WHITE });
  vt.part('Gouverne de direction', S.loft([{ x: -5300, y: FY + 200, z: 0, chord: 480 }, { x: -5400, y: 2700, z: 0, chord: 380 }], wedge(0.14), 'y'), { mat: 'peintureAlu', color: STRIPE, desc: 'Débattement ±24°' });
  vt.part('Saumon de dérive', S.ellipsoid(640, 40, 70), { pos: [-4950, 2670, 0], mat: 'composite', color: WHITE });
  for (const y of [1700, 2150, 2550]) vt.part(`Boulon de charnière de direction ${y}`, S.bolt(5, 30, 'z'), { pos: [-5300, y, 15], rot: axisRot('z', 1), mat: 'acierHR', couple: 4 });
  vt.part('Feu de position arrière', S.ellipsoid(50, 30, 30), { pos: [-5650, 1650, 0], mat: 'feuBlanc' });
  for (const sd of SIDES) {
    em.part(`Câble de commande de direction ${sd.m}`, S.pipe([[-5300, FY + 250, sd.s * 120], [-3000, FY - 200, sd.s * 250], [800, FY - 450, sd.s * 300]], 3), { mat: 'inox' });
    em.part(`Câble de commande de profondeur ${sd.s < 0 ? 'cabré' : 'piqué'}`, S.pipe([[-5160, FY + 60 + sd.s * 70, 0], [-3000, FY - 150 + sd.s * 40, 60], [500, FY - 300, 60]], 3), { mat: 'inox' });
  }

  // ------------------------------------------------------------------ Groupe motopropulseur
  const gmp = av.group('Groupe motopropulseur', { code: 'GMP', layer: 'meca' });
  const mo = gmp.group('Moteur 4 cylindres à plat 5,9 L', { code: 'MOT', desc: '361 in³ (5 916 cm³) – 4 cylindres opposés refroidis par air – 120 kW à 2 700 tr/min' });
  const EX = 2050;
  mo.part('Carter moteur', S.box(620, 330, 360), { pos: [EX, FY, 0], mat: 'aluminium', color: 0x5a5f66 });
  mo.part('Carter d\'huile', S.box(420, 140, 300), { pos: [EX - 80, FY - 230, 0], mat: 'aluminium', color: 0x5a5f66 });
  mo.part('Vilebrequin', S.cyl(60, 760, 'x'), { pos: [EX + 20, FY, 0], mat: 'acierHR' });
  mo.part('Arbre à cames', S.cyl(40, 560, 'x'), { pos: [EX, FY + 90, 0], mat: 'acierHR' });
  for (let i = 0; i < 4; i++) {
    const side = i % 2 ? 1 : -1, x = EX + (i < 2 ? 140 : -140) + side * 60;
    const z0 = side * 180;
    const cy = mo.group(`Cylindre n°${i + 1}`, { code: 'MOT' });
    cy.part('Fût de cylindre', S.cyl(150, 230, 'z'), { pos: [x, FY, z0 + side * 115], mat: 'acier', color: 0x3a3d42 });
    for (let f = 0; f < 7; f++) cy.part(`Ailette ${f + 1}`, S.tube(210, 150, 4, 'z'), { pos: [x, FY, z0 + side * (40 + f * 28)], mat: 'acier', color: 0x3a3d42 });
    cy.part('Culasse', S.box(200, 220, 140), { pos: [x, FY, z0 + side * 300], mat: 'aluminium' });
    cy.part('Cache-culbuteurs', S.box(180, 80, 60), { pos: [x, FY + 60, z0 + side * 390], mat: 'aluminium', color: 0x5a5f66 });
    cy.part('Piston', S.cyl(130, 90, 'z'), { pos: [x, FY, z0 + side * 150], mat: 'aluminium' });
    cy.part('Bielle', S.rod([x, FY, side * 40], [x, FY, z0 + side * 150], 30), { mat: 'acierHR' });
    cy.part('Bougie supérieure', S.cyl(18, 70, 'y'), { pos: [x, FY + 130, z0 + side * 300], mat: 'ceramique' });
    cy.part('Bougie inférieure', S.cyl(18, 70, 'y'), { pos: [x, FY - 130, z0 + side * 300], mat: 'ceramique' });
    cy.part('Tige de culbuteur (tube)', S.rod([x, FY - 50, side * 180], [x, FY - 50, z0 + side * 280], 22), { mat: 'acier' });
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      cy.part(`Écrou d'embase ${k + 1}`, S.nut(12, 'z'), { pos: [x + Math.cos(a) * 100, FY + Math.sin(a) * 100, z0 + side * 12], rot: axisRot('z', side), mat: 'acierHR', couple: 68 });
    }
    cy.part('Tubulure d\'échappement', S.pipe([[x, FY - 110, z0 + side * 300], [x, FY - 260, z0 + side * 280], [EX - 50, FY - 420, side * 160]], 45), { mat: 'inox' });
    cy.part('Pipe d\'admission', S.pipe([[x, FY + 110, z0 + side * 300], [x, FY + 60, side * 300], [EX, FY - 300, side * 60]], 40), { mat: 'aluminium' });
  }
  mo.part('Silencieux / réchauffeur cabine', S.cyl(160, 600, 'z'), { pos: [EX - 50, FY - 430, 0], mat: 'inox' });
  mo.part('Sortie d\'échappement', S.cyl(50, 200, 'y'), { pos: [EX - 50, FY - 560, 250], mat: 'inox' });
  mo.part('Injection / servo carburant', S.box(150, 120, 120), { pos: [EX - 120, FY - 330, 0], mat: 'aluminium' });
  for (const sd of SIDES) mo.part(`Magnéto ${sd.f}`, S.cyl(100, 160, 'x'), { pos: [EX - 380, FY + 60, sd.s * 90], mat: 'peinture', color: 0x222222 });
  mo.part('Alternateur 28 V', S.cyl(130, 160, 'x'), { pos: [EX + 220, FY - 170, 220], mat: 'aluminium' });
  mo.part('Démarreur', S.cyl(100, 220, 'x'), { pos: [EX + 220, FY - 170, -220], mat: 'peinture', color: 0x222222 });
  mo.part('Couronne de démarreur', S.tube(380, 330, 20, 'x'), { pos: [EX + 360, FY, 0], mat: 'acierHR' });
  mo.part('Radiateur d\'huile', S.box(80, 200, 200), { pos: [EX - 380, FY + 220, -220], mat: 'aluminium' });
  mo.part('Jauge à huile', S.cyl(20, 250, 'y'), { pos: [EX - 300, FY + 220, 150], mat: 'acier' });
  mo.part('Pompe à vide', S.cyl(90, 100, 'x'), { pos: [EX - 380, FY - 80, 0], mat: 'aluminium' });
  mo.part('Filtre à huile', S.cyl(90, 140, 'x'), { pos: [EX - 380, FY - 150, -150], mat: 'peinture', color: 0xd4a017 });
  const bm = gmp.group('Bâti moteur', { code: 'BAT', layer: 'struct' });
  for (const sd of SIDES) for (const y of [-1, 1]) {
    bm.part(`Tube de bâti ${y > 0 ? 'supérieur' : 'inférieur'} ${sd.m}`, S.rod([1470, FY + y * 450, sd.s * 450], [EX - 250, FY + y * 160, sd.s * 220], 25), { mat: 'acier', color: 0x2a5530 });
    bm.part(`Silent-bloc de bâti ${y > 0 ? 'sup.' : 'inf.'} ${sd.m}`, S.cyl(80, 60, 'x'), { pos: [EX - 260, FY + y * 160, sd.s * 220], mat: 'caoutchouc' });
    bm.part(`Boulon de bâti ${y > 0 ? 'sup.' : 'inf.'} ${sd.m} AN8`, S.bolt(12, 110, 'x'), { pos: [EX - 200, FY + y * 160, sd.s * 220], mat: 'acierHR', couple: 50 });
    bm.part(`Boulon de bâti sur cloison ${y > 0 ? 'sup.' : 'inf.'} ${sd.m}`, S.bolt(10, 50, 'x'), { pos: [1500, FY + y * 450, sd.s * 450], mat: 'acierHR', couple: 18 });
  }
  const cap = gmp.group('Capotage moteur', { code: 'CAP', layer: 'ext' });
  cap.part('Capot supérieur', S.lathe([[560, 1460], [560, 1800], [520, 2300], [430, 2700]], 40, 1.05, 1.02), { pos: [0, FY + 20, 0], scale: [1, 1, 1], mat: 'peintureAlu', color: WHITE });
  cap.part('Entrée d\'air gauche', S.ellipsoid(60, 160, 260), { pos: [2690, FY + 160, -230], mat: 'composite', color: 0x111111 });
  cap.part('Entrée d\'air droite', S.ellipsoid(60, 160, 260), { pos: [2690, FY + 160, 230], mat: 'composite', color: 0x111111 });
  for (let k = 0; k < 12; k++) cap.part(`Fixation quart de tour ${k + 1}`, S.cyl(14, 6, 'z'), { pos: [1600 + k * 90, FY + 180, k % 2 ? 588 : -588], mat: 'inox', type: 'vis' });
  const he = gmp.group('Hélice bipale à pas fixe Ø1 930', { code: 'HEL' });
  const PX = 2840;
  he.part('Cône d\'hélice', S.lathe([[200, 0], [195, 80], [160, 200], [90, 320], [0, 400]], 36), { pos: [PX, FY + 20, 0], mat: 'peintureAlu', color: WHITE });
  he.part('Cloison arrière de cône', S.cyl(400, 6, 'x'), { pos: [PX, FY + 20, 0], mat: 'aluminium' });
  he.part('Moyeu d\'hélice', S.cyl(180, 120, 'x'), { pos: [PX + 40, FY + 20, 0], mat: 'aluminium' });
  for (const k of [1, -1]) {
    const secs = [];
    for (let i = 0; i <= 6; i++) {
      const r = 120 + (965 - 120) * (i / 6);
      secs.push({ x: PX + 50, y: FY + 20 + k * r, z: 0, chord: 180 - 70 * (i / 6) ** 2, twist: (k > 0 ? 1 : -1) * (65 - 47 * (i / 6)), tScale: 1.4 - i * 0.15 });
    }
    he.part(`Pale ${k > 0 ? 'A (haute)' : 'B (basse)'}`, S.loft(secs, airfoil(0.12, 0.03), 'y'), { mat: 'aluminium', desc: 'Alliage 2025-T6 forgé – calage 18° à 75 % du rayon' });
  }
  boltCircle(he, { n: 6, pcd: 120, d: 10, L: 140, axis: 'x', at: [PX + 110, FY + 20, 0], dir: 1, label: 'Boulon d\'hélice', kind: 'bolt', couple: '75 N·m (freinage fil)' });

  // ------------------------------------------------------------------ Atterrisseurs
  const tr = av.group('Atterrisseurs', { code: 'ATT', layer: 'sol' });
  for (const sd of SIDES) {
    const tp = tr.group(`Train principal ${sd.m}`, { code: 'ATT' });
    tp.part('Lame de train en acier à ressort', S.rod([-150, 720, sd.s * 250], [-300, 230, sd.s * 1180], 70), { mat: 'acierHR', color: WHITE, desc: 'Lame d\'acier 6150 – voie 2 300 mm' });
    tp.part('Ferrure d\'ancrage de lame', S.box(200, 120, 120), { pos: [-150, 740, sd.s * 250], mat: 'acierHR' });
    for (const k of [1, 2]) tp.part(`Boulon d'ancrage ${k}`, S.bolt(12, 90, 'y'), { pos: [-150 + (k === 1 ? -60 : 60), 810, sd.s * 250], mat: 'acierHR', couple: 30 });
    tp.part('Fusée de roue', S.cyl(35, 180, 'z'), { pos: [-300, 190, sd.s * 1180], mat: 'acierHR' });
    wheel(tp, `Roue principale ${sd.f}`, sd.s, { pos: [-300, 190, sd.s * 1230], D: 380, W: 152, rimD: 152, tireRef: '6.00-6 – 6 plis', studs: 6, pcd: 90, stud: 8, studL: 70, studLabel: 'Boulon de jante', couple: 17, disc: [250, 9], caliperAngle: 180, code: 'ROU', hubD: 90, hubL: 80, spokes: 3, spokeW: 40, rimMat: 'aluminium', cap: false });
    tp.part('Carénage de roue', S.ellipsoid(900, 420, 260), { pos: [-260, 230, sd.s * 1230], mat: 'composite', color: WHITE });
    tp.part('Durite de frein', S.pipe([[-150, 700, sd.s * 260], [-280, 260, sd.s * 1150], [-300, 190, sd.s * 1180]], 7), { mat: 'caoutchouc' });
  }
  const ta = tr.group('Train avant orientable', { code: 'ATT' });
  ta.part('Jambe oléopneumatique – cylindre', S.rod([1700, 950, 0], [1950, 450, 0], 70), { mat: 'aluminium' });
  ta.part('Jambe oléopneumatique – piston', S.rod([1950, 450, 0], [2050, 280, 0], 50), { mat: 'chrome' });
  ta.part('Compas (bras anti-rotation)', S.box(160, 40, 20), { pos: [1980, 380, 60], rot: [0, 0, 60], mat: 'acier' });
  ta.part('Fourche de roue avant', S.box(260, 60, 200), { pos: [2070, 250, 0], mat: 'acier' });
  ta.part('Amortisseur de shimmy', S.cyl(40, 220, 'x'), { pos: [1850, 600, 80], mat: 'acier' });
  ta.part('Tige de conjugaison palonnier', S.rod([1500, 750, 150], [1820, 640, 60], 15), { mat: 'acier' });
  wheel(ta, 'Roue avant', 1, { pos: [2120, 175, 0], D: 350, W: 127, rimD: 127, tireRef: '5.00-5 – 4 plis', studs: 6, pcd: 80, stud: 8, studL: 60, studLabel: 'Boulon de jante', couple: 17, code: 'ROU', hubD: 70, hubL: 70, spokes: 3, spokeW: 30, rimMat: 'aluminium', cap: false });
  ta.part('Carénage de roue avant', S.ellipsoid(700, 380, 170), { pos: [2120, 200, 0], mat: 'composite', color: WHITE });
  ta.part('Axe de roue avant', S.cyl(20, 180, 'z'), { pos: [2120, 175, 0], mat: 'acierHR' });

  // ------------------------------------------------------------------ Cabine
  const ck = av.group('Cabine & commandes de vol', { code: 'CKP', layer: 'int' });
  const pb = ck.group('Tableau de bord', { code: 'PDB' });
  pb.part('Planche de bord', S.box(40, 420, 1080), { pos: [1080, 1450, 0], rot: [0, 0, -5], mat: 'abs', color: 0x2c2e33 });
  pb.part('Auvent de tableau de bord', S.box(250, 20, 1080), { pos: [1000, 1670, 0], mat: 'abs', color: 0x1a1b1e });
  const six = ['Anémomètre (badin)', 'Horizon artificiel', 'Altimètre', 'Indicateur de virage', 'Conservateur de cap', 'Variomètre'];
  six.forEach((nom, i) => {
    pb.part(nom, S.cyl(82, 120, 'x'), { pos: [1030, 1560 - Math.floor(i / 3) * 120, -480 + (i % 3) * 110], mat: 'ecran', desc: 'Instrument 3 1/8" (82,5 mm)' });
  });
  pb.part('Écran multifonction (MFD)', S.box(30, 180, 260), { pos: [1050, 1500, 150], mat: 'ecran' });
  pb.part('Boîtier radio COM/NAV', S.box(200, 60, 160), { pos: [1000, 1420, 0], mat: 'abs', color: 0x111111 });
  pb.part('Transpondeur', S.box(200, 40, 160), { pos: [1000, 1360, 0], mat: 'abs', color: 0x111111 });
  pb.part('Compas magnétique', S.sphere(70), { pos: [1150, 1900, 0], mat: 'abs' });
  pb.part('Manette des gaz', S.rod([1050, 1350, -40], [930, 1350, -40], 10), { mat: 'chrome' });
  pb.part('Commande de richesse', S.rod([1050, 1320, 40], [960, 1320, 40], 8), { mat: 'abs', color: 0xc0262d });
  pb.part('Robinet sélecteur carburant', S.cyl(70, 20, 'y'), { pos: [700, 800, 0], mat: 'aluminium' });
  for (const sd of SIDES) {
    const z = sd.s * 280;
    const cm = ck.group(`Commandes de vol place ${sd.s < 0 ? 'gauche (CdB)' : 'droite'}`, { code: 'CDV' });
    cm.part('Tube de manche', S.cyl(30, 450, 'x'), { pos: [890, 1380, z], mat: 'chrome' });
    cm.part('Volant de manche', S.box(40, 120, 300), { pos: [660, 1380, z], mat: 'abs', color: 0x1a1b1e });
    cm.part('Bouton d\'alternat radio', S.cyl(12, 10, 'x'), { pos: [640, 1440, z - sd.s * 120], mat: 'abs', color: 0xc0262d });
    for (const p of [-1, 1]) {
      cm.part(`Palonnier ${p < 0 ? 'gauche' : 'droit'}`, S.box(30, 160, 90), { pos: [1150, 920, z + p * 100], rot: [0, 0, 20], mat: 'aluminium' });
      cm.part(`Tube de palonnier ${p < 0 ? 'gauche' : 'droit'}`, S.rod([1150, 920, z + p * 100], [1200, 800, z + p * 100], 18), { mat: 'acier' });
    }
    const st = ck.group(`Siège avant ${sd.m}`, { code: 'SIE' });
    st.part('Assise', S.box(480, 100, 450), { pos: [180, 900, z], mat: 'cuir', color: 0x3c2e25 });
    st.part('Dossier', S.box(100, 600, 450), { pos: [-80, 1210, z], rot: [0, 0, -12], mat: 'cuir', color: 0x3c2e25 });
    st.part('Rail de siège', S.box(500, 25, 30), { pos: [180, 830, z], mat: 'acier' });
    st.part('Harnais 4 points (sangle)', S.box(20, 500, 60), { pos: [-20, 1200, z], rot: [0, 0, -12], mat: 'tissu', color: 0x222222 });
  }
  const sb = ck.group('Banquette arrière', { code: 'SIE' });
  sb.part('Assise arrière', S.box(480, 100, 1000), { pos: [-750, 920, 0], mat: 'cuir', color: 0x3c2e25 });
  sb.part('Dossier arrière', S.box(100, 580, 1000), { pos: [-1000, 1230, 0], rot: [0, 0, -12], mat: 'cuir', color: 0x3c2e25 });
  ck.part('Batterie 24 V', S.box(250, 200, 170), { pos: [1300, 1500, 300], mat: 'electrolyte' });
  ck.part('Compartiment bagages (plancher)', S.box(900, 10, 900), { pos: [-1700, 800, 0], mat: 'alu2024' });
  return av;
}
