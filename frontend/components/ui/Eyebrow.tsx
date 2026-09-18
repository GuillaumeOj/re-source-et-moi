import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type EyebrowProps = {
  children: ReactNode;
  className?: string;
  /** Use on dark (rose-sombre) backgrounds. */
  tone?: "default" | "light";
};

/**
 * Small uppercase, tracked label above a heading — the "01 — IDENTITÉ" device
 * from the brand guide. Uses rose-sombre (not rose-vif) to stay AA-legible at
 * label size; the rose-vif tick provides the accent colour without text.
 */
export function Eyebrow({ children, className, tone = "default" }: EyebrowProps) {
  return (
    <p
      className={cn(
        "flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.18em]",
        tone === "light" ? "text-creme/80" : "text-rose-sombre/80",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn("h-px w-6", tone === "light" ? "bg-creme/50" : "bg-rose-vif")}
      />
      {children}
    </p>
  );
}
