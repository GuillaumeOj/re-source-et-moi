import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// jsdom does not implement IntersectionObserver — stub it for the reveal hook.
class IntersectionObserverStub {
  root = null;
  rootMargin = "";
  thresholds: ReadonlyArray<number> = [];
  disconnect(): void {}
  observe(): void {}
  takeRecords(): [] {
    return [];
  }
  unobserve(): void {}
}

globalThis.IntersectionObserver =
  IntersectionObserverStub as unknown as typeof IntersectionObserver;

// jsdom does not implement matchMedia — default to "no reduced motion".
if (!globalThis.matchMedia) {
  globalThis.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof globalThis.matchMedia;
}

// jsdom does not implement SVG geometry — stub the length used by LazyEight.
if (typeof SVGElement !== "undefined") {
  (SVGElement.prototype as unknown as { getTotalLength: () => number }).getTotalLength = () => 100;
}

afterEach(() => {
  cleanup();
});
