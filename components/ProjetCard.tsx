import Link from "next/link";
import type { Projet } from "@/lib/projets";

export function ProjetCard({ projet }: { projet: Projet }) {
  return (
    <article className="chip-card">
      <p className="silk">{projet.composant}</p>
      <h3>
        <Link href={`/projets/${projet.slug}`} className="card-link">
          {projet.titre}
        </Link>
      </h3>
      <p className="chip-result">{projet.resultat}</p>
      <ul className="tags" aria-label="Technologies">
        {projet.stack.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
      <span className="chip-cta" aria-hidden="true">Lire l&apos;étude de cas →</span>
    </article>
  );
}
