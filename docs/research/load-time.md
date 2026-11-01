# How quickly the house board opens

Research note, 2026-11-01, for fork issue [#97](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/97) (map [#37](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/37)): how soon the house board shows something useful on the wall and each iPhone, with iCloud answering slowest, and what keeps it quick after the switch-over.

Sources: Home Assistant 2026.10.4 (the house's version, read through the connector today) and its frontend 20260930.5, as installed in the sandbox; this fork's `main` at `f9a0d1e` (what the house runs). Measurements come from a scratch copy of the sandbox with a stand-in for the house board (§2).

Terms: "copy" alone means a wall or phone copy, as in [CONTEXT.md](../../CONTEXT.md). "The server's copy" is Family Hub's in-memory copy of the calendars (fork change 6 in [J006](https://github.com/bellamy1506/Clover-Home/blob/main/records/projects/J006-home-assistant-automations.md#built-in-home-assistant)). *(inferred)* marks my judgement. Every number says where it was measured.

## Answer

**Where the time goes.** Every open, on every copy, runs the same five steps:

1. Home Assistant's own page starts, signs in and opens its websocket.
2. The dashboard asks for every registered card file at once, without waiting for them.
3. The house board's own seven files load. Their address carries a version, so once fetched they're kept for a month.
4. The board asks for the server's copy of the calendars: one websocket round trip. **This is the first useful content.**
5. Each calendar answers live. iCloud takes about 0.2 s plus 0.1 s per event (2.9 s for Will's on the house, 2026-10-26). Each answer replaces only what changed.

In the sandbox, step 1 was 80 to 90% of the time to first content on every profile. The board's own share (steps 3 and 4) was 0.05 to 0.4 s. What differs between copies:

- **Wall, Auto Reload on Idle:** a full page load from a warm cache each time Fully reloads. The stand-in, at the tablet's pace *(4× slower processor, inferred)*: first content at 1.2 s, all calendars live at 2.0 s. About 1.0 s of that is Home Assistant's own start.
- **Wall cold start** (Fully or the tablet restarting): the same, plus Fully and its WebView starting (not measured). The cache survives *(inferred)*.
- **iPhone opening cold:** the app often starts with an empty cache. It clears it every 3 days, after app or Home Assistant updates, and on pull to refresh ([iPhone app research](https://github.com/bellamy1506/HA-Family-Hub-Clover/blob/research/iphone-app/docs/research/iphone-app.md), §1.6). Then everything downloads again, including Family Hub's 3.0 MB of card files, uncompressed. Stand-in: first content at 0.5 s at home, 3.4 s on a Cloud-like link.
- **iPhone coming back:** nothing reloads, and the board is still on screen. After 30 s away the app reconnects the websocket (back in 10 ms at home and 110 ms on the Cloud-like link, in the sandbox). The board has to re-ask its calendars itself.
- **Home or Cloud:** Cloud relays every request through Nabu Casa, so the many small steps of Home Assistant's start each pay a round trip. Uncached files are limited by the house's upload speed. On the house, Cloud was no slower (6.9 s against 7.3 s at home, 2026-10-26).

**Family Hub's card files load on every dashboard.** Home Assistant loads every registered dashboard resource on the first dashboard a page opens, whichever it is. It has no per-dashboard resources. So while they're registered, `/house-board` runs all 12 Family Hub card files (3.0 MB, 1.46 MB of it the week card), downloading them whenever they aren't cached.
- **What they cost in the sandbox:** under 0.1 s when cached or at home, but 0.6 s on a phone with an empty cache over the Cloud-like link (3.36 s → 2.78 s). Retiring only the 11 files no house dashboard uses gave the same gain.
- **Removing them:** deleting them by hand doesn't last, because Family Hub registers all 12 again at every start. It takes a small code change, using wave 0's `_retire_dashboard_resource`. The 11 unused ones (1.54 MB) can go any time. The week card's goes when the week card retires.

**iCloud's slow answer.** The board draws the server's copy as soon as it arrives. Then it compares each calendar's live answer with what it drew and redraws only the days that changed. Nothing jumps if four rules hold:
- the board sends answers back in the calendar API's own shape;
- it sorts each day's events itself;
- it holds anything built from all calendars (Next, needs you) until the copy or every live answer is complete;
- it reserves every box.

In the sandbox, a stand-in that did this usually drew twice per open (frame, then copy), and iCloud's late answers redrew nothing. One that sent back plain-string times drew six times: the server's copy stores such events but never returns them, so every day came up blank and then filled in. Once the wall's house board re-asks every minute and sends what it finds back, the copy a phone gets is normally under a minute old, so the live answer normally changes nothing *(inferred)*.

**Freshness without the week card.** Today the server's copy stays fresh because the wall's week card re-asks every 60 s and sends back what changed. The hourly refresh covers only calendars some board asked about since the last restart. So the house board has to do the same job: read the copy, re-ask each calendar every 60 s while it's shown, and send back complete answers.

Subscriptions wouldn't keep it fresh. For iCloud, Home Assistant pushes only when the CalDAV integration refreshes, every 15 minutes, and Us moves to iCloud at the switch-over. One small server change covers the gap after a restart: when a board asks for a range the copy doesn't hold, refresh the copy's whole window once.

**Target** (a technical call; the owner can veto):
- **The board's own share,** checked in the sandbox every slice: first content within 0.3 s of the board getting Home Assistant, no layout shift after it, and no redraw when a live answer matches the copy.
- **The whole open,** read on the house after each install: the wall within 2 s of a reload; an iPhone within 3.5 s at home or on Cloud (about half of today's 7.3 s); at once when an iPhone comes back, live within 3 s.

**The check per slice:** a sandbox script opens the board on three profiles and reads the board's own open timing (§5).

## 1. How Home Assistant opens a dashboard

Read in Home Assistant 2026.10.4 and frontend 20260930.5, the version 2026.10.4 pins.

- **Resources are global and loaded once per page.** On the first Lovelace dashboard a page shows, the panel fetches the resource list and starts every resource without waiting for any (`src/panels/lovelace/ha-panel-lovelace.ts`, `_fetchConfig`, the module-level `resourcesLoaded`; `common/load-resources.ts`, `loadLovelaceResources`). Each becomes an `async` `<script type="module">` (`src/common/dom/load_resource.ts`).
  - Home Assistant's docs: "Resources are loaded for all dashboards" ([contributors docs](https://contributors.home-assistant.io/frontend/custom-ui/resources/)).
  - A resource has only a type and a URL, with no field to tie it to a dashboard (core `lovelace/const.py`, `RESOURCE_FIELDS`).
  - In the sandbox, the stand-in's file also loaded on `/family-hub`.
- **The list is asked for a step later on `/house-board`.** The frontend fetches the resource list as soon as the websocket opens only for `/` and `/lovelace/…` (`src/entrypoints/core.ts`). On any other dashboard it asks when the panel starts.
- **A card whose file hasn't run yet** gets a hidden placeholder that rebuilds itself the moment the element is defined (`create-element/create-element-base.ts`, `_customCreate`).
- **`frontend.add_extra_js_url` is worse, not better.** Extra modules go into the page itself and load on every page, Settings included (core `frontend/__init__.py`, `extra_modules` in `index.html`).
- **How files are served,** checked with `curl` against the sandbox:
  - **Family Hub's card files** are registered without cache headers. They come with an `ETag` and `Last-Modified` but no `Cache-Control`, uncompressed, over HTTP/1.1. The week card is 1,462,881 bytes; gzip would make it 389,812. With no `Cache-Control` the browser decides how long to keep them; in the sandbox, warm opens took them from the cache without asking.
  - **Home Assistant's own frontend files** are pre-compressed (Brotli, 1.1 MB in all on an empty cache) and kept for 31 days.
  - **The house board's folder,** registered with cache headers and a hash in its address (#44), gets 31 days too.
- **Service worker:** only on https (`src/util/register-service-worker.ts`), so on Cloud and not at home. It serves other files, card files included, from its own cache and refreshes them in the background, for up to a day (`src/entrypoints/service-worker.ts`).
- **Hidden and back.**
  - Hidden for 5 minutes, the frontend closes its websocket and detaches the panel, reattaching it when shown (`src/layouts/home-assistant.ts`, `partial-panel-resolver.ts`).
  - The iPhone app, after more than 30 s away, sends `restart`, which calls `connection.reconnect(true)` (`src/external_app/external_app_entrypoint.ts`).
  - The websocket library resubscribes every subscription after a reconnect ([home-assistant-js-websocket](https://github.com/home-assistant/home-assistant-js-websocket/blob/master/lib/connection.ts), `_setSocket`). A card's one-off requests aren't repeated.
- **Cloud** relays each connection through Nabu Casa's SniTun proxy, encrypted end to end to the house ([SniTun](https://github.com/NabuCasa/snitun): "End-to-End encryption with SNI proxy on top of a TCP multiplexer"). Every request pays the relay's round trip, and uncached files the house's upload speed *(inferred)*.

## 2. Measured

### 2.1 On the house (2026-10-26, week card)

From [J008, Calendars](https://github.com/bellamy1506/Clover-Home/blob/main/records/projects/J008-family-hub.md#2-calendars), on the owner's iPhone, one fresh open per address:

| Step | Home | Cloud |
|---|---|---|
| Calendar text | 7.3 s | 6.9 s |
| Page ready to card file running | 2.6 s | 3.1 s |
| Will's calendar | 2.9 s | 3.1 s |
| Three setup requests | 0.07 s | 0.29 s |

The server's copy came after that measurement and hasn't been timed on a phone.

Read through the connector today: the house has the same 12 Family Hub module resources and nothing else, in storage mode. Its dashboards are Map and Family Hub; Family Hub's only custom card is the week card (also `tests/sandbox/house_config.json`, read 2026-10-29).

### 2.2 In the sandbox (2026-11-01)

**Setup.** A scratch copy of `tests/sandbox/`, in its own folder and port so parallel sessions weren't disturbed. Family Hub at `f9a0d1e`, with the same 12 resources and version hashes as the house. Two scratch additions, kept out of the repo:
- **iCloud's pace:** Will's, Home and Work answer 0.2 s plus 0.1 s per event late, as J008 measured. Us and Jenn's answer at once.
- **A house board stand-in:** seven modules shaped like #44's (`house-board.js` importing `ha.js`, `face.js` and `theme.js`; `face.js` importing `when.js`, `meals.js` and `html.js`). They're padded to 2,815 lines and 150 KB, the folder ceiling #44 set.
  - On `hass` it asks at once, in parallel, for the server's copy, the settings and the themes, then for each calendar live.
  - It sits on a `/house-board` panel dashboard, served from a versioned folder with 31-day caching like #44's.

**Profiles:**
- **Wall:** 1200×800 at 2×, the processor slowed 4× *(inferred stand-in for the tablet's Helio G99; not calibrated against it)*.
- **Phone:** 390×844 at 3×, full speed.
- **Home:** no added delay. **Cloud-like:** 100 ms added per round trip, 25 Mbit/s down, 10 up *(inferred)*.
- **Warm:** the browser's cache as the last open left it. **Cold:** cache cleared first.

Five opens each. The table gives medians in milliseconds since the page began loading, the same clock as the week card's Debug Info. The machine was shared with other sessions, so single opens varied by up to 0.5 s.

| Copy | Week card: first content | Week card: all live | Stand-in: first content | Stand-in: all live |
|---|---|---|---|---|
| Wall, warm, home (idle reload) | 2,755 | 3,645 | **1,233** | 2,032 |
| Wall, cold, home | 3,023 | 3,832 | **1,450** | 2,265 |
| Wall, warm, Cloud-like | 2,251 | 2,836 | **1,395** | 2,196 |
| Wall, cold, Cloud-like | 5,522 | 6,253 | **3,702** | 4,500 |
| Phone, warm, home | 1,033 | 4,129 | **251** | 1,065 |
| Phone, cold, home | 1,296 | 4,315 | **526** | 1,327 |
| Phone, warm, Cloud-like | 1,313 | 4,371 | **407** | 1,216 |
| Phone, cold, Cloud-like | 4,383 | 7,509 | **3,357** | 4,163 |

- "First content" is the week card's "Server copy shown" and the stand-in's copy drawn.
- The week card's "all live" is later on the phone because the owner's phone settings show a longer range, with more events to wait for.

**Family Hub's files on the stand-in.** Stand-in first content, all 12 registered / none / the week card's alone:

| Copy | All 12 | None | Week card's only |
|---|---|---|---|
| Wall, warm, home | 1,233 | 1,164 | 1,180 |
| Wall, cold, Cloud-like | 3,702 | 3,145 | |
| Phone, cold, home | 526 | 499 | 468 |
| Phone, cold, Cloud-like | 3,357 | 2,783 | 2,794 |

- With the week card's file alone, the week card itself still opened normally, with every open-timing step. Its first content on the phone, cold, over the Cloud-like link fell from 4,383 to 3,698.
- **Home Assistant's own start** (when the first card file was asked for) took about 990 ms on the wall, 415 on the phone at home and 2,390 on the phone over the Cloud-like link, empty cache.

**Copy, then live.** Stand-in draws per open (wall warm and phone cold, 5 or 6 opens each):
- Sending back the subscription's plain-string times: six draws every open. The copy came up empty and each calendar's late answer redrew.
- Sending back the API's `{"dateTime": …}` shape and sorting each day: two draws (frame, copy) in 8 of 11 opens. The other three added one or two draws within 35 ms of the copy, when a fast calendar answered first. iCloud's answers 0.5 to 0.8 s later never redrew.
- No layout shift was recorded in any open (the browser's Layout Instability API), since every day's box was reserved.

**Coming back** (the iPhone app's `restart`, i.e. `connection.reconnect(true)`, five times each):
- The websocket was back in 6 to 10 ms at home and 110 to 113 ms over the Cloud-like link.
- Us and Jenn's subscriptions pushed again 35 to 90 ms (home) and 185 to 230 ms (Cloud-like) after the call.
- An iCloud stand-in pushed at 0.5 to 0.6 s, at its own pace.

### 2.3 What it means for each copy *(inferred)*

- **The stand-in's first content comes 5 to 70 ms after its file runs,** because it asks for the copy in parallel with everything else. The week card asks only after three setup steps in a row, which is most of its 0.7 to 1.5 s lag behind its own file.
- **Home Assistant's own start is most of every open.** No card can shorten it. Over Cloud with an empty cache, it's a chain of round trips plus 1.1 MB.
- **Family Hub's files matter on uncached opens over Cloud,** where they share the house's upload with the board's files.
- **On the house, step 1 is slower than in the sandbox.** The sandbox's phone reached the week card's file 0.3 to 0.6 s after the page began loading; the owner's iPhone took 2.6 s from page ready. The Green serves files, and the house's Home Assistant sends many more entities at start, more slowly than this machine. So the house's absolute times will be longer, and the house's own timing after each slice decides. What carries over is which steps disappear: the week card's three setup steps before the copy, its 60 s wait to look again, and, for cold Cloud opens, Family Hub's unused files.
- **The wall's idle reload** costs a full warm open: on the tablet, probably 1.5 to 2 s to first content. It also costs one live fetch of every calendar from iCloud. Nobody is looking when it happens, so what matters is that the face comes up settled, which the copy and the reserved boxes give.

## 3. Family Hub's card files on `/house-board`

- **Yes, they load there.** Every registered resource loads on whichever dashboard a page opens first, with no per-dashboard choice (§1).
- **What they cost:** little where files are cached or the link is fast. They cost 0.6 s on an empty-cache Cloud open in the sandbox, and possibly more on the house, where the Green serves them uncompressed through the house's upload *(inferred)*. They're also 1.54 MB of unused code compiled on every open.
- **Deleting them by hand doesn't last.** `async_setup_entry` calls `_register_dashboard_resource` for each of the 12 at every start (`__init__.py` on `main`). So a resource deleted in Settings > Dashboards > Resources comes back at the next restart.
- **What retiring takes:** in `async_setup_entry`, replace each `_register_dashboard_resource(hass, …_url_versioned)` with `_retire_dashboard_resource(hass, …_JS_URL)`. That's the wave 0 helper that already retires the Right Now card's resource. It deletes the entry at the first start after a HACS update. The static paths can stay, since a file nobody asks for costs nothing. Add one check in `tests/test_dashboard_resources.py`.
- **Two stages,** since resources are global and the week card is the fallback until it retires:
  1. **The 11 cards on no house dashboard,** any time. That's the theme selector, today, screensaver, chores, my chores, rewards, goals, pantry, to-do, active timers and recipe box (1,538,707 bytes, 51%). Outside comments, neither the week card nor the Family Hub panel names their elements, and the week card opened normally without them (§2.2). The natural moment is the first slice's PR, which already changes `_register_dashboard_resource` (#44's `match`).
  2. **The week card's own resource** (1,462,881 bytes), in the same update that retires the week card.

## 4. The server's copy and iCloud

### 4.1 What keeps the copy fresh today

From `calendar_cache.py` and `calendar_cache_websocket_api.py` on `main`:
- **In memory only;** a restart empties it.
- **`get`** returns a calendar only if its copy covers the whole range asked for, and records the calendar as known.
- **`put`** is sent by each week card after every live check that changed something: every 60 s while it runs (`_saveCalendarCopy`).
  - It replaces that range's events and widens the window.
  - It keeps older events outside the range first and adds the new ones after them.
  - It matches events by `{"dateTime"}` or `{"date"}` start times only. An event whose times are plain strings, as `calendar/event/subscribe` sends them, is stored but never matched. `get` then reports the range as covered and returns it without those events, and later `put`s never remove them. A board sending that shape would also blank the week card's copy of the same days while both run.
- **The hourly refresh** fetches today −42 to +80 days for every calendar a board has asked about since the last restart. Its first run is an hour after the start.

So after the switch-over, freshness depends on what the house board does:

| House board | Copy a phone gets on opening |
|---|---|
| Never calls `get` or `put` | Empty after the next restart, so every open waits for iCloud |
| Calls `get` only | Up to an hour old, so the live answer often changes things on screen |
| Calls `get`, re-asks every 60 s while shown, `put`s complete answers in the API's shape | As fresh as the wall's last minute, as today |

One gap remains after a restart. Until the first hourly refresh, the copy holds only the ranges boards have sent back. The wall's four days won't cover a phone's longer list, so phones wait for iCloud for up to an hour after each restart. A small server change closes it: when `get` finds no copy for a calendar, start the window refresh once, unless one is already running.

### 4.2 Why not subscriptions for calendars

Home Assistant 2026.10 has `calendar/event/subscribe`, which its own calendar card and panel use (`src/data/calendar.ts`). It pushes a fresh fetch each time the calendar entity writes its state (`calendar/__init__.py`, `_async_write_ha_state`, debounced 1 s). For the house's calendars:
- **iCloud (CalDAV):** the entity writes its state when its coordinator refreshes, every 15 minutes (`caldav/coordinator.py`, `MIN_TIME_BETWEEN_UPDATES`), and at event starts and ends. Each fetch asks iCloud live. An event added on an iPhone would take up to 15 minutes to show, against about a minute today.
- **Google (Jenn's, planned):** the integration syncs every 15 minutes and answers from its local copy (`google/coordinator.py`). It's fast to ask and never fresher than 15 minutes, whatever the board does.
- **Us:** a Local Calendar today, so instant, but it becomes iCloud's shared Us at the switch-over (#41).

So subscriptions save nothing on the wall and lose freshness. The week card's path (copy first, a live re-ask every 60 s, answers sent back) is the right one; #44 already planned it for the first slice.

### 4.3 Showing the copy, then the live answer, without jumps

- **Send answers back in the API's shape:** the REST answer already is, so keep it as it came (§4.1).
- **Sort each day's events in the board** by start, end, title and `uid`. Neither Home Assistant nor iCloud promises an order, and `put` appends the newest range after older events.
- **Compare, then redraw only what changed.** Compare copy and live per day, and leave a day alone when it's the same (#72: update only what changed). Hold the first draw of events until the copy answers, so a fast calendar answering first doesn't add a draw.
- **Hold what depends on every calendar.** The Next band and "needs you" (a clash needs both people's events) wait for a complete copy or every live answer. With no copy, the frame, weather, dinner and each calendar's events fill in place as they come; Next and needs you come last.
- **Reserve every box** (#72): the lead line, Now, needs you, the rain line, and event shapes at their real heights.
- **A real change** (an event moved on an iPhone in the last minute) just replaces its day, without animation, since nobody is mid-gesture at open *(inferred)*.
- **Coming back:** on becoming visible, and on reconnecting, recompute today and draw what's there at once. Then re-ask every calendar and apply the same comparison (#67).

## 5. Target and the check per slice

**First useful content** is the resting face, or a phone's Upcoming, showing today's and the next days' events from the server's copy, with the weather and dinner. It's measured by the board's own open timing, from the page starting to load. The target is a technical call; the owner can veto.

**The board's own share,** checked in the sandbox every slice:

| Check | Target | Stand-in today |
|---|---|---|
| First content after the board gets Home Assistant | 0.3 s | 0.005 to 0.07 s |
| Wall, warm (idle reload) | 1.5 s | 1.2 s |
| Phone, empty cache, home | 1 s | 0.5 s |
| Phone, empty cache, Cloud-like | 3.5 s | 3.4 s (2.8 s without the 11 unused files) |
| Layout shifts after first content | none | none |
| Draws when every live answer matches the copy | none | none |

**The whole open,** read on the house after each install *(inferred from the house's 2.6 s for step 1 on 2026-10-26)*:

| Copy | Target | Today's week card |
|---|---|---|
| Wall, idle reload or Fully restart | 2 s | not timed on the tablet |
| iPhone opening, home or Cloud | 3.5 s | 7.3 s and 6.9 s before the server's copy |
| iPhone coming back | at once; live within 3 s | unchanged until its next 60 s check |

If an iPhone misses, time an empty dashboard the same way to see whether it's Home Assistant's own start. If it's Family Hub's files, retire them first.

**The board's own open timing.** Like the week card's Debug Info (fork change 5): marks in ms since the page began loading, for page ready, board file ran, Home Assistant given, the server's copy drawn (first content), each calendar live and all live. They're kept on the card element for scripts and shown at the foot of the house board's settings page for a phone check. Nothing is stored or sent.

**The check a build session runs per slice:**
1. **In the sandbox:** a script beside `verify_board.js` (say `tests/sandbox/open_timing.js`) opens `/house-board` five times on each of three profiles: the wall with a warm cache, a phone at home with an empty cache, and a phone on the Cloud-like link with an empty cache (profiles as in §2.2).
   - It reads the card's open timing and prints the medians beside the targets.
   - It fails when a median misses, when a layout shift is recorded after first content, or when a live answer equal to the copy caused a draw.
   - It needs one sandbox option: iCloud stand-ins that answer at the house's pace, 0.2 s plus 0.1 s per event (a small addition to `sandbox_house`).
2. **On the house,** after each slice is installed: read the open timing once on the wall and once on the owner's phone after a force-close, at home and on Cloud. Record both in J008's load-time paragraph.

## Recommendations

1. Adopt the targets and the check in §5. (technical call; the owner can veto)
2. Calendars keep the week card's path:
   - the server's copy, asked in parallel with settings and themes the moment the card gets `hass`;
   - a live re-ask every 60 s while the page is shown, and at once when it's shown again;
   - complete answers sent back with `put`, in the API's shape;
   - no calendar subscriptions.

   (technical call; the owner can veto)
3. No jumps: sort each day, compare copy and live, redraw only changed days, hold Next and needs you until all calendars are in, and reserve every box. (technical call; the owner can veto)
4. When `get` finds no copy for a calendar, the server refreshes the window once. (technical call; the owner can veto)
5. Retire the resources of Family Hub's 11 unused cards in code, with the first slice. (technical call; the owner can veto)
6. Retire the week card's resource in the same update that retires the week card. (a switch-over step, for [How does each copy move to the house board, and back if it fails?](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/99))
7. Fully on the wall:
   - keep Delete Cache on Auto Reload off, so each idle reload is a warm open;
   - leave Auto Reload on Screen On off;
   - turn on "Skip Auto Reload if Showing the Start URL", which works only if Month and Lists change the page's address. Otherwise the wall stays on Month, or reloads every idle period.

   (a switch-over step, for [How does each copy move to the house board, and back if it fails?](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/99))

## Gaps

- **Nothing was measured on the tablet or the phones.**
  - The 4× processor slowdown isn't calibrated against the tablet.
  - The Cloud-like link is a guess at the house's upload.
  - Fully's and the iPhone app's own start times are unknown.
- **The house board's code doesn't exist yet.** The stand-in has its shape and size, not its drawing work.
- **Whether Fully's Auto Reload on Idle is set on the tablet, and to what,** wasn't read; #44 plans it.
- **The service worker's effect on Cloud opens** wasn't measured, because the sandbox is http only.

## Sources

- Home Assistant frontend 20260930.5 (`git clone --branch 20260930.5`, commit `901c0a6`): `src/panels/lovelace/ha-panel-lovelace.ts`, `common/load-resources.ts`, `create-element/create-element-base.ts`, `src/common/dom/load_resource.ts`, `src/entrypoints/core.ts`, `src/entrypoints/service-worker.ts`, `src/util/register-service-worker.ts`, `src/layouts/home-assistant.ts`, `src/layouts/partial-panel-resolver.ts`, `src/external_app/external_app_entrypoint.ts`, `src/data/calendar.ts`.
- Home Assistant core 2026.10.4 (the pip package in the sandbox): `components/lovelace/const.py`, `components/frontend/__init__.py`, `components/http/static.py`, `components/calendar/__init__.py` and `helper.py`, `components/caldav/coordinator.py` and `calendar.py`, `components/google/coordinator.py`.
- [Home Assistant contributors docs, Registering resources](https://contributors.home-assistant.io/frontend/custom-ui/resources/) (fetched 2026-11-01).
- [home-assistant-js-websocket, `lib/connection.ts`](https://github.com/home-assistant/home-assistant-js-websocket/blob/master/lib/connection.ts) (fetched 2026-11-01).
- [Fully Kiosk, Web Auto Reload](https://www.fully-kiosk.com/docs/en/configuration/web-auto-reload) (fetched 2026-11-01). Auto Reload on Idle: "automatic reload (Start URL or current page) after x seconds of user inactivity". Also Skip Auto Reload if Showing the Start URL, and Delete Cache on Auto Reload.
- [NabuCasa/snitun](https://github.com/NabuCasa/snitun) README.
- This fork's `main` at `f9a0d1e`: `custom_components/family_hub/__init__.py` (`async_setup_entry`, `_register_dashboard_resource`, `_retire_dashboard_resource`), `calendar_cache.py`, `calendar_cache_websocket_api.py`, and `card/family-week-calendar-card.js` (`_askCachedEvents`, `_saveCalendarCopy`, `_markOpen`, the 60 s poll).
- The house, read only through the Home Assistant connector, 2026-11-01: its version, dashboard resources and dashboards.
- Earlier decisions and notes:
  - [#43](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/43#issuecomment-6512554066)
  - [#44](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/44#issuecomment-6512692169) and [its note](https://github.com/bellamy1506/HA-Family-Hub-Clover/blob/research/board-layout/docs/board-next/house-board-layout.md)
  - [#67](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/67#issuecomment-6537438807) and [its note](https://github.com/bellamy1506/HA-Family-Hub-Clover/blob/research/iphone-app/docs/research/iphone-app.md)
  - [#72](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/72#issuecomment-6537563054)
  - [J008 load time](https://github.com/bellamy1506/Clover-Home/blob/main/records/projects/J008-family-hub.md#2-calendars)
