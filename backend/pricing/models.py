"""The tariffs behind the site's "Tarifs" section.

What this replaces stored a price as a display string — "75 €", and the magic value
"Sur devis" standing in for "there is no fixed price". That conflates an amount with the
absence of one, so nothing could format, compare or total a price without parsing French
text back out of it.

Here an amount is a number and "sur devis" is a boolean, and a row must be exactly one of
the two — enforced in clean() for a usable admin message and by a CheckConstraint so the
database holds the line even if a row is ever written from somewhere else.
"""

from __future__ import annotations

from decimal import Decimal
from typing import TYPE_CHECKING

from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models

from config.models import UUIDModel


class PricingType(UUIDModel):
    """A tariff group — "Individuel", "Groupe" — rendered as one card on the site."""

    if TYPE_CHECKING:
        # Declared for the type checker only: the reverse accessor is created at runtime by
        # Price.type's related_name, which ty cannot see. See CLAUDE.md, "ty does not run
        # django-stubs' plugin".
        prices: models.Manager[Price]

    name = models.CharField("nom", max_length=100, unique=True)
    description = models.TextField(
        "description",
        blank=True,
        help_text="Note affichée sous les tarifs de ce groupe.",
    )
    position = models.PositiveSmallIntegerField(
        "position",
        default=0,
        help_text="Ordre d'affichage : le plus petit nombre en premier.",
    )
    is_published = models.BooleanField("publié", default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "type de tarif"
        verbose_name_plural = "types de tarif"
        ordering = ["position", "name"]

    def __str__(self) -> str:
        return self.name


class Price(UUIDModel):
    """One line within a tariff group — a label and either an amount or "sur devis"."""

    type = models.ForeignKey(
        PricingType,
        verbose_name="type",
        related_name="prices",
        on_delete=models.CASCADE,
    )
    description = models.CharField("libellé", max_length=200)
    amount = models.DecimalField(
        "montant",
        max_digits=8,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal("0"))],
        help_text="En euros. Laisser vide si le tarif est sur devis.",
    )
    on_demand = models.BooleanField(
        "sur devis",
        default=False,
        help_text="Cocher pour afficher « Sur devis » à la place d'un montant.",
    )
    position = models.PositiveSmallIntegerField("position", default=0)
    is_published = models.BooleanField("publié", default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "tarif"
        verbose_name_plural = "tarifs"
        ordering = ["position", "description"]
        constraints = [
            # Exactly one of the two. Without this a row can be both "75 €" and
            # "Sur devis" (the frontend would have to pick one and silently drop the
            # other), or neither, which renders an empty price.
            models.CheckConstraint(
                condition=(
                    models.Q(on_demand=True, amount__isnull=True)
                    | models.Q(on_demand=False, amount__isnull=False)
                ),
                name="pricing_price_amount_xor_on_demand",
            )
        ]

    def __str__(self) -> str:
        return f"{self.description} — {'sur devis' if self.on_demand else self.amount}"

    def clean(self) -> None:
        super().clean()
        if self.on_demand and self.amount is not None:
            raise ValidationError({"amount": "Un tarif sur devis ne doit pas porter de montant."})
        if not self.on_demand and self.amount is None:
            raise ValidationError({"amount": "Indiquer un montant, ou cocher « sur devis »."})
