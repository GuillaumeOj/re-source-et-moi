// "Questions fréquentes". Also feeds the FAQPage JSON-LD for SEO.
// Note: answers avoid medical / "guérison" language per the brand voice.

export type FaqItem = { question: string; answer: string };

export const faq = {
  eyebrow: "Questions fréquentes",
  title: "Vous vous demandez peut-être…",
  items: [
    {
      question: "C'est pour qui ?",
      answer:
        "Pour tout le monde : enfants, adolescents, adultes. Aucun prérequis — chacun avance à son rythme et selon ses besoins.",
    },
    {
      question: "Faut-il être souple ou sportif ?",
      answer:
        "Non. Les mouvements du Brain Gym® sont simples, doux et accessibles. Il s'agit de coordination et d'attention, pas de performance physique.",
    },
    {
      question: "Comment se déroule un atelier ?",
      answer:
        "Chaque séance commence par le protocole ECAP pour préparer le corps et le cerveau, puis explore quelques mouvements à reproduire ensuite chez soi.",
    },
    {
      question: "Combien de temps dure une séance ?",
      answer:
        "Comptez environ deux heures. Les ateliers se déroulent en petit groupe, en ligne ou en présentiel selon l'agenda.",
    },
  ] as FaqItem[],
} as const;
