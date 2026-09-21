/**
 * Date arithmetic for the month calendars — the editor's and the public agenda's — on ISO
 * "YYYY-MM-DD" strings.
 *
 * Everything goes through UTC dates, never the browser's local midnight: a local date can
 * land on the previous day in a timezone behind UTC, and daylight-saving days are 23 or
 * 25 hours long. The same reasoning is behind `parseApiDate` in lib/format.ts, which
 * also holds the Paris "today" the calendar starts from (`parisToday`).
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
