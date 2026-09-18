"use server";

import { updateTag } from "next/cache";
import { cookies } from "next/headers";
import { PUBLIC_TAGS, type PublicTag } from "@/lib/api/cache";
import { apiBaseUrl } from "@/lib/api/client";

/**
 * Expire one public feed's cache after the editor saves, so the site shows the change on
 * the next request instead of up to five minutes later.
 *
 * A Server Action is a public endpoint: anyone who finds its id can call it. So before
 * touching the cache it checks the caller's session with Django, forwarding the browser's
 * cookies over the internal service binding. A stranger gets `false` and the cache is
 * left alone. Otherwise anyone could force the site to re-fetch from the backend on every
 * request.
 *
 * `updateTag` rather than `revalidateTag`: the next request waits for fresh data instead
 * of being served the stale copy once more. That is what "read your own writes" needs.
 *
 * Returns whether the refresh happened, so the editor can say "visible now" or "visible
 * within five minutes" truthfully.
 */
export async function refreshPublicSite(tag: PublicTag): Promise<boolean> {
  if (!PUBLIC_TAGS.includes(tag)) {
    return false;
  }

  const cookieHeader = (await cookies()).toString();
  const session = await fetch(`${apiBaseUrl()}/api/auth/session/`, {
    headers: { Accept: "application/json", Cookie: cookieHeader },
    cache: "no-store",
  }).catch((error: unknown) => {
    console.error("[refreshPublicSite] session check failed:", error);
    return null;
  });

  if (!session?.ok) {
    return false;
  }
  updateTag(tag);
  return true;
}
