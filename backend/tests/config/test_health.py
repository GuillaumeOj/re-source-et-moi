"""The liveness probe the dev stack's healthcheck gates on."""

from django.test import Client


def test_health_is_public_and_needs_no_database():
    """No django_db marker on purpose: the probe must answer before migrations land.

    docker-compose gates `up --wait` on this endpoint, and the web container runs
    migrate before serving. If health ever grew a query it would deadlock that ordering.
    """
    response = Client().get("/api/health/")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
