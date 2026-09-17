import type { Metadata } from "next";
import { LegalArticle } from "@/components/layout/LegalArticle";
import { confidentialite } from "@/content/confidentialite";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description:
    "Politique de confidentialité de l'association Re-Source Et Moi : données collectées, finalités et vos droits (RGPD).",
  alternates: { canonical: "/politique-de-confidentialite" },
};

export default function PolitiqueDeConfidentialitePage() {
  return <LegalArticle content={confidentialite} />;
}
