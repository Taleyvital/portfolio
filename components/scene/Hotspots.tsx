"use client";

import { useEffect, useMemo } from "react";
import { BoxGeometry } from "three";
import { type SpotId, spots } from "@/lib/three/world";

type Props = {
  hovered: SpotId | null;
  setHovered: (id: SpotId | null) => void;
  onSelect: (href: string) => void;
};

// Au-delà de ce déplacement entre l'appui et le relâchement, ce n'était pas un clic.
const CLICK_TOLERANCE_PX = 6;

/**
 * Zones de clic invisibles (aucun draw call) sur les objets qui mènent à une page : panneaux, arche, borne.
 * Raccourci pointeur : chaque destination existe aussi en lien HTML (HUD et menu).
 */
export function Hotspots({ hovered, setHovered, onSelect }: Props) {
  const geometry = useMemo(() => new BoxGeometry(1, 1, 1), []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  // Curseur « main » au survol d'un objet cliquable.
  useEffect(() => {
    document.body.style.cursor = hovered ? "pointer" : "";
    return () => {
      document.body.style.cursor = "";
    };
  }, [hovered]);

  return (
    <>
      {spots.map((s) => (
        <mesh
          key={s.id}
          geometry={geometry}
          position={s.center}
          rotation-y={s.rotationY}
          scale={s.size}
          visible={false}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(s.id);
          }}
          onPointerOut={() => setHovered(null)}
          onClick={(e) => {
            e.stopPropagation();
            if (e.delta > CLICK_TOLERANCE_PX) return;
            // La caméra va bouger sous le pointeur : on oublie le survol en cours.
            setHovered(null);
            onSelect(s.href);
          }}
        />
      ))}
    </>
  );
}
