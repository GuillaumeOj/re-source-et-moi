"use client";

import { LoaderCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import { temoignages } from "@/content/temoignages";
import { fetchReviewsPage, type Review, type ReviewPage } from "@/lib/api/reviews";

const copy = temoignages.page;

// Tailwind's md and lg breakpoints: two columns from the first, three from the second.
const TWO_COLUMNS = "(min-width: 48rem)";
const THREE_COLUMNS = "(min-width: 64rem)";

function subscribe(onChange: () => void): () => void {
  const queries = [TWO_COLUMNS, THREE_COLUMNS].map((query) => window.matchMedia(query));
  for (const query of queries) query.addEventListener("change", onChange);
  return () => {
    for (const query of queries) query.removeEventListener("change", onChange);
  };
}

function columnCount(): number {
  if (window.matchMedia(THREE_COLUMNS).matches) return 3;
  if (window.matchMedia(TWO_COLUMNS).matches) return 2;
  return 1;
}

// A card's padding and caption, in characters of quote: enough to keep a run of short
// reviews from all landing in the same column.
const CARD_OVERHEAD = 120;

/**
 * Deal the reviews into `count` columns, each into the one that is shortest so far,
 * estimating a card's height by its text length. Dealing in order means the reviews of a
 * newly loaded page only ever go under the ones already placed: nothing already on screen
 * moves, which CSS `columns` would not guarantee (it rebalances every column).
 */
export function dealIntoColumns(reviews: Review[], count: number): Review[][] {
  const columns: Review[][] = Array.from({ length: count }, () => []);
  const heights = new Array<number>(count).fill(0);
  for (const review of reviews) {
    const shortest = heights.indexOf(Math.min(...heights));
    columns[shortest].push(review);
    heights[shortest] += review.text.length + CARD_OVERHEAD;
  }
  return columns;
}

/** "done" once the last page is in: nothing more to load. */
type Status = "idle" | "loading" | "error" | "done";

/**
 * Every published review as a mosaic: columns of cards whose height fits their text, the
 * next page loaded when the visitor nears the bottom. The first page comes rendered from
 * the server; a "Voir plus" button does the same as the scroll, for keyboards and for
 * browsers without IntersectionObserver.
 */
export function ReviewsWall({ initial }: { initial: ReviewPage }) {
  const [reviews, setReviews] = useState(initial.results);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<Status>(initial.next == null ? "done" : "idle");
  const sentinel = useRef<HTMLDivElement>(null);

  // One column on the server and during hydration, then the real count.
  const count = useSyncExternalStore(subscribe, columnCount, () => 1);

  const loadMore = useCallback(async () => {
    setStatus("loading");
    try {
      const next = await fetchReviewsPage(page + 1);
      setReviews((current) => {
        // A review published meanwhile shifts the pages by one; skip what is already shown.
        const shown = new Set(current.map((review) => review.id));
        return [...current, ...next.results.filter((review) => !shown.has(review.id))];
      });
      setPage(page + 1);
      setStatus(next.next == null ? "done" : "idle");
    } catch (error) {
      console.error("[ReviewsWall] next page failed:", error);
      setStatus("error");
    }
  }, [page]);

  useEffect(() => {
    const node = sentinel.current;
    if (!node || status !== "idle" || typeof IntersectionObserver === "undefined") {
      return;
    }
    // Re-created after every load, so a sentinel still in view once a short page has
    // arrived triggers the next load straight away.
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          void loadMore();
        }
      },
      { rootMargin: "0px 0px 600px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [status, loadMore]);

  const columns = useMemo(() => dealIntoColumns(reviews, count), [reviews, count]);

  if (reviews.length === 0) {
    return <p className="mt-12 text-charbon/70">{copy.empty}</p>;
  }

  return (
    <>
      <div className="mt-12 flex items-start gap-6">
        {columns.map((column, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: a column is its position.
          <ul key={index} className="flex min-w-0 flex-1 flex-col gap-6">
            {column.map((review) => (
              <li key={review.id} className="flex">
                <ReviewCard review={review} className="w-full" />
              </li>
            ))}
          </ul>
        ))}
      </div>

      <div ref={sentinel} className="mt-10 flex flex-col items-center gap-3" aria-live="polite">
        {status === "loading" ? (
          <p className="flex items-center gap-2 text-sm text-charbon/70">
            <LoaderCircle size={18} className="animate-spin" aria-hidden="true" />
            {copy.loading}
          </p>
        ) : null}
        {status === "error" ? (
          <>
            <p className="text-sm text-charbon/70">{copy.loadError}</p>
            <MoreButton onClick={loadMore}>{copy.retry}</MoreButton>
          </>
        ) : null}
        {status === "idle" ? <MoreButton onClick={loadMore}>{copy.loadMore}</MoreButton> : null}
      </div>
    </>
  );
}

function MoreButton({ onClick, children }: { onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-rose-sombre shadow-soft transition-colors hover:bg-rose-tendre"
    >
      {children}
    </button>
  );
}
