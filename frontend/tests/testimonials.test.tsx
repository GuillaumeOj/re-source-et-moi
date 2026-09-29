import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Testimonials } from "@/components/sections/Testimonials";
import { routes } from "@/content/routes";
import { temoignages } from "@/content/temoignages";
import { page } from "./pagination";
import { publicReview as makeReview } from "./reviews/fixtures";

// An async Server Component: invoked and awaited rather than passed to render() — see
// workshops.test.tsx.
vi.mock("@/lib/api/client", () => ({ getReviews: vi.fn() }));
vi.mock("next/server", () => ({ connection: vi.fn().mockResolvedValue(undefined) }));

const { getReviews } = await import("@/lib/api/client");

async function renderTestimonials() {
  const tree = await Testimonials();
  return render(tree);
}

beforeEach(() => {
  vi.mocked(getReviews).mockResolvedValue(page([makeReview()]));
});

describe("Testimonials", () => {
  it("asks the backend for the home page's five", async () => {
    await renderTestimonials();

    expect(getReviews).toHaveBeenCalledWith({ pageSize: temoignages.homeCount });
  });

  it("shows each review with its author and context, in the order the backend sends", async () => {
    vi.mocked(getReviews).mockResolvedValue(
      page([
        makeReview({ id: "1", author: "Camille" }),
        makeReview({
          id: "2",
          text: "Quelques gestes suffisent.",
          author: "Sophie",
          context: "Parent d'élève",
        }),
      ]),
    );

    await renderTestimonials();

    expect(screen.getByRole("heading", { name: temoignages.title })).toBeInTheDocument();
    expect(screen.getByText(/Quelques gestes suffisent\./)).toBeInTheDocument();
    expect(screen.getAllByRole("figure").map((card) => card.textContent)).toEqual([
      expect.stringContaining("Camille — Atelier découverte"),
      expect.stringContaining("Sophie — Parent d'élève"),
    ]);
  });

  it("leaves the dash out when a review has no context", async () => {
    vi.mocked(getReviews).mockResolvedValue(page([makeReview({ author: "Anne", context: "" })]));

    await renderTestimonials();

    expect(screen.getByRole("figure").textContent).not.toContain("—");
  });

  it("links to every review when there are more than it shows", async () => {
    const five = Array.from({ length: 5 }, (_, index) => makeReview({ id: String(index) }));
    vi.mocked(getReviews).mockResolvedValue(page(five, { count: 8 }));

    await renderTestimonials();

    expect(screen.getAllByRole("figure")).toHaveLength(5);
    expect(screen.getByRole("link", { name: temoignages.seeAll })).toHaveAttribute(
      "href",
      routes.temoignages.path,
    );
  });

  it("has no such link when every review is already shown", async () => {
    await renderTestimonials();

    expect(screen.queryByRole("link", { name: temoignages.seeAll })).not.toBeInTheDocument();
  });

  it("hides the whole section when no review is published", async () => {
    vi.mocked(getReviews).mockResolvedValue(page([]));

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
