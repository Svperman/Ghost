// Vélos – générateur paramétrique (cotes en mm)
// Repère : X avant, Y haut, Z droite. Origine au sol, à l'aplomb du boîtier de pédalier.
import { Assembly, S, SIDES, boltCircle, axisRot } from '../core/builder.js';

const DEG = Math.PI / 180;

export const BIKE_TYPES = {
  ville: {
    label: 'Vélo de ville', desc: 'Vélo urbain cadre col-de-cygne aluminium – moyeu à vitesses intégrées 7 rapports – roues 700×40C – éclairage dynamo',
    tire: 40, cs: 460, bbDrop: 65, stack: 640, reach: 360, head: 70, seat: 71, seatL: 520, low: true, stem: 60, rise: 120, frame: 0x2f6f6a,
    brakes: 'patins', fork: 'rigide', city: true, rings: [38], cogs: [20],
    makers: ['Gazelle (Esprit)', 'Batavus (Mambo)', 'Peugeot Cycles (LC01)', 'Decathlon Elops (520)', 'Arcade (Wayne)', 'Raleigh (Pioneer)', 'Cube (Ella)'],
  },
  vtt: {
    label: 'VTT tout suspendu', desc: 'VTT trail 29" tout suspendu 140/130 mm – cadre aluminium – mono-plateau 12 vitesses – freins à disque hydrauliques 4 pistons',
    tire: 60, cs: 435, bbDrop: 30, stack: 625, reach: 470, head: 65.5, seat: 76, seatL: 440, stem: 45, rise: 30, frame: 0xd2551f,
    brakes: 'disque', disc: [203, 180], fork: 'suspendue', fs: true, rings: [32], cogs: [10, 12, 14, 16, 18, 21, 24, 28, 33, 39, 45, 51], flat: true,
    makers: ['Specialized (Stumpjumper)', 'Trek (Fuel EX)', 'Canyon (Spectral)', 'Scott (Genius)', 'Giant (Trance)', 'Decathlon Rockrider (AM)', 'Santa Cruz (Hightower)', 'Commençal (Meta)'],
  },
  route: {
    label: 'Vélo de route', desc: 'Vélo de route endurance – cadre carbone – double plateau 2 × 12 vitesses électronique – freins à disque – roues 700×28C',
    tire: 28, cs: 410, bbDrop: 72, stack: 575, reach: 385, head: 72.5, seat: 73.5, seatL: 540, stem: 100, rise: -10, frame: 0x1b1d22,
    brakes: 'disque', disc: [160, 160], fork: 'carbone', rings: [50, 34], cogs: [11, 12, 13, 14, 15, 17, 19, 21, 24, 27, 30, 34], drop: true, carbon: true,
    makers: ['Specialized (Roubaix / Tarmac)', 'Trek (Domane)', 'Canyon (Endurace)', 'Giant (Defy)', 'Cannondale (Synapse)', 'Decathlon Van Rysel (EDR)', 'Look (765)', 'Pinarello (X)'],
  },
  vae: {
    label: 'Vélo à assistance électrique (VAE)', desc: 'VAE trekking – moteur central 250 W / 85 N·m – batterie intégrée 625 Wh – 25 km/h – dérailleur 10 vitesses – roues 700×50C',
    tire: 50, cs: 470, bbDrop: 60, stack: 640, reach: 400, head: 70, seat: 73, seatL: 500, stem: 70, rise: 60, frame: 0x6b6f75,
    brakes: 'disque', disc: [180, 180], fork: 'suspendue', city: true, ebike: true, rings: [42], cogs: [11, 13, 15, 17, 19, 21, 24, 28, 32, 36], flat: true,
    makers: ['Bosch (moteur Performance Line)', 'Shimano (EP8)', 'Gazelle (Ultimate)', 'Riese & Müller (Charger)', 'Cube (Kathmandu Hybrid)', 'Moustache (Samedi)', 'Decathlon Riverside (920 E)'],
  },
};

/** Roue de vélo : pneu, jante, moyeu, rayons */
function bikeWheel(asm, name, P, pos, rear) {
  const g = asm.group(name, { pos, code: 'ROU' });
  const bsd = 622, tw = P.tire;
  const R = bsd / 2 + tw;
  const tire = S.torus(bsd + tw, tw, 'z', 64);
  tire.dims = { Dimension: `${tw}-622 (700×${tw}C / 29")`, 'Diamètre extérieur': Math.round(R * 2), 'Largeur de section': tw, ETRTO: `${tw}-622` };
  g.part('Pneumatique', tire, { mat: 'caoutchouc', desc: P.city ? 'Pneu renforcé anti-crevaison, bandes réfléchissantes' : 'Pneu tubeless' });
  const rim = S.tube(bsd + 30, bsd - 10, Math.max(20, tw * 0.55), 'z', 64);
  rim.dims = { 'Diamètre ETRTO': bsd, 'Largeur interne': Math.round(Math.max(17, tw * 0.45)), Trous: 32 };
  g.part('Jante', rim, { mat: P.carbon ? 'carbone' : 'aluminium' });
  const hubL = rear ? (P.fs ? 148 : 142) : (P.fork === 'suspendue' && !P.city ? 110 : 100);
  g.part(rear && P.city && !P.ebike ? 'Moyeu à vitesses intégrées 7 rapports' : 'Moyeu', S.cyl(rear && P.city && !P.ebike ? 70 : 34, hubL - 20, 'z'), { mat: 'aluminium' });
  for (const z of [-1, 1]) g.part(`Flasque de moyeu ${z < 0 ? 'gauche' : 'droite'}`, S.cyl(56, 4, 'z'), { pos: [0, 0, z * (hubL / 2 - 20)], mat: 'aluminium' });
  g.part('Axe traversant 12 mm', S.cyl(12, hubL + 30, 'z'), { pos: [0, 0, 0], mat: 'aluminium', desc: rear ? `Axe ${hubL} × 12 mm` : `Axe ${hubL} × ${hubL > 100 ? 15 : 12} mm` });
  g.part('Valve Presta', S.cyl(6, 45, 'y'), { pos: [0, bsd / 2 - 10, 0], mat: 'laiton' });
  for (let i = 0; i < 32; i++) {
    const side = i % 2 ? 1 : -1;
    const aR = (i / 32) * Math.PI * 2;
    const aH = aR + side * (3 * 2 * Math.PI / 16) * (i % 4 < 2 ? 1 : -1) * 0.5;
    const hz = side * (hubL / 2 - 20);
    g.part(`Rayon ${String(i + 1).padStart(2, '0')}`, S.rod([Math.cos(aH) * 25, Math.sin(aH) * 25, hz], [Math.cos(aR) * (bsd / 2 - 8), Math.sin(aR) * (bsd / 2 - 8), 0], 2), { mat: 'inox', desc: 'Rayon inox 2,0 mm – tension ≈ 1 100 N' });
  }
  if (P.brakes === 'disque') {
    const dd = rear ? P.disc[1] : P.disc[0];
    const disc = S.tube(dd, 40, 1.8, 'z', 48);
    disc.dims = { Diamètre: dd, Épaisseur: 1.8, 'Épaisseur mini': 1.5 };
    g.part('Disque de frein', disc, { pos: [0, 0, -(hubL / 2 - 12)], mat: 'inox' });
    boltCircle(g, { n: 6, pcd: 44, d: 5, L: 10, axis: 'z', at: [0, 0, -(hubL / 2 - 10)], dir: -1, label: 'Vis Torx de disque', kind: 'cap', couple: 6 });
  }
  return { g, R, hubL };
}

export function buildBike(type = 'ville') {
  const P = BIKE_TYPES[type] || BIKE_TYPES.ville;
  const R = 622 / 2 + P.tire;
  const bbY = R - P.bbDrop;
  const XR = -Math.sqrt(P.cs ** 2 - P.bbDrop ** 2);
  const ht = [P.reach, bbY + P.stack]; // haut de douille
  const htL = P.fork === 'suspendue' ? 120 : 150;
  const hb = [ht[0] + htL * Math.cos(P.head * DEG), ht[1] - htL * Math.sin(P.head * DEG)];
  const forkL = (hb[1] - R) / Math.sin(P.head * DEG);
  const off = P.fork === 'suspendue' && !P.city ? 44 : 45;
  const XF = hb[0] + forkL * Math.cos(P.head * DEG) + off / Math.sin(P.head * DEG);
  const st = [-P.seatL * Math.cos(P.seat * DEG), bbY + P.seatL * Math.sin(P.seat * DEG)];
  const FRAME = P.frame, DARK = 0x1b1d22;
  const fmat = P.carbon ? 'carbone' : 'aluminium';
  const b = new Assembly(P.label, { prefix: 'VL', code: 'GEN', layer: 'meca', desc: `${P.desc} – empattement ${Math.round(XF - XR)} mm – angle de direction ${P.head}° – bases ${P.cs} mm` });

  // ------------------------------------------------------------------ Cadre
  const cad = b.group('Cadre', { code: 'CAD', layer: 'struct' });
  cad.part('Douille de direction', S.rod([hb[0], hb[1], 0], [ht[0], ht[1], 0], 50, 34), { mat: fmat, color: FRAME, desc: 'Douille conique 1 1/8" – 1,5"' });
  cad.part('Boîtier de pédalier', S.tube(46, 34, P.ebike ? 90 : 73, 'z'), { pos: [0, bbY, 0], mat: fmat, color: FRAME, desc: P.ebike ? 'Interface moteur central' : P.carbon ? 'BB86 press-fit' : 'BSA 68/73 mm fileté' });
  if (P.low) {
    cad.part('Tube diagonal col-de-cygne', S.pipe([[hb[0] + 10, hb[1] + 40, 0], [hb[0] - 180, hb[1] - 250, 0], [120, bbY + 60, 0], [0, bbY, 0]], 48), { mat: fmat, color: FRAME });
    cad.part('Tube de renfort bas', S.pipe([[hb[0], hb[1] - 30, 0], [hb[0] - 280, bbY + 280, 0], [st[0] * 0.25, bbY + P.seatL * 0.25, 0]], 32), { mat: fmat, color: FRAME });
  } else {
    cad.part('Tube supérieur', S.rod([ht[0] - 20, ht[1] - 20, 0], [st[0] + 15, st[1] - 60, 0], P.carbon ? 42 : 38), { mat: fmat, color: FRAME });
    cad.part('Tube diagonal', S.rod([hb[0] - 10, hb[1] + 20, 0], [10, bbY + 10, 0], P.ebike ? 70 : 52), { mat: fmat, color: FRAME });
  }
  cad.part('Tube de selle', S.rod([0, bbY + 20, 0], [st[0], st[1], 0], P.carbon ? 34 : 32, P.carbon ? 0 : 27.2), { mat: fmat, color: FRAME, desc: 'Diamètre intérieur 27,2 mm (tige de selle)' });
  const seatCluster = [st[0] * 0.92, bbY + (st[1] - bbY) * 0.92];
  for (const sd of SIDES) {
    cad.part(`Base ${sd.f}`, S.rod([0, bbY - 10, sd.s * 35], [XR, R, sd.s * (P.fs ? 70 : 66)], 22), { mat: fmat, color: FRAME });
    if (P.fs) {
      cad.part(`Hauban de bras oscillant ${sd.m}`, S.rod([XR, R, sd.s * 70], [-220, bbY + 280, sd.s * 40], 22), { mat: fmat, color: FRAME });
      cad.part(`Biellette d'amortisseur ${sd.f}`, S.box(160, 30, 12), { pos: [st[0] * 0.5, bbY + 300, sd.s * 32], rot: [0, 0, 20], mat: 'aluminium', color: DARK, layer: 'sol' });
    } else cad.part(`Hauban ${sd.m}`, S.rod([seatCluster[0], seatCluster[1], sd.s * 18], [XR, R, sd.s * 66], 16), { mat: fmat, color: FRAME });
    cad.part(`Patte de cadre ${sd.f}`, S.box(50, 60, 8), { pos: [XR, R, sd.s * (P.fs ? 76 : 72)], mat: 'aluminium', color: DARK });
  }
  if (P.fs) {
    const sh = b.group('Amortisseur arrière', { code: 'AMO', layer: 'sol' });
    sh.part('Corps d\'amortisseur à air (210 × 55 mm)', S.rod([80, bbY + 200, 0], [st[0] * 0.45, bbY + 330, 0], 38), { mat: 'aluminium', color: DARK, desc: 'Débattement 130 mm – réglage détente et compression' });
    sh.part('Chambre à air', S.cyl(48, 90, 'x'), { pos: [st[0] * 0.3, bbY + 290, 0], rot: [0, 0, -15], mat: 'aluminium' });
    sh.part('Pivot principal', S.cyl(15, 90, 'z'), { pos: [40, bbY + 90, 0], mat: 'acierHR' });
    for (const k of [1, 2]) sh.part(`Vis d'œil d'amortisseur ${k}`, S.capScrew(8, 60, 'z'), { pos: k === 1 ? [80, bbY + 200, 32] : [st[0] * 0.45, bbY + 330, 32], rot: axisRot('z', 1), mat: 'acierHR', couple: 12 });
  }
  cad.part('Porte-bidon', S.box(150, 10, 60), { pos: [(hb[0] + 0) / 2 - 30, (hb[1] + bbY) / 2 + 40, 0], rot: [0, 0, -Math.atan2(hb[1] - bbY, hb[0]) / DEG], mat: 'aluminium', color: DARK, layer: 'ext' });
  for (const k of [1, 2]) cad.part(`Vis de porte-bidon ${k}`, S.capScrew(5, 12, 'y'), { pos: [hb[0] * (0.38 + k * 0.08), bbY + (hb[1] - bbY) * (0.38 + k * 0.08) + 25, 0], mat: 'inox', couple: 4 });

  // ------------------------------------------------------------------ Fourche & roues
  const tr = b.group('Roues & fourche', { code: 'TRN', layer: 'sol' });
  const crown = [hb[0] + 30 * Math.cos(P.head * DEG), hb[1] - 30 * Math.sin(P.head * DEG)];
  const four = tr.group(P.fork === 'suspendue' ? `Fourche suspendue ${P.fs ? '140' : '63'} mm` : P.carbon ? 'Fourche carbone' : 'Fourche rigide acier', { code: 'FOU' });
  four.part('Pivot de fourche', S.rod([crown[0], crown[1], 0], [ht[0] - 20 * Math.cos(P.head * DEG), ht[1] + 60, 0], 28.6), { mat: P.carbon ? 'carbone' : 'aluminium' });
  four.part('Té de fourche (couronne)', S.box(60, 40, 150), { pos: [crown[0], crown[1] - 10, 0], rot: [0, 0, 90 - P.head], mat: P.carbon ? 'carbone' : 'aluminium', color: DARK });
  for (const sd of SIDES) {
    if (P.fork === 'suspendue') {
      const mid = [crown[0] + (XF - crown[0]) * 0.45, crown[1] + (R - crown[1]) * 0.45];
      four.part(`Plongeur ${sd.m} (Ø ${P.fs ? 35 : 32} mm)`, S.rod([crown[0], crown[1] - 20, sd.s * 60], [mid[0], mid[1], sd.s * 60], P.fs ? 35 : 32), { mat: 'chrome' });
      four.part(`Fourreau ${sd.m}`, S.rod([mid[0] - 20, mid[1] + 40, sd.s * 60], [XF, R, sd.s * 58], 48), { mat: 'aluminium', color: DARK });
      four.part(`Joint spi ${sd.m}`, S.tube(50, 35, 10, 'y'), { pos: [mid[0] - 15, mid[1] + 50, sd.s * 60], rot: [0, 0, 90 - P.head], mat: 'caoutchouc' });
    } else four.part(`Fourreau ${sd.m}`, S.pipe([[crown[0], crown[1] - 20, sd.s * 45], [(crown[0] + XF) / 2 - 10, (crown[1] + R) / 2, sd.s * 55], [XF, R, sd.s * 52]], P.carbon ? 30 : 26), { mat: P.carbon ? 'carbone' : 'acier', color: P.carbon ? DARK : FRAME });
  }
  if (P.fork === 'suspendue') four.part('Arceau de fourche', S.box(40, 50, 150), { pos: [crown[0] + (XF - crown[0]) * 0.5 + 20, crown[1] + (R - crown[1]) * 0.5 + 40, 0], mat: 'aluminium', color: DARK });
  bikeWheel(tr, 'Roue avant', P, [XF, R, 0], false);
  const rw = bikeWheel(tr, 'Roue arrière', P, [XR, R, 0], true);

  // ------------------------------------------------------------------ Transmission
  const tx = b.group('Transmission', { code: 'TRS', layer: 'meca' });
  const crankL = 172.5;
  tx.part('Axe de pédalier', S.cyl(24, P.ebike ? 150 : 130, 'z'), { pos: [0, bbY, 0], mat: 'acierHR' });
  const ringZ = 48;
  const ringR = P.rings.map((t) => 12.7 / (2 * Math.sin(Math.PI / t))); // rayon primitif
  P.rings.forEach((t, i) => tx.part(`Plateau ${t} dents`, S.tube(ringR[i] * 2 + 8, ringR[i] * 2 - 30, 4, 'z', 60), { pos: [0, bbY, ringZ - i * 6], mat: 'aluminium', desc: `Pas 12,7 mm (1/2") – ${t} dents` }));
  if (P.rings.length > 1 || !P.city) boltCircle(tx, { n: 4, pcd: 110, d: 8, L: 10, axis: 'z', at: [0, bbY, ringZ + 4], dir: 1, label: 'Vis de plateau', kind: 'cap', couple: 12 });
  for (const sd of SIDES) {
    const a = sd.s > 0 ? -60 : 120;
    const end = [Math.cos(a * DEG) * crankL, bbY + Math.sin(a * DEG) * crankL];
    tx.part(`Manivelle ${sd.f} (${crankL} mm)`, S.rod([0, bbY, sd.s * 62], [end[0], end[1], sd.s * 68], 22), { mat: P.carbon ? 'carbone' : 'aluminium', color: DARK });
    tx.part(`Pédale ${sd.f}`, S.box(90, 20, P.flat || P.city ? 100 : 70), { pos: [end[0], end[1], sd.s * 125], mat: P.city ? 'plastique' : 'aluminium', color: DARK, desc: P.flat || P.city ? 'Pédale plate' : 'Pédale automatique' });
    tx.part(`Axe de pédale ${sd.f} (9/16")`, S.cyl(14.3, 60, 'z'), { pos: [end[0], end[1], sd.s * 90], mat: 'acierHR', couple: 35 });
    tx.part(`Vis de manivelle ${sd.f}`, S.capScrew(8, 16, 'z'), { pos: [0, bbY, sd.s * 72], rot: axisRot('z', sd.s), mat: 'acierHR', couple: 40 });
  }
  const cogR = P.cogs.map((t) => 12.7 / (2 * Math.sin(Math.PI / t)));
  P.cogs.forEach((t, i) => tx.part(P.cogs.length > 1 ? `Pignon ${t} dents` : `Pignon de moyeu ${t} dents`, S.tube(cogR[i] * 2 + 6, 34, 2, 'z', 48), { pos: [XR, R, rw.hubL / 2 - 30 - i * 3.9], mat: 'acier' }));
  const cr = ringR[0] + 2, cg = cogR[P.cogs.length > 1 ? 4 : 0] + 2;
  const zc = P.cogs.length > 1 ? rw.hubL / 2 - 30 - 4 * 3.9 : rw.hubL / 2 - 30;
  tx.part(P.cogs.length > 1 ? `Chaîne ${P.cogs.length} vitesses` : 'Chaîne 1/2" × 1/8"', S.pipe([
    [0, bbY + cr, ringZ], [-cr * 0.7, bbY + cr * 0.7, ringZ], [XR + cg * 0.7, R + cg * 0.7, zc], [XR, R + cg, zc], [XR - cg, R, zc],
    ...(P.cogs.length > 1 ? [[XR - 10, R - cg - 40, zc], [XR + 30, R - cg - 100, zc], [XR + 70, R - cg - 30, zc]] : [[XR, R - cg, zc]]),
    [-cr * 0.7, bbY - cr * 0.7, ringZ], [0, bbY - cr, ringZ], [cr, bbY, ringZ],
  ], 6, true), { mat: 'acier', desc: 'Pas 12,7 mm – maillon rapide' });
  if (P.cogs.length > 1) {
    const dr = tx.group(P.drop ? 'Dérailleur arrière électronique' : 'Dérailleur arrière', { code: 'TRS' });
    dr.part('Corps de dérailleur', S.box(60, 90, 40), { pos: [XR - 20, R - 70, rw.hubL / 2 + 10], rot: [0, 0, 20], mat: 'aluminium', color: DARK });
    dr.part('Chape de dérailleur', S.box(30, P.fs ? 110 : 80, 20), { pos: [XR + 10, R - cg - 70, zc], mat: 'aluminium', color: DARK });
    dr.part('Galet supérieur', S.cyl(30, 8, 'z'), { pos: [XR - 10, R - cg - 40, zc], mat: 'plastique' });
    dr.part('Galet inférieur', S.cyl(30, 8, 'z'), { pos: [XR + 30, R - cg - 100, zc], mat: 'plastique' });
    dr.part('Vis de fixation de dérailleur', S.capScrew(10, 25, 'z'), { pos: [XR, R - 20, rw.hubL / 2 + 8], rot: axisRot('z', 1), mat: 'acierHR', couple: 9 });
    dr.part('Patte de dérailleur', S.box(30, 60, 6), { pos: [XR, R - 30, rw.hubL / 2 + 2], mat: 'aluminium' });
    if (P.rings.length > 1) {
      tx.part('Dérailleur avant', S.box(70, 40, 30), { pos: [-ringR[0] * 0.4, bbY + ringR[0] + 40, ringZ], rot: [0, 0, P.seat - 90], mat: 'aluminium', color: DARK });
      tx.part('Batterie de transmission électronique', S.box(40, 30, 30), { pos: [st[0] * 0.35, bbY + P.seatL * 0.35, 0], mat: 'electrolyte', layer: 'struct' });
    }
  }
  if (P.city) tx.part('Carter de chaîne', S.extrude([[XR + 40, R + cg + 30], [ringR[0] * 0.3, bbY + ringR[0] + 30], [ringR[0] + 30, bbY + 20], [ringR[0] * 0.3, bbY - ringR[0] - 30], [XR + 40, R - cg - 30], [XR - 40, R]], 8), { pos: [0, 0, ringZ + 20], mat: 'plastique', color: DARK, layer: 'ext' });

  if (P.ebike) {
    const ae = b.group('Assistance électrique', { code: 'VAE', layer: 'meca' });
    ae.part('Moteur central 250 W / 85 N·m', S.box(200, 160, 120), { pos: [20, bbY + 20, 0], rot: [0, 0, -25], mat: 'aluminium', color: 0x222222, desc: 'Capteur de couple, de cadence et de vitesse – coupure 25 km/h (EN 15194)' });
    for (const [k, dx, dy] of [[1, -60, 60], [2, 60, 70], [3, 40, -60]]) ae.part(`Vis de fixation moteur ${k}`, S.capScrew(8, 30, 'z'), { pos: [dx, bbY + dy, 65], rot: axisRot('z', 1), mat: 'acierHR', couple: 20 });
    const dmid = [(hb[0] + 0) / 2, (hb[1] + bbY) / 2];
    const dAng = Math.atan2(hb[1] - bbY, hb[0]) / DEG;
    ae.part('Batterie lithium-ion 36 V 625 Wh (intégrée)', S.box(420, 70, 60), { pos: [dmid[0] - 15, dmid[1] - 30, 0], rot: [0, 0, dAng], mat: 'electrolyte', desc: '17,4 Ah – 3,5 kg – amovible par le bas' });
    ae.part('Serrure de batterie', S.cyl(20, 25, 'z'), { pos: [hb[0] - 80, hb[1] - 80, 30], mat: 'chrome' });
    ae.part('Prise de charge', S.cyl(18, 15, 'z'), { pos: [st[0] * 0.15, bbY + 80, -28], mat: 'abs' });
    ae.part('Capteur de vitesse (aimant de rayon)', S.box(20, 30, 15), { pos: [XR + 120, R - 30, -45], mat: 'abs' });
    ae.part('Faisceau moteur / batterie / écran', S.pipe([[20, bbY + 60, 0], [hb[0] - 60, hb[1] - 40, 15], [ht[0] + 40, ht[1] + 80, 0]], 6), { mat: 'plastique' });
  }

  // ------------------------------------------------------------------ Freins
  const fr = b.group('Freinage', { code: 'FRE', layer: 'meca' });
  if (P.brakes === 'disque') {
    for (const [nm, x, z, ang] of [['avant', XF, -50, 120], ['arrière', XR, -(rw.hubL / 2 - 12), 20]]) {
      const dd = nm === 'avant' ? P.disc[0] : P.disc[1];
      const p = [x + Math.cos(ang * DEG) * (dd / 2 - 15), R + Math.sin(ang * DEG) * (dd / 2 - 15), z - 10];
      const eg = fr.group(`Étrier de frein ${nm} ${P.fs ? '4' : '2'} pistons`, { code: 'FRE' });
      eg.part('Corps d\'étrier', S.box(70, 35, 40), { pos: p, rot: [0, 0, ang - 90], mat: 'aluminium', color: DARK });
      eg.part('Plaquettes (paire)', S.box(40, 25, 10), { pos: [p[0], p[1], z], rot: [0, 0, ang - 90], mat: 'feutre' });
      for (const k of [1, 2]) eg.part(`Vis d'étrier ${k} (post-mount)`, S.capScrew(6, 20, 'y'), { pos: [p[0] + (k === 1 ? -25 : 25), p[1] + 25, p[2]], mat: 'acierHR', couple: 6 });
    }
  } else {
    for (const [nm, x, y0] of [['avant', XF, R], ['arrière', XR, R]]) {
      const eg = fr.group(`Frein V-brake ${nm}`, { code: 'FRE' });
      const ang = nm === 'avant' ? 90 - (90 - P.head) : 60;
      const bx = x + Math.cos(ang * DEG) * (622 / 2 - 10), by = y0 + Math.sin(ang * DEG) * (622 / 2 - 10);
      for (const sd of SIDES) {
        eg.part(`Bras de frein ${sd.m}`, S.box(20, 110, 15), { pos: [bx, by + 30, sd.s * 40], rot: [0, 0, ang - 90], mat: 'aluminium' });
        eg.part(`Patin de frein ${sd.m}`, S.box(50, 15, 12), { pos: [bx, by, sd.s * 22], rot: [0, 0, ang], mat: 'caoutchouc' });
        eg.part(`Vis de tasseau ${sd.m}`, S.capScrew(6, 20, 'z'), { pos: [bx, by - 30, sd.s * 35], rot: axisRot('z', sd.s), mat: 'acierHR', couple: 6 });
      }
      eg.part('Nouille de guidage', S.pipe([[bx, by + 85, -30], [bx + 20, by + 110, 0], [bx, by + 85, 30]], 5), { mat: 'aluminium' });
    }
  }

  // ------------------------------------------------------------------ Poste de pilotage
  const pp = b.group('Poste de pilotage', { code: 'PIL', layer: 'int' });
  const stemTop = [ht[0] - 20 * Math.cos(P.head * DEG), ht[1] + 40];
  const bar = [stemTop[0] + P.stem * Math.cos((90 - P.head - 6) * DEG), stemTop[1] + P.rise];
  pp.part(`Potence ${P.stem} mm`, S.rod([stemTop[0], stemTop[1], 0], [bar[0], bar[1], 0], 35), { mat: 'aluminium', color: DARK });
  for (const k of [1, 2]) pp.part(`Vis de serrage de potence ${k}`, S.capScrew(5, 18, 'z'), { pos: [stemTop[0] - 15, stemTop[1] + (k === 1 ? 10 : -10), 20], rot: axisRot('z', 1), mat: 'inox', couple: 5 });
  for (let k = 1; k <= 4; k++) pp.part(`Vis de capot de potence ${k}`, S.capScrew(5, 18, 'x'), { pos: [bar[0] + 22, bar[1] + (k % 2 ? 15 : -15), k < 3 ? -18 : 18], rot: axisRot('x', 1), mat: 'inox', couple: 5 });
  pp.part('Bouchon de direction (top cap)', S.cyl(36, 8, 'y'), { pos: [stemTop[0], stemTop[1] + 25, 0], mat: 'aluminium', color: DARK });
  pp.part('Jeu de direction', S.cyl(52, 15, 'y'), { pos: [ht[0], ht[1] + 6, 0], mat: 'acier', color: DARK, layer: 'struct' });
  if (P.drop) {
    for (const sd of SIDES) {
      pp.part(`Cintre route (côté ${sd.m})`, S.pipe([[bar[0], bar[1], 0], [bar[0], bar[1], sd.s * 200], [bar[0] + 80, bar[1] - 10, sd.s * 210], [bar[0] + 90, bar[1] - 90, sd.s * 210], [bar[0] + 20, bar[1] - 130, sd.s * 210], [bar[0] - 40, bar[1] - 130, sd.s * 210]], 24), { mat: 'carbone' });
      pp.part(`Levier de frein / cocotte ${sd.m}`, S.box(80, 120, 35), { pos: [bar[0] + 85, bar[1] - 30, sd.s * 210], rot: [0, 0, -10], mat: 'abs', color: DARK });
    }
  } else {
    pp.part(`Cintre plat ${P.fs ? 780 : 620} mm`, S.cyl(31.8, P.fs ? 780 : 620, 'z'), { pos: [bar[0], bar[1], 0], mat: 'aluminium', color: DARK });
    for (const sd of SIDES) {
      pp.part(`Poignée ${sd.f}`, S.cyl(32, 130, 'z'), { pos: [bar[0], bar[1], sd.s * ((P.fs ? 390 : 310) - 65)], mat: P.city ? 'cuir' : 'caoutchouc', color: 0x3a2a20 });
      pp.part(`Levier de frein ${sd.m}`, S.box(20, 12, 110), { pos: [bar[0] + 40, bar[1] - 10, sd.s * ((P.fs ? 390 : 310) - 150)], mat: 'aluminium', color: DARK });
      pp.part(`Maître-cylindre / collier ${sd.m}`, S.cyl(30, 40, 'z'), { pos: [bar[0], bar[1], sd.s * ((P.fs ? 390 : 310) - 170)], mat: 'aluminium', color: DARK });
    }
    if (P.cogs.length > 1) pp.part('Commande de vitesses', S.box(50, 40, 50), { pos: [bar[0] - 20, bar[1] - 25, (P.fs ? 390 : 310) - 210], mat: 'abs' });
    else pp.part('Poignée tournante de vitesses', S.cyl(36, 60, 'z'), { pos: [bar[0], bar[1], 310 - 160], mat: 'abs' });
  }
  if (P.ebike) pp.part('Écran de commande VAE', S.box(20, 50, 70), { pos: [bar[0] + 10, bar[1] + 30, 0], rot: [0, 0, 20], mat: 'ecran' });
  const post = P.fs ? 180 : 150; // sortie de tige de selle
  const seatTop = [st[0] - post * Math.cos(P.seat * DEG), st[1] + post * Math.sin(P.seat * DEG)];
  pp.part(P.fs ? 'Tige de selle télescopique 150 mm' : 'Tige de selle 27,2 mm', S.rod([st[0] + 40 * Math.cos(P.seat * DEG), st[1] - 120, 0], [seatTop[0], seatTop[1], 0], P.fs ? 31.6 : 27.2), { mat: P.carbon ? 'carbone' : 'aluminium', color: DARK });
  pp.part('Collier de selle', S.tube(40, 32, 15, 'y'), { pos: [st[0], st[1], 0], rot: [0, 0, 90 - P.seat], mat: 'aluminium', color: DARK });
  pp.part('Vis de collier de selle', S.capScrew(5, 20, 'z'), { pos: [st[0] - 22, st[1], 0], rot: axisRot('z', 1), mat: 'inox', couple: 5 });
  pp.part('Selle', S.extrude([[seatTop[0] + 140, seatTop[1] + 30], [seatTop[0] + 130, seatTop[1] + 45], [seatTop[0] - 120, seatTop[1] + 55], [seatTop[0] - 140, seatTop[1] + 25], [seatTop[0] - 100, seatTop[1] + 15]], P.city ? 200 : 140, 10), { mat: P.city ? 'cuir' : 'mousse', color: 0x1a1a1a });
  pp.part('Rails de selle', S.box(180, 7, 42), { pos: [seatTop[0], seatTop[1] + 12, 0], mat: 'acier' });
  pp.part('Vis de chariot de selle', S.capScrew(6, 35, 'y'), { pos: [seatTop[0], seatTop[1] - 10, 0], rot: [180, 0, 0], mat: 'acierHR', couple: 10 });

  // ------------------------------------------------------------------ Équipements urbains
  if (P.city) {
    const eq = b.group('Équipements urbains', { code: 'EQU', layer: 'ext' });
    const guard = (cx, a0, a1) => Array.from({ length: 16 }, (_, i) => { const a = (a0 + (a1 - a0) * i / 15) * DEG; return [cx + (R + 25) * Math.cos(a), R + (R + 25) * Math.sin(a)]; })
      .concat(Array.from({ length: 16 }, (_, i) => { const a = (a1 - (a1 - a0) * i / 15) * DEG; return [cx + (R + 20) * Math.cos(a), R + (R + 20) * Math.sin(a)]; }));
    eq.part('Garde-boue avant', S.extrude(guard(XF, -10, 140), P.tire + 20), { mat: 'plastique', color: DARK });
    eq.part('Garde-boue arrière', S.extrude(guard(XR, 25, 190), P.tire + 20), { mat: 'plastique', color: DARK });
    for (const sd of SIDES) {
      eq.part(`Tringle de garde-boue avant ${sd.m}`, S.rod([XF, R, sd.s * 55], [XF + (R + 20) * Math.cos(20 * DEG), R + (R + 20) * Math.sin(20 * DEG), sd.s * (P.tire / 2 + 8)], 4), { mat: 'inox' });
      eq.part(`Montant de porte-bagages ${sd.m}`, S.rod([XR + 10, R + 20, sd.s * 72], [XR - 40, R + 330, sd.s * 80], 10), { mat: 'aluminium', color: DARK });
      eq.part(`Vis de porte-bagages ${sd.m}`, S.capScrew(5, 15, 'z'), { pos: [XR + 10, R + 20, sd.s * 78], rot: axisRot('z', sd.s), mat: 'inox', couple: 5 });
    }
    eq.part('Plateau de porte-bagages (charge 25 kg)', S.box(400, 12, 140), { pos: [XR - 30, R + 335, 0], mat: 'aluminium', color: DARK });
    eq.part('Hauban de porte-bagages', S.rod([XR + 170, R + 335, 0], [seatCluster[0] + 10, seatCluster[1] - 20, 0], 10), { mat: 'aluminium', color: DARK });
    eq.part('Phare LED', S.cyl(45, 50, 'x'), { pos: [ht[0] + 70, ht[1] - 40, 0], mat: 'feuBlanc' });
    eq.part('Feu arrière LED', S.box(20, 30, 70), { pos: [XR - 240, R + 330, 0], mat: 'feuRouge' });
    eq.part(P.ebike ? 'Alimentation éclairage (depuis la batterie)' : 'Moyeu dynamo (dans la roue avant)', S.cyl(60, 50, 'z'), { pos: [XF, R, 0], mat: 'aluminium', layer: 'meca' });
    eq.part('Béquille latérale', S.rod([XR * 0.5, R * 0.75, -50], [XR * 0.6, 0, -170], 18), { mat: 'aluminium', color: DARK });
    eq.part('Sonnette', S.cyl(55, 25, 'y'), { pos: [bar[0], bar[1] + 25, -180], mat: 'chrome' });
    eq.part('Antivol de cadre (fer à cheval)', S.torus(R * 0.5, 14, 'z'), { pos: [XR + 120, R + 60, 0], rot: [0, 0, 0], scale: [1, 0.5, 1], mat: 'acier', color: DARK });
  }
  return b;
}
