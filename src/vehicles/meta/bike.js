// Fiches descriptives des types (bike) – chargées au démarrage, sans le générateur 3D
export const BIKE_TYPES = {
  ville: {
    label: 'Vélo de ville', desc: 'Vélo urbain cadre col-de-cygne aluminium – moyeu à vitesses intégrées 7 rapports – roues 700×40C – éclairage dynamo',
    tire: 40, cs: 460, bbDrop: 65, stack: 640, reach: 360, head: 70, seat: 71, seatL: 520, low: true, stem: 60, rise: 120, frame: 0x2f6f6a,
    brakes: 'patins', fork: 'rigide', city: true, rings: [38], cogs: [20],
    makers: ['Gazelle (Esprit)', 'Batavus (Mambo)', 'Peugeot Cycles (LC01)', 'Decathlon Elops (520)', 'Arcade (Wayne)', 'Raleigh (Pioneer)', 'Cube (Ella)'],
  },
  vtt: {
    label: 'VTT tout suspendu', desc: 'VTT trail 29" tout suspendu 140/130 mm – cadre aluminium – mono-plateau 12 vitesses – freins à disque hydrauliques 4 pistons',
    tire: 60, cs: 435, bbDrop: 30, stack: 625, reach: 470, head: 65.5, seat: 76, seatL: 440, stem: 45, rise: 30, frame: 0xd2551f,
    brakes: 'disque', disc: [203, 180], fork: 'suspendue', fs: true, rings: [32], cogs: [10, 12, 14, 16, 18, 21, 24, 28, 33, 39, 45, 51], flat: true,
    makers: ['Specialized (Stumpjumper)', 'Trek (Fuel EX)', 'Canyon (Spectral)', 'Scott (Genius)', 'Giant (Trance)', 'Decathlon Rockrider (AM)', 'Santa Cruz (Hightower)', 'Commençal (Meta)'],
  },
  route: {
    label: 'Vélo de route', desc: 'Vélo de route endurance – cadre carbone – double plateau 2 × 12 vitesses électronique – freins à disque – roues 700×28C',
    tire: 28, cs: 410, bbDrop: 72, stack: 575, reach: 385, head: 72.5, seat: 73.5, seatL: 540, stem: 100, rise: -10, frame: 0x1b1d22,
    brakes: 'disque', disc: [160, 160], fork: 'carbone', rings: [50, 34], cogs: [11, 12, 13, 14, 15, 17, 19, 21, 24, 27, 30, 34], drop: true, carbon: true,
    makers: ['Specialized (Roubaix / Tarmac)', 'Trek (Domane)', 'Canyon (Endurace)', 'Giant (Defy)', 'Cannondale (Synapse)', 'Decathlon Van Rysel (EDR)', 'Look (765)', 'Pinarello (X)'],
  },
  vae: {
    label: 'Vélo à assistance électrique (VAE)', desc: 'VAE trekking – moteur central 250 W / 85 N·m – batterie intégrée 625 Wh – 25 km/h – dérailleur 10 vitesses – roues 700×50C',
    tire: 50, cs: 470, bbDrop: 60, stack: 640, reach: 400, head: 70, seat: 73, seatL: 500, stem: 70, rise: 60, frame: 0x6b6f75,
    brakes: 'disque', disc: [180, 180], fork: 'suspendue', city: true, ebike: true, rings: [42], cogs: [11, 13, 15, 17, 19, 21, 24, 28, 32, 36], flat: true,
    makers: ['Bosch (moteur Performance Line)', 'Shimano (EP8)', 'Gazelle (Ultimate)', 'Riese & Müller (Charger)', 'Cube (Kathmandu Hybrid)', 'Moustache (Samedi)', 'Decathlon Riverside (920 E)'],
  },
};
