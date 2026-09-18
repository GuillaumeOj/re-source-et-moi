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

    Which lines are visible is decided once, in the view's Prefetch — not here. A plain
    nested serializer then types itself in the OpenAPI schema, where a SerializerMethodField
    would have needed an @extend_schema_field to say what it returns.
    """

    prices = PriceSerializer(many=True, read_only=True)

    class Meta:
        model = PricingType
        fields = ("id", "name", "description", "prices")
