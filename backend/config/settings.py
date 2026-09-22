"""
Django settings for the Re-Source Et Moi backend.

Configuration is environment-driven via django-environ so the same code runs
locally (Docker + Postgres) and on Vercel (Python function + Neon Postgres).

The public API is read-only: it serves the workshop agenda and the tariffs to the Next.js
site. There are no site user accounts. The only people who authenticate are staff, either
through the editor page of the Next.js site (session login under /api/auth/, writes under
/api/manage/) or through the Django admin, which remains as a fallback.
"""

from pathlib import Path

import environ

BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env()

# Read a local .env file if present (ignored in production, where Vercel injects env vars).
environ.Env.read_env(BASE_DIR / ".env")

# Every setting is read by its bare name. On Vercel, production and preview each hold their
# own value for the same variable name (env vars are scoped per environment there), so the
# same code reads e.g. DATABASE_URL and gets the right database in each. Locally we read the
# same names from the environment / a .env file, falling back to the defaults passed below.

# VERCEL_ENV is "production"/"preview" on Vercel deploys, unset locally. Public, so code
# that must behave differently on a deployment (e.g. the seed_demo command, which refuses
# to run on one) asks this rather than re-reading the environment for itself.
ON_VERCEL = env("VERCEL_ENV", default="") in {"production", "preview"}

# On Vercel a real SECRET_KEY must be provided (no default → startup fails loudly if it's
# missing); only local/dev falls back to the insecure placeholder.
SECRET_KEY = (
    env("SECRET_KEY")
    if ON_VERCEL
    else env("SECRET_KEY", default="django-insecure-dev-only-change-me")
)

DEBUG = env("DEBUG", cast=bool, default=False)

ALLOWED_HOSTS = env(
    "DJANGO_ALLOWED_HOSTS", cast=list, default=["localhost", "127.0.0.1", ".vercel.app"]
)

# The Next.js service calls Django through a Vercel service binding (BACKEND_INTERNAL_URL),
# whose host is backend.<project-hash>.services.vercel-infra.com. Added in code rather than
# left to DJANGO_ALLOWED_HOSTS so no environment can miss it: without it every server-side
# fetch gets a DisallowedHost 400 and the site shows no workshops and no tariffs. The host
# is only reachable from inside Vercel, and nothing here builds a URL from the Host header
# (reset links use EDITOR_URL), so accepting it opens nothing.
if ON_VERCEL:
    ALLOWED_HOSTS.append(".services.vercel-infra.com")

# Django admin lives at a secret, per-environment path so bots can't hammer a well-known
# /admin/. It's mounted under /api/ (config/urls.py) so Vercel's /api -> backend rewrite
# reaches it — a shared vercel.json can't encode a per-env secret, so Django owns it at
# runtime. On Vercel, ADMIN_PATH must be set (production and preview each hold their own
# value; no default → startup fails if it's missing); local dev falls back to "admin".
ADMIN_PATH = (env("ADMIN_PATH") if ON_VERCEL else env("ADMIN_PATH", default="admin")).strip("/")

# The editor's full public URL, secret path included, e.g.
# "https://re-source-et-moi.fr/admin-3f2c…". The frontend owns the secret (EDITOR_PATH);
# Django needs its own copy for one thing: the link in a password-reset e-mail. It is
# configured here rather than taken from the request on purpose. A reset link built from
# anything the caller sends (Origin, Host, a field in the body) can be pointed at an
# attacker's site, and the reset token would go with it. Required on Vercel, like
# ADMIN_PATH.
EDITOR_URL = (
    env("EDITOR_URL")
    if ON_VERCEL
    else env("EDITOR_URL", default="http://localhost:3001/admin-local")
).rstrip("/")


# Application definition

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third-party
    "rest_framework",
    "drf_spectacular",
    "corsheaders",
    "anymail",
    # Local
    # `config` is the project package, listed as an app so Django finds the management
    # commands under config/management/. It owns no tables — config/models.py holds only
    # the abstract UUIDModel — so it needs no migrations.
    "config",
    "agenda",
    "pricing",
    "reviews",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    # WhiteNoise serves static files (incl. Django admin assets) without a filesystem/CDN.
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"


# Database
# On Vercel, production and preview each hold their own DATABASE_URL (its own Neon database),
# so previews never touch production data. The app uses Neon's *pooled* connection string;
# CONN_MAX_AGE stays 0 on serverless so connections aren't held open across invocations.
DATABASES = {
    "default": env.db(
        "DATABASE_URL",
        default="postgres://rsm:rsm@localhost:5445/rsm",
    ),
}
DATABASES["default"]["CONN_MAX_AGE"] = env("CONN_MAX_AGE", cast=int, default=0)


# Django REST Framework
# The default is deliberately strict — anything added later is locked unless it opts out.
# The two public list endpoints do opt out explicitly (AllowAny): they serve content that
# is already visible on the public website.
REST_FRAMEWORK = {
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    # Session only. The editor is a same-origin browser page, so a session cookie plus CSRF
    # is how it authenticates. DRF's default also accepts HTTP Basic, which would let a
    # password be tried on every endpoint without passing through the throttled login view.
    # The subclass answers 401 for "no session" so the editor can tell it from a 403.
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "config.authentication.EditorSessionAuthentication",
    ],
    # Only views that name a scope are throttled: the editor's login and the two halves of
    # the password reset. Asking for a reset sends e-mail, so it is also a spam lever and
    # gets the tight limit. Confirming is looser, because a mistyped confirmation counts
    # too and the token itself cannot be guessed. The counters live in the default
    # (per-process) cache, so on serverless they slow a guesser down rather than stop one.
    # Pair them with a strong password.
    "DEFAULT_THROTTLE_RATES": {
        "login": "10/min",
        "password_reset": "5/hour",
        "password_reset_confirm": "20/hour",
    },
    # drf-spectacular introspects the views to build the OpenAPI schema the frontend's
    # TypeScript types are generated from (see SPECTACULAR_SETTINGS + config/urls.py).
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
}

# OpenAPI schema — the single source of truth the frontend's types are generated from.
# `bun run codegen` in ../frontend reads backend/schema.yml and regenerates
# lib/api/generated.ts, so the two sides can never drift.
SPECTACULAR_SETTINGS = {
    "TITLE": "Re-Source Et Moi API",
    "DESCRIPTION": "Agenda & tarifs — read-only REST API consumed by the Next.js site.",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    # Strip the '/api' mount prefix from operation paths so they read '/events/'. The
    # frontend appends '/api' to its base URL; without the trim the two would double up.
    # PREFIX matches for tag/operationId naming; PREFIX_TRIM removes it from emitted paths.
    "SCHEMA_PATH_PREFIX": r"/api",
    "SCHEMA_PATH_PREFIX_TRIM": True,
    # Split components into request/response variants so write-only/read-only fields
    # generate distinct TS types instead of one loose shape.
    "COMPONENT_SPLIT_REQUEST": True,
    # Keep drf-spectacular's default enum postprocessing, then mark response fields as
    # required so the generated TS response types aren't riddled with spurious optionals
    # (see config/spectacular_hooks.py for why).
    "POSTPROCESSING_HOOKS": [
        "drf_spectacular.hooks.postprocess_schema_enums",
        "config.spectacular_hooks.make_response_fields_required",
    ],
}


# Password validation
# Only ever applied to staff accounts created for the admin — there are no site users.
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]


# Internationalization
# The site and its admin are French-only, so there is no locale negotiation to do:
# no LocaleMiddleware, no LANGUAGES, no LOCALE_PATHS. Europe/Paris is what the workshop
# dates mean — "upcoming" is decided against the local date, not UTC's.
LANGUAGE_CODE = "fr"
TIME_ZONE = "Europe/Paris"
USE_I18N = True
USE_TZ = True


# Static files
# Served under /api/ so Vercel's /api -> backend rewrite delivers the Django admin assets
# to WhiteNoise; a bare /static/ would fall through to the Next.js site.
STATIC_URL = "api/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    # Non-manifest WhiteNoise storage: still gzip/brotli-compresses collected assets, but
    # {% static %} returns plain (unhashed) URLs, so runtime never has to read a
    # staticfiles.json manifest — which is fragile inside a serverless function bundle.
    "staticfiles": {"BACKEND": "whitenoise.storage.CompressedStaticFilesStorage"},
}

# Applies only to models that don't set their own PK — Django's built-in apps
# (auth, admin, sessions, …). Our models get a UUID-4 PK by subclassing
# config.models.UUIDModel (see there for why); new models must do the same.
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# CORS — the site calls the API same-origin in production (one Vercel project, two
# services behind one domain), so this matters only for local development, where Next
# runs on its own port.
CORS_ALLOWED_ORIGINS = env("CORS_ALLOWED_ORIGINS", cast=list, default=["http://localhost:3001"])

# Behind Vercel's proxy, trust the forwarded protocol header.
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
CSRF_TRUSTED_ORIGINS = env("CSRF_TRUSTED_ORIGINS", cast=list, default=["https://*.vercel.app"])

# The editor's session and CSRF cookies travel over HTTPS only once deployed. Locally the
# dev stack is plain http://localhost, where a Secure cookie would never be sent back.
SESSION_COOKIE_SECURE = ON_VERCEL
CSRF_COOKIE_SECURE = ON_VERCEL


# E-mail. The only message sent is the editor's password-reset link, through Brevo's
# transactional API via django-anymail. On Vercel both the key and the sender are
# required: a deployment that silently dropped reset e-mails would lock the site owner out
# with no error anywhere. Locally, with no key, messages print to the Django console
# instead, which is how you follow a reset link in development.
BREVO_API_KEY = env("BREVO_API_KEY") if ON_VERCEL else env("BREVO_API_KEY", default="")
ANYMAIL = {"BREVO_API_KEY": BREVO_API_KEY}
EMAIL_BACKEND = (
    "anymail.backends.brevo.EmailBackend"
    if BREVO_API_KEY
    else "django.core.mail.backends.console.EmailBackend"
)
# Must be a sender verified in the Brevo account, e.g. "Re-Source Et Moi <contact@…>".
DEFAULT_FROM_EMAIL = (
    env("DEFAULT_FROM_EMAIL")
    if ON_VERCEL
    else env("DEFAULT_FROM_EMAIL", default="Re-Source Et Moi <contact@re-source-et-moi.fr>")
)

# How long a reset link stays valid. Django's default is three days, far longer than
# anyone takes to click a link they just asked for. It is kept short because the link is a
# way into the editor.
PASSWORD_RESET_TIMEOUT = 60 * 60 * 2
