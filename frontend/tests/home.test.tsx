import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import HomePage from "@/app/page";
import { ateliers } from "@/content/ateliers";
import { brainGym } from "@/content/brain-gym";
import { contact } from "@/content/cta";
import { faq } from "@/content/faq";
import { fondatrice } from "@/content/fondatrice";
import { brainGymTrademark } from "@/content/marques";
import { pageSections } from "@/content/sections";
import { contactCta, navLinks } from "@/content/site";
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
// Testimonials is async and hides itself entirely with no review published, so its
// heading is covered in testimonials.test.tsx. Stubbed absent here, which also exercises
// the page without it.
vi.mock("@/components/sections/Testimonials", () => ({
  Testimonials: () => null,
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
    ).toEqual([...navLinks.map((link) => link.href), contactCta.href]);
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

  it("gives the indicator one step per section on the page, and none for a missing one", () => {
    // Testimonials is stubbed absent above, so its step is the one that must go.
    render(<HomePage />);
    const indicator = screen.getByRole("navigation", { name: "Progression dans la page" });
    const targets = within(indicator)
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"));
    expect(targets).toEqual(
      pageSections
        .filter((section) => section.id !== "temoignages")
        .map((section) => `#${section.id}`),
    );
    for (const target of targets) {
      expect(document.querySelector(target as string), `${target} should exist`).not.toBeNull();
    }
  });

  it("leads from the contact section to the contact page", () => {
    // The form lives on /contact; the home page only points at it.
    render(<HomePage />);
    const section = document.getElementById("contact");
    expect(section).not.toBeNull();
    expect(within(section as HTMLElement).queryByRole("textbox")).toBeNull();
    expect(within(section as HTMLElement).getByRole("link", { name: contact.cta })).toHaveAttribute(
      "href",
      "/contact",
    );
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
