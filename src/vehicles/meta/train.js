// Fiches descriptives des types (train) – chargées au démarrage, sans le générateur 3D
export const TRAIN_TYPES = {
  locomotive: {
    label: 'Locomotive électrique BB', desc: 'Locomotive électrique à 2 bogies de 2 essieux moteurs (BB) – 25 kV 50 Hz / 1,5 kV continu – 6 400 kW – 90 t – 200 km/h',
    L: 19500, W: 3000, H: 4300, bogieC: 10000, axleB: 2900, wheel: 1250, floor: 1300, color: 0xc4262e, loco: true,
    makers: ['Alstom (Prima / Traxx)', 'Siemens Mobility (Vectron)', 'Bombardier – Alstom (Traxx)', 'Stadler (Euro 9000)', 'CAF (Bitrac)', 'Škoda (Emil Zátopek)'],
  },
  voiture: {
    label: 'Voiture voyageurs grandes lignes', desc: 'Voiture à couloir central 26,4 m – 2e classe – 80 places – bogies à suspension pneumatique – 200 km/h',
    L: 26400, W: 2820, H: 4050, bogieC: 19000, axleB: 2500, wheel: 920, floor: 1250, color: 0x3a5a8c, coach: true,
    makers: ['Alstom (Corail / Avelia)', 'Siemens Mobility (Viaggio)', 'CAF', 'Stadler', 'Talgo', 'Škoda'],
  },
  citerne: {
    label: 'Wagon-citerne', desc: 'Wagon-citerne à bogies pour produits pétroliers – 95 m³ – 90 t – soupape et dôme de chargement',
    L: 17000, W: 3000, H: 4200, bogieC: 11500, axleB: 1800, wheel: 920, floor: 1100, color: 0x2b2e33, tank: true,
    makers: ['VTG (exploitant)', 'GATX Rail', 'Ermewa', 'Greenbrier Europe', 'Tatravagónka', 'Wascosa'],
  },
  tram: {
    label: 'Tramway à plancher bas', desc: 'Rame de tramway 5 modules à plancher bas intégral – 32 m – 750 V continu par ligne aérienne – 200 voyageurs – 70 km/h',
    L: 32000, W: 2400, H: 3500, wheel: 600, floor: 350, color: 0xe0e0e0, tramModules: 5,
    makers: ['Alstom (Citadis)', 'Siemens Mobility (Avenio)', 'CAF (Urbos)', 'Stadler (Tramlink)', 'Škoda (ForCity)', 'Hyundai Rotem'],
  },
};
