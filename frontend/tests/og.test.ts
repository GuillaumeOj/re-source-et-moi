// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import AProposImage from "@/app/a-propos/opengraph-image";
import SiteImage from "@/app/opengraph-image";
import { ogColors } from "@/lib/og";

describe("link previews", () => {
  it("use the site's own pinks", () => {
    // next/og can't read CSS variables, so lib/og.ts copies them. This keeps the copy true.
    const css = readFileSync("app/globals.css", "utf8");
    expect(css).toContain(`--color-rose-tendre: ${ogColors.roseTendre};`);
    expect(css).toContain(`--color-rose-vif: ${ogColors.roseVif};`);
    expect(css).toContain(`--color-rose-sombre: ${ogColors.roseSombre};`);
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
