// Bus & autocars – générateur paramétrique (cotes en mm)
// Repère : X avant, Y haut, Z droite. Origine au sol, au milieu de l'empattement.
// Les portes de service sont du côté droit (+Z), comme en Europe continentale.
import { Assembly, S, SIDES, boltRow, boltCircle } from '../core/builder.js';
import { wheel, inlineEngine } from '../core/parts.js';

const CHASSIS = 0x202326;

import { BUS_TYPES } from './meta/bus.js';

export { BUS_TYPES };

/** Intervalles de [a, b] privés des « trous » [[a1, b1], …] */
function minus(a, b, holes) {
  const res = [];
  let cur = a;
  for (const [h0, h1] of [...holes].sort((p, q) => p[0] - q[0])) {
    if (h1 <= cur || h0 >= b) continue;
    if (h0 > cur) res.push([cur, h0]);
    cur = Math.max(cur, h1);
  }
  if (cur < b) res.push([cur, b]);
  return res;
}

export function buildBus(type = 'urbain') {
  const P = BUS_TYPES[type] || BUS_TYPES.urbain;
  const { L, W, H, WB, floor, belt, winTop, paint, clr } = P;
  const XF = WB / 2, XR = -WB / 2;
  const xF = XF + P.fo, xR = xF - L;
  const D = Math.round(P.tire[2] * 25.4 + 2 * P.tire[0] * P.tire[1] / 100);
  const WY = D / 2, AR = D / 2 + 70;
  const hw = W / 2;
  const roofY = P.coach ? H - 100 : (P.power === 'ev' ? H - 300 : H - 100);
  const ev = P.power === 'ev';

  const bus = new Assembly(P.label, { prefix: 'BS', code: 'GEN', layer: 'meca', desc: `${P.desc} – ${L} × ${W} × ${H} mm – empattement ${WB} mm` });

  // ------------------------------------------------------------------ Ossature (structure)
  const oss = bus.group('Ossature & plancher', { code: 'OSS', layer: 'struct' });
  const longY = P.coach ? floor - 450 : 520;
  for (const sd of SIDES) {
    oss.part(`Longeron inférieur ${sd.m}`, S.box(L - 200, 120, 60), { pos: [(xF + xR) / 2, P.coach ? longY : clr + 120, sd.s * (hw - 60)], mat: 'acier', color: CHASSIS, desc: 'Tube carré 120 × 60 × 4 mm – acier S355 cataphorèse' });
    oss.part(`Lisse de ceinture ${sd.m}`, S.box(L - 200, 60, 50), { pos: [(xF + xR) / 2, belt - 30, sd.s * (hw - 45)], mat: 'acier', color: CHASSIS });
    oss.part(`Lisse de pavillon ${sd.m}`, S.box(L - 300, 60, 50), { pos: [(xF + xR) / 2, roofY - 40, sd.s * (hw - 50)], mat: 'acier', color: CHASSIS });
  }
  oss.part('Plancher (contreplaqué marine + revêtement)', S.box(L - 300, 25, W - 140), { pos: [(xF + xR) / 2, floor, 0], mat: 'bois', desc: 'Contreplaqué marine 18 mm + revêtement PVC antidérapant' });
  const nCross = Math.round(L / 700);
  for (let i = 0; i <= nCross; i++) {
    const x = xR + 150 + i * ((L - 300) / nCross);
    oss.part(`Traverse de plancher ${i + 1}`, S.box(50, 80, W - 140), { pos: [x, floor - 55, 0], mat: 'acier', color: CHASSIS });
    oss.part(`Arceau de pavillon ${i + 1}`, S.box(50, 50, W - 120), { pos: [x, roofY - 30, 0], mat: 'acier', color: CHASSIS });
  }
  if (!P.coach && !P.frontEngine) oss.part('Podium arrière (compartiment moteur)', S.box(2300, 700 - floor, W - 140), { pos: [xR + 1300, (700 + floor) / 2, 0], mat: 'acier', color: CHASSIS, desc: 'Plancher surélevé au-dessus du groupe motopropulseur' });

  // Montants de baie : vitres latérales entre ceinture et haut de baie
  const doorsR = P.doors.map((d) => [d.x - d.w / 2, d.x + d.w / 2]);
  const winX0 = xR + 400, winX1 = xF - 900;
  const pitch = P.coach ? 1450 : 1350;
  const nWin = Math.max(3, Math.round((winX1 - winX0) / pitch));
  const posts = [];
  for (let i = 0; i <= nWin; i++) posts.push(winX0 + i * (winX1 - winX0) / nWin);
  for (const sd of SIDES) {
    posts.forEach((x, i) => {
      oss.part(`Montant de baie ${sd.c}${i + 1}`, S.box(70, winTop - belt + 40, 50), { pos: [x, (belt + winTop) / 2, sd.s * (hw - 45)], mat: 'acier', color: CHASSIS });
    });
  }
  // Fixations de plancher
  for (const sd of SIDES) boltRow(oss, { from: [xR + 400, floor + 14, sd.s * (hw - 120)], to: [xF - 400, floor + 14, sd.s * (hw - 120)], n: 10, d: 8, L: 40, axis: 'y', dir: 1, label: `Vis de plancher ${sd.c}`, kind: 'cap', couple: 25 });

  // ------------------------------------------------------------------ Carrosserie
  const car = bus.group('Carrosserie', { code: 'CAR', layer: 'ext' });
  // Bas de caisse latéral avec passages de roue (et découpes de portes à droite)
  const skirt = (x0, x1) => {
    const pts = [[x0, clr]];
    for (const cx of [XR, XF]) {
      if (cx - AR > x0 && cx + AR < x1) {
        pts.push([cx - AR, clr], [cx - AR, WY]);
        for (let i = 1; i < 20; i++) { const a = Math.PI - (i / 20) * Math.PI; pts.push([cx + AR * Math.cos(a), WY + AR * Math.sin(a)]); }
        pts.push([cx + AR, WY], [cx + AR, clr]);
      }
    }
    pts.push([x1, clr], [x1, belt], [x0, belt]);
    return pts;
  };
  for (const sd of SIDES) {
    const segs = sd.s > 0 ? minus(xR + 60, xF - 60, doorsR) : [[xR + 60, xF - 60]];
    segs.forEach(([a, b], i) => car.part(`Panneau latéral ${sd.m}${segs.length > 1 ? ` ${i + 1}` : ''}`, S.extrude(skirt(a, b), 4), { pos: [0, 0, sd.s * (hw - 2)], mat: 'peintureAlu', color: paint, desc: 'Tôle aluminium 2 mm collée sur ossature' }));
    car.part(`Bandeau décoratif ${sd.m}`, S.box(L - 400, 120, 6), { pos: [(xF + xR) / 2 - 100, belt - 160, sd.s * (hw + 2)], mat: 'composite', color: P.stripe });
  }
  // Vitrage latéral
  const vit = car.group('Vitrage', { code: 'VIT' });
  for (const sd of SIDES) {
    for (let i = 0; i < nWin; i++) {
      const a = posts[i] + 35, b = posts[i + 1] - 35;
      const parts = sd.s > 0 ? minus(a, b, doorsR) : [[a, b]];
      parts.forEach(([p0, p1], k) => {
        if (p1 - p0 < 150) return;
        vit.part(`Vitre latérale ${sd.c}${i + 1}${parts.length > 1 ? String.fromCharCode(97 + k) : ''}`, S.box(p1 - p0, winTop - belt - 20, 8), { pos: [(p0 + p1) / 2, (belt + winTop) / 2, sd.s * (hw - 10)], mat: 'verre', desc: 'Verre trempé teinté 5 mm, collé (vitrage affleurant)' });
      });
    }
    vit.part(`Vitre de cabine conducteur ${sd.m}`, S.box(xF - 120 - winX1, winTop - belt + 200, 8), { pos: [(xF - 120 + winX1) / 2, (belt - 200 + winTop) / 2, sd.s * (hw - 10)], mat: 'verre' });
  }
  vit.part('Pare-brise panoramique', S.box(10, roofY - 250 - (P.coach ? belt - 300 : 900), W - 160), { pos: [xF - 20, (roofY - 250 + (P.coach ? belt - 300 : 900)) / 2, 0], rot: [0, 0, P.coach ? 6 : 3], mat: 'verre', desc: 'Verre feuilleté chauffant' });
  vit.part('Lunette arrière', S.box(8, 700, W - 500), { pos: [xR + 8, winTop - 400, 0], mat: 'verre' });

  // Pavillon, faces avant / arrière
  car.part('Pavillon', S.box(L - 120, 80, W - 20), { pos: [(xF + xR) / 2, roofY + 40, 0], mat: 'composite', color: paint, desc: 'Pavillon composite sandwich' });
  for (const sd of SIDES) car.part(`Corniche de pavillon ${sd.f}`, S.box(L - 120, roofY - winTop, 8), { pos: [(xF + xR) / 2, (roofY + winTop) / 2, sd.s * (hw - 4)], mat: 'peintureAlu', color: paint });
  car.part('Masque avant', S.box(60, (P.coach ? belt - 300 : 900) - clr, W - 40), { pos: [xF - 30, ((P.coach ? belt - 300 : 900) + clr) / 2, 0], mat: 'composite', color: paint });
  car.part('Face arrière', S.box(60, winTop - 400 - 350 - clr, W - 40), { pos: [xR + 30, (winTop - 750 + clr) / 2, 0], mat: 'composite', color: paint });
  car.part('Pare-chocs avant', S.box(160, 300, W), { pos: [xF + 20, clr + 200, 0], mat: 'abs', color: 0x2a2c30 });
  car.part('Pare-chocs arrière', S.box(160, 300, W), { pos: [xR - 20, clr + 200, 0], mat: 'abs', color: 0x2a2c30 });
  car.part('Girouette avant (afficheur de ligne)', S.box(20, 220, W - 500), { pos: [xF - 40, roofY - 140, 0], mat: 'ecran', desc: 'Afficheur LED ambre – numéro et destination' });
  car.part('Girouette latérale', S.box(900, 180, 10), { pos: [XF - 300, winTop - 150, hw - 20], mat: 'ecran' });
  car.part('Girouette arrière', S.box(10, 180, 500), { pos: [xR - 5, winTop - 150, 0], mat: 'ecran' });
  car.part('Plaque d\'immatriculation avant', S.box(4, 110, 520), { pos: [xF + 105, clr + 220, 0], mat: 'aluminium', color: 0xffffff });
  car.part('Plaque d\'immatriculation arrière', S.box(4, 110, 520), { pos: [xR - 105, clr + 420, 0], mat: 'aluminium', color: 0xffffff });
  const ecl = car.group('Éclairage & signalisation', { code: 'ECL' });
  for (const sd of SIDES) {
    ecl.part(`Projecteur avant ${sd.m}`, S.box(40, 120, 360), { pos: [xF + 5, clr + 480, sd.s * (hw - 300)], mat: 'feuBlanc' });
    ecl.part(`Clignotant avant ${sd.m}`, S.box(40, 80, 120), { pos: [xF + 5, clr + 480, sd.s * (hw - 60)], mat: 'feuOrange' });
    ecl.part(`Feu arrière vertical ${sd.m}`, S.box(40, 700, 160), { pos: [xR - 5, clr + 900, sd.s * (hw - 120)], mat: 'feuRouge' });
    ecl.part(`Feu de gabarit avant ${sd.m}`, S.box(30, 50, 60), { pos: [xF - 40, roofY + 20, sd.s * (hw - 60)], mat: 'feuBlanc' });
    for (let k = 0; k < 4; k++) ecl.part(`Feu de position latéral ${sd.c}${k + 1}`, S.box(80, 40, 10), { pos: [xR + 1000 + k * (L - 2000) / 3, clr + 120, sd.s * (hw + 4)], mat: 'feuOrange' });
  }
  for (const sd of SIDES) {
    const rv = car.group(`Rétroviseur ${sd.m}`, { code: 'RET' });
    rv.part('Bras de rétroviseur', S.pipe([[xF - 60, roofY - 150, sd.s * (hw - 200)], [xF + 250, roofY - 100, sd.s * (hw + 50)], [xF + 300, roofY - 400, sd.s * (hw + 250)]], 30), { mat: 'aluminium', color: 0x222222 });
    rv.part('Coque de rétroviseur', S.box(80, 450, 220), { pos: [xF + 300, roofY - 650, sd.s * (hw + 260)], mat: 'abs', color: 0x222222 });
    rv.part('Miroir', S.box(6, 420, 200), { pos: [xF + 260, roofY - 650, sd.s * (hw + 260)], mat: 'chrome' });
    boltCircle(rv, { n: 3, pcd: 60, d: 8, L: 25, axis: 'x', at: [xF - 70, roofY - 150, sd.s * (hw - 200)], dir: 1, label: 'Vis de bras', couple: 20 });
  }

  // Portes de service (vantaux vitrés louvoyants)
  const por = car.group('Portes de service', { code: 'POR' });
  P.doors.forEach((d) => {
    const top = P.coach ? winTop - 50 : winTop + 30;
    const bot = P.coach ? 400 : floor;
    const n = d.w > 1100 ? 2 : 1;
    for (let k = 0; k < n; k++) {
      const vw = d.w / n - 20, vx = d.x - d.w / 2 + (k + 0.5) * d.w / n;
      const pg = por.group(`Porte ${d.name}${n > 1 ? ` – vantail ${k ? 'arrière' : 'avant'}` : ''}`, { code: 'POR' });
      pg.part('Cadre de vantail', S.box(vw, top - bot, 30), { pos: [vx, (top + bot) / 2, hw - 5], mat: 'aluminium', color: 0x2a2c30 });
      pg.part('Vitre de vantail', S.box(vw - 80, top - bot - 400, 10), { pos: [vx, (top + bot) / 2 + 150, hw + 12], mat: 'verre' });
      pg.part('Joint de vantail', S.box(10, top - bot, 40), { pos: [vx + (k ? -1 : 1) * (vw / 2 - 5), (top + bot) / 2, hw], mat: 'caoutchouc' });
      pg.part('Colonne de commande (pivot)', S.cyl(50, top - bot + 100, 'y'), { pos: [vx + (k ? 1 : -1) * (vw / 2 - 40), (top + bot) / 2, hw - 60], mat: 'acier', layer: 'meca' });
    }
    por.part(`Vérin pneumatique de porte ${d.name}`, S.cyl(60, 400, 'x'), { pos: [d.x, top + 80, hw - 120], mat: 'aluminium', layer: 'meca' });
    por.part(`Bouton de demande de porte ${d.name}`, S.cyl(50, 15, 'z'), { pos: [d.x + d.w / 2 + 60, 1200, hw + 10], mat: 'feuVert' });
    if (!P.coach && !P.frontEngine) por.part(`Marche de porte ${d.name}`, S.box(d.w, 30, 300), { pos: [d.x, floor - 10, hw - 150], mat: 'aluminium', layer: 'int' });
  });
  if (P.coach) {
    const so = car.group('Soutes à bagages', { code: 'SOU' });
    const sx0 = XR + AR + 150, sx1 = XF - AR - 150, n = 3, sw = (sx1 - sx0) / n;
    for (const sd of SIDES) for (let k = 0; k < n; k++) {
      so.part(`Portillon de soute ${sd.c}${k + 1}`, S.box(sw - 30, floor - longY - 300, 30), { pos: [sx0 + (k + 0.5) * sw, (floor + longY) / 2 - 20, sd.s * (hw + 8)], mat: 'peintureAlu', color: paint });
      so.part(`Serrure de soute ${sd.c}${k + 1}`, S.box(120, 40, 20), { pos: [sx0 + (k + 0.5) * sw, floor - 200, sd.s * (hw + 30)], mat: 'chrome' });
    }
    so.part('Bac de soute (traversant)', S.box(sx1 - sx0, floor - longY - 200, W - 200), { pos: [(sx0 + sx1) / 2, (floor + longY) / 2 - 50, 0], mat: 'aluminium', layer: 'int', desc: 'Volume utile ≈ 11 m³' });
  }

  // ------------------------------------------------------------------ Aménagement intérieur
  const amg = bus.group('Aménagement intérieur', { code: 'AMG', layer: 'int' });
  const sieges = amg.group('Sièges passagers', { code: 'SIE' });
  const sit = (g, name, x, z) => {
    const s = g.group(name, { pos: [x, floor, z], code: 'SIE' });
    s.part('Coque d\'assise', S.box(440, 80, 440), { pos: [0, 440, 0], mat: 'abs', color: P.coach ? 0x1f2a44 : 0x3a3d42 });
    s.part('Coussin', S.box(420, 50, 420), { pos: [0, 500, 0], mat: 'tissu', color: P.coach ? 0x2c3e66 : 0x22406e });
    s.part('Dossier', S.box(60, P.coach ? 720 : 560, 440), { pos: [-230, P.coach ? 860 : 780, 0], rot: [0, 0, -8], mat: 'tissu', color: P.coach ? 0x2c3e66 : 0x22406e });
    s.part('Poignée de dossier', S.box(30, 30, 300), { pos: [-250, P.coach ? 1240 : 1080, 0], mat: 'inox' });
    s.part('Pied de siège', S.box(60, 400, 60), { pos: [0, 200, 0], mat: 'acier' });
    for (const dz of [-1, 1]) s.part(`Vis de fixation au rail ${dz < 0 ? 'a' : 'b'}`, S.capScrew(8, 25), { pos: [0, 15, dz * 150], mat: 'acierHR', couple: 25 });
    if (P.coach) s.part('Ceinture de sécurité 2 points', S.box(20, 10, 380), { pos: [10, 545, 0], mat: 'tissu', color: 0x111111 });
  };
  const rowX0 = P.coach ? xR + 900 : xR + 700, rowX1 = P.frontEngine ? xF - 1600 : xF - 1900;
  const rp = P.coach ? 820 : 760;
  const nRows = Math.floor((rowX1 - rowX0) / rp) + 1;
  let nSeats = 0;
  for (let r = 0; r < nRows; r++) {
    const x = rowX0 + r * rp;
    for (const sd of SIDES) {
      const nearDoor = sd.s > 0 && doorsR.some(([a, b]) => x > a - 450 && x < b + 450);
      const pmr = !P.coach && x > 200 && x < 2400 && sd.s < 0; // plateforme fauteuil roulant / poussettes
      const arch = !P.coach && Math.abs(x - XF) < AR + 200;
      if (nearDoor || pmr || arch) continue;
      for (const k of [0, 1]) {
        nSeats++;
        sit(sieges, `Siège ${String(nSeats).padStart(2, '0')} (rang ${r + 1} ${sd.m}${k ? ' couloir' : ' fenêtre'})`, x, sd.s * (hw - 300 - k * 460));
      }
    }
  }
  if (!P.coach) {
    const bm = amg.group('Barres de maintien', { code: 'BAR' });
    for (const sd of SIDES) bm.part(`Main courante de pavillon ${sd.m}`, S.cyl(32, L - 2800, 'x'), { pos: [(xF + xR) / 2 - 300, roofY - 250, sd.s * (hw - 700)], mat: 'inox' });
    let k = 0;
    for (const d of P.doors) for (const dx of [-1, 1]) {
      k++;
      bm.part(`Barre verticale de porte ${k}`, S.cyl(35, roofY - 250 - floor, 'y'), { pos: [d.x + dx * (d.w / 2 + 80), (roofY - 250 + floor) / 2, hw - 600], mat: 'inox', desc: 'Tube inox Ø 35 mm, bouton de demande d\'arrêt intégré' });
    }
    for (let r = 1; r < nRows; r += 2) for (const sd of SIDES) {
      k++;
      bm.part(`Barre verticale de couloir ${k}`, S.cyl(35, roofY - 250 - floor - 450, 'y'), { pos: [rowX0 + r * rp - 250, (roofY - 250 + floor + 450) / 2, sd.s * (hw - 1060)], mat: 'inox' });
    }
    amg.part('Rampe d\'accès PMR (rabattable)', S.box(900, 20, 800), { pos: [P.doors[1].x, floor + 12, hw - 500], mat: 'aluminium', desc: 'Rampe manuelle 300 kg – pente ≤ 12 %' });
    amg.part('Plateforme fauteuil roulant – appui dorsal', S.box(300, 900, 80), { pos: [1300, floor + 600, -hw + 200], mat: 'abs' });
    for (const d of P.doors) amg.part(`Valideur sans contact porte ${d.name}`, S.box(120, 200, 90), { pos: [d.x - d.w / 2 - 150, floor + 1100, hw - 650], mat: 'ecran' });
  } else {
    amg.part('Porte-bagages longitudinal gauche', S.box(L - 3500, 60, 450), { pos: [(xF + xR) / 2 - 300, winTop + 150, -hw + 300], mat: 'abs' });
    amg.part('Porte-bagages longitudinal droit', S.box(L - 3500, 60, 450), { pos: [(xF + xR) / 2 - 300, winTop + 150, hw - 300], mat: 'abs' });
    amg.part('Toilettes / cabinet', S.box(1100, roofY - floor - 100, 900), { pos: [P.doors[1].x - 1000, (roofY + floor) / 2, hw - 500], mat: 'composite' });
    for (let i = 0; i < 4; i++) amg.part(`Écran vidéo ${i + 1}`, S.box(30, 280, 450), { pos: [xF - 2200 - i * 2500, winTop + 50, 0], mat: 'ecran' });
  }
  const pc = amg.group('Poste de conduite', { code: 'PDC' });
  const pcX = xF - 1100, pcY = P.coach ? floor - 300 : floor;
  pc.part('Siège conducteur suspendu', S.box(500, 120, 520), { pos: [pcX - 100, pcY + 500, -hw + 600], mat: 'tissu', color: 0x111111 });
  pc.part('Dossier conducteur', S.box(110, 700, 520), { pos: [pcX - 380, pcY + 900, -hw + 600], rot: [0, 0, -10], mat: 'tissu', color: 0x111111 });
  pc.part('Suspension pneumatique de siège', S.cyl(180, 250, 'y'), { pos: [pcX - 100, pcY + 300, -hw + 600], mat: 'caoutchouc', layer: 'meca' });
  pc.part('Planche de bord', S.box(500, 300, 1300), { pos: [xF - 380, pcY + 900, -hw + 750], rot: [0, 0, 15], mat: 'abs' });
  pc.part('Combiné d\'instruments', S.box(30, 200, 450), { pos: [xF - 520, pcY + 1080, -hw + 600], rot: [0, 0, 15], mat: 'ecran' });
  pc.part('Volant (Ø 450 mm)', S.torus(450, 32, 'x'), { pos: [pcX + 250, pcY + 1050, -hw + 600], rot: [0, 0, -30], mat: 'cuir', color: 0x111111 });
  pc.part('Colonne de direction', S.rod([pcX + 250, pcY + 1050, -hw + 600], [xF - 300, pcY + 350, -hw + 600], 50), { mat: 'acier', layer: 'meca' });
  pc.part('Pupitre de vente / pupitre conducteur', S.box(400, 120, 400), { pos: [pcX + 100, pcY + 1050, -hw + 1150], mat: 'abs' });
  pc.part('Pédale d\'accélérateur', S.box(80, 250, 100), { pos: [xF - 350, pcY + 200, -hw + 500], rot: [0, 0, 30], mat: 'abs' });
  pc.part('Pédale de frein', S.box(80, 250, 120), { pos: [xF - 350, pcY + 220, -hw + 680], rot: [0, 0, 30], mat: 'abs' });
  if (!P.coach && !P.frontEngine) pc.part('Porte de cabine conducteur', S.box(600, 1100, 30), { pos: [pcX - 350, floor + 650, -hw + 950], mat: 'verre' });

  // ------------------------------------------------------------------ Groupe motopropulseur
  const gmp = bus.group(ev ? 'Chaîne de traction électrique' : 'Groupe motopropulseur', { code: 'GMP', layer: 'meca' });
  if (!ev) {
    const big = P.coach;
    const eng = P.frontEngine
      ? { n: 4, bore: 110, stroke: 134, pitch: 130, pos: [XF + 300, WY + 450, 0], label: 'Moteur diesel 4 cylindres 5,1 L – 155 kW' }
      : { n: 6, bore: big ? 125 : 110, stroke: big ? 145 : 135, pitch: big ? 150 : 135, pos: [xR + 950, WY + 420, 0], rot: [0, 180, 0], label: big ? 'Moteur diesel 6 cylindres 10,7 L – 335 kW' : 'Moteur diesel 6 cylindres 7,7 L – 260 kW' };
    inlineEngine(gmp, eng.label, { ...eng, code: 'MOT', diesel: true, turbo: true, headBolt: 16, headTorque: '100 N·m + 3 × 90°', journal: 85, rodD: 40, pin: 45, flywheel: 430, alt: 170, desc: 'Euro VI – injection rampe commune – turbo à géométrie variable' });
    const bx = P.frontEngine ? XF - 500 : xR + 1900;
    gmp.part(P.coach ? 'Boîte de vitesses robotisée 12 rapports' : 'Boîte de vitesses automatique 6 rapports avec ralentisseur', S.cyl(450, 900, 'x'), { pos: [bx, WY + 300, 0], mat: 'aluminium' });
    gmp.part('Arbre de transmission', S.cyl(100, P.frontEngine ? XF - XR - 1200 : 600, 'x'), { pos: [P.frontEngine ? (XF + XR) / 2 - 200 : XR + 900, WY + 50, 0], mat: 'acierHR' });
    gmp.part('Radiateur de refroidissement', S.box(80, 900, 1100), { pos: P.frontEngine ? [xF - 250, WY + 500, 0] : [xR + 700, 1300, -hw + 200], rot: P.frontEngine ? [0, 0, 0] : [0, 90, 0], mat: 'aluminium' });
    gmp.part('Ventilateur hydrostatique', S.cyl(700, 120, P.frontEngine ? 'x' : 'z'), { pos: P.frontEngine ? [xF - 400, WY + 500, 0] : [xR + 700, 1300, -hw + 350], mat: 'plastique' });
    gmp.part('Réservoir de gazole', S.box(1200, 500, 550), { pos: [XF - 900, P.coach ? longY + 300 : 700, -hw + 400], mat: 'aluminium', desc: `${P.coach ? 480 : 260} litres` });
    gmp.part('Réservoir d\'AdBlue', S.box(500, 450, 350), { pos: [XF - 1800, P.coach ? longY + 300 : 700, -hw + 300], mat: 'plastique', color: 0x1f4fa0, desc: '50 litres' });
    gmp.part('Filtre à air', S.cyl(330, 600, 'y'), { pos: [xR + 400, 1600, hw - 400], mat: 'plastique' });
    gmp.part('Catalyseur / filtre à particules (SCR + DPF)', S.cyl(400, 1000, 'z'), { pos: [xR + 400, 900, 0], mat: 'inox', desc: 'Système de post-traitement Euro VI' });
    gmp.part('Sortie d\'échappement', S.pipe([[xR + 400, 900, hw - 400], [xR + 200, 700, hw - 200], [xR + 100, 350, hw - 200]], 120), { mat: 'inox' });
  } else {
    gmp.part('Moteur de traction synchrone à aimants permanents', S.cyl(450, 600, 'z'), { pos: [XR + 900, WY + 150, 0], mat: 'aluminium', desc: '250 kW – 2 400 N·m – refroidi par liquide' });
    gmp.part('Onduleur de traction', S.box(700, 250, 500), { pos: [xR + 900, 2700, 0], mat: 'aluminium' });
    gmp.part('Arbre de transmission court', S.cyl(100, 500, 'x'), { pos: [XR + 500, WY + 100, 0], mat: 'acierHR' });
    const bat = gmp.group('Batteries de traction (toiture)', { code: 'BAT' });
    for (let i = 0; i < 6; i++) {
      const bp = bat.group(`Pack batterie ${i + 1}`, { code: 'BAT' });
      const x = xF - 2200 - i * 1350;
      bp.part('Coffre de pack (NMC 66 kWh)', S.box(1200, 260, 1800), { pos: [x, roofY + 230, 0], mat: 'aluminium', color: 0x3a3d42 });
      for (const sd of SIDES) for (const dx of [-1, 1]) bp.part(`Vis de fixation ${sd.c}${dx < 0 ? 'AR' : 'AV'}`, S.bolt(12, 40), { pos: [x + dx * 520, roofY + 105, sd.s * 860], mat: 'acierHR', couple: 85 });
    }
    gmp.part('Capot de toiture (carénage batteries)', S.box(L - 2500, 320, W - 300), { pos: [(xF + xR) / 2 - 400, roofY + 260, 0], mat: 'composite', color: paint, layer: 'ext' });
    gmp.part('Prise de recharge combo CCS2', S.box(150, 200, 60), { pos: [XF - 1200, 1150, -hw - 5], mat: 'abs' });
    gmp.part('Rail de contact pantographe inversé', S.box(1000, 80, 900), { pos: [XF - 400, roofY + 420, 0], mat: 'cuivre' });
    gmp.part('Chargeur / convertisseur DC-DC', S.box(600, 300, 600), { pos: [xR + 1600, 2700, 0], mat: 'aluminium' });
    gmp.part('Pompe à chaleur / régulation thermique batteries', S.box(1000, 300, 1400), { pos: [xR + 700, 2700, 0], mat: 'aluminium' });
  }
  const aux = bus.group('Équipements auxiliaires', { code: 'AUX', layer: 'meca' });
  aux.part('Groupe de climatisation de toit', S.box(2800, 250, 1900), { pos: [ev ? XF - 300 + 1400 : 0, roofY + 125 + (ev ? 0 : 0), 0], mat: 'composite', color: 0xdddddd, desc: 'Climatisation 32 kW – chauffage à eau', layer: 'ext' });
  aux.part('Compresseur d\'air', S.box(300, 300, 250), { pos: [xR + 1500, WY + 500, -hw + 400], mat: 'fonte' });
  for (let k = 0; k < 3; k++) aux.part(`Réservoir d'air comprimé ${k + 1}`, S.cyl(250, 900, 'x'), { pos: [XR + 1400 + k * 50, P.coach ? longY + 250 : 450, hw - 400 - k * 280], mat: 'acier', color: CHASSIS, desc: '30 L – 12,5 bar' });
  aux.part('Dessiccateur d\'air', S.cyl(150, 300, 'y'), { pos: [XR + 2500, 600, hw - 400], mat: 'aluminium' });
  aux.part('Batteries 24 V (2 × 12 V 225 Ah)', S.box(550, 250, 520), { pos: [XF + 900, P.coach ? longY + 200 : 600, -hw + 400], mat: 'electrolyte' });
  aux.part('Coupe-batterie', S.box(120, 120, 80), { pos: [XF + 500, P.coach ? longY + 200 : 600, -hw + 150], mat: 'abs', color: 0xb3202a });
  aux.part('Faisceau principal', S.pipe([[xF - 400, 900, -hw + 300], [0, 900, -hw + 250], [xR + 800, 1200, -hw + 300]], 40), { mat: 'plastique' });

  // ------------------------------------------------------------------ Trains roulants
  const tr = bus.group('Trains roulants', { code: 'TRN', layer: 'sol' });
  const eav = tr.group('Essieu avant directeur (roues indépendantes)', { code: 'EAV' });
  eav.part('Traverse d\'essieu avant', S.box(300, 200, W - 700), { pos: [XF, WY + 150, 0], mat: 'acierHR', color: CHASSIS });
  eav.part('Boîtier de direction assistée', S.box(250, 250, 200), { pos: [XF + 500, WY + 300, -hw + 500], mat: 'fonte' });
  eav.part('Barre d\'accouplement', S.rod([XF - 200, WY, -hw + 500], [XF - 200, WY, hw - 500], 45), { mat: 'acierHR' });
  const rearZ = 900, frontZ = hw - 230;
  for (const sd of SIDES) {
    eav.part(`Triangle inférieur ${sd.m}`, S.box(500, 60, 450), { pos: [XF, WY - 120, sd.s * (hw - 600)], mat: 'acierHR', color: CHASSIS });
    eav.part(`Triangle supérieur ${sd.m}`, S.box(400, 60, 380), { pos: [XF, WY + 250, sd.s * (hw - 620)], mat: 'acierHR', color: CHASSIS });
    eav.part(`Coussin d'air avant ${sd.m}`, S.cyl(300, 280, 'y'), { pos: [XF - 150, WY + 380, sd.s * (hw - 650)], mat: 'caoutchouc' });
    eav.part(`Amortisseur avant ${sd.m}`, S.rod([XF + 200, WY - 50, sd.s * (hw - 600)], [XF + 250, WY + 550, sd.s * (hw - 650)], 70), { mat: 'peinture', color: 0x222222 });
    eav.part(`Fusée ${sd.f}`, S.cyl(90, 180, 'z'), { pos: [XF, WY, sd.s * (frontZ - 130)], mat: 'acierHR' });
    wheel(tr, `Roue avant ${sd.f}`, sd.s, {
      pos: [XF, WY, sd.s * frontZ], tire: P.tire, studs: 10, pcd: 335, stud: 22, studL: 30, studKind: 'nut', studLabel: 'Écrou de roue', couple: 600,
      disc: [430, 45], caliperAngle: 180, code: 'ROU', hubD: 220, hubL: 120, spokes: 10, spokeW: 40, rimMat: 'aluminium', cap: false,
    });
  }
  const ear = tr.group(P.coach || P.frontEngine ? 'Pont arrière moteur' : 'Pont arrière portique (plancher bas)', { code: 'PAR' });
  ear.part('Carter de pont', S.cyl(220, W - 900, 'z'), { pos: [XR, P.coach || P.frontEngine ? WY : WY - 60, 0], mat: 'acierHR', color: CHASSIS, desc: P.coach || P.frontEngine ? 'Pont hypoïde' : 'Pont portique décalé – différentiel déporté côté gauche' });
  ear.part('Carter de différentiel', S.sphere(500), { pos: [XR, WY, P.coach || P.frontEngine ? 0 : -350], mat: 'fonte', color: CHASSIS });
  boltCircle(ear, { n: 12, pcd: 330, d: 14, L: 40, axis: 'x', at: [XR + 250, WY, P.coach || P.frontEngine ? 0 : -350], dir: 1, label: 'Vis de couvercle de pont', couple: 210 });
  for (const sd of SIDES) {
    ear.part(`Réducteur de moyeu ${sd.m}`, S.cyl(320, 140, 'z'), { pos: [XR, WY, sd.s * (rearZ - 230)], mat: 'fonte' });
    for (const [x, k] of [[XR - 400, 'arrière'], [XR + 400, 'avant']]) ear.part(`Coussin d'air ${k} ${sd.m}`, S.cyl(300, 280, 'y'), { pos: [x, WY + 380, sd.s * 550], mat: 'caoutchouc' });
    ear.part(`Amortisseur arrière ${sd.m}`, S.rod([XR - 150, WY - 40, sd.s * 450], [XR - 200, WY + 600, sd.s * 450], 75), { mat: 'peinture', color: 0x222222 });
    ear.part(`Cylindre de frein à ressort ${sd.m}`, S.cyl(220, 320, 'x'), { pos: [XR + 300, WY + 40, sd.s * 620], mat: 'peinture', color: 0x222222 });
    for (const [lab, dz] of [['extérieure', 170], ['intérieure', -170]]) {
      wheel(tr, `Roue arrière ${sd.f} ${lab}`, sd.s, {
        pos: [XR, WY, sd.s * (rearZ + dz)], tire: P.tire, studs: dz > 0 ? 10 : 0, pcd: 335, stud: 22, studL: 30, studKind: 'nut', studLabel: 'Écrou de roue', couple: 600,
        disc: dz < 0 ? [430, 45] : null, caliperAngle: 0, code: 'ROU', hub: dz < 0, hubD: 220, hubL: 120, spokes: 10, spokeW: 40, rimMat: 'aluminium', cap: false,
      });
    }
  }
  return bus;
}
