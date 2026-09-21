import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AddressesEditor } from "@/components/editor/AddressesEditor";
import { ApiError } from "@/lib/editor/api";
import { address, withEditor } from "./fixtures";

vi.mock("@/lib/editor/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/editor/api")>();
  return {
    ...actual,
    editorApi: {
      listAddresses: vi.fn(),
      createAddress: vi.fn(),
      updateAddress: vi.fn(),
      deleteAddress: vi.fn(),
    },
  };
});

vi.mock("@/lib/editor/refresh", () => ({ refreshPublicSite: vi.fn().mockResolvedValue(true) }));

const { editorApi } = await import("@/lib/editor/api");

function renderEditor() {
  render(withEditor(<AddressesEditor />));
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(editorApi.listAddresses).mockResolvedValue([
    address({ id: "a1", name: "Maison des associations" }),
    address({ id: "a2", name: "Salle de la Charité", event_count: 2 }),
  ]);
});

describe("AddressesEditor", () => {
  it("shows one card per address, and which ones are in use", async () => {
    renderEditor();

    expect(await screen.findByRole("form", { name: "Maison des associations" })).toBeVisible();
    const used = screen.getByRole("form", { name: "Salle de la Charité" });
    expect(within(used).getByText(/Utilisée par 2 ateliers/)).toBeInTheDocument();
  });

  it("deletes an unused address once confirmed", async () => {
    vi.mocked(editorApi.deleteAddress).mockResolvedValue(undefined);
    renderEditor();

    const card = await screen.findByRole("form", { name: "Maison des associations" });
    await userEvent.click(within(card).getByRole("button", { name: "Supprimer l'adresse" }));
    await userEvent.click(screen.getByRole("button", { name: "Supprimer" }));

    expect(editorApi.deleteAddress).toHaveBeenCalledWith("a1");
    expect(await screen.findByText("Adresse supprimée.")).toBeInTheDocument();
    expect(screen.queryByRole("form", { name: "Maison des associations" })).not.toBeInTheDocument();
  });

  it("shows the backend's reason when a workshop took the address meanwhile", async () => {
    const refusal =
      "Cette adresse est utilisée par 1 atelier ; choisissez-leur une autre adresse avant de la supprimer.";
    vi.mocked(editorApi.deleteAddress).mockRejectedValue(
      new ApiError(400, { non_field_errors: [refusal] }),
    );
    renderEditor();

    const card = await screen.findByRole("form", { name: "Maison des associations" });
    await userEvent.click(within(card).getByRole("button", { name: "Supprimer l'adresse" }));
    await userEvent.click(screen.getByRole("button", { name: "Supprimer" }));

    expect(await screen.findByText(refusal)).toBeInTheDocument();
    // Reloaded, to pick up the count that changed.
    expect(editorApi.listAddresses).toHaveBeenCalledTimes(2);
  });

  it("adds a new address to the list, in name order", async () => {
    vi.mocked(editorApi.createAddress).mockResolvedValue(
      address({ id: "a3", name: "Centre social" }),
    );
    renderEditor();

    await userEvent.click(await screen.findByRole("button", { name: "Nouvelle adresse" }));
    const form = screen.getByRole("form", { name: "Nouvelle adresse" });
    await userEvent.type(within(form).getByLabelText("Nom"), "Centre social");
    await userEvent.type(within(form).getByLabelText("Ville"), "Lyon");
    await userEvent.click(within(form).getByRole("button", { name: "Enregistrer" }));

    expect(await screen.findByText("Adresse enregistrée.")).toBeInTheDocument();
    const names = screen.getAllByRole("form").map((card) => card.getAttribute("aria-label"));
    expect(names).toEqual(["Centre social", "Maison des associations", "Salle de la Charité"]);
  });
});
