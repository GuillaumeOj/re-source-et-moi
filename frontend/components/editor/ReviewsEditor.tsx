"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { describeError, editorApi, type ManagedReview } from "@/lib/editor/api";
import { ConfirmDialog } from "./ConfirmDialog";
import { confirmSaved } from "./EditorContext";
import { ReviewForm } from "./ReviewForm";
import { LoadError, type Status, StatusMessage } from "./StatusMessage";
import { Switch } from "./Switch";
import { useLoad } from "./useLoad";

/**
 * The "Témoignages" tab: the reviews quoted on the home page, newest first, one card each.
 * The home page shows the three most recent published ones, so publishing a review pushes
 * the oldest of those off the page, and hiding one brings the next back.
 */
export function ReviewsEditor() {
  const { data: reviews, setData: setReviews, failed, reload } = useLoad(editorApi.listReviews);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<ManagedReview | null>(null);
  const [status, setStatus] = useState<Status>(null);

  function replaceReview(saved: ManagedReview) {
    setReviews((list) => list?.map((item) => (item.id === saved.id ? saved : item)) ?? null);
  }

  async function togglePublished(review: ManagedReview, isPublished: boolean) {
    setStatus(null);
    try {
      replaceReview(await editorApi.patchReview(review.id, { is_published: isPublished }));
      setStatus({ tone: "success", text: await confirmSaved("reviews") });
    } catch (error) {
      setStatus({ tone: "error", text: describeError(error) });
    }
  }

  async function confirmDelete() {
    const review = deleting;
    setDeleting(null);
    if (!review) {
      return;
    }
    try {
      await editorApi.deleteReview(review.id);
      setReviews((list) => list?.filter((item) => item.id !== review.id) ?? null);
      setStatus({ tone: "success", text: await confirmSaved("reviews") });
    } catch (error) {
      setStatus({ tone: "error", text: describeError(error) });
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-4xl">Témoignages</h1>
        <Button
          onClick={() => setAdding(true)}
          disabled={adding || reviews === null}
          iconRight={<Plus size={18} aria-hidden="true" />}
        >
          Nouvel avis
        </Button>
      </div>

      <p className="text-sm text-charbon/70">
        Les avis cités sur la page d'accueil. Seuls les trois plus récents parmi ceux publiés y
        apparaissent. Sans aucun avis publié, la section est masquée.
      </p>

      <StatusMessage status={status} />

      {reviews === null && !failed && (
        <p role="status" className="text-charbon/60">
          Chargement des avis…
        </p>
      )}
      {failed && <LoadError what="les avis" onRetry={reload} />}
      {reviews?.length === 0 && !adding && (
        <p className="text-charbon/60">Aucun avis enregistré pour l'instant.</p>
      )}

      {adding && reviews !== null && (
        <section className="flex flex-col gap-2">
          <h2 className="text-2xl">Nouvel avis</h2>
          <p className="text-sm text-charbon/60">
            Il est publié dès l'enregistrement. Vous pourrez le masquer ensuite.
          </p>
          <ReviewForm
            review={null}
            onSaved={async (saved) => {
              setReviews((list) => [saved, ...(list ?? [])]);
              setAdding(false);
              setStatus({ tone: "success", text: await confirmSaved("reviews") });
            }}
            onRemove={() => setAdding(false)}
          />
        </section>
      )}

      {reviews?.map((review) => (
        <section key={review.id} className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl">{review.author}</h2>
            <Switch
              label={`Publier l'avis de ${review.author}`}
              checked={review.is_published}
              onChange={(checked) => togglePublished(review, checked)}
            />
          </div>
          <ReviewForm
            review={review}
            onSaved={replaceReview}
            onRemove={() => setDeleting(review)}
          />
        </section>
      ))}

      {deleting && (
        <ConfirmDialog
          title="Supprimer cet avis ?"
          message={`L'avis de ${deleting.author} sera définitivement supprimé.`}
          confirmLabel="Supprimer"
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
