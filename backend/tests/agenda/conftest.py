import datetime
import itertools

import pytest

from agenda.models import Address, Event


@pytest.fixture
def make_address():
    """Build a saved Address in Lyon, numbered so each one's unique name is free."""
    numbers = itertools.count(1)

    def _make_address(**overrides) -> Address:
        fields = {
            "name": f"Salle {next(numbers)}",
            "line1": "12 rue de la Charité",
            "postal_code": "69002",
            "city": "Lyon",
        }
        fields.update(overrides)
        return Address.objects.create(**fields)

    return _make_address


@pytest.fixture
def make_event(today, make_address):
    """Build an Event, defaulting to a published online workshop two weeks out.

    Every test overrides only the field it is about, so what a test is actually varying
    stays visible in its own body. An on-site workshop gets a fresh address unless the
    test passes its own, since clean() requires one.
    """

    def _make_event(**overrides) -> Event:
        fields = {
            "title": "Brain Gym® en mouvement",
            "date": today + datetime.timedelta(days=14),
            "start_time": datetime.time(10, 0),
            "end_time": datetime.time(12, 0),
            "location_kind": Event.LocationKind.ONLINE,
        }
        fields.update(overrides)
        if fields["location_kind"] == Event.LocationKind.ONSITE and "address" not in fields:
            fields["address"] = make_address()
        return Event.objects.create(**fields)

    return _make_event
