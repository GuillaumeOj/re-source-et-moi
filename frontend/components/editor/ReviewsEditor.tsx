"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { temoignages } from "@/content/temoignages";
import { describeError, editorApi, type ManagedReview, REVIEWS_PAGE_SIZE } from "@/lib/editor/api";
import { excerpt, formatShortDate } from "@/lib/format";
import { ConfirmDialog } from "./ConfirmDialog";
import { confirmSaved, useEditor } from "./EditorContext";
import { IconButton, IconLink } from "./IconButton";
import { Pagination } from "./Pagination";
import { Skeleton, SkeletonRegion } from "./Skeleton";
import { LoadError, type Status, StatusMessage } from "./StatusMessage";
import { Switch } from "./Switch";
import { usePagedLoad } from "./usePagedLoad";

/** How much of a review the table shows; the whole text is on its own page. */
const TABLE_EXCERPT = 80;

/** The editor's reviews tab, and the prefix of each review's own page. */
export function reviewsHref(basePath: string): string {
  return `${basePath}/temoignages`;
}

/**
 * The "Témoignages" tab: every review in a table, newest first, fifty per page. Publishing
 * and deleting happen here; editing a review, or writing a new one, on its own page
 * (…/temoignages/<id>, …/temoignages/nouveau).
 */
export function ReviewsEditor() {
  const { basePath, flash, setFlash } = useEditor();
  const listHref = reviewsHref(basePath);
  const { data, setData, loading, failed, reload, page, setPage, pageCount } = usePagedLoad(
    editorApi.listReviews,
    REVIEWS_PAGE_SIZE,
  );
  const [deleting, setDeleting] = useState<ManagedReview | null>(null);
  const [status, setStatus] = useState<Status>(null);

  // The confirmation of a save made on a review's own page, which then came back here.
  useEffect(() => {
    if (flash) {
      setStatus(flash);
      setFlash(null);
    }
  }, [flash, setFlash]);

  function replaceReview(saved: ManagedReview) {
    setData(
      (current) =>
        current && {
          ...current,
          results: current.results.map((item) => (item.id === saved.id ? saved : item)),
        },
    );
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
      // Reload rather than drop the row, so the page refills from the next one.
      reload();
      setStatus({ tone: "success", text: await confirmSaved("reviews") });
    } catch (error) {
      setStatus({ tone: "error", text: describeError(error) });
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-4xl">Témoignages</h1>
        <Button href={`${listHref}/nouveau`} iconRight={<Plus size={18} aria-hidden="true" />}>
          Nouvel avis
        </Button>
      </div>

      <p className="text-sm text-charbon/70">
        Les avis cités sur le site. Les {temoignages.homeCount} plus récents parmi ceux publiés
        apparaissent sur la page d'accueil, et tous ceux publiés sur la page « Témoignages ». Sans
        aucun avis publié, la section de la page d'accueil est masquée.
      </p>

      <StatusMessage status={status} />

      {loading && (
        <SkeletonRegion label="Chargement des avis…" className="flex flex-col gap-3">
          {[0, 1, 2].map((row) => (
            <Skeleton key={row} className="h-12 w-full" rounded="rounded-2xl" />
          ))}
        </SkeletonRegion>
      )}
      {failed && <LoadError what="les avis" onRetry={reload} />}

      {data !== null &&
        (data.results.length === 0 ? (
          <p className="text-charbon/60">Aucun avis enregistré pour l'instant.</p>
        ) : (
          <div className="overflow-x-auto rounded-3xl bg-white shadow-soft">
            {/* Cell padding set once here rather than on each of the cells. */}
            <table className="w-full min-w-[44rem] text-left text-sm [&_td]:px-5 [&_td]:py-3 [&_th]:px-5 [&_th]:py-3 [&_th]:font-semibold">
              <thead className="border-rose-sombre/10 border-b text-charbon/60">
                <tr>
                  <th scope="col">Nom</th>
                  <th scope="col">Description</th>
                  <th scope="col">Avis</th>
                  <th scope="col" className="whitespace-nowrap">
                    Ajouté le
                  </th>
                  <th scope="col">Publication</th>
                  <th scope="col">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.results.map((review) => {
                  // Not prefetched, like IconLink: one request per row otherwise.
                  const href = `${listHref}/${review.id}`;
                  return (
                    <tr key={review.id} className="border-rose-sombre/10 border-b last:border-b-0">
                      <th scope="row" className="text-rose-sombre">
                        <Link
                          href={href}
                          prefetch={false}
                          className="underline-offset-4 hover:underline"
                        >
                          {review.author}
                        </Link>
                      </th>
                      <td className="text-charbon/70">{review.context || "—"}</td>
                      <td className="text-charbon/80">
                        {excerpt(review.text, TABLE_EXCERPT) ?? review.text}
                      </td>
                      <td className="whitespace-nowrap text-charbon/70">
                        <time dateTime={review.created_at}>
                          {formatShortDate(review.created_at)}
                        </time>
                      </td>
                      <td>
                        <Switch
                          label={`Publier l'avis de ${review.author}`}
                          checked={review.is_published}
                          onChange={(checked) => togglePublished(review, checked)}
                        />
                      </td>
                      <td>
                        <div className="flex justify-end">
                          <IconLink label={`Modifier l'avis de ${review.author}`} href={href}>
                            <Pencil size={18} aria-hidden="true" />
                          </IconLink>
                          <IconButton
                            label={`Supprimer l'avis de ${review.author}`}
                            opens="dialog"
                            onClick={() => setDeleting(review)}
                          >
                            <Trash2 size={18} aria-hidden="true" />
                          </IconButton>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}

      <Pagination page={page} pageCount={pageCount} onChange={setPage} />

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
