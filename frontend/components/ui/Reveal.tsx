"use client";

import { type ElementType, type ReactNode, useEffect, useRef } from "react";

type RevealProps = {
  children: ReactNode;
  /** Stagger child entrance; milliseconds. */
  delayMs?: number;
  as?: ElementType;
  className?: string;
};

/**
 * Fades its content up once when scrolled into view (see `.reveal` in
 * globals.css). Under prefers-reduced-motion the CSS resolves it to the final
 * state instantly, so content is always present without JS or motion.
 */
export function Reveal({ children, delayMs = 0, as: Tag = "div", className }: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            if (delayMs > 0) {
              node.style.transitionDelay = `${delayMs}ms`;
            }
            node.classList.add("is-visible");
            observer.disconnect();
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [delayMs]);

  return (
    <Tag ref={ref} className={className ? `reveal ${className}` : "reveal"}>
      {children}
    </Tag>
  );
}
