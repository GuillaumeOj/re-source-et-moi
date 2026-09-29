"""CSRF class decorators for the API views.

DRF only enforces CSRF on requests that are already authenticated. That leaves anonymous
endpoints that act on a browser's behalf (login, reset, the contact form) open to
cross-site requests; `csrf_protected` closes the gap.
"""

from collections.abc import Callable
from typing import cast

from django.http import HttpResponseBase
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie

_View = Callable[..., HttpResponseBase]


def _for_dispatch(decorator: object) -> Callable[[_View], _View]:
    """Hand a CSRF view decorator to method_decorator in a form ty accepts.

    django-stubs types csrf_protect and ensure_csrf_cookie as generic identity functions,
    and ty cannot match that against method_decorator's parameter. They are view
    decorators at runtime, and that is all this cast states.
    """
    return cast(Callable[[_View], _View], decorator)


# Class decorators for an APIView: they wrap its dispatch().
csrf_protected = method_decorator(_for_dispatch(csrf_protect), name="dispatch")
csrf_cookie_ensured = method_decorator(_for_dispatch(ensure_csrf_cookie), name="dispatch")
