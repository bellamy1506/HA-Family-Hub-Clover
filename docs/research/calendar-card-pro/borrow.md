Research note, 2026-11-01, for [What does Calendar Card Pro do that the house board must match, and what can it borrow?](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/103).

# What the house board should borrow from Calendar Card Pro, and how

This note turns the two code reports, [code-ui.md](code-ui.md) and [code-data.md](code-data.md), into one ranked list: what the house board should take from Calendar Card Pro (CCP) instead of writing it, what it should leave, and the license steps. Code is cited as `path:line` at CCP commit `75bf292` (v5.0.0, MIT), on GitHub at `https://github.com/alexpfau/calendar-card-pro/blob/75bf2925306ae8b53290c2afb696ade5b9839345/<path>#L<line>`. Line counts for ports, rankings and anything else marked *(inferred)* are my own judgment.

## Answer

- **Borrow 20 small things, rewritten as plain ES modules: about 235 lines of JavaScript and 25 of CSS,** under a tenth of the house board's 3,000-line folder cap ([#44](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/44#issuecomment-6512692169)). About 180 of those lines belong to slice 1, the resting face and the phones' Upcoming ([switch-over](../../board-next/switch-over.md)). The ones that save the most:
  - local dates that survive the zone and the clock change, with the date tests run under New York, Sydney and UTC;
  - one malformed event costing one row instead of the whole wall;
  - hardened calendar answers: a timeout, success judged per calendar, a failed calendar's events kept, the newest answer winning;
  - one minute tick with a day key, and timers that stop when hidden or removed;
  - a gate so a light switching elsewhere in the house redraws nothing.
- **The real value is CCP's tests and release notes, not its code.** Nearly every borrow below is a bug CCP shipped and then fixed, with a test that pins the fix. Port the test cases (inputs and expected answers) into the fork's Node checks. Don't port the Vitest and happy-dom harness.
- **Three corrections to the earlier reports:**
  - **Don't copy `stripHtmlTags` as written.** It joins lines at `<br>` ("Line one<br>Line two" becomes "Line oneLine two", `tests/strip-html-tags.test.ts:231`). The house sheet shows Details on several lines.
  - **Don't align the minute tick from local date fields.** On tonight's fall-back, a tick armed at 1:59:30 am that way waits 61 minutes, so the clock would freeze for an hour (checked with my own Node one-liner, below). Align minutes from epoch milliseconds, and use local fields only for day boundaries.
  - **Skip `Intl.RelativeTimeFormat` and the `color-mix` person ink.** The board is English only, so "tomorrow" and "in 12 days" are one line by hand. Person colors are decided as measured values, never used as text color ([#57](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/57#issuecomment-6543420323), [#91](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/91#issuecomment-6551826184), [#92](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/92#issuecomment-6557606569)).
- **A new finding about Change and Delete.** Home Assistant's calendar integrations advertise different abilities. Its Google integration offers create and delete, but not update, and only when read-write. CalDAV (iCloud) offers create only. Local Calendar offers all three. So the feature bits CCP reads are worth reading, but changing Jenn's events waits for the [Google write path](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/100) (slice 6), and every iCloud change or delete goes through the house's own write path ([#39](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/39#issuecomment-6512584295)).
- **Leave alone:**
  - Lit and its build;
  - the editor, the 36 languages and Day.js;
  - the hour grid;
  - the `localStorage` cache and its six load modes;
  - CCP's three repaint timers (one minute tick replaces them);
  - the toolbar, hold gestures, and Home Assistant's private calendar dialogs;
  - anything that fights the decided design: silent caps, no pinned day names, calendars marked by color alone, titles that scroll.
- **License.** Rewriting from the rule is the default; it needs no notice, and a one-line credit is cheap. If a function is copied close to as written:
  - put CCP's copyright line and MIT text in `custom_components/family_hub/house_board/NOTICE`, inside the folder HACS installs, so it travels with every installed copy;
  - put a one-line pointer above the function.

  The fork's GPL-3.0 `LICENSE` stays as it is: the Free Software Foundation lists this license (which it calls Expat) as "compatible with the GNU GPL" ([license list](https://www.gnu.org/licenses/license-list.html#Expat)).

## How to read the list

- **Rank** is by what the borrow saves in the house's own setting, with my judgment of how bad the failure is and how soon daily use would hit it. That setting is the America/New_York zone, iCloud, Google and Home Assistant calendars, a wall that never sleeps, and phones reopened many times a day *(inferred)*.
- **Plain lines** are JavaScript without types or comments, in the house's style *(inferred)*.
- **Module** is one of the seven from #44: `house-board.js` (the card and page), `ha.js` (the only file that calls Home Assistant), `when.js`, `meals.js`, `face.js` and `theme.js` (pure logic), and `html.js` (the escaping template).
- **Tests to port** name CCP's test cases to rewrite as Node checks in the fork. Pure ones go in a `tests/test_when.js`; Home Assistant ones in a `tests/test_ha.js` against the shared fake `hass` that #44 decided. These files don't exist yet; they come with the slice.
- **"Copy" or "rule".** "Rule" means rebuild from the idea; no notice is needed. "Copy" means the port will likely end up close to CCP's function, so the license steps apply.

## The ranked list

| # | Borrow | CCP source | Module | Plain lines | Slice | Saves |
|---:|---|---|---|---:|---|---|
| 1 | Local dates: all-day parse, date key, add days, whole-day difference | `src/utils/format.ts:496-510`, `:685-690`; `src/utils/grid.ts:266-282` | `when.js` | 10 | 1 | Every all-day event a day early in New York; day counts off by one across a clock change |
| 2 | Date tests under New York, Sydney and UTC, with a DST guard and an `Intl` oracle | `vitest.config.mjs:30-72`; `tests/event-time-zone.dst.test.ts:36-60` | `tests/` | 0 (5 in `run_all.sh`, 15 in a helper) | 1 | Date bugs that pass in CI (UTC) and fail at home |
| 3 | One bad event costs one row | `src/utils/events.ts:731-806` | `when.js` | 25 | 1 | A blank wall from one odd event |
| 4 | Calendar answers: 30 s timeout, success per calendar, keep a failed calendar's events, newest answer wins, a second look before an empty answer replaces a full copy | `src/utils/events.ts:438-529`, `:2576-2638`; `src/calendar-card-pro.ts:3698-3705` | `ha.js` | 25 | 1 | A board that silently stops refreshing; blanked days during an outage; an old answer over a new one |
| 5 | One minute tick, aligned by epoch, with a local day key kept across sleeps | `src/calendar-card-pro.ts:1593-1620`, `:1754-1770` | `house-board.js` | 10 | 1 | A stale "today" after midnight; Now and Next a minute late; a frozen clock on fall-back night |
| 6 | Timers and subscriptions stop when hidden or removed; late answers after removal are dropped | `src/calendar-card-pro.ts:1383-1470`, `:2872-2892`, `:3013-3055` | `house-board.js`, `ha.js` | 15 | 1 | Leaked timers and subscriptions; an old forecast written back |
| 7 | Gate `hass` on the identity of the states the board reads | `src/calendar-card-pro.ts:2365-2387` | `ha.js` | 10 | 1 | A redraw on every state change in the house; a sheet losing its caret mid-typing |
| 8 | Split timed events at local midnights; a midnight end adds no day; zero length kept as an instant | `src/utils/grid.ts:1401-1460`; `src/utils/events.ts:916-921`, `:1890-1901` | `when.js` | 25 | 1 | Overnight events on the wrong days; a phantom extra day |
| 9 | A live ask started before a save can't draw or `put` over it | `src/utils/events.ts:152-203`, `:529` | `ha.js` | 8 | 2 | An added event vanishing and coming back; Undo appearing to fail |
| 10 | Weather by subscription, daily entries by local date, a version ticket | `src/utils/weather.ts:72-120`, `:350-388`; `src/calendar-card-pro.ts:3013-3055` | `ha.js`, `when.js` | 25 | 1, 3 | Polling weather; a forecast on the wrong day |
| 11 | All-day end is exclusive; an all-day event stays until midnight after its last day | `src/utils/events.ts:983-1009`, `:1137-1145` | `when.js` | 4 | 1 | All-day events one day too long, or gone too early |
| 12 | Merged plans: times compared as instants, filters before merging, every contributing calendar kept | `src/utils/events.ts:826-905`, `:1233-1262`, `:2104-2118` | `when.js` | 8 | 1 | A plan shown twice; a hidden copy hiding the other person's |
| 13 | Change and Delete rules: feature bits, a `uid`, nothing on a failing calendar, write from the event as fetched | `src/interaction/event-details.ts:61-134`; `src/interaction/ha-calendar-dialogs.ts:30-36`, `:101-108` | `ha.js`, the sheet | 12 | 4, 6 | Offering what a calendar refuses; saving day-old data; writing a split part back |
| 14 | A multi-day all-day event as one bar, marked where it runs past the view | `src/utils/grid.ts:1536-1573` | `when.js` | 18 | 3 | A trip read as several entries in Month |
| 15 | `hass-action` navigate (and `hass-more-info` if ever needed) | `src/interaction/actions.ts:36-46`; `src/interaction/ha-calendar-dialogs.ts:353-375` | `house-board.js` | 6 | 1 | Hand-rolled navigation to the week card |
| 16 | Details as text: drop tags, decode entities, but keep line breaks | `src/utils/format.ts:455-472` | `html.js` | 10 | 4 | `&amp;` and `<br>` in an event's Details |
| 17 | Countdowns by calendar days | `src/utils/format.ts:195-232` | `when.js` | 6 | 5 | "in 2 days" and "in 4 days" on consecutive dates |
| 18 | A filter that always shows it's on | `src/rendering/legend.ts:492-530`; `src/rendering/styles.ts:959-968`, `:1019-1022`; `src/calendar-card-pro.ts:1040-1053` | `house-board.js` | 10, plus 10 CSS | 5 | Someone reading a filtered day as free |
| 19 | Fit text again after fonts load | `src/calendar-card-pro.ts:2305-2325` | `house-board.js` | 8 | 1 | A lead line or "+N more" fitted against a fallback font on the phones |
| 20 | CSS: tabular figures, `minmax(0, 1fr)`, hover only on real pointers, reduced motion, a delayed dim | `src/rendering/styles.ts:479`, `:1105-1121`, `:944-950`, `:672-680`; `src/rendering/column.ts:358-393` | the stylesheet | 15 CSS | 1 to 3 | A jiggling clock, pushed-wide columns, sticky hover on the tablet, load flicker |

In all, about 235 JavaScript lines and 25 CSS lines in the house board's folder, plus about 600 lines of Node checks *(inferred)*.

## Each borrow

### 1. Local dates (rule; slice 1; `when.js`; about 10 lines)

- **CCP:**
  - `parseAllDayDate` builds `new Date(y, m - 1, d)` and never `new Date('YYYY-MM-DD')`, which reads the date as UTC (`src/utils/format.ts:496-500`);
  - `getLocalDateKey` builds `YYYY-MM-DD` from local fields (`:508-510`);
  - `startOfDay` and `addDays` step by date fields, never by 86,400,000 ms (`src/utils/grid.ts:266-282`);
  - `getCalendarDayDiff` subtracts `Date.UTC` of each date's local fields (`src/utils/format.ts:685-690`).
- **Port:** five functions of one to three lines each. Use them everywhere the board names a day: the day columns, Next, the evening hand-off, Month, countdowns and notes' days.
- **Saves:**
  - CCP's early bug [#28](https://github.com/alexpfau/calendar-card-pro/issues/28) put all-day events a day early west of UTC;
  - a countdown skipped a day (`docs/RELEASE_NOTES.md:280`).
  - My own checks, in this container's Node under `TZ=America/New_York`:
    - `new Date("2026-11-01")` is Oct 31, 8 pm;
    - from Mar 13, 2027, 11 pm to Mar 15, 9:30 am, a plain `Math.floor` of the milliseconds gives 1 day where `Date.UTC` of the fields gives 2.

  The house's clocks fell back today; the next change is 2027-03-14.
- **Tests to port:**
  - all-day parse gives local midnight, and a UTC parse disagrees wherever the zone isn't UTC (`tests/all-day-parse.dst.test.ts:53`, `:67`);
  - `addDays` lands on local midnight across both clock changes (`tests/grid-geometry.dst.test.ts:157-186`);
  - local dates win when the UTC date differs, and all-day dates hold on either side of UTC (`tests/countdown-calendar-days.dst.test.ts:43`, `:51`);
  - add the two house nights, 2026-11-01 and 2027-03-14.

### 2. Date tests under real zones (rule; slice 1; `tests/`)

- **CCP:** every `*.dst.test.ts` file runs under `Europe/Berlin`, `Australia/Sydney` and `America/New_York` as well as UTC (`vitest.config.mjs:30-72`). Its comments give the reasons:
  - UTC has no clock changes, so day math that assumes 24-hour days always passes there;
  - only a zone behind UTC catches a date read as UTC: "seventeen times under New York", none under the others.

  Each such file first asserts that January and July offsets differ, so it can't pass vacuously (`tests/countdown-calendar-days.dst.test.ts:37-41`). The expected wall clock comes from `Intl.DateTimeFormat` with an explicit `timeZone`, never from the `Date` getters under test (`tests/event-time-zone.dst.test.ts:36-60`).
- **Port:**
  - Three lines in `tests/run_all.sh` that run the date checks again under `TZ=America/New_York`, `TZ=Australia/Sydney` and `TZ=UTC`. New York is home and behind UTC; Sydney is ahead and in the other hemisphere, so Berlin adds little *(inferred)*.
  - The DST guard: two lines.
  - The `Intl` oracle: a 15-line helper.
- **Saves:** the fork's CI sets no `TZ`, so it runs under GitHub's UTC, and a session's container runs New York ([code-data.md §4.4](code-data.md#44-time-zones)). A date bug can pass one and fail the other. This is the cheapest borrow on the list.

### 3. One bad event costs one row (copy likely; slice 1; `when.js`; about 25 lines)

- **CCP:** `keepWellFormedEvents` (`src/utils/events.ts:731-806`) runs before anything else, because "an exception thrown while grouping does not cost that one event a row: it costs the whole card" (`:707-710`). Its rules:
  - non-text title, place or details: drop;
  - timed with no end, or an end before its start: keep as an instant at its start. The ends are compared as instants, so a fall-back event from 1:30 am EDT (`01:30-04:00`) to 1:15 am EST (`01:15-05:00`) is left alone;
  - all-day whose end isn't after its start: drop;
  - an impossible date such as June 31: drop;
  - never change the event in place; a repaired copy keeps the original beside it.
- **Port:** the same rules over the API's event shape. The repaired copy keeps a reference to the event as fetched, for borrow 13.
- **Saves:** "One Malformed Event Could Empty the Whole Card" (`docs/RELEASE_NOTES.md:503`). Each integration produces its own payload, so CalDAV, Google and invitations each get a chance at an odd one *(inferred)*.
- **Tests to port:**
  - `tests/malformed-event-payload.test.ts`: no end kept as an instant (`:109`); an end that isn't an object dropped (`:120`); no start dropped without losing its neighbor (`:150`); null optional text still fine (`:190`);
  - `tests/bad-event-end.test.ts`: backwards end becomes an instant and the original is untouched (`:136`); the fall-back event kept (`:165`); all-day end not after start dropped, and a one-day all-day kept (`:197`, `:226`).

### 4. Calendar answers (rules, one small copy; slice 1; `ha.js`; about 25 lines)

- **CCP:**
  - **A timeout per calendar.** `withTimeout` races `hass.callApi` against 30 s (`src/utils/events.ts:2631-2638`; `src/config/constants.ts:77-84`).
  - **Each calendar settles on its own** (`:2576-2620`).
  - **Success is judged per calendar,** never by event count (`:438-443`).
  - **A failed calendar keeps its last events** (`:479-493`).
  - **A failure is recorded,** a total one included (`:501-520`).
  - **Only the newest request may write** (`:529`). A ticket taken before any await drops a superseded answer (`src/calendar-card-pro.ts:3698-3705`).
  - **An empty answer is trusted for only 15 s,** because Home Assistant can answer empty while starting ([#297](https://github.com/alexpfau/calendar-card-pro/issues/297); `src/utils/events.ts:522-527`).
- **Port.** The house board already draws each calendar as it answers, and keeps the server's copy ([#97](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/97#issuecomment-6558650608)). What it needs on top:
  - `withTimeout` (6 lines, the one near-copy);
  - one ticket per calendar, so an answer older than the newest ask for that calendar is neither drawn nor `put`;
  - on failure, leave that calendar's copy events up and `put` nothing;
  - an empty answer for a calendar whose copy has events in that range is drawn and `put` only after a second live ask agrees;
  - arm the next 60 s ask from when the last answer landed, never while one is still out.

  Keep CCP's 30 s *(inferred: under the 60 s poll, and well above a healthy iCloud answer)*.
- **Saves.** Four bugs CCP shipped and fixed:
  - "A calendar that never answered stopped the card refreshing" (`docs/RELEASE_NOTES.md:220`);
  - "A Failed Refresh Blanked Events Already on Screen" (`:630`);
  - an incomplete result cached as whole, so a failed calendar went unseen (`:221`);
  - a slow reply replacing a newer one (`:502`).

  The interval-doubling bug (`:219`) is the reason to arm from the answer.
- **Tests to port** (`tests/event-fetch-resilience.test.ts` unless named):
  - a calendar that never answers is given up and doesn't block later asks (`:151`);
  - an empty answer beside a failure is a partial failure (`:178`);
  - a later failure keeps the last events (`:190`);
  - a total failure is recorded, which the house turns into "nothing is `put`" (`:258`);
  - the newer answer wins when the older settles last (`tests/update-events-race.test.ts:136`);
  - the empty-answer rule, in the house's form (`tests/event-cache-lifecycle.test.ts:92`).
- **Waits on the owner:** what the face shows when a calendar fails ([code-data.md §11](code-data.md#11-gaps-in-the-decided-spec), item 1). The borrow keeps the events either way; only the wording is open.

### 5. One minute tick with a day key (rule; slice 1; `house-board.js`; about 10 lines)

- **CCP.** Three timers:
  - a now-line `setInterval` of 60 s, not aligned to the minute (`src/calendar-card-pro.ts:1593-1620`);
  - a midnight timeout built from local fields, one second past (`:1636-1672`, the date at `:1655`);
  - a boundary timeout for the next event start or end (`:1693-1745`).

  The part worth taking is the day key. Each tick compares `getLocalDateKey(new Date())` with the last one, and refetches when it changed, "including a rollover that passed while the timer was stopped" (`:1606-1617`, `:1754-1770`).
- **Port.** One `setTimeout` re-armed each tick:
  - **Delay:** `61000 - (Date.now() % 60000)`, one second past each minute, aligned from epoch milliseconds. Every zone the house uses is offset by whole minutes, so this lands on local minutes too.
  - **On each tick:** compare the day key. On a new day, recompute today and re-ask (the decided "recompute today"). Otherwise redraw the clock and whatever Now, Next or the hand-off changed.

  Calendar times are whole minutes, so this replaces all three CCP timers and makes the next-boundary scan and the `setTimeout` cap unneeded *(inferred)*.
- **Saves:**
  - a "today" that stays yesterday;
  - Now and Next up to a minute late;
  - **the trap in aligning by local fields.** In my Node check, a tick armed at 1:59:30 am EDT on 2026-11-01 from `new Date(y, m, d, h, min + 1, 1)` waits 3,631 s, landing at 2:00:01 EST, so the clock would stop for the repeated hour. From epoch milliseconds it waits 31 s, to 1:00:01 EST.

  This corrects code-ui.md's row 2, which paired the tick with the local-fields line at `:1655`. Local fields stay right for midnight itself.
- **Tests to port:** CCP's are tied to Lit, so write the house's own with an injected clock:
  - 23:59:01 then 00:00:01 re-asks;
  - one tick after three hours asleep across midnight re-asks;
  - the delay at 1:59:30 am on 2026-11-01 is 31 s.

### 6. Hidden, removed, and late (rule; slice 1; `house-board.js` and `ha.js`; about 15 lines)

- **CCP.**
  - **On disconnect** (`src/calendar-card-pro.ts:1413-1470`), it:
    - stops every timer;
    - removes the `visibilitychange` listener;
    - unsubscribes weather;
    - bumps its request ticket, so a fetch that lands after the card left draws nothing (`:1436-1442`).
  - **Late async work is guarded on `isConnected`,** so a load finishing after removal can't re-arm a timer (`:2940-2985`, comment).
  - **A weather subscription that resolves after a newer setup or a disconnect** is unsubscribed at once, and a delivery carrying an old ticket is dropped (`:3013-3055`).
  - **On `visibilitychange`,** hidden stops the tick, and visible repaints at once (`:2872-2892`).
- **Port.** The same habits, using the house's own decisions on return: re-ask at once, not after 5 minutes ([#67](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/67#issuecomment-6537438807), [#97](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/97#issuecomment-6558650608)). Home Assistant removes and re-adds cards when a dashboard is edited or left, and the iPhone app reopens pages *(inferred)*.
- **Saves:**
  - timers and subscriptions multiplying each time the board is left and reopened;
  - an old forecast coming back: "Old weather could reappear" (`docs/RELEASE_NOTES.md:186`).
- **Tests to port:**
  - a subscription that resolves after a newer setup is discarded (`tests/weather-subscription-lifecycle.test.ts:232`);
  - no stale forecast after a switch (`tests/weather-stale-callback.test.ts:77`);
  - plus the house's own: after removal, a pending answer draws nothing and the tick is gone.

### 7. The `hass` gate (rule; slice 1; `ha.js`; about 10 lines)

- **CCP:** `_gridDisclosureChanged` (`src/calendar-card-pro.ts:2365-2387`) treats a new `hass` as no change when:
  - the locale's language, time format and first weekday are the same;
  - every state object it reads is the very same object as before.

  CCP gates only its measuring this way; Lit still renders on every `hass`.
- **Port.** Keep the list of entity ids the board reads:
  - the calendars;
  - the to-do lists and notes;
  - the weather entity;
  - the Guest mode switch.

  Compare `prev.states[id] !== hass.states[id]` for each. Also compare `hass.locale`, `hass.themes`, `hass.user` and `hass.connected` *(inferred: the phones follow Home Assistant's light or dark, settings are per person, and the board re-asks on reconnect)*. Draw nothing when all are the same. The other half is the house's own idea from code-ui.md: redraw a region only when its new HTML differs from the last.
- **Saves:** Home Assistant hands every card a new `hass` on every state change in the house ([custom card docs](https://contributors.home-assistant.io/frontend/custom-ui/card/)). Without a gate, a plain-module board rebuilds HTML for each one. That fails "nothing redrawn at rest" and the per-slice frame-stats check ([#72](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/72#issuecomment-6537563054)), and in slices 2 and 4 it would take the caret out of a title being typed *(inferred)*.
- **Tests to port:** none in CCP. Write the house's own against the fake `hass`:
  - an unrelated entity changing draws nothing;
  - a read entity changing draws once;
  - a theme change draws.

### 8. Timed events split at local midnights (copy likely; slice 1; `when.js`; about 25 lines)

- **CCP:** `splitTimedEventByDay` (`src/utils/grid.ts:1401-1460`):
  - every part stays timed, 00:00 to 24:00 for a middle day;
  - days are walked with `addDays`;
  - an end at exactly 00:00 adds no day;
  - a zero-length event is kept as an instant;
  - parts are bounded to the window, so an event already running lands on the first day shown (also `resolveDisplayDate`, `src/utils/events.ts:916-921`).
- **Port.** The same, plus a reference on each part to the event as fetched (CCP's `_source` and `_gridSource`). This fits:
  - the four day columns;
  - the phones' list;
  - Next ("the first of today's events that hasn't started": a part that began yesterday is under way, not next).
- **Saves:** "An Event Ending Exactly at Midnight Gained a Phantom Extra Day" (`docs/RELEASE_NOTES.md:500`), and again in another splitter (`:207`). Overnight events otherwise sit on one day only.
- **Tests to port:**
  - an end at exactly midnight stays one day, and one minute past splits (`tests/multiday-midnight.dst.test.ts:74`, `:87`);
  - a midnight end on a transition day is one part (`tests/grid-geometry.dst.test.ts:283`);
  - parts are bounded to the window, and an exclusive midnight end makes no day (`tests/grid-daily-coverage.test.ts:212`, `:260`);
  - a zero-length event is kept (`tests/zero-duration-events.test.ts:190`).

### 9. Saves aren't undone by an older ask (rule; slice 2; `ha.js`; about 8 lines)

- **CCP:** a write generation on `globalThis` (`src/utils/events.ts:152-177`). After a save, no load may join a request started before it, and only the newest request writes the cache (`:195-203`, `:529`).
- **Port.** One counter in `ha.js`, raised on every add, change, delete or Undo:
  - a live answer whose ask started before the latest write is neither drawn nor `put`;
  - the board then re-asks that calendar.

  CCP's page-wide sharing isn't needed: there's one board per page.
- **Saves:** the echo lights the new thing where it landed ([adding](../../../prototypes/adding/README.md)). A 60 s ask already in flight would draw the day without it, then bring it back: it reads as a failed add, or an Undo that didn't take *(inferred)*.
- **Tests to port:** a reload starts its own request and only the newest writes (`tests/event-fetch-resilience.test.ts:276`, `:307`), restated as "an answer to an ask from before the write is dropped".

### 10. Weather by subscription (rule, one small copy; slices 1 and 3; `ha.js` and `when.js`; about 25 lines)

- **CCP:**
  - `weather/subscribe_forecast` per forecast type through `hass.connection.subscribeMessage` (`src/utils/weather.ts:350-388`);
  - daily entries keyed by local date and hourly ones by local date and hour (`:72-120`);
  - the version ticket in borrow 6 (`src/calendar-card-pro.ts:3013-3055`).
- **Port:**
  - subscribe to daily for today's high and low and for Month's 10 days, and to hourly for the rain line ([resting face](../../../prototypes/resting-face/README.md));
  - key daily entries by local date.
  - **Keep hourly entries as a sorted list, not keyed by hour.** On the fall-back night two entries share the 1 am key *(inferred)*, and the rain line only needs the first rainy hour ahead and the last.
  - **Read precipitation and its probability too.** CCP doesn't read them (`:109-117`).
- **Saves:**
  - a poll for weather;
  - an old forecast written back (borrow 6);
  - a forecast filed on the wrong day.
- **Tests to port:**
  - keys use the local hour, not the UTC hour (`tests/weather-hourly-key.dst.test.ts:69`);
  - nothing is borrowed from a neighbor day (`tests/weather-forecast-matching.test.ts:130`), as the rule that the rain line reads today only.
- **Not checked:** the house weather entity's horizon (Month wants 10 days), and whether it stamps daily entries at UTC midnight. A UTC-midnight stamp would file every day one early in New York ([code-data.md §6](code-data.md#6-weather)).

### 11. All-day ends and expiry (rule; slice 1; `when.js`; about 4 lines)

- **CCP:**
  - the last day covered is `end.date` minus one (`src/utils/events.ts:1137-1145`);
  - an all-day event counts as past from midnight after its last day, built by adding a calendar day (`allDayExpiryInstant`, `:983-1009`).

  Before v4, past all-day events never left.
- **Port:** both rules, with `addDays` from borrow 1. "Finished events leave today's list" ([resting face](../../../prototypes/resting-face/README.md)) then holds for all-day events.
- **Tests to port:** today's all-day event is kept late in the day (`tests/allday-expiry.test.ts:174`), and gone after midnight.

### 12. Merged plans, the details (rule; slice 1; `when.js`; about 8 lines on top of the house's match)

- **CCP:**
  - **Timed times compared as instants,** so `-05:00` and `Z` spellings match (`generateEventSignature`, `src/utils/events.ts:2104-2118`).
  - **Filters run before the merge** (`:1233-1262`).
  - **The merged row lists every contributing calendar** (`deduplicateEvents`, `:826-905`).
- **Port.** These three details only. The house's own match stays: `uid` and start first, then exact title and times, no location ([#66](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/66#issuecomment-6537455038)). Filter by Hide, Guest mode, work and past before merging, so a hidden copy can't take the other person's with it.
- **Saves:** "A filtered duplicate could hide an event that still qualified" (`docs/RELEASE_NOTES.md:206`).
- **Tests to port:**
  - the control case: two events alike in every compared field collapse to one (`tests/duplicate-signature.test.ts:83`), with an added case for two offset spellings of one time;
  - an excluded or expired first copy doesn't drop an eligible second (`tests/duplicate-eligibility.test.ts:63`, `:87`).

### 13. Change and Delete rules (rule; slices 4 and 6; `ha.js` and the sheet; about 12 lines)

- **CCP:** `detailPermissions` (`src/interaction/event-details.ts:115-134`) offers Edit or Delete only when:
  - the calendar's `supported_features` has the bit: 1 create, 2 delete, 4 update (`src/interaction/ha-calendar-dialogs.ts:30-36`, `:101-108`);
  - the event has a `uid`;
  - the row isn't merged;
  - the calendar loaded on the last attempt, since a failing calendar's events "may be a day out of date".

  The dialog always writes from the event as fetched, never a split part (`buildDetailEntry`, `:61-80`).
- **Port.** The same rules for the sheet, with two house differences:
  - iCloud events use the house write path whatever the bits say (#39);
  - what a merged row offers is the owner's call ([code-data.md §11](code-data.md#11-gaps-in-the-decided-spec), item 2).

  What Home Assistant's own integrations advertise, read from Home Assistant core's `dev` branch on 2026-11-01:

  | Integration | Create | Delete | Update | Source |
  |---|---|---|---|---|
  | CalDAV (iCloud) | yes | no | no | [`caldav/calendar.py`](https://github.com/home-assistant/core/blob/dev/homeassistant/components/caldav/calendar.py) |
  | Google | yes | yes | no | [`google/calendar.py`](https://github.com/home-assistant/core/blob/dev/homeassistant/components/google/calendar.py) |
  | Local Calendar | yes | yes | yes | [`local_calendar/calendar.py`](https://github.com/home-assistant/core/blob/dev/homeassistant/components/local_calendar/calendar.py) |

  Google sets its bits only when the calendar is writable and access is read-write. So until slice 6, the sheet can delete Jenn's events through Home Assistant but can't change them, and should say where to change them ([#45](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/45#issuecomment-6545490784)).
- **Saves:**
  - offering a change a calendar refuses;
  - saving over newer data;
  - writing a day's part, or a block label from Guest mode, back as the event.
- **Tests to port** (`tests/event-details.test.ts`):
  - a merged row offers neither (`:1170`);
  - a failing calendar offers neither (`:1224`);
  - every bit combination (`:1280`);
  - no `uid`, neither (`:1302`);
  - a calendar missing from the states, neither (`:1346`);
  - a split part opens as the whole event (`:274`).

### 14. One bar for a multi-day all-day event (copy likely; slice 3; `when.js`; about 18 lines)

- **CCP:** `computeBannerPlacement` (`src/utils/grid.ts:1536-1573`) takes an all-day event and the visible days, and returns:
  - the first column;
  - a span;
  - whether it continues before or after the view.

  Its comment: "One banner spanning its days, rather than one chip per day, is what makes a multi-day event read as one thing." The idea is credited in CCP's `NOTICE` to a design proposal, "No code was carried across", so CCP's notice covers the code.
- **Port.** Call it once per week row in Month, so a trip across a week break draws as two marked pieces. It's ready if the owner wants the same in the face's four columns (code-data.md §11, item 3).
- **Saves:** the wall Month prototype's own finding, "both reviewers read it as two entries" ([wall Month and Lists](../../../prototypes/wall-month-lists/README.md)).
- **Tests to port:**
  - the right span over a transition day (`tests/grid-geometry.dst.test.ts:306`);
  - a one-day banner on the transition day (`:330`);
  - continuation flags at both edges.

### 15. Navigation through Home Assistant (rule; slice 1; `house-board.js`; about 6 lines)

- **CCP:** `fireHassAction` dispatches a bubbling, composed `hass-action` event with `{ config: { tap_action: { action: 'navigate', navigation_path } }, action: 'tap' }` (`src/interaction/actions.ts:36-46`; `src/interaction/ha-calendar-dialogs.ts:353-355`). Home Assistant's navigation "closes any dialog still open, lets a page with unsaved changes refuse ... a bare `pushState` does none of that". `hass-more-info` opens an entity's dialog (`:366-375`).
- **Port:** navigate only. It's for "until the house board can do something, that thing opens the week card" ([switch-over](../../board-next/switch-over.md)). Add more-info only if a need appears.
- **Saves:** hand-rolled `pushState` and `location-changed` code, and its back-button bugs *(inferred)*.
- **Tests to port:** none in CCP worth porting. The house's own checks that the event bubbles out of the shadow root with the right detail.

### 16. Details as text (rule; slice 4; `html.js`; about 10 lines)

- **CCP:** `stripHtmlTags` (`src/utils/format.ts:455-472`) does two things:
  - one regex drops comments and tags;
  - a `<textarea>`'s `innerHTML` decodes entities as text without running anything.
- **Port, with two changes:**
  - **Keep line breaks.** First turn `<br>` and the ends of `<p>`, `<div>` and `<li>` into line breaks. CCP joins the lines (`tests/strip-html-tags.test.ts:231`, `:239`), and the sheet shows Details on several lines.
  - **Decode from a small table,** not a `<textarea>`: `&amp;`, `&lt;`, `&gt;`, `&quot;`, `&#39;`, `&nbsp;` and numeric references. That keeps it pure, so Node can test it.

  The result still goes through `html.js`'s escaping. The sheet writes Details back only if someone changed them, so a Google event's own formatting isn't flattened by just opening it *(inferred)*.
- **Saves:** `&amp;` and `<br>` in Jenn's Google Details ([code-data.md](code-data.md#9-pitfalls-the-house-board-must-also-handle), P25).
- **Tests to port:**
  - the cases in `tests/strip-html-tags.test.ts` for entities, comments and upper-case tags, with the house's line-break expectation in place of CCP's;
  - a check that `<script>` text comes out as text and is escaped when drawn.

### 17. Countdowns by calendar day (rule; slice 5; `when.js`; about 6 lines)

- **CCP:** `getCountdownString` (`src/utils/format.ts:195-232`):
  - counts whole calendar days with `getCalendarDayDiff`;
  - says "tomorrow" for 1;
  - uses hours only for a start later today, and "never let[s] a long wait today round into 'a day'".
- **Port.** The same rules in English by hand: `n === 1 ? 'tomorrow' : 'in ' + n + ' days'`, and hours for later today. No `Intl.RelativeTimeFormat` and no Day.js: for one language a template is as short and doesn't vary between the tablet's WebView, iOS and Node *(inferred)*. This differs from code-ui.md's row 5.
- **Saves:** "Timed Countdowns Skipped a Calendar Day" (`docs/RELEASE_NOTES.md:280`).
- **Tests to port:** `tests/countdown-calendar-days.dst.test.ts`. At 23:50 an event at 00:10 is "tomorrow", and at 00:00 it's minutes away (`:43`). Add consecutive dates across 2027-03-14.

### 18. A filter that always shows it's on (rule; slice 5; `house-board.js`; about 10 lines and 10 CSS)

- **CCP:**
  - a hidden calendar's chip stays in place, gray, "so a filtered card always shows that it is filtered" (`src/rendering/legend.ts:492-530`; `src/rendering/styles.ts:1019-1022`);
  - a folded filter carries a dot (`styles.ts:959-968`);
  - filtering is applied to what's drawn, memoized on the events array and the hidden set, never to what's loaded (`src/calendar-card-pro.ts:1040-1053`).
- **Port:** the same for the person filter in Month and Upcoming ([#98](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/98#issuecomment-6559117623)). Turning a filter or Guest mode on or off never fetches.
- **Saves:** a filtered day read as a free day. The filter's look isn't specified yet, so following CCP here is the agent's call (code-ui.md §11).
- **Tests to port:** none in CCP that fit. The house's own: a hidden person stays shown as hidden, and toggling asks nothing of Home Assistant.

### 19. Fit text again after fonts load (rule; slice 1; `house-board.js`; about 8 lines)

- **CCP:**
  - re-measures on `document.fonts.ready` and `loadingdone`;
  - flags the callback dead on cleanup, since a promise can't be cancelled (`src/calendar-card-pro.ts:2305-2325`).
- **Port:** re-run the lead line's shrink-to-fit and the "+N more" count once fonts load. On the wall Roboto is the tablet's own font. On the iPhones Home Assistant loads it as a web font, so this matters there *(inferred)*.
- **Saves:** a lead line or a "+N more" count fitted against a fallback font, then wrong once Roboto arrives.
- **Tests to port:** none in CCP. One Playwright case in the house's browser check.

### 20. A few lines of CSS (rule; slices 1 to 3; the stylesheet; about 15 lines)

- **CCP:**
  - **`font-variant-numeric: tabular-nums`** (`src/rendering/styles.ts:479`), for the minute clock and times, so digits don't shift each minute (slice 1).
  - **`grid-template-columns: repeat(N, minmax(0, 1fr))`** with `min-width: 0` on each column (`src/rendering/column.ts:358-393`), so a long title can't push one of the four day columns wider (slice 1).
  - **Hover only inside `@media (hover: hover)`,** with `:active` everywhere: "on touch a hover state sticks after the tap" (`styles.ts:1105-1121`). Slice 1 or 2, with the first tap target.
  - **`@media (prefers-reduced-motion: reduce)`** turning transitions off (`styles.ts:944-950`). Slice 2, with the first motion.
  - **`transition: opacity 120ms ease 150ms` for content waiting on data,** so a quick load never flickers (`styles.ts:672-680`). Slice 3, only if a page change in Month waits on data.
- **Saves:** small, visible faults that are each one line to prevent.
- **Tests to port:** none. The browser check's `assertStable` covers layout shifts ([CODING_STANDARDS.md](../../../CODING_STANDARDS.md)).

## Knowledge to take, no code

- **Never decide light or dark with `prefers-color-scheme` or `light-dark()`.** Home Assistant declares no `color-scheme`, so both follow the phone's operating system, not Home Assistant's theme (`src/rendering/styles.ts:2850-2872`). The phones must read Home Assistant's own dark flag *(inferred: `hass.themes.darkMode`)*. Test with the browser in light mode and Home Assistant in dark.
- **Arm a repeating ask from when its data arrived, not from when the timer was set.** Otherwise every other tick finds the data "too young" and the interval doubles (`src/calendar-card-pro.ts:2945-2960`; `docs/RELEASE_NOTES.md:219`).
- **`setTimeout` treats a delay over 2^31-1 ms as zero** (`src/calendar-card-pro.ts:2975-2977`). Moot while the minute tick is the board's only timer. Cap any long timer added later.
- **Don't fetch a day more than is kept.** CCP's window ends one day past what it keeps (`src/utils/events.ts:2725-2726` against `:665-671`), and iCloud costs about 0.1 s per event ([code-data.md §1](code-data.md#1-fetching)).
- **Don't key rows by position.** CCP's keys hold the index (`src/rendering/render.ts:543-546`). The house's identity is `uid` and start ([#66](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/66#issuecomment-6537455038)).
- **HACS writes a `.js.gz` beside every `.js` it saves.** By CCP's account Home Assistant serves that copy, so plain, unminified modules likely travel compressed with no build ([code-ui.md §8](code-ui.md#8-bundle-size)). A `.js` patched by hand on the Home Assistant box needs its `.gz` deleted.

## What not to borrow, and why

| Not borrowed | CCP source | Why |
|---|---|---|
| Lit, and the build: Rollup, esbuild, Terser, CSS comment stripping, a size script | `package.json`; `rollup.config.mjs`; `scripts/check-bundle.mjs` | #44 decided plain modules with no library or build. Vendored Lit stays the fallback only if the sheets hit redraw bugs twice. HACS's `.gz` covers most of what minifying buys |
| The visual editor (9,006 lines) | `src/rendering/editor/` | The house config is a few keys; adjustments live on the board's Settings ([#87](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/87#issuecomment-6551496631)) |
| 36 languages, Day.js, `Intl.RelativeTimeFormat` | `src/translations/` | English only; one-line strings by hand (borrow 17) |
| The hour grid and its fitting (about 5,000 lines) | `src/rendering/grid.ts`; `src/utils/grid*.ts` | The house board has no hour grid. Only `addDays`, the timed split and the banner come from these files |
| The `localStorage` event cache: 24-hour stale drawing, six load modes, shared in-flight requests, a page-wide change broadcast, the 5-minute return threshold | `src/utils/events.ts:53-131`, `:186-203`, `:2786-2921`; `src/calendar-card-pro.ts:3688-3866`; `src/interaction/calendar-changes.ts` | The server's copy is decided and better for a wall and two phones ([code-data.md §2](code-data.md#2-caching)). One board per page; the house re-asks at once on return |
| Three repaint timers and the next-boundary scan | `src/calendar-card-pro.ts:1593-1745`; `src/utils/events.ts:2451-2476` | One minute tick replaces them (borrow 5) |
| Retry backoff (1, 2, 4 minutes) | `src/utils/events.ts:570-597` | The house asks its own Home Assistant every 60 s, and borrow 4 keeps asks from overlapping. Add backoff only if the error records show repeated failures *(inferred)* |
| Waiting for every calendar before drawing | `src/utils/events.ts:2578` (`Promise.all`) | The house draws each calendar as it answers ([#97](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/97#issuecomment-6558650608)) |
| Sort ties left to arrival order | `src/utils/events.ts:1450-1482` | The house's sort is fully determined, which the copy-against-live comparison needs |
| A duplicate match that needs the same location | `src/utils/events.ts:2104-2118` | The house matches `uid` and start, then title and times (#66) |
| Silent compact caps | `src/utils/events.ts:1485-1600` | The house says "+N more" and never drops Next |
| One scrolling card with no pinned day names | `styles.ts:307-322` | The phones pin day names and the week strip ([phones](../../../prototypes/phones/README.md)) |
| A calendar marked by color, icon, emoji or picture | `src/rendering/leaves.ts:344-370` | Every row names its person in words (#57) |
| Person-color text ink with `color-mix` | `styles.ts:1599-1650` | Person colors go on blocks and bars only, never text, at measured values redrawn per background in `theme.js` (#91, #92). This differs from code-ui.md's row 12 |
| Scrolling long titles | `src/utils/title-motion*.ts` | Nothing moves at rest |
| The toolbar: add button, view switch, refresh, date arrows | `src/rendering/toolbar.ts` | The wall has its rail and no +; adding starts where things land; the board refreshes itself |
| The pointer recognizer, holds and the hold indicator | `src/calendar-card-pro.ts:3151-3330`; `src/interaction/feedback.ts` | No holds in the house spec. A delegated `click` does the job |
| Home Assistant's own event dialogs, through private methods | `src/interaction/ha-calendar-dialogs.ts:117-280` | Relies on private frontend methods; the house has its own sheet and write paths |
| Width hysteresis between layouts | `src/config/view.ts:1779-1789`, `:2171-2196` | The tablet's 1200 px and a phone's 390 or 844 px sit far from any likely switch width *(inferred)* |
| A modal `<dialog>` for menus | `src/rendering/legend.ts:346-435` | Only if a sheet ever gets clipped; the board fills its own dashboard |
| Per-device memory of choices | `src/utils/view-choice.ts` | Per-person settings are a house service ([#43](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/43#issuecomment-6512554066)) |
| `ha-icon` | `src/rendering/leaves.ts:972` | Inline SVG for the fixed icon table draws on the first frame (code-ui.md §10) |
| `stripHtmlTags` as written | `src/utils/format.ts:455-472` | It joins lines at `<br>` (borrow 16 fixes this) |
| CCP's test harness, DOM snapshots and stylesheet text test | `vitest.config.mjs`; `tests/__snapshots__/`; `tests/stylesheet.test.ts` | The fork runs plain Node and one Playwright check. Port cases, not the harness |

## License steps (MIT code inside the GPL-3.0 fork)

CCP's `LICENSE` is the MIT text, "Copyright (c) 2025 Alex Pfau", whose one condition is that "the above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software". The Free Software Foundation calls this text the Expat License and lists it as "a lax, permissive non-copyleft free software license, compatible with the GNU GPL" ([license list](https://www.gnu.org/licenses/license-list.html#Expat)). This is my reading, not legal advice.

1. **Rewrite from the rule by default.** Every row marked "rule" above is an idea or a set of test inputs and answers, written fresh in the house's style. That needs no notice *(inferred)*. Add one comment line anyway, so a later reader can find CCP's test:

   `// Rule from Calendar Card Pro (MIT), src/utils/format.ts:496-510 at 75bf292.`

2. **If a function ends up close to CCP's** (likely for borrows 3, 8 and 14, and `withTimeout` in borrow 4):
   1. Create `custom_components/family_hub/house_board/NOTICE`. It goes inside the house board's own folder, not at the repository root, because HACS installs `custom_components/family_hub/` on the Home Assistant box. A root-level file wouldn't travel with the installed copy *(inferred from how HACS installs an integration; not checked in HACS's code)*. Its content:
      - one line: "Parts of this folder are adapted from Calendar Card Pro, https://github.com/alexpfau/calendar-card-pro, commit 75bf292.";
      - CCP's `LICENSE`, verbatim: the title, the copyright line, the permission paragraph and the warranty paragraph;
      - one line: "The house board as a whole is under GPL-3.0; see LICENSE at the repository root."
   2. Put one line above each copied function:

      `// Adapted from Calendar Card Pro (MIT; see NOTICE): src/utils/grid.ts:1401-1460 at 75bf292.`

      One line costs the 500-line file cap almost nothing; the notice, about 25 lines, lives once, in `NOTICE`.
   3. Don't change or drop CCP's copyright line, in `NOTICE` or anywhere it's quoted.
   4. Leave the fork's `LICENSE` (GPL-3.0) as it is. The house board as a whole is distributed under GPL-3.0, with the MIT parts keeping their own notice.
3. **Tests.** Port test cases as fresh Node checks; that needs only the credit line. If a CCP test file is copied substantially into `tests/`, give it the same one-line pointer and keep a copy of the notice at `tests/NOTICE`. `tests/` is in the public repository but isn't installed by HACS.
4. **Take only CCP's own code.** CCP's `NOTICE` lists Lit (BSD-3-Clause) and Home Assistant's frontend (Apache-2.0) as sources of some of its code and patterns. Every borrow above is from CCP's own modules (`src/utils/`, `src/interaction/`, the card's lifecycle). The `hass-action` and `weather/subscribe_forecast` shapes are Home Assistant's public interfaces, not copied code *(inferred)*.
5. **Record it in the history.** The PR description and commit message name CCP, the commit `75bf292`, and the files adapted.
6. **The size check.** #44's check (500 lines a file, 3,000 a folder) isn't written yet. When it is, count `.js` files only, or `NOTICE`'s 25 or so lines count against the folder cap *(inferred)*.

## What I could not check

- **Nothing of CCP was run,** by rule. Behavior comes from its code, comments, tests and release notes at `75bf292`.
- **My own Node one-liners,** run in this container under `TZ=America/New_York` and outside CCP's folder, checked three date facts:
  - the fall-back minute tick;
  - the spring-forward day count;
  - `new Date("2026-11-01")`.

  They weren't run on the tablet's WebView or iOS.
- **The calendar feature bits** come from Home Assistant core's `dev` branch, read on 2026-11-01, not from the house's installed version.
- **The license steps are my reading, not legal advice.** The FSF page was opened with Firecrawl because gnu.org answered WebFetch with HTTP 429 three times.
- **That HACS installs a `NOTICE` file with the integration** is inferred from how HACS copies an integration folder, not checked in HACS's code.
- **Not checked:**
  - the name of Home Assistant's dark flag (`hass.themes.darkMode`);
  - whether every entity's state object keeps its identity until it changes (CCP relies on it);
  - whether Fully fires `visibilitychange` when its screen turns off. The day key on every tick covers a missed midnight either way.
- **The house weather entity's real forecast** (horizon, precipitation fields, how it stamps daily entries) wasn't read.
- **Line counts, the ranking and the test-line total are estimates.**

## Verification

A skeptic's check, 2026-11-01, against CCP at `75bf292` (`git log -1` in the clone gives `75bf2925306a...`). I opened every cited `path:line` with `sed` and `grep` and ran nothing of CCP's. I re-ran the date arithmetic in my own Node one-liner under `TZ=America/New_York`, outside CCP's folder. Each item is confirmed, corrected (the borrow stands, a detail is wrong) or refuted. No borrow is refuted outright; three sub-claims are, and each is named in its item.

### The 20 borrows

1. **Local dates: confirmed.**
   - `parseAllDayDate` (`src/utils/format.ts:496-500`), `getLocalDateKey` (`:508-510`), `getCalendarDayDiff` (`:685-690`), and `startOfDay` and `addDays` (`src/utils/grid.ts:266-282`) do what is said.
   - The tests at `tests/all-day-parse.dst.test.ts:53`, `:67`, `tests/grid-geometry.dst.test.ts:157-186` and `tests/countdown-calendar-days.dst.test.ts:43`, `:51` match.
   - Issue [#28](https://github.com/alexpfau/calendar-card-pro/issues/28) is a reporter on US Mountain time seeing all-day events a day early; the fix is `docs/RELEASE_NOTES.md:2311`.
   - My Node run: `new Date("2026-11-01")` is Oct 31, 8 pm EDT. From Mar 13, 2027, 11 pm to Mar 15, 9:30 am, `Math.floor` gives 1 day and `Date.UTC` gives 2. 2027-03-14 is New York's next spring-forward.
   - Ten lines for five functions of one to three lines each is plausible.

2. **Date tests under real zones: corrected.** The borrow stands; these details are wrong.
   - The `*.dst.test.ts` files run under Berlin, Sydney and New York only, not "as well as UTC": the UTC project excludes them (`vitest.config.mjs:30`). The port is unchanged: the house should still run its date checks under UTC too, because CI runs there.
   - **Refuted sub-claim:** "seventeen times under New York, none under the others". The comment says the planted UTC parse "failed twice under each of those zones and seventeen times under New York" (`vitest.config.mjs:55-56`). New York is still the zone that catches it best.
   - "Each such file first asserts that January and July offsets differ" holds for 19 of the 22 `.dst.test.ts` files. `all-day-parse`, `multiday-midnight` and `weather-hourly-key` have no `getTimezoneOffset` guard; the first asserts that `TZ` isn't UTC instead (`tests/all-day-parse.dst.test.ts:67-75`).
   - The table says 5 lines in `run_all.sh`; the text says three, with the two-line guard in the test file. Three is right for `run_all.sh` *(inferred)*.
   - Confirmed: the guard (`tests/countdown-calendar-days.dst.test.ts:37-41`), the `Intl` oracle (`tests/event-time-zone.dst.test.ts:36-60`), the fork's CI setting no `TZ` (nothing in `.github/` or `tests/run_all.sh`), and this container's `TZ=America/New_York`.

3. **One bad event costs one row: confirmed.**
   - `keepWellFormedEvents` (`src/utils/events.ts:731-806`) applies each listed rule; the quoted reason is at `:707-708`.
   - CCP's own fall-back example uses Berlin offsets (`:717`). The report's New York version is right: `01:30-04:00` is 05:30Z and `01:15-05:00` is 06:15Z.
   - "Keeps the original beside it" means a `_source` snapshot of the fetched fields (`sourceEvent`, `:686-698`), not the object itself.
   - Release note `:503` and all eight test citations match.
   - CCP's function is about 45 lines of logic plus logging. 25 plain lines is plausible; 30 is more likely *(inferred)*.

4. **Calendar answers: corrected.**
   - Confirmed:
     - `withTimeout` (`src/utils/events.ts:2631-2638`) and its 30 s (`src/config/constants.ts:77-84`);
     - a try and catch per calendar inside one `Promise.all` (`:2576-2620`);
     - success judged per calendar (`:436-440`);
     - a failed calendar keeping its events (`:479-493`);
     - every failure recorded (`:501-520`);
     - only the newest request writes (`:527-531`), and the card's ticket (`src/calendar-card-pro.ts:3698-3705`);
     - the 15 s life of an empty answer (`constants.ts:28`; `events.ts:522-527`);
     - release notes `:220`, `:630`, `:221`, `:502` and `:219`, and all eight test citations.
   - **Missing detail:** CCP keeps a failed calendar's events for 24 hours at most (`MAX_STALE_HOURS`, `constants.ts:34`; `events.ts:490`). The port should say how long the house keeps a failing calendar's copy, even if the answer is "until it answers" *(inferred)*.
   - "A second look before an empty answer replaces a full copy" is the house's own rule, not CCP's. CCP draws an empty answer at once and only shortens its cache life to 15 s. The text says so; the table row reads as if CCP did it.
   - **Refuted sub-claim:** "Home Assistant can answer empty while starting ([#297](https://github.com/alexpfau/calendar-card-pro/issues/297))". #297 reports a card stuck on an old week. The maintainer's stated cause was the card rendering before `hass` was ready, and the short empty cache came with that fix. The empty-answer rule still stands on CCP's general reasoning.
   - 25 lines for `withTimeout` and four more rules is tight; 30 to 40 is likelier *(inferred)*.

5. **One minute tick: corrected (a quote only).**
   - The three timers are where cited: `src/calendar-card-pro.ts:1593-1620`, `:1636-1672` with the date at `:1655`, and `:1693-1745`. `_tickNowLine` compares day keys (`:1754-1770`).
   - The quoted words "including a rollover that passed while the timer was stopped" are not in the source. The comment reads "Keep the key across stops so a hidden or disconnected card can detect that midnight passed before the timer was reacquired" (`:1609-1610`).
   - My Node run confirms the trap. Armed at 1:59:30 am EDT on 2026-11-01, local fields wait 3,631 s, to 2:00:01 EST; `61000 - (Date.now() % 60000)` waits 31 s, to 1:00:01 EST.
   - code-ui.md row 2 does pair the tick with `:1655`, so the correction of it is right.

6. **Hidden, removed, late: confirmed.**
   - `disconnectedCallback` (`src/calendar-card-pro.ts:1413-1470`) stops the timers, removes the listener, unsubscribes weather and bumps the ticket (`:1436-1441`).
   - `_scheduleRefresh` returns when disconnected (`:2959-2970`); the weather version ticket is at `:3013-3055`; visibility is at `:2872-2892`.
   - Release note `:186` and both test citations match. 15 lines is plausible.

7. **The `hass` gate: confirmed.**
   - `_gridDisclosureChanged` (`src/calendar-card-pro.ts:2365-2387`) compares three locale fields, and each configured entity's state object by identity.
   - The card defines no `shouldUpdate` (a `grep` finds none), so Lit renders on every `hass`.
   - Home Assistant's [card docs](https://contributors.home-assistant.io/frontend/custom-ui/card/) say `hass` is "Set with a new `hass` object whenever the state of Home Assistant changes."
   - 10 lines is plausible.

8. **Timed events split at local midnights: confirmed.**
   - `splitTimedEventByDay` (`src/utils/grid.ts:1401-1460`):
     - keeps every part timed and walks days with `addDays`;
     - skips zero-length parts, so a midnight end adds no day;
     - keeps a zero-length event as an instant when it falls inside the window;
     - bounds parts to the window.
   - `resolveDisplayDate` (`src/utils/events.ts:916-921`) and the list splitter's midnight rule (`:1890-1901`) match.
   - Release notes `:500` and `:207`, and all five test citations, match.
   - CCP's function is about 45 lines of logic; 25 plain lines is plausible.

9. **Saves not undone by an older ask: confirmed.** The write generation on `globalThis` (`src/utils/events.ts:152-177`) and the newest-request rule (`:195-203`, `:527-531`) work as described. Tests `tests/event-fetch-resilience.test.ts:276` and `:307` match. 8 lines is plausible.

10. **Weather by subscription: confirmed.**
    - `subscribeToWeatherForecast` uses `weather/subscribe_forecast` through `hass.connection.subscribeMessage` (`src/utils/weather.ts:350-388`).
    - `processForecastData` keys daily entries by local date and hourly ones by local date and hour (`:72-120`). It reads no precipitation (`:109-117`), though the type has the fields (`src/config/types.ts:770-771`).
    - The hourly key would collide on the repeated 1 am, as the report infers.
    - All four test citations match.

11. **All-day ends and expiry: corrected (history only).**
    - `:1137-1145` and `allDayExpiryInstant` (`src/utils/events.ts:983-1009`) work as described.
    - "Before v4, past all-day events never left" is off. The fix is in v4.1.0 (`docs/RELEASE_NOTES.md:364`, in the section that starts at `:296`). It applied when `show_past_events` was off and the window reached back.
    - The test at `tests/allday-expiry.test.ts:174` matches; "gone after midnight" is `:181`.

12. **Merged plans: confirmed.**
    - `generateEventSignature` compares timed starts and ends as epoch milliseconds (`src/utils/events.ts:2104-2118`).
    - Eligibility runs before the merge (`:1233-1262`), and `deduplicateEvents` records every contributing calendar (`:826-905`).
    - Release note `:206` and the three tests match.

13. **Change and Delete rules: corrected.**
    - Confirmed: `detailPermissions` (`src/interaction/event-details.ts:115-134`), the bits 1, 2 and 4 (`src/interaction/ha-calendar-dialogs.ts:29-36`), `calendarSupports` (`:101-108`), `buildDetailEntry` writing from `_source` (`event-details.ts:61-79`), and all six tests.
    - I re-read Home Assistant core's `dev` branch. CalDAV sets `CREATE_EVENT` only. Google sets `CREATE_EVENT | DELETE_EVENT`, and only when not `read_only`. Local Calendar sets all three. The table is right.
    - The quote "may be a day out of date" is not in the source. It says a failing calendar's events are "drawn from the cache, up to a day old" (`event-details.ts:102-104`).
    - **Missing rule:** Edit also needs an end the calendar stores (`storedEnd`, `:128-131`), so an end CCP made up is never written back. The house needs the same check on borrow 3's repaired instants.

14. **One bar for a multi-day all-day event: confirmed.**
    - `computeBannerPlacement` (`src/utils/grid.ts:1536-1573`) returns the column, the span and both continuation flags. The quoted comment is at `:1524-1525`.
    - CCP's `NOTICE:26-37` says "No code was carried across" for the banner idea.
    - Tests `tests/grid-geometry.dst.test.ts:306` and `:330` match, and `tests/grid-geometry.test.ts` covers the continuation flags.
    - 18 lines is plausible.

15. **Navigation through Home Assistant: confirmed, with a license note.**
    - `fireHassAction` (`src/interaction/actions.ts:36-47`), `navigateToCalendarPanel` (`src/interaction/ha-calendar-dialogs.ts:353-355`), the quoted comment (`:347-349`) and `hass-more-info` (`:366-375`) work as described.
    - CCP builds a plain `Event` and assigns `detail` afterwards. Home Assistant frontend's `fireEvent` uses the same idiom ([fire_event.ts](https://github.com/home-assistant/frontend/blob/dev/src/common/dom/fire_event.ts), Apache-2.0, one of the sources CCP's `NOTICE` names).
    - So write it as `new CustomEvent('hass-action', { bubbles: true, composed: true, detail })`, which keeps it plainly the house's own *(inferred: Home Assistant's handler reads `ev.detail`, which a `CustomEvent` carries)*.

16. **Details as text: confirmed, with two notes.**
    - `stripHtmlTags` (`src/utils/format.ts:464-472`) and its regex (`:456`) work as described. The test rows that join lines are `tests/strip-html-tags.test.ts:231` and `:239`.
    - The hard-won part is the one-line regex `HTML_MARKUP` (`:456`). It leaves prose such as "5 < 10 and 20 > 3" alone (`tests/strip-html-tags.test.ts:119-150`; CCP issues #576 and #581). Port it nearly as written, with the credit line, and port those prose cases too.
    - A small entity table gives up the `<textarea>`'s full decoding, so a named reference outside the table, such as `&rsquo;`, would show raw *(inferred; I didn't check what Google or iCloud send)*.

17. **Countdowns by calendar day: corrected (a detail).**
    - `getCountdownString` (`src/utils/format.ts:195-232`) works as described, and release note `:280` matches.
    - Under 2 hours CCP gives minutes, not hours: "in 10 minutes" (`tests/countdown-calendar-days.dst.test.ts:48`). The port's "hours for later today" should keep minutes under 2 hours.
    - That makes 6 lines about 8 *(inferred)*.

18. **A filter that always shows it's on: confirmed.** These match:
    - the gray chip and its comment (`src/rendering/legend.ts:492-530`, `:497`);
    - the `hidden-calendar` style (`src/rendering/styles.ts:1019-1022`);
    - the dot on the folded filter (`:952-967`);
    - `_shownEvents`, memoized on `events` and the hidden set (`src/calendar-card-pro.ts:1036-1053`).

19. **Fit text again after fonts load: confirmed.** `fonts.ready` and `loadingdone`, with an `active` flag cleared on cleanup, are at `src/calendar-card-pro.ts:2305-2324`.

20. **A few lines of CSS: corrected (citations).**
    - `tabular-nums` (`src/rendering/styles.ts:479`), `@media (hover: hover)` (`:1107-1121`) and the delayed dim (`:675-680`) match.
    - `min-width: 0` on each column is in the stylesheet (`.day-column`, `styles.ts:3503-3507`). `column.ts:382` has only `minmax(0, 1fr)`.
    - CCP's `prefers-reduced-motion: reduce` rule (`styles.ts:946-950`) turns off one transition only, on the reset button. Its title scrolling uses the other form: motion only under `no-preference` (`:2114`). Either fits the house; the borrow is the habit, not CCP's rule.

### License steps: corrected (one detail)

- **Confirmed:**
  - CCP's `LICENSE` is the MIT text with "Copyright (c) 2025 Alex Pfau" and the quoted condition.
  - CCP's `NOTICE` names Lit (BSD-3-Clause) and Home Assistant's frontend (Apache-2.0) (`NOTICE:7-19`).
  - #44 puts the code in `custom_components/family_hub/house_board/`. HACS's [integration docs](https://hacs.xyz/docs/publish/integration) say everything the integration needs goes in that folder, so a `NOTICE` there travels with it *(inferred; HACS's code not read)*.
  - I didn't reopen the FSF page.
- **Corrected:** the list for `NOTICE` names the title, the copyright line, the permission paragraph and the warranty paragraph. `LICENSE` also has a separate condition paragraph ("The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software."). Copy all 21 lines of `LICENSE` unchanged.
- **Add:** `HTML_MARKUP` (borrow 16) to step 2's likely near-copies, and borrow 15's `CustomEvent` note to step 4.

### Other rows, spot-checked

- **Knowledge section:** these match:
  - light-dark following the OS (`src/rendering/styles.ts:2854-2862`);
  - `src/calendar-card-pro.ts:2945-2960` and `:2975-2977`;
  - `src/utils/events.ts:2725-2726` against `:665-671`;
  - keys holding the index (`src/rendering/render.ts:544-545`).

  The `.js.gz` account is CCP's `AGENTS.md:1091-1105`. One item the report left unchecked is now settled: Home Assistant's frontend defines `darkMode: boolean` on `hass.themes`, "Currently effective dark mode" ([ws-themes.ts](https://github.com/home-assistant/frontend/blob/dev/src/data/ws-themes.ts), `dev` branch).
- **Not-borrowed table:** the citations I sampled land on the named code:
  - `retryDelayMs` at `events.ts:570`, doubling from 60 s (`constants.ts:41`);
  - the sort at `:1450`;
  - `nextEventBoundary` at `:2451`;
  - `closeMenu` with a `<dialog>` at `legend.ts:346`;
  - `ha-icon` at `leaves.ts:972`;
  - the pointer handler at `calendar-card-pro.ts:3151`.

  Two counts differ: the editor is 8,947 lines of TypeScript outside its translations (14,307 with them), not 9,006, and the hour-grid files are 4,954 lines.

### What this check couldn't do

- I fetched Home Assistant core's three `calendar.py` files from `raw.githubusercontent.com` with `curl`, not WebFetch, on 2026-11-01. The house's installed version wasn't read.
- Not checked:
  - what Google and iCloud put in Details;
  - whether HACS's gzip step also covers an integration's `.js` files, and whether Home Assistant serves the `.gz` on the integration's static path;
  - whether Fully fires `visibilitychange`;
  - the FSF page.
- The line counts in this section are my own judgment *(inferred)*.
