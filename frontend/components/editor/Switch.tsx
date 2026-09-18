"use client";

import { cn } from "@/lib/cn";

type SwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** The accessible name. The state word ("Publié" / "Masqué") sits beside it. */
  label: string;
  onLabel?: string;
};

/**
 * An on/off control for the flags that get flipped most, i.e. publishing.
 *
 * It is a `button role="switch"`, not a checkbox, because it acts immediately (the list
 * saves on click) rather than waiting for a form submit. The state is also spelled out in
 * words, so it never relies on colour alone.
 */
export function Switch({ checked, onChange, label, onLabel = "Publié" }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2 rounded-full text-sm font-semibold text-rose-sombre"
    >
      <span
        aria-hidden="true"
        className={cn(
          "relative inline-block h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-sauge-vif" : "bg-charbon/20",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
            checked && "translate-x-5",
          )}
        />
      </span>
      <span aria-hidden="true">{checked ? onLabel : "Masqué"}</span>
    </button>
  );
}
