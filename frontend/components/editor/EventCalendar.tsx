"use client";

import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  addMonths,
  firstOf,
  formatMonthHeading,
  isInMonth,
  type Month,
  monthGrid,
  monthOf,
  WEEKDAYS,
} from "@/lib/calendar";
import { cn } from "@/lib/cn";
import { editorApi, type ManagedEvent } from "@/lib/editor/api";
import { capitalise, formatFullDate, formatTime, parisToday } from "@/lib/format";
import { type EventActions, EventRow } from "./EventRow";
import { IconButton } from "./IconButton";
import { LoadError } from "./StatusMessage";
import { useLoad } from "./useLoad";

/** How many workshops a day cell lists before summarising the rest as "+ N". */
const CHIPS_PER_DAY = 3;

type EventCalendarProps = {
  reloadKey: number;
  /** Open the form for a new workshop on this date. */
  onCreate: (isoDate: string) => void;
} & EventActions;

/**
 * The calendar view: one month, Monday first, six weeks tall.
 *
 * Clicking a workshop in a day opens it for editing. Clicking a day's number selects the
 * day, and the panel under the grid lists that day's workshops with every action plus
 * "Ajouter un atelier ce jour". On a phone the cells are too narrow for titles, so they
 * show a count and the panel does all the work.
 */
export function EventCalendar({ reloadKey, onCreate, ...actions }: EventCalendarProps) {
  const today = parisToday();
  const [month, setMonth] = useState<Month>(() => monthOf(today));
  const [selected, setSelected] = useState(today);

  const days = useMemo(() => monthGrid(month), [month]);
  const fetchMonth = useCallback(
    () => editorApi.listAllEvents(days[0], days[days.length - 1]),
    [days],
  );
  const { data: events, failed, reload } = useLoad(fetchMonth, reloadKey);

  const byDay = useMemo(() => {
    const map = new Map<string, ManagedEvent[]>();
    for (const event of events ?? []) {
      map.set(event.date, [...(map.get(event.date) ?? []), event]);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.start_time.localeCompare(b.start_time));
    }
    return map;
  }, [events]);

  function goTo(target: Month) {
    setMonth(target);
    // Keep a selection inside the month on screen: today if it is there, else the 1st.
    setSelected(isInMonth(today, target) ? today : firstOf(target));
  }

  const weeks = Array.from({ length: 6 }, (_, week) => days.slice(week * 7, week * 7 + 7));
  const selectedEvents = byDay.get(selected) ?? [];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <IconButton label="Mois précédent" onClick={() => goTo(addMonths(month, -1))}>
            <ChevronLeft size={20} aria-hidden="true" />
          </IconButton>
          <h2 className="min-w-44 text-center text-2xl" aria-live="polite">
            {formatMonthHeading(month)}
          </h2>
          <IconButton label="Mois suivant" onClick={() => goTo(addMonths(month, 1))}>
            <ChevronRight size={20} aria-hidden="true" />
          </IconButton>
        </div>
        <button
          type="button"
          onClick={() => goTo(monthOf(today))}
          className="rounded-full px-4 py-2 text-sm font-semibold text-rose-sombre hover:bg-rose-tendre"
        >
          Aujourd'hui
        </button>
      </div>

      {failed && <LoadError what="les ateliers" onRetry={reload} />}

      <table
        className="w-full table-fixed border-separate border-spacing-1"
        aria-label={`Ateliers de ${formatMonthHeading(month)}`}
        aria-busy={events === null}
      >
        <thead>
          <tr>
            {WEEKDAYS.map((day) => (
              <th
                key={day}
                scope="col"
                className="pb-1 text-xs font-semibold uppercase tracking-wide text-charbon/60"
              >
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week) => (
            <tr key={week[0]}>
              {week.map((day) => {
                const dayEvents = byDay.get(day) ?? [];
                const inMonth = isInMonth(day, month);
                const isToday = day === today;
                const isSelected = day === selected;
                return (
                  <td
                    key={day}
                    className={cn(
                      "h-14 rounded-2xl p-1 align-top sm:h-28 sm:p-1.5",
                      inMonth ? "bg-white" : "bg-white/40",
                      isSelected && "ring-2 ring-rose-vif",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setSelected(day)}
                      aria-pressed={isSelected}
                      aria-label={`${formatFullDate(day)}${
                        dayEvents.length ? `, ${dayEvents.length} atelier(s)` : ""
                      }`}
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold",
                        isToday
                          ? "bg-rose-sombre text-creme"
                          : inMonth
                            ? "text-charbon hover:bg-rose-tendre"
                            : "text-charbon/40 hover:bg-rose-tendre",
                      )}
                    >
                      {Number(day.slice(8))}
                    </button>

                    {/* Phone: a count; the panel below lists them. */}
                    {dayEvents.length > 0 && (
                      <span
                        aria-hidden="true"
                        className="mt-1 ml-1 inline-block h-2 w-2 rounded-full bg-rose-vif sm:hidden"
                      />
                    )}

                    <ul className="mt-1 hidden flex-col gap-1 sm:flex">
                      {dayEvents.slice(0, CHIPS_PER_DAY).map((event) => (
                        <li key={event.id}>
                          <button
                            type="button"
                            onClick={() => actions.onEdit(event)}
                            title={`Modifier « ${event.title} »`}
                            className={cn(
                              "block w-full truncate rounded-lg px-1.5 py-0.5 text-left text-xs",
                              event.is_published
                                ? "bg-rose-tendre text-rose-sombre hover:bg-rose-tendre-deep"
                                : "border border-dashed border-charbon/30 text-charbon/60 hover:bg-creme",
                            )}
                          >
                            <span className="font-semibold">{formatTime(event.start_time)}</span>{" "}
                            {event.title}
                            {!event.is_published && <span className="sr-only"> (masqué)</span>}
                          </button>
                        </li>
                      ))}
                      {dayEvents.length > CHIPS_PER_DAY && (
                        <li>
                          <button
                            type="button"
                            onClick={() => setSelected(day)}
                            className="px-1.5 text-xs font-semibold text-rose-sombre hover:underline"
                          >
                            + {dayEvents.length - CHIPS_PER_DAY}
                          </button>
                        </li>
                      )}
                    </ul>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <section aria-labelledby="selected-day" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 id="selected-day" className="text-xl">
            {capitalise(formatFullDate(selected))}
          </h3>
          <Button
            variant="secondary"
            onClick={() => onCreate(selected)}
            iconRight={<Plus size={16} aria-hidden="true" />}
          >
            Ajouter un atelier ce jour
          </Button>
        </div>
        {selectedEvents.length === 0 ? (
          <p className="text-sm text-charbon/60">Aucun atelier ce jour-là.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {selectedEvents.map((event) => (
              <EventRow key={event.id} event={event} showDate={false} {...actions} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
