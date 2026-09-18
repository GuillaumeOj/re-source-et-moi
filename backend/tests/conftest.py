"""Fixtures shared by the whole suite.

The tree under tests/ mirrors the Django apps (tests/agenda/, tests/pricing/,
tests/config/) rather than living inside each app, so the suite is one thing you can
read, run and measure coverage over.

Admin tests use pytest-django's built-in `admin_client` — a test client already logged in
as a superuser — rather than a fixture of our own.
"""

import datetime

import pytest
from django.utils import timezone
from rest_framework.test import APIClient


@pytest.fixture
def client() -> APIClient:
    """DRF's client, for the API tests. Shadows pytest-django's plain `client` on purpose:
    every test here that wants a client wants this one."""
    return APIClient()


@pytest.fixture
def today() -> datetime.date:
    """The date the API judges "upcoming" against.

    Django's timezone is Europe/Paris and the agenda's queryset filters on
    `timezone.localdate()`, so tests that build events relative to "now" must use the same
    clock — otherwise a run just after midnight UTC puts an event on the wrong side of the
    boundary.
    """
    return timezone.localdate()


@pytest.fixture
def dev_environment(settings):
    """Satisfy `config.seeding.guard_dev_only`, which the seed commands sit behind.

    Not autouse: a test that wants the guard to *fire* must be able to leave it unsatisfied.
    """
    settings.DEBUG = True
    settings.ON_VERCEL = False
