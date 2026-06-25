// The ordered page sections — the single source of truth for section metadata.
// Drives the desktop step indicator, the header/footer nav links (those flagged
// `nav`), and the indicator's light/dark inversion (`dark`). Each id matches a
// <section id="…"> in the page.

export type PageSection = {
  id: string;
  label: string;
  /** Include in the header/footer navigation. */
  nav?: boolean;
  /** Section has a dark (rose-sombre) background — the indicator inverts over it. */
  dark?: boolean;
};

export const pageSections: PageSection[] = [
  { id: "top", label: "Accueil" },
  { id: "brain-gym", label: "Le Brain Gym®", nav: true },
  { id: "approche", label: "Notre approche", nav: true },
  { id: "ateliers", label: "Ateliers", nav: true },
  { id: "a-propos", label: "À propos", nav: true },
  { id: "temoignages", label: "Témoignages" },
  { id: "faq", label: "Questions", nav: true },
  { id: "newsletter", label: "La lettre", dark: true },
  { id: "contact", label: "Contact" },
];
