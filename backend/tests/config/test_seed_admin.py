import pytest
from django.contrib.auth.models import User
from django.core.management import call_command
from django.core.management.base import CommandError

pytestmark = [pytest.mark.django_db, pytest.mark.usefixtures("dev_environment")]


def test_creates_a_superuser_that_can_log_into_the_admin():
    call_command("seed_admin")

    user = User.objects.get(username="admin")
    assert user.is_staff and user.is_superuser
    assert user.check_password("admin")


def test_is_rerunnable_without_creating_a_second_account():
    call_command("seed_admin")
    call_command("seed_admin")

    assert User.objects.filter(username="admin").count() == 1


def test_a_rerun_converges_a_tampered_account():
    """Re-running is how you recover a forgotten dev password, or an account demoted by
    hand. Both are the one unconditional overwrite, so they are asserted together."""
    call_command("seed_admin")
    user = User.objects.get(username="admin")
    user.set_password("something-else")
    user.is_staff = False
    user.is_superuser = False
    user.save()

    call_command("seed_admin")

    user.refresh_from_db()
    assert user.check_password("admin")
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
    """The guard itself is covered in test_seeding.py — this asserts nothing is written
    before the check, which is the part specific to this command."""
    settings.ON_VERCEL = True

    with pytest.raises(CommandError):
        call_command("seed_admin")

    assert not User.objects.filter(username="admin").exists()
