"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import {
  describeAuthError,
  editorApi,
  FIX_FIELDS,
  type FieldErrors,
  fieldError,
  messagesFor,
} from "@/lib/editor/api";
import { AuthCard } from "./LoginForm";
import { FormError } from "./StatusMessage";
import { linkButton } from "./styles";
import { usePasswordRules } from "./usePasswordRules";

/**
 * Where the reset e-mail's link lands: `/<secret>/reinitialiser?uid=…&token=…`.
 *
 * Outside the login gate, since the person has no session by definition. The uid and
 * token are read once, then removed from the address bar. They would otherwise sit in the
 * browser history, and in a screenshot of this page, for as long as the link is valid.
 */
export function ResetPasswordForm({ basePath }: { basePath: string }) {
  const searchParams = useSearchParams();
  const [link] = useState(() => ({
    uid: searchParams.get("uid") ?? "",
    token: searchParams.get("token") ?? "",
  }));
  const rules = usePasswordRules();
  const [password1, setPassword1] = useState("");
  const [password2, setPassword2] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);
  const loginHref = `${basePath}/ateliers`;

  useEffect(() => {
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setFailure(null);
    try {
      await editorApi.confirmPasswordReset({
        ...link,
        new_password1: password1,
        new_password2: password2,
      });
      setDone(true);
    } catch (caught) {
      setFailure(
        describeAuthError(caught, (failure) => {
          setErrors(failure.fieldErrors);
          return FIX_FIELDS;
        }),
      );
    } finally {
      setPending(false);
    }
  }

  const badLink =
    !link.uid || !link.token ? ["Ce lien est incomplet."] : messagesFor(errors, "token");

  if (done) {
    return (
      <AuthCard title="Mot de passe modifié" intro="Vous pouvez maintenant vous connecter.">
        <Button href={loginHref}>Se connecter</Button>
      </AuthCard>
    );
  }

  if (badLink.length > 0) {
    return (
      <AuthCard title="Lien expiré" intro={badLink.join(" ")}>
        <p className="text-sm text-charbon/80">
          Un lien de réinitialisation ne sert qu'une fois et reste valable deux heures. Demandez-en
          un nouveau depuis la page de connexion, avec « Mot de passe oublié ? ».
        </p>
        <Link href={loginHref} className={linkButton}>
          Aller à la page de connexion
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Nouveau mot de passe" intro="Choisissez le mot de passe de votre compte.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <FormError>{failure}</FormError>
        <Field
          label="Nouveau mot de passe"
          id="reset-password1"
          type="password"
          autoComplete="new-password"
          required
          value={password1}
          onChange={(event) => setPassword1(event.target.value)}
          hint={rules}
          error={fieldError(errors, "new_password1")}
        />
        <Field
          label="Confirmer le mot de passe"
          id="reset-password2"
          type="password"
          autoComplete="new-password"
          required
          value={password2}
          onChange={(event) => setPassword2(event.target.value)}
          error={fieldError(errors, "new_password2")}
        />
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer le mot de passe"}
        </Button>
      </form>
    </AuthCard>
  );
}
