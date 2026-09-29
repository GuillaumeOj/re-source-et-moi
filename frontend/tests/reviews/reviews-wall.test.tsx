import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { dealIntoColumns, ReviewsWall } from "@/components/reviews/ReviewsWall";
import { temoignages } from "@/content/temoignages";
import type { Review } from "@/lib/api/reviews";
import { page } from "../pagination";
import { publicReview } from "./fixtures";

vi.mock("@/lib/api/reviews", () => ({ fetchReviewsPage: vi.fn() }));

const { fetchReviewsPage } = await import("@/lib/api/reviews");

function makeReview(id: string, text = `Avis ${id}`): Review {
  return publicReview({ id, text, author: `Auteur ${id}` });
}

// The IntersectionObserver stub in vitest.setup.ts never fires; this one lets a test
// scroll the sentinel into view.
let intersect: () => void = () => {};
class ObserverStub {
  constructor(private readonly callback: IntersectionObserverCallback) {}
  observe() {
    intersect = () =>
      this.callback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        this as unknown as IntersectionObserver,
      );
  }
  disconnect() {}
}
const original = globalThis.IntersectionObserver;

beforeEach(() => {
  vi.clearAllMocks();
  globalThis.IntersectionObserver = ObserverStub as unknown as typeof IntersectionObserver;
});

afterEach(() => {
  globalThis.IntersectionObserver = original;
});

describe("dealIntoColumns", () => {
  it("puts each review in the shortest column so far, keeping the order within each", () => {
    const reviews = [
      makeReview("1", "x".repeat(500)),
      makeReview("2"),
      makeReview("3"),
      makeReview("4"),
    ];

    const columns = dealIntoColumns(reviews, 2).map((column) => column.map(({ id }) => id));

    expect(columns).toEqual([["1"], ["2", "3", "4"]]);
  });

  it("never moves a placed review when more are appended", () => {
    const first = [makeReview("1", "x".repeat(300)), makeReview("2"), makeReview("3")];
    const more = [...first, makeReview("4"), makeReview("5")];

    const before = dealIntoColumns(first, 3);
    const after = dealIntoColumns(more, 3);

    before.forEach((column, index) => {
      expect(after[index].slice(0, column.length)).toEqual(column);
    });
  });
});

describe("ReviewsWall", () => {
  it("renders the first page it is given", () => {
    render(<ReviewsWall initial={page([makeReview("1"), makeReview("2")])} />);

    expect(screen.getAllByRole("figure")).toHaveLength(2);
    expect(screen.queryByRole("button", { name: temoignages.page.loadMore })).toBeNull();
  });

  it("loads the next page when the bottom comes into view, until there is none", async () => {
    vi.mocked(fetchReviewsPage).mockResolvedValue(page([makeReview("3")]));
    render(
      <ReviewsWall initial={page([makeReview("1"), makeReview("2")], { next: "/api/?page=2" })} />,
    );

    await act(async () => intersect());

    expect(fetchReviewsPage).toHaveBeenCalledWith(2);
    expect(await screen.findByText(/Avis 3/)).toBeInTheDocument();
    expect(screen.getAllByRole("figure")).toHaveLength(3);
    expect(screen.queryByRole("button", { name: temoignages.page.loadMore })).toBeNull();
  });

  it("skips a review the previous page already showed", async () => {
    vi.mocked(fetchReviewsPage).mockResolvedValue(page([makeReview("2"), makeReview("3")]));
    render(<ReviewsWall initial={page([makeReview("1"), makeReview("2")], { next: "next" })} />);

    await userEvent.click(screen.getByRole("button", { name: temoignages.page.loadMore }));

    expect(await screen.findByText(/Avis 3/)).toBeInTheDocument();
    expect(screen.getAllByRole("figure")).toHaveLength(3);
  });

  it("offers a retry when a page fails to load", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(fetchReviewsPage).mockRejectedValueOnce(new Error("down"));
    vi.mocked(fetchReviewsPage).mockResolvedValueOnce(page([makeReview("3")]));
    render(<ReviewsWall initial={page([makeReview("1")], { next: "next" })} />);

    await userEvent.click(screen.getByRole("button", { name: temoignages.page.loadMore }));
    const retry = await screen.findByRole("button", { name: temoignages.page.retry });
    expect(screen.getByText(temoignages.page.loadError)).toBeInTheDocument();

    await userEvent.click(retry);

    expect(await screen.findByText(/Avis 3/)).toBeInTheDocument();
    expect(fetchReviewsPage).toHaveBeenLastCalledWith(2);
  });

  it("says so when there is no review at all", () => {
    render(<ReviewsWall initial={page([])} />);

    expect(screen.getByText(temoignages.page.empty)).toBeInTheDocument();
  });
});
