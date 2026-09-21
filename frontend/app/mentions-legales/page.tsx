import type { Metadata } from "next";
import { LegalArticle } from "@/components/layout/LegalArticle";
import { mentionsLegales } from "@/content/mentions-legales";
import { routes } from "@/content/routes";

export const metadata: Metadata = {
  title: routes.mentionsLegales.label,
  description:
    "Mentions légales de l'association Re-Source Et Moi : éditeur, hébergeur et propriété intellectuelle.",
  alternates: { canonical: routes.mentionsLegales.path },
};

export default function MentionsLegalesPage() {
  return <LegalArticle content={mentionsLegales} route={routes.mentionsLegales} />;
}
