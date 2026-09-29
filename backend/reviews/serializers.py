from rest_framework import serializers

from config.serializers import ModelCleanMixin
from reviews.models import Review


class ReviewSerializer(serializers.ModelSerializer):
    """A review as the public site renders it. `is_published` stays out: the public feed
    only ever holds published reviews."""

    class Meta:
        model = Review
        fields = ("id", "text", "author", "context")


class ReviewManageSerializer(ModelCleanMixin):
    """A review as the editor reads and writes it, drafts included."""

    class Meta:
        model = Review
        fields = ("id", "text", "author", "context", "is_published", "created_at")
        read_only_fields = ("created_at",)
