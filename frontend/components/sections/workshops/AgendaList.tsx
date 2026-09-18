import { ArrowRight, MapPin } from "lucide-react";
import { connection } from "next/server";
import { Reveal } from "@/components/ui/Reveal";
import { ateliers } from "@/content/ateliers";
import { getEvents } from "@/lib/api/client";
import { formatDay, formatFullDate, formatMonth, formatSchedule } from "@/lib/format";
import { Notice } from "./Notice";

/**
 * The workshop list, fetched from the backend.
 *
 * Its own async component rather than part of the section, so the section's shell — the
 * heading the page and the nav link point at — stays synchronous and testable. It is also
 * what keeps a backend outage local: this renders a notice, the tariffs beside it are
 * unaffected.
 */
export async function AgendaList() {
  // Defers this render to request time. The backend's URL arrives in a Vercel service
  // binding and bindings are runtime-only, so at build time there is nothing to fetch
  // from and a prerender would bake the "unavailable" copy in permanently. It has to be
  // awaited here, at the render boundary, rather than inside the fetch helper — see the
  // note in lib/api/client.ts. The responses are still cached, so this costs a render,
  // not a round-trip per visitor.
  await connection();

  const events = await getEvents().catch((error: unknown) => {
    console.error("[AgendaList] backend unreachable:", error);
    // null, not [] — "could not load" and "nothing scheduled" read differently to a
    // visitor, and only one of them is worth an apology.
    return null;
  });

  if (events === null) {
    return <Notice>{ateliers.unavailable}</Notice>;
  }
  if (events.length === 0) {
    return <Notice>{ateliers.empty}</Notice>;
  }

  return (
    <ul className="mt-12 flex flex-col gap-4">
      {events.map((event, index) => (
        <Reveal
          key={event.id}
          as="li"
          delayMs={index * 60}
          className="group flex flex-col gap-4 rounded-3xl bg-white p-5 shadow-soft sm:flex-row sm:items-center sm:gap-6 sm:p-6"
        >
          {/* <time> carries the machine-readable date. The "14"/"Juin" split is purely
              visual, so it is hidden from assistive tech and the full date is read
              instead — as a visually-hidden span rather than aria-label, which <time>
              does not support (it has no implicit ARIA role). */}
          <time
            dateTime={event.date}
            className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-rose-tendre text-rose-sombre"
          >
            <span className="sr-only">{formatFullDate(event.date)}</span>
            <span aria-hidden="true" className="font-display text-2xl leading-none">
              {formatDay(event.date)}
            </span>
            <span aria-hidden="true" className="text-xs font-semibold uppercase tracking-wide">
              {formatMonth(event.date)}
            </span>
          </time>

          <div className="flex-1">
            <h3 className="text-xl font-medium">{event.title}</h3>
            <p className="text-sm text-charbon/70">
              {formatSchedule(event.date, event.start_time, event.end_time)}
            </p>
            {event.description && (
              <p className="mt-1 text-sm text-charbon/60">{event.description}</p>
            )}
          </div>

          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-rose-sombre/70">
            <MapPin size={15} aria-hidden="true" />
            {event.location_label}
          </span>

          <a
            href="#contact"
            className="inline-flex items-center gap-1.5 rounded-full border border-rose-sombre/20 px-5 py-2.5 text-sm font-semibold text-rose-sombre transition-colors hover:bg-rose-sombre/5"
          >
            <span className="sr-only">S'inscrire à {event.title}</span>
            <span aria-hidden="true">S'inscrire</span>
            <ArrowRight
              size={16}
              aria-hidden="true"
              className="transition-transform group-hover:translate-x-1"
            />
          </a>
        </Reveal>
      ))}
    </ul>
  );
}
