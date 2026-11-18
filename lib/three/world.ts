// Plan du parcours extérieur : étapes du défilement, cadrages de la caméra et objets qui ouvrent une page.
// Repère en mètres : sol à y = 0, le chemin part de z = +10 et finit vers z = -26.
// Aucune dépendance à three : ce fichier est aussi lu par le rail d'étapes (chunk principal).

import { add, facingAngle, flip, normalize, pathBasis, pathPoint, type Pt } from "./path";

export type Vec = readonly [x: number, y: number, z: number];
export type View = { position: Vec; target: Vec };

/** Cadrage troisième personne : caméra derrière l'avatar, et point regardé devant lui. */
export type Shot = {
  /** Recul derrière l'avatar, en mètres. */
  back: number;
  /** Décalage latéral (positif = à droite de la marche). */
  side: number;
  /** Hauteur de la caméra. */
  height: number;
  /** Distance regardée devant l'avatar. */
  ahead: number;
  /** Décalage latéral du point regardé. */
  lookSide: number;
  /** Hauteur du point regardé. */
  lookHeight: number;
};

export type Station = {
  id: "intro" | "projets" | "apropos" | "contact";
  label: string;
  /** Position de l'avatar sur le chemin (0 → 1). */
  s: number;
  shot: Shot;
};

/** Étapes du défilement de l'accueil, dans l'ordre. Le contenu HTML de chaque étape est dans RoomHud. */
export const stations = [
  {
    id: "intro",
    label: "Accueil",
    s: 0.03,
    shot: { back: 4.8, side: 1, height: 2.15, ahead: 4.2, lookSide: 0, lookHeight: 1.45 },
  },
  {
    id: "projets",
    label: "Projets",
    s: 0.34,
    shot: { back: 7.4, side: 0.8, height: 3.3, ahead: 6.2, lookSide: 0, lookHeight: 1.6 },
  },
  {
    id: "apropos",
    label: "À propos",
    s: 0.7,
    shot: { back: 4.4, side: 1.1, height: 1.85, ahead: 4.4, lookSide: 0, lookHeight: 2.05 },
  },
  {
    id: "contact",
    label: "Contact",
    s: 0.94,
    shot: { back: 3.6, side: -0.9, height: 1.9, ahead: 3.2, lookSide: 0, lookHeight: 1.4 },
  },
] as const satisfies readonly Station[];

export const LAST_STATION = stations.length - 1;

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const ease = (t: number) => t * t * (3 - 2 * t);

/** Position de l'avatar sur le chemin pour une étape fractionnaire de la visite. */
export function stationPathS(value: number) {
  const v = clamp(value, 0, LAST_STATION);
  const i = Math.min(stations.length - 2, Math.floor(v));
  const t = ease(clamp(v - i, 0, 1));
  return stations[i].s + (stations[i + 1].s - stations[i].s) * t;
}

/** Cadrage interpolé entre deux étapes voisines. */
export function stationShot(value: number): Shot {
  const v = clamp(value, 0, LAST_STATION);
  const i = Math.min(stations.length - 2, Math.floor(v));
  const t = ease(clamp(v - i, 0, 1));
  const a = stations[i].shot;
  const b = stations[i + 1].shot;
  const mix = (k: keyof Shot) => a[k] + (b[k] - a[k]) * t;
  return {
    back: mix("back"),
    side: mix("side"),
    height: mix("height"),
    ahead: mix("ahead"),
    lookSide: mix("lookSide"),
    lookHeight: mix("lookHeight"),
  };
}

export type SpotId = "apropos" | "agape" | "devis-maker" | "djor" | "tutto-legno" | "contact";
export type SpotKind = "pavilion" | "arch" | "kiosk";

export type Spot = {
  id: SpotId;
  kind: SpotKind;
  href: string;
  /** Titre et résultat affichés sur le panneau (dupliqués depuis les `meta` MDX : importer lib/projets.ts
   * embarquerait tout le MDX dans le chunk 3D). À garder synchronisés avec content/projets/. */
  title: string;
  subtitle: string;
  hue: string;
  /** Panneau cliquable : centre, dimensions et orientation (le plan regarde +z avant rotation). */
  center: Vec;
  size: Vec;
  rotationY: number;
  /** Où se tient l'avatar quand la page est ouverte, et dans quelle direction il regarde. */
  anchor: Pt;
  facing: Pt;
  /** Point de vue quand la page de l'objet est ouverte. */
  view: View;
};

// Place des projets : le chemin s'élargit en une clairière, deux rangées de panneaux face au visiteur.
const PLAZA_S = 0.34;
const plaza = pathBasis(PLAZA_S);

function pavilion(
  id: SpotId,
  title: string,
  subtitle: string,
  hue: string,
  side: number,
  along: number,
): Spot {
  const pos = add(add(plaza.p, plaza.r, side), plaza.f, along);
  const n = normalize({ x: plaza.p.x - pos.x, z: plaza.p.z - pos.z });
  const xAxis = { x: Math.cos(facingAngle(n)), z: -Math.sin(facingAngle(n)) };
  const rotationY = facingAngle(n);
  return {
    id,
    kind: "pavilion",
    href: `/projets/${id}`,
    title,
    subtitle,
    hue,
    center: [pos.x, 1.5, pos.z],
    size: [2.7, 1.7, 0.26],
    rotationY,
    anchor: add(pos, n, 2),
    facing: flip(n),
    // Caméra décalée sur le côté : l'avatar ne masque pas le panneau.
    view: {
      position: [pos.x + n.x * 3.8 + xAxis.x * 1.8, 1.6, pos.z + n.z * 3.8 + xAxis.z * 1.8],
      target: [pos.x, 1.45, pos.z],
    },
  };
}

// Arche de l'À propos : le chemin passe dessous, l'écran fait face à l'arrivant.
const arch = pathBasis(0.76);
const archN = flip(arch.f);

// Borne de contact : au bout du chemin, face à l'arrivant.
const end = pathBasis(1);
const kioskPos = add(end.p, end.f, 1.4);
const kioskN = flip(end.f);
const kioskX = { x: Math.cos(facingAngle(kioskN)), z: -Math.sin(facingAngle(kioskN)) };

export const spots: Spot[] = [
  pavilion("agape", "AGAPE", "Plus de 100 utilisateurs en deux mois, sans store ni publicité", "#ff7aa2", -4.4, 1.2),
  pavilion("devis-maker", "Devis Maker", "Des devis et factures conformes en moins de 5 minutes", "#29d9ff", 4.4, 1.2),
  pavilion("djor", "Djor", "La revente de billets entre particuliers, payée par Mobile Money", "#3ddc84", -5.2, 4),
  pavilion("tutto-legno", "Tutto Legno", "Un site vitrine qui transforme les visites en demandes de devis", "#ffb547", 5.2, 4),
  {
    id: "apropos",
    kind: "arch",
    href: "/a-propos",
    title: "À propos",
    subtitle: "Mon parcours, mes décisions, la suite",
    hue: "#b9a8ff",
    center: [arch.p.x, 2.2, arch.p.z],
    size: [3.5, 1, 0.34],
    rotationY: facingAngle(archN),
    anchor: pathPoint(0.68),
    facing: pathBasis(0.68).f,
    view: {
      position: [pathPoint(0.62).x, 1.75, pathPoint(0.62).z],
      target: [arch.p.x, 2.15, arch.p.z],
    },
  },
  {
    id: "contact",
    kind: "kiosk",
    href: "/contact",
    title: "Contact",
    subtitle: "Me joindre",
    hue: "#3ddc84",
    center: [kioskPos.x + kioskN.x * 0.44, 1.45, kioskPos.z + kioskN.z * 0.44],
    size: [0.85, 1.3, 0.3],
    rotationY: facingAngle(kioskN),
    anchor: pathPoint(0.99),
    facing: kioskN,
    view: {
      position: [kioskPos.x + kioskN.x * 4.2 + kioskX.x * 1.6, 1.65, kioskPos.z + kioskN.z * 4.2 + kioskX.z * 1.6],
      target: [kioskPos.x, 1.4, kioskPos.z],
    },
  },
];

/** Objet du parcours correspondant à une route, ou null pour l'accueil (défilement). */
export function spotForPath(pathname: string): Spot | null {
  if (pathname.startsWith("/a-propos")) return spots.find((s) => s.id === "apropos")!;
  if (pathname.startsWith("/contact")) return spots.find((s) => s.id === "contact")!;
  const projet = pathname.match(/^\/projets\/([^/]+)/)?.[1];
  return spots.find((s) => s.id === projet) ?? null;
}

/** Repères du décor, lus par World. */
export const PLAZA = { s: PLAZA_S, center: plaza.p, forward: plaza.f, right: plaza.r } as const;
export const ARCH = { s: 0.76, center: arch.p, forward: arch.f, normal: archN } as const;
export const KIOSK = { center: kioskPos, normal: kioskN, xAxis: kioskX } as const;
export const WORLD = { pathWidth: 2.6, ground: 160 } as const;
