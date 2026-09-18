"""Serializer helpers shared by the apps' management endpoints."""

from __future__ import annotations

import copy
from typing import Any

from rest_framework import serializers


class ModelCleanMixin(serializers.ModelSerializer):
    """Run the model's own ``clean()`` as part of serializer validation.

    DRF never calls ``Model.clean()``. Only the Django admin's ModelForm does. The rules
    in there (an event ends after it starts, an online event carries no address, a price
    is an amount *or* "sur devis") would otherwise be enforced only by the database
    constraints behind them. The editor would then get a 500 where the admin shows a French
    message on the right field. Calling ``clean()`` here keeps one statement of each rule,
    shared by both editing UIs.

    There's no error translation here: DRF catches a Django ValidationError raised from
    ``validate()`` and turns it into field errors itself (a bare message lands under
    ``non_field_errors``).
    """

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        attrs = super().validate(attrs)
        model = self.Meta.model
        # Work on a copy, never the instance itself: a PATCH that fails validation must not
        # leave half-applied values on the object the view is still holding.
        instance = copy.copy(self.instance) if self.instance is not None else model()
        concrete = {field.name for field in model._meta.concrete_fields}
        for name, value in attrs.items():
            if name in concrete:
                setattr(instance, name, value)
        instance.clean()
        return attrs
