import type { ReactNode } from "react";
import { JsonLd } from "@/components/seo/JsonLd";
import type { Route } from "@/content/routes";
import { cn } from "@/lib/cn";
import { buildBreadcrumbJsonLd } from "@/lib/jsonld";
import { Breadcrumb } from "./Breadcrumb";
import { Footer } from "./Footer";
import { Header } from "./Header";

type PageShellProps = {
  /** The page being rendered: drives the breadcrumb and the header's current link. */
  route: Route;
  /** "prose" for reading pages, "wide" for the agenda and the portrait layout. */
  width?: "prose" | "wide";
  /** Structured data specific to this page, in addition to its breadcrumb. */
  jsonLd?: object;
  children: ReactNode;
};

/**
 * Everything around a standalone page (nos pratiques, ateliers, à propos, questions, the
 * legal pages): header, breadcrumb, content column, footer, and the page's structured data.
 *
 * Deliberately not the landing-page `Section` primitive, whose full-viewport scroll-snap
 * suits the home page, not long-form reading: carrying no `.snap-section`, these pages
 * scroll normally (see globals.css). The flex column pushes the footer to the bottom of
 * the viewport when the content is short, and lets it follow when it is long.
 */
export function PageShell({ route, width = "prose", jsonLd, children }: PageShellProps) {
  return (
    <>
      <Header currentPath={route.path} />
      <div className="flex min-h-dvh flex-col">
        <main className="flex-1 bg-creme text-charbon">
          <div
            className={cn(
              "mx-auto px-6 pt-28 pb-20 md:pt-36 md:pb-28",
              width === "prose" ? "max-w-3xl" : "max-w-6xl",
            )}
          >
            <Breadcrumb route={route} />
            {children}
          </div>
        </main>
        <Footer />
      </div>
      <JsonLd data={buildBreadcrumbJsonLd(route)} />
      {jsonLd ? <JsonLd data={jsonLd} /> : null}
    </>
  );
}
