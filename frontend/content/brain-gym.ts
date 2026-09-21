// "Brain Gym® · Éducation Kinesthésique®" — the home page summary of Cécile's text.
// The full history lives on /nos-pratiques (see pratiques.ts).

import { pratiques } from "./pratiques";
import { routes } from "./routes";
import type { TextCard } from "./types";

export const brainGym = {
  eyebrow: "Brain Gym® · Éducation Kinesthésique®",
  title: "Bouger pour mieux apprendre",
  intro:
    "L'Éducation Kinesthésique® est une approche éducative qui propose des mouvements simples et ludiques, des activités motrices et artistiques. " +
    "Le Brain Gym® en désigne les 26 mouvements : de quoi libérer les blocages liés au stress, retrouver un équilibre global et redonner au corps mobilité et fluidité.",
  cards: [
    {
      title: "Pour qui ?",
      body: "Enfants, adolescents, adultes et seniors. Debout, assis ou couché, en groupe ou en individuel : en classe, à la maison ou au travail.",
    },
    {
      title: "Pour quoi ?",
      body: "Lecture, écriture, concentration, mémoire, organisation, confiance, gestion des émotions et du stress… des outils à utiliser en autonomie, au quotidien.",
    },
    {
      title: "D'où vient-elle ?",
      body: "Mise au point par Paul et Gail Dennison en Californie, elle explore le rôle du mouvement dans l'apprentissage. Les 26 mouvements sont publiés en 1986.",
    },
  ] as TextCard[],
  more: {
    label: "Découvrir l'histoire du Brain Gym®",
    href: `${routes.pratiques.path}#${pratiques.brainGym.id}`,
  },
} as const;
