import { ChevronRight } from "lucide-react";
import { type Route, routes } from "@/content/routes";

/**
 * "Accueil › <page>" above a standalone page's title. Every public page sits one level
 * under the home page, so the trail is always two steps; the last one is the current page
 * and is not a link. Its structured data is emitted by PageShell.
 */
export function Breadcrumb({ route }: { route: Route }) {
  return (
    <nav aria-label="Fil d'Ariane" className="mb-8">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-charbon/60">
        <li className="flex items-center gap-1.5">
          <a
            href={routes.home.path}
            className="font-semibold text-rose-sombre/80 hover:text-rose-sombre"
          >
            {routes.home.label}
          </a>
          <ChevronRight size={14} aria-hidden="true" />
        </li>
        <li aria-current="page">{route.label}</li>
      </ol>
    </nav>
  );
}
