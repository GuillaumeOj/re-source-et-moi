import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type ExternalLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
};

/** A link to another site: opens in a new tab, without handing it `window.opener`. */
export function ExternalLink({ href, children, className }: ExternalLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn("underline decoration-1 underline-offset-4", className)}
    >
      {children}
    </a>
  );
}
