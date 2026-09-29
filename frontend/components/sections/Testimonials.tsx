import { connection } from "next/server";
import { ReviewsCarousel } from "@/components/reviews/ReviewsCarousel";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { routes } from "@/content/routes";
import { temoignages } from "@/content/temoignages";
import { getReviews } from "@/lib/api/client";

/**
 * "Ce qu'ils en retiennent": the most recent published reviews (up to
 * `temoignages.homeCount`), fetched from the backend, in a carousel. When there are more,
 * a last block links to the "Témoignages" page.
 *
 * Unlike the tariffs, the whole section goes when there is nothing to show — no review
 * published, or the backend unreachable. A heading over "reviews are unavailable" would
 * tell a visitor nothing useful, and the step indicator drops the section's dot when it
 * is missing (see StepIndicator).
 */
export async function Testimonials() {
  // Request-time render, for the same reason as AgendaList — see the comment there.
  await connection();

  const page = await getReviews({ pageSize: temoignages.homeCount }).catch((error: unknown) => {
    console.error("[Testimonials] backend unreachable:", error);
    return null;
  });

  if (!page || page.results.length === 0) {
    return null;
  }

  return (
    <Section id="temoignages" background="creme" aria-labelledby="temoignages-title">
      <SectionHeading
        id="temoignages-title"
        eyebrow={temoignages.eyebrow}
        title={temoignages.title}
      />

      <ReviewsCarousel
        reviews={page.results}
        moreHref={page.count > page.results.length ? routes.temoignages.path : undefined}
      />
    </Section>
  );
}
