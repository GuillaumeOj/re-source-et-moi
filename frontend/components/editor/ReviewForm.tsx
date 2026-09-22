"use client";

import { type FormEvent, useId, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { editorApi, type ManagedReview, type ReviewInput } from "@/lib/editor/api";
import { confirmSaved } from "./EditorContext";
import { FormError, StatusMessage } from "./StatusMessage";
import { editorCard, linkButton } from "./styles";
import { useSubmit } from "./useSubmit";
import { useUnsavedChangesWarning } from "./useUnsavedChangesWarning";

/** What the form edits. Publishing is not in it: the list's switch saves that on its own. */
type ReviewDraft = Required<Pick<ReviewInput, "text" | "author" | "context">>;

function draftFrom(review: ManagedReview | null): ReviewDraft {
  return {
    text: review?.text ?? "",
    author: review?.author ?? "",
    context: review?.context ?? "",
  };
}

type ReviewFormProps = {
  /** The stored review, or null for a new one that has not been saved yet. */
  review: ManagedReview | null;
  onSaved: (saved: ManagedReview) => void;
  /** Delete a stored review, or discard a new one. */
  onRemove: () => void;
};

/** One review, saved with its own "Enregistrer". */
export function ReviewForm({ review, onSaved, onRemove }: ReviewFormProps) {
  const { pending, status, setStatus, errorFor, formErrors, submit } = useSubmit();
  const [initial, setInitial] = useState(() => draftFrom(review));
  const [draft, setDraft] = useState(initial);
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);
  useUnsavedChangesWarning(dirty);
  const newId = useId();
  const formId = review?.id ?? newId;

  function set<K extends keyof ReviewDraft>(field: K, value: ReviewDraft[K]) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submit(async () => {
      const saved = review
        ? await editorApi.updateReview(review.id, draft)
        : await editorApi.createReview(draft);
      const fresh = draftFrom(saved);
      setInitial(fresh);
      setDraft(fresh);
      onSaved(saved);
      // A new review is replaced by the stored card, and the page reports the save. A
      // stored one stays, and confirms once the home page is refreshed.
      if (review) {
        setStatus({ tone: "success", text: await confirmSaved("reviews") });
      }
    });
  }

  const title = review ? `Avis de ${review.author}` : "Nouvel avis";

  return (
    <form onSubmit={handleSubmit} noValidate aria-label={title} className={editorCard}>
      <StatusMessage status={status} />
      <FormError>{formErrors.join(" ")}</FormError>

      <Field
        label="Avis"
        id={`${formId}-text`}
        multiline
        rows={4}
        required
        value={draft.text}
        onChange={(e) => set("text", e.target.value)}
        error={errorFor("text")}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Nom"
          id={`${formId}-author`}
          required
          autoComplete="off"
          value={draft.author}
          onChange={(e) => set("author", e.target.value)}
          hint="Un prénom suffit."
          error={errorFor("author")}
        />
        <Field
          label="Description"
          id={`${formId}-context`}
          autoComplete="off"
          value={draft.context}
          onChange={(e) => set("context", e.target.value)}
          hint="Par exemple « Atelier découverte », « Parent d'élève »."
          error={errorFor("context")}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={onRemove} className={linkButton}>
          {review ? "Supprimer l'avis" : "Abandonner"}
        </button>
        <div className="flex items-center gap-3">
          {dirty && review && (
            <span className="text-sm text-charbon/60">Modifications non enregistrées</span>
          )}
          <Button type="submit" disabled={pending || (!dirty && review !== null)}>
            {pending ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      </div>
    </form>
  );
}
