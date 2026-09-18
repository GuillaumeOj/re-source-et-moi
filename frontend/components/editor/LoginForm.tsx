"use client";

import { type FormEvent, type ReactNode, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import {
  describeAuthError,
  editorApi,
  messagesFor,
  type Session,
  UNREACHABLE,
} from "@/lib/editor/api";
import { FormError } from "./StatusMessage";
import { linkButton } from "./styles";

export const RESET_SENT =
  "Si un compte correspond à cette adresse, un e-mail contenant un lien vient d'être " +
  "envoyé. Pensez à vérifier les courriers indésirables.";

type LoginFormProps = {
  onLoggedIn: (session: Session) => void;
  /** Why the form is showing, when it isn't the first visit, e.g. an expired session. */
  notice?: string;
};

/** The centred card every logged-out screen uses. */
export function AuthCard({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-8 px-4 py-16">
      <div>
        <h1 className="text-4xl">{title}</h1>
        <p className="mt-2 text-charbon/70">{intro}</p>
      </div>
      <div className="flex flex-col gap-5 rounded-3xl bg-white p-8 shadow-soft">{children}</div>
    </main>
  );
}

export function LoginForm({ onLoggedIn, notice }: LoginFormProps) {
  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      onLoggedIn(await editorApi.login({ username, password }));
    } catch (caught) {
      setError(
        describeAuthError(
          caught,
          (failure) => messagesFor(failure.fieldErrors, "non_field_errors")[0] ?? UNREACHABLE,
        ),
      );
      setPassword("");
    } finally {
      setPending(false);
    }
  }

  if (mode === "forgot") {
    return <ForgotPasswordForm onBack={() => setMode("login")} />;
  }

  return (
    <AuthCard
      title="Espace d'édition"
      intro="Connectez-vous pour gérer les ateliers et les tarifs."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {notice && !error && (
          <p role="status" className="text-sm text-charbon/80">
            {notice}
          </p>
        )}
        <FormError>{error}</FormError>
        <Field
          label="Identifiant"
          id="login-username"
          name="username"
          autoComplete="username"
          required
          value={username}
          onChange={(event) => setUsername(event.target.value)}
        />
        <Field
          label="Mot de passe"
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <Button type="submit" disabled={pending}>
          {pending ? "Connexion…" : "Se connecter"}
        </Button>
      </form>
      <button type="button" className={linkButton} onClick={() => setMode("forgot")}>
        Mot de passe oublié ?
      </button>
    </AuthCard>
  );
}

/**
 * Ask for a reset link by e-mail.
 *
 * The confirmation reads the same whether or not the address has an account, because the
 * backend answers the same either way. Saying "no account with this address" would let
 * anyone test addresses.
 */
function ForgotPasswordForm({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      await editorApi.requestPasswordReset(email);
      setSent(true);
    } catch (caught) {
      setError(describeAuthError(caught, () => "Indiquez une adresse e-mail valide."));
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthCard
      title="Mot de passe oublié"
      intro="Indiquez l'adresse e-mail de votre compte : vous recevrez un lien pour choisir un nouveau mot de passe."
    >
      {sent ? (
        <p role="status" className="text-sm text-charbon/80">
          {RESET_SENT}
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <FormError>{error}</FormError>
          <Field
            label="Adresse e-mail"
            id="forgot-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Button type="submit" disabled={pending}>
            {pending ? "Envoi…" : "Recevoir le lien"}
          </Button>
        </form>
      )}
      <button type="button" className={linkButton} onClick={onBack}>
        Retour à la connexion
      </button>
    </AuthCard>
  );
}
