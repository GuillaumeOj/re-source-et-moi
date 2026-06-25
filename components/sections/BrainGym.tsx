import { Brain, Footprints, Spline } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { brainGym } from "@/content/braingym";

const cardIcons = [Footprints, Spline, Brain];

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
        {brainGym.cards.map((card, index) => {
          const Icon = cardIcons[index];
          return (
            <Card key={card.title} delayMs={index * 80} className="gap-4 bg-white">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-tendre text-rose-sombre">
                <Icon size={22} aria-hidden="true" />
              </span>
              <h3 className="text-xl font-medium">{card.title}</h3>
              <p className="text-base leading-relaxed text-charbon/80">{card.body}</p>
            </Card>
          );
        })}
      </div>

      {/* PACE — the one genuinely ordered protocol, so it gets the stepped treatment. */}
      <Reveal className="mt-12 rounded-3xl bg-sauge-doux p-8 md:p-10">
        <div className="flex flex-col gap-2 md:max-w-xl">
          <h3 className="text-xl font-medium text-rose-sombre">{brainGym.pace.label}</h3>
          <p className="text-base leading-relaxed text-rose-sombre/85">{brainGym.pace.intro}</p>
        </div>
        <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {brainGym.pace.steps.map((step) => (
            <li key={step.word} className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sauge-vif font-display text-lg text-white">
                {step.letter}
              </span>
              <div>
                <p className="font-semibold text-rose-sombre">{step.word}</p>
                <p className="text-sm leading-snug text-rose-sombre/75">{step.note}</p>
              </div>
            </li>
          ))}
        </ol>
      </Reveal>
    </Section>
  );
}
