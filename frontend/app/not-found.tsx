import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Page introuvable",
  robots: { index: false, follow: true },
};

/**
 * The site's 404, in French and in the site's own frame, in place of Next's English
 * default. Every unknown URL lands here, including the editor's internal path when it is
 * requested directly (see proxy.ts).
 */
export default function NotFound() {
  return (
    <>
      <Header />
      <div className="flex min-h-dvh flex-col">
        <main className="flex flex-1 items-center bg-creme text-charbon">
          <div className="mx-auto max-w-2xl px-6 pt-28 pb-20 text-center md:pt-36">
            <h1 className="text-[2rem] font-normal md:text-5xl">Page introuvable</h1>
            <p className="mt-4 text-lg text-charbon/80">
              Cette page n'existe pas, ou plus. Le reste du site vous attend.
            </p>
            <div className="mt-8 flex justify-center">
              <Button href="/">Retour à l'accueil</Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
