import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AddressForm } from "@/components/editor/AddressForm";
import { draftFrom, EMPTY_EVENT, EventForm } from "@/components/editor/EventForm";
import { LoginForm } from "@/components/editor/LoginForm";
import {
  amountForApi,
  amountForInput,
  PricingGroupForm,
} from "@/components/editor/PricingGroupForm";
import {
  ApiError,
  FIX_FIELDS,
  type ManagedEvent,
  type ManagedPricingType,
  SAVED_LIVE,
} from "@/lib/editor/api";
import { address, SESSION, withEditor } from "./fixtures";

vi.mock("@/lib/editor/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/editor/api")>();
  return {
    ...actual,
    editorApi: {
      login: vi.fn(),
      createEvent: vi.fn(),
      updateEvent: vi.fn(),
      listAddresses: vi.fn(),
      createAddress: vi.fn(),
      updateAddress: vi.fn(),
      createPricingType: vi.fn(),
      updatePricingType: vi.fn(),
    },
  };
});

// The Server Action that refreshes the public site after a save.
vi.mock("@/lib/editor/refresh", () => ({ refreshPublicSite: vi.fn().mockResolvedValue(true) }));

const { editorApi } = await import("@/lib/editor/api");

const ADDRESSES = [
  address({}),
  address({ id: "a2", name: "Maison des associations", one_line: "Lyon", line1: "" }),
];

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(editorApi.listAddresses).mockResolvedValue(ADDRESSES);
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

  it("takes a date and times written and read the way they are in France", async () => {
    // The browser's own date and time pickers speak the browser's language, which is not
    // necessarily French — hence the editor's own controls. What leaves them is ISO.
    vi.mocked(editorApi.createEvent).mockResolvedValue({} as never);
    renderForm();

    await userEvent.type(screen.getByLabelText("Date"), "14/06/2026");
    await userEvent.selectOptions(screen.getByLabelText("Début"), "10");
    await userEvent.selectOptions(screen.getByLabelText("Début — minutes"), "00");
    await userEvent.selectOptions(screen.getByLabelText("Fin"), "12");
    await userEvent.selectOptions(screen.getByLabelText("Fin — minutes"), "30");
    await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(vi.mocked(editorApi.createEvent).mock.calls[0][0]).toMatchObject({
      date: "2026-06-14",
      start_time: "10:00",
      end_time: "12:30",
    });
  });

  it("says so when the date is left half-written, and doesn't send the old one", async () => {
    // What is written has to be what gets saved. A date cut back to "14/06" is no date,
    // so the draft holds none — keeping the last complete one would save a day she is no
    // longer looking at.
    vi.mocked(editorApi.createEvent).mockResolvedValue({} as never);
    renderForm();

    const date = screen.getByLabelText("Date");
    await userEvent.type(date, "14/06/2026");
    await userEvent.clear(date);
    await userEvent.type(date, "14/06");
    await userEvent.tab();

    expect(await screen.findByText(/Date incomplète/)).toBeInTheDocument();
    expect(date).toHaveValue("14/06");

    await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(vi.mocked(editorApi.createEvent).mock.calls[0][0]).toMatchObject({ date: "" });
  });

  it("keeps a half-chosen time to itself rather than inventing midnight", async () => {
    // Choosing the minutes first is an ordinary way to fill this in. Completing the hour
    // as "00" would save a workshop at 00:30 for someone who means 14:30.
    vi.mocked(editorApi.createEvent).mockResolvedValue({} as never);
    renderForm();

    await userEvent.selectOptions(screen.getByLabelText("Début — minutes"), "30");
    await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(screen.getByLabelText("Début")).toHaveValue("");
    expect(screen.getByLabelText("Début — minutes")).toHaveValue("30");
    expect(vi.mocked(editorApi.createEvent).mock.calls[0][0]).toMatchObject({ start_time: "" });
  });

  it("tells a date that doesn't exist from one that isn't finished", async () => {
    // 2026 is not a leap year. "Date incomplète" would send her back to count the
    // characters she has already typed, all ten of them.
    renderForm();

    await userEvent.type(screen.getByLabelText("Date"), "29/02/2026");
    await userEvent.tab();

    expect(await screen.findByText(/n'existe pas/)).toBeInTheDocument();
  });

  it("fills the date from the calendar, in French", async () => {
    renderForm();

    // The calendar opens on the month of the date already in the field — here June 2026,
    // so the test doesn't depend on the day it runs.
    await userEvent.type(screen.getByLabelText("Date"), "14/06/2026");
    await userEvent.click(screen.getByLabelText("Choisir dans le calendrier"));
    await userEvent.click(screen.getByLabelText("lundi 15 juin 2026"));

    expect(screen.getByLabelText("Date")).toHaveValue("15/06/2026");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows a stored workshop's date and times as they are written here", () => {
    const event = {
      ...EMPTY_EVENT,
      id: "e1",
      date: "2026-06-14",
      start_time: "10:00:00",
      end_time: "12:30:00",
    } as unknown as ManagedEvent;
    render(
      withEditor(
        <EventForm event={event} initial={draftFrom(event)} onSaved={vi.fn()} onCancel={vi.fn()} />,
      ),
    );

    expect(screen.getByLabelText("Date")).toHaveValue("14/06/2026");
    expect(screen.getByLabelText("Début")).toHaveValue("10");
    expect(screen.getByLabelText("Fin — minutes")).toHaveValue("30");
  });

  it("asks for a saved address only for an on-site workshop", async () => {
    renderForm();

    expect(screen.getByLabelText("Lien de visioconférence")).toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "Adresse" })).not.toBeInTheDocument();

    await userEvent.click(screen.getByLabelText("Sur place"));

    expect(screen.getByRole("combobox", { name: "Adresse" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Lien de visioconférence")).not.toBeInTheDocument();
  });

  it("sends the chosen address and shows it in full", async () => {
    vi.mocked(editorApi.createEvent).mockResolvedValue({} as never);
    renderForm();

    await userEvent.click(screen.getByLabelText("Sur place"));
    const picker = screen.getByRole("combobox", { name: "Adresse" });
    await screen.findByRole("option", { name: "Salle de la Charité — Lyon" });
    await userEvent.selectOptions(picker, "a1");

    expect(screen.getByText("12 rue de la Charité, 69002 Lyon")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
    expect(vi.mocked(editorApi.createEvent).mock.calls[0][0]).toMatchObject({
      location_kind: "onsite",
      address: "a1",
      online_url: "",
    });
  });

  it("doesn't send an address hidden by switching back to online", async () => {
    // The draft keeps it (switching back loses nothing), but the backend would reject
    // an online workshop that carries one, on a field she can no longer see.
    vi.mocked(editorApi.createEvent).mockResolvedValue({} as never);
    renderForm();

    await userEvent.click(screen.getByLabelText("Sur place"));
    await screen.findByRole("option", { name: "Salle de la Charité — Lyon" });
    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Adresse" }), "a1");
    await userEvent.click(screen.getByLabelText("En ligne"));
    await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(vi.mocked(editorApi.createEvent).mock.calls[0][0]).toMatchObject({
      location_kind: "online",
      address: null,
    });
  });

  it("creates a new address in place and picks it", async () => {
    vi.mocked(editorApi.createAddress).mockResolvedValue(
      address({ id: "a3", name: "Salle Paul Éluard", city: "Villeurbanne" }),
    );
    vi.mocked(editorApi.createEvent).mockResolvedValue({} as never);
    renderForm();

    await userEvent.click(screen.getByLabelText("Sur place"));
    await screen.findByRole("option", { name: "Salle de la Charité — Lyon" });
    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Adresse" }), "new");
    const group = screen.getByRole("group", { name: "Nouvelle adresse" });
    await userEvent.type(within(group).getByLabelText("Nom"), "Salle Paul Éluard");
    // Enter in the nested form saves the address, not the workshop around it.
    await userEvent.type(within(group).getByLabelText("Ville"), "Villeurbanne{Enter}");

    expect(editorApi.createAddress).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Salle Paul Éluard", city: "Villeurbanne" }),
    );
    expect(editorApi.createEvent).not.toHaveBeenCalled();
    expect(screen.queryByRole("group", { name: "Nouvelle adresse" })).not.toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Adresse" })).toHaveValue("a3");

    await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
    expect(vi.mocked(editorApi.createEvent).mock.calls[0][0]).toMatchObject({ address: "a3" });
  });

  it("puts the address rule under the picker", async () => {
    vi.mocked(editorApi.createEvent).mockRejectedValue(
      new ApiError(400, { address: ["Une adresse est requise pour un atelier sur place."] }),
    );
    renderForm();

    await userEvent.click(screen.getByLabelText("Sur place"));
    await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await screen.findByText("Une adresse est requise pour un atelier sur place.");
    expect(screen.getByRole("combobox", { name: "Adresse" })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
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

describe("AddressForm", () => {
  it("creates an address and hands it over", async () => {
    const saved = address({ id: "a3", name: "Salle Paul Éluard" });
    vi.mocked(editorApi.createAddress).mockResolvedValue(saved);
    const onSaved = vi.fn();
    render(withEditor(<AddressForm address={null} onSaved={onSaved} onRemove={vi.fn()} />));

    await userEvent.type(screen.getByLabelText("Nom"), "Salle Paul Éluard");
    await userEvent.type(screen.getByLabelText("Adresse"), "4 place Paul Éluard");
    await userEvent.type(screen.getByLabelText("Code postal"), "69100");
    await userEvent.type(screen.getByLabelText("Ville"), "Villeurbanne");
    await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(editorApi.createAddress).toHaveBeenCalledWith({
      name: "Salle Paul Éluard",
      line1: "4 place Paul Éluard",
      line2: "",
      postal_code: "69100",
      city: "Villeurbanne",
    });
    expect(onSaved).toHaveBeenCalledWith(saved);
  });

  it("confirms an edit once the workshops showing it are refreshed", async () => {
    vi.mocked(editorApi.updateAddress).mockResolvedValue(address({ city: "Villeurbanne" }));
    render(withEditor(<AddressForm address={address({})} onSaved={vi.fn()} onRemove={vi.fn()} />));

    await userEvent.clear(screen.getByLabelText("Ville"));
    await userEvent.type(screen.getByLabelText("Ville"), "Villeurbanne");
    await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(editorApi.updateAddress).toHaveBeenCalledWith(
      "a1",
      expect.objectContaining({ city: "Villeurbanne" }),
    );
    expect(await screen.findByText(SAVED_LIVE)).toBeInTheDocument();
  });

  it("shows the backend's message under the field", async () => {
    vi.mocked(editorApi.createAddress).mockRejectedValue(
      new ApiError(400, { name: ["Un objet adresse avec ce champ nom existe déjà."] }),
    );
    render(withEditor(<AddressForm address={null} onSaved={vi.fn()} onRemove={vi.fn()} />));

    await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await screen.findByText("Un objet adresse avec ce champ nom existe déjà.");
    expect(screen.getByLabelText("Nom")).toHaveAttribute("aria-invalid", "true");
  });

  it("offers no delete for an address a workshop uses, and says why", () => {
    render(
      withEditor(
        <AddressForm address={address({ event_count: 2 })} onSaved={vi.fn()} onRemove={vi.fn()} />,
      ),
    );

    expect(screen.queryByRole("button", { name: "Supprimer l'adresse" })).not.toBeInTheDocument();
    expect(screen.getByText(/Utilisée par 2 ateliers/)).toBeInTheDocument();
  });

  it("offers the delete for an unused address", async () => {
    const onRemove = vi.fn();
    render(withEditor(<AddressForm address={address({})} onSaved={vi.fn()} onRemove={onRemove} />));

    await userEvent.click(screen.getByRole("button", { name: "Supprimer l'adresse" }));

    expect(onRemove).toHaveBeenCalledOnce();
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
