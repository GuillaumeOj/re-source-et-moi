from django.urls import path
from rest_framework.routers import SimpleRouter

from reviews import views

app_name = "reviews"

router = SimpleRouter()
router.register("manage/reviews", views.ReviewManageViewSet, basename="reviews-manage")

urlpatterns = [
    path("reviews/", views.ReviewListView.as_view(), name="review-list"),
    *router.urls,
]
