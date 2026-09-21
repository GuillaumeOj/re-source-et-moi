// "Questions fréquentes" — the /questions page. Also feeds that page's FAQPage JSON-LD.
// Note: answers avoid medical / "guérison" language per the brand voice.

export type FaqItem = { question: string; answer: string };

export const faq = {
  metaTitle: "Questions fréquentes",
  metaDescription:
    "Pour qui, comment se déroule un atelier, combien de temps dure une séance : les réponses aux questions les plus fréquentes sur les ateliers de Re-Source Et Moi.",
  eyebrow: "Questions fréquentes",
  title: "Vous vous demandez peut-être…",
  intro: "Les réponses aux questions que l'on nous pose le plus souvent sur les ateliers.",
  more: "Vous ne trouvez pas votre réponse ? Écrivez-nous, nous vous répondons avec plaisir.",
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
