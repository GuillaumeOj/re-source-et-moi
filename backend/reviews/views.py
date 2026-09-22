from django.db.models import QuerySet
from rest_framework import generics, permissions, viewsets

from reviews.models import Review
from reviews.serializers import ReviewManageSerializer, ReviewSerializer

# How many reviews the home page shows. The cut is made here rather than in the frontend so
# the page never downloads reviews it then throws away.
HOME_PAGE_REVIEWS = 3


class ReviewListView(generics.ListAPIView):
    """The most recent published reviews, newest first.

    Public and unpaginated for the same reasons as the agenda and the tariffs: the content
    is already on the website, and a plain array generates a plain TypeScript array.
    """

    serializer_class = ReviewSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None

    def get_queryset(self) -> QuerySet[Review]:
        return Review.objects.filter(is_published=True)[:HOME_PAGE_REVIEWS]


class ReviewManageViewSet(viewsets.ModelViewSet):
    """Every review, hidden ones included, editable by staff. Backs the editor's
    "Témoignages" tab."""

    serializer_class = ReviewManageSerializer
    permission_classes = [permissions.IsAdminUser]
    pagination_class = None
    queryset = Review.objects.all()
