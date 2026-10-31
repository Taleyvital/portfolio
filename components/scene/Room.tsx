"use client";

import { useEffect, useMemo } from "react";
import {
  BoxGeometry,
  type BufferGeometry,
  CanvasTexture,
  ConeGeometry,
  EdgesGeometry,
  MeshLambertMaterial,
  PlaneGeometry,
  SRGBColorSpace,
} from "three";
import { box, cyl, getMaterials, merge, paint } from "@/components/scene/geometry";
import { FRAME, ROOM, type SpotId, spots } from "@/lib/three/room";

const c = {
  wall: "#a39ad0",
  wallSide: "#968dc4",
  ceiling: "#b4acd8",
  floor: "#c49870",
  white: "#f1eeea",
  silver: "#d9dce1",
  dark: "#26232c",
  metal: "#a9adb5",
  sofa: "#5b3fa6",
  sofaSeat: "#6a4bbb",
  sofaDark: "#43307d",
  cushion: "#f4f1f7",
  rug: "#d8d2e6",
  glass: "#3a3f4a",
  pot: "#c9784f",
  leaf: "#4f8a3a",
  binder: "#1f1d24",
};

const W = ROOM.width / 2;
const D = ROOM.depth / 2;
const H = ROOM.height;
// Fenêtre du mur droit : c'est par là qu'entre le soleil.
const WIN = { z0: -1.5, z1: 0.5, y0: 0.9, y1: 2.4 } as const;

/** Boîte tournée autour de y, posée sur `y`. */
function turned(color: string, w: number, h: number, d: number, angle: number, x: number, y: number, z: number) {
  return paint(new BoxGeometry(w, h, d).rotateY(angle).translate(x, y + h / 2, z), color);
}

function plant(x: number, y: number, z: number, scale: number) {
  const leaves = [0, 1.3, 2.6, 3.9, 5.2].map((a, i) =>
    paint(
      new ConeGeometry(0.06 * scale, 0.32 * scale, 5)
        .rotateZ(0.5)
        .rotateY(a)
        .translate(x + Math.cos(a) * 0.05 * scale, y + (0.2 + (i % 2) * 0.06) * scale, z + Math.sin(a) * 0.05 * scale),
      c.leaf,
    ),
  );
  return [cyl(c.pot, 0.07 * scale, 0.13 * scale, x, y, z, 12, 0.08 * scale), ...leaves];
}

/** Murs, sol, plafond et mobilier : tout ce qui ne bouge pas, en deux draw calls (mat + lumineux). */
function build() {
  const solid: BufferGeometry[] = [];
  const glow: BufferGeometry[] = [];

  // Enveloppe : le côté +z reste ouvert, comme une maison de poupée vue de face.
  solid.push(box(c.floor, ROOM.width + 0.2, 0.1, ROOM.depth, 0, -0.1, 0));
  solid.push(box(c.ceiling, ROOM.width + 0.2, 0.1, ROOM.depth, 0, H, 0));
  solid.push(box(c.wall, ROOM.width + 0.2, H, 0.1, 0, 0, -D - 0.05));
  solid.push(box(c.wallSide, 0.1, H, ROOM.depth, -W - 0.05, 0, 0));
  // Mur droit percé de la fenêtre.
  solid.push(box(c.wallSide, 0.1, WIN.y0, ROOM.depth, W + 0.05, 0, 0));
  solid.push(box(c.wallSide, 0.1, H - WIN.y1, ROOM.depth, W + 0.05, WIN.y1, 0));
  solid.push(box(c.wallSide, 0.1, WIN.y1 - WIN.y0, WIN.z0 + D, W + 0.05, WIN.y0, (WIN.z0 - D) / 2));
  solid.push(box(c.wallSide, 0.1, WIN.y1 - WIN.y0, D - WIN.z1, W + 0.05, WIN.y0, (WIN.z1 + D) / 2));
  const wz = (WIN.z0 + WIN.z1) / 2;
  const ww = WIN.z1 - WIN.z0;
  solid.push(box(c.white, 0.14, 0.06, ww + 0.1, W, WIN.y0 - 0.06, wz));
  solid.push(box(c.white, 0.14, 0.06, ww + 0.1, W, WIN.y1, wz));
  solid.push(box(c.white, 0.14, WIN.y1 - WIN.y0, 0.05, W, WIN.y0, WIN.z0 - 0.025));
  solid.push(box(c.white, 0.14, WIN.y1 - WIN.y0, 0.05, W, WIN.y0, WIN.z1 + 0.025));
  solid.push(box(c.white, 0.08, WIN.y1 - WIN.y0, 0.04, W, WIN.y0, wz));
  // Ciel derrière la fenêtre.
  glow.push(box("#ffd9a8", 0.02, WIN.y1 - WIN.y0, ww, W + 0.4, WIN.y0, wz));
  // Plinthes.
  solid.push(box(c.white, ROOM.width, 0.08, 0.02, 0, 0, -D + 0.01));
  solid.push(box(c.white, 0.02, 0.08, ROOM.depth, -W + 0.01, 0, 0));

  // Bureau à tréteaux, écran, clavier, portable.
  solid.push(box(c.white, 1.8, 0.05, 0.8, 0, 0.72, -2.55));
  for (const x of [-0.75, 0.75]) {
    solid.push(turned(c.white, 0.05, 0.74, 0.05, 0.3, x, 0, -2.75));
    solid.push(turned(c.white, 0.05, 0.74, 0.05, -0.3, x, 0, -2.35));
  }
  solid.push(box(c.white, 1.5, 0.04, 0.04, 0, 0.3, -2.55));
  solid.push(box(c.silver, 0.24, 0.015, 0.16, -0.2, 0.77, -2.8));
  solid.push(box(c.silver, 0.05, 0.12, 0.04, -0.2, 0.78, -2.82));
  solid.push(box(c.silver, 0.76, 0.48, 0.03, -0.2, 0.88, -2.8));
  solid.push(box(c.white, 0.44, 0.015, 0.13, -0.2, 0.77, -2.42));
  solid.push(box(c.white, 0.06, 0.02, 0.1, 0.12, 0.77, -2.42));
  solid.push(box(c.dark, 0.36, 0.015, 0.25, 0.52, 0.77, -2.55));
  solid.push(cyl(c.binder, 0.12, 0.3, -1.1, 0, -2.5, 12, 0.14)); // corbeille

  // Chaise de bureau.
  const chair = { x: 0.75, z: -1.75 };
  solid.push(turned(c.dark, 0.5, 0.08, 0.48, -0.5, chair.x, 0.46, chair.z));
  solid.push(turned(c.dark, 0.46, 0.55, 0.06, -0.5, chair.x + 0.13, 0.58, chair.z + 0.24));
  solid.push(cyl(c.metal, 0.03, 0.38, chair.x, 0.08, chair.z, 8));
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    solid.push(turned(c.metal, 0.3, 0.04, 0.05, a, chair.x + Math.cos(a) * 0.15, 0.06, chair.z - Math.sin(a) * 0.15));
    solid.push(cyl(c.dark, 0.03, 0.06, chair.x + Math.cos(a) * 0.3, 0, chair.z - Math.sin(a) * 0.3, 8));
  }

  // Étagère au-dessus du bureau : livres, plante, guirlande lumineuse.
  solid.push(box(c.white, 1.3, 0.04, 0.24, 0.1, 1.72, -2.88));
  ["#e9e4dc", "#f4f1ec", "#d6d0c7", "#ece7df", "#c9c2b8", "#f1ece5"].forEach((col, i) =>
    solid.push(box(col, 0.04, 0.22 + (i % 3) * 0.02, 0.17, 0.32 + i * 0.05, 1.76, -2.88)),
  );
  solid.push(box(c.white, 0.16, 0.06, 0.12, 0.62, 1.76, -2.88));
  solid.push(...plant(-0.35, 1.76, -2.88, 1));
  for (let i = 0; i <= 18; i++) {
    const t = i / 18;
    const x = -0.55 + t * 1.3;
    glow.push(box("#ffe6a8", 0.022, 0.022, 0.022, x, 1.66 - Math.sin(Math.PI * t) * 0.12, -2.76));
  }
  for (let i = 1; i <= 6; i++) glow.push(box("#ffe6a8", 0.022, 0.022, 0.022, 0.78, 1.66 - i * 0.12, -2.92));

  // Canapé contre le mur du fond, coussins.
  solid.push(box(c.sofa, 2.3, 0.42, 0.9, 2.55, 0, -2.45));
  [-0.74, 0, 0.74].forEach((dx) => solid.push(box(c.sofaSeat, 0.72, 0.12, 0.8, 2.55 + dx, 0.42, -2.38)));
  solid.push(box(c.sofaDark, 2.3, 0.55, 0.22, 2.55, 0.42, -2.82));
  solid.push(box(c.sofaDark, 0.2, 0.62, 0.9, 1.35, 0, -2.45));
  solid.push(box(c.sofaDark, 0.2, 0.62, 0.9, 3.75, 0, -2.45));
  [1.9, 2.4, 3.3].forEach((x) => solid.push(turned(c.cushion, 0.42, 0.38, 0.12, 0.08, x, 0.55, -2.62)));

  // Tapis, table basse et téléphone (le contact).
  solid.push(box(c.rug, 2.6, 0.01, 1.8, 2.6, 0, -1.3));
  solid.push(box(c.glass, 1, 0.04, 0.56, 2.7, 0.38, -1.05));
  for (const [dx, dz] of [[-0.45, -0.24], [0.45, -0.24], [-0.45, 0.24], [0.45, 0.24]]) {
    solid.push(box(c.metal, 0.03, 0.38, 0.03, 2.7 + dx, 0, -1.05 + dz));
  }
  solid.push(box(c.dark, 0.09, 0.012, 0.17, 2.7, 0.42, -1.05));

  // Bibliothèque basse à l'avant gauche, classeurs.
  const bx = -3.6;
  solid.push(box(c.white, 0.6, 0.04, 1.8, bx, 0, 1.9));
  for (const y of [0.4, 0.8]) solid.push(box(c.white, 0.6, 0.03, 1.8, bx, y, 1.9));
  solid.push(box(c.white, 0.6, 0.04, 1.8, bx, 1.16, 1.9));
  for (const z of [1, 1.9, 2.8]) solid.push(box(c.white, 0.6, 1.2, 0.04, bx, 0, z));
  for (const y of [0.04, 0.43]) {
    for (let i = 0; i < 9; i++) solid.push(box(c.binder, 0.4, 0.32, 0.07, bx + 0.05, y, 1.1 + i * 0.09 + (i > 4 ? 0.1 : 0)));
  }
  solid.push(...plant(bx, 1.2, 2.4, 1.4));

  // Plante près de la fenêtre.
  solid.push(...plant(3.55, 0, 1.4, 3));

  // Cadres des projets : bordure blanche (l'image est un mesh à part, texturé).
  for (const s of spots.slice(0, 4)) {
    solid.push(box(c.white, 0.05, FRAME.h + 0.08, FRAME.w + 0.08, -W + 0.03, s.center[1] - FRAME.h / 2 - 0.04, s.center[2]));
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

const SANS = "system-ui, -apple-system, 'Segoe UI', sans-serif";

function frameTexture(title: string, subtitle: string, hue: string) {
  return canvasTexture(600, 360, (ctx) => {
    ctx.fillStyle = "#16131f";
    ctx.fillRect(0, 0, 600, 360);
    ctx.fillStyle = hue;
    ctx.fillRect(0, 0, 600, 10);
    ctx.globalAlpha = 0.18;
    ctx.beginPath();
    ctx.arc(520, 290, 150, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#ffffff";
    ctx.font = `700 64px ${SANS}`;
    ctx.fillText(title, 40, 110);
    ctx.fillStyle = "#d9d4e6";
    ctx.font = `400 28px ${SANS}`;
    wrap(ctx, subtitle, 40, 170, 520, 38);
    ctx.fillStyle = hue;
    ctx.font = `600 26px ${SANS}`;
    ctx.fillText("Étude de cas →", 40, 320);
  });
}

function monitorTexture() {
  return canvasTexture(640, 384, (ctx) => {
    ctx.fillStyle = "#3b3266";
    ctx.fillRect(0, 0, 640, 384);
    ctx.fillStyle = "#6a5bb0";
    ctx.beginPath();
    ctx.arc(560, 330, 260, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillRect(0, 0, 640, 18);
    for (let r = 0; r < 3; r++) {
      for (let col = 0; col < 5; col++) {
        ctx.fillStyle = "#7cc4ff";
        ctx.fillRect(250 + col * 74, 60 + r * 70, 46, 34);
        ctx.fillStyle = "#a6d8ff";
        ctx.fillRect(250 + col * 74, 54 + r * 70, 20, 8);
      }
    }
    ctx.fillStyle = "#ffffff";
    ctx.font = `700 46px ${SANS}`;
    ctx.fillText("À propos", 30, 90);
    ctx.font = `400 22px ${SANS}`;
    ctx.fillStyle = "#e6e0ff";
    wrap(ctx, "Mon parcours, mes décisions, la suite.", 30, 130, 200, 30);
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.fillRect(140, 352, 360, 24);
  });
}

function laptopTexture() {
  return canvasTexture(360, 240, (ctx) => {
    ctx.fillStyle = "#14121b";
    ctx.fillRect(0, 0, 360, 240);
    const colors = ["#c792ea", "#82aaff", "#c3e88d", "#f78c6c", "#89ddff"];
    for (let i = 0; i < 12; i++) {
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillRect(20 + (i % 3) * 18, 20 + i * 17, 60 + ((i * 47) % 180), 8);
    }
  });
}

function phoneTexture() {
  return canvasTexture(180, 340, (ctx) => {
    ctx.fillStyle = "#0e1a14";
    ctx.fillRect(0, 0, 180, 340);
    ctx.fillStyle = "#3ddc84";
    ctx.beginPath();
    ctx.arc(90, 140, 42, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = `700 30px ${SANS}`;
    ctx.textAlign = "center";
    ctx.fillText("Contact", 90, 240);
  });
}

type Screen = { key: string; geometry: BufferGeometry; material: MeshLambertMaterial; position: [number, number, number]; rotation: [number, number, number] };

/**
 * La pièce : enveloppe et mobilier fusionnés, plus les surfaces texturées (cadres, écrans, téléphone)
 * et un contour lumineux autour de l'objet survolé ou de la page ouverte.
 */
export function Room({ hovered, active }: { hovered: SpotId | null; active: SpotId | null }) {
  const { solid, glow } = useMemo(() => build(), []);

  const screens = useMemo<Screen[]>(() => {
    const lit = (map: CanvasTexture, glow = 0.55) =>
      new MeshLambertMaterial({ map, emissive: "#ffffff", emissiveMap: map, emissiveIntensity: glow });
    const frames = spots.slice(0, 4).map<Screen>((s) => ({
      key: s.id,
      geometry: new PlaneGeometry(FRAME.w, FRAME.h),
      material: lit(frameTexture(s.title, s.subtitle, s.hue), 0.3),
      position: [-W + 0.065, s.center[1], s.center[2]],
      rotation: [0, Math.PI / 2, 0],
    }));
    return [
      ...frames,
      { key: "monitor", geometry: new PlaneGeometry(0.7, 0.42), material: lit(monitorTexture()), position: [-0.2, 1.12, -2.783], rotation: [0, 0, 0] },
      { key: "laptop", geometry: new PlaneGeometry(0.34, 0.22), material: lit(laptopTexture()), position: [0.52, 0.9, -2.66], rotation: [-0.25, 0, 0] },
      { key: "phone", geometry: new PlaneGeometry(0.075, 0.15), material: lit(phoneTexture()), position: [2.7, 0.433, -1.05], rotation: [-Math.PI / 2, 0, 0] },
    ];
  }, []);

  const outlines = useMemo(
    () =>
      spots.map((s) => ({
        id: s.id,
        hue: s.hue,
        center: s.center,
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
        <mesh key={s.key} geometry={s.geometry} material={s.material} position={s.position} rotation={s.rotation} receiveShadow />
      ))}
      {outlines.map((o) => (
        <lineSegments key={o.id} geometry={o.geometry} position={o.center} visible={o.id === hovered || o.id === active}>
          <lineBasicMaterial color={o.hue} toneMapped={false} />
        </lineSegments>
      ))}
      {/* Quatrième mur, côté visiteur : invisible, mais il projette son ombre (la lumière n'entre que par la fenêtre). */}
      <mesh position={[0, H / 2, D + 0.05]} castShadow>
        <boxGeometry args={[ROOM.width + 0.2, H + 0.2, 0.1]} />
        <meshBasicMaterial colorWrite={false} depthWrite={false} />
      </mesh>
    </group>
  );
}

// Lit par une fenêtre : le soleil doit traverser l'ouverture du mur droit.
export const SUN = { position: [6, 2.6, 5] as const, target: [-0.5, 1.6, -3] as const };
