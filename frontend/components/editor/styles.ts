import { cn } from "@/lib/cn";

/** The white rounded card every editor form sits in. */
export const editorCard = "flex flex-col gap-5 rounded-3xl bg-white p-6 shadow-soft sm:p-8";

/** A button that reads as a text link: "Mot de passe oublié ?", "Supprimer le groupe". */
export const linkButton =
  "self-start text-sm font-semibold text-rose-sombre underline-offset-4 hover:underline";

/** A rounded pill in a row of choices: the header tabs, the list/calendar toggle. */
export function pill(active: boolean): string {
  return cn(
    "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
    active ? "bg-rose-sombre text-creme" : "text-rose-sombre hover:bg-rose-tendre",
  );
}

/** The white card of one workshop in the list, and of its loading placeholder. */
export const eventRowCard =
  "flex flex-col gap-4 rounded-3xl bg-white p-5 shadow-soft sm:flex-row sm:items-center";
