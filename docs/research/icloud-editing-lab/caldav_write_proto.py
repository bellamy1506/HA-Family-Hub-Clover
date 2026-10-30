"""Prototype (lab only, not shipped): change and delete one event on a CalDAV
calendar, given the uid and recurrence_id Home Assistant's CalDAV entity
reports for it. Sized like the module the house would keep.

calendar: a caldav Calendar (in Home Assistant, entity.coordinator.calendar).
"""
from __future__ import annotations

import copy
from datetime import date, datetime, timedelta

import icalendar
from caldav.lib import error


class NotEditable(Exception):
    """The board must not change this one, or wasn't told which part."""


def parse_rid(rid):
    """Home Assistant writes str() of the value: '2026-11-03' or
    '2026-11-03 09:00:00-05:00'."""
    if not rid:
        return None
    if len(rid) == 10:
        return date.fromisoformat(rid)
    return datetime.fromisoformat(rid)


def _same(a, b):
    if isinstance(a, datetime) and isinstance(b, datetime):
        if a.tzinfo is None or b.tzinfo is None:
            return a.replace(tzinfo=None) == b.replace(tzinfo=None)
        return a == b
    da = a.date() if isinstance(a, datetime) else a
    db = b.date() if isinstance(b, datetime) else b
    return da == db


def _like(value, model):
    """value in the same form as model (date, floating, or model's zone), as
    RFC 5545 asks of EXDATE and RECURRENCE-ID."""
    if not isinstance(model, datetime):
        return value.date() if isinstance(value, datetime) else value
    if not isinstance(value, datetime):
        value = datetime.combine(value, model.time(), model.tzinfo)
    if model.tzinfo is None:
        return value.replace(tzinfo=None)
    return value.astimezone(model.tzinfo)


def find(calendar, uid, near):
    """The calendar object holding uid, freshly read with its ETag. A
    time-range search, as Home Assistant's own reads use: iCloud answers a
    UID-only search with 412."""
    if not isinstance(near, datetime):
        near = datetime.combine(near, datetime.min.time())
    for obj in calendar.search(start=near - timedelta(days=1), end=near + timedelta(days=2), event=True, expand=False):
        if any(c.get("uid") == uid for c in obj.icalendar_instance.walk("VEVENT")):
            return calendar.event_by_url(obj.url)
    raise error.NotFoundError(uid)


def _parts(obj):
    cal = obj.icalendar_instance
    events = [c for c in cal.subcomponents if isinstance(c, icalendar.Event)]
    master = next((c for c in events if "RECURRENCE-ID" not in c), None)
    if any(c.get("attendee") for c in events):
        raise NotEditable("invitation")
    return cal, events, master


def _override(cal, events, master, when):
    for c in events:
        if "RECURRENCE-ID" in c and _same(c["RECURRENCE-ID"].dt, when):
            return c
    new = copy.deepcopy(master)  # keeps alarms, notes, Apple's own fields
    start = master["DTSTART"].dt
    length = master["DTEND"].dt - start if "DTEND" in master else master["DURATION"].dt
    for key in ("RRULE", "RDATE", "EXDATE", "DTSTART", "DTEND", "DURATION"):
        new.pop(key, None)
    rid = _like(when, start)
    new.add("RECURRENCE-ID", rid)
    new.add("DTSTART", rid)
    new.add("DTEND", rid + length)
    cal.add_component(new)
    return new


def _exdate(master, value):
    # icalendar 6.3 leaves VALUE=DATE off a date EXDATE; servers then read it
    # as a broken date-time and refuse the whole event.
    master.add("EXDATE", value, parameters=None if isinstance(value, datetime) else {"VALUE": "DATE"})


def _set(comp, key, value):
    comp.pop(key, None)
    if value is not None:
        comp.add(key, value)


def _apply(comp, fields):
    for key in ("summary", "description", "location"):
        if key in fields:
            _set(comp, key.upper(), fields[key] or None)
    if "dtstart" in fields:
        comp.pop("DURATION", None)
        _set(comp, "DTSTART", fields["dtstart"])
        _set(comp, "DTEND", fields["dtend"])


def _recurring(master):
    return master is not None and bool(master.get("RRULE") or master.get("RDATE"))


def delete(calendar, uid, start, recurrence_id=None, scope="this"):
    """start: where the board shows the event now (a moved occurrence is no
    longer near its recurrence_id). A repeating event needs its
    recurrence_id for 'this', or scope 'all' for the whole series."""
    when = parse_rid(recurrence_id)
    obj = find(calendar, uid, start)
    cal, events, master = _parts(obj)
    if not _recurring(master) or scope == "all":
        obj.delete()
        return
    if when is None:
        raise NotEditable("which occurrence?")
    for c in events:
        if "RECURRENCE-ID" in c and _same(c["RECURRENCE-ID"].dt, when):
            cal.subcomponents.remove(c)
    _exdate(master, _like(when, master["DTSTART"].dt))
    obj.save(only_this_recurrence=False)


def update(calendar, uid, start, fields, recurrence_id=None, scope="this"):
    """fields: summary/description/location, and dtstart+dtend together.
    scope 'this' changes one occurrence; 'all' changes the series, moving it
    by however far this occurrence moved."""
    when = parse_rid(recurrence_id)
    obj = find(calendar, uid, start)
    cal, events, master = _parts(obj)
    if not _recurring(master):
        _apply(master or events[0], fields)
    elif when is None:
        raise NotEditable("which occurrence?")
    elif scope == "this":
        _apply(_override(cal, events, master, when), fields)
    else:
        text = {k: v for k, v in fields.items() if k not in ("dtstart", "dtend")}
        _apply(master, text)
        if "dtstart" in fields:
            moved = fields["dtstart"] - _like(when, fields["dtstart"])
            length = fields["dtend"] - fields["dtstart"]
            new_start = master["DTSTART"].dt + moved
            _apply(master, {"dtstart": new_start, "dtend": new_start + length})
            for c in events:
                if "RECURRENCE-ID" in c:
                    _set(c, "RECURRENCE-ID", c["RECURRENCE-ID"].dt + moved)
            if master.get("EXDATE"):
                old = master.pop("EXDATE")
                for line in old if isinstance(old, list) else [old]:
                    for d in line.dts:
                        _exdate(master, d.dt + moved)
    obj.save(only_this_recurrence=False)
