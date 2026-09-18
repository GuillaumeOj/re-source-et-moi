"""Shared guard for the dev-only seed commands.

Two kinds of damage are being prevented, which is why the guard is shared rather than
written per command. The content seeds wipe and rebuild the data they own — on a
deployment those rows are the owner's real agenda and real tariffs. `seed_admin` wipes
nothing but mints an account with a known weak password, which on a deployment would be a
way in. Either way, reaching one of these from a deployed environment must be impossible,
not merely discouraged.
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
    # The wording stays general: this guards three commands, and only two of them wipe.
    if settings.ON_VERCEL:
        raise CommandError(
            "Refusing to run on a Vercel deployment — seed commands are for local development only."
        )
    if not settings.DEBUG:
        raise CommandError(
            "Refusing to run with DEBUG off — seed commands are for local development "
            "only. Set DEBUG=1 if this really is your dev database."
        )
