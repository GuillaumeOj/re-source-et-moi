// Newsletter, contact, and footer copy.

export const newsletter = {
  eyebrow: "La lettre mensuelle",
  title: "Le mouvement, directement dans votre boîte",
  subtitle: "Une lettre par mois : un mouvement à essayer, l'agenda des ateliers, rien de plus.",
  placeholder: "votre@email.fr",
  button: "S'inscrire",
  consent: "Pas de spam. Désinscription en un clic.",
} as const;

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
} as const;

export const footer = {
  tagline: "Activer son potentiel par le mouvement.",
  legalNote:
    "Brain Gym® est une marque déposée. Re-Source Et Moi n'est pas affiliée à Breakthroughs International.",
  rights: "Re-Source Et Moi — Association loi 1901.",
  legalLinks: [
    { label: "Mentions légales", href: "#" },
    { label: "Confidentialité", href: "#" },
  ],
} as const;
