"""The guard every seed command sits behind.

Tested here, once, rather than re-tested end-to-end through each command: the commands
wipe the rows they own, and what stops that happening on a deployment is this function.
Each seed command's own suite asserts only that it is behind the guard — that a refusal
destroys nothing — which is the part that is genuinely per-command.
"""

import pytest
from django.core.management import call_command, get_commands
from django.core.management.base import CommandError

from config.seeding import guard_dev_only

SEED_COMMANDS = sorted(name for name in get_commands() if name.startswith("seed_"))


def test_allows_a_local_development_environment(dev_environment):
    guard_dev_only()  # must not raise


def test_refuses_a_vercel_deployment(settings):
    """On a deployment the rows a seed would wipe are the owner's real agenda and prices."""
    settings.DEBUG = True
    settings.ON_VERCEL = True

    with pytest.raises(CommandError, match="Vercel"):
        guard_dev_only()


def test_refuses_debug_off(settings):
    """Catches what the Vercel flag cannot see: a laptop pointed at the production database."""
    settings.DEBUG = False
    settings.ON_VERCEL = False

    with pytest.raises(CommandError, match="DEBUG"):
        guard_dev_only()


def test_every_seed_command_is_discovered():
    """Guards the guard below: if the naming convention changes, the parametrised test
    would silently cover nothing."""
    assert SEED_COMMANDS == ["seed_admin", "seed_agenda", "seed_pricing"]


@pytest.mark.django_db
@pytest.mark.parametrize("command", SEED_COMMANDS)
def test_every_seed_command_refuses_a_deployment(settings, command):
    """The invariant, enforced across every seed command rather than remembered per file.

    `backend/CLAUDE.md` states this as a rule authors must follow; this is what makes a
    fourth command that forgets `guard_dev_only()` fail rather than merely read oddly.
    Discovery is by command name, so it covers a new seed whatever it inherits from.
    """
    settings.DEBUG = True
    settings.ON_VERCEL = True

    with pytest.raises(CommandError):
        call_command(command)
