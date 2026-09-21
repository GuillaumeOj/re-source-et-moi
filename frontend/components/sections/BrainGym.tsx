import { BookOpen, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { IconBadge } from "@/components/ui/IconBadge";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { brainGym } from "@/content/brain-gym";

const cardIcons = [Users, Sparkles, BookOpen];

export function BrainGym() {
  return (
    <Section id="brain-gym" background="creme" aria-labelledby="brain-gym-title">
      <SectionHeading
        id="brain-gym-title"
        eyebrow={brainGym.eyebrow}
        title={brainGym.title}
        intro={brainGym.intro}
      />

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {brainGym.cards.map((card, index) => (
          <Card key={card.title} delayMs={index * 80} className="gap-4 bg-white">
            <IconBadge icon={cardIcons[index]} />
            <h3 className="text-xl font-medium">{card.title}</h3>
            <p className="text-base leading-relaxed text-charbon/80">{card.body}</p>
          </Card>
        ))}
      </div>

      <Reveal className="mt-10">
        <Button href={brainGym.more.href}>{brainGym.more.label}</Button>
      </Reveal>
    </Section>
  );
}
