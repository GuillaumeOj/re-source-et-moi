"""Fill the dev database with customer reviews.

The newest is unpublished, so the "published only" filter is visible in dev. There are more
published reviews than a page of the public feed holds (12), so the home page links to the
"Témoignages" page and that page's infinite scroll loads a second page. A few run past 200
characters, so the home page's "Lire la suite" toggle shows too.
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
        "Je suis arrivée à l'atelier fatiguée, un peu sceptique, et sans trop savoir ce que "
        "j'allais y trouver. Cécile a pris le temps d'écouter chacun, puis nous a guidés "
        "avec douceur à travers des mouvements très simples. En sortant, je me sentais plus "
        "légère et plus présente. Depuis, je refais ces gestes chaque matin avant de partir "
        "travailler, et je remarque une vraie différence sur ma concentration.",
        "Élodie",
        "Atelier découverte",
        True,
    ),
    (
        "Des séances qui m'ont aidée à mieux vivre une période chargée.",
        "Anne",
        "",
        True,
    ),
    (
        "Ma fille attend chaque séance avec impatience. Elle nous montre les mouvements à la "
        "maison et c'est devenu un petit rituel familial avant le coucher, qui l'aide à se "
        "poser après les journées d'école bien remplies.",
        "Nadia",
        "Parent d'élève",
        True,
    ),
    ("Simple, efficace, bienveillant. Je recommande.", "Pierre", "Atelier ECAP", True),
    (
        "J'ai enfin compris comment relâcher les tensions dans mes épaules.",
        "Lucie",
        "",
        True,
    ),
    (
        "Une belle découverte pour toute l'équipe : nous avons intégré quelques mouvements à "
        "nos réunions du lundi.",
        "Thomas",
        "Intervention en entreprise",
        True,
    ),
    ("Des outils concrets, expliqués avec patience.", "Hélène", "Atelier ECAP", True),
    (
        "Mon fils avait du mal à se concentrer en classe. Après quelques semaines, sa "
        "maîtresse a remarqué qu'il était plus calme et plus attentif. Nous continuons les "
        "exercices ensemble le soir, et il les propose lui-même quand il sent qu'il en a "
        "besoin, ce qui est pour nous la plus belle des réussites.",
        "Karim",
        "Parent d'élève",
        True,
    ),
    ("Un moment pour soi, sans jugement.", "Isabelle", "", True),
    (
        "Je ne pensais pas qu'on pouvait apprendre autant en une matinée.",
        "Jean",
        "Atelier découverte",
        True,
    ),
    (
        "Cécile adapte chaque exercice à nos besoins, c'est précieux.",
        "Martine",
        "Suivi individuel",
        True,
    ),
    ("Un retour qui n'a pas encore été relu.", "Paul", "", False),
    (
        "Merci pour cette parenthèse de douceur dans une année difficile.",
        "Sandrine",
        "Suivi individuel",
        True,
    ),
    ("Une approche qui change le regard sur l'apprentissage.", "Olivier", "", True),
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
