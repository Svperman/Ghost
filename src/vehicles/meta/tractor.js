// Fiches descriptives des types (tractor) – chargées au démarrage, sans le générateur 3D
export const TRACTOR_TYPES = {
  standard: {
    label: 'Tracteur standard 4RM', desc: 'Tracteur 4 roues motrices 180 ch – 6 cylindres 6,7 L – transmission à variation continue – relevage arrière 9 t',
    WB: 2850, front: [540, 65, 28], rear: [650, 65, 38], trackF: 1900, trackR: 1900, eng: { n: 6, bore: 104, stroke: 132, pitch: 120 }, kw: 132,
    paint: 0x2f8a3a, cabW: 1550, frontHitch: true, weights: 10,
    makers: ['John Deere (6R)', 'Fendt (700 Vario)', 'Claas (Axion)', 'New Holland (T7)', 'Case IH (Puma)', 'Massey Ferguson (8S)', 'Valtra (T)', 'Deutz-Fahr (6 Series)'],
  },
  vigneron: {
    label: 'Tracteur vigneron / fruitier', desc: 'Tracteur étroit 4RM 100 ch – 4 cylindres 3,4 L – largeur 1,30 m – cabine pressurisée catégorie 4',
    WB: 2100, front: [280, 70, 18], rear: [360, 70, 28], trackF: 1000, trackR: 1000, eng: { n: 4, bore: 99, stroke: 110, pitch: 112 }, kw: 75,
    paint: 0xd23a1e, cabW: 1050, frontHitch: false, weights: 4, narrow: true,
    makers: ['New Holland (T4 F/N/V)', 'Fendt (200 Vario V/F)', 'Claas (Nexos)', 'Massey Ferguson (3 FR)', 'Landini (Rex 4)', 'Kubota (M5001 Narrow)', 'Antonio Carraro (TTR)'],
  },
};
