import pytest
from django.core.management import call_command
from django.core.management.base import CommandError

from reviews.models import Review
from reviews.views import HOME_PAGE_REVIEWS

pytestmark = [pytest.mark.django_db, pytest.mark.usefixtures("dev_environment")]


def test_seeds_more_published_reviews_than_the_home_page_shows():
    """So the "three most recent" cut is visible in dev, not only in tests."""
    call_command("seed_reviews")

    assert Review.objects.filter(is_published=True).count() > HOME_PAGE_REVIEWS


def test_the_newest_review_is_an_unpublished_one():
    """Published, it would be on the page. Unpublished, it shows the filter at work."""
    call_command("seed_reviews")

    newest = Review.objects.first()
    assert newest is not None
    assert newest.is_published is False


def test_is_rerunnable_without_piling_up():
    call_command("seed_reviews")
    count = Review.objects.count()

    call_command("seed_reviews")

    assert Review.objects.count() == count


def test_a_refusal_destroys_nothing(settings, make_review):
    """The guard itself is covered in tests/config/test_seeding.py; this checks that the
    wipe cannot outrun it."""
    existing = make_review(author="Vrai avis")
    settings.ON_VERCEL = True

    with pytest.raises(CommandError):
        call_command("seed_reviews")

    assert Review.objects.filter(pk=existing.pk).exists()
