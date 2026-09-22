import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import QuestionsPage from "@/app/questions/page";
import { FaqList } from "@/components/faq/FaqList";
import { contact } from "@/content/cta";
import { faq } from "@/content/faq";
import { contactHref } from "@/content/routes";

describe("FaqList", () => {
  it("renders every question", () => {
    render(<FaqList />);
    for (const item of faq.items) {
      expect(screen.getByText(item.question)).toBeInTheDocument();
    }
  });

  it("toggles an answer open and closed", async () => {
    const user = userEvent.setup();
    render(<FaqList />);
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

describe("QuestionsPage", () => {
  it("renders one h1 with the questions under it", () => {
    render(<QuestionsPage />);
    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent(faq.title);
    expect(screen.getAllByRole("group")).toHaveLength(faq.items.length);
  });

  it("points to the contact form for anything else", () => {
    render(<QuestionsPage />);
    // In the page body — the header carries a "Nous contacter" of its own.
    expect(
      within(screen.getByRole("main")).getByRole("link", { name: contact.cta }),
    ).toHaveAttribute("href", contactHref());
  });

  it("carries the FAQPage structured data for its questions", () => {
    const { container } = render(<QuestionsPage />);
    // Next to the page's BreadcrumbList; pick the FAQPage block.
    const blocks = [...container.querySelectorAll('script[type="application/ld+json"]')].map(
      (script) => JSON.parse(script.textContent ?? "{}"),
    );
    const data = blocks.find((block) => block["@type"] === "FAQPage");
    expect(data).toBeDefined();
    expect(data.mainEntity.map((q: { name: string }) => q.name)).toEqual(
      faq.items.map((item) => item.question),
    );
  });

  it("marks its link in the header as the current page", () => {
    render(<QuestionsPage />);
    const [desktopNav] = screen.getAllByRole("navigation", { name: "Navigation principale" });
    expect(within(desktopNav).getByRole("link", { name: "Questions" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(within(desktopNav).getByRole("link", { name: "Nos pratiques" })).not.toHaveAttribute(
      "aria-current",
    );
  });
});
