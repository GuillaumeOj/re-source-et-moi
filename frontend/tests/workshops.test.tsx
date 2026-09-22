import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AgendaList } from "@/components/sections/workshops/AgendaList";
import { PricingSection } from "@/components/sections/workshops/PricingSection";
import { ateliers } from "@/content/ateliers";
import { contact } from "@/content/cta";
import { tarifs } from "@/content/tarifs";
import type { Event, PricingType } from "@/lib/api/client";

// Both are async Server Components, so they are invoked and awaited rather than passed to
// render() as elements — React's client renderer cannot resolve an async component.
// Everything they return is synchronous, so the awaited tree renders normally.
vi.mock("@/lib/api/client", () => ({
  getEvents: vi.fn(),
  getPricingTypes: vi.fn(),
}));

// No request context under vitest. connection() only exists to defer rendering past the
// build, so a resolved stub is the whole of its behaviour here.
vi.mock("next/server", () => ({ connection: vi.fn().mockResolvedValue(undefined) }));

const { getEvents, getPricingTypes } = await import("@/lib/api/client");

function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    title: "Brain Gym® en mouvement",
    date: "2026-06-13",
    start_time: "10:00:00",
    end_time: "12:00:00",
    location_kind: "online",
    location_label: "En ligne",
    online_url: "",
    address: "",
    description: "",
    ...overrides,
  };
}

function makePricingType(overrides: Partial<PricingType> = {}): PricingType {
  return {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Individuel",
    description: "Par séance individuelle.",
    prices: [
      {
        id: "33333333-3333-4333-8333-333333333333",
        description: "Adulte",
        amount: "75.00",
        on_demand: false,
      },
    ],
    ...overrides,
  };
}

/** Every notice offers a way out: a link to the contact form. */
function expectContactLink() {
  expect(screen.getByRole("link", { name: contact.cta })).toHaveAttribute("href", "/contact");
}

/** Silences the deliberate console.error a failure path logs. */
function expectFailureLogged() {
  vi.spyOn(console, "error").mockImplementation(() => {});
}

beforeEach(() => {
  vi.mocked(getEvents).mockResolvedValue([makeEvent()]);
  vi.mocked(getPricingTypes).mockResolvedValue([makePricingType()]);
});

describe("AgendaList", () => {
  it("renders a workshop from the API", async () => {
    render(await AgendaList());

    expect(screen.getByRole("heading", { name: "Brain Gym® en mouvement" })).toBeInTheDocument();
    expect(screen.getByText("En ligne")).toBeInTheDocument();
  });

  it("formats the date in French from the ISO value", async () => {
    // 2026-06-13 is a Saturday. The API sends only "2026-06-13" / "10:00:00", so every
    // one of these strings is produced on this side — the reason the backend is free to
    // stay machine-readable.
    render(await AgendaList());

    expect(screen.getByText("13")).toBeInTheDocument();
    expect(screen.getByText("Juin")).toBeInTheDocument();
    expect(screen.getByText("Samedi · 10h–12h")).toBeInTheDocument();
  });

  it("gives the date badge a machine-readable datetime and a full spoken date", async () => {
    // The "13"/"Juin" split is visual only; a screen reader gets the whole date.
    render(await AgendaList());

    const fullDate = screen.getByText("samedi 13 juin 2026");
    expect(fullDate.closest("time")).toHaveAttribute("datetime", "2026-06-13");
  });

  it("shows minutes only when there are any", async () => {
    vi.mocked(getEvents).mockResolvedValue([
      makeEvent({ start_time: "10:30:00", end_time: "12:00:00" }),
    ]);

    render(await AgendaList());

    expect(screen.getByText("Samedi · 10h30–12h")).toBeInTheDocument();
  });

  it("shows the city and the full address for an on-site workshop", async () => {
    const address = "12 rue de la Charité, 69002 Lyon";
    vi.mocked(getEvents).mockResolvedValue([
      makeEvent({ location_kind: "onsite", location_label: "Lyon", address }),
    ]);

    render(await AgendaList());

    expect(screen.getByText("Lyon")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: new RegExp(address) });
    expect(link.closest("address")).not.toBeNull();
    expect(link).toHaveAttribute(
      "href",
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
    );
  });

  it("shows no address, and never the video link, for an online workshop", async () => {
    vi.mocked(getEvents).mockResolvedValue([
      makeEvent({ online_url: "https://meet.example.com/secret" }),
    ]);

    const { container } = render(await AgendaList());

    expect(container.querySelector("address")).toBeNull();
    expect(container.innerHTML).not.toContain("meet.example.com");
  });

  it("shows only the first `limit` workshops, soonest first", async () => {
    vi.mocked(getEvents).mockResolvedValue(
      Array.from({ length: 6 }, (_, index) =>
        makeEvent({ id: `event-${index}`, title: `Atelier ${index + 1}` }),
      ),
    );

    render(await AgendaList({ limit: 4 }));

    const titles = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
    expect(titles).toEqual(["Atelier 1", "Atelier 2", "Atelier 3", "Atelier 4"]);
  });

  it("shows every workshop without a limit", async () => {
    vi.mocked(getEvents).mockResolvedValue(
      Array.from({ length: 6 }, (_, index) =>
        makeEvent({ id: `event-${index}`, title: `Atelier ${index + 1}` }),
      ),
    );

    render(await AgendaList());

    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(6);
  });

  it("links a workshop's sign-up to the contact page, naming the workshop", async () => {
    render(await AgendaList());

    expect(
      screen.getByRole("link", { name: "S'inscrire à Brain Gym® en mouvement" }),
    ).toHaveAttribute("href", "/contact?atelier=11111111-1111-4111-8111-111111111111");
  });

  it("says so when the agenda is empty, and points at the contact form", async () => {
    vi.mocked(getEvents).mockResolvedValue([]);

    render(await AgendaList());

    expect(screen.getByText(ateliers.empty)).toBeInTheDocument();
    expectContactLink();
  });

  it("degrades to a notice when the backend is unreachable", async () => {
    vi.mocked(getEvents).mockRejectedValue(new Error("ECONNREFUSED"));
    expectFailureLogged();

    render(await AgendaList());

    expect(screen.getByText(ateliers.unavailable)).toBeInTheDocument();
    expectContactLink();
    // The notice names no dates: a stale workshop list is worse than none, because
    // someone could turn up to a workshop that is no longer happening.
    expect(screen.queryByText("Brain Gym® en mouvement")).not.toBeInTheDocument();
  });

  it("does not take the tariffs down with it", async () => {
    // The two fetch independently, which is why they are separate components.
    vi.mocked(getEvents).mockRejectedValue(new Error("ECONNREFUSED"));
    expectFailureLogged();

    render(await AgendaList());
    render(await PricingSection());

    expect(screen.getByText(ateliers.unavailable)).toBeInTheDocument();
    expect(screen.getByText("75 €")).toBeInTheDocument();
  });
});

describe("PricingSection", () => {
  it("formats an amount as euros", async () => {
    render(await PricingSection());

    expect(screen.getByText("Adulte")).toBeInTheDocument();
    expect(screen.getByText("75 €")).toBeInTheDocument();
  });

  it("renders a sur-devis line from the flag, not from a magic string", async () => {
    vi.mocked(getPricingTypes).mockResolvedValue([
      makePricingType({
        name: "Groupe",
        prices: [
          {
            id: "44444444-4444-4444-8444-444444444444",
            description: "Atelier en groupe",
            amount: null,
            on_demand: true,
          },
        ],
      }),
    ]);

    render(await PricingSection());

    expect(screen.getByText("Sur devis")).toBeInTheDocument();
  });

  it("shows cents when a price has them, and none when it doesn't", async () => {
    vi.mocked(getPricingTypes).mockResolvedValue([
      makePricingType({
        prices: [
          {
            id: "55555555-5555-4555-8555-555555555555",
            description: "Adulte",
            amount: "75.50",
            on_demand: false,
          },
        ],
      }),
    ]);

    render(await PricingSection());

    // Never "75,5 €" — a price shows two decimals or none.
    expect(screen.getByText(/75,50/)).toBeInTheDocument();
  });

  it("renders one card per group, headed by its name, with its note under the lines", async () => {
    const { container } = render(await PricingSection());

    expect(screen.getByRole("heading", { name: tarifs.title })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Individuel" })).toBeInTheDocument();
    // Name, then the price rows, then the group's note.
    const text = container.textContent ?? "";
    expect(text.indexOf("Individuel")).toBeLessThan(text.indexOf("Adulte"));
    expect(text.indexOf("Adulte")).toBeLessThan(text.indexOf("Par séance individuelle."));
  });

  it("keeps the heading and shows a notice when the backend is unreachable", async () => {
    // The tariffs exist, they just cannot be read right now — unlike an empty list, this
    // is not a reason to hide the sub-section.
    vi.mocked(getPricingTypes).mockRejectedValue(new Error("ECONNREFUSED"));
    expectFailureLogged();

    render(await PricingSection());

    expect(screen.getByRole("heading", { name: tarifs.title })).toBeInTheDocument();
    expect(screen.getByText(tarifs.unavailable)).toBeInTheDocument();
    expectContactLink();
    expect(screen.queryByText("75 €")).not.toBeInTheDocument();
  });

  it.each([
    ["no tariffs are set up", []],
    ["every group is empty", [makePricingType({ prices: [] })]],
  ])("hides the whole sub-section when %s", async (_case, pricingTypes) => {
    vi.mocked(getPricingTypes).mockResolvedValue(pricingTypes);

    expect(await PricingSection()).toBeNull();
  });

  it("drops a group with no published lines rather than rendering an empty card", async () => {
    vi.mocked(getPricingTypes).mockResolvedValue([
      makePricingType(),
      makePricingType({
        id: "66666666-6666-4666-8666-666666666666",
        name: "Groupe",
        prices: [],
      }),
    ]);

    render(await PricingSection());

    expect(screen.getByRole("heading", { name: "Individuel" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Groupe" })).not.toBeInTheDocument();
  });
});
