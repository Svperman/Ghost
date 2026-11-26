// Fiches descriptives des types (moto) – chargées au démarrage, sans le générateur 3D
export const MOTO_TYPES = {
  roadster: {
    label: 'Roadster', desc: 'Roadster bicylindre en ligne 890 cm³ – cadre treillis – 190 kg tous pleins faits',
    rake: 24, lift: 0, swing: 560, front: [120, 70, 17], rear: [180, 55, 17], paint: 0xd23b1e, engine: 'twin', hw: 380, hy: 70,
    makers: ['Yamaha (MT-09)', 'Kawasaki (Z900)', 'Triumph (Street Triple)', 'KTM (890 Duke)', 'Honda (CB750 Hornet)', 'Ducati (Monster)', 'BMW (F 900 R)'],
  },
  sportive: {
    label: 'Sportive carénée', desc: 'Hypersport 4 cylindres en ligne 998 cm³ – carénage intégral – 200 kg',
    rake: 23.5, lift: 40, swing: 580, front: [120, 70, 17], rear: [190, 55, 17], paint: 0x1f4fbf, engine: 'i4', fairing: true, hw: 330, hy: -15,
    makers: ['Yamaha (YZF-R1)', 'Honda (CBR1000RR-R)', 'Kawasaki (ZX-10R)', 'Suzuki (GSX-R1000)', 'BMW (S 1000 RR)', 'Ducati (Panigale – V4)', 'Aprilia (RSV4 – V4)'],
  },
  trail: {
    label: 'Trail / aventure', desc: 'Trail bicylindre 890 cm³ – roues à rayons 21"/18" – grand débattement',
    rake: 27, lift: 130, swing: 600, front: [90, 90, 21], rear: [150, 70, 18], paint: 0xf0f0ee, engine: 'twin', adv: true, wire: true, hw: 430, hy: 130,
    makers: ['BMW (R 1300 GS – flat twin)', 'KTM (890 Adventure)', 'Honda (Africa Twin)', 'Yamaha (Ténéré 700)', 'Triumph (Tiger 900)', 'Ducati (DesertX)', 'Suzuki (V-Strom)'],
  },
  custom: {
    label: 'Custom / cruiser', desc: 'Cruiser bicylindre en V à 45° 1 250 cm³ – selle basse – transmission par courroie',
    rake: 32, lift: -70, swing: 620, front: [130, 90, 16], rear: [180, 65, 16], paint: 0x101113, engine: 'vtwin', custom: true, hw: 440, hy: 190,
    makers: ['Harley-Davidson (Softail / Sportster)', 'Indian (Scout / Chief)', 'Triumph (Bonneville Bobber – twin en ligne)', 'Honda (Rebel)', 'Kawasaki (Vulcan)', 'Yamaha (XV / Bolt)', 'Moto Guzzi (California – V transversal)'],
  },
};
