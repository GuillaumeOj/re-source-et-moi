import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Reveal } from "./Reveal";

type CardProps = {
  children: ReactNode;
  /** Stagger the reveal; milliseconds. */
  delayMs?: number;
  /** Rendered element (e.g. "figure", "li"). */
  as?: ElementType;
  /** Per-card overrides — background, gap, etc. */
  className?: string;
};

/** The shared rounded card shell, revealed on scroll. Background/gap via className. */
export function Card({ children, delayMs, as, className }: CardProps) {
  return (
    <Reveal
      as={as}
      delayMs={delayMs}
      className={cn("flex flex-col rounded-3xl p-8 shadow-soft", className)}
    >
      {children}
    </Reveal>
  );
}
