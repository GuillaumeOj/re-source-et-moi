import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ContactForm } from "@/components/contact/ContactForm";
import { contact } from "@/content/cta";
import type { ContactEvent } from "@/lib/contact";

const event: ContactEvent = {
  id: "11111111-1111-4111-8111-111111111111",
  title: "Brain Gym® en mouvement",
  date: "2026-10-03",
  start_time: "10:00:00",
  end_time: "12:30:00",
  location_label: "Lyon",
  address: "12 rue de la Paix, 69001 Lyon",
};

async function fillIdentity(
  user: ReturnType<typeof userEvent.setup>,
  { email = "camille@example.fr", phone = "06 12 34 56 78" } = {},
) {
  await user.type(screen.getByLabelText("Nom"), "Camille");
  await user.type(screen.getByLabelText("Email"), email);
  await user.type(screen.getByLabelText("Téléphone"), phone);
}

const fetchMock = vi.fn();

function answer(status: number, body?: unknown): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), { status });
}

/** The body of the POST to /api/contact/, parsed. */
function sentBody(): unknown {
  const call = fetchMock.mock.calls.find(([url]) => url === "/api/contact/");
  return call ? JSON.parse(call[1].body) : undefined;
}

/** Fill in a valid plain message and send it. */
async function submitMessage() {
  const user = userEvent.setup();
  render(<ContactForm />);
  await fillIdentity(user);
  await user.type(screen.getByLabelText("Message"), "Bonjour");
  await user.click(screen.getByRole("button", { name: contact.button }));
}

describe("ContactForm", () => {
  beforeEach(() => {
    // The CSRF cookie is already there, so the only request is the contact POST.
    // biome-ignore lint/suspicious/noDocumentCookie: jsdom test setup
    document.cookie = "csrftoken=abc123";
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(answer(204));
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    window.history.replaceState(null, "", "/");
    vi.unstubAllGlobals();
  });

  it("renders labelled fields", () => {
    render(<ContactForm />);

    expect(screen.getByLabelText("Nom")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Téléphone")).toHaveAttribute("type", "tel");
    expect(screen.getByLabelText("Téléphone")).toBeRequired();
    expect(screen.getByLabelText("Message")).toBeInTheDocument();
  });

  it("says what the visitor's details are used for, and links to the privacy policy", () => {
    render(<ContactForm />);

    expect(screen.getByText(contact.privacy.text, { exact: false })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: contact.privacy.link })).toHaveAttribute(
      "href",
      "/politique-de-confidentialite",
    );
  });

  it("flags every missing field and does not submit", async () => {
    const user = userEvent.setup();
    render(<ContactForm />);

    await user.click(screen.getByRole("button", { name: contact.button }));

    expect(screen.getByText(contact.errors.name)).toBeInTheDocument();
    expect(screen.getByText(contact.errors.email)).toBeInTheDocument();
    expect(screen.getByText(contact.errors.phone)).toBeInTheDocument();
    expect(screen.getByText(contact.errors.message)).toBeInTheDocument();
    expect(screen.getByLabelText("Nom")).toHaveAttribute("aria-invalid", "true");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a malformed email", async () => {
    const user = userEvent.setup();
    render(<ContactForm />);

    await fillIdentity(user, { email: "camille@" });
    await user.type(screen.getByLabelText("Message"), "Bonjour");
    await user.click(screen.getByRole("button", { name: contact.button }));

    expect(screen.getByText(contact.errors.email)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  // Which numbers pass is normalisePhone's table (contact.test.tsx); this is the wiring.
  it("rejects a malformed phone number", async () => {
    const user = userEvent.setup();
    render(<ContactForm />);

    await fillIdentity(user, { phone: "06 12 34 56" });
    await user.type(screen.getByLabelText("Message"), "Bonjour");
    await user.click(screen.getByRole("button", { name: contact.button }));

    expect(screen.getByText(contact.errors.phone)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends the message, phone normalised, and says it left", async () => {
    await submitMessage();

    expect(await screen.findByText(contact.sent)).toBeInTheDocument();
    expect(sentBody()).toEqual({
      name: "Camille",
      email: "camille@example.fr",
      phone: "+33612345678",
      message: "Bonjour",
      event: null,
    });
    expect(fetchMock.mock.calls[0][1].headers["X-CSRFToken"]).toBe("abc123");
    // Cleared, so a second click doesn't send the same message twice.
    expect(screen.getByLabelText("Message")).toHaveValue("");
  });

  it("shows the backend's own field messages under the fields", async () => {
    fetchMock.mockResolvedValue(answer(400, { phone: ["Numéro refusé par le serveur."] }));

    await submitMessage();

    expect(await screen.findByText("Numéro refusé par le serveur.")).toBeInTheDocument();
    expect(screen.getByLabelText("Téléphone")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText(contact.errors.invalid)).toBeInTheDocument();
    // Kept, so the visitor only fixes what was wrong.
    expect(screen.getByLabelText("Message")).toHaveValue("Bonjour");
  });

  it.each([
    ["a 429", () => fetchMock.mockResolvedValue(answer(429)), contact.errors.tooMany],
    ["a 503", () => fetchMock.mockResolvedValue(answer(503)), contact.errors.failed],
    [
      "a network failure",
      () => fetchMock.mockRejectedValue(new TypeError("Failed to fetch")),
      contact.errors.failed,
    ],
  ])("explains %s and keeps what was typed", async (_, fail, text) => {
    fail();

    await submitMessage();

    expect(await screen.findByText(text)).toBeInTheDocument();
    expect(screen.getByLabelText("Message")).toHaveValue("Bonjour");
  });

  it("fetches the CSRF cookie as soon as the visitor starts typing", async () => {
    // biome-ignore lint/suspicious/noDocumentCookie: jsdom test setup
    document.cookie = "csrftoken=; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    const user = userEvent.setup();
    render(<ContactForm />);

    await user.click(screen.getByLabelText("Nom"));

    expect(fetchMock).toHaveBeenCalledWith("/api/auth/csrf/", expect.anything());
  });

  describe("with a workshop to sign up for", () => {
    it("shows the workshop", () => {
      render(<ContactForm event={event} />);

      expect(screen.getByRole("heading", { name: event.title })).toBeInTheDocument();
      expect(screen.getByText("Samedi 3 octobre 2026")).toBeInTheDocument();
      expect(screen.getByText("10h–12h30")).toBeInTheDocument();
      expect(screen.getByText("Lyon (12 rue de la Paix, 69001 Lyon)")).toBeInTheDocument();
    });

    it("makes the message optional", async () => {
      const user = userEvent.setup();
      render(<ContactForm event={event} />);

      expect(screen.getByLabelText(contact.optionalMessage)).not.toBeRequired();

      await fillIdentity(user);
      await user.click(screen.getByRole("button", { name: contact.button }));

      expect(screen.queryByText(contact.errors.message)).not.toBeInTheDocument();
      expect(await screen.findByText(contact.sent)).toBeInTheDocument();
      expect(sentBody()).toMatchObject({ event: event.id, message: "" });
    });

    it("says so when the workshop stopped being offered in the meantime", async () => {
      fetchMock.mockResolvedValue(answer(400, { event: ["Cet atelier n'est plus proposé."] }));
      const user = userEvent.setup();
      render(<ContactForm event={event} />);

      await fillIdentity(user);
      await user.click(screen.getByRole("button", { name: contact.button }));

      expect(await screen.findByText("Cet atelier n'est plus proposé.")).toBeInTheDocument();
    });

    it("still asks for a name, an email and a phone number", async () => {
      const user = userEvent.setup();
      render(<ContactForm event={event} />);

      await user.click(screen.getByRole("button", { name: contact.button }));

      expect(screen.getByText(contact.errors.name)).toBeInTheDocument();
      expect(screen.getByText(contact.errors.email)).toBeInTheDocument();
      expect(screen.getByText(contact.errors.phone)).toBeInTheDocument();
      expect(screen.queryByText(contact.errors.message)).not.toBeInTheDocument();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("lets the visitor remove it, and drops it from the URL", async () => {
      window.history.replaceState(null, "", `/contact?atelier=${event.id}`);
      const user = userEvent.setup();
      render(<ContactForm event={event} />);

      await user.click(screen.getByRole("button", { name: contact.event.remove }));

      expect(screen.queryByRole("heading", { name: event.title })).not.toBeInTheDocument();
      expect(screen.getByLabelText(contact.fields.message)).toBeRequired();
      expect(window.location.search).toBe("");
    });
  });
});
