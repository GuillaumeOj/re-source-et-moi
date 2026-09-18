import { Card } from "@/components/ui/Card";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { approche } from "@/content/valeurs";

export function Approach() {
  return (
    <Section id="approche" background="rose-tendre" aria-labelledby="approche-title">
      <SectionHeading id="approche-title" eyebrow={approche.eyebrow} title={approche.title} />

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {approche.cards.map((card, index) => (
          <Card key={card.title} delayMs={index * 70} className="gap-3 bg-creme">
            <h3 className="font-display text-2xl text-rose-vif">{card.title}</h3>
            <p className="text-base leading-relaxed text-charbon/80">{card.body}</p>
          </Card>
        ))}
      </div>
    </Section>
  );
}
