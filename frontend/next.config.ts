import type { NextConfig } from "next";

/** Set locally only (docker-compose.yml, or by hand). See `rewrites` below. */
const API_BASE_URL = process.env.API_BASE_URL?.replace(/\/$/, "");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Allow the dev server to be reached from devices on the local network
  // (e.g. a real phone) without cross-origin warnings.
  allowedDevOrigins: ["192.168.1.*"],

  /**
   * Under vercel.json `services`, Vercel never routes Next's `/_next/image`, so on Vercel
   * next/image goes through the platform's own optimizer at `/_vercel/image` instead,
   * which is enabled by vercel.json's top-level `images`. Locally, Next's built-in
   * optimizer works and stays in use.
   *
   * The sizes and qualities are Next's defaults, spelled out because they are mirrored
   * in vercel.json (`sizes` = imageSizes + deviceSizes). If the two drift apart,
   * `/_vercel/image` returns 400 for any width it doesn't list.
   */
  images: {
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [32, 48, 64, 96, 128, 256, 384],
    qualities: [75],
    ...(process.env.VERCEL ? { loader: "custom", loaderFile: "./lib/vercel-image-loader.ts" } : {}),
  },

  // The agenda moved to /ateliers when it gained the tariffs. Permanent, so search engines
  // move the old address over; Next carries the query (?vue=, ?mois=) across.
  async redirects() {
    return [{ source: "/agenda", destination: "/ateliers", permanent: true }];
  },

  /**
   * Locally, send the browser's /api/* calls on to Django.
   *
   * The editor calls the API from the browser, same-origin, so its session cookie and
   * CSRF token just work. In production the same-origin part is vercel.json's `/api`
   * rewrite, which reaches the backend before Next ever sees the request. Locally Next
   * and Django run on separate ports, and this rewrite is what stands in for Vercel's.
   *
   * Only when API_BASE_URL is set, i.e. locally. On Vercel the binding provides
   * BACKEND_INTERNAL_URL instead, and a rewrite here would be dead code at best.
   */
  async rewrites() {
    return API_BASE_URL
      ? [
          // Two rules because Django's URLs end in "/" and `:path*` alone drops it. Django
          // would then redirect, and a redirected POST loses its body.
          { source: "/api/:path*/", destination: `${API_BASE_URL}/api/:path*/` },
          { source: "/api/:path*", destination: `${API_BASE_URL}/api/:path*` },
        ]
      : [];
  },
  // Next normally 308-redirects "/x/" to "/x" before rewrites run, which would strip the
  // slash off every Django URL above. Turned off only where the rewrite exists (locally).
  // In production /api/* never reaches Next.
  skipTrailingSlashRedirect: Boolean(API_BASE_URL),
};

export default nextConfig;
