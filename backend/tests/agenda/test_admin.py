"""The admin form must *show* the model's validation errors.

The model's `clean()` is tested directly in test_models.py. What these cover is the
integration: that the admin form actually runs it and renders the message. If a future
change excludes a field or swaps in a custom form, the model stays correct while the
person editing gets a 500 from the database constraint instead of a usable message —
and the constraint tests would still pass.
"""

import pytest

pytestmark = pytest.mark.django_db

ADD_URL = "/api/admin/agenda/event/add/"

VALID = {
    "title": "Atelier",
    "date": "2026-12-01",
    "start_time": "10:00",
    "end_time": "12:00",
    "location_kind": "online",
    "location_label": "",
    "online_url": "",
    "address_line1": "",
    "address_line2": "",
    "postal_code": "",
    "city": "",
    "description": "",
    "is_published": "on",
}


@pytest.fixture
def staff_client(client, django_user_model):
    from django.test import Client

    user = django_user_model.objects.create_superuser("staff", "staff@example.test", "pw")
    admin_client = Client(SERVER_NAME="localhost")
    admin_client.force_login(user)
    return admin_client


def post(staff_client, **overrides):
    return staff_client.post(ADD_URL, {**VALID, **overrides})


def test_a_valid_workshop_is_accepted(staff_client):
    from agenda.models import Event

    response = post(staff_client)

    # A successful admin add redirects to the changelist.
    assert response.status_code == 302
    assert Event.objects.count() == 1


def test_shows_an_error_when_the_end_is_before_the_start(staff_client):
    response = post(staff_client, start_time="12:00", end_time="10:00")

    assert response.status_code == 200
    assert "postérieure" in response.content.decode()


def test_shows_an_error_for_an_on_site_workshop_without_a_city(staff_client):
    response = post(staff_client, location_kind="onsite")

    assert response.status_code == 200
    assert "ville est requise" in response.content.decode()


def test_shows_an_error_for_an_online_workshop_carrying_an_address(staff_client):
    response = post(staff_client, location_kind="online", city="Lyon")

    assert response.status_code == 200
    assert "adresse postale" in response.content.decode()
