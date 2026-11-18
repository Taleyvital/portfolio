"use client";

import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { initSceneMode, setPaused, setSceneMode, useSceneMode } from "@/lib/scene-mode";
import { goToStation, nudgeLateral, nudgeTour, tour, useStation } from "@/lib/scroll-tour";
import { LAST_STATION, spotForPath } from "@/lib/three/world";

// Chunk séparé : three, R3F et drei ne sont jamais dans le JS initial.
const Scene = dynamic(() => import("@/components/scene/Scene"), { ssr: false });

/** Attend l'événement load, puis un moment d'inactivité du navigateur. */
function usePageSettled() {
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    let idle = 0;
    const go = () => {
      idle = window.requestIdleCallback
        ? window.requestIdleCallback(() => setSettled(true), { timeout: 800 })
        : window.setTimeout(() => setSettled(true), 300);
    };
    if (document.readyState === "complete") go();
    else window.addEventListener("load", go, { once: true });
    return () => {
      window.removeEventListener("load", go);
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
    };
  }, []);
  return settled;
}

// Molette : une étape ≈ 700 px de défilement ; calage sur l'étape la plus proche après une pause.
const WHEEL_STEP = 1 / 700;
const TOUCH_STEP = 1 / 260;
const SNAP_MS = 180;
// Flèches maintenues : l'avatar avance ou glisse en continu, comme dans un jeu.
const HOLD_STATION_RATE = 1.1;
const HOLD_LATERAL_RATE = 2.4;
const MOVE_KEYS = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);

/**
 * Visite du parcours à l'accueil : la molette, le doigt et le clavier pilotent la caméra au lieu de faire
 * défiler la page (choix assumé du propriétaire, comme dans la vidéo de référence). Seulement en mode 3D
 * et à l'accueil ; les panneaux de contenu gardent le défilement natif, et le menu reste un accès direct.
 */
function useCapturedScroll(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    let snap = 0;
    let touchY: number | null = null;
    let moveRaf = 0;
    let lastMove = 0;
    const held = new Set<string>();
    const settle = () => {
      window.clearTimeout(snap);
      snap = window.setTimeout(() => goToStation(tour.target), SNAP_MS);
    };
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return; // zoom du navigateur
      e.preventDefault();
      const px = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * 800 : e.deltaY;
      nudgeTour(Math.max(-0.5, Math.min(0.5, px * WHEEL_STEP)));
      settle();
    };
    const move = (now: number) => {
      const dt = Math.min((now - lastMove) / 1000, 0.05);
      lastMove = now;
      const ahead = (held.has("ArrowUp") ? 1 : 0) - (held.has("ArrowDown") ? 1 : 0);
      const side = (held.has("ArrowRight") ? 1 : 0) - (held.has("ArrowLeft") ? 1 : 0);
      if (ahead) nudgeTour(ahead * HOLD_STATION_RATE * dt);
      if (side) nudgeLateral(side * HOLD_LATERAL_RATE * dt);
      moveRaf = ahead || side ? requestAnimationFrame(move) : 0;
    };
    const startMove = () => {
      if (moveRaf) return;
      lastMove = performance.now();
      moveRaf = requestAnimationFrame(move);
    };
    const stopMove = () => {
      if (moveRaf) cancelAnimationFrame(moveRaf);
      moveRaf = 0;
    };
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0]?.clientY ?? null;
    };
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY;
      if (touchY === null || y === undefined) return;
      e.preventDefault();
      nudgeTour((touchY - y) * TOUCH_STEP);
      touchY = y;
    };
    const onTouchEnd = () => {
      touchY = null;
      goToStation(tour.target);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      const el = document.activeElement;
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return;

      if (MOVE_KEYS.has(e.key)) {
        e.preventDefault();
        window.clearTimeout(snap);
        if (held.has(e.key)) return; // la répétition du clavier est déjà couverte par la boucle
        held.add(e.key);
        // Petit pas immédiat pour qu'un appui bref se voie, puis mouvement continu tant que la touche reste enfoncée.
        if (e.key === "ArrowUp") nudgeTour(0.16);
        else if (e.key === "ArrowDown") nudgeTour(-0.16);
        else if (e.key === "ArrowRight") nudgeLateral(0.24);
        else nudgeLateral(-0.24);
        startMove();
        return;
      }

      const onControl = el instanceof HTMLButtonElement || el instanceof HTMLAnchorElement;
      const current = Math.round(tour.target);
      let next: number | null = null;
      if (e.key === "PageDown" || (e.key === " " && !onControl && !e.shiftKey)) next = current + 1;
      else if (e.key === "PageUp" || (e.key === " " && !onControl && e.shiftKey)) next = current - 1;
      else if (e.key === "Home") next = 0;
      else if (e.key === "End") next = LAST_STATION;
      if (next === null) return;
      e.preventDefault();
      goToStation(next);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (!MOVE_KEYS.has(e.key)) return;
      held.delete(e.key);
      if (held.size === 0) stopMove();
    };
    const onBlur = () => {
      held.clear();
      stopMove();
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.clearTimeout(snap);
      stopMove();
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [enabled]);
}

/** Seule l'étape affichée du HUD est atteignable au clavier et par les lecteurs d'écran. */
function useActiveStation(enabled: boolean) {
  const station = useStation();
  useEffect(() => {
    document.querySelectorAll<HTMLElement>(".tour-step").forEach((el) => {
      el.inert = enabled && el.dataset.step !== String(station);
    });
  }, [enabled, station]);
}

/** Couche 3D persistante, montée une seule fois dans le layout. */
export function SceneRoot() {
  const scene = useSceneMode();
  const settled = usePageSettled();
  const pathname = usePathname();
  const router = useRouter();
  const is3d = scene.ready && scene.mode === "3d";

  useEffect(() => {
    initSceneMode();
  }, []);

  const touring = is3d && scene.loaded && pathname === "/";
  useCapturedScroll(touring);
  useActiveStation(touring);

  // Accueil = parcours plein écran ; autres routes = contenu dans un panneau par-dessus le parcours.
  useEffect(() => {
    document.documentElement.dataset.view = pathname === "/" ? "map" : "panel";
  }, [pathname]);

  // Échap ferme le panneau et ramène au parcours.
  useEffect(() => {
    if (!is3d || pathname === "/") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") router.push("/");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [is3d, pathname, router]);

  // Clic sur un objet : même navigation qu'un lien (URL, historique, bouton Précédent).
  const onSelect = useCallback((href: string) => router.push(href), [router]);

  if (!is3d || !settled) return null;

  return (
    <>
      <div className="scene-layer" data-loaded={scene.loaded} aria-hidden="true">
        <Scene spot={spotForPath(pathname)} paused={scene.paused} debug={scene.debug} onSelect={onSelect} />
      </div>
      <div className="scene-dock" role="group" aria-label="Scène 3D">
        {scene.loaded ? (
          <button type="button" className="dock-btn" onClick={() => setPaused(!scene.paused)}>
            {scene.paused ? "Reprendre les animations" : "Mettre en pause les animations"}
          </button>
        ) : (
          <>
            <span className="silk" role="status">
              <span className="led" aria-hidden="true" /> Chargement du parcours
            </span>
            <button type="button" className="dock-btn" onClick={() => setSceneMode("light")}>
              Passer
            </button>
          </>
        )}
      </div>
    </>
  );
}
