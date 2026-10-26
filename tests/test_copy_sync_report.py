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
NAME = "familyHubDeviceCustomNameLocal"
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

    def report(self, user_id, device_id, instance_id, title="off", name="", applied=0, instance_applied=0, label="family-hub"):
        connection = _Connection(user_id)
        msg = {
            "id": 1, "type": "family_hub/device_settings/report", "device_id": device_id,
            "settings": {NAME: name}, "device_name": "iPhone", "instance_id": instance_id,
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

    def test_users_first_copy_is_not_seeded(self):
        self.report(OWNER, "dev-home", "inst-home")
        self.assertEqual(self.pushes(), [])

    def test_new_copy_is_not_seeded_from_another_user(self):
        self.setup_owner_and_jenn()
        self.report(JENN, "dev-jenn", "inst-jenn", title="on")
        self.bus.fired.clear()
        self.report(OWNER, "dev-new", "inst-new", title="off")
        self.assertEqual(self.pushes(), [])

    def test_device_name_never_sent(self):
        self.setup_owner_and_jenn()
        self.report(OWNER, "dev-home", "inst-home", name="Will")
        self.assertEqual(self.pushes(), [])
        self.assertEqual(self.devices["dev-cloud"]["settings"][NAME], "")


if __name__ == "__main__":
    unittest.main()
