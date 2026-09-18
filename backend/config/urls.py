"""Root URL configuration for the Re-Source Et Moi backend.

Everything, the admin included, is mounted under /api/. Vercel routes a single
`/api(/.*)?` rewrite to this service and lets everything else fall through to the Next.js
site, so a path outside /api/ would never reach Django in production.
"""

from django.conf import settings
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from config import auth_views, views

urlpatterns = [
    # The admin is mounted at a secret, per-environment segment (settings.ADMIN_PATH); see
    # the ADMIN_PATH note in settings.py. It is the fallback editor now: the site owner's
    # everyday UI is the Next.js editor, which logs in and manages its account through the
    # auth routes below.
    path(f"api/{settings.ADMIN_PATH}/", admin.site.urls),
    path("api/auth/csrf/", auth_views.CsrfView.as_view(), name="auth-csrf"),
    path("api/auth/session/", auth_views.SessionView.as_view(), name="auth-session"),
    path(
        "api/auth/password-rules/",
        auth_views.PasswordRulesView.as_view(),
        name="auth-password-rules",
    ),
    path("api/auth/login/", auth_views.LoginView.as_view(), name="auth-login"),
    path("api/auth/logout/", auth_views.LogoutView.as_view(), name="auth-logout"),
    path("api/auth/account/", auth_views.AccountView.as_view(), name="auth-account"),
    path("api/auth/password/", auth_views.PasswordChangeView.as_view(), name="auth-password"),
    path(
        "api/auth/password-reset/",
        auth_views.PasswordResetRequestView.as_view(),
        name="auth-password-reset",
    ),
    path(
        "api/auth/password-reset/confirm/",
        auth_views.PasswordResetConfirmView.as_view(),
        name="auth-password-reset-confirm",
    ),
    # OpenAPI schema. The frontend's TypeScript types are generated from it (see
    # frontend/package.json's `codegen` script). /api/schema/swagger/ is a browsable view.
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/schema/swagger/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    path("api/health/", views.health, name="health"),
    path("api/", include("agenda.urls")),
    path("api/", include("pricing.urls")),
]
