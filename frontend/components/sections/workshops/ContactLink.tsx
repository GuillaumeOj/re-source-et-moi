import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

/**
 * The outlined pill that jumps to the contact form — a workshop row's "S'inscrire", and the
 * way out of every notice. The arrow nudges right when a `group` ancestor is hovered.
 *
 * Root-relative ("/#contact") because it also renders on the agenda page, where a bare
 * "#contact" would point at an anchor that page does not have.
 */
export function ContactLink({ children }: { children: ReactNode }) {
  return (
    <a
      href="/#contact"
      className="inline-flex items-center gap-1.5 rounded-full border border-rose-sombre/20 px-5 py-2.5 text-sm font-semibold text-rose-sombre transition-colors hover:bg-rose-sombre/5"
    >
      {children}
      <ArrowRight
        size={16}
        aria-hidden="true"
        className="transition-transform group-hover:translate-x-1"
      />
    </a>
  );
}
