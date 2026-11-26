// Fiches descriptives des types (light) – chargées au démarrage, sans le générateur 3D
export const LIGHT_TYPES = {
  scooter: {
    label: 'Scooter 125 cm³', desc: 'Scooter à roues de 12" – monocylindre 4 temps 125 cm³ refroidi par liquide – variateur CVT – 130 kg',
    makers: ['Honda (PCX / SH)', 'Yamaha (NMAX)', 'Piaggio (Liberty / Medley)', 'Kymco (Agility)', 'Peugeot (Django)', 'Vespa (Primavera – caisse acier)', 'Sym (Jet)'],
  },
  scooterElec: {
    label: 'Scooter électrique', desc: 'Scooter électrique équivalent 125 – moteur-roue 4 kW – batterie lithium amovible 2,3 kWh – 95 kg',
    elec: true,
    makers: ['Niu (NQi / MQi)', 'Silence (S01)', 'Yamaha (Neo\'s)', 'Piaggio (1)', 'Super Soco (CPx)', 'Horwin (EK3)', 'Vespa (Elettrica)'],
  },
  quad: {
    label: 'Quad utilitaire 4×4', desc: 'Quad / VTT 4 roues motrices – monocylindre 4 temps 500 cm³ – transmission par arbres – variateur CVT – 300 kg',
    makers: ['Polaris (Sportsman)', 'Can-Am (Outlander)', 'Yamaha (Grizzly / Kodiak)', 'Honda (TRX Foreman)', 'Kawasaki (Brute Force)', 'CFMoto (CForce)', 'Suzuki (KingQuad)'],
  },
};
