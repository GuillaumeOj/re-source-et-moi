import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/editor/ResetPasswordForm";
import { editorBasePath } from "@/lib/editor/basePath";

/**
 * Where the password-reset e-mail's link lands. Outside (editeur)/, so outside the login
 * gate: whoever opens it has no session by definition.
 */
export default async function ResetPasswordPage() {
  const basePath = await editorBasePath();
  // ResetPasswordForm reads uid and token with useSearchParams, which needs a boundary.
  return (
    <Suspense>
      <ResetPasswordForm basePath={basePath} />
    </Suspense>
  );
}
