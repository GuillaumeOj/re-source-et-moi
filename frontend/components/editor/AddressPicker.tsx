"use client";

import { useState } from "react";
import { FieldShell, fieldAria, fieldControl } from "@/components/ui/Field";
import { cn } from "@/lib/cn";
import { editorApi, type ManagedAddress } from "@/lib/editor/api";
import { AddressForm, byName } from "./AddressForm";
import { LoadError } from "./StatusMessage";
import { useLoad } from "./useLoad";

/** The last option, which opens the new-address form instead of choosing one. */
const NEW_ADDRESS = "new";

type AddressPickerProps = {
  /** The chosen address's id, or null. */
  value: string | null;
  onChange: (id: string | null) => void;
  error?: string;
};

/**
 * The saved address an on-site workshop is held at. Rendered only for an on-site
 * workshop, so the list is fetched only when there is something to pick.
 *
 * "Nouvelle adresse…" opens a small form in place, so a new place never means leaving a
 * half-filled workshop to go and create it.
 */
export function AddressPicker({ value, onChange, error }: AddressPickerProps) {
  const {
    data: addresses,
    setData: setAddresses,
    failed,
    reload,
  } = useLoad(editorApi.listAddresses);
  const [creating, setCreating] = useState(false);
  const chosen = addresses?.find((address) => address.id === value);

  function created(saved: ManagedAddress) {
    setAddresses((list) => byName([...(list ?? []), saved]));
    onChange(saved.id);
    setCreating(false);
  }

  return (
    <div className="flex flex-col gap-3">
      <FieldShell label="Adresse" id="event-address" error={error} hint={chosen?.one_line}>
        <select
          id="event-address"
          required
          disabled={addresses === null || creating}
          value={value ?? ""}
          onChange={(e) => {
            if (e.target.value === NEW_ADDRESS) {
              setCreating(true);
            } else {
              onChange(e.target.value || null);
            }
          }}
          className={cn(fieldControl, error && "border-rose-sombre")}
          {...fieldAria("event-address", chosen?.one_line, error)}
        >
          <option value="">
            {addresses === null ? "Chargement des adresses…" : "Choisir une adresse…"}
          </option>
          {addresses?.map((address) => (
            <option key={address.id} value={address.id}>
              {address.name} — {address.city}
            </option>
          ))}
          <option value={NEW_ADDRESS}>+ Nouvelle adresse…</option>
        </select>
      </FieldShell>
      {failed && <LoadError what="les adresses" onRetry={reload} />}
      {creating && (
        <AddressForm address={null} nested onSaved={created} onRemove={() => setCreating(false)} />
      )}
    </div>
  );
}
