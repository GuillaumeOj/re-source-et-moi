"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { cn } from "@/lib/cn";
import { ApiError, describeError, editorApi, type ManagedReview } from "@/lib/editor/api";
import { ConfirmDialog } from "./ConfirmDialog";
import { confirmSaved, useEditor } from "./EditorContext";
import { ReviewForm } from "./ReviewForm";
import { reviewsHref } from "./ReviewsEditor";
import { FormCardSkeleton, SkeletonRegion } from "./Skeleton";
import { LoadError, type Status, StatusMessage } from "./StatusMessage";
import { linkButton } from "./styles";
import { useLoad } from "./useLoad";

/**
 * One review on its own page, reached from the table: the review `id`, or a new one when
 * null. A saved edit stays here with its confirmation; a creation or a deletion goes back
 * to the table, which shows it.
 */
export function ReviewEditor({ id }: { id: string | null }) {
  const listHref = reviewsHref(useEditor().basePath);
  return (
    <div className="flex flex-col gap-6">
      <Link href={listHref} className={cn(linkButton, "inline-flex items-center gap-1")}>
        <ArrowLeft size={14} aria-hidden="true" />
        Tous les témoignages
      </Link>
      {id === null ? (
        <NewReview listHref={listHref} />
      ) : (
        <ExistingReview id={id} listHref={listHref} />
      )}
    </div>
  );
}

/** Shown in place of the form while the change is stored and the public site refreshes. */
function Leaving({ text }: { text: string }) {
  return (
    <p role="status" className="text-charbon/70">
      {text}
    </p>
  );
}

function NewReview({ listHref }: { listHref: string }) {
  const router = useRouter();
  const { setFlash } = useEditor();
  // The form goes as soon as the review is stored: left on screen while the site
  // refreshes, a second "Enregistrer" would create the review twice.
  const [saved, setSaved] = useState(false);
  return (
    <>
      <h1 className="text-4xl">Nouvel avis</h1>
      <p className="text-sm text-charbon/60">
        Il est publié dès l'enregistrement. Vous pourrez le masquer ensuite.
      </p>
      {saved ? (
        <Leaving text="Enregistrement…" />
      ) : (
        <ReviewForm
          review={null}
          onSaved={async () => {
            setSaved(true);
            setFlash({ tone: "success", text: await confirmSaved("reviews") });
            router.push(listHref);
          }}
          onRemove={() => router.push(listHref)}
        />
      )}
    </>
  );
}

/** Editing, asking to confirm a deletion, or deleting (the form then can't act again). */
type Phase = "editing" | "confirming" | "deleting";

function ExistingReview({ id, listHref }: { id: string; listHref: string }) {
  const router = useRouter();
  const { setFlash } = useEditor();
  const [missing, setMissing] = useState(false);
  const fetchReview = useCallback(() => editorApi.getReview(id), [id]);
  const {
    data: review,
    setData,
    failed,
    reload,
  } = useLoad(fetchReview, null, (error) => {
    if (error instanceof ApiError && error.status === 404) {
      setMissing(true);
      return true;
    }
    return false;
  });
  const [phase, setPhase] = useState<Phase>("editing");
  const [status, setStatus] = useState<Status>(null);

  async function confirmDelete(target: ManagedReview) {
    setPhase("deleting");
    try {
      await editorApi.deleteReview(target.id);
      setFlash({ tone: "success", text: await confirmSaved("reviews") });
      router.push(listHref);
    } catch (error) {
      setPhase("editing");
      setStatus({ tone: "error", text: describeError(error) });
    }
  }

  if (missing) {
    return <p className="text-charbon/70">Cet avis n'existe pas, ou a été supprimé.</p>;
  }
  if (failed) {
    return <LoadError what="l'avis" onRetry={reload} />;
  }
  if (!review) {
    return (
      <SkeletonRegion label="Chargement de l'avis…">
        <FormCardSkeleton />
      </SkeletonRegion>
    );
  }

  return (
    <>
      <h1 className="text-4xl">Avis de {review.author}</h1>
      <StatusMessage status={status} />
      {phase === "deleting" ? (
        <Leaving text="Suppression…" />
      ) : (
        <ReviewForm review={review} onSaved={setData} onRemove={() => setPhase("confirming")} />
      )}
      {phase === "confirming" && (
        <ConfirmDialog
          title="Supprimer cet avis ?"
          message={`L'avis de ${review.author} sera définitivement supprimé.`}
          confirmLabel="Supprimer"
          onConfirm={() => confirmDelete(review)}
          onCancel={() => setPhase("editing")}
        />
      )}
    </>
  );
}
