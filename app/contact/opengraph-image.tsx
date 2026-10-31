import { ogContentType, ogImage, ogSize } from "@/lib/og";
import { site } from "@/lib/site";

export const alt = `Contacter ${site.nom}`;
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    repere: "I/O · Ports arrière",
    titre: "Contact",
    sousTitre: "E-mail, WhatsApp, LinkedIn, GitHub et CV",
  });
}
