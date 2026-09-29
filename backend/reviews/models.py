"""The customer reviews behind the home page's "Ce qu'ils en retiennent" carousel and the
"Témoignages" page.

Deliberately plain: a quote, who said it and in what capacity. There is no position to
manage, because the site shows the published reviews newest first. Adding a review puts
it first without any reordering, and unpublishing one lets the next most recent take its
place.
"""

from django.db import models

from config.models import UUIDModel


class Review(UUIDModel):
    """One quote from a participant, shown as a card on the public site."""

    text = models.TextField("avis")
    author = models.CharField("nom", max_length=100)
    context = models.CharField(
        "description",
        max_length=100,
        blank=True,
        help_text="Par ex. « Atelier découverte », « Parent d'élève ».",
    )
    is_published = models.BooleanField(
        "publié",
        default=True,
        help_text="Décocher pour garder l'avis sans l'afficher sur le site.",
    )

    created_at = models.DateTimeField("ajouté le", auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "avis"
        verbose_name_plural = "avis"
        # The id tiebreak makes the order total, so paginated lists never split or repeat
        # reviews that share a date.
        ordering = ["-created_at", "-id"]

    def __str__(self) -> str:
        return f"{self.author} — {self.context}" if self.context else self.author
