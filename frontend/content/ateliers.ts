// "Nos prochains ateliers" — section copy only.
//
// The workshops themselves now come from the backend (GET /api/events/) so Cécile can add
// and remove them from the Django admin without a deploy. What stays here is the editorial
// framing around the list, which is a writing decision rather than data.

export const ateliers = {
  eyebrow: "Prochains rendez-vous",
  title: "Nos prochains ateliers",
  // Shown when the agenda is legitimately empty — after the last workshop has passed,
  // which the old hardcoded list could never be. Like every notice, followed by a link to
  // the contact form.
  empty:
    "Pas d'ateliers programmés pour le moment. Vous pouvez nous contacter pour être tenu informé lorsque de nouvelles dates seront disponibles.",
  // Shown when the backend can't be reached. Deliberately says nothing about dates: an
  // out-of-date workshop list is worse than no list, because someone might turn up.
  unavailable: "Le programme est momentanément indisponible. N'hésitez pas à nous contacter.",
  // The link under the home page's first few workshops, to the full agenda page.
  seeAll: "Voir tout l'agenda",
} as const;

// The /agenda page: every upcoming workshop as a list, or month by month in a calendar
// that can also look back at past ones.
export const agenda = {
  metaTitle: "Agenda des ateliers",
  metaDescription:
    "Tous les ateliers de Re-Source Et Moi — Brain Gym®, ECAP, mouvement et apprentissage — en liste ou mois par mois dans le calendrier.",
  eyebrow: "Agenda",
  title: "Tous nos ateliers",
  intro:
    "Retrouvez les prochains rendez-vous en liste, ou parcourez le calendrier mois par mois, y compris les ateliers passés.",
  views: { list: "Liste", calendar: "Calendrier" },
  viewsLabel: "Affichage de l'agenda",
  monthNavLabel: "Changer de mois",
  calendarLabel: (month: string) => `Ateliers de ${month}`,
  dayLabel: (date: string, count: number) => `${date}, ${count} atelier${count > 1 ? "s" : ""}`,
  previousMonth: "Mois précédent",
  nextMonth: "Mois suivant",
  today: "Aujourd'hui",
  emptyMonth: "Aucun atelier ce mois-ci.",
} as const;
