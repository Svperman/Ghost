// Fiches descriptives des fusées – chargées au démarrage, sans le générateur 3D
export const ROCKET_TYPES = {
  lanceur: {
    label: 'Lanceur lourd cryogénique + 2 boosters', desc: 'Lanceur à 2 étages – premier étage hydrogène / oxygène liquides – 2 propulseurs d\'appoint à poudre – hauteur ≈ 62 m – Ø 5,4 m – 10 t en orbite de transfert géostationnaire',
    D: 5400, s1H: 30000, s1Fuel: 'H2', s1Eng: 1, nozD: 2100, engL: 3700, boosters: 2, bD: 3000, bH: 13500, interH: 3000, s2H: 11600, s2Fuel: 'H2', vacD: 2150, fairH: 20000, fairD: 5400,
    legs: false, grid: false, paint: 0xf1f1ee, accent: 0x1c4f9c,
    makers: ['ArianeGroup (Ariane 6)', 'ULA (Vulcan Centaur)', 'JAXA / Mitsubishi (H3)', 'ISRO (LVM3)', 'CASC (Longue Marche 5)'],
  },
  reutilisable: {
    label: 'Lanceur réutilisable 9 moteurs', desc: 'Lanceur à 2 étages kérosène / oxygène liquide – premier étage récupérable (jambes d\'atterrissage, grilles de pilotage) – hauteur ≈ 70 m – Ø 3,66 m',
    D: 3660, s1H: 41000, s1Fuel: 'RP1', s1Eng: 9, nozD: 920, engL: 2900, boosters: 0, interH: 6500, s2H: 13800, s2Fuel: 'RP1', vacD: 3200, fairH: 13100, fairD: 5200,
    legs: true, grid: true, paint: 0xf4f4f2, accent: 0x222428,
    makers: ['SpaceX (Falcon 9)', 'Rocket Lab (Neutron)', 'Blue Origin (New Glenn)', 'Relativity Space (Terran R)', 'LandSpace (Zhuque-3)'],
  },
  moteur: {
    label: 'Moteur-fusée cryogénique (détaillé)', desc: 'Moteur à cycle générateur de gaz hydrogène / oxygène liquides – poussée 1 350 kN dans le vide – chambre 115 bar – tuyère refroidie par régénération',
    makers: ['ArianeGroup (Vulcain 2.1)', 'Aerojet Rocketdyne (RS-25 / RS-68)', 'Mitsubishi (LE-9)', 'SpaceX (Merlin, Raptor – méthane)', 'NPO Energomash (RD-180)'],
  },
};
