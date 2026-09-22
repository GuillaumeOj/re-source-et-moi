import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
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
  expect(region).toHaveAttribute("aria-busy", "true");
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

  it.each<[string, () => ReactElement, () => { resolve: () => void }, string]>([
    [
      "Chargement des ateliers…",
      () => <EventList reloadKey={0} {...noActions} />,
      () => {
        const request = pending<Awaited<ReturnType<typeof editorApi.listEvents>>>();
        vi.mocked(editorApi.listEvents).mockReturnValue(request.promise);
        return {
          resolve: () => request.resolve({ count: 0, next: null, previous: null, results: [] }),
        };
      },
      "Aucun atelier à venir.",
    ],
    [
      "Chargement des adresses…",
      () => withEditor(<AddressesEditor />),
      () => {
        const request = pending<Awaited<ReturnType<typeof editorApi.listAddresses>>>();
        vi.mocked(editorApi.listAddresses).mockReturnValue(request.promise);
        return { resolve: () => request.resolve([address({ name: "Maison des associations" })]) };
      },
      "Maison des associations",
    ],
    [
      "Chargement des tarifs…",
      () => withEditor(<PricingEditor />),
      () => {
        const request = pending<Awaited<ReturnType<typeof editorApi.listPricingTypes>>>();
        vi.mocked(editorApi.listPricingTypes).mockReturnValue(request.promise);
        return { resolve: () => request.resolve([]) };
      },
      "Tarifs",
    ],
  ])("shows skeletons for %s", async (label, view, load, loaded) => {
    const request = load();
    render(view());

    const region = expectSkeleton(label);
    request.resolve();

    expect((await screen.findAllByText(loaded)).length).toBeGreaterThan(0);
    expect(region).not.toBeInTheDocument();
  });
});
