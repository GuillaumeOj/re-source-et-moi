"use client";

import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { contact } from "@/content/cta";

export function Contact() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    // Not wired yet — TODO: connect to Payload / Resend / a form backend.
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <Section id="contact" background="creme" aria-labelledby="contact-title">
      <div className="grid gap-12 lg:grid-cols-[0.9fr_1fr]">
        <SectionHeading
          id="contact-title"
          eyebrow={contact.eyebrow}
          title={contact.title}
          intro={contact.subtitle}
        />

        <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
          <Field
            id="contact-name"
            name="name"
            label={contact.fields.name}
            autoComplete="name"
            required
          />
          <Field
            id="contact-email"
            name="email"
            type="email"
            label={contact.fields.email}
            autoComplete="email"
            required
          />
          <Field
            id="contact-message"
            name="message"
            label={contact.fields.message}
            multiline
            required
          />
          <div className="flex flex-wrap items-center gap-4">
            <Button type="submit">{contact.button}</Button>
            {submitted ? (
              <p className="text-sm text-rose-sombre/70" aria-live="polite">
                Formulaire de démonstration — bientôt connecté.
              </p>
            ) : null}
          </div>
        </form>
      </div>
    </Section>
  );
}
