"""Create the dev stack's admin login.

The Django admin is the whole editing UI, so a dev stack without an account to log into
it is only half a stack. This lives in `config` rather than in `agenda` or `pricing`
because the account belongs to neither — it is `django.contrib.auth`'s.

Unlike the other two seeds it destroys nothing. It converges one named account on a known
state, leaving every other user alone — so re-running is how you recover a forgotten dev
password, or repair an account someone demoted by hand.
"""

from __future__ import annotations

import os

# The concrete User, not get_user_model(): AUTH_USER_MODEL is Django's default here and
# stays that way — the site has no user accounts, only staff logging into the admin. It is
# also what keeps `is_staff` and `set_password` typed; see CLAUDE.md, "ty does not run
# django-stubs' plugin".
from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.db import transaction

from config.seeding import guard_dev_only


class Command(BaseCommand):
    help = "Create or reset the local admin login (local development only)."

    @transaction.atomic
    def handle(self, *args: object, **options: object) -> None:
        # Same guard as the other seeds. It matters more here than anywhere: this mints an
        # account with a known weak password, which on a deployment would be a way in.
        guard_dev_only()

        # Django's own createsuperuser reads these same three names, so a value set for one
        # works with the other. os.environ rather than django-environ: these are plain
        # strings with no casting, and settings.py's read_env() has already loaded any .env.
        username = os.environ.get("DJANGO_SUPERUSER_USERNAME", "admin")
        email = os.environ.get("DJANGO_SUPERUSER_EMAIL", "admin@rsm.local")
        password = os.environ.get("DJANGO_SUPERUSER_PASSWORD", "admin")

        user, created = User.objects.get_or_create(username=username)

        # One statement of the desired state, applied whether the row is new or not. No
        # `defaults=` above: everything it could set is set here anyway, on both paths.
        user.email = email
        user.set_password(password)
        user.is_staff = True
        user.is_superuser = True
        user.save()

        self.stdout.write(
            self.style.SUCCESS(
                f"Admin {'created' if created else 'reset'}: {username} / {password}"
            )
        )
