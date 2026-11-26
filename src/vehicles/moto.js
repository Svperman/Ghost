// Motos – générateur paramétrique (cotes en mm)
// Repère : X avant, Y haut, Z droite. Le cadre est construit dans un repère local surélevé de LIFT.
import { Assembly, S, SIDES, boltCircle, axisRot } from '../core/builder.js';
import { wheel } from '../core/parts.js';

const FRAME = 0x2b2d31;
const DEGR = Math.PI / 180;

export const MOTO_TYPES = {
  roadster: {
    label: 'Roadster', desc: 'Roadster bicylindre en ligne 890 cm³ – cadre treillis – 190 kg tous pleins faits',
    rake: 24, lift: 0, swing: 560, front: [120, 70, 17], rear: [180, 55, 17], paint: 0xd23b1e, engine: 'twin', hw: 380, hy: 70,
    makers: ['Yamaha (MT-09)', 'Kawasaki (Z900)', 'Triumph (Street Triple)', 'KTM (890 Duke)', 'Honda (CB750 Hornet)', 'Ducati (Monster)', 'BMW (F 900 R)'],
  },
  sportive: {
    label: 'Sportive carénée', desc: 'Hypersport 4 cylindres en ligne 998 cm³ – carénage intégral – 200 kg',
    rake: 23.5, lift: 40, swing: 580, front: [120, 70, 17], rear: [190, 55, 17], paint: 0x1f4fbf, engine: 'i4', fairing: true, hw: 330, hy: -15,
    makers: ['Yamaha (YZF-R1)', 'Honda (CBR1000RR-R)', 'Kawasaki (ZX-10R)', 'Suzuki (GSX-R1000)', 'BMW (S 1000 RR)', 'Ducati (Panigale – V4)', 'Aprilia (RSV4 – V4)'],
  },
  trail: {
    label: 'Trail / aventure', desc: 'Trail bicylindre 890 cm³ – roues à rayons 21"/18" – grand débattement',
    rake: 27, lift: 130, swing: 600, front: [90, 90, 21], rear: [150, 70, 18], paint: 0xf0f0ee, engine: 'twin', adv: true, wire: true, hw: 430, hy: 130,
    makers: ['BMW (R 1300 GS – flat twin)', 'KTM (890 Adventure)', 'Honda (Africa Twin)', 'Yamaha (Ténéré 700)', 'Triumph (Tiger 900)', 'Ducati (DesertX)', 'Suzuki (V-Strom)'],
  },
  custom: {
    label: 'Custom / cruiser', desc: 'Cruiser bicylindre en V à 45° 1 250 cm³ – selle basse – transmission par courroie',
    rake: 32, lift: -70, swing: 620, front: [130, 90, 16], rear: [180, 65, 16], paint: 0x101113, engine: 'vtwin', custom: true, hw: 440, hy: 190,
    makers: ['Harley-Davidson (Softail / Sportster)', 'Indian (Scout / Chief)', 'Triumph (Bonneville Bobber – twin en ligne)', 'Honda (Rebel)', 'Kawasaki (Vulcan)', 'Yamaha (XV / Bolt)', 'Moto Guzzi (California – V transversal)'],
  },
};

const ENGINES = {
  twin: { label: 'Moteur bicylindre en ligne 890 cm³', desc: 'Alésage 78 × course 93,2 mm – calage 270° – 87 kW', bore: 78, banks: [{ name: 'Cylindres & culasse', pos: [120, 600], rot: -25, zs: [-57, 57] }] },
  i4: { label: 'Moteur 4 cylindres en ligne 998 cm³', desc: 'Alésage 76 × course 55 mm – 147 kW à 13 500 tr/min', bore: 76, banks: [{ name: 'Cylindres & culasse', pos: [130, 600], rot: -30, zs: [-123, -41, 41, 123] }] },
  vtwin: {
    label: 'Moteur bicylindre en V à 45° 1 250 cm³', desc: 'Alésage 105 × course 72 mm – refroidissement liquide – 112 kW', bore: 105,
    banks: [{ name: 'Cylindre avant & culasse', pos: [150, 600], rot: -22.5, zs: [0] }, { name: 'Cylindre arrière & culasse', pos: [-70, 600], rot: 22.5, zs: [0] }],
  },
};

export function buildMoto(type = 'roadster') {
  const P = MOTO_TYPES[type] || MOTO_TYPES.roadster;
  const PAINT = P.paint, LIFT = P.lift, RAKE = P.rake;
  const dia = ([w, ar, inch]) => inch * 25.4 + 2 * w * ar / 100;
  const RF = dia(P.front) / 2, RR = dia(P.rear) / 2;
  const YF = RF - LIFT, YR = RR - LIFT; // axes de roues en repère local
  const XF = 432 + (990 - YF) * Math.tan(RAKE * DEGR);
  const XR = -200 - Math.sqrt(P.swing ** 2 - (480 - YR) ** 2);
  const E = ENGINES[P.engine];
  const up = [0, LIFT, 0];

  const m = new Assembly(`Moto ${P.label.toLowerCase()}`, { prefix: 'MT', code: 'GEN', layer: 'meca', desc: `${P.desc} – empattement ${Math.round(XF - XR)} mm – angle de chasse ${RAKE}°` });

  // ------------------------------------------------------------------ Cadre
  const cad = m.group('Cadre & boucle arrière', { code: 'CAD', pos: up, layer: 'struct' });
  cad.part('Tube de direction', S.rod([432, 990, 0], [432 + 130 * Math.tan(RAKE * DEGR), 860, 0], 60, 40), { mat: 'acier', color: FRAME, desc: `Angle de chasse ${RAKE}°` });
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
  const ta = m.group('Train avant', { code: 'TAV', pos: up, layer: 'sol' });
  const ax = (t) => [432 + (XF - 432) * t, 990 + (YF - 990) * t]; // axe de fourche (point haut → axe roue)
  const tse = ta.group('Tés de fourche', { code: 'TAV' });
  const [xs, ys] = ax(0.0), [xi, yi] = ax(0.19);
  tse.part('Té supérieur', S.box(90, 25, 260), { pos: [xs, ys + 8, 0], rot: [0, 0, -RAKE], mat: 'aluminium' });
  tse.part('Té inférieur', S.box(110, 40, 270), { pos: [xi, yi, 0], rot: [0, 0, -RAKE], mat: 'aluminium' });
  tse.part('Écrou de colonne de direction', S.nut(24), { pos: [xs, ys + 25, 0], rot: [0, 0, -RAKE], mat: 'acierHR', couple: 90 });
  tse.part('Roulement de direction supérieur', S.tube(52, 30, 15, 'y'), { pos: [xs + 4, ys - 12, 0], rot: [0, 0, -RAKE], mat: 'inox' });
  tse.part('Roulement de direction inférieur', S.tube(55, 35, 16, 'y'), { pos: [xi - 5, yi + 25, 0], rot: [0, 0, -RAKE], mat: 'inox' });
  for (const sd of SIDES) {
    for (const [lab, x, y] of [['supérieur', xs, ys + 8], ['inférieur 1', xi, yi + 8], ['inférieur 2', xi, yi - 8]]) {
      tse.part(`Vis de pincement té ${lab} ${sd.m}`, S.capScrew(8, 35, 'x'), { pos: [x + 50, y, sd.s * 100], rot: [0, 0, -90 - RAKE], mat: 'acierHR', couple: 23 });
    }
  }
  const fo = ta.group(P.custom ? 'Fourche télescopique conventionnelle Ø49' : P.adv ? 'Fourche inversée Ø48 – débattement 240 mm' : 'Fourche inversée Ø43', { code: 'FOR' });
  const fColor = P.custom ? undefined : 0xd4a017;
  for (const sd of SIDES) {
    const z = sd.s * 100;
    const [x0, y0] = ax(-0.03), [x1, y1] = ax(0.55), [x2, y2] = ax(0.45), [x3, y3] = ax(1.0);
    fo.part(`Fourreau supérieur ${sd.m}`, S.rod([x0, y0, z], [x1, y1, z], 55), { mat: P.custom ? 'chrome' : 'aluminium', color: fColor });
    fo.part(`Tube plongeur ${sd.m}`, S.rod([x2, y2, z], [x3, y3, z], 45), { mat: P.custom ? 'aluminium' : 'chrome' });
    fo.part(`Pied de fourche ${sd.m}`, S.box(70, 90, 50), { pos: [x3 - 5, y3 + 10, z], mat: 'aluminium' });
    fo.part(`Bouchon de fourche ${sd.m}`, S.hex(32, 20, 'y'), { pos: [x0 - 2, y0 + 12, z], rot: [0, 0, -RAKE], mat: 'aluminium', color: fColor });
    fo.part(`Ressort de fourche ${sd.m}`, S.spring(34, 4.5, 330, 30), { pos: [(x0 + x1) / 2, (y0 + y1) / 2, z], rot: [0, 0, -RAKE], mat: 'acier' });
    fo.part(`Joint spi de fourche ${sd.m}`, S.tube(55, 43, 10, 'y'), { pos: [x1, y1 - 4, z], rot: [0, 0, -RAKE], mat: 'caoutchouc' });
    fo.part(`Vis de pincement d'axe ${sd.m}`, S.capScrew(8, 30, 'x'), { pos: [x3 + 30, y3 - 20, z], rot: [0, 0, -90], mat: 'acierHR', couple: 22 });
  }
  fo.part('Axe de roue avant', S.cyl(25, 250, 'z'), { pos: [XF, YF, 0], mat: 'acierHR' });
  fo.part('Écrou d\'axe de roue avant', S.nut(18, 'z'), { pos: [XF, YF, -130], mat: 'acierHR', couple: 65 });
  const arcPart = (cx, cy, r1, r2, a0, a1) => { const p = []; for (let i = 0; i <= 16; i++) { const a = Math.PI * (a0 + (a1 - a0) * i / 16); p.push([cx + r2 * Math.cos(a), cy + r2 * Math.sin(a)]); } for (let i = 16; i >= 0; i--) { const a = Math.PI * (a0 + (a1 - a0) * i / 16); p.push([cx + r1 * Math.cos(a), cy + r1 * Math.sin(a)]); } return p; };
  if (P.adv) ta.part('Garde-boue avant haut (bec)', S.extrude([[xi + 40, yi - 60], [xi + 320, yi - 150], [xi + 300, yi - 110], [xi - 120, yi - 40]], 150, 10), { mat: 'abs', color: PAINT, layer: 'ext' });
  else ta.part('Garde-boue avant', S.extrude(arcPart(XF, YF, RF + 25, RF + 40, 0.15, P.custom ? 0.85 : 0.75), P.custom ? 170 : 140), { mat: P.custom ? 'peinture' : 'abs', color: PAINT, layer: 'ext' });
  const wOpts = P.wire
    ? { spokes: 36, spokeW: 4, rimMat: 'aluminium', spokeLabel: 'Rayon' }
    : P.custom ? { spokes: 9, spokeW: 18, rimMat: 'chrome' } : { spokes: 6, spokeW: 22, rimMat: 'aluminium' };
  wheel(ta, 'Roue avant', 1, { pos: [XF, YF, 0], tire: P.front, code: 'ROU', hubD: 70, hubL: 110, cap: false, ...wOpts });
  const discs = P.custom ? [-1] : [-1, 1];
  for (const sd of SIDES.filter((s) => discs.includes(s.s))) {
    const z = sd.s * 62;
    const dD = P.custom ? 300 : 320;
    const fr = ta.group(`Frein avant ${sd.m}`, { code: 'FRE' });
    fr.part(`Disque flottant Ø${dD} – piste`, S.tube(dD, dD - 90, 4.5, 'z', 60), { pos: [XF, YF, z], mat: 'inox' });
    fr.part('Flasque porte-disque', S.tube(dD - 90, 70, 6, 'z'), { pos: [XF, YF, z], mat: 'aluminium', color: 0xd4a017 });
    boltCircle(fr, { n: 6, pcd: 100, d: 8, L: 20, axis: 'z', at: [XF, YF, z + sd.s * 6], dir: sd.s, label: 'Vis de disque', kind: 'cap', couple: 30 });
    const ca = 200 * DEGR;
    const cp = [XF + Math.cos(ca) * (dD / 2 - 18), YF + Math.sin(ca) * (dD / 2 - 18), z];
    fr.part('Étrier radial monobloc 4 pistons', S.box(60, 130, 55), { pos: cp, rot: [0, 0, 110], mat: 'aluminium', color: 0xd4a017 });
    fr.part('Plaquettes de frein', S.box(40, 100, 25), { pos: cp, rot: [0, 0, 110], mat: 'feutre' });
    for (const k of [1, 2]) fr.part(`Vis de fixation radiale ${k}`, S.capScrew(10, 60, 'x'), { pos: [cp[0] - 30, cp[1] + (k === 1 ? -45 : 45), z], rot: [0, 0, 90], mat: 'acierHR', couple: 45 });
    fr.part('Durite aviation', S.pipe([[cp[0], cp[1] + 60, z], [xi + 40, yi - 100, sd.s * 120], [xs - 10, ys + 80, sd.s * 210]], 9), { mat: 'inox' });
  }

  const gd = ta.group(P.fairing ? 'Demi-guidons bracelets & commandes' : 'Guidon & commandes', { code: 'GUI' });
  const hy = ys + P.hy, hw = P.hw;
  if (P.fairing) {
    for (const sd of SIDES) gd.part(`Demi-guidon ${sd.m}`, S.rod([xi, yi + 30, sd.s * 120], [xi - 80, yi + 40, sd.s * hw], 22), { mat: 'aluminium', color: 0x222222 });
  } else {
    gd.part(`Guidon Ø${P.custom ? '32 large' : '28 conique'}`, S.pipe([[xs - 40 - (P.custom ? 120 : 0), hy, -hw], [xs - 10, hy - 10, -hw * 0.53], [xs, hy - 30, 0], [xs - 10, hy - 10, hw * 0.53], [xs - 40 - (P.custom ? 120 : 0), hy, hw]], 28), { mat: P.custom ? 'chrome' : 'aluminium', color: P.custom ? undefined : 0x222222 });
    for (const sd of SIDES) {
      gd.part(`Pontet de guidon ${sd.m}`, S.box(40, hy - ys - 10, 40), { pos: [xs, (ys + hy) / 2, sd.s * 40], mat: 'aluminium' });
      for (const dx of [-14, 14]) gd.part(`Vis de pontet ${sd.c}${dx < 0 ? '1' : '2'}`, S.capScrew(8, 35, 'y'), { pos: [xs + dx, hy + 5, sd.s * 40], mat: 'acierHR', couple: 23 });
    }
  }
  const gx = P.fairing ? xi - 80 : xs - 40 - (P.custom ? 120 : 0), gy = P.fairing ? yi + 40 : hy;
  for (const sd of SIDES) {
    gd.part(`Poignée ${sd.f === 'droite' ? 'de gaz' : 'gauche'}`, S.cyl(34, 130, 'z'), { pos: [gx, gy, sd.s * (hw - 60)], mat: 'caoutchouc' });
    gd.part(`Embout de guidon ${sd.m}`, S.cyl(32, 30, 'z'), { pos: [gx, gy, sd.s * (hw + 15)], mat: 'aluminium' });
    gd.part(sd.s > 0 ? 'Levier de frein avant' : 'Levier d\'embrayage', S.box(30, 12, 180), { pos: [gx + 70, gy, sd.s * (hw - 100)], rot: [0, sd.s * 10, 0], mat: 'aluminium' });
    gd.part(sd.s > 0 ? 'Maître-cylindre de frein avant' : 'Maître-cylindre d\'embrayage', S.cyl(30, 70, 'x'), { pos: [gx + 30, gy + 10, sd.s * (hw - 160)], mat: 'aluminium' });
    gd.part(`Commodo ${sd.m}`, S.box(60, 60, 50), { pos: [gx + 10, gy, sd.s * (hw - 150)], mat: 'abs' });
    if (!P.fairing) {
      gd.part(`Rétroviseur ${sd.m}`, S.ellipsoid(40, 80, 140), { pos: [gx + 20, gy + 220, sd.s * (hw - 50)], mat: P.custom ? 'chrome' : 'abs' });
      gd.part(`Tige de rétroviseur ${sd.m}`, S.rod([gx + 20, gy + 10, sd.s * (hw - 150)], [gx + 20, gy + 190, sd.s * (hw - 60)], 10), { mat: 'chrome' });
    }
  }
  gd.part('Réservoir de liquide de frein avant', S.box(40, 40, 50), { pos: [gx + 30, gy + 45, hw - 180], mat: 'composite' });
  gd.part(P.custom ? 'Compteur rond analogique' : 'Tableau de bord TFT 5"', P.custom ? S.cyl(110, 50, 'y') : S.box(30, 100, 140), { pos: [xs + 25, ys + (P.fairing ? 60 : 120), 0], rot: [0, 0, -20], mat: 'ecran' });
  gd.part(P.custom ? 'Phare rond 7"' : 'Phare à LED', P.custom ? S.cyl(180, 120, 'x') : S.ellipsoid(150, 170, 200), { pos: [xs + 120, ys - 70, 0], mat: 'feuBlanc' });
  if (P.custom) gd.part('Cerclage de phare', S.tube(190, 170, 30, 'x'), { pos: [xs + 175, ys - 70, 0], mat: 'chrome' });
  gd.part('Support de phare', S.box(30, 120, 220), { pos: [xs + 55, ys - 70, 0], mat: 'aluminium' });
  for (const sd of SIDES) gd.part(`Clignotant avant ${sd.m}`, S.ellipsoid(60, 30, 30), { pos: [xs + 80, ys - 130, sd.s * 140], mat: 'feuOrange' });

  // ------------------------------------------------------------------ Moteur
  const mo = m.group(E.label, { code: 'MOT', desc: E.desc, pos: up, layer: 'meca' });
  const ct = mo.group('Carters', { code: 'MOT' });
  const cw = P.engine === 'i4' ? 380 : 300;
  ct.part('Demi-carter supérieur', S.box(400, 140, cw), { pos: [20, 520, 0], mat: 'aluminium', color: 0x3a3d42 });
  ct.part('Demi-carter inférieur', S.box(380, 130, cw), { pos: [10, 385, 0], mat: 'aluminium', color: 0x3a3d42 });
  ct.part('Carter d\'huile', S.box(280, 60, cw - 80), { pos: [40, 290, 0], mat: 'aluminium', color: 0x3a3d42 });
  ct.part('Bouchon de vidange', S.bolt(12, 15, 'y'), { pos: [40, 252, 30], rot: [180, 0, 0], mat: 'acier', couple: 20 });
  ct.part('Carter d\'embrayage (droit)', S.cyl(230, 40, 'z'), { pos: [-30, 450, cw / 2 + 20], mat: P.custom ? 'chrome' : 'aluminium', color: P.custom ? undefined : 0x3a3d42 });
  boltCircle(ct, { n: 10, pcd: 210, d: 6, L: 35, axis: 'z', at: [-30, 450, cw / 2 + 42], dir: 1, label: 'Vis de carter d\'embrayage', kind: 'cap', couple: 10 });
  ct.part('Carter d\'alternateur (gauche)', S.cyl(200, 50, 'z'), { pos: [80, 450, -(cw / 2 + 25)], mat: P.custom ? 'chrome' : 'aluminium', color: P.custom ? undefined : 0x3a3d42 });
  boltCircle(ct, { n: 8, pcd: 180, d: 6, L: 35, axis: 'z', at: [80, 450, -(cw / 2 + 52)], dir: -1, label: 'Vis de carter d\'alternateur', kind: 'cap', couple: 10 });
  ct.part('Filtre à huile', S.cyl(65, 70, 'x'), { pos: [230, 360, 60], mat: 'peinture', color: 0x222222 });
  ct.part('Hublot de niveau d\'huile', S.cyl(28, 6, 'z'), { pos: [-60, 380, cw / 2 + 42], mat: 'verre' });

  const ports = []; // sorties d'échappement (repère local moteur)
  let cylN = 0;
  for (const bank of E.banks) {
    const cy = mo.group(bank.name, { code: 'MOT', pos: [bank.pos[0], bank.pos[1], 0], rot: [0, 0, bank.rot] });
    const w = Math.max(...bank.zs.map(Math.abs)) * 2 + E.bore + 40;
    const bw = E.bore + 62;
    cy.part(bank.zs.length > 1 ? 'Bloc-cylindres' : 'Cylindre', S.box(bw, 190, w), { pos: [0, 95, 0], mat: 'aluminium', color: 0x3a3d42 });
    if (P.custom) for (let f = 0; f < 8; f++) cy.part(`Ailette de refroidissement ${f + 1}`, S.box(bw + 50, 5, w + 40), { pos: [0, 25 + f * 22, 0], mat: 'aluminium', color: 0x2b2d31 });
    cy.part('Joint d\'embase', S.box(bw, 1, w), { pos: [0, 0, 0], mat: 'acier' });
    cy.part(`Culasse DACT ${bank.zs.length * 4} soupapes`, S.box(bw + 20, 100, w + 20), { pos: [0, 240, 0], mat: 'aluminium', color: 0x3a3d42 });
    cy.part('Couvre-culasse', S.box(bw + 10, 45, w + 10), { pos: [0, 312, 0], mat: P.custom ? 'chrome' : 'aluminium', color: P.custom ? undefined : 0xc0c4c9 });
    for (const z of bank.zs) {
      cylN++;
      cy.part(`Piston ${cylN}`, S.cyl(E.bore, 55, 'y'), { pos: [0, 120, z], mat: 'aluminium' });
      cy.part(`Bielle ${cylN}`, S.rod([0, 100, z], [0, -110, z], 20), { mat: 'titane' });
      cy.part(`Bougie d'allumage ${cylN}`, S.cyl(12, 60, 'y'), { pos: [0, 315, z], mat: 'ceramique' });
      cy.part(`Bobine crayon ${cylN}`, S.cyl(25, 40, 'y'), { pos: [0, 350, z], mat: 'plastique' });
      for (const k of ['adm.', 'éch.']) for (const v of ['a', 'b']) cy.part(`Soupape ${k} cyl.${cylN}${v}`, S.cyl(5.5, 100, 'y'), { pos: [k === 'adm.' ? -30 : 30, 220, z + (v === 'a' ? -14 : 14)], mat: 'inox' });
      for (let g = 0; g < 4; g++) cy.part(`Goujon de culasse cyl.${cylN}-${g + 1}`, S.nut(10), { pos: [(g % 2 ? 1 : -1) * (bw / 2 - 12), 292, z + (g < 2 ? -1 : 1) * (E.bore / 2 + 5)], mat: 'acierHR', couple: '20 N·m + 120°' });
      const r = bank.rot * DEGR, lx = bw / 2 + 20, lyy = 230;
      ports.push({ n: cylN, x: bank.pos[0] + lx * Math.cos(r) - lyy * Math.sin(r), y: bank.pos[1] + lx * Math.sin(r) + lyy * Math.cos(r), z });
    }
    cy.part('Arbre à cames d\'admission', S.cyl(24, w, 'z'), { pos: [-30, 270, 0], mat: 'acier' });
    cy.part('Arbre à cames d\'échappement', S.cyl(24, w, 'z'), { pos: [30, 270, 0], mat: 'acier' });
  }
  const eq = mo.group('Équipage & transmission primaire', { code: 'MOT' });
  eq.part(P.engine === 'twin' ? 'Vilebrequin calé à 270°' : 'Vilebrequin', S.cyl(40, cw, 'z'), { pos: [70, 480, 0], mat: 'acierHR' });
  eq.part('Arbre d\'équilibrage', S.cyl(30, cw - 20, 'z'), { pos: [150, 430, 0], mat: 'acierHR' });
  eq.part('Embrayage multidisque', S.cyl(150, 70, 'z'), { pos: [-30, 450, cw / 2 - 30], mat: 'acier' });
  eq.part('Boîte 6 rapports – arbre primaire', S.cyl(28, cw - 20, 'z'), { pos: [-60, 520, 0], mat: 'acierHR' });
  eq.part('Boîte 6 rapports – arbre secondaire', S.cyl(30, cw, 'z'), { pos: [-120, 440, 0], mat: 'acierHR' });
  const adm = mo.group('Admission & injection', { code: 'ADM' });
  if (P.engine === 'vtwin') adm.part('Corps papillon unique Ø54', S.cyl(65, 90, 'z'), { pos: [40, 830, 120], mat: 'aluminium' });
  else for (const p of ports) adm.part(`Corps papillon ${P.engine === 'i4' ? 'Ø48' : 'Ø44'} cyl.${p.n}`, S.cyl(55, 80, 'x'), { pos: [-40, 820, p.z], mat: 'aluminium' });
  adm.part('Boîte à air', S.box(260, 150, P.engine === 'i4' ? 380 : 300), { pos: [-110, 905, 0], mat: 'plastique' });
  adm.part('Filtre à air', S.box(200, 30, 250), { pos: [-110, 900, 0], mat: 'tissu', color: 0xe9d8a0 });
  if (P.custom) adm.part('Couvercle de filtre chromé', S.cyl(220, 60, 'z'), { pos: [40, 830, 170], mat: 'chrome' });
  const ref = mo.group('Refroidissement', { code: 'REF' });
  ref.part('Radiateur', S.box(40, 300, P.engine === 'i4' ? 460 : 380), { pos: [330, 600, 0], rot: [0, 0, -10], mat: 'aluminium', color: 0x222222 });
  ref.part('Ventilateur électrique', S.cyl(170, 40, 'x'), { pos: [300, 600, 0], mat: 'plastique' });
  ref.part('Pompe à eau', S.cyl(80, 40, 'z'), { pos: [60, 330, cw / 2 + 10], mat: 'aluminium' });
  ref.part('Durite de radiateur', S.pipe([[330, 750, 120], [250, 750, 140], [200, 700, 130]], 28), { mat: 'caoutchouc' });

  const ech = m.group('Échappement', { code: 'ECH', pos: up, layer: 'meca' });
  for (const p of ports) {
    ech.part(`Collecteur cylindre ${p.n}`, S.pipe([[p.x, p.y, p.z], [Math.max(p.x, 250) + 60, p.y - 120, p.z], [330, 380, p.z * 0.8], [250, 260, p.z * 0.5], [0, 240, 0]], 42), { mat: P.custom ? 'chrome' : 'inox' });
    for (const k of [1, 2]) ech.part(`Écrou de collecteur cyl.${p.n}-${k}`, S.nut(8, 'x'), { pos: [p.x - 5, p.y + 10, p.z + (k === 1 ? -22 : 22)], mat: 'laiton', couple: 20 });
  }
  ech.part('Précatalyseur', S.box(260, 110, 200), { pos: [-60, 245, 40], mat: 'inox' });
  ech.part('Tube de liaison', S.pipe([[-190, 250, 80], [-300, 300, 130], [-420, 380, 160]], 50), { mat: 'inox' });
  if (P.fairing) ech.part('Silencieux court (sous moteur)', S.box(300, 140, 160), { pos: [-250, 270, 140], mat: 'titane' });
  else ech.part('Silencieux', S.cyl(120, P.custom ? 600 : 380, 'x', 32, P.custom ? 110 : 100), { pos: [P.custom ? -640 : -560, P.custom ? 360 : 430, 170], rot: [0, 0, P.custom ? 3 : 15], mat: P.custom ? 'chrome' : 'inox' });
  ech.part('Collier de silencieux', S.tube(130, 118, 30, 'x'), { pos: [-430, 395, 170], rot: [0, 0, 15], mat: 'inox' });

  // ------------------------------------------------------------------ Partie cycle arrière
  const tar = m.group('Train arrière', { code: 'TAR', pos: up, layer: 'sol' });
  const bo = tar.group(P.custom ? 'Bras oscillant acier' : 'Bras oscillant aluminium', { code: 'TAR' });
  for (const sd of SIDES) {
    bo.part(`Branche ${sd.f}`, S.rod([-200, 480, sd.s * 105], [XR, YR, sd.s * 105], 60, 40), { mat: P.custom ? 'acier' : 'aluminium', color: P.custom ? FRAME : undefined });
    bo.part(`Tendeur ${P.custom ? 'de courroie' : 'de chaîne'} ${sd.m}`, S.box(50, 30, 15), { pos: [XR - 20, YR, sd.s * 140], mat: 'aluminium' });
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
  wheel(tar, 'Roue arrière', 1, { pos: [XR, YR, 0], tire: P.rear, code: 'ROU', hubD: 90, hubL: 150, cap: false, ...wOpts });
  const far = tar.group('Frein arrière', { code: 'FRE' });
  far.part('Disque arrière Ø245', S.tube(245, 110, 5, 'z', 48), { pos: [XR, YR, 92], mat: 'inox' });
  boltCircle(far, { n: 5, pcd: 90, d: 8, L: 20, axis: 'z', at: [XR, YR, 97], dir: 1, label: 'Vis de disque arrière', kind: 'cap', couple: 30 });
  far.part('Étrier flottant 2 pistons', S.box(70, 100, 50), { pos: [XR + 70, YR + 85, 92], rot: [0, 0, -40], mat: 'aluminium', color: 0x222222 });
  far.part('Support d\'étrier arrière', S.box(160, 40, 10), { pos: [XR + 90, YR + 60, 120], rot: [0, 0, -30], mat: 'aluminium' });

  const tra = tar.group(P.custom ? 'Transmission secondaire par courroie' : 'Transmission secondaire', { code: 'TRS' });
  tra.part(P.custom ? 'Poulie de sortie de boîte 30 dents' : 'Pignon de sortie de boîte 16 dents', S.cyl(P.custom ? 110 : 80, P.custom ? 30 : 18, 'z', P.custom ? 30 : 16), { pos: [-140, 440, -115], mat: 'acierHR' });
  tra.part('Écrou de pignon', S.nut(20, 'z'), { pos: [-140, 440, -132], mat: 'acierHR', couple: 80 });
  tra.part(P.custom ? 'Poulie arrière 68 dents' : 'Couronne 45 dents', S.cyl(P.custom ? 260 : 230, P.custom ? 30 : 8, 'z', 45), { pos: [XR, YR, -115], mat: 'aluminium', color: 0x222222 });
  boltCircle(tra, { n: 6, pcd: 140, d: 10, L: 30, axis: 'z', at: [XR, YR, -122], dir: -1, label: 'Écrou de couronne', kind: 'nut', couple: 50 });
  tra.part('Porte-couronne (moyeu amortisseur)', S.cyl(150, 40, 'z'), { pos: [XR, YR, -95], mat: 'aluminium' });
  const cr = P.custom ? 130 : 117;
  tra.part(P.custom ? 'Courroie crantée 28 mm' : 'Chaîne 525', S.pipe([[-140, 440 + (P.custom ? 55 : 42), -115], [(XR - 140) / 2, (YR + 440) / 2 + 70, -115], [XR, YR + cr, -115], [XR - cr * 0.95, YR + 30, -115], [XR - 60, YR - cr * 0.9, -115], [(XR - 140) / 2, (YR + 440) / 2 - 60, -115], [-140, 440 - (P.custom ? 55 : 42), -115], [-100, 440, -115]], P.custom ? 16 : 12, true), { mat: P.custom ? 'caoutchouc' : 'acier' });
  tra.part('Guide-chaîne / protège-courroie', S.box(150, 15, 15), { pos: [-260, 430, -115], mat: 'plastique' });
  tra.part('Cache-pignon', S.box(120, 120, 20), { pos: [-140, 450, -140], mat: 'abs' });

  // ------------------------------------------------------------------ Habillage & équipements
  const hab = m.group('Habillage & selle', { code: 'HAB', pos: up, layer: 'ext' });
  hab.part(P.custom ? 'Réservoir goutte d\'eau 13 L' : P.adv ? 'Réservoir de carburant 20 L' : 'Réservoir de carburant 14 L', S.extrude([[380, 920], [330, 1060], [120, P.adv ? 1140 : 1110], [-120, 1060], [-190, 900], [-80, 860], [300, 880]], P.adv ? 460 : P.custom ? 330 : 360, 60), { mat: 'peinture', color: PAINT, desc: 'Réservoir acier' });
  hab.part('Bouchon de réservoir', S.cyl(80, 15, 'y'), { pos: [120, (P.adv ? 1140 : 1110) + 2, 0], mat: P.custom ? 'chrome' : 'aluminium' });
  hab.part('Pompe à carburant', S.cyl(90, 150, 'y'), { pos: [0, 940, 0], mat: 'plastique' });
  if (P.custom) {
    hab.part('Selle solo basse', S.extrude([[-150, 860], [-200, 880], [-460, 870], [-540, 940], [-560, 880], [-220, 830]], 340, 30), { mat: 'cuir', color: 0x3a2418 });
    hab.part('Garde-boue arrière enveloppant', S.extrude(arcPart(XR, YR, RR + 20, RR + 32, 0.05, 0.75), 230), { mat: 'peinture', color: PAINT });
    hab.part('Dosseret passager (sissy bar)', S.pipe([[-640, 870, -110], [-700, 1250, -100], [-700, 1250, 100], [-640, 870, 110]], 18), { mat: 'chrome' });
    hab.part('Feu arrière rond', S.cyl(80, 30, 'x'), { pos: [XR - RR - 20, YR + 150, 0], mat: 'feuRouge' });
    hab.part('Plaque d\'immatriculation (latérale)', S.box(210, 170, 4), { pos: [XR, YR + 50, 250], mat: 'aluminium', color: 0xffffff });
  } else {
    hab.part('Selle pilote', S.extrude([[-130, 880], [-170, 920], [-500, 930], [-560, 970], [-560, 900], [-200, 860]], P.adv ? 330 : 300, 25), { pos: P.adv ? [0, 30, 0] : undefined, mat: 'cuir', color: 0x161616 });
    hab.part('Selle passager', S.extrude([[-560, 960], [-560, 1000], [-850, 1010], [-870, 960]], 240, 20), { mat: 'cuir', color: 0x161616 });
    hab.part('Coque arrière', S.extrude([[-560, 880], [-900, 980], [-920, 920], [-600, 860]], 220, 15), { mat: 'abs', color: PAINT });
    hab.part('Feu arrière à LED', S.box(30, 40, 120), { pos: [-915, 945, 0], mat: 'feuRouge' });
    hab.part('Support de plaque', S.box(300, 15, 100), { pos: [-950, 800, 0], rot: [0, 0, 40], mat: 'abs' });
    hab.part('Plaque d\'immatriculation', S.box(4, 170, 210), { pos: [-1050, 720, 0], rot: [0, 0, -10], mat: 'aluminium', color: 0xffffff });
    hab.part('Garde-boue arrière (lèche-roue)', S.extrude(arcPart(XR, YR, RR + 20, RR + 30, 0.25, 0.7), 190), { mat: 'abs' });
    for (const sd of SIDES) hab.part(`Écope de réservoir ${sd.f}`, S.box(220, 220, 20), { pos: [330, 840, sd.s * 195], rot: [0, sd.s * 15, -15], mat: 'abs', color: 0x222222 });
  }
  for (const sd of SIDES) hab.part(`Clignotant arrière ${sd.m}`, S.ellipsoid(60, 30, 30), { pos: [-950, 820, sd.s * 120], mat: 'feuOrange' });
  hab.part('Écope de radiateur', S.box(20, 280, 420), { pos: [360, 600, 0], rot: [0, 0, -10], mat: 'abs', color: 0x222222 });

  if (P.fairing) {
    const car = m.group('Carénage intégral', { code: 'CRN', pos: up, layer: 'ext' });
    car.part('Tête de fourche', S.extrude([[xs + 230, ys - 260], [xs + 250, ys - 60], [xs + 110, ys + 110], [xs - 20, ys + 90], [xs + 20, ys - 240]], 440, 40), { mat: 'peinture', color: PAINT });
    car.part('Bulle', S.box(260, 6, 300), { pos: [xs + 80, ys + 140, 0], rot: [0, 0, 40], mat: 'polycarbonate' });
    for (const sd of SIDES) {
      car.part(`Flanc de carénage ${sd.m}`, S.extrude([[430, 820], [440, 380], [250, 260], [-120, 280], [-60, 640], [200, 800]], 8, 2), { pos: [0, 0, sd.s * 215], mat: 'peinture', color: PAINT });
      car.part(`Entrée d'air dynamique ${sd.f}`, S.cyl(80, 200, 'x'), { pos: [xs + 210, ys - 160, sd.s * 120], mat: 'abs', color: 0x111111 });
      for (let k = 0; k < 5; k++) car.part(`Vis de carénage ${sd.c}${k + 1}`, S.capScrew(5, 16, 'z'), { pos: [380 - k * 110, 720 - k * 80, sd.s * 222], rot: axisRot('z', sd.s), mat: 'inox', couple: 4 });
      car.part(`Rétroviseur de carénage ${sd.m}`, S.ellipsoid(80, 60, 130), { pos: [xs + 90, ys + 20, sd.s * 260], mat: 'peinture', color: PAINT });
    }
    car.part('Sabot inférieur', S.box(420, 20, 400), { pos: [150, 255, 0], mat: 'peinture', color: PAINT });
    car.part('Araignée de carénage (support)', S.box(80, 260, 200), { pos: [xs + 80, ys - 120, 0], mat: 'aluminium', layer: 'struct' });
  }
  if (P.adv) {
    const pr = m.group('Protections & bagagerie', { code: 'ADV', pos: up, layer: 'ext' });
    pr.part('Sabot de protection moteur', S.box(520, 8, 300), { pos: [120, 230, 0], rot: [0, 0, 8], mat: 'aluminium' });
    for (const sd of SIDES) pr.part(`Pare-carters tubulaire ${sd.m}`, S.pipe([[450, 880, sd.s * 120], [430, 720, sd.s * 300], [250, 380, sd.s * 290], [100, 330, sd.s * 160]], 25), { mat: 'acier', color: 0x222222 });
    pr.part('Bulle haute réglable', S.box(380, 5, 420), { pos: [xs + 40, ys + 220, 0], rot: [0, 0, 65], mat: 'polycarbonate' });
    pr.part('Porte-bagages arrière', S.box(380, 15, 280), { pos: [-750, 1030, 0], mat: 'aluminium' });
    for (const sd of SIDES) pr.part(`Support de valise ${sd.m}`, S.pipe([[-450, 1000, sd.s * 140], [-500, 650, sd.s * 220], [-900, 650, sd.s * 220], [-900, 1000, sd.s * 140]], 18), { mat: 'acier', color: 0x222222 });
    pr.part('Protège-mains gauche', S.box(150, 50, 60), { pos: [gx + 80, gy, -hw + 10], mat: 'abs' });
    pr.part('Protège-mains droit', S.box(150, 50, 60), { pos: [gx + 80, gy, hw - 10], mat: 'abs' });
  }

  const eqp = m.group('Commandes au pied & béquille', { code: 'PIE', pos: up, layer: 'meca' });
  const pegX = P.custom ? 300 : P.fairing ? -300 : -230, pegY = P.custom ? 360 : P.fairing ? 420 : 340;
  for (const sd of SIDES) {
    eqp.part(`Platine de repose-pieds ${sd.m}`, S.box(220, 120, 12), { pos: [pegX - 30, pegY + 40, sd.s * 160], mat: 'aluminium' });
    eqp.part(`Repose-pied pilote ${sd.m}${P.custom ? ' (commandes avancées)' : ''}`, S.cyl(25, 110, 'z'), { pos: [pegX, pegY, sd.s * 220], mat: P.custom ? 'chrome' : 'aluminium' });
    eqp.part(`Repose-pied passager ${sd.m}`, S.cyl(22, 90, 'z'), { pos: [-520, 480, sd.s * 190], mat: 'aluminium' });
    for (const k of [1, 2]) eqp.part(`Vis de platine ${sd.c}${k}`, S.capScrew(8, 25, 'z'), { pos: [pegX - 30 + (k === 1 ? -60 : 60), pegY + 60, sd.s * 168], rot: axisRot('z', sd.s), mat: 'acierHR', couple: 25 });
  }
  eqp.part('Sélecteur de vitesses', S.box(160, 15, 15), { pos: [pegX + 90, pegY + 20, -200], rot: [0, 0, -10], mat: 'aluminium' });
  eqp.part('Pédale de frein arrière', S.box(170, 15, 15), { pos: [pegX + 50, pegY + 5, 200], rot: [0, 0, 10], mat: 'aluminium' });
  eqp.part('Maître-cylindre de frein arrière', S.cyl(25, 80, 'y'), { pos: [-260, 420, 175], mat: 'aluminium' });
  eqp.part('Béquille latérale', S.rod([-120, 330, -130], [-80, 40 - LIFT, -330], 25), { mat: 'acier', color: FRAME });
  eqp.part('Ressort de béquille', S.spring(14, 3, 90, 12, 'x'), { pos: [-140, 320, -140], mat: 'acier' });
  if (P.adv) eqp.part('Béquille centrale', S.rod([-150, 330, 0], [-150, 20 - LIFT, 0], 30), { mat: 'acier', color: FRAME });

  const el = m.group('Électricité', { code: 'ELE', pos: up, layer: 'meca' });
  el.part('Batterie lithium 12 V', S.box(150, 90, 90), { pos: [-450, 850, 0], mat: 'electrolyte' });
  el.part('Calculateur (ECU)', S.box(140, 30, 100), { pos: [-620, 900, 0], mat: 'aluminium' });
  el.part('Régulateur de tension', S.box(80, 25, 60), { pos: [-640, 860, 60], mat: 'aluminium' });
  el.part('Avertisseur sonore', S.cyl(70, 30, 'x'), { pos: [380, 500, 0], mat: 'abs' });
  el.part('Faisceau principal', S.pipe([[430, 860, 30], [200, 880, 60], [-200, 820, 80], [-600, 870, 40]], 14), { mat: 'plastique' });
  return m;
}
