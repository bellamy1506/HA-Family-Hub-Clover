Research note, 2026-11-01, for [What does Calendar Card Pro do that the house board must match, and what can it borrow?](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/103).

# Calendar Card Pro's data path, and the house board's

## Answer

- **Calendar Card Pro (CCP) fetches the plain way.** It sends one REST `GET calendars/<entity>?start=…&end=…` per calendar, all at once, each with a 30-second limit. It keeps the answer in the browser's `localStorage` for 30 minutes by default and draws anything up to 24 hours old at once while it asks again. It never subscribes to calendars. It does subscribe to weather (`weather/subscribe_forecast`).
- **The house board's decided path is already ahead of it on freshness and first paint.** The house board shows the server's copy first and asks live every 60 s while shown, and at once when shown again or reconnected ([#97](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/97#issuecomment-6558650608)). Its sort is fully determined and each calendar is drawn as it answers. CCP waits for its slowest calendar before drawing a refresh. It refetches on return only after 5 minutes away, and only when its data is due. Its default refresh is every 30 minutes.
- **CCP is ahead on hardening.** Its v4 and v5 releases fixed about 30 calendar pitfalls *(a rough count from `docs/RELEASE_NOTES.md`)*, most pinned by a test. The house board will meet most of them. The ones that matter most:
  - an all-day date read as UTC lands a day early in New York;
  - an event ending at exactly midnight gains a phantom day;
  - one malformed event can blank the whole board;
  - a hung calendar request stops all refreshing;
  - a slow old answer can overwrite a newer one;
  - a poll started before a save can snap an event back;
  - date math across a clock change, which happened at the house today;
  - writing from stale data;
  - a plan merged from two calendars that can't be deleted cleanly.

  [Section 9](#9-pitfalls-the-house-board-must-also-handle) lists 29 with code and test references.
- **Worth borrowing, rewritten in plain JS** (MIT into GPL-3.0 is fine with CCP's notice kept). About 300 lines of logic and 400 of tests in all *(inferred)*:
  - four DST-safe local-date helpers;
  - splitting a timed event at local midnights;
  - one bar for a multi-day all-day event;
  - keeping a bad event from blanking the board;
  - a fetch timeout;
  - newest-answer-wins and write-generation guards;
  - keeping a failed calendar's last events;
  - the weather subscription;
  - running the date tests under real time zones.

  CCP uses no date library for date math: only native `Date` and `Intl`. It uses Day.js only for "in 2 hours" wording in 36 languages, which the house board doesn't need.
- **Five things the decided spec doesn't cover yet.**
  - Owner-visible:
    - what the face shows when a calendar fails;
    - what Change and Delete do on a plan merged from two calendars;
    - multi-day events as one bar.
  - Agent's calls:
    - no saving from stale data;
    - a guard against redrawing on every Home Assistant state change.

  See [section 11](#11-gaps-in-the-decided-spec).
- **A correction to an earlier note.** The marks research for #66 said Calendar Card Pro merges duplicates on exact title and times. It also requires the same location (`src/utils/events.ts:2104-2118`). A user asked today to drop that ([CCP #705](https://github.com/alexpfau/calendar-card-pro/issues/705)). The house rule (uid and start, then title and times, no location) stays as decided.

## Sources and method

- **CCP source** at commit `75bf292` (v5.0.0, MIT), cloned at `/tmp/ccp-src/repo`. It was read with `cat`, `grep`, `sed` and `find` only; none of its code was run. Code is cited as `path:line` at that commit. On GitHub: `https://github.com/alexpfau/calendar-card-pro/blob/75bf2925306ae8b53290c2afb696ade5b9839345/<path>#L<line>`.
- **CCP files read:**
  - all of `docs/architecture.md`;
  - the data path in `src/utils/events.ts` (3,003 lines), `src/calendar-card-pro.ts` (lifecycle, timers, `updateEvents`), `src/utils/weather.ts`, `src/utils/format.ts`, `src/utils/grid.ts`, `src/config/constants.ts`, `src/interaction/event-details.ts` and `src/translations/dayjs.ts`;
  - `vitest.config.mjs`, and the names and key passages of about 40 of its 255 test files.
- **CCP docs:** [Performance & Caching](https://calendar-card-pro.alexpfau.com/features/performance), [Architecture](https://calendar-card-pro.alexpfau.com/architecture), [Multi-day events](https://calendar-card-pro.alexpfau.com/features/multi-day-events), [Weather](https://calendar-card-pro.alexpfau.com/features/weather), [Grid view](https://calendar-card-pro.alexpfau.com/features/grid-view), and `docs/RELEASE_NOTES.md`.
- **CCP issues**, opened with WebFetch: [#192](https://github.com/alexpfau/calendar-card-pro/issues/192), [#297](https://github.com/alexpfau/calendar-card-pro/issues/297), [#171](https://github.com/alexpfau/calendar-card-pro/issues/171) and [#705](https://github.com/alexpfau/calendar-card-pro/issues/705).
- **Home Assistant:**
  - [custom card docs](https://contributors.home-assistant.io/frontend/custom-ui/card/): `hass` is "set with a new `hass` object whenever the state of Home Assistant changes";
  - the frontend's [`connection-mixin.ts`](https://github.com/home-assistant/frontend/blob/dev/src/state/connection-mixin.ts): the default `time_zone: TimeZone.local`.
- **The house board's decided path:**
  - the map [#37](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/37), "Decisions so far";
  - the decisions for [#97 load time](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/97#issuecomment-6558650608) (with its [research note](https://github.com/bellamy1506/HA-Family-Hub-Clover/blob/research/load-time/docs/research/load-time.md)), [#66 marks](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/66#issuecomment-6537455038), [#69 series uid](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/69#issuecomment-6537354279), [#43 backend reuse](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/43#issuecomment-6512554066) and [#39 iCloud write path](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/39#issuecomment-6512584295);
  - the prototype READMEs in [`prototypes/`](../../../prototypes/), [CONTEXT.md](../../../CONTEXT.md) and [switch-over.md](../../board-next/switch-over.md);
  - the fork's `custom_components/family_hub/calendar_cache.py` (branch `research/calendar-card-pro`, same as `main` for that file *(inferred)*).

## 1. Fetching

**What CCP does.**
- **Transport:** REST, through `hass.callApi('GET', 'calendars/<entity>?start=<ISO>&end=<ISO>')` (`src/utils/events.ts:2576-2585`). It doesn't use the websocket and doesn't use `calendar/event/subscribe`.
- **In parallel:** every calendar at once through `Promise.all` (`src/utils/events.ts:2578`). A calendar listed twice is asked once (`src/utils/events.ts:544-547`).
- **Each answer** is tagged with its calendar (`_entityId`, `src/utils/events.ts:2599`). A non-array answer, a throw or a timeout counts as that calendar failing; the others are unaffected (`src/utils/events.ts:2589-2620`).
- **Timeout:** 30 s per calendar (`CALENDAR_FETCH_TIMEOUT`, `src/config/constants.ts:84`; `withTimeout`, `src/utils/events.ts:2631-2638`). The constant's comment gives the reason: "`hass.callApi` has no timeout of its own, and a request that never settles used to pin the shared in-flight entry for good" (`src/config/constants.ts:77-83`).
- **The time window** (`getTimeWindow`, `src/utils/events.ts:2649-2735`):
  - It starts at local midnight of the start day: today, or a configured `start_date` such as `today+7` or `start_of_week`, parsed without a library by `src/utils/start-date.ts`.
  - It ends at `start + days_to_show` days, 23:59:59.999 local (`src/utils/events.ts:2725-2726`). Both ends go out as UTC ISO strings.
  - That's one day more than it keeps. `processRawEvents` drops events starting on or after `start + days_to_show` (`src/utils/events.ts:665-671`), so the last fetched day is thrown away *(inferred: an unexplained off-by-one, harmless except for iCloud time)*.
- **One load serves every view.** The card loads the longest `days_to_show` among the views it can show (`loadedDaysToShow`, `src/config/view.ts:2107-2111`), so switching views never fetches. Each view trims to its own window again when grouping (`src/utils/events.ts:1162`).
- **One request for many cards.** Requests for the same calendars and window share one round trip (`inFlightRawFetches`, `src/utils/events.ts:195`). The key includes the resolved window, so after midnight a new request is never joined to one still carrying yesterday (`src/utils/events.ts:186-193`, test `tests/event-fetch-resilience.test.ts:328`).

**House board (decided).**
- **Calendar data:**
  - **The copy first:** the server's copy (`calendar_cache/get`, one websocket round trip), asked in parallel with settings and themes the moment the board gets `hass`.
  - **Then live:** a REST `GET` per calendar every 60 s while shown, at once when shown again, and on reconnecting ([#97](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/97#issuecomment-6558650608), [load-time note §4.3](https://github.com/bellamy1506/HA-Family-Hub-Clover/blob/research/load-time/docs/research/load-time.md)).
  - **Sent back:** complete answers are `put` back in the API's shape.
  - **No calendar subscriptions:** iCloud only pushes on the CalDAV integration's 15-minute refresh.
- **Other data** comes from Home Assistant directly ([#43](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/43#issuecomment-6512554066)).

**Compared.**
- **Same transport.** Both use REST for live answers and both ask calendars in parallel.
- **Timeout:** the house board has none decided. It needs one; see [P11](#9-pitfalls-the-house-board-must-also-handle).
- **The window isn't decided for the live ask.** CCP's lesson is to ask once for everything the screen on show can draw, so a switch costs nothing. The house board gets that for free from the copy, which covers today −42 to +80 days. *(inferred)* The 60 s live ask should cover what's on screen: the face's four days, Month's weeks, a phone's list. The copy answers the rest, as the week card does today.
- **Don't copy CCP's extra day.** iCloud costs about 0.1 s per event ([load-time note](https://github.com/bellamy1506/HA-Family-Hub-Clover/blob/research/load-time/docs/research/load-time.md)).

## 2. Caching

**What CCP does.**
- **Where:** `localStorage`, one entry per card configuration (`writeCacheEntry`, `src/utils/events.ts:2786-2797`).
- **The key:** `cache_data_<instance id>_<sorted entity ids>_<days>_<start_date>_<first weekday>v<version>` (`src/utils/events.ts:2814-2853`). It covers only what shapes the request. Display options (`show_past_events`, `filter_duplicates`, per-calendar filters) are applied again on every read, so toggling one needs no fetch ([architecture](https://calendar-card-pro.alexpfau.com/architecture), "Smart Caching").
- **What an entry holds:**
  - the raw events as Home Assistant sent them, tagged by calendar;
  - `timestamp` and `window`;
  - `lastSuccess` per calendar;
  - on failure, `failedEntities`, `failureCount` and `retryAt`;
  - `ttlMs` for an empty answer (`src/utils/events.ts:494-527`).
- **Lifetime:**
  - **Fresh** for `refresh_interval`, 30 minutes by default (`src/config/constants.ts:19`, `getCacheDuration`, `src/utils/events.ts:2949-2951`).
  - **Drawn but due** up to 24 hours (`MAX_STALE_HOURS`, `src/config/constants.ts:34`). Read past 24 hours, the entry is deleted (`readCacheEntry`, `src/utils/events.ts:2886-2921`).
  - **Empty answers** are fresh for only 15 s (`EMPTY_RESULTS_CACHE_DURATION_SECONDS`, `src/config/constants.ts:28`; `src/utils/events.ts:522-527`). This came from [#297](https://github.com/alexpfau/calendar-card-pro/issues/297): a card that rendered before Home Assistant's connection was ready cached an empty week for 30 minutes.
- **Invalidation:**
  - **The window moved:** a different start or end (midnight, a relative start date) makes the entry due (`isEntryDue`, `src/utils/events.ts:607-631`).
  - **A write:** after a save in Home Assistant's dialogs the card refetches. A page-wide counter on `globalThis` makes later loads ignore any request that started before the write (`advanceWriteGeneration`, `src/utils/events.ts:152-177`). Only the newest request for a key may write the cache (`latestRequestSeq`, `src/utils/events.ts:203` and `:529`).
  - **A corrupt entry**, one that parses but isn't the right shape, is removed and refetched (`isCacheEntryShape`, `src/utils/events.ts:2862-2878`). A string `events` once rendered garbage *and* counted as a hit (RELEASE_NOTES.md:505).
- **Paged windows** stay in memory only: 16 entries, least recently used dropped (`PAGE_STORE_LIMIT`, `src/utils/events.ts:53-131`). The reason given: "a wall tablet paging for a week would otherwise leave hundreds of entries in a store shared with Home Assistant" (`src/utils/events.ts:44-49`).
- **Nothing prunes old keys.** Entries are only deleted when read. The key includes the card version and configuration, so every upgrade or edit leaves its old entry in `localStorage` for good *(inferred from the code; no `localStorage.key()` walk exists in `src/`)*.

**House board (decided).**
- **The shared copy:** one copy per calendar in the server's memory, never on disk (`custom_components/family_hub/calendar_cache.py:1-16`).
  - **Its window** is today −42 to +80 days, refreshed hourly.
  - **Board answers** freshen it: every board's `put` replaces that range's events and widens the window (`calendar_cache.py:110-127`).
  - **A `get` returns** a calendar only if its copy covers the whole range (`calendar_cache.py:89-98`).
  - **Bounds:** 2,000 events and 200 days per calendar (`calendar_cache.py:24-26`).
- **Decided additions:**
  - "refresh after a miss", so phones don't wait up to an hour after a restart;
  - the board takes over keeping the copy fresh from the week card ([#97](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/97#issuecomment-6558650608)).

**Compared.**

| | CCP | House board |
|---|---|---|
| Where | each browser's `localStorage` | Home Assistant's memory, shared by every copy |
| How fresh on open | up to 24 h old, then a refetch | as fresh as the last board's live check, usually under a minute while the wall is on |
| A phone with an empty cache | waits for the slowest calendar | one websocket round trip |
| After a Home Assistant restart | still has its own copy | empty until "refresh after a miss" or the hourly refresh |
| After a calendar write | page-wide write counter, refetch | iCloud path refreshes the entity and that calendar's copy ([#39](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/39#issuecomment-6512584295) step 5) |
| Growth | old keys never pruned | bounded per calendar |

The house design is the better one for a wall plus two phones. Two CCP lessons carry over:
- **Never put an empty answer over a full copy without a second look.** CCP's 15-second rule exists because Home Assistant can answer empty while starting. Put back, an empty answer would blank that range on every copy until the next check *(inferred; see [P14](#9-pitfalls-the-house-board-must-also-handle))*.
- **If the house board keeps anything in `localStorage`** (event shapes, first-seen marks), check its shape on read, survive quota errors and prune old keys. The week card already prunes its shape layouts to the 4 most recent ([card map](../../agents/card-map.md), "Browser storage keys"). CCP doesn't.

## 3. Refresh timing and triggers

**What CCP does.** Every load names one of six modes (`updateEvents`, `src/calendar-card-pro.ts:3688-3866`; table in the [architecture page](https://calendar-card-pro.alexpfau.com/architecture), "Event Data Flow").

| Trigger | CCP | Code |
|---|---|---|
| Card appears (page load, dashboard opened, back to its view) | draws the cache, then refetches in the background if `refresh_on_navigate` (default on) and the data is at least 5 s old | `src/calendar-card-pro.ts:1383-1391`, `:3771-3778`; `src/config/constants.ts:26` |
| Timer | armed for the data's own deadline: `refresh_interval` after it was fetched, default 30 min, or the retry time while a calendar fails | `_scheduleRefresh`, `src/calendar-card-pro.ts:2964-2985` |
| Tab shown again | refetches only if more than 5 minutes since the last good load *and* the cache is due | `_handleVisibilityChange`, `src/calendar-card-pro.ts:2872-2892`; `VISIBILITY_REFRESH_THRESHOLD`, `src/config/constants.ts:75` |
| Local midnight | grid view with its now line refetches when the day key changes, including a change that happened while hidden; column and grid views that drop days re-render just after midnight and load if the window moved; list view has no midnight timer and waits for its refresh timer | `src/calendar-card-pro.ts:1593-1620`, `:1636-1664`, `:1755-1760` |
| Next event start or end | repaints only, no fetch, so an event turns "now" and then past on time | `nextEventBoundary`, `src/utils/events.ts:2451-2470`; `src/calendar-card-pro.ts:1693-1736` |
| After a write in Home Assistant's dialogs | refetches at once, never joining a request from before the write; tells other cards on the page | `src/calendar-card-pro.ts:558`, `:596`, `:3657-3659`; `src/interaction/calendar-changes.ts` |
| Refresh button | refetches now | `_requestRefresh`, `src/calendar-card-pro.ts:4701` |
| `hass` missing at start | retries every 1.5 s until it arrives | `src/calendar-card-pro.ts:3718-3726`; test `tests/initial-load-retry.test.ts:101` |
| Websocket reconnect | **nothing** for calendars; the weather subscription is resubscribed by Home Assistant's websocket library *(per the [load-time note](https://github.com/bellamy1506/HA-Family-Hub-Clover/blob/research/load-time/docs/research/load-time.md) §3)* | none |
| Hidden tab | now-line and boundary timers stop; the refresh timer keeps running | `src/calendar-card-pro.ts:1594`, `:1695` |

**Two timing bugs CCP fixed that a poller can repeat:**
- **The interval doubled.** Arming the timer "one interval from now" before the fetch had written the cache made every other tick find the cache too young, so 30 minutes behaved as an hour (RELEASE_NOTES.md:219; comment at `src/calendar-card-pro.ts:2949-2951`).
- **`setTimeout` overflow.** A delay over 2^31−1 ms (24.8 days) fires at once and loops, so delays are capped (`src/calendar-card-pro.ts:2975-2977`, `:1729`).

**House board (decided).** It re-asks every 60 s while shown, and at once when shown again (#67: the iPhone app no longer refreshes a page). On becoming visible and on reconnecting, it recomputes today and draws what it has at once, then re-asks every calendar ([load-time note §4.3](https://github.com/bellamy1506/HA-Family-Hub-Clover/blob/research/load-time/docs/research/load-time.md)). The wall reloads after 5 minutes idle only when it's away from the house board ([switch-over 1c](../../board-next/switch-over.md)). The minute clock is the only change at rest ([#72](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/72#issuecomment-6537563054)).

**Compared.** The house board is stricter everywhere:
- 60 s against 30 min;
- at once on return against "after 5 minutes, if due";
- reconnect handled against not handled.

CCP has three things the house board should copy *(inferred)*:
- **Keep a day key across sleeps.** If the minute tick finds a new local day, redraw from the copy and re-ask for the new range. CCP does this only in grid view; its list view can show a missing last day for up to 30 minutes after midnight.
- **Arm the 60 s re-ask from when the last answer landed,** not from when it was asked, and never let a slow answer start a second overlapping poll.
- **Cap every `setTimeout` at 2^31−1 ms** (countdowns and hand-off timers can reach far ahead).

## 4. Event processing

### 4.1 Malformed events

`keepWellFormedEvents` (`src/utils/events.ts:731-806`) runs before anything else, because "an exception thrown while grouping does not cost that one event a row: it costs the whole card" (`src/utils/events.ts:707-710`). It applies five rules:
- **Non-string text drops the event:** a title, place or details that isn't text (`:750`).
- **A timed event with no end, or an end before its start, is kept as an instant at its start** (`:752-771`). It's compared as instants, so a fall-back event whose clock only looks backwards (`01:30+02:00` to `01:15+01:00`) is left alone (`:756-760`; test `tests/bad-event-end.test.ts:165`).
- **An all-day event whose end isn't after its start is dropped** (`:788`).
- **Impossible all-day dates are dropped:** a date such as June 31 must read back as itself (`:777-786`).
- **Events are never changed in place.** The original is the cache's, shared with other cards. A repaired event is a copy carrying `_source`, the event as received (`:766-771`).

Tests: `tests/malformed-event-payload.test.ts:109`, `:150`; `tests/bad-event-end.test.ts:136`, `:197`.

House board: nothing decided; it needs the same guard ([P7](#9-pitfalls-the-house-board-must-also-handle)).

### 4.2 All-day detection

- **All-day means no `start.dateTime`,** everywhere in the card (`src/utils/events.ts:1132`, `:2009-2017`).
- **Dates are parsed as local midnight,** never with `new Date('YYYY-MM-DD')`, which reads UTC and puts all-day events a day early west of UTC (`parseAllDayDate`, `src/utils/format.ts:496-500`). That was CCP's early bug [#28](https://github.com/alexpfau/calendar-card-pro/issues/28). The test runs under New York because "neither original zone can observe it" (`vitest.config.mjs:52-58`; `tests/all-day-parse.dst.test.ts:53`, `:67`).
- **The end date is exclusive:** the last covered day is `end.date` minus one (`src/utils/events.ts:1137-1145`; `src/utils/grid.ts:1548`).
- **An all-day event stays until midnight after its last day,** not midnight before it. Before v4, past all-day events never expired (`allDayExpiryInstant`, `src/utils/events.ts:983-1009`; test `tests/allday-expiry.test.ts:174-192`).

House board: all-day events are a tinted bar at the top of their day ([resting face](../../../prototypes/resting-face/README.md), [phones](../../../prototypes/phones/README.md)). The same four rules apply.

### 4.3 Multi-day events

CCP has two splitters:
- **List and column** (`splitMultiDayEvent`, `src/utils/events.ts:1862-1975`, when `split_multiday_events` is on). A timed event becomes a first-day part to 23:59:59.999, all-day middle days and a last-day part from 00:00. An end at exactly midnight adds no day (`:1897-1901`; RELEASE_NOTES.md:500 and :207 were two separate phantom-day bugs).
- **Grid** (`splitTimedEventByDay`, `src/utils/grid.ts:1401-1460`). Every part stays timed: 00:00 to 24:00 for a middle day. Zero-length parts are dropped, but a zero-length *event* is kept as an instant (`:1427-1440`).

Days are walked by date parts (`addDays`, `src/utils/grid.ts:280-282`), so a 23- or 25-hour day still ends at local midnight.

- **All-day multi-day events** become one banner across the columns they cover, marked when they continue past either edge (`computeBannerPlacement`, `src/utils/grid.ts:1536-1573`). Its comment: "One banner spanning its days, rather than one chip per day, is what makes a multi-day event read as one thing."
- **An event already running** when the window opens lands on the first day shown (`resolveDisplayDate`, `src/utils/events.ts:916-921`; test `tests/event-window-boundaries.test.ts:108`).
- **Each part keeps a link to its whole event,** so the dialog edits the real event, never a part (`_sourceStart`, `_gridSource`, `_source`; `src/utils/events.ts:1884`, `:1907`, `src/interaction/event-details.ts:61-80`).

Tests: `tests/multiday-midnight.dst.test.ts:74`, `:87`; `tests/grid-geometry.dst.test.ts:247-330`; `tests/grid-daily-coverage.test.ts:212`, `:260`.

House board: the wall's Month prototype notes "an event spanning days should be one bar across them … both reviewers read it as two entries" ([wall Month and Lists](../../../prototypes/wall-month-lists/README.md), "Not drawn"). Timed events that cross midnight aren't decided. CCP's grid splitter (every part timed, shown on each day it touches) fits the day columns, the phones' list and the Next band *(inferred)*.

### 4.4 Time zones

- **CCP uses the browser's time zone and nothing else.** All math uses local `Date` getters. `Intl` formatting never gets a `timeZone`. The only zone-aware line in `src/` is the repeated-hour check in grid geometry (`src/utils/grid.ts:1488-1495`). Home Assistant's own profile setting ("use server time zone", `hass.locale.time_zone`) is ignored. Home Assistant's frontend defaults to the local zone ([`connection-mixin.ts`](https://github.com/home-assistant/frontend/blob/dev/src/state/connection-mixin.ts), `time_zone: TimeZone.local`), so CCP matches the default.
- **Events arrive with offsets** (Home Assistant writes server-zone ISO strings) and are compared as instants. Only all-day dates are zone-free.
- **Testing.** The suite pins `TZ=UTC`, then runs every `*.dst.test.ts` file three more times under Europe/Berlin, Australia/Sydney and America/New_York (`vitest.config.mjs:30-72`). The reasons are given in its comments:
  - under UTC, reading `getUTCHours()` where `getHours()` was meant passes every test;
  - week-number math was wrong "for roughly one date in seven" in real zones while passing under UTC;
  - only a zone behind UTC catches date-only strings read as UTC.

  The time-zone test checks against `Intl.DateTimeFormat` with an explicit zone rather than the `Date` getters it tests (`tests/event-time-zone.dst.test.ts:36-60`).

House board: nothing decided. *(inferred)* Use the browser's zone like CCP, Home Assistant's default and the iPhone's Calendar. The house runs on Eastern time, and the wall and both phones are normally there.

The fork's own tests run under whatever zone the machine has. This session's container is `TZ=America/New_York`. `.github/workflows/tests.yml` sets no `TZ`, so CI runs under GitHub's default, UTC *(inferred)*. A zone bug can pass one and fail the other. Run the date tests under America/New_York and one zone ahead of UTC on purpose, and pin "now" to the two clock-change nights. **The house's clocks fell back today, 2026-11-01**; the next change is 2027-03-14.

### 4.5 Recurring events

- **CCP does no recurrence work.** Home Assistant expands occurrences.
- **It passes through** `uid`, `recurrence_id`, `rrule` and `status` untouched in `_source` (`sourceEvent`, `src/utils/events.ts:686-699`).
- **It hands them to Home Assistant's own detail and edit dialogs**, which handle "this one / all" (`src/interaction/event-details.ts:61-80`; `src/interaction/ha-calendar-dialogs.ts:1-9`).
- **Edit and Delete need a `uid`** (`src/interaction/event-details.ts:123`).

House board:
- **Series are recognized by `uid`,** never `rrule`, which iCloud never sends ([#69](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/69#issuecomment-6537354279)).
- **"This one / All" goes through the house's own iCloud write path,** which finds events by time, then UID ([#39](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/39#issuecomment-6512584295)).
- **Nothing to borrow** but the habit of keeping the fetched event untouched beside its display copies ([P29](#9-pitfalls-the-house-board-must-also-handle)).

### 4.6 Sorting

CCP sorts each day this way (`src/utils/events.ts:1450-1482`):
- all-day first;
- then by start;
- all-day ties by configured calendar order, then title (case-insensitive);
- timed events starting together keep their arrival order, which a test pins (`tests/event-sort-order.test.ts:107`).

Arrival order is calendar order, except that a failed calendar's kept events are appended last (`src/utils/events.ts:492`). So the order can change when a calendar fails *(inferred)*.

House board: start, then end, then title, then `uid` ([load-time note §4.3](https://github.com/bellamy1506/HA-Family-Hub-Clover/blob/research/load-time/docs/research/load-time.md)). It's fully determined, which the decided copy-against-live comparison needs. Keep all-day first, as CCP and every calendar app do. The house's order is better; nothing to borrow.

### 4.7 Duplicates across calendars

- **Off by default** (`filter_duplicates: false`, `src/config/config.ts:29`).
- **The match:** title, start, end and location (`generateEventSignature`, `src/utils/events.ts:2104-2118`).
  - Timed times are compared as instants (epoch ms), so `-05:00` and `Z` spellings of one time match.
  - All-day dates are compared as strings.
- **The first-listed calendar's copy wins.** The row records every calendar that held it (`_mergedFrom`), so it can show both labels and a `duplicate_accent_color` (`deduplicateEvents`, `src/utils/events.ts:826-905`).
- **Filter first, then merge.** Expiry, weekday filters and the hidden calendars all run before the winner is chosen. Otherwise "a filtered first calendar also discards the eligible copy behind it" (`src/utils/events.ts:1233-1262`; RELEASE_NOTES.md:206; tests `tests/duplicate-eligibility.test.ts:63`, `:87`).
- **A merged row offers no Edit or Delete:** "Editing one copy of a shared event is ambiguous, and deleting one brings the row straight back from the other calendar, which reads as a failed delete" (`src/interaction/event-details.ts:99-101`, `:123`).
- **Location** blocks a merge ([#705](https://github.com/alexpfau/calendar-card-pro/issues/705), opened today; the maintainer keeps it, with an option to come).

House board: the same plan on two calendars shows once, in Us's green with both names ([marks](../../../prototypes/marks/README.md)). It matches by `uid` and start first, then exact title and times, nothing fuzzy ([#66](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/66#issuecomment-6537455038)). That's better than CCP for invitations: one invitation on Will's iCloud and Jenn's Google shares a `uid` even if one side renamed it *(inferred from how invitations work; not checked against Google's integration)*. Borrow three details:
- compare times as instants;
- filter (Hide, Guest mode, work, past) before merging;
- keep the list of contributing calendars on the merged row.

The open question is what the sheet does with a merged row ([section 11](#11-gaps-in-the-decided-spec)).

### 4.8 Filtering

CCP filters per calendar:
- an allow and block regular expression on title, place or details, applied to the event as received, never the display text (`src/utils/events.ts:2039-2100`);
- timed or all-day only (`:1980-2017`);
- weekdays or weekends (`:1025-1063`);
- an all-day expiry time of day for bin-day feeds (`:983-1009`).

Card-wide, `show_past_events` hides ended events (`:1180-1210`). The calendar filter hides what's drawn, never what's loaded, so a press fetches nothing ([architecture](https://calendar-card-pro.alexpfau.com/architecture), "Header Toolbar").

House board: its filters are its own:
- per-calendar Detail (titles, a labeled block or nothing);
- work flag, Guest mode and per-event Hide ([#61 decisions](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/61#issuecomment-6536915357));
- a person filter in Month and Upcoming ([#98](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/98#issuecomment-6559117623)).

CCP's one transferable rule: filter at draw time from loaded data, so turning a filter or Guest mode on or off never fetches.

## 5. Errors and slow calendars

- **Success is judged per calendar,** never by event count. An empty answer beside a failure is a partial failure (`src/utils/events.ts:438-443`; test `tests/event-fetch-resilience.test.ts:178`).
- **A failed calendar keeps its last loaded events for up to 24 hours,** in the shared cache entry (`src/utils/events.ts:479-493`, `paintableEvents` `:639-646`; tests `tests/event-fetch-resilience.test.ts:190`, `:207`).
- **Every failure is written to the cache, a total one included,** "so a card sharing the key does not read the old entry as healthy" (`:501-520`; test `:258`). Before v5, an incomplete result was cached as complete, and the card "showed the remaining calendars and logged nothing at all" (RELEASE_NOTES.md:221).
- **Retries:** after 1 minute, then 2, 4 and so on, capped at the refresh interval, in one backoff for every card sharing the entry (`retryDelayMs`, `src/utils/events.ts:570-574`; test `tests/event-fetch-resilience.test.ts:226`).
- **What the screen shows:** the old events, plus a line at the card's foot, "Couldn't load: Ben", in the theme's error color (`src/rendering/render.ts:231-240`; `loadFailed` in `src/translations/languages/en.json:16`). Nothing says how old the kept events are. If nothing loaded and nothing is kept, only the line shows (`src/calendar-card-pro.ts:4060-4064`).
- **No Edit or Delete for a failing calendar's events,** "which may be a day out of date" ([Performance](https://calendar-card-pro.alexpfau.com/features/performance), "When a Calendar Fails to Load"; `src/interaction/event-details.ts:102-104`, `:123`).
- **Slow calendars hold back the refresh.** `Promise.all` waits for the slowest calendar, so a refresh redraws once, when the last answer (iCloud, typically) is in. The cache is drawn first, so the wait shows only with nothing cached. Then the card shows its loading line until every calendar answers or times out (`src/calendar-card-pro.ts:4056-4057`).
- **Stale answers are dropped.** A ticket taken before any await means an answer to a request since replaced (a config change, a disconnect) never reaches the screen (`src/calendar-card-pro.ts:3704-3705`, `:1437-1442`; test `tests/update-events-race.test.ts:136-147`).

House board (decided): each calendar fills in as it answers. Next and needs-you wait until every calendar is in, and every box is reserved, so a late iCloud answer moves nothing ([#97](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/97#issuecomment-6558650608)). That's better than CCP's all-or-nothing. Each copy records its last errors in Home Assistant ([switch-over, slice 1](../../board-next/switch-over.md)). Three things are not decided:
- **A timeout.**
- **Keeping a failed calendar's last events.** The copy gives this for free if the board leaves the copy's events up when a live ask fails, and never `put`s a failure.
- **What the face shows when a calendar fails.** See [section 11](#11-gaps-in-the-decided-spec).

## 6. Weather

**What CCP does.**
- **Subscription:** `weather/subscribe_forecast` through `hass.connection.subscribeMessage`, one per forecast type (`subscribeToWeatherForecast`, `src/utils/weather.ts:350-388`). It never polls. Home Assistant's websocket library resubscribes after a reconnect *(per the [load-time note](https://github.com/bellamy1506/HA-Family-Hub-Clover/blob/research/load-time/docs/research/load-time.md) §3)*.
- **Which types:** daily for the day headers; daily and hourly for weather beside events; none when hidden (`getRequiredForecastTypes`, `src/utils/weather.ts:47-69`).
- **Keys:** daily entries by local date; hourly entries by local date and hour (`processForecastData`, `src/utils/weather.ts:72-120`).
- **Fields kept:** condition, temperature, low, UV index and `is_daytime`. **Precipitation and precipitation probability are not read** (`:109-117`).
- **Matching to an event:** the exact local hour, else the nearest hour on the same day, never a neighbor day. A timed event past the hourly horizon falls back to the daily forecast if allowed; all-day events always use the daily (`findForecastForEvent`, `:156-210`; tests `tests/weather-forecast-matching.test.ts:97-130`, `tests/weather-hourly-key.dst.test.ts:69`).
- **Night icons:** chosen from the forecast's own `is_daytime`, else 18:00 to 06:00 local (`isNightForecast`, `:262-268`).
- **Stale deliveries:** a version ticket drops forecasts that arrive after the entity changed or the card left (`src/calendar-card-pro.ts:3013-3058`; tests `tests/weather-stale-callback.test.ts:77`, `tests/weather-subscription-lifecycle.test.ts:232`).
- **Not cached** between opens. The weather box is empty until the first message.
- **Horizon:** the docs say hourly forecasts reach "about two days ahead" and daily "six days or more, depending on the provider" ([Weather](https://calendar-card-pro.alexpfau.com/features/weather), "How Far Forecasts Reach").

**House board (decided).**
- **The face:** today's high and low with one icon, and one rain line while rain is still ahead in waking hours ("Rain from 2 pm", then "Rain until 9 pm"), stated and never an instruction ([resting face](../../../prototypes/resting-face/README.md)).
- **Month:** weather on the next 10 days ([wall Month and Lists](../../../prototypes/wall-month-lists/README.md)).
- **Source:** weather from Home Assistant directly ([#43](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/43#issuecomment-6512554066)), with every box reserved.

**Compared.**
- **Borrow the subscription and the local-date and local-hour keys:** about 30 lines.
- **Nothing in CCP builds the rain line.** It needs the hourly condition and, if the house's weather integration supplies it, `precipitation_probability` *(not checked)*.
- **Check the house weather entity's daily horizon before building Month's 10 days.** By CCP's docs, many providers give 6 or 7 days *(the house's provider was not checked)*.
- **A possible trap:** a provider that stamps a daily entry at UTC midnight would land on the previous evening in New York, so CCP's local-date key would file it a day early. CCP doesn't guard against this *(inferred; check with the house entity's real forecast)*.

## 7. Date math and libraries

- **CCP's dependencies are Lit, `@mdi/js` and Day.js** (`package.json`, "dependencies"). Day.js, with its `relativeTime` plugin and 36 locales, is used only for relative phrases such as "in 2 hours" (`src/translations/dayjs.ts:1-45`). Even there it prefers `Intl.RelativeTimeFormat` for days and hours (`getRelativeUnitString`, `:52-65`).
- **All date math is native `Date` on local parts.** The four helpers that make it DST-safe:
  - `parseAllDayDate`: `new Date(y, m-1, d)` (`src/utils/format.ts:496-500`);
  - `getLocalDateKey`: `YYYY-MM-DD` from local parts (`:508-510`);
  - `addDays` and `startOfDay`, by date parts and never by adding 86,400,000 ms (`src/utils/grid.ts:266-282`);
  - `getCalendarDayDiff`, whole days from `Date.UTC` of each date's local parts (`src/utils/format.ts:685-690`). Plain subtraction "loses an hour across a spring-forward, so a plain `Math.floor` returns one day short" (`:670-683`).
- **Countdowns count calendar days,** not 24-hour blocks. A fix for "in 2 days" and "in 4 days" on consecutive dates (`getCountdownString`, `src/utils/format.ts:195-232`; RELEASE_NOTES.md:280; tests `tests/countdown-calendar-days.dst.test.ts`).

House board: no library, per [#44](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/44). The four helpers are about 15 lines. Countdowns ("Beach trip in 12 days", [CONTEXT.md](../../../CONTEXT.md)) need `getCalendarDayDiff` and `Intl.RelativeTimeFormat('en')`, about 10 lines. Day.js isn't needed.

## 8. Render performance

- **Rendering:** Lit (`src/calendar-card-pro.ts:324-344`). `hass` is a plain reactive property with no `shouldUpdate` anywhere in `src/`, so the card renders again every time Home Assistant hands it a new `hass`. That's "on every change in the home" ([custom card docs](https://contributors.home-assistant.io/frontend/custom-ui/card/)). CCP's own comment calls these "the renders hass causes" (`src/calendar-card-pro.ts:1701`).
- **Each render groups all events again** (`groupedEvents`, `src/calendar-card-pro.ts:1016-1025`, calling `groupEventsByDay`). The visible-count memo keys on `Date.now()`, so it never hits across renders (`src/calendar-card-pro.ts:1286-1300`). Lit's diff keeps changes to the page small, but the JavaScript runs every time.
- **Event rows are keyed by calendar, title and position** (`${_entityId}-${summary}-${index}`, `src/rendering/render.ts:543-545`, `src/rendering/column.ts:272-274`, `src/rendering/grid.ts:1741-1743`). So an event added early in a day changes the keys of every row after it, and those rows are rebuilt *(inferred from Lit's `repeat` semantics)*.
- **Timers:**
  - a 60 s now line in grid view only (`src/config/constants.ts:146`);
  - a boundary timer that wakes at the next event start or end (`src/calendar-card-pro.ts:1693-1736`);
  - a midnight timer only while column or grid view drops days.

  All of them stop while the tab is hidden.
- **Layout work** is done with ResizeObserver plus a settle delay, and `fonts.ready` for text fitting (`src/calendar-card-pro.ts:1485-1560`).

House board (decided, [#72](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/72#issuecomment-6537563054) and [#97](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/97#issuecomment-6558650608)):
- nothing redrawn at rest but the minute and real changes;
- update only what changed;
- compare the copy and live per day, and redraw only days that changed;
- animate only transform and opacity.

That rules out CCP's approach. The house board needs:
- **A `hass` guard.** Act only when one of the few entities it reads changes (the Guest mode switch, the weather entity's state). A state object is replaced when it changes, so comparing by identity is enough: about 8 lines *(inferred)*.
- **Rows keyed by `uid` and start,** the #66 identity, not by position.

## 9. Pitfalls the house board must also handle

Port sizes are plain JS without comments, plus tests, written fresh in the house's style *(inferred estimates)*. "House now" says where the decided spec stands. "yes" means decided; "no" means not decided.

| # | Pitfall | CCP code | CCP test | House now | Port |
|---|---|---|---|---|---|
| P1 | An all-day `YYYY-MM-DD` read with `new Date()` is UTC midnight: a day early in New York | `src/utils/format.ts:496-500` | `tests/all-day-parse.dst.test.ts:53`, `:67` | no | 4 lines, 15 test |
| P2 | All-day end dates are exclusive | `src/utils/events.ts:1137-1145`; `src/utils/grid.ts:1548` | `tests/grid-geometry.dst.test.ts:306` | no | in P1 and P5 |
| P3 | Day math across a clock change (add days by parts; count days in UTC from local parts); the house changed clocks today | `src/utils/grid.ts:266-282`; `src/utils/format.ts:685-690` | `tests/grid-geometry.dst.test.ts:157-186`; `tests/countdown-calendar-days.dst.test.ts` | no | 8 lines, 30 test |
| P4 | A timed event crossing midnight shows on each day it touches; an end at exactly 00:00 adds no day | `src/utils/grid.ts:1401-1460`; `src/utils/events.ts:1897-1901` | `tests/multiday-midnight.dst.test.ts:74`, `:87`; `tests/grid-daily-coverage.test.ts:260`; `tests/grid-geometry.dst.test.ts:283` | no | 30 lines, 50 test |
| P5 | A multi-day all-day event as one bar, marked where it runs past the view | `src/utils/grid.ts:1336-1370`, `:1536-1573` | `tests/grid-geometry.dst.test.ts:306`, `:330`; `tests/grid-daily-coverage.test.ts:212` | no (noted "not drawn" in Month) | 35 lines, 40 test |
| P6 | An event already running when the view opens belongs on its first day | `src/utils/events.ts:916-921` | `tests/event-window-boundaries.test.ts:108` | no | 5 lines |
| P7 | One malformed event (no end, end before start, non-text title, impossible date) must cost one event, not the board | `src/utils/events.ts:731-806` | `tests/malformed-event-payload.test.ts:109`, `:150`; `tests/bad-event-end.test.ts:136`, `:165`, `:197` | no | 25 lines, 40 test |
| P8 | A zero-length event (start = end) is kept as an instant at its start | `src/utils/grid.ts:1427-1440`; `src/utils/events.ts:752-771` | `tests/zero-duration-events.test.ts:190`; `tests/zero-duration-events.dst.test.ts` | no | in P4 and P7 |
| P9 | A fully determined sort, so copy and live compare equal | `src/utils/events.ts:1450-1482` (ties left to arrival) | `tests/event-sort-order.test.ts:83-138` | yes, start, end, title, `uid` | 12 lines |
| P10 | Duplicates: compare instants, filter before choosing, keep every contributor | `src/utils/events.ts:826-905`, `:1233-1262`, `:2104-2118` | `tests/duplicate-signature.test.ts:83-119`; `tests/duplicate-eligibility.test.ts:63`, `:87` | yes, `uid` and start, then title and times (#66); filter order not decided | 30 lines, 40 test |
| P11 | `hass.callApi` has no timeout; one hung request stops every later refresh | `src/utils/events.ts:2631-2638`; `src/config/constants.ts:77-84` | `tests/event-fetch-resilience.test.ts:151` | no | 8 lines, 20 test |
| P12 | Judge success per calendar; keep a failed calendar's last events; say which failed | `src/utils/events.ts:479-520`, `:639-646`; `src/rendering/render.ts:231-240` | `tests/event-fetch-resilience.test.ts:178`, `:190`, `:207`, `:258` | partly (the copy); display no | 20 lines, 30 test |
| P13 | Back off on repeated failure (1, 2, 4 min, capped) | `src/utils/events.ts:570-597` | `tests/event-fetch-resilience.test.ts:226` | no (60 s poll) | 4 lines |
| P14 | Home Assistant can answer empty while starting; don't treat it as truth for long (and never `put` it over a full copy) | `src/utils/events.ts:522-527`; `src/config/constants.ts:28`; [#297](https://github.com/alexpfau/calendar-card-pro/issues/297) | `tests/event-cache-lifecycle.test.ts:92` | no | 6 lines, 15 test |
| P15 | A slow old answer must not overwrite a newer one; the newest request wins | `src/calendar-card-pro.ts:3704-3705`; `src/utils/events.ts:195-203`, `:529` | `tests/update-events-race.test.ts:136-147`; `tests/event-fetch-resilience.test.ts:276` | no | 10 lines, 25 test |
| P16 | After a save, a poll that started before it carries the old event and snaps it back | `src/utils/events.ts:152-177`, `:322-330` | `tests/event-fetch-resilience.test.ts:276`, `:307`; `tests/dialog-writes.test.ts` | no | 10 lines, 25 test |
| P17 | Midnight: a request or a day key from yesterday must not be reused; a day that passed while asleep must be noticed | `src/utils/events.ts:186-193`; `src/calendar-card-pro.ts:1606-1617`, `:1636-1664` | `tests/event-fetch-resilience.test.ts:328` | yes, "recompute today" on wake; minute tick no | 10 lines, 20 test |
| P18 | Shown again: draw at once, then re-ask | `src/calendar-card-pro.ts:2872-2892` (only after 5 min, if due) | `tests/refresh.test.ts` | yes, at once (#67, #97) | 10 lines |
| P19 | Websocket reconnect: one-off requests aren't repeated | none in CCP | none | yes, re-ask on reconnect (#97) | 5 lines *(inferred: `hass.connection` `ready` event)* |
| P20 | `hass` arrives on every state change in the house | none in CCP (renders every time) | none | yes, "update only what changed" (#72); guard no | 8 lines, 15 test |
| P21 | `setTimeout` over 2^31−1 ms fires at once | `src/calendar-card-pro.ts:2975-2977`, `:1729` | none found | no | 1 line |
| P22 | Browser storage: check shape on read, survive quota errors, bound size, prune old keys (CCP never prunes) | `src/utils/events.ts:2786-2797`, `:2862-2921`, `:53-131` | `tests/event-cache.test.ts`; `tests/event-cache-lifecycle.test.ts:131`, `:145` | only if the board stores anything locally | 15 lines |
| P23 | Time zone: one zone everywhere; tests under real zones, not only the machine's | `vitest.config.mjs:30-72`; `tests/event-time-zone.dst.test.ts:36-60` | the `*.dst.test.ts` files | no (local New York, CI UTC) | 3 lines in `tests/run_all.sh` |
| P24 | Weather keyed by local date and hour; never borrow a neighbor day's hour; drop late deliveries | `src/utils/weather.ts:72-120`, `:156-210`; `src/calendar-card-pro.ts:3013-3058` | `tests/weather-hourly-key.dst.test.ts:69`; `tests/weather-forecast-matching.test.ts:130`; `tests/weather-stale-callback.test.ts:77` | no | 30 lines, 30 test |
| P25 | Google details arrive as HTML (`&nbsp;`, `<br>`) | `src/utils/format.ts:464-472`; comments at `src/utils/events.ts:1315-1316`, `:1359` | `tests/strip-html-tags.test.ts` | no (Details shown and changeable, #98) | 5 lines, plus a write rule |
| P26 | Never save from stale data | `src/interaction/event-details.ts:102-104`, `:123` | `tests/event-details.test.ts` | partly: iCloud `If-Match` (#39); Google and Home Assistant's local calendar no | 3 lines |
| P27 | Trim events to the window by start; bound split parts to the window | `src/utils/events.ts:665-671`, `:1162` | `tests/event-window-boundaries.test.ts:75`, `:91` | no | 4 lines |
| P28 | A same-day all-day event stays all day; expires at midnight after its last day | `src/utils/events.ts:983-1009`, `:1180-1210` | `tests/allday-expiry.test.ts:121-192` | no | 4 lines |
| P29 | Write from the event as fetched, never from a day's part or display text (a block label, a trimmed title) | `src/utils/events.ts:686-699`; `src/interaction/event-details.ts:61-80` | `tests/event-details.test.ts` | no (Guest-mode blocks and split days will make this real) | 2 lines per split |

## 10. What to borrow, and how

**License.** CCP is MIT (`LICENSE`, "Copyright (c) 2025 Alex Pfau"); the fork is GPL-3.0. MIT code may go into a GPL-3.0 work; MIT's one condition is that "the above copyright notice and this permission notice shall be included in all copies or substantial portions". *(inferred, not legal advice)*
- **Rewrite rather than paste:** CCP is TypeScript with Lit, and the house board is plain ES modules ([#44](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/44)).
- **Credit it in the module:** a one-line credit naming CCP, commit `75bf292` and the file.
- **For any function kept close to the original,** add CCP's copyright line and the MIT notice to a third-party notice in the fork.

**Worth borrowing** (ordered by value for the house board) *(sizes inferred)*:

| What | From | Size | Saves |
|---|---|---|---|
| Four local-date helpers | `src/utils/format.ts:496-510`, `:685-690`; `src/utils/grid.ts:266-282` | 15 lines | DST and west-of-UTC bugs on every date the board touches, today included |
| Real-zone test runs and the `Intl` oracle | `vitest.config.mjs:30-72`; `tests/event-time-zone.dst.test.ts:36-60` | 3 lines in `run_all.sh`, a helper of 15 | catching zone bugs that pass under one zone |
| Split a timed event at local midnights, every part timed | `src/utils/grid.ts:1401-1460` | 30 lines | overnight and multi-day timed events on each day, no phantom day |
| One bar for a multi-day all-day event | `src/utils/grid.ts:1336-1370`, `:1536-1573` | 35 lines | Month's and the day columns' trips read as one thing |
| Keep one bad event from blanking the board | `src/utils/events.ts:731-806` | 25 lines | a blank wall from one odd event |
| Timeout per calendar | `src/utils/events.ts:2631-2638` | 8 lines | a board that silently stops refreshing |
| Newest answer wins, and the write counter | `src/utils/events.ts:152-203`, `:529` | 20 lines | snap-backs after a save; old answers over new |
| Keep a failed calendar's last events; per-calendar success | `src/utils/events.ts:479-520` | 20 lines | blank days during an iCloud outage |
| Weather subscription and keys | `src/utils/weather.ts:72-120`, `:350-388`; ticket at `src/calendar-card-pro.ts:3013-3058` | 30 lines | polling, and forecasts on the wrong day |
| Calendar-day countdowns | `src/utils/format.ts:195-232` | 10 lines | "in 2 days" and "in 4 days" on consecutive dates |
| Write and merge permissions | `src/interaction/event-details.ts:115-138` | 10 lines | saving stale data; failed-looking deletes on merged plans |

**Not worth borrowing:**
- Day.js;
- the `localStorage` event cache (the server's copy is better here);
- the six load modes (the house board needs two: copy, then live);
- the page-wide change announcement (one card per page);
- Home Assistant's own event dialogs (the house has its own sheet and iCloud write path);
- regular-expression filters, `start_date` grammar and week numbers (no house need).

## 11. Gaps in the decided spec

**For the owner** (they'd notice these on the wall or a phone). Each needs a decision at its slice:
1. **What the face shows when a calendar can't be reached.** CCP keeps the old events and names the calendar at the foot. The board could do the same and add the time ("Jenn's calendar as of 9:40"), or show nothing. Recommended *(inferred)*: keep the copy's events; one quiet line naming the person and time, only after two failed asks in a row. Skylight's behavior here wasn't checked.
2. **Change and Delete on a plan shown once from two calendars.** Deleting one copy brings the row back from the other, which "reads as a failed delete" (`src/interaction/event-details.ts:99-101`). CCP simply offers neither. The decided sheet ([event sheet](../../../prototypes/event-sheet/README.md)) doesn't say. Options:
   - change and delete every copy the board can write, and say which it couldn't;
   - change only Us's copy and say the other is the other person's;
   - offer only Hide on merged plans.
3. **Multi-day events as one bar** in Month and the day columns. Already noted as "not drawn" in [wall Month and Lists](../../../prototypes/wall-month-lists/README.md); CCP's banner rules are ready to borrow.
4. **Month's 10 days of weather** may be more than the house's provider gives. Check the entity before building; show only the days it has *(not checked)*.

**The agent's calls:**
- **Save only once that calendar's live answer is in** (P26). The iCloud path's `If-Match` covers iCloud; Google's and Home Assistant's own calendar have no such check *(inferred)*.
- **A `hass` guard** (P20).
- **Never `put` an empty answer over a copy that had events** without asking once more (P14).
- **The browser's time zone,** with tests under two real zones (P23).
- **Timed events crossing midnight** shown on each day they touch (P4).

## 12. What I could not check

- **Nothing from CCP was run**, by rule. The claims about its behavior come from reading the code, comments and tests at `75bf292`, not from watching it. That covers the render counts, the row keys rebuilding and the extra fetched day.
- **Live data wasn't checked:**
  - the house's weather entity (its forecast horizon, whether it sends `precipitation_probability`, how it stamps daily entries);
  - whether Home Assistant answers an empty list or an error for a CalDAV or Google calendar during startup;
  - whether Google's integration filters declined or cancelled events (the #66 note says it does and CalDAV doesn't).
- **The house's CI zone** is inferred: GitHub's runners default to UTC and `tests.yml` sets none.
- **Home Assistant's websocket library** resubscribing after a reconnect, and its `ready` event, come from the load-time note and general knowledge of `home-assistant-js-websocket`. They weren't re-read for this note.
- **Fully Kiosk:** whether it fires `visibilitychange` when its screen turns off and on.
- **What other Home Assistant calendar cards do** is outside this note; question 5 of #103 covers it.
