import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ReviewText } from "@/components/reviews/ReviewText";
import { temoignages } from "@/content/temoignages";
import { excerpt } from "@/lib/format";

const LONG = `${"Une séance douce et vraiment utile au quotidien. ".repeat(5)}Merci Cécile.`;

describe("excerpt", () => {
  it("is null when the text fits", () => {
    expect(excerpt("Court.", 200)).toBeNull();
    expect(excerpt("a".repeat(200), 200)).toBeNull();
  });

  it("cuts on a word boundary, drops trailing punctuation and adds an ellipsis", () => {
    expect(excerpt("Un deux, trois quatre", 10)).toBe("Un deux…");
  });

  it("keeps the last word when the cut lands right after it", () => {
    expect(excerpt("aaa bbb ccc", 7)).toBe("aaa bbb…");
  });

  it("cuts mid-word when there is no space to cut at", () => {
    expect(excerpt("abcdefghij", 4)).toBe("abcd…");
  });
});

describe("ReviewText", () => {
  it("shows a short review whole, with no toggle", () => {
    render(<ReviewText text="Merci !" truncate />);

    expect(screen.getByText(/Merci !/)).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("cuts a long review at 200 characters and lets the visitor read on, then fold back", async () => {
    render(<ReviewText text={LONG} truncate />);

    const quote = screen.getByRole("blockquote");
    expect(quote.textContent).not.toContain("Merci Cécile.");
    expect(quote.textContent).toContain("…");

    const toggle = screen.getByRole("button", { name: temoignages.readMore });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(toggle);

    expect(quote.textContent).toContain("Merci Cécile.");
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(toggle).toHaveTextContent(temoignages.readLess);

    await userEvent.click(toggle);
    expect(quote.textContent).not.toContain("Merci Cécile.");
  });

  it("shows a long review whole when not asked to truncate", () => {
    render(<ReviewText text={LONG} />);

    expect(screen.getByRole("blockquote").textContent).toContain("Merci Cécile.");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
