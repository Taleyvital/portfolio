import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjet, projets } from "@/lib/projets";
import { site } from "@/lib/site";

export function generateStaticParams() {
  return projets.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/projets/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const projet = getProjet(slug);
  if (!projet) return {};
  return {
    title: projet.titre,
    description: projet.description,
    alternates: { canonical: `/projets/${projet.slug}` },
    openGraph: { type: "article", title: `${projet.titre} · ${projet.resultat}`, description: projet.description },
  };
}

export default async function PageProjet({ params }: PageProps<"/projets/[slug]">) {
  const { slug } = await params;
  const projet = getProjet(slug);
  if (!projet) notFound();

  const index = projets.indexOf(projet);
  const suivant = projets[(index + 1) % projets.length];
  const { Contenu } = projet;

  const creativeWork = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: projet.titre,
    description: projet.description,
    author: { "@type": "Person", name: site.nom },
    url: `${site.url}/projets/${projet.slug}`,
  };

  return (
    <article className="container page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(creativeWork) }}
      />
      <nav aria-label="Fil d'Ariane" className="breadcrumb">
        <Link href="/#projets">Projets</Link> <span aria-hidden="true">/</span>{" "}
        <span aria-current="page">{projet.titre}</span>
      </nav>

      <header className="page-head">
        <p className="silk">{projet.composant}</p>
        <h1>{projet.titre}</h1>
        <p className="lead">{projet.resultat}</p>
        <dl className="facts">
          <div>
            <dt>Rôle</dt>
            <dd>{projet.role}</dd>
          </div>
          <div>
            <dt>Période</dt>
            <dd>{projet.periode}</dd>
          </div>
          <div>
            <dt>Stack</dt>
            <dd>{projet.stack.join(" · ")}</dd>
          </div>
        </dl>
        {projet.lien && (
          <a className="btn btn-secondary" href={projet.lien} target="_blank" rel="noopener noreferrer">
            Voir le projet en ligne<span className="sr-only"> (nouvel onglet)</span>
          </a>
        )}
      </header>

      <div className="prose">
        <Contenu />
      </div>

      <nav className="next-project" aria-label="Projet suivant">
        <p className="silk">Projet suivant</p>
        <Link href={`/projets/${suivant.slug}`} className="text-link">
          {suivant.titre} : {suivant.resultat} →
        </Link>
      </nav>
    </article>
  );
}
