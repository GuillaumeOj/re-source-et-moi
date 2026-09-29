import type { ReactNode } from "react";
import { vi } from "vitest";
import { EditorContext, type EditorContextValue } from "@/components/editor/EditorContext";
import type { ManagedAddress, ManagedReview } from "@/lib/editor/api";

export const SESSION = { username: "cecile", email: "cecile@example.org" };

/** The editor's base path in tests. */
export const BASE_PATH = "/edition";

/** The context the shell provides once logged in, overriding only what a test is about. */
export function editorContext(fields: Partial<EditorContextValue> = {}): EditorContextValue {
  return {
    session: SESSION,
    setSession: vi.fn(),
    basePath: BASE_PATH,
    flash: null,
    setFlash: vi.fn(),
    ...fields,
  };
}

/** Wrap an editor component in the context the shell provides once logged in. */
export function withEditor(children: ReactNode, context: EditorContextValue = editorContext()) {
  return <EditorContext.Provider value={context}>{children}</EditorContext.Provider>;
}

export { page } from "../pagination";

/** A saved address as the API returns it, overriding only what a test is about. */
export function address(fields: Partial<ManagedAddress>): ManagedAddress {
  return {
    id: "a1",
    name: "Salle de la Charité",
    line1: "12 rue de la Charité",
    line2: "",
    postal_code: "69002",
    city: "Lyon",
    one_line: "12 rue de la Charité, 69002 Lyon",
    event_count: 0,
    ...fields,
  };
}

export function review(fields: Partial<ManagedReview>): ManagedReview {
  return {
    id: "r1",
    text: "J'ai retrouvé le plaisir d'apprendre.",
    author: "Camille",
    context: "Atelier découverte",
    is_published: true,
    created_at: "2026-09-12T08:30:00Z",
    ...fields,
  };
}
