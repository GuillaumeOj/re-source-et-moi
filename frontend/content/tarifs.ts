// "Tarifs" — section copy only.
//
// The amounts now come from the backend (GET /api/pricing-types/) so Cécile can change
// them from the Django admin without a deploy. Only the framing copy stays here — and it
// only renders when there are tariffs to frame: with none set up, the whole sub-section is
// hidden (see PricingSection).

export const tarifs = {
  title: "Tarifs",
  intro: "Des tarifs pensés pour rester accessibles à chacun.",
  // Shown when the backend can't be reached. It names no figures on purpose — showing a
  // stale price is worse than showing none, because someone could arrive expecting it.
  unavailable: "Les tarifs sont momentanément indisponibles. N'hésitez pas à nous contacter.",
} as const;
