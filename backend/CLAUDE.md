# Backend

## Three rules that hold for every change

1. **Every primary key is a UUID v4.** Models inherit `config.models.UUIDModel`; no model
   declares its own `id`. `DEFAULT_AUTO_FIELD` cannot express this — Django requires it to
   name an `AutoField` subclass and `UUIDField` is not one — which is why the abstract base
   exists. Django's own apps (`auth`, `admin`, `sessions`) keep their `BigAutoField`.
2. **Coverage never drops below 90%**, enforced by `--cov-fail-under=90` so `uv run tox`
   and CI both fail below it. Tests land in the same commit as the code they cover. `--cov`
   names each app package explicitly, so a new app that ships without tests drags the
   number down rather than sitting outside the measurement — **add your new app to that
   list in `pyproject.toml`**.
3. **All tests live at the backend root, mirroring the app tree** — `tests/<app>/test_*.py`,
   each directory with an `__init__.py`. Never `<app>/tests.py` or `<app>/tests/`.

## Keep the schema and the seeds in sync with what you change

### `schema.yml` is an API contract, not a build artifact you can ignore

The frontend's TypeScript types are generated from it, and CI regenerates both and fails on
any diff. **Change a serializer, run `uv run tox -e openapi` and `bun run codegen` in
`../frontend`, and commit all three.**

Watch for one trap: a `SerializerMethodField` tells drf-spectacular nothing about its
shape, so it lands in the schema as an untyped object and the generated TypeScript loses
every field inside it. Annotate it with `@extend_schema_field`, as
`pricing/serializers.py` does for the nested prices.

The env is called `openapi`, not `schema`, because tox has a built-in `schema` subcommand
that swallows `tox -e schema`.

### The seed commands are how anyone sees your feature

`config/seed_admin`, `agenda/seed_agenda` and `pricing/seed_pricing` build what the dev
stack runs on (`uv run tox -e seed`) — the admin login, then the content it edits. A
feature the seed never creates is one nobody looks at until it surprises them in
production.

One command per app, because no app owns another's data; `seed_admin` lives in `config`
because a `django.contrib.auth` account belongs to neither `agenda` nor `pricing`.

When you add or change a model, extend the matching seed command in the same change:

- **New field** → give it a realistic and *varied* value, so the UI renders more than one
  case.
- **New state something can be in** (published/unpublished, on-demand/fixed, past/upcoming)
  → create rows on both sides of it. The agenda seed deliberately includes an unpublished
  and an already-past workshop so the API's filtering is visible in dev, not only in tests.
- **New model** → wire it to what it belongs to, not floating on its own.
- Cover it in `tests/<app>/test_seed_<app>.py`.

Two invariants every seed must keep: it is **dev only** (guarded by
`config.seeding.guard_dev_only`, which requires `VERCEL_ENV` absent *and* `DEBUG` on) and
it is **re-runnable** — a run rebuilds its dataset rather than piling onto it.

The guard matters for two different reasons. The content seeds wipe the rows they own, and
on a deployment those rows are the owner's real agenda and real prices. `seed_admin` wipes
nothing, but mints an account with a known weak password — which on a deployment would be a
way in. Anything new that seeds accounts or credentials sits behind the same guard.

## `ty` does not run django-stubs' plugin

django-stubs types a lot of Django's dynamic surface through a **mypy plugin**. `ty` has no
plugin system, so that resolution never happens and anything the plugin would have
synthesised reads as an error. This is one root cause with two sanctioned workarounds —
reach for whichever fits rather than inventing a third:

- **A relation the plugin would synthesise** (a reverse accessor from `related_name`) —
  declare it in an `if TYPE_CHECKING:` block on the model, as `pricing/models.py` does for
  `PricingType.prices`. Every new `related_name` you read through will need one.
- **`get_user_model()`**, which resolves no further than `AbstractBaseUser` — import the
  concrete `django.contrib.auth.models.User`, as `config/seed_admin` does. That is honest
  here because `AUTH_USER_MODEL` is Django's default and stays that way; it would be wrong
  in a project with a custom user model.

Both are workarounds for a tool gap, not design decisions. If `ty` grows plugin support,
this section is the list of places to delete.

## Two editing UIs, one set of rules

The site owner edits through **the editor**, a French page of the Next.js site at a secret
`EDITOR_PATH` (see the README). It is backed by `/api/auth/*` (session login, in
`config/auth_views.py`) and `/api/manage/*` (a staff-only `ModelViewSet` per app).
`django.contrib.admin` at the secret `ADMIN_PATH` stays as the fallback. There are still
no site user accounts.

Keep the two consistent:

- **Validation lives on the model, in `clean()`.** DRF never calls it, so every manage
  serializer mixes in `config.serializers.ModelCleanMixin`. It runs `clean()` and turns
  its errors into DRF field errors. Never re-implement a rule in a serializer: the admin
  and the editor would then disagree about what is valid, or word it differently.
- **Messages and help texts are French and written for the site owner.** The editor
  shows the backend's validation messages verbatim under the fields.
- **Manage endpoints are staff-only (`IsAdminUser`), unpaginated, and unfiltered.** The
  editor needs drafts and past rows too. A nested write (a pricing group's lines) is one
  transaction, so a bad line leaves the whole group untouched.
- **Account and password endpoints validate through Django's own auth forms**
  (`PasswordChangeForm`, `SetPasswordForm`, `PasswordResetForm`), so password rules and
  their messages match the admin. Anything that changes the password or the e-mail asks
  for the current password.
- **The reset link is built from `settings.EDITOR_URL`, never from the request.** A link
  built from the request's Host or Origin could be aimed at another site, and the token
  would go with it. Reset requests always answer 204, so they never reveal whether an
  address has an account.
- **The admin is still a user interface.** French `verbose_name` on every model and
  field, related rows inline where they are read together, `list_editable` for the
  toggles flipped most, and prefetch anything a `list_display` column reads.
