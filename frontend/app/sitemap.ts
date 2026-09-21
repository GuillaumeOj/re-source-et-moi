import type { MetadataRoute } from "next";
import { site } from "@/content/site";

/** Public pages only. The editor never goes here; see robots.ts. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: site.url,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${site.url}/agenda`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${site.url}/mentions-legales`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${site.url}/politique-de-confidentialite`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
