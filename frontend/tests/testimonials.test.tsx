import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Testimonials } from "@/components/sections/Testimonials";
import { temoignages } from "@/content/temoignages";
import type { Review } from "@/lib/api/client";

// An async Server Component: invoked and awaited rather than passed to render() — see
// workshops.test.tsx.
vi.mock("@/lib/api/client", () => ({ getReviews: vi.fn() }));
vi.mock("next/server", () => ({ connection: vi.fn().mockResolvedValue(undefined) }));

const { getReviews } = await import("@/lib/api/client");

function makeReview(overrides: Partial<Review> = {}): Review {
  return {
    id: "44444444-4444-4444-8444-444444444444",
    text: "J'ai retrouvé le plaisir d'apprendre.",
    author: "Camille",
    context: "Atelier découverte",
    ...overrides,
  };
}

async function renderTestimonials() {
  const tree = await Testimonials();
  return render(tree);
}

beforeEach(() => {
  vi.mocked(getReviews).mockResolvedValue([makeReview()]);
});

describe("Testimonials", () => {
  it("shows each review with its author and context, in the order the backend sends", async () => {
    vi.mocked(getReviews).mockResolvedValue([
      makeReview({ id: "1", author: "Camille" }),
      makeReview({
        id: "2",
        text: "Quelques gestes suffisent.",
        author: "Sophie",
        context: "Parent d'élève",
      }),
    ]);

    await renderTestimonials();

    expect(screen.getByRole("heading", { name: temoignages.title })).toBeInTheDocument();
    expect(screen.getByText(/Quelques gestes suffisent\./)).toBeInTheDocument();
    expect(screen.getAllByRole("figure").map((card) => card.textContent)).toEqual([
      expect.stringContaining("Camille — Atelier découverte"),
      expect.stringContaining("Sophie — Parent d'élève"),
    ]);
  });

  it("leaves the dash out when a review has no context", async () => {
    vi.mocked(getReviews).mockResolvedValue([makeReview({ author: "Anne", context: "" })]);

    await renderTestimonials();

    expect(screen.getByRole("figure").textContent).not.toContain("—");
  });

  it("hides the whole section when no review is published", async () => {
    vi.mocked(getReviews).mockResolvedValue([]);

    const { container } = await renderTestimonials();

    expect(container).toBeEmptyDOMElement();
  });

  it("hides the whole section when the backend is unreachable", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(getReviews).mockRejectedValue(new Error("down"));

    const { container } = await renderTestimonials();

    expect(container).toBeEmptyDOMElement();
  });
});
