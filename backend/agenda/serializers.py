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
