"""Move the inline postal address of each on-site workshop onto a saved Address.

Schema first (the Address table and a nullable Event.address), then the data: one
Address per distinct postal address among the events, linked back to them. The four
inline columns are dropped in 0003, once nothing reads them.
"""

import uuid

import django.db.models.deletion
from django.db import migrations, models

ADDRESS_PARTS = ("address_line1", "address_line2", "postal_code", "city")
# Address.name's max_length, frozen here as a migration must not import the live model.
NAME_MAX_LENGTH = 120


def address_name(line1: str, city: str, taken: set[str]) -> str:
    """ "12 rue de la Charité — Lyon", or just the city, made unique with " (2)", " (3)"…"""
    base = " — ".join(filter(None, (line1, city))) or "Adresse"
    # line1 alone may hold 200 characters and the name only NAME_MAX_LENGTH: cut the base
    # so the name, suffix included, fits — PostgreSQL refuses an overlong value outright.
    name, suffix = base[:NAME_MAX_LENGTH], 2
    while name in taken:
        tail = f" ({suffix})"
        name, suffix = f"{base[: NAME_MAX_LENGTH - len(tail)]}{tail}", suffix + 1
    taken.add(name)
    return name


def inline_to_address(apps, schema_editor):
    Event = apps.get_model("agenda", "Event")
    Address = apps.get_model("agenda", "Address")

    taken: set[str] = set()
    by_parts: dict[tuple[str, ...], object] = {}
    # Online events never carried an address (Event.clean() refused one), so only on-site
    # ones are moved. The order makes the generated names, and their suffixes, stable.
    for event in Event.objects.filter(location_kind="onsite").order_by("date", "start_time"):
        parts = tuple(getattr(event, field).strip() for field in ADDRESS_PARTS)
        if not any(parts):
            continue
        address = by_parts.get(parts)
        if address is None:
            line1, line2, postal_code, city = parts
            address = Address.objects.create(
                name=address_name(line1, city, taken),
                line1=line1,
                line2=line2,
                postal_code=postal_code,
                city=city,
            )
            by_parts[parts] = address
        event.address = address
        event.save(update_fields=["address"])


def address_to_inline(apps, schema_editor):
    Event = apps.get_model("agenda", "Event")
    for event in Event.objects.exclude(address=None).select_related("address"):
        event.address_line1 = event.address.line1
        event.address_line2 = event.address.line2
        event.postal_code = event.address.postal_code
        event.city = event.address.city
        event.save(update_fields=list(ADDRESS_PARTS))


class Migration(migrations.Migration):
    dependencies = [
        ("agenda", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Address",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4, editable=False, primary_key=True, serialize=False
                    ),
                ),
                (
                    "name",
                    models.CharField(
                        help_text="Pour la retrouver dans la liste, par exemple « Salle Paul Éluard ».",
                        max_length=120,
                        unique=True,
                        verbose_name="nom",
                    ),
                ),
                ("line1", models.CharField(blank=True, max_length=200, verbose_name="adresse")),
                (
                    "line2",
                    models.CharField(
                        blank=True, max_length=200, verbose_name="complément d'adresse"
                    ),
                ),
                (
                    "postal_code",
                    models.CharField(blank=True, max_length=16, verbose_name="code postal"),
                ),
                ("city", models.CharField(max_length=120, verbose_name="ville")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name": "adresse",
                "verbose_name_plural": "adresses",
                "ordering": ["name"],
            },
        ),
        migrations.AddField(
            model_name="event",
            name="address",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="events",
                to="agenda.address",
                verbose_name="adresse",
            ),
        ),
        migrations.AlterField(
            model_name="event",
            name="location_label_override",
            field=models.CharField(
                blank=True,
                help_text="Laisser vide pour le déduire du lieu (« En ligne », ou la ville de l'adresse).",
                max_length=120,
                verbose_name="libellé du lieu",
            ),
        ),
        migrations.RunPython(inline_to_address, address_to_inline),
    ]
