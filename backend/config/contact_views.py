"""The public contact form: a visitor's message, or a workshop sign-up, e-mailed to the
association.

Nothing is stored. The message goes to settings.CONTACT_EMAIL through Brevo, with the
visitor's address as Reply-To, so answering is replying to the e-mail.
"""

from __future__ import annotations

import logging
import re
from typing import Any

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from drf_spectacular.utils import extend_schema
from rest_framework import permissions, serializers, status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from agenda.models import Event
from config.csrf import csrf_protected

logger = logging.getLogger(__name__)

# The same messages the form shows for its own checks (frontend content/cta.ts).
INVALID_PHONE = "Indiquez un numéro de téléphone valide."
MESSAGE_REQUIRED = "Écrivez-nous quelques mots."
EVENT_UNAVAILABLE = "Cet atelier n'est plus proposé."

# The frontend's normalisePhone (lib/contact.ts), kept to the same rule: a French number
# once its separators are gone, national or international, with or without the bracketed
# trunk zero.
_FRENCH_PHONE = re.compile(r"^(?:(?:\+33|0033)0?|0)([1-9]\d{8})$")
_PHONE_SEPARATORS = re.compile(r"[\s.()-]")


def normalise_phone(typed: str) -> str | None:
    """A French number in international form ("+33612345678"), or None if it isn't one."""
    match = _FRENCH_PHONE.match(_PHONE_SEPARATORS.sub("", typed))
    return f"+33{match[1]}" if match else None


class UpcomingEventField(serializers.PrimaryKeyRelatedField):
    """A workshop a visitor can still sign up for. Anything else — a draft, a past
    workshop, an id that never existed or isn't one — gets the same message."""

    default_error_messages = {
        "does_not_exist": EVENT_UNAVAILABLE,
        "incorrect_type": EVENT_UNAVAILABLE,
    }

    def __init__(self, **kwargs: Any) -> None:
        pk_field = serializers.UUIDField(error_messages={"invalid": EVENT_UNAVAILABLE})
        super().__init__(pk_field=pk_field, **kwargs)

    def get_queryset(self) -> Any:
        # Per request, not at import: "upcoming" moves with the date.
        return Event.objects.upcoming()


class ContactSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=200)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=40)
    message = serializers.CharField(max_length=5000, allow_blank=True, required=False, default="")
    event = UpcomingEventField(required=False, allow_null=True, default=None)

    def validate_phone(self, value: str) -> str:
        phone = normalise_phone(value)
        if phone is None:
            raise serializers.ValidationError(INVALID_PHONE)
        return phone

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        # A sign-up is a message in itself; without one, the visitor has to say something.
        if attrs["event"] is None and not attrs["message"]:
            raise serializers.ValidationError({"message": [MESSAGE_REQUIRED]})
        return attrs


def _contact_email(context: dict[str, Any]) -> EmailMultiAlternatives:
    subject = render_to_string("config/contact_subject.txt", context).strip()
    message = EmailMultiAlternatives(
        subject,
        render_to_string("config/contact_email.txt", context),
        to=[settings.CONTACT_EMAIL],
        reply_to=[context["email"]],
    )
    message.attach_alternative(render_to_string("config/contact_email.html", context), "text/html")
    return message


@csrf_protected
class ContactView(APIView):
    """Send a visitor's message, or workshop sign-up, to the association.

    204 once Brevo has accepted it. Unlike the password reset, a sending failure is
    reported (503): nothing here is secret, and a visitor who is told the message did not
    leave can still call or write directly, where a silent failure would lose the message.
    """

    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "contact"

    @extend_schema(request=ContactSerializer, responses={204: None, 503: None})
    def post(self, request: Request) -> Response:
        payload = ContactSerializer(data=request.data)
        payload.is_valid(raise_exception=True)
        try:
            _contact_email(dict(payload.validated_data)).send()
        except Exception:
            logger.exception("Failed to send contact email")
            return Response(status=status.HTTP_503_SERVICE_UNAVAILABLE)
        return Response(status=status.HTTP_204_NO_CONTENT)
