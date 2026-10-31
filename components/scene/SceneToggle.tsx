"use client";

import { setSceneMode, useSceneMode } from "@/lib/scene-mode";

/** Bouton « Explorer en 3D / Mode classique ». Son emplacement est réservé dès le rendu serveur (pas de CLS). */
export function SceneToggle() {
  const { ready, capable, mode } = useSceneMode();
  const visible = ready && capable;
  return (
    <button
      type="button"
      className="scene-toggle"
      data-visible={visible}
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
      onClick={() => setSceneMode(mode === "3d" ? "light" : "3d")}
    >
      {mode === "3d" ? "Mode classique" : "Explorer en 3D"}
    </button>
  );
}
