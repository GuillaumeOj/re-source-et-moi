import type { Metadata } from "next";
import { connection } from "next/server";
import { ContactForm } from "@/components/contact/ContactForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageShell } from "@/components/layout/PageShell";
import { contact } from "@/content/cta";
import { CONTACT_EVENT_PARAM, routes } from "@/content/routes";
import { getEvents } from "@/lib/api/client";
import { type ContactEvent, toContactEvent } from "@/lib/contact";
import { param, type SearchParams } from "@/lib/searchParams";

export const metadata: Metadata = {
  title: contact.metaTitle,
  description: contact.metaDescription,
  // ?atelier=… is a pre-filled form, not a page of its own.
  alternates: { canonical: routes.contact.path },
};

/**
 * The upcoming workshop with this id, or null when there is none — a past or unpublished
 * workshop, a mistyped link, or a backend that can't be reached. Upcoming only, because
 * those are the ones a visitor can still sign up for.
 */
async function findEvent(id: string): Promise<ContactEvent | null> {
  // See AgendaList: the backend's URL only exists at request time.
  await connection();
  const events = await getEvents().catch((error: unknown) => {
    console.error("[ContactPage] backend unreachable:", error);
    return null;
  });
  const event = events?.find((candidate) => candidate.id === id);
  return event ? toContactEvent(event) : null;
}

/**
 * The contact form, on its own page. The header's "Nous contacter", the home page's contact
 * section and every "Nous contacter" link land here; a workshop's "S'inscrire" lands here
 * with `?atelier=<id>`, and the form opens on that workshop.
 */
export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const eventId = param(await searchParams, CONTACT_EVENT_PARAM);
  const event = eventId ? await findEvent(eventId) : null;

  return (
    <PageShell route={routes.contact}>
      <PageHeader eyebrow={contact.eyebrow} title={contact.title} intro={contact.subtitle} />

      {eventId && !event ? (
        <p className="mt-10 rounded-2xl bg-rose-tendre px-5 py-4 text-sm text-rose-sombre">
          {contact.event.unavailable}{" "}
          <a
            href={routes.ateliers.path}
            className="font-semibold underline underline-offset-2 hover:no-underline"
          >
            {contact.event.seeWorkshops}
          </a>
        </p>
      ) : null}

      <div className="mt-10">
        <ContactForm event={event} />
      </div>
    </PageShell>
  );
}
