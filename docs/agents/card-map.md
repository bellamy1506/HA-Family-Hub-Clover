# Map of the week calendar card (for agents)

`custom_components/family_hub/card/family-week-calendar-card.js` is the board: one unbundled browser file, about 26,000 lines. Read this map before opening it. Find code by **method name** (`grep -n "^_name(\|^async _name("`), never by line number: lines move with every change. `tests/test_card_map.js` fails if a method named here disappears, so the names stay true. Written 2026-10-27 from the work on issue #5 and PR #14.

## Before you edit

- **Edit the served copy only:** `card/family-week-calendar-card.js`. `__init__.py` registers it (`card_path`, in `async_setup`). The same-named file directly under `custom_components/family_hub/` is an unused, newer, 31,000-line copy. Editing it changes nothing on the board, and that mistake has happened (fork PR #2).
- **Code style:** methods and statements start at column 0; the file isn't indented. Two classes live in it: `FamilyWeekCalendarCardEditor` near the top, then `FamilyWeekCalendarCard`. Comments are long and narrative. House changes are marked `// House fork:`, so `grep -n "House fork" <file>` lists every house change in the card.
- **Upstream merges:** every house change is a future merge conflict (see the fork's CLAUDE.md). Prefer new house-only methods called from one line in upstream code over edits spread through it.
- **The served card is older than upstream's top-level copy.** Read behavior from the served copy, not from upstream docs or the unused copy. For example, the served card's own registry lacks Week's `agenda` choice, which the server accepts.

## Load sequence

```text
set hass (first time)                        -> _initFirstLoad (not awaited)
  connectedCallback                          -> _registerFabCoordinator, _syncHeight timers (rAF, 300 ms, 1200 ms, every 1.5 s)
  _build (once)                              -> _applyCachedThemeVarsIfAny: paints last session's theme vars
_initFirstLoad
  await _fetchSettings                       -> _applySizeVars, _renderGrid   (theme list not loaded yet)
  await _fetchEventPeopleOverrides, _fetchMyPermissions
  this._viewMode = defaultView ? _getMonthViewVariant() : _getWeekViewVariant()
  _updateNavLabel                            (house: title right away)
  _refreshAllData                            -> _fetchEvents, _fetchMealPlan, _fetchWeather, _fetchGlobalThemes,
                                                _fetchReminders, ... (all fire-and-forget)
  _startPolling                              -> _fetchSettings + _refreshAllData every 60 s
  _reportDeviceSettings().then(_checkPendingDeviceSettings)   (house: report first, see copy sync)
  _subscribeDeviceSettingsPush, ..., _fetchPrivacyModeState
_fetchEvents                                 -> hass.callApi GET calendars/<entity>?start&end, one per person, about 2 s
                                                for the house's four iCloud calendars; then _renderGrid, _renderLegend, _updateNavLabel
```

Anything drawn before `_fetchEvents` lands has no events. That gap caused every "jumps on open" bug fixed in PR #14.

## Rendering

`_renderGrid` calls `_applySizeVars` (theme and size CSS variables), then dispatches on `this._viewMode`. Then come the house methods `_settleShapes` and `_holdGridSize`.

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
- **House guard:** `_applySizeVars` keeps the cached look while `_themeListPending(settings)`. Without it, `_fetchSettings` painted cream on every open.

## House-only changes in this file

- **Title only top bar:** `_getTopBarTitleOnly`, the `top-bar-title-only` host attribute and its CSS (fork PRs #3 and #4). Test: `tests/test_title_only_top_bar.js`.
- **Copy sync (issue #5):** a copy is one browser storage. `_reportDeviceSettings` sends `applied_seq`/`instance_applied_seq`. `_applyPushedDeviceSettingsLive` reports again after applying. The theme picker reports on change. `familyHubDeviceThemeOverrideLocal` is in `_deviceSettingsFieldRegistry`. Server side:
  - `copy_sync.py`: who gets what; no Home Assistant imports.
  - `device_settings_websocket_api.py`: `ws_report` wiring.
  - `const.py`: `DEVICE_SETTINGS_FIELDS`, which must match the card's registry by hand.

  Tests: `tests/test_copy_sync.py`, `tests/test_copy_sync_report.py` (Home Assistant stubbed), `tests/test_copy_sync_card.js`.
- **Opens settled (PR #14):**
  - `_themeListPending`: no cream flash.
  - `_updateNavLabel` in `_initFirstLoad`: right title immediately.
  - `_holdGridSize`: last height per view (`familyHubGridHeightLocal`).
  - `_settleShapes`, `_blankShape`, `_shapeMode`, `_shapeStoreKey`, `_shapeKeepText`, `_shapeEventLike`: each day unit's event shapes with text blanked (`familyHubShapesLocal`).
  - `this._eventsViewMode`, set in `_fetchEvents`, means "events are in for this view."

  Tests: `tests/test_theme_no_flash.js`, `tests/test_board_no_jump.js`, `tests/test_event_shapes.js`, `tests/browser/test_board_open.js`.

When adding a new layout or a new kind of event element, also:
- tag its day unit with `data-fh-unit="kind|YYYY-MM-DD[|entity]"`;
- add its event class to `_shapeEventLike`;
- add any plain label class to `_shapeKeepText`;
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
| `familyHubGridHeightLocal:<view>__inst_` | last settled grid or month-cells height |
| `familyHubShapesLocal:<view>:<width>:<calendars>__inst_` | `{ "unit key": blanked inner HTML }`, ±70 days |

## Testing

- **Node checks:** `node tests/<name>.js`, no dependencies. They read the card source and run real method bodies extracted with a `methodBody(name, params)` helper, which needs the `\nname(params) {\n` shape, against a stub `this`. Copy the helper from any `tests/test_*.js`.
- **Python:** `python3 -m unittest discover -s tests`. It doesn't pick up `.js` files.
- **Browser:**
  - Run `node tests/browser/test_board_open.js`. It needs Playwright and skips without it; in a Claude Code cloud session prefix `NODE_PATH=/opt/node-tools/node_modules`. Don't run `playwright install`.
  - `tests/browser/harness.html` mounts the served card with a fake `hass`. Query parameters: `view`, `week`, `month`, `timeline`, `cal` (calendar delay in ms). It counts answers in `window.__calAnswered`.
  - The harness page must declare UTF-8, or the card fails to parse with "Range out of order in character class."
  - It's the quickest way to reproduce a visual bug: screenshot `window.__el`'s shadow root at timed points.
- **Live checks, read-only:** use the Home Assistant connector (`ha_call_service` with `ws_command`):
  - `family_hub/device_settings/list`: every copy, its settings, user, and seqs.
  - `family_hub/get_settings`: household settings.
  - `ha_config_get_dashboard` `family-hub`: the board's config.
  - `ha_config_list_dashboard_resources`: the served card's `?v=` hash, the first 10 hex characters of the file's SHA-256.
