import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AccountEditor } from "@/components/editor/AccountEditor";
import { EditorContext } from "@/components/editor/EditorContext";
import { LoginForm, RESET_SENT } from "@/components/editor/LoginForm";
import { ResetPasswordForm } from "@/components/editor/ResetPasswordForm";
import { ApiError } from "@/lib/editor/api";

vi.mock("@/lib/editor/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/editor/api")>();
  return {
    ...actual,
    editorApi: {
      session: vi.fn(),
      login: vi.fn(),
      updateAccount: vi.fn(),
      changePassword: vi.fn(),
      passwordRules: vi.fn(),
      requestPasswordReset: vi.fn(),
      confirmPasswordReset: vi.fn(),
    },
  };
});

let searchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({ useSearchParams: () => searchParams }));

const { editorApi } = await import("@/lib/editor/api");

const SESSION = { username: "cecile", email: "cecile@example.org" };
const setSession = vi.fn();

function renderAccount() {
  render(
    <EditorContext.Provider value={{ session: SESSION, setSession }}>
      <AccountEditor />
    </EditorContext.Provider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(editorApi.session).mockRejectedValue(new ApiError(401, {}));
  vi.mocked(editorApi.passwordRules).mockResolvedValue({
    rules: ["Votre mot de passe doit contenir au minimum 8 caractères."],
  });
});

describe("Mon compte", () => {
  it("starts from the current username and e-mail", () => {
    renderAccount();

    expect(screen.getByLabelText("Identifiant")).toHaveValue("cecile");
    expect(screen.getByLabelText("Adresse e-mail")).toHaveValue("cecile@example.org");
  });

  it("saves the new details and updates the header's session", async () => {
    const updated = { username: "cecile.m", email: "cecile@example.org" };
    vi.mocked(editorApi.updateAccount).mockResolvedValue(updated);
    renderAccount();

    await userEvent.clear(screen.getByLabelText("Identifiant"));
    await userEvent.type(screen.getByLabelText("Identifiant"), "cecile.m");
    await userEvent.type(screen.getAllByLabelText("Mot de passe actuel")[0], "secret");
    await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(editorApi.updateAccount).toHaveBeenCalledWith({
      username: "cecile.m",
      email: "cecile@example.org",
      current_password: "secret",
    });
    expect(setSession).toHaveBeenCalledWith(updated);
    expect(await screen.findByText("Vos informations ont été enregistrées.")).toBeInTheDocument();
  });

  it("shows a wrong current password on that field", async () => {
    vi.mocked(editorApi.updateAccount).mockRejectedValue(
      new ApiError(400, { current_password: ["Le mot de passe actuel est incorrect."] }),
    );
    renderAccount();

    await userEvent.type(screen.getByLabelText("Adresse e-mail"), "x");
    await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(await screen.findByText("Le mot de passe actuel est incorrect.")).toBeInTheDocument();
    expect(setSession).not.toHaveBeenCalled();
  });

  it("changes the password and clears the fields", async () => {
    vi.mocked(editorApi.changePassword).mockResolvedValue(undefined);
    renderAccount();

    await userEvent.type(screen.getAllByLabelText("Mot de passe actuel")[1], "ancien");
    await userEvent.type(screen.getByLabelText("Nouveau mot de passe"), "nouveau-2027");
    await userEvent.type(
      screen.getByLabelText("Confirmer le nouveau mot de passe"),
      "nouveau-2027",
    );
    await userEvent.click(screen.getByRole("button", { name: "Changer le mot de passe" }));

    expect(editorApi.changePassword).toHaveBeenCalledWith({
      old_password: "ancien",
      new_password1: "nouveau-2027",
      new_password2: "nouveau-2027",
    });
    expect(await screen.findByText(/Mot de passe modifié/)).toBeInTheDocument();
    expect(screen.getByLabelText("Nouveau mot de passe")).toHaveValue("");
  });
});

describe("Mot de passe oublié", () => {
  it("is reached from the login form and confirms without saying whether the address exists", async () => {
    vi.mocked(editorApi.requestPasswordReset).mockResolvedValue(undefined);
    render(<LoginForm onLoggedIn={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: "Mot de passe oublié ?" }));
    await userEvent.type(screen.getByLabelText("Adresse e-mail"), "cecile@example.org");
    await userEvent.click(screen.getByRole("button", { name: "Recevoir le lien" }));

    expect(editorApi.requestPasswordReset).toHaveBeenCalledWith("cecile@example.org");
    expect(await screen.findByText(RESET_SENT)).toBeInTheDocument();
  });

  it("leads back to the login form", async () => {
    render(<LoginForm onLoggedIn={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: "Mot de passe oublié ?" }));
    await userEvent.click(screen.getByRole("button", { name: "Retour à la connexion" }));

    expect(screen.getByRole("button", { name: "Se connecter" })).toBeInTheDocument();
  });
});

describe("Réinitialisation", () => {
  beforeEach(() => {
    searchParams = new URLSearchParams({ uid: "Mg", token: "abc-123" });
  });

  it("sends the link's uid and token with the new password", async () => {
    vi.mocked(editorApi.confirmPasswordReset).mockResolvedValue(undefined);
    render(<ResetPasswordForm basePath="/admin-3f2c" />);

    await userEvent.type(screen.getByLabelText("Nouveau mot de passe"), "nouveau-2027");
    await userEvent.type(screen.getByLabelText("Confirmer le mot de passe"), "nouveau-2027");
    await userEvent.click(screen.getByRole("button", { name: "Enregistrer le mot de passe" }));

    expect(editorApi.confirmPasswordReset).toHaveBeenCalledWith({
      uid: "Mg",
      token: "abc-123",
      new_password1: "nouveau-2027",
      new_password2: "nouveau-2027",
    });
    expect(await screen.findByRole("link", { name: "Se connecter" })).toHaveAttribute(
      "href",
      "/admin-3f2c/ateliers",
    );
  });

  it("removes the token from the address bar", () => {
    window.history.replaceState(null, "", "/admin-3f2c/reinitialiser?uid=Mg&token=abc-123");
    render(<ResetPasswordForm basePath="/admin-3f2c" />);

    expect(window.location.search).toBe("");
  });

  it("explains an expired link and points back to the login page", async () => {
    vi.mocked(editorApi.confirmPasswordReset).mockRejectedValue(
      new ApiError(400, { token: ["Ce lien n'est plus valide. Demandez-en un nouveau."] }),
    );
    render(<ResetPasswordForm basePath="/admin-3f2c" />);

    await userEvent.type(screen.getByLabelText("Nouveau mot de passe"), "nouveau-2027");
    await userEvent.type(screen.getByLabelText("Confirmer le mot de passe"), "nouveau-2027");
    await userEvent.click(screen.getByRole("button", { name: "Enregistrer le mot de passe" }));

    expect(await screen.findByRole("heading", { name: "Lien expiré" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Aller à la page de connexion" })).toHaveAttribute(
      "href",
      "/admin-3f2c/ateliers",
    );
  });

  it("says so when the link is missing its token", () => {
    searchParams = new URLSearchParams({ uid: "Mg" });
    render(<ResetPasswordForm basePath="/admin-3f2c" />);

    expect(screen.getByText("Ce lien est incomplet.")).toBeInTheDocument();
  });

  it("shows password rule errors on the fields", async () => {
    vi.mocked(editorApi.confirmPasswordReset).mockRejectedValue(
      new ApiError(400, { new_password2: ["Les deux mots de passe ne correspondent pas."] }),
    );
    render(<ResetPasswordForm basePath="/admin-3f2c" />);

    await userEvent.type(screen.getByLabelText("Nouveau mot de passe"), "a");
    await userEvent.type(screen.getByLabelText("Confirmer le mot de passe"), "b");
    await userEvent.click(screen.getByRole("button", { name: "Enregistrer le mot de passe" }));

    expect(
      await screen.findByText("Les deux mots de passe ne correspondent pas."),
    ).toBeInTheDocument();
  });
});
