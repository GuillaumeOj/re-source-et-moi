import { faq } from "@/content/faq";
import { site } from "@/content/site";

/** Organization (NGO) + FAQPage structured data for richer search results. */
export function buildJsonLd() {
  const organization = {
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

  const faqPage = {
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

  return [organization, faqPage];
}
