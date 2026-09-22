// The ordered home page sections. Drives the desktop step indicator and its light/dark
// inversion (`dark`). Each id matches a <section id="…"> in the page, when that section
// renders: Témoignages hides itself with no review published, and the indicator then drops
// its dot. The header and footer navigation is separate — it links to routes, not to these
// anchors (see site.ts).

export type PageSection = {
  id: string;
  label: string;
  /** Section has a dark (rose-sombre) background — the indicator inverts over it. */
  dark?: boolean;
};

export const pageSections: PageSection[] = [
  { id: "top", label: "Accueil" },
  { id: "objet", label: "L'association", dark: true },
  { id: "brain-gym", label: "Brain Gym®" },
  { id: "soi-en-mouvement", label: "Soi en Mouvement®" },
  { id: "ateliers", label: "Ateliers & tarifs" },
  { id: "a-propos", label: "À propos" },
  { id: "temoignages", label: "Témoignages" },
  { id: "contact", label: "Contact" },
];
