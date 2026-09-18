import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * Keep the editor out of every index and every Referer header.
 *
 * Only reachable through the rewrite in proxy.ts, from the secret path. The proxy also
 * sets the matching response headers.
 *
 * - `robots` noindex/nofollow/nocache: if the URL ever leaks, search engines still
 *   won't list or cache the page.
 * - `referrer: no-referrer`: a link clicked from here to another site doesn't carry
 *   the secret path in its Referer header.
 * - No canonical, Open Graph or Twitter card: the root layout's point at the home
 *   page and describe the public site, which this page is not.
 *
 * It is also left out of sitemap.ts and robots.ts on purpose (see the note there).
 */
export const metadata: Metadata = {
  title: { absolute: "Espace d'édition" },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
  referrer: "no-referrer",
  alternates: { canonical: null },
  openGraph: null,
  twitter: null,
};

/**
 * Everything under the editor: the logged-in pages in (editeur)/, and the reset page.
 * Each of those reads the base path (and 404s a disabled editor) itself.
 */
export default function EditorLayout({ children }: { children: ReactNode }) {
  return children;
}
