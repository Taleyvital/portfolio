import Link from "next/link";
import { NavLinks } from "@/components/NavLinks";
import { SceneToggle } from "@/components/scene/SceneToggle";
import { site } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="site-header">
      <nav className="container nav" aria-label="Navigation principale">
        <Link href="/" className="brand">
          <span className="brand-chip" aria-hidden="true" />
          {site.nom}
        </Link>
        <div className="nav-end">
          <NavLinks />
          <SceneToggle />
        </div>
      </nav>
    </header>
  );
}
