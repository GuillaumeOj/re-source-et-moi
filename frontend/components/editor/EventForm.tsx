"use client";

import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { cn } from "@/lib/cn";
import { type EventInput, editorApi, type ManagedEvent } from "@/lib/editor/api";
import { FormError, StatusMessage } from "./StatusMessage";
import { Switch } from "./Switch";
import { editorCard } from "./styles";
import { useSubmit } from "./useSubmit";
import { useUnsavedChangesWarning } from "./useUnsavedChangesWarning";

/** Every field the form edits, all required, so the draft is always a complete event. */
export type EventDraft = Required<EventInput>;

export const EMPTY_EVENT: EventDraft = {
  title: "",
  date: "",
  start_time: "",
  end_time: "",
  // Most workshops are online, which is also why the admin collapses the address block.
  location_kind: "online",
  location_label_override: "",
  online_url: "",
  address_line1: "",
  address_line2: "",
  postal_code: "",
  city: "",
  description: "",
  is_published: true,
};

/** The editable part of a stored event. Times are cut to HH:MM, which is what <input type="time"> shows. */
export function draftFrom(event: ManagedEvent): EventDraft {
  return {
    title: event.title,
    date: event.date,
    start_time: event.start_time.slice(0, 5),
    end_time: event.end_time.slice(0, 5),
    location_kind: event.location_kind,
    location_label_override: event.location_label_override,
    online_url: event.online_url,
    address_line1: event.address_line1,
    address_line2: event.address_line2,
    postal_code: event.postal_code,
    city: event.city,
    description: event.description,
    is_published: event.is_published,
  };
}

/**
 * What goes to the API. The fields of the location kind not chosen are sent empty.
 * Switching from "Sur place" to "En ligne" hides the address fields but keeps their
 * values in the draft (so switching back loses nothing). Sending those hidden values
 * would trip the backend's "an online workshop carries no address" rule on fields she
 * can no longer see.
 */
function payloadFrom(draft: EventDraft): EventInput {
  if (draft.location_kind === "online") {
    return { ...draft, address_line1: "", address_line2: "", postal_code: "", city: "" };
  }
  return { ...draft, online_url: "" };
}

type EventFormProps = {
  /** The event being edited, or null to create one. */
  event: ManagedEvent | null;
  initial: EventDraft;
  /** Called once the workshop is saved. Refreshing the public site is the caller's job. */
  onSaved: () => void;
  onCancel: () => void;
};

export function EventForm({ event, initial, onSaved, onCancel }: EventFormProps) {
  const { pending, status, errorFor, formErrors, submit } = useSubmit();
  const [draft, setDraft] = useState<EventDraft>(initial);
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);
  useUnsavedChangesWarning(dirty);

  function set<K extends keyof EventDraft>(field: K, value: EventDraft[K]) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(submitEvent: FormEvent<HTMLFormElement>) {
    submitEvent.preventDefault();
    submit(async () => {
      const payload = payloadFrom(draft);
      await (event ? editorApi.updateEvent(event.id, payload) : editorApi.createEvent(payload));
      onSaved();
    });
  }

  const online = draft.location_kind === "online";

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-labelledby="event-form-title"
      className={cn(editorCard, "gap-6")}
    >
      <h2 id="event-form-title" className="text-3xl">
        {event ? "Modifier l'atelier" : "Nouvel atelier"}
      </h2>

      <StatusMessage status={status} />
      <FormError>{formErrors.join(" ")}</FormError>

      <Field
        label="Titre"
        id="event-title"
        required
        value={draft.title}
        onChange={(e) => set("title", e.target.value)}
        error={errorFor("title")}
      />

      <fieldset className="grid gap-4 sm:grid-cols-3">
        <legend className="mb-3 font-display text-xl text-rose-sombre">Quand</legend>
        <Field
          label="Date"
          id="event-date"
          type="date"
          required
          value={draft.date}
          onChange={(e) => set("date", e.target.value)}
          error={errorFor("date")}
        />
        <Field
          label="Début"
          id="event-start"
          type="time"
          required
          value={draft.start_time}
          onChange={(e) => set("start_time", e.target.value)}
          error={errorFor("start_time")}
        />
        <Field
          label="Fin"
          id="event-end"
          type="time"
          required
          value={draft.end_time}
          onChange={(e) => set("end_time", e.target.value)}
          error={errorFor("end_time")}
        />
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-3 font-display text-xl text-rose-sombre">Où</legend>
        <div role="radiogroup" aria-label="Type de lieu" className="flex flex-wrap gap-3">
          {(
            [
              ["online", "En ligne"],
              ["onsite", "Sur place"],
            ] as const
          ).map(([kind, label]) => (
            <label
              key={kind}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold",
                draft.location_kind === kind
                  ? "border-rose-sombre bg-rose-tendre text-rose-sombre"
                  : "border-rose-sombre/15 text-charbon/80",
              )}
            >
              <input
                type="radio"
                name="location_kind"
                value={kind}
                checked={draft.location_kind === kind}
                onChange={() => set("location_kind", kind)}
                className="accent-rose-sombre"
              />
              {label}
            </label>
          ))}
        </div>

        {online ? (
          <Field
            label="Lien de visioconférence"
            id="event-online-url"
            type="url"
            placeholder="https://"
            value={draft.online_url}
            onChange={(e) => set("online_url", e.target.value)}
            hint="Facultatif."
            error={errorFor("online_url")}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field
                label="Adresse"
                id="event-address1"
                autoComplete="off"
                value={draft.address_line1}
                onChange={(e) => set("address_line1", e.target.value)}
                error={errorFor("address_line1")}
              />
            </div>
            <div className="sm:col-span-2">
              <Field
                label="Complément d'adresse"
                id="event-address2"
                autoComplete="off"
                value={draft.address_line2}
                onChange={(e) => set("address_line2", e.target.value)}
                error={errorFor("address_line2")}
              />
            </div>
            <Field
              label="Code postal"
              id="event-postal-code"
              inputMode="numeric"
              autoComplete="off"
              value={draft.postal_code}
              onChange={(e) => set("postal_code", e.target.value)}
              error={errorFor("postal_code")}
            />
            <Field
              label="Ville"
              id="event-city"
              required
              autoComplete="off"
              value={draft.city}
              onChange={(e) => set("city", e.target.value)}
              error={errorFor("city")}
            />
          </div>
        )}

        <Field
          label="Libellé du lieu"
          id="event-location-label"
          value={draft.location_label_override}
          onChange={(e) => set("location_label_override", e.target.value)}
          hint="Laisser vide pour le déduire du lieu (« En ligne », ou la ville)."
          error={errorFor("location_label_override")}
        />
      </fieldset>

      <Field
        label="Description"
        id="event-description"
        multiline
        value={draft.description}
        onChange={(e) => set("description", e.target.value)}
        hint="Facultatif. Une ou deux phrases affichées sous le titre."
        error={errorFor("description")}
      />

      <div className="flex flex-col gap-1">
        <Switch
          label="Publier sur le site"
          checked={draft.is_published}
          onChange={(value) => set("is_published", value)}
        />
        <p className="text-xs text-charbon/60">
          Masquer pour préparer un atelier sans l'afficher sur le site.
        </p>
      </div>

      <div className="flex flex-wrap justify-end gap-3">
        <Button variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}
