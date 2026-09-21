"""GET /api/events/ — the "Prochains rendez-vous" feed."""

import datetime

import pytest

from agenda.models import Event

pytestmark = pytest.mark.django_db

URL = "/api/events/"


def test_is_public(client, make_event):
    """No credentials. DRF's project default is IsAuthenticated, so this asserts the
    AllowAny opt-out is actually in place — the content is already public on the site."""
    make_event()

    assert client.get(URL).status_code == 200


def test_returns_a_plain_array_not_a_paginated_envelope(client, make_event):
    """pagination_class = None is what makes the generated TS type a plain array."""
    make_event()

    body = client.get(URL).json()

    assert isinstance(body, list)
    assert len(body) == 1


def test_excludes_past_workshops(client, make_event, today):
    """The thing the hardcoded list could never do: drop itself once the date passes."""
    make_event(title="Passé", date=today - datetime.timedelta(days=1))
    make_event(title="À venir", date=today + datetime.timedelta(days=1))

    titles = [event["title"] for event in client.get(URL).json()]

    assert titles == ["À venir"]


def test_includes_a_workshop_happening_today(client, make_event, today):
    """date__gte, not __gt: a workshop this evening is still upcoming this morning."""
    make_event(title="Aujourd'hui", date=today)

    titles = [event["title"] for event in client.get(URL).json()]

    assert titles == ["Aujourd'hui"]


def test_excludes_unpublished_workshops(client, make_event):
    make_event(title="Brouillon", is_published=False)
    make_event(title="Publié")

    titles = [event["title"] for event in client.get(URL).json()]

    assert titles == ["Publié"]


def test_orders_soonest_first(client, make_event, today):
    make_event(title="Plus tard", date=today + datetime.timedelta(days=30))
    make_event(title="Bientôt", date=today + datetime.timedelta(days=3))

    titles = [event["title"] for event in client.get(URL).json()]

    assert titles == ["Bientôt", "Plus tard"]


def test_dates_and_times_go_out_machine_readable(client, make_event, today):
    """No "14"/"Juin"/"Samedi · 10h–12h" in the payload.

    French rendering is the frontend's job (Intl.DateTimeFormat). Formatting here would
    put display strings back in the API contract and make the data unsortable again.
    """
    date = today + datetime.timedelta(days=14)
    make_event(date=date, start_time=datetime.time(10, 0), end_time=datetime.time(12, 30))

    [event] = client.get(URL).json()

    assert event["date"] == date.isoformat()
    assert event["start_time"] == "10:00:00"
    assert event["end_time"] == "12:30:00"


def test_an_online_workshop_reports_its_kind_and_no_address(client, make_event):
    make_event(location_kind=Event.LocationKind.ONLINE, online_url="https://example.test/visio")

    [event] = client.get(URL).json()

    assert event["location_kind"] == "online"
    assert event["location_label"] == "En ligne"
    assert event["address"] == ""
    assert event["online_url"] == "https://example.test/visio"


def test_an_on_site_workshop_flattens_its_address_to_one_line(client, make_event):
    make_event(
        location_kind=Event.LocationKind.ONSITE,
        address_line1="12 rue de la Charité",
        address_line2="Bâtiment B",
        postal_code="69002",
        city="Lyon",
    )

    [event] = client.get(URL).json()

    assert event["location_kind"] == "onsite"
    assert event["location_label"] == "Lyon"
    assert event["address"] == "12 rue de la Charité, Bâtiment B, 69002 Lyon"


def test_address_omits_the_parts_that_are_blank(client, make_event):
    make_event(location_kind=Event.LocationKind.ONSITE, city="Lyon")

    [event] = client.get(URL).json()

    assert event["address"] == "Lyon"


def test_empty_agenda_is_an_empty_list_not_an_error(client):
    """After the last workshop passes this is the normal state, not a failure."""
    response = client.get(URL)

    assert response.status_code == 200
    assert response.json() == []


def test_a_date_range_includes_past_published_workshops(client, make_event, today):
    """The agenda's calendar looks back at earlier months."""
    last_month = today - datetime.timedelta(days=30)
    make_event(title="Passé", date=last_month)

    response = client.get(URL, {"date_from": last_month.isoformat(), "date_to": today.isoformat()})

    assert [event["title"] for event in response.json()] == ["Passé"]


def test_a_date_range_still_excludes_unpublished_workshops(client, make_event, today):
    make_event(title="Brouillon", date=today, is_published=False)

    response = client.get(URL, {"date_from": today.isoformat(), "date_to": today.isoformat()})

    assert response.json() == []


def test_date_range_bounds_are_inclusive(client, make_event, today):
    start = today + datetime.timedelta(days=10)
    end = today + datetime.timedelta(days=20)
    make_event(title="Avant", date=start - datetime.timedelta(days=1))
    make_event(title="Premier jour", date=start)
    make_event(title="Dernier jour", date=end)
    make_event(title="Après", date=end + datetime.timedelta(days=1))

    response = client.get(URL, {"date_from": start.isoformat(), "date_to": end.isoformat()})

    assert [event["title"] for event in response.json()] == ["Premier jour", "Dernier jour"]


def test_a_single_bound_is_enough(client, make_event, today):
    """date_to alone reaches back to the start of time: past workshops included."""
    make_event(title="Passé", date=today - datetime.timedelta(days=30))
    make_event(title="Trop tard", date=today + datetime.timedelta(days=30))

    response = client.get(URL, {"date_to": today.isoformat()})

    assert [event["title"] for event in response.json()] == ["Passé"]


def test_rejects_an_inverted_date_range(client, today):
    response = client.get(
        URL,
        {
            "date_from": today.isoformat(),
            "date_to": (today - datetime.timedelta(days=1)).isoformat(),
        },
    )

    assert response.status_code == 400
    assert "date_to" in response.json()


def test_rejects_a_malformed_date(client):
    assert client.get(URL, {"date_from": "demain"}).status_code == 400
