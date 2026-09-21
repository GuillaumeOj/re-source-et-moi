import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AteliersPage from "@/app/ateliers/page";
import { agenda, ateliers } from "@/content/ateliers";
import type { Event } from "@/lib/api/client";

vi.mock("@/lib/api/client", () => ({ getEvents: vi.fn() }));
vi.mock("next/server", () => ({ connection: vi.fn().mockResolvedValue(undefined) }));

// The page is tested with its two async views stubbed, as the home page stubs AgendaList:
// React's client renderer cannot resolve an async component nested in the tree. The
// calendar itself is awaited directly further down.
vi.mock("@/components/agenda/AgendaCalendar", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/agenda/AgendaCalendar")>();
  return {
    ...actual,
    AgendaCalendar: vi.fn(({ month }: { month: { year: number; month: number } }) => (
      <div data-testid="calendar">{`${month.year}-${month.month}`}</div>
    )),
  };
});
vi.mock("@/components/sections/workshops/AgendaList", () => ({
  AgendaList: () => <ul data-testid="list" />,
}));
vi.mock("@/components/sections/workshops/PricingSection", () => ({
  PricingSection: () => <div data-testid="pricing" />,
}));

const { getEvents } = await import("@/lib/api/client");
const { AgendaCalendar: RealAgendaCalendar } = await vi.importActual<
  typeof import("@/components/agenda/AgendaCalendar")
>("@/components/agenda/AgendaCalendar");

function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    title: "Brain Gym® en mouvement",
    date: "2026-10-20",
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

async function renderPage(searchParams: Record<string, string | string[]> = {}) {
  render(await AteliersPage({ searchParams: Promise.resolve(searchParams) }));
}

beforeEach(() => {
  // Only Date is faked: promises and timers keep running, so the async components resolve.
  // 15 October 2026, midday in Paris.
  vi.useFakeTimers({ now: new Date("2026-10-15T10:00:00Z"), toFake: ["Date"] });
  vi.mocked(getEvents).mockResolvedValue([makeEvent()]);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("AteliersPage", () => {
  it("has a breadcrumb from Accueil", async () => {
    await renderPage();
    const trail = screen.getByRole("navigation", { name: "Fil d'Ariane" });
    expect(within(trail).getByRole("link", { name: "Accueil" })).toHaveAttribute("href", "/");
    expect(within(trail).getByText(agenda.eyebrow)).toHaveAttribute("aria-current", "page");
  });

  it("shows the tariffs under both views", async () => {
    await renderPage();
    expect(screen.getByTestId("pricing")).toBeInTheDocument();
    cleanup();
    await renderPage({ vue: "calendrier" });
    expect(screen.getByTestId("pricing")).toBeInTheDocument();
  });

  it("renders one h1 and the site's landmarks", async () => {
    await renderPage();

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(agenda.title);
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("shows the list by default", async () => {
    await renderPage();

    expect(screen.getByTestId("list")).toBeInTheDocument();
    expect(screen.queryByTestId("calendar")).not.toBeInTheDocument();
    const toggle = screen.getByRole("navigation", { name: agenda.viewsLabel });
    expect(within(toggle).getByRole("link", { name: agenda.views.list })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("shows the calendar with ?vue=calendrier, on the current month by default", async () => {
    await renderPage({ vue: "calendrier" });

    expect(screen.getByTestId("calendar")).toHaveTextContent("2026-10");
    expect(screen.queryByTestId("list")).not.toBeInTheDocument();
    const toggle = screen.getByRole("navigation", { name: agenda.viewsLabel });
    expect(within(toggle).getByRole("link", { name: agenda.views.calendar })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("opens the calendar on the month in ?mois=", async () => {
    await renderPage({ vue: "calendrier", mois: "2026-03" });

    expect(screen.getByTestId("calendar")).toHaveTextContent("2026-3");
  });

  it("falls back to the current month when ?mois= is not a month", async () => {
    await renderPage({ vue: "calendrier", mois: "2026-13" });

    expect(screen.getByTestId("calendar")).toHaveTextContent("2026-10");
  });

  it("ignores a repeated parameter rather than guessing", async () => {
    await renderPage({ vue: ["calendrier", "liste"] });

    expect(screen.getByTestId("list")).toBeInTheDocument();
  });
});

describe("AgendaCalendar", () => {
  const october = { year: 2026, month: 10 };

  it("asks the backend for exactly the six weeks on screen", async () => {
    render(await RealAgendaCalendar({ month: october }));

    // 1 October 2026 is a Thursday: the grid runs Monday 28 September to Sunday 8 November.
    expect(getEvents).toHaveBeenCalledWith({ from: "2026-09-28", to: "2026-11-08" });
  });

  it("names the month and links to its neighbours", async () => {
    render(await RealAgendaCalendar({ month: october }));

    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Octobre 2026");
    expect(
      screen.getByRole("link", { name: `${agenda.previousMonth} : Septembre 2026` }),
    ).toHaveAttribute("href", "/ateliers?vue=calendrier&mois=2026-09");
    expect(
      screen.getByRole("link", { name: `${agenda.nextMonth} : Novembre 2026` }),
    ).toHaveAttribute("href", "/ateliers?vue=calendrier&mois=2026-11");
  });

  it("offers a way back to today only from another month", async () => {
    render(await RealAgendaCalendar({ month: october }));
    expect(screen.queryByRole("link", { name: agenda.today })).not.toBeInTheDocument();

    render(await RealAgendaCalendar({ month: { year: 2027, month: 1 } }));
    expect(screen.getByRole("link", { name: agenda.today })).toHaveAttribute(
      "href",
      "/ateliers?vue=calendrier&mois=2026-10",
    );
  });

  it("links a day with workshops down to them", async () => {
    render(await RealAgendaCalendar({ month: october }));

    const day = screen.getByRole("link", { name: "mardi 20 octobre 2026, 1 atelier" });
    expect(day).toHaveAttribute("href", "#jour-2026-10-20");
    expect(document.getElementById("jour-2026-10-20")).toContainElement(
      screen.getByRole("heading", { name: "Brain Gym® en mouvement" }),
    );
  });

  it("sends a spill-over day to its own month", async () => {
    vi.mocked(getEvents).mockResolvedValue([makeEvent({ date: "2026-11-03" })]);

    render(await RealAgendaCalendar({ month: october }));

    expect(screen.getByRole("link", { name: "mardi 3 novembre 2026, 1 atelier" })).toHaveAttribute(
      "href",
      "/ateliers?vue=calendrier&mois=2026-11#jour-2026-11-03",
    );
    // Not this month's, so not in the list under the grid.
    expect(screen.getByText(agenda.emptyMonth)).toBeInTheDocument();
  });

  it("shows a past workshop without a way to sign up", async () => {
    vi.mocked(getEvents).mockResolvedValue([
      makeEvent({ id: "past", title: "Passé", date: "2026-10-02" }),
      makeEvent({ id: "next", title: "À venir", date: "2026-10-20" }),
    ]);

    render(await RealAgendaCalendar({ month: october }));

    expect(screen.queryByRole("link", { name: "S'inscrire à Passé" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "S'inscrire à À venir" })).toBeInTheDocument();
  });

  it("says so when the month has no workshops", async () => {
    vi.mocked(getEvents).mockResolvedValue([]);

    render(await RealAgendaCalendar({ month: october }));

    expect(screen.getByText(agenda.emptyMonth)).toBeInTheDocument();
  });

  it("degrades to the unavailable notice when the backend is unreachable", async () => {
    vi.mocked(getEvents).mockRejectedValue(new Error("ECONNREFUSED"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    render(await RealAgendaCalendar({ month: october }));

    expect(screen.getByText(ateliers.unavailable)).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});
