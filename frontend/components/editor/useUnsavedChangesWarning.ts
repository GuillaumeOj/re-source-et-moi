"use client";

import { useEffect } from "react";

/**
 * Ask the browser to confirm before closing or reloading the tab while a form has
 * unsaved changes. The browser shows its own wording; the page cannot customise it.
 */
export function useUnsavedChangesWarning(dirty: boolean): void {
  useEffect(() => {
    if (!dirty) {
      return;
    }
    function warn(event: BeforeUnloadEvent) {
      event.preventDefault();
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
}
