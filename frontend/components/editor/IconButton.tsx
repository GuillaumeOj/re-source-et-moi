"use client";

import type { ReactNode } from "react";

/**
 * A round, icon-only action (edit, duplicate, delete, move). The label is both its
 * accessible name and its hover tooltip, since the icon alone can be ambiguous.
 */
export function IconButton({
  label,
  onClick,
  disabled,
  opens,
  expanded,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  /**
   * What this button opens, for a button that opens something — the date field's calendar
   * opens a "dialog". Named by the caller rather than assumed here: a menu and a dialog
   * are announced differently, and only the caller knows which it renders.
   */
  opens?: "dialog" | "menu" | "listbox" | "grid";
  /** Whether what it opens is open, for the same button. */
  expanded?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      // Said before it is pressed, not only once it is open.
      aria-haspopup={opens}
      aria-expanded={expanded}
      onClick={onClick}
      disabled={disabled}
      className="rounded-full p-2.5 text-rose-sombre transition-colors hover:bg-rose-tendre disabled:opacity-30 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}
