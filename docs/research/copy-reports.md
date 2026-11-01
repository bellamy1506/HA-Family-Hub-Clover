# Where each copy records its open times and errors

Research note, 2026-11-01, for fork issue [#111](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/111) (map [#107](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/107)). The question: where can each copy of the house board record its open times and its last errors in Home Assistant, so that a later session can read them, without an entity per copy?

The need comes from two earlier answers:
- [What the house keeps](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/98#issuecomment-6559117623): no Debug Info line in Settings. "Each copy keeps its own open timings and last errors in Home Assistant, where a session reads them after each install."
- [Load time](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/97#issuecomment-6558650608): the targets those timings are read against. The wall within 2 s of a reload, an iPhone within 3.5 s, live answers within 3 s.

The [switch-over plan](../board-next/switch-over.md) puts this in slice 1 and reads it at step 5 of every slice.

Constraints:
- No entity per copy ([house board layout](https://github.com/bellamy1506/HA-Family-Hub-Clover/blob/research/board-layout/docs/board-next/house-board-layout.md): the house board "never reports to device settings, so it creates no per-copy entities").
- The wall and Jenn sign in as non-admin users.
- Sessions reach Home Assistant only through the "Home Assistant" connector (ha-mcp).

**Sources.**
- Home Assistant core **2026.10.4**, the house's version. Read from its published wheel (`pip download homeassistant==2026.10.4`), whose files match the [2026.10.4 tag](https://github.com/home-assistant/core/tree/2026.10.4). Line links below point at that tag.
- Home Assistant frontend **20260930.5**, commit `901c0a6`.
- ha-mcp's repository at `7d36089`. Its changelog tops at v9.0.0, the version the house runs ([J006](https://github.com/bellamy1506/Clover-Home/blob/main/records/projects/J006-home-assistant-automations.md), 2026-10-31).
- The connector's own tool list, read only with its `ha_search_tools` tool. No other connector tool was called, and no live data was read.
- This fork's `house/board-next` at `72ee2cc`.

**Terms.** "Copy" is as defined in [CONTEXT.md](../../CONTEXT.md): one browser storage at one address. *(inferred)* marks my own judgement. Every other claim names its source.

## Answer

**Recommendation: a small house store, written by one websocket command and read through Family Hub's diagnostics.**

- **Writing.** Each copy sends one websocket message when it opens: how long the open took and how long until every calendar was live. It sends another when an error happens. Every signed-in user can send these, the wall and Jenn included, just as they can send `family_hub/calendar_cache/put` today.
- **Storing.** Home Assistant keeps, for each copy:
  - its last 5 opens;
  - its last error;
  - who it belongs to.

  It holds them in one JSON file under `.storage`, which survives restarts. It caps the file at 20 copies. No entity, no recorder row, nothing on any screen.
- **Reading.** A session reads every copy at once with one read-only connector call: `ha_get_integration(entry_id=<Family Hub's entry>, include_diagnostics=True, diagnostics_fields=["copy_reports"])`.
- **Size.** About 45 lines of Python in two new files (plus two lines in `__init__.py`) and about 15 lines in the house board (§6).

Home Assistant's own frontend already sends every uncaught error from any card to the system log, with its stack (§2.1). So the board's report only has to say which copy saw which error. A session that wants the stack finds it with `ha_get_logs(source="system")`, until the next restart.

**How the options compare** (each row is detailed in §1 to §4):

| | Non-admin may write | Per copy | Survives a restart | Session reads it with | Shows anywhere | New lines |
|---|---|---|---|---|---|---|
| **1. House store** (recommended) | Yes (no `require_admin`) | Yes, keyed by copy | Yes (`.storage` file) | `ha_get_integration` diagnostics (read-only tool), or `ha_call_service(ws_command=…)` | No | ~45 Python, ~15 JS |
| 2. `system_log.write` | Yes (a plain service) | Only by giving each copy its own logger name | **No** (memory only) | `ha_get_logs(source="system")` | Settings > System > Logs, as warnings and errors | ~6 JS |
| 3. One sensor, copies in attributes | Only through house code | Yes, one attribute per copy | Only with restore-state code | `ha_get_state` (read-only tool) | An entity everywhere entities show | ~50 Python, ~15 JS |
| 4. `logbook.log` | Yes (a plain service) | Only in the message text | Yes, for 10 days | `ha_get_logs(source="logbook")`, page by page | The Logbook (Activity) panel, for everyone | ~6 JS |

The other routes in §4 fail outright:
- the wall and Jenn can't fire events;
- a session can't read another user's `frontend/set_user_data`;
- an `input_text` per copy is an entity per copy.

## 1. A Family Hub websocket command that writes to a Store

### 1.1 What a non-admin caller may do

- **Any signed-in user may call any websocket command unless the command is marked admin-only.** The connection looks up the handler and calls it, with no check of who the user is ([`connection.py` `async_handle`](https://github.com/home-assistant/core/blob/2026.10.4/homeassistant/components/websocket_api/connection.py#L200)). Only the `require_admin` decorator refuses a non-admin: it raises `Unauthorized` when `user is None or not user.is_admin` ([`decorators.py` L54-L69](https://github.com/home-assistant/core/blob/2026.10.4/homeassistant/components/websocket_api/decorators.py#L54-L69)). Home Assistant's [developer page](https://contributors.home-assistant.io/frontend/extending/websocket-api/) says the same: add `@websocket_api.require_admin` for "a command that only administrators may use".
- **This fork already relies on that.** `family_hub/calendar_cache/get` and `/put` carry no admin decorator ("open to every signed-in user, the same as Home Assistant's own calendar API", [`calendar_cache_websocket_api.py`](../../custom_components/family_hub/calendar_cache_websocket_api.py)). `family_hub/device_settings/report` is "not admin-gated" so that every device can report ([`device_settings_websocket_api.py`](../../custom_components/family_hub/device_settings_websocket_api.py), module docstring).
- **The handler knows who is calling.** `connection.user` is the signed-in user, as `ws_report` already uses it ("record who owns this copy"). So a copy can't file its report under another user's name. Any signed-in user could still invent copy ids. The cap of 20 copies bounds that, and it's the same trust as `calendar_cache/put` today *(inferred)*.

### 1.2 How the Store behaves

- **Where it lives.** A `Store(hass, version, key)` is one JSON file at `<config>/.storage/<key>` ([`storage.py` L40, L225, L285-L287](https://github.com/home-assistant/core/blob/2026.10.4/homeassistant/helpers/storage.py#L225-L287)). It isn't a state or an event, so the recorder never sees it, and it survives restarts.
- **Writing.** `async_delay_save(data_func, delay)` writes once the calls stop for `delay` seconds: each new call pushes the write back to its own delay ([L480-L531](https://github.com/home-assistant/core/blob/2026.10.4/homeassistant/helpers/storage.py#L480-L531)).
- **Restarts and backups.**
  - A write still waiting at shutdown happens at `EVENT_HOMEASSISTANT_FINAL_WRITE` ([L534-L541](https://github.com/home-assistant/core/blob/2026.10.4/homeassistant/helpers/storage.py#L534-L541)), so a restart loses nothing.
  - `.storage` is part of every full backup *(inferred)*.
- **Family Hub already keeps its data this way.** Its chores, permissions, device settings and themes are all `Store`s ([`store.py`](../../custom_components/family_hub/store.py); `theme_store` in `__init__.py`'s `async_setup`).
- **How much it writes** *(inferred)*: at a 30 s delay, one small write per burst of opens. That's a few dozen writes a day across the wall and two phones, each well under 20 KB.

### 1.3 How a session reads it back

There are two routes, both open to the connector. The connector signs in as a dedicated admin account ([J006](https://github.com/bellamy1506/Clover-Home/blob/main/records/projects/J006-home-assistant-automations.md), "Claude's connection").

- **Family Hub's diagnostics (recommended).**
  - **What it takes:** a `diagnostics.py` beside `__init__.py` holding `async_get_config_entry_diagnostics(hass, entry)`, which returns a dict ([Home Assistant's diagnostics page](https://contributors.home-assistant.io/core/integrations/diagnostics/)). Core finds the file on its own ([`diagnostics/__init__.py` L82](https://github.com/home-assistant/core/blob/2026.10.4/homeassistant/components/diagnostics/__init__.py#L82)).
  - **Who can see it:** admins only. Core serves it at `/api/diagnostics/config_entry/<entry id>` behind `@http.require_admin` ([L246-L262](https://github.com/home-assistant/core/blob/2026.10.4/homeassistant/components/diagnostics/__init__.py#L246-L262)).
  - **How the connector reads it:** ha-mcp's `ha_get_integration` fetches that address when `include_diagnostics=True`. `diagnostics_fields` keeps only the named keys ([`diagnostics_helpers.py` L136-L150](https://github.com/homeassistant-ai/ha-mcp/blob/7d36089/src/ha_mcp/tools/diagnostics_helpers.py#L136-L150)).
  - **Why it's the better route:** `ha_get_integration` is marked read-only ([`tools_integrations.py` L405-L407](https://github.com/homeassistant-ai/ha-mcp/blob/7d36089/src/ha_mcp/tools/tools_integrations.py#L405-L407)). So it keeps working in ha-mcp's Read Only Mode ([`read_only.py`](https://github.com/homeassistant-ai/ha-mcp/blob/7d36089/src/ha_mcp/read_only.py)), and under the house's rule of "Allow always" for read tools only (J006).
  - **A bonus:** the owner can download the same file from the Family Hub entry's menu.
  - **What it holds:** user names and copy labels, which Home Assistant's diagnostics guidance says to keep out of files that get posted in public issues. The house never posts its diagnostics, and the report holds no titles, times of events or addresses *(inferred)*.
- **An admin-only list command, read with `ha_call_service(ws_command="family_hub/copy_reports/list")`.**
  - **Allowed:** the escape hatch sends any one-shot command, except streaming ones, `call_service`, `execute_script`, `ha_mcp_tools/*`, a fixed list of registry and dashboard writes, and credential commands ([`tools_service.py` L712-L743 and L1265-L1378](https://github.com/homeassistant-ai/ha-mcp/blob/7d36089/src/ha_mcp/tools/tools_service.py#L1265-L1378); [`util_helpers.py` L117 and L247-L281](https://github.com/homeassistant-ai/ha-mcp/blob/7d36089/src/ha_mcp/tools/util_helpers.py#L117)). A `family_hub/*` command passes, and sessions have already used this route for `calendar_cache` and `get_settings` (J006, fork change 6 and the 10/25 Calendars fix).
  - **Why it's second:** `ha_call_service` is marked destructive ([L1807-L1812](https://github.com/homeassistant-ai/ha-mcp/blob/7d36089/src/ha_mcp/tools/tools_service.py#L1807-L1812)) and is "Unavailable in Read Only Mode" (its own description, read through `ha_search_tools`). A read through it may ask the owner for approval each time.

Either route costs about the same few lines. Diagnostics wins on reading without approval.

## 2. `system_log.write`

### 2.1 What the frontend already sends

Home Assistant's frontend already logs every uncaught error from any card, for every user. On a window `error` event it calls `system_log.write` with level `error`. The logger name is `frontend.js.<build>.<version>`, and the message is built from the error and its stack ([`logging-mixin.ts` L47-L92, L142-L155](https://github.com/home-assistant/frontend/blob/20260930.5/src/state/logging-mixin.ts#L47-L155)).

There are two more paths:
- **Unhandled promise rejections** are sent at level `debug` (L93-L132), which the system log never keeps (below).
- **Any element can fire a `write_log` event** (L137-L139). It's logged under the same frontend logger name.

So today a board error reaches the system log with its stack, but without saying which copy it came from.

### 2.2 May a non-admin call it?

Yes. `system_log.write` is registered with plain `hass.services.async_register` ([`system_log/__init__.py` L334-L339](https://github.com/home-assistant/core/blob/2026.10.4/homeassistant/components/system_log/__init__.py#L334-L339)), not with `async_register_admin_service`. Only the admin version checks `user.is_admin` ([`service.py` L966-L1020](https://github.com/home-assistant/core/blob/2026.10.4/homeassistant/helpers/service.py#L966-L1020)). The websocket `call_service` command has no admin check of its own ([`commands.py` L266-L295](https://github.com/home-assistant/core/blob/2026.10.4/homeassistant/components/websocket_api/commands.py#L266-L295)). The frontend code above runs for every user, which shows the same thing.

`system_log.clear` is just as open: any signed-in user, or the Clear button on the Logs page, empties the whole log ([L324-L336](https://github.com/home-assistant/core/blob/2026.10.4/homeassistant/components/system_log/__init__.py#L324-L336)).

### 2.3 What it keeps, and for how long

- **Levels.** Only warnings and above. The system log's handler is set to `logging.WARNING` (L307). The root logger is also at WARNING unless Home Assistant runs verbose ([`bootstrap.py` L643-L644](https://github.com/home-assistant/core/blob/2026.10.4/homeassistant/bootstrap.py#L643-L644)), so an `info` write goes nowhere unless the `logger` integration lowers the level. To keep open times, the board would have to file them as warnings.
- **How many.** 50 entries by default (`DEFAULT_MAX_ENTRIES`, L29; the `max_entries` option, [integration docs](https://www.home-assistant.io/integrations/system_log/)), shared with every warning and error in Home Assistant. When there are more, the oldest entry goes (L254-L256).
- **Repeats fold together.**
  - Entries are keyed by logger name, source file and line, and root cause (L213). A repeat raises `count`, updates `timestamp` and moves the entry to the newest end (L237-L250).
  - It keeps at most **5 distinct messages** per entry. A repeated message isn't added again, and messages carry no time of their own (L191, L247-L248).
  - Every `system_log.write` logs from the same line in `system_log` (L328-L332), so its writes fold by logger name alone. That source is derived from the stack (L109-L131) and wasn't run, so confidence is medium-high.
  - So per copy it would need its own logger name (`logger: house_board.<copy>`). Even then, one entry would mix that copy's opens and errors, and only the last time would be kept.
- **Restarts.** None survive. The log lives in `hass.data` and its handler is removed at close (L309-L317). Every HACS install restarts Home Assistant ([switch-over](../board-next/switch-over.md), step 4), so a session could only ever read what happened since the last install or update.
- **A side effect.** Every service call fires a `call_service` event carrying its data ([`core.py` L2944-L2951](https://github.com/home-assistant/core/blob/2026.10.4/homeassistant/core.py#L2944-L2951)), and the recorder keeps events unless configured not to ([`recorder/__init__.py` L149-L154](https://github.com/home-assistant/core/blob/2026.10.4/homeassistant/components/recorder/__init__.py#L149-L154)). So each write also leaves a row in the database for the recorder's 10 days. A websocket command (§1) fires no event.

### 2.4 Can the connector read it?

Yes. `ha_get_logs(source="system")` sends the admin-only `system_log/list` ([`log_sources.py` L246-L251](https://github.com/homeassistant-ai/ha-mcp/blob/7d36089/src/ha_mcp/tools/log_sources.py#L246-L251); [`system_log/__init__.py` L344-L354](https://github.com/home-assistant/core/blob/2026.10.4/homeassistant/components/system_log/__init__.py#L344-L354)). `search` matches the message, logger name and exception. The tool is marked read-only ([`tools_logs.py` L239](https://github.com/homeassistant-ai/ha-mcp/blob/7d36089/src/ha_mcp/tools/tools_logs.py#L239)).

**Verdict.** Right for stacks, which the frontend already sends. Wrong for keeping the last few opens and the last error per copy:
- opens would have to pose as warnings on Home Assistant's Logs page;
- copies would compete with every other warning for 50 slots;
- anyone can clear it;
- every restart empties it.

## 3. One sensor holding every copy in its attributes

- **Size limits.**
  - The state itself is capped at 255 characters (`MAX_LENGTH_STATE_STATE`, [`const.py` L61](https://github.com/home-assistant/core/blob/2026.10.4/homeassistant/const.py#L61); checked in [`core.py` L203](https://github.com/home-assistant/core/blob/2026.10.4/homeassistant/core.py#L203)).
  - Attributes have no cap in the state machine. The recorder stores no attributes at all for a state whose recorded attributes pass **16,384 bytes** as JSON, and logs a warning each time ([`db_schema.py` L90, L590-L597](https://github.com/home-assistant/core/blob/2026.10.4/homeassistant/components/recorder/db_schema.py#L590-L597)).
- **Keeping it out of the recorder.**
  - An entity class can set `_unrecorded_attributes = frozenset({MATCH_ALL})`, and the recorder then drops every attribute except `device_class`, `state_class`, `unit_of_measurement` and `friendly_name` ([`entity.py` L557-L564](https://github.com/home-assistant/core/blob/2026.10.4/homeassistant/helpers/entity.py#L557-L564); [`db_schema.py` L567-L582](https://github.com/home-assistant/core/blob/2026.10.4/homeassistant/components/recorder/db_schema.py#L567-L582); [developer blog, 2024-06-22](https://contributors.home-assistant.io/blog/2024/06/22/excluding-state-attributes-from-recording-match-all)).
  - The state row is still recorded at every change unless the entity is also excluded in the recorder's YAML, which is a house configuration change.
- **Who receives it.** Every attribute change goes out to every open page that subscribes to entities. The change carries each changed attribute whole ([`messages.py` L239-L246](https://github.com/home-assistant/core/blob/2026.10.4/homeassistant/components/websocket_api/messages.py#L239-L246)). With one attribute per copy, each change sends only that copy's record to the wall and both phones *(inferred: the frontend subscribes to all entities)*.
- **Restarts.** The state machine is memory. Keeping it takes a `RestoreEntity`, which Home Assistant saves every 15 minutes and at stop ([`restore_state.py` L30](https://github.com/home-assistant/core/blob/2026.10.4/homeassistant/helpers/restore_state.py#L30)).
- **Writing.** A non-admin can't create or set an entity's state through the websocket. So it still needs a house command (§1) to take the reports, plus the sensor class and the restore code.
- **Reading.** `ha_get_state` reads it with a read-only tool ([`tools_search.py` L708-L710](https://github.com/homeassistant-ai/ha-mcp/blob/7d36089/src/ha_mcp/tools/tools_search.py#L708-L710)).

**Verdict.** Everything §1 needs, plus an entity class, restore code and a recorder setting. It also adds an entity to every entity list and broadcast. More lines for no gain.

## 4. Anything simpler

- **`logbook.log`.** No house server code at all.
  - It's a plain service, so any user may call it ([`logbook/__init__.py` L52-L58, L137](https://github.com/home-assistant/core/blob/2026.10.4/homeassistant/components/logbook/__init__.py#L52-L137)). Its entries go to the recorder and are kept for `purge_keep_days`, 10 by default ([`recorder/__init__.py` L109](https://github.com/home-assistant/core/blob/2026.10.4/homeassistant/components/recorder/__init__.py#L109)).
  - `ha_get_logs(source="logbook")` reads them ([`tools_logs.py` L110-L124](https://github.com/homeassistant-ai/ha-mcp/blob/7d36089/src/ha_mcp/tools/tools_logs.py#L110-L124)).
  - Against it: every open becomes a line in the Logbook (Activity) panel that Jenn and the owner see, and a `call_service` row besides. Nothing folds by copy, so a session pages through dozens of lines a day to find each copy's last few. Errors older than 10 days are gone.
  - It's the fallback if the owner wants no server code (§6).
- **A custom event (`fire_event`).** The wall and Jenn can't send one: the websocket `fire_event` command is `require_admin` ([`commands.py` L1257](https://github.com/home-assistant/core/blob/2026.10.4/homeassistant/components/websocket_api/commands.py#L1257)).
- **`frontend/set_user_data`.** Per-user storage that only the user can read, so a session signed in as the connector's account can't read the wall's or Jenn's (the [backend note](https://github.com/bellamy1506/HA-Family-Hub-Clover/blob/research/backend-reuse/docs/research/backend-reuse.md)'s finding, cited in the layout note).
- **An `input_text` helper.** At most 255 characters, and one per copy is an entity per copy.
- **Family Hub's device settings report.** It already keeps a `last_seen` per device. But it makes entities for every device, the house board never reports to it (layout note), and #43 retires it.
- **Family Hub's settings blob.** `set_settings` is a full replace, and the house board never writes it (layout note).

## 5. What the connector can do

From `ha_search_tools` (queries "system log errors logs", "websocket command raw", "entity state attributes", "diagnostics integration download", "storage file read config directory", "list services events fire event", "file tools", and the full descriptions of `ha_get_logs`, `ha_call_service`, `ha_get_integration`, `ha_get_system_health` and `ha_get_state`):

| Option | Read with | Tool marked |
|---|---|---|
| 1, diagnostics | `ha_get_integration(include_diagnostics=True, diagnostics_fields=[…])`, or `ha_get_system_health(include="diagnostics", config_entry_id=…)` | read-only |
| 1, list command | `ha_call_service(ws_command="family_hub/…")` | destructive; not in Read Only Mode |
| 2 | `ha_get_logs(source="system", search=…)`. Also `source="error_log"` for the raw log, and `source="logger"` for levels | read-only |
| 3 | `ha_get_state(entity_id, attribute_keys=[…])` | read-only |
| 4 | `ha_get_logs(source="logbook", hours_back=…, search=…)` | read-only |

No tool lists or reads `.storage` files directly: the search for file tools found none. A tool mentions "HA-MCP File & YAML Tools" as the way it reads the fault log, but no file tool came up. So a Store is readable only through something Family Hub serves, a diagnostics dump or a websocket command.

## 6. The recommended code

**Server: `custom_components/family_hub/copy_reports_websocket_api.py`.** Following the layout note's pattern: one module, one register line in `__init__.py`. It's under the 30-line threshold for a separate pure module.

```python
"""House fork: each copy's last few opens and last error, kept for sessions (#111).

Every signed-in user's board reports here; a session reads it in Family Hub's
diagnostics (diagnostics.py). Test: tests/test_copy_reports.py.
"""
from __future__ import annotations

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util

from .const import DOMAIN

KEEP_OPENS, KEEP_COPIES = 5, 20
MS = vol.Any(None, vol.All(int, vol.Range(min=0, max=600_000)))


@websocket_api.websocket_command({
    vol.Required("type"): "family_hub/copy_report",
    vol.Required("copy"): vol.All(str, vol.Length(min=1, max=40)),
    vol.Required("label"): vol.All(str, vol.Length(max=40)),
    vol.Optional("open"): vol.All([MS], vol.Length(min=2, max=2)),  # first content, all live
    vol.Optional("error"): vol.All(str, vol.Length(max=300)),
})
@callback
def ws_report(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict) -> None:
    reports = hass.data[DOMAIN]["copy_reports"]
    now = dt_util.now().isoformat(timespec="seconds")
    record = reports.pop(msg["copy"], None) or {"opens": [], "error": None}
    record.update(user=connection.user.name if connection.user else None, label=msg["label"], seen=now)
    if "open" in msg:
        record["opens"] = [[now, *msg["open"]], *record["opens"]][:KEEP_OPENS]
    if "error" in msg:
        record["error"] = [now, msg["error"]]
    reports[msg["copy"]] = record  # most recently seen last
    while len(reports) > KEEP_COPIES:
        reports.pop(next(iter(reports)))
    hass.data[DOMAIN]["copy_reports_store"].async_delay_save(lambda: reports, 30)
    connection.send_result(msg["id"])


async def async_setup(hass: HomeAssistant) -> None:
    store = Store(hass, 1, f"{DOMAIN}.copy_reports")
    hass.data[DOMAIN]["copy_reports_store"] = store
    hass.data[DOMAIN]["copy_reports"] = await store.async_load() or {}
    websocket_api.async_register_command(hass, ws_report)
```

The other server pieces:
- **`diagnostics.py`** returns `{"copy_reports": hass.data[DOMAIN].get("copy_reports", {})}` from `async_get_config_entry_diagnostics(hass, entry)`. About 6 lines.
- **`__init__.py`** gets one import and `await copy_reports_ws_api.async_setup(hass)` in `async_setup`, beside `calendar_cache_ws_api.async_register_all(hass)`.
- **The `voluptuous` import** matches the fork's other websocket modules; see Found in passing.

**Board, in `ha.js` and `house-board.js`.** About 15 lines:
- `report(hass, fields)` sends `{type: "family_hub/copy_report", copy, label, ...fields}` and ignores any failure.
- **The copy id:** a random id kept in `localStorage` under `houseBoardCopy`, made on first open, inside `try`/`catch`.
- **The label:** where and what, for example `home, iPhone` or `Cloud, Android`, from `location.hostname` (Cloud when it ends in `nabu.casa`) and a short user-agent match. Never the address itself.
- **Open:** once all calendars are live, or after 10 s, it sends `open: [first content ms, all live ms or null]`. Both numbers are `performance.now()`, which counts from when the page began loading. That's the same zero as the week card's Debug Info timing and #97's targets.
- **Error:**
  - when the board's own code catches a failure, such as a request that fails;
  - on a window `error` whose `filename` is under `/family_hub_house_board/`;
  - at most once per distinct message per open.

**Tests.**
- A Python check of `ws_report` with a fake connection: who is recorded, at most 5 opens, at most 20 copies, the oldest copy dropped first, errors capped at 300 characters.
- A Node check that `ha.js` sends the right message.

**How a session reads it** after a slice goes up (switch-over step 5):
1. `ha_get_integration(domain="family_hub")` gives the entry id.
2. `ha_get_integration(entry_id=…, include_diagnostics=True, diagnostics_fields=["copy_reports"])` gives every copy: who, where, last seen, its last 5 opens as `[when, first content ms, all live ms]`, and its last error as `[when, text]`.
3. For a stack, `ha_get_logs(source="system", search="family_hub_house_board")`.

A note, not worth more effort: a copy that's gone for good (cleared storage, a retired browser) stays in the file until 20 newer copies push it out. Its `seen` date shows that.

## Recommendations

1. Build §6 in slice 1: the house store, the report command, Family Hub's diagnostics, and the board's report at each open and on errors. (technical call; the owner can veto)
2. A session reads the reports through diagnostics with `ha_get_integration` after every install, as switch-over step 5's "open times each copy records". (technical call; the owner can veto)
3. Don't add per-copy logger names, warnings for open times, logbook entries or a sensor. The frontend's existing system-log errors stay the source for stacks. (technical call; the owner can veto)

## Found in passing

- **Core 2026.10.4 no longer lists voluptuous.** Its package requires `probatio==0.13.0` (a validation library that ships no voluptuous module) and no voluptuous. No core module imports voluptuous; core's own schemas now use `probatio` ([`system_log/__init__.py` L11, L38-L63](https://github.com/home-assistant/core/blob/2026.10.4/homeassistant/components/system_log/__init__.py#L38-L63)).
  - Family Hub's Python imports voluptuous: `__init__.py`, `config_flow.py`, `device_trigger.py` and every websocket module. It loads on the house and in the sandbox, so something else installs voluptuous there (not traced).
  - If that stops, Family Hub won't load at all.
  - Worth its own ticket: check what installs it, and whether Family Hub should list it in its manifest or move to `probatio`. Medium confidence that it matters.

## Gaps

- **Nothing was run.**
  - The command, the diagnostics dump and the connector reads were read from source, not tried in the sandbox.
  - `system_log`'s folding of `system_log.write` by logger name rests on reading `_figure_out_source`'s stack walk, not on a run (medium-high confidence).
- **The house's ha-mcp settings weren't read**, so it's unknown whether Read Only Mode is off and which tools are on "Allow always". J006 records full access.
- **An iPhone coming back to the app isn't an open:** nothing reloads. #97's "at once when an iPhone comes back" target isn't measured by this. If it's wanted, the board can report a "back" time on `visibilitychange` with one more field.
- **The Store's file name**, `family_hub.copy_reports`, sits beside upstream's own keys. Upstream doesn't use it today (`store.py`, `const.py`).

## Sources

- **Home Assistant core 2026.10.4** ([tag](https://github.com/home-assistant/core/tree/2026.10.4); read from the published wheel):
  - `components/system_log/__init__.py`;
  - `components/websocket_api/connection.py`, `decorators.py`, `commands.py`, `messages.py`;
  - `helpers/storage.py`, `helpers/service.py`, `helpers/entity.py`, `helpers/restore_state.py`;
  - `components/recorder/db_schema.py`, `components/recorder/__init__.py`;
  - `components/logbook/__init__.py`, `components/diagnostics/__init__.py`;
  - `core.py`, `const.py`, `bootstrap.py`, `util/logging.py`;
  - the wheel's `METADATA`.
- **Home Assistant frontend 20260930.5** (`901c0a6`): [`src/state/logging-mixin.ts`](https://github.com/home-assistant/frontend/blob/20260930.5/src/state/logging-mixin.ts), `src/data/system_log.ts`.
- **Home Assistant docs** (fetched 2026-11-01): [System Log integration](https://www.home-assistant.io/integrations/system_log/); [Extending the WebSocket API](https://contributors.home-assistant.io/frontend/extending/websocket-api/); [Integration diagnostics](https://contributors.home-assistant.io/core/integrations/diagnostics/); [Excluding all state attributes from recording](https://contributors.home-assistant.io/blog/2024/06/22/excluding-state-attributes-from-recording-match-all).
- **ha-mcp** at [`7d36089`](https://github.com/homeassistant-ai/ha-mcp/tree/7d36089) (changelog top: v9.0.0):
  - `src/ha_mcp/tools/tools_service.py`, `util_helpers.py`, `log_sources.py`, `log_sources_logbook.py`, `tools_logs.py`, `tools_integrations.py`, `diagnostics_helpers.py`, `tools_search.py`;
  - `src/ha_mcp/read_only.py`.
- **The "Home Assistant" connector:** its `ha_search_tools` listing and tool descriptions, 2026-11-01. No other tool was called.
- **This fork, `house/board-next` at `72ee2cc`:** `custom_components/family_hub/__init__.py` (`async_setup`), `calendar_cache_websocket_api.py`, `device_settings_websocket_api.py` (`ws_report`), `store.py`; [CONTEXT.md](../../CONTEXT.md); [switch-over.md](../board-next/switch-over.md).
- **Earlier decisions and notes:** [#98, what the house keeps](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/98#issuecomment-6559117623); [#97, load time](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/97#issuecomment-6558650608); [house board layout](https://github.com/bellamy1506/HA-Family-Hub-Clover/blob/research/board-layout/docs/board-next/house-board-layout.md); [J006](https://github.com/bellamy1506/Clover-Home/blob/main/records/projects/J006-home-assistant-automations.md) (the connector's account and settings, fork changes 5 and 6).
