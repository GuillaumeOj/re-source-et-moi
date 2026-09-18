"use client";

import { CalendarDays, List, Plus } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { describeError, editorApi, type ManagedEvent } from "@/lib/editor/api";
import { formatFullDate } from "@/lib/format";
import { ConfirmDialog } from "./ConfirmDialog";
import { confirmSaved } from "./EditorContext";
import { EventCalendar } from "./EventCalendar";
import { draftFrom, EMPTY_EVENT, type EventDraft, EventForm } from "./EventForm";
import { EventList } from "./EventList";
import type { EventActions } from "./EventRow";
import { type Status, StatusMessage } from "./StatusMessage";
import { pill } from "./styles";

type Editing = { event: ManagedEvent | null; initial: EventDraft } | null;
type View = "liste" | "calendrier";

/**
 * The agenda tab: a paginated list or a month calendar of every workshop, and the form
 * both open.
 *
 * The view is kept in the URL (`?vue=calendrier`), so a reload or a bookmark comes back
 * to it. While the form is open the view stays mounted, only hidden, so closing the form
 * returns to the same page of the list or the same month of the calendar. `reloadKey`
 * tells the view to fetch again after anything changed.
 */
export function EventsEditor() {
  const searchParams = useSearchParams();
  const view: View = searchParams.get("vue") === "calendrier" ? "calendrier" : "liste";

  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<ManagedEvent | null>(null);
  const [status, setStatus] = useState<Status>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const reload = () => setReloadKey((key) => key + 1);

  // The native history API, not router.replace: Next keeps useSearchParams in step with
  // it, and the switch needs no server round trip. Each view fetches its own data.
  function setView(next: View) {
    const url = new URL(window.location.href);
    if (next === "calendrier") {
      url.searchParams.set("vue", "calendrier");
    } else {
      url.searchParams.delete("vue");
    }
    window.history.replaceState(null, "", url);
  }

  /** Show the result right away, and confirm once the public site has been refreshed. */
  async function afterChange() {
    reload();
    setStatus({ tone: "success", text: await confirmSaved("events") });
  }

  function openForm(event: ManagedEvent | null, initial: EventDraft) {
    setStatus(null);
    setEditing({ event, initial });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function togglePublished(event: ManagedEvent, isPublished: boolean) {
    setStatus(null);
    try {
      await editorApi.patchEvent(event.id, { is_published: isPublished });
      await afterChange();
    } catch (error) {
      setStatus({ tone: "error", text: describeError(error) });
    }
  }

  async function confirmDelete() {
    const event = deleting;
    setDeleting(null);
    if (!event) {
      return;
    }
    try {
      await editorApi.deleteEvent(event.id);
      await afterChange();
    } catch (error) {
      setStatus({ tone: "error", text: describeError(error) });
    }
  }

  const actions: EventActions = {
    onEdit: (event) => openForm(event, draftFrom(event)),
    onDuplicate: (event) => openForm(null, { ...draftFrom(event), date: "" }),
    onDelete: setDeleting,
    onTogglePublished: togglePublished,
  };

  const views: { id: View; label: string; icon: typeof List }[] = [
    { id: "liste", label: "Liste", icon: List },
    { id: "calendrier", label: "Calendrier", icon: CalendarDays },
  ];

  return (
    <>
      {editing && (
        <EventForm
          event={editing.event}
          initial={editing.initial}
          onCancel={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            afterChange();
          }}
        />
      )}

      <div hidden={editing !== null} className="flex flex-col gap-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-4xl">Ateliers</h1>
          <div className="flex flex-wrap items-center gap-3">
            <fieldset className="flex rounded-full bg-white p-1 shadow-soft">
              <legend className="sr-only">Affichage</legend>
              {views.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={view === id}
                  onClick={() => setView(id)}
                  className={pill(view === id)}
                >
                  <Icon size={16} aria-hidden="true" />
                  {label}
                </button>
              ))}
            </fieldset>
            <Button
              onClick={() => openForm(null, EMPTY_EVENT)}
              iconRight={<Plus size={18} aria-hidden="true" />}
            >
              Nouvel atelier
            </Button>
          </div>
        </div>

        <StatusMessage status={status} />

        {view === "liste" ? (
          <EventList reloadKey={reloadKey} {...actions} />
        ) : (
          <EventCalendar
            reloadKey={reloadKey}
            onCreate={(date) => openForm(null, { ...EMPTY_EVENT, date })}
            {...actions}
          />
        )}
      </div>

      {deleting && (
        <ConfirmDialog
          title="Supprimer cet atelier ?"
          message={`« ${deleting.title} » du ${formatFullDate(deleting.date)} sera définitivement supprimé. Pour le retirer du site sans le perdre, masquez-le plutôt.`}
          confirmLabel="Supprimer"
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </>
  );
}
