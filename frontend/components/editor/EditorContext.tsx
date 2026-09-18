"use client";

import { createContext, useContext } from "react";
import type { PublicTag } from "@/lib/api/cache";
import { SAVED_LIVE, SAVED_SOON, type Session } from "@/lib/editor/api";
import { refreshPublicSite } from "@/lib/editor/refresh";

export type EditorContextValue = {
  /** The logged-in staff member. The shell only renders pages once there is one. */
  session: Session;
  /** Replace it after the account page changed the username or e-mail. */
  setSession: (session: Session) => void;
};

export const EditorContext = createContext<EditorContextValue | null>(null);

export function useEditor(): EditorContextValue {
  const value = useContext(EditorContext);
  if (!value) {
    throw new Error("useEditor() must be used inside <EditorShell>.");
  }
  return value;
}

/** Refresh the public site after a save and return the confirmation to show. */
export async function confirmSaved(tag: PublicTag): Promise<string> {
  const refreshed = await refreshPublicSite(tag).catch(() => false);
  return refreshed ? SAVED_LIVE : SAVED_SOON;
}
