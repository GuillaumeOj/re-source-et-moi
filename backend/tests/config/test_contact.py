"""/api/contact/: the public contact form, e-mailed to the association."""

import datetime

import pytest
from anymail.exceptions import AnymailAPIError
from django.core import mail
from django.core.mail import EmailMultiAlternatives
from rest_framework.test import APIClient

from agenda.models import Event
from config.contact_views import (
    EVENT_UNAVAILABLE,
    INVALID_PHONE,
    MESSAGE_REQUIRED,
    normalise_phone,
)

pytestmark = pytest.mark.django_db

CONTACT = "/api/contact/"
VISITOR = {
    "name": "Camille Martin",
    "email": "camille@example.fr",
    "phone": "06 12 34 56 78",
    "message": "Bonjour,\nune question sur les ateliers.",
}


@pytest.fixture(autouse=True)
def contact_email(settings) -> str:
    settings.CONTACT_EMAIL = "association@example.org"
    return settings.CONTACT_EMAIL


@pytest.fixture
def workshop(today) -> Event:
    return Event.objects.create(
        title="Brain Gym® en mouvement",
        date=today + datetime.timedelta(days=14),
        start_time=datetime.time(10, 0),
        end_time=datetime.time(12, 30),
        location_kind=Event.LocationKind.ONLINE,
    )


def test_a_message_reaches_the_association_with_the_visitor_as_reply_to(client, contact_email):
    response = client.post(CONTACT, VISITOR, format="json")

    assert response.status_code == 204
    [message] = mail.outbox
    assert message.to == [contact_email]
    assert message.reply_to == ["camille@example.fr"]
    assert message.subject == "Nouveau message de Camille Martin — Re-Source Et Moi"
    assert "Bonjour,\nune question sur les ateliers." in message.body
    # Normalised on the way in, so the e-mail's number can be dialled as is.
    assert "Téléphone : +33612345678" in message.body
    assert isinstance(message, EmailMultiAlternatives)
    html, mimetype = message.alternatives[0]
    assert mimetype == "text/html"
    assert 'href="tel:+33612345678"' in str(html)


def test_a_sign_up_writes_the_workshop_out_and_needs_no_message(client, workshop):
    response = client.post(
        CONTACT, {**VISITOR, "message": "", "event": str(workshop.pk)}, format="json"
    )

    assert response.status_code == 204
    [message] = mail.outbox
    assert message.subject.startswith("Inscription de Camille Martin — Brain Gym® en mouvement")
    assert "En ligne" in message.body
    assert "aucun message ajouté" in message.body


def test_a_plain_message_cannot_be_empty(client):
    response = client.post(CONTACT, {**VISITOR, "message": ""}, format="json")

    assert response.status_code == 400
    assert response.json() == {"message": [MESSAGE_REQUIRED]}
    assert mail.outbox == []


@pytest.mark.parametrize(
    ("change", "event_id"),
    [
        ({"is_published": False}, None),
        ({"date": datetime.date(2020, 1, 1)}, None),
        ({}, "00000000-0000-4000-8000-000000000000"),
        ({}, "pas-un-uuid"),
    ],
    ids=["draft", "past", "unknown", "garbage"],
)
def test_only_an_upcoming_published_workshop_can_be_signed_up_for(
    client, workshop, change, event_id
):
    Event.objects.filter(pk=workshop.pk).update(**change)

    response = client.post(
        CONTACT, {**VISITOR, "event": event_id or str(workshop.pk)}, format="json"
    )

    assert response.status_code == 400
    assert response.json() == {"event": [EVENT_UNAVAILABLE]}
    assert mail.outbox == []


@pytest.mark.parametrize(
    ("field", "value"),
    [("name", ""), ("email", "camille")],
)
def test_rejects_a_missing_or_malformed_field(client, field, value):
    response = client.post(CONTACT, {**VISITOR, field: value}, format="json")

    assert response.status_code == 400
    assert field in response.json()
    assert mail.outbox == []


def test_a_bad_phone_gets_the_forms_own_message(client):
    response = client.post(CONTACT, {**VISITOR, "phone": "12345"}, format="json")

    assert response.status_code == 400
    assert response.json() == {"phone": [INVALID_PHONE]}
    assert mail.outbox == []


def test_a_sending_failure_is_reported(client, monkeypatch, caplog):
    """The visitor must know the message did not leave, so they can call instead."""

    def fail(*args, **kwargs):
        raise AnymailAPIError("Brevo is down")

    monkeypatch.setattr("django.core.mail.EmailMultiAlternatives.send", fail)

    response = client.post(CONTACT, VISITOR, format="json")

    assert response.status_code == 503
    assert "Failed to send contact email" in caplog.text


def test_sending_is_throttled(client):
    """It sends e-mail, so it is also a way to flood the association's inbox."""
    for _ in range(5):
        client.post(CONTACT, VISITOR, format="json")

    assert client.post(CONTACT, VISITOR, format="json").status_code == 429
    assert len(mail.outbox) == 5


def test_sending_requires_a_csrf_token():
    response = APIClient(enforce_csrf_checks=True).post(CONTACT, VISITOR, format="json")

    assert response.status_code == 403


@pytest.mark.parametrize(
    ("typed", "normalised"),
    [
        ("06 12 34 56 78", "+33612345678"),
        ("06.12.34.56.78", "+33612345678"),
        ("+33 (0)6 12 34 56 78", "+33612345678"),
        ("0033 6 12 34 56 78", "+33612345678"),
        ("+33612345678", "+33612345678"),
        ("0012345678", None),
        ("06 12 34 56", None),
        ("+44 20 7946 0958", None),
    ],
)
def test_normalise_phone_matches_the_forms_rule(typed, normalised):
    assert normalise_phone(typed) == normalised
