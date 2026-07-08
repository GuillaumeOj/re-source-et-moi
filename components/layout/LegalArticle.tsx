import { Eyebrow } from "@/components/ui/Eyebrow";
import type { LegalPage } from "@/content/legal";
import { Footer } from "./Footer";
import { Header } from "./Header";

/**
 * Shared layout for the standalone legal pages (mentions légales, politique de
 * confidentialité). Reuses the site Header + Footer around a plain, contained
 * prose article — deliberately not the landing-page `Section` primitive, whose
 * full-viewport scroll-snap and eyebrow-driven H2 style suit the home page, not
 * long-form reading. Carrying no `.snap-section`, this page scrolls as normal
 * prose (see globals.css).
 */
export function LegalArticle({ content }: { content: LegalPage }) {
  return (
    <>
      <Header />
      {/* Flex column so a short legal page still pushes the footer to the bottom
          of the viewport (large screens), while long content lets it follow. */}
      <div className="flex min-h-dvh flex-col">
        <main className="flex-1 bg-creme text-charbon">
          <div className="mx-auto max-w-3xl px-6 pt-28 pb-20 md:pt-36 md:pb-28">
            <Eyebrow>{content.eyebrow}</Eyebrow>
            <h1 className="mt-4 text-[2rem] font-normal md:text-5xl">{content.title}</h1>
            <p className="mt-3 text-sm text-charbon/60">
              Dernière mise à jour : {content.updatedAt}
            </p>
            <p className="mt-6 text-lg leading-relaxed text-charbon/85">{content.intro}</p>

            <div className="mt-12 flex flex-col gap-10">
              {content.sections.map((section) => (
                <section key={section.heading} className="flex flex-col gap-3">
                  <h2 className="text-xl font-normal md:text-2xl">{section.heading}</h2>
                  {section.body.map((paragraph) => (
                    <p key={paragraph} className="leading-relaxed text-charbon/85">
                      {paragraph}
                    </p>
                  ))}
                </section>
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
