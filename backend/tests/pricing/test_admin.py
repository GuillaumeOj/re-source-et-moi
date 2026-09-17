"""The admin is the product here — it is the entire UI the site owner has — so its
behaviour is tested rather than assumed."""

import pytest
from django.contrib.admin.sites import AdminSite

from pricing.admin import PricingTypeAdmin
from pricing.models import PricingType

pytestmark = pytest.mark.django_db


@pytest.fixture
def pricing_admin() -> PricingTypeAdmin:
    return PricingTypeAdmin(PricingType, AdminSite())


def test_price_count_reports_the_lines_in_the_group(pricing_admin, make_type, make_price):
    pricing_type = make_type()
    make_price(type=pricing_type, description="Adulte")
    make_price(type=pricing_type, description="Enfant")

    assert pricing_admin.price_count(pricing_type) == 2


def test_price_count_counts_unpublished_lines_too(pricing_admin, make_type, make_price):
    """The changelist is the editing view: a hidden line still exists and still needs
    finding. Only the public API filters on is_published."""
    pricing_type = make_type()
    make_price(type=pricing_type, is_published=False)

    assert pricing_admin.price_count(pricing_type) == 1


def test_the_changelist_does_not_query_once_per_group(
    pricing_admin, make_type, make_price, django_assert_num_queries, rf
):
    """price_count reads the relation for every row, so get_queryset prefetches it."""
    for index in range(5):
        make_price(type=make_type(position=index))

    request = rf.get("/")
    with django_assert_num_queries(2):
        groups = list(pricing_admin.get_queryset(request))
        for group in groups:
            pricing_admin.price_count(group)
