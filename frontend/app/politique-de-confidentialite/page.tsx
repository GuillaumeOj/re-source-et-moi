import type { Metadata } from "next";
import { LegalArticle } from "@/components/layout/LegalArticle";
import { confidentialite } from "@/content/confidentialite";
import { routes } from "@/content/routes";

export const metadata: Metadata = {
  title: routes.confidentialite.label,
  description:
    "Politique de confidentialité de l'association Re-Source Et Moi : données collectées, finalités et vos droits (RGPD).",
  alternates: { canonical: routes.confidentialite.path },
};

export default function PolitiqueDeConfidentialitePage() {
  return <LegalArticle content={confidentialite} route={routes.confidentialite} />;
}
