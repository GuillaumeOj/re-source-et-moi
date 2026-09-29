"use client";

import { CalendarDays, Clock, MapPin, X } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { contact } from "@/content/cta";
import { CONTACT_EVENT_PARAM, routes } from "@/content/routes";
import { ApiError, ensureCsrf, fieldError, request } from "@/lib/api/browser";
import type { components } from "@/lib/api/generated";
import { type ContactEvent, formatPlace, normalisePhone } from "@/lib/contact";
import { capitalise, formatFullDate, formatTimeRange } from "@/lib/format";

type Errors = Partial<Record<"name" | "email" | "phone" | "message", string>>;

// Deliberately loose: the browser's own rule, not RFC 5322. The reply is the real check.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * The contact form. Name, email and phone are always asked for. With `event` — a visitor
 * who clicked a workshop's "S'inscrire" — it opens on that workshop and the message becomes
 * optional: the sign-up is the message, and whatever the visitor writes is added under it.
 *
 * Sent to /api/contact/, which e-mails it to the association through Brevo. The backend
 * checks everything again; its field messages land under the fields like the form's own.
 */
export function ContactForm({ event: initialEvent = null }: { event?: ContactEvent | null }) {
  const [event, setEvent] = useState(initialEvent);
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);
  // What the line by the button says: that the message left, or why it didn't.
  const [notice, setNotice] = useState<string | null>(null);

  const removeEvent = () => {
    setEvent(null);
    // Drop ?atelier too, so a reload doesn't bring back what the visitor just removed.
    const url = new URL(window.location.href);
    url.searchParams.delete(CONTACT_EVENT_PARAM);
    window.history.replaceState(null, "", url);
  };

  const handleSubmit = async (formEvent: FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault();
    const form = formEvent.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const phone = normalisePhone(String(data.get("phone") ?? ""));
    const message = String(data.get("message") ?? "").trim();

    const found: Errors = {};
    if (!name) found.name = contact.errors.name;
    if (!EMAIL.test(email)) found.email = contact.errors.email;
    if (!phone) found.phone = contact.errors.phone;
    if (!event && !message) found.message = contact.errors.message;
    setErrors(found);
    setNotice(null);
    // `!phone` again only for TypeScript: found.phone is already set when it's null.
    if (!phone || Object.keys(found).length > 0) {
      return;
    }

    // The e-mail templates write the workshop out from `event` themselves, so `message`
    // is only what the visitor typed.
    const body: components["schemas"]["ContactRequest"] = {
      name,
      email,
      phone,
      message,
      event: event?.id ?? null,
    };
    setSending(true);
    try {
      await request<void>("POST", "/contact/", body);
      form.reset();
      setNotice(contact.sent);
    } catch (error) {
      const refusal = error instanceof ApiError ? error : null;
      if (refusal?.status === 400) {
        const fields = refusal.fieldErrors;
        setErrors({
          name: fieldError(fields, "name"),
          email: fieldError(fields, "email"),
          phone: fieldError(fields, "phone"),
          message: fieldError(fields, "message"),
        });
        // A workshop that stopped being offered while the page was open has no field.
        setNotice(fieldError(fields, "event") ?? contact.errors.invalid);
      } else {
        setNotice(refusal?.status === 429 ? contact.errors.tooMany : contact.errors.failed);
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      // Fetch the CSRF cookie while the visitor types, not when they press send.
      onFocus={() => void ensureCsrf().catch(() => {})}
      className="flex flex-col gap-5"
      noValidate
    >
      {event ? (
        <section
          aria-labelledby="contact-event-title"
          className="flex flex-col gap-3 rounded-3xl bg-white p-6 shadow-soft"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-rose-vif">
                {contact.event.heading}
              </p>
              <h2 id="contact-event-title" className="font-display text-xl text-rose-sombre">
                {event.title}
              </h2>
            </div>
            <button
              type="button"
              onClick={removeEvent}
              className="inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold text-rose-sombre/70 transition-colors hover:bg-rose-sombre/5 hover:text-rose-sombre"
            >
              <X size={16} aria-hidden="true" />
              {contact.event.remove}
            </button>
          </div>
          <ul className="flex flex-col gap-1.5 text-sm text-charbon/80">
            {(
              [
                [CalendarDays, capitalise(formatFullDate(event.date))],
                [Clock, formatTimeRange(event.start_time, event.end_time)],
                [MapPin, formatPlace(event)],
              ] as const
            ).map(([Icon, text]) => (
              <li key={text} className="inline-flex items-center gap-2">
                <Icon size={15} aria-hidden="true" className="text-rose-sombre/70" />
                {text}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <Field
        id="contact-name"
        name="name"
        label={contact.fields.name}
        autoComplete="name"
        error={errors.name}
        required
      />
      <Field
        id="contact-email"
        name="email"
        type="email"
        label={contact.fields.email}
        autoComplete="email"
        error={errors.email}
        required
      />
      <Field
        id="contact-phone"
        name="phone"
        type="tel"
        label={contact.fields.phone}
        autoComplete="tel"
        error={errors.phone}
        required
      />
      <Field
        id="contact-message"
        name="message"
        label={event ? contact.optionalMessage : contact.fields.message}
        multiline
        rows={event ? 4 : 6}
        error={errors.message}
        required={!event}
      />
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={sending}>
          {sending ? contact.sending : contact.button}
        </Button>
        <p className="text-sm text-rose-sombre/70" aria-live="polite">
          {notice}
        </p>
      </div>
      <p className="text-xs text-charbon/60">
        {contact.privacy.text}{" "}
        <a
          href={routes.confidentialite.path}
          className="underline underline-offset-2 hover:no-underline"
        >
          {contact.privacy.link}
        </a>
      </p>
    </form>
  );
}
