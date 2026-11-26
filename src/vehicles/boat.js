// Bateaux – générateur paramétrique (cotes en mm)
// Repère : X vers l'étrave (avant), Y haut, Z tribord (droite). Origine au niveau de la flottaison, au milieu de la longueur.
// Couches : pont & superstructures → aménagements → moteur & équipements → appendices & propulsion → coque.
import * as THREE from 'three';
import { Assembly, S, SIDES, boltCircle, boltRow, axisRot, airfoil } from '../core/builder.js';
import { inlineEngine } from '../core/parts.js';

export const BOAT_TYPES = {
  semirigide: {
    label: 'Semi-rigide 6,5 m', desc: 'Bateau semi-rigide 6,5 m – coque en V profond en polyester – flotteurs Hypalon – moteur hors-bord 150 ch – 12 personnes',
    makers: ['Zodiac (Medline)', 'Bombard (Sunrider)', 'Brig (Eagle)', 'Highfield (Sport)', 'Williams (Sportjet)', '3D Tender (Lux)', 'Valiant (V-650)'],
  },
  voilier: {
    label: 'Voilier de croisière 9,5 m', desc: 'Voilier monocoque 9,5 m – gréement en tête de mât (sloop) – quille en fonte – moteur inboard diesel 2 cylindres 20 ch – 6 couchettes',
    makers: ['Beneteau (Oceanis)', 'Jeanneau (Sun Odyssey)', 'Dufour', 'Hanse', 'Bavaria (C)', 'Dehler', 'Elan (Impression)'],
  },
  vedette: {
    label: 'Vedette à moteur 8 m', desc: 'Bateau à moteur open/cabine 8 m – coque planante – moteur inboard diesel 6 cylindres 220 ch avec embase Z-drive – 4 couchettes',
    makers: ['Beneteau (Antares / Flyer)', 'Jeanneau (Merry Fisher / Cap Camarat)', 'Quicksilver (Activ)', 'Sea Ray (SPX)', 'Bayliner (VR)', 'Pardo', 'Axopar'],
  },
};

/**
 * Coque : surface réglée entre sections transversales.
 * stations : [{ x, b (demi-largeur au livet), sheer (y du livet), keel (y de la quille), dead (relevé de varangue 0..1) }]
 */
function hullGeo(stations, n = 14) {
  const ring = (st) => {
    const pts = [];
    for (let j = 0; j <= n * 2; j++) {
      const t = j / n - 1; // -1 bâbord livet → 0 quille → 1 tribord livet
      const a = Math.abs(t);
      const z = Math.sign(t) * st.b * Math.pow(a, st.round ?? 0.8);
      const y = st.keel + (st.sheer - st.keel) * (st.dead * a + (1 - st.dead) * a * a);
      pts.push(new THREE.Vector3(st.x, y, z));
    }
    return pts;
  };
  const rings = stations.map(ring);
  const pos = [];
  for (let i = 0; i < rings.length - 1; i++) {
    const A = rings[i], B = rings[i + 1];
    for (let j = 0; j < A.length - 1; j++) {
      pos.push(...A[j].toArray(), ...A[j + 1].toArray(), ...B[j].toArray(), ...B[j].toArray(), ...A[j + 1].toArray(), ...B[j + 1].toArray());
    }
  }
  // Tableau arrière (fermeture de la première section)
  const T = rings[0];
  const c = new THREE.Vector3(stations[0].x, stations[0].sheer, 0);
  for (let j = 0; j < T.length - 1; j++) pos.push(...c.toArray(), ...T[j + 1].toArray(), ...T[j].toArray());
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  g.computeBoundingBox();
  const bb = g.boundingBox;
  return { geo: g, dims: { 'Longueur de coque': Math.round(bb.max.x - bb.min.x), 'Largeur au livet': Math.round(bb.max.z - bb.min.z), Creux: Math.round(bb.max.y - bb.min.y) } };
}

/** Pont plat suivant le livet (contour en XZ), épaisseur t, au niveau y */
function deckGeo(stations, t, inset = 0) {
  const pts = [...stations.map((s) => [s.x, -(s.b - inset)]), ...[...stations].reverse().map((s) => [s.x, s.b - inset])];
  const shape = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, z)));
  const g = new THREE.ExtrudeGeometry(shape, { depth: t, bevelEnabled: false, curveSegments: 4 });
  g.rotateX(Math.PI / 2);
  g.computeBoundingBox();
  const bb = g.boundingBox;
  return { geo: g, dims: { Longueur: Math.round(bb.max.x - bb.min.x), Largeur: Math.round(bb.max.z - bb.min.z), Épaisseur: t } };
}

/** Voile triangulaire (points dans le plan XY) */
function sailGeo(a, b, c, t = 2) {
  const shape = new THREE.Shape([a, b, c].map(([x, y]) => new THREE.Vector2(x, y)));
  const g = new THREE.ExtrudeGeometry(shape, { depth: t, bevelEnabled: false });
  g.translate(0, 0, -t / 2);
  const L = (p, q) => Math.round(Math.hypot(p[0] - q[0], p[1] - q[1]));
  return { geo: g, dims: { Guindant: L(a, b), Chute: L(b, c), Bordure: L(c, a), 'Surface (m²)': Math.round(Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1])) / 2 / 1e5) / 10 } };
}

/** Interpolation des stations de coque */
function stationsOf(L, B, sheerAft, sheerFwd, keelAft, keelMid, keelFwd, dead, n = 12) {
  const res = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n; // 0 = tableau arrière, 1 = étrave
    const x = -L / 2 + u * L;
    const bf = u < 0.55 ? 1 - 0.18 * (1 - u / 0.55) ** 2 : Math.cos(((u - 0.55) / 0.45) * Math.PI / 2) ** 0.8;
    const b = Math.max(B / 2 * bf, 5);
    const sheer = sheerAft + (sheerFwd - sheerAft) * u ** 1.6;
    const keel = u < 0.5 ? keelAft + (keelMid - keelAft) * (u / 0.5) : keelMid + (keelFwd - keelMid) * ((u - 0.5) / 0.5) ** 1.5;
    res.push({ x, b, sheer, keel: Math.min(keel, sheer - 30), dead: dead + (1 - dead) * Math.max(0, (u - 0.6) / 0.4) * 0.6, round: u > 0.85 ? 1 : 0.8 });
  }
  return res;
}

export function buildBoat(type = 'voilier') {
  if (type === 'semirigide') return buildRib(BOAT_TYPES.semirigide);
  if (type === 'vedette') return buildMotorboat(BOAT_TYPES.vedette);
  return buildSailboat(BOAT_TYPES.voilier);
}

// ============================================================================ Semi-rigide
function buildRib(P) {
  const L = 6000, B = 2000;
  const st = stationsOf(L, B, 450, 650, -350, -380, 400, 0.85);
  const b = new Assembly(P.label, { prefix: 'BT', code: 'GEN', layer: 'meca', desc: `${P.desc} – longueur hors-tout 6 500 mm – largeur hors-tout 2 550 mm – angle de V 22°` });
  const co = b.group('Coque', { code: 'COQ', layer: 'struct' });
  co.part('Coque polyester (stratifié verre/polyester)', hullGeo(st), { mat: 'composite', color: 0xf2f2f2, desc: 'Coque en V profond 22° – stratifié 8 mm en fond' });
  co.part('Contre-moule / pont autovideur', deckGeo(st.slice(0, 12), 20, 40), { pos: [0, 120, 0], mat: 'composite', color: 0xd8d4c8 });
  co.part('Tableau arrière renforcé', S.box(60, 800, B - 300), { pos: [-L / 2 + 30, 50, 0], mat: 'composite', color: 0xf2f2f2, desc: 'Âme contreplaqué marine 40 mm – arbre XL' });
  for (let i = 0; i < 5; i++) co.part(`Lisse de fond ${i + 1}`, S.box(L * 0.5, 40, 30), { pos: [-L * 0.18, -230 + Math.abs(i - 2) * 110, (i - 2) * 280], mat: 'composite' });
  for (let i = 0; i < 6; i++) co.part(`Varangue ${i + 1}`, S.box(40, 160, B * 0.4 * (1 - i * 0.08)), { pos: [-L / 2 + 600 + i * 650, -150, 0], mat: 'composite' });
  co.part('Anneau de remorquage d\'étrave', S.torus(60, 14, 'z'), { pos: [L / 2 - 40, 350, 0], mat: 'inox' });

  const fl = b.group('Flotteurs', { code: 'FLO', layer: 'ext' });
  const tubeD = 520;
  const half = (s) => [...st.map((q) => [q.x, q.sheer + tubeD * 0.15, s * (q.b + tubeD * 0.3)]).slice(0, 12), [L / 2 + 150, 700, 0]];
  const nComp = 5;
  for (const sd of SIDES) {
    const pts = half(sd.s);
    fl.part(`Flotteur ${sd.f}`, S.pipe(pts, tubeD), { mat: 'caoutchouc', color: 0x3a3d42, desc: 'Hypalon/Néoprène 1 670 dtex – 5 compartiments étanches' });
    fl.part(`Cône arrière de flotteur ${sd.m}`, S.cone(tubeD, 400, 'x'), { pos: [-L / 2 - 200, pts[0][1], pts[0][2]], rot: [0, 0, 180], mat: 'caoutchouc', color: 0x3a3d42 });
    fl.part(`Bande de frottement ${sd.f}`, S.pipe(pts.map((p) => [p[0], p[1] - tubeD * 0.15, p[2] * 1.12]), 60), { mat: 'caoutchouc', color: 0x111111 });
    for (let k = 0; k < nComp; k++) {
      const p = pts[Math.round(1 + k * 2)];
      fl.part(`Valve de gonflage ${sd.c}${k + 1}`, S.cyl(60, 25, 'y'), { pos: [p[0], p[1] + tubeD / 2, p[2]], mat: 'plastique' });
    }
    for (let k = 0; k < 6; k++) { const p = pts[1 + k * 2]; fl.part(`Poignée de saisie ${sd.c}${k + 1}`, S.box(180, 30, 40), { pos: [p[0], p[1] + tubeD * 0.35, p[2] * 1.1], mat: 'caoutchouc', color: 0x111111 }); }
  }

  const pt = b.group('Aménagement de pont', { code: 'AMG', layer: 'int' });
  const cons = pt.group('Console de pilotage', { code: 'CON' });
  cons.part('Console', S.extrude([[-400, 140], [-400, 1150], [150, 1050], [350, 140]], 900, 20), { pos: [300, 0, 0], mat: 'composite', color: 0xf2f2f2 });
  cons.part('Pare-brise de console', S.box(8, 350, 900), { pos: [480, 1250, 0], rot: [0, 0, 25], mat: 'plexi' });
  cons.part('Volant', S.torus(350, 25, 'x'), { pos: [130, 1250, -200], rot: [0, 0, -35], mat: 'inox' });
  cons.part('Boîtier de direction mécanique', S.cyl(120, 120, 'x'), { pos: [250, 1150, -200], mat: 'aluminium' });
  cons.part('Commande moteur (inverseur + accélérateur)', S.box(150, 200, 100), { pos: [50, 1200, 300], mat: 'abs', color: 0x111111 });
  cons.part('Écran combiné GPS / sondeur 9"', S.box(30, 200, 280), { pos: [200, 1280, 150], rot: [0, 0, 30], mat: 'ecran' });
  cons.part('VHF fixe', S.box(150, 60, 180), { pos: [150, 1100, 250], rot: [0, 0, 30], mat: 'abs' });
  cons.part('Câble de direction', S.pipe([[250, 1150, -200], [300, 300, -300], [-L / 2 + 400, 250, -300], [-L / 2 - 50, 500, -200]], 18), { mat: 'plastique', layer: 'meca' });
  for (let k = 0; k < 4; k++) cons.part(`Vis de console ${k + 1}`, S.bolt(8, 40), { pos: [k < 2 ? -50 : 600, 145, k % 2 ? -400 : 400], rot: [180, 0, 0], mat: 'inox', couple: 20 });
  pt.part('Siège pilote / leaning post', S.box(600, 750, 900), { pos: [-600, 520, 0], mat: 'composite', color: 0xf2f2f2 });
  pt.part('Coussin de siège pilote', S.box(550, 120, 850), { pos: [-600, 960, 0], mat: 'cuir', color: 0xe8e2d0 });
  pt.part('Banquette arrière', S.box(500, 450, B - 300), { pos: [-L / 2 + 450, 370, 0], mat: 'composite', color: 0xf2f2f2 });
  pt.part('Coussin de banquette arrière', S.box(480, 100, B - 350), { pos: [-L / 2 + 450, 650, 0], mat: 'cuir', color: 0xe8e2d0 });
  pt.part('Coffre de pointe / bain de soleil avant', S.box(1300, 300, 1200), { pos: [L / 2 - 1300, 300, 0], mat: 'composite', color: 0xf2f2f2 });
  pt.part('Coussin bain de soleil', S.box(1250, 100, 1150), { pos: [L / 2 - 1300, 500, 0], mat: 'cuir', color: 0xe8e2d0 });
  pt.part('Arceau radar / ski', S.pipe([[-950, 300, -800], [-1050, 1700, -700], [-1050, 1800, 0], [-1050, 1700, 700], [-950, 300, 800]], 50), { mat: 'inox', layer: 'ext' });
  for (const sd of SIDES) for (const x of [-L / 2 + 200, L / 2 - 900]) pt.part(`Taquet d'amarrage ${sd.c}${x > 0 ? 'AV' : 'AR'}`, S.box(200, 40, 40), { pos: [x, 200, sd.s * (B / 2 - 150)], mat: 'inox', layer: 'ext' });
  pt.part('Échelle de bain télescopique', S.box(100, 30, 350), { pos: [-L / 2 - 50, 300, 500], mat: 'inox', layer: 'ext' });

  const mo = b.group('Moteur hors-bord 150 ch', { code: 'MOT', layer: 'meca' });
  const mx = -L / 2 - 250;
  mo.part('Capot moteur', S.ellipsoid(800, 650, 600), { pos: [mx - 150, 1050, 0], mat: 'peinture', color: 0x1b1d22, desc: '4 cylindres en ligne 2,8 L – injection électronique' });
  mo.part('Bloc moteur 4 cylindres', S.box(450, 550, 380), { pos: [mx - 150, 980, 0], mat: 'aluminium' });
  mo.part('Carter d\'arbre (arbre XL 635 mm)', S.box(250, 900, 160), { pos: [mx - 100, 300, 0], mat: 'peinture', color: 0x1b1d22 });
  mo.part('Embase (renvoi d\'angle)', S.lathe([[10, -300], [90, -250], [110, 0], [90, 250], [10, 300]], 24), { pos: [mx - 100, -360, 0], mat: 'peinture', color: 0x1b1d22 });
  mo.part('Plaque anti-cavitation', S.box(450, 10, 350), { pos: [mx - 120, -150, 0], mat: 'aluminium', color: 0x1b1d22 });
  mo.part('Aileron / dérive d\'embase', S.box(250, 300, 20), { pos: [mx - 100, -560, 0], mat: 'aluminium', color: 0x1b1d22 });
  const he = mo.group('Hélice inox 3 pales 15 1/4" × 17"', { code: 'HEL' });
  he.part('Moyeu d\'hélice', S.cyl(110, 200, 'x'), { pos: [mx - 380, -360, 0], mat: 'inox' });
  for (let k = 0; k < 3; k++) {
    const a = k * 120;
    he.part(`Pale ${k + 1}`, S.box(80, 170, 10), { pos: [mx - 380, -360 + Math.cos(a * Math.PI / 180) * 120, Math.sin(a * Math.PI / 180) * 120], rot: [a, 0, 25], mat: 'inox' });
  }
  he.part('Écrou d\'hélice', S.nut(22, 'x'), { pos: [mx - 490, -360, 0], mat: 'inox', couple: 75 });
  mo.part('Support de tableau (étrier)', S.box(150, 400, 500), { pos: [-L / 2 - 80, 700, 0], mat: 'aluminium', color: 0x1b1d22 });
  mo.part('Vérin de trim / relevage', S.cyl(70, 350, 'y'), { pos: [-L / 2 - 120, 450, 0], rot: [0, 0, 20], mat: 'chrome' });
  for (let k = 0; k < 4; k++) mo.part(`Boulon de fixation au tableau ${k + 1}`, S.bolt(12, 120, 'x'), { pos: [-L / 2 + 60, 550 + (k % 2) * 250, k < 2 ? -180 : 180], rot: axisRot('x', 1), mat: 'inox', couple: 54 });
  mo.part('Réservoir de carburant intégré (200 L)', S.box(1500, 250, 900), { pos: [-300, -50, 0], mat: 'aluminium', layer: 'struct' });
  mo.part('Batterie de démarrage 12 V', S.box(300, 220, 180), { pos: [-L / 2 + 300, 250, -600], mat: 'electrolyte' });
  return b;
}

// ============================================================================ Voilier
function buildSailboat(P) {
  const L = 9500, B = 3200;
  const st = stationsOf(L, B, 950, 1100, -200, -450, 200, 0.25);
  const sh = (x) => { const u = (x + L / 2) / L; return 950 + 150 * u ** 1.6; };
  const b = new Assembly(P.label, { prefix: 'BT', code: 'GEN', layer: 'meca', desc: `${P.desc} – longueur de coque 9 500 mm – bau 3 200 mm – tirant d'eau 1 850 mm – déplacement 5 200 kg` });

  const co = b.group('Coque', { code: 'COQ', layer: 'struct' });
  co.part('Coque (stratifié verre/polyester)', hullGeo(st, 16), { mat: 'composite', color: 0xf4f4f2, desc: 'Coque monolithique sous flottaison – sandwich balsa au-dessus' });
  co.part('Contre-moule structurel', S.box(L * 0.6, 60, B * 0.5), { pos: [0, -300, 0], mat: 'composite' });
  for (let i = 0; i < 7; i++) co.part(`Varangue ${i + 1}`, S.box(60, 250, B * 0.45), { pos: [-1800 + i * 600, -300, 0], mat: 'composite' });
  co.part('Cloison structurelle avant', S.box(25, 1300, B * 0.8), { pos: [2200, 300, 0], mat: 'bois' });
  co.part('Cloison de pied de mât', S.box(25, 1300, B * 0.85), { pos: [900, 300, 0], mat: 'bois' });
  co.part('Bande de flottaison (antifouling)', S.box(L * 0.9, 30, 20), { pos: [0, 0, B / 2 - 150], mat: 'peinture', color: 0x1f3a6e, layer: 'ext' });

  const qu = b.group('Quille & safran', { code: 'QUI', layer: 'sol' });
  const kx = 200;
  qu.part('Voile de quille fonte', S.loft([{ x: kx + 600, y: -450, z: 0, chord: 1300 }, { x: kx + 350, y: -1650, z: 0, chord: 750 }], airfoil(0.12), 'y'), { mat: 'fonte', desc: 'Lest fonte 1 650 kg' });
  qu.part('Bulbe de lest', S.lathe([[5, -500], [140, -350], [170, 0], [140, 400], [5, 600]], 32, 1, 1), { pos: [kx, -1750, 0], mat: 'fonte' });
  for (let i = 0; i < 6; i++) {
    const x = kx + 700 - i * 220, z = i % 2 ? 60 : -60;
    qu.part(`Boulon de quille ${i + 1} (M24)`, S.bolt(24, 320), { pos: [x, -150, z], mat: 'inox', couple: 400 });
    qu.part(`Contre-plaque de quille ${i + 1}`, S.box(150, 15, 150), { pos: [x, -170, z], mat: 'inox' });
  }
  qu.part('Mèche de safran (inox Ø 60)', S.cyl(60, 1400, 'y'), { pos: [-L / 2 + 900, 0, 0], mat: 'inox' });
  qu.part('Safran suspendu', S.loft([{ x: -L / 2 + 1150, y: -150, z: 0, chord: 650 }, { x: -L / 2 + 1050, y: -1400, z: 0, chord: 420 }], airfoil(0.1), 'y'), { mat: 'composite', color: 0xf4f4f2 });
  qu.part('Palier de jaumière', S.tube(110, 62, 120, 'y'), { pos: [-L / 2 + 900, -200, 0], mat: 'composite' });
  qu.part('Arbre d\'hélice (inox Ø 25)', S.cyl(25, 1300, 'x'), { pos: [-1700, -480, 0], rot: [0, 0, 8], mat: 'inox' });
  qu.part('Chaise d\'arbre', S.box(60, 300, 30), { pos: [-2200, -500, 0], mat: 'laiton' });
  const he = qu.group('Hélice bipale repliable 16"', { code: 'HEL' });
  he.part('Moyeu', S.cyl(70, 120, 'x'), { pos: [-2400, -570, 0], mat: 'laiton' });
  for (const k of [1, -1]) he.part(`Pale ${k > 0 ? 1 : 2}`, S.box(70, 180, 10), { pos: [-2400, -570 + k * 130, 0], rot: [0, 0, 20], mat: 'laiton' });
  qu.part('Anode sacrificielle', S.cyl(60, 50, 'x'), { pos: [-2320, -560, 0], mat: 'zingue' });

  const pt = b.group('Pont & roof', { code: 'PNT', layer: 'ext' });
  pt.part('Pont (sandwich balsa)', deckGeo(st, 40, 0), { pos: [0, 0, 0], mat: 'composite', color: 0xf4f4f2 });
  // On place le pont à la hauteur moyenne du livet
  pt.object.children[pt.object.children.length - 1].position.y = 1050;
  pt.part('Roof (rouf)', S.extrude([[2400, 1060], [2200, 1550], [-500, 1600], [-700, 1060]], 2000, 40), { mat: 'composite', color: 0xf4f4f2 });
  for (const sd of SIDES) {
    pt.part(`Hublot de roof ${sd.m} 1`, S.box(900, 180, 8), { pos: [1300, 1380, sd.s * 1000], mat: 'plexi' });
    pt.part(`Hublot de roof ${sd.m} 2`, S.box(600, 160, 8), { pos: [200, 1400, sd.s * 1000], mat: 'plexi' });
    pt.part(`Hublot de coque ${sd.m}`, S.box(500, 100, 8), { pos: [400, 850, sd.s * (B / 2 - 20)], mat: 'plexi' });
    pt.part(`Main courante de roof ${sd.m}`, S.box(2200, 40, 40), { pos: [800, 1620, sd.s * 750], mat: 'bois' });
    pt.part(`Rail de fargue ${sd.m}`, S.pipe(st.slice(1, 12).map((q) => [q.x, sh(q.x) + 60, sd.s * (q.b - 40)]), 40), { mat: 'aluminium' });
    const nC = 5;
    for (let k = 0; k < nC; k++) {
      const q = st[2 + k * 2];
      pt.part(`Chandelier ${sd.c}${k + 1}`, S.cyl(25, 650, 'y'), { pos: [q.x, sh(q.x) + 330, sd.s * (q.b - 60)], mat: 'inox' });
      pt.part(`Embase de chandelier ${sd.c}${k + 1}`, S.box(90, 40, 90), { pos: [q.x, sh(q.x) + 30, sd.s * (q.b - 60)], mat: 'inox' });
    }
    pt.part(`Filière ${sd.m}`, S.pipe(st.slice(2, 11).map((q) => [q.x, sh(q.x) + 640, sd.s * (q.b - 60)]), 5), { mat: 'inox' });
    pt.part(`Winch de génois ${sd.m} (40 ST)`, S.cyl(170, 220, 'y', 32, 120), { pos: [-2200, 1170, sd.s * 1200], mat: 'chrome' });
    pt.part(`Taquet d'amarrage ${sd.c}AR`, S.box(250, 50, 50), { pos: [-L / 2 + 400, 1040, sd.s * (B / 2 - 250)], mat: 'inox' });
    pt.part(`Taquet d'amarrage ${sd.c}AV`, S.box(250, 50, 50), { pos: [L / 2 - 900, 1120, sd.s * 400], mat: 'inox' });
  }
  pt.part('Balcon avant', S.pipe([[L / 2 - 1100, 1750, -500], [L / 2 - 250, 1750, -150], [L / 2 - 200, 1750, 0], [L / 2 - 250, 1750, 150], [L / 2 - 1100, 1750, 500]], 30), { mat: 'inox' });
  pt.part('Balcon arrière', S.pipe([[-L / 2 + 900, 1650, -1400], [-L / 2 + 250, 1650, -900], [-L / 2 + 250, 1650, 900], [-L / 2 + 900, 1650, 1400]], 30), { mat: 'inox' });
  pt.part('Davier d\'étrave', S.box(400, 120, 180), { pos: [L / 2 + 50, 1150, 0], mat: 'inox' });
  pt.part('Guindeau électrique', S.cyl(200, 200, 'y'), { pos: [L / 2 - 700, 1170, 0], mat: 'aluminium', layer: 'meca' });
  pt.part('Ancre Delta 10 kg', S.box(400, 80, 300), { pos: [L / 2 + 250, 1000, 0], rot: [0, 0, -40], mat: 'zingue' });
  pt.part('Panneau de pont avant', S.box(500, 30, 500), { pos: [2800, 1150, 0], mat: 'plexi' });
  pt.part('Descente (capot coulissant)', S.box(700, 60, 700), { pos: [-450, 1610, 0], mat: 'plexi' });
  boltRow(pt, { from: [-700, 1065, -900], to: [2400, 1065, -900], n: 8, d: 6, L: 40, axis: 'y', dir: -1, label: 'Vis de roof bâbord', kind: 'cap', couple: 8 });
  boltRow(pt, { from: [-700, 1065, 900], to: [2400, 1065, 900], n: 8, d: 6, L: 40, axis: 'y', dir: -1, label: 'Vis de roof tribord', kind: 'cap', couple: 8 });

  const ck = b.group('Cockpit', { code: 'CKP', layer: 'ext' });
  ck.part('Plancher de cockpit', S.box(2600, 30, 2200), { pos: [-L / 2 + 1900, 650, 0], mat: 'bois', desc: 'Teck massif 10 mm' });
  for (const sd of SIDES) ck.part(`Banc de cockpit ${sd.m}`, S.box(2400, 400, 400), { pos: [-L / 2 + 2000, 850, sd.s * 1000], mat: 'composite', color: 0xf4f4f2 });
  ck.part('Barre franche', S.rod([-L / 2 + 900, 1150, 0], [-L / 2 + 2300, 1300, 0], 50), { mat: 'bois' });
  ck.part('Table de cockpit', S.box(800, 40, 500), { pos: [-L / 2 + 2300, 1050, 0], mat: 'bois' });
  ck.part('Compas de route', S.sphere(150), { pos: [-450, 1550, 700], mat: 'abs', color: 0x111111 });
  ck.part('Afficheurs de navigation', S.box(30, 180, 400), { pos: [-480, 1500, -600], rot: [0, 0, 15], mat: 'ecran' });
  ck.part('Pilote automatique de barre franche', S.cyl(60, 700, 'z'), { pos: [-L / 2 + 1700, 1000, 400], mat: 'abs', layer: 'meca' });

  const gr = b.group('Gréement & voiles', { code: 'GRE', layer: 'ext' });
  const mx = 1300, mastH = 12800;
  gr.part('Mât aluminium (profil 160 × 105 mm)', S.box(160, mastH, 105), { pos: [mx, 1050 + mastH / 2, 0], mat: 'aluminium', desc: 'Mât posé sur le pont – 2 étages de barres de flèche poussantes' });
  gr.part('Pied de mât', S.box(250, 80, 200), { pos: [mx, 1090, 0], mat: 'aluminium' });
  for (const [k, y, w] of [[1, 5500, 1100], [2, 9400, 750]]) gr.part(`Barres de flèche étage ${k}`, S.box(60, 30, w * 2), { pos: [mx - 150, 1050 + y, 0], rot: [0, 20, 0], mat: 'aluminium' });
  gr.part('Bôme aluminium', S.box(3800, 160, 90), { pos: [mx - 1950, 2050, 0], mat: 'aluminium' });
  gr.part('Vit-de-mulet', S.box(120, 80, 80), { pos: [mx - 70, 2050, 0], mat: 'inox' });
  gr.part('Hale-bas rigide', S.rod([mx - 50, 1300, 0], [mx - 1100, 2000, 0], 45), { mat: 'aluminium' });
  const top = [mx, 1050 + mastH];
  gr.part('Étai (avec enrouleur de génois)', S.rod([L / 2 - 100, 1150, 0], [top[0] + 60, top[1] - 200, 0], 26), { mat: 'aluminium', desc: 'Profil d\'enrouleur sur câble 1×19 Ø 8 mm' });
  gr.part('Pataras', S.rod([-L / 2 + 150, 1050, 0], [top[0] - 70, top[1], 0], 7), { mat: 'inox', desc: 'Câble inox 1×19 Ø 7 mm – ridoir de réglage' });
  for (const sd of SIDES) {
    const cz = sd.s * 1450;
    gr.part(`Galhauban ${sd.m}`, S.pipe([[mx - 150, 1100, cz], [mx - 150, 1050 + 5500, sd.s * 1150], [mx - 150, 1050 + 9400, sd.s * 800], [mx, top[1] - 300, sd.s * 60]], 8), { mat: 'inox' });
    gr.part(`Bas-hauban ${sd.m}`, S.rod([mx - 400, 1100, cz], [mx, 1050 + 5500, sd.s * 60], 8), { mat: 'inox' });
    gr.part(`Cadène ${sd.m}`, S.box(80, 200, 20), { pos: [mx - 280, 1050, cz], mat: 'inox', layer: 'struct' });
    gr.part(`Ridoir de galhauban ${sd.m}`, S.cyl(22, 220, 'y'), { pos: [mx - 150, 1250, cz], mat: 'chrome' });
    for (const k of [1, 2]) gr.part(`Boulon de cadène ${sd.c}${k}`, S.bolt(10, 60, 'z'), { pos: [mx - 280, 1000 - k * 60, cz], rot: axisRot('z', -sd.s), mat: 'inox', couple: 45, layer: 'struct' });
  }
  gr.part('Grand-voile lattée (Dacron)', sailGeo([mx - 90, 2130], [mx - 90, top[1] - 150], [mx - 3800, 2130]), { mat: 'composite', color: 0xf7f5ee });
  gr.part('Génois 135 % enroulé partiellement', sailGeo([L / 2 - 200, 1350], [top[0] + 200, top[1] - 1600], [mx - 1500, 1400]), { mat: 'composite', color: 0xf0ede4, desc: 'Voile d\'avant sur enrouleur' });
  for (let k = 0; k < 4; k++) gr.part(`Latte de grand-voile ${k + 1}`, S.box(900 - k * 150, 10, 10), { pos: [mx - 90 - (900 - k * 150) / 2, 2130 + 2200 * (k + 1), 0], mat: 'composite' });
  gr.part('Feu de tête de mât (tricolore + mouillage)', S.cyl(80, 120, 'y'), { pos: [top[0], top[1] + 60, 0], mat: 'feuBlanc' });
  gr.part('Girouette-anémomètre', S.box(400, 40, 40), { pos: [top[0] - 150, top[1] + 160, 0], mat: 'abs' });

  const amg = b.group('Aménagements intérieurs', { code: 'AMG', layer: 'int' });
  amg.part('Plancher intérieur (planchers démontables)', S.box(5000, 25, 1300), { pos: [300, -50, 0], mat: 'bois' });
  amg.part('Couchette double avant (cabine avant)', S.box(1900, 120, 1700), { pos: [3100, 450, 0], mat: 'mousse', color: 0x6a7a90 });
  for (const sd of SIDES) amg.part(`Banquette de carré ${sd.m}`, S.box(2000, 450, 550), { pos: [500, 230, sd.s * 1000], mat: 'mousse', color: 0x6a7a90 });
  amg.part('Table de carré à abattants', S.box(1100, 40, 700), { pos: [500, 700, 0], mat: 'bois' });
  amg.part('Cuisine en L (évier, réchaud 2 feux, glacière)', S.box(1100, 900, 600), { pos: [-1000, 400, -1050], mat: 'bois' });
  amg.part('Réchaud à cardan 2 feux', S.box(500, 150, 350), { pos: [-1000, 900, -1100], mat: 'inox' });
  amg.part('Table à cartes', S.box(800, 40, 600), { pos: [-1000, 850, 1050], mat: 'bois' });
  amg.part('Cabinet de toilette (WC marin)', S.box(1000, 1500, 800), { pos: [1600, 600, 1000], mat: 'composite', color: 0xe8e4da });
  amg.part('Couchette double arrière (cabine arrière)', S.box(2000, 120, 1600), { pos: [-L / 2 + 2000, 300, 600], mat: 'mousse', color: 0x6a7a90 });
  amg.part('Réservoir d\'eau douce (160 L)', S.box(900, 300, 500), { pos: [600, -150, -700], mat: 'plastique' });

  const mo = b.group('Moteur inboard & équipements', { code: 'MOT', layer: 'meca' });
  inlineEngine(mo, 'Moteur diesel marin 2 cylindres 20 ch', { n: 2, bore: 76, stroke: 77.6, pitch: 90, pos: [-1300, 0, 0], rot: [0, 180, 8], code: 'MOT', diesel: true, journal: 48, desc: 'Refroidissement par eau de mer via échangeur – 15 kW à 3 600 tr/min' });
  mo.part('Inverseur-réducteur 2,6:1', S.box(250, 250, 250), { pos: [-1600, -40, 0], mat: 'aluminium' });
  mo.part('Silentblocs moteur (×4)', S.box(500, 40, 500), { pos: [-1350, -230, 0], mat: 'caoutchouc' });
  mo.part('Water-lock d\'échappement', S.cyl(220, 300, 'y'), { pos: [-2500, -100, 500], mat: 'plastique' });
  mo.part('Réservoir de gazole (60 L)', S.box(700, 300, 400), { pos: [-2600, 100, -700], mat: 'aluminium' });
  mo.part('Parc batteries de servitude (2 × 110 Ah)', S.box(600, 250, 350), { pos: [-300, -150, 700], mat: 'electrolyte' });
  mo.part('Tableau électrique', S.box(30, 400, 500), { pos: [-600, 900, 1250], mat: 'ecran' });
  return b;
}

// ============================================================================ Vedette à moteur
function buildMotorboat(P) {
  const L = 8000, B = 2900;
  const st = stationsOf(L, B, 900, 1250, -300, -550, 450, 0.75);
  const b = new Assembly(P.label, { prefix: 'BT', code: 'GEN', layer: 'meca', desc: `${P.desc} – longueur 8 000 mm – largeur 2 900 mm – V de 19° au tableau` });
  const co = b.group('Coque', { code: 'COQ', layer: 'struct' });
  co.part('Coque planante (stratifié verre/polyester)', hullGeo(st), { mat: 'composite', color: 0xf4f4f2, desc: 'Redans longitudinaux – V de 19° au tableau' });
  for (let i = 0; i < 4; i++) co.part(`Redan ${i + 1}`, S.box(L * 0.45, 30, 40), { pos: [-L * 0.15, -440 + (i % 2) * 180, (i < 2 ? -1 : 1) * (350 + (i % 2) * 450)], mat: 'composite' });
  for (let i = 0; i < 6; i++) co.part(`Varangue ${i + 1}`, S.box(50, 220, B * 0.4 * (1 - i * 0.08)), { pos: [-2800 + i * 800, -330, 0], mat: 'composite' });
  co.part('Tableau arrière', S.box(60, 1100, B - 300), { pos: [-L / 2 + 30, 300, 0], mat: 'composite', color: 0xf4f4f2 });
  co.part('Plate-forme de bain', S.box(700, 60, B - 200), { pos: [-L / 2 - 350, 150, 0], mat: 'bois', layer: 'ext' });
  const pt = b.group('Pont & superstructure', { code: 'PNT', layer: 'ext' });
  const deck = pt.part('Pont', deckGeo(st, 40), { mat: 'composite', color: 0xf4f4f2 });
  deck.position.y = 1000;
  pt.part('Cabine avant (superstructure)', S.extrude([[3200, 1000], [2700, 1550], [200, 1650], [0, 1000]], 2200, 50), { mat: 'composite', color: 0xf4f4f2 });
  pt.part('Pare-brise', S.box(10, 650, 2300), { pos: [-100, 1950, 0], rot: [0, 0, 30], mat: 'verre' });
  pt.part('Hard-top', S.box(1700, 80, 2400), { pos: [-900, 2500, 0], mat: 'composite', color: 0xf4f4f2 });
  for (const sd of SIDES) {
    pt.part(`Montant de hard-top ${sd.m}`, S.box(80, 1250, 80), { pos: [-1600, 1875, sd.s * 1100], mat: 'aluminium' });
    pt.part(`Hublot de coque ${sd.m}`, S.box(900, 120, 8), { pos: [1800, 1350, sd.s * 1110], mat: 'verre' });
    pt.part(`Taquet ${sd.c}AR`, S.box(250, 50, 50), { pos: [-L / 2 + 350, 1020, sd.s * (B / 2 - 200)], mat: 'inox' });
    pt.part(`Balcon latéral ${sd.m}`, S.pipe(st.slice(7, 12).map((q) => [q.x, 1650, sd.s * (q.b - 80)]), 30), { mat: 'inox' });
  }
  const amg = b.group('Aménagements', { code: 'AMG', layer: 'int' });
  amg.part('Poste de pilotage', S.box(700, 900, 900), { pos: [-500, 1450, -600], mat: 'composite', color: 0xf4f4f2 });
  amg.part('Volant', S.torus(380, 28, 'x'), { pos: [-750, 2000, -600], rot: [0, 0, -30], mat: 'inox' });
  amg.part('Écran multifonction 12"', S.box(30, 250, 350), { pos: [-450, 1950, -450], rot: [0, 0, 30], mat: 'ecran' });
  amg.part('Siège pilote', S.box(550, 900, 600), { pos: [-1400, 1450, -600], mat: 'cuir', color: 0xe8e2d0 });
  amg.part('Banquette de cockpit en U', S.box(1200, 450, B - 400), { pos: [-L / 2 + 1100, 1225, 0], mat: 'cuir', color: 0xe8e2d0 });
  amg.part('Table de cockpit', S.box(800, 40, 600), { pos: [-L / 2 + 1900, 1700, 0], mat: 'bois' });
  amg.part('Couchette double avant', S.box(1900, 150, 1900), { pos: [2300, 650, 0], mat: 'mousse', color: 0x6a7a90 });
  amg.part('Kitchenette', S.box(800, 900, 500), { pos: [600, 550, 900], mat: 'bois' });
  amg.part('Cabinet de toilette', S.box(900, 1300, 800), { pos: [600, 600, -900], mat: 'composite', color: 0xe8e4da });
  const mo = b.group('Propulsion inboard / embase Z-drive', { code: 'MOT', layer: 'meca' });
  inlineEngine(mo, 'Moteur diesel 6 cylindres 3,0 L – 220 ch', { n: 6, bore: 84, stroke: 90, pitch: 92, pos: [-2900, 250, 0], rot: [0, 0, 0], code: 'MOT', diesel: true, turbo: true, desc: 'Refroidissement indirect – échangeur eau douce / eau de mer' });
  mo.part('Embase Z-drive (sterndrive)', S.box(300, 900, 200), { pos: [-L / 2 - 200, -100, 0], mat: 'peinture', color: 0x1b1d22 });
  mo.part('Plaque de tableau / cardan d\'embase', S.box(80, 400, 450), { pos: [-L / 2 - 40, 300, 0], mat: 'aluminium', color: 0x1b1d22 });
  for (let k = 0; k < 6; k++) mo.part(`Goujon de plaque de tableau ${k + 1}`, S.bolt(12, 90, 'x'), { pos: [-L / 2 + 50, 180 + (k % 3) * 120, k < 3 ? -180 : 180], rot: axisRot('x', 1), mat: 'inox', couple: 50 });
  const he = mo.group('Hélices contrarotatives', { code: 'HEL' });
  for (const [k, dx] of [[1, -420], [2, -520]]) {
    he.part(`Moyeu d'hélice ${k}`, S.cyl(110, 90, 'x'), { pos: [-L / 2 + dx, -480, 0], mat: 'inox' });
    for (let p = 0; p < 3; p++) he.part(`Pale ${k}.${p + 1}`, S.box(70, 160, 10), { pos: [-L / 2 + dx, -480 + Math.cos((p * 120 + k * 60) * Math.PI / 180) * 120, Math.sin((p * 120 + k * 60) * Math.PI / 180) * 120], rot: [p * 120 + k * 60, 0, k === 1 ? 25 : -25], mat: 'inox' });
  }
  boltCircle(he, { n: 1, pcd: 0, d: 20, L: 40, axis: 'x', at: [-L / 2 - 580, -480, 0], dir: -1, label: 'Écrou d\'hélice', kind: 'nut', couple: 80 });
  mo.part('Réservoir de gazole (300 L)', S.box(1500, 300, 1200), { pos: [-400, -150, 0], mat: 'aluminium' });
  mo.part('Batteries (démarrage + servitude)', S.box(600, 250, 350), { pos: [-L / 2 + 700, 100, 900], mat: 'electrolyte' });
  mo.part('Ventilation de cale', S.cyl(100, 300, 'z'), { pos: [-L / 2 + 900, 700, -1100], mat: 'plastique' });
  return b;
}
