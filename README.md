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

One command brings up everything — Postgres, Django and the site:

```bash
cd backend
uv run tox -e dev        # site http://localhost:3001 · API http://localhost:8003
```

That is the normal way to run this project. The site's workshop dates and tariffs come
from the backend, so running the frontend on its own shows the "momentanément
indisponible" notices in that section until a backend is reachable.

To run just the site against a backend you started separately:

```bash
cd frontend
bun install
API_BASE_URL=http://localhost:8003 bun run dev        # http://localhost:3000
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

The **workshop dates and the tariffs are the exception**: they come from the backend so
Cécile can change them in the Django admin without a deploy. `content/ateliers.ts` and
`content/tarifs.ts` keep only the editorial copy around those lists — the headings, the
empty-agenda line, and the notice shown when the backend cannot be reached. That notice
deliberately names no dates and no amounts: a stale price is worse than no price, because
someone could arrive expecting it.

### How the site gets its data

`components/sections/Workshops.tsx` is an async Server Component. It fetches through
`lib/api/client.ts`, whose types come from `lib/api/generated.ts` — generated from the
backend's OpenAPI schema by `bun run codegen`, committed, and diffed in CI so the two
sides cannot drift.

It fetches on the server, not in the browser, so the dates and prices are in the HTML a
crawler sees. Responses are cached for five minutes, so a blip shorter than that is
invisible — the cached copy is served without calling the backend at all. Once the entry
has expired the next request re-fetches, and if that fails the section shows the
unavailable notice rather than anything out of date. Next does not serve an expired entry
as a fallback, so the notice is what an outage longer than the window looks like.

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

## Backend

Django + DRF, holding the workshop agenda and the tariffs. It exposes two read-only public
endpoints and a Django admin, which is the entire editing UI — there are no site user
accounts.

### Stack

- **Django 6** + **Django REST Framework**, Python 3.13
- **uv** for dependencies (exact pins, `uv.lock` committed) · **ruff** · **ty** · **pytest**
- **tox** as the entry point for everything
- **PostgreSQL 16**, in Docker locally and Neon in production

### Getting started

Everything runs through tox, from `backend/`:

| Command                  | What it does                                                    |
| ------------------------ | --------------------------------------------------------------- |
| `uv run tox`             | The gate: pytest (≥ 90% coverage), ruff, ty                      |
| `uv run tox -e dev`      | Start Postgres + Django + Next in Docker, then tail logs         |
| `uv run tox -e dev-down` | Stop the dev stack (the database volume is kept)                 |
| `uv run tox -e seed`     | Fill the dev database with a starter agenda and tariff set       |
| `uv run tox -e openapi`  | Regenerate the committed `schema.yml`                            |
| `uv run tox -e lint`     | ruff check + format check                                        |
| `uv run tox -e type`     | ty                                                               |

The dev stack serves the site on **http://localhost:3001**, the API on
**http://localhost:8003**, and the admin on **http://localhost:8003/api/admin/**. Create a
login with `uv run python manage.py createsuperuser`.

Ports (5445 dev db, 5436 test db, 8003 Django, 3001 Next) deliberately avoid
`ma-garde-sereine`'s, so both stacks can run at once. The two Compose projects are pinned
by name (`rsm-development`, `rsm-tests`) so every git worktree shares one stack instead of
growing its own; `backend/scripts/dev_stack.py` resolves the conflicts that pinning creates
and never removes a volume.

### API

| Endpoint                  | Returns                                                     |
| ------------------------- | ----------------------------------------------------------- |
| `GET /api/events/`        | Published, still-upcoming workshops, soonest first           |
| `GET /api/pricing-types/` | Published tariff groups, each with its published lines nested |
| `GET /api/health/`        | Liveness probe                                               |
| `GET /api/schema/`        | OpenAPI schema (`/api/schema/swagger/` to browse it)          |

Both list endpoints are public and unpaginated. Values go out machine-readable — ISO dates
and times, a numeric amount and an `on_demand` flag — and the frontend does the French
formatting with `Intl`. Nothing in the API is a display string.

## Deploy

One Vercel project, two **Vercel Services** behind one domain: `/api/*` goes to Django,
everything else to Next. See `vercel.json`.

Set the production domain in `frontend/content/site.ts` (`site.url`) before launch.

### First-time setup

1. **Switch the Vercel project to Services.** It is currently a plain Next.js project
   rooted at `/`; it needs framework `services` with root `/`.
2. **Add Neon Postgres** from the Vercel Marketplace. It injects `DATABASE_URL` (pooled,
   used at runtime) and `DATABASE_URL_UNPOOLED` (direct). `backend/build.sh` migrates
   through the unpooled endpoint on purpose: Neon's pooler in transaction mode is
   unreliable for DDL and migration advisory locks.
3. **Set the backend's environment variables** per environment — `SECRET_KEY`,
   `ADMIN_PATH`, `DJANGO_ALLOWED_HOSTS`, `CSRF_TRUSTED_ORIGINS`, `CONN_MAX_AGE=0`. The
   first two have no default on a deployment, so a missing one fails at startup rather
   than silently running on a dev placeholder.
4. **Create the admin login** once against production, from your machine:
   `vercel pull --environment=production`, then
   `uv run --env-file .vercel/.env.production.local python manage.py createsuperuser`.
   Two traps recorded from `ma-garde-sereine`: never `grep`/`cut` that env file (Vercel
   quotes values and `django-environ` then fails with "Engine not recognized from url"),
   and `SECRET_KEY` comes back blank because it is marked Sensitive — pass
   `SECRET_KEY=throwaway` inline.

### How the frontend reaches the backend

Through a **service binding**, declared on the frontend service in `vercel.json`, which
injects `BACKEND_INTERNAL_URL`. That call is internal: it skips the CDN, the firewall and
Deployment Protection — which matters, because a preview deployment calling its own public
URL would get a 401.

Two consequences worth knowing:

- Bindings are injected **at runtime only, never during the build**, which is why
  `Workshops.tsx` calls `connection()`. Without it the section would be prerendered at
  build time with no binding available, baking the "unavailable" notice into the page.
- If Django rejects the binding's hostname with `DisallowedHost`, add that host to
  `DJANGO_ALLOWED_HOSTS`. This is the one part of the deploy that has not been exercised
  against a real Vercel project yet.

Locally there is no binding, so `API_BASE_URL` is set explicitly in `docker-compose.yml`.
