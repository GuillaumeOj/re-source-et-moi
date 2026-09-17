from django.contrib import admin

from agenda.models import Event


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    """The agenda editor.

    This is the whole UI the site owner has, so it is arranged for the job rather than
    left at Django's default: the address block collapses (most workshops are online),
    and `is_published` is editable from the list so an atelier can be pulled off the site
    in one click without opening it.
    """

    list_display = ("title", "date", "start_time", "end_time", "location_label", "is_published")
    list_filter = ("is_published", "location_kind", "date")
    list_editable = ("is_published",)
    search_fields = ("title", "location_label", "city", "description")
    date_hierarchy = "date"
    ordering = ("-date",)

    fieldsets = (
        (None, {"fields": ("title", "description", "is_published")}),
        ("Quand", {"fields": ("date", "start_time", "end_time")}),
        (
            "Où",
            {
                "fields": (
                    "location_kind",
                    "location_label",
                    "online_url",
                    "address_line1",
                    "address_line2",
                    "postal_code",
                    "city",
                )
            },
        ),
    )
