import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { soiEnMouvement } from "@/content/soi-en-mouvement";

export function SoiEnMouvement() {
  return (
    <Section
      id="soi-en-mouvement"
      background="rose-tendre"
      aria-labelledby="soi-en-mouvement-title"
    >
      <SectionHeading
        id="soi-en-mouvement-title"
        eyebrow={soiEnMouvement.eyebrow}
        title={soiEnMouvement.title}
        intro={soiEnMouvement.intro}
      />

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {soiEnMouvement.cards.map((card, index) => (
          <Card key={card.title} delayMs={index * 70} className="gap-3 bg-creme">
            <h3 className="font-display text-2xl text-rose-vif">{card.title}</h3>
            <p className="text-base leading-relaxed text-charbon/80">{card.body}</p>
          </Card>
        ))}
      </div>

      <Reveal className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
        <p className="text-base text-charbon/80">{soiEnMouvement.origin}</p>
        <Button href={soiEnMouvement.more.href}>{soiEnMouvement.more.label}</Button>
      </Reveal>
    </Section>
  );
}
