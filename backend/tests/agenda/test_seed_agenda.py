import pytest
from django.core.management import call_command
from django.core.management.base import CommandError
from django.utils import timezone

from agenda.models import Event

pytestmark = [pytest.mark.django_db, pytest.mark.usefixtures("dev_environment")]


def test_creates_a_dataset_covering_more_than_the_happy_path():
    call_command("seed_agenda")

    today = timezone.localdate()
    assert Event.objects.filter(is_published=False).exists()
    assert Event.objects.filter(date__lt=today).exists()
    assert Event.objects.filter(location_kind=Event.LocationKind.ONLINE).exists()
    assert Event.objects.filter(location_kind=Event.LocationKind.ONSITE).exists()


def test_has_more_upcoming_workshops_than_the_home_page_shows():
    """The home page shows four; a fifth is what makes its "Voir tout l'agenda" link show
    something new in dev."""
    call_command("seed_agenda")

    today = timezone.localdate()
    assert Event.objects.filter(is_published=True, date__gte=today).count() > 4


def test_has_past_workshops_in_two_different_months():
    """History for the agenda's calendar to look back on, beyond the current month."""
    call_command("seed_agenda")

    today = timezone.localdate()
    past = Event.objects.filter(is_published=True, date__lt=today)
    assert len({(event.date.year, event.date.month) for event in past}) >= 2


def test_is_rerunnable_without_piling_up():
    call_command("seed_agenda")
    first = Event.objects.count()

    call_command("seed_agenda")

    assert Event.objects.count() == first


def test_every_workshop_has_a_label_to_display():
    """The label is derived from the kind or the city, so a seeded row that set neither
    would render a blank location on the site."""
    call_command("seed_agenda")

    assert all(event.location_label for event in Event.objects.all())


def test_a_refusal_destroys_nothing(settings, make_event):
    """The guard itself is covered in tests/config/test_seeding.py. What matters here is
    that this command is behind it — that the wipe cannot outrun the check."""
    existing = make_event(title="Vrai atelier")
    settings.ON_VERCEL = True

    with pytest.raises(CommandError):
        call_command("seed_agenda")

    assert Event.objects.filter(pk=existing.pk).exists()
