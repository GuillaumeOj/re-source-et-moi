"""/api/manage/events/: the editor's read-write view of the agenda."""

import datetime

import pytest
from django.contrib.auth.models import User

from agenda.models import Event

pytestmark = pytest.mark.django_db

URL = "/api/manage/events/"


def detail(event: Event) -> str:
    return f"{URL}{event.id}/"


@pytest.fixture
def payload(today, make_address):
    """A complete, valid on-site workshop, as the editor's form sends it."""
    return {
        "title": "Atelier découverte",
        "date": (today + datetime.timedelta(days=10)).isoformat(),
        "start_time": "14:00",
        "end_time": "16:30",
        "location_kind": "onsite",
        "location_label_override": "",
        "online_url": "",
        "address": str(make_address(name="Salle de la République", city="Lyon").pk),
        "description": "Pour découvrir le Brain Gym®.",
        "is_published": False,
    }


def test_is_refused_to_an_anonymous_visitor(client, make_event):
    make_event()

    assert client.get(URL).status_code == 401
    assert client.post(URL, {}).status_code == 401


def test_is_refused_to_a_non_staff_account(client):
    client.force_login(User.objects.create_user("visiteur", password="x"))

    assert client.get(URL).status_code == 403


def test_lists_drafts_and_past_workshops_too(staff_client, make_event, today):
    """The public feed hides both. The editor needs them: a draft is work in progress,
    and a past workshop is what gets duplicated to plan the next one."""
    make_event(title="Brouillon", is_published=False)
    make_event(title="Passé", date=today - datetime.timedelta(days=5))
    make_event(title="À venir")

    titles = {event["title"] for event in staff_client.get(URL).json()["results"]}

    assert titles == {"Brouillon", "Passé", "À venir"}


def test_exposes_the_editable_fields_and_the_derived_label(staff_client, make_event):
    stored = make_event(location_kind=Event.LocationKind.ONSITE)

    [event] = staff_client.get(URL).json()["results"]

    assert event["address"] == str(stored.address_id)
    assert event["location_label"] == "Lyon"
    assert event["is_published"] is True


def test_creates_a_workshop(staff_client, payload):
    response = staff_client.post(URL, payload, format="json")

    assert response.status_code == 201
    event = Event.objects.get()
    assert event.title == "Atelier découverte"
    assert event.address is not None
    assert event.address.name == "Salle de la République"
    assert event.is_published is False
    assert response.json()["location_label"] == "Lyon"


def test_updates_a_workshop(staff_client, make_event, payload):
    event = make_event()

    response = staff_client.put(detail(event), payload, format="json")

    assert response.status_code == 200
    event.refresh_from_db()
    assert event.title == "Atelier découverte"
    assert event.location_kind == Event.LocationKind.ONSITE


def test_toggles_publication_with_a_patch(staff_client, make_event):
    """The list's publish switch sends only the one field."""
    event = make_event(is_published=True)

    response = staff_client.patch(detail(event), {"is_published": False}, format="json")

    assert response.status_code == 200
    event.refresh_from_db()
    assert event.is_published is False


def test_deletes_a_workshop(staff_client, make_event):
    event = make_event()

    assert staff_client.delete(detail(event)).status_code == 204
    assert not Event.objects.exists()


def test_rejects_an_end_before_the_start_with_the_models_message(staff_client, payload):
    """Validation is Event.clean(), reached through ModelCleanMixin. Same French message
    as the admin, on the same field, instead of a 500 from the CheckConstraint."""
    payload.update(start_time="16:00", end_time="14:00")

    response = staff_client.post(URL, payload, format="json")

    assert response.status_code == 400
    assert response.json() == {
        "end_time": ["L'heure de fin doit être postérieure à l'heure de début."]
    }
    assert not Event.objects.exists()


def test_rejects_an_online_workshop_that_still_carries_an_address(staff_client, payload):
    payload.update(location_kind="online", online_url="https://visio.example/abc")

    response = staff_client.post(URL, payload, format="json")

    assert response.status_code == 400
    assert response.json() == {
        "address": ["Un atelier en ligne ne doit pas porter d'adresse postale."]
    }


def test_rejects_an_onsite_workshop_without_an_address(staff_client, payload):
    payload.update(address=None)

    response = staff_client.post(URL, payload, format="json")

    assert response.status_code == 400
    assert response.json() == {"address": ["Une adresse est requise pour un atelier sur place."]}


def test_rejects_an_address_that_does_not_exist(staff_client, payload):
    payload.update(address="00000000-0000-4000-8000-000000000000")

    response = staff_client.post(URL, payload, format="json")

    assert response.status_code == 400
    assert "address" in response.json()


def test_the_list_reads_the_addresses_in_one_query(
    staff_client, make_event, django_assert_num_queries
):
    """The derived label reads each row's address. Without select_related that is one
    query per workshop."""
    for _ in range(3):
        make_event(location_kind=Event.LocationKind.ONSITE)

    # Session and user, then the count and the page.
    with django_assert_num_queries(4):
        staff_client.get(URL)


def test_a_patch_is_validated_against_the_stored_values(staff_client, make_event):
    """A partial update is checked as the row it would produce, not in isolation."""
    event = make_event(start_time=datetime.time(10, 0), end_time=datetime.time(12, 0))

    response = staff_client.patch(detail(event), {"start_time": "13:00"}, format="json")

    assert response.status_code == 400
    assert "end_time" in response.json()


def titles(response) -> list[str]:
    return [event["title"] for event in response.json()["results"]]


def test_the_list_is_paginated(staff_client, make_event, today):
    """The editor's list keeps every workshop ever held, so it pages, twenty at a time."""
    for offset in range(25):
        make_event(title=f"Atelier {offset:02}", date=today + datetime.timedelta(days=offset))

    first = staff_client.get(URL).json()
    second = staff_client.get(URL, {"page": 2}).json()

    assert first["count"] == 25
    assert len(first["results"]) == 20
    assert first["next"] is not None
    assert len(second["results"]) == 5
    assert second["next"] is None


def test_the_calendar_can_ask_for_bigger_pages_up_to_a_cap(staff_client, make_event, today):
    for offset in range(3):
        make_event(date=today + datetime.timedelta(days=offset))

    assert len(staff_client.get(URL, {"page_size": 2}).json()["results"]) == 2
    # Above max_page_size DRF clamps rather than erroring.
    assert len(staff_client.get(URL, {"page_size": 100000}).json()["results"]) == 3


def test_upcoming_lists_today_onwards_soonest_first(staff_client, make_event, today):
    make_event(title="Hier", date=today - datetime.timedelta(days=1))
    make_event(title="Plus tard", date=today + datetime.timedelta(days=9))
    make_event(title="Aujourd'hui", date=today)

    response = staff_client.get(URL, {"period": "upcoming"})

    assert titles(response) == ["Aujourd'hui", "Plus tard"]


def test_past_lists_the_most_recent_first(staff_client, make_event, today):
    """The workshop she just ran is the one she is most likely looking for."""
    make_event(title="Il y a longtemps", date=today - datetime.timedelta(days=90))
    make_event(title="Hier", date=today - datetime.timedelta(days=1))
    make_event(title="Aujourd'hui", date=today)

    response = staff_client.get(URL, {"period": "past"})

    assert titles(response) == ["Hier", "Il y a longtemps"]


def test_a_date_range_is_inclusive(staff_client, make_event):
    """What the calendar asks for: the weeks on screen, first and last day included."""
    for day in (1, 2, 30, 31):
        make_event(title=f"Le {day}", date=datetime.date(2027, 3, day))

    response = staff_client.get(URL, {"date_from": "2027-03-02", "date_to": "2027-03-30"})

    assert titles(response) == ["Le 2", "Le 30"]


def test_rejects_a_malformed_filter(staff_client):
    response = staff_client.get(URL, {"period": "someday", "date_from": "demain"})

    assert response.status_code == 400
    assert set(response.json()) == {"period", "date_from"}
