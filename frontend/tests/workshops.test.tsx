import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AgendaList } from "@/components/sections/workshops/AgendaList";
import { PricingCards } from "@/components/sections/workshops/PricingCards";
import { ateliers } from "@/content/ateliers";
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

  it("shows the city for an on-site workshop", async () => {
    vi.mocked(getEvents).mockResolvedValue([
      makeEvent({ location_kind: "onsite", location_label: "Lyon", address: "12 rue X, Lyon" }),
    ]);

    render(await AgendaList());

    expect(screen.getByText("Lyon")).toBeInTheDocument();
  });

  it("says so when the agenda is empty rather than rendering nothing", async () => {
    vi.mocked(getEvents).mockResolvedValue([]);

    render(await AgendaList());

    expect(screen.getByText(ateliers.empty)).toBeInTheDocument();
  });

  it("degrades to a notice when the backend is unreachable", async () => {
    vi.mocked(getEvents).mockRejectedValue(new Error("ECONNREFUSED"));
    expectFailureLogged();

    render(await AgendaList());

    expect(screen.getByText(ateliers.unavailable)).toBeInTheDocument();
    // The notice names no dates: a stale workshop list is worse than none, because
    // someone could turn up to a workshop that is no longer happening.
    expect(screen.queryByText("Brain Gym® en mouvement")).not.toBeInTheDocument();
  });

  it("does not take the tariffs down with it", async () => {
    // The two fetch independently, which is why they are separate components.
    vi.mocked(getEvents).mockRejectedValue(new Error("ECONNREFUSED"));
    expectFailureLogged();

    render(await AgendaList());
    render(await PricingCards());

    expect(screen.getByText(ateliers.unavailable)).toBeInTheDocument();
    expect(screen.getByText("75 €")).toBeInTheDocument();
  });
});

describe("PricingCards", () => {
  it("formats an amount as euros", async () => {
    render(await PricingCards());

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

    render(await PricingCards());

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

    render(await PricingCards());

    // Never "75,5 €" — a price shows two decimals or none.
    expect(screen.getByText(/75,50/)).toBeInTheDocument();
  });

  it("degrades to a notice when the backend is unreachable", async () => {
    vi.mocked(getPricingTypes).mockRejectedValue(new Error("ECONNREFUSED"));
    expectFailureLogged();

    render(await PricingCards());

    expect(screen.getByText(tarifs.unavailable)).toBeInTheDocument();
    expect(screen.queryByText("75 €")).not.toBeInTheDocument();
  });

  it("shows the notice rather than an empty grid when there are no tariffs", async () => {
    vi.mocked(getPricingTypes).mockResolvedValue([]);

    render(await PricingCards());

    expect(screen.getByText(tarifs.unavailable)).toBeInTheDocument();
  });
});
