from django.urls import path
from rest_framework.routers import SimpleRouter

from pricing import views

app_name = "pricing"

router = SimpleRouter()
router.register("manage/pricing-types", views.PricingTypeManageViewSet, basename="pricing-manage")

urlpatterns = [
    path("pricing-types/", views.PricingTypeListView.as_view(), name="pricing-type-list"),
    *router.urls,
]
