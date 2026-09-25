import { ImageResponse } from "next/og";
import {
  LOGO_FIGURE_PATH,
  LOGO_GROUP_TRANSFORM,
  LOGO_VIEWBOX,
  LOGO_WORDMARK_PATH,
} from "@/components/brand/logo-paths";
import { site } from "@/content/site";
import { ogColors, ogContentType, ogSize } from "@/lib/og";

// The link preview of every page that has none of its own: the logo on the home
// hero's pink.
export const alt = `Logo ${site.name}`;
export const size = ogSize;
export const contentType = ogContentType;

// The logo as an SVG data URI: next/og draws an <img> of it more faithfully than an
// inline <svg> with a transformed group.
const LOGO_SVG =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${LOGO_VIEWBOX}" fill="${ogColors.roseSombre}">` +
  `<g transform="${LOGO_GROUP_TRANSFORM}">` +
  `<path d="${LOGO_FIGURE_PATH}"/><path d="${LOGO_WORDMARK_PATH}"/>` +
  "</g></svg>";
const LOGO_SRC = `data:image/svg+xml;base64,${Buffer.from(LOGO_SVG).toString("base64")}`;

const [, , LOGO_VIEW_W, LOGO_VIEW_H] = LOGO_VIEWBOX.split(" ").map(Number);
const LOGO_HEIGHT = 500;
const LOGO_WIDTH = Math.round((LOGO_HEIGHT * LOGO_VIEW_W) / LOGO_VIEW_H);

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: ogColors.roseTendre,
      }}
    >
      {/* biome-ignore lint/performance/noImgElement: next/og draws plain <img> only. */}
      <img src={LOGO_SRC} alt="" width={LOGO_WIDTH} height={LOGO_HEIGHT} />
    </div>,
    size,
  );
}
