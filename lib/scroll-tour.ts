"use client";

import { useSyncExternalStore } from "react";
import { LAST_STATION } from "@/lib/three/room";

// Visite de la pièce à l'accueil : la molette, le tactile et le clavier font avancer `target` (0 → dernière étape) ;
// la caméra suit `value`, amortie vers `target` dans la boucle de rendu (components/scene/RoomCamera.tsx).
// L'étape courante (arrondi de `value`) est publiée sur html[data-station] pour le HUD.

export const tour = {
  target: 0,
  value: 0,
  /** Branché par la scène : demande une image (frameloop="demand"). */
  invalidate: () => {},
};

let station = 0;
const listeners = new Set<() => void>();

const clamp = (v: number) => Math.max(0, Math.min(LAST_STATION, v));

/** Déplace la cible du défilement, puis demande une image. */
export function nudgeTour(delta: number) {
  tour.target = clamp(tour.target + delta);
  tour.invalidate();
}

export function goToStation(index: number) {
  tour.target = clamp(Math.round(index));
  tour.invalidate();
}

/** Appelé par la caméra quand `value` change : publie l'étape la plus proche. */
export function syncStation() {
  const next = Math.round(tour.value);
  if (next === station) return;
  station = next;
  document.documentElement.dataset.station = String(next);
  listeners.forEach((l) => l());
}

export function useStation() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => station,
    () => 0,
  );
}
