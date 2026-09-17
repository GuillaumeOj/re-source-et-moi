/**
 * French rendering of the values the API sends as raw data.
 *
 * The backend deliberately emits ISO dates, ISO times and numeric amounts — never "14",
 * "Juin", "Samedi · 10h–12h" or "75 €". Keeping the formatting here means the stored data
 * stays sortable and comparable, and the display rules live next to the markup that uses
 * them.
 *
 * Every formatter is pinned to fr-FR and Europe/Paris rather than the runtime's locale: on
 * a server this renders on whatever the host is set to, which is not where the workshops
 * happen.
 */

const TIME_ZONE = "Europe/Paris";

const dayFormatter = new Intl.DateTimeFormat("fr-FR", { day: "numeric", timeZone: TIME_ZONE });
const monthFormatter = new Intl.DateTimeFormat("fr-FR", { month: "short", timeZone: TIME_ZONE });
const weekdayFormatter = new Intl.DateTimeFormat("fr-FR", { weekday: "long", timeZone: TIME_ZONE });
const fullDateFormatter = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: TIME_ZONE,
});
// Whole-euro prices are the norm here, so "75 €" reads better than "75,00 €". A price with
// cents must still show both of them: one shared formatter with min 0 / max 2 would render
// 75.50 as "75,5 €", which no price is ever written as.
const wholeEuroFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});
const centsEuroFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Parse an API date ("2026-10-01") as noon UTC.
 *
 * Midnight would be the obvious choice and is the wrong one: `new Date("2026-10-01")` is
 * parsed as UTC midnight, which in a timezone behind UTC is still the previous day, so the
 * date badge would render "30" for a workshop on the 1st. Noon is far enough from either
 * boundary that no real timezone can shift the calendar day.
 */
function parseApiDate(isoDate: string): Date {
  return new Date(`${isoDate}T12:00:00Z`);
}

/** The day number for the agenda's date badge — "14". */
export function formatDay(isoDate: string): string {
  return dayFormatter.format(parseApiDate(isoDate));
}

/**
 * The abbreviated month for the date badge — "juin", "juil.".
 *
 * Capitalised because it sits alone in the badge, where French sentence case does not
 * apply. Intl returns it lowercase.
 */
export function formatMonth(isoDate: string): string {
  const month = monthFormatter.format(parseApiDate(isoDate));
  return month.charAt(0).toUpperCase() + month.slice(1);
}

/** The full date, for a screen reader and the `datetime` title — "mercredi 1 octobre 2026". */
export function formatFullDate(isoDate: string): string {
  return fullDateFormatter.format(parseApiDate(isoDate));
}

/** An API time ("10:00:00") as French clock time — "10h", "10h30". */
export function formatTime(isoTime: string): string {
  const [hours, minutes] = isoTime.split(":");
  return minutes === "00" ? `${Number(hours)}h` : `${Number(hours)}h${minutes}`;
}

/** The agenda row's schedule line — "Samedi · 10h–12h". */
export function formatSchedule(isoDate: string, start: string, end: string): string {
  const weekday = weekdayFormatter.format(parseApiDate(isoDate));
  const capitalised = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  // En dash between times, as the original copy had it.
  return `${capitalised} · ${formatTime(start)}–${formatTime(end)}`;
}

/**
 * A tariff line's price — "75 €", or "Sur devis" when there is no fixed amount.
 *
 * `amount` arrives as a decimal *string* (DRF's default, which avoids float rounding on
 * the way out); it is parsed here, at the one point where it becomes a display value.
 */
export function formatPrice(amount: string | null, onDemand: boolean): string {
  if (onDemand || amount === null) {
    return "Sur devis";
  }
  const value = Number(amount);
  return Number.isInteger(value)
    ? wholeEuroFormatter.format(value)
    : centsEuroFormatter.format(value);
}
