import type { ComponentType } from "react";
import * as agape from "@/content/projets/agape.mdx";
import * as devisMaker from "@/content/projets/devis-maker.mdx";
import * as djor from "@/content/projets/djor.mdx";
import * as tuttoLegno from "@/content/projets/tutto-legno.mdx";

export type ProjetMeta = {
  slug: string;
  titre: string;
  /** Titre orienté résultat, affiché sous le nom du projet. */
  resultat: string;
  description: string;
  /** Quartier du projet dans la ville 3D, ex. « L'Atelier ». */
  composant: string;
  role: string;
  periode: string;
  stack: string[];
  lien?: string;
  ordre: number;
};

export type Projet = ProjetMeta & { Contenu: ComponentType };

type MdxModule = { default: ComponentType; meta: unknown };

const champs = ["slug", "titre", "resultat", "description", "composant", "role", "periode", "stack", "ordre"] as const;

// Le MDX n'est pas typé : on vérifie au build qu'aucun champ ne manque.
function charger(mod: MdxModule): Projet {
  const meta = mod.meta as Record<string, unknown> | undefined;
  const manquants = champs.filter((c) => meta?.[c] === undefined);
  if (!meta || manquants.length) {
    throw new Error(`Projet MDX incomplet (${String(meta?.slug)}) : ${manquants.join(", ")}`);
  }
  return { ...(meta as ProjetMeta), Contenu: mod.default };
}

export const projets: Projet[] = [agape, devisMaker, djor, tuttoLegno]
  .map(charger)
  .sort((a, b) => a.ordre - b.ordre);

export function getProjet(slug: string): Projet | undefined {
  return projets.find((p) => p.slug === slug);
}
