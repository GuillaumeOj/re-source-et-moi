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
    """`location_label` is derived on read, so it cannot go stale.

    Only the override is stored. Nothing has to notice an edit and refresh a copy — which
    also means no write path (.update(), bulk_create) can leave the site showing the old
    city, the way a stored label would.
    """

    def test_defaults_to_the_online_label(self, make_event):
        event = make_event(location_kind=Event.LocationKind.ONLINE)

        assert event.location_label == "En ligne"

    def test_defaults_to_the_city_when_on_site(self, make_event):
        event = make_event(location_kind=Event.LocationKind.ONSITE, city="Lyon")

        assert event.location_label == "Lyon"

    def test_an_override_wins(self, make_event):
        event = make_event(
            location_kind=Event.LocationKind.ONSITE, city="Lyon", location_label_override="Lyon 6e"
        )

        assert event.location_label == "Lyon 6e"

    def test_follows_the_city(self, make_event):
        """Editing the city must not leave the agenda row naming the old one."""
        make_event(location_kind=Event.LocationKind.ONSITE, city="Lyon")

        Event.objects.update(city="Paris")

        # .update() writes straight to SQL. A stored label would still read "Lyon" here.
        assert Event.objects.get().location_label == "Paris"

    def test_follows_a_switch_to_online(self, make_event):
        """clean() forces the address off when a workshop moves online; the label, which is
        what the site actually displays, moves with it."""
        make_event(location_kind=Event.LocationKind.ONSITE, city="Lyon")

        Event.objects.update(location_kind=Event.LocationKind.ONLINE, city="")

        assert Event.objects.get().location_label == "En ligne"

    def test_an_override_survives_an_edit(self, make_event):
        """The override is the owner's wording and is never recomputed."""
        make_event(
            location_kind=Event.LocationKind.ONSITE, city="Lyon", location_label_override="Lyon 6e"
        )

        Event.objects.update(city="Paris")

        assert Event.objects.get().location_label == "Lyon 6e"


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

    def test_flags_the_address_field_that_actually_holds_the_leftover(self, make_event):
        """An error parked on an empty "Ville" would point the editor at the wrong box."""
        event = make_event(location_kind=Event.LocationKind.ONLINE)
        event.address_line1 = "12 rue de la Charité"

        with pytest.raises(ValidationError) as excinfo:
            event.clean()

        assert "address_line1" in excinfo.value.message_dict
        assert "city" not in excinfo.value.message_dict

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
