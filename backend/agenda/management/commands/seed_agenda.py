"""Fill the dev database with a starter agenda.

The dataset is the placeholder that used to live in frontend/content/ateliers.ts, rebased
onto real upcoming dates — so a fresh dev stack renders the section exactly as the site
did before the backend existed, and there is something to click on in the admin.

It deliberately covers more than the happy path: an online workshop and an on-site one
(the two location kinds render differently), plus one unpublished and one already past, so
the "published and upcoming" filtering is visible in dev rather than only in tests.
"""

from __future__ import annotations

import datetime

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from agenda.models import Event
from config.seeding import guard_dev_only

MORNING_START = datetime.time(10, 0)
MORNING_END = datetime.time(12, 0)


class Command(BaseCommand):
    help = "Replace the agenda with a demo dataset (local development only)."

    @transaction.atomic
    def handle(self, *args: object, **options: object) -> None:
        guard_dev_only()

        deleted, _ = Event.objects.all().delete()
        today = timezone.localdate()

        events = [
            Event(
                title="Brain Gym® en mouvement",
                date=today + datetime.timedelta(days=14),
                start_time=MORNING_START,
                end_time=MORNING_END,
                location_kind=Event.LocationKind.ONLINE,
                description="Une matinée pour découvrir les mouvements de base.",
            ),
            Event(
                title="ECAP & apprentissage",
                date=today + datetime.timedelta(days=28),
                start_time=MORNING_START,
                end_time=MORNING_END,
                location_kind=Event.LocationKind.ONSITE,
                address_line1="12 rue de la Charité",
                postal_code="69002",
                city="Lyon",
            ),
            Event(
                title="La ligne médiane, pas à pas",
                date=today + datetime.timedelta(days=42),
                start_time=MORNING_START,
                end_time=MORNING_END,
                location_kind=Event.LocationKind.ONLINE,
            ),
            # Not published: present in the admin, absent from the API.
            Event(
                title="Atelier en préparation",
                date=today + datetime.timedelta(days=56),
                start_time=MORNING_START,
                end_time=MORNING_END,
                location_kind=Event.LocationKind.ONLINE,
                is_published=False,
            ),
            # Already past: kept as history, absent from the API.
            Event(
                title="Brain Gym® — session passée",
                date=today - datetime.timedelta(days=7),
                start_time=MORNING_START,
                end_time=MORNING_END,
                location_kind=Event.LocationKind.ONSITE,
                city="Lyon",
            ),
        ]
        Event.objects.bulk_create(events)

        self.stdout.write(
            self.style.SUCCESS(f"Agenda seeded: {len(events)} ateliers ({deleted} supprimés).")
        )
