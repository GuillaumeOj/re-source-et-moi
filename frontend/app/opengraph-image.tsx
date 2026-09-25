import { ImageResponse } from "next/og";
import { site } from "@/content/site";
import { logoAspectRatio, logoDataUri, ogColors, ogContentType, ogSize } from "@/lib/og";

// The link preview of every page that has none of its own: the logo on the home
// hero's pink.
export const alt = `Logo ${site.name}`;
export const size = ogSize;
export const contentType = ogContentType;

const LOGO_HEIGHT = 500;

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
      <img
        src={logoDataUri(ogColors.roseSombre)}
        alt=""
        width={Math.round(LOGO_HEIGHT * logoAspectRatio)}
        height={LOGO_HEIGHT}
      />
    </div>,
    size,
  );
}
