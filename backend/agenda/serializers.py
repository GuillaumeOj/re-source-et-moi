from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from agenda.models import Address, Event
from config.serializers import ModelCleanMixin


class EventSerializer(serializers.ModelSerializer):
    """A workshop as the public agenda needs it.

    Values go out machine-readable — an ISO date, ISO times, a location kind — and the
    frontend renders them with Intl.DateTimeFormat("fr-FR"). Formatting here instead would
    put French display strings in the database's contract and make the data unsortable
    again, which is the exact problem this replaced.

    The postal address is flattened into a single `address` string: the site shows one
    line, and the saved Address keeps its parts apart so the forms can guide input, not
    because anything downstream wants them apart.
    """

    # Both are derived on read: the label falls back to the kind or the address's city, the
    # address is assembled from the saved Address's parts. Neither has a stored copy on the
    # event that could go stale.
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
        if event.is_online or event.address is None:
            return ""
        return event.address.one_line


class EventManageSerializer(ModelCleanMixin):
    """A workshop as the site owner's editor reads and writes it.

    Not the public shape. It carries the chosen Address's id and the label override (what
    the form edits) and `is_published`. The derived `location_label` is read-only,
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
            "address",
            "description",
            "is_published",
        )


class AddressManageSerializer(ModelCleanMixin):
    """A saved address as the editor's "Adresses" tab reads and writes it.

    `event_count` is how many workshops use it, so the editor can say why one cannot be
    deleted before she tries. It comes from the viewset's annotation; a freshly created
    address has none, and uses nothing. `one_line` is the address as the site prints it, so
    the editor shows the same thing without formatting it a second time.
    """

    one_line = serializers.CharField(read_only=True)
    event_count = serializers.SerializerMethodField()

    class Meta:
        model = Address
        fields = ("id", "name", "line1", "line2", "postal_code", "city", "one_line", "event_count")

    @extend_schema_field(serializers.IntegerField())
    def get_event_count(self, address: Address) -> int:
        return getattr(address, "event_count", 0)


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
