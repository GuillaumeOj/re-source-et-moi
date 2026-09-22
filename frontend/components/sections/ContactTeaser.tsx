import { Button } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { contact, contactTeaser } from "@/content/cta";
import { contactHref } from "@/content/routes";

/**
 * The home page's last section: the way to the contact page. The form itself lives there,
 * so a sign-up from either agenda (home or /ateliers) lands on the same page.
 */
export function ContactTeaser() {
  return (
    <Section id="contact" background="creme" aria-labelledby="contact-title">
      <div className="flex flex-col items-start gap-8">
        <SectionHeading
          id="contact-title"
          eyebrow={contact.eyebrow}
          title={contact.title}
          intro={contactTeaser.intro}
        />
        <Button href={contactHref()} arrow>
          {contact.cta}
        </Button>
      </div>
    </Section>
  );
}
