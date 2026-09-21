import "server-only";

import { type PublicTag, REVALIDATE_SECONDS } from "@/lib/api/cache";
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

/**
 * Where the backend service lives.
 *
 * On Vercel the two services share one project, and `BACKEND_INTERNAL_URL` is injected by
 * the service binding declared in vercel.json. That call is internal: it skips the public
 * CDN, the firewall, and — the reason it matters here — Deployment Protection, which would
 * answer a preview deployment's call to its own public URL with a 401.
 *
 * Bindings are runtime-only, so this throws during a build — which is why every caller
 * awaits `connection()` first (see AgendaList and PricingCards).
 *
 * Locally there is no binding, so API_BASE_URL is set explicitly: the compose service name
 * inside Docker, or localhost when running `bun run dev` on the host.
 */
export function apiBaseUrl(): string {
  const base = process.env.BACKEND_INTERNAL_URL ?? process.env.API_BASE_URL;
  if (!base) {
    throw new Error(
      "Neither BACKEND_INTERNAL_URL (Vercel service binding) nor API_BASE_URL (local) is set.",
    );
  }
  return base.replace(/\/$/, "");
}

async function get<T>(path: string, tag: PublicTag): Promise<T> {
  // NB: `connection()` must NOT be called here, tempting as it is — it would put the
  // build-time opt-out next to the env var that causes it, but awaiting it in the same
  // function that then fetches makes Next hand back an empty body: Django logs a full
  // 821-byte response while this sees content-length 2 and an empty array. It has to be
  // awaited at the render boundary instead, which is why each calling component does it.
  const response = await fetch(`${apiBaseUrl()}/api${path}`, {
    next: { revalidate: REVALIDATE_SECONDS, tags: [tag] },
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`GET /api${path} responded ${response.status}`);
  }

  return response.json() as Promise<T>;
}

/**
 * Published workshops, soonest first: the upcoming ones, or with `range` every one between
 * the two ISO dates (inclusive), past ones included — what the agenda's calendar shows.
 */
export function getEvents(range?: { from: string; to: string }): Promise<Event[]> {
  const query = range
    ? `?${new URLSearchParams({ date_from: range.from, date_to: range.to })}`
    : "";
  return get<Event[]>(`/events/${query}`, "events");
}

/** Published tariff groups, each with its published lines nested. */
export function getPricingTypes(): Promise<PricingType[]> {
  return get<PricingType[]>("/pricing-types/", "pricing");
}
