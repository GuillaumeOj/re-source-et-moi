import { afterEach, describe, expect, it, vi } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";

afterEach(() => {
  vi.unstubAllEnvs();
});

// The two files a crawler reads first. Naming the editor in either, even as a
// Disallow, would publish the path it is hidden behind.
describe("the editor stays off the site's map", () => {
  it("is not in robots.txt", () => {
    vi.stubEnv("EDITOR_PATH", "admin-3f2c");

    const text = JSON.stringify(robots());

    expect(text).not.toContain("admin-3f2c");
    expect(text).not.toContain("espace-edition");
  });

  it("is not in the sitemap", () => {
    vi.stubEnv("EDITOR_PATH", "admin-3f2c");

    const text = JSON.stringify(sitemap());

    expect(text).not.toContain("admin-3f2c");
    expect(text).not.toContain("espace-edition");
  });
});
