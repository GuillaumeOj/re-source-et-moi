from django.db.models import Prefetch, QuerySet
from rest_framework import generics, permissions

from pricing.models import Price, PricingType
from pricing.serializers import PricingTypeSerializer


class PricingTypeListView(generics.ListAPIView):
    """The published tariff groups, each with its published lines nested.

    Public and unpaginated for the same reasons as the agenda's list view: the content is
    already on the website, and a plain array generates a plain TypeScript array.
    """

    serializer_class = PricingTypeSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None

    def get_queryset(self) -> QuerySet[PricingType]:
        # "Published only" is said once, here, for groups and their lines alike — the
        # serializer just renders what it is handed. The Prefetch keeps the whole response
        # at two queries however many groups there are, and applying the filter inside it
        # (rather than after) means the prefetch cache holds exactly the rows to render.
        return PricingType.objects.filter(is_published=True).prefetch_related(
            Prefetch("prices", queryset=Price.objects.filter(is_published=True))
        )
