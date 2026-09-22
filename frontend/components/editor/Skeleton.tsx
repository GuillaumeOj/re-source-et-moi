import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { editorCard } from "./styles";

/**
 * One pulsing placeholder shape. The caller gives it its size, and its corners when it
 * stands for something that isn't a pill (cn doesn't merge conflicting classes).
 */
export function Skeleton({
  className,
  rounded = "rounded-full",
}: {
  className?: string;
  rounded?: string;
}) {
  return (
    <div aria-hidden="true" className={cn("animate-pulse bg-rose-tendre/70", rounded, className)} />
  );
}

/**
 * The live region around a set of skeletons. The shapes are hidden from screen readers,
 * so the label is what they announce: "Chargement des ateliers…".
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
    <div role="status" aria-busy="true" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

/** The shape of an EventRow: title, date, place, the publish switch and three actions. */
export function EventRowSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-3xl bg-white p-5 shadow-soft sm:flex-row sm:items-center">
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-5 w-2/3 max-w-xs" />
        <Skeleton className="h-4 w-1/2 max-w-56" />
        <Skeleton className="h-4 w-1/3 max-w-40" />
      </div>
      <Skeleton className="h-6 w-11" />
      <div className="flex gap-1">
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-10 w-10" />
      </div>
    </div>
  );
}

/** The shape of a titled form card: an address, a pricing group. */
export function FormCardSkeleton({ actions = 0 }: { actions?: number }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-8 w-56" />
        {actions > 0 && (
          <div className="flex gap-1">
            {Array.from({ length: actions }, (_, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static placeholders
              <Skeleton key={index} className="h-10 w-10" />
            ))}
          </div>
        )}
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

/** The editor's frame while the session check is in flight: header, then a page. */
export function ShellSkeleton() {
  return (
    <SkeletonRegion label="Chargement…" className="min-h-screen">
      <div className="border-rose-sombre/10 border-b bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-4">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-7 w-44" />
            <Skeleton className="h-4 w-28" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-20" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-8 w-32" />
          </div>
        </div>
      </div>
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-4 w-full max-w-2xl" />
        <div className="flex flex-col gap-3">
          <EventRowSkeleton />
          <EventRowSkeleton />
          <EventRowSkeleton />
        </div>
      </div>
    </SkeletonRegion>
  );
}
