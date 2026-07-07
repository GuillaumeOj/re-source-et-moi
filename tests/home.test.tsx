import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "@/app/page";
import { navLinks } from "@/content/site";

describe("HomePage", () => {
  it("renders exactly one h1", () => {
    render(<HomePage />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("renders the core landmarks", () => {
    render(<HomePage />);
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("renders every section heading", () => {
    render(<HomePage />);
    for (const title of [
      "Notre raison d'être",
      "Bouger pour mieux apprendre",
      "Une intention dans chaque geste",
      "Nos prochains ateliers",
      "Tarifs",
      "À l'origine de Re-Source Et Moi",
      "Ce qu'ils en retiennent",
      "Vous vous demandez peut-être…",
      "Parlons mouvement",
    ]) {
      expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    }
  });

  it("exposes a nav link to every in-page section anchor", () => {
    render(<HomePage />);
    const nav = screen.getAllByRole("navigation", { name: "Navigation principale" })[0];
    for (const link of navLinks) {
      const anchor = screen.getAllByRole("link", { name: link.label })[0];
      expect(anchor).toHaveAttribute("href", link.href);
      const target = document.querySelector(link.href);
      expect(target, `section ${link.href} should exist`).not.toBeNull();
    }
    expect(nav).toBeInTheDocument();
  });
});
