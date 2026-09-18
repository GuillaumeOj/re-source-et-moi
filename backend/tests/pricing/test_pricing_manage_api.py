"""/api/manage/pricing-types/: the editor's read-write view of the tariffs.

A group and its lines save together, so most of these are about the nested write: which
lines survive a save, and that nothing is half-written when one line is wrong.
"""

from decimal import Decimal

import pytest
from django.contrib.auth.models import User

from pricing.models import Price, PricingType

pytestmark = pytest.mark.django_db

URL = "/api/manage/pricing-types/"


def detail(pricing_type: PricingType) -> str:
    return f"{URL}{pricing_type.id}/"


def line(description: str, amount: str | None = "75.00", **overrides) -> dict:
    """A tariff line as the editor sends it. Both halves of amount/on_demand are always
    present, as the serializer requires."""
    fields = {
        "description": description,
        "amount": amount,
        "on_demand": amount is None,
        "position": 0,
        "is_published": True,
    }
    fields.update(overrides)
    return fields


def group(name: str = "Individuel", prices: list | None = None, **overrides) -> dict:
    fields = {
        "name": name,
        "description": "",
        "position": 0,
        "is_published": True,
        "prices": prices if prices is not None else [],
    }
    fields.update(overrides)
    return fields


def test_is_refused_to_an_anonymous_visitor(client, make_type):
    make_type()

    assert client.get(URL).status_code == 401


def test_is_refused_to_a_non_staff_account(client):
    client.force_login(User.objects.create_user("visiteur", password="x"))

    assert client.get(URL).status_code == 403


def test_lists_hidden_groups_and_hidden_lines_too(staff_client, make_type, make_price):
    hidden_group = make_type(name="Caché", is_published=False)
    make_price(type=hidden_group, description="Ligne cachée", is_published=False)

    [pricing_type] = staff_client.get(URL).json()

    assert pricing_type["name"] == "Caché"
    assert pricing_type["is_published"] is False
    assert [price["description"] for price in pricing_type["prices"]] == ["Ligne cachée"]


def test_creates_a_group_with_its_lines(staff_client):
    response = staff_client.post(
        URL,
        group(prices=[line("Adulte", "75.00"), line("Entreprise", None, position=1)]),
        format="json",
    )

    assert response.status_code == 201
    pricing_type = PricingType.objects.get()
    prices = list(pricing_type.prices.all())
    assert [(p.description, p.amount, p.on_demand) for p in prices] == [
        ("Adulte", Decimal("75.00"), False),
        ("Entreprise", None, True),
    ]
    assert len(response.json()["prices"]) == 2


def test_a_save_updates_creates_and_deletes_lines(staff_client, make_type, make_price):
    """The list sent is the group's complete list: kept lines update, new ones appear,
    and the one left out is deleted."""
    pricing_type = make_type(name="Individuel")
    kept = make_price(type=pricing_type, description="Adulte")
    dropped = make_price(type=pricing_type, description="Enfant")

    response = staff_client.put(
        detail(pricing_type),
        group(
            prices=[
                line("Adulte (1h)", "80.00", id=str(kept.id)),
                line("Couple", "120.00", position=1),
            ]
        ),
        format="json",
    )

    assert response.status_code == 200
    descriptions = [price["description"] for price in response.json()["prices"]]
    assert descriptions == ["Adulte (1h)", "Couple"]
    kept.refresh_from_db()
    assert kept.amount == Decimal("80.00")
    assert not Price.objects.filter(id=dropped.id).exists()


def test_a_line_can_switch_to_on_demand(staff_client, make_type, make_price):
    pricing_type = make_type()
    price = make_price(type=pricing_type, amount=Decimal("75.00"))

    response = staff_client.put(
        detail(pricing_type),
        group(name=pricing_type.name, prices=[line("Adulte", None, id=str(price.id))]),
        format="json",
    )

    assert response.status_code == 200
    price.refresh_from_db()
    assert price.on_demand is True
    assert price.amount is None


def test_a_patch_without_prices_leaves_the_lines_alone(staff_client, make_type, make_price):
    """The list's publish switch sends only the one field. It must not read as "this
    group now has no lines"."""
    pricing_type = make_type()
    make_price(type=pricing_type)

    response = staff_client.patch(detail(pricing_type), {"is_published": False}, format="json")

    assert response.status_code == 200
    assert pricing_type.prices.count() == 1


def test_a_bad_line_rejects_the_whole_group(staff_client, make_type, make_price):
    """One save, one transaction. Nothing is written when any line is invalid, and the
    error names the line through Price.clean()'s own message."""
    pricing_type = make_type(name="Individuel")
    price = make_price(type=pricing_type, description="Adulte")

    response = staff_client.put(
        detail(pricing_type),
        group(
            name="Renommé",
            prices=[
                line("Adulte", "90.00", id=str(price.id)),
                line("Sans montant", None, on_demand=False),
            ],
        ),
        format="json",
    )

    assert response.status_code == 400
    assert response.json() == {
        "prices": [{}, {"amount": ["Indiquer un montant, ou cocher « sur devis »."]}]
    }
    pricing_type.refresh_from_db()
    price.refresh_from_db()
    assert pricing_type.name == "Individuel"
    assert price.amount == Decimal("75.00")


def test_rejects_an_amount_on_an_on_demand_line(staff_client):
    response = staff_client.post(
        URL, group(prices=[line("Groupe", "40.00", on_demand=True)]), format="json"
    )

    assert response.status_code == 400
    assert response.json() == {
        "prices": [{"amount": ["Un tarif sur devis ne doit pas porter de montant."]}]
    }


def test_the_amount_must_be_sent_even_when_null(staff_client):
    """Otherwise an existing line would keep its stored amount while switching to "sur
    devis", and the row would break the database constraint clean() had just passed."""
    bad_line = line("Groupe", None)
    del bad_line["amount"]

    response = staff_client.post(URL, group(prices=[bad_line]), format="json")

    assert response.status_code == 400
    assert "amount" in response.json()["prices"][0]


def test_refuses_a_line_that_belongs_to_another_group(staff_client, make_type, make_price):
    """A line only moves through its own group. An id from elsewhere would otherwise be
    silently re-parented."""
    target = make_type()
    stranger = make_price(description="Ailleurs")

    response = staff_client.put(
        detail(target),
        group(name=target.name, prices=[line("Volé", "10.00", id=str(stranger.id))]),
        format="json",
    )

    assert response.status_code == 400
    assert "prices" in response.json()
    stranger.refresh_from_db()
    assert stranger.description == "Ailleurs"


def test_refuses_a_line_id_when_creating_a_group(staff_client, make_price):
    stranger = make_price()

    response = staff_client.post(
        URL, group(prices=[line("Volé", "10.00", id=str(stranger.id))]), format="json"
    )

    assert response.status_code == 400


def test_refuses_a_duplicate_group_name(staff_client, make_type):
    make_type(name="Individuel")

    response = staff_client.post(URL, group(name="Individuel"), format="json")

    assert response.status_code == 400
    assert "name" in response.json()


def test_deleting_a_group_deletes_its_lines(staff_client, make_type, make_price):
    pricing_type = make_type()
    make_price(type=pricing_type)

    assert staff_client.delete(detail(pricing_type)).status_code == 204
    assert not Price.objects.exists()


REORDER = f"{URL}reorder/"


def test_reorders_every_group_at_once(staff_client, make_type):
    first, second, third = (make_type(position=index) for index in range(3))

    response = staff_client.post(
        REORDER, {"ids": [str(third.id), str(first.id), str(second.id)]}, format="json"
    )

    assert response.status_code == 204
    names = list(PricingType.objects.order_by("position").values_list("id", flat=True))
    assert names == [third.id, first.id, second.id]


@pytest.mark.parametrize("change", ["missing", "duplicate", "unknown"])
def test_refuses_an_order_that_doesnt_name_every_group_once(staff_client, make_type, change):
    """A stale screen (a group added or removed elsewhere) must not leave two groups on
    one position. The whole reorder is refused instead."""
    first, second = make_type(position=0), make_type(position=1)
    ids = {
        "missing": [str(second.id)],
        "duplicate": [str(second.id), str(second.id), str(first.id)],
        "unknown": [str(second.id), str(first.id), "00000000-0000-4000-8000-000000000000"],
    }[change]

    response = staff_client.post(REORDER, {"ids": ids}, format="json")

    assert response.status_code == 400
    first.refresh_from_db()
    assert first.position == 0


def test_reordering_is_staff_only(client, make_type):
    group = make_type()

    assert client.post(REORDER, {"ids": [str(group.id)]}, format="json").status_code == 401
