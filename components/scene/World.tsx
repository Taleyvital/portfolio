"use client";

import { useEffect, useMemo } from "react";
import {
  BoxGeometry,
  type BufferGeometry,
  CanvasTexture,
  ConeGeometry,
  EdgesGeometry,
  IcosahedronGeometry,
  MeshLambertMaterial,
  PlaneGeometry,
  SRGBColorSpace,
} from "three";
import { box, cyl, getMaterials, merge, paint } from "@/components/scene/geometry";
import { pathBasis, pathPoint, type Pt } from "@/lib/three/path";
import { KIOSK, PLAZA, type Spot, type SpotId, spots, WORLD } from "@/lib/three/world";
import { mulberry32, range } from "@/lib/three/rng";

const c = {
  ground: "#6f8a5b",
  patchA: "#789566",
  patchB: "#648052",
  path: "#d6c3a2",
  stone: "#b9a888",
  trunk: "#6b4f3a",
  leaf: ["#4f7a46", "#5c8a50", "#436b3c", "#557f4a"],
  bush: "#4c7444",
  panel: "#efe9f5",
  panelDark: "#2a2633",
  plinth: "#cfc9dd",
  metal: "#a9adb5",
  kiosk: "#2d2938",
  hill: ["#93a9c4", "#a3b6cd", "#89a0bd"],
  cloud: "#f4f6ff",
  sunDisk: "#ffe0b0",
};

const PAPER = "#17141f";
const SANS = "system-ui, -apple-system, 'Segoe UI', sans-serif";

/** Boîte tournée autour de y, posée sur `y`. */
function turned(color: string, w: number, h: number, d: number, angle: number, x: number, y: number, z: number) {
  return paint(new BoxGeometry(w, h, d).rotateY(angle).translate(x, y + h / 2, z), color);
}

const axis = (angle: number): Pt => ({ x: Math.cos(angle), z: -Math.sin(angle) });

/** Distance horizontale au chemin (échantillonné), pour écarter arbres et buissons de la promenade. */
const SAMPLES = Array.from({ length: 90 }, (_, i) => pathPoint(i / 89));
function distToPath(x: number, z: number) {
  let min = Infinity;
  for (const p of SAMPLES) min = Math.min(min, Math.hypot(p.x - x, p.z - z));
  return min;
}

function tree(list: BufferGeometry[], x: number, z: number, scale: number, rng: () => number) {
  const h = 1.5 * scale;
  list.push(cyl(c.trunk, 0.17 * scale, h, x, 0, z, 6, 0.12 * scale));
  const leaf = c.leaf[Math.floor(rng() * c.leaf.length)];
  const layers: [number, number, number][] = [
    [h + 0.45 * scale, 1.15 * scale, 1.7 * scale],
    [h + 1.25 * scale, 0.92 * scale, 1.45 * scale],
    [h + 1.95 * scale, 0.62 * scale, 1.15 * scale],
  ];
  for (const [y, r, ch] of layers) {
    list.push(paint(new ConeGeometry(r, ch, 7).translate(x, y, z), leaf));
  }
}

/** Décor extérieur fusionné : deux draw calls (mat + lumineux) pour tout le paysage. */
function build() {
  const solid: BufferGeometry[] = [];
  const glow: BufferGeometry[] = [];
  const rng = mulberry32(11);

  // Sol, chemin et clairière.
  solid.push(box(c.ground, WORLD.ground, 0.2, WORLD.ground, 0, -0.2, -10));
  const SEGMENTS = 110;
  for (let i = 0; i < SEGMENTS; i++) {
    const a = pathPoint(i / SEGMENTS);
    const b = pathPoint((i + 1) / SEGMENTS);
    const len = Math.hypot(b.x - a.x, b.z - a.z);
    const angle = Math.atan2(b.x - a.x, b.z - a.z);
    solid.push(
      paint(
        new BoxGeometry(WORLD.pathWidth, 0.06, len * 1.04)
          .rotateY(angle)
          .translate((a.x + b.x) / 2, 0.03, (a.z + b.z) / 2),
        c.path,
      ),
    );
  }
  // Traces claires dans l'herbe : des taches de tondeuse, pas des textures.
  for (let i = 0; i < 12; i++) {
    const p = pathBasis(rng());
    const side = rng() < 0.5 ? -1 : 1;
    const lateral = side * range(rng, 4, 13);
    const x = p.p.x + p.r.x * lateral + p.f.x * range(rng, -4, 4);
    const z = p.p.z + p.r.z * lateral + p.f.z * range(rng, -4, 4);
    solid.push(cyl(rng() < 0.5 ? c.patchA : c.patchB, range(rng, 2.4, 5), 0.02, x, 0, z, 18));
  }

  // Arbres, buissons et touffes d'herbe.
  let planted = 0;
  for (let attempt = 0; attempt < 600 && planted < 40; attempt++) {
    const r = rng();
    const b = pathBasis(r);
    const side = rng() < 0.5 ? -1 : 1;
    const lateral = side * range(rng, 6.5, 17);
    const x = b.p.x + b.r.x * lateral + b.f.x * range(rng, -3.5, 3.5);
    const z = b.p.z + b.r.z * lateral + b.f.z * range(rng, -3.5, 3.5);
    if (distToPath(x, z) < 6) continue;
    if (Math.hypot(x - PLAZA.center.x, z - PLAZA.center.z) < 10) continue;
    if (Math.hypot(x - KIOSK.center.x, z - KIOSK.center.z) < 6) continue;
    tree(solid, x, z, range(rng, 0.8, 1.4), rng);
    planted++;
  }
  for (let i = 0; i < 18; i++) {
    const b = pathBasis(rng());
    const side = rng() < 0.5 ? -1 : 1;
    const lateral = side * range(rng, 3.6, 7.5);
    const x = b.p.x + b.r.x * lateral + b.f.x * range(rng, -3, 3);
    const z = b.p.z + b.r.z * lateral + b.f.z * range(rng, -3, 3);
    if (distToPath(x, z) < 3) continue;
    solid.push(paint(new IcosahedronGeometry(range(rng, 0.4, 0.85), 0).scale(1, 0.7, 1).translate(x, 0.28, z), c.bush));
  }
  for (let i = 0; i < 110; i++) {
    const b = pathBasis(rng());
    const side = rng() < 0.5 ? -1 : 1;
    const lateral = side * range(rng, 1.7, 5.5);
    const x = b.p.x + b.r.x * lateral + b.f.x * range(rng, -2, 2);
    const z = b.p.z + b.r.z * lateral + b.f.z * range(rng, -2, 2);
    solid.push(paint(new ConeGeometry(0.09, range(rng, 0.18, 0.34), 4).translate(x, 0.14, z), c.leaf[1]));
  }

  // Lampes le long du chemin.
  for (const [s, side] of [
    [0.12, 1],
    [0.26, -1],
    [0.46, 1],
    [0.6, -1],
    [0.84, 1],
  ] as const) {
    const b = pathBasis(s);
    const x = b.p.x + b.r.x * side * 3.4;
    const z = b.p.z + b.r.z * side * 3.4;
    solid.push(cyl(c.metal, 0.055, 2.8, x, 0, z, 6));
    solid.push(box(c.metal, 0.34, 0.05, 0.05, x, 2.78, z));
    glow.push(box("#ffe3a6", 0.16, 0.16, 0.16, x + 0.13, 2.72, z));
  }

  // Collines lointaines et soleil bas.
  const hills: [number, number, number, number][] = [
    [-34, -54, 24, 9],
    [6, -62, 30, 12],
    [42, -50, 22, 8],
    [-52, -22, 20, 7],
    [58, -18, 24, 8],
    [-20, 46, 18, 6],
    [34, 40, 20, 7],
  ];
  hills.forEach(([x, z, r, h], i) =>
    solid.push(paint(new ConeGeometry(r, h, 9).translate(x, h / 2 - 0.2, z), c.hill[i % c.hill.length])),
  );
  for (let i = 0; i < 9; i++) {
    const x = range(rng, -50, 50);
    const z = range(rng, -70, -30);
    const y = range(rng, 13, 20);
    glow.push(paint(new IcosahedronGeometry(range(rng, 2.2, 4.4), 1).scale(1, 0.4, 1).translate(x, y, z), c.cloud));
  }
  glow.push(paint(new IcosahedronGeometry(4.2, 1).translate(-34, 21, -58), c.sunDisk));

  // Panneaux des projets : mât, plinthe, cadre, liseré lumineux.
  for (const spot of spots) {
    const [w, h] = [spot.size[0], spot.size[1]];
    const [cx, cy, cz] = spot.center;
    const rot = spot.rotationY;
    const xAxis = axis(rot);
    if (spot.kind === "pavilion") {
      solid.push(turned(c.plinth, w + 0.7, 0.12, 0.9, rot, cx, 0, cz));
      for (const off of [-(w / 2 - 0.22), w / 2 - 0.22]) {
        solid.push(turned(c.panel, 0.14, cy - h / 2, 0.14, rot, cx + xAxis.x * off, 0, cz + xAxis.z * off));
      }
      solid.push(turned(c.panelDark, w + 0.18, h + 0.18, 0.16, rot, cx, cy - (h + 0.18) / 2, cz));
      glow.push(turned(spot.hue, w + 0.1, 0.05, 0.05, rot, cx, cy + h / 2 + 0.06, cz));
    }
    if (spot.kind === "arch") {
      for (const off of [-2.85, 2.85]) {
        solid.push(turned(c.panel, 0.42, 2.9, 0.42, rot, cx + xAxis.x * off, 0, cz + xAxis.z * off));
        glow.push(turned(spot.hue, 0.1, 2.5, 0.1, rot, cx + xAxis.x * (off + 0.16), 0.2, cz + xAxis.z * (off + 0.16)));
      }
      solid.push(turned(c.panel, 6.4, 0.42, 0.46, rot, cx, 2.72, cz));
      solid.push(turned(c.panelDark, w + 0.12, h + 0.12, 0.2, rot, cx, cy - h / 2 - 0.06, cz));
      glow.push(turned(spot.hue, 5.9, 0.04, 0.44, rot, cx, 2.7, cz));
    }
    if (spot.kind === "kiosk") {
      solid.push(turned(c.kiosk, 1.9, 2.5, 0.8, rot, KIOSK.center.x, 0, KIOSK.center.z));
      solid.push(turned(c.panelDark, w + 0.18, h + 0.18, 0.14, rot, cx, cy - h / 2 - 0.06, cz));
      glow.push(turned(spot.hue, 1.5, 0.05, 0.7, rot, cx, 0.55, cz));
      glow.push(box("#ffd9a8", 0.1, 0.1, 0.1, cx, 2.56, cz));
    }
  }

  return { solid: merge(solid), glow: merge(glow) };
}

// Textures dessinées en canvas : contenu décoratif, toujours repris en HTML (panneaux, légende).
function canvasTexture(width: number, height: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext("2d")!);
  const t = new CanvasTexture(canvas);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function wrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, max: number, line: number) {
  let row = "";
  for (const word of text.split(" ")) {
    const next = row ? `${row} ${word}` : word;
    if (ctx.measureText(next).width > max && row) {
      ctx.fillText(row, x, y);
      row = word;
      y += line;
    } else row = next;
  }
  ctx.fillText(row, x, y);
}

function posterTexture(spot: Spot) {
  const { title, subtitle, hue, kind } = spot;
  const wide = kind === "arch";
  const tall = kind === "kiosk";
  const W = wide ? 1000 : tall ? 360 : 600;
  const H = wide ? 300 : tall ? 560 : 380;
  return canvasTexture(W, H, (ctx) => {
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = hue;
    ctx.fillRect(0, 0, wide ? 14 : W, wide ? H : 12);
    ctx.globalAlpha = 0.16;
    ctx.beginPath();
    ctx.arc(W * 0.86, H * 0.82, Math.min(W, H) * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#ffffff";
    ctx.font = `700 ${wide ? 92 : tall ? 54 : 62}px ${SANS}`;
    ctx.fillText(title, wide ? 70 : 40, wide ? 130 : 96);
    ctx.fillStyle = "#d9d4e6";
    ctx.font = `400 ${wide ? 34 : tall ? 27 : 28}px ${SANS}`;
    wrap(ctx, subtitle, wide ? 70 : 40, wide ? 190 : tall ? 160 : 156, W - (wide ? 140 : 80), wide ? 44 : 38);
    ctx.fillStyle = hue;
    ctx.font = `600 ${wide ? 30 : tall ? 26 : 26}px ${SANS}`;
    ctx.fillText(
      kind === "arch" ? "Mon parcours →" : kind === "kiosk" ? "Me joindre →" : "Étude de cas →",
      wide ? 70 : 40,
      H - (wide ? 44 : 32),
    );
  });
}

type Screen = {
  key: string;
  geometry: BufferGeometry;
  material: MeshLambertMaterial;
  position: [number, number, number];
  rotation: [number, number, number];
};

/**
 * Le parcours : paysage et constructions fusionnés, plus les panneaux texturés et un contour lumineux
 * autour de l'objet survolé ou de la page ouverte.
 */
export function World({ hovered, active }: { hovered: SpotId | null; active: SpotId | null }) {
  const { solid, glow } = useMemo(() => build(), []);

  const screens = useMemo<Screen[]>(() => {
    const lit = (map: CanvasTexture) =>
      new MeshLambertMaterial({ map, emissive: "#ffffff", emissiveMap: map, emissiveIntensity: 0.32 });
    return spots.map((s) => {
      const offset = s.kind === "arch" ? 0.12 : s.kind === "kiosk" ? 0.09 : 0.1;
      const n = { x: Math.sin(s.rotationY), z: Math.cos(s.rotationY) };
      return {
        key: s.id,
        geometry: new PlaneGeometry(s.size[0] - 0.16, s.size[1] - 0.16),
        material: lit(posterTexture(s)),
        position: [s.center[0] + n.x * offset, s.center[1], s.center[2] + n.z * offset],
        rotation: [0, s.rotationY, 0] as [number, number, number],
      };
    });
  }, []);

  const outlines = useMemo(
    () =>
      spots.map((s) => ({
        id: s.id,
        hue: s.hue,
        center: s.center,
        rotationY: s.rotationY,
        geometry: new EdgesGeometry(new BoxGeometry(s.size[0] + 0.04, s.size[1] + 0.04, s.size[2] + 0.04)),
      })),
    [],
  );

  useEffect(
    () => () => {
      solid.dispose();
      glow.dispose();
      screens.forEach((s) => {
        s.geometry.dispose();
        s.material.map?.dispose();
        s.material.dispose();
      });
      outlines.forEach((o) => o.geometry.dispose());
    },
    [solid, glow, screens, outlines],
  );

  const materials = getMaterials();
  return (
    <group>
      <mesh geometry={solid} material={materials.solid} castShadow receiveShadow />
      <mesh geometry={glow} material={materials.glow} />
      {screens.map((s) => (
        <mesh key={s.key} geometry={s.geometry} material={s.material} position={s.position} rotation={s.rotation} />
      ))}
      {outlines.map((o) => (
        <lineSegments
          key={o.id}
          geometry={o.geometry}
          position={o.center}
          rotation-y={o.rotationY}
          visible={o.id === hovered || o.id === active}
        >
          <lineBasicMaterial color={o.hue} toneMapped={false} />
        </lineSegments>
      ))}
    </group>
  );
}

/** Soleil de fin d'après-midi : il éclaire le parcours de biais et projette les ombres des arbres. */
export const SUN = { position: [16, 20, 10] as const, target: [0, 0, -10] as const };
