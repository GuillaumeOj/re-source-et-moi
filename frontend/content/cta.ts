// Contact and footer copy.

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
  legalNote:
    "Brain Gym® est une marque déposée. Re-Source Et Moi n'est pas affiliée à Breakthroughs International.",
  rights: "Re-Source Et Moi — Association loi 1901.",
  legalLinks: [
    { label: "Mentions légales", href: "/mentions-legales" },
    { label: "Confidentialité", href: "/politique-de-confidentialite" },
  ],
} as const;
