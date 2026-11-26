// Catalogue des véhicules : catégories → types → générateur 3D
import { buildCar, CAR_TYPES } from './vehicles/car.js';
import { buildTruck, TRUCK_TYPES } from './vehicles/truck.js';
import { buildMoto, MOTO_TYPES } from './vehicles/moto.js';
import { buildPlane, PLANE_TYPES } from './vehicles/plane.js';
import { buildJet, JET_TYPES } from './vehicles/jet.js';
import { buildHelico, HELI_TYPES } from './vehicles/helico.js';
import { buildBus, BUS_TYPES } from './vehicles/bus.js';
import { buildVan, VAN_TYPES } from './vehicles/van.js';
import { buildTractor, TRACTOR_TYPES } from './vehicles/tractor.js';
import { buildLight, LIGHT_TYPES } from './vehicles/light.js';
import { buildBike, BIKE_TYPES } from './vehicles/bike.js';
import { buildBoat, BOAT_TYPES } from './vehicles/boat.js';
import { buildTrain, TRAIN_TYPES } from './vehicles/train.js';

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
  utilitaire: { label: 'Utilitaires', icon: '🚐', types: from(VAN_TYPES, buildVan) },
  camion: { label: 'Camions', icon: '🚚', types: from(TRUCK_TYPES, buildTruck) },
  bus: { label: 'Bus & cars', icon: '🚌', types: from(BUS_TYPES, buildBus) },
  agricole: { label: 'Agricole', icon: '🚜', types: from(TRACTOR_TYPES, buildTractor) },
  moto: { label: 'Motos & quads', icon: '🏍️', types: { ...from(MOTO_TYPES, buildMoto), ...from(LIGHT_TYPES, buildLight) } },
  velo: { label: 'Vélos', icon: '🚲', types: from(BIKE_TYPES, buildBike) },
  bateau: { label: 'Bateaux', icon: '⛵', types: from(BOAT_TYPES, buildBoat) },
  train: { label: 'Ferroviaire', icon: '🚆', types: from(TRAIN_TYPES, buildTrain) },
  // Modèles .glb importés par l'utilisateur (remplis à l'exécution)
  import: { label: 'Importés', icon: '📦', types: {}, hidden: true },
};

export const DEFAULT_TYPE = {
  avion: 'monomoteur', voiture: 'berline', utilitaire: 'fourgon', camion: 'tracteur', bus: 'urbain',
  agricole: 'standard', moto: 'roadster', velo: 'ville', bateau: 'voilier', train: 'locomotive',
};
