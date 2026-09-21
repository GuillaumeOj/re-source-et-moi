import { connection } from "next/server";
import { ateliers } from "@/content/ateliers";
import { getEvents } from "@/lib/api/client";
import { EventCard } from "./EventCard";
import { Notice } from "./Notice";

/**
 * The upcoming workshops, fetched from the backend — the first `limit` of them on the home
 * page, all of them on the agenda page.
 *
 * Its own async component rather than part of the section, so the section's shell — the
 * heading the page and the nav link point at — stays synchronous and testable. It is also
 * what keeps a backend outage local: this renders a notice, the tariffs beside it are
 * unaffected.
 */
export async function AgendaList({ limit }: { limit?: number } = {}) {
  // Defers this render to request time. The backend's URL arrives in a Vercel service
  // binding and bindings are runtime-only, so at build time there is nothing to fetch
  // from and a prerender would bake the "unavailable" copy in permanently. It has to be
  // awaited here, at the render boundary, rather than inside the fetch helper — see the
  // note in lib/api/client.ts. The responses are still cached, so this costs a render,
  // not a round-trip per visitor.
  await connection();

  const events = await getEvents().catch((error: unknown) => {
    console.error("[AgendaList] backend unreachable:", error);
    // null, not [] — "could not load" and "nothing scheduled" read differently to a
    // visitor, and only one of them is worth an apology.
    return null;
  });

  if (events === null) {
    return <Notice>{ateliers.unavailable}</Notice>;
  }
  if (events.length === 0) {
    return <Notice>{ateliers.empty}</Notice>;
  }

  return (
    <ul className="mt-12 flex flex-col gap-4">
      {events.slice(0, limit).map((event, index) => (
        <EventCard key={event.id} event={event} delayMs={index * 60} />
      ))}
    </ul>
  );
}
