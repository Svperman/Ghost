// Simulation physique d'un choc (modèle 1D à masses et ressorts plastiques) – unités SI (m, kg, s, N)
// Modèle pédagogique inspiré des méthodes de reconstruction d'accidents (raideur d'écrasement « A-B »)
// et des essais normalisés (Euro NCAP, FMVSS 208). Les résultats sont des ordres de grandeur.

export const G = 9.81;

export const SCENARIOS = {
  mur: { label: 'Frontal contre mur rigide (100 %)', side: 'front', obstacle: 'rigide', v: 56, desc: 'Essai de type FMVSS 208 / Euro NCAP plein recouvrement : toute la face avant travaille.' },
  odb: { label: 'Frontal décalé 40 % (barrière déformable)', side: 'front', obstacle: 'barriere', v: 64, desc: 'Seuls 40 % de la largeur (côté conducteur) frappent une barrière en nid d\'abeille : la structure travaille moins, l\'habitacle est plus sollicité.' },
  poteau: { label: 'Frontal contre poteau / arbre Ø 254 mm', side: 'front', obstacle: 'poteau', v: 50, desc: 'L\'effort est concentré sur une bande étroite : pénétration profonde, longerons peu sollicités.' },
  lateral: { label: 'Choc latéral contre poteau (côté conducteur)', side: 'side', obstacle: 'poteau', v: 32, desc: 'Essai de type Euro NCAP poteau à 32 km/h : très peu de matière entre le poteau et l\'occupant.' },
  vehicule: { label: 'Frontal contre un autre véhicule', side: 'front', obstacle: 'vehicule', v: 50, v2: 50, desc: 'Les deux véhicules s\'écrasent ; le plus léger subit la plus forte variation de vitesse (conservation de la quantité de mouvement).' },
  arriere: { label: 'Choc arrière (véhicule testé à l\'arrêt, percuté)', side: 'rear', obstacle: 'vehicule', v: 0, v2: 40, desc: 'Le véhicule testé est poussé vers l\'avant ; l\'occupant est plaqué contre le dossier (risque de « coup du lapin »).' },
};

/** Courbe d'effort d'un élément écrasable : linéaire puis « talonnement » (structure rigide) au-delà de xl */
function spring(k, xl) {
  const Fl = k * xl;
  return {
    F: (x) => (x <= xl ? k * x : Fl + 15 * k * (x - xl)),
    x: (F) => (F <= Fl ? F / k : xl + (F - Fl) / (15 * k)),
  };
}

/**
 * cfg = { scenario, m1, k1 (raideur avant N/m), xl1 (profondeur écrasable m), v1 (km/h),
 *         m2, k2, xl2, v2 (km/h), belt, airbag, dt, T }
 */
export function simulate(cfg) {
  const sc = SCENARIOS[cfg.scenario];
  const dt = cfg.dt || 5e-5, T = cfg.T || 0.22;
  const m1 = cfg.m1;
  let k1 = cfg.k1, xl1 = cfg.xl1;
  if (sc.side === 'side') { k1 *= 0.6; xl1 = cfg.xlSide || 0.45; }
  if (sc.side === 'rear') { k1 *= 0.7; xl1 = cfg.xlRear || 0.8; }
  if (cfg.scenario === 'odb') k1 *= 0.55;
  if (sc.obstacle === 'poteau' && sc.side === 'front') { k1 *= 0.4; xl1 *= 1.4; }
  const s1 = spring(k1, xl1);
  let m2 = Infinity, s2 = null;
  if (sc.obstacle === 'barriere') s2 = spring(3.5e5, 0.54);
  if (sc.obstacle === 'vehicule') { m2 = cfg.m2; s2 = spring(cfg.k2 * (sc.side === 'rear' ? 1 : 1), cfg.xl2); }
  // vitesses le long de l'axe (véhicule 1 → obstacle)
  let w1 = (sc.side === 'rear' ? 0 : cfg.v1) / 3.6;
  let w2 = sc.obstacle === 'vehicule' ? -(cfg.v2 ?? sc.v2) / 3.6 : 0;
  let u1 = 0, u2 = 0;
  const xOf = (F) => s1.x(F) + (s2 ? s2.x(F) : 0);
  let cmax = 0, Fmax = 0;
  // occupant (50e centile, 78 kg) – déplacement relatif d (positif vers le point d'impact)
  const mo = 78;
  let d = 0, dd = 0;
  const out = { t: [], u1: [], u2: [], v1: [], v2: [], a1: [], a2: [], c1: [], c2: [], d: [], ao: [], ah: [], bag: [], F: [] };
  const v10 = w1, v20 = w2;
  let tEnd = T, sep = false, hardAny = false;
  for (let i = 0, t = 0; t <= T; i++, t += dt) {
    const c = u1 - u2;
    let F = 0;
    if (c > 0) {
      if (c >= cmax) {
        // chargement : effort tel que x1(F) + x2(F) = c (dichotomie)
        let lo = 0, hi = 1e9;
        for (let it = 0; it < 40; it++) { const mid = (lo + hi) / 2; if (xOf(mid) < c) lo = mid; else hi = mid; }
        F = (lo + hi) / 2; cmax = c; Fmax = F;
      } else {
        // déchargement : retour élastique de 2 % de l'écrasement maximal (rebond de quelques km/h)
        const cp = cmax * 0.98;
        F = c > cp ? Fmax * (c - cp) / (cmax - cp) : 0;
      }
    }
    const a1 = -F / m1, a2 = Number.isFinite(m2) ? F / m2 : 0;
    // retenue de l'occupant
    let R = 0, hard = false;
    const bagOn = cfg.airbag && t > 0.015;
    const bagFull = cfg.airbag ? Math.min(1, Math.max(0, (t - 0.015) / 0.025)) : 0;
    if (sc.side === 'front') {
      // ceinture à prétensionneur et limiteur d'effort, airbag à évents, puis volant / planche de bord
      if (cfg.belt && d > 0.015) R += Math.min(2.4e5 * (d - 0.015) + 3000 * dd, 17000);
      const b0 = cfg.belt ? 0.12 : 0.2;
      if (bagOn && d > b0) R += Math.min((cfg.belt ? 1.6e5 : 2.2e5) * bagFull * (d - b0) + 2000 * Math.max(dd, 0), cfg.belt ? 16000 : 26000);
      const gap = cfg.belt ? 0.5 : 0.55;
      if (d > gap) { R += 4e5 * (d - gap); hard = true; }
    } else if (sc.side === 'side') {
      const intr = Math.max(0, s1.x(Fmax) * 0.9 - 0.12);
      const gap = Math.max(0.02, 0.17 - intr);
      if (cfg.airbag && bagOn && d > 0.04) R += Math.min(8e4 * bagFull * (d - 0.04), 9000);
      if (d > gap) { R += 6e5 * (d - gap); hard = !cfg.airbag; }
      if (cfg.belt && d > 0.05) R += 2e4 * (d - 0.05);
    } else {
      if (d > 0.01) R += 9e4 * (d - 0.01) + 1200 * dd;
      if (d > 0.12) { R += 4e5 * (d - 0.12); hard = true; }
    }
    // l'occupant suit le véhicule via la retenue ; a_o = a1 + dd' → m_o (a1 + d'') = −R
    const ao = -R / mo;
    const ddd = ao - a1;
    dd += ddd * dt; d += dd * dt;
    if (d < 0 && sc.side !== 'rear') { d = 0; dd = Math.max(0, dd); }
    w1 += a1 * dt; w2 += a2 * dt; u1 += w1 * dt; u2 += w2 * dt;
    if (i % 4 === 0) {
      const chest = Math.abs(ao) / G;
      const head = chest * 1.25 + (hard ? chest * 0.9 : 0);
      out.t.push(t); out.u1.push(u1); out.u2.push(u2); out.v1.push(w1); out.v2.push(w2);
      out.a1.push(-a1 / G); out.a2.push(a2 / G); out.F.push(F);
      out.c1.push(s1.x(F));
      out.c2.push(s2 && Number.isFinite(m2) ? s2.x(F) : 0);
      out.d.push(d); out.ao.push(chest); out.ah.push(head); out.bag.push(bagFull);
    }
    if (!sep && cmax > 0 && F === 0 && t > 0.02) { sep = true; tEnd = t; }
    hardAny = hardAny || hard;
  }
  // déformation résiduelle : après le pic, la tôle ne revient que de 10 %
  const c1max = s1.x(Fmax), c2max = s2 && Number.isFinite(m2) ? s2.x(Fmax) : 0;
  let r1 = 0, r2 = 0;
  for (let i = 0; i < out.t.length; i++) {
    r1 = Math.max(r1, out.c1[i]); out.c1[i] = Math.max(out.c1[i], 0.9 * r1);
    r2 = Math.max(r2, out.c2[i]); out.c2[i] = Math.max(out.c2[i], 0.9 * r2);
  }
  // ------------------------------------------------------------ résultats
  const res = {};
  const dvt = out.t[1] - out.t[0];
  res.dv1 = Math.abs(out.v1[out.v1.length - 1] - v10) * 3.6;
  res.dv2 = Number.isFinite(m2) ? Math.abs(out.v2[out.v2.length - 1] - v20) * 3.6 : 0;
  res.peak1 = Math.max(...out.a1.map(Math.abs));
  res.peak2 = Number.isFinite(m2) ? Math.max(...out.a2.map(Math.abs)) : 0;
  res.duration = tEnd;
  res.mean1 = res.dv1 / 3.6 / Math.max(tEnd, 1e-3) / G;
  res.crush1 = c1max; res.crush2 = c2max;
  const ke0 = 0.5 * m1 * v10 ** 2 + (Number.isFinite(m2) ? 0.5 * m2 * v20 ** 2 : 0);
  const ke1 = 0.5 * m1 * out.v1[out.v1.length - 1] ** 2 + (Number.isFinite(m2) ? 0.5 * m2 * out.v2[out.v2.length - 1] ** 2 : 0);
  res.energy = (ke0 - ke1) / 1000; res.ke0 = ke0 / 1000;
  res.rebound = Math.max(0, -out.v1[out.v1.length - 1] * 3.6);
  // occupant : accélération thoracique sur 3 ms (« 3 ms clip ») et HIC15
  const win3 = Math.max(1, Math.round(0.003 / dvt));
  let clip = 0;
  for (let i = 0; i + win3 < out.ao.length; i++) { let mn = Infinity; for (let j = i; j < i + win3; j++) mn = Math.min(mn, out.ao[j]); clip = Math.max(clip, mn); }
  res.chest3ms = clip;
  res.chestPeak = Math.max(...out.ao);
  const cum = [0];
  for (let i = 0; i < out.ah.length; i++) cum.push(cum[i] + out.ah[i] * dvt);
  const w15 = Math.round(0.015 / dvt);
  let hic = 0;
  for (let i = 0; i < out.ah.length; i++) for (let j = i + 1; j <= Math.min(out.ah.length, i + w15); j++) {
    const T2 = (j - i) * dvt, avg = (cum[j] - cum[i]) / T2;
    hic = Math.max(hic, T2 * avg ** 2.5);
  }
  res.hic = hic;
  res.excursion = Math.max(...out.d);
  res.hardContact = hardAny;
  // Risque de blessure grave à la tête (AIS ≥ 4) – courbe de Prasad & Mertz (1985)
  res.headRisk = hic > 1 ? 1 / (1 + Math.exp(4.9 + 200 / hic - 0.00351 * hic)) : 0;
  res.hicOk = hic < 700; res.chestOk = clip < 60;
  // note indicative sur 5
  const sHead = hic < 250 ? 5 : hic < 500 ? 4 : hic < 700 ? 3 : hic < 1000 ? 2 : hic < 1500 ? 1 : 0;
  const sChest = clip < 30 ? 5 : clip < 40 ? 4 : clip < 50 ? 3 : clip < 60 ? 2 : clip < 75 ? 1 : 0;
  const sCrush = sc.side === 'side' ? (c1max < 0.25 ? 5 : c1max < 0.35 ? 3 : c1max < 0.45 ? 2 : 0) : (c1max < xl1 * 0.85 ? 5 : c1max < xl1 ? 3 : 1);
  res.stars = Math.max(0, Math.min(5, Math.round((sHead + sChest + sCrush) / 3)));
  res.k1 = k1; res.xl1 = xl1;
  return { out, res };
}

/** Paramètres de structure par famille de véhicule (écrasement de référence à 56 km/h) */
export const FAMILY = {
  voiture: { rho: 88, cRef: 0.6, xl: 0.75 },
  utilitaire: { rho: 85, cRef: 0.65, xl: 0.75 },
  camion: { rho: 110, cRef: 0.45, xl: 0.6 },
  bus: { rho: 105, cRef: 0.55, xl: 0.7 },
};
export function vehicleParams(cat, sizeMm) {
  const f = FAMILY[cat] || FAMILY.voiture;
  const vol = (sizeMm.x / 1000) * (sizeMm.y / 1000) * (sizeMm.z / 1000);
  const m = Math.round(Math.max(600, vol * f.rho) / 10) * 10;
  const vr = 56 / 3.6;
  return { m, k: m * vr * vr / (f.cRef * f.cRef), xl: f.xl };
}
