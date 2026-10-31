import type { MetadataRoute } from "next";
import { projets } from "@/lib/projets";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/a-propos", "/contact", ...projets.map((p) => `/projets/${p.slug}`)];
  return pages.map((chemin) => ({
    url: `${site.url}${chemin}`,
    changeFrequency: "monthly",
    priority: chemin === "" ? 1 : 0.8,
  }));
}
