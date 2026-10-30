"""Fill the sandbox with made-up household data, relative to today (Eastern).

Two working adults (columns Will and Jenn), no children, two cats. From a
week ago through four weeks ahead: work shifts and meetings, a dentist, a
vet visit, trash night, a date night, a birthday, a weekend trip, holidays,
an event shared by both, a few long titles, meals for most dinners this
week, a shopping list, Us notes and two house reminders. Everything here is
fictional: no real names beyond the board's column names, no addresses.

Usage: <sandbox>/venv/bin/python -I -B seed.py <sandbox dir>
"""
from __future__ import annotations

import asyncio
import json
import sys
from datetime import date, datetime, time, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

import aiohttp

sys.path.insert(0, str(Path(__file__).resolve().parent))
from sandbox_lib import TZ, WS, load_secrets, login, sandbox_dir, wait_for_ha  # noqa: E402

EASTERN = ZoneInfo(TZ)
TODAY = datetime.now(EASTERN).date()
START = TODAY - timedelta(days=7)
END = TODAY + timedelta(days=28)

WILL = "calendar.wills_calendar"
JENN = "calendar.jenns_calendar"
HOME = "calendar.home"
US = "calendar.us"
WORK = "calendar.work"

MO, TU, WE, TH, FR, SA, SU = range(7)
RRULE_DAYS = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"]


def day(offset: int) -> date:
    return TODAY + timedelta(days=offset)


def on_or_after(d: date, weekday: int) -> date:
    return d + timedelta(days=(weekday - d.weekday()) % 7)


def at(d: date, hhmm: str) -> datetime:
    h, m = (int(x) for x in hhmm.split(":"))
    return datetime.combine(d, time(h, m), EASTERN)


EVENTS: list[tuple[str, dict]] = []


def timed(cal: str, d: date, start: str, minutes: int, summary: str, **extra) -> None:
    s = at(d, start)
    EVENTS.append((cal, {"summary": summary, "dtstart": s.isoformat(), "dtend": (s + timedelta(minutes=minutes)).isoformat(), **extra}))


def all_day(cal: str, d: date, days: int, summary: str, **extra) -> None:
    EVENTS.append((cal, {"summary": summary, "dtstart": d.isoformat(), "dtend": (d + timedelta(days=days)).isoformat(), **extra}))


def weekly(cal: str, weekdays: list[int], start: str, minutes: int, summary: str, **extra) -> None:
    """A recurring series from a week ago to well past the window, the way a
    phone calendar's repeating events arrive."""
    first = min(on_or_after(START, wd) for wd in weekdays)
    until = (END + timedelta(days=60)).strftime("%Y%m%dT235959Z")
    rule = f"FREQ=WEEKLY;BYDAY={','.join(RRULE_DAYS[w] for w in weekdays)};UNTIL={until}"
    timed(cal, first, start, minutes, summary, rrule=rule, **extra)


def holidays() -> list[tuple[date, str, int]]:
    out = []
    for year in (TODAY.year, TODAY.year + 1):
        nov1 = date(year, 11, 1)
        first_sun = on_or_after(nov1, SU)
        thanksgiving = on_or_after(nov1, TH) + timedelta(weeks=3)
        out += [
            (date(year, 10, 31), "Halloween: candy bowl by the door", 1),
            (first_sun, "Clocks fall back an hour", 1),
            (thanksgiving, "Thanksgiving at the Parkers'", 1),
            (date(year, 12, 24), "Christmas Eve", 1),
            (date(year, 12, 25), "Christmas Day", 1),
        ]
    return [h for h in out if START <= h[0] <= END]


def build_events() -> date:
    # Will's work (stands in for the house's Work calendar).
    weekly(WORK, [MO, TU, TH, FR], "08:30", 480, "Office hours")
    weekly(WORK, [WE], "12:00", 60, "Staff meeting", location="Conference room B")
    timed(WORK, on_or_after(day(5), TH), "14:00", 90, "Quarterly planning review with the regional team (bring the printed budget summary)")
    all_day(WORK, on_or_after(day(10), WE), 1, "Office closed")

    # Will's own calendar.
    weekly(WILL, [MO, WE], "06:15", 60, "Gym")
    timed(WILL, on_or_after(day(1), TU), "15:00", 60, "Dentist", location="Riverside Dental", description="Cleaning and X-rays. Bring the new insurance card.")
    timed(WILL, day(0), "17:15", 30, "Pick up dry cleaning and drop off the library books on the way home")
    timed(WILL, day(1), "12:30", 30, "Call the insurance company about the windshield claim before the deadline")
    timed(WILL, on_or_after(day(1), SA), "09:00", 60, "Oil change")
    timed(WILL, day(-4), "18:00", 90, "Basketball with the guys")
    flu = on_or_after(day(7), TH)
    timed(WILL, flu, "17:30", 30, "Flu shots", location="Pharmacy on Main", description="Both of us. Walk-in is fine after 5.")

    # Jenn's calendar (planned for the real board).
    weekly(JENN, [MO, WE, FR], "07:00", 510, "Work shift")
    weekly(JENN, [TU], "10:00", 45, "Team call")
    weekly(JENN, [TH], "18:00", 60, "Yoga")
    timed(JENN, day(1), "17:30", 60, "Haircut")
    timed(JENN, on_or_after(day(4), TU), "19:00", 120, "Book club", location="Library meeting room")
    timed(JENN, on_or_after(day(8), MO), "09:00", 60, "Dentist cleaning")
    timed(JENN, day(-6), "16:00", 45, "Doctor's appointment")
    all_day(JENN, on_or_after(day(14), WE), 1, "Training day (all day, off site)")

    # Home: the house and the cats.
    weekly(HOME, [SU], "19:30", 15, "Trash night: bins to the curb")
    timed(HOME, on_or_after(day(5), TU), "16:00", 60, "Vet: both cats, annual checkup and shots", description="Carriers are in the hall closet. Bring the vaccine records.")
    timed(HOME, on_or_after(day(10), MO), "08:00", 240, "Furnace tune-up (technician arrives in an 8 to 12 window)")
    timed(HOME, day(-5), "10:00", 60, "Plumber: kitchen sink")
    timed(HOME, day(3), "10:00", 30, "Package pickup at the post office")
    for d, summary, days in holidays():
        all_day(HOME, d, days, summary)

    # Us: the two of you.
    date_night = on_or_after(day(1), SA)
    timed(US, date_night, "19:00", 150, "Date night: dinner and a movie")
    trip = on_or_after(day(7), FR)
    all_day(US, trip, 3, "Weekend at the lake cabin", description="Sitter feeds the cats Saturday and Sunday mornings.")
    timed(US, trip, "17:00", 150, "Drive to the cabin")
    all_day(US, day(11), 1, "Sam's birthday")
    timed(US, day(10), "18:00", 30, "Order Sam's birthday gift")
    timed(US, day(-3), "18:30", 120, "Dinner with the Parkers")
    timed(US, on_or_after(day(2), SA) + timedelta(weeks=1), "09:00", 90, "Farmers market")
    timed(US, day(0), "19:30", 45, "Plan holiday travel")
    timed(US, day(16), "20:00", 60, "Call Grandma")
    return flu


def meals() -> list[dict]:
    """Dinner is block 2 of the house's blocks (Breakfast, Lunch, Dinner)."""
    plan = [
        (-3, 2, "Chili", {"cook": "Will"}),
        (-2, 2, "Tacos", {}),
        (-1, 2, "Sheet-pan chicken and vegetables", {"cook": "Jenn"}),
        (0, 2, "Salmon, rice and green beans", {}),
        (3, 2, "Lasagna", {"cook": "Will", "leftoverDates": [day(4).isoformat()]}),
        (3, 0, "Pancakes", {}),
        (5, 2, "Chicken tortilla soup", {}),
        (6, 1, "Leftover soup", {}),
    ]
    out = [
        {"item": name, "due_date": day(off).isoformat(), "description": json.dumps({"block": block, **extra})}
        for off, block, name, extra in plan
    ]
    # Pizza every Friday: one weekly-repeat anchor, the way the board saves it.
    fri = on_or_after(day(0), FR)
    out.append({"item": "Pizza night", "due_date": fri.isoformat(), "description": json.dumps({"block": 2, "recur": "weekly"})})
    return out


SHOPPING = ["Milk", "Eggs", "Coffee beans", "Cat litter", "Paper towels", "Lemons", "Lasagna noodles"]

NOTES = [
    {"item": "Call the plumber about the slow kitchen drain", "due_datetime": at(day(0), "09:00").isoformat(), "description": "<!--rollover:1-->"},
    {"item": "Return library books", "due_datetime": at(day(1), "09:00").isoformat(), "description": "<!--rollover:1-->"},
    {"item": "Order more cat food and litter", "due_datetime": at(day(2), "09:00").isoformat(), "description": "<!--rollover:1-->"},
]
NOTE_DONE = {"item": "Pay the water bill", "due_datetime": at(day(-2), "09:00").isoformat(), "description": "<!--rollover:1-->"}

HOUSE_REMINDERS = [
    {"item": "Replace furnace filter (16x25x1)", "due_date": day(3).isoformat()},
    {"item": "Test smoke and CO detectors", "due_date": day(10).isoformat()},
]


async def main() -> None:
    sandbox = sandbox_dir()
    secrets = load_secrets(sandbox)
    flu = build_events()
    async with aiohttp.ClientSession() as session:
        await wait_for_ha(session)
        tokens = await login(session, "owner", secrets["owner"])
        async with WS(session, tokens["access_token"]) as ws:
            # The stand-ins for iCloud and Google are add-only or read-only
            # (sandbox_house); lift that while writing, then put it back.
            await ws.service("sandbox_house", "apply_calendar_features", restrict=False)
            for cal, event in EVENTS:
                await ws.cmd("calendar/event/create", entity_id=cal, event=event)
            for item in meals():
                await ws.service("todo", "add_item", entity_id="todo.meal_plan", **item)
            for name in SHOPPING:
                await ws.service("todo", "add_item", entity_id="todo.shopping_list", item=name)
            for note in NOTES + [NOTE_DONE]:
                await ws.service("todo", "add_item", entity_id="todo.us_notes", **note)
            await ws.service("todo", "update_item", entity_id="todo.us_notes", item=NOTE_DONE["item"], status="completed")
            for reminder in HOUSE_REMINDERS:
                await ws.service("todo", "add_item", entity_id="todo.house_reminders", **reminder)
            # The shared event: Flu shots lives on Will's calendar and is
            # tagged "Also for" Jenn, the board's own overlay.
            await ws.cmd(
                "family_hub/set_event_people_override",
                calendar_entity=WILL,
                start=int(at(flu, "17:30").timestamp()),
                summary="Flu shots",
                people=[JENN],
            )
            await ws.service("sandbox_house", "apply_calendar_features", restrict=True)
    print(f"seeded {len(EVENTS)} events (some repeat weekly), {len(meals())} meals, {len(SHOPPING)} shopping items, "
          f"{len(NOTES) + 1} notes, {len(HOUSE_REMINDERS)} house reminders; today is {TODAY} (Eastern)")


if __name__ == "__main__":
    asyncio.run(main())
