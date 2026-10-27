"""House fork: the board's calendar events, kept ready so a board opens with
text right away (owner, 2026-10-26).

Home Assistant's CalDAV calendars ask iCloud live on every request, about
0.1 s per event, so the column with the most events held every board's text
back about 3 s on each open. This keeps one copy per calendar in memory
(never on disk): Home Assistant refreshes it every hour, and each board
sends back what its own live check found, so the copy is as fresh as the
last board to look. A board shows the copy only when it covers the whole
range asked for, then replaces it with live data as each calendar answers.

Events are kept exactly as Home Assistant's calendar REST API returns them
(the card's own format). No Home Assistant imports, so
tests/test_calendar_cache.py can load this on its own; the wiring is in
calendar_cache_websocket_api.py.
"""
from __future__ import annotations

import dataclasses
from datetime import date, datetime, timedelta, tzinfo
from enum import Enum
from typing import Any, Callable, Optional

# Bounds per calendar, so one bad upload can't grow the copy without limit.
MAX_EVENTS = 2000
MAX_SPAN = timedelta(days=200)


def parse_time(value: Any, local_tz: tzinfo) -> Optional[datetime]:
    """An aware datetime from an ISO string, or None. A bare date is local
    midnight."""
    if not isinstance(value, str) or not value:
        return None
    try:
        if len(value) == 10:
            day = date.fromisoformat(value)
            return datetime(day.year, day.month, day.day, tzinfo=local_tz)
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=local_tz)


def _event_time(part: Any, local_tz: tzinfo) -> Optional[datetime]:
    if not isinstance(part, dict):
        return None
    return parse_time(part.get("dateTime") or part.get("date"), local_tz)


def api_event(event: Any, as_local: Callable[[datetime], datetime]) -> dict:
    """A CalendarEvent in the calendar REST API's format, as Home Assistant's
    own calendar helper api_event_dict_factory writes it."""
    out: dict = {}
    for field in dataclasses.fields(event):
        value = getattr(event, field.name)
        if isinstance(value, datetime):
            out[field.name] = {"dateTime": as_local(value).isoformat()}
        elif isinstance(value, date):
            out[field.name] = {"date": value.isoformat()}
        elif isinstance(value, Enum):
            out[field.name] = value.value
        else:
            out[field.name] = value
    return out


class CalendarCache:
    """One window of events per calendar."""

    def __init__(self, local_tz: tzinfo) -> None:
        self._tz = local_tz
        self._entries: dict[str, dict] = {}
        self._known: set[str] = set()

    def entities(self) -> list[str]:
        """Every calendar a board has asked about, for the hourly refresh."""
        return sorted(self._known | set(self._entries))

    def _overlaps(self, event: Any, start: datetime, end: datetime) -> bool:
        if not isinstance(event, dict):
            return False
        ev_start = _event_time(event.get("start"), self._tz)
        ev_end = _event_time(event.get("end"), self._tz) or ev_start
        if ev_start is None:
            return False
        return ev_start < end and (ev_end > start or ev_end == ev_start >= start)

    def get(self, entity_ids: list[str], start: datetime, end: datetime) -> dict[str, list]:
        """Each calendar whose copy covers the whole range, with the events
        in it. A calendar missing from the result has no usable copy."""
        found: dict[str, list] = {}
        for entity_id in entity_ids:
            self._known.add(entity_id)
            entry = self._entries.get(entity_id)
            if entry and entry["start"] <= start and entry["end"] >= end:
                found[entity_id] = [ev for ev in entry["events"] if self._overlaps(ev, start, end)]
        return found

    def replace(self, entity_id: str, start: datetime, end: datetime, events: list) -> None:
        """The hourly refresh: the whole window, fresh."""
        if len(events) > MAX_EVENTS or end <= start:
            self._entries.pop(entity_id, None)
            return
        self._entries[entity_id] = {"start": start, "end": end, "events": list(events)}

    def put(self, entity_id: str, start: datetime, end: datetime, events: list, now: datetime) -> None:
        """What a board's live check found for one range. It replaces the
        copy's events in that range and widens the window to include it;
        a range apart from the copy replaces it only when it includes now."""
        self._known.add(entity_id)
        if end <= start:
            return
        entry = self._entries.get(entity_id)
        if entry and start <= entry["end"] and end >= entry["start"]:
            new_start, new_end = min(start, entry["start"]), max(end, entry["end"])
            if new_end - new_start <= MAX_SPAN:
                kept = [ev for ev in entry["events"] if not self._overlaps(ev, start, end)]
                self.replace(entity_id, new_start, new_end, kept + list(events))
                return
        if entry and not start <= now < end:
            return
        self.replace(entity_id, start, end, events)
