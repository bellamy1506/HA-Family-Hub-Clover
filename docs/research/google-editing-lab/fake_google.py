"""A stand-in for the few Google Calendar API v3 calls the house write path
and gcal_sync use, for docs/research/google-editing.md (2026-11-01). Lab
only: in memory, made-up events, never a real account.

What it copies from Google's documentation (Calendar API reference, fetched
2026-11-01): etag on every event and 412 on a stale If-Match; instances of a
repeating event addressed by an instance id, with recurringEventId and
originalStartTime; a cancelled exception hides one instance; a deleted event
stays as a "cancelled" tombstone that keeps its details and can be restored;
events.list by iCalUID, showDeleted, and sync tokens that return changes,
cancelled ones included.

What it assumes, because Google doesn't document it (the supervised check
in the note tests each one): the instance id is <series id>_<UTC start>
(gcal_sync 9.2.0 assumes the same); a synthesized instance carries the
series' etag; insert with a caller's iCalUID keeps it and makes the calendar
the organizer; an iCalUID that exists only as a tombstone blocks a new
insert (409); deleting a series cancels its exceptions; changing a series
leaves its exceptions alone; a patched `recurrence` keeps the event's id
and iCalUID; restoring a deleted event with sendUpdates mails its guests
again. `mail` records the update emails Google's help says guests who
don't use Google Calendar get ("Invite people to your Calendar event",
fetched 2026-11-01): one per guest per write sent with sendUpdates=all
or externalOnly, none with none. Switch `exceptions_first` to list a series'
exceptions before the series itself (Google promises no order).
"""
from __future__ import annotations

import copy
import itertools
from datetime import date, datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from aiohttp import web
from dateutil.rrule import rrulestr

TOKEN = "Bearer lab-token"
_ids = itertools.count(1)


def _new_id():
    return f"lab{next(_ids):05d}"  # base32hex letters and digits, as Google's ids are


def _value(when):
    if "date" in when and when["date"]:
        return date.fromisoformat(when["date"])
    dt = datetime.fromisoformat(when["dateTime"])
    if when.get("timeZone"):
        dt = dt.astimezone(ZoneInfo(when["timeZone"]))
    return dt


def _when(value, tz):
    if isinstance(value, datetime):
        return {"dateTime": value.isoformat(), "timeZone": tz}
    return {"date": value.isoformat()}


def instance_id(master_id, orig):
    if isinstance(orig, datetime):
        return f"{master_id}_{orig.astimezone(timezone.utc):%Y%m%dT%H%M%SZ}"
    return f"{master_id}_{orig:%Y%m%d}"


def _error(code, message):
    return web.json_response({"error": {"code": code, "message": message}}, status=code)


class FakeGoogle:
    def __init__(self, calendars=("jenn@example.com",)):
        self.cals = {c: {} for c in calendars}
        self.rev = 0
        self.exceptions_first = False
        self.log = []  # (method, path, query, If-Match)
        self.mail = []  # (to, METHOD, uid, sequence): what Will's inbox would get
        self.fail_next = {}  # (method, kind) -> status, to simulate a failure
        app = web.Application()
        p = "/calendar/v3/calendars/{cal}/events"
        app.router.add_get(p, self.list_events)
        app.router.add_post(p, self.insert)
        app.router.add_post(p + "/import", self.insert)
        app.router.add_get(p + "/{eid}", self.get)
        app.router.add_patch(p + "/{eid}", self.patch)
        app.router.add_delete(p + "/{eid}", self.delete)
        app.router.add_get(p + "/{eid}/instances", self.instances)
        self.app = app

    # ---- state helpers -------------------------------------------------
    def _touch(self, ev):
        self.rev += 1
        ev["etag"] = f'"{self.rev}"'
        ev["_rev"] = self.rev
        ev["sequence"] = ev.get("sequence", -1) + 1

    def add(self, cal, ev):
        """Seed an event as if made in Google Calendar (not through the API under test)."""
        ev = copy.deepcopy(ev)
        ev.setdefault("id", _new_id())
        ev.setdefault("iCalUID", ev["id"] + "@google.com")
        ev.setdefault("status", "confirmed")
        ev.setdefault("eventType", "default")
        ev.setdefault("organizer", {"email": cal, "self": True})
        self._touch(ev)
        self.cals[cal][ev["id"]] = ev
        return ev

    def _out(self, ev):
        return {k: v for k, v in ev.items() if not k.startswith("_")}

    def _occurrences(self, master):
        start = _value(master["start"])
        lines = "\n".join(master["recurrence"])
        if isinstance(start, datetime):
            return list(rrulestr(lines, dtstart=start, forceset=True))
        naive = datetime.combine(start, datetime.min.time())
        return [d.date() for d in rrulestr(lines, dtstart=naive, forceset=True)]

    def _instance(self, cal, master, orig):
        iid = instance_id(master["id"], orig)
        if iid in self.cals[cal]:
            return self.cals[cal][iid]
        tz = master["start"].get("timeZone")
        length = _value(master["end"]) - _value(master["start"])
        inst = {k: copy.deepcopy(v) for k, v in master.items() if k not in ("recurrence", "id", "_rev")}
        inst.update(id=iid, recurringEventId=master["id"], originalStartTime=_when(orig, tz),
                    start=_when(orig, tz), end=_when(orig + length, tz))
        return inst

    def _resolve(self, cal, eid):
        if eid in self.cals[cal]:
            return self.cals[cal][eid], True
        base, _, stamp = eid.rpartition("_")
        master = self.cals[cal].get(base)
        if not master or not master.get("recurrence"):
            return None, False
        for orig in self._occurrences(master):
            if instance_id(base, orig) == eid:
                return self._instance(cal, master, orig), False
        return None, False

    def _fail(self, request, kind):
        status = self.fail_next.pop((request.method, kind), None)
        return _error(status, "simulated failure") if status else None

    def _mail(self, request, ev):
        if request.query.get("sendUpdates") not in ("all", "externalOnly"):
            return
        method = "CANCEL" if ev["status"] == "cancelled" else "REQUEST"
        for a in ev.get("attendees") or []:
            if not a.get("self"):
                self.mail.append((a["email"], method, ev.get("iCalUID"), ev["sequence"]))

    def _record(self, request):
        self.log.append((request.method, request.path, dict(request.query), request.headers.get("If-Match")))
        if request.headers.get("Authorization") != TOKEN:
            return _error(401, "no token")
        return None

    # ---- endpoints ------------------------------------------------------
    async def list_events(self, request):
        if bad := self._record(request):
            return bad
        cal, q = request.match_info["cal"], request.query
        evs = list(self.cals[cal].values())
        token = q.get("syncToken")
        if token:
            evs = [e for e in evs if e["_rev"] > int(token)]
        elif q.get("showDeleted") != "true":
            live_series = {e["id"] for e in evs if e.get("recurrence") and e["status"] != "cancelled"}
            evs = [e for e in evs if e["status"] != "cancelled" or e.get("recurringEventId") in live_series]
        if "iCalUID" in q:
            evs = [e for e in evs if e.get("iCalUID") == q["iCalUID"]]
        evs.sort(key=lambda e: (bool(e.get("recurringEventId")) != self.exceptions_first, e["_rev"]))
        return web.json_response({"kind": "calendar#events", "items": [self._out(e) for e in evs],
                                  "nextSyncToken": str(self.rev)})

    async def get(self, request):
        if bad := self._record(request):
            return bad
        ev, _ = self._resolve(request.match_info["cal"], request.match_info["eid"])
        return web.json_response(self._out(ev)) if ev else _error(404, "Not Found")

    async def instances(self, request):
        if bad := self._record(request):
            return bad
        cal, q = request.match_info["cal"], request.query
        master = self.cals[cal].get(request.match_info["eid"])
        if not master or not master.get("recurrence"):
            return _error(404, "Not Found")
        items = []
        for orig in self._occurrences(master):
            inst = self._instance(cal, master, orig)
            if "originalStart" in q and _value(inst["originalStartTime"]) != _value(
                    {"date": q["originalStart"]} if len(q["originalStart"]) == 10 else {"dateTime": q["originalStart"]}):
                continue
            if inst["status"] == "cancelled" and q.get("showDeleted") != "true":
                continue
            items.append(self._out(inst))
        return web.json_response({"kind": "calendar#events", "items": items})

    async def patch(self, request):
        if bad := self._record(request) or self._fail(request, "patch"):
            return bad
        cal, eid = request.match_info["cal"], request.match_info["eid"]
        ev, stored = self._resolve(cal, eid)
        if ev is None:
            return _error(404, "Not Found")
        if request.headers.get("If-Match") not in (None, ev["etag"]):
            return _error(412, "Precondition Failed")
        body = await request.json()
        ev = ev if stored else copy.deepcopy(ev)
        for k, v in body.items():
            if k in ("id", "iCalUID", "recurringEventId", "originalStartTime"):
                continue
            ev[k] = v
        if ev.get("recurrence") and body.get("status") == "confirmed":
            for e in self.cals[cal].values():  # restoring a series brings back what its delete took
                if e.get("recurringEventId") == ev["id"] and e.pop("_with_series", False):
                    e["status"] = "confirmed"
                    self._touch(e)
        self._touch(ev)
        self.cals[cal][ev["id"]] = ev
        self._mail(request, ev)
        return web.json_response(self._out(ev))

    async def delete(self, request):
        if bad := self._record(request) or self._fail(request, "delete"):
            return bad
        cal, eid = request.match_info["cal"], request.match_info["eid"]
        ev, stored = self._resolve(cal, eid)
        if ev is None:
            return _error(404, "Not Found")
        if ev["status"] == "cancelled":
            return _error(410, "Resource has been deleted")
        if request.headers.get("If-Match") not in (None, ev["etag"]):
            return _error(412, "Precondition Failed")
        ev = ev if stored else copy.deepcopy(ev)
        ev["status"] = "cancelled"  # a tombstone that keeps its details
        self._touch(ev)
        self.cals[cal][ev["id"]] = ev
        for e in self.cals[cal].values():
            if e.get("recurringEventId") == ev["id"] and e["status"] != "cancelled":
                e["status"], e["_with_series"] = "cancelled", True
                self._touch(e)
        self._mail(request, ev)
        return web.Response(status=204)

    async def insert(self, request):
        if bad := self._record(request) or self._fail(request, "insert"):
            return bad
        cal = request.match_info["cal"]
        body = await request.json()
        if "iCalUID" in body and any(e.get("iCalUID") == body["iCalUID"] and not e.get("recurringEventId")
                                     for e in self.cals[cal].values()):
            return _error(409, "The requested identifier already exists.")
        ev = {k: v for k, v in body.items() if k not in ("id", "organizer", "etag")}
        ev["id"] = _new_id()
        ev.setdefault("iCalUID", ev["id"] + "@google.com")
        ev.update(status=ev.get("status", "confirmed"), eventType="default", organizer={"email": cal, "self": True})
        self._touch(ev)
        self.cals[cal][ev["id"]] = ev
        return web.json_response(self._out(ev))
