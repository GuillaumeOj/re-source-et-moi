import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { editorCard, eventRowCard } from "./styles";

/**
 * One placeholder shape. The caller gives it its size, and its corners when it stands for
 * something that isn't a pill (cn doesn't merge conflicting classes). It doesn't pulse on
 * its own: the SkeletonRegion around it does, once for all its shapes.
 */
export function Skeleton({
  className,
  rounded = "rounded-full",
}: {
  className?: string;
  rounded?: string;
}) {
  return <div aria-hidden="true" className={cn("bg-rose-tendre/70", rounded, className)} />;
}

/**
 * The live region around a set of skeletons, and their one pulse. The shapes are hidden
 * from screen readers, so the label is what they announce: "Chargement des ateliers…".
 * No aria-busy here: on a live region it tells screen readers to hold the announcement
 * until it clears, and this region is gone by then.
 */
export function SkeletonRegion({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div role="status" className={cn("animate-pulse", className)}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

/** A round icon button: edit, duplicate, move up… */
function IconSkeleton() {
  return <Skeleton className="h-10 w-10" />;
}

/** The shape of an EventRow: title, date, place, the publish switch and three actions. */
export function EventRowSkeleton() {
  return (
    <div className={eventRowCard}>
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-5 w-2/3 max-w-xs" />
        <Skeleton className="h-4 w-1/2 max-w-56" />
        <Skeleton className="h-4 w-1/3 max-w-40" />
      </div>
      <Skeleton className="h-6 w-11" />
      <div className="flex gap-1">
        <IconSkeleton />
        <IconSkeleton />
        <IconSkeleton />
      </div>
    </div>
  );
}

/**
 * The shape of a titled form card: an address, a pricing group with its arrows, or a
 * review with its publish switch.
 */
export function FormCardSkeleton({ aside }: { aside?: "arrows" | "switch" }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-8 w-56" />
        {aside === "arrows" && (
          <div className="flex gap-1">
            <IconSkeleton />
            <IconSkeleton />
          </div>
        )}
        {aside === "switch" && <Skeleton className="h-6 w-11" />}
      </div>
      <div className={editorCard}>
        {[0, 1, 2].map((field) => (
          <div key={field} className="flex flex-col gap-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-12 w-full" rounded="rounded-2xl" />
          </div>
        ))}
        <Skeleton className="h-11 w-36" />
      </div>
    </div>
  );
}
