import "server-only";

import type { components } from "@/lib/api/generated";

/**
 * Typed reads from the Django backend.
 *
 * The types come from `generated.ts`, which is produced from the backend's OpenAPI schema
 * by `bun run codegen`. Both files are committed and CI fails if regenerating them changes
 * anything, so the two sides cannot drift.
 *
 * Server-only: these run in Server Components so the data lands in the HTML the crawler
 * sees. Fetching in the browser would leave the workshop dates and the prices out of the
 * server-rendered markup — on a marketing site, that means Google never indexes them.
 */

export type Event = components["schemas"]["Event"];
export type PricingType = components["schemas"]["PricingType"];
export type Price = components["schemas"]["Price"];

/** How long a response is reused before the next request re-fetches it. */
const REVALIDATE_SECONDS = 300;

/**
 * Where the backend service lives.
 *
 * On Vercel the two services share one project, and `BACKEND_INTERNAL_URL` is injected by
 * the service binding declared in vercel.json. That call is internal: it skips the public
 * CDN, the firewall, and — the reason it matters here — Deployment Protection, which would
 * answer a preview deployment's call to its own public URL with a 401.
 *
 * Bindings are runtime-only, which is why nothing here runs at build time (see the
 * `connection()` call in Workshops.tsx).
 *
 * Locally there is no binding, so API_BASE_URL is set explicitly: the compose service name
 * inside Docker, or localhost when running `bun run dev` on the host.
 */
function apiBaseUrl(): string {
  const base = process.env.BACKEND_INTERNAL_URL ?? process.env.API_BASE_URL;
  if (!base) {
    throw new Error(
      "Neither BACKEND_INTERNAL_URL (Vercel service binding) nor API_BASE_URL (local) is set.",
    );
  }
  return base.replace(/\/$/, "");
}

async function get<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl()}/api${path}`, {
    next: { revalidate: REVALIDATE_SECONDS },
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`GET /api${path} responded ${response.status}`);
  }

  return response.json() as Promise<T>;
}

/** Published, still-upcoming workshops, soonest first. */
export function getEvents(): Promise<Event[]> {
  return get<Event[]>("/events/");
}

/** Published tariff groups, each with its published lines nested. */
export function getPricingTypes(): Promise<PricingType[]> {
  return get<PricingType[]>("/pricing-types/");
}
