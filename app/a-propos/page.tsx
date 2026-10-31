import type { Metadata } from "next";
import Contenu from "@/content/a-propos.mdx";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "À propos",
  description: `Parcours, façon de travailler et stack de ${site.nom}, en recherche d'alternance architecte SI.`,
  alternates: { canonical: "/a-propos" },
  openGraph: { title: `À propos · ${site.nom}`, description: site.accroche },
};

export default function APropos() {
  return (
    <div className="container page">
      <header className="page-head">
        <p className="silk">U1 · CPU</p>
        <h1>À propos</h1>
        <p className="lead">{site.accroche}</p>
      </header>
      <div className="prose">
        <Contenu />
      </div>
    </div>
  );
}
