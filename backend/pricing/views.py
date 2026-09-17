from django.db.models import QuerySet
from rest_framework import generics, permissions

from pricing.models import PricingType
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
        # prefetch_related, so the whole response is two queries whatever the number of
        # groups. The serializer drops unpublished lines from the prefetched set in Python
        # rather than filtering here — see PricingTypeSerializer.get_prices.
        return PricingType.objects.filter(is_published=True).prefetch_related("prices")
