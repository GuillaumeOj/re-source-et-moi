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
    phone: "Téléphone",
    message: "Message",
  },
  button: "Envoyer",
  sending: "Envoi…",
  sent: "Merci, votre message est bien parti. Nous vous répondons au plus vite.",
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
  // For a visitor who would rather call, or write from their own mailbox, than use the form.
  direct: {
    heading: "Vous préférez joindre Cécile directement ?",
    phone: "Par téléphone :",
    email: "Par e-mail :",
  },
  // Under the form, where the data is collected — what GDPR asks visitors be told there.
  privacy: {
    text: "Vos coordonnées servent uniquement à vous recontacter au sujet de votre demande : elles ne sont utilisées à aucune autre fin et ne sont jamais transmises à des tiers.",
    link: "Politique de confidentialité",
  },
  optionalMessage: "Un mot à ajouter ? (facultatif)",
  errors: {
    name: "Indiquez votre nom.",
    email: "Indiquez une adresse email valide.",
    phone: "Indiquez un numéro de téléphone valide.",
    message: "Écrivez-nous quelques mots.",
    // The backend's own check failed where the form's passed: its messages go under the
    // fields, this goes by the button.
    invalid: "Certains champs sont à corriger, voir ci-dessus.",
    tooMany: "Vous nous avez déjà écrit plusieurs fois. Patientez un peu, ou appelez-nous.",
    failed:
      "Votre message n'a pas pu partir. Réessayez dans un instant, ou joignez Cécile directement (coordonnées ci-dessus).",
  },
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
