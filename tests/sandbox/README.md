# Family Hub sandbox

A throwaway Home Assistant on this machine that runs the board with made-up data, so someone (a person or a reviewer agent) can use it in a browser the way the household does. Nothing here talks to the house: Home Assistant listens on `127.0.0.1:8123` only, and every event, meal and note is fictional.

Not part of the test suite: nothing here is named `test_*`, and it needs the sandbox running.

## Use it

```sh
bash tests/sandbox/sandbox.sh reset    # wipe, rebuild, reseed (about 10 s once the venv exists)
bash tests/sandbox/sandbox.sh start    # start it, detached
bash tests/sandbox/sandbox.sh stop
node tests/sandbox/verify_board.js     # browser checks and screenshots
```

The sandbox folder defaults to `/home/user/ha-sandbox` (a second argument changes it): `venv/` (Home Assistant 2026.10.4 on Python 3.14), `config/`, `ha.log`, `shots/`, `profiles/`, and two files written outside the repo: `secrets.json` (generated passwords) and `ACCESS.md` (address and sign-ins). The first `reset` builds the venv, which takes a few minutes. `FH_COMMIT=<commit> ... reset` installs another Family Hub build; the default is `32c486e`, what the house runs. Family Hub is copied in with `git archive`, so edits in the working tree don't change a running sandbox.

Sign-ins: **Owner** (admin), **Jenn** and **Wall** (not admin; the wall tablet's user, like the house's "Clover").

## Browsers

- **Set the time zone.** The board draws times in the browser's zone and this container runs on UTC: pass `timezoneId: "America/New_York"` to every Playwright context.
- Sizes: the Clover Tablet is 1200×800 CSS px at DPR 2 with touch; a phone, 390×844 at DPR 3, touch, mobile.
- `board_browser.js` does both, signs in on Home Assistant's own page when asked, and keeps one browser profile per person and device, so sign-ins and the board's per-copy settings last between scripts (`openBoard({ user: "jenn", device: "phone" })`, or `node tests/sandbox/board_browser.js jenn phone <shot-name>`). `fresh: true` gives a brand-new browser instead.
- The Playwright MCP tools don't run in this container: they look for Google Chrome at `/opt/google/chrome/chrome` and, pointed at the preinstalled Chromium, it refuses to start as root with its sandbox on. Use scripts.

**Wall tablet:** sign in as `wall` and reload once. Copy sync (fork issue #5) sends any new browser of the Wall user the settings of the tablet copy that `provision.py` registers: the Liquid Glass Tablet theme arrives on the first open; Week, 4 days from today, today first, timeline, full top bar from the next. Owner works the same way with the owner's phone settings (Planner, Split, Title only, Liquid Glass Dark). Jenn has no copy on the house yet, so Jenn's start on household defaults. To give any other browser the tablet's settings, run this in its console after signing in, then reload:

```js
for (const [k, v] of Object.entries({ familyCalendarStartViewLocal: "week", familyCalendarWeekViewVariantLocal: "week", familyCalendarWeekDayCountLocal: "4", familyCalendarCurrentDayFirstLocal: "on", familyCalendarShowTimelineLocal: "on", familyCalendarTopBarTitleOnlyLocal: "off", familyCalendarHideTopBarDeviceLocal: "off", familyHubDeviceThemeOverrideLocal: "liquidglasstablet" })) for (const key of [k, ...Object.keys(localStorage).filter((x) => x.startsWith(k + "__inst_"))]) localStorage.setItem(key, v);
```

(For Owner, copy sync overrides it with the owner's phone settings.)

## What matches the house

From the live configuration, read-only on 2026-10-29 (`family_hub/get_settings`, `theme_builder/list`, `family_hub/device_settings/list`, `lovelace/dashboards/list`, `lovelace/config` for `family-hub`, and calendar and to-do entity names), kept in `house_config.json` with user ids replaced by roles:

- Family Hub's household settings (features, meal blocks, columns, view defaults, theme Liquid Glass), the themes (presets plus Liquid Glass Tablet), the `/family-hub` dashboard with its two card copies and "Hide work calendars" tile, and the tablet's and owner's copy settings.
- Entity ids and names: `calendar.wills_calendar`, `calendar.home`, `calendar.us`, `calendar.work`; `todo.us_notes`, `todo.meal_plan`, `todo.house_reminders`, `todo.family_meal_templates`, `todo.shopping_list`; `weather.forecast_home`; `input_boolean.board_private`.
- Calendar abilities: `sandbox_house` (sandbox-only component) makes the Local Calendar stand-ins act like the house's: Will, Home and Work add only (iCloud through CalDAV), Us add, edit and delete.

## What doesn't

- **Jenn's column is new** (planned, not on the house): `calendar.jenns_calendar`, second, rose `#d97e9e`, read only like both paths J008 plans for Jenn's Google calendar. Position, color and entity id are guesses.
- Calendars answer at once; on the house, Will's iCloud column takes about 3 s live (the server copy hides most of it). The weather is a fixed template forecast, not Met.no.
- Not read, so left at defaults: Family Hub's integration options (calendars watched for reminders, default notify target), permissions, privacy-mode and kiosk PINs. No phones, so no notifications; no Assist, so no board voice scripts.
- Users are Owner, Jenn and Wall, not the house's own (which include service users). The sidebar is Home Assistant's default for a small install.
- Home Assistant's own extras: the recorder keeps 3 days. Two Repairs notices that come from the sandbox itself (a venv "Core" install, the http YAML moving to storage) are ignored at setup.

## Files

| File | Does |
|---|---|
| `sandbox.sh` | reset, start, stop |
| `configuration.yaml` | the sandbox's Home Assistant configuration |
| `house_config.json` | the house's board configuration, as read |
| `provision.py` | users, integrations, Family Hub settings, themes, dashboard, copies |
| `seed.py` | the made-up household data, relative to today in Eastern time |
| `write_access.py` | writes `ACCESS.md` in the sandbox folder |
| `sandbox_lib.py` | shared helpers (Home Assistant's own aiohttp) |
| `custom_components/sandbox_house/` | the calendar abilities above |
| `board_browser.js` | open the board as a person on a device |
| `verify_board.js` | the browser checks |

Screenshots stay in the sandbox folder: board pictures don't belong in this public repo, made-up data or not.
