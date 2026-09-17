import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import HomePage from "@/app/page";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ateliers } from "@/content/ateliers";
import { navLinks } from "@/content/site";
import { tarifs } from "@/content/tarifs";

// Workshops is an async Server Component that fetches from the backend, and React's client
// renderer cannot resolve an async component nested inside a tree. This file is about page
// composition — landmarks, headings, nav anchors — so it substitutes a synchronous shell
// with the same id and the same headings. The headings still come from the real content
// modules, so a copy change is still caught here; the component's own behaviour (data,
// formatting, failure handling) is covered directly in workshops.test.tsx.
vi.mock("@/components/sections/Workshops", () => ({
  Workshops: () => (
    <Section id="ateliers" background="creme" aria-labelledby="ateliers-title">
      <SectionHeading id="ateliers-title" eyebrow={ateliers.eyebrow} title={ateliers.title} />
      <h3>{tarifs.title}</h3>
    </Section>
  ),
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
      // Nav hrefs are root-relative (`/#id`) so they also work from sub-routes;
      // strip the leading slash to get the in-page id selector.
      const selector = link.href.replace(/^\//, "");
      const target = document.querySelector(selector);
      expect(target, `section ${selector} should exist`).not.toBeNull();
    }
    expect(nav).toBeInTheDocument();
  });
});
