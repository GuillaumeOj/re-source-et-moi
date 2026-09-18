import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ateliers } from "@/content/ateliers";
import { AgendaList } from "./workshops/AgendaList";
import { PricingSection } from "./workshops/PricingSection";

/**
 * "Prochains rendez-vous" — the agenda, with the tariffs under it in the same section.
 *
 * Synchronous on purpose: what the page's structure depends on — the section id the nav
 * anchors at, the section heading — renders without touching the backend. The agenda and
 * the tariffs inside are async, so a backend outage costs them and nothing else. The
 * "Tarifs" heading belongs to PricingSection, because it only shows when tariffs exist.
 */
export function Workshops() {
  return (
    <Section id="ateliers" background="creme" aria-labelledby="ateliers-title">
      <SectionHeading id="ateliers-title" eyebrow={ateliers.eyebrow} title={ateliers.title} />

      <AgendaList />

      {/* Tarifs — pricing lives under the ateliers, in the same section. */}
      <PricingSection />
    </Section>
  );
}
