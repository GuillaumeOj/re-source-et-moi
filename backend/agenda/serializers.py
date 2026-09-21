from rest_framework import serializers

from agenda.models import Event
from config.serializers import ModelCleanMixin


class EventSerializer(serializers.ModelSerializer):
    """A workshop as the public agenda needs it.

    Values go out machine-readable — an ISO date, ISO times, a location kind — and the
    frontend renders them with Intl.DateTimeFormat("fr-FR"). Formatting here instead would
    put French display strings in the database's contract and make the data unsortable
    again, which is the exact problem this replaced.

    The postal address is flattened into a single `address` string: the site shows one
    line, and the separate fields exist so the admin form can guide input, not because
    anything downstream wants them apart.
    """

    # Both are read-only model properties: the label falls back to the kind or the city,
    # the address is assembled from the four stored parts. Neither has a stored copy that
    # could go stale.
    location_label = serializers.CharField(read_only=True)
    address = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = (
            "id",
            "title",
            "date",
            "start_time",
            "end_time",
            "location_kind",
            "location_label",
            "online_url",
            "address",
            "description",
        )

    def get_address(self, event: Event) -> str:
        """The postal address on one line, or "" for an online workshop."""
        if event.is_online:
            return ""
        # The postcode and city share a line ("69002 Lyon"); everything else is
        # comma-separated. Blanks drop out of both joins.
        locality = " ".join(filter(None, (event.postal_code, event.city)))
        return ", ".join(filter(None, (event.address_line1, event.address_line2, locality)))


class EventManageSerializer(ModelCleanMixin):
    """A workshop as the site owner's editor reads and writes it.

    Not the public shape. It carries the stored address parts and the label override
    (what the form edits) and `is_published`. The derived `location_label` is read-only,
    so the list can show what the site will display. Validation reuses `Event.clean()`
    through ModelCleanMixin, so the editor gets the admin's French field messages.
    """

    location_label = serializers.CharField(read_only=True)

    class Meta:
        model = Event
        fields = (
            "id",
            "title",
            "date",
            "start_time",
            "end_time",
            "location_kind",
            "location_label_override",
            "location_label",
            "online_url",
            "address_line1",
            "address_line2",
            "postal_code",
            "city",
            "description",
            "is_published",
        )


class EventListFilterSerializer(serializers.Serializer):
    """The optional date range of the public workshop list.

    Both bounds are inclusive. Without them the list is the upcoming workshops; with them
    it is whatever was published in the range, past included — the website's month
    calendar asks for the six weeks it is showing, and can look back at earlier months.
    """

    date_from = serializers.DateField(required=False)
    date_to = serializers.DateField(required=False)

    def validate(self, attrs: dict) -> dict:
        date_from, date_to = attrs.get("date_from"), attrs.get("date_to")
        if date_from and date_to and date_to < date_from:
            raise serializers.ValidationError(
                {"date_to": "La date de fin doit être postérieure à la date de début."}
            )
        return attrs


class EventManageFilterSerializer(EventListFilterSerializer):
    """The query parameters of the editor's workshop list.

    `period` backs the list view's two tabs. `date_from`/`date_to` (inclusive, inherited
    from the public filter) back the calendar, which asks for the weeks it is showing.
    They combine, and all are optional.
    """

    period = serializers.ChoiceField(
        choices=[("upcoming", "À venir"), ("past", "Passés")],
        required=False,
        help_text="upcoming: from today on, soonest first. past: before today, latest first.",
    )
