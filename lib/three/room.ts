// Plan de la pièce 3D : dimensions, points de vue du défilement (accueil) et objets qui ouvrent une page.
// Repère en mètres : sol à y = 0, mur du fond à z = -3, côté ouvert (vers le visiteur) à z = +3.

export type Vec = readonly [x: number, y: number, z: number];
export type View = { position: Vec; target: Vec };

export const ROOM = { width: 8, depth: 6, height: 3 } as const;

/** Étapes du défilement de l'accueil, dans l'ordre. Le contenu HTML de chaque étape est dans RoomHud. */
export const stations = [
  { id: "intro", label: "Accueil", view: { position: [0, 1.75, 5.4], target: [0, 1.35, -1.5] } },
  { id: "projets", label: "Projets", view: { position: [-1.1, 1.6, 1.3], target: [-4, 1.6, -1.3] } },
  { id: "apropos", label: "À propos", view: { position: [-0.15, 1.45, -0.6], target: [-0.15, 1.1, -2.9] } },
  { id: "contact", label: "Contact", view: { position: [1.5, 1.45, 1.2], target: [2.7, 0.45, -1.2] } },
] as const satisfies readonly { id: string; label: string; view: View }[];

export const LAST_STATION = stations.length - 1;

export type SpotId = "apropos" | "agape" | "devis-maker" | "djor" | "tutto-legno" | "contact";

export type Spot = {
  id: SpotId;
  href: string;
  /** Titre et résultat affichés sur le cadre (dupliqués depuis les `meta` MDX : importer lib/projets.ts
   * embarquerait tout le MDX dans le chunk 3D). À garder synchronisés avec content/projets/. */
  title: string;
  subtitle: string;
  hue: string;
  /** Zone de clic : centre et taille. */
  center: Vec;
  size: Vec;
  /** Point de vue quand la page de l'objet est ouverte. */
  view: View;
};

// Cadres des projets, au mur gauche (face intérieure à x = -3.98), en grille 2 × 2.
const FRAME = { w: 1.2, h: 0.72 } as const;
const frame = (id: SpotId, title: string, subtitle: string, hue: string, y: number, z: number): Spot => ({
  id,
  href: `/projets/${id}`,
  title,
  subtitle,
  hue,
  center: [-3.95, y, z],
  size: [0.1, FRAME.h + 0.1, FRAME.w + 0.1],
  view: { position: [-1.5, y, z], target: [-4, y, z] },
});

export const spots: Spot[] = [
  // Vu depuis la pièce, z décroissant = vers la droite : AGAPE en haut à gauche, dans l'ordre de lecture.
  frame("agape", "AGAPE", "Plus de 100 utilisateurs en deux mois, sans store ni publicité", "#ff7aa2", 2.05, -0.6),
  frame("devis-maker", "Devis Maker", "Des devis et factures conformes en moins de 5 minutes", "#29d9ff", 2.05, -2),
  frame("djor", "Djor", "La revente de billets entre particuliers, payée par Mobile Money", "#3ddc84", 1.15, -0.6),
  frame("tutto-legno", "Tutto Legno", "Un site vitrine qui transforme les visites en demandes de devis", "#ffb547", 1.15, -2),
  {
    id: "apropos",
    href: "/a-propos",
    title: "À propos",
    subtitle: "Mon parcours",
    hue: "#b9a8ff",
    center: [-0.2, 1.12, -2.75],
    size: [0.8, 0.5, 0.1],
    view: { position: [0, 1.2, -1.2], target: [-0.2, 1.1, -2.75] },
  },
  {
    id: "contact",
    href: "/contact",
    title: "Contact",
    subtitle: "Me joindre",
    hue: "#3ddc84",
    center: [2.7, 0.5, -1.05],
    size: [0.5, 0.2, 0.4],
    view: { position: [2.2, 1.15, 0.1], target: [2.7, 0.45, -1.05] },
  },
];

export { FRAME };

/** Objet de la pièce correspondant à une route, ou null pour l'accueil (défilement). */
export function spotForPath(pathname: string): Spot | null {
  if (pathname.startsWith("/a-propos")) return spots.find((s) => s.id === "apropos")!;
  if (pathname.startsWith("/contact")) return spots.find((s) => s.id === "contact")!;
  const projet = pathname.match(/^\/projets\/([^/]+)/)?.[1];
  return spots.find((s) => s.id === projet) ?? null;
}
