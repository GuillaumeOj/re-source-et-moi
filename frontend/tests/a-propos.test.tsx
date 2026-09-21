import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AProposPage from "@/app/a-propos/page";
import { fondatrice } from "@/content/fondatrice";

describe("AProposPage", () => {
  it("is titled with Cécile's full name", () => {
    render(<AProposPage />);
    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent("Cécile Frank");
  });

  it("shows her full text", () => {
    render(<AProposPage />);
    for (const paragraph of fondatrice.fullBio) {
      expect(screen.getByText(paragraph)).toBeInTheDocument();
    }
  });

  it("shows her portrait and links to her schools", () => {
    render(<AProposPage />);
    expect(screen.getByRole("img", { name: fondatrice.photoAlt })).toBeInTheDocument();
    for (const school of fondatrice.page.certifications) {
      expect(screen.getByRole("link", { name: school.label })).toHaveAttribute("href", school.href);
    }
  });
});
