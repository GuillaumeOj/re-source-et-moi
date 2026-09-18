"""Fixtures shared by the whole suite.

The tree under tests/ mirrors the Django apps (tests/agenda/, tests/pricing/,
tests/config/) rather than living inside each app, so the suite is one thing you can
read, run and measure coverage over.

Admin tests use pytest-django's built-in `admin_client` — a test client already logged in
as a superuser — rather than a fixture of our own.
"""

import datetime

import pytest
from django.contrib.auth.models import User
from django.core.cache import cache
from django.utils import timezone
from rest_framework.test import APIClient


@pytest.fixture(autouse=True)
def fast_password_hashing(settings):
    """Hash with MD5 rather than the default PBKDF2 (~1.2M iterations).

    Every account a test mints otherwise costs a real hash, and that dominates the suite:
    the admin seed alone hashes on each of its calls, and pytest-django's `admin_client`
    creates a superuser per test. Measured at ~55% of total runtime before this.

    Hashing strength is a production concern; no test asserts on it, and `check_password`
    and `login()` still work.
    """
    settings.PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]


@pytest.fixture(autouse=True)
def clear_cache():
    """Start every test with an empty cache.

    The login throttle counts attempts in the default (in-process) cache, which outlives
    a test. Without this, the login tests would share one counter and the suite would start
    throttling itself partway through.
    """
    cache.clear()


@pytest.fixture
def staff_client() -> APIClient:
    """A client logged in as a staff member: the site owner, in the editor."""
    user = User.objects.create_user(
        "cecile", email="cecile@example.org", password="motdepasse-solide", is_staff=True
    )
    api_client = APIClient()
    api_client.force_login(user)
    return api_client


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
