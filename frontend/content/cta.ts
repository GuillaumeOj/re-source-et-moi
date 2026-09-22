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
  // The link to the contact page from elsewhere (e.g. under an empty agenda).
  cta: "Nous contacter",
  metaTitle: "Contact",
  metaDescription:
    "Écrivez à Re-Source Et Moi : une question sur nos ateliers, une inscription, un projet — nous vous répondons avec plaisir.",
  // The workshop a visitor arrived with, from an agenda row's "S'inscrire".
  event: {
    heading: "Votre inscription",
    remove: "Retirer cet atelier",
    unavailable: "Cet atelier n'est plus proposé — écrivez-nous quand même.",
    seeWorkshops: "Voir les prochains ateliers",
  },
  optionalMessage: "Un mot à ajouter ? (facultatif)",
  errors: {
    name: "Indiquez votre nom.",
    email: "Indiquez une adresse email valide.",
    message: "Écrivez-nous quelques mots.",
  },
  demo: "Formulaire de démonstration — bientôt connecté.",
} as const;

// The home page's contact section: a pointer to the contact page, not the form itself.
export const contactTeaser = {
  intro:
    "Vous souhaitez en savoir plus sur les ateliers que nous proposons, sur nos méthodes d'apprentissage, etc. ? Écrivez-nous, nous vous répondons avec plaisir.",
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
