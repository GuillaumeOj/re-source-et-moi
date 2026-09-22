"use client";

import { Copy, MapPin, Pencil, Trash2 } from "lucide-react";
import type { ManagedEvent } from "@/lib/editor/api";
import { formatFullDate, formatTimeRange } from "@/lib/format";
import { IconButton } from "./IconButton";
import { Switch } from "./Switch";
import { eventRowCard } from "./styles";

export type EventActions = {
  onEdit: (event: ManagedEvent) => void;
  onDuplicate: (event: ManagedEvent) => void;
  onDelete: (event: ManagedEvent) => void;
  onTogglePublished: (event: ManagedEvent, isPublished: boolean) => void;
};

/**
 * One workshop with everything that can be done to it. Shared by the list and by the
 * calendar's day panel, so both offer the same actions.
 */
export function EventRow({
  event,
  showDate = true,
  onEdit,
  onDuplicate,
  onDelete,
  onTogglePublished,
}: { event: ManagedEvent; showDate?: boolean } & EventActions) {
  return (
    <li className={eventRowCard}>
      <div className="flex-1">
        <h3 className="font-body text-lg font-semibold text-charbon">{event.title}</h3>
        <p className="text-sm text-charbon/70">
          {showDate && (
            <>
              <time dateTime={event.date}>{formatFullDate(event.date)}</time>
              {" · "}
            </>
          )}
          {formatTimeRange(event.start_time, event.end_time)}
        </p>
        <p className="mt-1 inline-flex items-center gap-1 text-sm text-charbon/60">
          <MapPin size={14} aria-hidden="true" />
          {event.location_label || "Lieu non renseigné"}
        </p>
      </div>

      <Switch
        label={`Publier « ${event.title} »`}
        checked={event.is_published}
        onChange={(value) => onTogglePublished(event, value)}
      />

      <div className="flex gap-1">
        <IconButton label={`Modifier « ${event.title} »`} onClick={() => onEdit(event)}>
          <Pencil size={18} aria-hidden="true" />
        </IconButton>
        <IconButton label={`Dupliquer « ${event.title} »`} onClick={() => onDuplicate(event)}>
          <Copy size={18} aria-hidden="true" />
        </IconButton>
        <IconButton label={`Supprimer « ${event.title} »`} onClick={() => onDelete(event)}>
          <Trash2 size={18} aria-hidden="true" />
        </IconButton>
      </div>
    </li>
  );
}
