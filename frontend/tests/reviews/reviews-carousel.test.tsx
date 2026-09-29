import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ReviewsCarousel } from "@/components/reviews/ReviewsCarousel";
import { temoignages } from "@/content/temoignages";
import { publicReview } from "./fixtures";

const reviews = Array.from({ length: 5 }, (_, index) =>
  publicReview({ id: String(index), text: `Avis ${index}`, author: `Auteur ${index}` }),
);

/** jsdom lays nothing out: give the track the sizes a desktop browser would. */
function layOut(track: HTMLElement, { scrollLeft }: { scrollLeft: number }) {
  Object.defineProperties(track, {
    clientWidth: { configurable: true, value: 900 },
    scrollWidth: { configurable: true, value: 1800 },
    scrollLeft: { configurable: true, value: scrollLeft, writable: true },
  });
  fireEvent.scroll(track);
}

function renderCarousel() {
  render(<ReviewsCarousel reviews={reviews} moreHref="/temoignages" />);
  return screen.getByRole("list");
}

describe("ReviewsCarousel", () => {
  it("shows every review and the link to the rest last", () => {
    renderCarousel();

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(6);
    expect(items[5]).toHaveTextContent(temoignages.seeAll);
  });

  it("offers only the right chevron at the start, and scrolls by one card", async () => {
    const track = renderCarousel();
    const scrollBy = vi.fn();
    track.scrollBy = scrollBy;
    vi.spyOn(track.firstElementChild as HTMLElement, "getBoundingClientRect").mockReturnValue({
      width: 280,
    } as DOMRect);
    layOut(track, { scrollLeft: 0 });

    expect(screen.getByRole("button", { name: temoignages.previous })).toBeDisabled();
    const next = screen.getByRole("button", { name: temoignages.next });
    expect(next).toBeEnabled();

    await userEvent.click(next);

    expect(scrollBy).toHaveBeenCalledWith(expect.objectContaining({ left: 280 }));
  });

  it("offers only the left chevron at the end", () => {
    const track = renderCarousel();
    layOut(track, { scrollLeft: 900 });

    expect(screen.getByRole("button", { name: temoignages.previous })).toBeEnabled();
    expect(screen.getByRole("button", { name: temoignages.next })).toBeDisabled();
  });
});
