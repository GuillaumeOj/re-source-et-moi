import type { MetadataRoute } from "next";
import { site } from "@/content/site";

/**
 * The editor (EDITOR_PATH, see proxy.ts) is deliberately missing from this file. A
 * Disallow line for it would publish the secret path to anyone who reads robots.txt,
 * which is the first file a scanner fetches. It stays out of indexes through its own
 * noindex meta tags and X-Robots-Tag header.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
