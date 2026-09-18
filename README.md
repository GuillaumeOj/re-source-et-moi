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
Cécile can change them in her editor without a deploy (see below). `content/ateliers.ts` and
`content/tarifs.ts` keep only the editorial copy around those lists — the headings, the
empty-agenda line, and the notice shown when the backend cannot be reached. That notice
deliberately names no dates and no amounts: a stale price is worse than no price, because
someone could arrive expecting it.

### Cécile's editor

A French editing interface for the workshops and the tariffs, part of the site itself at a
secret URL: `/<EDITOR_PATH>`, e.g. `/admin-3f2c…` (`/admin-local` in development). It
replaces the Django admin for everyday use. The admin stays available as a fallback.

- **Hidden.** The path comes from the server-only `EDITOR_PATH` variable and appears in
  no committed file, build output, sitemap or robots.txt. `proxy.ts` rewrites it onto
  `app/espace-edition/`. It answers the internal name, and every other unknown URL, with
  the same prerendered 404, so probing cannot tell the editor exists. The pages carry
  `noindex` and `no-referrer` in both meta tags and headers.
- **Locked.** Hiding is not the protection: every read and write needs a Django staff
  login. The browser calls `/api/auth/*` and `/api/manage/*` same-origin, with a session
  cookie and CSRF, and login attempts are throttled.
- **Live.** After each save, the `refreshPublicSite` Server Action (`lib/editor/refresh.ts`)
  checks the session with Django, then expires the public feed's cache tag. The change is
  on the site at the next request instead of up to five minutes later.

What it offers:

- **Ateliers** (`/<EDITOR_PATH>/ateliers`), as a paginated list (upcoming soonest first,
  or past latest first, 20 per page) or a month calendar (`?vue=calendrier`). In the
  calendar, clicking a workshop opens it, and clicking a day lists that day's workshops
  with an "Ajouter un atelier ce jour" button.
- **Tarifs**: one card per group, its lines edited and saved with it.
- **Mon compte** (the username in the header): username, e-mail and password, each change
  confirmed with the current password.
- **Mot de passe oublié ?** on the login form: a reset link sent by e-mail through Brevo,
  valid two hours and usable once. The page it opens (`/<EDITOR_PATH>/reinitialiser`) sits
  outside the login gate and removes the token from the address bar. Locally there is no
  Brevo key, so the e-mail is printed in the Django container's log.
- **Retour au site** in the header.

Locally, `next.config.ts` rewrites `/api/*` to `API_BASE_URL` so the editor is same-origin
there too. It also disables Next's trailing-slash redirect, which would otherwise strip the
slash every Django URL ends with.

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
endpoints, the staff-only endpoints behind Cécile's editor, and a Django admin kept as a
fallback. There are no site user accounts.

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
| `uv run tox -e seed`     | Fill the dev database with an admin login, an agenda and tariffs |
| `uv run tox -e openapi`  | Regenerate the committed `schema.yml`                            |
| `uv run tox -e lint`     | ruff check + format check                                        |
| `uv run tox -e type`     | ty                                                               |

The dev stack serves the site on **http://localhost:3001**, the editor on
**http://localhost:3001/admin-local**, the API on **http://localhost:8003**, and the admin
on **http://localhost:8003/api/admin/**.

`uv run tox -e seed` creates the login for both the editor and the admin, along with the
demo content: **`admin` / `admin`**. Re-running it resets that password, which is how you recover it. Override the
credentials with `DJANGO_SUPERUSER_USERNAME` / `_EMAIL` / `_PASSWORD` (the same variables
Django's own `createsuperuser` reads). The command refuses to run anywhere that isn't local
development, so the weak default can never reach a deployment.

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
| `GET /api/auth/csrf/`     | Sets the CSRF cookie (the editor calls it before its first write) |
| `GET /api/auth/session/`  | The logged-in staff member; 401 without a session, 403 for a non-staff one |
| `GET /api/auth/password-rules/` | Django's password rules, in French, for the editor's hints |
| `POST /api/auth/login/`, `/api/auth/logout/` | Session login (throttled to 10/min) and logout |
| `PUT /api/auth/account/`  | Change username and e-mail (current password required)       |
| `POST /api/auth/password/` | Change password (current password required); keeps the session |
| `POST /api/auth/password-reset/` | E-mail a reset link (always 204; 5/hour)               |
| `POST /api/auth/password-reset/confirm/` | Set a new password from the link (20/hour)     |
| `/api/manage/events/`     | Staff CRUD on every workshop, drafts and past ones included. Paginated (`page`, `page_size` ≤ 200), filtered by `period=upcoming\|past` or `date_from`/`date_to` |
| `/api/manage/pricing-types/` | Staff CRUD on every tariff group, its lines saved with it |
| `POST /api/manage/pricing-types/reorder/` | The order of every group at once, all-or-nothing |

The two public list endpoints are unpaginated. The `auth` and `manage` endpoints back the
editor. They accept only a Django session (no Basic auth), enforce CSRF on writes, and
validate through the models' own `clean()`, so the editor and the admin share every rule
and every French message. A missing session is a 401 and anything else refused is a 403.
The editor's fetch layer (`frontend/lib/editor/api.ts`) relies on that difference: a 401
anywhere brings back the login form.

Values go out machine-readable — ISO dates
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
   `ADMIN_PATH`, `EDITOR_URL`, `BREVO_API_KEY`, `DEFAULT_FROM_EMAIL`,
   `DJANGO_ALLOWED_HOSTS`, `CSRF_TRUSTED_ORIGINS`, `CONN_MAX_AGE=0`. The first five have
   no default on a deployment, so a missing one fails at startup rather than silently
   running on a dev placeholder.
   - `EDITOR_URL` is the editor's full URL, e.g. `https://re-source-et-moi.fr/<EDITOR_PATH>`,
     so it must match the frontend's `EDITOR_PATH` (step 4). Reset e-mails link there.
     It is configured rather than read from the request so a reset link can never be
     pointed at another site.
   - `BREVO_API_KEY` is a Brevo API key (SMTP & API → API keys). Brevo is not on the
     Vercel Marketplace, so the key is set by hand. Mark it Sensitive.
   - `DEFAULT_FROM_EMAIL` must be a sender verified in Brevo, e.g.
     `Re-Source Et Moi <contact@re-source-et-moi.fr>`.
4. **Set the frontend's `EDITOR_PATH`** for Production and for Preview, a different
   value in each: `echo "admin-$(uuidgen | tr A-Z a-z)"`. Give Cécile the production URL
   (`https://<domain>/<EDITOR_PATH>`) directly, never through a shared or public page. If
   it is missing, the editor is disabled on that deployment (every path 404s) rather
   than taking the site down. To rotate it, change the variable and redeploy.
5. **Create the admin login** once against production, from your machine:
   `vercel pull --environment=production`, then
   `uv run --env-file .vercel/.env.production.local python manage.py createsuperuser`.
   Two traps recorded from `ma-garde-sereine`: never `grep`/`cut` that env file (Vercel
   quotes values and `django-environ` then fails with "Engine not recognized from url"),
   and `SECRET_KEY` comes back blank because it is marked Sensitive — pass
   `SECRET_KEY=throwaway` inline. This same staff account is Cécile's editor login, so
   give it a strong password: the secret URL hides the editor but does not protect it.
   Give it Cécile's real e-mail too, since that is where "mot de passe oublié" sends the
   link. She can change both later from "Mon compte".

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
