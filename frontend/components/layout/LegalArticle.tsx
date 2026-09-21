import type { LegalPage } from "@/content/legal";
import type { Route } from "@/content/routes";
import { PageHeader } from "./PageHeader";
import { PageShell } from "./PageShell";

/**
 * Shared layout for the standalone legal pages (mentions légales, politique de
 * confidentialité): a plain, contained prose article inside the site's PageShell.
 */
export function LegalArticle({ content, route }: { content: LegalPage; route: Route }) {
  return (
    <PageShell route={route}>
      <PageHeader eyebrow={content.eyebrow} title={content.title} intro={content.intro}>
        <p className="mt-3 text-sm text-charbon/60">Dernière mise à jour : {content.updatedAt}</p>
      </PageHeader>

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
    </PageShell>
  );
}
