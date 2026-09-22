from django.urls import path
from rest_framework.routers import SimpleRouter

from agenda import views

app_name = "agenda"

router = SimpleRouter()
router.register("manage/events", views.EventManageViewSet, basename="event-manage")
router.register("manage/addresses", views.AddressManageViewSet, basename="address-manage")

urlpatterns = [
    path("events/", views.EventListView.as_view(), name="event-list"),
    *router.urls,
]
