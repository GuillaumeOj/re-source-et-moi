import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ContactPage from "@/app/contact/page";
import { contact } from "@/content/cta";
import { contactHref } from "@/content/routes";
import type { Event } from "@/lib/api/client";
import { type ContactEvent, composeMessage } from "@/lib/contact";

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

describe("composeMessage", () => {
  const event: ContactEvent = makeEvent();

  it("is the visitor's message alone without a workshop", () => {
    expect(composeMessage(null, "  Bonjour  ")).toBe("Bonjour");
  });

  it("writes the workshop out in full above the visitor's message", () => {
    expect(composeMessage(event, "Je viendrai avec ma fille.")).toBe(
      "Inscription à l'atelier « Brain Gym® en mouvement » — samedi 3 octobre 2026, " +
        "10h–12h, Lyon (12 rue de la Paix, 69001 Lyon).\n\nJe viendrai avec ma fille.",
    );
  });

  it("is the sign-up alone when the visitor adds nothing", () => {
    expect(composeMessage(event, "   ")).toBe(
      "Inscription à l'atelier « Brain Gym® en mouvement » — samedi 3 octobre 2026, " +
        "10h–12h, Lyon (12 rue de la Paix, 69001 Lyon).",
    );
  });

  it("names an online workshop by its label, with no address", () => {
    const online = { ...event, location_label: "En ligne", address: "" };
    expect(composeMessage(online, "")).toMatch(/10h–12h, En ligne\.$/);
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
