import type { MetadataRoute } from "next";
import { routes } from "@/content/routes";
import { site } from "@/content/site";

/** Public pages only. The editor never goes here; see robots.ts. */
export default function sitemap(): MetadataRoute.Sitemap {
  return Object.values(routes).map((route) => ({
    url: route.path === routes.home.path ? site.url : `${site.url}${route.path}`,
    ...route.sitemap,
  }));
}
