// Site-wide configuration and navigation. French copy lives here (not in JSX)
// so it is centralised and maps cleanly onto a future Payload "Globals" entry.

import { pageSections } from "./sections";

export const site = {
  name: "Re-Source Et Moi",
  description:
    "Re-Source Et Moi est une association de kinésiologie éducative (Brain Gym®). " +
    "Par le mouvement, chacun réveille ses ressources pour apprendre, créer et agir avec plus d'aisance.",
  // Replace with the real production domain before launch.
  url: "https://re-source-et-moi.fr",
  locale: "fr_FR",
  email: "contact@re-source-et-moi.fr",
  // Social profiles — left empty until provided (used for JSON-LD sameAs).
  social: [] as Array<{ label: string; href: string }>,
} as const;

export type NavLink = { label: string; href: string };

// Derived from the page sections flagged `nav` — single source of truth, so
// the nav and the step indicator can never drift apart.
export const navLinks: NavLink[] = pageSections
  .filter((section) => section.nav)
  .map((section) => ({ label: section.label, href: `#${section.id}` }));
