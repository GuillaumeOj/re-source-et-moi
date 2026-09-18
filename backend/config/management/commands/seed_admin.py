"""Create the dev stack's admin login.

The Django admin is the whole editing UI, so a dev stack without an account to log into
it is only half a stack. This lives in `config` rather than in `agenda` or `pricing`
because the account belongs to neither — it is `django.contrib.auth`'s.

Unlike the other two seeds it destroys nothing: it creates the account or resets it,
leaving any other user alone. Re-running is how you recover a forgotten dev password.
"""

from __future__ import annotations

import environ

# The concrete User, not get_user_model(): AUTH_USER_MODEL is Django's default here and
# stays that way — the site has no user accounts, only staff logging into the admin (see
# settings.py). Naming it directly is what makes `is_staff` and `set_password` visible to
# the type checker, and swapping AUTH_USER_MODEL later would fail here loudly rather than
# quietly seeding the wrong table.
from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.db import transaction

from config.seeding import guard_dev_only

env = environ.Env()

# Named after Django's own createsuperuser env vars, so the same values work with either.
DEFAULT_USERNAME = "admin"
DEFAULT_EMAIL = "admin@rsm.local"
DEFAULT_PASSWORD = "admin"


class Command(BaseCommand):
    help = "Create or reset the local admin login (local development only)."

    @transaction.atomic
    def handle(self, *args: object, **options: object) -> None:
        # Same guard as the other seeds. It matters more here than anywhere: this mints an
        # account with a known weak password, which on a deployment would be a way in.
        guard_dev_only()

        username = env("DJANGO_SUPERUSER_USERNAME", default=DEFAULT_USERNAME)
        email = env("DJANGO_SUPERUSER_EMAIL", default=DEFAULT_EMAIL)
        password = env("DJANGO_SUPERUSER_PASSWORD", default=DEFAULT_PASSWORD)

        user, created = User.objects.get_or_create(username=username, defaults={"email": email})

        # Set every time, not just on create: a re-run is how you recover a password you
        # have forgotten, and it repairs an account someone demoted by hand.
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
