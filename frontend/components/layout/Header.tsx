"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { navLinks, participateCta, site } from "@/content/site";
import { cn } from "@/lib/cn";

/** `currentPath` marks the matching nav link as the current page (none on the home page). */
export function Header({ currentPath }: { currentPath?: string }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const current = (href: string) => (href === currentPath ? "page" : undefined);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled ? "bg-creme/90 shadow-soft backdrop-blur-md" : "bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 md:h-20">
        <a
          href="/#top"
          className="flex items-center gap-3 text-rose-sombre"
          aria-label={`${site.name} — accueil`}
        >
          <Logo title="" className="h-11 w-auto md:h-12" />
          <span className="font-display text-lg leading-tight md:text-xl">
            Re-Source
            <span className="italic text-rose-vif"> Et Moi</span>
          </span>
        </a>

        <nav aria-label="Navigation principale" className="hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              aria-current={current(link.href)}
              className="text-sm font-semibold text-rose-sombre/80 underline-offset-8 transition-colors hover:text-rose-sombre aria-[current=page]:text-rose-sombre aria-[current=page]:underline"
            >
              {link.label}
            </a>
          ))}
          <a
            href={participateCta.href}
            className="whitespace-nowrap rounded-full bg-rose-sombre px-5 py-2.5 text-sm font-semibold text-creme transition-all hover:-translate-y-0.5 hover:bg-rose-sombre-deep"
          >
            {participateCta.label}
          </a>
        </nav>

        <button
          type="button"
          className="text-rose-sombre lg:hidden"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {menuOpen ? (
        <nav
          id="mobile-menu"
          aria-label="Navigation principale"
          className="border-rose-sombre/10 border-t bg-creme/95 px-6 py-4 backdrop-blur-md lg:hidden"
        >
          <ul className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  aria-current={current(link.href)}
                  className="block rounded-xl px-2 py-3 font-semibold text-rose-sombre hover:bg-rose-sombre/5 aria-[current=page]:bg-rose-sombre/5"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <a
                href={participateCta.href}
                className="mt-2 block rounded-full bg-rose-sombre px-5 py-3 text-center font-semibold text-creme"
                onClick={() => setMenuOpen(false)}
              >
                {participateCta.labelLong}
              </a>
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
