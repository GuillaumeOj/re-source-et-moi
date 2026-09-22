import type { Metadata } from "next";
import { FaqList } from "@/components/faq/FaqList";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/Button";
import { contact } from "@/content/cta";
import { faq } from "@/content/faq";
import { contactHref, routes } from "@/content/routes";
import { buildFaqJsonLd } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: faq.metaTitle,
  description: faq.metaDescription,
  alternates: { canonical: routes.questions.path },
};

export default function QuestionsPage() {
  return (
    // FAQPage structured data belongs on the page that shows the questions.
    <PageShell route={routes.questions} jsonLd={buildFaqJsonLd()}>
      <PageHeader eyebrow={faq.eyebrow} title={faq.title} intro={faq.intro} />

      <div className="mt-12">
        <FaqList />
      </div>

      <div className="mt-12 flex flex-col items-start gap-4">
        <p className="text-base leading-relaxed text-charbon/80">{faq.more}</p>
        <Button href={contactHref()} arrow>
          {contact.cta}
        </Button>
      </div>
    </PageShell>
  );
}
