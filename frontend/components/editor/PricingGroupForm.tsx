"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import {
  editorApi,
  fieldError,
  type ManagedPricingType,
  messagesFor,
  nestedErrors,
  type PricingTypeInput,
} from "@/lib/editor/api";
import { confirmSaved } from "./EditorContext";
import { IconButton } from "./IconButton";
import { FormError, StatusMessage } from "./StatusMessage";
import { Switch } from "./Switch";
import { editorCard, linkButton } from "./styles";
import { useSubmit } from "./useSubmit";
import { useUnsavedChangesWarning } from "./useUnsavedChangesWarning";

/**
 * One tariff line being edited. `key` identifies it in the list, even before it has an
 * `id` from the server. The amount is the text as typed, e.g. "75" or "75,50".
 */
type LineDraft = {
  key: string;
  id?: string;
  description: string;
  amount: string;
  on_demand: boolean;
  is_published: boolean;
};

type GroupDraft = {
  name: string;
  description: string;
  is_published: boolean;
  lines: LineDraft[];
};

let lineCounter = 0;
function newLineKey(): string {
  lineCounter += 1;
  return `line-${lineCounter}`;
}

/** "75.00" → "75", "75.50" → "75,50": how a price is written in French, and typed. */
export function amountForInput(amount: string | null): string {
  if (amount === null) {
    return "";
  }
  return amount.replace(/\.00$/, "").replace(".", ",");
}

/** Back to the API's decimal string. A comma is accepted, and blank means no amount. */
export function amountForApi(typed: string): string | null {
  const cleaned = typed.replace(/\s|€/g, "").replace(",", ".");
  return cleaned === "" ? null : cleaned;
}

function draftFrom(group: ManagedPricingType | null): GroupDraft {
  if (!group) {
    return { name: "", description: "", is_published: true, lines: [] };
  }
  return {
    name: group.name,
    description: group.description,
    is_published: group.is_published,
    lines: group.prices.map((price) => ({
      key: price.id,
      id: price.id,
      description: price.description,
      amount: amountForInput(price.amount),
      on_demand: price.on_demand,
      is_published: price.is_published,
    })),
  };
}

/**
 * The request body. Positions follow the order on screen, so the ↑/↓ buttons are the
 * only thing that decides the order and there are no numbers to manage by hand. A line
 * marked "sur devis" is sent without an amount, whatever is still typed in the box.
 */
function payloadFrom(draft: GroupDraft): PricingTypeInput {
  return {
    name: draft.name,
    description: draft.description,
    is_published: draft.is_published,
    prices: draft.lines.map((line, index) => ({
      ...(line.id ? { id: line.id } : {}),
      description: line.description,
      amount: line.on_demand ? null : amountForApi(line.amount),
      on_demand: line.on_demand,
      is_published: line.is_published,
      position: index,
    })),
  };
}

type PricingGroupFormProps = {
  /** The stored group, or null for a new one that has not been saved yet. */
  group: ManagedPricingType | null;
  /**
   * Where a new group goes: after the others. Only sent on creation. After that, a
   * group's place is set by the reorder buttons, never by saving its card.
   */
  createAt?: number;
  onSaved: (saved: ManagedPricingType) => void;
  /** Delete a stored group, or discard a new one. */
  onRemove: () => void;
};

/**
 * One tariff group and its lines, saved together with one "Enregistrer". This is the
 * same unit the site shows as one card, and the backend writes it in one transaction.
 */
export function PricingGroupForm({ group, createAt, onSaved, onRemove }: PricingGroupFormProps) {
  const { pending, status, setStatus, errors, errorFor, formErrors, submit } = useSubmit();
  const [initial, setInitial] = useState(() => draftFrom(group));
  const [draft, setDraft] = useState(initial);
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);
  useUnsavedChangesWarning(dirty);
  const formId = group?.id ?? "new";

  function setLine(key: string, changes: Partial<LineDraft>) {
    setDraft((current) => ({
      ...current,
      lines: current.lines.map((line) => (line.key === key ? { ...line, ...changes } : line)),
    }));
  }

  function moveLine(index: number, offset: -1 | 1) {
    setDraft((current) => {
      const lines = [...current.lines];
      const [line] = lines.splice(index, 1);
      lines.splice(index + offset, 0, line);
      return { ...current, lines };
    });
  }

  function removeLine(key: string) {
    setDraft((current) => ({
      ...current,
      lines: current.lines.filter((line) => line.key !== key),
    }));
  }

  function addLine() {
    setDraft((current) => ({
      ...current,
      lines: [
        ...current.lines,
        { key: newLineKey(), description: "", amount: "", on_demand: false, is_published: true },
      ],
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submit(async () => {
      const payload = payloadFrom(draft);
      const saved = group
        ? await editorApi.updatePricingType(group.id, payload)
        : await editorApi.createPricingType({ ...payload, position: createAt });
      const fresh = draftFrom(saved);
      setInitial(fresh);
      setDraft(fresh);
      onSaved(saved);
      // A new card is replaced by the stored one, whose page reports the save. A stored
      // card stays, and confirms here once the public site is refreshed.
      if (group) {
        setStatus({ tone: "success", text: await confirmSaved("pricing") });
      }
    });
  }

  const groupErrors = [...formErrors, ...messagesFor(errors, "prices")];
  const title = group ? group.name : "Nouveau groupe de tarifs";

  return (
    <form onSubmit={handleSubmit} noValidate aria-label={title} className={editorCard}>
      <StatusMessage status={status} />
      <FormError>{groupErrors.join(" ")}</FormError>

      <Field
        label="Nom du groupe"
        id={`${formId}-name`}
        value={draft.name}
        onChange={(e) => setDraft({ ...draft, name: e.target.value })}
        hint="Le titre de la carte sur le site, par exemple « Individuel »."
        error={errorFor("name")}
        aside={
          <Switch
            label={`Publier le groupe « ${draft.name || "sans nom"} »`}
            checked={draft.is_published}
            onChange={(value) => setDraft({ ...draft, is_published: value })}
          />
        }
      />

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 font-display text-xl text-rose-sombre">Tarifs</legend>
        {draft.lines.length === 0 && (
          <p className="text-sm text-charbon/60">Aucun tarif dans ce groupe pour l'instant.</p>
        )}
        {draft.lines.map((line, index) => {
          const lineErrors = nestedErrors(errors, "prices", index);
          const lineId = `${formId}-${line.key}`;
          const name = line.description || `tarif ${index + 1}`;
          return (
            <div
              key={line.key}
              className="grid gap-3 rounded-2xl border border-rose-sombre/10 p-4 sm:grid-cols-[1fr_9rem_auto] sm:items-start"
            >
              <Field
                label="Libellé"
                id={`${lineId}-description`}
                value={line.description}
                onChange={(e) => setLine(line.key, { description: e.target.value })}
                error={fieldError(lineErrors, "description")}
              />
              <Field
                label="Montant (€)"
                id={`${lineId}-amount`}
                inputMode="decimal"
                placeholder={line.on_demand ? "Sur devis" : "75"}
                disabled={line.on_demand}
                value={line.on_demand ? "" : line.amount}
                onChange={(e) => setLine(line.key, { amount: e.target.value })}
                error={fieldError(lineErrors, "amount")}
              />
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:pt-8">
                <label className="inline-flex items-center gap-2 text-sm font-semibold text-rose-sombre">
                  <input
                    type="checkbox"
                    checked={line.on_demand}
                    onChange={(e) => setLine(line.key, { on_demand: e.target.checked })}
                    className="h-4 w-4 accent-rose-sombre"
                  />
                  Sur devis
                </label>
                <Switch
                  label={`Afficher « ${name} »`}
                  onLabel="Affiché"
                  checked={line.is_published}
                  onChange={(value) => setLine(line.key, { is_published: value })}
                />
                <div className="flex">
                  <IconButton
                    label={`Monter « ${name} »`}
                    disabled={index === 0}
                    onClick={() => moveLine(index, -1)}
                  >
                    <ArrowUp size={16} aria-hidden="true" />
                  </IconButton>
                  <IconButton
                    label={`Descendre « ${name} »`}
                    disabled={index === draft.lines.length - 1}
                    onClick={() => moveLine(index, 1)}
                  >
                    <ArrowDown size={16} aria-hidden="true" />
                  </IconButton>
                  <IconButton label={`Retirer « ${name} »`} onClick={() => removeLine(line.key)}>
                    <Trash2 size={16} aria-hidden="true" />
                  </IconButton>
                </div>
              </div>
            </div>
          );
        })}
        <div>
          <Button
            variant="secondary"
            onClick={addLine}
            iconRight={<Plus size={16} aria-hidden="true" />}
          >
            Ajouter un tarif
          </Button>
        </div>
      </fieldset>

      <Field
        label="Note sous les tarifs"
        id={`${formId}-description`}
        multiline
        rows={2}
        value={draft.description}
        onChange={(e) => setDraft({ ...draft, description: e.target.value })}
        hint="Facultatif. Affichée en petit sous les tarifs de ce groupe."
        error={errorFor("description")}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={onRemove} className={linkButton}>
          {group ? "Supprimer le groupe" : "Abandonner"}
        </button>
        <div className="flex items-center gap-3">
          {dirty && <span className="text-sm text-charbon/60">Modifications non enregistrées</span>}
          <Button type="submit" disabled={pending || (!dirty && group !== null)}>
            {pending ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      </div>
    </form>
  );
}
