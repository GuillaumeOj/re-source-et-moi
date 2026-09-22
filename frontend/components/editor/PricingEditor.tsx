"use client";

import { ArrowDown, ArrowUp, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { describeError, editorApi, type ManagedPricingType } from "@/lib/editor/api";
import { ConfirmDialog } from "./ConfirmDialog";
import { confirmSaved } from "./EditorContext";
import { IconButton } from "./IconButton";
import { PricingGroupForm } from "./PricingGroupForm";
import { FormCardSkeleton, SkeletonRegion } from "./Skeleton";
import { LoadError, type Status, StatusMessage } from "./StatusMessage";
import { useLoad } from "./useLoad";

/**
 * The tariffs tab: one card per group, in the order the site shows them. Each card saves
 * itself. Moving a whole group up or down saves right away, because the order of the
 * cards is not part of any one card's form.
 */
export function PricingEditor() {
  const { data: groups, setData: setGroups, failed, reload } = useLoad(editorApi.listPricingTypes);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<ManagedPricingType | null>(null);
  const [status, setStatus] = useState<Status>(null);
  // One reorder at a time: two in flight could land in either order, and the saved order
  // would then not be the one on screen.
  const [moving, setMoving] = useState(false);

  async function moveGroup(index: number, offset: -1 | 1) {
    if (!groups || moving) {
      return;
    }
    setMoving(true);
    setStatus(null);
    const reordered = [...groups];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(index + offset, 0, moved);
    setGroups(reordered);
    try {
      // The whole order in one request, which the backend applies all-or-nothing. It
      // touches positions only, so unsaved edits in the cards are left alone.
      await editorApi.reorderPricingTypes(reordered.map((group) => group.id));
      setStatus({ tone: "success", text: await confirmSaved("pricing") });
    } catch (error) {
      setStatus({ tone: "error", text: describeError(error) });
      reload();
    } finally {
      setMoving(false);
    }
  }

  async function confirmDelete() {
    const group = deleting;
    setDeleting(null);
    if (!group) {
      return;
    }
    try {
      await editorApi.deletePricingType(group.id);
      setGroups((list) => list?.filter((item) => item.id !== group.id) ?? null);
      setStatus({ tone: "success", text: await confirmSaved("pricing") });
    } catch (error) {
      setStatus({ tone: "error", text: describeError(error) });
    }
  }

  function replaceGroup(saved: ManagedPricingType) {
    setGroups((list) => list?.map((item) => (item.id === saved.id ? saved : item)) ?? null);
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-4xl">Tarifs</h1>
        <Button
          onClick={() => setAdding(true)}
          disabled={adding || groups === null}
          iconRight={<Plus size={18} aria-hidden="true" />}
        >
          Nouveau groupe
        </Button>
      </div>

      <p className="text-sm text-charbon/70">
        Chaque groupe est une carte sur le site. Modifiez-le puis cliquez sur « Enregistrer ». Un
        tarif « masqué » reste ici mais n'apparaît plus sur le site.
      </p>

      <StatusMessage status={status} />

      {groups === null && !failed && (
        <SkeletonRegion label="Chargement des tarifs…" className="flex flex-col gap-8">
          <FormCardSkeleton actions={2} />
          <FormCardSkeleton actions={2} />
        </SkeletonRegion>
      )}
      {failed && <LoadError what="les tarifs" onRetry={reload} />}

      {groups?.map((group, index) => (
        <section key={group.id} className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-2xl">{group.name}</h2>
            <div className="flex">
              <IconButton
                label={`Monter le groupe « ${group.name} »`}
                disabled={moving || index === 0}
                onClick={() => moveGroup(index, -1)}
              >
                <ArrowUp size={18} aria-hidden="true" />
              </IconButton>
              <IconButton
                label={`Descendre le groupe « ${group.name} »`}
                disabled={moving || index === groups.length - 1}
                onClick={() => moveGroup(index, 1)}
              >
                <ArrowDown size={18} aria-hidden="true" />
              </IconButton>
            </div>
          </div>
          <PricingGroupForm
            group={group}
            onSaved={replaceGroup}
            onRemove={() => setDeleting(group)}
          />
        </section>
      ))}

      {adding && groups !== null && (
        <section className="flex flex-col gap-2">
          <h2 className="text-2xl">Nouveau groupe</h2>
          <PricingGroupForm
            group={null}
            createAt={groups.length}
            onSaved={async (saved) => {
              setGroups((list) => [...(list ?? []), saved]);
              setAdding(false);
              setStatus({ tone: "success", text: await confirmSaved("pricing") });
            }}
            onRemove={() => setAdding(false)}
          />
        </section>
      )}

      {deleting && (
        <ConfirmDialog
          title="Supprimer ce groupe ?"
          message={`« ${deleting.name} » et ses ${deleting.prices.length} tarif(s) seront définitivement supprimés. Pour le retirer du site sans le perdre, masquez-le plutôt.`}
          confirmLabel="Supprimer"
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
