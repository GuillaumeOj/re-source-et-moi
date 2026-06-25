"use client";

import { useEffect, useState } from "react";
import { pageSections } from "@/content/sections";
import { cn } from "@/lib/cn";

/**
 * Desktop-only vertical step indicator on the left. Highlights the section
 * crossing the viewport centre (via IntersectionObserver) and lets the user
 * jump between steps. Inverts its colours over dark sections so it stays visible.
 */
export function StepIndicator() {
  const [activeId, setActiveId] = useState(pageSections[0].id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        }
      },
      // Fire when a section crosses the vertical centre of the viewport.
      { rootMargin: "-50% 0px -50% 0px", threshold: 0 },
    );

    for (const section of pageSections) {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  const onDark = pageSections.find((section) => section.id === activeId)?.dark ?? false;

  return (
    <nav
      aria-label="Progression dans la page"
      className="fixed top-1/2 left-5 z-40 hidden -translate-y-1/2 lg:block"
    >
      <ol className="flex flex-col gap-4">
        {pageSections.map((section) => {
          const isActive = activeId === section.id;
          return (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                aria-current={isActive ? "step" : undefined}
                className="group flex items-center gap-3"
              >
                <span
                  className={cn(
                    "h-2.5 w-2.5 rounded-full transition-all duration-300",
                    isActive ? "scale-125" : "scale-100",
                    isActive
                      ? onDark
                        ? "bg-creme"
                        : "bg-rose-vif"
                      : onDark
                        ? "bg-creme/30 group-hover:bg-creme/60"
                        : "bg-rose-sombre/25 group-hover:bg-rose-sombre/50",
                  )}
                />
                <span
                  className={cn(
                    "whitespace-nowrap text-xs font-semibold transition-all duration-300",
                    onDark ? "text-creme" : "text-rose-sombre",
                    isActive
                      ? "translate-x-0 opacity-100"
                      : "-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100",
                  )}
                >
                  {section.label}
                </span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
