from django.db.models import QuerySet
from django.utils import timezone
from rest_framework import generics, permissions

from agenda.models import Event
from agenda.serializers import EventSerializer


class EventListView(generics.ListAPIView):
    """The published, still-upcoming workshops, soonest first.

    Public: this is the same content the website already shows to anyone, so requiring a
    token would only complicate the caller. DRF's project default is IsAuthenticated, so
    the AllowAny here is a deliberate, visible exception rather than a missing setting.

    Pagination is off. The list is a handful of rows, and an unpaginated response makes
    the generated TypeScript type a plain array instead of {count, next, previous,
    results} — the frontend maps over it directly.
    """

    serializer_class = EventSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None

    def get_queryset(self) -> QuerySet[Event]:
        # localdate(), not utcnow(): TIME_ZONE is Europe/Paris, and a workshop is "today"
        # in the timezone it happens in. Comparing against UTC would drop an evening
        # workshop from the list an hour or two early.
        return Event.objects.filter(is_published=True, date__gte=timezone.localdate())
