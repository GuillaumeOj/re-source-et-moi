"""/api/manage/reviews/: the editor's read-write view of the reviews."""

import pytest
from django.contrib.auth.models import User

from reviews.models import Review

pytestmark = pytest.mark.django_db

URL = "/api/manage/reviews/"


def detail(review: Review) -> str:
    return f"{URL}{review.id}/"


def test_is_refused_to_an_anonymous_visitor(client):
    assert client.get(URL).status_code == 401


def test_is_refused_to_a_non_staff_account(client):
    client.force_login(User.objects.create_user("visiteur", password="x"))

    assert client.get(URL).status_code == 403


def test_lists_every_review_hidden_ones_included_and_not_capped(staff_client, make_review):
    for index in range(4):
        make_review(author=f"Publié {index}")
    make_review(author="Masqué", is_published=False)

    body = staff_client.get(URL).json()

    assert isinstance(body, list)
    assert len(body) == 5
    assert {review["is_published"] for review in body} == {True, False}


def test_creates_a_review(staff_client):
    response = staff_client.post(
        URL,
        {
            "text": "J'ai retrouvé le plaisir d'apprendre.",
            "author": "Camille",
            "context": "Atelier découverte",
            "is_published": False,
        },
        format="json",
    )

    assert response.status_code == 201
    review = Review.objects.get()
    assert review.author == "Camille"
    assert review.is_published is False


def test_the_context_is_optional(staff_client):
    response = staff_client.post(URL, {"text": "Merci.", "author": "Anne"}, format="json")

    assert response.status_code == 201
    assert Review.objects.get().context == ""


def test_a_missing_text_or_name_is_a_field_error(staff_client):
    response = staff_client.post(URL, {"text": "", "author": ""}, format="json")

    assert response.status_code == 400
    assert set(response.json()) == {"text", "author"}


def test_updates_a_review(staff_client, make_review):
    review = make_review()

    response = staff_client.put(
        detail(review),
        {"text": "Nouveau texte", "author": "Marc", "context": "", "is_published": True},
        format="json",
    )

    assert response.status_code == 200
    review.refresh_from_db()
    assert (review.text, review.context) == ("Nouveau texte", "")


def test_patch_flips_the_publish_toggle_alone(staff_client, make_review):
    """The list's switch sends only is_published; the rest of the review is untouched."""
    review = make_review(text="Inchangé")

    response = staff_client.patch(detail(review), {"is_published": False}, format="json")

    assert response.status_code == 200
    review.refresh_from_db()
    assert review.is_published is False
    assert review.text == "Inchangé"


def test_created_at_cannot_be_rewritten(staff_client, make_review):
    """It decides what reaches the home page, so the editor cannot set it."""
    review = make_review()
    created_at = review.created_at

    staff_client.patch(detail(review), {"created_at": "2000-01-01T00:00:00Z"}, format="json")

    review.refresh_from_db()
    assert review.created_at == created_at


def test_deletes_a_review(staff_client, make_review):
    review = make_review()

    assert staff_client.delete(detail(review)).status_code == 204
    assert not Review.objects.exists()
