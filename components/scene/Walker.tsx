"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { BoxGeometry, CircleGeometry, type Group, type MeshLambertMaterial } from "three";
import { getMaterials, paint } from "@/components/scene/geometry";
import { power } from "@/components/scene/power";
import { walk } from "@/lib/three/walk";

const c = {
  hoodie: "#b9a8ff",
  hoodieDark: "#8f7de0",
  pants: "#302c44",
  shoe: "#efeaf6",
  skin: "#e8b98f",
  hair: "#2a2434",
  bag: "#ffb547",
  bagDark: "#c9892f",
  eye: "#241f2c",
};

const part = (color: string, w: number, h: number, d: number) => paint(new BoxGeometry(w, h, d), color);

/**
 * Le visiteur : un personnage low-poly généré en primitives (aucun asset à charger).
 * Il marche le long du chemin quand la visite avance, et s'arrête devant l'objet dont la page est ouverte.
 * Le shader de la scène est partagé (vertex colors) : chaque membre reste un mesh séparé pour s'animer.
 */
export function Walker({ paused }: { paused: boolean }) {
  const root = useRef<Group>(null);
  const body = useRef<Group>(null);
  const legL = useRef<Group>(null);
  const legR = useRef<Group>(null);
  const armL = useRef<Group>(null);
  const armR = useRef<Group>(null);

  const phase = useRef(0);
  const idle = useRef(0);
  const amplitude = useRef(0);

  const geometries = useMemo(
    () => ({
      shadow: new CircleGeometry(0.44, 20),
      torso: part(c.hoodie, 0.46, 0.58, 0.28),
      hood: part(c.hoodieDark, 0.36, 0.16, 0.14),
      head: part(c.skin, 0.27, 0.27, 0.27),
      hair: part(c.hair, 0.29, 0.11, 0.29),
      eyeL: part(c.eye, 0.04, 0.05, 0.02),
      eyeR: part(c.eye, 0.04, 0.05, 0.02),
      leg: part(c.pants, 0.16, 0.6, 0.18),
      shoe: part(c.shoe, 0.19, 0.12, 0.28),
      arm: part(c.hoodie, 0.12, 0.52, 0.14),
      hand: part(c.skin, 0.13, 0.12, 0.15),
      bag: part(c.bag, 0.34, 0.4, 0.16),
      bagPocket: part(c.bagDark, 0.24, 0.16, 0.04),
      strapL: part(c.bagDark, 0.05, 0.3, 0.02),
      strapR: part(c.bagDark, 0.05, 0.3, 0.02),
    }),
    [],
  );

  const material = getMaterials().solid as MeshLambertMaterial;

  useEffect(() => {
    return () => {
      Object.values(geometries).forEach((g) => g.dispose());
    };
  }, [geometries]);

  useFrame((_, delta) => {
    const g = root.current;
    if (!g) return;
    const dt = Math.min(delta, 0.1);

    g.position.copy(walk.position);
    g.rotation.y = Math.atan2(walk.facing.x, walk.facing.z);
    g.scale.setScalar(0.35 + 0.65 * power.value);

    const target = paused ? 0 : Math.min(1, walk.speed / 2.4);
    amplitude.current += (target - amplitude.current) * (1 - Math.exp(-8 * dt));
    if (!paused) {
      phase.current += walk.distance * 7;
      idle.current += dt;
    }

    const amp = amplitude.current;
    const swing = Math.sin(phase.current) * 0.8 * amp;
    if (legL.current) legL.current.rotation.x = swing;
    if (legR.current) legR.current.rotation.x = -swing;
    if (armL.current) armL.current.rotation.x = -swing * 0.9;
    if (armR.current) armR.current.rotation.x = swing * 0.9;

    if (body.current) {
      body.current.position.y = Math.abs(Math.sin(phase.current)) * 0.045 * amp + Math.sin(idle.current * 1.6) * 0.004;
      body.current.rotation.x = 0.06 * amp;
      body.current.rotation.z = Math.sin(phase.current) * 0.02 * amp;
    }
  });

  return (
    <group ref={root}>
      <mesh geometry={geometries.shadow} rotation-x={-Math.PI / 2} position-y={0.015}>
        <meshBasicMaterial color="#1b1824" transparent opacity={0.34} depthWrite={false} />
      </mesh>
      <group ref={body}>
        <mesh geometry={geometries.torso} material={material} position={[0, 0.95, 0]} />
        <mesh geometry={geometries.hood} material={material} position={[0, 1.26, -0.15]} />
        <mesh geometry={geometries.head} material={material} position={[0, 1.4, 0]} />
        <mesh geometry={geometries.hair} material={material} position={[0, 1.53, -0.01]} />
        <mesh geometry={geometries.eyeL} material={material} position={[-0.06, 1.41, 0.142]} />
        <mesh geometry={geometries.eyeR} material={material} position={[0.06, 1.41, 0.142]} />

        <group ref={armL} position={[-0.31, 1.18, 0]}>
          <mesh geometry={geometries.arm} material={material} position={[0, -0.26, 0]} />
          <mesh geometry={geometries.hand} material={material} position={[0, -0.56, 0]} />
        </group>
        <group ref={armR} position={[0.31, 1.18, 0]}>
          <mesh geometry={geometries.arm} material={material} position={[0, -0.26, 0]} />
          <mesh geometry={geometries.hand} material={material} position={[0, -0.56, 0]} />
        </group>

        <group ref={legL} position={[-0.12, 0.66, 0]}>
          <mesh geometry={geometries.leg} material={material} position={[0, -0.3, 0]} />
          <mesh geometry={geometries.shoe} material={material} position={[0, -0.56, 0.04]} />
        </group>
        <group ref={legR} position={[0.12, 0.66, 0]}>
          <mesh geometry={geometries.leg} material={material} position={[0, -0.3, 0]} />
          <mesh geometry={geometries.shoe} material={material} position={[0, -0.56, 0.04]} />
        </group>

        <mesh geometry={geometries.bag} material={material} position={[0, 0.94, -0.23]} />
        <mesh geometry={geometries.bagPocket} material={material} position={[0, 0.85, -0.32]} />
        <mesh geometry={geometries.strapL} material={material} position={[-0.16, 1.03, 0.145]} />
        <mesh geometry={geometries.strapR} material={material} position={[0.16, 1.03, 0.145]} />
      </group>
    </group>
  );
}
