"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";

type ConfirmDialogProps = {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * A modal "are you sure?" for the actions that cannot be undone.
 *
 * A native <dialog> opened with showModal(): the browser supplies the focus trap, the
 * Escape key and the inert background. `window.confirm` would do the same job but can't
 * be styled, and it blocks the page's scripts while it is open.
 */
export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || dialog.open) {
      return;
    }
    // jsdom has no showModal(). The attribute renders the same content, which is all a
    // test needs to see.
    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby="confirm-title"
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      className="m-auto max-w-md rounded-3xl bg-creme p-8 shadow-soft-lg backdrop:bg-charbon/40"
    >
      <h2 id="confirm-title" className="text-2xl">
        {title}
      </h2>
      <p className="mt-3 text-charbon/80">{message}</p>
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <Button variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </dialog>
  );
}
