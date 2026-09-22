"""/api/manage/addresses/: the saved places the editor's workshop form picks from."""

import pytest
from django.contrib.auth.models import User

from agenda.models import Address, Event

pytestmark = pytest.mark.django_db

URL = "/api/manage/addresses/"


def detail(address: Address) -> str:
    return f"{URL}{address.id}/"


PAYLOAD = {
    "name": "Salle Paul Éluard",
    "line1": "4 place Paul Éluard",
    "line2": "",
    "postal_code": "69100",
    "city": "Villeurbanne",
}


def test_is_refused_to_an_anonymous_visitor(client):
    assert client.get(URL).status_code == 401
    assert client.post(URL, PAYLOAD).status_code == 401


def test_is_refused_to_a_non_staff_account(client):
    client.force_login(User.objects.create_user("visiteur", password="x"))

    assert client.get(URL).status_code == 403


def test_lists_every_address_by_name_with_how_many_workshops_use_it(
    staff_client, make_address, make_event
):
    """Unpaginated: the workshop form loads the whole list into its picker."""
    used = make_address(name="B — utilisée")
    make_address(name="A — libre")
    make_event(location_kind=Event.LocationKind.ONSITE, address=used)
    make_event(location_kind=Event.LocationKind.ONSITE, address=used)

    response = staff_client.get(URL)

    assert response.status_code == 200
    assert [(item["name"], item["event_count"]) for item in response.json()] == [
        ("A — libre", 0),
        ("B — utilisée", 2),
    ]


def test_creates_an_address(staff_client):
    response = staff_client.post(URL, PAYLOAD, format="json")

    assert response.status_code == 201
    assert response.json() == {
        "id": response.json()["id"],
        **PAYLOAD,
        "one_line": "4 place Paul Éluard, 69100 Villeurbanne",
        "event_count": 0,
    }
    assert Address.objects.get().city == "Villeurbanne"


def test_updates_an_address_and_keeps_its_count(staff_client, make_address, make_event):
    address = make_address()
    make_event(location_kind=Event.LocationKind.ONSITE, address=address)

    response = staff_client.put(detail(address), PAYLOAD, format="json")

    assert response.status_code == 200
    assert response.json()["event_count"] == 1
    address.refresh_from_db()
    assert address.name == "Salle Paul Éluard"


def test_rejects_an_address_without_a_city(staff_client):
    """The city is what the site shows for an on-site workshop."""
    response = staff_client.post(URL, {**PAYLOAD, "city": ""}, format="json")

    assert response.status_code == 400
    assert set(response.json()) == {"city"}


def test_rejects_a_name_already_taken(staff_client, make_address):
    """Two entries called the same would be indistinguishable in the picker."""
    make_address(name="Salle Paul Éluard")

    response = staff_client.post(URL, PAYLOAD, format="json")

    assert response.status_code == 400
    assert set(response.json()) == {"name"}


def test_deletes_an_unused_address(staff_client, make_address):
    address = make_address()

    assert staff_client.delete(detail(address)).status_code == 204
    assert not Address.objects.exists()


def test_refuses_to_delete_an_address_in_use_and_says_why(staff_client, make_address, make_event):
    address = make_address()
    make_event(location_kind=Event.LocationKind.ONSITE, address=address)
    make_event(location_kind=Event.LocationKind.ONSITE, address=address)

    response = staff_client.delete(detail(address))

    assert response.status_code == 400
    assert response.json() == {
        "non_field_errors": [
            "Cette adresse est utilisée par 2 ateliers ; "
            "choisissez-leur une autre adresse avant de la supprimer."
        ]
    }
    assert Address.objects.filter(pk=address.pk).exists()


def test_the_refusal_is_singular_for_one_workshop(staff_client, make_address, make_event):
    address = make_address()
    make_event(location_kind=Event.LocationKind.ONSITE, address=address)

    response = staff_client.delete(detail(address))

    assert "utilisée par 1 atelier ;" in response.json()["non_field_errors"][0]
