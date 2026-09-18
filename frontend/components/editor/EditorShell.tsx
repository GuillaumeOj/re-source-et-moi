"use client";

import { ArrowLeft, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { editorApi, onSessionLost, SESSION_ENDED, type Session } from "@/lib/editor/api";
import { EditorContext } from "./EditorContext";
import { LoginForm } from "./LoginForm";
import { pill } from "./styles";

/**
 * The frame around every editor page: it decides between the login form and the editor,
 * and holds the header (back to the site, the two tabs, the account link).
 *
 * The session lives in Django. This asks for it on load, then listens for the fetch
 * layer's "session lost" (any 401) to show the login form again. After such an expiry the
 * pages stay mounted underneath, only hidden, so the form she was filling in is still
 * there once she logs back in. A deliberate logout is the one thing that unmounts them.
 */
export function EditorShell({ basePath, children }: { basePath: string; children: ReactNode }) {
  // undefined while the first check is in flight, null when logged out.
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [expired, setExpired] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    editorApi
      .session()
      .then(setSession)
      .catch(() => setSession(null));
    return onSessionLost(() => setExpired(true));
  }, []);

  const context = useMemo(() => (session ? { session, setSession } : null), [session]);

  async function handleLogout() {
    await editorApi.logout().catch(() => undefined);
    setExpired(false);
    setSession(null);
  }

  if (session === undefined) {
    return (
      <p role="status" className="p-8 text-charbon/60">
        Chargement…
      </p>
    );
  }

  const tabs = [
    { href: `${basePath}/ateliers`, label: "Ateliers" },
    { href: `${basePath}/tarifs`, label: "Tarifs" },
  ];
  const accountHref = `${basePath}/compte`;
  const showLogin = session === null || expired;

  return (
    <>
      {showLogin && (
        <LoginForm
          notice={expired ? SESSION_ENDED : undefined}
          onLoggedIn={(current) => {
            setSession(current);
            setExpired(false);
          }}
        />
      )}

      {context && (
        <EditorContext.Provider value={context}>
          <div hidden={showLogin} className="min-h-screen">
            <header className="border-rose-sombre/10 border-b bg-white">
              <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-4">
                <div className="flex flex-col">
                  <p className="font-display text-2xl leading-tight text-rose-sombre">
                    Espace d'édition
                  </p>
                  <Link
                    href="/"
                    className="inline-flex items-center gap-1 text-sm text-charbon/70 underline-offset-4 hover:text-rose-sombre hover:underline"
                  >
                    <ArrowLeft size={14} aria-hidden="true" />
                    Retour au site
                  </Link>
                </div>
                <nav aria-label="Sections de l'éditeur" className="flex gap-2">
                  {tabs.map((tab) => (
                    <Link
                      key={tab.href}
                      href={tab.href}
                      aria-current={pathname === tab.href ? "page" : undefined}
                      className={pill(pathname === tab.href)}
                    >
                      {tab.label}
                    </Link>
                  ))}
                </nav>
                <div className="flex items-center gap-2 text-sm">
                  <Link
                    href={accountHref}
                    aria-current={pathname === accountHref ? "page" : undefined}
                    title="Mon compte"
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-semibold transition-colors",
                      pathname === accountHref
                        ? "bg-rose-tendre text-rose-sombre"
                        : "text-charbon/80 hover:bg-rose-tendre",
                    )}
                  >
                    <UserRound size={16} aria-hidden="true" />
                    {context.session.username}
                    <span className="sr-only"> (mon compte)</span>
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-full px-3 py-1.5 font-semibold text-rose-sombre underline-offset-4 hover:underline"
                  >
                    Se déconnecter
                  </button>
                </div>
              </div>
            </header>
            <main className="mx-auto max-w-5xl px-4 py-10">{children}</main>
          </div>
        </EditorContext.Provider>
      )}
    </>
  );
}
