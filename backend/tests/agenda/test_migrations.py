"""0002/0003 move each on-site workshop's inline address onto a saved Address.

Run against the real migration graph: roll the app back to 0001, write events the way the
old schema stored them, then migrate forward and look at what came out.
"""

import datetime

import pytest
from django.db import connection
from django.db.migrations.executor import MigrationExecutor

pytestmark = pytest.mark.django_db(transaction=True)

BEFORE = [("agenda", "0001_initial")]
AFTER = [("agenda", "0003_remove_event_inline_address")]


def migrate(targets):
    executor = MigrationExecutor(connection)
    executor.loader.build_graph()
    executor.migrate(targets)
    return executor.loader.project_state(targets).apps


@pytest.fixture
def old_apps():
    apps = migrate(BEFORE)
    yield apps
    migrate(AFTER)


def make_old_event(apps, **fields):
    Event = apps.get_model("agenda", "Event")
    defaults = {
        "title": "Atelier",
        "date": datetime.date(2026, 10, 1),
        "start_time": datetime.time(10, 0),
        "end_time": datetime.time(12, 0),
        "location_kind": "onsite",
    }
    return Event.objects.create(**{**defaults, **fields})


def test_moves_inline_addresses_onto_shared_saved_ones(old_apps):
    charite = {"address_line1": "12 rue de la Charité", "postal_code": "69002", "city": "Lyon"}
    first = make_old_event(old_apps, **charite)
    second = make_old_event(old_apps, date=datetime.date(2026, 11, 1), **charite)
    city_only = make_old_event(old_apps, city="Lyon")
    online = make_old_event(old_apps, location_kind="online")

    apps = migrate(AFTER)
    Event = apps.get_model("agenda", "Event")
    Address = apps.get_model("agenda", "Address")

    assert sorted(Address.objects.values_list("name", flat=True)) == [
        "12 rue de la Charité — Lyon",
        "Lyon",
    ]
    shared = Address.objects.get(name="12 rue de la Charité — Lyon")
    assert (shared.line1, shared.postal_code, shared.city) == (
        "12 rue de la Charité",
        "69002",
        "Lyon",
    )
    assert Event.objects.get(pk=first.pk).address_id == shared.pk
    assert Event.objects.get(pk=second.pk).address_id == shared.pk
    assert Event.objects.get(pk=city_only.pk).address.name == "Lyon"
    assert Event.objects.get(pk=online.pk).address_id is None


def test_gives_different_addresses_with_the_same_name_a_suffix(old_apps):
    """Same street and city, different complement: two places, one generated name."""
    make_old_event(old_apps, address_line1="1 rue X", city="Lyon", address_line2="Salle A")
    make_old_event(old_apps, address_line1="1 rue X", city="Lyon", address_line2="Salle B")

    Address = migrate(AFTER).get_model("agenda", "Address")

    assert sorted(Address.objects.values_list("name", flat=True)) == [
        "1 rue X — Lyon",
        "1 rue X — Lyon (2)",
    ]


def test_rolling_back_puts_the_address_back_on_the_workshop(old_apps):
    event = make_old_event(old_apps, address_line1="1 rue X", postal_code="69001", city="Lyon")
    migrate(AFTER)

    Event = migrate(BEFORE).get_model("agenda", "Event")

    restored = Event.objects.get(pk=event.pk)
    assert (restored.address_line1, restored.postal_code, restored.city) == (
        "1 rue X",
        "69001",
        "Lyon",
    )


def test_cuts_a_long_street_to_fit_the_name(old_apps):
    """line1 holds up to 200 characters, the name only 120: PostgreSQL would refuse the
    uncut name and fail the whole migration."""
    street = "x" * 200
    make_old_event(old_apps, address_line1=street, city="Lyon", address_line2="Salle A")
    make_old_event(old_apps, address_line1=street, city="Lyon", address_line2="Salle B")

    Address = migrate(AFTER).get_model("agenda", "Address")

    names = sorted(Address.objects.values_list("name", flat=True))
    assert names == ["x" * 116 + " (2)", "x" * 120]
    assert all(len(name) <= 120 for name in names)
