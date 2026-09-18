"""/api/auth/password-reset/ and .../confirm/: "mot de passe oublié"."""

import re

import pytest
from anymail.exceptions import AnymailAPIError
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.core import mail
from django.core.mail import EmailMultiAlternatives
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework.test import APIClient

from config.auth_views import INVALID_RESET_LINK

pytestmark = pytest.mark.django_db

REQUEST = "/api/auth/password-reset/"
CONFIRM = "/api/auth/password-reset/confirm/"
NEW = "un-nouveau-mot-de-passe-2027"


@pytest.fixture
def cecile() -> User:
    return User.objects.create_user(
        "cecile", email="cecile@example.org", password="ancien-mot-de-passe", is_staff=True
    )


@pytest.fixture
def editor_url(settings) -> str:
    settings.EDITOR_URL = "https://re-source-et-moi.fr/admin-3f2c"
    return settings.EDITOR_URL


def reset_link_params(message) -> tuple[str, str]:
    match = re.search(r"reinitialiser\?uid=([\w-]+)&token=([\w-]+)", message.body)
    assert match is not None
    uid, token = match.groups()
    return uid, token


def test_sends_a_link_to_the_editor_to_a_staff_address(client, cecile, editor_url):
    response = client.post(REQUEST, {"email": "cecile@example.org"}, format="json")

    assert response.status_code == 204
    [message] = mail.outbox
    assert message.to == ["cecile@example.org"]
    assert "mot de passe" in message.subject
    assert f"{editor_url}/reinitialiser?uid=" in message.body
    # The HTML half carries the same link, as a button.
    assert isinstance(message, EmailMultiAlternatives)
    html, mimetype = message.alternatives[0]
    assert mimetype == "text/html"
    assert f"{editor_url}/reinitialiser?uid=" in str(html)


def test_the_link_ignores_whatever_host_the_request_names(client, cecile, editor_url):
    """Host-header poisoning: a link built from the request could be pointed at an
    attacker's site, taking the token with it. It comes from EDITOR_URL only."""
    client.post(
        REQUEST,
        {"email": "cecile@example.org"},
        format="json",
        HTTP_HOST="localhost",
        HTTP_ORIGIN="https://pirate.example",
        HTTP_X_FORWARDED_HOST="pirate.example",
    )

    [message] = mail.outbox
    assert "pirate" not in message.body
    assert editor_url in message.body


@pytest.mark.parametrize(
    "email", ["personne@example.org", "visiteur@example.org"], ids=["unknown", "not-staff"]
)
def test_answers_the_same_for_an_address_with_no_staff_account(client, cecile, email):
    """Always 204, e-mail or not, so the form can't be used to test addresses."""
    User.objects.create_user("visiteur", email="visiteur@example.org", password="x")

    response = client.post(REQUEST, {"email": email}, format="json")

    assert response.status_code == 204
    assert mail.outbox == []


def test_a_sending_failure_is_logged_not_revealed(client, cecile, monkeypatch, caplog):
    """Only a matching address reaches the send, so reporting the failure would reveal
    the match."""

    def fail(*args, **kwargs):
        raise AnymailAPIError("Brevo is down")

    monkeypatch.setattr("django.core.mail.EmailMultiAlternatives.send", fail)

    response = client.post(REQUEST, {"email": "cecile@example.org"}, format="json")

    assert response.status_code == 204
    assert "Failed to send password reset email" in caplog.text


def test_rejects_something_that_isnt_an_email(client):
    response = client.post(REQUEST, {"email": "cecile"}, format="json")

    assert response.status_code == 400


def test_requesting_is_throttled(client, cecile):
    """It sends e-mail, so it is also a way to flood someone's inbox."""
    for _ in range(5):
        client.post(REQUEST, {"email": "cecile@example.org"}, format="json")

    assert client.post(REQUEST, {"email": "cecile@example.org"}, format="json").status_code == 429
    assert len(mail.outbox) == 5


def test_requesting_requires_a_csrf_token(cecile):
    csrf_client = APIClient(enforce_csrf_checks=True)

    response = csrf_client.post(REQUEST, {"email": "cecile@example.org"}, format="json")

    assert response.status_code == 403


def test_the_link_sets_a_new_password(client, cecile):
    client.post(REQUEST, {"email": "cecile@example.org"}, format="json")
    uid, token = reset_link_params(mail.outbox[0])

    response = client.post(
        CONFIRM,
        {"uid": uid, "token": token, "new_password1": NEW, "new_password2": NEW},
        format="json",
    )

    assert response.status_code == 204
    cecile.refresh_from_db()
    assert cecile.check_password(NEW)


def test_the_link_works_only_once(client, cecile):
    """The token is tied to the password hash, which the first use changes."""
    client.post(REQUEST, {"email": "cecile@example.org"}, format="json")
    uid, token = reset_link_params(mail.outbox[0])
    body = {"uid": uid, "token": token, "new_password1": NEW, "new_password2": NEW}
    client.post(CONFIRM, body, format="json")

    response = client.post(CONFIRM, {**body, "new_password1": "encore-un-autre-2027"})

    assert response.status_code == 400
    assert response.json() == {"token": [INVALID_RESET_LINK]}


@pytest.mark.parametrize(
    ("uid", "token"),
    [
        ("Mg", "faux-jeton"),
        ("pas-du-base64!", "faux-jeton"),
        ("YWJj", "faux-jeton"),  # decodes to "abc", not a primary key
        ("OTk5OTk", "faux-jeton"),  # a primary key with no user behind it
        ("wrI", "faux-jeton"),  # decodes to "²": a digit to str.isdigit, not to int()
    ],
    ids=["bad-token", "bad-uid", "non-numeric-uid", "unknown-user", "superscript-uid"],
)
def test_a_forged_link_is_refused(client, cecile, uid, token):
    response = client.post(
        CONFIRM,
        {"uid": uid, "token": token, "new_password1": NEW, "new_password2": NEW},
        format="json",
    )

    assert response.status_code == 400
    assert response.json() == {"token": [INVALID_RESET_LINK]}


def test_a_non_staff_account_cannot_be_reset_even_with_a_valid_token(client):
    visitor = User.objects.create_user("visiteur", email="v@example.org", password="x")
    uid = urlsafe_base64_encode(force_bytes(visitor.pk))
    token = default_token_generator.make_token(visitor)

    response = client.post(
        CONFIRM,
        {"uid": uid, "token": token, "new_password1": NEW, "new_password2": NEW},
        format="json",
    )

    assert response.status_code == 400


def test_the_new_password_goes_through_djangos_rules(client, cecile):
    uid = urlsafe_base64_encode(force_bytes(cecile.pk))
    token = default_token_generator.make_token(cecile)

    response = client.post(
        CONFIRM,
        {"uid": uid, "token": token, "new_password1": NEW, "new_password2": "different-2027"},
        format="json",
    )

    assert response.status_code == 400
    assert "new_password2" in response.json()
    cecile.refresh_from_db()
    assert cecile.check_password("ancien-mot-de-passe")


def test_confirming_has_its_own_looser_limit(client, cecile):
    """A mistyped confirmation counts as an attempt. Sharing the request's 5/hour would
    lock someone out for an hour after a few typos."""
    for _ in range(5):
        client.post(REQUEST, {"email": "cecile@example.org"}, format="json")
    uid, token = reset_link_params(mail.outbox[0])

    response = client.post(
        CONFIRM,
        {"uid": uid, "token": token, "new_password1": NEW, "new_password2": NEW},
        format="json",
    )

    assert response.status_code != 429
