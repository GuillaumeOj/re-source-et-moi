// Trademark notices and the partner sites they point to.
//
// Brain Gym France requires every site of a Brain Gym instructor to carry the exact
// sentence below — keep it word for word. `brainGymTrademark.text` is the full sentence
// (plain-text contexts such as the mentions légales); the footer renders `lead` followed
// by the linked site so "www.braingym.org" is clickable without changing the wording.

import type { LinkTarget } from "./types";

const brainGymSite: LinkTarget = {
  label: "www.braingym.org",
  href: "https://www.braingym.org",
};

const brainGymLead =
  "Brain Gym® est une marque déposée par Educational Kinesiology Foundation (315 Meigs Rd, #A338, Santa Barbara CA93109 - USA) – ";

export const brainGymTrademark = {
  lead: brainGymLead,
  link: brainGymSite,
  text: `${brainGymLead}${brainGymSite.label}`,
} as const;

export const soiEnMouvementTrademark =
  "Le Soi en Mouvement® est une marque déposée à l'INPI par l'association Point d'Émergence.";

export const partnerSites = {
  brainGymFrance: { label: "Brain Gym France", href: "https://www.braingym.fr" },
  pointEmergence: { label: "Point d'Émergence", href: "https://www.point-emergence.com" },
} satisfies Record<string, LinkTarget>;
