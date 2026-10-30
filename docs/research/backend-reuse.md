# What the house board can reuse from Family Hub's backend

Research note, 2026-10-30, for fork issue [#43](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/43) (map [#37](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/37)). Question: the house board will read the same calendars, lists and Family Hub storage as the week card. Which of the backend's websocket commands and stores does it need, what does each guarantee, which are fragile or tied to features the house doesn't use, and where would a new house service be cleaner than reusing one?

Sources: this repo's code at `house/board-next` commit `301c8ee` (the served card in `custom_components/family_hub/card/`, the Python modules in `custom_components/family_hub/`), Home Assistant core 2026.10.4 as installed in the sandbox's venv (the same version the house runs, per J008), and the house repo's [J006](https://github.com/bellamy1506/House-Modeling/blob/main/records/projects/J006-home-assistant-automations.md) and [J008](https://github.com/bellamy1506/House-Modeling/blob/main/records/projects/J008-family-hub.md). Code is cited by file and function name, never line number. Lines marked **[inference]** are my judgement, not something the code states. Nothing was run against the house; one claim (the settings normalizer drops unknown keys) was checked by running the card's real `_normalizeSettings` body under Node with `tests/lib/card_source.js`.

## The answer

The house board needs less of Family Hub's backend than the week card uses. Calendars, to-do lists, weather, the Hide work calendars switch and the privacy switch are all Home Assistant's own pieces, and the house board should call them directly, not through Family Hub's wrappers. The wrappers add a kid-oriented permission gate that is off by default for non-admins (Jenn and the wall tablet's user), and nothing the board needs. From Family Hub itself, the house board should **read** the household settings blob (theme choice, meal slot names, a few view defaults) and the theme list, keep using the house's own **calendar copy**, the **list of users**, Family Hub's server-side **rollover** of Us notes, and the way the integration **serves card files**. The meal plan's packed to-do format stays, read and written through a small house module that keeps unknown keys. It should **not** use per-copy settings and copy sync: they are shaped around the week card's localStorage keys, create Home Assistant entities for every copy, and would keep about 1,900 lines of entangled code alive after the week card retires. A small new house service for per-person board preferences is cleaner. The settings blob must never be written by the house board while any week card copy is still running, because the week card silently deletes every key it doesn't know at its next write.

## 0. Already built or decided

- **The server's calendar copy** (house, 2026-10-26, fork PR #17): `calendar_cache.py`, `calendar_cache_websocket_api.py`, J006 fork change 6.
- **Copy sync** (house, fork issue #5, PR #13): `copy_sync.py` on top of upstream's device settings; a user's view settings and theme follow them between their copies (J006 fork change 3).
- **Columns live in the dashboard, not Family Hub's Settings** (J006, 2026-10-25; refilled and emptied again 2026-10-29). Wave 0 stops a Settings save from refilling the list (`_rememberColumnsAtOpen`, `_columnsUnedited` in the served card).
- **Hide work calendars** is `input_boolean.board_private` with two conditional copies of the week card in the dashboard, and `automation.board_private_follows_guest_mode` (J006). Family Hub's own privacy mode is a different thing: it locks the whole board.
- **Voice capture writes Family Hub's formats directly** (J006): `script.board_add_note` adds to `todo.us_notes` with `<!--rollover:1-->`; `script.board_set_meal` writes `todo.meal_plan` with `{"block": 2}` for dinner; `script.whats_for_dinner` answers from the meal plan, including leftovers and weekly repeats.
- **The synthesis** ([synthesis.md](../board-next/synthesis.md), D1 **A**) already leaned this way: "The backend stays Family Hub's (settings, themes, copy sync, the calendar copy, the meal plan format) with house services added where needed." This note keeps that, except copy sync (section 5).

## 1. Inventory

"Whose" is upstream unless marked house. "HA" means Home Assistant core, not Family Hub.

| # | Item | Whose | Fragile or entangled? | Recommendation |
|---|---|---|---|---|
| 1 | Calendar reads: REST `GET /api/calendars/<id>`, `calendar/event/subscribe` | HA | No | Reuse as is |
| 2 | Calendar writes: `calendar.create_event`; `calendar/event/create`, `/update`, `/delete` | HA | No | Reuse as is, in place of Family Hub's wrappers (row 12) |
| 3 | To-do lists: `todo.get_items`, `add_item`, `update_item`, `remove_item`; `todo/item/subscribe`, `todo/item/move` | HA | No | Reuse as is |
| 4 | Weather: `weather.get_forecasts` | HA | No | Reuse as is |
| 5 | Entity states: `switch.family_hub_privacy_mode`, `input_boolean.board_private`, calendar `supported_features`, `hass.entities[...].platform` | HA (the privacy switch is Family Hub's entity) | No | Reuse as is |
| 6 | Household settings blob: `family_hub/get_settings`, `family_hub/set_settings` | upstream (+ house wave 0 in the card) | **Yes**: full replace, the week card's whitelist drops keys, side effects on write | Read behind a thin house wrapper; don't write while the week card runs |
| 7 | Themes: `theme_builder/list`, `theme_builder/save` | upstream | A little: side effects on list, full-list save | Reuse `list` as is (read only); leave `save` to the Theme Builder panel |
| 8 | Calendar copy: `family_hub/calendar_cache/get`, `/put` | **house** | No | Reuse as is |
| 9 | Per-copy settings and copy sync: `family_hub/device_settings/*`, `copy_sync.py`, the per-copy entities | upstream + **house** | **Yes**: week-card field names, entities per copy, entangled with screensaver, privacy participation, presets | Don't use; replace with a new house per-person preferences service |
| 10 | Privacy mode: `family_hub/privacy_mode/get_state`, `/subscribe`, `/set`, `/disable_with_pin`, `/list_eligible_users` | upstream | `disable_with_pin` is tied to kiosk PINs and chore permissions | Read the switch entity (or `get_state`/`subscribe` as is); the PIN unlock is the privacy ticket's call |
| 11 | "Also for" people on an event: `family_hub/get_event_people_overrides`, `/set_event_people_override` | upstream | **Yes**: keyed by calendar, start and title, so an edit orphans it | Read as is while the week card can still write them; writing is the capture design's call |
| 12 | Family Hub's calendar wrappers: `family_hub/calendar/create_event`, `/update_event`, `/delete_event`, `/delete_support`, `/colors` | upstream | Permission-gated by the chores permission store | Don't use (rows 2 and 5 do the same) |
| 13 | Members: `family_hub/list_users` | upstream | No | Reuse as is |
| 14 | Us notes rollover (server side, in the reminders poll; `family_hub/set_reminders_entity`) | upstream | **Yes**: lives inside the notification poller | Reuse as is; keep or rebuild before removing Family Hub's notifications |
| 15 | Serving card files: static paths and `_register_dashboard_resource` | upstream | No | Reuse, adding one house line for the new card |
| 16 | Settings safety nets: `settings_backup.json`, settings history (8 snapshots), `family_hub/backup_settings_now` | upstream | No | Reuse as is |
| 17 | The meal plan's packed to-do format | upstream format on an HA list | **Yes**: positional slots, full-object writes, repeats not stored | Keep the format; a house board meal module (section 2) |
| 18 | Everything else (list in 1.18) | upstream | Parked features | Don't use |

### 1.1 Calendar reads (HA)

- **Does:** the week card's `_fetchEvents` asks `hass.callApi("GET", "calendars/<entity>?start&end")` once per column, every 60 s (`_startPolling`). HA's `CalendarEventView` (`homeassistant/components/calendar/__init__.py`) answers.
- **Guarantees:** a list of events with `start`/`end` as `{dateTime}` or `{date}`, `summary`, `description`, `location`, `uid`, `recurrence_id`, `rrule`; repeating events arrive expanded. HA checks the user's read permission on the entity. Each calendar fails on its own.
- **Also available:** `calendar/event/subscribe` (`handle_calendar_event_subscribe`) pushes the range's events again whenever the entity writes its state, debounced, one fetch per range shared by every listener (`async_update_event_listeners`). HA's own frontend uses it (found in `hass_frontend`'s bundles). It pushes on change for a Local Calendar such as Us, but CalDAV entities update only every 15 minutes (`caldav/coordinator.py`, `MIN_TIME_BETWEEN_UPDATES`), so for iCloud a live GET is fresher. **[inference]** How the house board mixes the two is the load-time question on the map, not this one.
- **Cost:** iCloud through CalDAV costs about 0.1 s per event on a live read (`calendar_cache.py`'s docstring; J008).

### 1.2 Calendar writes (HA)

- **Does:** a one-off event through the `calendar.create_event` service (the week card's path); a repeating one, an edit or a delete through HA's websocket commands `calendar/event/create`, `calendar/event/update`, `calendar/event/delete` (`handle_calendar_event_create`, `_update`, `_delete`), which take `rrule`, `recurrence_id` and `recurrence_range`.
- **Guarantees:** HA checks entity control permission, which every HA user who isn't read-only has (`auth/permissions/system_policies.py`: `USER_POLICY = {entities: True}`); `not_found` for a missing entity; `not_supported` when the calendar lacks the feature; `failed` with the platform's message. `WEBSOCKET_EVENT_SCHEMA` checks start and end are the same type with consistent time zones and a minimum length. Create returns no uid, so an undo has to find the new event by title and start, as the house's B5 code already does (`_answerEventAdded`).
- **Why not Family Hub's wrappers:** see row 12.
- **[inference]** Send zoned times (with an offset). Family Hub's `_coerce_calendar_datetime` exists because a naive time became a "floating" Local Calendar event that refused an UTC `UNTIL` (v1.168.84 comment).

### 1.3 To-do lists (HA)

- **Does:** every list the board shows (`todo.us_notes`, `todo.meal_plan`, `todo.house_reminders`, `todo.shopping_list`) is an HA to-do entity. The week card reads with `todo.get_items` through `call_service` with `return_response` (`_getItems`, both statuses) and writes with `todo.add_item`, `update_item`, `remove_item`. No Family Hub command is involved.
- **Also available:** `todo/item/subscribe` and `todo/item/move` (`homeassistant/components/todo/__init__.py`); HA's frontend uses the subscription. **[inference]** Subscribing instead of the week card's 60 s poll is the cheap way to meet the mission's "matches the phones within a minute."
- **Formats on the lists that aren't HA's:** Us notes carry Family Hub's `<!--rollover:1-->` and `<!--rolldays:0,1,...-->` markers in the description (`_parseReminderRollover`); the meal plan carries the packed JSON in section 2; House reminders' format is owned by the house repo's planned two-way sync (J008 build step 4).

### 1.4 Weather (HA)

- **Does:** `_fetchWeather` calls `weather.get_forecasts` with `type: daily` on the weather entity (settings `weatherEntity`, else card config `weather_entity`; the house uses `weather.forecast_home` in the card config, settings empty).
- **Note:** the card keys each forecast by `f.datetime.slice(0, 10)`, the string's own date. **[inference]** If the provider sends UTC times late in the day, that date could be tomorrow's in Eastern time; worth one check against the house's Met.no forecast when the house board is built. Not a backend question.

### 1.5 Entity states (HA)

- `switch.family_hub_privacy_mode` (Family Hub's `FamilyHubPrivacyModeSwitch` in `switch.py`): on means locked. Its state reaches every signed-in user through `hass.states` with no extra subscription.
- `input_boolean.board_private`: the Hide work calendars switch (J006).
- A calendar's `supported_features` (1 create, 2 delete, 4 update): the house's `_calendarFeatures` already reads it from state. While HA is starting, the state is missing or `unavailable` and reads as 0; treat that as "don't know yet," as upstream's `delete_support` does with its `unavailable` flag.
- The calendar's integration (`caldav`, `local_calendar`, `google`) is `hass.entities[entity_id].platform` in the frontend (HA's entity registry display entry carries `pl`), which is all `delete_support`'s `integration_name` adds.

### 1.6 Household settings blob (upstream)

- **Does:** `_ws_get_settings` returns `{"settings": blob}` from the Store `family_hub_settings_<entry_id>`; `_ws_set_settings` saves `msg["settings"]` (validated only as a dict). Open to every signed-in user, no admin gate, no version check.
- **What the house board needs from it:** `useGlobalTheme` and `globalThemeId` (the household theme; the house uses Liquid Glass), `blocks`, `weekdayBlocks`, `dateBlocks`, `weekendBreakfast` (meal slot names), possibly `timelineStartHour`/`timelineEndHour`, `greyOutPastEvents`, `defaultView`, and the fallbacks `mealPlanEntity`/`weatherEntity`. **Not** `people` or `userProfiles[*].primaryCalendar` for columns (section 3, traps 1 and 6).
- **Guarantees, and its traps:** section 3.
- **Recommendation:** a thin client-side reader in the house board that picks only those keys and applies the same defaults and clamps as the week card's `_normalizeSettings`/`_defaultSettings` for them (blocks default `["Breakfast", "Lunch", "Dinner"]`, at most 6; timeline 8 to 23; `defaultView` `"month"`). The house board doesn't write the blob while any week card copy is in use. If it ever must change a household key, it does what the chores card's `_toggleRewardsColumn` does: fresh `get_settings`, change one key, `set_settings` the whole fresh blob, never from a cached or normalized copy, never omitting `people`. House-only data never goes into this blob.

### 1.7 Themes (upstream)

- **Does:** `_ws_list_themes` returns `{"themes": [...]}` from the Store `theme_builder_themes` (at most 12, `MAX_THEMES`); `_ws_save_themes` replaces the whole list. Both are open to every user. The Theme Builder panel (`panel/theme-builder-panel.js`) is the only caller of save.
- **Guarantees:** each theme is normalized by `_migrate_theme`: `id`, `name`, `colors` (bg, card, border, text, textSecondary, accent, accentText, accent2, accent3, surfaceAlt, surface2), `fonts` in px keyed to the week card's elements (dayName, dayNumber, wxTemp, event, chip, headerTitle, countdown, blockLabel, blockMeal), `borderWidth`, `accentBorderWidth`, `cardOpacity`, `glassBlur`, `effects.shadow`/`glow`, `background`.
- **Side effects of a read:** `_load_themes` seeds the presets on an empty store and adds back any missing preset while there's room, so a deleted preset returns on the next list; `_register_ha_themes` writes every theme into HA's internal `frontend_themes` and fires `themes_updated` on every list.
- **Recommendation:** reuse `list` as is, read only. The house board maps a theme to its own CSS variables, choosing which `fonts` keys apply (the Clover Tablet's "Liquid Glass Tablet" theme differs from Liquid Glass only in 20 px event text, J008). The week card's mapping (`_resolveTheme`, `_applySizeVars`, the cream `_defaultTheme` fallback, the `_rememberGlobalThemes` fix against the cream flash) is client code the house board needs its own version of.

### 1.8 Calendar copy (house)

- **Does:** `ws_get` returns `{"calendars": {entity: [events]}}` for each calendar whose in-memory copy covers the whole range; `ws_put` takes a board's live results. `async_refresh` refetches every calendar a board has asked about each hour, 42 days back to 80 ahead.
- **Guarantees:** memory only, empty after a restart; events in the REST format of 1.1; a calendar missing from the answer has no usable copy; at most 2,000 events and 200 days per calendar (`MAX_EVENTS`, `MAX_SPAN`); a board's put that landed after the hourly refresh began wins (`replace` with `began`); bad times or unknown entities are dropped silently, never an error.
- **Notes:** unlike HA's calendar API, `ws_get` doesn't check the user's read permission on the entity, and `ws_put` trusts any client's events until the next live check or hourly refresh. Both are acceptable for two trusted adults **[inference]**; privacy mode hides nothing here (1.10).
- **Recommendation:** reuse as is. The house board sends back only complete live results for a range, as `_saveCalendarCopy` does, and shows the copy only when it covers every column.

### 1.9 Per-copy settings and copy sync (upstream + house)

- **Does:** every copy calls `device_settings/report` on open with its localStorage values and gets pushes through `get_pending` and `subscribe_push`; admins `list`, `push`, save and apply presets, and `identify` a copy. `copy_sync.py` (house) passes a user's changes to their other copies and seeds a new copy.
- **Guarantees:** validation is all or nothing against `DEVICE_SETTINGS_FIELDS` in `const.py` (`_validate_against`): an unknown key or out-of-range value rejects the whole report with `invalid_format`. The first report of a copy, and of each dashboard placement on it, creates a set of HA entities (select, number, text, button, switch: `_sync_device_entities`). `report` answers `screensaver_enabled` and `privacy_participates`.
- **Why not for the house board:**
  - The fields are the week card's localStorage keys (`familyCalendarWeekViewVariantLocal`, `familyCalendarSmallScreenModeLocal`, ...). The house board's settings (whatever the settings-page ticket picks) would each need a new `DEVICE_SETTINGS_FIELDS` entry kept in step with the card by hand, and each adds an entity per copy.
  - The household's decided behavior is per person: "a user's view settings and theme follow them between their copies" (CONTEXT.md, *Copy*). Copy sync builds that on top of per-copy storage with device ids, seqs and pending pushes. A store keyed by HA user gives the same result by construction. The wall tablet signs in as its own user, so its settings stay its own.
  - The module is entangled with the screensaver switch, privacy participation, presets and identify, and with five entity platforms (`select.py`, `number.py`, `text.py`, `button.py`, `switch.py`, sharing `device_settings_entity_shared.py`): about 1,900 lines with `copy_sync.py`, not counting `switch.py`. If the house board depends on it, none of it can be removed when the week card retires.
- **Recommendation:** don't use it from the house board. Keep it running for the week card and retire it with the week card. Per-person board preferences go in a new house service (section 5).

### 1.10 Privacy mode (upstream)

- **Does:** one household flag in the Store `family_hub_privacy_mode_<entry_id>`, written only by `privacy_mode_shared.async_set_privacy_mode`, which fires `family_hub_privacy_mode_changed`. `get_state` answers `{"enabled": bool}`; `subscribe` forwards the event (a dedicated command because HA's `subscribe_events` refuses custom events to non-admins); `set` takes no permission check either way; `disable_with_pin` needs a kiosk PIN from a user with `can_toggle_privacy_mode` (or an admin) and answers the same `incorrect_pin` for every failure.
- **What it guarantees and doesn't:** hiding is entirely client-side. The week card's renderers drop events through `_privacyEventsFor` and `_privacyReminders` while `_privacyModeEffectiveLocked`; the server still returns every event to every caller (HA's calendar API, the calendar copy). A copy can opt out (`privacy_participates`, learned only from `device_settings/report`).
- **Entangled:** the PIN path lives in `chores_websocket_api.py` (4,543 lines) with kiosk PINs (`async_load_pins`, `async_verify_pin`) and the chores permission store.
- **Recommendation:** read `switch.family_hub_privacy_mode` from `hass.states` (or `get_state`/`subscribe`, as is); turn it on with `switch.turn_on`. Whether the house board keeps PIN unlock, per-copy opt-out, Guest mode and Work detail is the map's open "Privacy on the house board" question; if it keeps the PIN, reuse `disable_with_pin` and `list_eligible_users` as is.

### 1.11 "Also for" people on an event (upstream)

- **Does:** a side store (`family_hub_event_people_overrides_<entry_id>`) mapping `"<calendar>|<start unix s>|<summary>"` (`_event_override_key`) to the other people's calendar entity ids; the week card draws the event in each of those columns with a color collage. `set` with an empty list removes the key.
- **Fragile:** the key is the event's calendar, start and title, so moving or renaming an event orphans its tag. **[inference from grep]** No code in the served card re-keys an override after `calendar/update_event`. The whole map is saved on each change; nothing cleans out stale keys.
- **Recommendation:** read as is, so events the week card tagged still show in both columns during the switch-over. Whether the house board writes "Also for" at all is the capture design's call; if it does long term, a house service keyed by the event's uid (Us has uids; iCloud events carry one in the REST answer) would survive edits.

### 1.12 Family Hub's calendar wrappers (upstream)

- `calendar/create_event` (repeating only), `update_event`, `delete_event` call the same entity methods as HA's own commands in 1.2, translating the card's flat field names (`_build_entity_event_fields`) and coercing naive times. `update_event` and `delete_event` first check `can_edit_event`/`can_delete_event` in Family Hub's permission store (`chores_websocket_api._has_permission`), which is false for every non-admin until an admin grants it (`const.py` comments on `PERMISSION_DELETE_EVENT`, `PERMISSION_EDIT_EVENT`). So Jenn and the wall tablet's user would be refused unless granted; whether they are on the house is unknown (Gaps).
- `delete_support` reads `supported_features` and the registry platform; `colors` reads each calendar's color from the entity registry options.
- **Recommendation:** don't use. HA's commands and states (1.2, 1.5) do the same, gated by HA's own permissions, which fits "two equal adults" (mission principle 4).

### 1.13 Members (upstream)

- `_ws_list_users` returns `{"users": [{id, name}]}` for every non-system HA user, open to non-admins (HA's `config/auth/list` is admin only). Small, no side effects. **Recommendation:** reuse as is, for names in echoes or "who added" (HA's `person.*` states carry `user_id` too, for users who have a person).

### 1.14 Us notes rollover (upstream)

- **Does:** every 5 minutes (`DEFAULT_POLL_MINUTES`) the reminders poll (`_poll_reminders_todo`, `_poll_one_reminders_todo_list`) reads the list in the integration option `reminders_todo_entity` (set by the week card's `_syncRemindersEntity` from its `reminders_entity`, `todo.us_notes` on the house) and moves a `<!--rollover:1-->` item still open on a past day to today (`_roll_reminder_to_today`, honoring `<!--rolldays:-->`). It runs before, and regardless of, any notify target.
- **Entangled:** it's inside Family Hub's own notification poller, a parked feature. `script.board_add_note` depends on it (J006).
- **Recommendation:** reuse as is; the house board writes the same markers when it adds a note. Before anyone removes Family Hub's notifications, keep this part or rebuild it (a nightly HA automation would do **[inference]**).

### 1.15 Serving card files (upstream)

- `async_setup` registers each card file under a static path and adds or updates a dashboard resource with a `?v=<hash>` (`_register_dashboard_resource`, `_file_content_hash`), so a file change plus restart reaches browsers without touching Settings > Dashboards. HA has no public API for this; failures are swallowed. **Recommendation:** reuse, with one house line each for the house board's static path and resource. (The list also registers `family-right-now-card.js`, which isn't in `card/`: the walkthrough's failed request, B4.)

### 1.16 Settings safety nets (upstream)

- Every `set_settings` rewrites `family_hub_backups/settings_backup.json`, restored automatically if the Store ever loads empty (`_backup_settings`, `_maybe_restore_settings_backup`). Settings history keeps 8 snapshots of the settings, permissions and device settings stores, taken at 00:00 and 12:00 when something changed (`SETTINGS_HISTORY_*` in `const.py`), plus `backup_settings_now`. **Recommendation:** reuse as is. A new house store (section 5) isn't covered by these unless added; HA's own full backups cover all of `.storage`.

### 1.17 Meal plan format

Section 2.

### 1.18 Leave alone (don't use)

All upstream; most are parked ([parked.md](../board-next/parked.md)):
- `family_hub/create_todo_list`: the week card auto-creates the meal plan and meal templates lists (`_ensureHouseholdMealLists`) and each user's `<name>_Reminders` and `<name>_Wish List` (the house has six of these). The house board creates nothing.
- `family_hub/permissions/*`: kid-centered gates (`CHORE_PERMISSIONS`).
- Menu suggestions (`get_`, `add_`, `apply_`, `remove_menu_suggestion`): where a meal edit goes for a user without `can_edit_menu`, the wall's "Suggest" (B4). The house board writes meals directly; the backend never gated that write anyway (the design note above `_ws_apply_menu_suggestion`).
- Meal templates, recipes and suggestions, Grocy, pantry, chores, rewards, goals, routines, timers, kiosk and locked More menu, the daily digest and notify configuration, reminder overrides (`get_`/`set_reminder_override`), event checklists, device presets, identify, the screensaver.
- `services.yaml`: only chore and timer services.
- The legacy Settings to-do item: the week card still writes the blob into a "Settings" item on `settings_entity` (default `todo.family_calendar_settings`, which the house doesn't have, so the write fails silently).

## 2. The meal plan's packed to-do format

Meals are items on an HA to-do list (`todo.meal_plan`: the card config's `meal_plan_entity`, since the house's settings `mealPlanEntity` is empty). Upstream's design note above `_ws_apply_menu_suggestion` says so: "The weekly meal plan ... is not Family Hub data."

**One item, one planned meal** (`_fetchMealPlan`, `_parseDishDescription`, `_upsertMealPlan`):
- `summary`: the dish name.
- `due`: the date, `YYYY-MM-DD`, no time. An item without `due` is ignored.
- `status`: both `needs_action` and `completed` are read, so a checked-off meal still shows.
- `description`: a JSON object. Keys and the parser's defaults: `description` (text, ""), `link` (""), `color` (null: theme color), `cook` (a person's display name, ""), `block` (number, 0), `recur` (`"weekly"` or null), `grocyRecipeId` (null), `servings` (number or null), `spanDays` (number, 1), `additionalRecipes` (list of `{name, link, grocyRecipeId}`), `leftoverDates` (list of `YYYY-MM-DD`). Recipe Box items share the parser and add `rating`, `category`, `image`.
- A description that isn't JSON is taken as plain text with `block` 0. **[inference]** A meal typed by hand in HA's To-do app with a note lands in the first slot (Breakfast), not dinner.

**Slots:** `block` is a position in that day's slot list (`_getBlocksForDay`): `settings.blocks` (the house: Breakfast, Lunch, Dinner), plus "Breakfast" at the front on weekends when `weekendBreakfast` is on and no slot is called Breakfast, plus `weekdayBlocks[weekday]` and `dateBlocks[date]` extras, at most 10. It's a position, not a name: renaming or reordering slots in Settings, or turning on `weekendBreakfast` without a Breakfast slot, changes which slot every stored meal is in. `script.board_set_meal` hard-codes `block: 2` for dinner (J006).

**Writers:** the week card's `_upsertMealPlan` writes the whole object from its own arguments, so any key it doesn't pass is dropped from that meal on every edit. The backend's `_encode_dish_description` writes the same shape for an applied suggestion. `script.board_set_meal` writes only `{"block": 2}` and replaces a meal already on that day and slot. Two explicit items on the same day and slot: the one later in the list silently wins (`map[dateKey][blockIndex] =`).

**What the client fills in that isn't stored** (`_getMealForDay`): for a day and slot, the explicit item wins; otherwise a leftover (an earlier meal whose `leftoverDates` includes the day; for data older than v144.10, the `spanDays - 1` days after it); otherwise a weekly repeat: an item with `recur: "weekly"` on the same weekday and slot, dated on or before the day, the latest such anchor winning. Changing "just this day" creates a one-off explicit item; Clear removes only an explicit item (`_removeMealPlan`). Anything that reads the list without this rule sees only explicit meals: HA's To-do app, Assist's `todo.get_items`, Family Hub's daily digest (`_build_daily_digest_sections` reads only meals due today). `script.whats_for_dinner` repeats the rule in YAML, a second copy (J006).

**Recommendation:** keep the format and the list; the voice scripts and the week card share it through the switch-over. The house board gets one small meal module (parse, encode, project), tested against the cases above, that on every write reads the item's existing object and changes only the keys it means to, so unknown keys survive; it always writes `block`, writes `recur` and `leftoverDates` like the week card, and leaves `grocyRecipeId`, `servings` and `additionalRecipes` as found. A server-side meal service isn't worth it for two consumers **[inference]**; if a third appears (the digest returning, say), move the rule into one house service then.

## 3. The settings blob: full replace, and its traps

What `_ws_set_settings` does with a save:
- Saves the incoming dict verbatim as the whole blob (its docstring: "IMPORTANT - this is a full REPLACE, not a merge").
- Strips kiosk PIN hashes and locked More-menu content; carries forward two backend-only flags the card never sends (`notifyProfilesMigrated`, `wishlistClaimsPermissionMigrated`), because losing them once re-ran migrations that overwrote people's settings.
- When the save holds `people`: every calendar in the old `people` but not the new is removed from Family Hub's "Calendars to monitor", notify overrides and everyone's subscriptions (`_cleanup_removed_calendar_entity`).
- When it holds `userProfiles`: syncs wish-list flags and adds subscribed calendars to "Calendars to monitor".
- Rewrites the backup file; returns `{"success": true}`. No version, no lock: the last write wins.

The traps for anything that writes it:
1. **A Settings save refilled the column list** (walkthrough section 10). Opening Settings copied the visible columns into a draft, and any Save wrote them into `people`, which then overrides both dashboard copies' columns, so Hide work calendars stopped hiding Work. Wave 0 writes `people: []` while the rows are unedited (`_columnsUnedited`). An edit to columns in Settings still writes them, and the trap returns.
2. **The week card drops every key it doesn't know.** `_normalizeSettings` returns an object literal of the keys it knows, and both write paths send that: `_persistSettingsPatch` merges a patch into `_getSettings()` (the normalized cache), and `_saveSettings` builds `settingsObj` from the form. Run under Node on a blob holding `choresShowRewardsColumn`, `notifyProfilesMigrated` and a made-up `houseBoardTextSize`, the real method kept `people` and `blocks` and dropped all three. The chores card's own key `choresShowRewardsColumn` is lost this way today.
3. **The week card writes without anyone opening Settings.** `_persistSettingsPatch` runs from adding a date or weekday meal slot, countdown edits, and on open from `_ensureHouseholdMealLists` and the per-user list auto-create, each from a cache refreshed only every 60 s (`_startPolling`). **[inference]** Such a write can also undo a change another copy made in the previous minute.
4. **Columns come from two more places.** `_getPeople` adds a column for every profile whose `primaryCalendar` isn't already one, so a profile pointing at `calendar.work` would bring Work back with the list empty. And if the `people` key is ever missing (not `[]`), `_maybe_seed_calendar_rows_from_setup_wizard` refills it at the next restart from the setup wizard's calendars.
5. **A shorter `people` changes notifications.** **[inference]** The 2026-10-29 emptying (four rows to none) and the wave 0 `people: []` likely removed Will, Home, Us and Work from Family Hub's "Calendars to monitor"; harmless while Family Hub's own phone pushes are off (parked), a surprise if they're ever turned on.
6. **Reads write too.** `_ws_get_settings` runs two migrations and saves when they change anything, and moves PIN hashes to their own store.

So: the house board reads the blob, keeps house data out of it, takes columns from its own config only, and if it must write, writes one key on a fresh copy.

## 4. What the week card does on the client that the backend doesn't

Each of these is client code the house board replaces or drops; none is a backend guarantee.

- **Meals:** weekly repeats, leftovers and the slot list for a day (section 2).
- **Settings defaults and limits:** `_normalizeSettings` and `_defaultSettings` (slot count, timeline hours, view choices); the backend stores whatever it's sent.
- **Columns:** `settings.people` overrides the card config; profiles' `primaryCalendar` adds columns; profile colors and badges win over the row's (`_getPeople`, `_primaryCalendarColorByEntity`).
- **Privacy:** all hiding (1.10).
- **Theme:** the copy's override over the household's, the cream fallback, the variable mapping (1.7).
- **Reminders on the calendar:** only open Us notes items with a due date, on that day, plus each subscribed person's own list (`_fetchReminders`).
- **Markers in descriptions:** Family Hub writes `<!--reminder:10,30-->` and `<!--type:reminder-->` into event descriptions, and the rollover markers into to-do descriptions; the card strips them before showing text (`_parseReminderRollover` and its neighbours). The house board must strip them too, or show HTML comments to Jenn.
- **"Also for" columns:** drawn from the side store (1.11).
- **Gates that are only UI:** Edit, Delete and meal editing follow Family Hub permissions in the card (`permissions/get_mine`); only `update_event`, `delete_event` and `apply_menu_suggestion` are enforced on the server.
- **Side effects on open:** auto-creating lists, writing the settings blob, telling the backend which reminders list to poll (`_syncRemindersEntity`), reporting the copy's settings.
- **Polling:** settings, events, meals, reminders and weather every 60 s; only device-settings pushes and privacy mode arrive live.
- **House additions:** event shapes, the calendar-copy merge, undo and echo, open timing (card map).

## 5. Recommendation

**Reuse as is:** HA's calendar, to-do and weather APIs and the two switch entities (rows 1 to 5); the house calendar copy (8); `list_users` (13); the server's Us notes rollover (14); the settings backups (16); `theme_builder/list`, read only (7); the "Also for" store, read only during the switch-over (11).

**Reuse behind a thin house wrapper:** the settings blob, read only, through a reader that picks the keys in 1.6 with the week card's defaults (6); the meal plan format, through a meal module that keeps unknown keys (17); card serving, with one added line (15).

**Replace with a new house service:** per-person board preferences in place of per-copy settings and copy sync (9). The choice:

- **A. A small house service, keyed by HA user** (confidence 0.70). Commands to get, set and subscribe to one user's preferences; any user reads and writes their own, an admin anyone's; values checked against a short house list of fields, all or nothing; its own Store; logic in a module without HA imports, like `copy_sync.py` and `calendar_cache.py`. **[inference]** About 150 lines with tests.
- **B. Home Assistant's own per-user storage**, `frontend/get_user_data`, `set_user_data`, `subscribe_user_data` (0.55). No house code, and live updates. But a connection can read and write only its own user's data (`with_user_store` uses `connection.user.id`), so neither the owner's phone nor a Claude session could set or even read the wall tablet's preferences; sessions have set the tablet up remotely before (J008, 2026-10-29).
- **C. Keep using device settings and copy sync**, adding the house board's fields to `DEVICE_SETTINGS_FIELDS` (0.35). Already built, tested, admin-pushable and snapshotted; but week-card field names, an entity per field per copy, and about 1,900 entangled lines that then can't retire with the week card.

**A** gives the household's decided behavior (settings follow the person; the wall is its own user) with the least to keep working, and keeps remote setup and diagnosis of the wall tablet. It gives up copy names and per-copy differences for one person (the owner's phone and a future iPad would share preferences; the board's layout adapts to width anyway), and needs a one-time copy of the tablet's current settings when the house board first goes on the wall. B is the fallback if remote management turns out not to matter. Which fields go in it is the plain-settings-page question on the map.

**Don't use:** Family Hub's calendar wrappers (12), per-copy settings and copy sync (9), and everything in 1.18.

**What this means for the cleanup after the week card retires:** with the house board built this way, device settings and its five entity platforms, `copy_sync.py`, the permission store's event and menu gates, list auto-creation and the settings-writing paths have no remaining user and can come out with the parked features. What must stay: the settings Store (read), the theme Store and Theme Builder panel, the calendar copy, the privacy switch, the reminders poll's rollover (or its replacement), and card serving.

## Gaps

- **Live house values not read** (the rules forbid touching the house): the integration options (`reminders_todo_entity`, `meal_plan_todo_entity`, "Calendars to monitor" after 2026-10-29), Family Hub's permission store (whether Jenn and the tablet user hold `can_edit_event`, `can_delete_event`, `can_edit_menu`), and whether any user profile has a `primaryCalendar` (trap 4). The sandbox's `house_config.json` didn't read options or permissions either.
- **Nothing was exercised in the sandbox;** behavior is from code, except the normalizer check. HA's `calendar/event/subscribe` with CalDAV under real iCloud timing is unmeasured.
- **HA's `frontend/*_user_data` commands** are what HA's own frontend uses; **[inference]** they aren't documented as a public API, which matters only if option B is taken.
- **Weather date keys** (1.4) weren't checked against the house's Met.no answers.
- **Version drift:** HA core read at 2026.10.4. A later HA could change the calendar or to-do commands; Family Hub's backend is frozen at the fork.

## Sources

This repo, `house/board-next` at `301c8ee`:
- `custom_components/family_hub/__init__.py`: `_ws_get_settings`, `_ws_set_settings`, `_cleanup_removed_calendar_entity`, `_handle_renamed_calendar_entity`, `_maybe_seed_calendar_rows_from_setup_wizard`, `_backup_settings`, `_maybe_restore_settings_backup`, `_load_themes`, `_migrate_theme`, `_theme`, `_register_ha_themes`, `_ws_list_themes`, `_ws_save_themes`, `_ws_get_calendar_colors`, `_ws_get_calendar_delete_support`, `_ws_delete_calendar_event`, `_ws_update_calendar_event`, `_ws_create_calendar_event`, `_build_entity_event_fields`, `_coerce_calendar_datetime`, `_ws_list_users`, `_ws_apply_menu_suggestion` and the design note above it, `_encode_dish_description`, `_ws_get_event_people_overrides`, `_ws_set_event_people_override`, `_event_override_key`, `_ws_set_reminder_override`, `_poll_reminders_todo`, `_poll_one_reminders_todo_list`, `_roll_reminder_to_today`, `_build_daily_digest_sections`, `_register_dashboard_resource`, `async_setup`, `async_setup_entry`.
- `custom_components/family_hub/const.py`: `SETTINGS_STORAGE_KEY_PREFIX`, `SETTINGS_BACKUP_FILENAME`, `SETTINGS_HISTORY_*`, `MAX_THEMES`, `DEVICE_SETTINGS_FIELDS`, `CHORE_PERMISSIONS` and the `PERMISSION_*` comments, `REMINDER_*_MARKER_PATTERN`, `DEFAULT_POLL_MINUTES`, `CALENDAR_PLATFORM_FRIENDLY_NAMES`, `EVENT_PEOPLE_OVERRIDES_STORAGE_KEY_PREFIX`.
- `custom_components/family_hub/calendar_cache.py` (`CalendarCache`), `calendar_cache_websocket_api.py` (`ws_get`, `ws_put`, `async_refresh`).
- `custom_components/family_hub/device_settings_websocket_api.py` (`ws_report`, `ws_get_pending`, `ws_subscribe_push`, `_validate_against`, `_sync_device_entities`), `copy_sync.py`, `device_settings_entity_shared.py`, `switch.py` (`FamilyHubPrivacyModeSwitch`), `privacy_mode_shared.py`, `chores_websocket_api.py` (`ws_privacy_mode_*`, `_has_permission`, `ws_get_my_permissions`).
- `custom_components/family_hub/card/family-week-calendar-card.js` (served): `_fetchSettings`, `_fetchLegacySettings`, `_normalizeSettings`, `_defaultSettings`, `_getSettings`, `_persistSettingsPatch`, `_saveSettings`, `_ensureHouseholdMealLists`, `_getPeople`, `_fetchMealPlan`, `_parseDishDescription`, `_getMealForDay`, `_getBlocksForDay`, `_upsertMealPlan`, `_removeMealPlan`, `_mealPlanEntity`, `_getItems`, `_fetchReminders`, `_parseReminderRollover`, `_syncRemindersEntity`, `_fetchWeather`, `_fetchPrivacyModeState`, `_syncPrivacyModeOverlay`, `_privacyModeEffectiveLocked`, `_fetchHouseholdMemberNames`; `card/family-hub-chores-card.js`: `_toggleRewardsColumn`; `panel/theme-builder-panel.js`.
- [docs/agents/card-map.md](../agents/card-map.md), [docs/board-next/walkthrough-2026-10-29.md](../board-next/walkthrough-2026-10-29.md) section 10, [mission.md](../board-next/mission.md), [synthesis.md](../board-next/synthesis.md), [parked.md](../board-next/parked.md), [CONTEXT.md](../../CONTEXT.md), `tests/sandbox/house_config.json`.

Home Assistant core 2026.10.4 (sandbox venv, `homeassistant/`): `components/calendar/__init__.py` (`CalendarEventView`, `handle_calendar_event_create`, `_delete`, `_update`, `_subscribe`, `WEBSOCKET_EVENT_SCHEMA`, `async_subscribe_events`, `async_update_event_listeners`, `_async_write_ha_state`), `components/todo/__init__.py` (`todo/item/subscribe`, `list`, `move`), `components/caldav/coordinator.py` (`MIN_TIME_BETWEEN_UPDATES`), `components/frontend/storage.py` (`websocket_set_user_data`, `_get_`, `_subscribe_`, `with_user_store`, the system-data commands), `auth/permissions/system_policies.py`, `helpers/entity_registry.py` (display entry); `hass_frontend` bundles (uses of `calendar/event/subscribe` and `todo/item/subscribe`).

House repo: [J006](https://github.com/bellamy1506/House-Modeling/blob/main/records/projects/J006-home-assistant-automations.md) (board scripts, Board private, fork changes 3 and 6), [J008](https://github.com/bellamy1506/House-Modeling/blob/main/records/projects/J008-family-hub.md) (HA version, the tablet's settings, 2026-10-29 findings).
