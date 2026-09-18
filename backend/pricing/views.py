from django.db.models import Prefetch, QuerySet
from drf_spectacular.utils import extend_schema
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.request import Request
from rest_framework.response import Response

from pricing.models import Price, PricingType
from pricing.serializers import (
    PricingTypeManageSerializer,
    PricingTypeOrderSerializer,
    PricingTypeSerializer,
)

STALE_ORDER = "La liste des groupes a changé entre-temps. Rechargez la page."


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


class PricingTypeManageViewSet(viewsets.ModelViewSet):
    """Every tariff group with every line (hidden ones included), editable by staff.

    This backs the site owner's editor. Lines are written through their group (see
    PricingTypeManageSerializer), so there is no separate prices endpoint to keep
    consistent with this one.
    """

    serializer_class = PricingTypeManageSerializer
    permission_classes = [permissions.IsAdminUser]
    pagination_class = None
    # The prefetch keeps the list at two queries. On an update, DRF clears the prefetch
    # cache before serialising the response, so the lines sent back are the saved ones.
    queryset = PricingType.objects.prefetch_related("prices")

    @extend_schema(request=PricingTypeOrderSerializer, responses={204: None})
    @action(detail=False, methods=["post"])
    def reorder(self, request: Request) -> Response:
        """Set the order of every group at once, from the full list of ids.

        One request, and one UPDATE statement, rather than a PATCH per group from the
        browser: a reorder is all-or-nothing, never half-renumbered. The list must name
        every group exactly once, so a stale screen (a group added or deleted elsewhere)
        is refused instead of leaving two groups on the same position.
        """
        payload = PricingTypeOrderSerializer(data=request.data)
        payload.is_valid(raise_exception=True)
        ids = payload.validated_data["ids"]

        groups = {group.id: group for group in PricingType.objects.all()}
        if len(ids) != len(set(ids)) or set(ids) != set(groups):
            raise ValidationError({"ids": [STALE_ORDER]})

        for position, group_id in enumerate(ids):
            groups[group_id].position = position
        PricingType.objects.bulk_update(groups.values(), ["position"])
        return Response(status=status.HTTP_204_NO_CONTENT)
