// @vitest-environment node
import { describe, expect, it } from "vitest";
import AProposImage, * as aPropos from "@/app/a-propos/opengraph-image";
import SiteImage, * as siteImage from "@/app/opengraph-image";
import { LOGO_FIGURE_PATH, LOGO_WORDMARK_PATH } from "@/components/brand/logo-paths";
import { fondatrice } from "@/content/fondatrice";
import { logoDataUri } from "@/lib/og";

describe("logoDataUri", () => {
  it("draws both logo paths in the given colour", () => {
    const uri = logoDataUri("#5c2642");
    const svg = Buffer.from(uri.replace("data:image/svg+xml;base64,", ""), "base64").toString();
    expect(svg).toContain(LOGO_FIGURE_PATH);
    expect(svg).toContain(LOGO_WORDMARK_PATH);
    expect(svg).toContain('fill="#5c2642"');
  });
});

describe("link previews", () => {
  it("describe themselves as large PNGs", () => {
    for (const image of [siteImage, aPropos]) {
      expect(image.size).toEqual({ width: 1200, height: 630 });
      expect(image.contentType).toBe("image/png");
    }
    expect(aPropos.alt).toBe(fondatrice.photoAlt);
  });

  it.each([
    ["the site", SiteImage],
    ["/a-propos", AProposImage],
  ])("render for %s", async (_, render) => {
    const response = await render();
    const body = new Uint8Array(await response.arrayBuffer());
    expect(response.headers.get("content-type")).toBe("image/png");
    // The PNG signature.
    expect([...body.slice(0, 4)]).toEqual([0x89, 0x50, 0x4e, 0x47]);
  });
});
