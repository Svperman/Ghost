// Sous-ensembles réutilisables par plusieurs véhicules (cotes en mm)
import { S, boltCircle, axisRot } from './builder.js';

/** Profil de pneu (superellipse) pour révolution autour de Y */
function tireProfile(D, rimD, W) {
  const R = D / 2, ri = rimD / 2, rc = (R + ri) / 2, a = (R - ri) / 2, b = W / 2, pts = [];
  for (let i = 0; i <= 48; i++) {
    const t = (i / 48) * Math.PI * 2;
    const c = Math.cos(t), s = Math.sin(t);
    pts.push([rc + a * Math.sign(c) * Math.abs(c) ** 0.4, b * Math.sign(s) * Math.abs(s) ** 0.4]);
  }
  return pts;
}

/**
 * Roue complète (axe Z). side = -1 (gauche) / +1 (droite) : face extérieure.
 * o : { tire:[largeur, série, jante pouces] | D, W, rimD, studs, pcd, stud, disc:[D,e], spokes, dual, drum }
 */
export function wheel(asm, name, side, o) {
  const g = asm.group(name, { pos: o.pos, code: o.code });
  let D, W, rimD, tireRef = '';
  if (o.tire) {
    const [w, ar, inch] = o.tire;
    rimD = inch * 25.4; W = w; D = Math.round(rimD + 2 * w * ar / 100);
    tireRef = `${w}/${ar} R${inch}`;
  } else { D = o.D; W = o.W; rimD = o.rimD; tireRef = o.tireRef || ''; }
  const out = side; // direction Z de la face extérieure

  const tire = S.revolve(tireProfile(D, rimD, W), 'z', 64);
  tire.dims = { Dimension: tireRef || `${D}×${W}`, 'Diamètre extérieur': D, 'Largeur de section': W, 'Diamètre de jante': Math.round(rimD * 10) / 10 };
  g.part('Pneumatique', tire, { mat: 'caoutchouc', desc: 'Enveloppe radiale avec bande de roulement' });

  // Jante : fût + voile
  const rimW = W * 0.85;
  const barrel = S.tube(rimD + 12, rimD - 6, rimW, 'z', 56);
  barrel.dims = { 'Diamètre de jante': Math.round(rimD), 'Largeur de jante': Math.round(rimW), Déport: o.et ?? 40 };
  const rimMat = o.rimMat || 'aluminium';
  g.part('Jante – fût', barrel, { mat: rimMat });
  const faceZ = out * rimW * 0.28;
  g.part('Jante – moyeu central', S.cyl(o.pcd ? o.pcd + 40 : rimD * 0.35, 14, 'z', 40), { pos: [0, 0, faceZ], mat: rimMat });
  const nSp = o.spokes ?? 5;
  for (let i = 0; i < nSp; i++) {
    const a = (i / nSp) * 360 + 90;
    const L = rimD / 2 - (o.pcd ? o.pcd / 2 + 15 : rimD * 0.17);
    const r0 = (o.pcd ? o.pcd / 2 + 15 : rimD * 0.17) + L / 2;
    g.part(`${o.spokeLabel || 'Jante – branche'} ${i + 1}`, S.box(L, o.spokeW || 34, 12), {
      pos: [Math.cos(a * Math.PI / 180) * r0, Math.sin(a * Math.PI / 180) * r0, faceZ], rot: [0, 0, a], mat: rimMat,
    });
  }
  g.part('Valve de gonflage', S.cyl(8, 40, 'z', 10), { pos: [rimD / 2 - 20, 0, out * rimW * 0.3], mat: 'caoutchouc' });
  if (o.cap !== false) g.part('Cache-moyeu', S.cyl(o.pcd ? o.pcd - 30 : 50, 10, 'z', 30), { pos: [0, 0, faceZ + out * 10], mat: 'chrome' });

  // Fixations de roue
  if (o.studs) {
    boltCircle(g, {
      n: o.studs, pcd: o.pcd, d: o.stud || 12, L: o.studL || 26, axis: 'z', at: [0, 0, faceZ + out * 7], dir: out,
      label: o.studLabel || 'Boulon de roue', kind: o.studKind || 'bolt', couple: o.couple || 110, start: Math.PI / 2,
    });
  }

  // Freinage
  if (o.disc) {
    const [dd, de] = o.disc;
    const disc = S.tube(dd, o.pcd ? o.pcd + 30 : dd * 0.4, de, 'z', 56);
    disc.dims = { 'Diamètre du disque': dd, Épaisseur: de, 'Épaisseur mini': Math.round((de - 2) * 10) / 10 };
    g.part('Disque de frein', disc, { pos: [0, 0, -out * rimW * 0.12], mat: 'fonte' });
    if (o.caliper !== false) {
      const cal = asm.group(`Étrier de frein – ${name.toLowerCase()}`, { pos: o.pos });
      const cy = dd / 2 - 18, cx = -(o.caliperX ?? 1) * 0.0;
      const ang = (o.caliperAngle ?? 150) * Math.PI / 180;
      const p = [Math.cos(ang) * cy + cx, Math.sin(ang) * cy, -out * rimW * 0.12];
      cal.part('Corps d\'étrier', S.box(70, 110, de + 40), { pos: p, rot: [0, 0, (o.caliperAngle ?? 150) - 90], mat: 'peinture', color: o.caliperColor ?? 0xb3202a });
      cal.part('Plaquette intérieure', S.box(45, 95, 12), { pos: [p[0], p[1], p[2] - out * (de / 2 + 6)], rot: [0, 0, (o.caliperAngle ?? 150) - 90], mat: 'feutre' });
      cal.part('Plaquette extérieure', S.box(45, 95, 12), { pos: [p[0], p[1], p[2] + out * (de / 2 + 6)], rot: [0, 0, (o.caliperAngle ?? 150) - 90], mat: 'feutre' });
      cal.part('Piston d\'étrier', S.cyl(48, 30, 'z'), { pos: [p[0], p[1], p[2] - out * (de / 2 + 22)], mat: 'chrome' });
      cal.part('Vis de purge', S.bolt(8, 20, 'y'), { pos: [p[0], p[1] + 55, p[2]], mat: 'acier' });
      for (let k = 0; k < 2; k++) {
        const off = (k ? 1 : -1) * 40;
        cal.part(`Vis de fixation d'étrier ${k + 1}`, S.bolt(12, 35, 'z'), {
          pos: [p[0] + Math.cos(ang + Math.PI / 2) * off, p[1] + Math.sin(ang + Math.PI / 2) * off, p[2] - out * (de / 2 + 30)],
          rot: axisRot('z', -out), mat: 'acierHR', couple: 120,
        });
      }
    }
  }
  if (o.drum) {
    const [dd, w] = o.drum;
    g.part('Tambour de frein', S.tube(dd, dd - 30, w, 'z', 48), { pos: [0, 0, -out * w * 0.6], mat: 'fonte' });
    g.part('Mâchoire de frein 1', S.box(dd * 0.6, 20, w * 0.8), { pos: [0, dd * 0.3, -out * w * 0.6], mat: 'feutre' });
    g.part('Mâchoire de frein 2', S.box(dd * 0.6, 20, w * 0.8), { pos: [0, -dd * 0.3, -out * w * 0.6], mat: 'feutre' });
  }

  // Moyeu / roulement
  if (o.hub !== false) {
    g.part('Moyeu de roue', S.cyl(o.hubD || 130, o.hubL || 60, 'z', 32), { pos: [0, 0, -out * (rimW * 0.12 + 30)], mat: 'acier' });
    g.part('Roulement de roue', S.tube((o.hubD || 130) * 0.62, (o.hubD || 130) * 0.32, 40, 'z'), { pos: [0, 0, -out * (rimW * 0.12 + 50)], mat: 'inox', desc: 'Roulement à double rangée de billes' });
  }
  return g;
}

/**
 * Moteur en ligne (vilebrequin selon X local, cylindres vers +Y).
 * o : { n, bore, stroke, pitch, label }
 */
export function inlineEngine(asm, name, o) {
  const e = asm.group(name, { pos: o.pos, rot: o.rot, code: o.code || 'MOT', desc: o.desc });
  const { n, bore, stroke, pitch } = o;
  const L = n * pitch + 60, blockH = stroke * 2.6, blockW = bore + 90;
  const deck = blockH / 2;
  const cx = (i) => -((n - 1) * pitch) / 2 + i * pitch;

  const bloc = e.group('Bloc-cylindres', { code: o.code || 'MOT' });
  bloc.part('Carter-cylindres', S.box(L, blockH, blockW), { mat: o.blockMat || 'fonte', desc: `${n} cylindres en ligne – alésage ${bore} mm, course ${stroke} mm, cylindrée ${Math.round(n * Math.PI * (bore / 20) ** 2 * stroke / 10)} cm³` });
  for (let i = 0; i < n; i++) {
    bloc.part(`Chemise de cylindre ${i + 1}`, S.tube(bore + 8, bore, stroke * 1.9, 'y'), { pos: [cx(i), deck - stroke * 0.95, 0], mat: 'fonte' });
  }
  bloc.part('Joint de culasse', S.box(L - 4, 1.5, blockW - 4), { pos: [0, deck + 0.75, 0], mat: 'acier', desc: 'Joint multicouche acier (MLS)' });

  const head = e.group('Culasse', { code: o.code || 'MOT' });
  const headH = stroke * 1.2;
  head.part('Culasse', S.box(L, headH, blockW), { pos: [0, deck + 1.5 + headH / 2, 0], mat: 'aluminium' });
  head.part('Couvre-culasse', S.box(L - 20, 60, blockW - 30), { pos: [0, deck + 1.5 + headH + 30, 0], mat: o.coverMat || 'aluminium', color: o.coverColor });
  head.part('Bouchon de remplissage d\'huile', S.cyl(45, 22, 'y'), { pos: [L * 0.25, deck + headH + 72, 0], mat: 'plastique' });
  head.part('Arbre à cames d\'admission', S.cyl(28, L - 10, 'x'), { pos: [0, deck + headH * 0.8, -bore * 0.28], mat: 'acier' });
  head.part('Arbre à cames d\'échappement', S.cyl(28, L - 10, 'x'), { pos: [0, deck + headH * 0.8, bore * 0.28], mat: 'acier' });
  for (let i = 0; i < n; i++) {
    for (const [k, side, lab] of [[0, -1, 'admission'], [1, 1, 'échappement']]) {
      for (let v = 0; v < (o.valves ?? 2); v++) {
        const off = (o.valves ?? 2) > 1 ? (v ? 1 : -1) * bore * 0.2 : 0;
        head.part(`Soupape ${lab} cyl.${i + 1}${(o.valves ?? 2) > 1 ? (v ? 'b' : 'a') : ''}`, S.cyl(7, headH * 0.9, 'y'), { pos: [cx(i) + off, deck + headH * 0.5, side * bore * 0.22], mat: 'inox' });
        head.part(`Ressort de soupape ${lab} cyl.${i + 1}${(o.valves ?? 2) > 1 ? (v ? 'b' : 'a') : ''}`, S.spring(22, 3.5, 40, 6), { pos: [cx(i) + off, deck + headH * 0.62, side * bore * 0.22], mat: 'acier' });
      }
      void k;
    }
    if (o.diesel) head.part(`Injecteur cyl.${i + 1}`, S.cyl(17, 110, 'y'), { pos: [cx(i), deck + headH + 40, 0], mat: 'inox' });
    else head.part(`Bougie d'allumage cyl.${i + 1}`, S.cyl(14, 70, 'y'), { pos: [cx(i), deck + headH + 30, 0], mat: 'ceramique', desc: 'Filetage M14×1,25 – couple 25 N·m' });
  }
  // Vis de culasse (2 rangées)
  const nb = n + 1;
  for (let i = 0; i < nb; i++) {
    for (const z of [-1, 1]) {
      const x = -((nb - 1) * pitch) / 2 + i * pitch;
      head.part(`Vis de culasse ${z < 0 ? 'A' : 'B'}${i + 1}`, S.bolt(o.headBolt || 11, headH + 60), { pos: [x, deck + 1.5 + headH - 2, z * (blockW / 2 - 18)], mat: 'acierHR', couple: o.headTorque || '30 N·m + 90° + 90°' });
    }
  }

  const eq = e.group('Équipage mobile', { code: o.code || 'MOT' });
  const crankY = -deck + stroke * 0.6;
  eq.part('Vilebrequin', S.cyl(o.journal || 55, L + 40, 'x'), { pos: [0, crankY, 0], mat: 'acierHR' });
  for (let i = 0; i < n; i++) {
    const phase = [0, 180, 180, 0, 0, 180, 180, 0][i] ?? (i * 120);
    const up = phase === 0 ? 1 : -1;
    eq.part(`Contrepoids vilebrequin ${i + 1}`, S.box(24, stroke, bore * 0.9), { pos: [cx(i) - pitch * 0.3, crankY - up * stroke * 0.25, 0], mat: 'acierHR' });
    const pinY = crankY + up * stroke / 2;
    const pistonY = pinY + stroke * 1.65;
    eq.part(`Piston ${i + 1}`, S.cyl(bore - 0.5, bore * 0.75, 'y'), { pos: [cx(i), pistonY, 0], mat: 'aluminium' });
    for (let r = 0; r < 3; r++) eq.part(`Segment ${['de feu', "d'étanchéité", 'racleur'][r]} piston ${i + 1}`, S.tube(bore, bore - 7, r === 2 ? 3 : 1.5, 'y'), { pos: [cx(i), pistonY + bore * 0.3 - r * 7, 0], mat: 'fonte' });
    eq.part(`Axe de piston ${i + 1}`, S.tube(o.pin || 22, (o.pin || 22) - 8, bore - 10, 'z'), { pos: [cx(i), pistonY - bore * 0.1, 0], mat: 'acierHR' });
    eq.part(`Bielle ${i + 1}`, S.rod([cx(i), pinY, 0], [cx(i), pistonY - bore * 0.1, 0], o.rodD || 26), { mat: 'acierHR' });
    eq.part(`Tête de bielle ${i + 1}`, S.tube((o.journal || 55) + 28, (o.journal || 55) - 6, 24, 'x'), { pos: [cx(i), pinY, 0], mat: 'acierHR' });
    eq.part(`Vis de chapeau de bielle ${i + 1}a`, S.bolt(9, 45, 'y'), { pos: [cx(i), pinY - 20, -(o.journal || 55) / 2 - 8], rot: [180, 0, 0], mat: 'acierHR', couple: '20 N·m + 90°' });
    eq.part(`Vis de chapeau de bielle ${i + 1}b`, S.bolt(9, 45, 'y'), { pos: [cx(i), pinY - 20, (o.journal || 55) / 2 + 8], rot: [180, 0, 0], mat: 'acierHR', couple: '20 N·m + 90°' });
  }
  eq.part('Volant moteur', S.cyl(o.flywheel || 280, 30, 'x', 60), { pos: [L / 2 + 40, crankY, 0], mat: 'fonte' });
  boltCircle(eq, { n: 6, pcd: 75, d: 10, L: 22, axis: 'x', at: [L / 2 + 58, crankY, 0], dir: 1, label: 'Vis de volant moteur', kind: 'cap', couple: '60 N·m + 90°' });
  eq.part('Couronne de démarreur', S.tube((o.flywheel || 280) + 20, (o.flywheel || 280) - 4, 16, 'x', 80), { pos: [L / 2 + 40, crankY, 0], mat: 'acierHR' });

  const lub = e.group('Lubrification', { code: o.code || 'MOT' });
  lub.part('Carter d\'huile', S.box(L - 30, stroke * 1.2, blockW + 20), { pos: [0, -deck - stroke * 0.6, 0], mat: 'aluminium' });
  lub.part('Bouchon de vidange', S.bolt(14, 15, 'y'), { pos: [L * 0.3, -deck - stroke * 1.2 - 8, 0], rot: [180, 0, 0], mat: 'acier', couple: 30 });
  lub.part('Filtre à huile', S.cyl(76, 100, 'z'), { pos: [-L * 0.2, -deck + 20, -(blockW / 2 + 50)], mat: 'peinture', color: 0x1f4fa0 });
  lub.part('Pompe à huile', S.box(90, 60, 70), { pos: [-L / 2 + 40, -deck - 20, 0], mat: 'aluminium' });
  const nPan = Math.round(L / 55);
  for (let i = 0; i < nPan; i++) {
    for (const z of [-1, 1]) lub.part(`Vis de carter d'huile ${z < 0 ? 'G' : 'D'}${i + 1}`, S.bolt(6, 20, 'y'), { pos: [-L / 2 + 30 + i * ((L - 60) / Math.max(1, nPan - 1)), -deck - 4, z * (blockW / 2 + 4)], rot: [180, 0, 0], mat: 'zingue', couple: 10 });
  }

  const dist = e.group('Distribution & accessoires', { code: o.code || 'MOT' });
  const fx = -L / 2 - 25;
  dist.part('Poulie de vilebrequin', S.cyl(150, 30, 'x'), { pos: [fx, crankY, 0], mat: 'fonte' });
  dist.part('Pignon d\'arbre à cames admission', S.cyl(120, 22, 'x'), { pos: [fx, deck + headH * 0.8, -bore * 0.28], mat: 'acier' });
  dist.part('Pignon d\'arbre à cames échappement', S.cyl(120, 22, 'x'), { pos: [fx, deck + headH * 0.8, bore * 0.28], mat: 'acier' });
  dist.part('Courroie de distribution', S.pipe([[fx, crankY - 75, 0], [fx, deck + headH * 0.8 + 60, -bore * 0.5], [fx, deck + headH * 0.8 + 60, bore * 0.5]], 8, true), { mat: 'caoutchouc' });
  dist.part('Galet tendeur', S.cyl(70, 28, 'x'), { pos: [fx, 40, blockW / 2], mat: 'acier' });
  dist.part('Alternateur', S.cyl(o.alt || 130, 150, 'x'), { pos: [-L * 0.25, deck - 40, blockW / 2 + 90], mat: 'aluminium', desc: o.diesel ? '24 V – 110 A' : '14 V – 150 A' });
  dist.part('Poulie d\'alternateur', S.cyl(60, 25, 'x'), { pos: [fx, deck - 40, blockW / 2 + 90], mat: 'acier' });
  dist.part('Pompe à eau', S.cyl(100, 60, 'x'), { pos: [fx + 20, 0, -blockW / 4], mat: 'aluminium' });
  dist.part('Démarreur', S.cyl(o.diesel ? 110 : 80, o.diesel ? 280 : 190, 'x'), { pos: [L / 2 - 60, crankY + 40, -(blockW / 2 + 70)], mat: 'peinture', color: 0x222222 });
  dist.part('Courroie d\'accessoires', S.pipe([[fx - 20, crankY - 75, 0], [fx - 20, deck + 25, blockW / 2 + 90], [fx - 20, 40, blockW / 2 + 40], [fx - 20, 0, -blockW / 4 - 50]], 7, true), { mat: 'caoutchouc' });

  const adm = e.group('Admission', { code: o.code || 'MOT' });
  const mz = -(blockW / 2 + 40);
  adm.part('Répartiteur d\'admission', S.box(L - 40, 80, 70), { pos: [0, deck + headH * 0.5, mz - 30], mat: o.diesel ? 'aluminium' : 'plastique' });
  for (let i = 0; i < n; i++) adm.part(`Pipe d'admission ${i + 1}`, S.cyl(46, 70, 'z'), { pos: [cx(i), deck + headH * 0.5, mz + 10], mat: o.diesel ? 'aluminium' : 'plastique' });
  adm.part('Boîtier papillon', S.cyl(70, 60, 'x'), { pos: [-L / 2 - 10, deck + headH * 0.5, mz - 30], mat: 'aluminium' });

  const ech = e.group('Collecteur d\'échappement', { code: o.code || 'MOT' });
  const ez = blockW / 2 + 40;
  for (let i = 0; i < n; i++) {
    ech.part(`Tubulure d'échappement ${i + 1}`, S.pipe([[cx(i), deck + headH * 0.5, ez - 40], [cx(i), deck + headH * 0.4, ez + 20], [cx(i) * 0.4, deck - 40, ez + 40], [0, deck - 140, ez + 40]], 42), { mat: 'inox' });
    for (const k of [-1, 1]) ech.part(`Goujon de collecteur ${i + 1}${k < 0 ? 'a' : 'b'}`, S.nut(8, 'z'), { pos: [cx(i) + k * 30, deck + headH * 0.5, ez - 30], mat: 'laiton', couple: 25 });
  }
  if (o.turbo) {
    ech.part('Turbocompresseur – carter turbine', S.cyl(170, 110, 'z'), { pos: [0, deck - 200, ez + 60], mat: 'fonte' });
    ech.part('Turbocompresseur – carter compresseur', S.cyl(180, 90, 'z'), { pos: [0, deck - 200, ez + 160], mat: 'aluminium' });
  }
  return e;
}

/** Siège automobile / camion */
export function seat(asm, name, pos, o = {}) {
  const w = o.w || 520, mat = o.mat || 'tissu', color = o.color;
  const g = asm.group(name, { pos, code: o.code });
  g.part('Assise', S.box(500, 110, w), { pos: [0, 60, 0], mat, color });
  g.part('Dossier', S.box(110, 620, w), { pos: [-230, 380, 0], rot: [0, 0, -12], mat, color });
  g.part('Appui-tête', S.box(80, 200, w * 0.5), { pos: [-300, 790, 0], rot: [0, 0, -12], mat, color });
  for (const z of [-1, 1]) g.part(`Tige d'appui-tête ${z < 0 ? 'G' : 'D'}`, S.cyl(12, 120, 'y'), { pos: [-283, 690, z * 55], rot: [0, 0, -12], mat: 'chrome' });
  g.part('Armature d\'assise', S.box(480, 30, w - 40), { pos: [0, -10, 0], mat: 'acier' });
  for (const z of [-1, 1]) {
    g.part(`Glissière ${z < 0 ? 'gauche' : 'droite'}`, S.box(420, 25, 40), { pos: [0, -40, z * (w / 2 - 50)], mat: 'acier' });
    for (const x of [-1, 1]) g.part(`Vis de glissière ${z < 0 ? 'G' : 'D'}${x < 0 ? 'AR' : 'AV'}`, S.bolt(10, 30, 'y'), { pos: [x * 190, -30, z * (w / 2 - 50)], mat: 'acierHR', couple: 45 });
  }
  return g;
}
