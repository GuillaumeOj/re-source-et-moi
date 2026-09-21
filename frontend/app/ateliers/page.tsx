import { CalendarDays, List } from "lucide-react";
import type { Metadata } from "next";
import { AgendaCalendar } from "@/components/agenda/AgendaCalendar";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageShell } from "@/components/layout/PageShell";
import { AgendaList } from "@/components/sections/workshops/AgendaList";
import { PricingSection } from "@/components/sections/workshops/PricingSection";
import { agenda } from "@/content/ateliers";
import { routes } from "@/content/routes";
import { monthOf, parseMonth } from "@/lib/calendar";
import { cn } from "@/lib/cn";
import { parisToday } from "@/lib/format";

export const metadata: Metadata = {
  title: agenda.metaTitle,
  description: agenda.metaDescription,
  alternates: { canonical: routes.ateliers.path },
};

type SearchParams = Record<string, string | string[] | undefined>;

/** A single query value; a repeated one (`?vue=a&vue=b`) counts as absent. */
function param(params: SearchParams, name: string): string | undefined {
  const value = params[name];
  return typeof value === "string" ? value : undefined;
}

/**
 * Every workshop — the upcoming ones as a list, or month by month in a calendar — and
 * the tariffs under them. The header's "Ateliers & tarifs" link lands here.
 *
 * The view and the month live in the URL (`?vue=calendrier&mois=2026-10`), as in the
 * editor, so a link or a reload lands on the same screen. Both views render on the server
 * and switching is a plain link, so the page works — and is indexed — without JavaScript.
 * A missing or malformed month falls back to the current one rather than a 404: it is a
 * view setting, not a resource.
 *
 * Laid out in the PageShell like the legal pages rather than with the home page's
 * Section, whose full-viewport scroll-snap suits a landing page, not a growing agenda.
 */
export default async function AteliersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const view = param(params, "vue") === "calendrier" ? "calendrier" : "liste";
  const month = parseMonth(param(params, "mois")) ?? monthOf(parisToday());

  const views = [
    { id: "liste", label: agenda.views.list, href: routes.ateliers.path, icon: List },
    {
      id: "calendrier",
      label: agenda.views.calendar,
      href: `${routes.ateliers.path}?vue=calendrier`,
      icon: CalendarDays,
    },
  ] as const;

  return (
    <PageShell route={routes.ateliers} width="wide">
      <PageHeader eyebrow={agenda.eyebrow} title={agenda.title} intro={agenda.intro} />

      <nav aria-label={agenda.viewsLabel} className="mt-10">
        <ul className="inline-flex rounded-full bg-white p-1 shadow-soft">
          {views.map(({ id, label, href, icon: Icon }) => (
            <li key={id}>
              <a
                href={href}
                aria-current={view === id ? "page" : undefined}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                  view === id
                    ? "bg-rose-sombre text-creme"
                    : "text-rose-sombre hover:bg-rose-tendre",
                )}
              >
                <Icon size={16} aria-hidden="true" />
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {view === "calendrier" ? <AgendaCalendar month={month} /> : <AgendaList />}

      {/* Under both views: the tariffs don't depend on which one is shown. */}
      <div id="tarifs" className="scroll-mt-28 md:scroll-mt-32">
        <PricingSection />
      </div>
    </PageShell>
  );
}
