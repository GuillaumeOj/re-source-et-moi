import type { Metadata } from "next";
import { connection } from "next/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageShell } from "@/components/layout/PageShell";
import { ReviewsWall } from "@/components/reviews/ReviewsWall";
import { routes } from "@/content/routes";
import { temoignages } from "@/content/temoignages";
import { getReviews } from "@/lib/api/client";

export const metadata: Metadata = {
  title: temoignages.page.metaTitle,
  description: temoignages.page.metaDescription,
  alternates: { canonical: routes.temoignages.path },
};

/**
 * Every published review, reached from the last block of the home page's carousel. The
 * first page renders on the server, so it is in the indexed HTML; the wall loads the
 * following ones from the browser as the visitor scrolls.
 */
export default async function TemoignagesPage() {
  // Request-time render, for the same reason as AgendaList — see the comment there.
  await connection();

  const page = await getReviews().catch((error: unknown) => {
    console.error("[TemoignagesPage] backend unreachable:", error);
    return null;
  });

  return (
    <PageShell route={routes.temoignages} width="wide">
      <PageHeader
        eyebrow={temoignages.eyebrow}
        title={temoignages.title}
        intro={temoignages.page.intro}
      />
      {page ? (
        <ReviewsWall initial={page} />
      ) : (
        <p className="mt-12 text-charbon/70">{temoignages.page.unavailable}</p>
      )}
    </PageShell>
  );
}
