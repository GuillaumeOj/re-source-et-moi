import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import HomePage from "@/app/page";
import { ateliers } from "@/content/ateliers";
import { brainGym } from "@/content/brain-gym";
import { faq } from "@/content/faq";
import { fondatrice } from "@/content/fondatrice";
import { brainGymTrademark } from "@/content/marques";
import { pageSections } from "@/content/sections";
import { navLinks, participateCta } from "@/content/site";
import { soiEnMouvement } from "@/content/soi-en-mouvement";

// React's client renderer cannot resolve an async Server Component, so the two that fetch
// from the backend are stubbed out. Workshops itself is NOT mocked — it is synchronous, so
// this suite asserts against the real section: its real id, its real headings. Only the
// data inside is replaced, and that data's own behaviour is covered in workshops.test.tsx.
vi.mock("@/components/sections/workshops/AgendaList", () => ({
  AgendaList: () => <ul />,
}));
// PricingSection owns the "Tarifs" heading (it hides when no tariffs exist), so that
// heading is covered in workshops.test.tsx rather than here.
vi.mock("@/components/sections/workshops/PricingSection", () => ({
  PricingSection: () => <div />,
}));

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
      "Un mouvement qui naît du ressenti",
      "Nos prochains ateliers",
      "À l'origine de Re-Source Et Moi",
      "Ce qu'ils en retiennent",
      "Parlons mouvement",
    ]) {
      expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    }
  });

  it("links the navigation to pages, not to home page anchors", () => {
    render(<HomePage />);
    const nav = screen.getAllByRole("navigation", { name: "Navigation principale" })[0];
    expect(
      within(nav)
        .getAllByRole("link")
        .map((link) => link.getAttribute("href")),
    ).toEqual([...navLinks.map((link) => link.href), participateCta.href]);
    expect(navLinks.map((link) => link.href)).toEqual([
      "/nos-pratiques",
      "/ateliers",
      "/a-propos",
      "/questions",
    ]);
  });

  it("no longer carries the questions, which have their own page", () => {
    render(<HomePage />);
    expect(document.getElementById("faq")).toBeNull();
    expect(screen.queryByRole("heading", { name: faq.title })).not.toBeInTheDocument();
  });

  it("gives every step of the indicator a section to land on", () => {
    render(<HomePage />);
    for (const section of pageSections) {
      expect(document.getElementById(section.id), `#${section.id} should exist`).not.toBeNull();
    }
  });

  it("links from the workshops to the full workshops page", () => {
    // In the section's synchronous shell, so it shows even when the list below is empty
    // or the backend is down.
    render(<HomePage />);
    expect(screen.getByRole("link", { name: ateliers.seeAll })).toHaveAttribute(
      "href",
      "/ateliers",
    );
  });

  it("links each summary to its detail page", () => {
    render(<HomePage />);
    for (const { label, href } of [brainGym.more, soiEnMouvement.more, fondatrice.more]) {
      expect(screen.getByRole("link", { name: label })).toHaveAttribute("href", href);
    }
  });

  it("carries the Brain Gym trademark notice word for word, with its site linked", () => {
    render(<HomePage />);
    const notice = screen.getByText(
      (_, element) => element?.textContent === brainGymTrademark.text,
    );
    expect(notice.tagName).toBe("P");
    expect(screen.getByRole("link", { name: "www.braingym.org" })).toHaveAttribute(
      "href",
      "https://www.braingym.org",
    );
  });

  it("shows Cécile's portrait", () => {
    render(<HomePage />);
    expect(screen.getByRole("img", { name: fondatrice.photoAlt })).toBeInTheDocument();
  });
});
