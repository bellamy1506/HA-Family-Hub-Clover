"""Prototype (lab only, not shipped): change, delete and move one event on a
Google calendar, given the uid and recurrence_id Home Assistant's Google
entity reports for it. Sized like the module the house would keep. For
docs/research/google-editing.md (2026-11-01).

request: async (method, path, params=None, json=None, headers=None)
-> (status, body). In Home Assistant it wraps OAuth2Session.async_request
(homeassistant/helpers/config_entry_oauth2_flow.py) on
https://www.googleapis.com/calendar/v3/, built from the Google entry with
async_get_config_entry_implementation, so the sign-in is Home Assistant's.
"""
from __future__ import annotations

import copy
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta, timezone
from urllib.parse import quote
from zoneinfo import ZoneInfo

import icalendar

QUIET = {"sendUpdates": "none"}  # never mail anyone; the board refuses events with guests anyway
TEXT = ("summary", "description", "location")
DAYS = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"]


class NotEditable(Exception):
    """The board must not change this one; it says where to change it."""


class Conflict(Exception):
    """Changed elsewhere since the board read it (412): re-read, say so."""


class GoogleError(Exception):
    pass


def parse_rid(rid):
    """Home Assistant's recurrence_id for Google is the instance id:
    <series id>_20261103T140000Z, or <series id>_20261103 all day
    (gcal_sync 9.2.0, model.py, SyntheticEventId)."""
    series_id, _, stamp = rid.rpartition("_")
    if len(stamp) == 8:
        return series_id, datetime.strptime(stamp, "%Y%m%d").date()
    return series_id, datetime.strptime(stamp, "%Y%m%dT%H%M%SZ").replace(tzinfo=timezone.utc)


def value(when):
    if when.get("date"):
        return date.fromisoformat(when["date"])
    dt = datetime.fromisoformat(when["dateTime"])
    return dt.astimezone(ZoneInfo(when["timeZone"])) if when.get("timeZone") else dt


def _when(v, tz, was=None):
    out = {"dateTime": v.isoformat(), "timeZone": tz} if isinstance(v, datetime) else {"date": v.isoformat()}
    if was is not None and isinstance(value(was), datetime) != isinstance(v, datetime):
        out.update({"date": None} if isinstance(v, datetime) else {"dateTime": None, "timeZone": None})
    return out


def check(ev):
    """Refuse what Jenn didn't make herself, as the iCloud path refuses
    invitations: Google would mail guests about a change (sendUpdates)."""
    if ev.get("eventType", "default") != "default" or ev.get("locked"):
        raise NotEditable("not an ordinary event")
    if not (ev.get("organizer") or {}).get("self"):
        raise NotEditable("an invitation")
    if any(not a.get("self") for a in ev.get("attendees") or []):
        raise NotEditable("has guests")


@dataclass
class Undo:
    steps: list = field(default_factory=list)  # (event id, body, etag or None for "read it fresh")


class GoogleWriter:
    def __init__(self, request, calendar_id, default_tz="America/New_York"):
        self._request = request
        self.cal = calendar_id
        self.tz = default_tz

    async def call(self, method, path, *, params=None, body=None, etag=None, ok=(200, 204)):
        status, data = await self._request(
            method, f"calendars/{quote(self.cal, safe='')}/{path}", params=params, json=body,
            headers={"If-Match": etag} if etag else None)
        if status == 412:
            raise Conflict(path)
        if status not in ok:
            raise GoogleError(status, data)
        return data

    async def items(self, uid, deleted=False):
        """Every copy Google holds under this iCalUID: the series or one-off,
        its exceptions, and (deleted=True) tombstones. A live lookup, never
        gcal_sync's local store (see the note on its delete)."""
        data = await self.call("GET", "events", params={"iCalUID": uid, "showDeleted": str(deleted).lower()})
        return data.get("items", [])

    async def instance(self, series_id, orig):
        when = orig.isoformat() if isinstance(orig, date) and not isinstance(orig, datetime) else \
            orig.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")
        data = await self.call("GET", f"events/{series_id}/instances", params={"originalStart": when})
        if not data.get("items"):
            raise GoogleError(404, "no such occurrence")
        return data["items"][0]

    async def find(self, uid, rid=None, scope="this"):
        everything = await self.items(uid, deleted=True)
        live = [i for i in everything if i.get("status") != "cancelled"]
        series = next((i for i in live if i.get("recurrence")), None)
        single = next((i for i in live if not i.get("recurrence") and not i.get("recurringEventId")), None)
        if series is None:
            if single is None:
                raise GoogleError(404, "not on this calendar")
            check(single)
            return None, single, []
        check(series)
        exceptions = [i for i in everything if i.get("recurringEventId") == series["id"]]
        for e in exceptions:
            if e.get("status") != "cancelled":
                check(e)
        if rid is None:
            if scope != "all":
                raise NotEditable("which occurrence?")
            return series, series, exceptions
        series_id, orig = parse_rid(rid)
        if series_id != series["id"]:
            raise GoogleError(404, "occurrence of another series")
        return series, await self.instance(series_id, orig), exceptions

    def _tz(self, *evs):
        for ev in evs:
            if ev and ev["start"].get("timeZone"):
                return ev["start"]["timeZone"]
        return self.tz

    def _body(self, fields, target, tz):
        body = {k: fields[k] or "" for k in TEXT if k in fields}
        if "dtstart" in fields:
            body["start"] = _when(fields["dtstart"], tz, target["start"])
            body["end"] = _when(fields["dtend"], tz, target["end"])
        return body

    async def _patch(self, ev, body, undo):
        old = {k: copy.deepcopy(ev.get(k)) for k in body}
        for k in ("start", "end"):
            if k in body and old[k]:
                old[k] = _when(value(old[k]), old[k].get("timeZone") or self.tz, body[k])
        new = await self.call("PATCH", f"events/{ev['id']}", params=QUIET, body=body, etag=ev["etag"])
        undo.steps.insert(0, (ev["id"], old, new.get("etag")))
        return new

    async def update(self, uid, fields, recurrence_id=None, scope="this"):
        """fields as Home Assistant hands them to async_update_event:
        summary/description/location, and dtstart+dtend together (date or
        aware datetime). 'this' makes an exception; 'all' changes the series
        by however far this occurrence moved."""
        series, target, exceptions = await self.find(uid, recurrence_id, scope)
        undo = Undo()
        tz = self._tz(target, series)
        if series is None or scope == "this":
            await self._patch(target, self._body(fields, target, tz), undo)
            return undo
        body = {k: fields[k] or "" for k in TEXT if k in fields}
        if "dtstart" in fields:
            if exceptions:
                raise NotEditable("change the time of all in Google Calendar")  # see the note, section 3
            moved = fields["dtstart"] - value(target["start"])
            start = value(series["start"]) + moved
            body["start"] = _when(start, tz, series["start"])
            body["end"] = _when(start + (fields["dtend"] - fields["dtstart"]), tz, series["end"])
            old = value(series["start"])
            days = (_day(start) - _day(old)).days
            if days % 7:
                body["recurrence"] = shift_weekdays(series["recurrence"], days)
        await self._patch(series, body, undo)
        text = {k: v for k, v in body.items() if k in TEXT}
        for e in exceptions:  # "All" means all: moved occurrences get the new text too
            if text and e.get("status") != "cancelled":
                await self._patch(e, text, undo)
        return undo

    async def delete(self, uid, recurrence_id=None, scope="this"):
        series, target, exceptions = await self.find(uid, recurrence_id, scope)
        undo = Undo()
        if series is not None and scope == "this":
            await self._patch(target, {"status": "cancelled"}, undo)  # as gcal_sync does
            return undo
        await self.call("DELETE", f"events/{target['id']}", params=QUIET, etag=target["etag"])
        undo.steps.append((target["id"], {"status": "confirmed"}, None))  # Google keeps a restorable tombstone
        for e in exceptions:
            if e.get("status") != "cancelled":
                undo.steps.append((e["id"], {"status": "confirmed"}, None))
        return undo

    async def undo(self, undo):
        for eid, body, etag in undo.steps:
            if etag is None:
                etag = (await self.call("GET", f"events/{eid}"))["etag"]
            await self.call("PATCH", f"events/{eid}", params=QUIET, body=body, etag=etag)

    # ---- the Whose row: Google <-> CalDAV, keeping the uid ---------------
    async def occurrences(self, uid, start, end):
        out = set()
        for ev in await self.items(uid):
            if ev.get("recurrence"):
                data = await self.call("GET", f"events/{ev['id']}/instances", params={
                    "timeMin": start.isoformat(), "timeMax": end.isoformat()})
                out |= {(_norm(value(i["start"])), i.get("summary", "")) for i in data.get("items", [])}
            elif not ev.get("recurringEventId"):
                out.add((_norm(value(ev["start"])), ev.get("summary", "")))
        return {o for o in out if _in(o[0], start, end)}

    async def to_caldav(self, uid, caldav_calendar, start, end):
        """Jenn -> Will or Us. Write the copy first, check it, then delete
        Google's; any failure leaves exactly one copy."""
        series, master, exceptions = await self.find(uid, None, "all")
        for ev in [master] + exceptions:
            if ev.get("conferenceData") or ev.get("attachments"):
                raise NotEditable("has a call link or files; move it in Google Calendar")
        before = await self.occurrences(uid, start, end)
        if caldav_find(caldav_calendar, uid, start, end):
            raise NotEditable("already there")
        obj = caldav_calendar.save_event(google_to_ical(master, exceptions, self.tz))
        try:
            if caldav_occurrences(caldav_calendar, uid, start, end) != before:
                raise GoogleError(0, "the copy doesn't match")
            await self.call("DELETE", f"events/{master['id']}", params=QUIET, etag=master["etag"])
        except Exception:
            obj.delete()
            raise
        undo = Undo([(master["id"], {"status": "confirmed"}, None)] + [
            (e["id"], {"status": "confirmed"}, None) for e in exceptions if e.get("status") != "cancelled"])
        return undo, obj

    async def from_caldav(self, obj, start, end):
        """Will or Us -> Jenn. Same order: Google's copy first, under the
        same iCalUID, then delete the CalDAV object."""
        text = obj.data
        body, exceptions = ical_to_google(text, self.tz)
        uid = body["iCalUID"]
        before = caldav_occurrences(obj.parent, uid, start, end)
        old = await self.items(uid, deleted=True)
        if any(i.get("status") != "cancelled" for i in old):
            raise NotEditable("already there")
        tomb = next((i for i in old if not i.get("recurringEventId")), None)
        if tomb:  # this uid was on Google before: bring that event back
            new = await self.call("PATCH", f"events/{tomb['id']}", params=QUIET, etag=tomb["etag"],
                                  body={**{k: v for k, v in body.items() if k != "iCalUID"}, "status": "confirmed"})
        else:
            new = await self.call("POST", "events", params=QUIET, body=body)
        try:
            for orig, fields in exceptions:
                inst = await self.instance(new["id"], orig)
                await self.call("PATCH", f"events/{inst['id']}", params=QUIET, body=fields, etag=inst["etag"])
            if await self.occurrences(uid, start, end) != before:
                raise GoogleError(0, "the copy doesn't match")
            obj.delete()
        except Exception:
            await self.call("DELETE", f"events/{new['id']}", params=QUIET)
            raise
        return text, new


# ---- helpers ---------------------------------------------------------------
def _day(v):
    return v.date() if isinstance(v, datetime) else v


def _norm(v):
    return v.astimezone(timezone.utc) if isinstance(v, datetime) else v


def _in(v, start, end):
    if isinstance(v, datetime):
        return start <= v < end
    return start.date() <= v < end.date()


def shift_weekdays(recurrence, days):
    out = []
    for line in recurrence:
        if line.startswith("RRULE:") and "BYDAY=" in line:
            parts = dict(p.split("=", 1) for p in line[6:].split(";"))
            if parts.get("FREQ") != "WEEKLY" or any(d not in DAYS for d in parts["BYDAY"].split(",")):
                raise NotEditable("change the day of all in Google Calendar")
            parts["BYDAY"] = ",".join(DAYS[(DAYS.index(d) + days) % 7] for d in parts["BYDAY"].split(","))
            line = "RRULE:" + ";".join(f"{k}={v}" for k, v in parts.items())
        out.append(line)
    return out


def caldav_find(calendar, uid, start, end):
    return [o for o in calendar.search(start=start, end=end, event=True, expand=False)
            if any(c.get("uid") == uid for c in o.icalendar_instance.walk("VEVENT"))]


def caldav_occurrences(calendar, uid, start, end):
    out = set()
    for o in calendar.search(start=start, end=end, event=True, expand=True):
        for c in o.icalendar_instance.walk("VEVENT"):
            if c.get("uid") == uid:
                out.add((_norm(c["DTSTART"].dt), str(c.get("SUMMARY", ""))))
    return {o for o in out if _in(o[0], start, end)}


def _exdate(comp, v):
    # icalendar 6.3.1 leaves VALUE=DATE off a date EXDATE (the iCloud lab's lesson 1)
    comp.add("EXDATE", v, parameters=None if isinstance(v, datetime) else {"VALUE": "DATE"})


def _local(v, tz):
    if isinstance(v, datetime) and not hasattr(v.tzinfo, "key"):
        return v.astimezone(ZoneInfo(tz))  # a bare offset: write it in a named zone
    return v


def _vevent(ev, uid, tz):
    c = icalendar.Event()
    c.add("UID", uid)
    c.add("DTSTAMP", datetime.now(timezone.utc))
    c.add("SUMMARY", ev.get("summary", ""))
    for key in ("description", "location"):
        if ev.get(key):
            c.add(key.upper(), ev[key])
    c.add("DTSTART", _local(value(ev["start"]), tz))
    c.add("DTEND", _local(value(ev["end"]), tz))
    c.add("TRANSP", "TRANSPARENT" if ev.get("transparency") == "transparent" else "OPAQUE")
    for r in (ev.get("reminders") or {}).get("overrides", []):
        if r.get("method") == "popup":
            alarm = icalendar.Alarm()
            alarm.add("ACTION", "DISPLAY")
            alarm.add("DESCRIPTION", "Reminder")
            alarm.add("TRIGGER", timedelta(minutes=-r["minutes"]))
            c.add_component(alarm)
    return c


def google_to_ical(master, exceptions, tz):
    cal = icalendar.Calendar()
    cal.add("PRODID", "-//House board//Family Hub//EN")
    cal.add("VERSION", "2.0")
    uid = master["iCalUID"]
    main = _vevent(master, uid, tz)
    for line in master.get("recurrence", []):
        if line.startswith("RRULE:"):
            main.add("RRULE", icalendar.vRecur.from_ical(line[6:]))
        else:
            prop = icalendar.Event.from_ical(f"BEGIN:VEVENT\r\n{line}\r\nEND:VEVENT\r\n")
            for key in ("EXDATE", "RDATE"):
                for p in ([prop[key]] if key in prop and not isinstance(prop[key], list) else prop.get(key, [])):
                    for d in p.dts:
                        _exdate(main, d.dt) if key == "EXDATE" else main.add("RDATE", d.dt)
    cal.add_component(main)
    for e in exceptions:
        orig = _local(value(e["originalStartTime"]), tz)
        if e.get("status") == "cancelled":
            _exdate(main, orig)
            continue
        c = _vevent({**master, **{k: v for k, v in e.items() if k != "recurrence"}}, uid, tz)
        c.add("RECURRENCE-ID", orig)
        cal.add_component(c)
    cal.add_missing_timezones()
    return cal.to_ical().decode()


def _gwhen(v, tz):
    if isinstance(v, datetime):
        name = getattr(v.tzinfo, "key", None) or ("UTC" if v.utcoffset() == timedelta(0) else tz)
        if v.tzinfo is None:
            v = v.replace(tzinfo=ZoneInfo(tz))
        return {"dateTime": v.isoformat(), "timeZone": name}
    return {"date": v.isoformat()}


def _gfields(c, tz):
    body = {"summary": str(c.get("SUMMARY", ""))}
    for key in ("description", "location"):
        if c.get(key):
            body[key] = str(c[key])
    s = c["DTSTART"].dt
    e = c["DTEND"].dt if "DTEND" in c else s + c["DURATION"].dt
    body["start"], body["end"] = _gwhen(s, tz), _gwhen(e, tz)
    popups = [int(-a["TRIGGER"].dt.total_seconds() // 60) for a in c.walk("VALARM")
              if isinstance(a["TRIGGER"].dt, timedelta) and a["TRIGGER"].dt <= timedelta(0)]
    body["reminders"] = {"useDefault": False, "overrides": [{"method": "popup", "minutes": m} for m in popups[:5]]} \
        if popups else {"useDefault": True}
    body["transparency"] = "opaque"  # Home Assistant hides "free" Google events; the board must not lose it
    return body


def _gline(name, v, tz):
    if isinstance(v, datetime):
        z = getattr(v.tzinfo, "key", tz)
        return f"{name};TZID={z}:{v:%Y%m%dT%H%M%S}"
    return f"{name};VALUE=DATE:{v:%Y%m%d}"


def ical_to_google(text, tz):
    cal = icalendar.Calendar.from_ical(text)
    events = list(cal.walk("VEVENT"))
    if any(c.get("ATTENDEE") for c in events):
        raise NotEditable("an invitation")
    master = next(c for c in events if "RECURRENCE-ID" not in c)
    body = {"iCalUID": str(master["UID"]), **_gfields(master, tz)}
    rec = []
    if master.get("RRULE"):
        rec.append("RRULE:" + master["RRULE"].to_ical().decode())
    for key in ("EXDATE", "RDATE"):
        props = master.get(key, [])
        for p in props if isinstance(props, list) else [props]:
            rec += [_gline(key, d.dt, tz) for d in p.dts]
    if rec:
        body["recurrence"] = rec
    exceptions = [(c["RECURRENCE-ID"].dt, {k: v for k, v in _gfields(c, tz).items() if k != "transparency"})
                  for c in events if "RECURRENCE-ID" in c]
    return body, exceptions
