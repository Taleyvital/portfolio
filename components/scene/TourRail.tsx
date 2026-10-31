"use client";

import { goToStation, useStation } from "@/lib/scroll-tour";
import { stations } from "@/lib/three/room";

/** Points d'étape de la visite : on peut sauter directement à une étape, à la souris ou au clavier. */
export function TourRail() {
  const current = useStation();
  return (
    <nav className="tour-rail" aria-label="Étapes de la visite">
      <ol>
        {stations.map((s, i) => (
          <li key={s.id}>
            <button type="button" aria-current={i === current ? "step" : undefined} onClick={() => goToStation(i)}>
              <span className="tour-rail-dot" aria-hidden="true" />
              <span className="tour-rail-label">{s.label}</span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
