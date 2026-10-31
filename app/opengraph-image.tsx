import { ogContentType, ogImage, ogSize } from "@/lib/og";
import { site } from "@/lib/site";

export const alt = `${site.nom}, ${site.titre}`;
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({ repere: "U1 · CPU", titre: site.nom, sousTitre: site.accroche });
}
