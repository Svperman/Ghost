// Fiches descriptives des types (truck) – chargées au démarrage, sans le générateur 3D
export const TRUCK_TYPES = {
  tracteur: {
    label: 'Tracteur routier 4×2', desc: 'Tracteur de semi-remorque – PTRA 44 t – cabine couchette',
    cab: 'couchette', color: 0xe8e8e6, fronts: [1500], rears: [{ x: -2300, driven: true }], rearEnd: -3050, body: 'sellette', tankX: -250, sideX: -1050,
    makers: ['Renault Trucks (T)', 'Volvo (FH)', 'Scania (série R / S)', 'Mercedes-Benz (Actros)', 'DAF (XF)', 'MAN (TGX)', 'Iveco (S-Way)'],
  },
  tracteur62: {
    label: 'Tracteur 6×2 essieu relevable', desc: 'Tracteur 6×2 avec essieu poussé relevable – PTRA 44 t',
    cab: 'couchette', color: 0x1d3f7a, fronts: [1500], rears: [{ x: -2000, driven: true }, { x: -3350, driven: false, single: true, lift: true }], rearEnd: -4000, body: 'sellette', tankX: -250, sideX: -850,
    makers: ['Volvo (FH 6×2)', 'Scania (R 6×2)', 'DAF (XF FTG)', 'MAN (TGX 6×2)', 'Mercedes-Benz (Actros L 6×2)'],
  },
  benne: {
    label: 'Porteur benne 8×4 (chantier)', desc: 'Porteur 4 essieux 32 t – benne acier 16 m³ – cabine courte',
    cab: 'jour', color: 0xf2a400, fronts: [1500, -400], rears: [{ x: -3300, driven: true }, { x: -4650, driven: true }], rearEnd: -5500, body: 'benne', tankX: -1500, sideX: -2250, tankL: 900,
    makers: ['Volvo (FMX)', 'Scania (XT)', 'Mercedes-Benz (Arocs)', 'Renault Trucks (C)', 'MAN (TGS)', 'Iveco (X-Way)'],
  },
  fourgon: {
    label: 'Porteur fourgon 4×2 (livraison)', desc: 'Porteur 19 t – caisse fourgon 7,5 m avec hayon élévateur',
    cab: 'jour', color: 0xc0262d, fronts: [1500], rears: [{ x: -3400, driven: true }], rearEnd: -6000, body: 'caisse', tankX: -700, sideX: -1800, tankL: 1100,
    makers: ['Renault Trucks (D)', 'Mercedes-Benz (Atego)', 'DAF (LF / CF)', 'MAN (TGL / TGM)', 'Volvo (FL)', 'Iveco (Eurocargo)', 'Isuzu (série F)'],
  },
};
