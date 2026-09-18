import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  describeError,
  editorApi,
  FIX_FIELDS,
  onSessionLost,
  SAVE_FAILED,
  SESSION_ENDED,
  TOO_MANY,
} from "@/lib/editor/api";

const fetchMock = vi.fn();

function answer(status: number, body: unknown = null) {
  return new Response(body === null ? null : JSON.stringify(body), { status });
}

function clearCsrfCookie() {
  // biome-ignore lint/suspicious/noDocumentCookie: jsdom test setup
  document.cookie = "csrftoken=; expires=Thu, 01 Jan 1970 00:00:00 GMT";
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  clearCsrfCookie();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("the CSRF token", () => {
  it("is fetched before the first write when the cookie is missing", async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (url === "/api/auth/csrf/") {
        // biome-ignore lint/suspicious/noDocumentCookie: what Django's Set-Cookie does
        document.cookie = "csrftoken=abc123";
        return answer(204);
      }
      return answer(204);
    });

    await editorApi.logout();

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      "/api/auth/csrf/",
      "/api/auth/logout/",
    ]);
    expect(fetchMock.mock.calls[1][1].headers["X-CSRFToken"]).toBe("abc123");
  });

  it("is not fetched again once the cookie is there", async () => {
    // biome-ignore lint/suspicious/noDocumentCookie: jsdom test setup
    document.cookie = "csrftoken=abc123";
    fetchMock.mockResolvedValue(answer(204));

    await editorApi.logout();

    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("is not needed for a read", async () => {
    fetchMock.mockResolvedValue(answer(200, []));

    await editorApi.listPricingTypes();

    expect(fetchMock.mock.calls[0][1].headers).not.toHaveProperty("X-CSRFToken");
  });
});

describe("a lost session", () => {
  it("is reported to the listeners on any 401", async () => {
    const listener = vi.fn();
    const unsubscribe = onSessionLost(listener);
    fetchMock.mockResolvedValue(answer(401, { detail: "…" }));

    await expect(editorApi.listPricingTypes()).rejects.toBeInstanceOf(ApiError);

    expect(listener).toHaveBeenCalledOnce();
    unsubscribe();
  });

  it("is not reported for the startup session check, where 401 is an answer", async () => {
    const listener = vi.fn();
    const unsubscribe = onSessionLost(listener);
    fetchMock.mockResolvedValue(answer(401, { detail: "…" }));

    await expect(editorApi.session()).rejects.toBeInstanceOf(ApiError);

    expect(listener).not.toHaveBeenCalled();
    unsubscribe();
  });

  it("is not a 403, which is an error to report", async () => {
    const listener = vi.fn();
    const unsubscribe = onSessionLost(listener);
    fetchMock.mockResolvedValue(answer(403, { detail: "CSRF" }));

    await expect(editorApi.listPricingTypes()).rejects.toBeInstanceOf(ApiError);

    expect(listener).not.toHaveBeenCalled();
    unsubscribe();
  });
});

describe("describeError", () => {
  it.each([
    [400, FIX_FIELDS],
    [401, SESSION_ENDED],
    [429, TOO_MANY],
    [403, SAVE_FAILED],
    [500, SAVE_FAILED],
  ])("says the right thing for a %i", (status, message) => {
    expect(describeError(new ApiError(status, {}))).toBe(message);
  });

  it("treats a network failure as a failed save", () => {
    expect(describeError(new TypeError("Failed to fetch"))).toBe(SAVE_FAILED);
  });
});
