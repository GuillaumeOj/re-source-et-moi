import pytest
from django.core.management import call_command
from django.core.management.base import CommandError
from django.utils import timezone

from agenda.models import Event

pytestmark = pytest.mark.django_db


@pytest.fixture(autouse=True)
def dev_environment(settings):
    """The command refuses to run outside local development; tests opt in explicitly."""
    settings.DEBUG = True
    settings.ON_VERCEL = False


def test_creates_a_dataset_covering_more_than_the_happy_path():
    call_command("seed_agenda")

    today = timezone.localdate()
    assert Event.objects.filter(is_published=False).exists()
    assert Event.objects.filter(date__lt=today).exists()
    assert Event.objects.filter(location_kind=Event.LocationKind.ONLINE).exists()
    assert Event.objects.filter(location_kind=Event.LocationKind.ONSITE).exists()


def test_is_rerunnable_without_piling_up():
    call_command("seed_agenda")
    first = Event.objects.count()

    call_command("seed_agenda")

    assert Event.objects.count() == first


def test_location_labels_are_derived():
    """save() derives the label; bulk_create would have skipped it."""
    call_command("seed_agenda")

    assert not Event.objects.filter(location_label="").exists()


def test_refuses_to_run_on_a_vercel_deployment(settings):
    """It wipes data. On a deployment those rows are the owner's real agenda."""
    settings.ON_VERCEL = True

    with pytest.raises(CommandError, match="Vercel"):
        call_command("seed_agenda")


def test_refuses_to_run_with_debug_off(settings):
    """Catches the case Vercel's own flag cannot see: a laptop pointed at production."""
    settings.DEBUG = False

    with pytest.raises(CommandError, match="DEBUG"):
        call_command("seed_agenda")


def test_a_refusal_destroys_nothing(settings, make_event):
    existing = make_event(title="Vrai atelier")
    settings.ON_VERCEL = True

    with pytest.raises(CommandError):
        call_command("seed_agenda")

    assert Event.objects.filter(pk=existing.pk).exists()
