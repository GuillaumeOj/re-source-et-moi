"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A control that writes its value in one shape and stores it in another.
 *
 * The date field holds "14/06/2026" and stores "2026-06-14"; the time field holds an hour
 * and a minute and stores "10:30". Both need the same two things: something half-written
 * survives while it is being written, and a value arriving from outside — the form being
 * opened on another workshop — replaces it.
 *
 * Telling those apart is what `emitted` is for. The value coming back down is usually this
 * control's own last push, and re-deriving the draft from it would rewrite what is being
 * typed, under the cursor: "14/6/2026" would become "14/06/2026" mid-word, and a date cut
 * back to "14/06" — which stores nothing — would spring back to the last complete one.
 *
 * @param value    the stored value, as the form holds it
 * @param onChange what to call when this control has a new one
 * @param toDraft  the stored value as this control writes it
 */
export function useDraftValue<D>(
  value: string,
  onChange: (value: string) => void,
  toDraft: (value: string) => D,
) {
  const [draft, setDraft] = useState<D>(() => toDraft(value));
  const emitted = useRef(value);

  useEffect(() => {
    if (value !== emitted.current) {
      emitted.current = value;
      setDraft(toDraft(value));
    }
  }, [value, toDraft]);

  /** Write `nextDraft`, and store `nextValue` — empty when the draft isn't a value yet. */
  function push(nextDraft: D, nextValue: string) {
    setDraft(nextDraft);
    emitted.current = nextValue;
    onChange(nextValue);
  }

  return [draft, push] as const;
}
