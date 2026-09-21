import { ChevronLeft, ChevronRight } from "lucide-react";
import { connection } from "next/server";
import type { ReactNode } from "react";
import { EventCard } from "@/components/sections/workshops/EventCard";
import { Notice } from "@/components/sections/workshops/Notice";
import { agenda, ateliers } from "@/content/ateliers";
import { type Event, getEvents } from "@/lib/api/client";
import {
  addMonths,
  formatMonthHeading,
  formatMonthParam,
  isInMonth,
  type Month,
  monthGrid,
  monthOf,
  WEEKDAYS,
} from "@/lib/calendar";
import { cn } from "@/lib/cn";
import { formatFullDate, formatTime, parisToday } from "@/lib/format";

/** How many workshops a day cell lists before summarising the rest as "+ N". */
const CHIPS_PER_DAY = 2;

/** The agenda page's calendar view of `month`. */
export function calendarHref(month: Month): string {
  return `/agenda?vue=calendrier&mois=${formatMonthParam(month)}`;
}

/** The anchor of a day's workshops in the list under the grid. */
function dayAnchor(isoDate: string): string {
  return `jour-${isoDate}`;
}

/**
 * The agenda's calendar view: one month, Monday first, six weeks tall, then that month's
 * workshops listed under it.
 *
 * Rendered entirely on the server, like the list: the workshops land in the HTML, and the
 * month arrows are plain links to `?mois=`, so browsing needs no JavaScript and every
 * month is its own cached, crawlable page. A day with workshops links down to them; on a
 * phone the cells are too narrow for titles and show a dot instead.
 *
 * Unlike the list, a month can be in the past: the backend returns published workshops in
 * any date range, and the ones already held are shown without "S'inscrire".
 */
export async function AgendaCalendar({ month }: { month: Month }) {
  // See AgendaList: the backend's URL only exists at request time.
  await connection();

  const today = parisToday();
  const days = monthGrid(month);
  const events = await getEvents({ from: days[0], to: days[days.length - 1] }).catch(
    (error: unknown) => {
      console.error("[AgendaCalendar] backend unreachable:", error);
      return null;
    },
  );

  const byDay = new Map<string, Event[]>();
  for (const event of events ?? []) {
    byDay.set(event.date, [...(byDay.get(event.date) ?? []), event]);
  }
  const weeks = Array.from({ length: 6 }, (_, week) => days.slice(week * 7, week * 7 + 7));
  const monthEvents = (events ?? []).filter((event) => isInMonth(event.date, month));
  const monthDays = [...new Set(monthEvents.map((event) => event.date))];
  const heading = formatMonthHeading(month);

  return (
    <div className="mt-10 flex flex-col gap-8">
      <nav aria-label={agenda.monthNavLabel} className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <MonthLink month={addMonths(month, -1)} label={agenda.previousMonth}>
            <ChevronLeft size={20} aria-hidden="true" />
          </MonthLink>
          <h2 className="min-w-48 text-center text-2xl md:text-3xl">{heading}</h2>
          <MonthLink month={addMonths(month, 1)} label={agenda.nextMonth}>
            <ChevronRight size={20} aria-hidden="true" />
          </MonthLink>
        </div>
        {!isInMonth(today, month) && (
          <a
            href={calendarHref(monthOf(today))}
            className="rounded-full px-4 py-2 text-sm font-semibold text-rose-sombre hover:bg-rose-tendre"
          >
            {agenda.today}
          </a>
        )}
      </nav>

      {events === null ? (
        <Notice>{ateliers.unavailable}</Notice>
      ) : (
        <>
          <table
            className="w-full table-fixed border-separate border-spacing-1"
            aria-label={agenda.calendarLabel(heading)}
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
                  {week.map((day) => (
                    <DayCell
                      key={day}
                      day={day}
                      events={byDay.get(day) ?? []}
                      inMonth={isInMonth(day, month)}
                      isToday={day === today}
                    />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {monthDays.length === 0 ? (
            <p className="text-sm text-charbon/60">{agenda.emptyMonth}</p>
          ) : (
            <div className="flex flex-col gap-4">
              {monthDays.map((day) => (
                <ul key={day} id={dayAnchor(day)} className="flex scroll-mt-28 flex-col gap-4">
                  {(byDay.get(day) ?? []).map((event, index) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      delayMs={index * 60}
                      past={event.date < today}
                    />
                  ))}
                </ul>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function MonthLink({
  month,
  label,
  children,
}: {
  month: Month;
  label: string;
  children: ReactNode;
}) {
  return (
    <a
      href={calendarHref(month)}
      aria-label={`${label} : ${formatMonthHeading(month)}`}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full text-rose-sombre transition-colors hover:bg-rose-tendre"
    >
      {children}
    </a>
  );
}

type DayCellProps = {
  day: string;
  events: Event[];
  inMonth: boolean;
  isToday: boolean;
};

/**
 * One day of the grid. With workshops, its number links to them: down the page for a day
 * of this month, or to its own month for a spill-over day from the next or previous one.
 * The chips and the phone's dot repeat what that list says, so they are hidden from
 * assistive tech and the link's label carries the count instead.
 */
function DayCell({ day, events, inMonth, isToday }: DayCellProps) {
  const number = Number(day.slice(8));
  const numberClass = cn(
    "flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold",
    isToday ? "bg-rose-sombre text-creme" : inMonth ? "text-charbon" : "text-charbon/40",
  );

  return (
    <td
      className={cn(
        "h-14 rounded-2xl p-1 align-top sm:h-28 sm:p-1.5",
        inMonth ? "bg-white" : "bg-white/40",
      )}
    >
      {events.length === 0 ? (
        <span className={numberClass}>{number}</span>
      ) : (
        <a
          href={`${inMonth ? "" : calendarHref(monthOf(day))}#${dayAnchor(day)}`}
          aria-label={agenda.dayLabel(formatFullDate(day), events.length)}
          className={cn(
            numberClass,
            !isToday &&
              "underline decoration-rose-vif decoration-2 underline-offset-4 hover:bg-rose-tendre",
          )}
        >
          {number}
        </a>
      )}

      {events.length > 0 && (
        <span
          aria-hidden="true"
          className="mt-1 ml-1 inline-block h-2 w-2 rounded-full bg-rose-vif sm:hidden"
        />
      )}

      <ul aria-hidden="true" className="mt-1 hidden flex-col gap-1 sm:flex">
        {events.slice(0, CHIPS_PER_DAY).map((event) => (
          <li
            key={event.id}
            className="truncate rounded-lg bg-rose-tendre px-1.5 py-0.5 text-xs text-rose-sombre"
          >
            <span className="font-semibold">{formatTime(event.start_time)}</span> {event.title}
          </li>
        ))}
        {events.length > CHIPS_PER_DAY && (
          <li className="px-1.5 text-xs font-semibold text-rose-sombre">
            + {events.length - CHIPS_PER_DAY}
          </li>
        )}
      </ul>
    </td>
  );
}
