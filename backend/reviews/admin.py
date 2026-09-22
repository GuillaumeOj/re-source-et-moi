from django.contrib import admin

from reviews.models import Review


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("author", "context", "created_at", "is_published")
    list_filter = ("is_published",)
    list_editable = ("is_published",)
    search_fields = ("author", "context", "text")
    fields = ("text", "author", "context", "is_published")
