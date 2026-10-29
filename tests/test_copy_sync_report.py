"""House fork tests for the copy sync wiring in
device_settings_websocket_api.py's ws_report (fork issue #5).

Run: python3 -m unittest discover -s tests   (no dependencies)

Home Assistant isn't installed here, so the few names that module uses
from it are stubbed, and the entity modules it notifies (button, number,
select, switch, text) are replaced with no-ops. const.py and copy_sync.py
load for real. The decision rules themselves are tested in
test_copy_sync.py; this checks that ws_report records the user, passes a
change on through the existing push path, and leaves everyone else alone.
"""
import asyncio
import importlib.util
import pathlib
import sys
import types
import unittest

_PKG_DIR = pathlib.Path(__file__).resolve().parents[1] / "custom_components" / "family_hub"
_PKG = "family_hub_under_test"
_NOW = ["2026-10-26T22:00:00+00:00"]

OWNER = "1fd0c2c4a19241c192c77dc39bf472f4"
JENN = "6e16c1f58eef48e0ab02f0db8be9b21c"
TITLE = "familyCalendarTopBarTitleOnlyLocal"
START = "familyCalendarStartViewLocal"
NAME = "familyHubDeviceCustomNameLocal"
THEME = "familyHubDeviceThemeOverrideLocal"
EVENT_PUSH = "family_hub_device_settings_push"


def _module(name, **attrs):
    module = types.ModuleType(name)
    module.__dict__.update(attrs)
    sys.modules[name] = module
    return module


def _load_ws_module():
    noop = lambda *args, **kwargs: None  # noqa: E731
    _module("voluptuous", Required=lambda key, **kw: key, Optional=lambda key, **kw: key)
    _module("homeassistant")
    _module("homeassistant.components")
    _module(
        "homeassistant.components.websocket_api",
        websocket_command=lambda schema: (lambda fn: fn),
        async_response=lambda fn: fn,
        event_message=lambda msg_id, data: {"id": msg_id, "event": data},
        async_register_command=noop,
        ActiveConnection=object,
    )
    sys.modules["homeassistant.components"].websocket_api = sys.modules["homeassistant.components.websocket_api"]
    _module("homeassistant.core", HomeAssistant=object, callback=lambda fn: fn)

    class _Now:
        def isoformat(self):
            return _NOW[0]

    dt = _module("homeassistant.util.dt", utcnow=lambda: _Now())
    _module("homeassistant.util", dt=dt)

    package = _module(_PKG)
    package.__path__ = [str(_PKG_DIR)]
    entity_stub = dict(
        create_entities_for_device=noop, notify_device=noop, create_entities_for_instance=noop,
        notify_instance=noop, create_sync_button_for_device=noop, create_sync_button_for_instance=noop,
        notify_device_privacy_participates=noop,
    )
    for name in ("button", "number", "select", "switch", "text", "device_settings_entity_shared"):
        setattr(package, name, _module(f"{_PKG}.{name}", **entity_stub))
    for name in ("const", "copy_sync", "device_settings_websocket_api"):
        spec = importlib.util.spec_from_file_location(f"{_PKG}.{name}", _PKG_DIR / f"{name}.py")
        module = importlib.util.module_from_spec(spec)
        sys.modules[spec.name] = module
        spec.loader.exec_module(module)
        setattr(package, name, module)
    return sys.modules[f"{_PKG}.device_settings_websocket_api"]


ws = _load_ws_module()


class _Store:
    def __init__(self):
        self.saves = 0

    async def async_save(self, data):
        self.saves += 1


class _Bus:
    def __init__(self):
        self.fired = []

    def async_fire(self, event_type, data):
        self.fired.append((event_type, data))


class _Connection:
    def __init__(self, user_id):
        self.user = types.SimpleNamespace(id=user_id, is_admin=False)
        self.results = []
        self.errors = []

    def send_result(self, msg_id, result=None):
        self.results.append(result)

    def send_error(self, msg_id, code, message):
        self.errors.append(code)


def view(title="off"):
    return {
        "familyCalendarCurrentDayFirstLocal": "off",
        "familyCalendarWeekDayCountLocal": 7,
        "familyCalendarWeekRowsLocal": 1,
        "familyCalendarWeekViewVariantLocal": "planner",
        "familyCalendarMonthViewVariantLocal": "split",
        "familyCalendarShowTimelineLocal": "off",
        "familyCalendarSmallScreenModeLocal": "off",
        "familyCalendarHideTopBarDeviceLocal": "off",
        TITLE: title,
    }


class WsReport(unittest.TestCase):
    def setUp(self):
        self.entry_data = {"device_settings": {"devices": {}, "presets": {}}, "device_settings_store": _Store()}
        self.bus = _Bus()
        self.hass = types.SimpleNamespace(bus=self.bus)
        ws._get_entry_data = lambda hass: self.entry_data

    @property
    def devices(self):
        return self.entry_data["device_settings"]["devices"]

    def report(self, user_id, device_id, instance_id, title="off", name="", theme="", applied=0, instance_applied=0, label="family-hub"):
        connection = _Connection(user_id)
        msg = {
            "id": 1, "type": "family_hub/device_settings/report", "device_id": device_id,
            "settings": {NAME: name, THEME: theme}, "device_name": "iPhone", "instance_id": instance_id,
            "instance_settings": view(title), "instance_label": label,
        }
        if applied is not None:
            msg["applied_seq"] = applied
        if instance_applied is not None:
            msg["instance_applied_seq"] = instance_applied
        asyncio.run(ws.ws_report(self.hass, connection, msg))
        self.assertEqual(connection.errors, [])
        return connection

    def pushes(self):
        return [data for event_type, data in self.bus.fired if event_type == EVENT_PUSH]

    def setup_owner_and_jenn(self):
        self.report(OWNER, "dev-home", "inst-home")
        self.report(OWNER, "dev-cloud", "inst-cloud")
        self.report(JENN, "dev-jenn", "inst-jenn")
        self.bus.fired.clear()

    def test_report_records_the_user(self):
        self.report(OWNER, "dev-home", "inst-home")
        self.assertEqual(self.devices["dev-home"]["user_id"], OWNER)

    def test_record_without_a_user_keeps_working(self):
        self.devices["dev-old"] = {"settings": {NAME: ""}, "instances": {}}
        self.report(OWNER, "dev-old", "inst-old")
        self.assertEqual(self.devices["dev-old"]["instances"]["inst-old"]["settings"][TITLE], "off")

    def test_first_reports_queue_nothing(self):
        self.setup_owner_and_jenn()
        self.assertEqual(self.pushes(), [])

    def test_change_reaches_the_owners_other_copy_only(self):
        self.setup_owner_and_jenn()
        self.report(OWNER, "dev-home", "inst-home", title="on")
        self.assertEqual(
            self.pushes(),
            [{"device_id": "dev-cloud", "instance_id": "inst-cloud", "seq": 1, "settings": {TITLE: "on"}}],
        )
        cloud = self.devices["dev-cloud"]["instances"]["inst-cloud"]
        self.assertEqual((cloud["pending_seq"], cloud["pending_settings"]), (1, {TITLE: "on"}))
        self.assertEqual(self.devices["dev-jenn"]["instances"]["inst-jenn"]["pending_seq"], 0)

    def test_next_open_gets_it_from_get_pending(self):
        self.setup_owner_and_jenn()
        self.report(OWNER, "dev-home", "inst-home", title="on")
        connection = _Connection(OWNER)
        asyncio.run(ws.ws_get_pending(self.hass, connection, {"id": 2, "device_id": "dev-cloud", "instance_id": "inst-cloud"}))
        self.assertEqual(connection.results[0]["instance"], {"seq": 1, "settings": {TITLE: "on"}})

    def test_no_bounce(self):
        self.setup_owner_and_jenn()
        self.report(OWNER, "dev-home", "inst-home", title="on")
        self.bus.fired.clear()
        # Cloud opens and reports before applying seq 1, then after.
        self.report(OWNER, "dev-cloud", "inst-cloud", title="off", instance_applied=0)
        self.report(OWNER, "dev-cloud", "inst-cloud", title="on", instance_applied=1)
        self.assertEqual(self.pushes(), [])
        self.assertEqual(self.devices["dev-home"]["instances"]["inst-home"]["pending_seq"], 0)

    def test_same_values_queue_nothing(self):
        self.setup_owner_and_jenn()
        self.report(OWNER, "dev-home", "inst-home")
        self.assertEqual(self.pushes(), [])

    def test_older_card_passes_nothing_on(self):
        self.setup_owner_and_jenn()
        self.report(OWNER, "dev-home", "inst-home", title="on", applied=None, instance_applied=None)
        self.assertEqual(self.pushes(), [])

    def test_new_copy_is_seeded_and_its_defaults_go_nowhere(self):
        self.setup_owner_and_jenn()
        self.report(OWNER, "dev-home", "inst-home", title="on")
        self.report(OWNER, "dev-cloud", "inst-cloud", title="on", instance_applied=1)
        self.bus.fired.clear()
        # A brand-new copy of the owner's opens on defaults (Title only off).
        self.report(OWNER, "dev-new", "inst-new", title="off")
        self.assertEqual(
            self.pushes(),
            [{"device_id": "dev-new", "instance_id": "inst-new", "seq": 1, "settings": {TITLE: "on"}}],
        )
        for dev, inst in (("dev-home", "inst-home"), ("dev-cloud", "inst-cloud")):
            self.assertEqual(self.devices[dev]["instances"][inst]["settings"][TITLE], "on")
        self.assertEqual(self.devices["dev-cloud"]["instances"]["inst-cloud"]["pending_seq"], 1)

    def test_new_copy_is_seeded_from_copies_set_up_before_the_update(self):
        # The 2026-10-26 case: settings chosen before sync existed, so no
        # change was ever recorded; a new copy still opens on them.
        self.report(OWNER, "dev-home", "inst-home", title="on", theme="liquidglassdark")
        self.bus.fired.clear()
        self.report(OWNER, "dev-new", "inst-new", title="off", theme="")
        self.assertIn({"device_id": "dev-new", "instance_id": "inst-new", "seq": 1, "settings": {TITLE: "on"}}, self.pushes())
        self.assertIn({"device_id": "dev-new", "seq": 1, "settings": {THEME: "liquidglassdark"}}, self.pushes())

    def test_another_page_on_the_same_copy_is_left_alone(self):
        self.setup_owner_and_jenn()
        self.report(OWNER, "dev-home", "inst-home-2")
        self.bus.fired.clear()
        self.report(OWNER, "dev-home", "inst-home", title="on")
        targets = {(p["device_id"], p.get("instance_id")) for p in self.pushes()}
        self.assertEqual(targets, {("dev-cloud", "inst-cloud")})

    def test_users_first_copy_is_not_seeded(self):
        self.report(OWNER, "dev-home", "inst-home")
        self.assertEqual(self.pushes(), [])

    def test_new_copy_is_not_seeded_from_another_user(self):
        self.setup_owner_and_jenn()
        self.report(JENN, "dev-jenn", "inst-jenn", title="on")
        self.bus.fired.clear()
        self.report(OWNER, "dev-new", "inst-new", title="off")
        self.assertEqual(self.pushes(), [])

    def test_theme_reaches_the_owners_other_copy_only(self):
        self.setup_owner_and_jenn()
        self.report(OWNER, "dev-home", "inst-home", theme="liquidglassdark")
        self.assertEqual(self.pushes(), [{"device_id": "dev-cloud", "seq": 1, "settings": {THEME: "liquidglassdark"}}])
        self.assertEqual(self.devices["dev-cloud"]["settings"][THEME], "liquidglassdark")
        self.assertEqual(self.devices["dev-jenn"]["pending_seq"], 0)

    def test_theme_values_round_trip(self):
        self.setup_owner_and_jenn()
        for theme in ("__default__", "ha:Dark", ""):
            self.report(OWNER, "dev-home", "inst-home", theme=theme, applied=0)
            self.assertEqual(self.devices["dev-cloud"]["settings"][THEME], theme)
            self.assertEqual(self.devices["dev-cloud"]["pending_settings"], {THEME: theme})

    def test_theme_report_before_applying_does_not_bounce(self):
        self.setup_owner_and_jenn()
        self.report(OWNER, "dev-home", "inst-home", theme="liquidglassdark")
        self.bus.fired.clear()
        self.report(OWNER, "dev-cloud", "inst-cloud", theme="", applied=0)
        self.report(OWNER, "dev-cloud", "inst-cloud", theme="liquidglassdark", applied=1)
        self.assertEqual(self.pushes(), [])

    def test_first_theme_report_after_the_update_is_not_a_change(self):
        # Records from before this field existed hold no theme at all.
        self.setup_owner_and_jenn()
        for dev in ("dev-home", "dev-cloud"):
            self.devices[dev]["settings"].pop(THEME)
        self.report(OWNER, "dev-home", "inst-home", theme="liquidglassdark")
        self.assertEqual(self.pushes(), [])

    def test_new_copy_is_seeded_with_the_theme(self):
        self.setup_owner_and_jenn()
        self.report(OWNER, "dev-home", "inst-home", name="Will", theme="liquidglassdark")
        self.bus.fired.clear()
        self.report(OWNER, "dev-new", "inst-new")
        self.assertIn({"device_id": "dev-new", "seq": 1, "settings": {THEME: "liquidglassdark"}}, self.pushes())
        self.assertEqual(self.devices["dev-new"]["settings"][NAME], "")

    def test_bad_theme_value_is_rejected(self):
        connection = _Connection(OWNER)
        msg = {"id": 1, "device_id": "dev-x", "settings": {THEME: 5}}
        asyncio.run(ws.ws_report(self.hass, connection, msg))
        self.assertEqual(connection.errors, ["invalid_format"])
        connection = _Connection(OWNER)
        asyncio.run(ws.ws_report(self.hass, connection, {"id": 1, "device_id": "dev-x", "settings": {THEME: "x" * 101}}))
        self.assertEqual(connection.errors, ["invalid_format"])

    def test_device_name_never_sent(self):
        self.setup_owner_and_jenn()
        self.report(OWNER, "dev-home", "inst-home", name="Will")
        self.assertEqual(self.pushes(), [])
        self.assertEqual(self.devices["dev-cloud"]["settings"][NAME], "")


class StartView(unittest.TestCase):
    """House fork: the per-copy Start view (Clover Tablet loop, 2026-10-29).
    An admin push to one copy's instance accepts household/week/month and
    rejects anything else; a report carrying it is accepted."""

    def setUp(self):
        self.entry_data = {"device_settings": {"devices": {}, "presets": {}}, "device_settings_store": _Store()}
        self.bus = _Bus()
        self.hass = types.SimpleNamespace(bus=self.bus)
        ws._get_entry_data = lambda hass: self.entry_data

    def push(self, settings, instance_id="inst-tablet"):
        connection = _Connection(OWNER)
        connection.user.is_admin = True
        msg = {"id": 1, "type": "family_hub/device_settings/push", "device_id": "dev-tablet", "settings": settings}
        if instance_id:
            msg["instance_id"] = instance_id
        asyncio.run(ws.ws_push(self.hass, connection, msg))
        return connection

    def test_field_is_instance_scoped_like_title_only(self):
        field = ws.INSTANCE_SCOPED_SETTINGS_FIELDS[START]
        self.assertEqual(field, {"type": "enum", "choices": ["household", "week", "month"], "default": "household", "label": "Start view", "scope": "instance"})
        self.assertNotIn(START, ws.DEVICE_SCOPED_SETTINGS_FIELDS)

    def test_push_accepts_each_choice(self):
        for value in ("week", "month", "household"):
            connection = self.push({START: value})
            self.assertEqual(connection.errors, [], value)
            instance = self.entry_data["device_settings"]["devices"]["dev-tablet"]["instances"]["inst-tablet"]
            self.assertEqual(instance["pending_settings"], {START: value})
            self.assertEqual(instance["settings"][START], value)
        fired = [data for event_type, data in self.bus.fired if event_type == EVENT_PUSH]
        self.assertEqual(fired[0], {"device_id": "dev-tablet", "instance_id": "inst-tablet", "seq": 1, "settings": {START: "week"}})

    def test_push_rejects_other_values(self):
        for value in ("day", "planner", "split", "Week", "", None, 1):
            connection = self.push({START: value})
            self.assertEqual(connection.errors, ["invalid_format"], repr(value))
        self.assertEqual(self.bus.fired, [])

    def test_push_without_an_instance_is_rejected(self):
        # Instance-scoped: a device-level push can't carry it.
        self.assertEqual(self.push({START: "week"}, instance_id=None).errors, ["invalid_format"])

    def test_report_carrying_it_is_accepted(self):
        connection = _Connection(OWNER)
        msg = {
            "id": 1, "device_id": "dev-tablet", "settings": {NAME: "", THEME: ""}, "instance_id": "inst-tablet",
            "instance_settings": {**view(), START: "week"}, "instance_label": "family-hub", "applied_seq": 0, "instance_applied_seq": 0,
        }
        asyncio.run(ws.ws_report(self.hass, connection, msg))
        self.assertEqual(connection.errors, [])
        self.assertEqual(self.entry_data["device_settings"]["devices"]["dev-tablet"]["instances"]["inst-tablet"]["settings"][START], "week")


if __name__ == "__main__":
    unittest.main()
