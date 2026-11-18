// Chemin du parcours extérieur : une courbe de Catmull-Rom en coordonnées x/z, sans dépendance à three
// (les composants client et le rail d'étapes l'importent ; three reste dans le chunk 3D).

export type Pt = { x: number; z: number };

/** Points de contrôle du chemin, du début (z positif) vers la fin (z négatif). */
const POINTS: readonly Pt[] = [
  { x: 0, z: 10 },
  { x: 1.1, z: 6 },
  { x: -0.9, z: 2 },
  { x: 0.7, z: -2 },
  { x: -0.5, z: -6 },
  { x: 0.8, z: -10 },
  { x: 0.1, z: -14 },
  { x: -1.1, z: -18 },
  { x: 0, z: -22 },
  { x: 0.5, z: -26 },
];

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

function at(i: number): Pt {
  return POINTS[clamp(i, 0, POINTS.length - 1)];
}

/** Point du chemin pour `s` dans [0, 1], segments répartis uniformément. */
export function pathPoint(s: number): Pt {
  const u = clamp(s, 0, 1) * (POINTS.length - 1);
  const i = Math.min(POINTS.length - 2, Math.floor(u));
  const t = u - i;
  const t2 = t * t;
  const t3 = t2 * t;
  const p0 = at(i - 1);
  const p1 = at(i);
  const p2 = at(i + 1);
  const p3 = at(i + 2);
  const f = (a: number, b: number, c: number, d: number) =>
    0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
  return { x: f(p0.x, p1.x, p2.x, p3.x), z: f(p0.z, p1.z, p2.z, p3.z) };
}

/** Tangente normalisée (sens de la marche) pour `s` dans [0, 1]. */
export function pathTangent(s: number): Pt {
  const e = 0.004;
  const a = pathPoint(clamp(s - e, 0, 1));
  const b = pathPoint(clamp(s + e, 0, 1));
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const len = Math.hypot(dx, dz) || 1;
  return { x: dx / len, z: dz / len };
}

/** Repère local du chemin : position, direction et normale à droite. */
export function pathBasis(s: number) {
  const p = pathPoint(s);
  const f = pathTangent(s);
  return { p, f, r: { x: -f.z, z: f.x } };
}

export function add(a: Pt, b: Pt, k = 1): Pt {
  return { x: a.x + b.x * k, z: a.z + b.z * k };
}

export function normalize(p: Pt): Pt {
  const len = Math.hypot(p.x, p.z) || 1;
  return { x: p.x / len, z: p.z / len };
}

/** Direction opposée. */
export function flip(p: Pt): Pt {
  return { x: -p.x, z: -p.z };
}

/** Angle autour de y pour qu'un plan (qui regarde +z) fasse face à `n`. */
export function facingAngle(n: Pt): number {
  return Math.atan2(n.x, n.z);
}
