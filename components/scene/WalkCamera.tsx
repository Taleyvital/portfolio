"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { type PerspectiveCamera, Vector3 } from "three";
import { prefersReducedMotion } from "@/lib/scene-mode";
import { tour } from "@/lib/scroll-tour";
import { walk } from "@/lib/three/walk";
import { type Spot, stationShot } from "@/lib/three/world";

export const FOV = 50;
// Panneau de contenu ouvert à gauche (46rem + marges) : même valeur que globals.css.
export const PANEL = 752;
// Vitesse d'amortissement : la caméra rattrape ~99 % de l'écart en 1 s et s'arrête avec l'avatar.
const CAMERA_RATE = 5.5;

/**
 * Caméra troisième personne du parcours. À l'accueil, elle suit l'avatar derrière l'épaule, avec le
 * cadrage propre à chaque étape ; sur une autre route, elle vient devant l'objet de la page et décale
 * le cadrage pour laisser la place au panneau. Pas d'orbite libre, pas de roulis.
 */
export function WalkCamera({ spot }: { spot: Spot | null }) {
  const camera = useThree((s) => s.camera as PerspectiveCamera);
  const invalidate = useThree((s) => s.invalidate);
  const stateRef = useRef<{
    position: Vector3;
    target: Vector3;
    wantPos: Vector3;
    wantTarget: Vector3;
  } | null>(null);
  stateRef.current ??= {
    position: new Vector3(),
    target: new Vector3(),
    wantPos: new Vector3(),
    wantTarget: new Vector3(),
  };
  const state = stateRef.current;
  const first = useRef(true);
  const shift = useRef("");

  // Changement de route : une image pour lancer le mouvement.
  useEffect(() => invalidate(), [spot, invalidate]);

  useFrame(({ size }, delta) => {
    const instant = first.current || prefersReducedMotion();
    const dt = Math.min(delta, 0.1);

    if (spot) {
      state.wantPos.fromArray(spot.view.position);
      state.wantTarget.fromArray(spot.view.target);
    } else {
      const s = stationShot(tour.value);
      const f = walk.tangent;
      const rx = -f.z;
      const rz = f.x;
      state.wantPos.set(
        walk.position.x - f.x * s.back + rx * s.side,
        s.height,
        walk.position.z - f.z * s.back + rz * s.side,
      );
      state.wantTarget.set(
        walk.position.x + f.x * s.ahead + rx * s.lookSide,
        s.lookHeight,
        walk.position.z + f.z * s.ahead + rz * s.lookSide,
      );
    }
    state.wantPos.y = Math.max(0.7, state.wantPos.y);

    const k = instant ? 1 : 1 - Math.exp(-CAMERA_RATE * dt);
    state.position.lerp(state.wantPos, k);
    state.target.lerp(state.wantTarget, k);
    first.current = false;

    camera.position.copy(state.position);
    camera.lookAt(state.target);

    // Cadrage décalé vers la droite quand le panneau couvre la gauche de l'écran.
    const nextShift = spot && Math.min(PANEL, size.width) < size.width * 0.8 ? PANEL / 2 : 0;
    const key = `${nextShift}:${size.width}x${size.height}`;
    if (key !== shift.current) {
      shift.current = key;
      if (nextShift) camera.setViewOffset(size.width, size.height, -nextShift, 0, size.width, size.height);
      else camera.clearViewOffset();
    }

    const moving =
      state.position.distanceToSquared(state.wantPos) > 1e-6 ||
      state.target.distanceToSquared(state.wantTarget) > 1e-6;
    if (moving) invalidate();
  });

  return null;
}
