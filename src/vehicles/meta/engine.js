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
};
