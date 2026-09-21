import type { Metadata } from "next";
import type { ReactNode } from "react";
import { JsonLd } from "@/components/seo/JsonLd";
import { site } from "@/content/site";
import { buildOrganizationJsonLd } from "@/lib/jsonld";
import { cormorant, nunito } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — Activez votre potentiel par le mouvement`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  keywords: [
    "éducation kinesthésique",
    "Brain Gym",
    "Le Soi en Mouvement",
    "Tai-Chi",
    "mouvement",
    "apprentissage",
    "association",
    "ECAP",
    "ateliers",
  ],
  authors: [{ name: site.name }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: site.locale,
    url: site.url,
    siteName: site.name,
    title: `${site.name} — Activez votre potentiel par le mouvement`,
    description: site.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — Activez votre potentiel par le mouvement`,
    description: site.description,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={`${cormorant.variable} ${nunito.variable}`}>
      <body>
        {children}
        <JsonLd data={buildOrganizationJsonLd()} />
      </body>
    </html>
  );
}
