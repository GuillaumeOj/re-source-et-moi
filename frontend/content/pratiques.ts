// "/nos-pratiques": the history of the two practices, in Cécile's own words (keep them
// verbatim), plus the movement landmarks (midline, three axes, ECAP) that used to be on
// the home page. Each practice's `id` is the anchor the home page summaries link to.

import { partnerSites } from "./marques";
import type { LinkTarget, ProseSection, TextCard } from "./types";

export type Practice = {
  id: string;
  eyebrow: string;
  title: string;
  subsections: ProseSection[];
  link: LinkTarget & { intro: string };
};

export const pratiques = {
  metaTitle: "Nos pratiques : Brain Gym® et Le Soi en Mouvement®",
  metaDescription:
    "L'histoire et les principes du Brain Gym® / Éducation Kinesthésique® et du Soi en Mouvement®, les deux pratiques proposées par Re-Source Et Moi.",
  eyebrow: "Nos pratiques",
  title: "Deux chemins pour se remettre en mouvement",
  intro:
    "Re-Source Et Moi s'appuie sur deux approches complémentaires : le Brain Gym® et l'Éducation Kinesthésique®, qui mettent le mouvement au service des apprentissages, et Le Soi en Mouvement®, un tai-chi guidé par le ressenti.",
  brainGym: {
    id: "brain-gym",
    eyebrow: "Historique du Brain Gym®",
    title: "Brain Gym® et Éducation Kinesthésique®",
    subsections: [
      {
        heading: "Qu'est-ce que le Brain Gym® / l'Education Kinesthésique® ?",
        body: [
          "L’Education Kinesthésique® est une approche éducative qui propose des mouvements simples, ludiques, des activités motrices et artistiques. Le terme Brain Gym® désigne un ensemble de 26 mouvements enseignés dans le stage d’Education Kinesthésique®.",
          "Ces pratiques permettent à chacun de se reconnecter à son plein potentiel ou de le déployer. Elles contribuent à libérer des blocages liés au stress ou à l’anxiété, à retrouver un équilibre global, et à redonner mobilité et fluidité au corps.",
        ],
      },
      {
        heading: "À qui s’adresse cette approche ? Dans quel contexte ? Dans quelle intention ?",
        body: [
          "L’Education Kinesthésique® s’adresse tant à l’enfant qu’à l’adolescent, l’adulte et le sénior.",
          "Elle peut être aisément pratiquée debout, assis ou couché, en groupe ou en individuel, en classe, à la maison, au travail.",
          "Cette approche apporte de véritables outils utilisables de manière autonome dans tous les lieux et pour toutes les situations de la vie quotidienne.",
          "Elle permet une amélioration de l’apprentissage et du fonctionnement impliquant des domaines multiples et variés. Tous les thèmes peuvent être abordés : lecture, écriture, mathématiques, compréhension, organisation, adaptation, communication, attention, écoute, observation, détente en vue de la préparation et le passage d’examens (scolaires ou médicaux), concentration, mémoire, créativité, musique, théâtre, sport, estime de soi, confiance, sécurité, procrastination, relation à soi et à l'autre, gestion des émotions...",
        ],
      },
      {
        heading: "Fondateurs de l’Education Kinesthésique®. Qui l’a mise au point ?",
        body: [
          "Paul Dennison et Gail Dennison sont les fondateurs de l'Éducation Kinesthésique® (Educational Kinesiology ou Edu-K) et les créateurs de la méthode Brain Gym®. Leur travail s'inscrit dans une démarche visant à explorer le rôle du mouvement dans les processus d'apprentissage.",
          "Paul Dennison, né en 1939 aux États-Unis, est enseignant et spécialiste des difficultés d'apprentissage. Ayant lui-même rencontré des difficultés en lecture durant son enfance, il s'intéresse très tôt aux mécanismes qui facilitent l'acquisition des savoirs. Au cours des années 1960, il ouvre plusieurs centres d'accompagnement en Californie destinés aux enfants et aux adultes présentant des difficultés de lecture, d'écriture ou d'apprentissage. Ses observations l'amènent à s'intéresser aux liens entre le développement moteur, la coordination, la perception visuelle et les capacités d'apprentissage.",
          "Gail Dennison, éducatrice du mouvement, artiste et formatrice, apporte à cette réflexion son expérience dans les domaines de la danse, du développement de la vision et des approches corporelles. En rejoignant Paul Dennison au début des années 1980, elle contribue au développement et à la structuration de l'Éducation Kinesthésique®. Ensemble, ils conçoivent une série d'exercices fondés sur le mouvement, regroupés sous le nom de Brain Gym®, dans le but de préparer le corps et l'esprit aux apprentissages.",
          "En 1986, ils publient l'ouvrage Brain Gym: Simple Activities for Whole-Brain Learning, qui présente les 26 mouvements caractéristiques de la méthode. L'année suivante, ils fondent l'Educational Kinesiology Foundation, aujourd'hui connue sous le nom de Breakthroughs International, afin de diffuser leur approche et de former des praticiens dans différents pays.",
          "L'Éducation Kinesthésique® s'est progressivement développée à l'échelle internationale et est aujourd'hui utilisée dans certains contextes éducatifs, de formation et d'accompagnement.",
        ],
      },
    ],
    link: {
      ...partnerSites.brainGymFrance,
      intro: "Pour aller plus loin, rendez-vous sur le site de l'association",
    },
  } satisfies Practice,
  // The movement landmarks, formerly the home page's "Éducation kinesthésique" section.
  reperes: {
    title: "Les repères du mouvement",
    midline: {
      label: "La ligne médiane",
      intro:
        "Traverser la ligne médiane, c'est relier les deux côtés du corps — et donc les deux hémisphères. " +
        "Le mouvement s'organise selon trois axes : accéder aux trois directions de l'espace permet un fonctionnement optimal.",
    },
    axes: [
      {
        title: "Gauche · droite",
        body: "L'axe de la latéralité : lire, écrire, communiquer, coordonner les deux mains.",
      },
      {
        title: "Haut · bas",
        body: "L'axe du centrage : relier la tête et le corps, organiser l'émotion et la raison.",
      },
      {
        title: "Avant · arrière",
        body: "L'axe de la focalisation : s'engager, participer, passer de la compréhension à l'action.",
      },
    ] as TextCard[],
    ecap: {
      label: "Le protocole ECAP",
      intro:
        "Chaque séance commence par quatre repères qui préparent le corps et le cerveau à apprendre ensemble.",
      steps: [
        { letter: "É", word: "Énergique", note: "Retrouver l'élan et la disponibilité." },
        { letter: "C", word: "Clair", note: "Libérer l'attention, gagner en clarté." },
        { letter: "A", word: "Actif", note: "Réveiller le corps en mouvement." },
        { letter: "P", word: "Positif", note: "Se poser, créer la sécurité." },
      ],
    },
  },
  soiEnMouvement: {
    id: "soi-en-mouvement",
    eyebrow: "Historique « Soi en Mouvement® »",
    title: "Le Soi en Mouvement®",
    subsections: [
      {
        heading: "Patrick Ongaro, fondateur de la méthode",
        body: [
          "Patrick Ongaro est un praticien français en approches psychocorporelles et énergétiques, fondateur de l'association Point d'Émergence en 1989 et créateur de la méthode Le Soi en Mouvement®. Il pratique le tai-chi et le qi gong depuis 1981 et a complété sa formation par l'approche psychocorporelle Trager® ainsi que par d'autres méthodes d'accompagnement centrées sur le corps et le développement personnel.",
        ],
      },
      {
        heading: "Un mouvement qui naît du ressenti",
        body: [
          "Sa démarche s'appuie sur une synthèse de plusieurs influences, notamment le tai-chi, le qi gong, le taoïsme et les pratiques de conscience corporelle. Avec Le Soi en Mouvement®, Patrick Ongaro propose une approche dans laquelle le mouvement naît avant tout du ressenti, de la respiration et de la présence à soi, plutôt que de l'exécution de gestes codifiés. Selon lui, cette pratique favorise la fluidité, l'enracinement, la conscience corporelle, le relâchement des tensions et une meilleure connaissance de soi.",
        ],
      },
      {
        heading: "Une voie de transformation personnelle",
        body: [
          "Aujourd'hui, Patrick Ongaro forme des enseignants à cette méthode au sein de l'association Point d'Émergence et anime des stages consacrés au mouvement conscient, au bien-être et au développement personnel. Il présente Le Soi en Mouvement® comme une voie de transformation personnelle qui associe le mouvement, la méditation et la philosophie taoïste dans une recherche d'équilibre entre le corps, le souffle et la conscience.",
        ],
      },
    ],
    link: {
      ...partnerSites.pointEmergence,
      intro: "Pour découvrir l'école et ses stages, rendez-vous sur le site de l'association",
    },
  } satisfies Practice,
} as const;
