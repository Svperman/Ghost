// Voitures – générateur paramétrique (toutes cotes en mm)
// Repère : X avant, Y haut, Z droite. Origine au sol, au milieu de l'empattement.
import { Assembly, S, SIDES, boltRow, boltCircle, axisRot } from '../core/builder.js';
import { wheel, inlineEngine, seat } from '../core/parts.js';

// ---------------------------------------------------------------------------- Types de voitures
import { CAR_TYPES } from './meta/car.js';

export { CAR_TYPES };

// ---------------------------------------------------------------------------- Générateur
export function buildCar(type = 'berline') {
  const P = CAR_TYPES[type] || CAR_TYPES.berline;
  const { L, W, H, WB, track, belt, nose, paint } = P;
  const XF = WB / 2, XR = -WB / 2;
  const xF = XF + P.fo, xR = -(L - WB - P.fo) - WB / 2;
  const D = Math.round(P.tire[2] * 25.4 + 2 * P.tire[0] * P.tire[1] / 100);
  const WY = D / 2, AR = D / 2 + 55;
  const clr = P.clear, floorY = clr + 130;
  const halfW = W / 2, cabW = W - 380;
  const tail = belt - 20;
  const longi = P.eng && (P.drive === 'RWD' || P.frame);
  // Silhouette de l'habitacle
  const wsX = XF - 230 + (P.rake < 30 ? 100 : 0) - (longi ? 450 : 0); // pied de pare-brise
  const run = (H - belt) / Math.tan(P.rake * Math.PI / 180);
  const roofF = wsX - run;
  const bX = P.doors === 2 ? wsX - 1250 : wsX - 1080; // montant B
  const hoodAt = (x) => belt + (nose - belt) * Math.min(1, Math.max(0, (x - wsX) / (xF - 90 - wsX)));
  let cR, roofR;
  if (P.rear === 'tri') { cR = xR + 820; roofR = cR + 520; }
  else if (P.rear === 'hatch') { cR = xR + 70; roofR = xR + 380; }
  else if (P.rear === 'wagon') { cR = xR + 40; roofR = xR + 170; }
  else if (P.rear === 'fast') { cR = xR + 380; roofR = Math.min(roofF - 500, XR + 900); }
  else { cR = bX - 1080; roofR = cR + 40; } // pick-up : cabine double

  const car = new Assembly(`${P.label}`, { prefix: 'VT', code: 'GEN', layer: 'meca', desc: `${P.desc} – ${L} × ${W} × ${H} mm – empattement ${WB} mm` });

  // ------------------------------------------------------------------ Carrosserie
  const body = car.group('Carrosserie', { code: 'CAR', layer: 'ext' });
  const arch = (cx, from, to) => {
    const pts = [];
    for (let i = 0; i <= 20; i++) { const a = from + (to - from) * (i / 20); pts.push([cx + AR * Math.cos(a), WY + AR * Math.sin(a)]); }
    return pts;
  };
  const bedY = WY + AR + 20; // plancher de benne (pick-up), au-dessus des passages de roue
  const top = P.rear === 'pickup' ? [[xR + 10, bedY], [cR - 50, bedY], [cR - 50, belt]] : [[xR + 30, tail + 10], [cR, belt]];
  const caisse = [
    [xR + 30, clr + 120], [xR - 10, clr + 330], ...(P.rear === 'pickup' ? [] : [[xR + 10, tail]]), ...top, [wsX, belt],
    [xF - 80, nose], [xF + 10, nose - 220], [xF - 10, clr + 150], [XF + AR, clr + 20],
    ...arch(XF, 0, Math.PI), [XR + AR, clr + 20], ...arch(XR, 0, Math.PI), [xR + 250, clr + 20],
  ];
  body.part('Caisse en blanc (structure)', S.extrude(caisse, W, 40), { mat: 'peinture', color: paint, desc: P.frame ? 'Carrosserie sur châssis séparé (body-on-frame)' : 'Structure monocoque acier THLE soudée par points' });
  body.part('Pavillon / habitacle', S.extrude([[cR, belt - 5], [roofR, H], [roofF, H], [wsX, belt - 5]], cabW, 60), { mat: 'peinture', color: paint });
  panel(body, 'Capot moteur', [wsX + 10, belt - 2], [xF - 90, nose - 2], W - 180, 10, { mat: 'peinture', color: paint });
  if (P.rear === 'tri') panel(body, 'Couvercle de coffre', [xR + 20, tail + 12], [cR, belt + 2], W - 200, 10, { mat: 'peinture', color: paint });
  if (P.rear === 'fast') panel(body, 'Hayon / custode arrière', [xR + 30, tail + 12], [cR, belt + 2], W - 200, 10, { mat: 'peinture', color: paint });
  if (P.rear === 'hatch' || P.rear === 'wagon') body.part('Hayon', S.box(20, belt - clr - 300, W - 260), { pos: [xR - 12, (belt + clr + 300) / 2, 0], mat: 'peinture', color: paint });
  body.part('Bouclier avant', S.box(130, 300, W + 10), { pos: [xF - 15, clr + 280, 0], mat: 'abs', color: paint });
  body.part('Bouclier arrière', S.box(130, 300, W + 10), { pos: [xR + 15, clr + 280, 0], mat: 'abs', color: paint });
  body.part('Calandre', S.box(30, Math.max(100, Math.min(200, nose - clr - 350)), W * 0.42), { pos: [xF + 5, nose - 150, 0], mat: 'abs', color: 0x111111 });
  body.part('Emblème de calandre', S.cyl(90, 8, 'x'), { pos: [xF + 22, nose - 140, 0], mat: 'chrome', desc: 'Emplacement du logo constructeur' });
  body.part('Grille de bouclier inférieure', S.box(20, 110, W * 0.5), { pos: [xF + 50, clr + 230, 0], mat: 'abs', color: 0x111111 });
  body.part('Plaque d\'immatriculation avant', S.box(4, 110, 520), { pos: [xF + 55, clr + 330, 0], mat: 'aluminium', color: 0xffffff });
  body.part('Plaque d\'immatriculation arrière', S.box(4, 110, 520), { pos: [xR - 50, clr + 420, 0], mat: 'aluminium', color: 0xffffff });
  body.part('Antenne de toit', S.box(140, 60, 40), { pos: [roofR + 200, H + 25, 0], mat: 'abs', color: 0x111111 });
  if (P.roofBars) for (const sd of SIDES) body.part(`Barre de toit ${sd.f}`, S.box(roofF - roofR - 200, 40, 30), { pos: [(roofF + roofR) / 2, H + 30, sd.s * (cabW / 2 - 60)], mat: 'aluminium' });
  if (P.drive === 'RWD') body.part('Aileron arrière', S.box(220, 20, W - 400), { pos: [xR + 160, tail + 60, 0], rot: [0, 0, 6], mat: 'carbone' });

  if (P.rear === 'pickup') {
    const bn = body.group('Benne de chargement', { code: 'BEN' });
    const bL = cR - xR - 60, bx = (cR + xR) / 2 - 10, by = bedY;
    bn.part('Plancher de benne', S.box(bL, 10, W - 140), { pos: [bx, by, 0], mat: 'peinture', color: paint });
    for (const sd of SIDES) bn.part(`Ridelle ${sd.f}`, S.box(bL, tail - by, 12), { pos: [bx, (tail + by) / 2, sd.s * (halfW - 70)], mat: 'peinture', color: paint });
    bn.part('Ridelle avant', S.box(12, tail - by, W - 140), { pos: [cR - 40, (tail + by) / 2, 0], mat: 'peinture', color: paint });
    bn.part('Hayon de benne', S.box(14, tail - by + 100, W - 140), { pos: [xR + 10, (tail + by - 100) / 2, 0], mat: 'peinture', color: paint });
    bn.part('Revêtement de benne', S.box(bL - 40, 6, W - 180), { pos: [bx, by + 8, 0], mat: 'plastique' });
    for (const sd of SIDES) for (const k of [1, 2]) bn.part(`Anneau d'arrimage ${sd.c}${k}`, S.torus(40, 8, 'z'), { pos: [bx + (k === 1 ? -bL / 3 : bL / 3), by + 40, sd.s * (halfW - 90)], mat: 'inox' });
    for (const sd of SIDES) boltRow(bn, { from: [bx - bL / 2 + 80, by - 15, sd.s * 450], to: [bx + bL / 2 - 80, by - 15, sd.s * 450], n: 6, d: 10, L: 40, axis: 'y', dir: -1, label: `Vis de fixation de benne ${sd.c}`, couple: 60 });
  }

  const vit = body.group('Vitrage', { code: 'VIT' });
  panel(vit, 'Pare-brise', [wsX - 4, belt + 4], [roofF - 4, H - 4], cabW - 60, 6, { mat: 'verre', desc: 'Verre feuilleté 4,76 mm' });
  if (P.rear === 'pickup') vit.part('Lunette arrière', S.box(6, (H - belt) * 0.6, cabW - 300), { pos: [cR + 4, belt + (H - belt) * 0.45, 0], mat: 'verre' });
  else panel(vit, 'Lunette arrière', [cR + 6, belt + 6], [roofR + 6, H - 6], cabW - 120, 6, { mat: 'verre' });
  for (const sd of SIDES) {
    const z = sd.s * (cabW / 2 + 3);
    const yb = belt + 40, yt = H - 40;
    vit.part(`Vitre avant ${sd.f}`, S.extrude([[bX + 20, yb], [bX + 20, yt], [roofF - 40, yt], [wsX - 80, yb]], 5), { pos: [0, 0, z], mat: 'verre' });
    const rx0 = P.rear === 'pickup' ? cR + 40 : Math.max(cR, roofR) + 60;
    if (bX - 40 - rx0 > 150) vit.part(`Vitre arrière ${sd.f}`, S.extrude([[rx0, yb], [Math.max(roofR + 60, rx0), yt], [bX - 40, yt], [bX - 40, yb]], 5), { pos: [0, 0, z], mat: 'verre' });
    vit.part(`Montant B ${sd.m}`, S.box(60, H - belt - 40, 8), { pos: [bX - 10, (H + belt) / 2, z], mat: 'abs', color: 0x111111 });
  }
  const ess = vit.group('Essuie-glaces', { code: 'VIT' });
  const ang = -Math.atan2(H - belt, wsX - roofF) * 180 / Math.PI;
  for (const sd of SIDES) {
    ess.part(`Bras d'essuie-glace ${sd.m}`, S.box(14, 10, cabW * 0.34), { pos: [wsX - 40, belt + 45, sd.s * cabW * 0.2 - 60], rot: [0, 0, ang], mat: 'plastique' });
    ess.part(`Balai d'essuie-glace ${sd.m}`, S.box(18, 14, cabW * 0.4), { pos: [wsX - 60, belt + 65, sd.s * cabW * 0.2 - 60], rot: [0, 0, ang], mat: 'caoutchouc' });
    ess.part(`Écrou d'axe d'essuie-glace ${sd.m}`, S.nut(10), { pos: [wsX + 30, belt + 8, sd.s * cabW * 0.2 - cabW * 0.17 - 60], mat: 'zingue', couple: 20 });
  }

  for (const sd of SIDES) {
    const z = sd.s * (halfW + 4);
    const doorsList = P.doors === 2 ? [['', bX, wsX + 20]] : [['avant ', bX, wsX + 20], ['arrière ', Math.max(XR + AR + 30, bX - 950), bX - 5]];
    for (const [nom, x0, x1] of doorsList) {
      const pg = body.group(`Portière ${nom}${sd.f}`, { code: 'POR' });
      pg.part('Panneau de porte', S.extrude([[x0, clr + 150], [x0, belt + 5], [x1, belt + 5], [x1, clr + 150]], 8, 2), { pos: [0, 0, z], mat: 'peinture', color: paint });
      pg.part('Garniture intérieure', S.box(x1 - x0 - 60, (belt - clr) * 0.6, 30), { pos: [(x0 + x1) / 2, (belt + clr) / 2 + 60, sd.s * (halfW - 40)], mat: 'abs', layer: 'int' });
      pg.part('Poignée extérieure', S.box(160, 30, 25), { pos: [x0 + 120, belt - 90, sd.s * (halfW + 20)], mat: 'chrome' });
      pg.part('Serrure de porte', S.box(60, 90, 50), { pos: [x0 + 30, belt - 150, sd.s * (halfW - 30)], mat: 'zingue' });
      pg.part('Lève-vitre électrique', S.box(400, 300, 20), { pos: [(x0 + x1) / 2, (belt + clr) / 2 + 60, sd.s * (halfW - 20)], mat: 'zingue' });
      for (const [k, y] of [['supérieure', belt - 130], ['inférieure', clr + 300]]) {
        pg.part(`Charnière ${k}`, S.box(60, 80, 30), { pos: [x1 - 20, y, sd.s * (halfW - 10)], mat: 'acier' });
        for (const dy of [20, -20]) pg.part(`Vis de charnière ${k} ${dy > 0 ? 1 : 2}`, S.bolt(8, 25, 'z'), { pos: [x1 - 30, y + dy, sd.s * (halfW + 10)], rot: axisRot('z', sd.s), mat: 'acierHR', couple: 25 });
      }
    }
    const rv = body.group(`Rétroviseur extérieur ${sd.m}`, { code: 'POR' });
    rv.part('Coque de rétroviseur', S.ellipsoid(150, 115, 230), { pos: [wsX - 70, belt + 60, sd.s * (halfW + 120)], mat: 'peinture', color: paint });
    rv.part('Miroir', S.box(6, 95, 190), { pos: [wsX - 145, belt + 60, sd.s * (halfW + 125)], mat: 'chrome' });
    rv.part('Répétiteur de clignotant', S.box(20, 15, 120), { pos: [wsX - 50, belt + 15, sd.s * (halfW + 140)], mat: 'feuOrange' });
    rv.part('Pied de rétroviseur', S.box(90, 70, 110), { pos: [wsX - 90, belt + 40, sd.s * (halfW + 30)], mat: 'abs' });
    body.part(`Bas de caisse ${sd.m}`, S.box(WB - 2 * AR - 40, 90, 40), { pos: [0, clr + 45, sd.s * (halfW - 10)], mat: 'abs', color: 0x111111 });
    if (P.flares) for (const [ax, n] of [[XF, 'avant'], [XR, 'arrière']]) body.part(`Élargisseur d'aile ${n} ${sd.m}`, S.tube(AR * 2 + 50, AR * 2, 60, 'z', 40), { pos: [ax, WY, sd.s * (halfW - 10)], scale: [1, 1, 1], mat: 'abs', color: 0x111111 });
  }

  const ecl = body.group('Éclairage & signalisation', { code: 'ECL' });
  for (const sd of SIDES) {
    ecl.part(`Projecteur avant ${sd.m}`, S.ellipsoid(180, 120, 360), { pos: [xF - 50, nose - 70, sd.s * (halfW - 260)], rot: [0, 0, -15], mat: 'feuBlanc' });
    ecl.part(`Module LED / ampoule ${sd.f}`, S.cyl(12, 50, 'x'), { pos: [xF - 120, nose - 70, sd.s * (halfW - 260)], mat: 'verre' });
    ecl.part(`Antibrouillard ${sd.m}`, S.cyl(80, 40, 'x'), { pos: [xF + 50, clr + 160, sd.s * (halfW - 180)], mat: 'feuBlanc' });
    ecl.part(`Feu arrière ${sd.m}`, S.box(80, 140, 330), { pos: [xR, tail - 90, sd.s * (halfW - 200)], mat: 'feuRouge' });
    ecl.part(`Clignotant arrière ${sd.m}`, S.box(80, 40, 150), { pos: [xR + 5, tail - 190, sd.s * (halfW - 140)], mat: 'feuOrange' });
    ecl.part(`Catadioptre ${sd.m}`, S.box(10, 30, 120), { pos: [xR - 55, clr + 200, sd.s * (halfW - 190)], mat: 'feuRouge' });
  }
  ecl.part('Troisième feu stop', S.box(30, 30, 400), { pos: [roofR + 20, H - 30, 0], mat: 'feuRouge' });

  // ------------------------------------------------------------------ Châssis / plateforme
  const ch = car.group(P.frame ? 'Châssis échelle' : 'Plateforme & soubassement', { code: 'CHS', layer: 'struct' });
  const lw = P.frame ? 900 : W - 660;
  const ly = clr + (P.frame ? 200 : 110);
  for (const sd of SIDES) {
    ch.part(`Longeron ${sd.m}`, S.box(L - 400, P.frame ? 180 : 120, P.frame ? 70 : 80), { pos: [(xF + xR) / 2, ly, sd.s * lw / 2], mat: P.frame ? 'peinture' : 'acier', color: P.frame ? 0x1c1d20 : undefined, desc: P.frame ? 'Profil caisson acier 180 × 70 × 4 mm' : '' });
    boltRow(ch, { from: [xR + 400, ly - (P.frame ? 95 : 65), sd.s * lw / 2], to: [xF - 400, ly - (P.frame ? 95 : 65), sd.s * lw / 2], n: P.frame ? 8 : 6, d: P.frame ? 12 : 10, L: 30, axis: 'y', dir: -1, label: P.frame ? `Boulon de traverse ${sd.c}` : `Vis de fixation longeron ${sd.c}`, couple: P.frame ? 90 : 60 });
    if (P.frame) for (let k = 0; k < 4; k++) {
      const x = wsX - 200 - k * ((wsX - xR - 400) / 3);
      ch.part(`Silent-bloc de caisse ${sd.c}${k + 1}`, S.cyl(70, 50, 'y'), { pos: [x, ly + 115, sd.s * (lw / 2 + 60)], mat: 'caoutchouc' });
      ch.part(`Boulon de caisse sur châssis ${sd.c}${k + 1}`, S.bolt(12, 110, 'y'), { pos: [x, ly + 150, sd.s * (lw / 2 + 60)], mat: 'acierHR', couple: 95 });
    }
  }
  const trs = [['avant', xF - 300], ['de train avant', XF - 250], ['centrale', 0], ['de train arrière', XR + 300], ['arrière', xR + 250]];
  for (const [n, x] of trs) ch.part(`Traverse ${n}`, S.box(90, 90, lw - 80), { pos: [x, ly, 0], mat: 'acier' });
  if (!P.frame) {
    ch.part('Plancher', S.box(WB - 200, 4, W - 300), { pos: [-100, floorY - 30, 0], mat: 'acier' });
    ch.part('Tunnel central', S.box(WB - 400, 180, 240), { pos: [0, floorY + 30, 0], mat: 'acier' });
  } else ch.part('Plancher de cabine', S.box(wsX - cR, 4, W - 300), { pos: [(wsX + cR) / 2, floorY - 30, 0], mat: 'acier' });
  ch.part('Tablier / cloison pare-feu', S.box(20, belt - floorY, W - 280), { pos: [wsX - 20, (belt + floorY) / 2, 0], mat: 'acier' });
  ch.part('Berceau moteur', S.box(700, 60, Math.max(600, W - 680)), { pos: [XF + 150, clr + 80, 0], mat: 'acier' });
  for (const [x, z] of [[XF - 150, -1], [XF - 150, 1], [XF + 450, -1], [XF + 450, 1]]) ch.part(`Vis de berceau ${x > XF ? 'AV' : 'AR'}${z < 0 ? 'G' : 'D'}`, S.bolt(14, 90, 'y'), { pos: [x, clr + 50, z * Math.max(500, W - 780) / 2], rot: [180, 0, 0], mat: 'acierHR', couple: 180 });
  if (P.frame) {
    ch.part('Attelage de remorque', S.box(300, 80, 80), { pos: [xR - 120, clr + 240, 0], mat: 'acier', color: 0x1c1d20 });
    ch.part('Boule d\'attelage Ø50', S.sphere(50), { pos: [xR - 250, clr + 330, 0], mat: 'chrome' });
    ch.part('Plaque de protection sous moteur', S.box(900, 6, 800), { pos: [XF + 200, clr + 30, 0], mat: 'acier' });
  }

  // ------------------------------------------------------------------ Groupe motopropulseur
  const gmp = car.group(P.drive === 'EV' ? 'Chaîne de traction électrique' : 'Groupe motopropulseur', { code: 'GMP', layer: 'meca' });
  if (P.eng) {
    const E = P.eng;
    const engL = E.n * E.pitch + 60;
    const transverse = !longi;
    const ex = transverse ? XF + 190 : XF - engL / 2 + 230;
    const topRel = 2.5 * E.stroke + 120;
    const ey = Math.min(WY + 290 + (clr - 150), hoodAt(transverse ? ex + 150 : ex + engL / 2) - topRel - 25);
    inlineEngine(gmp, `Moteur ${E.label}`, {
      n: E.n, bore: E.bore, stroke: E.stroke, pitch: E.pitch, pos: [ex, ey, 0], rot: transverse ? [0, 90, 0] : [0, 180, 0], code: 'MOT', valves: 2,
      turbo: !!E.turbo, diesel: !!E.diesel, desc: `${Math.round(E.n * Math.PI * (E.bore / 20) ** 2 * E.stroke / 10)} cm³ – ${E.kw} kW`,
    });
    const bv = gmp.group(`Boîte de vitesses ${P.drive === 'FWD' ? 'manuelle 6 rapports' : 'automatique 8 rapports'}`, { code: 'BV' });
    if (transverse) {
      const bz = -(engL / 2 + 60);
      bv.part('Carter d\'embrayage', S.cyl(300, 120, 'z', 40), { pos: [ex - 30, ey - 80, bz], mat: 'aluminium' });
      bv.part('Carter de boîte', S.box(340, 330, 300), { pos: [ex - 30, ey - 100, bz - 210], mat: 'aluminium' });
      bv.part('Disque d\'embrayage', S.tube(228, 60, 10, 'z'), { pos: [ex - 30, ey - 80, bz + 40], mat: 'feutre' });
      bv.part('Mécanisme d\'embrayage', S.cyl(240, 40, 'z'), { pos: [ex - 30, ey - 80, bz + 15], mat: 'acier' });
      bv.part('Arbre primaire', S.cyl(30, 380, 'z'), { pos: [ex - 30, ey - 80, bz - 190], mat: 'acierHR' });
      bv.part('Différentiel avant – couronne', S.cyl(200, 30, 'z'), { pos: [XF, WY + 60, bz - 150], mat: 'acierHR' });
      for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; bv.part(`Vis de cloche ${String(i + 1).padStart(2, '0')}`, S.bolt(10, 45, 'z'), { pos: [ex - 30 + Math.cos(a) * 160, ey - 80 + Math.sin(a) * 160, bz + 60], rot: axisRot('z', 1), mat: 'acierHR', couple: 48 }); }
      const tr = gmp.group('Transmissions avant', { code: 'TRA' });
      for (const sd of SIDES) {
        const zIn = sd.s < 0 ? bz - 150 : -80;
        tr.part(`Arbre de transmission ${sd.m}`, S.rod([XF, WY + 60, zIn], [XF, WY, sd.s * (track / 2 - 110)], 30), { mat: 'acierHR' });
        tr.part(`Joint homocinétique côté roue ${sd.m}`, S.cyl(95, 90, 'z'), { pos: [XF, WY, sd.s * (track / 2 - 130)], mat: 'caoutchouc' });
        tr.part(`Écrou de moyeu ${sd.m}`, S.nut(22, 'z'), { pos: [XF, WY, sd.s * (track / 2 - 70)], mat: 'acierHR', couple: '280 N·m' });
      }
      if (P.drive === 'AWD') {
        const ax = gmp.group('Transmission intégrale', { code: 'TRA' });
        ax.part('Renvoi d\'angle (PTU)', S.box(220, 200, 200), { pos: [XF - 120, WY + 60, bz - 120], mat: 'aluminium' });
        ax.part('Arbre de transmission longitudinal', S.rod([XF - 230, WY + 60, -100], [XR + 180, WY + 40, 0], 70, 60), { mat: 'acierHR' });
        ax.part('Coupleur multidisque arrière', S.cyl(180, 120, 'x'), { pos: [XR + 200, WY + 40, 0], mat: 'aluminium' });
        rearDiff(ax, P, XR, WY, track);
      }
    } else {
      const gx = ex - engL / 2 - 80;
      bv.part('Carter de convertisseur', S.cyl(330, 160, 'x', 40), { pos: [gx - 60, ey - 60, 0], mat: 'aluminium' });
      bv.part('Convertisseur de couple', S.cyl(290, 110, 'x'), { pos: [gx - 60, ey - 60, 0], mat: 'acier' });
      bv.part('Carter de boîte automatique', S.cyl(260, 560, 'x', 32, 200), { pos: [gx - 420, ey - 70, 0], mat: 'aluminium' });
      bv.part('Carter d\'huile de boîte', S.box(400, 50, 240), { pos: [gx - 420, ey - 210, 0], mat: 'aluminium' });
      bv.part('Bloc hydraulique (mécatronique)', S.box(300, 60, 200), { pos: [gx - 420, ey - 170, 0], mat: 'aluminium' });
      boltCircle(bv, { n: 12, pcd: 300, d: 10, L: 40, axis: 'x', at: [gx + 20, ey - 60, 0], dir: 1, label: 'Vis de carter de boîte', couple: 45 });
      const ax = gmp.group('Transmission arrière', { code: 'TRA' });
      const sx = gx - 720;
      ax.part('Arbre de transmission longitudinal', S.rod([sx, ey - 80, 0], [XR + 180, WY + (P.leaf ? 0 : 40), 0], 75, 65), { mat: 'acierHR' });
      ax.part('Palier central', S.box(80, 100, 160), { pos: [(sx + XR) / 2, (ey + WY) / 2 - 20, 0], mat: 'caoutchouc' });
      ax.part('Flector (joint élastique)', S.cyl(150, 40, 'x'), { pos: [sx + 10, ey - 80, 0], mat: 'caoutchouc' });
      for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; ax.part(`Boulon de flector ${i + 1}`, S.bolt(12, 60, 'x'), { pos: [sx + 35, ey - 80 + Math.cos(a) * 55, Math.sin(a) * 55], mat: 'acierHR', couple: 90 }); }
      rearDiff(ax, P, XR, WY, track);
      if (P.drive === 'AWD') {
        ax.part('Boîte de transfert', S.box(300, 260, 220), { pos: [gx - 820, ey - 60, -60], mat: 'aluminium' });
        ax.part('Levier de crabotage 4×4', S.box(60, 60, 60), { pos: [gx - 820, ey + 100, -60], mat: 'acier' });
        ax.part('Arbre de transmission avant', S.rod([gx - 820, ey - 120, -120], [XF + 40, WY + 60, -120], 55), { mat: 'acierHR' });
        ax.part('Pont avant – différentiel', S.sphere(260), { pos: [XF + 40, WY + 60, -120], mat: 'fonte' });
        for (const sd of SIDES) ax.part(`Arbre de roue avant ${sd.m}`, S.rod([XF + 40, WY + 60, -120 + sd.s * 120], [XF, WY, sd.s * (track / 2 - 110)], 34), { mat: 'acierHR' });
      }
    }
    const ref = gmp.group('Refroidissement', { code: 'REF' });
    const rh = Math.max(250, Math.min(420, nose - clr - 150));
    ref.part('Radiateur', S.box(40, rh, W - 1100), { pos: [xF - 170, clr + (nose - clr) / 2, 0], mat: 'aluminium' });
    ref.part('Motoventilateur', S.cyl(Math.min(330, rh), 60, 'x'), { pos: [xF - 230, clr + (nose - clr) / 2, 0], mat: 'plastique' });
    ref.part('Condenseur de climatisation', S.box(25, rh - 30, W - 1140), { pos: [xF - 125, clr + (nose - clr) / 2, 0], mat: 'aluminium' });
    ref.part('Vase d\'expansion', S.box(150, 140, 200), { pos: [xF - 450, hoodAt(xF - 450) - 150, halfW - 380], mat: 'composite' });
    ref.part('Durite supérieure', S.pipe([[xF - 190, clr + (nose - clr) * 0.8, -150], [ex + 200, ey + 150, -80]], 38), { mat: 'caoutchouc' });

    const al = gmp.group('Alimentation & électricité', { code: 'ALM' });
    al.part('Boîte à air / filtre à air', S.box(260, 150, 320), { pos: [wsX + 200, hoodAt(wsX + 200) - 120, halfW - 520], mat: 'plastique' });
    al.part('Batterie 12 V', S.box(242, 175, 175), { pos: [xF - 520, hoodAt(xF - 520) - 140, -(halfW - 300)], mat: 'electrolyte', desc: '12 V – 60 à 95 Ah' });
    al.part('Borne + de batterie', S.cyl(18, 20, 'y'), { pos: [xF - 580, hoodAt(xF - 520) - 42, -(halfW - 300)], mat: 'cuivre' });
    al.part('Calculateur moteur (ECU)', S.box(200, 40, 160), { pos: [wsX + 150, belt - 120, -(halfW - 350)], mat: 'aluminium' });
    al.part(`Réservoir de carburant (${E.diesel ? 'gazole' : 'essence'})`, S.box(620, 230, Math.min(820, lw - 120)), { pos: [XR + 650, clr + 160, 0], mat: 'plastique', desc: 'PEHD multicouche' });
    al.part('Pompe à carburant immergée', S.cyl(90, 200, 'y'), { pos: [XR + 650, clr + 200, 200], mat: 'plastique' });
    al.part('Goulotte de remplissage', S.pipe([[XR + 500, clr + 220, 350], [XR - 100, clr + 450, halfW - 100], [XR - 250, belt - 150, halfW - 20]], 45), { mat: 'plastique' });
    al.part('Canalisation de carburant', S.pipe([[XR + 650, clr + 230, 300], [0, clr + 120, 300], [ex - 100, ey, 200]], 10), { mat: 'inox' });

    const ech = gmp.group('Ligne d\'échappement', { code: 'ECH' });
    const ez = transverse ? 60 : 150;
    const ex0 = transverse ? [ex + 150, ey - 120, 60] : [ex, ey - 150, halfW - 600];
    ech.part('Tube avant', S.pipe([ex0, [ex0[0] - 200, clr + 80, ez], [XF - 300, clr + 60, ez]], 55), { mat: 'inox' });
    ech.part(E.diesel ? 'Catalyseur + filtre à particules (FAP)' : 'Catalyseur 3 voies', S.cyl(140, 400, 'x'), { pos: [XF - 450, clr + 60, ez], mat: 'inox' });
    ech.part('Sonde lambda', S.cyl(18, 60, 'y'), { pos: [XF - 250, clr + 110, ez], mat: 'inox' });
    ech.part('Tube intermédiaire', S.pipe([[XF - 650, clr + 60, ez], [0, clr + 60, ez + 40], [XR + 200, clr + 120, halfW - 500]], 55), { mat: 'inox' });
    ech.part('Silencieux intermédiaire', S.cyl(160, 400, 'x'), { pos: [-200, clr + 60, ez + 30], mat: 'inox' });
    ech.part('Silencieux arrière', S.box(420, 220, 520), { pos: [xR + 380, clr + 140, halfW - 480], mat: 'inox' });
    ech.part('Embout d\'échappement', S.cyl(85, 140, 'x'), { pos: [xR + 70, clr + 130, halfW - 380], mat: 'chrome' });
    if (E.n >= 6) {
      ech.part('Silencieux arrière gauche', S.box(420, 220, 520), { pos: [xR + 380, clr + 140, -(halfW - 480)], mat: 'inox' });
      ech.part('Embout d\'échappement gauche', S.cyl(85, 140, 'x'), { pos: [xR + 70, clr + 130, -(halfW - 380)], mat: 'chrome' });
    }
  } else {
    // Véhicule électrique
    const bat = gmp.group('Batterie de traction 75 kWh', { code: 'BAT', desc: 'Lithium-ion NMC – 400 V – 8 modules' });
    const bL = WB - 700, bW = W - 360;
    bat.part('Carter inférieur de batterie', S.box(bL, 30, bW), { pos: [-60, clr + 20, 0], mat: 'aluminium' });
    bat.part('Couvercle de batterie', S.box(bL, 8, bW), { pos: [-60, clr + 150, 0], mat: 'aluminium' });
    for (let i = 0; i < 4; i++) for (const sd of SIDES) {
      const mx = -60 - bL / 2 + bL / 8 + i * bL / 4;
      bat.part(`Module ${i + 1}${sd.c}`, S.box(bL / 4 - 40, 100, bW / 2 - 60), { pos: [mx, clr + 85, sd.s * bW / 4], mat: 'peinture', color: 0x2a4a7a });
    }
    bat.part('Plaque de refroidissement liquide', S.box(bL - 40, 6, bW - 40), { pos: [-60, clr + 38, 0], mat: 'aluminium' });
    bat.part('Gestionnaire de batterie (BMS)', S.box(250, 40, 180), { pos: [-60 + bL / 2 - 200, clr + 130, 0], mat: 'abs' });
    bat.part('Connecteur haute tension', S.box(120, 80, 160), { pos: [-60 - bL / 2 - 40, clr + 90, 0], mat: 'abs', color: 0xff7a00 });
    for (const sd of SIDES) boltRow(bat, { from: [-60 - bL / 2 + 60, clr + 5, sd.s * (bW / 2 - 15)], to: [-60 + bL / 2 - 60, clr + 5, sd.s * (bW / 2 - 15)], n: 10, d: 10, L: 40, axis: 'y', dir: -1, label: `Vis de fixation de batterie ${sd.c}`, couple: 50 });
    const mot = gmp.group('Moteur électrique arrière', { code: 'MEL' });
    mot.part('Stator', S.cyl(260, 280, 'z'), { pos: [XR - 80, WY + 40, -120], mat: 'aluminium', desc: 'Moteur synchrone à aimants permanents – 210 kW' });
    mot.part('Rotor', S.cyl(160, 260, 'z'), { pos: [XR - 80, WY + 40, -120], mat: 'acier' });
    mot.part('Réducteur 1 rapport (9:1)', S.box(260, 300, 200), { pos: [XR, WY + 20, 120], mat: 'aluminium' });
    mot.part('Onduleur', S.box(300, 120, 400), { pos: [XR - 60, WY + 250, 0], mat: 'aluminium' });
    mot.part('Câbles haute tension', S.pipe([[-60 - bL / 2 - 40, clr + 90, 0], [XR + 150, clr + 200, 50], [XR - 60, WY + 200, 0]], 28), { mat: 'plastique', color: 0xff7a00 });
    for (const sd of SIDES) {
      mot.part(`Arbre de roue ${sd.m}`, S.rod([XR, WY + 20, sd.s * 140], [XR, WY, sd.s * (track / 2 - 110)], 30), { mat: 'acierHR' });
      mot.part(`Écrou de moyeu arrière ${sd.m}`, S.nut(22, 'z'), { pos: [XR, WY, sd.s * (track / 2 - 70)], mat: 'acierHR', couple: '330 N·m' });
    }
    boltCircle(mot, { n: 8, pcd: 220, d: 8, L: 30, axis: 'z', at: [XR - 80, WY + 40, -265], dir: -1, label: 'Vis de flasque moteur', kind: 'cap', couple: 25 });
    const ch2 = gmp.group('Recharge & électronique', { code: 'ELE' });
    ch2.part('Chargeur embarqué 11 kW', S.box(350, 100, 300), { pos: [xF - 600, hoodAt(xF - 600) - 160, 0], mat: 'aluminium' });
    ch2.part('Convertisseur DC/DC 12 V', S.box(200, 80, 200), { pos: [xF - 600, hoodAt(xF - 600) - 300, 250], mat: 'aluminium' });
    ch2.part('Prise de recharge Combo CCS2', S.box(40, 120, 100), { pos: [xR + 300, belt - 160, -(halfW + 2)], mat: 'abs', color: 0x111111 });
    ch2.part('Batterie 12 V auxiliaire', S.box(200, 160, 170), { pos: [xF - 350, hoodAt(xF - 350) - 140, -(halfW - 300)], mat: 'electrolyte' });
    ch2.part('Coffre avant (frunk)', S.box(500, 220, W - 600), { pos: [xF - 400, hoodAt(xF - 400) - 160, 0], mat: 'plastique', layer: 'int' });
    const ref = gmp.group('Gestion thermique', { code: 'REF' });
    ref.part('Radiateur basse température', S.box(40, Math.max(250, Math.min(380, nose - clr - 150)), W - 1100), { pos: [xF - 170, clr + (nose - clr) / 2, 0], mat: 'aluminium' });
    ref.part('Pompe à chaleur (compresseur électrique)', S.cyl(120, 160, 'z'), { pos: [xF - 500, clr + 250, -300], mat: 'aluminium' });
    ref.part('Vanne multivoies de circuit thermique', S.box(150, 150, 150), { pos: [xF - 500, clr + 250, 200], mat: 'abs' });
  }

  // ------------------------------------------------------------------ Liaisons au sol
  const ls = car.group('Liaisons au sol', { code: 'LAS', layer: 'sol' });
  const [dF, dR] = P.disc;
  for (const [ax, nomAx] of [[XF, 'avant'], [XR, 'arrière']]) {
    for (const sd of SIDES) {
      const drum = ax < 0 && P.drumRear;
      wheel(ls, `Roue ${nomAx} ${sd.f}`, sd.s, {
        pos: [ax, WY, sd.s * track / 2], tire: P.tire, studs: P.frame ? 6 : 5, pcd: P.frame ? 139.7 : 112, stud: P.frame ? 14 : 12, studL: 28, couple: P.frame ? 140 : 120,
        disc: drum ? null : ax > 0 ? dF : dR, drum: drum ? dR : null, caliperAngle: ax > 0 ? 150 : 30, code: 'ROU', hubD: P.frame ? 160 : 120, spokes: P.frame ? 6 : 5,
        caliperColor: P.drive === 'RWD' ? 0xd4a017 : 0x2a2c30,
      });
    }
  }
  const sav = ls.group('Train avant pseudo-McPherson', { code: 'TAV' });
  const topY = Math.min(hoodAt(XF - 65) - 45, WY + 560);
  for (const sd of SIDES) {
    const z = sd.s * (track / 2 - 135);
    const g = sav.group(`Jambe de force ${sd.f}`, { code: 'TAV' });
    g.part('Amortisseur', S.rod([XF - 20, WY + 100, z], [XF - 60, topY - 60, z - sd.s * 40], 52), { mat: 'peinture', color: 0x222222 });
    g.part('Tige d\'amortisseur', S.rod([XF - 60, topY - 60, z - sd.s * 40], [XF - 65, topY, z - sd.s * 45], 22), { mat: 'chrome' });
    g.part('Ressort hélicoïdal', S.spring(150, 13, (topY - WY) * 0.55, 6), { pos: [XF - 45, WY + (topY - WY) * 0.62, z - sd.s * 25], mat: 'peinture', color: 0xd8b10f });
    g.part('Coupelle supérieure', S.cyl(160, 30, 'y'), { pos: [XF - 65, topY, z - sd.s * 45], mat: 'acier' });
    for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; g.part(`Écrou de coupelle ${i + 1}`, S.nut(8), { pos: [XF - 65 + Math.cos(a) * 55, topY + 20, z - sd.s * 45 + Math.sin(a) * 55], mat: 'zingue', couple: 25 }); }
    g.part('Pivot / porte-moyeu', S.box(80, 260, 80), { pos: [XF, WY + 20, sd.s * (track / 2 - 85)], mat: 'fonte' });
    for (const k of [1, 2]) g.part(`Vis de pivot sur jambe ${k}`, S.bolt(14, 80, 'x'), { pos: [XF + 50, WY + 130 - k * 50, z], mat: 'acierHR', couple: 200 });
    const tr2 = sav.group(`Triangle inférieur ${sd.m}`, { code: 'TAV' });
    const ty = clr + 70;
    tr2.part('Bras avant', S.rod([XF, ty, sd.s * (track / 2 - 85)], [XF + 120, ty + 10, sd.s * (lw / 2 - 160)], 35), { mat: 'acier' });
    tr2.part('Bras arrière', S.rod([XF, ty, sd.s * (track / 2 - 85)], [XF - 250, ty + 10, sd.s * (lw / 2 - 140)], 35), { mat: 'acier' });
    tr2.part('Rotule de triangle', S.sphere(45), { pos: [XF, ty, sd.s * (track / 2 - 85)], mat: 'acier' });
    tr2.part('Silent-bloc avant', S.tube(60, 20, 50, 'x'), { pos: [XF + 120, ty + 10, sd.s * (lw / 2 - 160)], mat: 'caoutchouc' });
    tr2.part('Vis de silent-bloc avant', S.bolt(12, 80, 'x'), { pos: [XF + 160, ty + 10, sd.s * (lw / 2 - 160)], mat: 'acierHR', couple: '100 N·m + 90°' });
    tr2.part('Vis de silent-bloc arrière', S.bolt(12, 90, 'y'), { pos: [XF - 250, ty - 40, sd.s * (lw / 2 - 140)], rot: [180, 0, 0], mat: 'acierHR', couple: '120 N·m + 90°' });
    tr2.part('Écrou de rotule', S.nut(14), { pos: [XF, ty - 40, sd.s * (track / 2 - 85)], mat: 'acierHR', couple: 70 });
  }
  sav.part('Barre stabilisatrice avant', S.pipe([[XF - 180, clr + 120, -(track / 2 - 155)], [XF - 150, clr + 140, -200], [XF - 150, clr + 140, 200], [XF - 180, clr + 120, track / 2 - 155]], 22), { mat: 'peinture', color: 0x222222 });
  const dir = ls.group('Direction', { code: 'DIR' });
  dir.part('Crémaillère de direction assistée', S.cyl(60, lw - 100, 'z'), { pos: [XF - 160, clr + 200, 0], mat: 'aluminium' });
  dir.part('Moteur d\'assistance électrique', S.cyl(90, 180, 'x'), { pos: [XF - 260, clr + 220, -200], mat: 'aluminium' });
  for (const sd of SIDES) {
    dir.part(`Biellette de direction ${sd.f}`, S.rod([XF - 160, clr + 200, sd.s * (lw / 2 - 50)], [XF - 120, WY + 60, sd.s * (track / 2 - 85)], 18), { mat: 'acierHR' });
    dir.part(`Rotule de direction ${sd.f}`, S.sphere(40), { pos: [XF - 120, WY + 60, sd.s * (track / 2 - 85)], mat: 'acier' });
    dir.part(`Contre-écrou de biellette ${sd.f}`, S.nut(14, 'z'), { pos: [XF - 140, clr + 210, sd.s * (lw / 2 + 50)], mat: 'zingue', couple: 50 });
  }
  const swX = wsX - 520;
  dir.part('Colonne de direction', S.rod([XF - 220, clr + 240, -300], [swX + 20, belt + 20, -(cabW / 2 - 310)], 30), { mat: 'acier' });

  const rearName = P.leaf ? 'Pont arrière rigide à lames' : P.drive === 'FWD' ? 'Train arrière à traverse déformable' : 'Train arrière multibras';
  const sar = ls.group(rearName, { code: 'TAR' });
  if (P.leaf) {
    for (const sd of SIDES) {
      const lz = sd.s * (lw / 2);
      const lg = sar.group(`Ressort à lames ${sd.m}`, { code: 'TAR' });
      for (let k = 0; k < 4; k++) lg.part(`Lame ${k + 1}`, S.box(1300 - k * 250, 12, 60), { pos: [XR, WY - 60 - k * 12, lz], mat: 'acierHR', color: 0x1c1d20 });
      lg.part('Main de ressort avant', S.box(80, 120, 70), { pos: [XR + 650, WY, lz], mat: 'acier' });
      lg.part('Jumelle de ressort', S.box(40, 140, 70), { pos: [XR - 650, WY, lz], mat: 'acier' });
      for (const k of [1, 2]) for (const dz of [-1, 1]) lg.part(`Écrou d'étrier en U ${k}${dz < 0 ? 'a' : 'b'}`, S.nut(14), { pos: [XR + (k === 1 ? -50 : 50), WY - 130, lz + dz * 40], rot: [180, 0, 0], mat: 'acierHR', couple: 130 });
      sar.part(`Amortisseur arrière ${sd.m}`, S.rod([XR - 120, WY - 40, lz + sd.s * 40], [XR - 200, ly + 80, lz - sd.s * 10], 50), { mat: 'peinture', color: 0x222222 });
    }
  } else if (P.drive === 'FWD') {
    sar.part('Traverse déformable', S.box(110, 90, track - 240), { pos: [XR + 300, WY - 30, 0], mat: 'acier' });
    for (const sd of SIDES) {
      const z = sd.s * (track / 2 - 135);
      sar.part(`Bras tiré ${sd.m}`, S.rod([XR + 650, WY - 20, z], [XR, WY, z], 60), { mat: 'acier' });
      sar.part(`Vis d'articulation de bras ${sd.m}`, S.bolt(14, 110, 'z'), { pos: [XR + 650, WY - 20, z + sd.s * 60], rot: axisRot('z', sd.s), mat: 'acierHR', couple: 110 });
      sar.part(`Amortisseur arrière ${sd.m}`, S.rod([XR - 80, WY - 20, z - sd.s * 40], [XR - 140, WY + 440, z - sd.s * 60], 48), { mat: 'peinture', color: 0x222222 });
      sar.part(`Ressort arrière ${sd.m}`, S.spring(140, 12, 260, 6), { pos: [XR + 150, WY + 120, z - sd.s * 40], mat: 'peinture', color: 0xd8b10f });
      sar.part(`Fusée arrière ${sd.f}`, S.cyl(45, 120, 'z'), { pos: [XR, WY, sd.s * (track / 2 - 85)], mat: 'acierHR' });
    }
  } else {
    sar.part('Berceau arrière', S.box(500, 70, lw - 60), { pos: [XR, clr + 120, 0], mat: 'acier', layer: 'struct' });
    for (const sd of SIDES) {
      const z = sd.s * (track / 2 - 135);
      sar.part(`Porte-moyeu arrière ${sd.m}`, S.box(90, 240, 80), { pos: [XR, WY + 10, sd.s * (track / 2 - 90)], mat: 'aluminium' });
      sar.part(`Bras supérieur ${sd.m}`, S.rod([XR, WY + 140, z], [XR + 80, WY + 170, sd.s * (lw / 2 - 120)], 25), { mat: 'aluminium' });
      sar.part(`Bras inférieur ${sd.m}`, S.rod([XR, WY - 90, z], [XR + 150, clr + 100, sd.s * (lw / 2 - 120)], 30), { mat: 'acier' });
      sar.part(`Biellette de pincement ${sd.m}`, S.rod([XR - 100, WY - 50, z], [XR - 150, clr + 110, sd.s * (lw / 2 - 120)], 20), { mat: 'acier' });
      sar.part(`Bras de traction ${sd.m}`, S.rod([XR + 50, WY - 60, z], [XR + 500, clr + 120, sd.s * (lw / 2)], 30), { mat: 'acier' });
      sar.part(`Amortisseur arrière ${sd.m}`, S.rod([XR - 60, WY - 60, z - sd.s * 30], [XR - 120, WY + 430, z - sd.s * 50], 48), { mat: 'peinture', color: 0x222222 });
      sar.part(`Ressort arrière ${sd.m}`, S.spring(130, 12, 240, 6), { pos: [XR + 160, WY + 70, z - sd.s * 50], mat: 'peinture', color: 0xd8b10f });
      for (const k of ['supérieur', 'inférieur']) sar.part(`Vis d'ancrage bras ${k} ${sd.m}`, S.bolt(12, 80, 'x'), { pos: [XR + (k === 'supérieur' ? 80 : 150), k === 'supérieur' ? WY + 170 : clr + 100, sd.s * (lw / 2 - 120)], mat: 'acierHR', couple: '90 N·m + 90°' });
    }
  }

  // ------------------------------------------------------------------ Habitacle
  const hab = car.group('Habitacle', { code: 'HAB', layer: 'int' });
  const sY = floorY + 30;
  const fsX = bX + 150;
  const luxe = P.drive === 'RWD' || P.drive === 'EV';
  for (const sd of SIDES) seat(hab, `Siège avant ${sd.m}`, [fsX, sY, sd.s * (cabW / 2 - 300)], { code: 'SIE', w: Math.min(540, cabW / 2 - 60), mat: luxe ? 'cuir' : 'tissu', color: luxe ? 0x161616 : undefined });
  const rows = P.rear === 'pickup' || P.doors === 2 ? Math.min(P.rows, 2) : P.rows;
  for (let r = 1; r < rows; r++) {
    const bx = fsX - 880 * r;
    if (bx - 300 < Math.max(cR, xR + 200) && P.rear !== 'wagon' && P.rear !== 'hatch') continue;
    const banq = hab.group(r === 1 ? 'Banquette arrière' : `Sièges ${r + 1}e rang`, { code: 'SIE' });
    banq.part('Assise', S.box(460, 120, cabW - 160), { pos: [bx, sY + 60, 0], mat: 'tissu' });
    banq.part('Dossier 60 %', S.box(110, 560, (cabW - 160) * 0.6), { pos: [bx - 250, sY + 360, -(cabW - 160) * 0.2], rot: [0, 0, -15], mat: 'tissu' });
    banq.part('Dossier 40 %', S.box(110, 560, (cabW - 160) * 0.4), { pos: [bx - 250, sY + 360, (cabW - 160) * 0.3], rot: [0, 0, -15], mat: 'tissu' });
    banq.part('Ancrage ISOFIX', S.box(30, 30, 300), { pos: [bx - 200, sY + 70, -(cabW / 2 - 300)], mat: 'acier' });
  }
  const pb = hab.group('Planche de bord', { code: 'PDB' });
  pb.part('Planche de bord', S.box(320, 230, cabW - 20), { pos: [wsX - 180, belt - 30, 0], mat: 'abs', color: 0x1f2124 });
  pb.part('Combiné d\'instruments', S.box(30, 120, 300), { pos: [wsX - 350, belt + 60, -(cabW / 2 - 310)], rot: [0, 0, -10], mat: 'ecran' });
  pb.part('Écran multimédia', S.box(20, 150, 260), { pos: [wsX - 340, belt + 100, 0], rot: [0, 0, -10], mat: 'ecran' });
  pb.part('Traverse de planche de bord', S.cyl(60, cabW - 100, 'z'), { pos: [wsX - 150, belt - 70, 0], mat: 'acier', layer: 'struct' });
  pb.part('Module airbag passager', S.box(150, 90, 300), { pos: [wsX - 190, belt + 70, cabW / 2 - 310], mat: 'abs' });
  const vol = hab.group('Poste de conduite', { code: 'PDC' });
  vol.part('Volant', S.torus(370, 30, 'x'), { pos: [swX, belt + 30, -(cabW / 2 - 310)], rot: [0, 0, -22], mat: 'cuir', color: 0x151515 });
  vol.part('Moyeu de volant / airbag conducteur', S.cyl(160, 80, 'x'), { pos: [swX + 10, belt + 30, -(cabW / 2 - 310)], rot: [0, 0, -22], mat: 'abs' });
  vol.part('Écrou de volant', S.nut(16, 'x'), { pos: [swX + 40, belt + 40, -(cabW / 2 - 310)], rot: [0, 0, -22], mat: 'acierHR', couple: 50 });
  const manual = P.eng && P.drive === 'FWD';
  vol.part(manual ? 'Levier de vitesses' : 'Sélecteur de marche', S.rod([fsX + 150, sY + 200, 0], [fsX + 100, sY + 380, 0], 16), { mat: 'chrome' });
  const pedals = manual ? ['Pédale d\'embrayage', 'Pédale de frein', 'Pédale d\'accélérateur'] : ['Pédale de frein', 'Pédale d\'accélérateur'];
  pedals.forEach((n, i) => {
    const pz = -(cabW / 2 - 200) + i * 120;
    vol.part(n, S.box(20, 90, 70), { pos: [wsX - 150, sY + 150, pz], rot: [0, 0, 20], mat: 'caoutchouc' });
    vol.part(`Bras de ${n.toLowerCase()}`, S.rod([wsX - 150, sY + 150, pz], [wsX - 90, sY + 430, pz], 16), { mat: 'acier' });
  });
  vol.part('Maître-cylindre de frein', S.cyl(60, 200, 'x'), { pos: [wsX + 100, belt - 190, -(cabW / 2 - 320)], mat: 'aluminium', layer: 'meca' });
  vol.part('Servofrein', S.cyl(250, 120, 'x'), { pos: [wsX + 40, belt - 190, -(cabW / 2 - 320)], mat: 'peinture', color: 0x222222, layer: 'meca' });
  const backX = P.rear === 'pickup' ? cR : xR + 300;
  hab.part('Moquette de plancher', S.box(Math.max(400, wsX - backX - 100), 8, cabW - 60), { pos: [(wsX + backX) / 2, floorY - 20, 0], mat: 'tissu', color: 0x222428 });
  return car;
}

/** Panneau plat entre deux points du profil latéral (plan XY) */
function panel(asm, name, A, B, width, thick, opts) {
  const dx = B[0] - A[0], dy = B[1] - A[1];
  const len = Math.hypot(dx, dy), ang = Math.atan2(dy, dx) * 180 / Math.PI;
  return asm.part(name, S.box(len, thick, width), { ...opts, pos: [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2 + thick / 2, 0], rot: [0, 0, ang] });
}

/** Pont / différentiel arrière (propulsion et 4×4) */
function rearDiff(ax, P, XR, WY, track) {
  const dy = P.leaf ? 0 : 40;
  if (P.leaf) ax.part('Trompe de pont arrière', S.cyl(90, track - 200, 'z'), { pos: [XR, WY, 0], mat: 'acierHR', color: 0x1c1d20 });
  ax.part('Carter de différentiel arrière', S.sphere(P.leaf ? 300 : 260), { pos: [XR, WY + dy, 0], mat: 'fonte' });
  ax.part('Couvercle de différentiel', S.cyl(220, 30, 'x'), { pos: [XR - 140, WY + dy, 0], mat: 'fonte' });
  boltCircle(ax, { n: 10, pcd: 190, d: 8, L: 25, axis: 'x', at: [XR - 155, WY + dy, 0], dir: -1, label: 'Vis de couvercle de différentiel', couple: 28 });
  ax.part('Couronne de différentiel', S.cyl(210, 30, 'z'), { pos: [XR, WY + dy, -60], mat: 'acierHR' });
  ax.part('Pignon d\'attaque', S.cyl(70, 140, 'x', 24, 40), { pos: [XR + 120, WY + dy, 0], mat: 'acierHR' });
  ax.part('Bouchon de remplissage de pont', S.bolt(16, 14, 'x'), { pos: [XR - 160, WY + dy + 40, 60], rot: [0, 0, 90], mat: 'acier', couple: 40 });
  for (const sd of SIDES) {
    if (P.leaf) ax.part(`Arbre de roue ${sd.m}`, S.cyl(32, track / 2 - 150, 'z'), { pos: [XR, WY, sd.s * (track / 4)], mat: 'acierHR' });
    else {
      ax.part(`Arbre de transmission arrière ${sd.m}`, S.rod([XR, WY + dy, sd.s * 140], [XR, WY, sd.s * (track / 2 - 110)], 30), { mat: 'acierHR' });
      ax.part(`Écrou de moyeu arrière ${sd.m}`, S.nut(22, 'z'), { pos: [XR, WY, sd.s * (track / 2 - 70)], mat: 'acierHR', couple: '330 N·m' });
    }
  }
}
