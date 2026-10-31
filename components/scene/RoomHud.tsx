import Link from "next/link";
import { TourRail } from "@/components/scene/TourRail";
import { projets } from "@/lib/projets";
import { site } from "@/lib/site";

/**
 * Texte de la visite de la pièce (accueil en mode 3D) : une section par étape, rendue côté serveur.
 * Le CSS n'affiche que l'étape courante (html[data-station]) ; sans attribut, c'est l'intro :
 * le H1 reste l'élément LCP, et nom, disponibilité, CV, LinkedIn, GitHub et contact sont visibles d'emblée.
 */
export function RoomHud() {
  return (
    <div className="room-hud">
      <section className="tour-step tour-intro" data-step="0" aria-labelledby="hud-nom">
        <h1 id="hud-nom">{site.nom}</h1>
        <p className="tour-title">
          {site.titre} <span aria-hidden="true">·</span> {site.ecole}
        </p>
        <p className="tour-facts">
          Dès {site.disponibilite.debut.toLowerCase()} · {site.disponibilite.rythme}
        </p>
        <div className="tour-actions">
          <a className="btn btn-primary" href={site.liens.cv}>
            Télécharger le CV
          </a>
          <Link className="btn btn-secondary" href="/contact">
            Contact
          </Link>
          <a className="btn btn-secondary" href={site.liens.linkedin} rel="noopener noreferrer">
            LinkedIn
          </a>
          <a className="btn btn-secondary" href={site.liens.github} rel="noopener noreferrer">
            GitHub
          </a>
        </div>
        <p className="tour-hint" aria-hidden="true">
          <span className="tour-hint-mouse" /> Faites défiler pour explorer
        </p>
      </section>

      <section className="tour-step tour-side" data-step="1" aria-labelledby="hud-projets">
        <h2 id="hud-projets">Projets livrés</h2>
        <p className="tour-lead">Cliquez un cadre au mur, ou choisissez ici.</p>
        <ul className="tour-list">
          {projets.map((p) => (
            <li key={p.slug}>
              <Link href={`/projets/${p.slug}`}>
                <strong>{p.titre}</strong>
                <span>{p.resultat}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="tour-step tour-side" data-step="2" aria-labelledby="hud-apropos">
        <h2 id="hud-apropos">À propos</h2>
        <p className="tour-lead">{site.accroche}</p>
        <Link className="btn btn-secondary" href="/a-propos">
          Lire mon parcours
        </Link>
      </section>

      <section className="tour-step tour-side" data-step="3" aria-labelledby="hud-contact">
        <h2 id="hud-contact">Contact</h2>
        <p className="tour-lead">
          Alternance dès {site.disponibilite.debut.toLowerCase()}, {site.disponibilite.mobilite.toLowerCase()}.
        </p>
        <ul className="tour-links">
          <li>
            <a href={`mailto:${site.liens.email}`}>{site.liens.email}</a>
          </li>
          <li>
            <a href={site.liens.linkedin} rel="noopener noreferrer">
              LinkedIn
            </a>
          </li>
          <li>
            <a href={site.liens.github} rel="noopener noreferrer">
              GitHub
            </a>
          </li>
        </ul>
        <Link className="btn btn-primary" href="/contact">
          Page contact
        </Link>
      </section>

      <TourRail />
    </div>
  );
}

/** Barre en tête du panneau de contenu, en mode 3D : retour à la pièce (aussi avec Échap). */
export function PanelBar() {
  return (
    <div className="panel-bar">
      <Link href="/" className="text-link">
        ← Retour à la pièce
      </Link>
      <kbd>Échap</kbd>
    </div>
  );
}
