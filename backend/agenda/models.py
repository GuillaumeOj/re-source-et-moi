"""The workshop agenda behind the site's "Prochains rendez-vous" section.

The copy this replaced stored a date as pre-formatted display strings — day "14", month
"Juin", schedule "Samedi · 10h–12h". Nothing could sort or filter that, so the list went
stale silently: a workshop stayed on the page until someone noticed and edited the file.

Here the date is a real date. "Upcoming" is a query (see agenda.views), and the French
rendering is the frontend's job.
"""

from __future__ import annotations

from typing import Any

from django.core.exceptions import ValidationError
from django.db import models

from config.models import UUIDModel


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
    # The short label the agenda row shows — "En ligne", "Lyon". Left blank it is derived
    # in save(), so the common case needs no typing; set it to override (e.g. "Lyon 6e").
    location_label = models.CharField(
        "libellé du lieu",
        max_length=120,
        blank=True,
        help_text="Laisser vide pour le déduire du lieu (« En ligne », ou la ville).",
    )
    online_url = models.URLField("lien de visioconférence", blank=True)
    address_line1 = models.CharField("adresse", max_length=200, blank=True)
    address_line2 = models.CharField("complément d'adresse", max_length=200, blank=True)
    postal_code = models.CharField("code postal", max_length=16, blank=True)
    city = models.CharField("ville", max_length=120, blank=True)

    description = models.TextField("description", blank=True)
    is_published = models.BooleanField(
        "publié",
        default=True,
        help_text="Décocher pour préparer un atelier sans l'afficher sur le site.",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Not a field: what `location_label` was derived to when this row was read from the
    # database, set by from_db() and used by save(). None on an instance that never came
    # from the database, which is why a fresh Event only ever derives a blank label.
    _loaded_derived_label: str | None = None

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

        if self.is_online:
            # An online workshop with a postal address is a copy/paste leftover: the
            # frontend would show a city for something nobody travels to. The message goes
            # on every field that still holds one, so the admin highlights exactly what
            # needs clearing — an address left in `address_line1` is invisible if the only
            # error sits on an already-empty "Ville".
            for field in ("address_line1", "address_line2", "postal_code", "city"):
                if getattr(self, field):
                    errors[field] = "Un atelier en ligne ne doit pas porter d'adresse postale."
        elif not self.city:
            # The city is what the agenda row displays, so on-site without one renders blank.
            errors["city"] = "Une ville est requise pour un atelier sur place."

        if errors:
            raise ValidationError(errors)

    def _derived_location_label(self) -> str:
        """The label this workshop's kind and city imply, before any manual override."""
        return str(self.LocationKind.ONLINE.label) if self.is_online else self.city

    @classmethod
    def from_db(cls, db, field_names, values):  # type: ignore[no-untyped-def]
        instance = super().from_db(db, field_names, values)
        # Remember what the *stored* kind/city derived to, so save() can tell a label this
        # model filled in from one the owner typed. Skipped when either field is deferred:
        # reading them here would fire an extra query per row.
        if {"location_kind", "city"} <= set(field_names):
            instance._loaded_derived_label = instance._derived_location_label()
        return instance

    def save(self, *args: Any, **kwargs: Any) -> None:
        # Fill the label in when it is blank, and refresh it when it still holds whatever
        # was derived at load time. Without the second half, moving a workshop from Lyon to
        # Paris — or from on-site to online, which clean() forces the address off — leaves
        # the agenda row displaying "Lyon". A label typed by hand ("Lyon 6e") never matches
        # the derivation, so it survives untouched.
        if not self.location_label or self.location_label == self._loaded_derived_label:
            self.location_label = self._derived_location_label()
        super().save(*args, **kwargs)
