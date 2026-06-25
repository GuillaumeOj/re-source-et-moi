// "Notre approche" — Mission / Valeurs / Ton / Promesse, adapted from the brand guide.

export type ValueCard = { title: string; body: string };

export const approche = {
  eyebrow: "Notre approche",
  title: "Une intention dans chaque geste",
  cards: [
    {
      title: "Mission",
      body: "Rendre la kinésiologie éducative accessible, pour que chacun puisse, par le mouvement, lever ses blocages et retrouver sa joie naturelle d'apprendre.",
    },
    {
      title: "Valeurs",
      body: "Mouvement, intégration corps-cerveau, activation, exploration et bienveillance — au cœur de chaque atelier.",
    },
    {
      title: "Ton",
      body: "Encourageant, ancré et concret. Un langage qui active sans contraindre, qui propose des clés sans imposer de réponses.",
    },
    {
      title: "Promesse",
      body: "Grâce aux 26 mouvements du Brain Gym®, chacun redécouvre sa capacité naturelle à apprendre — dans son corps, à son rythme, avec confiance.",
    },
  ] as ValueCard[],
} as const;
