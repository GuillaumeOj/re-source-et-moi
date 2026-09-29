from django.db.models import QuerySet
from rest_framework import generics, permissions, viewsets
from rest_framework.pagination import PageNumberPagination

from reviews.models import Review
from reviews.serializers import ReviewManageSerializer, ReviewSerializer


class ReviewPagination(PageNumberPagination):
    """Pages of 12 for the "Témoignages" page's infinite scroll. The home page asks for a
    page of 5 and reads `count` to know whether to link to the rest."""

    page_size = 12
    page_size_query_param = "page_size"
    max_page_size = 50


class ReviewListView(generics.ListAPIView):
    """Published reviews, newest first.

    Public, because the content is already on the website. Paginated, unlike the agenda
    and the tariffs, because reviews only ever pile up and the "Témoignages" page loads
    them as the visitor scrolls.
    """

    serializer_class = ReviewSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = ReviewPagination

    def get_queryset(self) -> QuerySet[Review]:
        return Review.objects.filter(is_published=True)


class ReviewManagePagination(PageNumberPagination):
    """Pages for the editor's table. Like the workshops' list, the editor sends the size it
    counts pages with (50), so the two sides cannot disagree."""

    page_size = 50
    page_size_query_param = "page_size"
    max_page_size = 50


class ReviewManageViewSet(viewsets.ModelViewSet):
    """Every review, hidden ones included, editable by staff. Backs the editor's
    "Témoignages" tab. The list is paginated, because like the workshops it only ever
    grows."""

    serializer_class = ReviewManageSerializer
    permission_classes = [permissions.IsAdminUser]
    pagination_class = ReviewManagePagination
    queryset = Review.objects.all()
