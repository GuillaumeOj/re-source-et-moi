"""The Django admin stays the fallback editing UI, so it has to work too."""

import pytest

from reviews.models import Review

pytestmark = pytest.mark.django_db

URL = "/api/admin/reviews/review/"


def test_the_changelist_renders(admin_client, make_review):
    make_review(author="Sophie")

    response = admin_client.get(URL)

    assert response.status_code == 200
    assert "Sophie" in response.content.decode()


def test_the_add_form_creates_a_review(admin_client):
    response = admin_client.post(
        f"{URL}add/",
        {"text": "Merci.", "author": "Anne", "context": "", "is_published": "on"},
    )

    assert response.status_code == 302
    assert Review.objects.get().author == "Anne"
