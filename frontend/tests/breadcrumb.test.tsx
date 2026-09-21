import { render, screen, within } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";
import AProposPage from "@/app/a-propos/page";
import MentionsLegalesPage from "@/app/mentions-legales/page";
import NosPratiquesPage from "@/app/nos-pratiques/page";
import PolitiquePage from "@/app/politique-de-confidentialite/page";
import QuestionsPage from "@/app/questions/page";
import { type Route, routes } from "@/content/routes";
import { navLinks, site } from "@/content/site";

// /ateliers is async and backend-backed; its breadcrumb is covered in ateliers.test.tsx.
const pages: Array<{ name: string; page: () => ReactElement; route: Route }> = [
  { name: "nos pratiques", page: NosPratiquesPage, route: routes.pratiques },
  { name: "à propos", page: AProposPage, route: routes.aPropos },
  { name: "questions", page: QuestionsPage, route: routes.questions },
  { name: "mentions légales", page: MentionsLegalesPage, route: routes.mentionsLegales },
  { name: "confidentialité", page: PolitiquePage, route: routes.confidentialite },
];

describe.each(pages)("the $name page's breadcrumb", ({ page: Page, route }) => {
  it("marks the page's own header link as current, when it has one", () => {
    render(<Page />);
    const [desktopNav] = screen.getAllByRole("navigation", { name: "Navigation principale" });
    const current = within(desktopNav)
      .getAllByRole("link")
      .filter((link) => link.getAttribute("aria-current") === "page");
    const inNav = navLinks.some((link) => link.href === route.path);
    expect(current.map((link) => link.getAttribute("href"))).toEqual(inNav ? [route.path] : []);
  });

  it("starts at Accueil and ends on the current page", () => {
    render(<Page />);
    const trail = screen.getByRole("navigation", { name: "Fil d'Ariane" });
    const steps = within(trail).getAllByRole("listitem");
    expect(steps).toHaveLength(2);
    expect(within(steps[0]).getByRole("link", { name: "Accueil" })).toHaveAttribute("href", "/");
    expect(steps[1]).toHaveTextContent(route.label);
    expect(steps[1]).toHaveAttribute("aria-current", "page");
    expect(within(steps[1]).queryByRole("link")).not.toBeInTheDocument();
  });

  it("carries the matching BreadcrumbList structured data", () => {
    const { container } = render(<Page />);
    const data = [...container.querySelectorAll('script[type="application/ld+json"]')]
      .map((script) => JSON.parse(script.textContent ?? "{}"))
      .find((block) => block["@type"] === "BreadcrumbList");
    expect(data).toBeDefined();
    expect(data.itemListElement.map((item: { item: string }) => item.item)).toEqual([
      site.url,
      `${site.url}${route.path}`,
    ]);
  });
});
