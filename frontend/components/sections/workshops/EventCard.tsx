import { MapPin } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import type { Event } from "@/lib/api/client";
import { cn } from "@/lib/cn";
import { formatDay, formatFullDate, formatMonth, formatSchedule } from "@/lib/format";
import { ContactLink } from "./ContactLink";

/** A Google Maps search for the address — no API key, and it opens the app on a phone. */
function mapsUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

type EventCardProps = {
  event: Event;
  /** Stagger for the reveal animation, so a list fades in one card after another. */
  delayMs?: number;
  /** A workshop that has already happened: dimmed, and nothing to sign up for. */
  past?: boolean;
};

/**
 * One workshop as a list item — the home page's agenda, the agenda page's list, and the
 * day-by-day list under its calendar all render this.
 */
export function EventCard({ event, delayMs = 0, past = false }: EventCardProps) {
  return (
    <Reveal
      as="li"
      delayMs={delayMs}
      className={cn(
        "group flex flex-col gap-4 rounded-3xl bg-white p-5 shadow-soft sm:flex-row sm:items-center sm:gap-6 sm:p-6",
        past && "opacity-70",
      )}
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
        {event.description && <p className="mt-1 text-sm text-charbon/60">{event.description}</p>}
      </div>

      {/* The short label ("Lyon", "En ligne") leads; an on-site workshop adds its full
          address under it, capped in width so a long one wraps rather than squeezing the
          title. An online workshop's video link is never shown here — it goes to people
          who registered, not to anyone reading the page. */}
      <div className="flex flex-col gap-1 sm:max-w-56">
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-rose-sombre/70">
          <MapPin size={15} aria-hidden="true" />
          {event.location_label}
        </span>
        {event.address && (
          <address className="pl-5 text-xs leading-relaxed not-italic text-charbon/60">
            <a
              href={mapsUrl(event.address)}
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-rose-sombre/30 underline-offset-2 transition-colors hover:decoration-rose-sombre"
            >
              {event.address}
              <span className="sr-only"> (ouvre Google Maps dans un nouvel onglet)</span>
            </a>
          </address>
        )}
      </div>

      {!past && (
        <ContactLink eventId={event.id}>
          <span className="sr-only">S'inscrire à {event.title}</span>
          <span aria-hidden="true">S'inscrire</span>
        </ContactLink>
      )}
    </Reveal>
  );
}
