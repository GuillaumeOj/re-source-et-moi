from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from pricing.models import Price, PricingType


class PriceSerializer(serializers.ModelSerializer):
    """One tariff line.

    `amount` goes out as a decimal string (DRF's default, which avoids float rounding) or
    null when the tariff is on demand. The frontend formats it with Intl.NumberFormat —
    the euro sign never enters the data.
    """

    class Meta:
        model = Price
        fields = ("id", "description", "amount", "on_demand")


class PricingTypeSerializer(serializers.ModelSerializer):
    """A tariff group with its lines nested.

    Nested rather than a second endpoint because the site renders exactly this shape —
    one card per group, a list of lines inside it. One request, and no chance of the two
    halves arriving inconsistent.
    """

    prices = serializers.SerializerMethodField()

    class Meta:
        model = PricingType
        fields = ("id", "name", "description", "prices")

    # Without this the schema types `prices` as an array of untyped objects — a
    # SerializerMethodField's return annotation is all drf-spectacular has to go on, and
    # `list[dict]` says nothing. The generated TypeScript would then be Record<string,
    # unknown>[] and the frontend would lose every price field, which is most of the point
    # of generating types at all.
    @extend_schema_field(PriceSerializer(many=True))
    def get_prices(self, pricing_type: PricingType) -> list[dict]:
        # Filtering in Python, not with .filter(): the view prefetches `prices`, and a
        # fresh queryset here would bypass that cache and fire one query per group.
        # Keeping the unpublished check on this side rather than in the prefetch means the
        # serializer is correct on its own, whatever queryset it is handed.
        prices = [price for price in pricing_type.prices.all() if price.is_published]
        # list(): `.data` is DRF's ReturnList, which is a list subclass — list is
        # invariant, so returning it directly doesn't satisfy the list[dict] annotation.
        return list(PriceSerializer(prices, many=True).data)
