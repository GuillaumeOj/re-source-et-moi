// "L'éducation kinesthésique expliquée" — the method in plain language: the
// midline and its three spatial axes, plus the ECAP protocol.

export type AxisCard = { title: string; body: string };

export const educationKinesthesique = {
  eyebrow: "Qu'est-ce que l'éducation kinesthésique",
  title: "Bouger pour mieux apprendre",
  intro:
    "L'éducation kinesthésique repose sur une idée simple : le corps participe à chaque apprentissage. " +
    "Des mouvements ciblés réveillent l'attention, relâchent les tensions et remettent le geste au service de la pensée.",
  midline: {
    label: "La ligne médiane",
    intro:
      "Traverser la ligne médiane, c'est relier les deux côtés du corps — et donc les deux hémisphères. " +
      "Le mouvement s'organise selon trois axes : accéder aux trois directions de l'espace permet un fonctionnement optimal.",
  },
  axes: [
    {
      title: "Gauche · droite",
      body: "L'axe de la latéralité : lire, écrire, communiquer, coordonner les deux mains.",
    },
    {
      title: "Haut · bas",
      body: "L'axe du centrage : relier la tête et le corps, organiser l'émotion et la raison.",
    },
    {
      title: "Avant · arrière",
      body: "L'axe de la focalisation : s'engager, participer, passer de la compréhension à l'action.",
    },
  ] as AxisCard[],
  ecap: {
    label: "Le protocole ECAP",
    intro:
      "Chaque séance commence par quatre repères qui préparent le corps et le cerveau à apprendre ensemble.",
    steps: [
      { letter: "É", word: "Énergique", note: "Retrouver l'élan et la disponibilité." },
      { letter: "C", word: "Clair", note: "Libérer l'attention, gagner en clarté." },
      { letter: "A", word: "Actif", note: "Réveiller le corps en mouvement." },
      { letter: "P", word: "Positif", note: "Se poser, créer la sécurité." },
    ],
  },
} as const;
