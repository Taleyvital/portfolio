import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { PanelBar, RoomHud } from "@/components/scene/RoomHud";
import { SceneRoot } from "@/components/scene/SceneRoot";
import { sceneBootScript } from "@/lib/scene-boot";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { site } from "@/lib/site";
import "./globals.css";

// Polices variables auto-hébergées (sous-ensemble latin, licence OFL) :
// aucun appel réseau au build ni en dev.
const sans = localFont({
  src: "./fonts/ibm-plex-sans-latin.woff2",
  variable: "--font-sans",
  weight: "100 700",
  display: "swap",
});

const mono = localFont({
  src: "./fonts/jetbrains-mono-latin.woff2",
  variable: "--font-mono",
  weight: "100 800",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.nom} · ${site.titre}`,
    template: `%s · ${site.nom}`,
  },
  description: `${site.titre}, ${site.ecole}. ${site.accroche}`,
  openGraph: {
    type: "website",
    title: `${site.nom} · ${site.titre}`,
    description: site.accroche,
    locale: site.locale,
    siteName: site.nom,
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#020605",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning : le script de démarrage pose data-scene/data-view avant React.
    <html lang="fr" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: sceneBootScript }} />
      </head>
      <body>
        <a href="#contenu" className="skip-link">
          Aller au contenu
        </a>
        <SiteHeader />
        <RoomHud />
        <main id="contenu" tabIndex={-1}>
          <PanelBar />
          {children}
        </main>
        <SiteFooter />
        <SceneRoot />
      </body>
    </html>
  );
}
