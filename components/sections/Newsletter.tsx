"use client";

import { type FormEvent, useState } from "react";
import { LazyEight } from "@/components/brand/LazyEight";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { newsletter } from "@/content/cta";

export function Newsletter() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    // Not wired yet — TODO: connect to Payload / Resend / a newsletter provider.
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <Section
      id="newsletter"
      background="rose-sombre"
      contained={false}
      aria-labelledby="newsletter-title"
      className="relative overflow-hidden"
    >
      <LazyEight
        durationMs={36000}
        strokeWidth={1.25}
        className="pointer-events-none absolute top-1/2 left-1/2 h-[110%] w-[110%] -translate-x-1/2 -translate-y-1/2 text-rose-sombre"
      />

      <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 text-center">
        <SectionHeading
          id="newsletter-title"
          eyebrow={newsletter.eyebrow}
          title={newsletter.title}
          intro={newsletter.subtitle}
          tone="light"
          align="center"
        />

        <form
          onSubmit={handleSubmit}
          className="mt-2 flex w-full max-w-md flex-col gap-3 sm:flex-row"
        >
          <label htmlFor="newsletter-email" className="sr-only">
            Adresse email
          </label>
          <input
            id="newsletter-email"
            type="email"
            name="email"
            required
            placeholder={newsletter.placeholder}
            className="w-full rounded-full bg-creme px-5 py-3 text-base text-charbon placeholder:text-charbon/40 focus:outline-none focus-visible:outline-2 focus-visible:outline-rose-tendre focus-visible:outline-offset-2"
          />
          <button
            type="submit"
            className="shrink-0 rounded-full bg-rose-tendre px-6 py-3 font-semibold text-rose-sombre transition-all hover:-translate-y-0.5 hover:bg-white"
          >
            {newsletter.button}
          </button>
        </form>

        <p className="text-sm text-creme/60" aria-live="polite">
          {submitted
            ? "Formulaire de démonstration — l'inscription sera bientôt connectée."
            : newsletter.consent}
        </p>
      </div>
    </Section>
  );
}
