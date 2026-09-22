from django.db.models import Count, ProtectedError, QuerySet
from django.utils import timezone
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import generics, permissions, viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.pagination import PageNumberPagination
from rest_framework.settings import api_settings

from agenda.models import Address, Event
from agenda.serializers import (
    AddressManageSerializer,
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
        # select_related: the label and the address both read the Address row.
        events = Event.objects.filter(is_published=True).select_related("address")

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
        # select_related: the derived location_label reads the Address row.
        events = Event.objects.select_related("address")
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


class AddressManageViewSet(viewsets.ModelViewSet):
    """The saved addresses workshops point at, editable by staff.

    Unpaginated: it is a short list of places, which the event form loads whole into its
    picker. A delete is refused while a workshop still uses the address — the foreign key
    is PROTECT — with a message saying so, rather than the 500 the ProtectedError would be.
    """

    serializer_class = AddressManageSerializer
    permission_classes = [permissions.IsAdminUser]
    pagination_class = None

    def get_queryset(self) -> QuerySet[Address]:
        # order_by spelled out: Django drops Meta.ordering from a query that aggregates.
        return Address.objects.annotate(event_count=Count("events")).order_by("name")

    def perform_destroy(self, instance: Address) -> None:
        try:
            instance.delete()
        except ProtectedError as error:
            count = len(error.protected_objects)
            workshops = "atelier" if count == 1 else "ateliers"
            # Under non_field_errors, where the editor reads errors about a whole record.
            raise ValidationError(
                {
                    api_settings.NON_FIELD_ERRORS_KEY: [
                        f"Cette adresse est utilisée par {count} {workshops} ; "
                        "choisissez-leur une autre adresse avant de la supprimer."
                    ]
                }
            ) from error
