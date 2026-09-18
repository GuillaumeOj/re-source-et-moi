// @vitest-environment node
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EDITOR_ROUTE, editorPath } from "@/lib/editor/path";
import { proxy } from "@/proxy";

function request(path: string) {
  return new NextRequest(new URL(path, "https://re-source-et-moi.fr"));
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("editorPath", () => {
  it("reads EDITOR_PATH, tolerating stray slashes and spaces", () => {
    vi.stubEnv("EDITOR_PATH", " /admin-3f2c/ ");

    expect(editorPath()).toBe("admin-3f2c");
  });

  it("defaults to admin-local off Vercel", () => {
    vi.stubEnv("EDITOR_PATH", "");
    vi.stubEnv("VERCEL_ENV", "");

    expect(editorPath()).toBe("admin-local");
  });

  it("disables the editor on a deployment without EDITOR_PATH, rather than guess a default", () => {
    vi.stubEnv("EDITOR_PATH", "");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(editorPath()).toBeNull();
  });

  it("refuses the internal route name as the secret", () => {
    vi.stubEnv("EDITOR_PATH", EDITOR_ROUTE);

    expect(editorPath()).toBeNull();
  });
});

describe("proxy", () => {
  it("serves the editor at the secret path, marked private", () => {
    vi.stubEnv("EDITOR_PATH", "admin-3f2c");

    const response = proxy(request("/admin-3f2c/tarifs"));

    expect(response.headers.get("x-middleware-rewrite")).toBe(
      "https://re-source-et-moi.fr/espace-edition/tarifs",
    );
    expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow, noarchive");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });

  it("opens the agenda tab from the bare secret path", () => {
    vi.stubEnv("EDITOR_PATH", "admin-3f2c");

    const response = proxy(request("/admin-3f2c"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://re-source-et-moi.fr/admin-3f2c/ateliers",
    );
  });

  it("answers a direct request for the internal route with an ordinary 404", () => {
    // Rewritten to a path no route matches, so the response is the prerendered 404
    // every other unknown URL gets. Otherwise the internal name is a second way in.
    vi.stubEnv("EDITOR_PATH", "admin-3f2c");

    const response = proxy(request("/espace-edition/ateliers"));

    expect(response.headers.get("x-middleware-rewrite")).toBe(
      "https://re-source-et-moi.fr/__introuvable",
    );
  });

  it.each(["/admin-wrong", "/admin", "/", "/mentions-legales"])("leaves %s alone", (path) => {
    vi.stubEnv("EDITOR_PATH", "admin-3f2c");

    const response = proxy(request(path));

    expect(response.headers.get("x-middleware-rewrite")).toBeNull();
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("serves nothing at all when the editor is disabled", () => {
    vi.stubEnv("EDITOR_PATH", "");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.spyOn(console, "error").mockImplementation(() => {});

    const response = proxy(request("/admin-local/ateliers"));

    expect(response.headers.get("x-middleware-rewrite")).toBeNull();
  });
});
