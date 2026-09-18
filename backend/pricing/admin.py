from django.contrib import admin

from pricing.models import Price, PricingType


class PriceInline(admin.TabularInline):
    """Tariff lines edited inside their group.

    Inline rather than a separate page because a price means nothing apart from its
    group — editing "Individuel" should be one screen showing adult and child rates
    together, which is how they are read on the site.
    """

    model = Price
    extra = 1
    fields = ("position", "description", "amount", "on_demand", "is_published")
    ordering = ("position",)


@admin.register(PricingType)
class PricingTypeAdmin(admin.ModelAdmin):
    list_display = ("name", "position", "price_count", "is_published")
    list_filter = ("is_published",)
    list_editable = ("position", "is_published")
    search_fields = ("name", "description")
    ordering = ("position", "name")
    inlines = [PriceInline]

    def get_queryset(self, request):
        # price_count below reads the relation for every row; without this the changelist
        # fires one extra query per group.
        return super().get_queryset(request).prefetch_related("prices")

    @admin.display(description="tarifs")
    def price_count(self, pricing_type: PricingType) -> int:
        return len(pricing_type.prices.all())


@admin.register(Price)
class PriceAdmin(admin.ModelAdmin):
    """Registered as well as inlined, so a single tariff can be searched for directly."""

    list_display = ("description", "type", "amount", "on_demand", "position", "is_published")
    list_filter = ("is_published", "on_demand", "type")
    search_fields = ("description", "type__name")
    list_select_related = ("type",)
    ordering = ("type__position", "position")
