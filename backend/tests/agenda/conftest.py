import datetime

import pytest

from agenda.models import Event


@pytest.fixture
def make_event(today):
    """Build an Event, defaulting to a published online workshop two weeks out.

    Every test overrides only the field it is about, so what a test is actually varying
    stays visible in its own body.
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
        return Event.objects.create(**fields)

    return _make_event
