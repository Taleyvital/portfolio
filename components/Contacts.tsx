import { site } from "@/lib/site";

const contacts = [
  { label: "E-mail", valeur: site.liens.email, href: `mailto:${site.liens.email}`, port: "J1" },
  { label: "WhatsApp", valeur: "Écrire sur WhatsApp", href: site.liens.whatsapp, port: "J2" },
  { label: "LinkedIn", valeur: "Voir le profil", href: site.liens.linkedin, port: "J3" },
  { label: "GitHub", valeur: "Voir les dépôts", href: site.liens.github, port: "J4" },
  { label: "CV", valeur: "Télécharger le PDF", href: site.liens.cv, port: "J5" },
];

export function Contacts() {
  return (
    <ul className="ports" aria-label="Moyens de contact">
      {contacts.map((c) => {
        const externe = c.href.startsWith("http");
        return (
          <li key={c.port}>
            <a
              className="port"
              href={c.href}
              {...(externe ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              <span className="silk" aria-hidden="true">{c.port}</span>
              <span className="port-label">{c.label}</span>
              <span className="port-value">
                {c.valeur}
                {externe && <span className="sr-only"> (nouvel onglet)</span>}
              </span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
