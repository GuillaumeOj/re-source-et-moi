"""Fill the dev database with a few customer reviews.

The first three are the placeholders that used to live in frontend/content/temoignages.ts.
Two more sit on either side of what the home page shows: an unpublished one, and a
published one older than the rest. Neither should appear on the page, so the "published
only" filter and the "three most recent" cut are both visible in dev.
"""

from __future__ import annotations

from datetime import timedelta

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from config.seeding import guard_dev_only
from reviews.models import Review

# (text, author, context, published), newest first.
SEED: list[tuple[str, str, str, bool]] = [
    (
        "Je n'ai pas encore fini de digérer tout ce que j'ai découvert, je garde ça pour moi.",
        "Julie",
        "Atelier découverte",
        False,
    ),
    (
        "J'ai retrouvé le plaisir d'apprendre, sans pression. Les mouvements sont simples et "
        "je les refais chez moi.",
        "Camille",
        "Atelier découverte",
        True,
    ),
    (
        "Mon fils se concentre plus facilement avant ses devoirs. Quelques gestes suffisent à "
        "changer l'ambiance.",
        "Sophie",
        "Parent d'élève",
        True,
    ),
    (
        "Une approche concrète et bienveillante. On repart avec des clés utilisables tout de "
        "suite.",
        "Marc",
        "Atelier ECAP",
        True,
    ),
    (
        "Des séances qui m'ont aidée à mieux vivre une période chargée.",
        "Anne",
        "",
        True,
    ),
]


class Command(BaseCommand):
    help = "Replace the reviews with a demo dataset (local development only)."

    @transaction.atomic
    def handle(self, *args: object, **options: object) -> None:
        guard_dev_only()

        deleted, _ = Review.objects.all().delete()

        now = timezone.now()
        for age, (text, author, context, published) in enumerate(SEED):
            review = Review.objects.create(
                text=text, author=author, context=context, is_published=published
            )
            # auto_now_add ignores a value passed to create(), so the dates that set the
            # order are written afterwards, one day apart.
            Review.objects.filter(pk=review.pk).update(created_at=now - timedelta(days=age))

        self.stdout.write(
            self.style.SUCCESS(f"Avis seeded: {len(SEED)} avis ({deleted} supprimés).")
        )
