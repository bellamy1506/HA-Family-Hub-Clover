"""Lab for docs/research/google-editing.md (2026-11-01): the house write path
(google_write_proto.py) against a stand-in Google (fake_google.py), with Home
Assistant's reads done by the real gcal_sync 9.2.0 that Home Assistant
2026.10.4 pins, and the Whose row's CalDAV side against a local Radicale.
Made-up events only. Never point it at a real account.

Run, in a throwaway venv:
  pip install "gcal-sync==9.2.0" "ical==14.3.0" "caldav==3.3.0a1" "icalendar==6.3.1" \
      "vobject==0.9.9" aiohttp httpx radicale
  python -m radicale --config radicale.conf &
  NO_PROXY=127.0.0.1 python run_lab.py . try1
Expect "... passed" with no FAIL lines."""
import asyncio
import sys
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

import aiohttp
import caldav
from aiohttp import web
from gcal_sync.api import GoogleCalendarService, SyncEventsRequest
from gcal_sync.auth import AbstractAuth
from gcal_sync.model import ResponseStatus
from gcal_sync.store import InMemoryCalendarStore
from gcal_sync.sync import CalendarEventSyncManager

sys.path.insert(0, sys.argv[1])
import google_write_proto as g  # noqa: E402
from fake_google import TOKEN, FakeGoogle  # noqa: E402

NY = ZoneInfo("America/New_York")
CAL = "jenn@example.com"
BASE = "http://127.0.0.1:8765/calendar/v3"
WIN = (datetime(2026, 10, 24, tzinfo=NY), datetime(2027, 1, 31, tzinfo=NY))
results = []


def check(name, ok, detail=""):
    results.append(bool(ok))
    print(("PASS " if ok else "FAIL ") + name + (f"  [{detail}]" if detail else ""))


class LabAuth(AbstractAuth):
    async def async_get_access_token(self):
        return "lab-token"


def ha_event(e):
    """Home Assistant 2026.10.4, components/google/calendar.py,
    _get_calendar_event: the fields the board keys on."""
    return {"uid": e.ical_uuid, "recurrence_id": e.id if e.recurring_event_id else None,
            "summary": e.summary, "start": e.start.value}


def ha_visible(e):
    """_event_filter for a calendar set up in the UI (ignore_availability False)."""
    if any(a.is_self and a.response_status == ResponseStatus.DECLINED for a in e.attendees):
        return False
    return e.transparency == "opaque"


class HARead:
    """What the Google entity's coordinator does: sync into a local store
    (gcal_sync), then answer async_get_events from the timeline."""

    def __init__(self, service):
        self.sync = CalendarEventSyncManager(service, store=InMemoryCalendarStore(), request_template=SyncEventsRequest(
            calendar_id=CAL, start_time=datetime(2026, 7, 1, tzinfo=NY)))

    async def __call__(self, uid=None):
        await self.sync.run()  # coordinator.async_refresh() after a write
        tl = await self.sync.store_service.async_get_timeline(NY)
        evs = [ha_event(e) for e in tl.overlapping(*WIN) if ha_visible(e)]
        return [e for e in evs if uid is None or e["uid"] == uid]


def starts(evs):
    return {(g._norm(e["start"]), e["summary"]) for e in evs}


def ny(y, m, d, h=0, mi=0):
    return datetime(y, m, d, h, mi, tzinfo=NY)


def weekly(summary, first, hours, byday=None, count=10, **extra):
    when = ({"dateTime": first.isoformat(), "timeZone": "America/New_York"} if isinstance(first, datetime)
            else {"date": first.isoformat()})
    end = first + (timedelta(hours=hours) if isinstance(first, datetime) else timedelta(days=1))
    endw = ({"dateTime": end.isoformat(), "timeZone": "America/New_York"} if isinstance(first, datetime)
            else {"date": end.isoformat()})
    rule = f"RRULE:FREQ=WEEKLY;COUNT={count}" + (f";BYDAY={byday}" if byday else "")
    return {"summary": summary, "start": when, "end": endw, "recurrence": [rule], **extra}


APPLE = """BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Apple Inc.//iPhone OS 26.0//EN
BEGIN:VTIMEZONE
TZID:America/New_York
BEGIN:DAYLIGHT
TZOFFSETFROM:-0500
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU
DTSTART:20070311T020000
TZNAME:EDT
TZOFFSETTO:-0400
END:DAYLIGHT
BEGIN:STANDARD
TZOFFSETFROM:-0400
RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU
DTSTART:20071104T020000
TZNAME:EST
TZOFFSETTO:-0500
END:STANDARD
END:VTIMEZONE
BEGIN:VEVENT
UID:6F1E2D3C-AAAA-4BBB-8CCC-0123456789AB
DTSTAMP:20261020T120000Z
DTSTART;TZID=America/New_York:20261024T080000
DTEND;TZID=America/New_York:20261024T090000
RRULE:FREQ=WEEKLY;COUNT=8
EXDATE;TZID=America/New_York:20261107T080000
SUMMARY:Run club (made up)
LOCATION:The park (made up)
X-APPLE-TRAVEL-ADVISORY-BEHAVIOR:AUTOMATIC
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:Reminder
TRIGGER:-PT10M
END:VALARM
END:VEVENT
BEGIN:VEVENT
UID:6F1E2D3C-AAAA-4BBB-8CCC-0123456789AB
DTSTAMP:20261020T120000Z
RECURRENCE-ID;TZID=America/New_York:20261114T080000
DTSTART;TZID=America/New_York:20261114T090000
DTEND;TZID=America/New_York:20261114T110000
SUMMARY:Run club, long run (made up)
END:VEVENT
END:VCALENDAR
"""


async def main():
    fake = FakeGoogle()
    runner = web.AppRunner(fake.app)
    await runner.setup()
    await web.TCPSite(runner, "127.0.0.1", 8765).start()
    session = aiohttp.ClientSession()

    async def request(method, path, params=None, json=None, headers=None):
        async with session.request(method, f"{BASE}/{path}", params=params, json=json,
                                   headers={"Authorization": TOKEN, **(headers or {})}) as r:
            body = await r.json() if r.content_type == "application/json" else None
            return r.status, body

    w = g.GoogleWriter(request, CAL)
    service = GoogleCalendarService(LabAuth(session, host=BASE))
    read = HARead(service)

    # Made-up events, as if made in Google Calendar on Jenn's phone.
    dentist = fake.add(CAL, {"summary": "Dentist (made up)", "start": {"dateTime": ny(2026, 11, 5, 15).isoformat()},
                             "end": {"dateTime": ny(2026, 11, 5, 16).isoformat()}})
    yoga = fake.add(CAL, weekly("Yoga (made up)", ny(2026, 10, 27, 18), 1, "TU",
                                reminders={"useDefault": False, "overrides": [{"method": "popup", "minutes": 30}]}))
    trash = fake.add(CAL, weekly("Trash night (made up)", date(2026, 10, 28), 0, count=8))
    invite = fake.add(CAL, {"summary": "Team lunch (made up)", "start": {"dateTime": ny(2026, 11, 6, 12).isoformat()},
                            "end": {"dateTime": ny(2026, 11, 6, 13).isoformat()},
                            "organizer": {"email": "someone@example.com"},
                            "attendees": [{"email": CAL, "self": True, "responseStatus": "accepted"},
                                          {"email": "someone@example.com", "organizer": True}]})
    guests = fake.add(CAL, {"summary": "Dinner with friends (made up)", "start": {"dateTime": ny(2026, 11, 7, 19).isoformat()},
                            "end": {"dateTime": ny(2026, 11, 7, 21).isoformat()},
                            "attendees": [{"email": CAL, "self": True, "organizer": True},
                                          {"email": "friend@example.com"}]})
    bday = fake.add(CAL, {"summary": "Birthday (made up)", "eventType": "birthday", "start": {"date": "2026-11-09"},
                          "end": {"date": "2026-11-10"}})

    # ---- R. What Home Assistant reports ---------------------------------
    evs = await read()
    d = [e for e in evs if e["uid"] == dentist["iCalUID"]]
    check("R1 one-off: uid is the iCalUID, no recurrence_id", d and d[0]["recurrence_id"] is None, d and d[0]["uid"])
    y = {e["recurrence_id"] for e in evs if e["uid"] == yoga["iCalUID"]}
    check("R2 series: recurrence_id is the instance id in UTC, across the clock change",
          f"{yoga['id']}_20261027T220000Z" in y and f"{yoga['id']}_20261103T230000Z" in y, sorted(y)[:2])
    t = {e["recurrence_id"] for e in evs if e["uid"] == trash["iCalUID"]}
    check("R3 all-day series: recurrence_id ends in the date", f"{trash['id']}_20261111" in t)

    # ---- A-D. One occurrence --------------------------------------------
    uid, rid10 = yoga["iCalUID"], f"{yoga['id']}_20261110T230000Z"
    fake.log.clear()
    u_a = await w.update(uid, {"summary": "Yoga, late (made up)", "dtstart": ny(2026, 11, 10, 19),
                               "dtend": ny(2026, 11, 10, 20)}, rid10, "this")
    patches = [l for l in fake.log if l[0] == "PATCH"]
    check("A1 change one: one PATCH on the instance, with If-Match and sendUpdates=none",
          len(patches) == 1 and patches[0][1].endswith(rid10) and patches[0][3] and patches[0][2].get("sendUpdates") == "none")
    evs = await read(uid)
    hit = [e for e in evs if e["recurrence_id"] == rid10]
    check("A2 Home Assistant shows it changed, same uid and recurrence_id",
          hit and hit[0]["summary"] == "Yoga, late (made up)" and hit[0]["start"] == ny(2026, 11, 10, 19))
    check("A3 the other occurrences are untouched",
          sum(e["summary"] == "Yoga (made up)" for e in evs) == 9 and len(evs) == 10)
    await w.update(uid, {"dtstart": ny(2026, 11, 12, 19), "dtend": ny(2026, 11, 12, 20)}, rid10, "this")
    hit = [e for e in await read(uid) if e["recurrence_id"] == rid10]
    check("B change it again, two days on: same recurrence_id, keeps its new title",
          hit and hit[0]["start"] == ny(2026, 11, 12, 19) and hit[0]["summary"] == "Yoga, late (made up)")
    u_c = await w.delete(uid, f"{yoga['id']}_20261117T230000Z", "this")
    evs = await read(uid)
    check("C delete one: it's gone, the rest stay", len(evs) == 9 and all(e["start"] != ny(2026, 11, 17, 18) for e in evs))
    await w.undo(u_c)
    check("C2 Undo brings that occurrence back", len(await read(uid)) == 10)
    await w.delete(uid, rid10, "this")
    evs = await read(uid)
    check("D delete the moved occurrence", len(evs) == 9 and all(e["recurrence_id"] != rid10 for e in evs))

    # ---- E. All ---------------------------------------------------------
    try:
        await w.update(uid, {"dtstart": ny(2026, 11, 3, 18, 30), "dtend": ny(2026, 11, 3, 19, 30)},
                       f"{yoga['id']}_20261103T230000Z", "all")
        check("E1 time change for all, on a series with exceptions, is refused", False)
    except g.NotEditable as err:
        check("E1 time change for all, on a series with exceptions, is refused", True, str(err))
    await w.update(uid, {"summary": "Yoga class (made up)"}, f"{yoga['id']}_20261103T230000Z", "all")
    evs = await read(uid)
    check("E2 text change for all: every occurrence, one series", len(evs) == 9 and all(e["summary"] == "Yoga class (made up)" for e in evs))
    piano = fake.add(CAL, weekly("Piano (made up)", ny(2026, 10, 28, 16), 1, "WE", count=6))
    await w.update(piano["iCalUID"], {"dtstart": ny(2026, 11, 5, 16, 30), "dtend": ny(2026, 11, 5, 17, 30)},
                   f"{piano['id']}_20261104T210000Z", "all")
    evs = await read(piano["iCalUID"])
    check("E3 move all a day later and 30 min: Thursdays 4:30, rule now BYDAY=TH",
          len(evs) == 6 and all(e["start"].weekday() == 3 and e["start"].hour == 16 and e["start"].minute == 30
                                for e in evs), sorted(str(e["start"]) for e in evs)[:2])

    # ---- F. All-day -----------------------------------------------------
    await w.delete(trash["iCalUID"], f"{trash['id']}_20261111", "this")
    evs = await read(trash["iCalUID"])
    check("F all-day: delete one occurrence", len(evs) == 7 and all(e["start"] != date(2026, 11, 11) for e in evs))

    # ---- G. One-off -----------------------------------------------------
    await w.update(dentist["iCalUID"], {"summary": "Dentist, Dr. Lee (made up)", "location": "Main St (made up)"})
    u_g = await w.delete(dentist["iCalUID"])
    gone = not await read(dentist["iCalUID"])
    await w.undo(u_g)
    back = await read(dentist["iCalUID"])
    check("G one-off: change, delete, then Undo restores the same event (same uid, same id)",
          gone and back and back[0]["summary"] == "Dentist, Dr. Lee (made up)"
          and fake.cals[CAL][dentist["id"]]["status"] == "confirmed")

    # ---- H. Someone changed it in between --------------------------------
    _, target, _ = await w.find(dentist["iCalUID"])
    kept = list(fake.log)  # what follows is the phone, then Home Assistant's own delete: not the board
    await request("PATCH", f"calendars/{CAL}/events/{dentist['id']}", json={"summary": "Dentist moved (phone)"})
    try:
        await w._patch(target, {"summary": "stale"}, g.Undo())
        check("H a stale write is refused with 412", False)
    except g.Conflict:
        check("H a stale write is refused with 412, the phone's change stays",
              fake.cals[CAL][dentist["id"]]["summary"] == "Dentist moved (phone)")
    fake.log.clear()

    # ---- I-J. Refusals ----------------------------------------------------
    for name, ev in (("invitation", invite), ("own event with a guest", guests), ("birthday", bday)):
        try:
            await w.update(ev["iCalUID"], {"summary": "x"})
            check(f"I refuses: {name}", False)
        except g.NotEditable as err:
            check(f"I refuses: {name}", True, str(err))
    try:
        await w.update(trash["iCalUID"], {"summary": "x"})
        check("J a repeating event without an occurrence and 'all' is refused", False)
    except g.NotEditable:
        check("J a repeating event without an occurrence and 'all' is refused", True)
    try:  # A's change was changed again (B) and deleted (D) since: its Undo must not win
        await w.undo(u_a)
        check("K an out-of-date Undo is refused (412), the deleted occurrence stays deleted", False)
    except g.Conflict:
        check("K an out-of-date Undo is refused (412), the deleted occurrence stays deleted",
              all(e["recurrence_id"] != rid10 for e in await read(uid)))

    # ---- L. Home Assistant's own delete (gcal_sync 9.2.0) ------------------
    kept += fake.log
    for first, label in ((False, "series listed first"), (True, "exception listed first")):
        fake.exceptions_first = first
        swim = fake.add(CAL, weekly(f"Swim {label} (made up)", ny(2026, 10, 26, 7), 1, "MO", count=6))
        r = f"{swim['id']}_20261102T120000Z"
        await w.update(swim["iCalUID"], {"summary": "Swim, early (made up)"}, r, "this")
        ha = HARead(service)  # a fresh store, as after a restart or a full re-sync
        await ha()
        target = f"{swim['id']}_20261109T120000Z"
        await ha.sync.store_service.async_delete_event(ical_uuid=swim["iCalUID"], event_id=target)
        left = {e["recurrence_id"] for e in await ha(swim["iCalUID"])}
        right = target not in left and r in left
        check(f"L Home Assistant's delete of one occurrence, {label}: "
              + ("deletes the one asked for" if not first else "deletes the wrong one (demonstrated)"),
              right if not first else (target in left and r not in left), f"left {len(left)}")
    fake.exceptions_first = False
    fake.log.clear()

    # ---- M-N. Whose: Jenn -> Will (Google -> CalDAV) ----------------------
    client = caldav.DAVClient(url="http://127.0.0.1:5233/", username="lab", password="x", timeout=30)
    principal = client.principal()
    will = principal.make_calendar(name="Will (made up) " + sys.argv[2])
    us = principal.make_calendar(name="Us (made up) " + sys.argv[2])
    choir = fake.add(CAL, weekly("Choir (made up)", ny(2026, 10, 29, 19), 2, "TH", count=8,
                                 reminders={"useDefault": False, "overrides": [{"method": "popup", "minutes": 15}]}))
    cu = choir["iCalUID"]
    await w.update(cu, {"summary": "Choir, dress rehearsal (made up)", "dtstart": ny(2026, 11, 12, 20),
                        "dtend": ny(2026, 11, 12, 22)}, f"{choir['id']}_20261113T000000Z", "this")
    await w.delete(cu, f"{choir['id']}_20261120T000000Z", "this")
    before = starts(await read(cu))
    undo, obj = await w.to_caldav(cu, will, *WIN)
    after = g.caldav_occurrences(will, cu, *WIN)
    text = obj.data
    check("M1 moved to Will's: same occurrences, moved one moved, deleted one deleted", after == before and len(before) == 7)
    check("M2 same uid on CalDAV (the Google iCalUID), alarm carried", f"UID:{cu}" in text and "TRIGGER:-PT15M" in text)
    check("M3 gone from Jenn's, not doubled", not await read(cu) and len(g.caldav_find(will, cu, *WIN)) == 1)
    await w.undo(undo)
    obj.delete()
    check("N Undo: back on Jenn's as it was (same Google id), nothing left on Will's",
          starts(await read(cu)) == before and not g.caldav_find(will, cu, *WIN)
          and fake.cals[CAL][choir["id"]]["status"] == "confirmed")

    # ---- O-Q. Whose: Us -> Jenn (CalDAV -> Google) -------------------------
    au = "6F1E2D3C-AAAA-4BBB-8CCC-0123456789AB"
    apple = us.save_event(APPLE)
    before = g.caldav_occurrences(us, au, *WIN)
    text, new = await w.from_caldav(apple, *WIN)
    evs = await read(au)
    check("O1 moved to Jenn's: same occurrences, exception and EXDATE kept", starts(evs) == before and len(before) == 7)
    check("O2 same uid on Google (Apple's UID as iCalUID), alarm as a popup",
          all(e["uid"] == au for e in evs) and new["reminders"]["overrides"][0]["minutes"] == 10)
    check("O3 gone from Us, not doubled", not g.caldav_find(us, au, *WIN))
    us.save_event(text)  # Undo: put Apple's own text back first, then remove Google's copy
    await w.call("DELETE", f"events/{new['id']}", params=g.QUIET)
    check("P Undo: Us has Apple's original text again (X-APPLE field kept), Google has none",
          g.caldav_occurrences(us, au, *WIN) == before and not await read(au)
          and "X-APPLE-TRAVEL" in g.caldav_find(us, au, *WIN)[0].data)
    text2, new2 = await w.from_caldav(g.caldav_find(us, au, *WIN)[0], *WIN)
    check("Q moving it again restores Google's earlier event for that uid instead of a second one",
          new2["id"] == new["id"] and starts(await read(au)) == before)

    # ---- R. Failures leave exactly one copy --------------------------------
    us.save_event(text2)
    await w.call("DELETE", f"events/{new2['id']}", params=g.QUIET)
    fake.fail_next[("PATCH", "patch")] = 500  # the restore of the tombstone fails
    try:
        await w.from_caldav(g.caldav_find(us, au, *WIN)[0], *WIN)
        check("S1 Google write fails: nothing moved", False)
    except g.GoogleError:
        check("S1 Google write fails: still on Us only", g.caldav_find(us, au, *WIN) and not await read(au))
    fake.fail_next[("DELETE", "delete")] = 412
    try:
        await w.to_caldav(cu, will, *WIN)
        check("S2 Google delete fails after the copy: copy removed", False)
    except g.Conflict:
        check("S2 Google delete refused after the copy: the copy is removed, still on Jenn's only",
              not g.caldav_find(will, cu, *WIN) and len(await read(cu)) == 7)

    writes = [l for l in kept + fake.log if l[0] in ("PATCH", "DELETE", "POST")]
    check("T every write the board sent said sendUpdates=none", all(l[2].get("sendUpdates") == "none" for l in writes),
          f"{len(writes)} writes")

    await session.close()
    await runner.cleanup()
    print(f"{sum(results)}/{len(results)} passed")


asyncio.run(main())
