import { ArrowRight, MapPin } from "lucide-react";
import { connection } from "next/server";
import { Card } from "@/components/ui/Card";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ateliers } from "@/content/ateliers";
import { tarifs } from "@/content/tarifs";
import { type Event, getEvents, getPricingTypes, type PricingType } from "@/lib/api/client";
import { formatDay, formatFullDate, formatMonth, formatPrice, formatSchedule } from "@/lib/format";

/**
 * Fetch both feeds, turning a failure into `null` rather than an exception.
 *
 * The section must degrade on its own: a backend outage should cost the workshops and the
 * tariffs, not the whole page. `null` means "could not load" and is rendered differently
 * from an empty list, which is a legitimate state.
 */
async function load<T>(fetcher: () => Promise<T>): Promise<T | null> {
  try {
    return await fetcher();
  } catch (error) {
    console.error("[Workshops] backend unreachable:", error);
    return null;
  }
}

export async function Workshops() {
  // Defers this render to request time. The backend's URL arrives in a Vercel service
  // binding, and bindings are injected at runtime only — during the build the variable
  // does not exist, so a prerender would bake the "unavailable" copy into the page and
  // leave it there. The fetches are still cached (see REVALIDATE_SECONDS in the client),
  // so this costs a render, not a round-trip per visitor.
  await connection();

  const [events, pricingTypes] = await Promise.all([load(getEvents), load(getPricingTypes)]);

  return (
    <Section id="ateliers" background="creme" aria-labelledby="ateliers-title">
      <SectionHeading id="ateliers-title" eyebrow={ateliers.eyebrow} title={ateliers.title} />

      <AgendaList events={events} />

      {/* Tarifs — pricing lives under the ateliers, in the same section. */}
      <Reveal className="mt-16 flex flex-col gap-2">
        <h3 className="font-display text-2xl text-rose-vif">{tarifs.title}</h3>
        <p className="max-w-2xl text-base leading-relaxed text-charbon/80">{tarifs.intro}</p>
      </Reveal>

      <PricingCards pricingTypes={pricingTypes} />
    </Section>
  );
}

function Notice({ children }: { children: string }) {
  return <p className="mt-8 text-sm text-charbon/60">{children}</p>;
}

function AgendaList({ events }: { events: Event[] | null }) {
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

function PricingCards({ pricingTypes }: { pricingTypes: PricingType[] | null }) {
  if (pricingTypes === null || pricingTypes.length === 0) {
    return <Notice>{tarifs.unavailable}</Notice>;
  }

  return (
    <div className="mt-8 grid gap-6 md:grid-cols-2">
      {pricingTypes.map((pricingType, index) => (
        <Card key={pricingType.id} delayMs={index * 80} className="gap-5 bg-white">
          <h4 className="font-display text-xl text-rose-sombre">{pricingType.name}</h4>
          <ul className="flex flex-col gap-3">
            {pricingType.prices.map((price) => (
              <li
                key={price.id}
                className="flex items-baseline justify-between gap-4 border-rose-sombre/10 border-b pb-3 last:border-b-0 last:pb-0"
              >
                <span className="text-base text-charbon/80">{price.description}</span>
                <span className="font-display text-xl text-rose-sombre">
                  {formatPrice(price.amount, price.on_demand)}
                </span>
              </li>
            ))}
          </ul>
          {pricingType.description && (
            <p className="text-sm leading-relaxed text-charbon/60">{pricingType.description}</p>
          )}
        </Card>
      ))}
    </div>
  );
}
