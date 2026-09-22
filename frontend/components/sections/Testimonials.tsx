import { connection } from "next/server";
import { Card } from "@/components/ui/Card";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { temoignages } from "@/content/temoignages";
import { getReviews } from "@/lib/api/client";

/**
 * "Ce qu'ils en retiennent": the most recent published reviews, fetched from the backend
 * (the backend keeps only the three newest).
 *
 * Unlike the tariffs, the whole section goes when there is nothing to show — no review
 * published, or the backend unreachable. A heading over "reviews are unavailable" would
 * tell a visitor nothing useful, and the step indicator drops the section's dot when it
 * is missing (see StepIndicator).
 */
export async function Testimonials() {
  // Request-time render, for the same reason as AgendaList — see the comment there.
  await connection();

  const reviews = await getReviews().catch((error: unknown) => {
    console.error("[Testimonials] backend unreachable:", error);
    return [];
  });

  if (reviews.length === 0) {
    return null;
  }

  return (
    <Section id="temoignages" background="creme" aria-labelledby="temoignages-title">
      <SectionHeading
        id="temoignages-title"
        eyebrow={temoignages.eyebrow}
        title={temoignages.title}
      />

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {reviews.map((review, index) => (
          <Card key={review.id} as="figure" delayMs={index * 70} className="gap-5 bg-white">
            <blockquote className="font-display text-xl text-rose-sombre italic leading-snug">
              «&nbsp;{review.text}&nbsp;»
            </blockquote>
            <figcaption className="mt-auto text-sm">
              <span className="font-semibold text-rose-sombre">{review.author}</span>
              {review.context && <span className="text-charbon/60"> — {review.context}</span>}
            </figcaption>
          </Card>
        ))}
      </div>
    </Section>
  );
}
