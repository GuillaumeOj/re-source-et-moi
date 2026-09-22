from datetime import timedelta

import pytest
from django.utils import timezone

from reviews.models import Review


@pytest.fixture
def make_review():
    """Build a published Review with realistic defaults."""

    def _make_review(**overrides) -> Review:
        fields = {
            "text": "Une approche concrète et bienveillante.",
            "author": "Marc",
            "context": "Atelier ECAP",
        }
        fields.update(overrides)
        return Review.objects.create(**fields)

    return _make_review


@pytest.fixture
def age():
    """Backdate a review by `days`. auto_now_add ignores a value passed to create(), so a
    test that cares about order sets created_at afterwards."""
    now = timezone.now()

    def _age(review: Review, days: int) -> Review:
        Review.objects.filter(pk=review.pk).update(created_at=now - timedelta(days=days))
        review.refresh_from_db()
        return review

    return _age
