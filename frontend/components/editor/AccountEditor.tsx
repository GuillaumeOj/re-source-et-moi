"use client";

import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { editorApi } from "@/lib/editor/api";
import { useEditor } from "./EditorContext";
import { StatusMessage } from "./StatusMessage";
import { editorCard } from "./styles";
import { usePasswordRules } from "./usePasswordRules";
import { useSubmit } from "./useSubmit";

/**
 * "Mon compte", opened from the username in the header: the login details, then the
 * password. Two forms, because they are two separate decisions. Both ask for the current
 * password, so an unattended open tab isn't enough to take the account over.
 */
export function AccountEditor() {
  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-4xl">Mon compte</h1>
      <IdentityForm />
      <PasswordForm />
    </div>
  );
}

function IdentityForm() {
  const { session, setSession } = useEditor();
  const { pending, status, setStatus, errorFor, submit } = useSubmit();
  const [username, setUsername] = useState(session.username);
  const [email, setEmail] = useState(session.email);
  const [currentPassword, setCurrentPassword] = useState("");
  const dirty = username !== session.username || email !== session.email;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submit(async () => {
      setSession(
        await editorApi.updateAccount({ username, email, current_password: currentPassword }),
      );
      setCurrentPassword("");
      setStatus({ tone: "success", text: "Vos informations ont été enregistrées." });
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-labelledby="identity-title"
      className={editorCard}
    >
      <h2 id="identity-title" className="text-2xl">
        Identifiant et e-mail
      </h2>
      <StatusMessage status={status} />
      <Field
        label="Identifiant"
        id="account-username"
        autoComplete="username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        hint="Celui que vous saisissez pour vous connecter."
        error={errorFor("username")}
      />
      <Field
        label="Adresse e-mail"
        id="account-email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        hint="C'est là que vous recevrez le lien en cas de mot de passe oublié."
        error={errorFor("email")}
      />
      <Field
        label="Mot de passe actuel"
        id="account-current-password"
        type="password"
        autoComplete="current-password"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        hint="Pour confirmer que c'est bien vous."
        error={errorFor("current_password")}
      />
      <div className="flex justify-end">
        <Button type="submit" disabled={pending || !dirty}>
          {pending ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}

function PasswordForm() {
  const { pending, status, setStatus, errorFor, submit } = useSubmit();
  const rules = usePasswordRules();
  const [oldPassword, setOldPassword] = useState("");
  const [password1, setPassword1] = useState("");
  const [password2, setPassword2] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submit(async () => {
      await editorApi.changePassword({
        old_password: oldPassword,
        new_password1: password1,
        new_password2: password2,
      });
      setOldPassword("");
      setPassword1("");
      setPassword2("");
      setStatus({
        tone: "success",
        text: "Mot de passe modifié. Les autres appareils connectés ont été déconnectés.",
      });
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-labelledby="password-title"
      className={editorCard}
    >
      <h2 id="password-title" className="text-2xl">
        Mot de passe
      </h2>
      <StatusMessage status={status} />
      <Field
        label="Mot de passe actuel"
        id="password-old"
        type="password"
        autoComplete="current-password"
        value={oldPassword}
        onChange={(e) => setOldPassword(e.target.value)}
        error={errorFor("old_password")}
      />
      <Field
        label="Nouveau mot de passe"
        id="password-new1"
        type="password"
        autoComplete="new-password"
        value={password1}
        onChange={(e) => setPassword1(e.target.value)}
        hint={rules}
        error={errorFor("new_password1")}
      />
      <Field
        label="Confirmer le nouveau mot de passe"
        id="password-new2"
        type="password"
        autoComplete="new-password"
        value={password2}
        onChange={(e) => setPassword2(e.target.value)}
        error={errorFor("new_password2")}
      />
      <div className="flex justify-end">
        <Button type="submit" disabled={pending || !oldPassword || !password1 || !password2}>
          {pending ? "Enregistrement…" : "Changer le mot de passe"}
        </Button>
      </div>
    </form>
  );
}
