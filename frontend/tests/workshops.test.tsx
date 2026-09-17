import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Workshops } from "@/components/sections/Workshops";
import { ateliers } from "@/content/ateliers";
import { tarifs } from "@/content/tarifs";
import type { Event, PricingType } from "@/lib/api/client";

// Workshops is an async Server Component, so it is invoked and awaited rather than passed
// to render() as an element — React's client renderer cannot resolve an async component.
// Everything it returns is synchronous, so the awaited tree renders normally.
vi.mock("@/lib/api/client", () => ({
  getEvents: vi.fn(),
  getPricingTypes: vi.fn(),
}));

// No request context under vitest; connection() only exists to defer rendering past build.
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

async function renderWorkshops() {
  render(await Workshops());
}

beforeEach(() => {
  vi.mocked(getEvents).mockResolvedValue([makeEvent()]);
  vi.mocked(getPricingTypes).mockResolvedValue([makePricingType()]);
});

describe("Workshops — agenda", () => {
  it("renders a workshop from the API", async () => {
    await renderWorkshops();

    expect(screen.getByRole("heading", { name: "Brain Gym® en mouvement" })).toBeInTheDocument();
    expect(screen.getByText("En ligne")).toBeInTheDocument();
  });

  it("formats the date in French from the ISO value", async () => {
    // 2026-06-13 is a Saturday. The API sends only "2026-06-13" / "10:00:00", so every
    // one of these strings is produced on this side — the reason the backend is free to
    // stay machine-readable.
    await renderWorkshops();

    expect(screen.getByText("13")).toBeInTheDocument();
    expect(screen.getByText("Juin")).toBeInTheDocument();
    expect(screen.getByText("Samedi · 10h–12h")).toBeInTheDocument();
  });

  it("gives the date badge a machine-readable datetime and a full spoken date", async () => {
    // The "13"/"Juin" split is visual only; a screen reader gets the whole date.
    await renderWorkshops();

    const fullDate = screen.getByText("samedi 13 juin 2026");
    expect(fullDate.closest("time")).toHaveAttribute("datetime", "2026-06-13");
  });

  it("shows minutes only when there are any", async () => {
    vi.mocked(getEvents).mockResolvedValue([
      makeEvent({ start_time: "10:30:00", end_time: "12:00:00" }),
    ]);

    await renderWorkshops();

    expect(screen.getByText("Samedi · 10h30–12h")).toBeInTheDocument();
  });

  it("shows the city for an on-site workshop", async () => {
    vi.mocked(getEvents).mockResolvedValue([
      makeEvent({ location_kind: "onsite", location_label: "Lyon", address: "12 rue X, Lyon" }),
    ]);

    await renderWorkshops();

    expect(screen.getByText("Lyon")).toBeInTheDocument();
  });

  it("says so when the agenda is empty rather than rendering nothing", async () => {
    vi.mocked(getEvents).mockResolvedValue([]);

    await renderWorkshops();

    expect(screen.getByText(ateliers.empty)).toBeInTheDocument();
  });

  it("degrades to a notice when the backend is unreachable", async () => {
    vi.mocked(getEvents).mockRejectedValue(new Error("ECONNREFUSED"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    await renderWorkshops();

    expect(screen.getByText(ateliers.unavailable)).toBeInTheDocument();
    // The notice names no dates: a stale workshop list is worse than none, because
    // someone could turn up to a workshop that is no longer happening.
    expect(screen.queryByText("Brain Gym® en mouvement")).not.toBeInTheDocument();
  });

  it("keeps the tariffs when only the agenda fails", async () => {
    vi.mocked(getEvents).mockRejectedValue(new Error("ECONNREFUSED"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    await renderWorkshops();

    expect(screen.getByText(ateliers.unavailable)).toBeInTheDocument();
    expect(screen.getByText("75 €")).toBeInTheDocument();
  });
});

describe("Workshops — tarifs", () => {
  it("formats an amount as euros", async () => {
    await renderWorkshops();

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

    await renderWorkshops();

    expect(screen.getByText("Sur devis")).toBeInTheDocument();
  });

  it("shows cents when a price has them", async () => {
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

    await renderWorkshops();

    // Non-breaking space before the euro sign, as Intl emits for fr-FR.
    expect(screen.getByText(/75,50/)).toBeInTheDocument();
  });

  it("degrades to a notice when the backend is unreachable", async () => {
    vi.mocked(getPricingTypes).mockRejectedValue(new Error("ECONNREFUSED"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    await renderWorkshops();

    expect(screen.getByText(tarifs.unavailable)).toBeInTheDocument();
    expect(screen.queryByText("75 €")).not.toBeInTheDocument();
  });

  it("shows the notice rather than an empty grid when there are no tariffs", async () => {
    vi.mocked(getPricingTypes).mockResolvedValue([]);

    await renderWorkshops();

    expect(screen.getByText(tarifs.unavailable)).toBeInTheDocument();
  });
});
