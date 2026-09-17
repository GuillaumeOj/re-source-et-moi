from django.urls import path

from agenda import views

app_name = "agenda"

urlpatterns = [
    path("events/", views.EventListView.as_view(), name="event-list"),
]
