"""House fork tests for the server's copy of the board's calendar events
(calendar_cache.py and its wiring, calendar_cache_websocket_api.py).

Run: python3 -m unittest discover -s tests   (no dependencies)

The cache rules load on their own; for the wiring, the few Home Assistant
names it uses are stubbed, as in test_copy_sync_report.py.
"""
import asyncio
import dataclasses
import datetime as dtm
import enum
import importlib.util
import pathlib
import sys
import types
import unittest

_PKG_DIR = pathlib.Path(__file__).resolve().parents[1] / "custom_components" / "family_hub"
_PKG = "family_hub_calendar_cache_under_test"
TZ = dtm.timezone(dtm.timedelta(hours=-4))


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


NOW = [dtm.datetime(2026, 10, 26, 22, 0, tzinfo=TZ)]
TIMERS = []


def _load_modules():
    noop = lambda *args, **kwargs: None  # noqa: E731
    _module("voluptuous", Required=lambda key, **kw: key, Optional=lambda key, **kw: key)
    _module("homeassistant")
    _module("homeassistant.components")
    _module(
        "homeassistant.components.websocket_api",
        websocket_command=lambda schema: (lambda fn: fn),
        async_response=lambda fn: fn,
        async_register_command=noop,
        ActiveConnection=object,
    )
    sys.modules["homeassistant.components"].websocket_api = sys.modules["homeassistant.components.websocket_api"]
    _module("homeassistant.core", HomeAssistant=object, callback=lambda fn: fn)
    _module("homeassistant.helpers")
    _module("homeassistant.helpers.event", async_track_time_interval=lambda hass, action, interval: TIMERS.append((action, interval)))
    dt = _module(
        "homeassistant.util.dt",
        get_default_time_zone=lambda: TZ,
        now=lambda: NOW[0],
        start_of_local_day=lambda: NOW[0].replace(hour=0, minute=0),
        as_local=lambda value: value.astimezone(TZ),
    )
    _module("homeassistant.util", dt=dt)
    package = _module(_PKG)
    package.__path__ = [str(_PKG_DIR)]
    _module(f"{_PKG}.const", DOMAIN="family_hub")
    return _load("calendar_cache"), _load("calendar_cache_websocket_api")


cc, ws = _load_modules()


def at(day, hour=0):
    return dtm.datetime(2026, 10, day, hour, tzinfo=TZ)


def timed(day, hour, summary):
    return {"start": {"dateTime": at(day, hour).isoformat()}, "end": {"dateTime": at(day, hour + 1).isoformat()}, "summary": summary}


def all_day(first, last, summary):
    return {"start": {"date": f"2026-10-{first:02d}"}, "end": {"date": f"2026-10-{last:02d}"}, "summary": summary}


def names(events):
    return sorted(e["summary"] for e in events)


class Cache(unittest.TestCase):
    def setUp(self):
        self.cache = cc.CalendarCache(TZ)

    def test_no_copy_until_a_board_sends_one(self):
        self.assertEqual(self.cache.get(["calendar.will"], at(1), at(8)), {})
        self.assertEqual(self.cache.entities(), ["calendar.will"], "asked about, so the hourly refresh fetches it")

    def test_copy_given_only_for_a_range_it_covers(self):
        self.cache.put("calendar.will", at(1), at(15), [timed(3, 9, "dentist"), timed(12, 9, "flight")], NOW[0])
        self.assertEqual(names(self.cache.get(["calendar.will"], at(1), at(8))["calendar.will"]), ["dentist"])
        self.assertEqual(self.cache.get(["calendar.will"], at(10), at(20)), {}, "a range past the copy gets nothing")

    def test_each_calendar_separately(self):
        self.cache.put("calendar.will", at(1), at(15), [], NOW[0])
        self.assertEqual(self.cache.get(["calendar.will", "calendar.home"], at(1), at(8)), {"calendar.will": []})

    def test_a_board_check_replaces_its_range_and_widens_the_copy(self):
        self.cache.put("calendar.will", at(1), at(15), [timed(3, 9, "dentist"), timed(12, 9, "flight")], NOW[0])
        self.cache.put("calendar.will", at(10), at(20), [timed(12, 10, "flight, moved"), timed(18, 9, "trip")], NOW[0])
        events = self.cache.get(["calendar.will"], at(1), at(20))["calendar.will"]
        self.assertEqual(names(events), ["dentist", "flight, moved", "trip"], "the old flight is gone")

    def test_all_day_events_overlap_by_date(self):
        self.cache.put("calendar.will", at(1), at(31), [all_day(19, 25, "Barcelona")], NOW[0])
        self.assertEqual(names(self.cache.get(["calendar.will"], at(20), at(21))["calendar.will"]), ["Barcelona"])
        self.assertEqual(self.cache.get(["calendar.will"], at(25), at(26))["calendar.will"], [], "the end date is exclusive")

    def test_a_far_range_replaces_the_copy_only_when_it_includes_now(self):
        self.cache.put("calendar.will", at(20), at(31), [timed(27, 9, "now-ish")], NOW[0])
        far = (dtm.datetime(2027, 3, 1, tzinfo=TZ), dtm.datetime(2027, 4, 1, tzinfo=TZ))
        self.cache.put("calendar.will", *far, [], NOW[0])
        self.assertIn("calendar.will", self.cache.get(["calendar.will"], at(25), at(28)), "browsing ahead keeps the copy")
        self.cache.put("calendar.will", *far, [], far[0])
        self.assertEqual(self.cache.get(["calendar.will"], at(25), at(28)), {})

    def test_bounded(self):
        self.cache.put("calendar.will", at(1), at(8), [timed(2, 9, "x")] * (cc.MAX_EVENTS + 1), NOW[0])
        self.assertEqual(self.cache.get(["calendar.will"], at(1), at(8)), {})

    def test_times_parse(self):
        self.assertEqual(cc.parse_time("2026-10-27T04:00:00.000Z", TZ), dtm.datetime(2026, 10, 27, 4, tzinfo=dtm.timezone.utc))
        self.assertEqual(cc.parse_time("2026-10-27", TZ), at(27))
        self.assertIsNone(cc.parse_time("soon", TZ))

    def test_events_kept_in_the_calendar_api_format(self):
        class Status(enum.Enum):
            CONFIRMED = "CONFIRMED"

        @dataclasses.dataclass
        class Event:
            start: object
            end: object
            summary: str
            uid: str = None
            status: Status = None

        out = cc.api_event(Event(dtm.datetime(2026, 10, 27, 13, tzinfo=dtm.timezone.utc), dtm.date(2026, 10, 28), "x", "u1", Status.CONFIRMED), lambda v: v.astimezone(TZ))
        self.assertEqual(out, {"start": {"dateTime": "2026-10-27T09:00:00-04:00"}, "end": {"date": "2026-10-28"}, "summary": "x", "uid": "u1", "status": "CONFIRMED"})


class _Connection:
    def __init__(self):
        self.results = []

    def send_result(self, msg_id, result=None):
        self.results.append(result)


class _Calendar:
    def __init__(self, events=None, fail=False):
        self.events, self.fail, self.asked = events or [], fail, []

    async def async_get_events(self, hass, start, end):
        self.asked.append((start, end))
        if self.fail:
            raise RuntimeError("iCloud unreachable")
        return self.events


@dataclasses.dataclass
class _Event:
    start: object
    end: object
    summary: str


class Wiring(unittest.TestCase):
    def setUp(self):
        TIMERS.clear()
        self.calendars = {}
        states = {"calendar.will": object(), "calendar.home": object()}
        component = types.SimpleNamespace(get_entity=lambda entity_id: self.calendars.get(entity_id))
        self.hass = types.SimpleNamespace(data={"family_hub": {}, "calendar": component}, states=types.SimpleNamespace(get=states.get))
        ws.async_register_all(self.hass)

    def call(self, handler, **msg):
        connection = _Connection()
        handler(self.hass, connection, {"id": 1, **msg})
        return connection.results[0]

    def test_refreshes_every_hour(self):
        self.assertEqual(TIMERS[0][1], dtm.timedelta(hours=1))

    def test_a_board_sends_its_check_then_another_gets_the_copy(self):
        start, end = "2026-10-25T04:00:00.000Z", "2026-11-01T04:00:00.000Z"
        self.assertEqual(self.call(ws.ws_get, entity_ids=["calendar.will"], start=start, end=end), {"calendars": {}})
        self.call(ws.ws_put, start=start, end=end, calendars={"calendar.will": [timed(27, 9, "dentist")], "calendar.gone": [timed(27, 9, "x")], "sensor.x": []})
        got = self.call(ws.ws_get, entity_ids=["calendar.will", "calendar.gone", "sensor.x"], start=start, end=end)
        self.assertEqual(list(got["calendars"]), ["calendar.will"], "only calendars Home Assistant has")
        self.assertEqual(names(got["calendars"]["calendar.will"]), ["dentist"])

    def test_bad_range_gets_nothing(self):
        self.assertEqual(self.call(ws.ws_get, entity_ids=["calendar.will"], start="soon", end="later"), {"calendars": {}})

    def test_hourly_refresh_fetches_the_window_for_every_calendar_asked_about(self):
        self.calendars["calendar.will"] = _Calendar([_Event(dtm.datetime(2026, 10, 27, 13, tzinfo=dtm.timezone.utc), dtm.datetime(2026, 10, 27, 14, tzinfo=dtm.timezone.utc), "dentist")])
        self.calendars["calendar.home"] = _Calendar(fail=True)
        self.call(ws.ws_put, start="2026-10-25T04:00:00Z", end="2026-11-01T04:00:00Z", calendars={"calendar.home": [timed(27, 19, "trash night")]})
        self.call(ws.ws_get, entity_ids=["calendar.will", "calendar.home"], start="2026-10-25T04:00:00Z", end="2026-11-01T04:00:00Z")
        asyncio.run(ws.async_refresh(self.hass))
        start, end = self.calendars["calendar.will"].asked[0]
        self.assertEqual((start, end - start), (NOW[0].replace(hour=0) - ws.WINDOW_BEFORE, ws.WINDOW_BEFORE + ws.WINDOW_AFTER))
        got = self.call(ws.ws_get, entity_ids=["calendar.will", "calendar.home"], start="2026-10-25T04:00:00Z", end="2026-11-01T04:00:00Z")["calendars"]
        self.assertEqual(got["calendar.will"], [{"start": {"dateTime": "2026-10-27T09:00:00-04:00"}, "end": {"dateTime": "2026-10-27T10:00:00-04:00"}, "summary": "dentist"}])
        self.assertEqual(names(got["calendar.home"]), ["trash night"], "a failed refresh keeps the old copy")


if __name__ == "__main__":
    unittest.main()
