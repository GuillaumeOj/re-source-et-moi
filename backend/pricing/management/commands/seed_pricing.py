"""Fill the dev database with a starter tariff set.

The figures are the placeholders that used to live in frontend/content/tarifs.ts. They
cover both sides of the on_demand toggle — fixed amounts under "Individuel", a "sur devis"
line under "Groupe" — so the two rendering paths are both visible in dev.
"""

from __future__ import annotations

from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from config.seeding import guard_dev_only
from pricing.models import Price, PricingType

SEED: list[tuple[str, str, list[tuple[str, Decimal | None]]]] = [
    (
        "Individuel",
        "Par séance individuelle.",
        [
            ("Adulte", Decimal("75.00")),
            ("Enfant (jusqu'à 14 ans)", Decimal("60.00")),
        ],
    ),
    (
        "Groupe",
        "Tarif de groupe à définir — n'hésitez pas à nous consulter.",
        # None means "sur devis": there is no fixed amount, which is a different thing
        # from an amount of zero.
        [("Atelier en groupe", None)],
    ),
]


class Command(BaseCommand):
    help = "Replace the tariffs with a demo dataset (local development only)."

    @transaction.atomic
    def handle(self, *args: object, **options: object) -> None:
        guard_dev_only()

        # Prices cascade with their type, so this clears both tables. The first return
        # value counts every row removed, prices included — the message below is about
        # types, so take the per-model tally instead.
        _, per_model = PricingType.objects.all().delete()
        deleted = per_model.get(PricingType._meta.label, 0)

        for type_position, (name, description, rows) in enumerate(SEED):
            pricing_type = PricingType.objects.create(
                name=name, description=description, position=type_position
            )
            for price_position, (label, amount) in enumerate(rows):
                Price.objects.create(
                    type=pricing_type,
                    description=label,
                    amount=amount,
                    on_demand=amount is None,
                    position=price_position,
                )

        self.stdout.write(
            self.style.SUCCESS(f"Tarifs seeded: {len(SEED)} types ({deleted} supprimés).")
        )
