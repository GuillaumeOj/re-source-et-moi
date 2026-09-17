"""
Django settings for the Re-Source Et Moi backend.

Configuration is environment-driven via django-environ so the same code runs
locally (Docker + Postgres) and on Vercel (Python function + Neon Postgres).

The API is public and read-only: it serves the workshop agenda and the tariffs to the
Next.js site. There are no site user accounts — the only humans who authenticate are
staff, through the Django admin, which is the editing UI.
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

# Django admin lives at a secret, per-environment path so bots can't hammer a well-known
# /admin/. It's mounted under /api/ (config/urls.py) so Vercel's /api -> backend rewrite
# reaches it — a shared vercel.json can't encode a per-env secret, so Django owns it at
# runtime. On Vercel, ADMIN_PATH must be set (production and preview each hold their own
# value; no default → startup fails if it's missing); local dev falls back to "admin".
ADMIN_PATH = (env("ADMIN_PATH") if ON_VERCEL else env("ADMIN_PATH", default="admin")).strip("/")


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
    # Local
    "agenda",
    "pricing",
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
    "POSTPROCESSING_HOOKS": [
        "drf_spectacular.hooks.postprocess_schema_enums",
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

# Applies only to Django's own built-in apps (auth, admin, sessions, …), which are the
# only models here that don't set their own PK.
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# CORS — the site calls the API same-origin in production (one Vercel project, two
# services behind one domain), so this matters only for local development, where Next
# runs on its own port.
CORS_ALLOWED_ORIGINS = env("CORS_ALLOWED_ORIGINS", cast=list, default=["http://localhost:3001"])

# Behind Vercel's proxy, trust the forwarded protocol header.
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
CSRF_TRUSTED_ORIGINS = env("CSRF_TRUSTED_ORIGINS", cast=list, default=["https://*.vercel.app"])
