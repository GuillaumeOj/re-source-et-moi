import type { Event } from "@/lib/api/client";

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

// A French number once its separators are gone: national ("0612345678") or international,
// with or without the bracketed trunk zero ("+33 (0)6…" → "+330612345678").
const FRENCH_PHONE = /^(?:(?:\+33|0033)0?|0)([1-9]\d{8})$/;
const PHONE_SEPARATORS = /[\s.()-]/g;

/**
 * A French number however the visitor typed it — "06 12 34 56 78", "06.12.34.56.78",
 * "+33 (0)6 12 34 56 78" — in the one international form that can be dialled from
 * anywhere ("+33612345678"), or null if it isn't one. Deliberately loose: the call back is
 * the real check.
 */
export function normalisePhone(typed: string): string | null {
  const match = FRENCH_PHONE.exec(typed.replace(PHONE_SEPARATORS, ""));
  return match ? `+33${match[1]}` : null;
}
