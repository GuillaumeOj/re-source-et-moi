import itertools
from decimal import Decimal

import pytest

from pricing.models import Price, PricingType


@pytest.fixture
def make_type():
    """Build a PricingType. `name` is unique on the model, so the default is numbered —
    a test that doesn't care about the name can still make several."""
    counter = itertools.count(1)

    def _make_type(**overrides) -> PricingType:
        fields = {
            "name": f"Type {next(counter)}",
            "description": "Par séance individuelle.",
        }
        fields.update(overrides)
        return PricingType.objects.create(**fields)

    return _make_type


@pytest.fixture
def make_price(make_type):
    """Build a Price, defaulting to a fixed-amount line under a group of its own."""

    def _make_price(**overrides) -> Price:
        fields = {
            "description": "Adulte",
            "amount": Decimal("75.00"),
            "on_demand": False,
        }
        fields.update(overrides)
        # Built only when the caller didn't supply one — setdefault() would construct a
        # throwaway group on every call, and the model's unique name would then collide.
        if "type" not in fields:
            fields["type"] = make_type()
        return Price.objects.create(**fields)

    return _make_price
