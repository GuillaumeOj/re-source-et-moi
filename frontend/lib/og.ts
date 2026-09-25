// Shared by the link preview images (app/**/opengraph-image.tsx), which are drawn by
// next/og at build time. It knows nothing of Tailwind or CSS variables.

/** The size every platform expects of a large link preview. */
export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

/** The brand colours the previews use. tests/og.test.ts holds them to globals.css. */
export const ogColors = {
  roseTendre: "#f2caed",
  roseVif: "#c4749a",
  roseSombre: "#5c2642",
} as const;
