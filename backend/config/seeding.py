"""Shared guard for the dev-only seed commands.

The seed commands wipe and rebuild the data they own. That is exactly what you want on a
laptop and a catastrophe on a deployment, where the rows are the owner's real agenda and
real tariffs — so reaching one from a deployed environment must be impossible, not merely
discouraged.
"""

from django.conf import settings
from django.core.management.base import CommandError


def guard_dev_only() -> None:
    """Refuse to run anywhere that isn't a local development environment.

    Two independent conditions, because either alone is too easy to satisfy by accident:
    VERCEL_ENV must be absent (so a deploy is out regardless of how DEBUG is configured),
    and DEBUG must be on (so running against a production DATABASE_URL from a laptop,
    which the Vercel check cannot see, still fails).
    """
    if settings.ON_VERCEL:
        raise CommandError("Refusing to run on a Vercel deployment — this command wipes data.")
    if not settings.DEBUG:
        raise CommandError(
            "Refusing to run with DEBUG off — this command wipes data and is for local "
            "development only. Set DEBUG=1 if this really is your dev database."
        )
