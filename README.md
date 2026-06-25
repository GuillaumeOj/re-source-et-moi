# Re-Source Et Moi — site vitrine

Landing page MVP for **Re-Source Et Moi**, an association of _kinésiologie éducative_
(Brain Gym®). French content, English code. Built to be SEO-ready and WCAG AA
accessible, and structured so editable content (Payload CMS) can be added later
without a rewrite.

## Stack

- **Next.js 16** (App Router) · React 19 · TypeScript (strict)
- **Tailwind CSS v4** (tokens in `app/globals.css` via `@theme`)
- **Bun** — package manager + scripts (dependencies pinned to **exact** versions)
- **Biome** — lint + format
- **Vitest** + React Testing Library — tests
- Fonts via `next/font`: Cormorant Garamond (display) + Nunito (body)

## Getting started

```bash
bun install
bun run dev        # http://localhost:3000
```

## Scripts

| Script              | Description                                  |
| ------------------- | -------------------------------------------- |
| `bun run dev`       | Dev server                                   |
| `bun run build`     | Production build                             |
| `bun run start`     | Serve the production build                   |
| `bun run typecheck` | `tsc --noEmit` (strict)                      |
| `bun run lint`      | Biome lint + format check                    |
| `bun run lint:fix`  | Biome safe fixes                             |
| `bun run test`      | Vitest                                       |
| `bun run verify`    | typecheck → lint → test (the pre-demo gate)  |

## Project structure

```
app/            layout (SEO metadata + JSON-LD), page, globals.css, sitemap, robots, icon
components/
  brand/        Logo (inlined SVG), LazyEight (the ∞ signature motif)
  layout/       Header, Footer
  sections/     Hero, BrainGym, Approche, Ateliers, Fondatrice, Temoignages, Faq, Newsletter, Contact
  ui/           Section, SectionHeading, Eyebrow, Button, Badge, Field, Reveal
content/        all French copy as typed data (CMS-shaped — maps onto future Payload collections)
lib/            cn (classnames), jsonld (Organization + FAQPage)
tests/          Vitest suites
```

## Editing content

All copy lives in `content/*.ts` (not hardcoded in components). Edit those files
to change text, workshop dates, FAQ, testimonials, etc. When Payload is added,
each module maps to a collection/global of the same shape.

## Not wired yet (MVP)

The **newsletter** and **contact** forms are visually complete but inert — on
submit they `preventDefault()` and show a demo acknowledgement. Integration
points are marked with `// TODO:` in `components/sections/Newsletter.tsx` and
`Contact.tsx` (connect to Payload / Resend / a form backend).

## Design & accessibility notes

- Palette, type, spacing and motion follow the brand style guide. The dominant
  surface is Rose Tendre; the Lazy 8 (∞) — the core Brain Gym movement — is the
  page's signature, drawing itself once on load and respecting
  `prefers-reduced-motion`.
- Contrast: rose-vif is reserved for **non-text** accents (it fails AA as small
  text); solid buttons and eyebrow labels use rose-sombre. The full contrast
  table is documented at the top of `app/globals.css`.

## Deploy (later)

Targets Vercel. `bun run build` produces a fully static site. Set the production
domain in `content/site.ts` (`site.url`) before launch.
