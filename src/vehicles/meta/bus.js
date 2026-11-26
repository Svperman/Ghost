// Fiches descriptives des types (bus) – chargées au démarrage, sans le générateur 3D
export const BUS_TYPES = {
  urbain: {
    label: 'Bus urbain 12 m', desc: 'Bus urbain standard à plancher bas intégral – 3 portes doubles – moteur arrière diesel 6 cylindres 7,7 L – 100 places',
    L: 12000, W: 2550, H: 3050, WB: 5900, fo: 2700, floor: 340, belt: 1150, winTop: 2620, tire: [275, 70, 22.5], clr: 250,
    doors: [{ x: 4900, w: 1250, name: 'avant' }, { x: 900, w: 1250, name: 'centrale' }, { x: -4100, w: 1250, name: 'arrière' }],
    paint: 0x1f6fd1, stripe: 0xf2f2f2, rows: 'urbain', power: 'diesel',
    makers: ['Mercedes-Benz (Citaro)', 'Iveco Bus (Urbanway)', 'Heuliez (GX 337)', 'MAN (Lion\'s City)', 'Solaris (Urbino 12)', 'Irizar (i3)', 'Volvo (7900)'],
  },
  electrique: {
    label: 'Bus urbain électrique 12 m', desc: 'Bus urbain 100 % électrique – batteries de traction en toiture (400 kWh) – moteur central 250 kW – recharge CCS et pantographe',
    L: 12000, W: 2550, H: 3300, WB: 5900, fo: 2700, floor: 340, belt: 1150, winTop: 2620, tire: [275, 70, 22.5], clr: 250,
    doors: [{ x: 4900, w: 1250, name: 'avant' }, { x: 900, w: 1250, name: 'centrale' }, { x: -4100, w: 1250, name: 'arrière' }],
    paint: 0x2aa86a, stripe: 0xf2f2f2, rows: 'urbain', power: 'ev',
    makers: ['Solaris (Urbino 12 electric)', 'Heuliez (GX 337 Elec)', 'Mercedes-Benz (eCitaro)', 'BYD (eBus 12)', 'Iveco Bus (E-Way)', 'Irizar (ie bus)', 'Volvo (7900 Electric)'],
  },
  autocar: {
    label: 'Autocar de tourisme', desc: 'Autocar grand tourisme 12,2 m – plancher haut – soutes à bagages 11 m³ – 49 places – moteur arrière diesel 6 cylindres 10,7 L',
    L: 12200, W: 2550, H: 3700, WB: 6100, fo: 2700, floor: 1250, belt: 2150, winTop: 3250, tire: [295, 80, 22.5], clr: 300,
    doors: [{ x: 5200, w: 950, name: 'avant' }, { x: -1650, w: 900, name: 'centrale' }],
    paint: 0xf0f0ee, stripe: 0x9b1c2c, rows: 'coach', power: 'diesel', coach: true,
    makers: ['Setra (S 515 HD)', 'Mercedes-Benz (Tourismo)', 'Iveco Bus (Evadys)', 'Irizar (i6)', 'Van Hool (TX)', 'Scania (Touring)', 'MAN (Lion\'s Coach)', 'Volvo (9700)'],
  },
  minibus: {
    label: 'Minibus / transport scolaire', desc: 'Minibus 8,5 m – 33 places assises – plancher surbaissé à l\'avant – moteur avant diesel 4 cylindres 5,1 L',
    L: 8500, W: 2400, H: 3000, WB: 4300, fo: 1900, floor: 650, belt: 1450, winTop: 2550, tire: [245, 70, 19.5], clr: 230,
    doors: [{ x: 3550, w: 1000, name: 'avant' }, { x: -800, w: 1000, name: 'centrale' }],
    paint: 0xf4c20d, stripe: 0x111111, rows: 'coach', power: 'diesel', frontEngine: true,
    makers: ['Iveco Bus (Daily Line / Crossway Pop)', 'Mercedes-Benz (Sprinter City)', 'Isuzu (Novo)', 'Otokar (Navigo)', 'Temsa (MD9)', 'Karsan (Atak)'],
  },
};
