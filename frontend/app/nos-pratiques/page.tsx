import { Move3d, MoveHorizontal, MoveVertical } from "lucide-react";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { BrainGymTrademark } from "@/components/brand/BrainGymTrademark";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ExternalLink } from "@/components/ui/ExternalLink";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { IconBadge } from "@/components/ui/IconBadge";
import { ateliersCta } from "@/content/cta";
import { type Practice, pratiques } from "@/content/pratiques";
import { routes } from "@/content/routes";

export const metadata: Metadata = {
  title: pratiques.metaTitle,
  description: pratiques.metaDescription,
  alternates: { canonical: routes.pratiques.path },
};

const axisIcons = [MoveHorizontal, MoveVertical, Move3d];

/** One practice: its history, then a link to the school that teaches it. */
function PracticeArticle({ practice, children }: { practice: Practice; children?: ReactNode }) {
  const titleId = `${practice.id}-title`;
  return (
    // scroll-mt clears the fixed header when landing on the anchor from the home page.
    <section id={practice.id} aria-labelledby={titleId} className="scroll-mt-28 md:scroll-mt-32">
      <Eyebrow>{practice.eyebrow}</Eyebrow>
      <h2 id={titleId} className="mt-4 text-[1.8rem] font-normal md:text-4xl">
        {practice.title}
      </h2>

      <div className="mt-10 flex flex-col gap-10">
        {practice.subsections.map((subsection) => (
          <div key={subsection.heading} className="flex flex-col gap-3">
            <h3 className="text-xl font-medium text-rose-sombre md:text-2xl">
              {subsection.heading}
            </h3>
            {subsection.body.map((paragraph) => (
              <p key={paragraph.slice(0, 40)} className="leading-relaxed text-charbon/85">
                {paragraph}
              </p>
            ))}
          </div>
        ))}
      </div>

      {children}

      <p className="mt-10 leading-relaxed text-charbon/85">
        {practice.link.intro}{" "}
        <ExternalLink href={practice.link.href} className="font-semibold text-rose-sombre">
          {practice.link.label}
        </ExternalLink>
        .
      </p>
    </section>
  );
}

export default function NosPratiquesPage() {
  const { reperes } = pratiques;
  return (
    <PageShell route={routes.pratiques}>
      <PageHeader eyebrow={pratiques.eyebrow} title={pratiques.title} intro={pratiques.intro} />

      <div className="mt-16 flex flex-col gap-20">
        <PracticeArticle practice={pratiques.brainGym}>
          {/* The movement landmarks: the midline, its three axes, and the ECAP protocol. */}
          <div className="mt-12 flex flex-col gap-8">
            <h3 className="text-xl font-medium text-rose-sombre md:text-2xl">{reperes.title}</h3>

            <div className="flex flex-col gap-2">
              <h4 className="text-lg font-semibold">{reperes.midline.label}</h4>
              <p className="leading-relaxed text-charbon/85">{reperes.midline.intro}</p>
            </div>

            <ul className="grid gap-4 sm:grid-cols-3">
              {reperes.axes.map((axis, index) => (
                <Card key={axis.title} as="li" delayMs={index * 80} className="gap-3 bg-white">
                  <IconBadge icon={axisIcons[index]} />
                  <p className="font-semibold">{axis.title}</p>
                  <p className="text-sm leading-relaxed text-charbon/80">{axis.body}</p>
                </Card>
              ))}
            </ul>

            <div className="rounded-3xl bg-sauge-doux p-6 md:p-8">
              <h4 className="text-lg font-semibold text-rose-sombre">{reperes.ecap.label}</h4>
              <p className="mt-2 leading-relaxed text-rose-sombre/85">{reperes.ecap.intro}</p>
              <ol className="mt-6 grid gap-5 sm:grid-cols-2">
                {reperes.ecap.steps.map((step) => (
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
            </div>
          </div>
        </PracticeArticle>

        <PracticeArticle practice={pratiques.soiEnMouvement} />
      </div>

      <div className="mt-16">
        <Button href={ateliersCta.href}>{ateliersCta.label}</Button>
      </div>

      <BrainGymTrademark className="mt-16 border-charbon/10 border-t pt-6 text-sm text-charbon/60" />
    </PageShell>
  );
}
