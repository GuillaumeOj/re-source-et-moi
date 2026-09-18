import pytest
from django.contrib.auth.models import User
from django.core.management import call_command
from django.core.management.base import CommandError

pytestmark = [pytest.mark.django_db, pytest.mark.usefixtures("dev_environment")]


def test_creates_a_superuser_that_can_log_into_the_admin(client):
    call_command("seed_admin")

    user = User.objects.get(username="admin")
    assert user.is_staff and user.is_superuser
    assert user.check_password("admin")
    assert client.login(username="admin", password="admin")


def test_is_rerunnable_without_creating_a_second_account():
    call_command("seed_admin")
    call_command("seed_admin")

    assert User.objects.filter(username="admin").count() == 1


def test_a_rerun_restores_a_changed_password():
    """Re-running is how you recover a dev password you have forgotten."""
    call_command("seed_admin")
    user = User.objects.get(username="admin")
    user.set_password("something-else")
    user.save()

    call_command("seed_admin")

    assert User.objects.get(username="admin").check_password("admin")


def test_a_rerun_repairs_an_account_that_lost_its_privileges():
    call_command("seed_admin")
    User.objects.filter(username="admin").update(is_staff=False, is_superuser=False)

    call_command("seed_admin")

    user = User.objects.get(username="admin")
    assert user.is_staff and user.is_superuser


def test_honours_the_django_superuser_env_vars(monkeypatch):
    """The same variable names Django's own createsuperuser reads."""
    monkeypatch.setenv("DJANGO_SUPERUSER_USERNAME", "cecile")
    monkeypatch.setenv("DJANGO_SUPERUSER_EMAIL", "cecile@example.test")
    monkeypatch.setenv("DJANGO_SUPERUSER_PASSWORD", "un-mot-de-passe")

    call_command("seed_admin")

    user = User.objects.get(username="cecile")
    assert user.email == "cecile@example.test"
    assert user.check_password("un-mot-de-passe")


def test_leaves_other_accounts_alone():
    """Unlike the content seeds, this one destroys nothing."""
    other = User.objects.create_user(username="someone", password="pw")

    call_command("seed_admin")

    assert User.objects.filter(pk=other.pk).exists()


def test_refuses_to_run_outside_development(settings):
    """It mints a known weak password; on a deployment that would be a way in.

    The guard itself is covered in test_seeding.py — this asserts the command is behind it.
    """
    settings.ON_VERCEL = True

    with pytest.raises(CommandError):
        call_command("seed_admin")

    assert not User.objects.filter(username="admin").exists()
