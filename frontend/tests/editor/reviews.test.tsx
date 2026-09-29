import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReviewsEditor } from "@/components/editor/ReviewsEditor";
import { ApiError, SAVED_LIVE } from "@/lib/editor/api";
import { BASE_PATH, editorContext, page, review, withEditor } from "./fixtures";

vi.mock("@/lib/editor/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/editor/api")>();
  return {
    ...actual,
    editorApi: {
      listReviews: vi.fn(),
      patchReview: vi.fn(),
      deleteReview: vi.fn(),
    },
  };
});

vi.mock("@/lib/editor/refresh", () => ({ refreshPublicSite: vi.fn().mockResolvedValue(true) }));

const { editorApi } = await import("@/lib/editor/api");
const { refreshPublicSite } = await import("@/lib/editor/refresh");

const LIST = `${BASE_PATH}/temoignages`;

function renderEditor() {
  render(withEditor(<ReviewsEditor />));
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(editorApi.listReviews).mockResolvedValue(
    page([
      review({ id: "r1", author: "Camille" }),
      review({ id: "r2", author: "Sophie", context: "Parent d'élève", is_published: false }),
    ]),
  );
});

describe("ReviewsEditor", () => {
  it("shows one row per review, with whether it is published and a link to edit it", async () => {
    renderEditor();

    const row = (await screen.findByRole("rowheader", { name: "Camille" })).closest("tr");
    expect(row).not.toBeNull();
    const cells = within(row as HTMLElement);
    expect(cells.getByText("Atelier découverte")).toBeInTheDocument();
    expect(cells.getByText("12 sept. 2026")).toBeInTheDocument();
    expect(cells.getByRole("link", { name: "Modifier l'avis de Camille" })).toHaveAttribute(
      "href",
      `${LIST}/r1`,
    );
    expect(screen.getByRole("switch", { name: "Publier l'avis de Camille" })).toBeChecked();
    expect(screen.getByRole("switch", { name: "Publier l'avis de Sophie" })).not.toBeChecked();
    expect(screen.getByRole("link", { name: "Nouvel avis" })).toHaveAttribute(
      "href",
      `${LIST}/nouveau`,
    );
  });

  it("shows a long review as an excerpt", async () => {
    const text = `${"Une phrase assez longue pour déborder. ".repeat(5)}Fin.`;
    vi.mocked(editorApi.listReviews).mockResolvedValue(page([review({ text })]));
    renderEditor();

    const cell = await screen.findByText(/^Une phrase assez longue/);
    expect(cell.textContent?.endsWith("…")).toBe(true);
    expect(cell.textContent?.length).toBeLessThanOrEqual(81);
  });

  it("publishes a review as soon as its switch is flipped, and refreshes the site", async () => {
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

  it("deletes a review once confirmed, then reloads the page", async () => {
    vi.mocked(editorApi.deleteReview).mockResolvedValue(undefined);
    renderEditor();

    await userEvent.click(
      await screen.findByRole("button", { name: "Supprimer l'avis de Camille" }),
    );
    vi.mocked(editorApi.listReviews).mockResolvedValue(
      page([review({ id: "r2", author: "Sophie", is_published: false })]),
    );
    await userEvent.click(screen.getByRole("button", { name: "Supprimer" }));

    expect(editorApi.deleteReview).toHaveBeenCalledWith("r1");
    expect(await screen.findByText(SAVED_LIVE)).toBeInTheDocument();
    expect(screen.queryByRole("rowheader", { name: "Camille" })).not.toBeInTheDocument();
  });

  it("pages through fifty reviews at a time", async () => {
    vi.mocked(editorApi.listReviews).mockImplementation(async (number) =>
      number === 1
        ? page([review({ id: "r1", author: "Camille" })], { count: 51 })
        : page([review({ id: "r51", author: "Zoé" })], { count: 51 }),
    );
    renderEditor();

    expect(await screen.findByText("Page 1 sur 2")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Suivant/ }));

    expect(await screen.findByRole("rowheader", { name: "Zoé" })).toBeInTheDocument();
    expect(editorApi.listReviews).toHaveBeenLastCalledWith(2);
  });

  it("steps back a page when the one asked for no longer exists", async () => {
    vi.mocked(editorApi.listReviews).mockImplementation(async (number) => {
      if (number === 1) return page([review({ id: "r1", author: "Camille" })], { count: 51 });
      throw new ApiError(404, {});
    });
    renderEditor();

    await userEvent.click(await screen.findByRole("button", { name: /Suivant/ }));

    expect(await screen.findByText("Page 1 sur 2")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows the confirmation left by a review's own page", async () => {
    const setFlash = vi.fn();
    render(
      withEditor(
        <ReviewsEditor />,
        editorContext({ flash: { tone: "success", text: SAVED_LIVE }, setFlash }),
      ),
    );

    expect(await screen.findByText(SAVED_LIVE)).toBeInTheDocument();
    expect(setFlash).toHaveBeenCalledWith(null);
  });
});
