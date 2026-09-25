// "Politique de confidentialité" — RGPD privacy policy. French copy lives here
// (not in JSX) so it is centralised and maps cleanly onto a future Payload
// "Globals" entry. The contact e-mail comes from `site` so it changes in one place.

import type { LegalPage } from "./legal";
import { site } from "./site";

export const confidentialite: LegalPage = {
  eyebrow: "Protection des données",
  title: "Politique de confidentialité",
  updatedAt: "25 septembre 2026",
  intro:
    "L'association Re-Source Et Moi accorde une grande importance à la protection de votre vie privée. Cette politique explique quelles données nous collectons, pourquoi, et comment vous pouvez exercer vos droits, conformément au Règlement Général sur la Protection des Données (RGPD).",
  sections: [
    {
      heading: "Responsable du traitement",
      body: [
        "Le responsable du traitement des données est l'association Re-Source Et Moi, représentée par Cécile Frank.",
        `Pour toute question relative à vos données, vous pouvez nous écrire à ${site.email}.`,
      ],
    },
    {
      heading: "Données que nous collectons",
      body: [
        "Lorsque vous utilisez le formulaire de la page contact, nous collectons les données que vous nous transmettez : votre nom, votre adresse e-mail, le contenu de votre message et, si vous vous inscrivez à un atelier, l'atelier choisi.",
        "Aucune autre donnée personnelle n'est collectée à votre insu lors de votre navigation.",
      ],
    },
    {
      heading: "Finalités du traitement",
      body: [
        "Les données collectées servent uniquement à répondre à vos demandes, à échanger avec vous et, le cas échéant, à gérer votre participation aux ateliers de l'association.",
      ],
    },
    {
      heading: "Base légale",
      body: [
        "Le traitement de vos données repose sur votre consentement, recueilli au moment où vous nous adressez un message, ainsi que sur l'intérêt légitime de l'association à répondre à vos sollicitations.",
      ],
    },
    {
      heading: "Durée de conservation",
      body: [
        "Vos données sont conservées le temps nécessaire au traitement de votre demande, puis pendant une durée maximale de trois ans à compter de notre dernier échange, avant d'être supprimées ou anonymisées.",
      ],
    },
    {
      heading: "Destinataires des données",
      body: [
        "Vos données sont destinées aux seuls membres habilités de l'association. Elles ne sont ni vendues, ni cédées à des tiers.",
        "Elles peuvent transiter par notre hébergeur technique dans le cadre strict du fonctionnement du site.",
      ],
    },
    {
      heading: "Cookies",
      body: [
        "Ce site n'utilise pas de cookies de suivi ni de mesure d'audience à des fins publicitaires. Seuls d'éventuels cookies strictement nécessaires au bon fonctionnement du site peuvent être déposés.",
      ],
    },
    {
      heading: "Vos droits",
      body: [
        "Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, d'effacement, d'opposition, de limitation et de portabilité de vos données.",
        `Pour exercer ces droits, écrivez-nous à ${site.email}. Vous pouvez également introduire une réclamation auprès de la CNIL (www.cnil.fr).`,
      ],
    },
    {
      heading: "Contact",
      body: [
        `Pour toute question concernant cette politique de confidentialité, contactez-nous à ${site.email}.`,
      ],
    },
  ],
};
