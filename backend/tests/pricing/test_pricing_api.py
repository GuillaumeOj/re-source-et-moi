"""GET /api/pricing-types/ — the "Tarifs" feed, groups with their lines nested."""

from decimal import Decimal

import pytest

pytestmark = pytest.mark.django_db

URL = "/api/pricing-types/"


def test_is_public(client, make_type):
    make_type()

    assert client.get(URL).status_code == 200


def test_returns_a_plain_array(client, make_type):
    make_type()

    body = client.get(URL).json()

    assert isinstance(body, list)
    assert len(body) == 1


def test_nests_prices_inside_their_group(client, make_type, make_price):
    """One request returns exactly the shape the site renders: a card per group."""
    individuel = make_type(name="Individuel", description="Par séance individuelle.")
    make_price(type=individuel, description="Adulte", amount=Decimal("75.00"), position=0)
    make_price(type=individuel, description="Enfant", amount=Decimal("60.00"), position=1)

    [group] = client.get(URL).json()

    assert group["name"] == "Individuel"
    assert group["description"] == "Par séance individuelle."
    assert [price["description"] for price in group["prices"]] == ["Adulte", "Enfant"]


def test_an_amount_is_a_number_not_a_formatted_string(client, make_price):
    """No euro sign in the payload — the frontend formats with Intl.NumberFormat."""
    make_price(amount=Decimal("75.00"), on_demand=False)

    [group] = client.get(URL).json()
    [price] = group["prices"]

    assert price["amount"] == "75.00"
    assert price["on_demand"] is False


def test_sur_devis_is_a_null_amount_and_a_flag(client, make_price):
    """The magic string is gone: absence of a price is a boolean, not the text "Sur devis"."""
    make_price(description="Atelier en groupe", amount=None, on_demand=True)

    [group] = client.get(URL).json()
    [price] = group["prices"]

    assert price["amount"] is None
    assert price["on_demand"] is True


def test_excludes_unpublished_groups(client, make_type):
    make_type(name="Brouillon", is_published=False)
    make_type(name="Publié")

    names = [group["name"] for group in client.get(URL).json()]

    assert names == ["Publié"]


def test_excludes_unpublished_prices_but_keeps_their_group(client, make_type, make_price):
    pricing_type = make_type()
    make_price(type=pricing_type, description="Visible")
    make_price(type=pricing_type, description="Masqué", is_published=False)

    [group] = client.get(URL).json()

    assert [price["description"] for price in group["prices"]] == ["Visible"]


def test_orders_groups_by_position(client, make_type):
    make_type(name="Groupe", position=1)
    make_type(name="Individuel", position=0)

    names = [group["name"] for group in client.get(URL).json()]

    assert names == ["Individuel", "Groupe"]


def test_a_group_with_no_published_prices_returns_an_empty_list(client, make_type):
    make_type()

    [group] = client.get(URL).json()

    assert group["prices"] == []


def test_the_response_is_two_queries_whatever_the_number_of_groups(
    client, make_type, make_price, django_assert_num_queries
):
    """prefetch_related, not a query per group — the reason the serializer filters in
    Python rather than calling .filter() on the relation."""
    for index in range(5):
        pricing_type = make_type(name=f"Type {index}", position=index)
        make_price(type=pricing_type)

    with django_assert_num_queries(2):
        client.get(URL)
