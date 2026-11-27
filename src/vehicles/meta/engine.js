// Fiches descriptives des moteurs détaillés – chargées au démarrage, sans le générateur 3D
// Cotes en mm. layout : 'I' en ligne, 'V' en V, 'B' à plat (boxer)
export const ENGINE_TYPES = {
  essence4: {
    label: '4 cylindres essence 1,6 L turbo', desc: '4 cylindres en ligne – 16 soupapes – double arbre à cames en tête – injection directe – turbocompresseur – 1 598 cm³ – 133 kW',
    layout: 'I', n: 4, bore: 77, stroke: 85.8, rodL: 138.5, pitch: 84, valves: 4, diesel: false, turbo: true, block: 'aluminium', firing: '1-3-4-2',
    makers: ['Stellantis (PureTech / THP)', 'Renault (TCe)', 'Volkswagen (EA211 TSI)', 'Ford (EcoBoost)', 'BMW (B38/B48)', 'Toyota (Dynamic Force)', 'Hyundai (Smartstream)'],
  },
  diesel6: {
    label: '6 cylindres diesel 12,8 L (poids lourd)', desc: '6 cylindres en ligne – 24 soupapes – arbre à cames en tête – injection directe à rampe commune 2 500 bar – turbocompresseur – 12 777 cm³ – 375 kW',
    layout: 'I', n: 6, bore: 131, stroke: 158, rodL: 255, pitch: 158, valves: 4, diesel: true, turbo: true, block: 'fonte', firing: '1-5-3-6-2-4',
    makers: ['Renault Trucks / Volvo (D13)', 'Scania (DC13)', 'Mercedes-Benz (OM 471)', 'DAF / PACCAR (MX-13)', 'MAN (D26)', 'Cummins (X12 / X15)', 'Iveco FPT (Cursor 13)'],
  },
  v8: {
    label: 'V8 5,0 L essence', desc: 'V8 à 90° – vilebrequin croisé (crossplane) – 32 soupapes – 4 arbres à cames en tête – 4 951 cm³ – 336 kW',
    layout: 'V', angle: 90, n: 8, bore: 92.2, stroke: 92.7, rodL: 150.7, pitch: 100, valves: 4, diesel: false, turbo: false, block: 'aluminium', firing: '1-5-4-8-6-3-7-2',
    makers: ['Ford (Coyote 5.0)', 'General Motors (Small Block)', 'Stellantis (HEMI)', 'Mercedes-AMG (M177 biturbo)', 'BMW (S63)', 'Toyota / Lexus (2UR)', 'Ferrari (F154)'],
  },
  boxer4: {
    label: '4 cylindres à plat 2,0 L (boxer)', desc: '4 cylindres opposés à plat – 16 soupapes – double arbre à cames en tête par rangée – 1 995 cm³ – 110 kW',
    layout: 'B', n: 4, bore: 84, stroke: 90, rodL: 130, pitch: 112, valves: 4, diesel: false, turbo: false, block: 'aluminium', firing: '1-3-2-4',
    makers: ['Subaru (FB20 / FA20)', 'Porsche (flat-4 / flat-6 9A1)', 'Toyota (GR86 – moteur Subaru)', 'BMW Motorrad (flat-twin, 2 cylindres)', 'Lycoming / Continental (aviation)'],
  },
  monocylindre: {
    label: 'Monocylindre 125 cm³ (moto, scooter)', desc: 'Monocylindre 4 temps – 4 soupapes – refroidissement liquide – 124 cm³ – 11 kW',
    layout: 'I', n: 1, bore: 52, stroke: 58.6, rodL: 102, pitch: 70, valves: 4, diesel: false, turbo: false, block: 'aluminium', firing: '1',
    makers: ['Honda (PCX / CB125)', 'Yamaha (MT-125)', 'KTM (125 Duke)', 'Piaggio (Vespa)', 'Royal Enfield (350 – monocylindre)', 'Rotax (moteurs ULM)'],
  },
  bicylindreV: {
    label: 'Bicylindre en V à 45° 1 250 cm³ (moto)', desc: 'Bicylindre en V à 45° – refroidissement liquide – 8 soupapes – 1 252 cm³ – 112 kW',
    layout: 'V', angle: 45, n: 2, bore: 105, stroke: 72.3, rodL: 140, pitch: 110, valves: 4, diesel: false, turbo: false, block: 'aluminium', firing: '1-2',
    makers: ['Harley-Davidson (Revolution Max)', 'Ducati (V2 à 90°)', 'Indian (PowerPlus)', 'Aprilia (V4 / V2)', 'Moto Guzzi (V transversal à 90°)', 'Suzuki (SV650)'],
  },
  moto4: {
    label: '4 cylindres en ligne 1 000 cm³ (moto sportive)', desc: '4 cylindres super-carrés – 16 soupapes – régime maximal 14 500 tr/min – 999 cm³ – 152 kW',
    layout: 'I', n: 4, bore: 76, stroke: 55, rodL: 105, pitch: 82, valves: 4, diesel: false, turbo: false, block: 'aluminium', firing: '1-2-4-3',
    makers: ['Yamaha (YZF-R1 – vilebrequin « crossplane »)', 'Honda (CBR1000RR-R)', 'Kawasaki (ZX-10R)', 'BMW (S 1000 RR)', 'Suzuki (GSX-R1000)'],
  },
  troiscyl: {
    label: '3 cylindres 1,0 L turbo (citadine)', desc: '3 cylindres en ligne – 12 soupapes – injection directe – turbocompresseur – 999 cm³ – 74 kW',
    layout: 'I', n: 3, bore: 71.9, stroke: 82, rodL: 130, pitch: 80, valves: 4, diesel: false, turbo: true, block: 'aluminium', firing: '1-2-3',
    makers: ['Ford (1.0 EcoBoost)', 'Stellantis (1.2 PureTech)', 'Renault (TCe 90)', 'Volkswagen (1.0 TSI)', 'Toyota (GR Yaris 1.6 – 3 cylindres)', 'BMW / Mini (B38)'],
  },
  cinqcyl: {
    label: '5 cylindres en ligne 2,5 L turbo (rare)', desc: '5 cylindres en ligne – 20 soupapes – turbocompresseur – 2 480 cm³ – 294 kW – sonorité caractéristique (allumage tous les 144°)',
    layout: 'I', n: 5, bore: 82.5, stroke: 92.8, rodL: 144, pitch: 88, valves: 4, diesel: false, turbo: true, block: 'aluminium', firing: '1-2-4-5-3',
    makers: ['Audi (2.5 TFSI – RS3, TT RS)', 'Volvo (5 cylindres historiques)', 'Ford (Focus RS mk2)', 'Mercedes-Benz (OM617 diesel, historique)', 'Fiat / Lancia (historiques)'],
  },
  v6: {
    label: 'V6 3,0 L biturbo à 60°', desc: 'V6 à 60° – 24 soupapes – deux turbocompresseurs – 2 996 cm³ – 331 kW',
    layout: 'V', angle: 60, n: 6, bore: 86, stroke: 86, rodL: 148, pitch: 98, valves: 4, diesel: false, turbo: true, block: 'aluminium', firing: '1-4-2-5-3-6',
    makers: ['Nissan (VR30 – GT-R VR38)', 'Alfa Romeo (Giulia Quadrifoglio)', 'Toyota (V35A)', 'Maserati (Nettuno)', 'Ford (EcoBoost 3.5)', 'Ferrari (296 – V6 à 120°)'],
  },
  v10: {
    label: 'V10 5,2 L atmosphérique (supercar)', desc: 'V10 à 90° – 40 soupapes – régime maximal 8 700 tr/min – 5 204 cm³ – 470 kW',
    layout: 'V', angle: 90, n: 10, bore: 84.5, stroke: 92.8, rodL: 154, pitch: 92, valves: 4, diesel: false, turbo: false, block: 'aluminium', firing: '1-6-5-10-2-7-3-8-4-9',
    makers: ['Lamborghini (Huracán)', 'Audi (R8)', 'Lexus (LFA – 4,8 L)', 'Dodge (Viper – 8,4 L, historique)', 'BMW (S85 – M5 E60, historique)'],
  },
  v12: {
    label: 'V12 6,5 L atmosphérique (rare)', desc: 'V12 à 65° – 48 soupapes – régime maximal 9 500 tr/min – 6 496 cm³ – 610 kW',
    layout: 'V', angle: 65, n: 12, bore: 94, stroke: 78, rodL: 150, pitch: 104, valves: 4, diesel: false, turbo: false, block: 'aluminium', firing: '1-7-4-10-2-8-6-12-3-9-5-11',
    makers: ['Ferrari (812 / 12Cilindri)', 'Lamborghini (Aventador / Revuelto)', 'Aston Martin (V12)', 'Rolls-Royce (6,75 L biturbo)', 'Gordon Murray (T.50 – Cosworth)', 'Pagani (AMG)'],
  },
  flat6: {
    label: 'Flat-6 4,0 L atmosphérique (moteur arrière)', desc: '6 cylindres à plat opposés – 24 soupapes – régime maximal 9 000 tr/min – 3 996 cm³ – 375 kW',
    layout: 'B', n: 6, bore: 102, stroke: 81.5, rodL: 128, pitch: 118, valves: 4, diesel: false, turbo: false, block: 'aluminium', firing: '1-6-2-4-3-5',
    makers: ['Porsche (911 GT3 – 9A2)', 'Subaru (EZ36 – historique)', 'Chevrolet (Corvair – historique)', 'Lycoming / Continental (aviation générale)'],
  },
  w16: {
    label: 'W16 8,0 L quadriturbo (hypercar, très rare)', desc: 'W16 : deux V8 étroits accolés à 90° – 64 soupapes – 4 turbocompresseurs – 7 993 cm³ – 1 200 kW',
    layout: 'W', angle: 90, vr: 15, n: 16, bore: 86, stroke: 86, rodL: 140, pitch: 104, valves: 4, diesel: false, turbo: true, block: 'aluminium', firing: '1-14-9-4-7-12-15-6-13-8-3-16-11-2-5-10',
    makers: ['Bugatti (Veyron, Chiron)', 'Volkswagen (W12 – Bentley, Audi A8, plus répandu)', 'Bugatti (Tourbillon 2026 : V16 hybride)'],
  },
  etoile9: {
    label: 'Moteur en étoile 9 cylindres (aviation historique, rare)', desc: 'Moteur radial 9 cylindres refroidi par air – bielle maîtresse et biellettes articulées – 29,98 L – 895 kW',
    layout: 'R', n: 9, bore: 155.6, stroke: 174.6, rodL: 290, pitch: 210, valves: 4, diesel: false, turbo: false, air: true, block: 'aluminium', firing: '1-3-5-7-9-2-4-6-8',
    makers: ['Wright (R-1820 Cyclone)', 'Pratt & Whitney (R-1340 Wasp, R-2800)', 'Gnome-Rhône (14K)', 'Shvetsov (ASh-62)', 'Rotec / Verner (étoiles modernes pour ULM)'],
  },
  wankel: {
    label: 'Moteur rotatif Wankel birotor (rare)', kind: 'wankel', desc: 'Moteur à piston rotatif – 2 rotors triangulaires dans des stators trochoïdaux – 2 × 654 cm³ – 170 kW à 8 200 tr/min',
    R: 105, e: 15, b: 80,
    makers: ['Mazda (13B / 16X, RX-7, RX-8, MX-30 R-EV prolongateur)', 'NSU (Ro 80, historique)', 'Norton (motos, historique)', 'Austro Engine / AIE (drones, ULM)'],
  },
  electrique: {
    label: 'Moteur électrique synchrone 250 kW (le plus récent)', kind: 'electrique', desc: 'Moteur synchrone à aimants permanents – bobinage en épingles (hairpin) – onduleur carbure de silicium 800 V – réducteur 1 rapport et différentiel intégrés',
    makers: ['Tesla (moteurs à aimants et à induction)', 'Renault / Valeo (rotor bobiné sans terres rares)', 'BYD (8-en-1)', 'Hyundai (E-GMP)', 'Porsche (Taycan – 800 V)', 'Lucid (Air)', 'Stellantis / Nidec (Emotors)'],
  },

};
