// "Ce qu'ils en retiennent" (home page) and the "Témoignages" page — copy only.
//
// The reviews themselves come from the backend (GET /api/reviews/), written by Cécile in
// the editor's "Témoignages" tab. With none published, the home page section is hidden
// (see Testimonials).

export const temoignages = {
  eyebrow: "Ils ont bougé avec nous",
  title: "Ce qu'ils en retiennent",
  /** How many reviews the home page carousel holds before linking to the full page. */
  homeCount: 5,
  /** Past this many characters a home page review is cut, with a toggle to read on. */
  excerptLength: 200,
  readMore: "Lire la suite",
  readLess: "Réduire",
  previous: "Témoignages précédents",
  next: "Témoignages suivants",
  seeAll: "Voir tous les témoignages",
  page: {
    metaTitle: "Témoignages",
    metaDescription:
      "Ce que retiennent les participants des ateliers et des séances de Re-Source et Moi.",
    intro: "Participants, parents, équipes : ils racontent ce qu'ils ont vécu avec nous.",
    loadMore: "Voir plus de témoignages",
    loading: "Chargement…",
    loadError: "Les témoignages suivants n'ont pas pu être chargés.",
    retry: "Réessayer",
    empty: "Aucun témoignage pour le moment.",
    unavailable:
      "Les témoignages ne sont pas disponibles pour le moment. Revenez un peu plus tard.",
  },
} as const;
