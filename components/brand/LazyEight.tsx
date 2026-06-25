"use client";

import { animate } from "motion";
import { useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";

// A smooth, continuous lemniscate (horizontal figure-eight) crossing at its
// centre — the "huit couché" / Lazy 8 that the logo figure traces, and the
// fundamental Brain Gym movement. One single stroke, like the logo.
//
// The path STARTS at the left point and sweeps up over the top-left first, so
// the draw-in animation reads as "drawing from the top-left branch to the
// right", then down to the bottom-right, exactly matching the intended motion.
const INFINITY_PATH =
  "M30,50 C30,22 75,22 100,50 C125,78 170,78 170,50 C170,22 125,22 100,50 C75,78 30,78 30,50";

// Fraction of the path lit by the comet. A long trail so the head visibly draws
// new line while the tail erases the old line as the segment travels.
const TRAIL = 0.62;

// The comet's tail is a stack of sub-segments sharing the same moving head but
// reaching progressively further back, each at LAYER_OPACITY — so brightness
// accumulates toward the head and dissipates toward the tail (a comet, not a
// block). LAYER_OPACITY is tuned against LAYERS to build a near-solid head.
const LAYERS = 4;
const LAYER_OPACITY = 0.45;

type LazyEightProps = {
  className?: string;
  strokeWidth?: number;
  /** Duration of one full trailing loop, in ms. */
  durationMs?: number;
  /** Fraction of the path lit by the comet (0–1). */
  trail?: number;
};

/**
 * The page's signature element. Driven by Motion (concrete per-frame
 * stroke-dash values — reliable across browsers, incl. iOS Safari):
 *   1. draws in from the start point (top-left branch → bottom-right),
 *   2. then a long, tapered comet trails around the path forever.
 * Honours prefers-reduced-motion (renders a static, fully-drawn ∞).
 */
export function LazyEight({
  className,
  strokeWidth = 1.5,
  durationMs = 6500,
  trail = TRAIL,
}: LazyEightProps) {
  const groupRef = useRef<SVGGElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const group = groupRef.current;
    if (!group || reduce) return;

    const paths = Array.from(group.querySelectorAll<SVGPathElement>("path"));
    if (paths.length === 0) return;

    const length = paths[0].getTotalLength();
    const trailLen = length * trail;
    // Each layer's segment length: the head layer is shortest (brightest — every
    // layer overlaps it), the last reaches the full trail (faintest).
    const segLens = paths.map((_, i) => (trailLen * (i + 1)) / LAYERS);
    // Set opacity here (not inline) so the reduced-motion fallback — which never
    // runs this effect — keeps the paths at full opacity for the static ∞.
    paths.forEach((path) => {
      path.style.opacity = String(LAYER_OPACITY);
    });
    let trailControls: ReturnType<typeof animate> | undefined;

    // Phase 1 — draw in from the start: the head advances 0 → trail while each
    // layer's segment grows from nothing, so it reads as drawing forward. The
    // dash period is the path length, so the comet wraps the closed lemniscate
    // across its start/end seam continuously (no pop each loop).
    const drawIn = animate(0, 1, {
      duration: 1.6,
      delay: 0.4,
      ease: [0.65, 0, 0.35, 1],
      onUpdate: (t) => {
        const headLen = trailLen * t;
        paths.forEach((path, i) => {
          const seg = segLens[i] * t;
          path.style.strokeDasharray = `${seg} ${length - seg}`;
          path.style.strokeDashoffset = `${seg - headLen}`;
        });
      },
    });

    drawIn.finished
      .then(() => {
        // Phase 2 — the full comet trails forever, continuing forward from where
        // the draw-in left off (head at `trailLen`). The dash window is now
        // fixed, so set strokeDasharray once and only sweep the offset per frame.
        paths.forEach((path, i) => {
          path.style.strokeDasharray = `${segLens[i]} ${length - segLens[i]}`;
        });
        trailControls = animate(0, 1, {
          duration: durationMs / 1000,
          ease: "linear",
          repeat: Number.POSITIVE_INFINITY,
          onUpdate: (p) => {
            const headLen = trailLen + length * p;
            paths.forEach((path, i) => {
              path.style.strokeDashoffset = `${segLens[i] - headLen}`;
            });
          },
        });
      })
      .catch(() => {
        // Animation was cancelled on unmount — nothing to do.
      });

    return () => {
      drawIn.stop();
      trailControls?.stop();
    };
  }, [reduce, durationMs, trail]);

  // The ∞ is always decorative — it sits alongside the named logo/headline.
  return (
    <svg viewBox="0 0 200 100" fill="none" className={className} aria-hidden="true">
      <g ref={groupRef}>
        {Array.from({ length: LAYERS }, (_, i) => (
          <path
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length comet layer stack; never reordered.
            key={i}
            // `lazy8` hides the stroke until JS draws it (and shows a static,
            // full ∞ under prefers-reduced-motion). See globals.css.
            className="lazy8"
            d={INFINITY_PATH}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </g>
    </svg>
  );
}
