"use client";

import { createContext, useContext } from "react";
import type { PublicTag } from "@/lib/api/cache";
import { SAVED_LIVE, SAVED_SOON, type Session } from "@/lib/editor/api";
import { refreshPublicSite } from "@/lib/editor/refresh";
import type { Status } from "./StatusMessage";

export type EditorContextValue = {
  /** The logged-in staff member. The shell only renders pages once there is one. */
  session: Session;
  /** Replace it after the account page changed the username or e-mail. */
  setSession: (session: Session) => void;
  /** The editor's secret base path ("/admin-3f2c…"), for links between its pages. */
  basePath: string;
  /**
   * A confirmation carried over one navigation: a page that saves and then leaves
   * (creating a review, deleting one from its own page) sets it, and the page it lands
   * on shows it and clears it. The shell holds it because it stays mounted across pages.
   */
  flash: Status;
  setFlash: (status: Status) => void;
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
