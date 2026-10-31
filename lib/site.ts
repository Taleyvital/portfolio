// Informations globales du site. Les valeurs marquées [DÉMO] sont à remplacer.

export const site = {
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com", // [DÉMO] domaine final
  locale: "fr_FR",
  nom: "Prénom Nom", // [DÉMO]
  titre: "Alternance Architecte SI",
  ecole: "DIIAGE Dijon",
  accroche:
    "Développeur full-stack qui livre des projets à de vrais clients, en route vers l'architecture des systèmes d'information.", // [DÉMO]
  disponibilite: {
    debut: "Septembre 2027",
    rythme: "3 semaines en entreprise / 1 semaine à l'école", // [DÉMO]
    mobilite: "Dijon, Paris ou télétravail partiel", // [DÉMO]
  },
  liens: {
    cv: "/cv.pdf", // [DÉMO] déposer le fichier dans public/cv.pdf
    email: "contact@example.com", // [DÉMO]
    linkedin: "https://www.linkedin.com/in/votre-profil", // [DÉMO]
    github: "https://github.com/votre-compte", // [DÉMO]
    whatsapp: "https://wa.me/2250000000000", // [DÉMO]
  },
} as const;

export const navigation = [
  { href: "/", label: "Accueil" },
  { href: "/#projets", label: "Projets" },
  { href: "/a-propos", label: "À propos" },
  { href: "/contact", label: "Contact" },
] as const;
