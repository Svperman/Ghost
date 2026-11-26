// Fiches descriptives des types (van) – chargées au démarrage, sans le générateur 3D
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
