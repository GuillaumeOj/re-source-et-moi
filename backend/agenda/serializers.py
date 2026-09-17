from rest_framework import serializers

from agenda.models import Event


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
        parts = [
            event.address_line1,
            event.address_line2,
            " ".join(part for part in (event.postal_code, event.city) if part),
        ]
        return ", ".join(part for part in parts if part)
