import { cn } from "@/lib/cn";

export type Status = { tone: "success" | "error"; text: string } | null;

/**
 * The line that confirms a save or explains why it failed.
 *
 * A live region, so a screen reader announces the outcome without moving focus. Errors
 * are `alert`, which interrupts. Confirmations are `status`, which waits its turn.
 */
export function StatusMessage({ status }: { status: Status }) {
  if (!status) {
    return null;
  }
  return (
    <p
      role={status.tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-2xl px-4 py-3 text-sm font-semibold",
        status.tone === "error" ? "bg-rose-tendre text-rose-sombre" : "bg-sauge-doux text-charbon",
      )}
    >
      {status.text}
    </p>
  );
}

/** A plain error line at the top of a form: a failed login, an error about the whole form. */
export function FormError({ children }: { children: string | null | undefined }) {
  if (!children) {
    return null;
  }
  return (
    <p role="alert" className="text-sm font-semibold text-rose-sombre">
      {children}
    </p>
  );
}

/** "Impossible de charger les ateliers. Réessayer" */
export function LoadError({ what, onRetry }: { what: string; onRetry: () => void }) {
  return (
    <p role="alert" className="text-rose-sombre">
      Impossible de charger {what}.{" "}
      <button type="button" onClick={onRetry} className="font-semibold underline">
        Réessayer
      </button>
    </p>
  );
}
