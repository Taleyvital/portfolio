import type { Metadata } from "next";
import Contenu from "@/content/contact.mdx";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: `Contacter ${site.nom} : e-mail, WhatsApp, LinkedIn, GitHub et CV.`,
  alternates: { canonical: "/contact" },
  openGraph: { title: `Contact · ${site.nom}`, description: "E-mail, WhatsApp, LinkedIn, GitHub et CV." },
};

export default function Contact() {
  return (
    <div className="container page">
      <header className="page-head">
        <p className="silk">I/O · Ports arrière</p>
        <h1>Contact</h1>
      </header>
      <div className="prose">
        <Contenu />
      </div>
    </div>
  );
}
