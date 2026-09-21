from django.db.models import QuerySet
from django.utils import timezone
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import generics, permissions, viewsets
from rest_framework.pagination import PageNumberPagination

from agenda.models import Event
from agenda.serializers import (
    EventListFilterSerializer,
    EventManageFilterSerializer,
    EventManageSerializer,
    EventSerializer,
)


@extend_schema(parameters=[EventListFilterSerializer])
class EventListView(generics.ListAPIView):
    """The published workshops, soonest first: the upcoming ones, or those in a date range.

    Without parameters this is the upcoming agenda, which the home page and the agenda's
    list view show. With `date_from`/`date_to` it is every published workshop in the range,
    past ones included, for the agenda's month calendar. Past workshops are no secret —
    they were on the site until their date — so opening the range up exposes nothing new.

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
        events = Event.objects.filter(is_published=True)

        filters = EventListFilterSerializer(data=self.request.query_params)
        filters.is_valid(raise_exception=True)
        params = filters.validated_data
        if not params:
            # localdate(), not utcnow(): TIME_ZONE is Europe/Paris, and a workshop is
            # "today" in the timezone it happens in. Comparing against UTC would drop an
            # evening workshop from the list an hour or two early.
            return events.filter(date__gte=timezone.localdate())

        if "date_from" in params:
            events = events.filter(date__gte=params["date_from"])
        if "date_to" in params:
            events = events.filter(date__lte=params["date_to"])
        return events


class EventManagePagination(PageNumberPagination):
    """Pages of 20 for the list view. The calendar asks for bigger pages (up to 200) so a
    six-week grid normally arrives in one request."""

    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 200


@extend_schema_view(list=extend_schema(parameters=[EventManageFilterSerializer]))
class EventManageViewSet(viewsets.ModelViewSet):
    """Every workshop (drafts and past ones included), editable by staff.

    This backs the site owner's editor. Unlike the public list it hides nothing: a draft is
    exactly what she is working on, and a past workshop is what she duplicates to plan the
    next one. The list is paginated, because unlike the public feed it only ever grows.
    """

    serializer_class = EventManageSerializer
    permission_classes = [permissions.IsAdminUser]
    pagination_class = EventManagePagination

    def get_queryset(self) -> QuerySet[Event]:
        events = Event.objects.all()
        if self.action != "list":
            return events

        filters = EventManageFilterSerializer(data=self.request.query_params)
        filters.is_valid(raise_exception=True)
        params = filters.validated_data

        # Same "today" as the public feed: Paris local date. See EventListView.
        today = timezone.localdate()
        if params.get("period") == "upcoming":
            events = events.filter(date__gte=today)
        elif params.get("period") == "past":
            # Most recent first: the workshop she just ran is the one she looks for.
            events = events.filter(date__lt=today).order_by("-date", "-start_time")
        if "date_from" in params:
            events = events.filter(date__gte=params["date_from"])
        if "date_to" in params:
            events = events.filter(date__lte=params["date_to"])
        return events
