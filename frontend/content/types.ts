// Shapes shared by several content files.

/** A labelled link — navigation, a CTA, a partner site. */
export type LinkTarget = { label: string; href: string };

/** A titled card of body copy. */
export type TextCard = { title: string; body: string };

/** A heading followed by its paragraphs. */
export type ProseSection = { heading: string; body: string[] };
