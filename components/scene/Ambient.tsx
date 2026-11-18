"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { AdditiveBlending, CanvasTexture, type InstancedMesh, MeshBasicMaterial, Object3D, PlaneGeometry } from "three";
import { power } from "@/components/scene/power";
import { pathBasis } from "@/lib/three/path";
import { mulberry32, range } from "@/lib/three/rng";

const MOTES = 90;

type Mote = { x: number; y: number; z: number; drift: number; phase: number; size: number };

// Halo radial de 32 px : un insecte lumineux ou un pollen, sans post-traitement.
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

/** Lucioles réparties le long du chemin, pour donner du relief à la profondeur. */
export function Ambient({ paused }: { paused: boolean }) {
  const mesh = useRef<InstancedMesh>(null);
  const time = useRef(0);

  const motes = useMemo<Mote[]>(() => {
    const rng = mulberry32(7);
    return Array.from({ length: MOTES }, () => {
      const { p, f, r } = pathBasis(rng());
      const lateral = range(rng, -5, 5);
      const along = range(rng, -1.5, 1.5);
      return {
        x: p.x + r.x * lateral + f.x * along,
        y: range(rng, 0.35, 2.6),
        z: p.z + r.z * lateral + f.z * along,
        drift: range(rng, 0.15, 0.45),
        phase: rng() * Math.PI * 2,
        size: range(rng, 0.025, 0.055),
      };
    });
  }, []);

  const { geometry, material } = useMemo(
    () => ({
      geometry: new PlaneGeometry(1, 1),
      material: new MeshBasicMaterial({
        map: haloTexture(),
        color: "#ffe2b0",
        transparent: true,
        opacity: 0.5,
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
      o.position.set(
        p.x + Math.sin(t * p.drift + p.phase) * 0.35,
        p.y + Math.sin(t * p.drift * 1.7 + p.phase) * 0.12,
        p.z + Math.cos(t * p.drift + p.phase) * 0.25,
      );
      o.quaternion.copy(camera.quaternion); // toujours face à la caméra
      o.scale.setScalar(p.size * power.value);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });

  return <instancedMesh ref={mesh} args={[geometry, material, MOTES]} frustumCulled={false} />;
}
