import Image from "next/image";
import { LazyEight } from "@/components/brand/LazyEight";
import { Logo } from "@/components/brand/Logo";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { fondatrice } from "@/content/fondatrice";

export function Fondatrice() {
  return (
    <Section id="a-propos" background="rose-tendre" aria-labelledby="a-propos-title">
      <div className="grid items-center gap-12 lg:grid-cols-[0.8fr_1fr]">
        <Reveal className="relative">
          {/* Portrait slot — replace with a real 4:5 image (set fondatrice.photo). */}
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-creme shadow-soft-lg">
            {fondatrice.photo ? (
              <Image
                src="/fondatrice.jpg"
                alt={fondatrice.photoAlt}
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-4 text-rose-sombre/30">
                <Logo title="" className="h-28 w-auto" />
                <span className="text-xs font-semibold uppercase tracking-[0.18em]">
                  Portrait de Cécile à venir
                </span>
              </div>
            )}
          </div>
          <LazyEight className="-right-5 -top-5 absolute h-14 w-24 text-rose-vif" />
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
        </div>
      </div>
    </Section>
  );
}
