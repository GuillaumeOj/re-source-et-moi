"""The API's one authentication scheme: the editor's Django session."""

from drf_spectacular.authentication import SessionScheme
from rest_framework.authentication import SessionAuthentication
from rest_framework.request import Request


class EditorSessionAuthentication(SessionAuthentication):
    """Session authentication that answers 401, not 403, when there is no session.

    DRF picks between the two with `authenticate_header`: no header means every refusal
    is a 403. Plain SessionAuthentication has none, so "not logged in" and "logged in but
    not allowed" (a CSRF failure, a non-staff account) would both read as 403. The editor
    has to tell them apart: the first sends it back to the login form, and the second is
    an error to report. The header value names no browser-known scheme, so no browser
    shows its own login prompt.
    """

    def authenticate_header(self, request: Request) -> str:
        return "Session"


class EditorSessionScheme(SessionScheme):
    """Describe the subclass in the OpenAPI schema the way drf-spectacular describes
    SessionAuthentication (a `sessionid` cookie). Without it, the schema generator warns
    on every view and leaves the scheme out. Registered by being defined."""

    target_class = "config.authentication.EditorSessionAuthentication"
