// Fiches descriptives des types (jet) – chargées au démarrage, sans le générateur 3D
export const JET_TYPES = {
  ligne: {
    label: 'Avion de ligne biréacteur', desc: 'Moyen-courrier monocouloir 150–180 places – 2 turboréacteurs double flux',
    L: 37600, R: 1975, FY: 4000, span: 35800, root: 6500, kink: 6000, kinkChord: 4000, tip: 1500, sweep: 27, dihedral: 5, wingY: -1400, wingX: 2500,
    engines: 'wing', engZ: 5800, nacR: 1050, nacL: 4400, fanBlades: 24, tail: 'conv', rows: 30, seatsPerSide: 3, doors: 4,
    mainGear: { z: 3800, D: 1143, W: 432, rimD: 508, tireRef: '46×17 R20', wheels: 2 }, noseGear: { x: 13500, D: 762, W: 224, rimD: 381, tireRef: '30×8,8 R15' },
    paint: 0xf4f4f2, accent: 0x173f8a,
    makers: ['Airbus (A320neo)', 'Boeing (737 MAX)', 'COMAC (C919)', 'Embraer (E195-E2 – régional)', 'Airbus (A220 – régional)', 'Airbus (A350 / Boeing 787 – gros porteurs)'],
  },
  affaires: {
    label: 'Jet d\'affaires', desc: 'Biréacteur d\'affaires 8–12 passagers – moteurs arrière – empennage en T',
    L: 16000, R: 950, FY: 1750, span: 16200, root: 2800, kink: 1800, kinkChord: 2400, tip: 900, sweep: 28, dihedral: 3, wingY: -650, wingX: 1500,
    engines: 'rear', engZ: 1650, nacR: 520, nacL: 2600, fanBlades: 18, tail: 'T', rows: 4, seatsPerSide: 1, doors: 1,
    mainGear: { z: 1500, D: 560, W: 180, rimD: 300, tireRef: '22×6,75-10', wheels: 1 }, noseGear: { x: 5800, D: 450, W: 150, rimD: 230, tireRef: '18×4,4' },
    paint: 0xf7f7f5, accent: 0x6b6f75,
    makers: ['Dassault Aviation (Falcon)', 'Bombardier (Challenger / Global)', 'Gulfstream (G280 – G700)', 'Embraer (Praetor / Phenom)', 'Cessna (Citation)', 'Honda Aircraft (HondaJet)', 'Pilatus (PC-24)'],
  },
  longcourrier: {
    label: 'Gros porteur long-courrier biréacteur', desc: 'Long-courrier à double couloir 300–350 places – 2 turboréacteurs à très haut taux de dilution – fuselage composite',
    big: true, L: 66800, R: 2980, FY: 5600, span: 64750, root: 11000, kink: 9500, kinkChord: 6800, tip: 2000, sweep: 31.9, dihedral: 6, wingY: -2100, wingX: 5000,
    engines: 'wing', engZ: 10500, nacR: 1700, nacL: 7000, fanBlades: 22, tail: 'conv', rows: 48, seatsPerSide: 3, doors: 4,
    mainGear: { z: 5600, D: 1372, W: 520, rimD: 584, tireRef: '54×21 R23', wheels: 2 }, noseGear: { x: 25500, D: 1092, W: 400, rimD: 457, tireRef: '43×17 R18' },
    paint: 0xf4f4f2, accent: 0x0f3a63,
    makers: ['Airbus (A350-900 / A330neo)', 'Boeing (787-9 / 777X)', 'Boeing (767 – fret)', 'COMAC (C929 – en développement)'],
  },
  quadri: {
    label: 'Très gros porteur quadriréacteur', desc: 'Long-courrier très gros porteur 4 moteurs 450–550 places – deux ponts passagers (A380) ou bosse (747)',
    big: true, L: 72700, R: 3550, FY: 6800, span: 79750, root: 14000, kink: 12500, kinkChord: 9000, tip: 2500, sweep: 33.5, dihedral: 5.6, wingY: -2600, wingX: 6500,
    engines: 'wing', engZ: [14500, 25800], nacR: 1550, nacL: 6600, fanBlades: 24, tail: 'conv', rows: 52, seatsPerSide: 3, doors: 5,
    mainGear: { z: 6200, D: 1400, W: 530, rimD: 584, tireRef: '56×22 R24', wheels: 2 }, noseGear: { x: 27500, D: 1270, W: 455, rimD: 508, tireRef: '50×20 R22' },
    paint: 0xf4f4f2, accent: 0x7a1020,
    makers: ['Airbus (A380 – production arrêtée en 2021)', 'Boeing (747-8 – production arrêtée en 2023)', 'Antonov (An-124 – cargo)', 'Lockheed (C-5 – militaire)'],
  },

};
