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
const euroFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  // Whole-euro prices are the norm here, so "75 €" reads better than "75,00 €", while a
  // price with cents still shows both of them ("75,50 €"). This is that 0-or-2 rule in one
  // option — min 0 / max 2 would render 75.50 as "75,5 €", which no price is written as.
  trailingZeroDisplay: "stripIfInteger",
});

// en-CA formats a date as ISO YYYY-MM-DD, which is what parisToday() needs.
const isoDateFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE });

/** Intl returns French months and weekdays lowercase; these sit alone, so they lead caps. */
export function capitalise(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

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

/** The abbreviated month for the date badge — "Juin", "Juil.". */
export function formatMonth(isoDate: string): string {
  return capitalise(monthFormatter.format(parseApiDate(isoDate)));
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
  const weekday = capitalise(weekdayFormatter.format(parseApiDate(isoDate)));
  return `${weekday} · ${formatTimeRange(start, end)}`;
}

/** Two API times as a range — "10h–12h30". En dash between them, as the original copy had it. */
export function formatTimeRange(start: string, end: string): string {
  return `${formatTime(start)}–${formatTime(end)}`;
}

/**
 * Today where the workshops happen, as ISO "YYYY-MM-DD": the same "today" the backend's
 * upcoming/past split uses, whatever timezone the browser or server is in.
 */
export function parisToday(): string {
  return isoDateFormatter.format(new Date());
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
  return euroFormatter.format(Number(amount));
}
