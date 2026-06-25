import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Eyebrow } from "./Eyebrow";
import { Reveal } from "./Reveal";

type SectionHeadingProps = {
  eyebrow: string;
  title: ReactNode;
  id?: string;
  intro?: ReactNode;
  align?: "left" | "center";
  tone?: "default" | "light";
  className?: string;
};

/** Eyebrow + H2 (+ optional intro), revealed on scroll. `id` labels the section. */
export function SectionHeading({
  eyebrow,
  title,
  id,
  intro,
  align = "left",
  tone = "default",
  className,
}: SectionHeadingProps) {
  return (
    <Reveal
      className={cn(
        "flex flex-col gap-4",
        align === "center" && "items-center text-center",
        className,
      )}
    >
      <Eyebrow tone={tone}>{eyebrow}</Eyebrow>
      <h2
        id={id}
        className={cn(
          "max-w-2xl text-[1.8rem] font-normal md:text-4xl",
          tone === "light" && "text-creme",
        )}
      >
        {title}
      </h2>
      {intro ? (
        <p
          className={cn(
            "max-w-2xl text-base leading-relaxed",
            tone === "light" ? "text-creme/85" : "text-charbon/80",
          )}
        >
          {intro}
        </p>
      ) : null}
    </Reveal>
  );
}
