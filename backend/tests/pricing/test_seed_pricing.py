import pytest
from django.core.management import call_command
from django.core.management.base import CommandError

from pricing.models import Price, PricingType

pytestmark = [pytest.mark.django_db, pytest.mark.usefixtures("dev_environment")]


def test_covers_both_sides_of_the_on_demand_toggle():
    """Both rendering paths need to be visible in dev, not just the fixed-amount one."""
    call_command("seed_pricing")

    assert Price.objects.filter(on_demand=True, amount__isnull=True).exists()
    assert Price.objects.filter(on_demand=False, amount__isnull=False).exists()


def test_is_rerunnable_without_piling_up():
    call_command("seed_pricing")
    types, prices = PricingType.objects.count(), Price.objects.count()

    call_command("seed_pricing")

    assert (PricingType.objects.count(), Price.objects.count()) == (types, prices)


def test_a_refusal_destroys_nothing(settings, make_type):
    """The guard itself is covered in tests/config/test_seeding.py. What matters here is
    that this command is behind it — that the wipe cannot outrun the check."""
    existing = make_type(name="Vrai tarif")
    settings.ON_VERCEL = True

    with pytest.raises(CommandError):
        call_command("seed_pricing")

    assert PricingType.objects.filter(pk=existing.pk).exists()
