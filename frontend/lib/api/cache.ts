/**
 * How the public feeds are cached, shared by the server-side client that caches them and
 * the editor that refreshes them (and tells Cécile how long a change can take to show).
 * Not in client.ts, which is server-only and cannot be imported by the editor's pages.
 */

/** How long a response is reused before the next request re-fetches it. */
export const REVALIDATE_SECONDS = 300;

/**
 * The cache tag on each public feed. After a save, the editor's `refreshPublicSite` Server
 * Action expires the matching tag, so Cécile sees her change on the site right away
 * instead of up to REVALIDATE_SECONDS later.
 */
export const PUBLIC_TAGS = ["events", "pricing"] as const;
export type PublicTag = (typeof PUBLIC_TAGS)[number];
