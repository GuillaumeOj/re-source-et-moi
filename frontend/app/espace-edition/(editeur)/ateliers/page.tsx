import { Suspense } from "react";
import { EventsEditor } from "@/components/editor/EventsEditor";

export default function EditorEventsPage() {
  // EventsEditor reads the view (?vue=…) with useSearchParams, which needs a boundary.
  return (
    <Suspense>
      <EventsEditor />
    </Suspense>
  );
}
