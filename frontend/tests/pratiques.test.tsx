import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import NosPratiquesPage from "@/app/nos-pratiques/page";
import { brainGymTrademark } from "@/content/marques";
import { pratiques } from "@/content/pratiques";

describe("NosPratiquesPage", () => {
  it("renders exactly one h1", () => {
    render(<NosPratiquesPage />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("has the anchors the home page summaries link to", () => {
    render(<NosPratiquesPage />);
    for (const practice of [pratiques.brainGym, pratiques.soiEnMouvement]) {
      const section = document.getElementById(practice.id);
      expect(section, `#${practice.id} should exist`).not.toBeNull();
      expect(screen.getByRole("heading", { level: 2, name: practice.title })).toBeInTheDocument();
    }
  });

  it("shows every paragraph of both histories", () => {
    render(<NosPratiquesPage />);
    for (const practice of [pratiques.brainGym, pratiques.soiEnMouvement]) {
      for (const subsection of practice.subsections) {
        expect(screen.getByRole("heading", { name: subsection.heading })).toBeInTheDocument();
        for (const paragraph of subsection.body) {
          expect(screen.getByText(paragraph)).toBeInTheDocument();
        }
      }
    }
  });

  it("keeps the movement landmarks moved from the home page", () => {
    render(<NosPratiquesPage />);
    expect(
      screen.getByRole("heading", { name: pratiques.reperes.midline.label }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: pratiques.reperes.ecap.label })).toBeInTheDocument();
  });

  it("carries the Brain Gym trademark notice word for word", () => {
    render(<NosPratiquesPage />);
    // Once on the page and once in the footer.
    const notices = screen.getAllByText(
      (_, element) => element?.tagName === "P" && element.textContent === brainGymTrademark.text,
    );
    expect(notices).toHaveLength(2);
  });

  it("links out to the schools in a new tab", () => {
    render(<NosPratiquesPage />);
    for (const { label, href } of [
      { label: "Brain Gym France", href: "https://www.braingym.fr" },
      { label: "Point d'Émergence", href: "https://www.point-emergence.com" },
    ]) {
      const link = screen.getByRole("link", { name: label });
      expect(link).toHaveAttribute("href", href);
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
  });
});
