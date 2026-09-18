/**
 * Where the editor lives, publicly and internally.
 *
 * Public: the secret first segment of its URL, e.g. "/admin-3f2c…". It comes from
 * EDITOR_PATH, which is server-only. It must never become a NEXT_PUBLIC_ variable,
 * because those are inlined into the JavaScript every visitor downloads.
 *
 * Internal: the editor's pages live in `app/espace-edition`. `proxy.ts` rewrites the
 * secret path onto it and answers direct requests for it with the ordinary 404.
 *
 * The secret keeps the editor off the map of anyone crawling the site. It is not the
 * lock: every read and write behind it still needs Cécile's login (see /api/auth/).
 */

/** The internal route folder, `app/espace-edition`. Never reachable at this name. */
export const EDITOR_ROUTE = "espace-edition";

let warnedMissing = false;

/**
 * The secret path segment, or null when the editor is disabled.
 *
 * This mirrors ADMIN_PATH in backend/config/settings.py, with one difference. On a Vercel
 * deployment a missing value disables the editor instead of failing at startup, because
 * this is read by the proxy in front of every page. Throwing there would take the public
 * site down over a missing setting for a private page. The error is logged instead.
 * Locally it defaults to "admin-local".
 */
export function editorPath(): string | null {
  const configured = process.env.EDITOR_PATH?.trim().replace(/^\/+|\/+$/g, "");
  if (configured) {
    // A value equal to the internal name would be rewritten onto itself and then
    // blocked as a direct hit. Refuse it rather than ship an editor nobody can open.
    return configured === EDITOR_ROUTE ? null : configured;
  }
  if (process.env.VERCEL_ENV === "production" || process.env.VERCEL_ENV === "preview") {
    // Once per process: the proxy calls this on every page request, public ones included.
    if (!warnedMissing) {
      warnedMissing = true;
      console.error("[editor] EDITOR_PATH is not set: the editor is disabled on this deployment.");
    }
    return null;
  }
  return "admin-local";
}
