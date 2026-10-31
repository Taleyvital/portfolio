"use client";

import { useSyncExternalStore } from "react";

// Mode d'affichage : « 3d » (canvas derrière le site) ou « light » (HTML seul).
// Le HTML est toujours complet ; ce store ne décide que de la couche 3D.

export type SceneMode = "3d" | "light";
export type SceneReason = "user" | "auto" | "fallback" | "param";

type State = {
  ready: boolean; // false côté serveur et avant l'initialisation client
  capable: boolean; // WebGL2 disponible
  mode: SceneMode;
  reason: SceneReason;
  paused: boolean;
  /** La scène est compilée et affichée. */
  loaded: boolean;
  debug: boolean;
};

const STORAGE_KEY = "scene-mode";
const FALLBACK_KEY = "scene-fallback";

const serverState: State = {
  ready: false,
  capable: false,
  mode: "light",
  reason: "auto",
  paused: false,
  loaded: false,
  debug: false,
};

let state = serverState;
const listeners = new Set<() => void>();

function emit(next: Partial<State>) {
  state = { ...state, ...next };
  document.documentElement.dataset.scene = state.mode === "3d" ? "on" : "off";
  listeners.forEach((l) => l());
}

function read(storage: () => Storage, key: string) {
  try {
    return storage().getItem(key);
  } catch {
    return null;
  }
}

function write(storage: () => Storage, key: string, value: string) {
  try {
    storage().setItem(key, value);
  } catch {
    // Stockage indisponible (navigation privée…) : le choix ne sera simplement pas mémorisé.
  }
}

function hasWebGL2() {
  try {
    return !!document.createElement("canvas").getContext("webgl2");
  } catch {
    return false;
  }
}

/** Calcule le mode initial. Appelé une fois, au montage côté client. */
export function initSceneMode() {
  if (state.ready) return;
  const capable = hasWebGL2();
  const params = new URLSearchParams(window.location.search);
  const forced = params.get("scene");
  const debug = params.has("debug");
  // Mouvement réduit : si la 3D est quand même activée, les animations démarrent en pause.
  const base = {
    ready: true,
    capable,
    debug,
    paused: prefersReducedMotion(),
  };

  // Si le réglage système change pendant la visite, on met en pause aussitôt.
  matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", (e) => {
    if (e.matches) emit({ paused: true });
  });

  if (!capable) return emit({ ...base, mode: "light", reason: "auto" });
  if (forced === "3d" || forced === "light") return emit({ ...base, mode: forced, reason: "param" });

  const saved = read(() => localStorage, STORAGE_KEY);
  if (saved === "3d" || saved === "light") return emit({ ...base, mode: saved, reason: "user" });
  if (read(() => sessionStorage, FALLBACK_KEY)) return emit({ ...base, mode: "light", reason: "fallback" });

  // Desktop capable → 3D automatique ; mobile, mouvement réduit ou économie de données → version légère.
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  const light =
    matchMedia("(prefers-reduced-motion: reduce)").matches ||
    connection?.saveData === true ||
    matchMedia("(pointer: coarse)").matches ||
    !matchMedia("(min-width: 64rem)").matches;

  emit({ ...base, mode: light ? "light" : "3d", reason: "auto" });
}

export function setSceneMode(mode: SceneMode) {
  write(() => localStorage, STORAGE_KEY, mode);
  emit({ mode, reason: "user", paused: prefersReducedMotion() });
}

export function setSceneLoaded(loaded: boolean) {
  if (state.loaded !== loaded) emit({ loaded });
}

/** Repli automatique (performances insuffisantes, contexte WebGL perdu) : mémorisé pour la session. */
export function fallbackToLight() {
  write(() => sessionStorage, FALLBACK_KEY, "1");
  emit({ mode: "light", reason: "fallback" });
}

export function setPaused(paused: boolean) {
  emit({ paused });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useSceneMode() {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => serverState,
  );
}

export function prefersReducedMotion() {
  return typeof window !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}
