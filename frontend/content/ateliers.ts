// "Nos prochains ateliers" — section copy only.
//
// The workshops themselves now come from the backend (GET /api/events/) so Cécile can add
// and remove them from the Django admin without a deploy. What stays here is the editorial
// framing around the list, which is a writing decision rather than data.

export const ateliers = {
  eyebrow: "Prochains rendez-vous",
  title: "Nos prochains ateliers",
  // Shown when the agenda is legitimately empty — after the last workshop has passed,
  // which the old hardcoded list could never be. Followed by a link to the contact form.
  empty:
    "Pas d'ateliers programmés pour le moment. Vous pouvez nous contacter pour être tenu informé lorsque de nouvelles dates seront disponibles.",
  emptyCta: "Nous contacter",
  // Shown when the backend can't be reached. Deliberately says nothing about dates: an
  // out-of-date workshop list is worse than no list, because someone might turn up.
  unavailable: "Le programme est momentanément indisponible. N'hésitez pas à nous contacter.",
} as const;
