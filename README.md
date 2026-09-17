# Re-Source Et Moi — site vitrine

Landing page for **Re-Source Et Moi**, an association of _kinésiologie éducative_
(Brain Gym®). French content, English code. Built to be SEO-ready and WCAG AA
accessible.

The repository holds two stacks:

| Directory   | What it is                                                 |
| ----------- | ---------------------------------------------------------- |
| `frontend/` | The public site — Next.js 16 (App Router), Bun, Biome       |
| `backend/`  | Editable agenda & pricing — Django + DRF, uv, ruff, pytest  |

## Frontend

### Stack

- **Next.js 16** (App Router) · React 19 · TypeScript (strict)
- **Tailwind CSS v4** (tokens in `app/globals.css` via `@theme`)
- **Bun** — package manager + scripts (dependencies pinned to **exact** versions)
- **Biome** — lint + format
- **Vitest** + React Testing Library — tests
- Fonts via `next/font`: Cormorant Garamond (display) + Nunito (body)

### Getting started

```bash
cd frontend
bun install
bun run dev        # http://localhost:3000
```

### Scripts

All run from `frontend/`.

| Script              | Description                                 |
| ------------------- | ------------------------------------------- |
| `bun run dev`       | Dev server                                  |
| `bun run build`     | Production build                            |
| `bun run start`     | Serve the production build                  |
| `bun run typecheck` | `tsc --noEmit` (strict)                     |
| `bun run lint`      | Biome lint + format check                   |
| `bun run lint:fix`  | Biome safe fixes                            |
| `bun run test`      | Vitest                                      |
| `bun run verify`    | typecheck → lint → test (the pre-demo gate) |

### Project structure

```
frontend/
  app/            layout (SEO metadata + JSON-LD), page, globals.css, sitemap, robots,
                  icon, plus the two legal pages
  components/
    brand/        Logo (inlined SVG), LazyEight (the ∞ signature motif)
    layout/       Header, Footer, LegalArticle, StepIndicator
    sections/     Hero, Objet, EducationKinesthesique, Approach, Workshops, Founder,
                  Testimonials, Faq, Contact
    ui/           Section, SectionHeading, Eyebrow, Button, Card, Field, Reveal
  content/        all French copy as typed data modules
  lib/            cn (classnames), jsonld (Organization + FAQPage)
  tests/          Vitest suites
```

### Editing content

Static copy lives in `content/*.ts`, not hardcoded in components — edit those files to
change text, the FAQ, testimonials, and so on.

### Not wired yet

The **contact** form is visually complete but inert — on submit it `preventDefault()`s and
shows a demo acknowledgement. The integration point is marked with a `// TODO:` in
`components/sections/Contact.tsx`.

### Design & accessibility notes

- Palette, type, spacing and motion follow the brand style guide. The dominant
  surface is Rose Tendre; the Lazy 8 (∞) — the core Brain Gym movement — is the
  page's signature, drawing itself once on load and respecting
  `prefers-reduced-motion`.
- Contrast: rose-vif is reserved for **non-text** accents (it fails AA as small
  text); solid buttons and eyebrow labels use rose-sombre. The full contrast
  table is documented at the top of `app/globals.css`.

## Deploy

Targets Vercel. Set the production domain in `frontend/content/site.ts` (`site.url`)
before launch.
