"""GET /api/reviews/ — the home page's "Ce qu'ils en retiennent" feed."""

import pytest

pytestmark = pytest.mark.django_db

URL = "/api/reviews/"


def test_is_public(client, make_review):
    make_review()

    assert client.get(URL).status_code == 200


def test_returns_a_plain_array_in_the_shape_the_page_renders(client, make_review):
    review = make_review(text="Merci !", author="Camille", context="Atelier découverte")

    assert client.get(URL).json() == [
        {
            "id": str(review.id),
            "text": "Merci !",
            "author": "Camille",
            "context": "Atelier découverte",
        }
    ]


def test_excludes_unpublished_reviews(client, make_review):
    make_review(author="Brouillon", is_published=False)
    make_review(author="Publié")

    assert [review["author"] for review in client.get(URL).json()] == ["Publié"]


def test_returns_the_three_most_recent_newest_first(client, make_review, age):
    """The home page shows three: the cut happens here so it never over-fetches."""
    for days, author in enumerate(["Un", "Deux", "Trois", "Quatre"], start=1):
        age(make_review(author=author), days=days)

    assert [review["author"] for review in client.get(URL).json()] == ["Un", "Deux", "Trois"]


def test_an_unpublished_review_lets_the_next_one_in(client, make_review, age):
    """The cut counts published reviews only, so hiding one never leaves a gap."""
    age(make_review(author="Masqué", is_published=False), days=1)
    for days, author in enumerate(["Un", "Deux", "Trois", "Quatre"], start=2):
        age(make_review(author=author), days=days)

    assert [review["author"] for review in client.get(URL).json()] == ["Un", "Deux", "Trois"]
