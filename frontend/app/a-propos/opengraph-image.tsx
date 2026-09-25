import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { fondatrice } from "@/content/fondatrice";
import { ogColors, ogContentType, ogSize } from "@/lib/og";

// The link preview of /a-propos: Cécile's portrait, her name, subtitle and role.
export const alt = fondatrice.photoAlt;
export const size = ogSize;
export const contentType = ogContentType;

// The portrait is 4:5 (see Portrait), shown whole.
const PORTRAIT_HEIGHT = 530;
const PORTRAIT_WIDTH = (PORTRAIT_HEIGHT * 4) / 5;

export default async function OpenGraphImage() {
  const [portrait, light, italic] = await Promise.all([
    // Literal paths, so the build traces these three files and not the whole project.
    readFile(join(process.cwd(), "public/fondatrice.jpg")),
    readFile(join(process.cwd(), "assets/fonts/CormorantGaramond-Light.ttf")),
    readFile(join(process.cwd(), "assets/fonts/CormorantGaramond-Italic.ttf")),
  ]);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        gap: 72,
        padding: "0 80px",
        backgroundColor: ogColors.roseTendre,
        fontFamily: "Cormorant Garamond",
      }}
    >
      {/* biome-ignore lint/performance/noImgElement: next/og draws plain <img> only. */}
      <img
        src={`data:image/jpeg;base64,${portrait.toString("base64")}`}
        alt=""
        width={PORTRAIT_WIDTH}
        height={PORTRAIT_HEIGHT}
        style={{ borderRadius: 24, objectFit: "cover" }}
      />
      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
        <div style={{ fontSize: 88, fontWeight: 300, lineHeight: 1, color: ogColors.roseSombre }}>
          {fondatrice.fullName}
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 40,
            fontStyle: "italic",
            lineHeight: 1.2,
            textWrap: "balance",
            color: ogColors.roseVif,
          }}
        >
          {fondatrice.page.subtitle}
        </div>
        <div
          style={{
            marginTop: 48,
            fontSize: 30,
            fontWeight: 300,
            color: ogColors.roseSombre,
          }}
        >
          {fondatrice.role}
        </div>
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { name: "Cormorant Garamond", data: light, weight: 300, style: "normal" },
        { name: "Cormorant Garamond", data: italic, weight: 400, style: "italic" },
      ],
    },
  );
}
