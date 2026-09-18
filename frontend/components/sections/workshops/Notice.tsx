import type { ReactNode } from "react";

/**
 * The line shown in place of a list that is empty or could not be loaded, with an optional
 * follow-up action under it (the empty agenda points visitors at the contact form).
 */
export function Notice({ children, action }: { children: string; action?: ReactNode }) {
  return (
    <div className="mt-8 flex flex-col items-start gap-4">
      <p className="max-w-2xl text-sm text-charbon/60">{children}</p>
      {action}
    </div>
  );
}
