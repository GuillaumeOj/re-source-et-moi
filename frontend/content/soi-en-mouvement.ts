// "Le Soi en Mouvement®" — the home page summary. The full history lives on
// /nos-pratiques (see pratiques.ts).

import { pratiques } from "./pratiques";
import { routes } from "./routes";
import type { TextCard } from "./types";

export const soiEnMouvement = {
  eyebrow: "Le Soi en Mouvement®",
  title: "Un mouvement qui naît du ressenti",
  intro:
    "Inspiré du tai-chi, du qi gong et de la philosophie taoïste, Le Soi en Mouvement® propose un mouvement guidé par le ressenti, " +
    "la respiration et la présence à soi, plutôt que par l'exécution de gestes codifiés.",
  cards: [
    {
      title: "Fluidité",
      body: "Laisser le geste se déployer librement, sans forcer, au rythme du souffle.",
    },
    {
      title: "Enracinement",
      body: "Retrouver ses appuis et son équilibre, entre le corps, le souffle et la conscience.",
    },
    {
      title: "Conscience corporelle",
      body: "Apprendre à s'observer et à mieux se connaître à travers le mouvement.",
    },
    {
      title: "Relâchement",
      body: "Libérer les tensions accumulées et retrouver un corps plus disponible.",
    },
  ] as TextCard[],
  origin:
    "Une méthode créée par Patrick Ongaro, fondateur de l'association Point d'Émergence en 1989.",
  more: {
    label: "En savoir plus sur Le Soi en Mouvement®",
    href: `${routes.pratiques.path}#${pratiques.soiEnMouvement.id}`,
  },
} as const;
