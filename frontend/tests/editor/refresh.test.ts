// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ updateTag: vi.fn() }));
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({ toString: () => "sessionid=abc; csrftoken=xyz" }),
}));

const { updateTag } = await import("next/cache");
const { refreshPublicSite } = await import("@/lib/editor/refresh");
const { PUBLIC_TAGS } = await import("@/lib/api/cache");

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubEnv("API_BASE_URL", "http://backend:8000");
  vi.stubGlobal("fetch", fetchMock);
  vi.mocked(updateTag).mockClear();
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("refreshPublicSite", () => {
  it("expires the tag once Django confirms the caller's session", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));

    expect(await refreshPublicSite("events")).toBe(true);

    expect(updateTag).toHaveBeenCalledWith("events");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://backend:8000/api/auth/session/");
    expect(init.headers.Cookie).toBe("sessionid=abc; csrftoken=xyz");
  });

  it.each(PUBLIC_TAGS)("accepts the %s feed's tag", async (tag) => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));

    expect(await refreshPublicSite(tag)).toBe(true);
    expect(updateTag).toHaveBeenCalledWith(tag);
  });

  it("leaves the cache alone for a caller without a staff session", async () => {
    // A Server Action is a public endpoint. Without this check anyone could make the
    // site re-fetch from the backend on every request.
    fetchMock.mockResolvedValue(new Response("{}", { status: 403 }));

    expect(await refreshPublicSite("pricing")).toBe(false);
    expect(updateTag).not.toHaveBeenCalled();
  });

  it("leaves the cache alone when the backend is unreachable", async () => {
    fetchMock.mockRejectedValue(new Error("ECONNREFUSED"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(await refreshPublicSite("events")).toBe(false);
    expect(updateTag).not.toHaveBeenCalled();
  });

  it("refuses a tag that isn't one of the public feeds", async () => {
    // The argument arrives from the browser, whatever its declared type.
    expect(await refreshPublicSite("anything" as "events")).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
