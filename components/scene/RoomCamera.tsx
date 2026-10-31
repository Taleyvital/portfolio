"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { type PerspectiveCamera, Vector3 } from "three";
import { prefersReducedMotion } from "@/lib/scene-mode";
import { syncStation, tour } from "@/lib/scroll-tour";
import { type Spot, stations } from "@/lib/three/room";

export const FOV = 42;
// Panneau de contenu ouvert à gauche (46rem + marges) : même valeur que globals.css.
const PANEL = 752;
// Vitesse d'amortissement : la caméra rattrape ~98 % de l'écart en 1 s, et s'arrête quand le visiteur s'arrête.
const CAMERA_RATE = 4;
const TOUR_RATE = 6;

const ease = (t: number) => t * t * (3 - 2 * t);
const tmp = new Vector3();

/** Point de vue le long de la visite : interpolation entre deux étapes voisines. */
function tourView(value: number, position: Vector3, target: Vector3) {
  const i = Math.min(stations.length - 2, Math.floor(value));
  const t = ease(Math.min(1, Math.max(0, value - i)));
  const a = stations[i].view;
  const b = stations[i + 1].view;
  position.fromArray(a.position).lerp(tmp.fromArray(b.position), t);
  target.fromArray(a.target).lerp(tmp.fromArray(b.target), t);
}

/**
 * Caméra de la pièce. À l'accueil, elle suit la visite (défilement capturé) ; sur une autre route,
 * elle vient devant l'objet de la page et décale le cadrage pour laisser la place au panneau.
 * Pas d'orbite libre : le mouvement suit le visiteur, sans roulis, et s'arrête avec lui.
 */
export function RoomCamera({ spot }: { spot: Spot | null }) {
  const camera = useThree((s) => s.camera as PerspectiveCamera);
  const invalidate = useThree((s) => s.invalidate);
  const state = useMemo(
    () => ({ position: new Vector3(), target: new Vector3(), wantPos: new Vector3(), wantTarget: new Vector3() }),
    [],
  );
  const first = useRef(true);
  const shift = useRef("");

  useEffect(() => {
    tour.invalidate = invalidate;
    return () => {
      tour.invalidate = () => {};
    };
  }, [invalidate]);

  // Changement de route : une image pour lancer le mouvement.
  useEffect(() => invalidate(), [spot, invalidate]);

  useFrame(({ size }, delta) => {
    const instant = first.current || prefersReducedMotion();
    const dt = Math.min(delta, 0.1);

    // La visite avance vers sa cible, puis on publie l'étape courante pour le HUD.
    const before = tour.value;
    tour.value = instant ? tour.target : tour.value + (tour.target - tour.value) * (1 - Math.exp(-TOUR_RATE * dt));
    if (Math.abs(tour.target - tour.value) < 0.001) tour.value = tour.target;
    if (tour.value !== before || first.current) syncStation();

    if (spot) {
      state.wantPos.fromArray(spot.view.position);
      state.wantTarget.fromArray(spot.view.target);
    } else {
      tourView(tour.value, state.wantPos, state.wantTarget);
    }

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
      state.target.distanceToSquared(state.wantTarget) > 1e-6 ||
      tour.value !== tour.target;
    if (moving) invalidate();
  });

  return null;
}
