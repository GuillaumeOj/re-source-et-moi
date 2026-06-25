import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Background = "creme" | "rose-tendre" | "rose-sombre";

const backgrounds: Record<Background, string> = {
  creme: "bg-creme text-charbon",
  "rose-tendre": "bg-rose-tendre text-charbon",
  "rose-sombre": "bg-rose-sombre text-creme",
};

type SectionProps = {
  id?: string;
  children: ReactNode;
  background?: Background;
  className?: string;
  /** Constrain inner content to the standard max width + horizontal padding. */
  contained?: boolean;
  "aria-labelledby"?: string;
};

/** Standard page section: 8px-based vertical rhythm + centred content column. */
export function Section({
  id,
  children,
  background = "creme",
  className,
  contained = true,
  ...rest
}: SectionProps) {
  return (
    <section
      id={id}
      className={cn(
        backgrounds[background],
        "py-20 md:py-28",
        // Desktop: each section fills the viewport, content vertically centred,
        // and becomes a scroll-snap step (see globals.css).
        "snap-section lg:flex lg:min-h-dvh lg:flex-col lg:justify-center",
        className,
      )}
      {...rest}
    >
      {contained ? <div className="mx-auto w-full max-w-6xl px-6">{children}</div> : children}
    </section>
  );
}
