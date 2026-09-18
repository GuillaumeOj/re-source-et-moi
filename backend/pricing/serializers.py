from typing import Any

from django.db import transaction
from rest_framework import serializers

from config.serializers import ModelCleanMixin
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


class PriceManageSerializer(ModelCleanMixin):
    """One tariff line as the editor writes it, inside its group.

    `id` is writable (optional) here, unlike on the model. It is how a save tells the
    group "this is the existing line, updated" apart from "this is a new line". Lines
    sent without one are created.
    """

    id = serializers.UUIDField(required=False)

    class Meta:
        model = Price
        fields = ("id", "description", "amount", "on_demand", "position", "is_published")
        # Both halves of the amount-xor-on-demand rule are required, `amount` as an
        # explicit null. clean() validates the line as sent. If one half could be omitted,
        # an existing line would keep its stored value for it, and the saved row could
        # break the CheckConstraint that clean() had just passed.
        extra_kwargs = {
            "amount": {"required": True, "allow_null": True},
            "on_demand": {"required": True},
        }


class PricingTypeManageSerializer(ModelCleanMixin):
    """A tariff group with its lines, saved in one request.

    This mirrors the admin's inline: the site owner edits "Individuel" and all its lines
    on one screen, and one "Enregistrer" writes the lot. When `prices` is sent, it is the
    group's complete list. Lines with an `id` are updated, lines without one are created,
    and any existing line left out is deleted, all in one transaction. So a bad line
    leaves the whole group as it was.
    """

    prices = PriceManageSerializer(many=True, required=False)

    class Meta:
        model = PricingType
        fields = ("id", "name", "description", "position", "is_published", "prices")

    def validate_prices(self, lines: list[dict[str, Any]]) -> list[dict[str, Any]]:
        # A line may only be updated through the group it belongs to. An id from another
        # group (or a deleted line) would otherwise be silently re-parented or 500 on save.
        # .all(), not .values_list(): the viewset prefetched the lines, so this is free.
        owned = {price.id for price in self.instance.prices.all()} if self.instance else set()
        if any("id" in line and line["id"] not in owned for line in lines):
            raise serializers.ValidationError("Un tarif envoyé n'appartient pas à ce groupe.")
        return lines

    @transaction.atomic
    def create(self, validated_data: dict[str, Any]) -> PricingType:
        lines = validated_data.pop("prices", [])
        pricing_type = PricingType.objects.create(**validated_data)
        self._sync_prices(pricing_type, lines)
        return pricing_type

    @transaction.atomic
    def update(self, instance: PricingType, validated_data: dict[str, Any]) -> PricingType:
        lines = validated_data.pop("prices", None)
        instance = super().update(instance, validated_data)
        # Absent means "lines untouched" (a PATCH of the name alone). An empty list means
        # "this group has no lines".
        if lines is not None:
            self._sync_prices(instance, lines)
        return instance

    def _sync_prices(self, pricing_type: PricingType, lines: list[dict[str, Any]]) -> None:
        existing = {price.id: price for price in pricing_type.prices.all()}
        kept = []
        for line in lines:
            fields = dict(line)
            line_id = fields.pop("id", None)
            price = existing[line_id] if line_id is not None else Price(type=pricing_type)
            for name, value in fields.items():
                setattr(price, name, value)
            price.save()
            kept.append(price.id)
        pricing_type.prices.exclude(id__in=kept).delete()


class PricingTypeOrderSerializer(serializers.Serializer):
    """Every group's id, in the order the site should show them."""

    ids = serializers.ListField(child=serializers.UUIDField(), allow_empty=False)
