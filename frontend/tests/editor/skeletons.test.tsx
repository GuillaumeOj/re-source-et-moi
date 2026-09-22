import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AddressesEditor } from "@/components/editor/AddressesEditor";
import { EditorShell } from "@/components/editor/EditorShell";
import { EventList } from "@/components/editor/EventList";
import { PricingEditor } from "@/components/editor/PricingEditor";
import { address, SESSION, withEditor } from "./fixtures";

vi.mock("@/lib/editor/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/editor/api")>();
  return {
    ...actual,
    onSessionLost: () => () => undefined,
    editorApi: {
      session: vi.fn(),
      listEvents: vi.fn(),
      listAddresses: vi.fn(),
      listPricingTypes: vi.fn(),
    },
  };
});

vi.mock("next/navigation", () => ({ usePathname: () => "/edition/ateliers" }));

const { editorApi } = await import("@/lib/editor/api");

/** A promise the test settles itself, to look at the page while the request is in flight. */
function pending<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((settle) => {
    resolve = settle;
  });
  return { promise, resolve };
}

const noActions = {
  onEdit: vi.fn(),
  onDuplicate: vi.fn(),
  onDelete: vi.fn(),
  onTogglePublished: vi.fn(),
};

/** Skeletons, not text: the region is only announced, never shown. */
function expectSkeleton(label: string) {
  const text = screen.getByText(label);
  expect(text).toHaveClass("sr-only");
  const region = text.closest("[role=status]");
  expect(region).not.toHaveAttribute("aria-busy");
  expect(region?.textContent).toBe(label);
  return region;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("loading skeletons", () => {
  it("frames the editor while the session check is in flight", async () => {
    const session = pending<typeof SESSION>();
    vi.mocked(editorApi.session).mockReturnValue(session.promise);
    render(
      <EditorShell basePath="/edition">
        <p>Contenu</p>
      </EditorShell>,
    );

    const region = expectSkeleton("Chargement…");
    session.resolve(SESSION);

    expect(await screen.findByText("Contenu")).toBeInTheDocument();
    expect(region).not.toBeInTheDocument();
  });

  it.each([
    {
      label: "Chargement des ateliers…",
      view: () => <EventList reloadKey={0} {...noActions} />,
      mock: editorApi.listEvents,
      value: { count: 0, next: null, previous: null, results: [] },
      loaded: "Aucun atelier à venir.",
    },
    {
      label: "Chargement des adresses…",
      view: () => withEditor(<AddressesEditor />),
      mock: editorApi.listAddresses,
      value: [address({ name: "Maison des associations" })],
      loaded: "Maison des associations",
    },
    {
      label: "Chargement des tarifs…",
      view: () => withEditor(<PricingEditor />),
      mock: editorApi.listPricingTypes,
      value: [],
      loaded: "Tarifs",
    },
  ])("shows skeletons for $label", async ({ label, view, mock, value, loaded }) => {
    const request = pending<unknown>();
    vi.mocked(mock).mockReturnValue(request.promise as never);
    render(view());

    const region = expectSkeleton(label);
    request.resolve(value);

    expect((await screen.findAllByText(loaded)).length).toBeGreaterThan(0);
    expect(region).not.toBeInTheDocument();
  });
});
