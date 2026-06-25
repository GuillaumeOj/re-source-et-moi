import { ArrowUpRight } from "lucide-react";
import { LazyEight } from "@/components/brand/LazyEight";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { hero } from "@/content/hero";

export function Hero() {
  return (
    <section
      id="top"
      className="snap-section relative flex min-h-dvh items-center overflow-hidden bg-rose-tendre pt-24 pb-16 md:pt-28"
    >
      {/* Oversized ∞ traced forever by a slow comet — the page signature. */}
      <LazyEight
        durationMs={26000}
        strokeWidth={1.5}
        className="-z-0 pointer-events-none absolute top-1/2 left-1/2 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 text-rose-tendre"
      />

      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col items-start gap-6">
          <Eyebrow>{hero.eyebrow}</Eyebrow>
          <h1 className="max-w-xl text-[2.5rem] font-light leading-[1.08] md:text-6xl">
            {hero.titleLine1}
            <br />
            <span className="italic text-rose-vif">{hero.titleLine2}</span>
          </h1>
          <p className="max-w-md text-lg leading-relaxed text-charbon/85">{hero.subtitle}</p>
          <div className="mt-2 flex flex-wrap gap-3">
            <Button href={hero.primaryCta.href} variant="primary">
              {hero.primaryCta.label}
            </Button>
            <Button
              href={hero.secondaryCta.href}
              variant="secondary"
              iconRight={
                <ArrowUpRight
                  size={18}
                  className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              }
            >
              {hero.secondaryCta.label}
            </Button>
          </div>
        </div>

        <div className="flex justify-center lg:justify-end">
          <Logo
            title=""
            className="h-72 w-auto text-rose-sombre drop-shadow-[0_12px_40px_rgba(92,38,66,0.15)] md:h-96"
          />
        </div>
      </div>
    </section>
  );
}
