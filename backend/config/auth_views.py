"""Session login and account management for the site owner's editor.

The editor is a page of the Next.js site. It calls this API from the browser on the same
origin (Vercel's /api rewrite in production, a Next rewrite locally), so it authenticates
the way a browser does: a Django session cookie, with CSRF protection on every write.
Only staff accounts get in. The site has no user accounts.

Password rules and their French messages come from Django's own auth forms
(PasswordChangeForm, SetPasswordForm, PasswordResetForm) rather than being rewritten
here, so AUTH_PASSWORD_VALIDATORS applies exactly as it does in the admin.
"""

from __future__ import annotations

from collections.abc import Callable, Iterator
from typing import Any, cast

from django.conf import settings
from django.contrib.auth import authenticate, login, logout, update_session_auth_hash
from django.contrib.auth.forms import PasswordChangeForm, PasswordResetForm, SetPasswordForm
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import password_validators_help_texts
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import NON_FIELD_ERRORS
from django.forms import Form
from django.http import HttpResponseBase
from django.utils.decorators import method_decorator
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from drf_spectacular.utils import extend_schema
from rest_framework import permissions, serializers, status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.settings import api_settings
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

# One message for every failure, so the form never tells a guesser which half was right,
# or that an account exists but lacks staff access.
LOGIN_FAILED = "Identifiant ou mot de passe incorrect."
WRONG_CURRENT_PASSWORD = "Le mot de passe actuel est incorrect."
INVALID_RESET_LINK = "Ce lien n'est plus valide. Demandez-en un nouveau."

_View = Callable[..., HttpResponseBase]


def _for_dispatch(decorator: object) -> Callable[[_View], _View]:
    """Hand a CSRF view decorator to method_decorator in a form ty accepts.

    django-stubs types csrf_protect and ensure_csrf_cookie as generic identity functions,
    and ty cannot match that against method_decorator's parameter. They are view
    decorators at runtime, and that is all this cast states.
    """
    return cast(Callable[[_View], _View], decorator)


def _form_errors(form: Form) -> dict[str, list[str]]:
    """A Django form's errors in DRF's shape: `__all__` becomes `non_field_errors`."""
    return {
        (api_settings.NON_FIELD_ERRORS_KEY if field == NON_FIELD_ERRORS else field): [
            str(message) for message in errors
        ]
        for field, errors in form.errors.items()
    }


def _staff(request: Request) -> User:
    """The logged-in staff member. IsAdminUser has already guaranteed there is one, and
    AUTH_USER_MODEL is Django's User. See CLAUDE.md, "ty does not run django-stubs'
    plugin"."""
    return cast(User, request.user)


class SessionSerializer(serializers.Serializer):
    username = serializers.CharField(read_only=True)
    email = serializers.EmailField(read_only=True)


def _session(user: User) -> dict[str, Any]:
    return dict(SessionSerializer(user).data)


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(style={"input_type": "password"}, trim_whitespace=False)


class AccountSerializer(serializers.ModelSerializer):
    """The editor's "Mon compte" form: new username and e-mail, confirmed by the current
    password. The e-mail is where a reset link goes, so changing it is as sensitive as
    changing the password, and it is required: an account without one cannot be recovered."""

    current_password = serializers.CharField(write_only=True, trim_whitespace=False)

    class Meta:
        model = User
        fields = ("username", "email", "current_password")
        extra_kwargs = {"email": {"required": True, "allow_blank": False}}

    def validate_current_password(self, value: str) -> str:
        user = cast(User, self.instance)
        if not user.check_password(value):
            raise serializers.ValidationError(WRONG_CURRENT_PASSWORD)
        return value

    def update(self, instance: User, validated_data: dict[str, Any]) -> User:
        validated_data.pop("current_password")
        return super().update(instance, validated_data)


class PasswordChangeSerializer(serializers.Serializer):
    """The request shape only. PasswordChangeForm does the validating."""

    old_password = serializers.CharField(trim_whitespace=False)
    new_password1 = serializers.CharField(trim_whitespace=False)
    new_password2 = serializers.CharField(trim_whitespace=False)


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    """The request shape only. SetPasswordForm does the validating."""

    uid = serializers.CharField()
    token = serializers.CharField()
    new_password1 = serializers.CharField(trim_whitespace=False)
    new_password2 = serializers.CharField(trim_whitespace=False)


class EditorPasswordResetForm(PasswordResetForm):
    """Django's reset form, limited to staff: nobody else has anything to log into."""

    def get_users(self, email: str) -> Iterator[Any]:
        # isinstance for ty, as in LoginView: the parent yields AbstractBaseUser.
        return (
            user for user in super().get_users(email) if isinstance(user, User) and user.is_staff
        )


@method_decorator(_for_dispatch(ensure_csrf_cookie), name="dispatch")
class CsrfView(APIView):
    """Set the CSRF cookie, and nothing else.

    Every write needs the token, and a logged-out page (login, reset) has nothing else to
    get it from. The editor's fetch layer calls this by itself before its first write, so
    no page has to know about it.
    """

    permission_classes = [permissions.AllowAny]

    @extend_schema(responses={204: None})
    def get(self, request: Request) -> Response:
        return Response(status=status.HTTP_204_NO_CONTENT)


class PasswordRulesSerializer(serializers.Serializer):
    rules = serializers.ListField(child=serializers.CharField(), read_only=True)


class PasswordRulesView(APIView):
    """The password rules, in French, straight from AUTH_PASSWORD_VALIDATORS.

    The editor shows these under every "new password" field. They come from the backend
    so the hint can never promise less, or more, than what is actually enforced.
    """

    permission_classes = [permissions.AllowAny]

    @extend_schema(responses={200: PasswordRulesSerializer})
    def get(self, request: Request) -> Response:
        return Response({"rules": [str(rule) for rule in password_validators_help_texts()]})


class SessionView(APIView):
    """Who is logged in: 401 without a session, 403 for a non-staff one. The editor uses
    this to decide between its login form and the editor itself."""

    permission_classes = [permissions.IsAdminUser]

    @extend_schema(responses={200: SessionSerializer})
    def get(self, request: Request) -> Response:
        return Response(_session(_staff(request)))


# DRF only enforces CSRF on requests that are already authenticated. That would leave the
# anonymous endpoints below (login, reset) open to cross-site requests, and csrf_protect
# closes the gap.
@method_decorator(_for_dispatch(csrf_protect), name="dispatch")
class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"

    @extend_schema(request=LoginSerializer, responses={200: SessionSerializer})
    def post(self, request: Request) -> Response:
        credentials = LoginSerializer(data=request.data)
        credentials.is_valid(raise_exception=True)
        user = authenticate(
            request,
            username=credentials.validated_data["username"],
            password=credentials.validated_data["password"],
        )
        # isinstance narrows authenticate()'s AbstractBaseUser to the concrete User, which is
        # what AUTH_USER_MODEL is here. See CLAUDE.md, "ty does not run django-stubs' plugin".
        if not isinstance(user, User) or not user.is_staff:
            raise serializers.ValidationError({api_settings.NON_FIELD_ERRORS_KEY: [LOGIN_FAILED]})
        login(request, user)
        return Response(_session(user))


@method_decorator(_for_dispatch(csrf_protect), name="dispatch")
class LogoutView(APIView):
    permission_classes = [permissions.AllowAny]

    @extend_schema(request=None, responses={204: None})
    def post(self, request: Request) -> Response:
        logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class AccountView(APIView):
    """Change the logged-in staff member's username and e-mail."""

    permission_classes = [permissions.IsAdminUser]

    @extend_schema(request=AccountSerializer, responses={200: SessionSerializer})
    def put(self, request: Request) -> Response:
        user = _staff(request)
        account = AccountSerializer(user, data=request.data)
        account.is_valid(raise_exception=True)
        account.save()
        return Response(_session(user))


class PasswordChangeView(APIView):
    """Change the logged-in staff member's password, keeping the session open.

    Django invalidates every session when the password changes. update_session_auth_hash
    re-validates this one, so she isn't logged out of the page she changed it from, while
    any other browser still logged in as her is.
    """

    permission_classes = [permissions.IsAdminUser]

    @extend_schema(request=PasswordChangeSerializer, responses={204: None})
    def post(self, request: Request) -> Response:
        user = _staff(request)
        form = PasswordChangeForm(user, data=request.data)
        if not form.is_valid():
            return Response(_form_errors(form), status=status.HTTP_400_BAD_REQUEST)
        form.save()
        update_session_auth_hash(request, user)
        return Response(status=status.HTTP_204_NO_CONTENT)


@method_decorator(_for_dispatch(csrf_protect), name="dispatch")
class PasswordResetRequestView(APIView):
    """Send a reset link to a staff member's e-mail address.

    Always 204, whether or not the address matches an account, so the form cannot be used
    to find out which addresses do. For the same reason a Brevo failure is logged rather
    than reported: only a matching address ever reaches the send, so an error would reveal
    the match.

    The link points at settings.EDITOR_URL and never at anything taken from the request.
    See the note on EDITOR_URL in settings.py.
    """

    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "password_reset"

    @extend_schema(request=PasswordResetRequestSerializer, responses={204: None})
    def post(self, request: Request) -> Response:
        PasswordResetRequestSerializer(data=request.data).is_valid(raise_exception=True)
        form = EditorPasswordResetForm(data=request.data)
        if form.is_valid():
            # Django's form catches a sending failure itself and logs it (as
            # "Failed to send password reset email"), which is exactly the behaviour
            # described above.
            form.save(
                domain_override="re-source-et-moi.fr",
                subject_template_name="config/password_reset_subject.txt",
                email_template_name="config/password_reset_email.txt",
                html_email_template_name="config/password_reset_email.html",
                extra_email_context={"editor_url": settings.EDITOR_URL},
            )
        return Response(status=status.HTTP_204_NO_CONTENT)


@method_decorator(_for_dispatch(csrf_protect), name="dispatch")
class PasswordResetConfirmView(APIView):
    """Set a new password from the link in the reset e-mail.

    The token is Django's: single-use (it is tied to the current password hash), and
    valid for PASSWORD_RESET_TIMEOUT. Setting the password ends every open session.
    """

    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "password_reset_confirm"

    @extend_schema(request=PasswordResetConfirmSerializer, responses={204: None})
    def post(self, request: Request) -> Response:
        payload = PasswordResetConfirmSerializer(data=request.data)
        payload.is_valid(raise_exception=True)

        user = self._user_for(payload.validated_data["uid"])
        if user is None or not default_token_generator.check_token(
            user, payload.validated_data["token"]
        ):
            return Response({"token": [INVALID_RESET_LINK]}, status=status.HTTP_400_BAD_REQUEST)

        form = SetPasswordForm(user, data=request.data)
        if not form.is_valid():
            return Response(_form_errors(form), status=status.HTTP_400_BAD_REQUEST)
        form.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @staticmethod
    def _user_for(uid: str) -> User | None:
        try:
            pk = force_str(urlsafe_base64_decode(uid))
        except ValueError:
            return None
        # isdecimal, not isdigit: "²" is a digit but int() rejects it, which would be a 500.
        if not pk.isdecimal():
            return None
        return User.objects.filter(pk=int(pk), is_staff=True, is_active=True).first()
