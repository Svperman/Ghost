// Matériel ferroviaire – générateur paramétrique (cotes en mm)
// Repère : X avant, Y haut (0 = plan de roulement, dessus du rail), Z droite. Voie normale 1 435 mm.
import * as THREE from 'three';
import { Assembly, S, SIDES, boltCircle, axisRot } from '../core/builder.js';
import { inlineEngine } from '../core/parts.js';

const GAUGE = 1435;
const DARK = 0x24262a;

export const TRAIN_TYPES = {
  locomotive: {
    label: 'Locomotive électrique BB', desc: 'Locomotive électrique à 2 bogies de 2 essieux moteurs (BB) – 25 kV 50 Hz / 1,5 kV continu – 6 400 kW – 90 t – 200 km/h',
    L: 19500, W: 3000, H: 4300, bogieC: 10000, axleB: 2900, wheel: 1250, floor: 1300, color: 0xc4262e, loco: true,
    makers: ['Alstom (Prima / Traxx)', 'Siemens Mobility (Vectron)', 'Bombardier – Alstom (Traxx)', 'Stadler (Euro 9000)', 'CAF (Bitrac)', 'Škoda (Emil Zátopek)'],
  },
  voiture: {
    label: 'Voiture voyageurs grandes lignes', desc: 'Voiture à couloir central 26,4 m – 2e classe – 80 places – bogies à suspension pneumatique – 200 km/h',
    L: 26400, W: 2820, H: 4050, bogieC: 19000, axleB: 2500, wheel: 920, floor: 1250, color: 0x3a5a8c, coach: true,
    makers: ['Alstom (Corail / Avelia)', 'Siemens Mobility (Viaggio)', 'CAF', 'Stadler', 'Talgo', 'Škoda'],
  },
  citerne: {
    label: 'Wagon-citerne', desc: 'Wagon-citerne à bogies pour produits pétroliers – 95 m³ – 90 t – soupape et dôme de chargement',
    L: 17000, W: 3000, H: 4200, bogieC: 11500, axleB: 1800, wheel: 920, floor: 1100, color: 0x2b2e33, tank: true,
    makers: ['VTG (exploitant)', 'GATX Rail', 'Ermewa', 'Greenbrier Europe', 'Tatravagónka', 'Wascosa'],
  },
  tram: {
    label: 'Tramway à plancher bas', desc: 'Rame de tramway 5 modules à plancher bas intégral – 32 m – 750 V continu par ligne aérienne – 200 voyageurs – 70 km/h',
    L: 32000, W: 2400, H: 3500, wheel: 600, floor: 350, color: 0xe0e0e0, tramModules: 5,
    makers: ['Alstom (Citadis)', 'Siemens Mobility (Avenio)', 'CAF (Urbos)', 'Stadler (Tramlink)', 'Škoda (ForCity)', 'Hyundai Rotem'],
  },
};

/** Profil de roue ferroviaire (bandage + boudin) pour révolution autour de Z */
function railWheel(D) {
  const R = D / 2;
  const pts = [[60, -70], [R - 70, -70], [R - 60, -50], [R + 28, -45], [R + 30, -35], [R + 10, -25], [R, -15], [R - 5, 60], [R - 70, 65], [80, 65], [60, 40], [60, -70]];
  return S.revolve(pts.map(([r, h]) => [r, h]), 'z', 64);
}

/** Bogie à 2 essieux (ou essieu simple pour tram) */
function bogie(asm, name, x, P, { motor = false, air = false, ax = P.axleB } = {}) {
  const D = P.wheel, R = D / 2;
  const g = asm.group(name, { pos: [x, 0, 0], code: 'BOG' });
  const fy = R + 120;
  g.part('Châssis de bogie (longerons + traverse)', S.box(ax + 900, 260, 2100), { pos: [0, fy + 60, 0], mat: 'acier', color: DARK, desc: 'Châssis soudé en H – acier S355' });
  g.part('Traverse danseuse', S.box(500, 250, 2400), { pos: [0, fy + 320, 0], mat: 'acier', color: DARK });
  g.part('Pivot de bogie / crapaudine', S.cyl(300, 120, 'y'), { pos: [0, fy + 500, 0], mat: 'acierHR' });
  for (const sd of SIDES) {
    if (air) g.part(`Suspension secondaire pneumatique ${sd.m}`, S.cyl(620, 280, 'y'), { pos: [0, fy + 460, sd.s * 1000], mat: 'caoutchouc', desc: 'Coussin pneumatique à diaphragme' });
    else g.part(`Suspension secondaire (ressorts Flexicoil) ${sd.m}`, S.spring(300, 45, 360, 5), { pos: [0, fy + 380, sd.s * 1000], mat: 'acierHR', color: 0x2a6f2a });
    g.part(`Amortisseur secondaire vertical ${sd.m}`, S.rod([200, fy + 150, sd.s * 1150], [250, fy + 550, sd.s * 1150], 70), { mat: 'peinture', color: 0x111111 });
    g.part(`Amortisseur anti-lacet ${sd.m}`, S.rod([ax / 2 + 300, fy + 200, sd.s * 1200], [ax / 2 + 900, fy + 350, sd.s * 1250], 80), { mat: 'peinture', color: 0x111111 });
  }
  for (const [k, ex] of [[1, ax / 2], [2, -ax / 2]]) {
    const es = g.group(`Essieu monté ${k}`, { code: 'ESS', pos: [ex, R, 0] });
    es.part('Corps d\'essieu', S.cyl(180, GAUGE + 600, 'z'), { mat: 'acierHR', desc: 'Acier EA1N – fusées Ø 130 mm' });
    for (const sd of SIDES) {
      const w = railWheel(D);
      w.dims = { 'Diamètre de roulement (neuf)': D, 'Diamètre mini (usé)': D - 80, 'Largeur de jante': 135, 'Hauteur de boudin': 28, Écartement: GAUGE };
      es.part(`Roue monobloc ${sd.f}`, w, { pos: [0, 0, sd.s * (GAUGE / 2 + 35)], rot: sd.s < 0 ? [0, 180, 0] : [0, 0, 0], mat: 'acierHR', desc: 'Roue monobloc ER7 – profil S1002' });
      es.part(`Boîte d'essieu ${sd.f}`, S.box(380, 300, 260), { pos: [0, 0, sd.s * (GAUGE / 2 + 330)], mat: 'fonte', color: DARK, desc: 'Roulements à rouleaux coniques en cartouche' });
      es.part(`Couvercle de boîte d'essieu ${sd.f}`, S.cyl(240, 40, 'z'), { pos: [0, 0, sd.s * (GAUGE / 2 + 480)], mat: 'fonte', color: DARK });
      boltCircle(es, { n: 6, pcd: 190, d: 16, L: 40, axis: 'z', at: [0, 0, sd.s * (GAUGE / 2 + 500)], dir: sd.s, label: `Vis de couvercle ${sd.c}`, couple: 200 });
      es.part(`Suspension primaire ${sd.f}`, S.spring(220, 35, 260, 5), { pos: [0, 300, sd.s * (GAUGE / 2 + 330)], mat: 'acierHR', color: 0x2a6f2a });
      if (!motor) es.part(`Disque de frein ${sd.f}`, S.tube(640, 300, 110, 'z', 48), { pos: [0, 0, sd.s * 350], mat: 'fonte', desc: 'Disque ventilé Ø 640 mm calé sur l\'essieu' });
      else es.part(`Semelle de frein ${sd.f}`, S.box(320, 80, 100), { pos: [R * 0.85, 60, sd.s * (GAUGE / 2 + 35)], rot: [0, 0, 80], mat: 'feutre', desc: 'Semelle composite' });
    }
    if (motor) {
      es.part('Moteur de traction asynchrone triphasé', S.cyl(700, 1000, 'z'), { pos: [-(ax / 2) * 0.45 * (k === 1 ? 1 : -1), 200, 0], mat: 'peinture', color: DARK, desc: '1 600 kW – suspendu par le nez' });
      es.part('Réducteur de transmission', S.box(500, 700, 250), { pos: [-(ax / 2) * 0.2 * (k === 1 ? 1 : -1), 0, -GAUGE / 2 + 200], mat: 'fonte', color: DARK });
    } else if (!P.tank) for (const sd of SIDES) es.part(`Étrier de frein à disque ${sd.f}`, S.box(250, 200, 160), { pos: [-260 * (k === 1 ? 1 : -1), 0, sd.s * 350], mat: 'fonte', color: DARK, layer: 'meca' });
  }
  return g;
}

/** Attelage & tampons d'extrémité (UIC) */
function couplerEnd(asm, x, dir, y) {
  const g = asm.group(`Organes de choc et traction ${dir > 0 ? 'avant' : 'arrière'}`, { code: 'ATT' });
  for (const sd of SIDES) {
    g.part(`Tampon ${sd.m}`, S.cyl(450, 70, 'x'), { pos: [x + dir * 620, y, sd.s * 875], mat: 'acier', desc: 'Plateau de tampon Ø 450 mm – course 105 mm' });
    g.part(`Fourreau de tampon ${sd.m}`, S.cyl(220, 550, 'x'), { pos: [x + dir * 310, y, sd.s * 875], mat: 'acier', color: DARK });
    for (let k = 0; k < 4; k++) g.part(`Vis de tampon ${sd.c}${k + 1}`, S.bolt(20, 60, 'x'), { pos: [x + dir * 40, y + (k < 2 ? -130 : 130), sd.s * 875 + (k % 2 ? -130 : 130)], rot: axisRot('x', dir), mat: 'acierHR', couple: 400 });
  }
  g.part('Crochet de traction', S.box(350, 120, 80), { pos: [x + dir * 320, y, 0], mat: 'acierHR' });
  g.part('Tendeur d\'attelage à vis', S.cyl(60, 500, 'x'), { pos: [x + dir * 520, y - 60, 0], mat: 'acierHR' });
  g.part('Étrier d\'attelage', S.torus(250, 40, 'y'), { pos: [x + dir * 760, y - 60, 0], scale: [1.4, 1, 0.6], mat: 'acierHR' });
  for (const sd of SIDES) g.part(`Boyau de frein (conduite générale) ${sd.m}`, S.pipe([[x, y - 250, sd.s * 300], [x + dir * 300, y - 400, sd.s * 320], [x + dir * 500, y - 300, sd.s * 330]], 40), { mat: 'caoutchouc' });
  return g;
}

export function buildTrain(type = 'locomotive') {
  const P = TRAIN_TYPES[type] || TRAIN_TYPES.locomotive;
  if (P.tramModules) return buildTram(P);
  const { L, W, H, floor } = P;
  const hw = W / 2, xF = L / 2, xR = -L / 2;
  const t = new Assembly(P.label, { prefix: 'FR', code: 'GEN', layer: 'meca', desc: `${P.desc} – longueur hors tampons ${L} mm – écartement ${GAUGE} mm` });

  // ------------------------------------------------------------------ Châssis
  const ch = t.group('Châssis de caisse', { code: 'CHS', layer: 'struct' });
  const bufY = 1060;
  for (const sd of SIDES) ch.part(`Longeron ${sd.m}`, S.box(L - 400, 350, 200), { pos: [0, floor - 200, sd.s * (hw - 200)], mat: 'acier', color: DARK, desc: 'Profilé UPN 350 / caisson soudé' });
  ch.part('Longrine centrale', S.box(L - 400, 300, 300), { pos: [0, floor - 200, 0], mat: 'acier', color: DARK });
  for (const x of [xF - 200, xR + 200]) ch.part(`Traverse de tête ${x > 0 ? 'avant' : 'arrière'}`, S.box(400, 450, W - 100), { pos: [x, bufY, 0], mat: 'acier', color: DARK });
  for (const x of [P.bogieC / 2, -P.bogieC / 2]) ch.part(`Traverse pivot ${x > 0 ? 'avant' : 'arrière'}`, S.box(600, 350, W - 200), { pos: [x, floor - 220, 0], mat: 'acier', color: DARK });
  const nC = Math.round(L / 2000);
  for (let i = 1; i < nC; i++) ch.part(`Traverse intermédiaire ${i}`, S.box(150, 250, W - 300), { pos: [xR + i * L / nC, floor - 180, 0], mat: 'acier', color: DARK });
  if (!P.tank) ch.part('Plancher', S.box(L - 400, 40, W - 80), { pos: [0, floor, 0], mat: P.coach ? 'bois' : 'acier', color: P.coach ? undefined : DARK });

  // ------------------------------------------------------------------ Bogies
  const tr = t.group('Bogies', { code: 'BOG', layer: 'sol' });
  bogie(tr, 'Bogie avant', P.bogieC / 2, P, { motor: !!P.loco, air: !!P.coach });
  bogie(tr, 'Bogie arrière', -P.bogieC / 2, P, { motor: !!P.loco, air: !!P.coach });
  const att = t.group('Attelages', { code: 'ATT', layer: 'struct' });
  couplerEnd(att, xF - 640, 1, bufY);
  couplerEnd(att, xR + 640, -1, bufY);

  if (P.tank) {
    // ---------------------------------------------------------------- Citerne
    const ci = t.group('Citerne', { code: 'CIT', layer: 'ext' });
    const cD = 2900, cL = L - 2400, cy = floor + cD / 2 + 50;
    ci.part('Virole de citerne', S.cyl(cD, cL, 'x', 64), { pos: [0, cy, 0], mat: 'peinture', color: P.color, desc: 'Acier P355NL1 – épaisseur 7 mm – 95 m³ – pression d\'épreuve 4 bar' });
    for (const s of [1, -1]) ci.part(`Fond bombé ${s > 0 ? 'avant' : 'arrière'}`, S.sphere(cD), { pos: [s * cL / 2, cy, 0], scale: [0.25, 1, 1], mat: 'peinture', color: P.color });
    ci.part('Dôme de chargement', S.cyl(700, 300, 'y'), { pos: [0, cy + cD / 2 + 100, 0], mat: 'peinture', color: P.color });
    ci.part('Trou d\'homme (couvercle)', S.cyl(600, 60, 'y'), { pos: [0, cy + cD / 2 + 280, 0], mat: 'acier' });
    boltCircle(ci, { n: 12, pcd: 540, d: 20, L: 60, axis: 'y', at: [0, cy + cD / 2 + 320, 0], dir: 1, label: 'Boulon de trou d\'homme', couple: 250 });
    ci.part('Soupape de sécurité', S.cyl(120, 250, 'y'), { pos: [500, cy + cD / 2 + 50, 0], mat: 'laiton' });
    ci.part('Passerelle supérieure', S.box(2400, 30, 700), { pos: [0, cy + cD / 2 + 50, 0], mat: 'acier', color: 0xf2c200 });
    for (const sd of SIDES) {
      ci.part(`Échelle d'accès ${sd.m}`, S.box(80, cD, 450), { pos: [0, cy, sd.s * (cD / 2 + 80)], mat: 'acier', color: 0xf2c200 });
      ci.part(`Vanne de vidange par le bas ${sd.m}`, S.cyl(150, 300, 'z'), { pos: [0, floor - 100, sd.s * 600], mat: 'fonte' });
      ci.part(`Bande orange de signalisation ${sd.m}`, S.box(cL, 300, 10), { pos: [0, cy, sd.s * (cD / 2 + 5)], mat: 'peinture', color: 0xf07d00 });
      ci.part(`Plaque-étiquette de danger ${sd.m}`, S.box(400, 300, 10), { pos: [-cL / 2 + 800, cy - 300, sd.s * (cD / 2 + 15)], mat: 'peinture', color: 0xf07d00 });
    }
    for (const x of [-cL / 2 + 1000, cL / 2 - 1000, -cL / 6, cL / 6]) ci.part(`Berceau de citerne ${Math.round(x)}`, S.box(300, 400, W - 300), { pos: [x, floor + 100, 0], mat: 'acier', color: DARK, layer: 'struct' });
    const fr = t.group('Frein pneumatique UIC', { code: 'FRE', layer: 'meca' });
    fr.part('Cylindre de frein', S.cyl(300, 400, 'x'), { pos: [0, floor - 450, 600], mat: 'fonte', color: DARK });
    fr.part('Réservoir auxiliaire', S.cyl(400, 1200, 'x'), { pos: [1500, floor - 450, -600], mat: 'acier', color: DARK });
    fr.part('Distributeur de frein', S.box(300, 250, 250), { pos: [-1200, floor - 450, -600], mat: 'fonte', color: DARK });
    fr.part('Timonerie de frein', S.box(P.bogieC, 40, 60), { pos: [0, floor - 400, 0], mat: 'acier' });
    fr.part('Conduite générale', S.cyl(40, L - 1200, 'x'), { pos: [0, floor - 380, 300], mat: 'acier' });
    fr.part('Volant de frein à main', S.torus(450, 25, 'x'), { pos: [xR + 800, floor + 700, hw - 200], mat: 'acier', color: 0xf2c200 });
    return t;
  }

  // ------------------------------------------------------------------ Caisse
  const ca = t.group('Caisse', { code: 'CAI', layer: 'ext' });
  const roofY = H - 300;
  const pr = [[0, floor - 150], [0, roofY - 200], [80, roofY + 40], [hw - 150, roofY + 120], [hw, roofY + 150]];
  void pr;
  const belt = floor + (P.coach ? 800 : 900), winTop = floor + (P.coach ? 1800 : 1950);
  if (P.loco) for (const sd of SIDES) ca.part(`Paroi latérale ${sd.m}`, S.box(L - 3200, roofY - floor + 300, 6), { pos: [0, (roofY + floor - 300) / 2, sd.s * (hw - 3)], mat: 'peinture', color: P.color, desc: 'Caisse autoporteuse en acier – panneaux démontables pour accès aux équipements' });
  else for (const sd of SIDES) {
    ca.part(`Paroi latérale ${sd.m} (sous baie)`, S.box(L - (P.loco ? 3200 : 800), belt - floor + 300, 6), { pos: [0, (belt + floor - 300) / 2, sd.s * (hw - 3)], mat: 'peinture', color: P.color, desc: 'Tôle acier inox / aluminium extrudé' });
    ca.part(`Bandeau de baie ${sd.m}`, S.box(L - (P.loco ? 3200 : 800), roofY - winTop, 6), { pos: [0, (roofY + winTop) / 2, sd.s * (hw - 3)], mat: 'peinture', color: P.loco ? P.color : 0xe8e8e8 });
  }
  ca.part('Toiture', S.box(L - (P.loco ? 3200 : 800), 120, W - 120), { pos: [0, roofY + 60, 0], mat: 'peinture', color: 0x8a8d92 });
  const vit = ca.group('Vitrage', { code: 'VIT' });
  if (P.coach) {
    const nW = 10;
    for (const sd of SIDES) for (let i = 0; i < nW; i++) {
      const x = xR + 2800 + i * (L - 5600) / (nW - 1);
      vit.part(`Baie voyageurs ${sd.c}${i + 1}`, S.box(1500, winTop - belt, 10), { pos: [x, (winTop + belt) / 2, sd.s * (hw - 1)], mat: 'verre', desc: 'Double vitrage feuilleté' });
      vit.part(`Trumeau ${sd.c}${i + 1}`, S.box(300, winTop - belt, 6), { pos: [x + 900, (winTop + belt) / 2, sd.s * (hw - 3)], mat: 'peinture', color: P.color });
    }
    for (const sd of SIDES) for (const x of [xR + 1200, xF - 1200]) {
      const dg = ca.group(`Porte d'accès ${sd.c}${x > 0 ? 'AV' : 'AR'}`, { code: 'POR' });
      dg.part('Vantail louvoyant-coulissant', S.box(900, winTop - floor + 200, 30), { pos: [x, (winTop + floor + 200) / 2, sd.s * (hw + 5)], mat: 'peinture', color: P.color });
      dg.part('Vitre de porte', S.box(500, 800, 10), { pos: [x, winTop - 300, sd.s * (hw + 22)], mat: 'verre' });
      dg.part('Marchepied rétractable', S.box(800, 30, 300), { pos: [x, floor - 400, sd.s * (hw + 100)], mat: 'aluminium', layer: 'meca' });
      dg.part('Bouton d\'ouverture', S.cyl(60, 15, 'z'), { pos: [x + 550, floor + 1100, sd.s * (hw + 10)], mat: 'feuVert' });
    }
    for (const x of [xF - 200, xR + 200]) {
      ca.part(`Face d'extrémité ${x > 0 ? 'avant' : 'arrière'}`, S.box(30, roofY - floor + 300, W - 50), { pos: [x, (roofY + floor - 300) / 2, 0], mat: 'peinture', color: P.color });
      ca.part(`Soufflet d'intercirculation ${x > 0 ? 'avant' : 'arrière'}`, S.box(400, 2100, 1300), { pos: [x + Math.sign(x) * 200, floor + 1050, 0], mat: 'caoutchouc', color: 0x111111 });
      for (const sd of SIDES) ca.part(`Feu de queue ${sd.c}${x > 0 ? 'AV' : 'AR'}`, S.box(30, 150, 150), { pos: [x + Math.sign(x) * 25, floor + 300, sd.s * (hw - 250)], mat: 'feuRouge' });
    }
    const amg = t.group('Aménagement voyageurs', { code: 'AMG', layer: 'int' });
    const nR = 20;
    let n = 0;
    for (let r = 0; r < nR; r++) {
      const x = xR + 2700 + r * (L - 5400) / (nR - 1);
      for (const sd of SIDES) for (const k of [0, 1]) {
        n++;
        const s = amg.group(`Siège ${String(n).padStart(2, '0')}`, { pos: [x, floor, sd.s * (hw - 380 - k * 500)], code: 'SIE' });
        s.part('Assise', S.box(460, 110, 460), { pos: [0, 460, 0], mat: 'tissu', color: 0x2a3b5c });
        s.part('Dossier inclinable', S.box(90, 700, 460), { pos: [-230, 850, 0], rot: [0, 0, -10], mat: 'tissu', color: 0x2a3b5c });
        s.part('Tablette', S.box(20, 250, 350), { pos: [-290, 800, 0], rot: [0, 0, -10], mat: 'abs' });
        s.part('Piètement', S.box(80, 400, 380), { pos: [0, 200, 0], mat: 'acier' });
        s.part('Vis de fixation au rail', S.capScrew(10, 30), { pos: [0, 10, 0], mat: 'acierHR', couple: 45 });
      }
    }
    for (const sd of SIDES) amg.part(`Porte-bagages ${sd.m}`, S.box(L - 5200, 40, 450), { pos: [0, winTop + 200, sd.s * (hw - 300)], mat: 'aluminium' });
    amg.part('Cabinet de toilette (circuit fermé)', S.box(1500, roofY - floor - 100, 1300), { pos: [xF - 1800, (roofY + floor) / 2, -600], mat: 'composite', color: 0xe8e4da });
    amg.part('Plateforme d\'accès avant', S.box(2000, 30, W - 150), { pos: [xF - 1200, floor + 30, 0], mat: 'acier' });
    amg.part('Plateforme d\'accès arrière', S.box(2000, 30, W - 150), { pos: [xR + 1200, floor + 30, 0], mat: 'acier' });
    const eq = t.group('Équipements sous caisse & toiture', { code: 'EQP', layer: 'meca' });
    eq.part('Groupe de climatisation de toiture (avant)', S.box(2500, 400, 1800), { pos: [xF - 4500, roofY + 320, 0], mat: 'aluminium' });
    eq.part('Groupe de climatisation de toiture (arrière)', S.box(2500, 400, 1800), { pos: [xR + 4500, roofY + 320, 0], mat: 'aluminium' });
    eq.part('Convertisseur statique 3 kV / 400 V', S.box(2500, 600, 1200), { pos: [0, floor - 650, 0], mat: 'aluminium' });
    eq.part('Batteries Ni-Cd 72 V', S.box(1500, 500, 800), { pos: [-3500, floor - 600, 600], mat: 'electrolyte' });
    eq.part('Réservoir d\'eau', S.cyl(600, 1800, 'x'), { pos: [3500, floor - 600, -600], mat: 'inox' });
    eq.part('Réservoir auxiliaire de frein', S.cyl(400, 1200, 'x'), { pos: [3500, floor - 600, 600], mat: 'acier', color: DARK });
    eq.part('Conduite générale de frein', S.cyl(40, L - 1200, 'x'), { pos: [0, floor - 380, 300], mat: 'acier' });
    return t;
  }

  // Locomotive : cabines aux deux extrémités
  for (const s of [1, -1]) {
    const cg = ca.group(`Cabine de conduite ${s > 0 ? 'n°1 (avant)' : 'n°2 (arrière)'}`, { code: 'CAB' });
    const cx = s * (L / 2 - 800);
    cg.part('Nez de cabine (structure anti-collision)', S.extrude([[0, floor - 300], [0, roofY + 100], [-1600, roofY + 100], [-1600, floor - 300]], W - 20, 60), { pos: [s > 0 ? xF - 50 : xR + 50, 0, 0], rot: [0, s > 0 ? 0 : 180, 0], mat: 'peinture', color: P.color });
    cg.part('Pare-brise', S.box(12, 1000, W - 400), { pos: [cx + s * 700, floor + 1700, 0], rot: [0, 0, -s * 12], mat: 'verre', desc: 'Pare-brise feuilleté chauffant – résistance aux projectiles' });
    for (const sd of SIDES) {
      cg.part(`Phare ${sd.m}`, S.box(30, 220, 300), { pos: [s > 0 ? xF - 40 : xR + 40, floor + 400, sd.s * (hw - 400)], mat: 'feuBlanc' });
      cg.part(`Feu de signalisation rouge ${sd.m}`, S.box(30, 150, 150), { pos: [s > 0 ? xF - 40 : xR + 40, floor + 650, sd.s * (hw - 400)], mat: 'feuRouge' });
      cg.part(`Porte d'accès cabine ${sd.m}`, S.box(800, 2000, 30), { pos: [cx - s * 400, floor + 1000, sd.s * (hw + 5)], mat: 'peinture', color: P.color });
      cg.part(`Main montoire ${sd.m}`, S.cyl(32, 1200, 'y'), { pos: [cx - s * 900, floor + 200, sd.s * (hw + 60)], mat: 'inox' });
    }
    cg.part('Feu de tête central', S.box(30, 220, 300), { pos: [s > 0 ? xF - 40 : xR + 40, roofY - 150, 0], mat: 'feuBlanc' });
    cg.part('Chasse-obstacles', S.box(150, 600, W - 300), { pos: [s > 0 ? xF + 100 : xR - 100, 400, 0], rot: [0, 0, s * 15], mat: 'acier', color: 0xf2c200, layer: 'struct' });
    const pc = t.group(`Pupitre de conduite ${s > 0 ? 'n°1' : 'n°2'}`, { code: 'PDC', layer: 'int' });
    pc.part('Pupitre', S.box(800, 900, W - 600), { pos: [cx + s * 250, floor + 450, 0], mat: 'abs', color: 0x3a3d42 });
    pc.part('Écrans de conduite (DMI ETCS)', S.box(30, 300, 900), { pos: [cx + s * 50, floor + 1100, -200], rot: [0, 0, s * 25], mat: 'ecran' });
    pc.part('Manipulateur traction / freinage', S.cyl(40, 200, 'y'), { pos: [cx - s * 50, floor + 1000, 600], mat: 'abs' });
    pc.part('Siège du conducteur', S.box(500, 500, 500), { pos: [cx - s * 400, floor + 500, -500], mat: 'tissu', color: 0x111111 });
    pc.part('Veille automatique (pédale VACMA)', S.box(250, 50, 300), { pos: [cx + s * 100, floor + 60, -500], mat: 'acier' });
  }
  for (const sd of SIDES) {
    for (let i = 0; i < 4; i++) ca.part(`Grille de ventilation ${sd.c}${i + 1}`, S.box(1500, 800, 10), { pos: [-4500 + i * 3000, floor + 1700, sd.s * (hw + 2)], mat: 'aluminium', color: 0x555555 });
  }
  const eq = t.group('Équipements électriques & toiture', { code: 'ELE', layer: 'meca' });
  for (const s of [1, -1]) {
    const pa = eq.group(`Pantographe ${s > 0 ? '25 kV' : '1,5 kV'}`, { code: 'PAN', pos: [s * 4500, roofY + 150, 0] });
    pa.part('Socle et isolateurs', S.box(1400, 300, 1200), { pos: [0, 150, 0], mat: 'ceramique' });
    pa.part('Bras inférieur', S.rod([-500, 300, 0], [300, 1100, 0], 70), { mat: 'acierHR' });
    pa.part('Bras supérieur', S.rod([300, 1100, 0], [-200, 1700, 0], 50), { mat: 'aluminium' });
    pa.part('Archet (bande de frottement carbone)', S.box(150, 60, 1950), { pos: [-200, 1750, 0], mat: 'carbone', desc: 'Largeur d\'archet 1 950 mm (UIC)' });
    pa.part('Vérin de levée pneumatique', S.cyl(120, 600, 'x'), { pos: [100, 400, 300], mat: 'aluminium' });
  }
  eq.part('Disjoncteur principal sous vide', S.box(1000, 500, 600), { pos: [0, roofY + 250, 0], mat: 'ceramique' });
  eq.part('Transformateur principal', S.box(3500, 1400, 2200), { pos: [0, floor - 300, 0], mat: 'peinture', color: DARK, desc: '25 kV / tensions d\'enroulements de traction – refroidi à l\'huile' });
  for (const k of [1, 2]) eq.part(`Convertisseur de traction IGBT ${k}`, S.box(2200, 2000, 900), { pos: [(k === 1 ? 1 : -1) * 4000, floor + 1050, -500], mat: 'aluminium' });
  eq.part('Convertisseur auxiliaire', S.box(1500, 1800, 800), { pos: [0, floor + 950, 600], mat: 'aluminium' });
  eq.part('Compresseur d\'air principal', S.box(1200, 700, 800), { pos: [2500, floor + 400, 600], mat: 'fonte', color: DARK });
  eq.part('Batteries 110 V', S.box(1500, 600, 700), { pos: [-2500, floor - 500, 700], mat: 'electrolyte' });
  for (const k of [1, 2]) eq.part(`Moto-ventilateur de moteurs de traction ${k}`, S.cyl(800, 600, 'y'), { pos: [(k === 1 ? 1 : -1) * 2500, floor + 1500, 600], mat: 'aluminium' });
  eq.part('Réservoir principal d\'air', S.cyl(400, 3000, 'x'), { pos: [0, floor - 600, -1000], mat: 'acier', color: DARK });
  eq.part('Sablière (bacs à sable)', S.box(400, 500, 400), { pos: [P.bogieC / 2 + P.axleB / 2 + 500, floor - 300, -hw + 300], mat: 'acier', color: DARK });
  void inlineEngine; void THREE;
  return t;
}

// ============================================================================ Tramway articulé
function buildTram(P) {
  const { L, W, H, floor } = P;
  const hw = W / 2, n = P.tramModules;
  const t = new Assembly(P.label, { prefix: 'TR', code: 'GEN', layer: 'meca', desc: `${P.desc} – largeur ${W} mm – écartement ${GAUGE} mm` });
  // Modules alternés : 3 caisses sur bogies, 2 caisses suspendues
  const lens = [7600, 4200, 8400, 4200, 7600];
  const xs = [];
  let x = L / 2;
  for (const l of lens) { xs.push(x - l / 2); x -= l; }
  const roofY = H - 400, belt = floor + 900, winTop = floor + 2050;
  lens.forEach((l, i) => {
    const mod = t.group(`Module ${i + 1}${i % 2 ? ' (suspendu)' : ' (sur bogie)'}`, { code: `M${i + 1}`, layer: 'ext' });
    const cx = xs[i];
    const cab = i === 0 || i === n - 1;
    for (const sd of SIDES) {
      mod.part(`Paroi basse ${sd.m}`, S.box(l - 150, belt - 150, 6), { pos: [cx, (belt + 150) / 2, sd.s * (hw - 3)], mat: 'peinture', color: P.color });
      const nw = Math.max(1, Math.round(l / 2000));
      for (let k = 0; k < nw; k++) mod.part(`Baie ${sd.c}${k + 1}`, S.box(l / nw - 200, winTop - belt, 10), { pos: [cx - l / 2 + (k + 0.5) * l / nw, (belt + winTop) / 2, sd.s * (hw - 1)], mat: 'verre' });
      if (!cab || true) {
        const d = mod.group(`Porte double ${sd.m}`, { code: 'POR' });
        if (sd.s > 0 || i % 2 === 0) for (const v of [-1, 1]) d.part(`Vantail ${v < 0 ? 'arrière' : 'avant'}`, S.box(640, winTop - floor + 100, 30), { pos: [cx + v * 330, (winTop + floor + 100) / 2, sd.s * (hw + 5)], mat: 'peinture', color: 0x333333 });
      }
    }
    mod.part('Toiture', S.box(l - 150, 100, W - 100), { pos: [cx, roofY + 50, 0], mat: 'peinture', color: 0xb0b3b8 });
    mod.part('Bandeau haut', S.box(l - 150, roofY - winTop, W), { pos: [cx, (roofY + winTop) / 2, 0], mat: 'peinture', color: P.color });
    mod.part('Plancher bas intégral', S.box(l - 150, 30, W - 100), { pos: [cx, floor, 0], mat: 'composite', color: 0x555555, layer: 'struct' });
    mod.part('Ossature de caisse (profilés aluminium)', S.box(l - 200, 120, W - 60), { pos: [cx, floor - 80, 0], mat: 'aluminium', layer: 'struct' });
    if (i < n - 1) {
      const jx = cx - l / 2;
      mod.part('Soufflet d\'intercirculation', S.box(300, roofY - floor, W - 100), { pos: [jx, (roofY + floor) / 2, 0], mat: 'caoutchouc', color: 0x111111 });
      mod.part('Articulation (rotule)', S.sphere(250), { pos: [jx, floor - 100, 0], mat: 'acierHR', layer: 'struct' });
      mod.part('Articulation haute', S.cyl(150, 200, 'y'), { pos: [jx, roofY - 50, 0], mat: 'acierHR', layer: 'struct' });
    }
    if (cab) {
      const s = i === 0 ? 1 : -1, ex = cx + s * l / 2;
      mod.part('Nez de cabine profilé', S.ellipsoid(1600, roofY - 150, W), { pos: [ex - s * 300, (roofY + 150) / 2, 0], scale: [1, 1, 1], mat: 'composite', color: P.color });
      mod.part('Pare-brise panoramique', S.box(12, 1300, W - 300), { pos: [ex + s * 200, floor + 1600, 0], rot: [0, 0, -s * 15], mat: 'verre' });
      for (const sd of SIDES) mod.part(`Phare ${sd.m}`, S.box(30, 120, 250), { pos: [ex + s * 420, floor + 500, sd.s * (hw - 350)], mat: 'feuBlanc' });
      mod.part('Girouette (destination)', S.box(20, 250, 1400), { pos: [ex + s * 150, roofY - 100, 0], mat: 'ecran' });
      mod.part('Pupitre de conduite', S.box(700, 900, 1200), { pos: [ex - s * 300, floor + 450, 0], mat: 'abs', layer: 'int' });
      mod.part('Siège conducteur', S.box(500, 500, 500), { pos: [ex - s * 900, floor + 500, 0], mat: 'tissu', color: 0x111111, layer: 'int' });
      mod.part('Attelage de secours escamotable', S.box(500, 200, 300), { pos: [ex + s * 450, floor + 200, 0], mat: 'acierHR', layer: 'struct' });
    }
    // Sièges et barres
    const amg = t.group(`Aménagement module ${i + 1}`, { code: `A${i + 1}`, layer: 'int' });
    const nSeat = Math.max(0, Math.floor((l - (cab ? 3000 : 1600)) / 900));
    for (let k = 0; k < nSeat; k++) for (const sd of SIDES) {
      const sx = cx - l / 2 + 900 + k * 900 + (cab && i === 0 ? 0 : 0);
      amg.part(`Siège ${sd.c}${k + 1}`, S.box(440, 450, 440), { pos: [sx, floor + 225, sd.s * (hw - 300)], mat: 'tissu', color: 0x2a3b5c });
      amg.part(`Dossier ${sd.c}${k + 1}`, S.box(80, 550, 440), { pos: [sx - 220, floor + 750, sd.s * (hw - 300)], mat: 'tissu', color: 0x2a3b5c });
    }
    for (let k = 0; k < 2; k++) amg.part(`Barre de maintien ${k + 1}`, S.cyl(35, roofY - floor - 200, 'y'), { pos: [cx + (k ? 1 : -1) * l / 4, (roofY + floor) / 2, 0], mat: 'inox' });
    amg.part('Main courante de plafond', S.cyl(32, l - 600, 'x'), { pos: [cx, roofY - 250, 0], mat: 'inox' });
  });
  // Bogies sous modules 1, 3, 5 (moteurs aux extrémités, porteur au centre)
  const tr = t.group('Bogies', { code: 'BOG', layer: 'sol' });
  [0, 2, 4].forEach((i) => bogie(tr, `Bogie ${i === 2 ? 'porteur' : 'moteur'} sous module ${i + 1}`, xs[i] + (i === 0 ? -1200 : i === 4 ? 1200 : 0), { ...P, axleB: 1800 }, { motor: false, air: false }));
  const eq = t.group('Équipements de toiture', { code: 'TOI', layer: 'meca' });
  const pa = eq.group('Pantographe unijambiste 750 V', { code: 'PAN', pos: [xs[2], roofY + 100, 0] });
  pa.part('Socle isolé', S.box(1200, 200, 900), { pos: [0, 100, 0], mat: 'ceramique' });
  pa.part('Bras inférieur', S.rod([-400, 200, 0], [300, 900, 0], 60), { mat: 'acierHR' });
  pa.part('Bras supérieur', S.rod([300, 900, 0], [-200, 1400, 0], 45), { mat: 'aluminium' });
  pa.part('Archet', S.box(120, 50, 1500), { pos: [-200, 1430, 0], mat: 'carbone' });
  for (const i of [0, 4]) {
    eq.part(`Coffre de traction (onduleur) module ${i + 1}`, S.box(2500, 400, 1800), { pos: [xs[i], roofY + 250, 0], mat: 'aluminium' });
    eq.part(`Moteur de traction module ${i + 1}`, S.cyl(450, 600, 'z'), { pos: [xs[i] + (i === 0 ? -1200 : 1200), 450, 0], mat: 'peinture', color: DARK, layer: 'sol' });
  }
  eq.part('Climatisation module 3', S.box(2500, 350, 1700), { pos: [xs[2] - 2500, roofY + 220, 0], mat: 'aluminium' });
  eq.part('Batteries / supercondensateurs', S.box(2000, 400, 1600), { pos: [xs[2] + 2500, roofY + 250, 0], mat: 'electrolyte' });
  return t;
}
