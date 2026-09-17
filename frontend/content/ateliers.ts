// "Nos prochains ateliers" — placeholder agenda. The owner edits these freely;
// the shape maps directly onto a future Payload "Ateliers" collection.

export type Atelier = {
  day: string;
  month: string;
  title: string;
  schedule: string;
  location: string;
};

export const ateliers = {
  eyebrow: "Prochains rendez-vous",
  title: "Nos prochains ateliers",
  note: "Les dates ci-dessous sont des exemples — à personnaliser avant la mise en ligne.",
  items: [
    {
      day: "14",
      month: "Juin",
      title: "Brain Gym® en mouvement",
      schedule: "Samedi · 10h–12h",
      location: "En ligne",
    },
    {
      day: "28",
      month: "Juin",
      title: "ECAP & apprentissage",
      schedule: "Samedi · 10h–12h",
      location: "Lyon",
    },
    {
      day: "12",
      month: "Juil.",
      title: "La ligne médiane, pas à pas",
      schedule: "Samedi · 10h–12h",
      location: "En ligne",
    },
  ] as Atelier[],
} as const;
