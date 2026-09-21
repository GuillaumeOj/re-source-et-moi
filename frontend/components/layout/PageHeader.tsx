import type { ReactNode } from "react";
import { Eyebrow } from "@/components/ui/Eyebrow";

type PageHeaderProps = {
  eyebrow: string;
  title: ReactNode;
  intro?: ReactNode;
  /** Rendered between the title and the intro (a subtitle, a last-updated date). */
  children?: ReactNode;
};

/** Eyebrow + H1 (+ intro) at the top of a standalone page — the page-level SectionHeading. */
export function PageHeader({ eyebrow, title, intro, children }: PageHeaderProps) {
  return (
    <>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h1 className="mt-4 text-[2rem] font-normal md:text-5xl">{title}</h1>
      {children}
      {intro ? (
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-charbon/85">{intro}</p>
      ) : null}
    </>
  );
}
