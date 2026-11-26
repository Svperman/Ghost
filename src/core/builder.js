// Moteur de construction des véhicules.
// Toutes les cotes sont exprimées en MILLIMÈTRES (1 unité de scène = 1 mm).
// Repère : X = vers l'avant, Y = vers le haut, Z = vers la droite.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const DEG = Math.PI / 180;

// ---------------------------------------------------------------------------
// Matériaux
// ---------------------------------------------------------------------------
export const MATERIALS = {
  acier:      { label: 'Acier',                color: 0x8c939b, metalness: 0.8, roughness: 0.35 },
  acierHR:    { label: 'Acier haute résistance (classe 10.9)', color: 0x6f747a, metalness: 0.85, roughness: 0.3 },
  inox:       { label: 'Acier inoxydable',     color: 0xb9bec4, metalness: 0.9, roughness: 0.2 },
  zingue:     { label: 'Acier zingué',         color: 0xa9adb0, metalness: 0.75, roughness: 0.3 },
  fonte:      { label: 'Fonte',                color: 0x55595e, metalness: 0.55, roughness: 0.65 },
  aluminium:  { label: 'Aluminium',            color: 0xc6cbd1, metalness: 0.9, roughness: 0.28 },
  alu2024:    { label: 'Alliage aluminium 2024-T3', color: 0xd5d9de, metalness: 0.85, roughness: 0.3 },
  chrome:     { label: 'Acier chromé',         color: 0xf0f0f0, metalness: 1.0, roughness: 0.07 },
  cuivre:     { label: 'Cuivre',               color: 0xb87333, metalness: 0.9, roughness: 0.3 },
  laiton:     { label: 'Laiton',               color: 0xc9a53c, metalness: 0.9, roughness: 0.3 },
  titane:     { label: 'Titane',               color: 0x9a9ea3, metalness: 0.8, roughness: 0.35 },
  caoutchouc: { label: 'Caoutchouc',           color: 0x1d1d1f, metalness: 0.0, roughness: 0.92 },
  plastique:  { label: 'Polypropylène',        color: 0x2b2e33, metalness: 0.0, roughness: 0.6 },
  abs:        { label: 'ABS',                  color: 0x3a3d42, metalness: 0.0, roughness: 0.5 },
  composite:  { label: 'Composite fibre de verre', color: 0xe9e6dc, metalness: 0.0, roughness: 0.45 },
  carbone:    { label: 'Fibre de carbone',     color: 0x202225, metalness: 0.3, roughness: 0.35 },
  verre:      { label: 'Verre feuilleté',      color: 0x9fc6dd, metalness: 0.1, roughness: 0.05, transparent: true, opacity: 0.32 },
  polycarbonate: { label: 'Polycarbonate',     color: 0xdfe8ee, metalness: 0.1, roughness: 0.05, transparent: true, opacity: 0.45 },
  plexi:      { label: 'Plexiglas (PMMA)',     color: 0xa8d0e6, metalness: 0.1, roughness: 0.05, transparent: true, opacity: 0.3 },
  tissu:      { label: 'Tissu',                color: 0x3b3f46, metalness: 0.0, roughness: 1.0 },
  cuir:       { label: 'Cuir',                 color: 0x4a2e22, metalness: 0.0, roughness: 0.7 },
  mousse:     { label: 'Mousse polyuréthane',  color: 0x2f3237, metalness: 0.0, roughness: 1.0 },
  bois:       { label: 'Bois lamellé',         color: 0x8b5a2b, metalness: 0.0, roughness: 0.6 },
  ceramique:  { label: 'Céramique',            color: 0xf2efe6, metalness: 0.0, roughness: 0.4 },
  feutre:     { label: 'Garniture de friction', color: 0x6b5d50, metalness: 0.1, roughness: 0.9 },
  feuBlanc:   { label: 'Optique (polycarbonate)', color: 0xffffff, metalness: 0.2, roughness: 0.05, emissive: 0xfff6d5, emissiveIntensity: 0.6 },
  feuRouge:   { label: 'Optique rouge (PMMA)', color: 0xc0101a, metalness: 0.1, roughness: 0.1, emissive: 0x900008, emissiveIntensity: 0.6 },
  feuOrange:  { label: 'Optique orange (PMMA)', color: 0xff8a00, metalness: 0.1, roughness: 0.1, emissive: 0xa04500, emissiveIntensity: 0.5 },
  feuVert:    { label: 'Feu de navigation vert', color: 0x18c040, metalness: 0.1, roughness: 0.1, emissive: 0x0a8020, emissiveIntensity: 0.7 },
  peinture:   { label: 'Tôle acier peinte',    color: 0xb3202a, metalness: 0.45, roughness: 0.32 },
  peintureAlu:{ label: 'Aluminium peint',      color: 0xf2f2f2, metalness: 0.35, roughness: 0.35 },
  ecran:      { label: 'Écran / instrument',   color: 0x0d1a24, metalness: 0.2, roughness: 0.2, emissive: 0x0a3550, emissiveIntensity: 0.6 },
  electrolyte:{ label: 'Boîtier batterie (PP)', color: 0x1b1d20, metalness: 0.0, roughness: 0.5 },
};

export function makeMaterial(key, color) {
  const m = MATERIALS[key] || MATERIALS.acier;
  const mat = new THREE.MeshStandardMaterial({
    color: color ?? m.color,
    metalness: m.metalness,
    roughness: m.roughness,
    transparent: !!m.transparent,
    opacity: m.opacity ?? 1,
    emissive: m.emissive ?? 0x000000,
    emissiveIntensity: m.emissiveIntensity ?? 1,
    side: THREE.DoubleSide,
    depthWrite: !m.transparent,
  });
  mat.userData.base = {
    color: mat.color.getHex(), emissive: mat.emissive.getHex(),
    emissiveIntensity: mat.emissiveIntensity, opacity: mat.opacity,
    transparent: mat.transparent, depthWrite: mat.depthWrite,
  };
  return mat;
}

// ---------------------------------------------------------------------------
// Formes géométriques (centrées sur l'origine, cotes en mm)
// ---------------------------------------------------------------------------
function orient(geo, axis) {
  if (axis === 'x') geo.rotateZ(-Math.PI / 2);
  else if (axis === 'z') geo.rotateX(Math.PI / 2);
  return geo;
}

export const S = {
  /** Parallélépipède : l (X) × h (Y) × w (Z) */
  box(l, h, w) {
    return { geo: new THREE.BoxGeometry(l, h, w), dims: { Longueur: l, Hauteur: h, Largeur: w } };
  },
  /** Cylindre plein de diamètre d et longueur L selon l'axe donné */
  cyl(d, L, axis = 'y', seg = 32, dTop) {
    const g = new THREE.CylinderGeometry((dTop ?? d) / 2, d / 2, L, seg);
    const dims = dTop != null && dTop !== d
      ? { 'Diamètre base': d, 'Diamètre sommet': dTop, Longueur: L }
      : { Diamètre: d, Longueur: L };
    return { geo: orient(g, axis), dims };
  },
  /** Tube / bague : diamètre extérieur, intérieur, longueur */
  tube(dOut, dIn, L, axis = 'y', seg = 40) {
    const ro = dOut / 2, ri = dIn / 2, h = L / 2;
    const pts = [[ri, -h], [ro, -h], [ro, h], [ri, h], [ri, -h]].map(([x, y]) => new THREE.Vector2(x, y));
    const g = new THREE.LatheGeometry(pts, seg);
    return { geo: orient(g, axis), dims: { 'Diamètre extérieur': dOut, 'Diamètre intérieur': dIn, Longueur: L, Épaisseur: (dOut - dIn) / 2 } };
  },
  sphere(d, seg = 24) {
    return { geo: new THREE.SphereGeometry(d / 2, seg, Math.max(8, seg / 2)), dims: { Diamètre: d } };
  },
  /** Ellipsoïde : dimensions hors-tout */
  ellipsoid(l, h, w, seg = 28) {
    const g = new THREE.SphereGeometry(0.5, seg, seg / 2);
    g.scale(l, h, w);
    return { geo: g, dims: { Longueur: l, Hauteur: h, Largeur: w } };
  },
  cone(d, L, axis = 'y', seg = 32) {
    return { geo: orient(new THREE.ConeGeometry(d / 2, L, seg), axis), dims: { 'Diamètre base': d, Hauteur: L } };
  },
  /** Tore : diamètre moyen D, diamètre de section d */
  torus(D, d, axis = 'y', seg = 48) {
    const g = new THREE.TorusGeometry(D / 2, d / 2, 12, seg);
    // TorusGeometry a son axe selon Z
    if (axis === 'y') g.rotateX(Math.PI / 2);
    else if (axis === 'x') g.rotateY(Math.PI / 2);
    return { geo: g, dims: { 'Diamètre moyen': D, 'Diamètre de section': d } };
  },
  /** Prisme hexagonal : s = surplat */
  hex(s, h, axis = 'y') {
    const g = new THREE.CylinderGeometry(s / Math.sqrt(3), s / Math.sqrt(3), h, 6);
    return { geo: orient(g, axis), dims: { Surplat: s, Hauteur: h } };
  },
  /** Vis à tête hexagonale ISO 4017 : M{d} × L. La tête est en +axe. */
  bolt(d, L, axis = 'y') {
    const s = isoHexWidth(d), k = Math.round(d * 0.65 * 10) / 10;
    const head = new THREE.CylinderGeometry(s / Math.sqrt(3), s / Math.sqrt(3), k, 6);
    head.translate(0, k / 2, 0);
    const shank = new THREE.CylinderGeometry(d / 2, d / 2, L, 16);
    shank.translate(0, -L / 2, 0);
    const chamfer = new THREE.CylinderGeometry(d / 2, d * 0.4, d * 0.15, 16);
    chamfer.translate(0, -L - d * 0.075, 0);
    const g = mergeGeometries([head.toNonIndexed(), shank.toNonIndexed(), chamfer.toNonIndexed()]);
    return { geo: orient(g, axis), dims: { Filetage: `M${d}`, 'Longueur sous tête': L, 'Surplat tête': s, 'Hauteur tête': k, Pas: isoPitch(d) }, kind: 'vis' };
  },
  /** Vis à tête cylindrique six pans creux ISO 4762 */
  capScrew(d, L, axis = 'y') {
    const dk = d * 1.5, k = d;
    const head = new THREE.CylinderGeometry(dk / 2, dk / 2, k, 20);
    head.translate(0, k / 2, 0);
    const shank = new THREE.CylinderGeometry(d / 2, d / 2, L, 16);
    shank.translate(0, -L / 2, 0);
    const g = mergeGeometries([head.toNonIndexed(), shank.toNonIndexed()]);
    return { geo: orient(g, axis), dims: { Filetage: `M${d}`, 'Longueur sous tête': L, 'Diamètre tête': dk, 'Hauteur tête': k, Pas: isoPitch(d) }, kind: 'vis' };
  },
  /** Écrou hexagonal ISO 4032 */
  nut(d, axis = 'y') {
    const s = isoHexWidth(d), m = Math.round(d * 0.84 * 10) / 10;
    const shape = new THREE.Shape();
    const R = s / Math.sqrt(3);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
      const x = Math.cos(a) * R, y = Math.sin(a) * R;
      i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y);
    }
    shape.closePath();
    const hole = new THREE.Path();
    hole.absarc(0, 0, d / 2, 0, Math.PI * 2, true);
    shape.holes.push(hole);
    const g = new THREE.ExtrudeGeometry(shape, { depth: m, bevelEnabled: false, curveSegments: 12 });
    g.translate(0, 0, -m / 2);
    g.rotateX(-Math.PI / 2);
    return { geo: orient(g, axis), dims: { Filetage: `M${d}`, Surplat: s, Hauteur: m, Pas: isoPitch(d) }, kind: 'écrou' };
  },
  /** Rondelle plate ISO 7089 */
  washer(d, axis = 'y') {
    const dOut = Math.round(d * 2), t = Math.max(0.5, Math.round(d * 0.18 * 10) / 10);
    const r = S.tube(dOut, d + (d < 10 ? 0.4 : 1), t, axis, 24);
    r.dims = { 'Pour vis': `M${d}`, 'Diamètre extérieur': dOut, 'Diamètre intérieur': d + (d < 10 ? 0.4 : 1), Épaisseur: t };
    r.kind = 'rondelle';
    return r;
  },
  /** Rivet à tête ronde */
  rivet(d, L, axis = 'y') {
    const head = new THREE.SphereGeometry(d * 0.9, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2);
    const shank = new THREE.CylinderGeometry(d / 2, d / 2, L, 8);
    shank.translate(0, -L / 2, 0);
    const g = mergeGeometries([head.toNonIndexed(), shank.toNonIndexed()]);
    return { geo: orient(g, axis), dims: { Diamètre: d, Longueur: L, 'Diamètre tête': d * 1.8 }, kind: 'rivet' };
  },
  /** Ressort hélicoïdal : diamètre moyen D, fil d, hauteur H, n spires */
  spring(D, d, H, n, axis = 'y') {
    const curve = new (class extends THREE.Curve {
      getPoint(t, target = new THREE.Vector3()) {
        const a = t * n * Math.PI * 2;
        return target.set(Math.cos(a) * D / 2, t * H - H / 2, Math.sin(a) * D / 2);
      }
    })();
    const g = new THREE.TubeGeometry(curve, Math.round(n * 24), d / 2, 8, false);
    return { geo: orient(g, axis), dims: { 'Diamètre moyen': D, 'Diamètre du fil': d, 'Hauteur libre': H, Spires: n } };
  },
  /** Barre/tube entre deux points (coordonnées locales) */
  rod(a, b, d, dIn = 0) {
    const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
    const L = va.distanceTo(vb);
    const g = dIn > 0 ? S.tube(d, dIn, L, 'y', 20).geo : new THREE.CylinderGeometry(d / 2, d / 2, L, 20);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize());
    g.applyQuaternion(q);
    const m = va.clone().add(vb).multiplyScalar(0.5);
    g.translate(m.x, m.y, m.z);
    const dims = dIn > 0 ? { 'Diamètre extérieur': d, 'Diamètre intérieur': dIn, Longueur: Math.round(L) } : { Diamètre: d, Longueur: Math.round(L) };
    return { geo: g, dims };
  },
  /** Tuyau suivant une polyligne lissée */
  pipe(points, d, closed = false) {
    const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), closed, 'catmullrom', 0.2);
    const L = curve.getLength();
    const g = new THREE.TubeGeometry(curve, Math.max(16, points.length * 12), d / 2, 12, closed);
    return { geo: g, dims: { Diamètre: d, 'Longueur développée': Math.round(L) } };
  },
  /** Profil 2D (plan XY) extrudé sur w selon Z, centré en Z */
  extrude(points, w, bevel = 0) {
    const shape = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)));
    const g = new THREE.ExtrudeGeometry(shape, {
      depth: w - bevel * 2, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 16,
    });
    g.translate(0, 0, -(w - bevel * 2) / 2);
    g.computeBoundingBox();
    const bb = g.boundingBox;
    return { geo: g, dims: { Longueur: Math.round(bb.max.x - bb.min.x), Hauteur: Math.round(bb.max.y - bb.min.y), Largeur: w } };
  },
  /** Corps de révolution autour de l'axe X : points [rayon, x]. sy/sz = aplatissement */
  lathe(points, seg = 40, sy = 1, sz = 1) {
    const g = new THREE.LatheGeometry(points.map(([r, x]) => new THREE.Vector2(Math.max(r, 0.001), x)), seg);
    g.rotateZ(-Math.PI / 2);
    g.scale(1, sy, sz);
    g.computeBoundingBox();
    const bb = g.boundingBox;
    return { geo: g, dims: { Longueur: Math.round(bb.max.x - bb.min.x), Hauteur: Math.round(bb.max.y - bb.min.y), Largeur: Math.round(bb.max.z - bb.min.z) } };
  },
  /** Révolution autour d'un axe quelconque : points [rayon, h] */
  revolve(points, axis = 'y', seg = 40) {
    const g = new THREE.LatheGeometry(points.map(([r, h]) => new THREE.Vector2(Math.max(r, 0.001), h)), seg);
    orient(g, axis);
    g.computeBoundingBox();
    const bb = g.boundingBox;
    const maxR = Math.max(...points.map((p) => p[0]));
    return { geo: g, dims: { 'Diamètre max.': Math.round(maxR * 2 * 10) / 10, Longueur: Math.round(Math.max(...points.map((p) => p[1])) - Math.min(...points.map((p) => p[1]))) } };
  },
  /**
   * Surface lissée entre sections (ailes, empennages, pales).
   * sections : [{ x, y, z, chord, t (épaisseur relative), twist (deg) }]
   * span : axe d'envergure ('z' pour une aile, 'y' pour une dérive)
   */
  loft(sections, profile = airfoil(0.12), span = 'z') {
    const pos = [];
    const P = profile;
    const vert = (s, px, py) => {
      const tw = (s.twist || 0) * DEG;
      // le bord d'attaque est en s.x, la corde s'étend vers l'arrière (−X)
      let x = -(px - 0.25) * s.chord, y = py * s.chord * (s.tScale ?? 1);
      const cx = x * Math.cos(tw) - y * Math.sin(tw), cy = x * Math.sin(tw) + y * Math.cos(tw);
      x = cx - 0.25 * s.chord;
      if (span === 'z') return [s.x + x, s.y + cy, s.z];
      if (span === 'y') return [s.x + x, s.y, s.z + cy];
      return [s.x, s.y + cy, s.z + x]; // span x
    };
    for (let i = 0; i < sections.length - 1; i++) {
      const A = sections[i], B = sections[i + 1];
      for (let j = 0; j < P.length; j++) {
        const k = (j + 1) % P.length;
        const a0 = vert(A, ...P[j]), a1 = vert(A, ...P[k]), b0 = vert(B, ...P[j]), b1 = vert(B, ...P[k]);
        pos.push(...a0, ...b0, ...a1, ...a1, ...b0, ...b1);
      }
    }
    const cap = (s, flip) => {
      const c = vert(s, 0.4, 0);
      for (let j = 0; j < P.length; j++) {
        const k = (j + 1) % P.length;
        const a = vert(s, ...P[j]), b = vert(s, ...P[k]);
        flip ? pos.push(...c, ...b, ...a) : pos.push(...c, ...a, ...b);
      }
    };
    cap(sections[0], false);
    cap(sections[sections.length - 1], true);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.computeVertexNormals();
    const first = sections[0], last = sections[sections.length - 1];
    const spanLen = Math.abs(span === 'z' ? last.z - first.z : span === 'y' ? last.y - first.y : last.x - first.x);
    const maxT = Math.max(...P.map((p) => p[1])) - Math.min(...P.map((p) => p[1]));
    return { geo: g, dims: { Envergure: Math.round(spanLen), 'Corde emplanture': first.chord, 'Corde extrémité': last.chord, 'Épaisseur max.': Math.round(maxT * first.chord * (first.tScale ?? 1)) } };
  },
};

/** Profil NACA 4 chiffres (épaisseur t, cambrure m) – points sur corde unitaire */
export function airfoil(t = 0.12, m = 0, p = 0.4, n = 24) {
  const pts = [];
  const yt = (x) => 5 * t * (0.2969 * Math.sqrt(x) - 0.126 * x - 0.3516 * x * x + 0.2843 * x ** 3 - 0.1036 * x ** 4);
  const yc = (x) => (m === 0 ? 0 : x < p ? (m / (p * p)) * (2 * p * x - x * x) : (m / ((1 - p) ** 2)) * (1 - 2 * p + 2 * p * x - x * x));
  for (let i = n; i >= 0; i--) { const x = (1 - Math.cos((i / n) * Math.PI)) / 2; pts.push([x, yc(x) + yt(x)]); }
  for (let i = 1; i < n; i++) { const x = (1 - Math.cos((i / n) * Math.PI)) / 2; pts.push([x, yc(x) - yt(x)]); }
  return pts;
}

/** Profil en coin (gouvernes) */
export function wedge(t = 0.08) {
  return [[0, t / 2], [0.08, t / 2], [1, 0.004], [1, -0.004], [0.08, -t / 2], [0, -t / 2]];
}

export function isoHexWidth(d) {
  const table = { 3: 5.5, 4: 7, 5: 8, 6: 10, 8: 13, 10: 16, 12: 18, 14: 21, 16: 24, 18: 27, 20: 30, 22: 32, 24: 36 };
  return table[d] ?? Math.round(d * 1.6);
}
export function isoPitch(d) {
  const table = { 3: 0.5, 4: 0.7, 5: 0.8, 6: 1, 8: 1.25, 10: 1.5, 12: 1.75, 14: 2, 16: 2, 18: 2.5, 20: 2.5, 22: 2.5, 24: 3 };
  return table[d] ?? Math.round(d * 0.125 * 100) / 100;
}

// ---------------------------------------------------------------------------
// Assemblages (arborescence nomenclature)
// ---------------------------------------------------------------------------
export class Assembly {
  constructor(name, opts = {}, parent = null, root = null) {
    this.root = root || this;
    this.parent = parent;
    this.object = new THREE.Group();
    this.object.name = name;
    if (!root) { this.counter = 0; this.prefix = opts.prefix || 'VH'; }
    this.code = opts.code || (parent ? parent.code : 'GEN');
    this.node = {
      kind: 'group', name, ref: opts.ref || `${this.root.prefix}-${this.code}`,
      desc: opts.desc || '', children: [], object: this.object, parent: parent ? parent.node : null,
      layer: opts.layer || (parent ? parent.node.layer : 'meca'),
    };
    this.object.userData.node = this.node;
    applyTransform(this.object, opts);
  }

  group(name, opts = {}) {
    const a = new Assembly(name, { ...opts, code: opts.code || this.code }, this, this.root);
    this.object.add(a.object);
    this.node.children.push(a.node);
    return a;
  }

  /** Ajoute une pièce. shape = résultat d'une fonction S.* */
  part(name, shape, opts = {}) {
    const mat = makeMaterial(opts.mat || 'acier', opts.color);
    const mesh = new THREE.Mesh(shape.geo, mat);
    mesh.name = name;
    applyTransform(mesh, opts);
    const r = this.root;
    r.counter++;
    const node = {
      kind: 'part', name,
      ref: opts.ref || `${r.prefix}-${this.code}-${String(r.counter).padStart(4, '0')}`,
      material: (MATERIALS[opts.mat] || MATERIALS.acier).label,
      dims: shape.dims || {},
      type: shape.kind || opts.type || 'pièce',
      desc: opts.desc || '',
      norme: opts.norme || (shape.kind === 'vis' ? 'ISO 4017 / ISO 4762' : shape.kind === 'écrou' ? 'ISO 4032' : shape.kind === 'rondelle' ? 'ISO 7089' : ''),
      couple: opts.couple || null, // couple de serrage (N·m)
      object: mesh, parent: this.node, children: [],
      layer: opts.layer || this.node.layer,
    };
    mesh.userData.node = node;
    this.object.add(mesh);
    this.node.children.push(node);
    return mesh;
  }
}

function applyTransform(obj, o) {
  if (o.pos) obj.position.set(...o.pos);
  if (o.rot) obj.rotation.set(o.rot[0] * DEG, o.rot[1] * DEG, o.rot[2] * DEG);
  if (o.scale) obj.scale.set(...(Array.isArray(o.scale) ? o.scale : [o.scale, o.scale, o.scale]));
}

/** Couches d'épluchage, de l'extérieur vers le châssis */
export const LAYERS = [
  { id: 'ext', label: 'Carrosserie / revêtement' },
  { id: 'int', label: 'Intérieur / habitacle' },
  { id: 'meca', label: 'Mécanique & équipements' },
  { id: 'sol', label: 'Trains roulants & roues' },
  { id: 'struct', label: 'Châssis / structure' },
];

// ---------------------------------------------------------------------------
// Aides : côtés gauche / droit, cercles de boulons
// ---------------------------------------------------------------------------
export const SIDES = [
  { s: -1, m: 'gauche', f: 'gauche', c: 'G' },
  { s: 1, m: 'droit', f: 'droite', c: 'D' },
];

/**
 * Cercle de fixations (vis + éventuellement écrou/rondelle).
 * axis : axe des vis ('x'|'y'|'z'), dir : +1/-1 côté de la tête.
 */
export function boltCircle(asm, { n, pcd, d, L, axis = 'z', at = [0, 0, 0], dir = 1, label = 'Vis', kind = 'bolt', start = 0, mat = 'acierHR', couple, nuts = false, washer = false }) {
  const res = [];
  for (let i = 0; i < n; i++) {
    const a = start + (i / n) * Math.PI * 2;
    const u = Math.cos(a) * pcd / 2, v = Math.sin(a) * pcd / 2;
    let p;
    if (axis === 'z') p = [at[0] + u, at[1] + v, at[2]];
    else if (axis === 'x') p = [at[0], at[1] + u, at[2] + v];
    else p = [at[0] + u, at[1], at[2] + v];
    const rot = axisRot(axis, dir);
    const shape = kind === 'nut' ? S.nut(d) : kind === 'cap' ? S.capScrew(d, L) : kind === 'rivet' ? S.rivet(d, L) : S.bolt(d, L);
    const nm = `${label} ${String(i + 1).padStart(2, '0')}`;
    res.push(asm.part(nm, shape, { pos: p, rot, mat, couple }));
    if (washer) {
      const off = offsetAlong(axis, dir, -0.2 * d);
      asm.part(`Rondelle ${label.toLowerCase()} ${String(i + 1).padStart(2, '0')}`, S.washer(d), { pos: add(p, off), rot, mat: 'zingue' });
    }
    if (nuts) {
      const off = offsetAlong(axis, dir, -(L - d * 0.5));
      asm.part(`Écrou ${label.toLowerCase()} ${String(i + 1).padStart(2, '0')}`, S.nut(d), { pos: add(p, off), rot, mat: 'zingue', couple });
    }
  }
  return res;
}

/** Rangée de fixations le long d'un segment */
export function boltRow(asm, { from, to, n, d, L, axis = 'y', dir = 1, label = 'Vis', kind = 'bolt', mat = 'acierHR', couple }) {
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : i / (n - 1);
    const p = from.map((f, k) => f + (to[k] - f) * t);
    const shape = kind === 'nut' ? S.nut(d) : kind === 'cap' ? S.capScrew(d, L) : kind === 'rivet' ? S.rivet(d, L) : S.bolt(d, L);
    asm.part(`${label} ${String(i + 1).padStart(2, '0')}`, shape, { pos: p, rot: axisRot(axis, dir), mat, couple });
  }
}

export function axisRot(axis, dir = 1) {
  if (axis === 'y') return dir > 0 ? [0, 0, 0] : [180, 0, 0];
  if (axis === 'z') return dir > 0 ? [90, 0, 0] : [-90, 0, 0];
  return dir > 0 ? [0, 0, -90] : [0, 0, 90];
}
function offsetAlong(axis, dir, v) {
  return axis === 'x' ? [v * dir, 0, 0] : axis === 'y' ? [0, v * dir, 0] : [0, 0, v * dir];
}
function add(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
