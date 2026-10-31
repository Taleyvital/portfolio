import { ogContentType, ogImage, ogSize } from "@/lib/og";
import { site } from "@/lib/site";

export const alt = `À propos de ${site.nom}`;
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({ repere: "U1 · CPU", titre: "À propos", sousTitre: site.accroche });
}
