// "Mentions légales" — legal notice for the association. French copy lives here
// (not in JSX) so it is centralised and maps cleanly onto a future Payload
// "Globals" entry. Identity fields (names, address, RNA number, email, date)
// are left as bracketed placeholders to complete before launch.

import type { LegalPage } from "./legal";

export const mentionsLegales: LegalPage = {
  eyebrow: "Informations légales",
  title: "Mentions légales",
  updatedAt: "[À COMPLÉTER : date de dernière mise à jour]",
  intro:
    "Conformément à la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique, voici les informations relatives à l'éditeur et à l'hébergeur du présent site.",
  sections: [
    {
      heading: "Éditeur du site",
      body: [
        "Le site re-source-et-moi.fr est édité par l'association Re-Source Et Moi, association régie par la loi du 1er juillet 1901.",
        "Siège social : [À COMPLÉTER : adresse postale du siège social].",
        "Numéro RNA : [À COMPLÉTER : numéro d'identification au Répertoire National des Associations].",
        "Représentée par [À COMPLÉTER : nom du/de la représentant·e légal·e], en qualité de président·e.",
        "Contact : [À COMPLÉTER : adresse e-mail de contact].",
      ],
    },
    {
      heading: "Directeur / Directrice de la publication",
      body: [
        "La direction de la publication est assurée par [À COMPLÉTER : nom du/de la directeur·rice de la publication].",
      ],
    },
    {
      heading: "Hébergeur",
      body: [
        "Le site est hébergé par Vercel Inc. [à confirmer], 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis — vercel.com.",
      ],
    },
    {
      heading: "Propriété intellectuelle",
      body: [
        "L'ensemble des contenus présents sur ce site (textes, illustrations, logo, éléments graphiques) est, sauf mention contraire, la propriété de l'association Re-Source Et Moi ou de ses partenaires.",
        "Toute reproduction, représentation ou diffusion, totale ou partielle, sans autorisation écrite préalable, est interdite et constitue une contrefaçon au sens du Code de la propriété intellectuelle.",
      ],
    },
    {
      heading: "Marques déposées",
      body: [
        "Brain Gym® est une marque déposée. Re-Source Et Moi n'est pas affiliée à Breakthroughs International. Les autres marques et dénominations citées demeurent la propriété de leurs titulaires respectifs.",
      ],
    },
    {
      heading: "Données personnelles et cookies",
      body: [
        "Le traitement des données personnelles collectées via ce site, ainsi que l'usage éventuel de cookies, sont détaillés dans notre Politique de confidentialité.",
      ],
    },
  ],
};
