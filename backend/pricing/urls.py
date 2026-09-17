from django.urls import path

from pricing import views

app_name = "pricing"

urlpatterns = [
    path("pricing-types/", views.PricingTypeListView.as_view(), name="pricing-type-list"),
]
