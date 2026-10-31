import type { ReactNode } from "react";

// Emplacement réservé aux schémas C4 : remplacer par une image ou un SVG.
export function Schema({ titre, children }: { titre: string; children?: ReactNode }) {
  return (
    <figure className="schema">
      <figcaption className="silk">{titre}</figcaption>
      <div className="schema-body">{children}</div>
    </figure>
  );
}
