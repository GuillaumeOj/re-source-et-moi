"use client";

import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import { temoignages } from "@/content/temoignages";
import type { Review } from "@/lib/api/reviews";
import { cn } from "@/lib/cn";

type ReviewsCarouselProps = {
  reviews: Review[];
  /** The full "Témoignages" page, linked from a last block when there are more reviews. */
  moreHref?: string;
};

// A card's share of the track: most of the width on a phone, then two, then three side by
// side, always a little short of a whole number so the next card peeks out from under the
// fading edge and says there is more. 1.5rem is the gap.
const SLIDE =
  "shrink-0 snap-start basis-[85%] sm:basis-[calc((100%-1.5rem)/2.2)] md:basis-[calc((100%-3rem)/3.25)]";

/**
 * Fade the track's edges out on the sides where there is more to scroll to, so a card cut
 * by the edge dissolves instead of stopping on a hard line. A mask rather than a gradient
 * overlay: it needs no background colour to match, and the cards stay clickable under it.
 * `--fade` is the width of the fade, set per breakpoint on the track.
 */
function edgeMask(fadeStart: boolean, fadeEnd: boolean): CSSProperties {
  const mask = `linear-gradient(to right, ${fadeStart ? "transparent" : "#000"}, #000 var(--fade), #000 calc(100% - var(--fade)), ${fadeEnd ? "transparent" : "#000"})`;
  return { maskImage: mask, WebkitMaskImage: mask };
}

/**
 * The home page's reviews in a horizontal track: three visible on a desktop, the rest
 * reached with the chevrons (or a swipe, or the keyboard, since the track is a plain
 * scroll container with snap points). The chevrons only show when there is somewhere to
 * go in their direction.
 */
export function ReviewsCarousel({ reviews, moreHref }: ReviewsCarouselProps) {
  const track = useRef<HTMLUListElement>(null);
  const [canPrevious, setCanPrevious] = useState(false);
  const [canNext, setCanNext] = useState(false);

  useEffect(() => {
    const node = track.current;
    if (!node) return;
    // Two booleans rather than one object: an unchanged boolean skips the re-render, so
    // scrolling only re-renders when an edge is reached or left.
    const update = () => {
      // A pixel of slack: fractional widths can leave the end one sub-pixel short.
      setCanPrevious(node.scrollLeft > 1);
      setCanNext(node.scrollLeft + node.clientWidth < node.scrollWidth - 1);
    };
    update();
    node.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      node.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const scroll = (direction: 1 | -1) => {
    const node = track.current;
    const slide = node?.firstElementChild;
    if (!node || !slide) return;
    const gap = Number.parseFloat(getComputedStyle(node).columnGap) || 0;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    node.scrollBy({
      left: direction * (slide.getBoundingClientRect().width + gap),
      behavior: reduceMotion ? "auto" : "smooth",
    });
  };

  return (
    // The chevrons sit beside the track, never over a card: under it, right-aligned, on a
    // phone (where the track runs edge to edge), on either side of it from md up.
    <div className="mt-12 flex flex-wrap items-center justify-end gap-3 md:flex-nowrap md:gap-0">
      <CarouselButton direction="previous" visible={canPrevious} onClick={() => scroll(-1)} />
      <ul
        ref={track}
        // A scroll container clips whatever overflows it, shadows included. The padding
        // leaves room for shadow-soft (a 40px blur, 8px down): on a phone it is cancelled
        // by a negative margin, so the track spans the section's gutter to the screen
        // edges; from md up it is the space between the chevrons and the cards.
        // items-stretch: every card takes the track's height, i.e. the tallest card's, and
        // its caption sits at the bottom (mt-auto), so the row reads as one even band.
        className="order-first -mx-6 -mt-6 -mb-10 flex w-[calc(100%+3rem)] min-w-0 snap-x snap-mandatory scroll-px-6 items-stretch gap-6 overflow-x-auto px-6 pt-6 pb-10 [--fade:2rem] [scrollbar-width:none] md:order-none md:mx-0 md:w-auto md:flex-1 md:scroll-px-8 md:px-8 md:[--fade:4rem] [&::-webkit-scrollbar]:hidden"
        style={edgeMask(canPrevious, canNext)}
      >
        {reviews.map((review, index) => (
          <li key={review.id} className={cn(SLIDE, "flex")}>
            <ReviewCard review={review} truncate delayMs={index * 70} className="w-full" />
          </li>
        ))}
        {moreHref ? (
          <li className={SLIDE}>
            <a
              href={moreHref}
              className="flex h-full min-h-48 flex-col items-center justify-center gap-3 rounded-3xl bg-rose-tendre p-8 text-center font-display text-xl text-rose-sombre shadow-soft transition-colors hover:bg-rose-tendre/70"
            >
              {temoignages.seeAll}
              <ArrowRight size={24} aria-hidden="true" />
            </a>
          </li>
        ) : null}
      </ul>
      <CarouselButton direction="next" visible={canNext} onClick={() => scroll(1)} />
    </div>
  );
}

function CarouselButton({
  direction,
  visible,
  onClick,
}: {
  direction: "previous" | "next";
  visible: boolean;
  onClick: () => void;
}) {
  const Icon = direction === "next" ? ChevronRight : ChevronLeft;
  const label = direction === "next" ? temoignages.next : temoignages.previous;
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={!visible}
      onClick={onClick}
      className={cn(
        // Hidden rather than removed, so the track doesn't change width as they come and go.
        "flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-rose-sombre shadow-soft transition-opacity hover:bg-rose-tendre",
        visible ? "opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      <Icon size={22} aria-hidden="true" />
    </button>
  );
}
