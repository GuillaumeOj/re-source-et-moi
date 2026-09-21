from django.contrib import admin
from django.db.models import Count, QuerySet
from django.http import HttpRequest

from agenda.models import Address, Event


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    """The saved places workshops point at.

    The workshop count says which ones are in use: those cannot be deleted (the foreign
    key is PROTECT) until their workshops move somewhere else.
    """

    list_display = ("name", "city", "one_line", "event_count")
    search_fields = ("name", "line1", "postal_code", "city")
    fields = ("name", "line1", "line2", "postal_code", "city")

    def get_queryset(self, request: HttpRequest) -> QuerySet[Address]:
        return super().get_queryset(request).annotate(event_count=Count("events"))

    @admin.display(description="adresse complète")
    def one_line(self, address: Address) -> str:
        return address.one_line

    @admin.display(description="ateliers", ordering="event_count")
    def event_count(self, address: Address) -> int:
        return getattr(address, "event_count", 0)


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    """The agenda editor.

    This is the whole UI the site owner has, so it is arranged for the job rather than
    left at Django's default: the address is picked from the saved places,
    and `is_published` is editable from the list so an atelier can be pulled off the site
    in one click without opening it.
    """

    list_display = ("title", "date", "start_time", "end_time", "location_label", "is_published")
    list_filter = ("is_published", "location_kind", "date")
    list_editable = ("is_published",)
    # The label column reads the address's city.
    list_select_related = ("address",)
    # The override, not the property — only stored columns are searchable, and the
    # address's city already covers the derived case.
    search_fields = (
        "title",
        "location_label_override",
        "address__name",
        "address__city",
        "description",
    )
    # A search box rather than a dropdown, once the list of places grows.
    autocomplete_fields = ("address",)
    date_hierarchy = "date"
    ordering = ("-date",)

    @admin.display(description="libellé du lieu")
    def location_label(self, event: Event) -> str:
        """What the site actually shows, override or derived — see Event.location_label."""
        return event.location_label

    fieldsets = (
        (None, {"fields": ("title", "description", "is_published")}),
        ("Quand", {"fields": ("date", "start_time", "end_time")}),
        (
            "Où",
            {
                "fields": (
                    "location_kind",
                    "location_label_override",
                    "online_url",
                    "address",
                )
            },
        ),
    )
