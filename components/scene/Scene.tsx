"use client";

import { PerformanceMonitor } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { PCFShadowMap } from "three";
import { Ambient } from "@/components/scene/Ambient";
import { Hotspots } from "@/components/scene/Hotspots";
import { power } from "@/components/scene/power";
import { TourDriver } from "@/components/scene/TourDriver";
import { Walker } from "@/components/scene/Walker";
import { FOV, WalkCamera } from "@/components/scene/WalkCamera";
import { SUN, World } from "@/components/scene/World";
import { fallbackToLight, prefersReducedMotion, setSceneLoaded } from "@/lib/scene-mode";
import type { Spot, SpotId } from "@/lib/three/world";

const TICK_FPS = 30;
const MIN_DPR = 0.5;

/** Demande une image à 30 fps tant que les animations tournent (frameloop="demand"). */
function Ticker({ paused }: { paused: boolean }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    if (paused) return;
    let id = 0;
    let last = 0;
    const loop = (t: number) => {
      id = requestAnimationFrame(loop); // suspendu automatiquement quand l'onglet est masqué
      if (t - last >= 1000 / TICK_FPS - 2) {
        last = t;
        invalidate();
      }
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [paused, invalidate]);
  return null;
}

const POWER_ON_SECONDS = 1.4;

/** Compile les shaders avant d'afficher, puis lance la mise sous tension. */
function PowerOn() {
  const { gl, scene, camera, invalidate, clock } = useThree();
  const start = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    power.value = 0;
    gl.compileAsync(scene, camera).then(() => {
      if (cancelled) return;
      // Ombres statiques : une seule passe, une fois tout le parcours en place.
      gl.shadowMap.needsUpdate = true;
      setSceneLoaded(true);
      // Mouvement réduit : parcours affiché d'emblée.
      start.current = prefersReducedMotion() ? -Infinity : clock.getElapsedTime();
      invalidate();
    });
    return () => {
      cancelled = true;
      setSceneLoaded(false);
    };
  }, [gl, scene, camera, invalidate, clock]);

  // Rampe calée sur l'horloge réelle : elle se termine à l'heure même si les images sont lentes.
  useFrame(({ clock: c }) => {
    if (start.current === null || power.value >= 1) return;
    const t = Math.min(1, (c.getElapsedTime() - start.current) / POWER_ON_SECONDS);
    power.value = 1 - (1 - t) * (1 - t);
    invalidate();
  });
  return null;
}

/** Repli en version légère si le contexte WebGL est perdu. */
function ContextGuard() {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    const canvas = gl.domElement;
    const onLost = (e: Event) => {
      e.preventDefault();
      fallbackToLight();
    };
    canvas.addEventListener("webglcontextlost", onLost);
    return () => canvas.removeEventListener("webglcontextlost", onLost);
  }, [gl]);
  return null;
}

/** Compteurs de rendu (?debug) : draw calls, triangles, images par seconde. */
function DebugStats() {
  const gl = useThree((s) => s.gl);
  const frames = useRef(0);
  const last = useRef(0);
  const el = useRef<HTMLPreElement | null>(null);

  useEffect(() => {
    const pre = document.createElement("pre");
    pre.className = "scene-debug";
    document.body.appendChild(pre);
    el.current = pre;
    return () => pre.remove();
  }, []);

  useFrame(({ clock }) => {
    frames.current++;
    const now = clock.getElapsedTime();
    if (now - last.current < 1 || !el.current) return;
    const { calls, triangles } = gl.info.render;
    el.current.textContent = `draw calls ${calls}\ntriangles ${triangles}\nfps ${Math.round(frames.current / (now - last.current))}\ndpr ${gl.getPixelRatio()}`;
    frames.current = 0;
    last.current = now;
  });
  return null;
}

/** Lumière de fin d'après-midi : ciel lavande et soleil chaud de biais sur le parcours (2 lumières). */
function Lights() {
  return (
    <>
      <hemisphereLight args={["#dbe6ff", "#6f7f5c", 1.15]} />
      <directionalLight
        position={SUN.position}
        intensity={2.8}
        color="#ffd9ae"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0005}
        shadow-normalBias={0.03}
        shadow-camera-left={-26}
        shadow-camera-right={26}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-camera-near={1}
        shadow-camera-far={80}
      >
        <object3D attach="target" position={SUN.target} />
      </directionalLight>
    </>
  );
}

type Props = {
  spot: Spot | null;
  paused: boolean;
  debug: boolean;
  onSelect: (href: string) => void;
};

export default function Scene({ spot, paused, debug, onSelect }: Props) {
  const maxDpr = Math.min(window.devicePixelRatio || 1, 2);
  // Pas d'ombres sur les écrans tactiles (mobiles en 3D forcée) : seulement sur ordinateur.
  const [shadows] = useState(() => !matchMedia("(pointer: coarse)").matches);
  const [dpr, setDpr] = useState(maxDpr);
  // Pas de onFallback de drei : son compteur « flipflops » compte aussi les hausses de qualité,
  // si bien qu'une machine fluide finissait en version légère au bout d'une dizaine de secondes.
  // On ne bascule que si c'est encore lent alors que la résolution est déjà au minimum.
  const onDecline = () => {
    if (dpr > MIN_DPR) return setDpr(Math.max(MIN_DPR, dpr - 0.25));
    if (debug) console.warn("[scene] repli performance ignoré (?debug)");
    else fallbackToLight();
  };
  const [hovered, setHovered] = useState<SpotId | null>(null);
  const active = spot?.id ?? null;

  return (
    <Canvas
      frameloop="demand"
      dpr={dpr}
      flat
      shadows={shadows && { enabled: true, type: PCFShadowMap, autoUpdate: false }}
      camera={{ fov: FOV, near: 0.1, far: 140, position: [0, 2.2, 14] }}
      // ?debug : le canvas garde son image, pour les captures automatisées (toDataURL).
      gl={{ antialias: maxDpr < 1.5, powerPreference: "high-performance", alpha: false, preserveDrawingBuffer: debug }}
    >
      {/* Mesure seulement quand le ticker tourne : en pause, les images sont rares et la mesure n'a pas de sens. */}
      {!paused && (
        <PerformanceMonitor
          // Le ticker plafonne à 30 fps : on mesure par rapport à cette cadence.
          bounds={() => [22, 28]}
          onDecline={onDecline}
          onIncline={() => setDpr((d) => Math.min(maxDpr, d + 0.25))}
        />
      )}
      <color attach="background" args={["#9fb7e0"]} />
      <fog attach="fog" args={["#c8d4ec", 30, 100]} />
      <Lights />
      <World hovered={hovered} active={active} />
      <TourDriver spot={spot} />
      <Walker paused={paused} />
      <WalkCamera spot={spot} />
      <Ambient paused={paused} />
      <Hotspots hovered={hovered} setHovered={setHovered} onSelect={onSelect} />
      <Ticker paused={paused} />
      <PowerOn />
      <ContextGuard />
      {debug && <DebugStats />}
    </Canvas>
  );
}
