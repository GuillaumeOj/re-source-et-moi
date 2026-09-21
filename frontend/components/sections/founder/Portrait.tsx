import Image from "next/image";
import { fondatrice } from "@/content/fondatrice";
import { cn } from "@/lib/cn";

type PortraitProps = {
  sizes: string;
  /** Fetch it straight away — only where it is the first thing on screen (/a-propos). */
  preload?: boolean;
  className?: string;
};

/** Cécile's portrait, 4:5 (the source is already cropped to it). */
export function Portrait({ sizes, preload, className }: PortraitProps) {
  return (
    <div
      className={cn(
        "relative aspect-[4/5] overflow-hidden rounded-3xl bg-creme shadow-soft-lg",
        className,
      )}
    >
      <Image
        src={fondatrice.photoSrc}
        alt={fondatrice.photoAlt}
        fill
        sizes={sizes}
        preload={preload}
        className="object-cover"
      />
    </div>
  );
}
