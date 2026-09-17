import datetime
import uuid

import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction

from agenda.models import Event

pytestmark = pytest.mark.django_db


def test_primary_key_is_a_uuid4(make_event):
    """Every model's PK is a random UUID-4 — see config.models.UUIDModel."""
    event = make_event()

    assert isinstance(event.pk, uuid.UUID)
    assert event.pk.version == 4


def test_id_exists_before_the_row_is_saved(today):
    """The default is generated in Python, so an unsaved instance already knows its id."""
    event = Event(
        title="Atelier",
        date=today,
        start_time=datetime.time(10, 0),
        end_time=datetime.time(12, 0),
    )

    assert isinstance(event.pk, uuid.UUID)


def test_ordering_is_chronological(make_event, today):
    later_same_day = make_event(
        date=today, start_time=datetime.time(14, 0), end_time=datetime.time(16, 0)
    )
    earlier_same_day = make_event(
        date=today, start_time=datetime.time(9, 0), end_time=datetime.time(11, 0)
    )
    next_week = make_event(date=today + datetime.timedelta(days=7))

    assert list(Event.objects.all()) == [earlier_same_day, later_same_day, next_week]


class TestLocationLabel:
    """`location_label` is derived on save so the common case needs no typing."""

    def test_defaults_to_the_online_label(self, make_event):
        event = make_event(location_kind=Event.LocationKind.ONLINE)

        assert event.location_label == "En ligne"

    def test_defaults_to_the_city_when_on_site(self, make_event):
        event = make_event(location_kind=Event.LocationKind.ONSITE, city="Lyon")

        assert event.location_label == "Lyon"

    def test_an_explicit_label_is_kept(self, make_event):
        event = make_event(
            location_kind=Event.LocationKind.ONSITE, city="Lyon", location_label="Lyon 6e"
        )

        assert event.location_label == "Lyon 6e"


class TestClean:
    def test_rejects_an_end_before_the_start(self, make_event):
        event = make_event()
        event.end_time = datetime.time(9, 0)

        with pytest.raises(ValidationError) as excinfo:
            event.clean()

        assert "end_time" in excinfo.value.message_dict

    def test_rejects_an_end_equal_to_the_start(self, make_event):
        event = make_event()
        event.end_time = event.start_time

        with pytest.raises(ValidationError) as excinfo:
            event.clean()

        assert "end_time" in excinfo.value.message_dict

    def test_rejects_an_online_workshop_carrying_a_postal_address(self, make_event):
        """A leftover address would make the site show a city nobody travels to."""
        event = make_event(location_kind=Event.LocationKind.ONLINE)
        event.city = "Lyon"

        with pytest.raises(ValidationError) as excinfo:
            event.clean()

        assert "city" in excinfo.value.message_dict

    def test_rejects_an_on_site_workshop_without_a_city(self, make_event):
        """The city is what the agenda row displays; without it the row renders blank."""
        event = make_event(location_kind=Event.LocationKind.ONSITE, city="Lyon")
        event.city = ""

        with pytest.raises(ValidationError) as excinfo:
            event.clean()

        assert "city" in excinfo.value.message_dict

    def test_accepts_a_valid_on_site_workshop(self, make_event):
        event = make_event(
            location_kind=Event.LocationKind.ONSITE, city="Lyon", postal_code="69002"
        )

        event.clean()  # must not raise

    def test_accepts_a_valid_online_workshop(self, make_event):
        make_event(location_kind=Event.LocationKind.ONLINE).clean()  # must not raise


def test_the_database_also_refuses_an_end_before_the_start(make_event, today):
    """clean() is the admin's guard; the CheckConstraint is the one that cannot be bypassed.

    .update() goes straight to SQL without touching clean(), which is exactly the path a
    constraint has to cover.
    """
    event = make_event()

    with transaction.atomic(), pytest.raises(IntegrityError):
        Event.objects.filter(pk=event.pk).update(end_time=datetime.time(9, 0))


def test_str_names_the_workshop_and_its_date(make_event, today):
    event = make_event(title="ECAP", date=today)

    assert str(event) == f"ECAP — {today}"
