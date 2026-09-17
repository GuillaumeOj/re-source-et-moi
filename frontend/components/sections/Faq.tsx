import { Plus } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { faq } from "@/content/faq";

export function Faq() {
  return (
    <Section id="faq" background="rose-tendre" aria-labelledby="faq-title">
      <div className="grid gap-12 lg:grid-cols-[0.7fr_1fr]">
        <SectionHeading id="faq-title" eyebrow={faq.eyebrow} title={faq.title} />

        <div className="divide-y divide-rose-sombre/10 border-rose-sombre/10 border-t">
          {faq.items.map((item) => (
            <details key={item.question} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-medium text-rose-sombre [&::-webkit-details-marker]:hidden">
                {item.question}
                <Plus
                  size={20}
                  aria-hidden="true"
                  className="shrink-0 text-rose-vif transition-transform duration-200 group-open:rotate-45"
                />
              </summary>
              <p className="pt-3 pr-8 text-base leading-relaxed text-charbon/80">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </Section>
  );
}
