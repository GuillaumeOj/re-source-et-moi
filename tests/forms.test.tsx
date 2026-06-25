import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Contact } from "@/components/sections/Contact";
import { Newsletter } from "@/components/sections/Newsletter";

describe("Newsletter form", () => {
  it("has an accessible email field and does not navigate on submit", async () => {
    const user = userEvent.setup();
    const submitSpy = vi.fn();
    document.addEventListener("submit", submitSpy);

    render(<Newsletter />);
    const email = screen.getByLabelText("Adresse email");
    expect(email).toHaveAttribute("type", "email");

    await user.type(email, "test@example.fr");
    await user.click(screen.getByRole("button", { name: "S'inscrire" }));

    // Submit fired but was prevented (inert) — an acknowledgement appears.
    expect(submitSpy).toHaveBeenCalled();
    expect(submitSpy.mock.calls[0][0].defaultPrevented).toBe(true);
    expect(screen.getByText(/démonstration/i)).toBeInTheDocument();
    document.removeEventListener("submit", submitSpy);
  });
});

describe("Contact form", () => {
  it("renders labelled fields and stays inert on submit", async () => {
    const user = userEvent.setup();
    render(<Contact />);

    expect(screen.getByLabelText("Nom")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Message")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Envoyer" }));
    expect(screen.getByText(/démonstration/i)).toBeInTheDocument();
  });
});
