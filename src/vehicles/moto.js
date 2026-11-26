// Moto roadster – bicylindre en ligne 890 cm³, cadre treillis tubulaire
// Longueur 2 100 mm · largeur 800 mm · hauteur 1 120 mm · empattement 1 450 mm · angle de chasse 24°
import { Assembly, S, SIDES, boltCircle, axisRot } from '../core/builder.js';
import { wheel } from '../core/parts.js';

const PAINT = 0xd23b1e, FRAME = 0x2b2d31;
const XF = 725, XR = -725, YF = 300, YR = 315;

export function buildMoto() {
  const m = new Assembly('Moto roadster 890', { prefix: 'MT', code: 'GEN', desc: 'Roadster bicylindre – 2 100 × 800 × 1 120 mm – 190 kg tous pleins faits' });

  // ------------------------------------------------------------------ Cadre
  const cad = m.group('Cadre & boucle arrière', { code: 'CAD' });
  cad.part('Tube de direction', S.rod([432, 990, 0], [478, 860, 0], 60, 40), { mat: 'acier', color: FRAME, desc: 'Angle de chasse 24° – chasse 98 mm' });
  for (const sd of SIDES) {
    const z = sd.s;
    cad.part(`Longeron supérieur ${sd.m}`, S.rod([440, 960, z * 45], [-200, 760, z * 115], 32), { mat: 'acier', color: FRAME });
    cad.part(`Tube descendant ${sd.m}`, S.rod([470, 870, z * 40], [260, 400, z * 115], 32), { mat: 'acier', color: FRAME });
    cad.part(`Tube de berceau ${sd.m}`, S.rod([260, 400, z * 115], [-190, 360, z * 115], 28), { mat: 'acier', color: FRAME });
    for (let k = 0; k < 4; k++) {
      const t0 = k / 4, t1 = (k + 0.5) / 4;
      const a = [440 + (-640) * t0, 960 - 200 * t0, z * (45 + 70 * t0)];
      const b = [260 + (-450) * t1, 400 - 40 * t1, z * 115];
      cad.part(`Entretoise de treillis ${sd.c}${k + 1}`, S.rod(a, [b[0] + 200, b[1] + 150, b[2]], 20), { mat: 'acier', color: FRAME });
    }
    cad.part(`Platine de bras oscillant ${sd.f}`, S.box(140, 420, 22), { pos: [-200, 560, z * 120], mat: 'aluminium' });
    cad.part(`Rail de boucle arrière supérieur ${sd.m}`, S.rod([-200, 760, z * 105], [-830, 880, z * 75], 25), { mat: 'acier', color: FRAME });
    cad.part(`Rail de boucle arrière inférieur ${sd.m}`, S.rod([-200, 560, z * 110], [-660, 865, z * 78], 22), { mat: 'acier', color: FRAME });
    for (const [lab, x, y] of [['avant', 230, 430], ['supérieure', -150, 700], ['inférieure', -150, 400]]) {
      cad.part(`Vis de fixation moteur ${lab} ${sd.m}`, S.bolt(10, 60, 'z'), { pos: [x, y, z * 132], rot: axisRot('z', z), mat: 'acierHR', couple: 45 });
    }
    cad.part(`Vis de boucle arrière ${sd.m}`, S.capScrew(10, 40, 'z'), { pos: [-205, 760, z * 125], rot: axisRot('z', z), mat: 'acierHR', couple: 45 });
  }
  cad.part('Axe de bras oscillant', S.cyl(25, 300, 'z'), { pos: [-200, 480, 0], mat: 'acierHR' });
  cad.part('Écrou d\'axe de bras oscillant', S.nut(18, 'z'), { pos: [-200, 480, 145], mat: 'acierHR', couple: 100 });

  // ------------------------------------------------------------------ Direction & train avant
  const ta = m.group('Train avant', { code: 'TAV' });
  const ax = (t) => [432 + (725 - 432) * t, 990 + (YF - 990) * t]; // axe de fourche (point haut → axe roue)
  const tse = ta.group('Tés de fourche', { code: 'TAV' });
  const [xs, ys] = ax(0.0), [xi, yi] = ax(0.19);
  tse.part('Té supérieur', S.box(90, 25, 260), { pos: [xs, ys + 8, 0], rot: [0, 0, -24], mat: 'aluminium' });
  tse.part('Té inférieur', S.box(110, 40, 270), { pos: [xi, yi, 0], rot: [0, 0, -24], mat: 'aluminium' });
  tse.part('Écrou de colonne de direction', S.nut(24), { pos: [xs, ys + 25, 0], rot: [0, 0, -24], mat: 'acierHR', couple: 90 });
  tse.part('Roulement de direction supérieur', S.tube(52, 30, 15, 'y'), { pos: [xs + 4, ys - 12, 0], rot: [0, 0, -24], mat: 'inox' });
  tse.part('Roulement de direction inférieur', S.tube(55, 35, 16, 'y'), { pos: [xi - 5, yi + 25, 0], rot: [0, 0, -24], mat: 'inox' });
  for (const sd of SIDES) {
    for (const [lab, x, y] of [['supérieur', xs, ys + 8], ['inférieur 1', xi, yi + 8], ['inférieur 2', xi, yi - 8]]) {
      tse.part(`Vis de pincement té ${lab} ${sd.m}`, S.capScrew(8, 35, 'x'), { pos: [x + 50, y, sd.s * 100], rot: [0, 0, -90 - 24], mat: 'acierHR', couple: 23 });
    }
  }
  const fo = ta.group('Fourche inversée Ø43', { code: 'FOR' });
  for (const sd of SIDES) {
    const z = sd.s * 100;
    const [x0, y0] = ax(-0.03), [x1, y1] = ax(0.55), [x2, y2] = ax(0.45), [x3, y3] = ax(1.0);
    fo.part(`Fourreau supérieur ${sd.m}`, S.rod([x0, y0, z], [x1, y1, z], 55), { mat: 'aluminium', color: 0xd4a017 });
    fo.part(`Tube plongeur ${sd.m}`, S.rod([x2, y2, z], [x3, y3, z], 43), { mat: 'chrome' });
    fo.part(`Pied de fourche ${sd.m}`, S.box(70, 90, 50), { pos: [x3 - 5, y3 + 10, z], mat: 'aluminium' });
    fo.part(`Bouchon de fourche ${sd.m}`, S.hex(32, 20, 'y'), { pos: [x0 - 2, y0 + 12, z], rot: [0, 0, -24], mat: 'aluminium', color: 0xd4a017 });
    fo.part(`Ressort de fourche ${sd.m}`, S.spring(34, 4.5, 330, 30), { pos: [(x0 + x1) / 2, (y0 + y1) / 2, z], rot: [0, 0, -24], mat: 'acier' });
    fo.part(`Joint spi de fourche ${sd.m}`, S.tube(55, 43, 10, 'y'), { pos: [x1, y1 - 4, z], rot: [0, 0, -24], mat: 'caoutchouc' });
    fo.part(`Vis de pincement d'axe ${sd.m}`, S.capScrew(8, 30, 'x'), { pos: [x3 + 30, y3 - 20, z], rot: [0, 0, -90], mat: 'acierHR', couple: 22 });
  }
  fo.part('Axe de roue avant', S.cyl(25, 250, 'z'), { pos: [XF, YF, 0], mat: 'acierHR' });
  fo.part('Écrou d\'axe de roue avant', S.nut(18, 'z'), { pos: [XF, YF, -130], mat: 'acierHR', couple: 65 });
  ta.part('Garde-boue avant', S.extrude((() => { const p = []; for (let i = 0; i <= 16; i++) { const a = Math.PI * (0.15 + 0.6 * i / 16); p.push([XF + 340 * Math.cos(a), YF + 340 * Math.sin(a)]); } for (let i = 16; i >= 0; i--) { const a = Math.PI * (0.15 + 0.6 * i / 16); p.push([XF + 325 * Math.cos(a), YF + 325 * Math.sin(a)]); } return p; })(), 140), { mat: 'abs', color: PAINT });
  wheel(ta, 'Roue avant', 1, { pos: [XF, YF, 0], tire: [120, 70, 17], code: 'ROU', hubD: 70, hubL: 110, spokes: 6, spokeW: 22, rimMat: 'aluminium', cap: false });
  for (const sd of SIDES) {
    const z = sd.s * 62;
    const fr = ta.group(`Frein avant ${sd.m}`, { code: 'FRE' });
    fr.part('Disque flottant Ø320 – piste', S.tube(320, 230, 4.5, 'z', 60), { pos: [XF, YF, z], mat: 'inox' });
    fr.part('Flasque porte-disque', S.tube(230, 70, 6, 'z'), { pos: [XF, YF, z], mat: 'aluminium', color: 0xd4a017 });
    boltCircle(fr, { n: 6, pcd: 100, d: 8, L: 20, axis: 'z', at: [XF, YF, z + sd.s * 6], dir: sd.s, label: 'Vis de disque', kind: 'cap', couple: 30 });
    const ca = 200 * Math.PI / 180;
    const cp = [XF + Math.cos(ca) * 142, YF + Math.sin(ca) * 142, z];
    fr.part('Étrier radial monobloc 4 pistons', S.box(60, 130, 55), { pos: cp, rot: [0, 0, 110], mat: 'aluminium', color: 0xd4a017 });
    fr.part('Plaquettes de frein', S.box(40, 100, 25), { pos: cp, rot: [0, 0, 110], mat: 'feutre' });
    for (const k of [1, 2]) fr.part(`Vis de fixation radiale ${k}`, S.capScrew(10, 60, 'x'), { pos: [cp[0] - 30, cp[1] + (k === 1 ? -45 : 45), z], rot: [0, 0, 90], mat: 'acierHR', couple: 45 });
    fr.part('Durite aviation', S.pipe([[cp[0], cp[1] + 60, z], [480, 700, sd.s * 120], [430, 1000, sd.s * 150], [xs - 10, ys + 80, sd.s * 210]], 9), { mat: 'inox' });
  }

  const gd = ta.group('Guidon & commandes', { code: 'GUI' });
  const hy = ys + 70;
  gd.part('Guidon conique Ø28', S.pipe([[xs - 40, hy, -380], [xs - 10, hy - 10, -200], [xs, hy - 30, 0], [xs - 10, hy - 10, 200], [xs - 40, hy, 380]], 28), { mat: 'aluminium', color: 0x222222 });
  for (const sd of SIDES) {
    gd.part(`Pontet de guidon ${sd.m}`, S.box(40, 60, 40), { pos: [xs, ys + 40, sd.s * 40], mat: 'aluminium' });
    for (const dx of [-14, 14]) gd.part(`Vis de pontet ${sd.c}${dx < 0 ? '1' : '2'}`, S.capScrew(8, 35, 'y'), { pos: [xs + dx, ys + 75, sd.s * 40], mat: 'acierHR', couple: 23 });
    gd.part(`Poignée ${sd.f === 'droite' ? 'de gaz' : 'gauche'}`, S.cyl(34, 130, 'z'), { pos: [xs - 40, hy, sd.s * 320], mat: 'caoutchouc' });
    gd.part(`Embout de guidon ${sd.m}`, S.cyl(32, 30, 'z'), { pos: [xs - 40, hy, sd.s * 395], mat: 'aluminium' });
    gd.part(sd.s > 0 ? 'Levier de frein avant' : 'Levier d\'embrayage', S.box(30, 12, 180), { pos: [xs + 30, hy, sd.s * 280], rot: [0, sd.s * 10, 0], mat: 'aluminium' });
    gd.part(sd.s > 0 ? 'Maître-cylindre de frein avant' : 'Maître-cylindre d\'embrayage', S.cyl(30, 70, 'x'), { pos: [xs - 10, hy + 10, sd.s * 220], mat: 'aluminium' });
    gd.part(`Commodo ${sd.m}`, S.box(60, 60, 50), { pos: [xs - 30, hy, sd.s * 230], mat: 'abs' });
    gd.part(`Rétroviseur ${sd.m}`, S.ellipsoid(40, 80, 140), { pos: [xs - 20, hy + 220, sd.s * 330], mat: 'abs' });
    gd.part(`Tige de rétroviseur ${sd.m}`, S.rod([xs - 20, hy + 10, sd.s * 230], [xs - 20, hy + 190, sd.s * 320], 10), { mat: 'chrome' });
  }
  gd.part('Réservoir de liquide de frein avant', S.box(40, 40, 50), { pos: [xs - 10, hy + 45, 200], mat: 'composite' });
  gd.part('Tableau de bord TFT 5"', S.box(30, 100, 140), { pos: [xs + 25, ys + 120, 0], rot: [0, 0, -20], mat: 'ecran' });
  gd.part('Phare à LED', S.ellipsoid(150, 170, 200), { pos: [xs + 120, ys - 70, 0], mat: 'feuBlanc' });
  gd.part('Support de phare', S.box(30, 120, 220), { pos: [xs + 55, ys - 70, 0], mat: 'aluminium' });
  for (const sd of SIDES) gd.part(`Clignotant avant ${sd.m}`, S.ellipsoid(60, 30, 30), { pos: [xs + 80, ys - 130, sd.s * 140], mat: 'feuOrange' });

  // ------------------------------------------------------------------ Moteur
  const mo = m.group('Moteur bicylindre en ligne 890 cm³', { code: 'MOT', desc: 'Alésage 78 mm × course 93,2 mm – calage 270° – 87 kW à 10 000 tr/min' });
  const ct = mo.group('Carters', { code: 'MOT' });
  ct.part('Demi-carter supérieur', S.box(400, 140, 300), { pos: [20, 520, 0], mat: 'aluminium', color: 0x3a3d42 });
  ct.part('Demi-carter inférieur', S.box(380, 130, 300), { pos: [10, 385, 0], mat: 'aluminium', color: 0x3a3d42 });
  ct.part('Carter d\'huile', S.box(280, 60, 220), { pos: [40, 290, 0], mat: 'aluminium', color: 0x3a3d42 });
  ct.part('Bouchon de vidange', S.bolt(12, 15, 'y'), { pos: [40, 252, 30], rot: [180, 0, 0], mat: 'acier', couple: 20 });
  ct.part('Carter d\'embrayage (droit)', S.cyl(230, 40, 'z'), { pos: [-30, 450, 170], mat: 'aluminium', color: 0x3a3d42 });
  boltCircle(ct, { n: 10, pcd: 210, d: 6, L: 35, axis: 'z', at: [-30, 450, 192], dir: 1, label: 'Vis de carter d\'embrayage', kind: 'cap', couple: 10 });
  ct.part('Carter d\'alternateur (gauche)', S.cyl(200, 50, 'z'), { pos: [80, 450, -175], mat: 'aluminium', color: 0x3a3d42 });
  boltCircle(ct, { n: 8, pcd: 180, d: 6, L: 35, axis: 'z', at: [80, 450, -202], dir: -1, label: 'Vis de carter d\'alternateur', kind: 'cap', couple: 10 });
  ct.part('Filtre à huile', S.cyl(65, 70, 'x'), { pos: [230, 360, 60], mat: 'peinture', color: 0x222222 });
  ct.part('Hublot de niveau d\'huile', S.cyl(28, 6, 'z'), { pos: [-60, 380, 192], mat: 'verre' });

  const cy = mo.group('Cylindres & culasse', { code: 'MOT', pos: [120, 600, 0], rot: [0, 0, -25] });
  cy.part('Bloc-cylindres', S.box(140, 190, 230), { pos: [0, 95, 0], mat: 'aluminium', color: 0x3a3d42 });
  cy.part('Joint d\'embase', S.box(140, 1, 230), { pos: [0, 0, 0], mat: 'acier' });
  cy.part('Culasse DACT 8 soupapes', S.box(160, 100, 250), { pos: [0, 240, 0], mat: 'aluminium', color: 0x3a3d42 });
  cy.part('Couvre-culasse', S.box(150, 45, 240), { pos: [0, 312, 0], mat: 'aluminium', color: 0xc0c4c9 });
  for (const sd of SIDES) {
    const z = sd.s * 57;
    cy.part(`Piston ${sd.s < 0 ? 1 : 2}`, S.cyl(78, 55, 'y'), { pos: [0, 120, z], mat: 'aluminium' });
    cy.part(`Bielle ${sd.s < 0 ? 1 : 2}`, S.rod([0, 100, z], [0, -110, z], 20), { mat: 'titane' });
    cy.part(`Bougie d'allumage ${sd.s < 0 ? 1 : 2}`, S.cyl(12, 60, 'y'), { pos: [0, 315, z], mat: 'ceramique' });
    cy.part(`Bobine crayon ${sd.s < 0 ? 1 : 2}`, S.cyl(25, 40, 'y'), { pos: [0, 350, z], mat: 'plastique' });
    for (const k of ['adm.', 'éch.']) for (const v of ['a', 'b']) cy.part(`Soupape ${k} cyl.${sd.s < 0 ? 1 : 2}${v}`, S.cyl(5.5, 100, 'y'), { pos: [k === 'adm.' ? -30 : 30, 220, z + (v === 'a' ? -14 : 14)], mat: 'inox' });
  }
  for (let i = 0; i < 8; i++) {
    const x = (i % 2 ? 1 : -1) * 60, z = (Math.floor(i / 2) - 1.5) * 70;
    cy.part(`Goujon de culasse ${i + 1}`, S.nut(10), { pos: [x, 292, z], mat: 'acierHR', couple: '20 N·m + 120°' });
  }
  cy.part('Arbre à cames d\'admission', S.cyl(24, 230, 'z'), { pos: [-30, 270, 0], mat: 'acier' });
  cy.part('Arbre à cames d\'échappement', S.cyl(24, 230, 'z'), { pos: [30, 270, 0], mat: 'acier' });
  const eq = mo.group('Équipage & transmission primaire', { code: 'MOT' });
  eq.part('Vilebrequin calé à 270°', S.cyl(40, 300, 'z'), { pos: [70, 480, 0], mat: 'acierHR' });
  eq.part('Arbre d\'équilibrage', S.cyl(30, 280, 'z'), { pos: [150, 430, 0], mat: 'acierHR' });
  eq.part('Embrayage multidisque', S.cyl(150, 70, 'z'), { pos: [-30, 450, 120], mat: 'acier' });
  eq.part('Boîte 6 rapports – arbre primaire', S.cyl(28, 280, 'z'), { pos: [-60, 520, 0], mat: 'acierHR' });
  eq.part('Boîte 6 rapports – arbre secondaire', S.cyl(30, 300, 'z'), { pos: [-120, 440, 0], mat: 'acierHR' });
  const adm = mo.group('Admission & injection', { code: 'ADM' });
  for (const sd of SIDES) adm.part(`Corps papillon Ø44 ${sd.s < 0 ? 1 : 2}`, S.cyl(55, 80, 'x'), { pos: [-40, 820, sd.s * 57], mat: 'aluminium' });
  adm.part('Boîte à air', S.box(260, 150, 300), { pos: [-110, 905, 0], mat: 'plastique' });
  adm.part('Filtre à air', S.box(200, 30, 250), { pos: [-110, 900, 0], mat: 'tissu', color: 0xe9d8a0 });
  adm.part('Rampe d\'injection', S.cyl(16, 160, 'z'), { pos: [-30, 860, 0], mat: 'inox' });
  const ref = mo.group('Refroidissement', { code: 'REF' });
  ref.part('Radiateur', S.box(40, 300, 380), { pos: [330, 600, 0], rot: [0, 0, -10], mat: 'aluminium', color: 0x222222 });
  ref.part('Ventilateur électrique', S.cyl(170, 40, 'x'), { pos: [300, 600, 0], mat: 'plastique' });
  ref.part('Pompe à eau', S.cyl(80, 40, 'z'), { pos: [60, 330, 160], mat: 'aluminium' });
  ref.part('Durite de radiateur', S.pipe([[330, 750, 120], [250, 750, 140], [200, 700, 130]], 28), { mat: 'caoutchouc' });

  const ech = m.group('Échappement', { code: 'ECH' });
  for (const sd of SIDES) {
    const z = sd.s * 57;
    ech.part(`Collecteur cylindre ${sd.s < 0 ? 1 : 2}`, S.pipe([[260, 680, z], [330, 600, z], [330, 380, z * 0.8], [250, 260, z * 0.5], [0, 240, 0]], 45), { mat: 'inox' });
    for (const k of [1, 2]) ech.part(`Écrou de collecteur cyl.${sd.s < 0 ? 1 : 2}-${k}`, S.nut(8, 'x'), { pos: [255, 690, z + (k === 1 ? -22 : 22)], mat: 'laiton', couple: 20 });
  }
  ech.part('Précatalyseur', S.box(260, 110, 200), { pos: [-60, 245, 40], mat: 'inox' });
  ech.part('Tube de liaison', S.pipe([[-190, 250, 80], [-300, 300, 130], [-420, 380, 160]], 50), { mat: 'inox' });
  ech.part('Silencieux', S.cyl(120, 380, 'x', 32, 100), { pos: [-560, 430, 170], rot: [0, 0, 15], mat: 'inox' });
  ech.part('Collier de silencieux', S.tube(130, 118, 30, 'x'), { pos: [-430, 395, 170], rot: [0, 0, 15], mat: 'inox' });

  // ------------------------------------------------------------------ Partie cycle arrière
  const tar = m.group('Train arrière', { code: 'TAR' });
  const bo = tar.group('Bras oscillant aluminium', { code: 'TAR' });
  for (const sd of SIDES) {
    bo.part(`Branche ${sd.f}`, S.rod([-200, 480, sd.s * 105], [XR, YR, sd.s * 105], 60, 40), { mat: 'aluminium' });
    bo.part(`Tendeur de chaîne ${sd.m}`, S.box(50, 30, 15), { pos: [XR - 20, YR, sd.s * 140], mat: 'aluminium' });
    bo.part(`Vis de tendeur ${sd.m}`, S.bolt(8, 40, 'x'), { pos: [XR - 50, YR, sd.s * 140], rot: [0, 0, 90], mat: 'acierHR', couple: 20 });
    bo.part(`Roulement de pivot ${sd.m}`, S.tube(45, 25, 20, 'z'), { pos: [-200, 480, sd.s * 100], mat: 'inox' });
  }
  bo.part('Traverse de bras oscillant', S.box(60, 50, 210), { pos: [-330, 455, 0], mat: 'aluminium' });
  bo.part('Axe de roue arrière', S.cyl(25, 280, 'z'), { pos: [XR, YR, 0], mat: 'acierHR' });
  bo.part('Écrou d\'axe de roue arrière', S.nut(20, 'z'), { pos: [XR, YR, 150], mat: 'acierHR', couple: 110 });
  const amo = tar.group('Mono-amortisseur', { code: 'AMO' });
  amo.part('Corps d\'amortisseur', S.rod([-330, 480, 0], [-210, 790, 0], 46), { mat: 'aluminium', color: 0xd4a017 });
  amo.part('Ressort d\'amortisseur', S.spring(70, 10, 200, 7), { pos: [-260, 640, 0], rot: [0, 0, -21], mat: 'peinture', color: 0xc0262d });
  amo.part('Vis d\'ancrage supérieure', S.bolt(10, 70, 'z'), { pos: [-210, 790, 35], rot: axisRot('z', 1), mat: 'acierHR', couple: 45 });
  amo.part('Vis d\'ancrage inférieure', S.bolt(10, 70, 'z'), { pos: [-330, 480, 35], rot: axisRot('z', 1), mat: 'acierHR', couple: 45 });
  amo.part('Molette de précharge', S.tube(85, 60, 12, 'y'), { pos: [-240, 730, 0], rot: [0, 0, -21], mat: 'aluminium' });
  wheel(tar, 'Roue arrière', 1, { pos: [XR, YR, 0], tire: [180, 55, 17], code: 'ROU', hubD: 90, hubL: 150, spokes: 6, spokeW: 26, rimMat: 'aluminium', cap: false });
  const far = tar.group('Frein arrière', { code: 'FRE' });
  far.part('Disque arrière Ø245', S.tube(245, 110, 5, 'z', 48), { pos: [XR, YR, 92], mat: 'inox' });
  boltCircle(far, { n: 5, pcd: 90, d: 8, L: 20, axis: 'z', at: [XR, YR, 97], dir: 1, label: 'Vis de disque arrière', kind: 'cap', couple: 30 });
  far.part('Étrier flottant 2 pistons', S.box(70, 100, 50), { pos: [XR + 70, YR + 85, 92], rot: [0, 0, -40], mat: 'aluminium', color: 0x222222 });
  far.part('Support d\'étrier arrière', S.box(160, 40, 10), { pos: [XR + 90, YR + 60, 120], rot: [0, 0, -30], mat: 'aluminium' });

  const tra = tar.group('Transmission secondaire', { code: 'TRS' });
  tra.part('Pignon de sortie de boîte 16 dents', S.cyl(80, 18, 'z', 16), { pos: [-140, 440, -115], mat: 'acierHR' });
  tra.part('Écrou de pignon', S.nut(20, 'z'), { pos: [-140, 440, -127], mat: 'acierHR', couple: 80 });
  tra.part('Couronne 45 dents', S.cyl(230, 8, 'z', 45), { pos: [XR, YR, -115], mat: 'aluminium', color: 0x222222 });
  boltCircle(tra, { n: 6, pcd: 140, d: 10, L: 30, axis: 'z', at: [XR, YR, -122], dir: -1, label: 'Écrou de couronne', kind: 'nut', couple: 50 });
  tra.part('Porte-couronne (moyeu amortisseur)', S.cyl(150, 40, 'z'), { pos: [XR, YR, -95], mat: 'aluminium' });
  tra.part('Chaîne 525 – 112 maillons', S.pipe([[-140, 482, -115], [-400, 432, -115], [XR, YR + 117, -115], [XR - 110, YR + 30, -115], [XR - 60, YR - 105, -115], [-400, 360, -115], [-140, 398, -115], [-100, 440, -115]], 12, true), { mat: 'acier' });
  tra.part('Guide-chaîne', S.box(150, 15, 15), { pos: [-260, 430, -115], mat: 'plastique' });
  tra.part('Cache-pignon', S.box(120, 120, 20), { pos: [-140, 450, -140], mat: 'abs' });

  // ------------------------------------------------------------------ Habillage & équipements
  const hab = m.group('Habillage & selle', { code: 'HAB' });
  hab.part('Réservoir de carburant 14 L', S.extrude([[380, 920], [330, 1060], [120, 1110], [-120, 1060], [-190, 900], [-80, 860], [300, 880]], 360, 60), { mat: 'peinture', color: PAINT, desc: 'Acier – 14 L dont 2,5 L de réserve' });
  hab.part('Bouchon de réservoir', S.cyl(80, 15, 'y'), { pos: [120, 1112, 0], mat: 'aluminium' });
  for (const sd of SIDES) hab.part(`Écope de réservoir ${sd.f}`, S.box(220, 220, 20), { pos: [330, 840, sd.s * 195], rot: [0, sd.s * 15, -15], mat: 'abs', color: 0x222222 });
  hab.part('Pompe à carburant', S.cyl(90, 150, 'y'), { pos: [0, 940, 0], mat: 'plastique' });
  hab.part('Selle pilote', S.extrude([[-130, 880], [-170, 920], [-500, 930], [-560, 970], [-560, 900], [-200, 860]], 300, 25), { mat: 'cuir', color: 0x161616 });
  hab.part('Selle passager', S.extrude([[-560, 960], [-560, 1000], [-850, 1010], [-870, 960]], 240, 20), { mat: 'cuir', color: 0x161616 });
  hab.part('Coque arrière', S.extrude([[-560, 880], [-900, 980], [-920, 920], [-600, 860]], 220, 15), { mat: 'abs', color: PAINT });
  hab.part('Feu arrière à LED', S.box(30, 40, 120), { pos: [-915, 945, 0], mat: 'feuRouge' });
  hab.part('Support de plaque', S.box(300, 15, 100), { pos: [-950, 800, 0], rot: [0, 0, 40], mat: 'abs' });
  hab.part('Plaque d\'immatriculation', S.box(4, 170, 210), { pos: [-1050, 720, 0], rot: [0, 0, -10], mat: 'aluminium', color: 0xffffff });
  for (const sd of SIDES) hab.part(`Clignotant arrière ${sd.m}`, S.ellipsoid(60, 30, 30), { pos: [-950, 820, sd.s * 120], mat: 'feuOrange' });
  hab.part('Garde-boue arrière (lèche-roue)', S.extrude((() => { const p = []; for (let i = 0; i <= 12; i++) { const a = Math.PI * (0.25 + 0.45 * i / 12); p.push([XR + 345 * Math.cos(a), YR + 345 * Math.sin(a)]); } for (let i = 12; i >= 0; i--) { const a = Math.PI * (0.25 + 0.45 * i / 12); p.push([XR + 335 * Math.cos(a), YR + 335 * Math.sin(a)]); } return p; })(), 190), { mat: 'abs' });
  hab.part('Écope de radiateur', S.box(20, 280, 420), { pos: [360, 600, 0], rot: [0, 0, -10], mat: 'abs', color: 0x222222 });

  const eqp = m.group('Commandes au pied & béquille', { code: 'PIE' });
  for (const sd of SIDES) {
    eqp.part(`Platine de repose-pieds ${sd.m}`, S.box(220, 120, 12), { pos: [-260, 380, sd.s * 160], mat: 'aluminium' });
    eqp.part(`Repose-pied pilote ${sd.m}`, S.cyl(25, 110, 'z'), { pos: [-230, 340, sd.s * 220], mat: 'aluminium' });
    eqp.part(`Repose-pied passager ${sd.m}`, S.cyl(22, 90, 'z'), { pos: [-520, 480, sd.s * 190], mat: 'aluminium' });
    for (const k of [1, 2]) eqp.part(`Vis de platine ${sd.c}${k}`, S.capScrew(8, 25, 'z'), { pos: [-260 + (k === 1 ? -60 : 60), 400, sd.s * 168], rot: axisRot('z', sd.s), mat: 'acierHR', couple: 25 });
  }
  eqp.part('Sélecteur de vitesses', S.box(160, 15, 15), { pos: [-140, 360, -200], rot: [0, 0, -10], mat: 'aluminium' });
  eqp.part('Pédale de frein arrière', S.box(170, 15, 15), { pos: [-180, 345, 200], rot: [0, 0, 10], mat: 'aluminium' });
  eqp.part('Maître-cylindre de frein arrière', S.cyl(25, 80, 'y'), { pos: [-260, 420, 175], mat: 'aluminium' });
  eqp.part('Béquille latérale', S.rod([-120, 330, -130], [-80, 40, -330], 25), { mat: 'acier', color: FRAME });
  eqp.part('Ressort de béquille', S.spring(14, 3, 90, 12, 'x'), { pos: [-140, 320, -140], mat: 'acier' });

  const el = m.group('Électricité', { code: 'ELE' });
  el.part('Batterie lithium 12 V', S.box(150, 90, 90), { pos: [-450, 850, 0], mat: 'electrolyte' });
  el.part('Calculateur (ECU)', S.box(140, 30, 100), { pos: [-620, 900, 0], mat: 'aluminium' });
  el.part('Régulateur de tension', S.box(80, 25, 60), { pos: [-640, 860, 60], mat: 'aluminium' });
  el.part('Avertisseur sonore', S.cyl(70, 30, 'x'), { pos: [380, 500, 0], mat: 'abs' });
  el.part('Faisceau principal', S.pipe([[430, 860, 30], [200, 880, 60], [-200, 820, 80], [-600, 870, 40]], 14), { mat: 'plastique' });
  return m;
}
