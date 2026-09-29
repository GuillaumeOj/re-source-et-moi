import type { Review } from "@/lib/api/reviews";

/** A published review as the public API returns it, overriding only what a test is about. */
export function publicReview(fields: Partial<Review> = {}): Review {
  return {
    id: "44444444-4444-4444-8444-444444444444",
    text: "J'ai retrouvé le plaisir d'apprendre.",
    author: "Camille",
    context: "Atelier découverte",
    ...fields,
  };
}
