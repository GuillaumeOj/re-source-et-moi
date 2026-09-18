import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EditorContext } from "@/components/editor/EditorContext";
import { EMPTY_EVENT, EventForm } from "@/components/editor/EventForm";
import { LoginForm } from "@/components/editor/LoginForm";
import {
  amountForApi,
  amountForInput,
  PricingGroupForm,
} from "@/components/editor/PricingGroupForm";
import { ApiError, FIX_FIELDS, type ManagedPricingType, SAVED_LIVE } from "@/lib/editor/api";

vi.mock("@/lib/editor/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/editor/api")>();
  return {
    ...actual,
    editorApi: {
      login: vi.fn(),
      createEvent: vi.fn(),
      updateEvent: vi.fn(),
      createPricingType: vi.fn(),
      updatePricingType: vi.fn(),
    },
  };
});

// The Server Action that refreshes the public site after a save.
vi.mock("@/lib/editor/refresh", () => ({ refreshPublicSite: vi.fn().mockResolvedValue(true) }));

const { editorApi } = await import("@/lib/editor/api");

const SESSION = { username: "cecile", email: "cecile@example.org" };

function withEditor(children: ReactNode) {
  return (
    <EditorContext.Provider value={{ session: SESSION, setSession: vi.fn() }}>
      {children}
    </EditorContext.Provider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("LoginForm", () => {
  it("shows the server's message on bad credentials and clears the password", async () => {
    vi.mocked(editorApi.login).mockRejectedValue(
      new ApiError(400, { non_field_errors: ["Identifiant ou mot de passe incorrect."] }),
    );
    render(<LoginForm onLoggedIn={vi.fn()} />);

    await userEvent.type(screen.getByLabelText("Identifiant"), "cecile");
    await userEvent.type(screen.getByLabelText("Mot de passe"), "mauvais");
    await userEvent.click(screen.getByRole("button", { name: "Se connecter" }));

    expect(await screen.findByText("Identifiant ou mot de passe incorrect.")).toBeInTheDocument();
    expect(screen.getByLabelText("Mot de passe")).toHaveValue("");
  });

  it("says to wait when the login is throttled", async () => {
    vi.mocked(editorApi.login).mockRejectedValue(new ApiError(429, {}));
    render(<LoginForm onLoggedIn={vi.fn()} />);

    await userEvent.type(screen.getByLabelText("Identifiant"), "cecile");
    await userEvent.type(screen.getByLabelText("Mot de passe"), "x");
    await userEvent.click(screen.getByRole("button", { name: "Se connecter" }));

    expect(await screen.findByText(/Trop de tentatives/)).toBeInTheDocument();
  });

  it("hands the session over on success", async () => {
    const onLoggedIn = vi.fn();
    vi.mocked(editorApi.login).mockResolvedValue(SESSION);
    render(<LoginForm onLoggedIn={onLoggedIn} />);

    await userEvent.type(screen.getByLabelText("Identifiant"), "cecile");
    await userEvent.type(screen.getByLabelText("Mot de passe"), "bon");
    await userEvent.click(screen.getByRole("button", { name: "Se connecter" }));

    expect(onLoggedIn).toHaveBeenCalledWith(SESSION);
  });
});

describe("EventForm", () => {
  function renderForm() {
    const onSaved = vi.fn();
    render(
      withEditor(
        <EventForm event={null} initial={EMPTY_EVENT} onSaved={onSaved} onCancel={vi.fn()} />,
      ),
    );
    return { onSaved };
  }

  it("shows the address fields only for an on-site workshop", async () => {
    renderForm();

    expect(screen.getByLabelText("Lien de visioconférence")).toBeInTheDocument();
    expect(screen.queryByLabelText("Ville")).not.toBeInTheDocument();

    await userEvent.click(screen.getByLabelText("Sur place"));

    expect(screen.getByLabelText("Ville")).toBeInTheDocument();
    expect(screen.queryByLabelText("Lien de visioconférence")).not.toBeInTheDocument();
  });

  it("doesn't send an address hidden by switching back to online", async () => {
    // The draft keeps it (switching back loses nothing), but the backend would reject
    // an online workshop that carries one, on a field she can no longer see.
    vi.mocked(editorApi.createEvent).mockResolvedValue({} as never);
    renderForm();

    await userEvent.click(screen.getByLabelText("Sur place"));
    await userEvent.type(screen.getByLabelText("Ville"), "Lyon");
    await userEvent.click(screen.getByLabelText("En ligne"));
    await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(vi.mocked(editorApi.createEvent).mock.calls[0][0]).toMatchObject({
      location_kind: "online",
      city: "",
    });
  });

  it("puts the backend's messages under the fields they concern", async () => {
    vi.mocked(editorApi.createEvent).mockRejectedValue(
      new ApiError(400, { end_time: ["L'heure de fin doit être postérieure à l'heure de début."] }),
    );
    renderForm();

    await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    const message = await screen.findByText(
      "L'heure de fin doit être postérieure à l'heure de début.",
    );
    expect(screen.getByLabelText("Fin")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Fin")).toHaveAttribute(
      "aria-describedby",
      expect.stringContaining(message.id),
    );
    expect(screen.getByRole("alert")).toHaveTextContent(FIX_FIELDS);
  });

  it("hands over as soon as the workshop is saved", async () => {
    // Refreshing the public site is the caller's job, so closing the form never waits
    // on it.
    vi.mocked(editorApi.createEvent).mockResolvedValue({ id: "e1" } as never);
    const { onSaved } = renderForm();

    await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(onSaved).toHaveBeenCalledOnce();
  });
});

describe("PricingGroupForm", () => {
  const group: ManagedPricingType = {
    id: "g1",
    name: "Individuel",
    description: "",
    position: 0,
    is_published: true,
    prices: [
      {
        id: "p1",
        description: "Adulte",
        amount: "75.00",
        on_demand: false,
        position: 0,
        is_published: true,
      },
      {
        id: "p2",
        description: "Enfant",
        amount: "60.50",
        on_demand: false,
        position: 1,
        is_published: true,
      },
    ],
  };

  function renderGroup() {
    render(withEditor(<PricingGroupForm group={group} onSaved={vi.fn()} onRemove={vi.fn()} />));
  }

  it("shows amounts the way they are written in French", () => {
    renderGroup();

    const amounts = screen.getAllByLabelText("Montant (€)");
    expect(amounts[0]).toHaveValue("75");
    expect(amounts[1]).toHaveValue("60,50");
  });

  it("disables the amount of a sur-devis line and sends it as null", async () => {
    vi.mocked(editorApi.updatePricingType).mockResolvedValue(group);
    renderGroup();

    await userEvent.click(screen.getAllByLabelText("Sur devis")[0]);

    expect(screen.getAllByLabelText("Montant (€)")[0]).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
    const payload = vi.mocked(editorApi.updatePricingType).mock.calls[0][1];
    expect(payload.prices?.[0]).toMatchObject({ id: "p1", amount: null, on_demand: true });
  });

  it("orders lines by their place on screen", async () => {
    vi.mocked(editorApi.updatePricingType).mockResolvedValue(group);
    renderGroup();

    await userEvent.click(screen.getByRole("button", { name: "Monter « Enfant »" }));
    await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    const payload = vi.mocked(editorApi.updatePricingType).mock.calls[0][1];
    expect(payload.prices?.map((price) => [price.id, price.position])).toEqual([
      ["p2", 0],
      ["p1", 1],
    ]);
  });

  it("sends a removed line's absence, and a new line without an id", async () => {
    vi.mocked(editorApi.updatePricingType).mockResolvedValue(group);
    renderGroup();

    await userEvent.click(screen.getByRole("button", { name: "Retirer « Enfant »" }));
    await userEvent.click(screen.getByRole("button", { name: "Ajouter un tarif" }));
    await userEvent.type(screen.getAllByLabelText("Libellé")[1], "Couple");
    await userEvent.type(screen.getAllByLabelText("Montant (€)")[1], "120");
    await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    const payload = vi.mocked(editorApi.updatePricingType).mock.calls[0][1];
    expect(payload.prices).toEqual([
      expect.objectContaining({ id: "p1" }),
      expect.not.objectContaining({ id: expect.anything() }),
    ]);
    expect(payload.prices?.[1]).toMatchObject({ description: "Couple", amount: "120" });
  });

  it("confirms on its own card once the public site is refreshed", async () => {
    vi.mocked(editorApi.updatePricingType).mockResolvedValue(group);
    renderGroup();

    await userEvent.type(screen.getAllByLabelText("Libellé")[0], " (1h)");
    await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(await screen.findByText(SAVED_LIVE)).toBeInTheDocument();
    // Its place is the reorder endpoint's business, never the card's save.
    expect(vi.mocked(editorApi.updatePricingType).mock.calls[0][1]).not.toHaveProperty("position");
  });

  it("keeps Enregistrer off until something changed", () => {
    renderGroup();

    expect(screen.getByRole("button", { name: "Enregistrer" })).toBeDisabled();
  });

  it("shows a line's error on that line", async () => {
    vi.mocked(editorApi.updatePricingType).mockRejectedValue(
      new ApiError(400, { prices: [{}, { amount: ["Indiquer un montant."] }] }),
    );
    renderGroup();

    await userEvent.clear(screen.getAllByLabelText("Montant (€)")[1]);
    await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await screen.findByText("Indiquer un montant.");
    expect(screen.getAllByLabelText("Montant (€)")[1]).toHaveAttribute("aria-invalid", "true");
    expect(screen.getAllByLabelText("Montant (€)")[0]).not.toHaveAttribute("aria-invalid");
  });
});

describe("amount conversion", () => {
  it.each([
    ["75.00", "75"],
    ["75.50", "75,50"],
    [null, ""],
  ])("shows %s as %j", (api, shown) => {
    expect(amountForInput(api)).toBe(shown);
  });

  it.each([
    ["75", "75"],
    ["75,50", "75.50"],
    [" 1 200 € ", "1200"],
    ["", null],
  ])("sends %j as %j", (typed, sent) => {
    expect(amountForApi(typed)).toBe(sent);
  });
});
