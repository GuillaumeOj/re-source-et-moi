"""Root URL configuration for the Re-Source Et Moi backend.

Everything is mounted under /api/ — the admin included — because Vercel routes a single
`/api(/.*)?` rewrite to this service and lets everything else fall through to the Next.js
site. A path outside /api/ would never reach Django in production.
"""

from django.conf import settings
from django.contrib import admin
from django.urls import path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from config import views

urlpatterns = [
    # Admin is mounted at a secret, per-environment segment (settings.ADMIN_PATH) — see the
    # ADMIN_PATH note in settings.py. This is the editing UI the site owner actually uses.
    path(f"api/{settings.ADMIN_PATH}/", admin.site.urls),
    # OpenAPI schema — the frontend's TypeScript types are generated from it (see
    # frontend/package.json's `codegen` script). /api/schema/swagger/ is a browsable view.
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/schema/swagger/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    path("api/health/", views.health, name="health"),
]
