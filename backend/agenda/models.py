"""The workshop agenda behind the site's "Prochains rendez-vous" section.

The copy this replaced stored a date as pre-formatted display strings — day "14", month
"Juin", schedule "Samedi · 10h–12h". Nothing could sort or filter that, so the list went
stale silently: a workshop stayed on the page until someone noticed and edited the file.

Here the date is a real date. "Upcoming" is a query (see agenda.views), and the French
rendering is the frontend's job.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from django.core.exceptions import ValidationError
from django.db import models

from config.models import UUIDModel


class Address(UUIDModel):
    """A place workshops happen, saved once and picked from a list after that.

    Events point at it rather than carrying their own copy, so correcting a street name
    corrects every workshop held there. The name is what the owner calls the place ("Salle
    Paul Éluard") and what the editor's picker shows; the site itself shows the city and
    the one-line address.
    """

    if TYPE_CHECKING:
        # Declared for the type checker only: the reverse accessor is created at runtime by
        # Event.address's related_name, which ty cannot see. See CLAUDE.md, "ty does not
        # run django-stubs' plugin".
        events: models.Manager[Event]

    name = models.CharField(
        "nom",
        max_length=120,
        unique=True,
        help_text="Pour la retrouver dans la liste, par exemple « Salle Paul Éluard ».",
    )
    line1 = models.CharField("adresse", max_length=200, blank=True)
    line2 = models.CharField("complément d'adresse", max_length=200, blank=True)
    postal_code = models.CharField("code postal", max_length=16, blank=True)
    # Required: the city is what the agenda row displays for an on-site workshop.
    city = models.CharField("ville", max_length=120)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "adresse"
        verbose_name_plural = "adresses"
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name

    @property
    def one_line(self) -> str:
        """The postal address on one line: "12 rue de la Charité, 69002 Lyon"."""
        # The postcode and city share a line; everything else is comma-separated. Blanks
        # drop out of both joins.
        locality = " ".join(filter(None, (self.postal_code, self.city)))
        return ", ".join(filter(None, (self.line1, self.line2, locality)))


class Event(UUIDModel):
    """A workshop, online or at an address, shown on the public agenda."""

    class LocationKind(models.TextChoices):
        ONLINE = "online", "En ligne"
        ONSITE = "onsite", "Sur place"

    title = models.CharField("titre", max_length=200)
    date = models.DateField("date")
    start_time = models.TimeField("heure de début")
    end_time = models.TimeField("heure de fin")

    location_kind = models.CharField(
        "type de lieu",
        max_length=10,
        choices=LocationKind.choices,
        default=LocationKind.ONSITE,
    )
    # Only ever the *override*. The label the site shows is the `location_label` property
    # below, which falls back to the kind or the city — so there is no stored copy that can
    # drift when either of those is edited, and no write path (.update(), bulk_create) that
    # can bypass keeping it in step.
    location_label_override = models.CharField(
        "libellé du lieu",
        max_length=120,
        blank=True,
        help_text="Laisser vide pour le déduire du lieu (« En ligne », ou la ville de l'adresse).",
    )
    online_url = models.URLField("lien de visioconférence", blank=True)
    # PROTECT: deleting a place still in use would silently turn its workshops into
    # on-site events with nowhere to go. The owner moves them first.
    address = models.ForeignKey(
        Address,
        verbose_name="adresse",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="events",
    )

    description = models.TextField("description", blank=True)
    is_published = models.BooleanField(
        "publié",
        default=True,
        help_text="Décocher pour préparer un atelier sans l'afficher sur le site.",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "atelier"
        verbose_name_plural = "ateliers"
        ordering = ["date", "start_time"]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(end_time__gt=models.F("start_time")),
                name="agenda_event_ends_after_it_starts",
            )
        ]

    def __str__(self) -> str:
        return f"{self.title} — {self.date}"

    @property
    def is_online(self) -> bool:
        return self.location_kind == self.LocationKind.ONLINE

    @property
    def location_label(self) -> str:
        """The short label the agenda row shows — "En ligne", "Lyon", or an override."""
        if self.location_label_override:
            return self.location_label_override
        if self.is_online:
            return str(self.LocationKind.ONLINE.label)
        return self.address.city if self.address else ""

    def clean(self) -> None:
        """Validate the two things the admin form can get wrong.

        Both are also enforced below the form — the time order by a CheckConstraint, the
        address rules by being the only way the data is ever written — but a ValidationError
        here is what turns a mistake into a field-level message instead of a 500.
        """
        super().clean()
        errors: dict[str, str] = {}

        if self.start_time and self.end_time and self.end_time <= self.start_time:
            errors["end_time"] = "L'heure de fin doit être postérieure à l'heure de début."

        # Both editing UIs set `address` to the chosen object before calling this, so
        # reading it costs no query.
        if self.is_online and self.address is not None:
            # A leftover address is a copy/paste mistake: the frontend would show a city
            # for something nobody travels to.
            errors["address"] = "Un atelier en ligne ne doit pas porter d'adresse postale."
        elif not self.is_online and self.address is None:
            # The address's city is what the agenda row displays, so on-site without one
            # renders blank.
            errors["address"] = "Une adresse est requise pour un atelier sur place."

        if errors:
            raise ValidationError(errors)
