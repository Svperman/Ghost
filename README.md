# Ghost – Explorateur 3D de pièces de véhicules

Application web 3D (Three.js + Vite) pour explorer **pièce par pièce** des aéronefs, voitures, camions et motos :
chaque pièce, vis, écrou, rondelle ou rivet est un objet 3D **nommé**, avec ses **cotes en millimètres**,
son matériau, sa norme et son couple de serrage. On peut le sélectionner, le chercher par son nom, le déplacer,
le pivoter, l'isoler, et retirer les couches du véhicule **de l'extérieur jusqu'au châssis**.

## Catalogue (43 types, ≈ 20 000 pièces)

| Catégorie | Types |
|---|---|
| ✈️ Aéronefs | Monomoteur léger à aile haute · Avion de ligne biréacteur · Jet d'affaires · Hélicoptère monoturbine |
| 🚗 Voitures | Citadine · Berline · Break · SUV 4×4 · Monospace 7 places · Coupé sportif · Pick-up double cabine · Électrique |
| 🚐 Utilitaires | Fourgonnette · Fourgon L2H2 · Grand fourgon L4H3 propulsion à roues jumelées |
| 🚚 Camions | Tracteur routier 4×2 · Tracteur 6×2 · Porteur benne 8×4 · Porteur fourgon 4×2 |
| 🚌 Bus & cars | Bus urbain 12 m · Bus urbain électrique · Autocar de tourisme · Minibus / scolaire |
| 🚜 Agricole | Tracteur standard 4RM · Tracteur vigneron / fruitier |
| 🏍️ Motos & quads | Roadster · Sportive carénée · Trail · Custom · Scooter 125 · Scooter électrique · Quad 4×4 |
| 🚲 Vélos | Vélo de ville · VTT tout suspendu · Vélo de route · Vélo à assistance électrique |
| ⛵ Bateaux | Semi-rigide 6,5 m · Voilier de croisière 9,5 m · Vedette à moteur 8 m |
| 🚆 Ferroviaire | Locomotive électrique BB · Voiture voyageurs · Wagon-citerne · Tramway à plancher bas |
| 📦 Importés | Vos propres modèles 3D au format `.glb` (voir ci-dessous) |

Chaque type indique des **constructeurs qui fabriquent ce type de véhicule** (exemples : Renault, Airbus, Volvo, Yamaha…).

> **Important :** les modèles sont des représentations **génériques** construites à partir de cotes typiques
> (visserie aux normes ISO 4017, 4032, 4762, 7089). Ce ne sont pas les plans d'un modèle de marque précis :
> ces plans sont la propriété des constructeurs et ne sont pas publics. Les logos et marques déposées ne sont pas reproduits.

## Fonctionnalités

- **Arborescence** complète (ensembles → sous-ensembles → pièces) avec compteurs et 👁 afficher/masquer
- **Recherche** par nom, référence ou matériau (insensible aux accents) – `Entrée` sélectionne le premier résultat
- **Fiche pièce** : référence, couche, matériau, norme, couple de serrage, cotes nominales, encombrement mesuré, position
- **🧅 Couches** : retirer la carrosserie, puis l'intérieur, la mécanique, les trains roulants → **châssis seul**
- **💥 Vue éclatée** hiérarchique
- **🩻 Rayons X**, **🕸 filaire**, **📏 cotes** d'encombrement, **🏷 étiquettes**, **📐 mesure** point à point en mm
- **Manipulation** : déplacer (G) / pivoter (R) une pièce avec les poignées 3D, remettre en place
- **Export** de la nomenclature en CSV (compatible Excel) et capture PNG
- Lien direct vers un véhicule : `#voiture/suv`, `#avion/ligne`, `#camion/benne`, `#moto/trail`…

### Raccourcis

| Touche | Action |
|---|---|
| Clic / clic répété | Sélectionner / pièce suivante derrière |
| Maj + clic | Sélectionner l'ensemble parent |
| Double-clic, F | Centrer la caméra |
| G / R | Déplacer / pivoter la pièce |
| I / H | Isoler / masquer |
| Page ↓ / Page ↑ | Retirer / remettre une couche |
| E | Vue éclatée |
| X / W / C / L / M | Rayons X / filaire / cotes / étiquettes / mesure |
| / | Aller à la recherche |
| Échap | Désélectionner |

## Importer un modèle 3D réel (.glb)

Bouton **📦 Importer** (ou glisser-déposer le fichier dans la vue). Formats : glTF binaire `.glb`, ou `.gltf` autonome ;
la compression Draco et Meshopt est prise en charge. Le fichier reste dans le navigateur, il n'est envoyé nulle part.

- Chaque maillage du fichier devient une **pièce** sélectionnable ; les nœuds nommés deviennent des **ensembles**.
- Les dimensions affichées sont **mesurées sur le maillage** (encombrement), pas des cotes de plan.
- La **couche** (carrosserie, intérieur, mécanique, roues, châssis) est devinée d'après le nom des pièces et des matériaux.
- Réglages dans la fiche : **↻ Pivoter 90°** (orientation) et **unité** du fichier (mètre par défaut, comme le veut le glTF).

Des modèles gratuits ou payants se trouvent par exemple sur Sketchfab (format « glTF » à l'export) – vérifiez la licence de chaque modèle.

## Lancer le projet

Prérequis : [Node.js](https://nodejs.org) 18 ou plus récent.

```bash
git clone https://github.com/svperman/ghost.git
cd ghost
git checkout claude/lucid-cori-h8ur1d
npm install
npm run dev        # puis ouvrir http://localhost:5173
```

`npm run build` produit une version statique dans `dist/` (hébergeable sur GitHub Pages, Netlify…).

### Dans VS Code

1. **Fichier → Ouvrir le dossier…** et choisir le dossier `ghost` cloné
   (ou depuis VS Code : `Ctrl+Maj+P` → *Git: Clone* → coller l'URL du dépôt).
2. Accepter les extensions recommandées (notification en bas à droite).
3. `Ctrl+Maj+P` → *Tasks: Run Task* → **Ghost : installer les dépendances**.
4. `F5` → **Ghost : ouvrir dans Chrome** (ou Edge) : le serveur démarre et le navigateur s'ouvre.

Les configurations se trouvent dans `.vscode/` (`tasks.json`, `launch.json`, `extensions.json`, `settings.json`).

## Structure

```
src/
  main.js            Vue 3D, sélection, arborescence, couches, éclaté, mesures, export
  catalog.js         Catalogue : catégories → types → générateurs
  style.css          Interface
  core/builder.js    Formes (vis, écrous, rivets, ressorts, profils d'aile…), matériaux, couches, nomenclature
  core/parts.js      Sous-ensembles réutilisables : roues, moteur en ligne, sièges
  vehicles/
    car.js           Voitures (générateur paramétrique, 8 types)
    truck.js         Camions (4 types)
    moto.js          Motos (4 types)
    plane.js         Monomoteur léger
    jet.js           Avion de ligne et jet d'affaires
    helico.js        Hélicoptère
```

## Ajouter un type de véhicule

Les voitures, camions, motos et jets sont **paramétriques** : ajouter une entrée dans `CAR_TYPES`,
`TRUCK_TYPES`, `MOTO_TYPES` ou `JET_TYPES` suffit pour qu'un nouveau type apparaisse dans le menu.
Exemple (voiture) :

```js
// src/vehicles/car.js
cabriolet: {
  label: 'Cabriolet', desc: '…', L: 4100, W: 1750, H: 1250, WB: 2450, fo: 800, track: 1500,
  tire: [215, 45, 17], clear: 130, belt: 860, nose: 650, rear: 'tri', doors: 2, rake: 28,
  paint: 0x8a1f2d, drive: 'RWD', eng: { n: 4, bore: 83.5, stroke: 91, pitch: 90, label: '2,0 L', kw: 135 },
  rows: 1, disc: [[300, 25], [280, 10]], makers: ['Mazda (MX-5)', 'BMW (Z4)'],
},
```

Toutes les cotes sont en millimètres. Repère : X vers l'avant, Y vers le haut, Z vers la droite, origine au sol.
Si vous disposez des cotes réelles d'un modèle précis, il suffit de les saisir dans une nouvelle entrée.
