"""/api/auth/*: the editor's session login.

The editor page is hidden behind a secret URL, but that is only obscurity. These three
endpoints are the actual lock, so their refusals are tested as carefully as their
successes.
"""

import pytest
from django.contrib.auth.models import User
from rest_framework.test import APIClient

from config.auth_views import LOGIN_FAILED

pytestmark = pytest.mark.django_db

CSRF = "/api/auth/csrf/"
SESSION = "/api/auth/session/"
RULES = "/api/auth/password-rules/"
LOGIN = "/api/auth/login/"
LOGOUT = "/api/auth/logout/"
PASSWORD = "motdepasse-solide"


@pytest.fixture
def csrf_client() -> APIClient:
    """A client that enforces CSRF like a browser would. The test client skips the check
    by default, which would make every CSRF assertion here vacuous."""
    return APIClient(enforce_csrf_checks=True)


@pytest.fixture
def staff_user() -> User:
    return User.objects.create_user("cecile", password=PASSWORD, is_staff=True)


def fetch_csrf_token(api_client: APIClient) -> str:
    """Do what the editor's fetch layer does before its first write."""
    api_client.get(CSRF)
    return api_client.cookies["csrftoken"].value


def log_in(api_client: APIClient, username: str = "cecile", password: str = PASSWORD):
    token = fetch_csrf_token(api_client)
    return api_client.post(
        LOGIN, {"username": username, "password": password}, HTTP_X_CSRFTOKEN=token
    )


def test_session_answers_401_without_a_session(client):
    """401, not 403: the editor reads it as "show the login form", while a 403 (a CSRF
    failure, a non-staff account) is an error to report."""
    response = client.get(SESSION)

    assert response.status_code == 401
    assert response["WWW-Authenticate"] == "Session"


def test_the_csrf_endpoint_sets_the_cookie_for_anyone(client):
    """A logged-out page has nothing else to get the token from, and the login POST
    needs it."""
    response = client.get(CSRF)

    assert response.status_code == 204
    assert "csrftoken" in response.cookies


def test_password_rules_come_from_the_validators(client, settings):
    """The editor's hint under a new-password field is this list, so it can't drift
    from what is enforced."""
    settings.AUTH_PASSWORD_VALIDATORS = [
        {
            "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
            "OPTIONS": {"min_length": 12},
        }
    ]

    response = client.get(RULES)

    assert response.status_code == 200
    [rule] = response.json()["rules"]
    assert "12" in rule


def test_session_names_the_logged_in_staff_member(staff_client):
    response = staff_client.get(SESSION)

    assert response.status_code == 200
    assert response.json() == {"username": "cecile", "email": "cecile@example.org"}


def test_session_is_refused_to_a_non_staff_account(client):
    user = User.objects.create_user("visiteur", password=PASSWORD)
    client.force_login(user)

    assert client.get(SESSION).status_code == 403


def test_login_with_good_credentials_opens_a_session(csrf_client, staff_user):
    response = log_in(csrf_client)

    assert response.status_code == 200
    assert response.json() == {"username": "cecile", "email": ""}
    assert csrf_client.get(SESSION).status_code == 200


@pytest.mark.parametrize(
    ("username", "password"),
    [("cecile", "mauvais"), ("personne", PASSWORD)],
    ids=["wrong-password", "unknown-user"],
)
def test_login_failures_all_read_the_same(csrf_client, staff_user, username, password):
    """One message for a wrong password and an unknown user, so the form never confirms
    which accounts exist."""
    response = log_in(csrf_client, username, password)

    assert response.status_code == 400
    assert response.json() == {"non_field_errors": [LOGIN_FAILED]}


def test_login_refuses_a_non_staff_account_with_the_same_message(csrf_client):
    User.objects.create_user("visiteur", password=PASSWORD)

    response = log_in(csrf_client, "visiteur")

    assert response.status_code == 400
    assert response.json() == {"non_field_errors": [LOGIN_FAILED]}
    assert csrf_client.get(SESSION).status_code == 401


def test_login_requires_a_csrf_token(csrf_client, staff_user):
    """DRF skips CSRF for anonymous requests. csrf_protect on the view is what stops
    another site from logging a visitor's browser into an account of its choosing."""
    response = csrf_client.post(LOGIN, {"username": "cecile", "password": PASSWORD})

    assert response.status_code == 403


def test_login_is_throttled(csrf_client, staff_user):
    for _ in range(10):
        log_in(csrf_client, password="mauvais")

    assert log_in(csrf_client).status_code == 429


def test_logout_ends_the_session(csrf_client, staff_user):
    log_in(csrf_client)
    token = csrf_client.cookies["csrftoken"].value

    response = csrf_client.post(LOGOUT, HTTP_X_CSRFTOKEN=token)

    assert response.status_code == 204
    assert csrf_client.get(SESSION).status_code == 401


def test_logout_requires_a_csrf_token(csrf_client, staff_user):
    """Otherwise any page on the web could sign the owner out of her editor."""
    log_in(csrf_client)

    assert csrf_client.post(LOGOUT).status_code == 403
    assert csrf_client.get(SESSION).status_code == 200


def test_basic_auth_is_not_accepted(client, staff_user):
    """Session only. Basic auth would let a password be tried against any endpoint,
    outside the throttled login view."""
    client.credentials(HTTP_AUTHORIZATION="Basic Y2VjaWxlOm1vdGRlcGFzc2Utc29saWRl")

    assert client.get(SESSION).status_code == 401
