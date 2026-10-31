import type { Metadata } from "next";
import Link from "next/link";
import { ProjetCard } from "@/components/ProjetCard";
import { projets } from "@/lib/projets";
import { site } from "@/lib/site";

export const metadata: Metadata = { alternates: { canonical: "/" } };

const personne = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: site.nom,
  jobTitle: site.titre,
  url: site.url,
  sameAs: [site.liens.linkedin, site.liens.github],
};

export default function Accueil() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personne) }}
      />

      <section className="container hero" aria-labelledby="titre-hero">
        <div className="hero-main">
          <p className="silk">U1 · CPU</p>
          <h1 id="titre-hero">{site.nom}</h1>
          <p className="hero-title">
            {site.titre} <span className="sep" aria-hidden="true">/</span> {site.ecole}
          </p>
          <p className="lead">{site.accroche}</p>
          <div className="actions">
            <a className="btn btn-primary" href={site.liens.cv}>
              Télécharger le CV
            </a>
            <Link className="btn btn-secondary" href="/contact">
              Me contacter
            </Link>
          </div>
          <ul className="inline-links">
            <li><a href={site.liens.linkedin} rel="noopener noreferrer">LinkedIn</a></li>
            <li><a href={site.liens.github} rel="noopener noreferrer">GitHub</a></li>
          </ul>
        </div>

        <aside className="rtc" aria-label="Disponibilité">
          <p className="silk">
            <span className="led" aria-hidden="true" /> RTC · Disponibilité
          </p>
          <dl>
            <div>
              <dt>Début</dt>
              <dd>{site.disponibilite.debut}</dd>
            </div>
            <div>
              <dt>Rythme</dt>
              <dd>{site.disponibilite.rythme}</dd>
            </div>
            <div>
              <dt>Mobilité</dt>
              <dd>{site.disponibilite.mobilite}</dd>
            </div>
          </dl>
        </aside>
      </section>

      <section id="projets" className="container section" aria-labelledby="titre-projets">
        <header className="section-head">
          <p className="silk">BUS · Projets</p>
          <h2 id="titre-projets">Projets livrés</h2>
          <p className="muted">
            Quatre études de cas : le problème, mon rôle, les décisions prises et le résultat.
          </p>
        </header>
        <div className="grid">
          {projets.map((p) => (
            <ProjetCard key={p.slug} projet={p} />
          ))}
        </div>
      </section>

      <section className="container section split" aria-labelledby="titre-apropos">
        <div>
          <p className="silk">U1 · CPU</p>
          <h2 id="titre-apropos">Du code aux décisions d&apos;architecture</h2>
        </div>
        <div>
          <p className="lead">
            Je livre des applications pour de vrais clients, et je documente chaque projet avec un schéma
            C4 et une courte ADR. {/* [DÉMO] */}
          </p>
          <Link className="text-link" href="/a-propos">
            En savoir plus sur mon parcours →
          </Link>
        </div>
      </section>

      <section className="container section" aria-labelledby="titre-contact">
        <div className="io-band">
          <div>
            <p className="silk">I/O · Contact</p>
            <h2 id="titre-contact">Une alternance ou un projet à discuter ?</h2>
          </div>
          <Link className="btn btn-primary" href="/contact">
            Me contacter
          </Link>
        </div>
      </section>
    </>
  );
}
