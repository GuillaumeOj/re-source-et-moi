"""Settings that depend on where the code runs.

`config.settings` is evaluated once, at import, from the environment. These tests reload
the module under a patched environment and read the result off the module itself; the
live `django.conf.settings` the rest of the suite uses is left untouched.
"""

import importlib

import pytest

from config import settings as settings_module

BINDING_DOMAIN = ".services.vercel-infra.com"

# What a deployment must provide: these have no default when VERCEL_ENV is set.
VERCEL_REQUIRED = {
    "SECRET_KEY": "test-secret",
    "ADMIN_PATH": "admin-test",
    "EDITOR_URL": "https://example.org/admin-test",
    "BREVO_API_KEY": "test-key",
    "DEFAULT_FROM_EMAIL": "Test <test@example.org>",
}


@pytest.fixture
def reload_settings(monkeypatch):
    """Reload `config.settings` under the environment a test sets, and restore it after."""

    def reload(**environ: str):
        for name, value in environ.items():
            monkeypatch.setenv(name, value)
        return importlib.reload(settings_module)

    yield reload
    monkeypatch.undo()
    importlib.reload(settings_module)


@pytest.mark.parametrize("vercel_env", ["production", "preview"])
def test_a_deployment_accepts_the_service_binding_host(reload_settings, vercel_env):
    # The frontend's server-side fetches arrive with the binding's host; rejecting it is
    # what left the agenda and the tariffs empty on every deployment.
    reloaded = reload_settings(
        VERCEL_ENV=vercel_env, DJANGO_ALLOWED_HOSTS="re-source-et-moi.vercel.app", **VERCEL_REQUIRED
    )

    assert reloaded.ALLOWED_HOSTS == ["re-source-et-moi.vercel.app", BINDING_DOMAIN]


def test_local_development_does_not_add_the_binding_host(reload_settings, monkeypatch):
    monkeypatch.delenv("VERCEL_ENV", raising=False)
    monkeypatch.delenv("DJANGO_ALLOWED_HOSTS", raising=False)

    reloaded = reload_settings()

    assert BINDING_DOMAIN not in reloaded.ALLOWED_HOSTS


@pytest.mark.django_db
def test_the_binding_host_reaches_the_public_api(client, settings):
    settings.ALLOWED_HOSTS = [BINDING_DOMAIN]

    response = client.get("/api/events/", HTTP_HOST="backend.53344c30.services.vercel-infra.com")

    assert response.status_code == 200
