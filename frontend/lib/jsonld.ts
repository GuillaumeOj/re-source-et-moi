import { faq } from "@/content/faq";
import { type Route, routes } from "@/content/routes";
import { site } from "@/content/site";

/** Organization (NGO) structured data, on every page. */
export function buildOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "NGO",
    name: site.name,
    description: site.description,
    url: site.url,
    email: site.email,
    logo: `${site.url}/logo.svg`,
    areaServed: "FR",
    knowsLanguage: "fr",
    ...(site.social.length > 0 ? { sameAs: site.social.map((s) => s.href) } : {}),
  };
}

/** FAQPage structured data, only on /questions — the page that shows the questions. */
export function buildFaqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

/** BreadcrumbList for a page one level under the home page, as every public page is. */
export function buildBreadcrumbJsonLd(route: Pick<Route, "label" | "path">) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: routes.home.label, item: site.url },
      { "@type": "ListItem", position: 2, name: route.label, item: `${site.url}${route.path}` },
    ],
  };
}
