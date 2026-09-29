// "Mentions légales" — legal notice for the association. French copy lives here
// (not in JSX) so it is centralised and maps cleanly onto a future Payload
// "Globals" entry. The contact e-mail comes from `site` so it changes in one place.

import type { LegalPage } from "./legal";
import { brainGymTrademark, soiEnMouvementTrademark } from "./marques";
import { site } from "./site";

export const mentionsLegales: LegalPage = {
  eyebrow: "Informations légales",
  title: "Mentions légales",
  updatedAt: "25 septembre 2026",
  intro:
    "Conformément à la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique, voici les informations relatives à l'éditeur et à l'hébergeur du présent site.",
  sections: [
    {
      heading: "Éditeur du site",
      body: [
        "Le site re-source-et-moi.fr est édité par l'association Re-Source Et Moi, association régie par la loi du 1er juillet 1901.",
        "Siège social : 11 chemin de la Croix Saint Jacques, 91620 La Ville-du-Bois.",
        "Numéro RNA : W913015531.",
        "Représentée par Cécile Frank, en qualité de présidente.",
        `Contact : ${site.email}.`,
      ],
    },
    {
      heading: "Directrice de la publication",
      body: ["La direction de la publication est assurée par Cécile Frank."],
    },
    {
      heading: "Hébergeur",
      body: [
        "Le site est hébergé par Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis — vercel.com.",
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
        brainGymTrademark.text,
        soiEnMouvementTrademark,
        "Les autres marques et dénominations citées demeurent la propriété de leurs titulaires respectifs.",
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
