import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ateliers } from "@/content/ateliers";
import { AgendaList } from "./workshops/AgendaList";
import { PricingSection } from "./workshops/PricingSection";

/** How many upcoming workshops the home page shows; the rest are on /agenda. */
const HOME_LIMIT = 4;

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

      <AgendaList limit={HOME_LIMIT} />

      {/* Outside AgendaList on purpose: even with nothing upcoming, or the backend down,
          the agenda page's calendar of past workshops is still worth a visit. */}
      <div className="mt-8">
        <Button
          href="/agenda"
          variant="secondary"
          iconRight={
            <ArrowRight
              size={16}
              aria-hidden="true"
              className="transition-transform group-hover:translate-x-1"
            />
          }
        >
          {ateliers.seeAll}
        </Button>
      </div>

      {/* Tarifs — pricing lives under the ateliers, in the same section. */}
      <PricingSection />
    </Section>
  );
}
