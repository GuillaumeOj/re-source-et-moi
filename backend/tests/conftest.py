"""Fixtures shared by the whole suite.

The tree under tests/ mirrors the Django apps (tests/agenda/, tests/pricing/,
tests/config/) rather than living inside each app, so the suite is one thing you can
read, run and measure coverage over.
"""

import datetime

import pytest
from rest_framework.test import APIClient


@pytest.fixture
def client() -> APIClient:
    return APIClient()


@pytest.fixture
def today() -> datetime.date:
    """The date the API judges "upcoming" against.

    Django's timezone is Europe/Paris (see settings), and the agenda's queryset filters on
    `timezone.localdate()`. Tests that build events relative to "now" must use the same
    clock, or a run just after midnight UTC would put an event on the wrong side of the
    boundary.
    """
    from django.utils import timezone

    return timezone.localdate()
