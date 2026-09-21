// Contact and footer copy.

import { routes } from "./routes";

export const contact = {
  eyebrow: "Écrire à l'association",
  title: "Parlons mouvement",
  subtitle:
    "Une question, une envie de bouger, un projet d'atelier ? Laissez-nous un mot, nous vous répondons avec plaisir.",
  fields: {
    name: "Nom",
    email: "Email",
    message: "Message",
  },
  button: "Envoyer",
  // The link to this form from elsewhere on the page (e.g. under an empty agenda).
  cta: "Nous contacter",
} as const;

export const footer = {
  tagline: "Activer son potentiel par le mouvement.",
  rights: "Re-Source Et Moi — Association loi 1901.",
  legalLinks: [
    { label: routes.mentionsLegales.label, href: routes.mentionsLegales.path },
    { label: "Confidentialité", href: routes.confidentialite.path },
  ],
} as const;

// The way from a page about the practices or about Cécile to the workshops.
export const ateliersCta = { label: "Voir les prochains ateliers", href: routes.ateliers.path };
