// "Le Brain Gym® expliqué" — the method, in plain language, plus the PACE protocol.

export type MethodCard = { title: string; body: string };

export const brainGym = {
  eyebrow: "Qu'est-ce que le Brain Gym®",
  title: "Bouger pour mieux apprendre",
  intro:
    "La kinésiologie éducative repose sur une idée simple : le corps participe à chaque apprentissage. " +
    "Des gestes ciblés réveillent l'attention, relâchent les tensions et remettent le mouvement au service de la pensée.",
  cards: [
    {
      title: "26 mouvements",
      body: "Des gestes simples et précis qui réveillent l'attention, la coordination et l'aisance — partout, sans matériel.",
    },
    {
      title: "La ligne médiane",
      body: "Relier les deux côtés du corps, c'est relier les deux hémisphères : le geste traverse, la pensée suit.",
    },
    {
      title: "Intégration corps-cerveau",
      body: "Quand le corps comprend, le mental s'apaise. L'apprentissage devient plus fluide, moins coûteux.",
    },
  ] as MethodCard[],
  pace: {
    label: "Le protocole PACE",
    intro:
      "Chaque séance commence par quatre repères qui préparent le corps et le cerveau à apprendre ensemble.",
    steps: [
      { letter: "P", word: "Positif", note: "Se poser, créer la sécurité." },
      { letter: "A", word: "Actif", note: "Réveiller le corps en mouvement." },
      { letter: "C", word: "Clair", note: "Libérer l'attention, gagner en clarté." },
      { letter: "É", word: "Énergique", note: "Retrouver l'élan et la disponibilité." },
    ],
  },
} as const;
