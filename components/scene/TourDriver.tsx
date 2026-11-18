"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/scene-mode";
import { syncStation, tour } from "@/lib/scroll-tour";
import { pathPoint, pathTangent } from "@/lib/three/path";
import { walk } from "@/lib/three/walk";
import { type Spot, stationPathS } from "@/lib/three/world";

// Rattrapage de la visite : ~98 % de l'écart en 1 s, l'avatar s'arrête quand le visiteur s'arrête.
const TOUR_RATE = 6;

/**
 * Avance la visite (tour.value) et publie la pose de l'avatar pour l'image en cours.
 * Monté avant Walker et WalkCamera : ils lisent tous les deux un état déjà à jour.
 */
export function TourDriver({ spot }: { spot: Spot | null }) {
  const invalidate = useThree((s) => s.invalidate);
  const first = useRef(true);

  useEffect(() => {
    (window as unknown as { __tour?: unknown }).__tour = tour;
    tour.invalidate = invalidate;
    return () => {
      tour.invalidate = () => {};
    };
  }, [invalidate]);

  // Changement de route : une image pour lancer le mouvement.
  useEffect(() => invalidate(), [spot, invalidate]);

  useFrame((_, delta) => {
    const instant = first.current || prefersReducedMotion();
    const dt = Math.min(delta, 0.1);

    const before = tour.value;
    tour.value = instant ? tour.target : tour.value + (tour.target - tour.value) * (1 - Math.exp(-TOUR_RATE * dt));
    if (Math.abs(tour.target - tour.value) < 0.001) tour.value = tour.target;
    if (tour.value !== before || first.current) syncStation();

    const prevX = walk.position.x;
    const prevZ = walk.position.z;

    if (spot) {
      walk.resting = true;
      tour.lateral = 0;
      tour.lateralTarget = 0;
      walk.position.set(spot.anchor.x, 0, spot.anchor.z);
      walk.tangent.set(spot.facing.x, 0, spot.facing.z).normalize();
    } else {
      walk.resting = false;
      // Le décalage latéral est amorti comme le reste : les flèches gauche/droite font glisser l'avatar.
      tour.lateral = instant
        ? tour.lateralTarget
        : tour.lateral + (tour.lateralTarget - tour.lateral) * (1 - Math.exp(-8 * dt));
      const s = stationPathS(tour.value);
      const p = pathPoint(s);
      const t = pathTangent(s);
      walk.position.set(p.x - t.z * tour.lateral, 0, p.z + t.x * tour.lateral);
      walk.tangent.set(t.x, 0, t.z).normalize();
    }

    walk.facing.copy(walk.tangent);
    walk.distance = instant ? 0 : Math.hypot(walk.position.x - prevX, walk.position.z - prevZ);
    walk.speed = instant ? 0 : walk.distance / Math.max(dt, 1 / 240);
    first.current = false;

    if (walk.distance > 0 || tour.value !== tour.target) invalidate();
  });

  return null;
}
