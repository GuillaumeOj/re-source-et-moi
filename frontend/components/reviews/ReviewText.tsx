"use client";

import { useId, useState } from "react";
import { temoignages } from "@/content/temoignages";
import { excerpt } from "@/lib/format";

/**
 * A review's text inside its quotation marks. With `truncate`, a text longer than
 * `temoignages.excerptLength` is cut, and a link-style button shows the rest or folds it
 * back, so the home page's cards keep a similar height.
 */
export function ReviewText({ text, truncate = false }: { text: string; truncate?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  const short = truncate ? excerpt(text, temoignages.excerptLength) : null;

  return (
    <>
      <blockquote
        id={id}
        className="font-display text-xl text-rose-sombre italic leading-snug whitespace-pre-line"
      >
        «&nbsp;{short && !expanded ? short : text}&nbsp;»
      </blockquote>
      {short ? (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={id}
          onClick={() => setExpanded((value) => !value)}
          className="-mt-2 self-start text-sm font-semibold text-rose-sombre/80 underline underline-offset-4 hover:text-rose-sombre"
        >
          {expanded ? temoignages.readLess : temoignages.readMore}
        </button>
      ) : null}
    </>
  );
}
