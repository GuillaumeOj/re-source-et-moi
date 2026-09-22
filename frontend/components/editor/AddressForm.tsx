"use client";

import { type FormEvent, type KeyboardEvent, useId, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { type AddressInput, editorApi, type ManagedAddress } from "@/lib/editor/api";
import { confirmSaved } from "./EditorContext";
import { FormError, StatusMessage } from "./StatusMessage";
import { editorCard, linkButton } from "./styles";
import { useSubmit } from "./useSubmit";
import { useUnsavedChangesWarning } from "./useUnsavedChangesWarning";

type AddressDraft = Required<AddressInput>;

function draftFrom(address: ManagedAddress | null): AddressDraft {
  return {
    name: address?.name ?? "",
    line1: address?.line1 ?? "",
    line2: address?.line2 ?? "",
    postal_code: address?.postal_code ?? "",
    city: address?.city ?? "",
  };
}

/** The backend's order, by name: for a list that just gained or renamed an address. */
export function byName(addresses: ManagedAddress[]): ManagedAddress[] {
  return [...addresses].sort((a, b) => a.name.localeCompare(b.name, "fr"));
}

type AddressFormProps = {
  /** The stored address, or null for a new one that has not been saved yet. */
  address: ManagedAddress | null;
  onSaved: (saved: ManagedAddress) => void;
  /** Delete a stored address, or discard a new one. */
  onRemove: () => void;
  /**
   * Rendered inside another form (the workshop's "Nouvelle adresse…"). A form cannot hold
   * another one, so this is then a fieldset whose button and Enter key save it on their own,
   * without submitting the workshop around it.
   */
  nested?: boolean;
};

/**
 * One saved address, saved with its own "Enregistrer". Every workshop held there shows
 * the change, which is why a stored one refreshes the public agenda once saved.
 */
export function AddressForm({ address, onSaved, onRemove, nested = false }: AddressFormProps) {
  const { pending, status, setStatus, errorFor, formErrors, submit } = useSubmit();
  const [initial, setInitial] = useState(() => draftFrom(address));
  const [draft, setDraft] = useState(initial);
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);
  useUnsavedChangesWarning(dirty);
  const newId = useId();
  const formId = address?.id ?? newId;
  const inUse = address !== null && address.event_count > 0;

  function set<K extends keyof AddressDraft>(field: K, value: AddressDraft[K]) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function save() {
    submit(async () => {
      const saved = address
        ? await editorApi.updateAddress(address.id, draft)
        : await editorApi.createAddress(draft);
      const fresh = draftFrom(saved);
      setInitial(fresh);
      setDraft(fresh);
      onSaved(saved);
      // A new address is replaced by the stored card, whose page reports the save. A
      // stored one stays, and confirms once the workshops showing it are refreshed.
      if (address) {
        setStatus({ tone: "success", text: await confirmSaved("events") });
      }
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    save();
  }

  function handleNestedEnter(event: KeyboardEvent<HTMLFieldSetElement>) {
    if (event.key === "Enter" && event.target instanceof HTMLInputElement) {
      event.preventDefault();
      save();
    }
  }

  const title = address ? address.name : "Nouvelle adresse";
  const fields = (
    <>
      <StatusMessage status={status} />
      <FormError>{formErrors.join(" ")}</FormError>

      <Field
        label="Nom"
        id={`${formId}-name`}
        required
        value={draft.name}
        onChange={(e) => set("name", e.target.value)}
        hint="Pour la retrouver dans la liste, par exemple « Salle Paul Éluard »."
        error={errorFor("name")}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field
            label="Adresse"
            id={`${formId}-line1`}
            autoComplete="off"
            value={draft.line1}
            onChange={(e) => set("line1", e.target.value)}
            error={errorFor("line1")}
          />
        </div>
        <div className="sm:col-span-2">
          <Field
            label="Complément d'adresse"
            id={`${formId}-line2`}
            autoComplete="off"
            value={draft.line2}
            onChange={(e) => set("line2", e.target.value)}
            error={errorFor("line2")}
          />
        </div>
        <Field
          label="Code postal"
          id={`${formId}-postal-code`}
          inputMode="numeric"
          autoComplete="off"
          value={draft.postal_code}
          onChange={(e) => set("postal_code", e.target.value)}
          error={errorFor("postal_code")}
        />
        <Field
          label="Ville"
          id={`${formId}-city`}
          required
          autoComplete="off"
          value={draft.city}
          onChange={(e) => set("city", e.target.value)}
          error={errorFor("city")}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        {inUse ? (
          <p className="text-sm text-charbon/60">
            Utilisée par {address.event_count} {address.event_count === 1 ? "atelier" : "ateliers"}{" "}
            : elle ne peut pas être supprimée.
          </p>
        ) : (
          <button type="button" onClick={onRemove} className={linkButton}>
            {address ? "Supprimer l'adresse" : "Abandonner"}
          </button>
        )}
        <div className="flex items-center gap-3">
          {dirty && address && (
            <span className="text-sm text-charbon/60">Modifications non enregistrées</span>
          )}
          <Button
            type={nested ? "button" : "submit"}
            onClick={nested ? save : undefined}
            disabled={pending || (!dirty && address !== null)}
          >
            {pending ? "Enregistrement…" : nested ? "Enregistrer l'adresse" : "Enregistrer"}
          </Button>
        </div>
      </div>
    </>
  );

  if (nested) {
    return (
      <fieldset
        onKeyDown={handleNestedEnter}
        className="flex flex-col gap-5 rounded-2xl border border-rose-sombre/15 p-4 sm:p-6"
      >
        <legend className="px-2 font-display text-lg text-rose-sombre">{title}</legend>
        {fields}
      </fieldset>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate aria-label={title} className={editorCard}>
      {fields}
    </form>
  );
}
