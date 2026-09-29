"""The contact form's e-mail templates, rendered on their own. Sending them is
tests/config/test_contact.py."""

import datetime

import pytest
from django.template.loader import render_to_string

from agenda.models import Address, Event


def render(**overrides) -> tuple[str, str, str]:
    # The phone arrives normalised: the form sends it in international form.
    context = {
        "name": "Camille Martin",
        "email": "camille@example.fr",
        "phone": "+33612345678",
        "message": "",
        "event": None,
        **overrides,
    }
    return (
        render_to_string("config/contact_subject.txt", context),
        render_to_string("config/contact_email.txt", context),
        render_to_string("config/contact_email.html", context),
    )


@pytest.fixture
def onsite_event() -> Event:
    # Unsaved: the templates only read attributes, so there is no database to set up.
    return Event(
        title="Brain Gym® en mouvement",
        date=datetime.date(2026, 10, 3),
        start_time=datetime.time(10, 0),
        end_time=datetime.time(12, 30),
        location_kind=Event.LocationKind.ONSITE,
        address=Address(line1="12 rue de la Charité", postal_code="69002", city="Lyon"),
    )


def test_a_plain_message_names_the_visitor_and_how_to_reach_them():
    subject, text, html = render(message="Bonjour,\nune question sur les ateliers.")

    assert subject.strip() == "Nouveau message de Camille Martin — Re-Source Et Moi"
    assert "Téléphone : +33612345678" in text
    assert "Bonjour,\nune question sur les ateliers." in text
    assert "Camille Martin vous a écrit" in html
    assert 'href="mailto:camille@example.fr"' in html
    assert 'href="tel:+33612345678"' in html
    assert "Bonjour,<br>une question sur les ateliers." in html
    assert "Inscription à un atelier" not in html


def test_a_sign_up_writes_the_workshop_out_in_full(onsite_event):
    subject, text, html = render(event=onsite_event)

    assert subject.strip() == (
        "Inscription de Camille Martin — Brain Gym® en mouvement — Re-Source Et Moi"
    )
    when = "Samedi 3 octobre 2026, 10h00–12h30"
    where = "Lyon — 12 rue de la Charité, 69002 Lyon"
    for part in (text, html):
        assert when in part
        assert where in part
    assert "aucun message ajouté" in text
    assert "Aucun message ajouté" in html


def test_an_online_workshop_has_no_address(onsite_event):
    onsite_event.location_kind = Event.LocationKind.ONLINE
    onsite_event.address = None

    _, text, _ = render(event=onsite_event)

    assert "\nEn ligne\n" in text


def test_the_subject_is_one_line():
    subject, _, _ = render()

    assert "\n" not in subject.strip()


def test_what_the_visitor_typed_is_escaped_in_html_only():
    visitor_html = "<b>Camille</b>"

    _, text, html = render(message=visitor_html)

    assert visitor_html not in html
    assert "&lt;b&gt;Camille&lt;/b&gt;" in html
    assert visitor_html in text
