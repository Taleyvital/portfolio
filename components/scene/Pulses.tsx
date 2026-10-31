"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { AdditiveBlending, CanvasTexture, type InstancedMesh, MeshBasicMaterial, Object3D, PlaneGeometry } from "three";
import { power } from "@/components/scene/power";
import { mulberry32, range } from "@/lib/three/rng";

const MOTES = 70;
// Volume traversé par le rayon de soleil, de la fenêtre vers le mur du fond.
const BEAM = { x: [0.8, 3.8], y: [0.5, 2.4], z: [-2.4, 0.3] } as const;

type Mote = { x: number; y: number; z: number; drift: number; phase: number; size: number };

// Halo radial de 32 px : un grain de poussière éclairé, sans post-traitement.
function haloTexture() {
  const size = 32;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new CanvasTexture(canvas);
}

/** Poussière qui flotte dans le rayon de soleil (mouvement lent, en pause avec les animations). */
export function Pulses({ paused }: { paused: boolean }) {
  const mesh = useRef<InstancedMesh>(null);
  const time = useRef(0);

  const motes = useMemo<Mote[]>(() => {
    const rng = mulberry32(42);
    return Array.from({ length: MOTES }, () => ({
      x: range(rng, ...BEAM.x),
      y: range(rng, ...BEAM.y),
      z: range(rng, ...BEAM.z),
      drift: range(rng, 0.02, 0.06),
      phase: rng() * Math.PI * 2,
      size: range(rng, 0.015, 0.035),
    }));
  }, []);

  const { geometry, material } = useMemo(
    () => ({
      geometry: new PlaneGeometry(1, 1),
      material: new MeshBasicMaterial({
        map: haloTexture(),
        color: "#ffe2b0",
        transparent: true,
        opacity: 0.45,
        depthWrite: false,
        blending: AdditiveBlending,
        toneMapped: false,
      }),
    }),
    [],
  );

  useEffect(
    () => () => {
      geometry.dispose();
      material.map?.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  const o = useMemo(() => new Object3D(), []);

  useFrame(({ camera }, delta) => {
    const m = mesh.current;
    if (!m) return;
    if (!paused) time.current += Math.min(delta, 0.1);
    const t = time.current;
    motes.forEach((p, i) => {
      o.position.set(p.x + Math.sin(t * 0.3 + p.phase) * 0.08, p.y + Math.sin(t * p.drift * 6 + p.phase) * 0.15, p.z);
      o.quaternion.copy(camera.quaternion); // toujours face à la caméra
      o.scale.setScalar(p.size * power.value);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });

  return <instancedMesh ref={mesh} args={[geometry, material, MOTES]} frustumCulled={false} />;
}
