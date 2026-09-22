"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  ApiError,
  describeError,
  editorApi,
  type ManagedAddress,
  messagesFor,
} from "@/lib/editor/api";
import { AddressForm, byName } from "./AddressForm";
import { ConfirmDialog } from "./ConfirmDialog";
import { FormCardSkeleton, SkeletonRegion } from "./Skeleton";
import { LoadError, type Status, StatusMessage } from "./StatusMessage";
import { useLoad } from "./useLoad";

/**
 * The addresses tab: the places workshops are held, one card each. A workshop points at
 * one of these rather than keeping its own copy, so each place is typed once and a
 * correction here reaches every workshop held there.
 */
export function AddressesEditor() {
  const {
    data: addresses,
    setData: setAddresses,
    loading,
    failed,
    reload,
  } = useLoad(editorApi.listAddresses);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<ManagedAddress | null>(null);
  const [status, setStatus] = useState<Status>(null);

  async function confirmDelete() {
    const address = deleting;
    setDeleting(null);
    if (!address) {
      return;
    }
    try {
      await editorApi.deleteAddress(address.id);
      setAddresses((list) => list?.filter((item) => item.id !== address.id) ?? null);
      // Nothing public changes: only an address no workshop uses can be deleted.
      setStatus({ tone: "success", text: "Adresse supprimée." });
    } catch (error) {
      // A workshop took this address since the list loaded: the backend says which.
      const [refusal] =
        error instanceof ApiError ? messagesFor(error.fieldErrors, "non_field_errors") : [];
      setStatus({ tone: "error", text: refusal ?? describeError(error) });
      reload();
    }
  }

  function replaceAddress(saved: ManagedAddress) {
    setAddresses(
      (list) => list && byName(list.map((item) => (item.id === saved.id ? saved : item))),
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-4xl">Adresses</h1>
        <Button
          onClick={() => setAdding(true)}
          disabled={adding || addresses === null}
          iconRight={<Plus size={18} aria-hidden="true" />}
        >
          Nouvelle adresse
        </Button>
      </div>

      <p className="text-sm text-charbon/70">
        Les lieux de vos ateliers sur place, à choisir ensuite dans le formulaire d'un atelier. Une
        modification s'applique à tous les ateliers qui s'y tiennent. Une adresse utilisée par un
        atelier ne peut pas être supprimée.
      </p>

      <StatusMessage status={status} />

      {loading && (
        <SkeletonRegion label="Chargement des adresses…" className="flex flex-col gap-8">
          <FormCardSkeleton />
          <FormCardSkeleton />
        </SkeletonRegion>
      )}
      {failed && <LoadError what="les adresses" onRetry={reload} />}
      {addresses?.length === 0 && !adding && (
        <p className="text-charbon/60">Aucune adresse enregistrée pour l'instant.</p>
      )}

      {adding && addresses !== null && (
        <section className="flex flex-col gap-2">
          <h2 className="text-2xl">Nouvelle adresse</h2>
          <AddressForm
            address={null}
            onSaved={(saved) => {
              setAddresses((list) => byName([...(list ?? []), saved]));
              setAdding(false);
              setStatus({ tone: "success", text: "Adresse enregistrée." });
            }}
            onRemove={() => setAdding(false)}
          />
        </section>
      )}

      {addresses?.map((address) => (
        <section key={address.id} className="flex flex-col gap-2">
          <h2 className="text-2xl">{address.name}</h2>
          <AddressForm
            address={address}
            onSaved={replaceAddress}
            onRemove={() => setDeleting(address)}
          />
        </section>
      ))}

      {deleting && (
        <ConfirmDialog
          title="Supprimer cette adresse ?"
          message={`« ${deleting.name} » sera définitivement supprimée.`}
          confirmLabel="Supprimer"
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
