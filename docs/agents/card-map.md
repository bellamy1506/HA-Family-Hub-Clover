# Map of the week calendar card (for agents)

`custom_components/family_hub/card/family-week-calendar-card.js` is the board: one unbundled browser file, about 26,000 lines. Read this map before opening it. Find code by **method name** (`grep -n "^_name(\|^async _name("`), never by line number: lines move with every change. `tests/test_card_map.js` fails if a method named here disappears, so the names stay true. Written 2026-10-27 from the work on issue #5 and PR #14. Terms (copy, view, settled, event shape) are defined in [CONTEXT.md](../../CONTEXT.md); the code calls a copy a "device" and a view a "mode" or "variant".

## Before you edit

- **Edit the served copy only:** `card/family-week-calendar-card.js`. `__init__.py` registers it (`card_path`, in `async_setup`). The same-named file directly under `custom_components/family_hub/` is an unused, newer, 31,000-line copy. Editing it changes nothing on the board, and that mistake has happened (fork PR #2).
- **Code style:** methods and statements start at column 0; the file isn't indented. Two classes live in it: `FamilyWeekCalendarCard` first, then its editor, `FamilyWeekCalendarCardEditor`, near the end. Both define `setConfig` and `connectedCallback`; `tests/lib/card_source.js` resolves to the card's. Comments are long and narrative. House changes are marked `// House fork:`, so `grep -n "House fork" <file>` lists every house change in the card.
- **Upstream merges:** every house change is a future merge conflict (see the fork's CLAUDE.md). Prefer new house-only methods called from one line in upstream code over edits spread through it.
- **Escapes in tool calls:** tool-call text is decoded as JSON, so a `\u00a0` escape typed into a file-writing call arrives in the file as the character itself. That's how an invisible no-break space reached the card twice on 2026-10-26. Type the backslash twice in the call, or write the line from a script. `tests/test_house_lines_clean.js` fails on any invisible character the house adds, and on any edit to the unused copies.
- **The served card is older than upstream's top-level copy.** Read behavior from the served copy, not from upstream docs or the unused copy. For example, the served card's own registry lacks Week's `agenda` choice, which the server accepts.

## Load sequence

```text
set hass (first time)                        -> _initFirstLoad (not awaited)
  connectedCallback                          -> _registerFabCoordinator, _syncHeight timers (rAF, 300 ms, 1200 ms, every 1.5 s)
  _build (once)                              -> _applyCachedThemeVarsIfAny: paints last session's theme vars
_initFirstLoad
  await _fetchSettings                       -> _applySizeVars, _renderGrid   (theme list not loaded yet: _resolveTheme
                                                uses _rememberedGlobalTheme, house)
  await _fetchEventPeopleOverrides, _fetchMyPermissions
  this._viewMode = defaultView ? _getMonthViewVariant() : _getWeekViewVariant()
  _updateNavLabel                            (house: title right away)
  _refreshAllData                            -> _fetchEvents, _fetchMealPlan, _fetchWeather, _fetchGlobalThemes,
                                                _fetchReminders, ... (all fire-and-forget)
  _startPolling                              -> _fetchSettings + _refreshAllData every 60 s
  _reportDeviceSettings().then(_checkPendingDeviceSettings)   (house: report first, see copy sync)
  _subscribeDeviceSettingsPush, ..., _fetchPrivacyModeState  (house: once privacy is known, re-render so shapes show)
_fetchEvents                                 -> _askCachedEvents (house: the server's copy, shown at once when it covers
                                                every column), then hass.callApi GET calendars/<entity>?start&end, one
                                                per person, all at once; iCloud costs about 0.1 s per event, so Will's
                                                column took about 3 s on the phone (J008); with the copy showing, each
                                                answer replaces its column (_showLiveCalendar); sets _eventsViewMode
                                                (house); then
                                                _renderGrid, _renderLegend, _updateNavLabel, and with no errors
                                                _recordSettledLayout (house), _saveCalendarCopy (house)
```

Anything drawn before `_fetchEvents` lands has no events. That gap caused every "jumps on open" bug fixed in PR #14. Other fetches (meals, reminders, weather, names) also call `_renderGrid` when they land, often before the calendars.

## Rendering

`_renderGrid` calls `_applySizeVars` (theme and size CSS variables), then dispatches on `this._viewMode`. Then come the house methods `_settleShapes` and `_holdGridSize`. Several renderers run a post-render step that a later DOM change must respect: `_afterRenderDayColumns` and `_afterRenderPersonLanes` scroll each timeline `.events` to the current hour.

| `_viewMode` | Renderer | Day unit (house tag `data-fh-unit`) | Event elements |
|---|---|---|---|
| `month` | `_renderMonthGrid` → `_buildMonthCellsHtml` | `.month-cell` `cell\|date` | `.mc-pill`, `.mc-more` |
| `split` | `_renderMonthSplitGrid` → `_buildMonthCellsHtml` + `_buildMonthSplitDetailHtml` | cells, plus `.msd-items` `detail\|date` | `.mc-pill`, `.msd-item` |
| `week` | `_renderWeekGrid` → `_buildDayColumnHtml` | `.day-col` `day\|date` | `.event`, `.all-day-chip`, `.tl-event` (timeline) |
| `planner` | `_renderPlannerGrid` (layout chosen by width, 700 px breakpoint) | `.planner-person-cell` `planner\|date\|entity`; phone: `.planner-mobile-day` `planner-m\|date` | `.event.planner-event` |
| `day` | `_renderDayGrid` → `_buildDayLikeContext`, `_buildPersonLaneHtml` | `.day-col.person-lane` `lane\|date\|entity or family` | `.event`, `.all-day-chip`, `.tl-event` |
| `agenda` | `_renderAgendaGrid` | `.agenda-day-group` `agenda\|date` | `.agenda-item` |

- **Families:** `_viewFamily` groups `month` and `split` as the Month family, and the rest as Week, except `day`. Week and Month variants are per-copy settings: `_getWeekViewVariant`, `_getMonthViewVariant`.
- **Containers that exist only with events:** `.all-day-row`, and Planner's phone `.planner-mobile-person` blocks. So you can't inject events into an empty render; restore a whole unit instead.
- **Empty states:** `.msd-empty`, `.agenda-empty`, `.planner-mobile-empty` ("Nothing scheduled" or "Nothing planned").
- **Privacy:** every renderer reads events through `_privacyEventsFor` and `_privacyReminders`, which return nothing while `_privacyModeEffectiveLocked`. `_syncPrivacyModeOverlay` re-renders when that flips.
- **Clicks:** handled by one delegated listener on `.grid`, which opens `[data-event-id]` through `_eventDetails`. An element without `data-event-id` does nothing when tapped.
- **Height:** `_syncHeight` sizes the card's host to the viewport. The board is a panel view, inside a vertical stack (the full and "Hide work calendars" copies of the card, plus a tile).

## Theme

- **Resolving:** `_resolveTheme(settings)` applies `_getDeviceThemeOverride` (localStorage `familyHubDeviceThemeOverrideLocal`: `""` means household, `__default__` means local, else a theme id) over the household `useGlobalTheme`/`globalThemeId`. It looks the id up in `this._globalThemes`, which `_fetchGlobalThemes` (`theme_builder/list`) loads. If the id isn't found, it falls back to `_defaultTheme()`, which is cream (#fbf7e5) with brown (#8f5a00).
- **Cache:** `window.__familyHubThemeCache` stores the applied CSS vars per `_familyHubThemeCacheKey`, and `_build` repaints them before the first render.
- **House fix:** `_rememberGlobalThemes` saves the themes in use after each list. Until the list loads, `_resolveTheme` uses `_rememberedGlobalTheme`. Without it, `_fetchSettings` painted cream on every open.
- **Don't early-return from `_applySizeVars`:** it also sets holiday and Halloween backgrounds and block sizes. An earlier fix did, and the review caught it.

## House-only changes in this file

- **Title only top bar:** `_getTopBarTitleOnly`, the `top-bar-title-only` host attribute and its CSS (fork PRs #3 and #4). Test: `tests/test_title_only_top_bar.js`.
- **Copy sync (issue #5):** a copy is one browser storage. `_reportDeviceSettings` sends `applied_seq`/`instance_applied_seq`. `_applyPushedDeviceSettingsLive` reports again after applying. The theme picker reports on change. `familyHubDeviceThemeOverrideLocal` is in `_deviceSettingsFieldRegistry`. Server side:
  - `copy_sync.py`: who gets what; no Home Assistant imports.
  - `device_settings_websocket_api.py`: `ws_report` wiring.
  - `const.py`: `DEVICE_SETTINGS_FIELDS`, which must match the card's registry by hand.

  Tests: `tests/test_copy_sync.py`, `tests/test_copy_sync_report.py` (Home Assistant stubbed), `tests/test_copy_sync_card.js`.
- **Opens settled (PR #14):**
  - `_rememberGlobalThemes`, `_rememberedGlobalTheme`: no cream flash.
  - `_updateNavLabel` in `_initFirstLoad`: right title immediately.
  - `_holdGridSize`: holds last height (reads only).
  - `_settleShapes`, plus `_shapeMode`, `_shapeEventLike`, `_shapeKeepText`, `_shapeKeepLive`, `_readLayout`:
    - restore each day unit's blanked event shapes;
    - put back the live parts that load before the calendars (dates, day headers, meal blocks), and the day's live meal pills however many there are now;
    - carry over the timeline's `.events` scroll;
    - after a view switch, skip days inside `this._eventsRange` (already fetched).

    It reads everything first and then writes, so there's one layout pass.
  - `_recordSettledLayout`, plus `_blankShape`, `_shapeLayoutKey`, `_shapeCalendars`: save the shapes and the height together. It runs only from `_fetchEvents` when no calendar errored, only while the card is on screen (`getClientRects().length`), and only when the board as drawn changed or its layout was dropped from storage (`this._shapeLayoutSignature`, a hash).
  - Text kept in stored shapes is matched on the element's own class (`matches`, not `closest`), so badges and birthday marks are always blanked. People's names in Planner's phone layout are kept; discreet mode has its own layouts.
  - `_holdGridSize` holds only on a first open or when `_settleShapes` restored a day (`this._shapesRestored`).
  - `this._eventsViewMode`, set in `_fetchEvents`, means "events are in for this view."
  - Shapes wait until privacy mode is known (`this._privacyModeEffectiveApplied !== undefined`).

  Tests: `tests/test_theme_no_flash.js`, `tests/test_board_no_jump.js`, `tests/test_event_shapes.js`, `tests/browser/test_board_open.js`.
- **Server's copy of the calendars (owner, 2026-10-26):** the server (`calendar_cache.py`, no Home Assistant imports; wiring and the hourly refresh in `calendar_cache_websocket_api.py`) keeps each calendar's events in memory, refreshed every hour and by every board's live check. `_askCachedEvents` asks for it beside the live check, but not when this view's range is already showing (the 60 s poll). `_showCachedEvents` shows it only when it covers every column, once privacy mode is known (`_fetchPrivacyModeState` re-calls it), and never after the live check finished; it sets `this._eventsViewMode`, so the saved shapes step aside. `_showLiveCalendar` swaps in each column's live answer; `_saveCalendarCopy` sends the live results back. With no copy (after a restart, or a range nobody has opened), the board waits for every column as before. Tests: `tests/test_calendar_cache.py`, the "Server copy" checks in `tests/browser/test_board_open.js` (harness `cache=1`, `slow=`, `privacydelay=`).
- **Open timing (owner, 2026-10-26):** `_markOpen` records each step of the first open (file ran, Home Assistant connected, the three setup fetches, calendars asked, server copy shown, each calendar answered, all calendars live) in ms since the page began loading; `_openTimingLines` lists them at the top of Settings > Debug Info, with the address. Hooks: one line each in `set hass`, `_initFirstLoad`, `_fetchEvents`, `_renderDebug`. Add a mark for any new step on the open path. Test: the "Debug Info shows the open timing" check in `tests/browser/test_board_open.js`.

- **Every popup stays closable (owner, 2026-10-26):** the house CSS after `.debug-box` applies to every `.modal-overlay`. It starts below Home Assistant's top bar (`--fh-header-offset`) and fits the space left. Each `.modal-box > .modal-close` is `position: sticky` (`top: -14px`, since sticking happens inside the padding), so it stays where it sat while the popup scrolls. The two full-screen popups (recipe viewer, step editor) keep their `position: fixed` close buttons. Their `.modal-box` drops the glass themes' `backdrop-filter`, which made "fixed" scroll with the box. The + button is hidden while any popup is open (`:host(.modal-open)`). Debug Info also closes on a tap outside it, and only Debug Info: an editor would lose what was typed. A new popup gets all of this by using `.modal-overlay` > `.modal-box` > `.modal-close` first. Tests: the "Every popup" and "Debug Info: close button stays reachable" checks in `tests/browser/test_board_open.js`.

- **Wall tablet text sizes (Clover Tablet loop, 2026-10-28):** one house CSS block at the end of the card's main `<style>` (just before `</style>`, after `.ha-starting-banner`). Timeline events (`.tl-event`, Day view and Week with the timeline), Agenda rows and Split's day list (`.msd-item-time`, `.msd-item-summary`, `.msd-date`; 2026-10-29) follow the theme's event size (`--fs-event`) instead of fixed 9 to 13 px. On the timeline the title comes first and the time under it; `.tl-event` is a size container, and `@container` rules in em clamp the title to one line in short events and hide the time in the shortest, so nothing shows cut in half. Test: the "Tablet text" checks in `tests/browser/test_board_open.js` (harness `eventfont=`, 1200×800).

- **Current-time line (Clover Tablet loop, 2026-10-28):** `_drawNowLine`, one hook at the end of `_renderGrid` (after `_settleShapes`, since a restored day can carry a saved line), puts a `.fh-now-line` in each timeline whose unit (`data-fh-unit`) is today: one in Week with the timeline, one per lane in Day view. `_placeNowLine` sets its height in `style.fh-now-style`, a stylesheet in the shadow root outside the grid, so the grid's HTML (which `_recordSettledLayout` hashes) changes only when the day does. It uses the timeline's own geometry: 40 px an hour from `timelineStartHour`. The 60 s poll's redraw moves it; there's no timer of its own. CSS in the house block before `</style>` (under the events: `.timeline > .tl-event { z-index: 2 }`). Test: the "Now line" checks in `tests/browser/test_board_open.js`.

- **Today's header (Clover Tablet loop, 2026-10-28):** CSS only, in the house block before `</style>`: `.day-col.today > .day-header` filled with `--fc-accent` (text `--fc-accent-text`), as Planner's `.planner-day-cell.today` already is; the fill's extra 4 px is a box-shadow, so no layout moves. Applies to Week (any number of days) only. Test: the "Today:" checks in `tests/browser/test_board_open.js`.

- **Agenda dims past events (Clover Tablet loop, 2026-10-29):** `_agendaPastClass(eventId, dayEnd)` returns `" past"` when `greyOutPastEvents` is on and the item has ended, by the other views' `isPastEvent` rule (a day that's over is dimmed whole; today, an event once its end passes, a reminder once its start does; all-day events end at the next midnight). It reads the item from `this._eventDetails`. Hook: one attribute in `_renderAgendaGrid`'s item template (`class="agenda-item event${...}"`). Upstream's `.event.past` (opacity 0.45) dims it; no new CSS. Tests: `tests/test_agenda_past.js`, the "Agenda: past" checks in `tests/browser/test_board_open.js` (harness `grey=off`).

- **First hour label whole (Clover Tablet loop, 2026-10-29):** CSS only, in the house block before `</style>`: `.timeline > .hour-row:first-child > .hour-label` sits just under its line (`top: 1px`) instead of upstream's 7 px above it, which the scrolling `.events` cut in half. Other labels, hour lines, events and the now line don't move. Test: the "First hour label" checks in `tests/browser/test_board_open.js`.

When adding a new view or a new kind of event element, also:
- tag its day unit with `data-fh-unit="kind|YYYY-MM-DD[|entity]"`;
- add its event class to `_shapeEventLike`;
- add any plain label class to `_shapeKeepText`;
- add any part that loads before the calendars (header, meals) to `_shapeKeepLive`;
- add a scenario to `tests/browser/test_board_open.js`.

## Browser storage keys (per copy)

Instance-scoped keys end in `__inst_<id>`. The id comes from `_getCardInstanceId`, one per URL path, stored in `familyHubCardInstanceIdLocal:<path>`.

| Key | Holds |
|---|---|
| `familyHubDeviceIdLocal` | the copy's id (`dev-…`), which the server calls a device |
| `familyCalendar*Local` (+ `__inst_`) | view settings; the list is `_deviceSettingsFieldRegistry` |
| `familyHubDeviceCustomNameLocal`, `familyHubDeviceThemeOverrideLocal` | copy name (never synced), theme |
| `familyHubDeviceSettingsAppliedSeqLocal` (+ `__inst_`) | last applied push seq |
| `familyHubThemeVarsCache::<key>` | cached theme CSS vars |
| `familyHubGlobalThemesLocal` | `{ id: theme }` for the themes in use (own override, household), from the last theme list |
| `familyHubShapesLocal:<view>:<width>:<calendars>:<view-settings hash>[:discreet]__inst_` | `{ h: settled height, u: { "unit key": blanked inner HTML } }`, ±45 days, about 150 KB max |
| `familyHubShapesIndexLocal` | the 4 most recent layout keys in this browser; older ones are removed |

## Testing

- **Everything:** `bash tests/run_all.sh` (CI runs it on each PR).
- **Node checks:** `node tests/<name>.js`, no dependencies. They read the card source and run real method bodies, extracted with `tests/lib/card_source.js` (`const { src, methodBody } = require("./lib/card_source")`), against a stub `this`.
- **One method, from a shell:** `node tests/lib/card_source.js _settleShapes` prints it with its line number. It's cheaper than grepping the 26,000-line file.
- **Python:** `python3 -m unittest discover -s tests`. It doesn't pick up `.js` files.
- **Browser:**
  - Run `node tests/browser/test_board_open.js`, or `ONLY=<text>` for a subset. It finds Playwright itself, including a cloud session's preinstalled copy, and skips without it. Don't run `playwright install` in a cloud session. One browser per check keeps a full run within memory.
  - `tests/browser/harness.html` mounts the served card with a fake `hass`. Query parameters: `view`, `week`, `month`, `timeline`, `cal` (calendar delay in ms), `fail=1`, `privacy=on`, `theme=<id>`, `eventfont=<px>` (with `theme=liquidglassdark`), `hdr=0` (no top bar); the comment at the top of the harness lists the rest. It serves a meal for today and counts calendar answers in `window.__calAnswered`. The test fixes the clock (`page.clock.setFixedTime`) so timelines scroll and holidays can be tested.
  - The harness page must declare UTF-8, or the card fails to parse with "Range out of order in character class."
  - It's the quickest way to reproduce a visual bug: screenshot `window.__el`'s shadow root at timed points.
- **Live checks, read-only:** use the Home Assistant connector (`ha_call_service` with `ws_command`):
  - `family_hub/device_settings/list`: every copy, its settings, user, and seqs.
  - `family_hub/get_settings`: household settings.
  - `ha_config_get_dashboard` `family-hub`: the board's config.
  - `ha_config_list_dashboard_resources`: the served card's `?v=` hash, the first 10 hex characters of the file's SHA-256.
