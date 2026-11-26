// Catalogue des véhicules : catégories → types → générateur 3D
import { buildCar, CAR_TYPES } from './vehicles/car.js';
import { buildTruck, TRUCK_TYPES } from './vehicles/truck.js';
import { buildMoto, MOTO_TYPES } from './vehicles/moto.js';
import { buildPlane, PLANE_TYPES } from './vehicles/plane.js';
import { buildJet, JET_TYPES } from './vehicles/jet.js';
import { buildHelico, HELI_TYPES } from './vehicles/helico.js';

const from = (types, build) => Object.fromEntries(Object.entries(types).map(([k, t]) => [k, { ...t, build: () => build(k) }]));

export const CATALOG = {
  avion: {
    label: 'Aéronefs', icon: '✈️',
    types: {
      monomoteur: { ...PLANE_TYPES.monomoteur, build: buildPlane },
      ...from(JET_TYPES, buildJet),
      helicoptere: { ...HELI_TYPES.helicoptere, build: buildHelico },
    },
  },
  voiture: { label: 'Voitures', icon: '🚗', types: from(CAR_TYPES, buildCar) },
  camion: { label: 'Camions', icon: '🚚', types: from(TRUCK_TYPES, buildTruck) },
  moto: { label: 'Motos', icon: '🏍️', types: from(MOTO_TYPES, buildMoto) },
};

export const DEFAULT_TYPE = { avion: 'monomoteur', voiture: 'berline', camion: 'tracteur', moto: 'roadster' };
