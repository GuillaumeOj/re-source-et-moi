import { ArrowRight, MapPin } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ateliers } from "@/content/ateliers";

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
    </Section>
  );
}
