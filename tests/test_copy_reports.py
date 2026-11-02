"""House fork tests for each copy's reports (#111, #115): copy_reports.py
(what's kept) and its wiring, copy_reports_websocket_api.py and
diagnostics.py (how a board sends one and how a session reads them).

Run: python3 -m unittest discover -s tests   (no dependencies)

copy_reports.py loads on its own; for the wiring, the few Home Assistant
names it uses are stubbed, as in test_calendar_cache.py.
"""
import asyncio
import datetime as dtm
import importlib.util
import pathlib
import sys
import types
import unittest

_PKG_DIR = pathlib.Path(__file__).resolve().parents[1] / "custom_components" / "family_hub"
_PKG = "family_hub_copy_reports_under_test"
NOW = [dtm.datetime(2026, 11, 1, 20, 15, 3, 250000, tzinfo=dtm.timezone(dtm.timedelta(hours=-5)))]


def _module(name, **attrs):
    module = types.ModuleType(name)
    module.__dict__.update(attrs)
    sys.modules[name] = module
    return module


def _load(name):
    spec = importlib.util.spec_from_file_location(f"{_PKG}.{name}", _PKG_DIR / f"{name}.py")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    setattr(sys.modules[_PKG], name, module)
    return module


class _Store:
    stored = None

    def __init__(self, hass, version, key):
        self.key, self.saves = key, []

    async def async_load(self):
        return _Store.stored

    def async_delay_save(self, data_func, delay):
        self.saves.append((data_func, delay))


def _load_modules():
    noop = lambda *args, **kwargs: None  # noqa: E731
    _module("voluptuous", Required=lambda key, **kw: key, Optional=lambda key, **kw: key, Any=noop, All=noop, Coerce=noop, Range=noop, Length=noop)
    _module("homeassistant")
    _module("homeassistant.components")
    _module(
        "homeassistant.components.websocket_api",
        websocket_command=lambda schema: (lambda fn: fn),
        async_register_command=lambda hass, handler: hass.commands.append(handler),
        ActiveConnection=object,
    )
    sys.modules["homeassistant.components"].websocket_api = sys.modules["homeassistant.components.websocket_api"]
    _module("homeassistant.core", HomeAssistant=object, callback=lambda fn: fn)
    _module("homeassistant.helpers")
    _module("homeassistant.helpers.storage", Store=_Store)
    dt = _module("homeassistant.util.dt", now=lambda: NOW[0])
    _module("homeassistant.util", dt=dt)
    package = _module(_PKG)
    package.__path__ = [str(_PKG_DIR)]
    _module(f"{_PKG}.const", DOMAIN="family_hub")
    return _load("copy_reports"), _load("copy_reports_websocket_api"), _load("diagnostics")


reports_mod, ws, diagnostics = _load_modules()
WHEN = "2026-11-01T20:15:03-05:00"


def report(copy="a1", label="home, iPhone", **fields):
    return {"id": 7, "type": "family_hub/copy_report", "copy": copy, "label": label, **fields}


class Record(unittest.TestCase):
    def setUp(self):
        self.reports = {}

    def record(self, msg, user="Jenn", now=WHEN):
        reports_mod.record(self.reports, msg, user, now)

    def test_each_copy_is_kept_with_who_where_and_when(self):
        self.record(report(open=[1180, 2410]))
        self.assertEqual(self.reports, {"a1": {"opens": [[WHEN, 1180, 2410]], "error": None, "user": "Jenn", "label": "home, iPhone", "seen": WHEN}})

    def test_its_last_five_opens_newest_first(self):
        for second in range(7):
            self.record(report(open=[1000 + second, None]), now=f"2026-11-01T20:15:0{second}-05:00")
        self.assertEqual([o[1] for o in self.reports["a1"]["opens"]], [1006, 1005, 1004, 1003, 1002])

    def test_its_last_error_cut_to_300_characters(self):
        self.record(report(error="TypeError: day is undefined"))
        self.record(report(error="x" * 400), now="2026-11-01T20:16:00-05:00")
        self.record(report(open=[900, 1500]))
        self.assertEqual(self.reports["a1"]["error"], ["2026-11-01T20:16:00-05:00", "x" * 300], "an open keeps the last error")

    def test_at_most_20_copies_and_the_one_seen_longest_ago_goes_first(self):
        for n in range(20):
            self.record(report(copy=f"c{n}"))
        self.record(report(copy="c0", error="seen again"))
        self.record(report(copy="new"))
        self.assertEqual(len(self.reports), 20)
        self.assertNotIn("c1", self.reports)
        self.assertEqual(list(self.reports)[-2:], ["c0", "new"])


class _Connection:
    def __init__(self, name):
        self.user = types.SimpleNamespace(name=name)
        self.results = []

    def send_result(self, msg_id, result=None):
        self.results.append((msg_id, result))


class Wiring(unittest.TestCase):
    def setUp(self):
        _Store.stored = {"wall": {"opens": [], "error": None, "user": "Wall", "label": "home, Android", "seen": WHEN}}
        self.hass = types.SimpleNamespace(data={"family_hub": {}}, commands=[])
        asyncio.run(ws.async_register_all(self.hass))

    def test_kept_through_restarts_in_one_store(self):
        self.assertEqual(self.hass.commands, [ws.ws_report])
        self.assertEqual(self.hass.data["family_hub"]["copy_reports_store"].key, "family_hub_copy_reports")
        self.assertEqual(list(self.hass.data["family_hub"]["copy_reports"]), ["wall"])

    def test_any_signed_in_user_reports_under_their_own_name(self):
        connection = _Connection("Jenn")
        ws.ws_report(self.hass, connection, report(open=[1180, 2410]))
        self.assertEqual(connection.results, [(7, None)])
        kept = self.hass.data["family_hub"]["copy_reports"]
        self.assertEqual(kept["a1"]["user"], "Jenn")
        self.assertEqual(kept["a1"]["opens"], [[WHEN, 1180, 2410]], "local time, to the second")
        ((data_func, delay),) = self.hass.data["family_hub"]["copy_reports_store"].saves
        self.assertEqual((data_func(), delay), (kept, 30))

    def test_family_hub_registers_it_at_start(self):
        source = (_PKG_DIR / "__init__.py").read_text()
        setup = source[source.index("async def async_setup(") : source.index("async def async_setup_entry(")]
        self.assertIn("\n    await copy_reports_ws_api.async_register_all(hass)\n", setup)
        self.assertIn("\nfrom . import copy_reports_websocket_api as copy_reports_ws_api\n", source)

    def test_a_session_reads_every_copy_in_family_hubs_diagnostics(self):
        ws.ws_report(self.hass, _Connection("Jenn"), report(error="TypeError: day is undefined"))
        got = asyncio.run(diagnostics.async_get_config_entry_diagnostics(self.hass, object()))
        self.assertEqual(list(got), ["copy_reports"])
        self.assertEqual(list(got["copy_reports"]), ["wall", "a1"])


if __name__ == "__main__":
    unittest.main()
