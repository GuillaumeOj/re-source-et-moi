import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Faq } from "@/components/sections/Faq";
import { faq } from "@/content/faq";

describe("Faq", () => {
  it("renders every question", () => {
    render(<Faq />);
    for (const item of faq.items) {
      expect(screen.getByText(item.question)).toBeInTheDocument();
    }
  });

  it("toggles an answer open and closed", async () => {
    const user = userEvent.setup();
    render(<Faq />);
    const first = faq.items[0];
    const summary = screen.getByText(first.question);
    const details = summary.closest("details");
    expect(details).not.toBeNull();
    expect(details).not.toHaveAttribute("open");

    await user.click(summary);
    expect(details).toHaveAttribute("open");

    await user.click(summary);
    expect(details).not.toHaveAttribute("open");
  });
});
