// Véhicules utilitaires légers – générateur paramétrique (cotes en mm)
// Repère : X avant, Y haut, Z droite. Origine au sol, au milieu de l'empattement.
import { Assembly, S, SIDES, boltRow, axisRot } from '../core/builder.js';
import { wheel, inlineEngine, seat } from '../core/parts.js';

export const VAN_TYPES = {
  fourgonnette: {
    label: 'Fourgonnette', desc: 'Fourgonnette compacte – traction – 4 cylindres 1,5 L diesel – volume utile 3,9 m³ – charge utile 800 kg',
    L: 4490, W: 1860, H: 1850, WB: 2780, fo: 880, tire: [205, 60, 16], clr: 170, nose: 1000, belt: 1080, hood: 900, cabH: 1850, rake: 30,
    paint: 0xf2f2f0, eng: { n: 4, bore: 76, stroke: 80.5, pitch: 84, label: '1,5 L 4 cylindres diesel – 85 kW' }, drive: 'FWD', disc: [[280, 26], [260, 10]], seats: 2,
    makers: ['Renault (Kangoo Van)', 'Citroën (Berlingo Van)', 'Peugeot (Partner)', 'Volkswagen (Caddy Cargo)', 'Ford (Transit Connect)', 'Fiat (Doblò Cargo)', 'Toyota (Proace City)'],
  },
  fourgon: {
    label: 'Fourgon L2H2', desc: 'Fourgon moyen L2H2 – traction – 4 cylindres 2,2 L diesel – volume utile 11,5 m³ – charge utile 1 400 kg',
    L: 5410, W: 2050, H: 2520, WB: 3450, fo: 950, tire: [225, 65, 16], clr: 180, nose: 1150, belt: 1200, hood: 800, cabH: 2150, rake: 34,
    paint: 0xc9cdd2, eng: { n: 4, bore: 86, stroke: 94.6, pitch: 92, label: '2,2 L 4 cylindres diesel – 103 kW' }, drive: 'FWD', disc: [[300, 28], [300, 16]], seats: 3,
    makers: ['Renault (Master)', 'Fiat (Ducato)', 'Peugeot (Boxer)', 'Citroën (Jumper)', 'Ford (Transit)', 'Mercedes-Benz (Sprinter)', 'Volkswagen (Crafter)', 'Iveco (Daily)'],
  },
  grand: {
    label: 'Grand fourgon L4H3 (propulsion, roues jumelées)', desc: 'Grand fourgon 5 t – propulsion – roues arrière jumelées – 4 cylindres 3,0 L diesel – volume utile 17 m³',
    L: 6970, W: 2070, H: 2810, WB: 4320, fo: 1000, tire: [195, 75, 16], clr: 200, nose: 1200, belt: 1260, hood: 850, cabH: 2250, rake: 34,
    paint: 0xf2f2f0, eng: { n: 4, bore: 95.8, stroke: 104, pitch: 102, label: '3,0 L 4 cylindres diesel – 132 kW' }, drive: 'RWD', twin: true, disc: [[300, 28], [300, 22]], seats: 3,
    makers: ['Mercedes-Benz (Sprinter 5 t)', 'Iveco (Daily 50C)', 'Renault (Master propulsion)', 'Ford (Transit propulsion)', 'Volkswagen (Crafter 5 t)'],
  },
};

export function buildVan(type = 'fourgon') {
  const P = VAN_TYPES[type] || VAN_TYPES.fourgon;
  const { L, W, H, WB, belt, nose, paint, clr } = P;
  const XF = WB / 2, XR = -WB / 2;
  const xF = XF + P.fo, xR = xF - L;
  const D = Math.round(P.tire[2] * 25.4 + 2 * P.tire[0] * P.tire[1] / 100);
  const WY = D / 2, AR = D / 2 + 45;
  const hw = W / 2;
  const wsX = xF - P.hood, wsTopY = P.cabH - 80;
  const wsTopX = wsX - (wsTopY - belt) / Math.tan(P.rake * Math.PI / 180);
  const bX = wsTopX - 900; // montant B (cloison cabine / cargo)
  const floorY = clr + (P.drive === 'RWD' ? 520 : 380);
  const rwd = P.drive === 'RWD';

  const v = new Assembly(P.label, { prefix: 'VU', code: 'GEN', layer: 'meca', desc: `${P.desc} – ${L} × ${W} × ${H} mm – empattement ${WB} mm` });

  // ------------------------------------------------------------------ Carrosserie
  const arch = (cx) => { const pts = []; for (let i = 0; i <= 20; i++) { const a = (i / 20) * Math.PI; pts.push([cx + AR * Math.cos(a), WY + AR * Math.sin(a)]); } return pts; };
  const profile = [
    [xR, clr + 120], [xR, H - 40], [xR + 40, H], [wsTopX - 250, H], [wsTopX, P.cabH], [wsX, belt],
    [xF - 120, nose], [xF, nose - 200], [xF, clr + 160], [XF + AR, clr + 40], ...arch(XF), [XR + AR, clr + 40], ...arch(XR), [xR + 150, clr + 40],
  ];
  const car = v.group('Carrosserie', { code: 'CAR', layer: 'ext' });
  for (const sd of SIDES) car.part(`Flanc de caisse ${sd.m}`, S.extrude(profile, 3), { pos: [0, 0, sd.s * (hw - 2)], mat: 'peinture', color: paint, desc: 'Tôle acier 0,8 mm emboutie, cataphorèse + peinture' });
  car.part('Pavillon', S.box(wsTopX - 250 - xR, 3, W - 60), { pos: [(wsTopX - 250 + xR) / 2, H - 2, 0], mat: 'peinture', color: paint });
  car.part('Pavillon avant (casquette)', S.extrude([[wsTopX - 250, H], [wsTopX, P.cabH], [wsTopX - 250, P.cabH]], W - 60), { mat: 'peinture', color: paint });
  car.part('Capot moteur', S.extrude([[wsX, belt], [xF - 120, nose], [xF - 120, nose - 4], [wsX, belt - 4]], W - 140), { mat: 'peinture', color: paint });
  car.part('Face avant', S.box(30, nose - clr - 360, W - 120), { pos: [xF - 10, (nose + clr + 160) / 2, 0], mat: 'peinture', color: paint });
  car.part('Calandre', S.box(30, 260, W * 0.55), { pos: [xF + 5, nose - 260, 0], mat: 'abs', color: 0x1a1a1a });
  car.part('Emblème de calandre', S.cyl(100, 8, 'x'), { pos: [xF + 25, nose - 260, 0], mat: 'chrome', desc: 'Emplacement du logo constructeur' });
  car.part('Pare-chocs avant', S.box(180, 330, W + 20), { pos: [xF + 20, clr + 260, 0], mat: 'plastique', color: 0x2a2c30 });
  car.part('Pare-chocs arrière avec marchepied', S.box(220, 200, W), { pos: [xR - 40, clr + 200, 0], mat: 'plastique', color: 0x2a2c30 });
  car.part('Plaque d\'immatriculation avant', S.box(4, 110, 520), { pos: [xF + 115, clr + 280, 0], mat: 'aluminium', color: 0xffffff });
  car.part('Plaque d\'immatriculation arrière', S.box(4, 110, 520), { pos: [xR - 155, clr + 220, 0], mat: 'aluminium', color: 0xffffff });
  for (const sd of SIDES) {
    car.part(`Protection latérale ${sd.f}`, S.box(L - 1400, 120, 15), { pos: [(xF + xR) / 2 - 200, clr + 330, sd.s * (hw + 6)], mat: 'plastique', color: 0x2a2c30 });
    car.part(`Projecteur ${sd.m}`, S.box(60, 160, 380), { pos: [xF - 40, nose - 130, sd.s * (hw - 230)], mat: 'feuBlanc' });
    car.part(`Feu arrière vertical ${sd.m}`, S.box(40, 450, 120), { pos: [xR - 10, belt - 100, sd.s * (hw - 70)], mat: 'feuRouge' });
    const rv = car.group(`Rétroviseur ${sd.m}`, { code: 'RET' });
    rv.part('Coque de rétroviseur', S.box(120, 300, 250), { pos: [wsX - 120, belt + 150, sd.s * (hw + 140)], mat: 'plastique', color: 0x2a2c30 });
    rv.part('Miroir grand angle', S.box(6, 120, 220), { pos: [wsX - 180, belt + 70, sd.s * (hw + 140)], mat: 'chrome' });
    rv.part('Miroir principal', S.box(6, 160, 220), { pos: [wsX - 180, belt + 220, sd.s * (hw + 140)], mat: 'chrome' });
    rv.part('Vis de fixation de rétroviseur', S.bolt(8, 30, 'z'), { pos: [wsX - 120, belt + 100, sd.s * (hw + 10)], rot: axisRot('z', sd.s), mat: 'acierHR', couple: 12 });
  }
  car.part('Feu stop surélevé', S.box(30, 40, 300), { pos: [xR - 5, H - 60, 0], mat: 'feuRouge' });
  // Portes
  const por = car.group('Ouvrants', { code: 'POR' });
  for (const sd of SIDES) {
    const pc = por.group(`Porte avant ${sd.f}`, { code: 'POR' });
    pc.part('Panneau de porte', S.box(wsX - bX - 60, belt - clr - 250, 40), { pos: [(wsX + bX) / 2, (belt + clr + 250) / 2, sd.s * (hw + 4)], mat: 'peinture', color: paint });
    pc.part('Vitre de porte', S.box(wsTopX - bX - 100, wsTopY - belt - 60, 5), { pos: [(wsTopX + bX) / 2, (wsTopY + belt) / 2, sd.s * (hw + 2)], mat: 'verre' });
    pc.part('Poignée extérieure', S.box(150, 35, 30), { pos: [bX + 200, belt - 80, sd.s * (hw + 28)], mat: 'plastique', color: 0x111111 });
    pc.part('Serrure', S.box(60, 80, 30), { pos: [bX + 80, belt - 200, sd.s * hw], mat: 'zingue', layer: 'meca' });
    for (const k of [1, 2]) {
      pc.part(`Charnière ${k}`, S.box(60, 90, 40), { pos: [wsX - 80, clr + 450 + (k - 1) * 380, sd.s * (hw - 5)], mat: 'acier', layer: 'struct' });
      pc.part(`Vis de charnière ${k}`, S.bolt(8, 20, 'z'), { pos: [wsX - 80, clr + 450 + (k - 1) * 380, sd.s * (hw - 25)], rot: axisRot('z', -sd.s), mat: 'acierHR', couple: 25 });
    }
  }
  const slideL = Math.min(1300, (bX - xR) * 0.4);
  const pl = por.group('Porte latérale coulissante droite', { code: 'POR' });
  pl.part('Panneau de porte coulissante', S.box(slideL, H - clr - 450, 40), { pos: [bX - 50 - slideL / 2, (H + clr - 100) / 2 - 80, hw + 6], mat: 'peinture', color: paint });
  pl.part('Rail de guidage supérieur', S.box(slideL + 600, 30, 30), { pos: [bX - 350 - slideL / 2, H - 200, hw - 15], mat: 'zingue', layer: 'struct' });
  pl.part('Rail de guidage central', S.box(slideL + 800, 40, 40), { pos: [bX - 450 - slideL / 2, belt, hw + 30], mat: 'plastique', color: 0x111111 });
  pl.part('Rail de guidage inférieur', S.box(slideL + 400, 30, 30), { pos: [bX - 250 - slideL / 2, floorY - 30, hw - 15], mat: 'zingue', layer: 'struct' });
  for (const k of ['haut', 'central', 'bas']) pl.part(`Chariot à galets ${k}`, S.box(120, 60, 60), { pos: [bX - 100, k === 'haut' ? H - 200 : k === 'bas' ? floorY - 30 : belt, hw - 20], mat: 'acier', layer: 'meca' });
  pl.part('Poignée de porte coulissante', S.box(160, 35, 30), { pos: [bX - 150, belt - 80, hw + 30], mat: 'plastique', color: 0x111111 });
  for (const sd of SIDES) {
    const pa = por.group(`Porte arrière ${sd.f} (battant 270°)`, { code: 'POR' });
    pa.part('Panneau de battant', S.box(40, H - clr - 350, hw - 30), { pos: [xR - 20, (H + clr - 50) / 2 - 40, sd.s * (hw / 2)], mat: 'peinture', color: paint });
    pa.part('Vitre de battant', S.box(6, 500, hw - 250), { pos: [xR - 42, H - 600, sd.s * (hw / 2)], mat: 'verre' });
    for (const k of [1, 2, 3]) {
      pa.part(`Charnière 270° ${k}`, S.box(60, 100, 60), { pos: [xR - 30, clr + 300 + k * (H - clr - 700) / 3, sd.s * (hw - 20)], mat: 'acier', layer: 'struct' });
      pa.part(`Vis de charnière ${k}`, S.bolt(8, 20, 'x'), { pos: [xR - 10, clr + 300 + k * (H - clr - 700) / 3, sd.s * (hw - 20)], rot: axisRot('x', -1), mat: 'acierHR', couple: 25 });
    }
    pa.part('Tringle de verrouillage', S.cyl(16, H - clr - 400, 'y'), { pos: [xR + 10, (H + clr) / 2, sd.s * 40], mat: 'zingue', layer: 'meca' });
  }
  const vit = car.group('Vitrage', { code: 'VIT' });
  const wsLen = Math.hypot(wsX - wsTopX, wsTopY - belt);
  vit.part('Pare-brise', S.box(6, wsLen, W - 200), { pos: [(wsX + wsTopX) / 2 - 10, (belt + wsTopY) / 2, 0], rot: [0, 0, 90 - P.rake], mat: 'verre', desc: 'Verre feuilleté' });

  // ------------------------------------------------------------------ Caisse & zone de chargement
  const st = v.group('Structure de caisse', { code: 'STR', layer: 'struct' });
  st.part('Plancher de caisse', S.box(bX - xR - 40, 4, W - 80), { pos: [(bX + xR) / 2, floorY - 25, 0], mat: 'acier', color: 0x3a3d42 });
  st.part('Plancher de cabine', S.box(xF - bX - 600, 4, W - 80), { pos: [(xF + bX) / 2 - 300, clr + 340, 0], mat: 'acier', color: 0x3a3d42 });
  for (const sd of SIDES) {
    st.part(`Longeron ${sd.m}`, S.box(L - 400, rwd ? 180 : 110, 70), { pos: [(xF + xR) / 2, rwd ? floorY - 150 : clr + 200, sd.s * (rwd ? 500 : hw - 250)], mat: 'acier', color: 0x2b2d31, desc: rwd ? 'Châssis échelle en profilé en C' : 'Longeron caisson soudé (caisse autoporteuse)' });
    st.part(`Bas de caisse ${sd.m}`, S.box(bX - xR - 200, 120, 80), { pos: [(bX + xR) / 2, floorY - 60, sd.s * (hw - 40)], mat: 'acier', color: 0x2b2d31 });
    st.part(`Montant B ${sd.m}`, S.box(120, H - floorY - 100, 80), { pos: [bX, (H + floorY) / 2, sd.s * (hw - 40)], mat: 'acier', color: 0x2b2d31 });
    st.part(`Montant A ${sd.m}`, S.rod([wsX - 30, belt, sd.s * (hw - 60)], [wsTopX - 30, wsTopY, sd.s * (hw - 60)], 80), { mat: 'acier', color: 0x2b2d31 });
    st.part(`Pied arrière ${sd.m}`, S.box(80, H - clr - 200, 80), { pos: [xR + 40, (H + clr) / 2, sd.s * (hw - 40)], mat: 'acier', color: 0x2b2d31 });
    const nBow = Math.max(2, Math.round((bX - xR) / 900));
    for (let i = 1; i < nBow; i++) st.part(`Renfort latéral ${sd.c}${i}`, S.box(80, H - floorY - 200, 40), { pos: [xR + i * (bX - xR) / nBow, (H + floorY) / 2, sd.s * (hw - 30)], mat: 'acier', color: 0x2b2d31 });
  }
  const nArc = Math.max(3, Math.round((bX - xR) / 700));
  for (let i = 0; i <= nArc; i++) st.part(`Arceau de pavillon ${i + 1}`, S.box(60, 40, W - 100), { pos: [xR + 40 + i * (bX - xR - 80) / nArc, H - 30, 0], mat: 'acier', color: 0x2b2d31 });
  st.part('Traverse avant', S.box(100, 150, W - 160), { pos: [xF - 200, clr + 260, 0], mat: 'acier', color: 0x2b2d31 });
  st.part('Traverse arrière', S.box(100, 150, W - 160), { pos: [xR + 80, floorY - 100, 0], mat: 'acier', color: 0x2b2d31 });
  for (const sd of SIDES) boltRow(st, { from: [xR + 300, floorY - 25, sd.s * (hw - 200)], to: [bX - 300, floorY - 25, sd.s * (hw - 200)], n: 5, d: 8, L: 30, axis: 'y', dir: 1, label: `Vis de plancher bois ${sd.c}`, kind: 'cap', couple: 20 });

  const chg = v.group('Zone de chargement', { code: 'CHG', layer: 'int' });
  const cargoL = bX - xR - 120;
  chg.part('Plancher bois (contreplaqué 12 mm)', S.box(cargoL, 12, W - 160), { pos: [(bX + xR) / 2, floorY - 17, 0], mat: 'bois' });
  for (const sd of SIDES) chg.part(`Habillage latéral bois ${sd.m}`, S.box(cargoL - 200, 1000, 9), { pos: [(bX + xR) / 2, floorY + 520, sd.s * (hw - 80)], mat: 'bois' });
  chg.part('Cloison de séparation cabine', S.box(15, H - floorY - 150, W - 180), { pos: [bX - 40, (H + floorY - 150) / 2, 0], mat: 'acier', color: 0x3a3d42, desc: 'Cloison tôlée avec vitre' });
  chg.part('Vitre de cloison', S.box(6, 300, 600), { pos: [bX - 30, H - 600, -hw / 2], mat: 'polycarbonate' });
  let nr = 0;
  for (const sd of SIDES) for (let i = 0; i < 3; i++) { nr++; chg.part(`Anneau d'arrimage ${nr}`, S.torus(45, 8, 'y'), { pos: [xR + 300 + i * (cargoL - 400) / 2, floorY + 5, sd.s * (hw - 140)], mat: 'zingue', desc: 'Anneau rabattable – 500 daN (EN 12195)' }); }
  chg.part('Plafonnier LED de chargement', S.box(300, 20, 80), { pos: [(bX + xR) / 2, H - 70, 0], mat: 'feuBlanc' });
  chg.part('Passage de roue intérieur gauche', S.box(AR * 2, AR * 0.7, 260), { pos: [XR, floorY + AR * 0.35, -hw + 210], mat: 'acier', color: 0x3a3d42 });
  chg.part('Passage de roue intérieur droit', S.box(AR * 2, AR * 0.7, 260), { pos: [XR, floorY + AR * 0.35, hw - 210], mat: 'acier', color: 0x3a3d42 });

  // ------------------------------------------------------------------ Cabine
  const cab = v.group('Cabine', { code: 'CAB', layer: 'int' });
  const sX = bX + 550, sY = clr + 360;
  seat(cab, 'Siège conducteur', [sX, sY, -hw + 420], { code: 'SIE', w: 500 });
  if (P.seats === 2) seat(cab, 'Siège passager', [sX, sY, hw - 420], { code: 'SIE', w: 500 });
  else {
    const bq = cab.group('Banquette passagers 2 places', { pos: [sX, sY, hw - 520], code: 'SIE' });
    bq.part('Assise double', S.box(480, 110, 800), { pos: [0, 60, 0], mat: 'tissu' });
    bq.part('Dossier double', S.box(110, 600, 800), { pos: [-230, 380, 0], rot: [0, 0, -10], mat: 'tissu' });
    bq.part('Coffre sous banquette', S.box(450, 280, 780), { pos: [0, -140, 0], mat: 'plastique' });
    for (const k of [1, 2, 3, 4]) bq.part(`Vis de fixation ${k}`, S.bolt(10, 30, 'y'), { pos: [(k % 2 ? -1 : 1) * 180, -290, (k > 2 ? -1 : 1) * 330], rot: [180, 0, 0], mat: 'acierHR', couple: 45 });
  }
  cab.part('Planche de bord', S.box(500, 400, W - 140), { pos: [wsX - 250, belt - 100, 0], rot: [0, 0, 10], mat: 'abs' });
  cab.part('Combiné d\'instruments', S.box(30, 140, 330), { pos: [wsX - 480, belt + 40, -hw + 420], rot: [0, 0, 20], mat: 'ecran' });
  cab.part('Écran multimédia', S.box(25, 160, 260), { pos: [wsX - 480, belt + 20, 0], rot: [0, 0, 20], mat: 'ecran' });
  cab.part('Volant', S.torus(380, 30, 'x'), { pos: [sX + 430, sY + 620, -hw + 420], rot: [0, 0, -25], mat: 'cuir', color: 0x111111 });
  cab.part('Colonne de direction', S.rod([sX + 430, sY + 620, -hw + 420], [wsX - 100, clr + 450, -hw + 420], 45), { mat: 'acier', layer: 'meca' });
  cab.part('Levier de vitesses (en planche de bord)', S.cyl(30, 180, 'y'), { pos: [wsX - 380, belt - 150, -hw + 800], rot: [0, 0, 40], mat: 'abs' });
  for (const [n, z] of [['Pédale d\'embrayage', -hw + 330], ['Pédale de frein', -hw + 430], ['Pédale d\'accélérateur', -hw + 540]]) cab.part(n, S.box(70, 220, 70), { pos: [wsX - 120, clr + 520, z], rot: [0, 0, 30], mat: 'abs' });

  // ------------------------------------------------------------------ Groupe motopropulseur
  const gmp = v.group('Groupe motopropulseur', { code: 'GMP', layer: 'meca' });
  const engY = clr + 520;
  if (!rwd) {
    inlineEngine(gmp, `Moteur ${P.eng.label}`, { ...P.eng, pos: [XF + 250, engY, 0], rot: [0, 90, 0], code: 'MOT', diesel: true, turbo: true, desc: 'Moteur transversal – injection directe rampe commune' });
    gmp.part('Boîte de vitesses manuelle 6 rapports', S.cyl(260, 420, 'z'), { pos: [XF + 150, engY - 80, -(P.eng.n * P.eng.pitch / 2 + 260)], mat: 'aluminium' });
    for (const sd of SIDES) gmp.part(`Transmission avant ${sd.m}`, S.rod([XF + 80, WY, sd.s * 120], [XF, WY, sd.s * (hw - 280)], 32), { mat: 'acierHR' });
  } else {
    inlineEngine(gmp, `Moteur ${P.eng.label}`, { ...P.eng, pos: [XF + 380, engY + 80, 0], rot: [0, 180, 0], code: 'MOT', diesel: true, turbo: true, desc: 'Moteur longitudinal – injection directe rampe commune' });
    gmp.part('Boîte de vitesses automatique 9 rapports', S.cyl(300, 650, 'x'), { pos: [XF - 400, engY, 0], mat: 'aluminium' });
    gmp.part('Arbre de transmission en deux parties', S.cyl(75, XF - XR - 1100, 'x'), { pos: [(XF + XR) / 2 - 200, WY + 80, 0], mat: 'acierHR' });
    gmp.part('Palier central de transmission', S.box(80, 120, 200), { pos: [(XF + XR) / 2, WY + 80, 0], mat: 'caoutchouc' });
  }
  gmp.part('Radiateur', S.box(40, 500, W - 500), { pos: [xF - 180, nose - 450, 0], mat: 'aluminium' });
  gmp.part('Réservoir de carburant', S.box(800, 220, 650), { pos: [XR + 1000, clr + 160, -hw + 450], mat: 'plastique', desc: `${type === 'fourgonnette' ? 54 : type === 'fourgon' ? 80 : 93} litres` });
  gmp.part('Réservoir AdBlue', S.box(300, 200, 250), { pos: [XF - 600, clr + 200, -hw + 250], mat: 'plastique', color: 0x1f4fa0 });
  gmp.part('Ligne d\'échappement', S.pipe([[XF + 50, clr + 200, 200], [XF - 800, clr + 150, 300], [XR + 400, clr + 160, 350], [xR + 250, clr + 170, 400]], 55), { mat: 'inox' });
  gmp.part('Filtre à particules + SCR', S.cyl(180, 600, 'x'), { pos: [XF - 1200, clr + 170, 300], mat: 'inox' });
  gmp.part('Batterie 12 V 95 Ah', S.box(350, 190, 175), { pos: [xF - 500, nose - 300, -hw + 400], mat: 'electrolyte' });

  // ------------------------------------------------------------------ Trains roulants
  const tr = v.group('Trains roulants', { code: 'TRN', layer: 'sol' });
  const frontZ = hw - P.tire[0] / 2 - 70;
  const tav = tr.group('Train avant MacPherson', { code: 'TAV' });
  tav.part('Berceau moteur', S.box(500, 80, W - 500), { pos: [XF, clr + 180, 0], mat: 'acier', color: 0x2b2d31 });
  tav.part('Crémaillère de direction assistée électrique', S.cyl(60, W - 700, 'z'), { pos: [XF - 200, WY + 50, 0], mat: 'aluminium' });
  tav.part('Barre antiroulis avant', S.pipe([[XF - 100, WY - 20, -hw + 350], [XF - 300, WY + 20, -400], [XF - 300, WY + 20, 400], [XF - 100, WY - 20, hw - 350]], 26), { mat: 'acierHR' });
  for (const sd of SIDES) {
    tav.part(`Jambe de force ${sd.f}`, S.rod([XF, WY + 80, sd.s * (frontZ - 140)], [XF - 50, WY + 650, sd.s * (frontZ - 200)], 60), { mat: 'peinture', color: 0x222222 });
    tav.part(`Ressort hélicoïdal avant ${sd.m}`, S.spring(150, 13, 320, 6), { pos: [XF - 30, WY + 450, sd.s * (frontZ - 180)], mat: 'acierHR', color: 0x2a6f2a });
    tav.part(`Triangle inférieur ${sd.m}`, S.box(400, 40, 380), { pos: [XF, WY - 110, sd.s * (frontZ - 320)], mat: 'acier' });
    tav.part(`Biellette de direction ${sd.f}`, S.rod([XF - 200, WY + 50, sd.s * (hw - 700) / 1], [XF - 150, WY + 30, sd.s * (frontZ - 140)], 22), { mat: 'acierHR' });
    wheel(tr, `Roue avant ${sd.f}`, sd.s, { pos: [XF, WY, sd.s * frontZ], tire: P.tire, studs: rwd ? 6 : 5, pcd: rwd ? 130 : 118, stud: 14, studL: 30, couple: rwd ? 180 : 160, disc: P.disc[0], caliperAngle: 160, code: 'ROU', hubD: 150, rimMat: 'acier', spokes: 8, spokeW: 30, cap: true });
  }
  const tar = tr.group(rwd ? 'Pont arrière rigide moteur' : 'Essieu arrière rigide', { code: 'TAR' });
  const rearZ = P.twin ? hw - 330 : frontZ;
  tar.part(rwd ? 'Carter de pont' : 'Corps d\'essieu tubulaire', S.cyl(rwd ? 110 : 90, W - 500, 'z'), { pos: [XR, WY, 0], mat: 'acierHR', color: 0x2b2d31 });
  if (rwd) tar.part('Carter de différentiel', S.sphere(300), { pos: [XR, WY, 0], mat: 'fonte', color: 0x2b2d31 });
  for (const sd of SIDES) {
    const lr = tar.group(`Ressort à lames ${sd.m}`, { code: 'TAR' });
    const nL = P.twin ? 3 : 2;
    for (let k = 0; k < nL; k++) lr.part(`Lame ${k + 1}`, S.box(1300 - k * 300, 16, 70), { pos: [XR, WY + 110 - k * 16, sd.s * (hw - 520)], mat: 'acierHR', color: 0x2b2d31 });
    for (const k of [0, 1]) {
      lr.part(`Bride en U ${k + 1}`, S.box(16, 200, 90), { pos: [XR + (k ? 50 : -50), WY + 30, sd.s * (hw - 520)], mat: 'acierHR' });
      lr.part(`Écrou de bride ${k + 1}`, S.nut(14), { pos: [XR + (k ? 50 : -50), WY - 80, sd.s * (hw - 520)], rot: [180, 0, 0], mat: 'acierHR', couple: 180 });
    }
    lr.part('Jumelle de ressort', S.box(40, 120, 70), { pos: [XR - 660, WY + 60, sd.s * (hw - 520)], mat: 'acier' });
    tar.part(`Amortisseur arrière ${sd.m}`, S.rod([XR - 120, WY - 40, sd.s * (hw - 450)], [XR - 250, floorY - 30, sd.s * (hw - 430)], 55), { mat: 'peinture', color: 0x222222 });
    const wl = P.twin ? [['extérieure', 120], ['intérieure', -120]] : [['', 0]];
    for (const [lab, dz] of wl) wheel(tr, `Roue arrière ${sd.f}${lab ? ` ${lab}` : ''}`, sd.s, {
      pos: [XR, WY, sd.s * (rearZ + dz)], tire: P.tire, studs: dz >= 0 ? (rwd ? 6 : 5) : 0, pcd: rwd ? 130 : 118, stud: 14, studL: 30, couple: rwd ? 180 : 160,
      disc: dz <= 0 ? P.disc[1] : null, caliperAngle: 20, code: 'ROU', hub: dz <= 0, hubD: 150, rimMat: 'acier', spokes: 8, spokeW: 30, cap: dz >= 0,
    });
  }
  return v;
}
