import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ateliers } from "@/content/ateliers";
import { tarifs } from "@/content/tarifs";
import { AgendaList } from "./workshops/AgendaList";
import { PricingCards } from "./workshops/PricingCards";

/**
 * "Prochains rendez-vous" — the agenda, with the tariffs under it in the same section.
 *
 * Synchronous on purpose: everything that the page's structure depends on — the section
 * id the nav anchors at, the two headings — renders without touching the backend. Only
 * the two lists inside are async, so a backend outage costs the lists and nothing else.
 */
export function Workshops() {
  return (
    <Section id="ateliers" background="creme" aria-labelledby="ateliers-title">
      <SectionHeading id="ateliers-title" eyebrow={ateliers.eyebrow} title={ateliers.title} />

      <AgendaList />

      {/* Tarifs — pricing lives under the ateliers, in the same section. */}
      <Reveal className="mt-16 flex flex-col gap-2">
        <h3 className="font-display text-2xl text-rose-vif">{tarifs.title}</h3>
        <p className="max-w-2xl text-base leading-relaxed text-charbon/80">{tarifs.intro}</p>
      </Reveal>

      <PricingCards />
    </Section>
  );
}
