// "Ce qu'ils en retiennent" — placeholder testimonials, brand-voiced.
// Replace with real, consented quotes before launch.

export type Temoignage = { quote: string; author: string; context: string };

export const temoignages = {
  eyebrow: "Ils ont bougé avec nous",
  title: "Ce qu'ils en retiennent",
  items: [
    {
      quote:
        "J'ai retrouvé le plaisir d'apprendre, sans pression. Les mouvements sont simples et je les refais chez moi.",
      author: "Camille",
      context: "Atelier découverte",
    },
    {
      quote:
        "Mon fils se concentre plus facilement avant ses devoirs. Quelques gestes suffisent à changer l'ambiance.",
      author: "Sophie",
      context: "Parent d'élève",
    },
    {
      quote:
        "Une approche concrète et bienveillante. On repart avec des clés utilisables tout de suite.",
      author: "Marc",
      context: "Atelier ECAP",
    },
  ] as Temoignage[],
} as const;
