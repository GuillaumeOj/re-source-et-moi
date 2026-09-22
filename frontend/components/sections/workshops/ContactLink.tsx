import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { contactHref } from "@/content/routes";

/**
 * The outlined pill that leads to the contact page — a workshop row's "S'inscrire" (with
 * `eventId`, so the form opens on that workshop), and the way out of every notice. The
 * arrow nudges right when a `group` ancestor is hovered.
 */
export function ContactLink({ eventId, children }: { eventId?: string; children: ReactNode }) {
  return (
    <a
      href={contactHref(eventId)}
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
