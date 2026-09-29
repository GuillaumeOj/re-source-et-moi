import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReviewEditor } from "@/components/editor/ReviewEditor";
import { ApiError, SAVED_LIVE } from "@/lib/editor/api";
import { BASE_PATH, editorContext, review, withEditor } from "./fixtures";

vi.mock("@/lib/editor/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/editor/api")>();
  return {
    ...actual,
    editorApi: {
      getReview: vi.fn(),
      createReview: vi.fn(),
      updateReview: vi.fn(),
      deleteReview: vi.fn(),
    },
  };
});

vi.mock("@/lib/editor/refresh", () => ({ refreshPublicSite: vi.fn().mockResolvedValue(true) }));

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const { editorApi } = await import("@/lib/editor/api");

const LIST = `${BASE_PATH}/temoignages`;
const setFlash = vi.fn();

function renderEditor(id: string | null) {
  render(withEditor(<ReviewEditor id={id} />, editorContext({ setFlash })));
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(editorApi.getReview).mockResolvedValue(review({ id: "r1", author: "Camille" }));
});

describe("ReviewEditor, for a stored review", () => {
  it("saves an edit and stays on the page with a confirmation", async () => {
    vi.mocked(editorApi.updateReview).mockResolvedValue(
      review({ id: "r1", author: "Camille", text: "Nouveau texte" }),
    );
    renderEditor("r1");

    const form = await screen.findByRole("form", { name: "Avis de Camille" });
    const text = within(form).getByLabelText(/Avis/);
    await userEvent.clear(text);
    await userEvent.type(text, "Nouveau texte");
    await userEvent.click(within(form).getByRole("button", { name: "Enregistrer" }));

    expect(editorApi.getReview).toHaveBeenCalledWith("r1");
    expect(editorApi.updateReview).toHaveBeenCalledWith("r1", {
      text: "Nouveau texte",
      author: "Camille",
      context: "Atelier découverte",
    });
    expect(await within(form).findByText(SAVED_LIVE)).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it("deletes the review once confirmed and goes back to the table", async () => {
    vi.mocked(editorApi.deleteReview).mockResolvedValue(undefined);
    renderEditor("r1");

    const form = await screen.findByRole("form", { name: "Avis de Camille" });
    await userEvent.click(within(form).getByRole("button", { name: "Supprimer l'avis" }));
    await userEvent.click(screen.getByRole("button", { name: "Supprimer" }));

    expect(editorApi.deleteReview).toHaveBeenCalledWith("r1");
    await vi.waitFor(() => expect(push).toHaveBeenCalledWith(LIST));
    expect(setFlash).toHaveBeenCalledWith({ tone: "success", text: SAVED_LIVE });
  });

  it("says so when the review does not exist", async () => {
    vi.mocked(editorApi.getReview).mockRejectedValue(new ApiError(404, {}));
    renderEditor("gone");

    expect(await screen.findByText(/Cet avis n'existe pas/)).toBeInTheDocument();
  });

  it("links back to the table", async () => {
    renderEditor("r1");

    expect(screen.getByRole("link", { name: "Tous les témoignages" })).toHaveAttribute(
      "href",
      LIST,
    );
  });
});

describe("ReviewEditor, for a new review", () => {
  it("creates the review, then goes back to the table with the confirmation", async () => {
    vi.mocked(editorApi.createReview).mockResolvedValue(
      review({ id: "r3", text: "Merci !", author: "Anne", context: "" }),
    );
    renderEditor(null);

    const form = screen.getByRole("form", { name: "Nouvel avis" });
    await userEvent.type(within(form).getByLabelText(/Avis/), "Merci !");
    await userEvent.type(within(form).getByLabelText(/Nom/), "Anne");
    await userEvent.click(within(form).getByRole("button", { name: "Enregistrer" }));

    expect(editorApi.createReview).toHaveBeenCalledWith({
      text: "Merci !",
      author: "Anne",
      context: "",
    });
    await vi.waitFor(() => expect(push).toHaveBeenCalledWith(LIST));
    // Gone as soon as the review is stored, so it cannot be sent twice.
    expect(screen.queryByRole("form", { name: "Nouvel avis" })).not.toBeInTheDocument();
    expect(setFlash).toHaveBeenCalledWith({ tone: "success", text: SAVED_LIVE });
  });

  it("shows the backend's message under the field it is about", async () => {
    vi.mocked(editorApi.createReview).mockRejectedValue(
      new ApiError(400, { author: ["Ce champ ne peut être vide."] }),
    );
    renderEditor(null);

    const form = screen.getByRole("form", { name: "Nouvel avis" });
    await userEvent.click(within(form).getByRole("button", { name: "Enregistrer" }));

    expect(await within(form).findByText("Ce champ ne peut être vide.")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it("goes back to the table when abandoned", async () => {
    renderEditor(null);

    await userEvent.click(screen.getByRole("button", { name: "Abandonner" }));

    expect(push).toHaveBeenCalledWith(LIST);
  });
});
