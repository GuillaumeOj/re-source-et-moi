"""Drop the inline address columns; 0002 moved their contents onto Address rows."""

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("agenda", "0002_address"),
    ]

    operations = [
        migrations.RemoveField(model_name="event", name="address_line1"),
        migrations.RemoveField(model_name="event", name="address_line2"),
        migrations.RemoveField(model_name="event", name="postal_code"),
        migrations.RemoveField(model_name="event", name="city"),
    ]
