import Link from "next/link";
import { site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <p>
          <span className="silk">REV 1.0</span> {site.nom} · {site.titre} · {site.ecole}
        </p>
        <ul className="footer-links">
          <li><a href={site.liens.cv}>CV (PDF)</a></li>
          <li><a href={site.liens.linkedin} rel="noopener noreferrer">LinkedIn</a></li>
          <li><a href={site.liens.github} rel="noopener noreferrer">GitHub</a></li>
          <li><Link href="/contact">Contact</Link></li>
        </ul>
      </div>
    </footer>
  );
}
