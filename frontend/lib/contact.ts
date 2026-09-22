import type { Event } from "@/lib/api/client";
import { formatFullDate, formatTimeRange } from "@/lib/format";

/** What the contact form needs to know about the workshop a visitor is signing up for. */
export type ContactEvent = Pick<
  Event,
  "id" | "title" | "date" | "start_time" | "end_time" | "location_label" | "address"
>;

/** Narrow an API event to the fields the contact form shows, so only those reach the client. */
export function toContactEvent(event: Event): ContactEvent {
  const { id, title, date, start_time, end_time, location_label, address } = event;
  return { id, title, date, start_time, end_time, location_label, address };
}

/** Where a workshop happens, on one line — "Lyon (12 rue X, 69001 Lyon)", or "En ligne". */
export function formatPlace(event: ContactEvent): string {
  return event.address ? `${event.location_label} (${event.address})` : event.location_label;
}

/**
 * The message the association receives: the workshop the visitor signs up for, written
 * out in full so it reads on its own in an inbox, then whatever the visitor added.
 */
export function composeMessage(event: ContactEvent | null, message: string): string {
  const text = message.trim();
  if (!event) {
    return text;
  }
  const signUp =
    `Inscription à l'atelier « ${event.title} » — ${formatFullDate(event.date)}, ` +
    `${formatTimeRange(event.start_time, event.end_time)}, ${formatPlace(event)}.`;
  return text ? `${signUp}\n\n${text}` : signUp;
}
