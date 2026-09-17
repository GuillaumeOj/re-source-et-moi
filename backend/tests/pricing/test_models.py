import uuid
from decimal import Decimal

import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction

from pricing.models import Price, PricingType

pytestmark = pytest.mark.django_db


def test_primary_keys_are_uuid4(make_type, make_price):
    """Both models' PKs are random UUID-4s — see config.models.UUIDModel."""
    pricing_type = make_type()
    price = make_price(type=pricing_type)

    for pk in (pricing_type.pk, price.pk):
        assert isinstance(pk, uuid.UUID)
        assert pk.version == 4


def test_types_order_by_position_then_name(make_type):
    groupe = make_type(name="Groupe", position=1)
    individuel = make_type(name="Individuel", position=0)

    assert list(PricingType.objects.all()) == [individuel, groupe]


def test_prices_order_by_position(make_type, make_price):
    pricing_type = make_type()
    second = make_price(type=pricing_type, description="Enfant", position=1)
    first = make_price(type=pricing_type, description="Adulte", position=0)

    assert list(pricing_type.prices.all()) == [first, second]


def test_deleting_a_type_deletes_its_prices(make_type, make_price):
    """A price has no meaning apart from its group, so it goes with it."""
    pricing_type = make_type()
    make_price(type=pricing_type)

    pricing_type.delete()

    assert Price.objects.count() == 0


class TestAmountXorOnDemand:
    """A row is either an amount or "sur devis" — never both, never neither.

    This is the whole point of the toggle: the string it replaced ("Sur devis" sitting in
    a price field) conflated an amount with the absence of one.
    """

    def test_clean_rejects_an_amount_on_a_sur_devis_line(self, make_price):
        price = make_price()
        price.on_demand = True

        with pytest.raises(ValidationError) as excinfo:
            price.clean()

        assert "amount" in excinfo.value.message_dict

    def test_clean_rejects_a_line_with_neither(self, make_price):
        price = make_price()
        price.amount = None

        with pytest.raises(ValidationError) as excinfo:
            price.clean()

        assert "amount" in excinfo.value.message_dict

    def test_clean_accepts_an_amount(self, make_price):
        make_price(amount=Decimal("60.00"), on_demand=False).clean()  # must not raise

    def test_clean_accepts_sur_devis(self, make_price):
        make_price(amount=None, on_demand=True).clean()  # must not raise

    def test_the_database_refuses_both(self, make_price):
        """clean() guards the admin form; the constraint guards everything else.

        .update() writes straight to SQL without touching clean(), which is the path a
        constraint exists to cover.
        """
        price = make_price()

        with transaction.atomic(), pytest.raises(IntegrityError):
            Price.objects.filter(pk=price.pk).update(on_demand=True)

    def test_the_database_refuses_neither(self, make_price):
        price = make_price()

        with transaction.atomic(), pytest.raises(IntegrityError):
            Price.objects.filter(pk=price.pk).update(amount=None)


def test_type_str_is_its_name(make_type):
    assert str(make_type(name="Groupe")) == "Groupe"


def test_price_str_shows_the_amount_or_sur_devis(make_price):
    assert str(make_price(description="Adulte", amount=Decimal("75.00"))) == "Adulte — 75.00"
    assert (
        str(make_price(description="Atelier", amount=None, on_demand=True)) == "Atelier — sur devis"
    )
