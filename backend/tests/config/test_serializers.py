"""config.serializers.ModelCleanMixin: the model's clean() as serializer validation.

The field-level cases (end before start, address on an online event, amount xor on
demand) are covered through the real endpoints in tests/agenda and tests/pricing. These
cover the mixin's own two behaviours.
"""

import datetime

import pytest
from django.core.exceptions import ValidationError

from agenda.models import Event
from agenda.serializers import EventManageSerializer

pytestmark = pytest.mark.django_db


def test_a_model_wide_error_lands_under_non_field_errors(monkeypatch):
    """Django files an error that names no field under `__all__`. DRF's key for the same
    thing is `non_field_errors`, which is what the editor displays at the top of a form."""

    def clean(self):
        raise ValidationError("Atelier invalide.")

    monkeypatch.setattr(Event, "clean", clean)
    serializer = EventManageSerializer(
        data={"title": "Atelier", "date": "2026-10-01", "start_time": "10:00", "end_time": "12:00"}
    )

    assert not serializer.is_valid()
    assert serializer.errors == {"non_field_errors": ["Atelier invalide."]}


def test_a_failed_update_leaves_the_instance_untouched():
    """Validation runs on a copy. The view still holds the instance, so writing the
    rejected values onto it would leak them into whatever it does next."""
    event = Event.objects.create(
        title="Atelier",
        date=datetime.date(2026, 10, 1),
        start_time=datetime.time(10, 0),
        end_time=datetime.time(12, 0),
        location_kind=Event.LocationKind.ONLINE,
    )

    serializer = EventManageSerializer(event, data={"end_time": "09:00"}, partial=True)

    assert not serializer.is_valid()
    assert event.end_time == datetime.time(12, 0)
