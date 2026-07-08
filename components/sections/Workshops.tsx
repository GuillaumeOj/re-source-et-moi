import { ArrowRight, MapPin } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ateliers } from "@/content/ateliers";
import { tarifs } from "@/content/tarifs";

export function Workshops() {
  return (
    <Section id="ateliers" background="creme" aria-labelledby="ateliers-title">
      <SectionHeading id="ateliers-title" eyebrow={ateliers.eyebrow} title={ateliers.title} />

      <ul className="mt-12 flex flex-col gap-4">
        {ateliers.items.map((atelier, index) => (
          <Reveal
            key={`${atelier.day}-${atelier.title}`}
            as="li"
            delayMs={index * 60}
            className="group flex flex-col gap-4 rounded-3xl bg-white p-5 shadow-soft sm:flex-row sm:items-center sm:gap-6 sm:p-6"
          >
            <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-rose-tendre text-rose-sombre">
              <span className="font-display text-2xl leading-none">{atelier.day}</span>
              <span className="text-xs font-semibold uppercase tracking-wide">{atelier.month}</span>
            </div>

            <div className="flex-1">
              <h3 className="text-xl font-medium">{atelier.title}</h3>
              <p className="text-sm text-charbon/70">{atelier.schedule}</p>
            </div>

            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-rose-sombre/70">
              <MapPin size={15} aria-hidden="true" />
              {atelier.location}
            </span>

            <a
              href="#contact"
              className="inline-flex items-center gap-1.5 rounded-full border border-rose-sombre/20 px-5 py-2.5 text-sm font-semibold text-rose-sombre transition-colors hover:bg-rose-sombre/5"
            >
              S'inscrire
              <ArrowRight
                size={16}
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-1"
              />
            </a>
          </Reveal>
        ))}
      </ul>

      <p className="mt-6 text-sm text-charbon/60">{ateliers.note}</p>

      {/* Tarifs — pricing lives under the ateliers, in the same section. */}
      <Reveal className="mt-16 flex flex-col gap-2">
        <h3 className="font-display text-2xl text-rose-vif">{tarifs.title}</h3>
        <p className="max-w-2xl text-base leading-relaxed text-charbon/80">{tarifs.intro}</p>
      </Reveal>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {tarifs.plans.map((plan, index) => (
          <Card key={plan.name} delayMs={index * 80} className="gap-5 bg-white">
            <h4 className="font-display text-xl text-rose-sombre">{plan.name}</h4>
            <ul className="flex flex-col gap-3">
              {plan.rows.map((row) => (
                <li
                  key={row.label}
                  className="flex items-baseline justify-between gap-4 border-rose-sombre/10 border-b pb-3 last:border-b-0 last:pb-0"
                >
                  <span className="text-base text-charbon/80">{row.label}</span>
                  <span className="font-display text-xl text-rose-sombre">{row.price}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm leading-relaxed text-charbon/60">{plan.note}</p>
          </Card>
        ))}
      </div>
    </Section>
  );
}
