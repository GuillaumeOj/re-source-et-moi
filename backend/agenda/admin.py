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
    # The override, not the property — only stored columns are searchable, and `city`
    # already covers the derived case.
    search_fields = ("title", "location_label_override", "city", "description")
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
                    "address_line1",
                    "address_line2",
                    "postal_code",
                    "city",
                )
            },
        ),
    )
