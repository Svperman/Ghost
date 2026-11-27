// Catalogue des véhicules : catégories → types → générateur 3D.
// Les fiches (libellés, constructeurs…) sont chargées tout de suite ; le code 3D de chaque famille
// n'est téléchargé que lorsqu'un de ses véhicules est affiché (import dynamique = fichier séparé).
import { CAR_TYPES } from './vehicles/meta/car.js';
import { TRUCK_TYPES } from './vehicles/meta/truck.js';
import { MOTO_TYPES } from './vehicles/meta/moto.js';
import { PLANE_TYPES } from './vehicles/meta/plane.js';
import { JET_TYPES } from './vehicles/meta/jet.js';
import { HELI_TYPES } from './vehicles/meta/helico.js';
import { BUS_TYPES } from './vehicles/meta/bus.js';
import { VAN_TYPES } from './vehicles/meta/van.js';
import { TRACTOR_TYPES } from './vehicles/meta/tractor.js';
import { LIGHT_TYPES } from './vehicles/meta/light.js';
import { BIKE_TYPES } from './vehicles/meta/bike.js';
import { BOAT_TYPES } from './vehicles/meta/boat.js';
import { TRAIN_TYPES } from './vehicles/meta/train.js';
import { ENGINE_TYPES } from './vehicles/meta/engine.js';
import { ROCKET_TYPES } from './vehicles/meta/rocket.js';

/** Associe chaque type à un générateur chargé à la demande (build renvoie une promesse) */
const lazy = (types, load, fn, keys = Object.keys(types)) =>
  Object.fromEntries(keys.map((k) => [k, { ...types[k], build: async () => (await load())[fn](k) }]));

const car = () => import('./vehicles/car.js');
const truck = () => import('./vehicles/truck.js');
const moto = () => import('./vehicles/moto.js');
const plane = () => import('./vehicles/plane.js');
const jet = () => import('./vehicles/jet.js');
const helico = () => import('./vehicles/helico.js');
const bus = () => import('./vehicles/bus.js');
const van = () => import('./vehicles/van.js');
const tractor = () => import('./vehicles/tractor.js');
const light = () => import('./vehicles/light.js');
const bike = () => import('./vehicles/bike.js');
const boat = () => import('./vehicles/boat.js');
const train = () => import('./vehicles/train.js');
const engine = () => import('./vehicles/engine.js');
const rocket = () => import('./vehicles/rocket.js');

export const CATALOG = {
  avion: {
    label: 'Aéronefs', icon: '✈️',
    types: {
      monomoteur: { ...PLANE_TYPES.monomoteur, build: async () => (await plane()).buildPlane() },
      ...lazy(JET_TYPES, jet, 'buildJet'),
      helicoptere: { ...HELI_TYPES.helicoptere, build: async () => (await helico()).buildHelico() },
    },
  },
  voiture: { label: 'Voitures', icon: '🚗', types: lazy(CAR_TYPES, car, 'buildCar') },
  utilitaire: { label: 'Utilitaires', icon: '🚐', types: lazy(VAN_TYPES, van, 'buildVan') },
  camion: { label: 'Camions', icon: '🚚', types: lazy(TRUCK_TYPES, truck, 'buildTruck') },
  bus: { label: 'Bus & cars', icon: '🚌', types: lazy(BUS_TYPES, bus, 'buildBus') },
  agricole: { label: 'Agricole', icon: '🚜', types: lazy(TRACTOR_TYPES, tractor, 'buildTractor') },
  moto: { label: 'Motos & quads', icon: '🏍️', types: { ...lazy(MOTO_TYPES, moto, 'buildMoto'), ...lazy(LIGHT_TYPES, light, 'buildLight') } },
  velo: { label: 'Vélos', icon: '🚲', types: lazy(BIKE_TYPES, bike, 'buildBike') },
  bateau: { label: 'Bateaux', icon: '⛵', types: lazy(BOAT_TYPES, boat, 'buildBoat') },
  train: { label: 'Ferroviaire', icon: '🚆', types: lazy(TRAIN_TYPES, train, 'buildTrain') },
  espace: {
    label: 'Espace', icon: '🚀', types: lazy(ROCKET_TYPES, rocket, 'buildRocket'),
    layerLabels: ['Coiffe, revêtements & jupes', 'Charge utile & avionique', 'Moteurs, conduites & pressurisation', 'Jambes & grilles de pilotage', 'Structure & réservoirs'],
    peelSteps: ['Tout afficher', 'Sans coiffe ni revêtement', 'Sans charge utile', 'Sans moteurs', 'Structure seule'],
  },
  moteur: {
    label: 'Moteurs', icon: '⚙️', types: lazy(ENGINE_TYPES, engine, 'buildEngine'),
    layerLabels: ['Carters & capots', 'Périphériques (admission, échappement, accessoires)', 'Culasse & distribution', 'Équipage mobile (pistons, bielles, vilebrequin)', 'Bloc & culasse (structure)'],
    peelSteps: ['Tout afficher', 'Sans carters', 'Sans périphériques', 'Sans distribution', 'Bloc seul'],
  },
  // Modèles .glb importés par l'utilisateur (remplis à l'exécution)
  import: { label: 'Importés', icon: '📦', types: {}, hidden: true },
};

export const DEFAULT_TYPE = {
  avion: 'monomoteur', voiture: 'berline', utilitaire: 'fourgon', camion: 'tracteur', bus: 'urbain',
  agricole: 'standard', moto: 'roadster', velo: 'ville', bateau: 'voilier', train: 'locomotive', moteur: 'essence4', espace: 'lanceur',
};
