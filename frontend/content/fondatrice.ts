// "À propos / Fondatrice". `bio` is the home page summary; `fullBio` is Cécile's own
// text, verbatim, shown on /a-propos.

import { partnerSites } from "./marques";
import { routes } from "./routes";

export const fondatrice = {
  eyebrow: "La fondatrice",
  name: "Cécile",
  fullName: "Cécile Frank",
  role: "Enseignante Brain Gym® et Tai-Chi",
  title: "À l'origine de Re-Source Et Moi",
  quote: "Lorsque le corps est remis en mouvement, nos capacités peuvent pleinement s'exprimer.",
  bio: [
    "Je m'appelle Cécile. Certifiée enseignante, instructrice et accompagnante en Brain Gym® et Éducation Kinesthésique® par Brain Gym France, et enseignante de Tai-Chi par l'école « Le Soi en Mouvement® », j'accompagne enfants, adolescents, adultes et seniors dans leur recherche de mieux-être et d'équilibre.",
    "Enseignante en école primaire depuis près de 30 ans, j'intègre chaque jour le Brain Gym® dans ma classe : j'y vois combien le mouvement facilite les apprentissages, renforce la confiance et développe l'autonomie.",
    "J'ai fondé Re-Source Et Moi pour rendre ces pratiques accessibles à tous, en ateliers en petits groupes comme en séances individuelles.",
  ],
  fullBio: [
    "Je m’appelle Cécile.",
    "Certifiée enseignante, instructrice et accompagnante en Brain Gym® et Éducation Kinesthésique® par Brain Gym France, ainsi que certifiée enseignante de Tai-Chi par l'école « Le Soi en Mouvement® », j'accompagne les enfants, les adolescents, les adultes et les seniors dans leur recherche de mieux-être et d'équilibre. L’intention étant de mieux se connaitre en s'observant et en se mettant en mouvement facilement, de manière de plus en plus autonome.",
    "Le mouvement est en effet une formidable ressource.",
    "Il permet à chacun de retrouver de la mobilité, de la fluidité et de la présence à soi. Il favorise l'ancrage, le centrage, la concentration, l'attention et aide à développer ses propres ressources pour faire face aux défis du quotidien.",
    "J'ai fondé «Re-Source Et Moi » afin de rendre ces pratiques accessibles à tous. J'y propose des ateliers en petits groupes, dans un cadre bienveillant où les échanges favorisent les prises de conscience et les expériences partagées, ainsi que des séances individuelles, adaptées aux besoins et aux objectifs de chacun.",
    "Enseignante en école primaire depuis près de 30 ans, j'intègre quotidiennement le Brain Gym® et l'Éducation Kinesthésique® dans ma pratique pédagogique. J'observe chaque jour combien le mouvement facilite les apprentissages, renforce la confiance en soi et permet aux élèves de développer leur autonomie. Au fur et à mesure de l’année scolaire, ils s'approprient progressivement la véritable « boîte à outils » qu'offre le Brain Gym®. Ils apprennent à écouter leurs ressentis, à identifier leurs besoins et à choisir eux-mêmes les mouvements les plus adaptés pour retrouver rapidement un meilleur équilibre. Ces outils les accompagnent dans de nombreux domaines : l'attention, la concentration, la lecture, l'écriture, la mémoire, la communication, l'organisation, la relation ainsi que dans la gestion des émotions et du stress.",
    "Ma démarche repose sur une conviction simple : lorsque le corps est remis en mouvement, les capacités d'apprentissage, d'adaptation et d'épanouissement peuvent pleinement s'exprimer.",
  ],
  page: {
    metaTitle: "À propos de Cécile Frank",
    metaDescription:
      "Cécile Frank, fondatrice de Re-Source Et Moi : enseignante, instructrice et accompagnante Brain Gym® et Éducation Kinesthésique®, enseignante de Tai-Chi « Le Soi en Mouvement® ».",
    subtitle: "Fondatrice à l’origine de Re-Source Et Moi",
    certificationsLabel: "Ses écoles",
    certifications: [partnerSites.brainGymFrance, partnerSites.pointEmergence],
  },
  more: { label: "Lire son parcours", href: routes.aPropos.path },
  photoSrc: "/fondatrice.jpg",
  photoAlt: "Portrait de Cécile Frank, fondatrice de Re-Source Et Moi",
} as const;
