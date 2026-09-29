import { ReviewText } from "@/components/reviews/ReviewText";
import { Card } from "@/components/ui/Card";
import type { Review } from "@/lib/api/reviews";
import { cn } from "@/lib/cn";

type ReviewCardProps = {
  review: Review;
  /** Cut long texts behind a "Lire la suite" toggle (the home page carousel). */
  truncate?: boolean;
  delayMs?: number;
  className?: string;
};

/** One review as a card: the quote, then who wrote it and in what context. */
export function ReviewCard({ review, truncate, delayMs, className }: ReviewCardProps) {
  return (
    <Card as="figure" delayMs={delayMs} className={cn("gap-5 bg-white", className)}>
      <ReviewText text={review.text} truncate={truncate} />
      <figcaption className="mt-auto text-sm">
        <span className="font-semibold text-rose-sombre">{review.author}</span>
        {review.context && <span className="text-charbon/60"> — {review.context}</span>}
      </figcaption>
    </Card>
  );
}
