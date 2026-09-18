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
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="rounded-full p-2.5 text-rose-sombre transition-colors hover:bg-rose-tendre disabled:opacity-30 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}
