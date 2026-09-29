"""GET /api/reviews/ — the published reviews, for the home page and the "Témoignages" page."""

import pytest

from reviews.models import Review
from reviews.views import ReviewPagination

pytestmark = pytest.mark.django_db

URL = "/api/reviews/"


def authors(body: dict) -> list[str]:
    return [review["author"] for review in body["results"]]


def test_is_public(client, make_review):
    make_review()

    assert client.get(URL).status_code == 200


def test_returns_a_page_in_the_shape_the_site_renders(client, make_review):
    review = make_review(text="Merci !", author="Camille", context="Atelier découverte")

    assert client.get(URL).json() == {
        "count": 1,
        "next": None,
        "previous": None,
        "results": [
            {
                "id": str(review.id),
                "text": "Merci !",
                "author": "Camille",
                "context": "Atelier découverte",
            }
        ],
    }


def test_excludes_unpublished_reviews(client, make_review):
    make_review(author="Brouillon", is_published=False)
    make_review(author="Publié")

    body = client.get(URL).json()

    assert authors(body) == ["Publié"]
    assert body["count"] == 1


def test_lists_newest_first(client, make_review, age):
    for days, author in enumerate(["Un", "Deux", "Trois"], start=1):
        age(make_review(author=author), days=days)

    assert authors(client.get(URL).json()) == ["Un", "Deux", "Trois"]


def test_pages_hold_twelve_reviews_by_default(client, make_review, age):
    for days in range(ReviewPagination.page_size + 1):
        age(make_review(author=f"Avis {days}"), days=days)

    first = client.get(URL).json()
    second = client.get(URL, {"page": 2}).json()

    assert len(first["results"]) == ReviewPagination.page_size
    assert first["next"] is not None
    assert authors(second) == [f"Avis {ReviewPagination.page_size}"]
    assert second["next"] is None


def test_the_home_page_asks_for_five_and_reads_the_count(client, make_review, age):
    """The home page shows five and links to the rest when the count says there is more."""
    for days in range(7):
        age(make_review(author=f"Avis {days}"), days=days)

    body = client.get(URL, {"page_size": 5}).json()

    assert authors(body) == [f"Avis {days}" for days in range(5)]
    assert body["count"] == 7


def test_the_page_size_is_capped(client, make_review):
    for index in range(ReviewPagination.max_page_size + 1):
        make_review(author=f"Avis {index}")

    body = client.get(URL, {"page_size": 1000}).json()

    assert len(body["results"]) == ReviewPagination.max_page_size


def test_reviews_sharing_a_date_are_never_split_or_repeated_across_pages(client, make_review):
    """created_at alone is not a total order; the id tiebreak keeps the pages stable."""
    reviews = [make_review(author=f"Avis {index}") for index in range(6)]
    Review.objects.update(created_at=reviews[0].created_at)

    seen = [
        review["id"]
        for page in (1, 2, 3)
        for review in client.get(URL, {"page_size": 2, "page": page}).json()["results"]
    ]

    assert sorted(seen) == sorted(str(review.id) for review in reviews)
