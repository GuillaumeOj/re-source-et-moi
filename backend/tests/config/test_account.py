"""/api/auth/account/ and /api/auth/password/: the editor's "Mon compte" page."""

import pytest
from django.contrib.auth.models import User

from config.auth_views import WRONG_CURRENT_PASSWORD

pytestmark = pytest.mark.django_db

ACCOUNT = "/api/auth/account/"
PASSWORD = "/api/auth/password/"
SESSION = "/api/auth/session/"
CURRENT = "motdepasse-solide"
NEW = "un-nouveau-mot-de-passe-2027"


def test_both_are_refused_to_an_anonymous_visitor(client):
    assert client.put(ACCOUNT, {}).status_code == 401
    assert client.post(PASSWORD, {}).status_code == 401


def test_updates_username_and_email(staff_client):
    response = staff_client.put(
        ACCOUNT,
        {
            "username": "cecile.m",
            "email": "cecile@re-source-et-moi.fr",
            "current_password": CURRENT,
        },
        format="json",
    )

    assert response.status_code == 200
    assert response.json() == {"username": "cecile.m", "email": "cecile@re-source-et-moi.fr"}
    user = User.objects.get()
    assert (user.username, user.email) == ("cecile.m", "cecile@re-source-et-moi.fr")
    # Still logged in afterwards: the session is tied to the account, not its username.
    assert staff_client.get(SESSION).status_code == 200


def test_account_changes_need_the_current_password(staff_client):
    """The e-mail is where reset links go. Changing it must take more than an unattended,
    already-open browser tab."""
    response = staff_client.put(
        ACCOUNT,
        {"username": "cecile", "email": "pirate@example.org", "current_password": "mauvais"},
        format="json",
    )

    assert response.status_code == 400
    assert response.json() == {"current_password": [WRONG_CURRENT_PASSWORD]}
    assert User.objects.get().email == "cecile@example.org"


def test_the_email_is_required(staff_client):
    """Without one the account could never be recovered through "mot de passe oublié"."""
    response = staff_client.put(
        ACCOUNT, {"username": "cecile", "email": "", "current_password": CURRENT}, format="json"
    )

    assert response.status_code == 400
    assert "email" in response.json()


def test_a_username_already_taken_is_refused(staff_client):
    User.objects.create_user("autre", password="x")

    response = staff_client.put(
        ACCOUNT,
        {"username": "autre", "email": "cecile@example.org", "current_password": CURRENT},
        format="json",
    )

    assert response.status_code == 400
    assert "username" in response.json()


def test_changes_the_password_and_keeps_the_session(staff_client):
    response = staff_client.post(
        PASSWORD,
        {"old_password": CURRENT, "new_password1": NEW, "new_password2": NEW},
        format="json",
    )

    assert response.status_code == 204
    assert User.objects.get().check_password(NEW)
    assert staff_client.get(SESSION).status_code == 200


def test_the_password_change_needs_the_current_one(staff_client):
    response = staff_client.post(
        PASSWORD,
        {"old_password": "mauvais", "new_password1": NEW, "new_password2": NEW},
        format="json",
    )

    assert response.status_code == 400
    assert "old_password" in response.json()
    assert User.objects.get().check_password(CURRENT)


@pytest.mark.parametrize(
    ("new1", "new2", "field"),
    [
        (NEW, "autre-chose-2027", "new_password2"),
        ("12345678", "12345678", "new_password2"),
    ],
    ids=["mismatch", "too-weak"],
)
def test_the_new_password_goes_through_djangos_rules(staff_client, new1, new2, field):
    """PasswordChangeForm, so the validators and their French messages are the admin's."""
    response = staff_client.post(
        PASSWORD,
        {"old_password": CURRENT, "new_password1": new1, "new_password2": new2},
        format="json",
    )

    assert response.status_code == 400
    assert field in response.json()
    assert User.objects.get().check_password(CURRENT)
