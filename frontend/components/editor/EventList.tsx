"use client";

import { useCallback, useState } from "react";
import { cn } from "@/lib/cn";
import { ApiError, EVENTS_PAGE_SIZE, editorApi } from "@/lib/editor/api";
import { type EventActions, EventRow } from "./EventRow";
import { Pagination } from "./Pagination";
import { LoadError } from "./StatusMessage";
import { useLoad } from "./useLoad";

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
  const [page, setPage] = useState(1);

  const fetchPage = useCallback(
    () => editorApi.listEvents({ period, page, page_size: EVENTS_PAGE_SIZE }),
    [period, page],
  );
  const { data, failed, reload } = useLoad(fetchPage, reloadKey, (error) => {
    // DRF answers 404 for a page past the end, e.g. once a deletion (or a date moved to
    // the other period) emptied the last page. Step back rather than fail.
    if (error instanceof ApiError && error.status === 404 && page > 1) {
      setPage(page - 1);
      return true;
    }
    return false;
  });

  const pageCount = data ? Math.max(1, Math.ceil(data.count / EVENTS_PAGE_SIZE)) : 1;
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

      {data === null && !failed && (
        <p role="status" className="text-charbon/60">
          Chargement des ateliers…
        </p>
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
