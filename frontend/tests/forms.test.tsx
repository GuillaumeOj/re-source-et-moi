import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
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

describe("ContactForm", () => {
  afterEach(() => {
    window.history.replaceState(null, "", "/");
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
    expect(screen.queryByText(contact.demo)).not.toBeInTheDocument();
  });

  it("rejects a malformed email", async () => {
    const user = userEvent.setup();
    render(<ContactForm />);

    await fillIdentity(user, { email: "camille@" });
    await user.type(screen.getByLabelText("Message"), "Bonjour");
    await user.click(screen.getByRole("button", { name: contact.button }));

    expect(screen.getByText(contact.errors.email)).toBeInTheDocument();
    expect(screen.queryByText(contact.demo)).not.toBeInTheDocument();
  });

  // Which numbers pass is normalisePhone's table (contact.test.tsx); this is the wiring.
  it("rejects a malformed phone number", async () => {
    const user = userEvent.setup();
    render(<ContactForm />);

    await fillIdentity(user, { phone: "06 12 34 56" });
    await user.type(screen.getByLabelText("Message"), "Bonjour");
    await user.click(screen.getByRole("button", { name: contact.button }));

    expect(screen.getByText(contact.errors.phone)).toBeInTheDocument();
    expect(screen.queryByText(contact.demo)).not.toBeInTheDocument();
  });

  it("stays inert once valid, until a backend is wired", async () => {
    const user = userEvent.setup();
    render(<ContactForm />);

    await fillIdentity(user);
    await user.type(screen.getByLabelText("Message"), "Bonjour");
    await user.click(screen.getByRole("button", { name: contact.button }));

    expect(screen.getByText(contact.demo)).toBeInTheDocument();
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
      expect(screen.getByText(contact.demo)).toBeInTheDocument();
    });

    it("still asks for a name, an email and a phone number", async () => {
      const user = userEvent.setup();
      render(<ContactForm event={event} />);

      await user.click(screen.getByRole("button", { name: contact.button }));

      expect(screen.getByText(contact.errors.name)).toBeInTheDocument();
      expect(screen.getByText(contact.errors.email)).toBeInTheDocument();
      expect(screen.getByText(contact.errors.phone)).toBeInTheDocument();
      expect(screen.queryByText(contact.errors.message)).not.toBeInTheDocument();
      expect(screen.queryByText(contact.demo)).not.toBeInTheDocument();
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
