import type { LucideIcon } from "lucide-react";

/** A line icon in a soft rose disc, at the top of a card. */
export function IconBadge({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-tendre text-rose-sombre">
      <Icon size={22} aria-hidden="true" />
    </span>
  );
}
