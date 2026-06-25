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

// Fraction of the path that stays visible as the trailing segment.
const TRAIL = 0.42;

type LazyEightProps = {
  className?: string;
  strokeWidth?: number;
  /** Duration of one full trailing loop, in ms. */
  durationMs?: number;
};

/**
 * The page's signature element. Driven by Motion (concrete per-frame
 * stroke-dash values — reliable across browsers, incl. iOS Safari):
 *   1. draws in from the start point (top-left branch → bottom-right),
 *   2. then the fixed-length segment trails around the path forever.
 * Honours prefers-reduced-motion (renders a static, fully-drawn ∞).
 */
export function LazyEight({ className, strokeWidth = 1.5, durationMs = 6500 }: LazyEightProps) {
  const pathRef = useRef<SVGPathElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const path = pathRef.current;
    if (!path || reduce) return;

    const length = path.getTotalLength();
    const trail = length * TRAIL;
    let trailControls: ReturnType<typeof animate> | undefined;

    // Phase 1 — draw in from the start, tail anchored (segment grows 0 → trail).
    const drawIn = animate(0, 1, {
      duration: 1.6,
      delay: 0.4,
      ease: [0.65, 0, 0.35, 1],
      onUpdate: (t) => {
        path.style.strokeDasharray = `${trail * t} ${length}`;
        path.style.strokeDashoffset = "0";
      },
    });

    drawIn.finished
      .then(() => {
        // Phase 2 — the fixed-length segment trails around the path forever.
        path.style.strokeDasharray = `${trail} ${length - trail}`;
        trailControls = animate(0, 1, {
          duration: durationMs / 1000,
          ease: "linear",
          repeat: Number.POSITIVE_INFINITY,
          onUpdate: (p) => {
            path.style.strokeDashoffset = `${-length * p}`;
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
  }, [reduce, durationMs]);

  // The ∞ is always decorative — it sits alongside the named logo/headline.
  return (
    <svg viewBox="0 0 200 100" fill="none" className={className} aria-hidden="true">
      <path
        ref={pathRef}
        // `lazy8` hides the stroke until JS draws it (and shows a static, full
        // ∞ under prefers-reduced-motion). See globals.css.
        className="lazy8"
        d={INFINITY_PATH}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
