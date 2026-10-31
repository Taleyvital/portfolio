import { notFound } from "next/navigation";
import { ogContentType, ogImage, ogSize } from "@/lib/og";
import { getProjet, projets } from "@/lib/projets";

export const alt = "Étude de cas";
export const size = ogSize;
export const contentType = ogContentType;

export function generateStaticParams() {
  return projets.map((p) => ({ slug: p.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const projet = getProjet((await params).slug);
  if (!projet) notFound();
  return ogImage({ repere: projet.composant, titre: projet.titre, sousTitre: projet.resultat });
}
