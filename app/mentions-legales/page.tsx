import type { Metadata } from "next";
import { LegalArticle } from "@/components/layout/LegalArticle";
import { mentionsLegales } from "@/content/mentions-legales";

export const metadata: Metadata = {
  title: "Mentions légales",
  description:
    "Mentions légales de l'association Re-Source Et Moi : éditeur, hébergeur et propriété intellectuelle.",
  alternates: { canonical: "/mentions-legales" },
};

export default function MentionsLegalesPage() {
  return <LegalArticle content={mentionsLegales} />;
}
