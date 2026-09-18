"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

type PaginationProps = {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
};

/** "Précédent · Page 2 sur 5 · Suivant". Nothing at all when everything fits on one page. */
export function Pagination({ page, pageCount, onChange }: PaginationProps) {
  if (pageCount <= 1) {
    return null;
  }
  const button =
    "inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold text-rose-sombre " +
    "transition-colors hover:bg-rose-tendre disabled:opacity-30 disabled:hover:bg-transparent";
  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-2">
      <button
        type="button"
        className={button}
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        <ChevronLeft size={16} aria-hidden="true" />
        Précédent
      </button>
      <span className="text-sm text-charbon/70" aria-live="polite">
        Page {page} sur {pageCount}
      </span>
      <button
        type="button"
        className={button}
        disabled={page >= pageCount}
        onClick={() => onChange(page + 1)}
      >
        Suivant
        <ChevronRight size={16} aria-hidden="true" />
      </button>
    </nav>
  );
}
