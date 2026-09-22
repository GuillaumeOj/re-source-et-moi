// Every public page: its path, the name it goes by (header, footer, breadcrumb) and its
// sitemap entry. The one place a page is declared — the nav, the sitemap, canonical URLs,
// breadcrumbs and in-content links all read from here, so renaming a route is one edit.
// (next.config.ts keeps the /agenda redirect as literal strings: it is config, not copy.)

import type { MetadataRoute } from "next";

type Sitemap = Pick<MetadataRoute.Sitemap[number], "changeFrequency" | "priority">;

export type Route = { path: string; label: string; sitemap: Sitemap };

export const routes = {
  home: { path: "/", label: "Accueil", sitemap: { changeFrequency: "monthly", priority: 1 } },
  pratiques: {
    path: "/nos-pratiques",
    label: "Nos pratiques",
    sitemap: { changeFrequency: "monthly", priority: 0.8 },
  },
  ateliers: {
    path: "/ateliers",
    label: "Ateliers & tarifs",
    sitemap: { changeFrequency: "weekly", priority: 0.8 },
  },
  aPropos: {
    path: "/a-propos",
    label: "À propos",
    sitemap: { changeFrequency: "monthly", priority: 0.7 },
  },
  questions: {
    path: "/questions",
    label: "Questions",
    sitemap: { changeFrequency: "monthly", priority: 0.6 },
  },
  contact: {
    path: "/contact",
    label: "Contact",
    sitemap: { changeFrequency: "yearly", priority: 0.5 },
  },
  mentionsLegales: {
    path: "/mentions-legales",
    label: "Mentions légales",
    sitemap: { changeFrequency: "yearly", priority: 0.3 },
  },
  confidentialite: {
    path: "/politique-de-confidentialite",
    label: "Politique de confidentialité",
    sitemap: { changeFrequency: "yearly", priority: 0.3 },
  },
} satisfies Record<string, Route>;

/** The query parameter that carries the workshop a visitor wants to sign up for. */
export const CONTACT_EVENT_PARAM = "atelier";

/** The contact page — opened on a workshop to sign up for when `eventId` is given. */
export function contactHref(eventId?: string): string {
  const { path } = routes.contact;
  return eventId ? `${path}?${new URLSearchParams({ [CONTACT_EVENT_PARAM]: eventId })}` : path;
}
