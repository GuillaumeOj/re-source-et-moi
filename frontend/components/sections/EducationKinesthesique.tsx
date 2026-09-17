import { Move3d, MoveHorizontal, MoveVertical } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { educationKinesthesique } from "@/content/education";

const axisIcons = [MoveHorizontal, MoveVertical, Move3d];

export function EducationKinesthesique() {
  return (
    <Section
      id="education-kinesthesique"
      background="creme"
      aria-labelledby="education-kinesthesique-title"
    >
      <SectionHeading
        id="education-kinesthesique-title"
        eyebrow={educationKinesthesique.eyebrow}
        title={educationKinesthesique.title}
        intro={educationKinesthesique.intro}
      />

      {/* La ligne médiane — the framing idea, then its three spatial axes. */}
      <Reveal className="mt-12 flex flex-col gap-2 md:max-w-2xl">
        <h3 className="text-xl font-medium text-rose-sombre">
          {educationKinesthesique.midline.label}
        </h3>
        <p className="text-base leading-relaxed text-charbon/80">
          {educationKinesthesique.midline.intro}
        </p>
      </Reveal>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {educationKinesthesique.axes.map((axis, index) => {
          const Icon = axisIcons[index];
          return (
            <Card key={axis.title} delayMs={index * 80} className="gap-4 bg-white">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-tendre text-rose-sombre">
                <Icon size={22} aria-hidden="true" />
              </span>
              <h3 className="text-xl font-medium">{axis.title}</h3>
              <p className="text-base leading-relaxed text-charbon/80">{axis.body}</p>
            </Card>
          );
        })}
      </div>

      {/* ECAP — the ordered protocol that opens every session, in É-C-A-P order. */}
      <Reveal className="mt-12 rounded-3xl bg-sauge-doux p-8 md:p-10">
        <div className="flex flex-col gap-2 md:max-w-xl">
          <h3 className="text-xl font-medium text-rose-sombre">
            {educationKinesthesique.ecap.label}
          </h3>
          <p className="text-base leading-relaxed text-rose-sombre/85">
            {educationKinesthesique.ecap.intro}
          </p>
        </div>
        <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {educationKinesthesique.ecap.steps.map((step) => (
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
