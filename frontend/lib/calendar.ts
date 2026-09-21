/**
 * Date arithmetic for the month calendars — the editor's and the public agenda's — on ISO
 * "YYYY-MM-DD" strings.
 *
 * Everything goes through UTC dates, never the browser's local midnight: a local date can
 * land on the previous day in a timezone behind UTC, and daylight-saving days are 23 or
 * 25 hours long. The same reasoning is behind `parseApiDate` in lib/format.ts, which
 * also holds the Paris "today" the calendar starts from (`parisToday`).
 *
 * It also holds the one date format that is written as well as read — jj/mm/aaaa, what the
 * editor's date field shows and parses back. That round trip belongs here rather than in
 * lib/format.ts, which renders ISO values for the page and never reads one back.
 */

import { capitalise } from "@/lib/format";

export type Month = { year: number; month: number }; // month: 1–12

const monthHeadingFormatter = new Intl.DateTimeFormat("fr-FR", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function monthOf(isoDate: string): Month {
  const [year, month] = isoDate.split("-").map(Number);
  return { year, month };
}

/**
 * The `?mois=` value of the agenda's calendar ("2026-10") as a Month, or null when it is
 * missing or not a real month — the page then falls back to the current one.
 */
export function parseMonth(value: string | undefined): Month | null {
  const match = value?.match(/^(\d{4})-(\d{2})$/);
  if (!match) {
    return null;
  }
  const month = { year: Number(match[1]), month: Number(match[2]) };
  return month.month >= 1 && month.month <= 12 ? month : null;
}

/** A Month as the `?mois=` value `parseMonth` reads back — "2026-10". */
export function formatMonthParam({ year, month }: Month): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function addMonths({ year, month }: Month, offset: number): Month {
  const index = year * 12 + (month - 1) + offset;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

/** The 1st of the month, as ISO. */
export function firstOf({ year, month }: Month): string {
  return `${year}-${String(month).padStart(2, "0")}-01`;
}

function toIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * The 42 days (six weeks, Monday first, as in France) of the grid showing `month`,
 * including the tail of the previous month and the start of the next. Six weeks always,
 * so the grid keeps its height from one month to the next.
 */
export function monthGrid({ year, month }: Month): string[] {
  const first = new Date(Date.UTC(year, month - 1, 1));
  // getUTCDay: 0 is Sunday. Shift so Monday is 0.
  const leading = (first.getUTCDay() + 6) % 7;
  return Array.from({ length: 42 }, (_, index) =>
    toIso(new Date(Date.UTC(year, month - 1, 1 - leading + index))),
  );
}

/** The same 42 days cut into the six rows a month table draws. */
export function monthWeeks(month: Month): string[][] {
  const days = monthGrid(month);
  return Array.from({ length: 6 }, (_, week) => days.slice(week * 7, week * 7 + 7));
}

/** "Octobre 2026", for the calendar's heading. */
export function formatMonthHeading({ year, month }: Month): string {
  return capitalise(monthHeadingFormatter.format(new Date(Date.UTC(year, month - 1, 1))));
}

export function isInMonth(isoDate: string, { year, month }: Month): boolean {
  const parsed = monthOf(isoDate);
  return parsed.year === year && parsed.month === month;
}

/** Monday-first short weekday names: "lun.", "mar.", … */
export const WEEKDAYS = ["lun.", "mar.", "mer.", "jeu.", "ven.", "sam.", "dim."];

/** How a date is written in French, and what the editor's date field shows. */
export const DATE_PLACEHOLDER = "jj/mm/aaaa";

/** An ISO date as it is written here — "2026-06-14" → "14/06/2026". Empty stays empty. */
export function toFrenchDate(isoDate: string): string {
  if (!isoDate) {
    return "";
  }
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

/**
 * A day, a month and a four-digit year. A single-digit day or month is accepted
 * ("14/6/2026"): it is how the date gets typed before the rest catches up, and rejecting
 * it would only mean refusing what was meant.
 */
const FRENCH_DATE = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;

/**
 * Whether the text is written out in full, whatever day it names. It tells the two halves
 * of "isn't a date" apart: "14/06" is still being typed, "31/04/2026" is finished and
 * names a day that doesn't exist, and the two don't deserve the same message.
 */
export function isWrittenInFull(text: string): boolean {
  return FRENCH_DATE.test(text.trim());
}

/**
 * A typed French date back to ISO — "14/06/2026" → "2026-06-14" — or null if it isn't one.
 *
 * Null covers both halves of "isn't one": a date still being typed, and a date that is
 * complete but doesn't exist. The existence check is a round-trip through `Date.UTC`
 * rather than a fancier regex, because only the calendar knows that 31/02 and 31/04 are
 * not days while 29/02/2028 is.
 */
export function parseFrenchDate(text: string): string | null {
  const match = text.trim().match(FRENCH_DATE);
  if (!match) {
    return null;
  }
  const [, day, month, year] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1) {
    return null;
  }
  return toIso(date);
}
