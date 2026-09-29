"use client";

import { useCallback, useState } from "react";
import { cn } from "@/lib/cn";
import { EVENTS_PAGE_SIZE, editorApi } from "@/lib/editor/api";
import { type EventActions, EventRow } from "./EventRow";
import { Pagination } from "./Pagination";
import { EventRowSkeleton, SkeletonRegion } from "./Skeleton";
import { LoadError } from "./StatusMessage";
import { usePagedLoad } from "./usePagedLoad";

type Period = "upcoming" | "past";

const PERIODS: { id: Period; label: string; empty: string }[] = [
  { id: "upcoming", label: "À venir", empty: "Aucun atelier à venir." },
  { id: "past", label: "Passés", empty: "Aucun atelier passé." },
];

/**
 * The list view: upcoming workshops (soonest first) or past ones (latest first), twenty
 * per page. The order and the split are the backend's, so a page never mixes the two.
 * Hidden workshops sit among the others with their switch off.
 */
export function EventList({ reloadKey, ...actions }: { reloadKey: number } & EventActions) {
  const [period, setPeriod] = useState<Period>("upcoming");

  const fetchPage = useCallback(
    (page: number) => editorApi.listEvents({ period, page, page_size: EVENTS_PAGE_SIZE }),
    [period],
  );
  // The step back past the end also covers a date moved to the other period.
  const { data, loading, failed, reload, page, setPage, pageCount } = usePagedLoad(
    fetchPage,
    EVENTS_PAGE_SIZE,
    reloadKey,
  );
  const current = PERIODS.find((item) => item.id === period) ?? PERIODS[0];

  return (
    <div className="flex flex-col gap-5">
      <div role="tablist" aria-label="Période" className="flex gap-2">
        {PERIODS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={period === item.id}
            onClick={() => {
              setPeriod(item.id);
              setPage(1);
            }}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
              period === item.id
                ? "bg-rose-tendre text-rose-sombre"
                : "text-charbon/70 hover:bg-rose-tendre/60",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading && (
        <SkeletonRegion label="Chargement des ateliers…" className="flex flex-col gap-3">
          <EventRowSkeleton />
          <EventRowSkeleton />
          <EventRowSkeleton />
        </SkeletonRegion>
      )}
      {failed && <LoadError what="les ateliers" onRetry={reload} />}

      {data !== null &&
        (data.results.length === 0 ? (
          <p className="text-sm text-charbon/60">{current.empty}</p>
        ) : (
          <ul className="flex flex-col gap-3" aria-label={current.label}>
            {data.results.map((event) => (
              <EventRow key={event.id} event={event} {...actions} />
            ))}
          </ul>
        ))}

      <Pagination page={page} pageCount={pageCount} onChange={setPage} />
    </div>
  );
}
