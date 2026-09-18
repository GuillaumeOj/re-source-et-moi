"use client";

import { animate } from "motion";
import { useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";

// A smooth, continuous lemniscate (horizontal figure-eight) crossing at its
// centre — the "huit couché" / Lazy 8 that the logo figure traces, and the
// fundamental Brain Gym movement. One single stroke, like the logo.
//
// The path is just the TRACK to follow: a comet — a bright head trailing a
// tapered tail — travels along it forever.
const INFINITY_PATH =
  "M30,50 C30,22 75,22 100,50 C125,78 170,78 170,50 C170,22 125,22 100,50 C75,78 30,78 30,50";

// The viewBox the path is authored in. Everything is drawn in these coordinates
// and then stretched to fill the canvas on each axis independently — so a
// narrower container squashes the ∞ rather than shrinking it.
const VIEW_W = 200;
const VIEW_H = 100;
const TAU = Math.PI * 2;

// The comet's tail is a single tapered ribbon following the track: full width
// at the head, narrowing to a point at the tail. RIBBON_STEPS is how many
// centreline points we build it from (more = smoother edge). Drawing it is one
// fill per frame — far cheaper than a thousand <circle> nodes or arcs.
const RIBBON_STEPS = 180;
// Length of the tail, as a fraction of the whole path length.
const TRAIL_SPAN = 0.24;
// Half-width of the ribbon at distance `u` behind the head (0 = head, 1 = tail
// tip). Matches the head radius at the front and tapers to a point at the back.
function halfWidth(u: number, dotRadius: number) {
  return dotRadius * (1 - u) ** 1.4;
}

// Fallback for --color-rose-vif when the CSS var can't be resolved. Keep in
// sync with globals.css; the rgb triplet for the trail is derived from it.
const ROSE_VIF_FALLBACK = "#c4749a";

// Resolve a CSS custom property (with fallback) against an element.
function cssVar(styles: CSSStyleDeclaration, name: string, fallback: string) {
  return styles.getPropertyValue(name).trim() || fallback;
}

// Parse "#rrggbb" / "rgb(r,g,b)" into an "r,g,b" string for building rgba()
// gradient stops (so the fade goes to transparent of the SAME colour, not to
// transparent black — which would dirty the edges).
function rgbTriplet(color: string, fallback: string) {
  const hex = color.match(/^#([0-9a-f]{6})$/i);
  if (hex) {
    const n = Number.parseInt(hex[1], 16);
    return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
  }
  const rgb = color.match(/(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
  if (rgb) return `${rgb[1]},${rgb[2]},${rgb[3]}`;
  return fallback;
}

type LazyEightProps = {
  className?: string;
  strokeWidth?: number;
  /** Duration of one full loop around the path, in ms. */
  durationMs?: number;
  /** Radius of the comet's head, in viewBox units. */
  dotRadius?: number;
};

/**
 * The page's signature element: a faint static Lazy-8 (∞) track with a comet —
 * a dark-red head trailing a tapered, fading ribbon — that follows the path
 * forever. The tail is a single filled path, drawn on a <canvas>. Honours
 * prefers-reduced-motion (the head rests at the path's start point, no tail).
 */
export function LazyEight({
  className,
  strokeWidth = 1.5,
  durationMs = 6500,
  dotRadius = 0.05,
}: LazyEightProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    // Sample the path geometry ONCE into a lookup table, so per-frame work is
    // just cheap array reads — never getPointAtLength (expensive) per point.
    // A detached <path> is enough to query geometry; it's never shown.
    const pathEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pathEl.setAttribute("d", INFINITY_PATH);
    const length = pathEl.getTotalLength();

    const SAMPLES = 2048;
    const xs = new Float32Array(SAMPLES);
    const ys = new Float32Array(SAMPLES);
    for (let i = 0; i < SAMPLES; i++) {
      const pt = pathEl.getPointAtLength((i / SAMPLES) * length);
      xs[i] = pt.x;
      ys[i] = pt.y;
    }
    // Unit normal (tangent rotated 90°) at each sample. Frame-invariant — only
    // which sample the head reads changes — so compute it once here and the
    // per-frame ribbon loop becomes pure array reads (no hypot/divide).
    const nux = new Float32Array(SAMPLES);
    const nuy = new Float32Array(SAMPLES);
    for (let i = 0; i < SAMPLES; i++) {
      const i0 = (i - 1 + SAMPLES) % SAMPLES;
      const i1 = (i + 1) % SAMPLES;
      const nx = ys[i0] - ys[i1];
      const ny = xs[i1] - xs[i0];
      const nlen = Math.hypot(nx, ny) || 1;
      nux[i] = nx / nlen;
      nuy[i] = ny / nlen;
    }
    // Map an arc length to its sample index (path is closed, so wrap around).
    const idxAt = (len: number) =>
      ((Math.round((len / length) * SAMPLES) % SAMPLES) + SAMPLES) % SAMPLES;

    // Precompute, per ribbon step, the sample-index offset behind the head and
    // the half-width there — so the draw loop only reads arrays.
    const trailLen = length * TRAIL_SPAN;
    const stepIdx = new Int32Array(RIBBON_STEPS + 1);
    const stepW = new Float32Array(RIBBON_STEPS + 1);
    for (let k = 0; k <= RIBBON_STEPS; k++) {
      const u = k / RIBBON_STEPS;
      stepIdx[k] = idxAt(u * trailLen);
      stepW[k] = halfWidth(u, dotRadius);
    }
    // Scratch buffers for the two ribbon edges (left and right of the centreline).
    const lx = new Float32Array(RIBBON_STEPS + 1);
    const ly = new Float32Array(RIBBON_STEPS + 1);
    const rx = new Float32Array(RIBBON_STEPS + 1);
    const ry = new Float32Array(RIBBON_STEPS + 1);

    // Resolve colours from the canvas's computed style (CSS vars + currentColor).
    const styles = getComputedStyle(canvas);
    const headColor = cssVar(styles, "--color-rose-vif", ROSE_VIF_FALLBACK);
    const trailRgb = rgbTriplet(headColor, "196,116,154");
    const trackColor = styles.color; // the path uses currentColor
    const trackPath = new Path2D(INFINITY_PATH);

    // Stretch the viewBox to fill the canvas on each axis (per-axis scale, no
    // letterboxing), and keep it crisp on HiDPI screens. Recomputed on resize.
    let sx = 1;
    let sy = 1;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      sx = rect.width / VIEW_W;
      sy = rect.height / VIEW_H;
      // Base transform: CSS px → device px. Per-frame we layer the viewBox fit.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (headIdx: number, withTrail: boolean) => {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();

      ctx.save();
      ctx.scale(sx, sy);
      ctx.lineCap = "round";

      // Faint track. Non-scaling stroke: divide by the (geometric-mean) scale so
      // the hairline keeps roughly its screen width even when the ∞ is squashed.
      ctx.globalAlpha = 0.06;
      ctx.strokeStyle = trackColor;
      ctx.lineWidth = strokeWidth / Math.sqrt(sx * sy);
      ctx.stroke(trackPath);
      ctx.globalAlpha = 1;

      if (withTrail) {
        // Build the tapered ribbon: offset each centreline point by ±halfWidth
        // along the path normal to get the two edges, then fill the loop once.
        for (let k = 0; k <= RIBBON_STEPS; k++) {
          const idx = (headIdx - stepIdx[k] + SAMPLES) % SAMPLES;
          const w = stepW[k];
          const nx = nux[idx] * w;
          const ny = nuy[idx] * w;
          lx[k] = xs[idx] + nx;
          ly[k] = ys[idx] + ny;
          rx[k] = xs[idx] - nx;
          ry[k] = ys[idx] - ny;
        }

        ctx.beginPath();
        ctx.moveTo(lx[0], ly[0]);
        for (let k = 1; k <= RIBBON_STEPS; k++) ctx.lineTo(lx[k], ly[k]);
        for (let k = RIBBON_STEPS; k >= 0; k--) ctx.lineTo(rx[k], ry[k]);
        ctx.closePath();

        // Fade opaque (head) → transparent (tail) along the trail.
        const tailIdx = (headIdx - stepIdx[RIBBON_STEPS] + SAMPLES) % SAMPLES;
        const grad = ctx.createLinearGradient(xs[headIdx], ys[headIdx], xs[tailIdx], ys[tailIdx]);
        grad.addColorStop(0, `rgba(${trailRgb},1)`);
        grad.addColorStop(1, `rgba(${trailRgb},0)`);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // Head on top.
      ctx.fillStyle = headColor;
      ctx.beginPath();
      ctx.arc(xs[headIdx], ys[headIdx], dotRadius, 0, TAU);
      ctx.fill();

      ctx.restore();
    };

    resize();
    // While animating, onUpdate repaints continuously, so the observer only
    // needs to refit; under reduced motion it must redraw the static frame.
    const ro = new ResizeObserver(() => {
      resize();
      if (reduce) draw(0, false);
    });
    ro.observe(canvas);

    if (reduce) {
      // Static: head at the path start, no tail.
      draw(0, false);
      return () => ro.disconnect();
    }

    const controls = animate(0, 1, {
      duration: durationMs / 1000,
      ease: "linear",
      repeat: Number.POSITIVE_INFINITY,
      onUpdate: (p) => draw(idxAt(length * p), true),
    });

    return () => {
      controls.stop();
      ro.disconnect();
    };
  }, [reduce, durationMs, dotRadius, strokeWidth]);

  // The ∞ is always decorative — it sits alongside the named logo/headline.
  // biome-ignore lint/a11y/noAriaHiddenOnFocusable: decorative canvas, never focusable (no tabindex).
  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
