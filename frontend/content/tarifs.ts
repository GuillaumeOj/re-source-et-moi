// "Tarifs" — placeholder pricing. Individual amounts are set; group pricing is
// a placeholder pending Cécile's real figures. Maps onto a future Payload collection.

export type PriceRow = { label: string; price: string };
export type Plan = { name: string; rows: PriceRow[]; note: string };

export const tarifs = {
  title: "Tarifs",
  intro: "Des tarifs pensés pour rester accessibles à chacun. Montants indicatifs, à confirmer.",
  plans: [
    {
      name: "Individuel",
      rows: [
        { label: "Adulte", price: "75 €" },
        { label: "Enfant (jusqu'à 14 ans)", price: "60 €" },
      ],
      note: "Par séance individuelle.",
    },
    {
      name: "Groupe",
      rows: [{ label: "Atelier en groupe", price: "Sur devis" }],
      note: "Tarif de groupe à définir — n'hésitez pas à nous consulter.",
    },
  ] as Plan[],
} as const;
