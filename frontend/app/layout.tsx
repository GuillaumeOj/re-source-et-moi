import type { Metadata } from "next";
import type { ReactNode } from "react";
import { site } from "@/content/site";
import { buildJsonLd } from "@/lib/jsonld";
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

// Structured data is built from static content — stringify once at module load.
const JSON_LD = JSON.stringify(buildJsonLd());

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={`${cormorant.variable} ${nunito.variable}`}>
      <body>
        {children}
        <script
          type="application/ld+json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD is static, server-generated
          dangerouslySetInnerHTML={{ __html: JSON_LD }}
        />
      </body>
    </html>
  );
}
