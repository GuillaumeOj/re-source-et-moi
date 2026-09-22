import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReviewsEditor } from "@/components/editor/ReviewsEditor";
import { ApiError, SAVED_LIVE } from "@/lib/editor/api";
import { review, withEditor } from "./fixtures";

vi.mock("@/lib/editor/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/editor/api")>();
  return {
    ...actual,
    editorApi: {
      listReviews: vi.fn(),
      createReview: vi.fn(),
      updateReview: vi.fn(),
      patchReview: vi.fn(),
      deleteReview: vi.fn(),
    },
  };
});

vi.mock("@/lib/editor/refresh", () => ({ refreshPublicSite: vi.fn().mockResolvedValue(true) }));

const { editorApi } = await import("@/lib/editor/api");
const { refreshPublicSite } = await import("@/lib/editor/refresh");

function renderEditor() {
  render(withEditor(<ReviewsEditor />));
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(editorApi.listReviews).mockResolvedValue([
    review({ id: "r1", author: "Camille" }),
    review({ id: "r2", author: "Sophie", context: "Parent d'élève", is_published: false }),
  ]);
});

describe("ReviewsEditor", () => {
  it("shows one card per review, with whether it is published", async () => {
    renderEditor();

    expect(await screen.findByRole("form", { name: "Avis de Camille" })).toBeVisible();
    expect(screen.getByRole("switch", { name: "Publier l'avis de Camille" })).toBeChecked();
    expect(screen.getByRole("switch", { name: "Publier l'avis de Sophie" })).not.toBeChecked();
  });

  it("publishes a review as soon as its switch is flipped, and refreshes the home page", async () => {
    vi.mocked(editorApi.patchReview).mockResolvedValue(
      review({ id: "r2", author: "Sophie", is_published: true }),
    );
    renderEditor();

    await userEvent.click(await screen.findByRole("switch", { name: "Publier l'avis de Sophie" }));

    expect(editorApi.patchReview).toHaveBeenCalledWith("r2", { is_published: true });
    expect(await screen.findByText(SAVED_LIVE)).toBeInTheDocument();
    expect(refreshPublicSite).toHaveBeenCalledWith("reviews");
    expect(screen.getByRole("switch", { name: "Publier l'avis de Sophie" })).toBeChecked();
  });

  it("adds a new review at the top of the list", async () => {
    vi.mocked(editorApi.createReview).mockResolvedValue(
      review({ id: "r3", text: "Merci !", author: "Anne", context: "" }),
    );
    renderEditor();

    await userEvent.click(await screen.findByRole("button", { name: "Nouvel avis" }));
    const form = screen.getByRole("form", { name: "Nouvel avis" });
    await userEvent.type(within(form).getByLabelText(/Avis/), "Merci !");
    await userEvent.type(within(form).getByLabelText(/Nom/), "Anne");
    await userEvent.click(within(form).getByRole("button", { name: "Enregistrer" }));

    expect(editorApi.createReview).toHaveBeenCalledWith({
      text: "Merci !",
      author: "Anne",
      context: "",
    });
    expect(await screen.findByText(SAVED_LIVE)).toBeInTheDocument();
    expect(screen.getAllByRole("form").map((card) => card.getAttribute("aria-label"))).toEqual([
      "Avis de Anne",
      "Avis de Camille",
      "Avis de Sophie",
    ]);
  });

  it("shows the backend's message under the field it is about", async () => {
    vi.mocked(editorApi.createReview).mockRejectedValue(
      new ApiError(400, { author: ["Ce champ ne peut être vide."] }),
    );
    renderEditor();

    await userEvent.click(await screen.findByRole("button", { name: "Nouvel avis" }));
    const form = screen.getByRole("form", { name: "Nouvel avis" });
    await userEvent.click(within(form).getByRole("button", { name: "Enregistrer" }));

    expect(await within(form).findByText("Ce champ ne peut être vide.")).toBeInTheDocument();
  });

  it("saves an edited review and refreshes the home page", async () => {
    vi.mocked(editorApi.updateReview).mockResolvedValue(
      review({ id: "r1", author: "Camille", text: "Nouveau texte" }),
    );
    renderEditor();

    const form = await screen.findByRole("form", { name: "Avis de Camille" });
    const text = within(form).getByLabelText(/Avis/);
    await userEvent.clear(text);
    await userEvent.type(text, "Nouveau texte");
    await userEvent.click(within(form).getByRole("button", { name: "Enregistrer" }));

    expect(editorApi.updateReview).toHaveBeenCalledWith("r1", {
      text: "Nouveau texte",
      author: "Camille",
      context: "Atelier découverte",
    });
    expect(await within(form).findByText(SAVED_LIVE)).toBeInTheDocument();
  });

  it("deletes a review once confirmed", async () => {
    vi.mocked(editorApi.deleteReview).mockResolvedValue(undefined);
    renderEditor();

    const form = await screen.findByRole("form", { name: "Avis de Camille" });
    await userEvent.click(within(form).getByRole("button", { name: "Supprimer l'avis" }));
    await userEvent.click(screen.getByRole("button", { name: "Supprimer" }));

    expect(editorApi.deleteReview).toHaveBeenCalledWith("r1");
    expect(await screen.findByText(SAVED_LIVE)).toBeInTheDocument();
    expect(screen.queryByRole("form", { name: "Avis de Camille" })).not.toBeInTheDocument();
  });
});
