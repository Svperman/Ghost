// Avions à réaction – avion de ligne biréacteur et jet d'affaires (cotes en mm)
// Repère : X avant, Y haut, Z droite. Origine au sol.
import { Assembly, S, SIDES, boltCircle, boltRow, axisRot, airfoil, wedge } from '../core/builder.js';
import { wheel } from '../core/parts.js';

const D2R = Math.PI / 180;

import { JET_TYPES } from './meta/jet.js';

export { JET_TYPES };

export function buildJet(type = 'ligne') {
  const P = JET_TYPES[type] || JET_TYPES.ligne;
  const { R, FY, L } = P;
  const xN = L / 2, xT = -L / 2;
  const big = P.big ?? type === 'ligne';
  const j = new Assembly(P.label, { prefix: big ? 'AL' : 'JA', code: 'GEN', layer: 'meca', desc: `${P.desc} – longueur ${L} mm – envergure ${P.span} mm` });

  // ------------------------------------------------------------------ Fuselage
  const fu = j.group('Fuselage', { code: 'FUS', layer: 'ext' });
  const k = R / 1975;
  const prof = [[0, xN], [R * 0.25, xN - 100 * k], [R * 0.55, xN - 500 * k], [R * 0.8, xN - 1300 * k], [R * 0.96, xN - 2500 * k], [R, xN - 3800 * k], [R, xT + L * 0.26], [R * 0.9, xT + L * 0.17], [R * 0.62, xT + L * 0.09], [R * 0.32, xT + L * 0.025], [R * 0.12, xT], [0, xT]];
  fu.part('Revêtement de fuselage', S.lathe(prof, 64, 1.02, 1), { pos: [0, FY, 0], mat: 'peintureAlu', color: P.paint, desc: 'Revêtement aluminium-lithium 1,6 à 2,5 mm sur cadres et lisses' });
  fu.part('Bande de livrée', S.lathe([[R + 3, xN - 3000 * k], [R + 3, xT + L * 0.27]], 64, 1.02, 1), { pos: [0, FY - R * 0.15, 0], scale: [1, 0.12, 1], mat: 'peintureAlu', color: P.accent });
  fu.part('Radôme', S.lathe([[0, xN], [R * 0.25, xN - 100 * k], [R * 0.55, xN - 500 * k], [R * 0.72, xN - 950 * k]], 48, 1.02, 1.003), { pos: [0, FY, 0], mat: 'composite', color: 0x9aa0a6, desc: 'Radôme composite – radar météo' });
  fu.part('Antenne radar météo', S.cyl(R * 0.9, 60, 'x'), { pos: [xN - 700 * k, FY, 0], mat: 'aluminium', layer: 'meca' });
  const st = fu.group('Structure de fuselage', { code: 'STR', layer: 'struct' });
  const nFr = big ? 24 : 12;
  for (let i = 0; i < nFr; i++) {
    const x = xT + L * 0.22 + i * (L * 0.62 / (nFr - 1));
    st.part(`Cadre n°${i + 1}`, S.tube(R * 2 - 20, R * 2 - 160 * k, 40 * k + 10, 'x', 48), { pos: [x, FY, 0], scale: [1, 1.02, 1], mat: 'alu2024' });
  }
  for (let a = 0; a < 8; a++) {
    const ang = (a / 8) * Math.PI * 2 + Math.PI / 8;
    st.part(`Lisse n°${a + 1}`, S.box(L * 0.62, 30 * k + 10, 30 * k + 10), { pos: [xT + L * 0.53, FY + Math.sin(ang) * (R - 60), Math.cos(ang) * (R - 60)], mat: 'alu2024' });
  }
  st.part('Plancher passagers', S.box(L * 0.7, 20, R * 1.85), { pos: [xT + L * 0.55, FY - R * 0.35, 0], mat: 'composite', color: 0x55595e });
  st.part('Poutre de plancher (traverse type)', S.box(L * 0.62, 120 * k, 80), { pos: [xT + L * 0.53, FY - R * 0.42, 0], mat: 'alu2024' });
  st.part('Caisson central de voilure', S.box(P.root * 0.7, R * 0.45, R * 2 - 100), { pos: [P.wingX - P.root * 0.45, FY + P.wingY + R * 0.2, 0], mat: 'alu2024', desc: 'Caisson central – liaison des deux demi-voilures' });
  st.part('Cloison étanche arrière (dôme)', S.sphere(R * 1.8, 32), { pos: [xT + L * 0.22, FY, 0], scale: [0.2, 1, 1], mat: 'alu2024' });
  const vit = fu.group('Vitrages & portes', { code: 'VIT' });
  for (const sd of SIDES) {
    vit.part(`Pare-brise ${sd.m}`, S.box(8, 700 * k + 150, 900 * k + 200), { pos: [xN - 2300 * k, FY + R * 0.55, sd.s * R * 0.35], rot: [sd.s * 30, sd.s * 25, -50], mat: 'verre' });
    vit.part(`Glace latérale cockpit ${sd.m}`, S.box(900 * k + 200, 450 * k + 100, 8), { pos: [xN - 3400 * k, FY + R * 0.5, sd.s * R * 0.84], mat: 'verre' });
    const nWin = big ? 30 : 6;
    for (let w = 0; w < nWin; w++) {
      const x = xN - (big ? 6500 : 4300) - w * (big ? 533 : 700);
      vit.part(`Hublot ${sd.c}${String(w + 1).padStart(2, '0')}`, S.ellipsoid(240 * k + 100, 330 * k + 120, 30), { pos: [x, FY + R * 0.18, sd.s * (R * 0.985)], mat: 'verre' });
    }
    const doorsX = big ? [xN - 4300, xT + L * 0.25] : [xN - 3000];
    doorsX.forEach((x, i) => {
      const d = vit.group(`Porte ${i === 0 ? 'avant' : 'arrière'} ${sd.f}`, { code: 'POR' });
      d.part('Panneau de porte', S.box(big ? 820 : 700, big ? 1850 : 1500, 30), { pos: [x, FY + 80, sd.s * R * 0.99], mat: 'peintureAlu', color: P.paint, desc: big ? 'Porte passagers / service type A' : 'Porte-escalier' });
      d.part('Poignée de porte', S.box(220, 60, 30), { pos: [x, FY + 300, sd.s * (R + 20)], mat: 'aluminium' });
      d.part('Toboggan d\'évacuation (conteneur)', S.box(500, 400, 200), { pos: [x, FY - 400, sd.s * (R - 200)], mat: 'abs', color: 0x888888, layer: 'int' });
      for (let h = 0; h < 2; h++) d.part(`Charnière ${h + 1}`, S.box(80, 120, 60), { pos: [x + 450, FY + (h ? 500 : -350), sd.s * (R - 20)], mat: 'titane' });
    });
    if (big) {
      vit.part(`Issue de secours sur l'aile ${sd.f}`, S.box(500, 1000, 25), { pos: [P.wingX - 2200, FY + 100, sd.s * R * 0.99], mat: 'peintureAlu', color: P.paint });
      vit.part(`Porte de soute avant ${sd.f === 'droite' ? '' : '(accès)'}`.trim(), S.box(1800, 1200, 25), { pos: [xN - 9000, FY - R * 0.7, sd.s * R * 0.72], rot: [sd.s * 30, 0, 0], mat: 'peintureAlu', color: P.paint });
    }
  }
  if (big) {
    const apu = fu.group('Groupe auxiliaire de puissance (APU)', { code: 'APU', layer: 'meca' });
    apu.part('Turbine APU', S.cyl(600, 1400, 'x'), { pos: [xT + 1700, FY + 100, 0], mat: 'inox' });
    apu.part('Échappement APU', S.cyl(300, 500, 'x'), { pos: [xT + 300, FY + 150, 0], mat: 'inox' });
    apu.part('Entrée d\'air APU', S.box(500, 40, 300), { pos: [xT + 2500, FY + R * 0.7, 0], mat: 'aluminium' });
  }
  const ant = fu.group('Antennes & sondes', { code: 'AVI' });
  for (const sd of SIDES) {
    ant.part(`Sonde Pitot ${sd.m}`, S.cyl(20, 250, 'x'), { pos: [xN - 2000 * k, FY - R * 0.1, sd.s * (R * 0.95 + 80)], mat: 'inox' });
    ant.part(`Sonde d'incidence ${sd.m}`, S.box(120, 20, 60), { pos: [xN - 2600 * k, FY - R * 0.25, sd.s * (R * 0.98 + 30)], mat: 'inox' });
  }
  ant.part('Antenne VHF', S.box(400, 300, 40), { pos: [xN - 9000 * k, FY + R + 150, 0], rot: [0, 0, -20], mat: 'composite', color: 0x222222 });
  ant.part('Antenne satcom', S.ellipsoid(1400 * k + 300, 200, 700 * k + 200), { pos: [-2000 * k, FY + R + 50, 0], mat: 'composite', color: 0xdddddd });
  ant.part('Feu anticollision supérieur', S.ellipsoid(150, 70, 150), { pos: [0, FY + R + 30, 0], mat: 'feuRouge' });
  ant.part('Feu anticollision inférieur', S.ellipsoid(150, 70, 150), { pos: [2000 * k, FY - R - 30, 0], mat: 'feuRouge' });

  // ------------------------------------------------------------------ Voilure
  const vo = j.group('Voilure', { code: 'AIL', layer: 'ext' });
  const halfSpan = P.span / 2;
  const tan = Math.tan(P.sweep * D2R);
  const secZ = [R, P.kink, halfSpan - 300];
  const chordAt = (z) => (z <= P.kink ? P.root + (P.kinkChord - P.root) * (z - R) / (P.kink - R) : P.kinkChord + (P.tip - P.kinkChord) * (z - P.kink) / (halfSpan - 300 - P.kink));
  const leAt = (z) => P.wingX - (z - R) * tan;
  const yAt = (z) => FY + P.wingY + (z - R) * Math.tan(P.dihedral * D2R);
  const prf = airfoil(0.12, 0.02, 0.4, 20);
  for (const sd of SIDES) {
    const w = vo.group(`Demi-voilure ${sd.f}`, { code: `AI${sd.c}` });
    const sec = (z, frac = 0.74, t = 1) => ({ x: leAt(z), y: yAt(z), z: sd.s * z, chord: chordAt(z) * frac, tScale: t / frac });
    w.part('Caisson de voilure (revêtement)', S.loft(secZ.map((z, i) => sec(z, 0.74, i === 2 ? 0.8 : 1)), prf, 'z'), { mat: 'peintureAlu', color: 0xd9dcdf, desc: `Flèche ${P.sweep}° – dièdre ${P.dihedral}°` });
    const ws = w.group('Structure interne', { code: `AI${sd.c}`, layer: 'struct' });
    for (const [n, f] of [['Longeron avant', 0.15], ['Longeron arrière', 0.62]]) {
      const zs = [R + 50, halfSpan - 400];
      const pts = zs.map((z) => [leAt(z) - f * chordAt(z), yAt(z) + chordAt(z) * 0.03, sd.s * z]);
      ws.part(n, S.rod(pts[0], pts[1], chordAt(P.kink) * 0.07), { mat: 'alu2024' });
    }
    const nR = big ? 22 : 12;
    for (let r = 0; r < nR; r++) {
      const z = R + 200 + r * (halfSpan - R - 600) / (nR - 1);
      ws.part(`Nervure ${r + 1}`, S.loft([{ ...sec(z - 6, 0.6, 0.95), x: leAt(z) - 0.1 * chordAt(z) }, { ...sec(z + 6, 0.6, 0.95), x: leAt(z) - 0.1 * chordAt(z) }].map((s, i) => ({ ...s, z: sd.s * (z + (i ? 6 : -6)) })), prf, 'z'), { mat: 'alu2024' });
    }
    w.part('Réservoir de voilure (caisson étanche)', S.box(chordAt(P.kink) * 0.4, chordAt(P.kink) * 0.07, (halfSpan - R) * 0.6), { pos: [leAt(P.kink) - chordAt(P.kink) * 0.38, yAt(P.kink) + 30, sd.s * (R + (halfSpan - R) * 0.33)], rot: [-sd.s * P.dihedral, -sd.s * P.sweep * 0.6, 0], mat: 'alu2024', layer: 'meca', desc: 'Réservoir intégral – kérosène Jet A-1' });
    // Becs, volets, ailerons, spoilers
    const slats = big ? 5 : 1;
    for (let s = 0; s < slats; s++) {
      const z0 = P.kink * 0.5 + s * (halfSpan - P.kink * 0.5 - 600) / slats, z1 = z0 + (halfSpan - P.kink * 0.5 - 600) / slats - 50;
      w.part(`Bec de bord d'attaque ${s + 1}`, S.loft([z0, z1].map((z) => ({ x: leAt(z) + chordAt(z) * 0.03, y: yAt(z) + chordAt(z) * 0.012, z: sd.s * z, chord: chordAt(z) * 0.13, tScale: 0.6 })), airfoil(0.1), 'z'), { mat: 'aluminium' });
    }
    const te = (z) => leAt(z) - chordAt(z) * 0.74;
    const flapZ = [[R + 100, P.kink, 'Volet intérieur'], [P.kink + 50, halfSpan * 0.68, 'Volet extérieur'], [halfSpan * 0.69, halfSpan - 500, 'Aileron']];
    for (const [z0, z1, nm] of flapZ) {
      const gs = w.group(`${nm} ${sd.m}`, { code: `AI${sd.c}` });
      gs.part(nm, S.loft([z0, z1].map((z) => ({ x: te(z) - 20, y: yAt(z) + chordAt(z) * 0.035, z: sd.s * z, chord: chordAt(z) * 0.25 })), wedge(0.28), 'z'), { mat: 'composite', color: 0xc9ccd0 });
      const nb = nm === 'Aileron' ? 3 : 2;
      for (let b = 0; b < nb; b++) {
        const z = z0 + (b + 0.5) * (z1 - z0) / nb;
        gs.part(nm === 'Aileron' ? `Servocommande d'aileron ${b + 1}` : `Carénage de rail de volet ${b + 1}`, nm === 'Aileron' ? S.cyl(90, 500, 'x') : S.ellipsoid(chordAt(z) * 0.45, chordAt(z) * 0.08, 260), { pos: [te(z) - (nm === 'Aileron' ? 0 : chordAt(z) * 0.1), yAt(z) - chordAt(z) * 0.03, sd.s * z], mat: nm === 'Aileron' ? 'aluminium' : 'composite', color: nm === 'Aileron' ? undefined : 0xd9dcdf });
        gs.part(`Boulon de ferrure ${b + 1}`, S.bolt(big ? 16 : 10, 80, 'z'), { pos: [te(z) + 60, yAt(z) + 40, sd.s * (z + 40)], rot: axisRot('z', sd.s), mat: 'titane', couple: big ? 160 : 45 });
      }
    }
    const nSp = big ? 5 : 2;
    for (let s = 0; s < nSp; s++) {
      const z0 = P.kink * 0.7 + s * (halfSpan * 0.66 - P.kink * 0.7) / nSp, z1 = z0 + (halfSpan * 0.66 - P.kink * 0.7) / nSp - 60;
      const zm = (z0 + z1) / 2;
      w.part(`Spoiler / aérofrein ${s + 1}`, S.box(chordAt(zm) * 0.16, 20, z1 - z0), { pos: [te(zm) + chordAt(zm) * 0.09, yAt(zm) + chordAt(zm) * 0.085, sd.s * zm], rot: [-sd.s * P.dihedral, -sd.s * P.sweep, 0], mat: 'composite', color: 0xc9ccd0 });
    }
    const tz = halfSpan - 300;
    w.part('Ailette marginale (sharklet / winglet)', S.loft([{ x: leAt(tz), y: yAt(tz) + 50, z: sd.s * tz, chord: chordAt(tz) * 0.8 }, { x: leAt(tz) - chordAt(tz) * 0.6, y: yAt(tz) + (big ? 2400 : 1200), z: sd.s * (tz + (big ? 250 : 120)), chord: chordAt(tz) * 0.35 }], airfoil(0.08), 'y'), { mat: 'composite', color: P.accent });
    w.part(sd.s < 0 ? 'Feu de navigation rouge (bâbord)' : 'Feu de navigation vert (tribord)', S.ellipsoid(150, 60, 60), { pos: [leAt(tz) - 100, yAt(tz) + 40, sd.s * (tz + 60)], mat: sd.s < 0 ? 'feuRouge' : 'feuVert' });
    w.part('Phare d\'atterrissage', S.cyl(200, 60, 'x'), { pos: [leAt(R + 800) - 100, yAt(R + 800) - 30, sd.s * (R + 800)], mat: 'feuBlanc' });
    w.part('Carénage de jonction voilure-fuselage (karman)', S.ellipsoid(P.root * 1.4, R * 0.5, 500), { pos: [P.wingX - P.root * 0.5, FY + P.wingY + 80, sd.s * (R - 150)], mat: 'composite', color: P.paint });
    boltRow(w, { from: [P.wingX - 200, FY + P.wingY + 150, sd.s * (R + 40)], to: [P.wingX - P.root * 0.7, FY + P.wingY + 150, sd.s * (R + 40)], n: big ? 12 : 6, d: big ? 20 : 12, L: 120, axis: 'z', dir: sd.s, label: 'Boulon d\'attache voilure (Hi-Lok)', mat: 'titane', couple: big ? 400 : 90 });
  }

  // ------------------------------------------------------------------ Motorisation
  const engZs = Array.isArray(P.engZ) ? P.engZ : [P.engZ];
  const mot = j.group(`Turboréacteurs double flux (×${engZs.length * 2})`, { code: 'MOT', layer: 'meca' });
  const engList = [];
  for (const sd of SIDES) engZs.forEach((eZ, i) => engList.push([sd, eZ, sd.s < 0 ? engZs.length - i : engZs.length + 1 + i]));
  for (const [sd, eZ, eNo] of engList) {
    let ex, ey, ez;
    if (P.engines === 'wing') { ez = sd.s * eZ; ex = leAt(eZ) + P.nacL * 0.55; ey = yAt(eZ) - P.nacR - 450; }
    else { ez = sd.s * (R + P.nacR + 380); ex = xT + L * 0.28; ey = FY + R * 0.45; }
    const e = mot.group(`Moteur ${eNo} (${sd.s < 0 ? 'gauche' : 'droit'}${engZs.length > 1 ? (Math.abs(eZ) === Math.min(...engZs) ? ', intérieur' : ', extérieur') : ''})`, { code: `MO${eNo}`, pos: [ex, ey, ez] });
    const NL = P.nacL, NR = P.nacR;
    e.part('Nacelle – lèvre d\'entrée d\'air', S.revolve([[NR * 0.86, NL / 2], [NR * 0.98, NL / 2 - 80], [NR, NL / 2 - 300], [NR * 0.9, NL / 2 - 350], [NR * 0.86, NL / 2]], 'x', 64), { mat: 'aluminium', layer: 'ext' });
    e.part('Capot de soufflante', S.revolve([[NR, NL / 2 - 300], [NR * 1.01, NL * 0.1], [NR * 0.97, -NL * 0.05]], 'x', 64), { mat: 'composite', color: P.paint, layer: 'ext' });
    e.part('Inverseur de poussée (capot coulissant)', S.revolve([[NR * 0.97, -NL * 0.05], [NR * 0.85, -NL * 0.35], [NR * 0.7, -NL * 0.45]], 'x', 64), { mat: 'composite', color: P.paint, layer: 'ext', desc: 'Inverseur à grilles' });
    e.part('Cône d\'entrée (spinner)', S.revolve([[0, NL / 2 - 380], [NR * 0.18, NL / 2 - 520], [NR * 0.28, NL / 2 - 750]], 'x', 32), { mat: 'aluminium' });
    e.part('Disque de soufflante', S.cyl(NR * 0.6, 120, 'x'), { pos: [NL / 2 - 760, 0, 0], mat: 'titane' });
    for (let b = 0; b < P.fanBlades; b++) {
      const a = (b / P.fanBlades) * 360;
      e.part(`Aube de soufflante ${String(b + 1).padStart(2, '0')}`, S.box(260 * k + 60, NR * 0.56, 12), { pos: [NL / 2 - 760, Math.cos(a * D2R) * NR * 0.58, Math.sin(a * D2R) * NR * 0.58], rot: [a, 0, 0], mat: 'titane', desc: 'Aube large corde en titane / composite' });
    }
    e.part('Carter de soufflante', S.tube(NR * 1.88, NR * 1.8, NL * 0.25, 'x', 64), { pos: [NL / 2 - 700, 0, 0], mat: 'aluminium', layer: 'struct' });
    e.part('Compresseur basse pression', S.cyl(NR * 0.75, NL * 0.12, 'x'), { pos: [NL * 0.12, 0, 0], mat: 'titane' });
    e.part('Compresseur haute pression', S.cyl(NR * 0.5, NL * 0.2, 'x', 32, NR * 0.62), { pos: [-NL * 0.03, 0, 0], mat: 'titane' });
    e.part('Chambre de combustion annulaire', S.tube(NR * 0.62, NR * 0.35, NL * 0.1, 'x'), { pos: [-NL * 0.18, 0, 0], mat: 'inox', desc: 'Superalliage base nickel' });
    e.part('Turbine haute pression', S.cyl(NR * 0.6, NL * 0.05, 'x'), { pos: [-NL * 0.25, 0, 0], mat: 'inox' });
    e.part('Turbine basse pression', S.cyl(NR * 0.78, NL * 0.12, 'x', 32, NR * 0.65), { pos: [-NL * 0.34, 0, 0], mat: 'inox' });
    e.part('Arbre basse pression', S.cyl(NR * 0.12, NL * 0.85, 'x'), { pos: [0, 0, 0], mat: 'acierHR' });
    e.part('Tuyère primaire', S.revolve([[NR * 0.55, -NL * 0.4], [NR * 0.4, -NL * 0.62]], 'x', 48), { mat: 'inox' });
    e.part('Cône d\'éjection', S.revolve([[NR * 0.3, -NL * 0.4], [NR * 0.12, -NL * 0.62], [0, -NL * 0.7]], 'x', 32), { mat: 'inox' });
    e.part('Boîtier d\'accessoires (AGB)', S.box(NL * 0.25, NR * 0.3, NR * 0.5), { pos: [NL * 0.05, -NR * 0.75, 0], mat: 'aluminium' });
    e.part('Calculateur moteur FADEC', S.box(400, 120, 300), { pos: [NL * 0.2, NR * 0.7, 0], mat: 'aluminium' });
    boltCircle(e, { n: 12, pcd: NR * 1.84, d: big ? 12 : 8, L: 40, axis: 'x', at: [NL / 2 - 830, 0, 0], dir: 1, label: 'Boulon de bride de carter', mat: 'titane', couple: big ? 60 : 25 });
    const py = e.group('Mât réacteur (pylône)', { code: `MO${sd.c}`, layer: 'struct' });
    if (P.engines === 'wing') {
      py.part('Caisson de mât', S.box(NL * 0.9, 450, 320), { pos: [-NL * 0.15, NR + 220, 0], mat: 'titane' });
      py.part('Carénage de mât', S.box(NL * 1.1, 550, 360), { pos: [-NL * 0.2, NR + 260, 0], mat: 'composite', color: P.paint, layer: 'ext' });
      for (const [nm, x] of [['avant', NL * 0.2], ['arrière', -NL * 0.35]]) py.part(`Attache moteur ${nm}`, S.box(300, 200, 260), { pos: [x, NR * 0.75, 0], mat: 'titane' });
    } else {
      py.part('Mât de fuselage', S.box(NL * 0.6, 220, Math.abs(ez) - R - 80), { pos: [-NL * 0.05, 0, -sd.s * (Math.abs(ez) - R) / 2], mat: 'composite', color: P.paint, layer: 'ext' });
      py.part('Poutre de mât', S.box(NL * 0.4, 120, Math.abs(ez) - R), { pos: [-NL * 0.05, 0, -sd.s * (Math.abs(ez) - R) / 2], mat: 'titane' });
    }
    for (let b = 0; b < 4; b++) py.part(`Boulon d'attache moteur ${b + 1}`, S.bolt(big ? 24 : 14, 120, 'y'), { pos: [(b < 2 ? NL * 0.2 : -NL * 0.35) + (b % 2 ? 80 : -80), NR * 0.75 + 100, 0], rot: [180, 0, 0], mat: 'titane', couple: big ? 680 : 160 });
  }

  // ------------------------------------------------------------------ Empennages
  const em = j.group('Empennages', { code: 'EMP', layer: 'ext' });
  const sym = airfoil(0.1, 0, 0.4, 16);
  const finRoot = big ? 5800 : 2600, finTip = big ? 2000 : 1500, finH = big ? 6200 : 2900;
  const finX = xT + L * (big ? 0.155 : 0.16) + finRoot;
  const finY0 = FY + R * 0.65, finY1 = finY0 + finH;
  const finSw = finH * Math.tan((big ? 35 : 40) * D2R);
  const vt = em.group('Empennage vertical', { code: 'EMP' });
  vt.part('Dérive', S.loft([{ x: finX, y: finY0, z: 0, chord: finRoot * 0.72 }, { x: finX - finSw, y: finY1, z: 0, chord: finTip * 0.72 }], sym, 'y'), { mat: 'composite', color: P.paint, desc: 'Caisson composite carbone' });
  vt.part('Gouverne de direction', S.loft([{ x: finX - finRoot * 0.72 - 20, y: finY0 + 100, z: 0, chord: finRoot * 0.27 }, { x: finX - finSw - finTip * 0.72 - 20, y: finY1 - 100, z: 0, chord: finTip * 0.27 }], wedge(0.2), 'y'), { mat: 'composite', color: P.accent });
  for (let s = 0; s < 3; s++) vt.part(`Servocommande de direction ${s + 1}`, S.cyl(80, 400, 'x'), { pos: [finX - finRoot * 0.75 - s * finSw / 3, finY0 + 500 + s * finH / 3, 0], mat: 'aluminium', layer: 'meca' });
  for (let b = 0; b < 6; b++) vt.part(`Boulon d'attache de dérive ${b + 1}`, S.bolt(big ? 20 : 12, 100, 'z'), { pos: [finX - 300 - b * finRoot * 0.12, finY0 + 40, 60], rot: axisRot('z', 1), mat: 'titane', couple: big ? 300 : 90 });
  const hz = em.group('Empennage horizontal', { code: 'EMP' });
  const hsSpan = big ? 6200 : 3200, hsRoot = big ? 3600 : 1500, hsTip = big ? 1400 : 800;
  const hsY = P.tail === 'T' ? finY1 - 50 : FY + R * 0.15;
  const hsX = P.tail === 'T' ? finX - finSw - 100 : xT + L * 0.11 + hsRoot;
  for (const sd of SIDES) {
    hz.part(`Plan horizontal réglable ${sd.m}`, S.loft([{ x: hsX, y: hsY, z: sd.s * (P.tail === 'T' ? 80 : R * 0.55), chord: hsRoot * 0.72 }, { x: hsX - hsSpan * Math.tan(32 * D2R), y: hsY + hsSpan * 0.06, z: sd.s * hsSpan, chord: hsTip * 0.72 }], sym, 'z'), { mat: 'composite', color: P.paint });
    hz.part(`Gouverne de profondeur ${sd.f}`, S.loft([{ x: hsX - hsRoot * 0.72 - 20, y: hsY, z: sd.s * (P.tail === 'T' ? 100 : R * 0.6), chord: hsRoot * 0.28 }, { x: hsX - hsSpan * Math.tan(32 * D2R) - hsTip * 0.72 - 20, y: hsY + hsSpan * 0.06, z: sd.s * (hsSpan - 50), chord: hsTip * 0.28 }], wedge(0.2), 'z'), { mat: 'composite', color: 0xc9ccd0 });
    hz.part(`Servocommande de profondeur ${sd.m}`, S.cyl(70, 350, 'x'), { pos: [hsX - hsRoot * 0.7, hsY, sd.s * hsSpan * 0.3], mat: 'aluminium', layer: 'meca' });
  }
  hz.part('Vérin à vis de plan réglable (THSA)', S.cyl(120, 700, 'y'), { pos: [hsX - hsRoot * 0.3, hsY - 400, 0], mat: 'acierHR', layer: 'meca' });
  em.part('Feu de position arrière', S.ellipsoid(120, 60, 60), { pos: [xT + 50, FY + 200, 0], mat: 'feuBlanc' });

  // ------------------------------------------------------------------ Trains d'atterrissage
  const tr = j.group('Trains d\'atterrissage', { code: 'ATT', layer: 'sol' });
  const MG = P.mainGear, NG = P.noseGear;
  const mgx = P.wingX - P.root * 0.75;
  const mgTop = yAt(MG.z) + 50;
  for (const sd of SIDES) {
    const g = tr.group(`Train principal ${sd.m}`, { code: 'ATT' });
    const axY = MG.D / 2, z = sd.s * MG.z;
    g.part('Caisson d\'amortisseur (jambe)', S.rod([mgx, mgTop, z], [mgx, axY + MG.D * 0.6, z], big ? 300 : 120), { mat: 'acierHR', color: 0xd9dcdf, desc: 'Amortisseur oléopneumatique' });
    g.part('Tige coulissante chromée', S.rod([mgx, axY + MG.D * 0.6, z], [mgx, axY, z], big ? 220 : 90), { mat: 'chrome' });
    g.part('Contrefiche latérale', S.rod([mgx, (mgTop + axY) / 2 + 200, z], [mgx - 200, mgTop, sd.s * (MG.z - (big ? 1500 : 600))], big ? 140 : 60), { mat: 'acierHR', color: 0xd9dcdf });
    g.part('Compas (bras anti-rotation)', S.box(big ? 500 : 200, 60, 80), { pos: [mgx + (big ? 250 : 100), axY + MG.D * 0.4, z], rot: [0, 0, 50], mat: 'titane' });
    g.part('Vérin de relevage', S.rod([mgx + 300, mgTop - 300, z], [mgx + 200, mgTop, sd.s * (MG.z - 800)], big ? 150 : 60), { mat: 'chrome', layer: 'meca' });
    g.part('Essieu', S.cyl(big ? 180 : 60, MG.wheels > 1 ? MG.W * 2.6 : MG.W * 1.5, 'z'), { pos: [mgx, axY, z], mat: 'acierHR' });
    const wz = MG.wheels > 1 ? [-1, 1] : [0];
    for (const o of wz) {
      wheel(g, `Roue principale ${sd.f}${MG.wheels > 1 ? (o * sd.s > 0 ? ' extérieure' : ' intérieure') : ''}`, o === 0 ? sd.s : o, {
        pos: [mgx, axY, z + o * MG.W * 0.65], D: MG.D, W: MG.W, rimD: MG.rimD, tireRef: MG.tireRef, studs: big ? 12 : 6, pcd: MG.rimD * 0.55, stud: big ? 14 : 8, studL: 40, studLabel: 'Boulon de jante', couple: big ? 90 : 25,
        disc: [MG.rimD * 0.9, big ? 120 : 30], caliper: false, code: 'ROU', hubD: MG.rimD * 0.45, hubL: MG.W * 0.6, spokes: 6, spokeW: big ? 80 : 30, rimMat: 'aluminium', cap: false,
      });
    }
    g.part(big ? 'Freins carbone multidisques' : 'Freins multidisques', S.cyl(MG.rimD * 0.85, MG.W * 0.6, 'z'), { pos: [mgx, axY, z], mat: 'carbone' });
    g.part('Trappe de train', S.box(MG.D * 1.3, 15, MG.D * 1.1), { pos: [mgx - 100, FY - R * 0.85, sd.s * (R * 0.5 + MG.D * 0.3)], rot: [sd.s * 80, 0, 0], mat: 'composite', color: P.paint, layer: 'ext' });
  }
  const ng = tr.group('Train avant orientable', { code: 'ATT' });
  const nax = NG.D / 2;
  ng.part('Jambe de train avant', S.rod([NG.x, FY - R * 0.6, 0], [NG.x, nax + NG.D * 0.5, 0], big ? 200 : 90), { mat: 'acierHR', color: 0xd9dcdf });
  ng.part('Tige coulissante', S.rod([NG.x, nax + NG.D * 0.5, 0], [NG.x, nax, 0], big ? 140 : 60), { mat: 'chrome' });
  ng.part('Vérin d\'orientation', S.cyl(big ? 150 : 60, big ? 400 : 160, 'z'), { pos: [NG.x, nax + NG.D * 0.8, 0], mat: 'aluminium', layer: 'meca' });
  ng.part('Contrefiche de train avant', S.rod([NG.x, nax + NG.D * 0.7, 0], [NG.x - (big ? 1600 : 600), FY - R * 0.7, 0], big ? 120 : 50), { mat: 'acierHR', color: 0xd9dcdf });
  ng.part('Phare de roulage', S.cyl(big ? 180 : 90, 60, 'x'), { pos: [NG.x + 150, nax + NG.D * 0.9, 0], mat: 'feuBlanc' });
  ng.part('Essieu avant', S.cyl(big ? 100 : 40, NG.W * 2.8, 'z'), { pos: [NG.x, nax, 0], mat: 'acierHR' });
  for (const sd of SIDES) {
    wheel(ng, `Roue avant ${sd.f}`, sd.s, { pos: [NG.x, nax, sd.s * NG.W * 0.7], D: NG.D, W: NG.W, rimD: NG.rimD, tireRef: NG.tireRef, studs: big ? 8 : 6, pcd: NG.rimD * 0.5, stud: big ? 10 : 6, studL: 30, studLabel: 'Boulon de jante', couple: big ? 40 : 15, code: 'ROU', hubD: NG.rimD * 0.4, hubL: NG.W * 0.5, spokes: 5, spokeW: big ? 50 : 20, rimMat: 'aluminium', cap: false });
  }

  // ------------------------------------------------------------------ Cabine
  const cb = j.group(big ? 'Cabine passagers & poste de pilotage' : 'Cabine & poste de pilotage', { code: 'CAB', layer: 'int' });
  const ck = cb.group('Poste de pilotage', { code: 'CKP' });
  const ckx = xN - 3200 * k;
  ck.part('Planche de bord (5 écrans)', S.box(200, 500 * k + 150, R * 1.5), { pos: [ckx + 600 * k, FY + R * 0.1, 0], mat: 'abs', color: 0x2c2e33 });
  for (let s = 0; s < 5; s++) ck.part(`Écran d'affichage ${s + 1}`, S.box(20, 200 * k + 80, 200 * k + 80), { pos: [ckx + 500 * k, FY + R * 0.15, (s - 2) * R * 0.28], mat: 'ecran' });
  ck.part('Pupitre central (manettes de poussée)', S.box(800 * k + 200, 300, 400 * k + 120), { pos: [ckx, FY - R * 0.15, 0], mat: 'abs', color: 0x2c2e33 });
  ck.part('Panneau plafond (overhead)', S.box(800 * k + 300, 80, R * 0.8), { pos: [ckx + 200, FY + R * 0.82, 0], rot: [0, 0, 10], mat: 'abs', color: 0x2c2e33 });
  for (const sd of SIDES) {
    ck.part(`Siège pilote ${sd.s < 0 ? '(commandant de bord)' : '(copilote)'}`, S.box(500, 1000, 500), { pos: [ckx - 400 * k, FY - R * 0.05, sd.s * R * 0.45], mat: 'cuir', color: 0x2a2c30 });
    ck.part(big ? `Mini-manche latéral ${sd.m}` : `Manche ${sd.m}`, S.cyl(40, 200, 'y'), { pos: [ckx - 100 * k, FY - R * 0.1, sd.s * R * 0.8], mat: 'abs', color: 0x111111 });
    ck.part(`Palonnier ${sd.m}`, S.box(80, 200, 300), { pos: [ckx + 500 * k, FY - R * 0.6, sd.s * R * 0.45], mat: 'aluminium' });
  }
  const pax = cb.group(big ? 'Rangées de sièges passagers' : 'Fauteuils passagers', { code: 'PAX' });
  const seatW = big ? 1500 : 650, pitch = big ? 780 : 1500;
  for (let r = 0; r < P.rows; r++) {
    const x = xN - (big ? 6200 : 4300) - r * pitch;
    for (const sd of SIDES) pax.part(`Rang ${r + 1} – ${big ? 'triple ' : ''}${sd.m}`, S.box(500, 1050, seatW), { pos: [x, FY - R * 0.35 + 500, sd.s * (big ? 1080 : 520)], mat: 'tissu', color: big ? 0x23355f : 0xd8cbb5 });
  }
  if (big) {
    for (const sd of SIDES) cb.part(`Coffres à bagages ${sd.m}`, S.box(L * 0.55, 450, 600), { pos: [xN - 6200 - L * 0.27, FY + R * 0.55, sd.s * (R * 0.62)], mat: 'abs', color: 0xe8e8e6 });
    cb.part('Office avant (galley)', S.box(900, 1800, 1500), { pos: [xN - 5300, FY + 400, 0], mat: 'inox' });
    cb.part('Office arrière (galley)', S.box(900, 1800, 3200), { pos: [xT + L * 0.26, FY + 400, 0], mat: 'inox' });
    cb.part('Toilettes avant', S.box(1000, 2000, 900), { pos: [xN - 5300, FY + 400, -1300], mat: 'composite' });
    for (const sd of SIDES) cb.part(`Toilettes arrière ${sd.m}`, S.box(1000, 2000, 900), { pos: [xT + L * 0.28 + 1000, FY + 400, sd.s * 1300], mat: 'composite' });
  } else {
    cb.part('Divan latéral 3 places', S.box(1800, 700, 600), { pos: [xN - 4300 - 4 * pitch, FY - R * 0.35 + 350, R * 0.55], mat: 'cuir', color: 0xd8cbb5 });
    cb.part('Office (galley)', S.box(900, 1500, 600), { pos: [xN - 3700, FY + 100, -R * 0.55], mat: 'bois' });
    cb.part('Cabinet de toilette', S.box(1200, 1600, 1500), { pos: [xT + L * 0.33, FY + 100, 0], mat: 'composite' });
  }
  return j;
}
