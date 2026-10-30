"""Lab for docs/research/icloud-editing.md (2026-10-29): the caldav library
Home Assistant ships, against a local Radicale, with made-up events. Reads
the way HA's CalDAV coordinator does (homeassistant/components/caldav/
coordinator.py, _get_events). Never point it at a real account.

Run, in a throwaway venv:
  pip install "caldav==3.3.0a1" "icalendar==6.3.1" "vobject==0.9.9" httpx radicale
  python -m radicale --config radicale.conf &
  NO_PROXY=127.0.0.1 python run_lab.py . try1
(caldav 3.5.0a0, HA's next pin, also needs requests.) Expect "21/21 passed"."""
import sys
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

import caldav
from caldav.lib import error

sys.path.insert(0, sys.argv[1])
import caldav_write_proto as w  # noqa: E402

NY = ZoneInfo("America/New_York")
results = []


def check(name, ok, detail=""):
    results.append(ok)
    print(("PASS " if ok else "FAIL ") + name + (f"  [{detail}]" if detail else ""))


def ha_read(cal, start, end):
    """What HA's CalDAV entity returns: one entry per occurrence."""
    out = []
    for ev in cal.search(start=start, end=end, event=True, expand=True):
        v = ev.vobject_instance.vevent
        rid = getattr(v, "recurrence_id", None)
        out.append({
            "uid": v.uid.value,
            "summary": v.summary.value,
            "start": v.dtstart.value,
            "recurrence_id": str(rid.value) if rid is not None else None,
            "alarm": hasattr(v, "valarm"),
        })
    return sorted(out, key=lambda e: (str(e["start"])))


client = caldav.DAVClient(url="http://127.0.0.1:5232/", username="lab", password="x", timeout=30)
principal = client.principal()
name = "Will (made up) " + sys.argv[2]
cal = principal.make_calendar(name=name)
win_start = datetime(2026, 10, 19, tzinfo=NY)
win_end = datetime(2026, 12, 31, tzinfo=NY)

# 1. A one-off event, created the way HA's CalDAV entity creates one.
cal.add_event(summary="Dentist (made up)", dtstart=datetime(2026, 11, 3, 15, 0, tzinfo=NY), dtend=datetime(2026, 11, 3, 16, 0, tzinfo=NY))

# 2. A repeating event as an iPhone writes it: TZID + VTIMEZONE, an alarm,
#    Apple fields, and a resource name that isn't the UID. Crosses the
#    1 Nov 2026 clock change.
APPLE = """BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Apple Inc.//iPhone OS 26.0//EN
CALSCALE:GREGORIAN
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
CREATED:20261020T120000Z
UID:6B1C2D3E-4F50-4A1B-9C2D-3E4F5A6B7C8D
DTSTART;TZID=America/New_York:20261026T090000
DTEND;TZID=America/New_York:20261026T100000
RRULE:FREQ=WEEKLY;COUNT=6
SUMMARY:Gym (made up)
TRANSP:OPAQUE
X-APPLE-TRAVEL-ADVISORY-BEHAVIOR:AUTOMATIC
DTSTAMP:20261020T120000Z
SEQUENCE:0
BEGIN:VALARM
UID:0A1B2C3D-0000-4000-8000-000000000001
TRIGGER:-PT15M
ACTION:DISPLAY
DESCRIPTION:Reminder
END:VALARM
END:VEVENT
END:VCALENDAR
"""
client.put(str(cal.url.join("apple-style-resource-1234.ics")), APPLE, {"Content-Type": "text/calendar; charset=utf-8"})

# 3. A repeating all-day event (trash day), made like HA makes one.
cal.add_event(summary="Trash (made up)", dtstart=date(2026, 10, 27), dtend=date(2026, 10, 28), rrule={"FREQ": "WEEKLY", "COUNT": 5})

GYM = "6B1C2D3E-4F50-4A1B-9C2D-3E4F5A6B7C8D"
before = ha_read(cal, win_start, win_end)
gym = [e for e in before if e["uid"] == GYM]
trash = [e for e in before if e["summary"].startswith("Trash")]
dentist = [e for e in before if e["summary"].startswith("Dentist")]
check("HA-style read sees 6 Gym, 5 Trash, 1 Dentist", (len(gym), len(trash), len(dentist)) == (6, 5, 1))
print("   recurrence_id strings HA would report:", gym[0]["recurrence_id"], "|", gym[2]["recurrence_id"], "|", trash[0]["recurrence_id"])
check("every repeating occurrence carries a recurrence_id", all(e["recurrence_id"] for e in gym + trash))
check("one-off has no recurrence_id", dentist[0]["recurrence_id"] is None)

# ETag from a search result vs a GET
s = [o for o in cal.search(start=win_start, end=win_end, event=True, expand=False) if o.icalendar_component.get("uid") == GYM][0]
print("INFO search result ETag:", s.etag)
g = cal.event_by_url(s.url)
check("event_by_url (GET) carries an ETag", bool(g.etag), str(g.etag))

# A. Delete one occurrence (third, 9 Nov, after the clock change).
w.delete(cal, GYM, gym[2]["start"], recurrence_id=gym[2]["recurrence_id"])
after = [e for e in ha_read(cal, win_start, win_end) if e["uid"] == GYM]
check("A delete one occurrence: 5 left, the 9 Nov one gone",
      len(after) == 5 and gym[2]["recurrence_id"] not in [e["recurrence_id"] for e in after])
raw = cal.event_by_url(s.url).data
check("A EXDATE written in the event's own zone", "EXDATE;TZID=America/New_York:20261109T090000" in raw, [l for l in raw.splitlines() if l.startswith("EXDATE")][0])

# B. Change one occurrence (second, 2 Nov): an hour later and a new title.
occ = after[1]
w.update(cal, GYM, occ["start"], {"summary": "Gym, late (made up)", "dtstart": datetime(2026, 11, 2, 10, 0, tzinfo=NY), "dtend": datetime(2026, 11, 2, 11, 0, tzinfo=NY)}, recurrence_id=occ["recurrence_id"])
after = [e for e in ha_read(cal, win_start, win_end) if e["uid"] == GYM]
moved = [e for e in after if e["summary"].startswith("Gym, late")]
check("B change one occurrence: 5 occurrences, one renamed and at 10:00",
      len(after) == 5 and len(moved) == 1 and moved[0]["start"].hour == 10)
check("B the changed one keeps its recurrence_id", moved and moved[0]["recurrence_id"] == occ["recurrence_id"], moved[0]["recurrence_id"] if moved else "")
check("B the changed one keeps its alarm", moved and moved[0]["alarm"])
raw = cal.event_by_url(s.url).data
check("B Apple fields kept", raw.count("X-APPLE-TRAVEL-ADVISORY-BEHAVIOR") == 2)

# C. Change the same occurrence again (existing override).
w.update(cal, GYM, moved[0]["start"], {"summary": "Gym, later (made up)", "dtstart": datetime(2026, 11, 5, 10, 0, tzinfo=NY), "dtend": datetime(2026, 11, 5, 11, 0, tzinfo=NY)}, recurrence_id=occ["recurrence_id"])
after = [e for e in ha_read(cal, win_start, win_end) if e["uid"] == GYM]
later = [e for e in after if e["summary"] == "Gym, later (made up)"]
check("C change it again, moving it 3 days on (to Thu 5 Nov): still 5, renamed",
      len(after) == 5 and len(later) == 1 and later[0]["start"].day == 5)

# D. Delete that changed occurrence: override removed and EXDATE added.
w.delete(cal, GYM, later[0]["start"], recurrence_id=occ["recurrence_id"])
after = [e for e in ha_read(cal, win_start, win_end) if e["uid"] == GYM]
check("D delete the moved occurrence, found by where it shows now: 4 left, none renamed", len(after) == 4 and all(e["summary"] == "Gym (made up)" for e in after))

# E. Change the whole series: new title, 30 min later.
first = after[0]
w.update(cal, GYM, first["start"], {"summary": "Gym class (made up)", "dtstart": first["start"].astimezone(NY) + timedelta(minutes=30), "dtend": first["start"].astimezone(NY) + timedelta(minutes=90)}, recurrence_id=first["recurrence_id"], scope="all")
after = [e for e in ha_read(cal, win_start, win_end) if e["uid"] == GYM]
check("E change all: 4 left (deleted ones stay deleted), all renamed, all at 9:30 local",
      len(after) == 4 and all(e["summary"] == "Gym class (made up)" for e in after)
      and all(e["start"].astimezone(NY).strftime("%H:%M") == "09:30" for e in after),
      ", ".join(e["start"].astimezone(NY).strftime("%m-%d %H:%M") for e in after))

# F. All-day repeating: delete one occurrence.
trash_rid = trash[1]["recurrence_id"]
w.delete(cal, trash[1]["uid"], trash[1]["start"], recurrence_id=trash_rid)
after = [e for e in ha_read(cal, win_start, win_end) if e["summary"].startswith("Trash")]
check("F all-day: delete one of 5 -> 4", len(after) == 4 and trash_rid not in [e["recurrence_id"] for e in after], trash_rid)

# G. One-off: change, then delete (needs a time hint: no recurrence_id).
d = dentist[0]
w.update(cal, d["uid"], d["start"], {"summary": "Dentist, moved (made up)", "dtstart": datetime(2026, 11, 4, 15, 0, tzinfo=NY), "dtend": datetime(2026, 11, 4, 16, 0, tzinfo=NY)})
after = [e for e in ha_read(cal, win_start, win_end) if e["uid"] == d["uid"]]
check("G one-off change: moved to 4 Nov, renamed", len(after) == 1 and after[0]["start"].day == 4 and "moved" in after[0]["summary"])
w.delete(cal, d["uid"], after[0]["start"])
check("G one-off delete", not [e for e in ha_read(cal, win_start, win_end) if e["uid"] == d["uid"]])

# H. Someone changed it on a phone in between: stale ETag -> 412.
stale = w.find(cal, GYM, datetime(2026, 10, 26, 9, tzinfo=NY))
fresh = w.find(cal, GYM, datetime(2026, 10, 26, 9, tzinfo=NY))
fresh.icalendar_component["SUMMARY"] = "Gym, edited on phone (made up)"
fresh.save(only_this_recurrence=False)
stale.icalendar_component["SUMMARY"] = "Gym, edited on board (made up)"
try:
    stale.save(only_this_recurrence=False)
    check("H stale write refused (If-Match)", False, "overwrote the phone's change")
except error.ETagMismatchError:
    check("H stale write refused (If-Match) as ETagMismatchError", True)
except error.DAVError as err:
    check("H stale write refused (If-Match)", True, type(err).__name__)

# H2. The same race, writing straight from a search result (no ETag):
#     the phone's change is silently overwritten.
hit = [o for o in cal.search(start=win_start, end=win_end, event=True, expand=False) if o.icalendar_component.get("uid") == GYM][0]
fresh = w.find(cal, GYM, datetime(2026, 10, 26, 9, tzinfo=NY))
fresh.icalendar_component["SUMMARY"] = "Gym, phone again (made up)"
fresh.save(only_this_recurrence=False)
hit.icalendar_component["SUMMARY"] = "Gym, board from search (made up)"
try:
    hit.save(only_this_recurrence=False)
    now = w.find(cal, GYM, datetime(2026, 10, 26, 9, tzinfo=NY)).icalendar_component["SUMMARY"]
    print("INFO H2 write from a search result:", "overwrote the phone's change" if "board" in now else now)
except error.ETagMismatchError:
    print("INFO H2 write from a search result: refused with 412 (search carried an ETag)")

# I. An invitation is left alone.
cal.add_event(summary="Meeting (made up)", dtstart=datetime(2026, 11, 5, 11, tzinfo=NY), dtend=datetime(2026, 11, 5, 12, tzinfo=NY), uid="invite-1")
o = w.find(cal, "invite-1", datetime(2026, 11, 5, 11, tzinfo=NY))
o.icalendar_component.add("ORGANIZER", "mailto:someone@example.com")
o.icalendar_component.add("ATTENDEE", "mailto:will@example.com")
o.save(only_this_recurrence=False)
try:
    w.delete(cal, "invite-1", datetime(2026, 11, 5, 11, tzinfo=NY))
    check("I invitation refused", False)
except w.NotEditable:
    check("I invitation refused", True)

# J. The library's own one-occurrence save (merge into the master) looks the
#    master up by a UID search: fine here, refused by iCloud (412).
occs = [o for o in cal.search(start=win_start, end=win_end, event=True, expand=True) if o.icalendar_component.get("uid") == trash[0]["uid"]]
occs[0].icalendar_component["SUMMARY"] = "Trash, first (made up)"
occs[0].save()
after = [e for e in ha_read(cal, win_start, win_end) if e["uid"] == trash[0]["uid"]]
check("J caldav's built-in occurrence save works on Radicale", len(after) == 4 and sum(e["summary"] == "Trash, first (made up)" for e in after) == 1)

# K. A repeating event changed or deleted without saying which part: refused.
gym_now = [e for e in ha_read(cal, win_start, win_end) if e["uid"] == GYM]
try:
    w.update(cal, GYM, gym_now[0]["start"], {"summary": "x"})
    check("K repeating event without recurrence_id refused", False)
except w.NotEditable:
    check("K repeating event without recurrence_id refused", True)

# L. Delete a whole series, asked for as such.
w.delete(cal, GYM, gym_now[0]["start"], recurrence_id=gym_now[0]["recurrence_id"], scope="all")
check("L delete all: series gone", not [e for e in ha_read(cal, win_start, win_end) if e["uid"] == GYM])

cal.delete()
print(f"\n{sum(results)}/{len(results)} passed with caldav {caldav.__version__}")
