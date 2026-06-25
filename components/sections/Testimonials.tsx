import { Card } from "@/components/ui/Card";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { temoignages } from "@/content/temoignages";

export function Testimonials() {
  return (
    <Section id="temoignages" background="creme" aria-labelledby="temoignages-title">
      <SectionHeading
        id="temoignages-title"
        eyebrow={temoignages.eyebrow}
        title={temoignages.title}
      />

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {temoignages.items.map((item, index) => (
          <Card key={item.author} as="figure" delayMs={index * 70} className="gap-5 bg-white">
            <blockquote className="font-display text-xl text-rose-sombre italic leading-snug">
              «&nbsp;{item.quote}&nbsp;»
            </blockquote>
            <figcaption className="mt-auto text-sm">
              <span className="font-semibold text-rose-sombre">{item.author}</span>
              <span className="text-charbon/60"> — {item.context}</span>
            </figcaption>
          </Card>
        ))}
      </div>
    </Section>
  );
}
