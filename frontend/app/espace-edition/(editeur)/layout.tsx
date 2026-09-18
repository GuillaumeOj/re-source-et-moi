import type { ReactNode } from "react";
import { EditorShell } from "@/components/editor/EditorShell";
import { editorBasePath } from "@/lib/editor/basePath";

/** The pages behind the login: the shell shows the login form until there is a session. */
export default async function LoggedInLayout({ children }: { children: ReactNode }) {
  return <EditorShell basePath={await editorBasePath()}>{children}</EditorShell>;
}
