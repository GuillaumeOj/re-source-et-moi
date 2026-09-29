import { request } from "@/lib/api/browser";
import type { ReviewPage } from "@/lib/api/client";

/**
 * The public reviews, read from the browser: the "Témoignages" page loads its next pages
 * here as the visitor scrolls. The first page is rendered on the server (see
 * `getReviews` in client.ts) so it lands in the HTML crawlers see.
 */

// Type-only, so nothing of the server-side client reaches the browser bundle.
export type { Review, ReviewPage } from "@/lib/api/client";

/** One page of published reviews, newest first, at the backend's default size. */
export function fetchReviewsPage(page: number): Promise<ReviewPage> {
  return request<ReviewPage>("GET", `/reviews/?${new URLSearchParams({ page: String(page) })}`);
}
