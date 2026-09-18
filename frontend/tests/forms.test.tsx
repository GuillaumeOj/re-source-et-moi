import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Contact } from "@/components/sections/Contact";

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
