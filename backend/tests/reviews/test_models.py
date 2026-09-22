import uuid

import pytest

from reviews.models import Review

pytestmark = pytest.mark.django_db


def test_primary_key_is_uuid4(make_review):
    """See config.models.UUIDModel."""
    review = make_review()

    assert isinstance(review.pk, uuid.UUID)
    assert review.pk.version == 4


def test_is_published_by_default(make_review):
    assert make_review().is_published is True


def test_orders_newest_first(make_review, age):
    older = age(make_review(author="Ancien"), days=2)
    newer = age(make_review(author="Récent"), days=1)

    assert list(Review.objects.all()) == [newer, older]


def test_str_names_the_author_and_their_context(make_review):
    review = make_review(author="Sophie", context="Parent d'élève")

    assert str(review) == "Sophie — Parent d'élève"


def test_str_is_the_author_alone_without_a_context(make_review):
    assert str(make_review(author="Anne", context="")) == "Anne"
