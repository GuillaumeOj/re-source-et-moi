import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ContactPage from "@/app/contact/page";
import { contact } from "@/content/cta";
import { contactHref } from "@/content/routes";
import { site } from "@/content/site";
import type { Event } from "@/lib/api/client";
import { normalisePhone } from "@/lib/contact";

vi.mock("@/lib/api/client", () => ({ getEvents: vi.fn() }));
// No request context under vitest; see workshops.test.tsx.
vi.mock("next/server", () => ({ connection: vi.fn().mockResolvedValue(undefined) }));

const { getEvents } = await import("@/lib/api/client");

const ID = "11111111-1111-4111-8111-111111111111";

function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: ID,
    title: "Brain Gym® en mouvement",
    date: "2026-10-03",
    start_time: "10:00:00",
    end_time: "12:00:00",
    location_kind: "onsite",
    location_label: "Lyon",
    online_url: "",
    address: "12 rue de la Paix, 69001 Lyon",
    description: "",
    ...overrides,
  };
}

async function renderPage(params: Record<string, string> = {}) {
  render(await ContactPage({ searchParams: Promise.resolve(params) }));
}

describe("contactHref", () => {
  it("names the workshop in the query, or links to the bare page", () => {
    expect(contactHref()).toBe("/contact");
    expect(contactHref(ID)).toBe(`/contact?atelier=${ID}`);
  });
});

describe("normalisePhone", () => {
  it.each([
    "0612345678",
    "06 12 34 56 78",
    "06.12.34.56.78",
    "06-12-34-56-78",
    "+33 6 12 34 56 78",
    "+33 (0)6 12 34 56 78",
    "0033612345678",
  ])("dials %j as +33612345678", (typed) => {
    expect(normalisePhone(typed)).toBe("+33612345678");
  });

  it.each([
    "",
    "123",
    "06 12 34 56",
    "abcdefghij",
    "+44 7700 900123",
    "00 12 34 56 78",
  ])("rejects %j", (typed) => {
    expect(normalisePhone(typed)).toBeNull();
  });
});

describe("ContactPage", () => {
  beforeEach(() => {
    vi.mocked(getEvents).mockReset();
    vi.mocked(getEvents).mockResolvedValue([makeEvent()]);
  });

  it("shows the plain form without asking the backend", async () => {
    await renderPage();

    expect(screen.getByRole("heading", { level: 1, name: contact.title })).toBeInTheDocument();
    expect(screen.getByLabelText(contact.fields.message)).toBeInTheDocument();
    expect(getEvents).not.toHaveBeenCalled();
  });

  it("offers Cécile's number and e-mail for a visitor who would rather not use the form", async () => {
    await renderPage();

    expect(screen.getByRole("heading", { name: contact.direct.heading })).toBeInTheDocument();
    // Shown the French way, dialled in the international form.
    expect(screen.getByRole("link", { name: "06 27 47 01 44" })).toHaveAttribute(
      "href",
      "tel:+33627470144",
    );
    expect(screen.getByRole("link", { name: site.email })).toHaveAttribute(
      "href",
      `mailto:${site.email}`,
    );
  });

  it("opens on the workshop the visitor chose", async () => {
    await renderPage({ atelier: ID });

    expect(screen.getByRole("heading", { name: "Brain Gym® en mouvement" })).toBeInTheDocument();
    expect(screen.getByLabelText(contact.optionalMessage)).toBeInTheDocument();
    expect(screen.queryByText(contact.event.unavailable)).not.toBeInTheDocument();
  });

  it("says so when the workshop is no longer offered", async () => {
    await renderPage({ atelier: "22222222-2222-4222-8222-222222222222" });

    expect(screen.getByText(contact.event.unavailable, { exact: false })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: contact.event.seeWorkshops })).toHaveAttribute(
      "href",
      "/ateliers",
    );
    expect(screen.getByLabelText(contact.fields.message)).toBeRequired();
  });

  it("still offers the form when the backend is unreachable", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(getEvents).mockRejectedValue(new Error("down"));

    await renderPage({ atelier: ID });

    expect(screen.getByText(contact.event.unavailable, { exact: false })).toBeInTheDocument();
    expect(screen.getByLabelText(contact.fields.message)).toBeInTheDocument();
  });
});
