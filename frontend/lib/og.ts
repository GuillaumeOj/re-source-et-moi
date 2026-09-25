import {
  LOGO_FIGURE_PATH,
  LOGO_GROUP_TRANSFORM,
  LOGO_VIEWBOX,
  LOGO_WORDMARK_PATH,
} from "@/components/brand/logo-paths";

// Shared by the link preview images (app/**/opengraph-image.tsx), which are drawn by
// next/og at build time. It knows nothing of Tailwind or CSS variables.

/** The size every platform expects of a large link preview. */
export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

/** The brand colours the previews use. Keep in sync with globals.css `@theme`. */
export const ogColors = {
  roseTendre: "#f2caed",
  roseVif: "#c4749a",
  roseSombre: "#5c2642",
} as const;

/** The logo's width over its height, from LOGO_VIEWBOX. */
const [, , logoWidth, logoHeight] = LOGO_VIEWBOX.split(" ").map(Number);
export const logoAspectRatio = logoWidth / logoHeight;

/**
 * The logo as an SVG data URI, filled with `color`. next/og draws an <img> of it more
 * faithfully than an inline <svg> with a transformed group.
 */
export function logoDataUri(color: string): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${LOGO_VIEWBOX}" fill="${color}">` +
    `<g transform="${LOGO_GROUP_TRANSFORM}">` +
    `<path d="${LOGO_FIGURE_PATH}"/><path d="${LOGO_WORDMARK_PATH}"/>` +
    "</g></svg>";
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}
