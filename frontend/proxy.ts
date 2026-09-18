import { type NextRequest, NextResponse } from "next/server";
import { EDITOR_ROUTE, editorPath } from "@/lib/editor/path";

/**
 * A path no route matches. Rewriting to it gives a request the site's ordinary 404, the
 * same prerendered page with the same headers as any other unknown URL.
 */
const UNMATCHED = "/__introuvable";

/**
 * Serve the editor at its secret path, and nowhere else.
 *
 * - `/<EDITOR_PATH>/…` is rewritten onto `app/espace-edition/…`. The browser keeps the
 *   secret URL, and the response is marked noindex and no-referrer. The bare
 *   `/<EDITOR_PATH>` redirects to its agenda tab.
 * - `/espace-edition/…` requested directly gets the ordinary 404. Otherwise the
 *   internal name would be a second, guessable way in.
 * - Everything else passes through untouched.
 *
 * Why a proxy rather than an `app/[slug]` route that 404s on a wrong slug: a dynamic
 * top-level segment renders its 404 on demand, while an unmatched URL is served Next's
 * prerendered 404. The two differ in size and headers, so a scanner could tell that a
 * catch-all route exists. Here, every wrong URL is a genuinely unmatched one.
 */
export function proxy(request: NextRequest) {
  const [first = "", ...rest] = request.nextUrl.pathname.slice(1).split("/");

  if (first === EDITOR_ROUTE) {
    return NextResponse.rewrite(new URL(UNMATCHED, request.url));
  }

  const secret = editorPath();
  if (secret !== null && first === secret) {
    // The bare secret path opens the agenda, which is what changes most often.
    if (rest.every((segment) => segment === "")) {
      return NextResponse.redirect(new URL(`/${secret}/ateliers`, request.url));
    }
    const url = request.nextUrl.clone();
    url.pathname = ["", EDITOR_ROUTE, ...rest].join("/");
    const response = NextResponse.rewrite(url);
    // Belt and braces with the page's own meta tags: these also cover responses that
    // carry no HTML, such as the RSC payloads of client-side navigation.
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    response.headers.set("Referrer-Policy", "no-referrer");
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  // Pages only. The API belongs to Django (and never reaches Next in production), and
  // static assets and files with an extension are never the editor.
  matcher: ["/((?!api/|_next/|.*\\.[a-z0-9]+$).*)"],
};
