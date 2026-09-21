import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageShell } from "@/components/layout/PageShell";
import { Portrait } from "@/components/sections/founder/Portrait";
import { Button } from "@/components/ui/Button";
import { ExternalLink } from "@/components/ui/ExternalLink";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ateliersCta } from "@/content/cta";
import { fondatrice } from "@/content/fondatrice";
import { routes } from "@/content/routes";

export const metadata: Metadata = {
  title: fondatrice.page.metaTitle,
  description: fondatrice.page.metaDescription,
  alternates: { canonical: routes.aPropos.path },
};

/** Cécile's own account of her path, in full. */
export default function AProposPage() {
  const { page } = fondatrice;
  return (
    <PageShell route={routes.aPropos} width="wide">
      <div className="grid gap-12 lg:grid-cols-[0.7fr_1fr] lg:gap-16">
        <div className="lg:sticky lg:top-32 lg:self-start">
          {/* Capped at max-w-md (28rem), less the page gutters on a phone. */}
          <Portrait
            sizes="(max-width: 1024px) min(calc(100vw - 3rem), 28rem), 28rem"
            preload
            className="max-w-md"
          />
        </div>

        <div className="max-w-2xl">
          <PageHeader eyebrow={fondatrice.eyebrow} title={fondatrice.fullName}>
            <p className="mt-3 font-display text-xl text-rose-vif">{page.subtitle}</p>
          </PageHeader>

          <div className="mt-10 flex flex-col gap-5 text-lg leading-relaxed text-charbon/85">
            {fondatrice.fullBio.map((paragraph) => (
              <p key={paragraph.slice(0, 40)}>{paragraph}</p>
            ))}
          </div>

          <div className="mt-12 flex flex-col gap-3">
            <Eyebrow>{page.certificationsLabel}</Eyebrow>
            <ul className="flex flex-wrap gap-x-6 gap-y-2">
              {page.certifications.map((school) => (
                <li key={school.href}>
                  <ExternalLink href={school.href} className="font-semibold text-rose-sombre">
                    {school.label}
                  </ExternalLink>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-12">
            <Button href={ateliersCta.href}>{ateliersCta.label}</Button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
