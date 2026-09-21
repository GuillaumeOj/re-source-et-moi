import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { fondatrice } from "@/content/fondatrice";
import { Portrait } from "./founder/Portrait";

export function Founder() {
  return (
    <Section id="a-propos" background="rose-tendre" aria-labelledby="a-propos-title">
      <div className="grid items-center gap-12 lg:grid-cols-[0.8fr_1fr]">
        <Reveal className="relative">
          <Portrait sizes="(max-width: 1024px) 100vw, 40vw" />
        </Reveal>

        <div className="flex flex-col gap-6">
          <SectionHeading
            id="a-propos-title"
            eyebrow={`${fondatrice.eyebrow} · ${fondatrice.name}`}
            title={fondatrice.title}
          />
          <p className="-mt-2 font-display text-xl text-rose-vif">
            {fondatrice.name} — {fondatrice.role}
          </p>
          <blockquote className="border-rose-vif border-l-2 pl-5 font-display text-2xl text-rose-sombre italic md:text-3xl">
            «&nbsp;{fondatrice.quote}&nbsp;»
          </blockquote>
          <div className="flex flex-col gap-4 text-base leading-relaxed text-charbon/85">
            {fondatrice.bio.map((paragraph) => (
              <p key={paragraph.slice(0, 24)}>{paragraph}</p>
            ))}
          </div>
          <div>
            <Button href={fondatrice.more.href}>{fondatrice.more.label}</Button>
          </div>
        </div>
      </div>
    </Section>
  );
}
