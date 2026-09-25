// Site-wide configuration and navigation. French copy lives here (not in JSX)
// so it is centralised and maps cleanly onto a future Payload "Globals" entry.

import { contact } from "./cta";
import { routes } from "./routes";
import type { LinkTarget } from "./types";

export const site = {
  name: "Re-Source Et Moi",
  description:
    "Re-Source Et Moi est une association d'Éducation Kinesthésique® (Brain Gym®). " +
    "Par le mouvement, chacun réveille ses ressources pour apprendre, créer et agir avec plus d'aisance.",
  // Replace with the real production domain before launch.
  url: "https://re-source-et-moi.fr",
  locale: "fr_FR",
  email: "contact@re-source-et-moi.fr",
  // Social profiles — left empty until provided (used for JSON-LD sameAs).
  social: [] as Array<{ label: string; href: string }>,
} as const;

// The header and footer navigation: one link per page, not per home page section, so
// the menu reads the same from every page.
export const navLinks: LinkTarget[] = [
  routes.pratiques,
  routes.ateliers,
  routes.aPropos,
  routes.questions,
].map((route) => ({ label: route.label, href: route.path }));

// Header call-to-action, on desktop and in the mobile menu.
export const contactCta = { href: routes.contact.path, label: contact.cta } as const;
