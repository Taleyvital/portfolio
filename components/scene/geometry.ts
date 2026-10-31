import {
  BoxGeometry,
  type BufferGeometry,
  Color,
  CylinderGeometry,
  Float32BufferAttribute,
  MeshBasicMaterial,
  MeshLambertMaterial,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

// Toute la pièce est peinte par sommet (attribut color) : deux matériaux suffisent,
// et chaque matériau ne coûte qu'un draw call une fois les géométries fusionnées.
// Les géométries sont converties en non indexées pour pouvoir toutes les fusionner.

const tmp = new Color();

/** Peint toute la géométrie d'une couleur. */
export function paint(g: BufferGeometry, color: string) {
  const n = g.attributes.position.count;
  const colors = new Float32Array(n * 3);
  tmp.set(color);
  for (let i = 0; i < n; i++) tmp.toArray(colors, i * 3);
  g.setAttribute("color", new Float32BufferAttribute(colors, 3));
  return g.index ? g.toNonIndexed() : g;
}

/** Boîte posée sur `y` (sa base), centrée en x/z. */
export function box(color: string, w: number, h: number, d: number, x = 0, y = 0, z = 0) {
  return paint(new BoxGeometry(w, h, d).translate(x, y + h / 2, z), color);
}

/** Cylindre vertical posé sur `y` (rTop = 0 pour un cône). */
export function cyl(color: string, r: number, h: number, x = 0, y = 0, z = 0, segments = 16, rTop = r) {
  return paint(new CylinderGeometry(rTop, r, h, segments).translate(x, y + h / 2, z), color);
}

/** Fusionne une liste de géométries en une seule (un seul draw call). */
export function merge(list: BufferGeometry[]) {
  const merged = mergeGeometries(list, false);
  list.forEach((g) => g.dispose());
  if (!merged) throw new Error("Fusion de géométries impossible");
  return merged;
}

export type MaterialKey = "solid" | "glow";

let materials: { solid: MeshLambertMaterial; glow: MeshBasicMaterial } | null = null;

/** Matériaux partagés par toute la scène, créés une seule fois. */
export function getMaterials() {
  materials ??= {
    solid: new MeshLambertMaterial({ vertexColors: true }),
    // Lampes, guirlande, LED : matériau non éclairé, aucune vraie lumière.
    glow: new MeshBasicMaterial({ vertexColors: true, toneMapped: false }),
  };
  return materials;
}
