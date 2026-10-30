# Editing iCloud events from the board

Research note, 2026-10-29, for fork issue [#39](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/39) (map [#37](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/37)). Question: Home Assistant's CalDAV integration can create events on the owner's iCloud calendars but not change or delete them. Can this project's own backend change and delete iCloud events directly, with the `caldav` library Home Assistant already ships and the CalDAV integration's stored sign-in, including one occurrence of a repeating event? What would it take, what breaks, how does it stay in step with Home Assistant's calendar entity and the server's calendar copy, and what does it cost to own?

Lines marked **[inference]** are my own judgement, not something a source states. Sources: Home Assistant 2026.10.4's own source as installed in the sandbox (`homeassistant/components/caldav/`, `components/calendar/`, `components/local_calendar/`); the `caldav` library's source at 3.3.0a1 (Home Assistant 2026.10.4's pin) and 3.5.0a0 (Home Assistant's development branch), from PyPI; `ical` 14.3.0 (Local Calendar's library); this branch at `301c8ee`; web pages with their dates. Nothing touched the house or a real iCloud account: the lab below ran against a local Radicale server with made-up events.

## The answer

**Yes.** The `caldav` library can change and delete any event, and one occurrence of a repeating one, if the code edits the calendar object itself and saves it back; Home Assistant's CalDAV integration simply never implemented it. Family Hub's backend can reach the CalDAV entity's own connection (`entity.coordinator.calendar`), so it reuses the stored iCloud sign-in without ever reading the password. Three iCloud habits shape how: iCloud refuses a search by UID alone (so find the event by its time instead), the library's own "save one occurrence" path uses that refused search (so don't use it), and saving an invitation makes iCloud message the other people (so leave invitations alone). About 130 lines of house code plus wiring and tests; it fails safe, back to today's create-only behaviour, if Home Assistant changes what it relies on.

## 1. What's already built or decided

- **Home Assistant's CalDAV entity declares create only:** `_attr_supported_features = CalendarEntityFeature.CREATE_EVENT`, and `async_create_event` calls `self.coordinator.calendar.add_event(...)` (`caldav/calendar.py`, `WebDavCalendarEntity`). The connection is a `caldav` `DAVClient` built from the config entry's URL, username, app-specific password and SSL setting (`caldav/__init__.py`), and each entity's coordinator holds its `caldav` `Calendar` as `.calendar` (`caldav/coordinator.py`).
- **Reads are live, every time:** `async_get_events` runs `calendar.search(start, end, event=True, expand=True)` and reports each occurrence with `uid` and `recurrence_id=str(value)` (`coordinator.py`, `_get_events`). Only the entity's state (the next event) is cached, refreshed every 15 minutes (`MIN_TIME_BETWEEN_UPDATES`).
- **The calendar contract Home Assistant defines** for any calendar that can edit: `async_update_event(uid, event, recurrence_id, recurrence_range)` and `async_delete_event(uid, recurrence_id, recurrence_range)`, offered through the `calendar/event/update` and `calendar/event/delete` websocket commands only when the entity reports the `UPDATE_EVENT` (4) or `DELETE_EVENT` (2) bit (`calendar/__init__.py`, `calendar/const.py`).
- **Family Hub's own commands** follow that contract: `family_hub/calendar/delete_support` reports the bits (and the integration's name for "change it there"), `family_hub/calendar/delete_event` and `update_event` call the entity's methods only when the bit is set, and already accept `recurrence_id` (and `recurrence_range` for update) (`custom_components/family_hub/__init__.py`, `_ws_get_calendar_delete_support`, `_ws_delete_calendar_event`, `_ws_update_calendar_event`). Fields arrive through `_build_entity_event_fields` as `dtstart`/`dtend`, already the shape a write path needs.
- **The served card sends no `recurrence_id`** on Delete or Edit (`card/family-week-calendar-card.js`, the event-info Delete and Edit handlers). On Us, a Local Calendar, Delete on a repeating event therefore removes the whole series after a confirm: `ical`'s `EventStore.delete` with no recurrence id removes the item (`ical/store.py`). Found in passing; the house board should ask "This one or all?".
- **The server's calendar copy** (`calendar_cache.py`, `calendar_cache_websocket_api.py`) keeps a window per calendar in memory, refreshed hourly and by each board's live check (`family_hub/calendar_cache/put`).
- **Decided:** iCloud is read plus add (J008 Q2/Q6/Q18); wave 0 B1 starts new events on Us and says "Change it on Will's iPhone"; the synthesis puts "edit and delete for every calendar, including iCloud" first in wave 4, which also settles D3 (where shared events live).
- **Upstream Home Assistant has nothing coming:** the open CalDAV pull requests on 2026-10-29 are to-do only ([#189017](https://github.com/home-assistant/core/pull/189017), [#189018](https://github.com/home-assistant/core/pull/189018)); a request to expose update and delete for calendars is an unanswered discussion ([#3773](https://github.com/orgs/home-assistant/discussions/3773)). The development branch moved to `caldav` 3.5.0a0 ([#186667](https://github.com/home-assistant/core/pull/186667), merged 2026-10-15), so 2026.11 likely ships it **[inference]**. A rewrite from `vobject` to `icalendar` ([#176530](https://github.com/home-assistant/core/pull/176530)) was closed unmerged 2026-10-21.

## 2. What the library offers, and iCloud's habits

- `save()` PUTs the object, sending `If-Match` with the ETag it holds and raising `ETagMismatchError` on 412; `delete()` sends DELETE; `event_by_url()` GETs the object with its ETag (`caldav/calendarobjectresource.py`, `_put`, `_post_put`; `davobject.py`, `delete`).
- Saving an expanded occurrence (`only_this_recurrence=True`, the default) merges it into the series by fetching the master with `get_event_by_uid`, which is a UID search (`calendarobjectresource.py`, `save`; `collection.py`, `get_object_by_uid`).
- **iCloud refuses that search.** A user of Calendar Bridge, a custom integration that edits CalDAV events, hit `412 Precondition Failed` deleting on iCloud; its author found iCloud rejects a UID-only REPORT, and v0.4.2 falls back to loading `{calendar}/{uid}.ics`; the user confirmed it working (forum thread, posts 2026-09-25, 2026-09-26, 2026-10-01: https://community.home-assistant.io/t/custom-integration-calendar-bridge-native-reminders-and-recurring-google-caldav-events/1024874 ; code: https://github.com/Matthias2703/ha-calendar-bridge, `caldav_target.py`, `_find_event_by_uid`). The `caldav` maintainer's own iCloud notes say the same in 2021: reading and saving work, `object_by_uid` is broken, recurring-event tests were disabled (https://github.com/python-caldav/caldav/issues/3, closed 2021-03-07). The library's iCloud profile is still only those old flags, commented out (`caldav/compatibility_hints.py`).
- **So find events by time, not UID:** a time-range search is the same kind of request Home Assistant sends iCloud each time the board reads a column, then keep the object whose UID matches, then GET it by URL for fresh text and an ETag. Calendar Bridge's `{uid}.ics` guess only finds events made by a CalDAV library; whether Apple names an iPhone's events that way isn't documented, so it's a fallback at most.
- **Invitations:** under CalDAV scheduling, when the organizer's server stores a changed or deleted event that has attendees, it sends the attendees an update or a cancellation itself (RFC 6638, June 2012, sections 3.2.1.2 and 3.2.1.3). iCloud does server-side scheduling **[inference]**, so a board edit to a meeting would reach other people. The board should refuse any event with an `ATTENDEE`.
- **Not `ical` for this:** Local Calendar's library could apply the same edits, but it works in floating local times (Home Assistant strips the time zone before handing it an event, citing core issue #87759: `local_calendar/calendar.py`, `_parse_event`) and marks an edited occurrence both excluded from the series and re-added (`ical/store.py`, `GenericStore.edit`), while iCloud's events carry zoned times. CalDAV keeps one UID per calendar object, with exceptions as `RECURRENCE-ID` components inside it (RFC 4791 section 4.1; RFC 5545 section 3.8.4.4). Editing with `icalendar` (already a `caldav` dependency) changes only what the board changed and leaves the rest as Apple wrote it (lab check B).

## 3. The lab: what was tested

Radicale 3.9.0 on 127.0.0.1, `caldav` 3.3.0a1 and again 3.5.0a0, `icalendar` 6.3.1, `vobject` 0.9.9; reads done exactly as Home Assistant's `_get_events` does. Files: [icloud-editing-lab/](icloud-editing-lab/) (`caldav_write_proto.py`, the write path sized like the module the house would keep; `run_lab.py`; `radicale.conf`). Made-up events: a one-off created the way Home Assistant creates one; a weekly series written as an iPhone writes it (TZID with VTIMEZONE, an alarm, an `X-APPLE-` field, a file name that isn't the UID, crossing the 1 Nov 2026 clock change); a weekly all-day series created the way Home Assistant creates one.

| Check | 3.3.0a1 | 3.5.0a0 |
|---|---|---|
| Home Assistant-style read: every occurrence has a `recurrence_id`, e.g. `2026-10-26 09:00:00-04:00`, all-day `2026-10-27`; the one-off has none | pass | pass |
| A. Delete one occurrence (after the clock change): the rest stay; `EXDATE;TZID=America/New_York:20261109T090000` | pass | pass |
| B. Change one occurrence (title, an hour later): it keeps its `recurrence_id`, its alarm and the Apple field | pass | pass |
| C. Change it again, moving it 3 days on | pass | pass |
| D. Delete that moved occurrence, found near where it shows now | pass | pass |
| E. Change all: new title, 30 minutes later; deleted occurrences stay deleted | pass | pass |
| F. All-day series: delete one occurrence | pass (after the fix below) | pass |
| G. One-off: change, then delete | pass | pass |
| H. A phone changed it in between: the stale write is refused with 412 | pass | pass |
| I. An event with an attendee is refused | pass | pass |
| J. The library's own occurrence save works on Radicale (it is the UID-search path iCloud refuses) | pass | pass |
| K. A repeating event changed without saying which occurrence is refused | pass | pass |
| L. Delete a whole series when asked for all | pass | pass |

21 of 21 checks passed on each version. What the lab taught:

1. **`icalendar` 6.3.1 writes an all-day `EXDATE` without `VALUE=DATE`**, which RFC 5545 section 3.8.5.1 requires; Radicale refused the whole object. The write path adds the parameter itself.
2. **Search results carry no ETag in 3.3.0a1 but do in 3.5.0a0.** Written straight from a 3.3.0a1 search result, a phone's change in between was silently overwritten; from 3.5.0a0 it was refused. Re-reading by URL before writing gives the same safe result on both.
3. **Find a moved occurrence near where it shows, not near its `recurrence_id`**: the board must send the event's current start.
4. **Copy the master to make an exception**, so the occurrence keeps its alarm, notes and Apple fields; a fresh exception would drop them.
5. **Always save with `only_this_recurrence=False`**, so the library never takes the UID-search path, even when an exception happens to come first in the object.

Not tested: iCloud itself.

## 4. Staying in step

- **Home Assistant's calendar entity** caches no events, so the board's own re-read after a write (the card already calls `_fetchEvents`) goes to iCloud live and shows the change at once, assuming iCloud serves its own writes straight back **[inference]**. The entity's state (next event) refreshes every 15 minutes; after a write, `await entity.coordinator.async_request_refresh()` (a coordinator helper, debounced 10 s, runs at once) updates it, and the state write pushes fresh events to anything subscribed through `calendar/event/subscribe` (`calendar/__init__.py`, `_async_write_ha_state`). Calendar triggers poll every 15 minutes (`calendar/trigger.py`), as they already do for changes made on a phone.
- **The server's calendar copy:** the board's re-read `put`s what it found, so the copy is right for the range on screen. Other ranges (next month, after an "all" change) would show the old text for a moment until the hourly refresh; refreshing that one calendar's window in the background after each house write closes it (`async_refresh` in `calendar_cache_websocket_api.py`, limited to one calendar).
- **The phones** get the change from iCloud as they do any change **[inference]**.
- **Undo:** the write path holds the object's text from before; Undo puts it back as it was, alarms and notes included, which is better than wave 0's re-create for a deleted event and also covers a deleted occurrence.

## 5. The options

| | Option | Confidence it's the right way |
|---|---|---|
| A | A house write path inside Family Hub: its `delete_event` and `update_event` commands, for a CalDAV calendar without the native bit, edit the calendar object through the entity's own connection | 0.70 |
| B | Patch Home Assistant's CalDAV entities while running, to add the update and delete bits and methods (Home Assistant's own Calendar page would gain editing too) | 0.10 |
| C | Wait for, or contribute, update and delete in Home Assistant's CalDAV integration | 0.10 |
| D | Install Calendar Bridge and call its services | 0.05 |
| E | Don't edit iCloud; keep shared things on Us (D3 as it stands) | 0.05 |

B changes a core integration's objects from outside and has to redo it on every reload; a quiet failure there looks like a working button that does nothing. C is the best floor in the long run but isn't in the house's hands; A's tested module could be offered upstream later **[inference]**. D adds a second copy of the iCloud sign-in and an outside maintainer, and its lookup is built for events it created. E costs nothing and leaves every iCloud typo permanent from the board.

## 6. What could break

- **Home Assistant internals** the path relies on: the entity's `coordinator.calendar`, and the `recurrence_id` text (Python's `str()` of the date or date-time today). Both are checked before use; if either changes, `delete_support` reports "can't" and the board shows today's "Change it on Will's iPhone". The parser should also accept the `20261103T090000` form, in case a later rewrite like #176530 lands.
- **The library under it** changes with Home Assistant's pin (3.5.0a0 next; the lab passed on both). Only `search`, `event_by_url`, `save` and `delete` are used.
- **iCloud's own behaviour**, not tested here: whether it stores exceptions and EXDATEs as given **[inference: Apple's apps write the same shapes]**, and whether a time-range search returns a repeating series when one of its occurrences is in range (Home Assistant's reads depend on it already, but J008 notes none of the 11 Will events then in view recur).
- **Races with a phone:** the ETag check refuses the write; the board says it changed a moment ago and re-reads.
- **Calendars the owner can't write** (shared read-only, subscribed): iCloud refuses the PUT; the board says so.
- **One connection shared across threads:** Home Assistant already runs creates and reads on the same client from worker threads; this adds a few more **[inference]**.
- **Rare cases, a note and no more:** "this and following" for iCloud (it means splitting a series into two objects; not offered, the board asks "This one or all"); an exception stored with no master; an event whose time zone iCloud names oddly.

Lock-in check: none. It's standard CalDAV against the account already connected, with no new app, account or subscription; removing the code returns the board to create-only.

## 7. What it costs to own

- **Code:** one module of about 130 lines (`caldav_write.py`, no Home Assistant imports, tested on its own like `calendar_cache.py`), about 40 lines in the three Family Hub commands (route CalDAV to it, an optional `start` and `scope` on the commands, refresh the entity and the copy afterwards), and about 150 lines of tests. CI needs `icalendar` installed.
- **Watching:** read the notes of any Home Assistant release that touches `components/caldav` before taking it; the module's tests pin the shapes it relies on.
- **One-time:** a check against the real iCloud (below), and optionally Radicale plus Home Assistant's CalDAV integration in the sandbox for end-to-end checks with made-up data.

## Recommendation

**Build option A, in wave 4 as planned.** The smallest robust shape:

1. Find the event by a time-range search around where the board shows it, keep the object whose UID matches, re-read it by URL. Never search by UID.
2. Edit the object with `icalendar`: one occurrence gets an exception copied from the series; deleting one adds an `EXDATE` (with `VALUE=DATE` for all-day) and drops any exception; "all" edits the series and moves its exceptions and exclusions with it; deleting all, or a one-off, deletes the object.
3. Save with `If-Match` and `only_this_recurrence=False`; on a conflict, say so and re-read.
4. Refuse invitations, and refuse a repeating event without an occurrence and a scope. Offer "This one" and "All" only.
5. Afterwards refresh the entity and that calendar's copy, and keep the old text for Undo.

Before building, one supervised check on the real iCloud with a throwaway calendar and made-up events (add a repeating event from the board, change one occurrence, delete one, change all, delete all, look at each on an iPhone), explained to the owner first, since it touches the real account. If iCloud mangles exceptions, fall back to delete-only for repeating iCloud events, which needs only `EXDATE` and is the case Calendar Bridge's users already exercise. This unblocks D3's option B (shared events on iCloud).

## Gaps

- **Not run against iCloud.** Every iCloud statement comes from the Calendar Bridge thread (2026-09/10), the `caldav` maintainer's 2021 notes, or inference.
- Whether iCloud keeps exceptions and EXDATEs exactly as written, and whether it returns a repeating series to a time-range search (unverified on the house: no repeating iCloud events were in view when J008 measured).
- Whether iCloud does server-side scheduling for invitations (RFC 6638 says a compliant server must; Apple's documentation wasn't found).
- How Apple names an iPhone-created event's file (only matters for a fallback).
- Whether 2026.11 ships `caldav` 3.5.0a0 (inferred from the development branch).
- Write permissions on a calendar shared with Jenn, either way round.
