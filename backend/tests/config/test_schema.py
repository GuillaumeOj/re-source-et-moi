"""The OpenAPI schema is an API contract: the frontend's TypeScript types are generated
from it, so a change in its shape is a change in what the site compiles against."""

import pytest

from config.spectacular_hooks import make_response_fields_required

pytestmark = pytest.mark.django_db


def test_schema_is_served(client):
    response = client.get("/api/schema/")

    assert response.status_code == 200


def test_response_components_have_every_property_required(client):
    """Without the postprocessing hook, DRF's read-only and method fields come out
    `required: false` and the generated TS types them `T | undefined` — forcing `??`
    guards on values that are always present. See config/spectacular_hooks.py."""
    schema = client.get("/api/schema/?format=json").json()
    components = schema["components"]["schemas"]

    event = components["Event"]
    assert set(event["required"]) == set(event["properties"])
    assert "address" in event["required"]

    pricing_type = components["PricingType"]
    assert set(pricing_type["required"]) == set(pricing_type["properties"])
    assert "prices" in pricing_type["required"]


def test_paths_have_the_api_prefix_trimmed(client):
    """SCHEMA_PATH_PREFIX_TRIM — the frontend's base URL already ends in /api, so leaving
    the prefix on would generate calls to /api/api/events/."""
    paths = client.get("/api/schema/?format=json").json()["paths"]

    assert "/events/" in paths
    assert "/pricing-types/" in paths


def test_the_hook_leaves_request_components_alone():
    """Request bodies legitimately have optional fields (a PATCH body is partial), so
    require-all must not touch them."""
    result = {
        "components": {
            "schemas": {
                "Event": {"properties": {"id": {}, "title": {}}},
                "EventRequest": {"properties": {"title": {}}},
            }
        }
    }

    processed = make_response_fields_required(result, None, None, True)
    schemas = processed["components"]["schemas"]

    assert schemas["Event"]["required"] == ["id", "title"]
    assert "required" not in schemas["EventRequest"]


def test_the_hook_tolerates_a_schema_with_no_components():
    assert make_response_fields_required({}, None, None, True) == {}
