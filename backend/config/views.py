"""Project-level views that belong to no app."""

from drf_spectacular.utils import extend_schema
from rest_framework import permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.request import Request
from rest_framework.response import Response


@extend_schema(responses={200: {"type": "object", "properties": {"status": {"type": "string"}}}})
@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def health(_request: Request) -> Response:
    """Liveness probe used by the dev stack's healthcheck. Public — no auth required."""
    return Response({"status": "ok"})
