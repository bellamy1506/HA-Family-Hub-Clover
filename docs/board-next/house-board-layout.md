# How the house board's code is laid out

Decision for fork issue [#44](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/44) (map [#37](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/37)), 2026-10-30. A technical call, made with the `codebase-design` and `lean-code` skills; the owner can veto it. Terms (house board, week card, copy, resting face) are in [CONTEXT.md](../../CONTEXT.md).

Inputs: [mission.md](mission.md); [synthesis.md](synthesis.md), D1 **A** (a new house board in stages beside the week card, which stays the detail view and fallback until each piece replaces it); the backend decision on [#43](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/43) and its note, [backend-reuse.md](https://github.com/bellamy1506/HA-Family-Hub-Clover/blob/research/backend-reuse/docs/research/backend-reuse.md) (branch `research/backend-reuse`); the [card map](../agents/card-map.md); `tests/run_all.sh`, `tests/browser/` and the [sandbox](../../tests/sandbox/README.md). Home Assistant facts below were read from 2026.10.4 and its frontend (20260930.5) as installed in the sandbox, the version the house runs.

## The decision

1. **One card, a few plain modules, no build step.** The house board is one dashboard card, `custom:house-board-card`, for the wall tablet and both iPhones. Its code is a handful of ES modules in one folder, `custom_components/family_hub/house_board/`, written as plain custom elements with no library and served exactly as written.
2. **The logic is pure and tested in Node; the browser checks only what needs a browser.** Whatever decides what to show is a plain function in its own module, which a Node check imports and runs as is. One module talks to Home Assistant, and the tests hand it a fake `hass`. One browser check mounts the real card in a harness. The sandbox proves the whole under a real Home Assistant.
3. **Served from a versioned folder.** Home Assistant serves the folder at `/family_hub_house_board/<hash of the folder>/`. Every file of one version shares that address, so an update replaces all of them at once and none can be stale.
4. **Beside the week card, on its own dashboard.** The week card's `/family-hub` dashboard stays exactly as it is. The house board gets a new dashboard, `/house-board`. A copy shows whichever address it opens: the wall tablet by Fully Kiosk's Start URL, the phones by Home Assistant's default dashboard. Neither card decides it, and going back is one setting.
5. **First slice: the resting face, read only, on the wall tablet**, built once the prototype ([#38](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/38)) settles what it shows.

## Files, and what each owns

All in `custom_components/family_hub/house_board/`, beside the week card's `card/` folder and touching nothing in it.

| File | Owns | Leaves to others |
|---|---|---|
| `house-board.js` | The card itself: Home Assistant's card contract (`setConfig`, `hass`, size), starting and stopping the data, a tick once a minute, drawing into its shadow root, one tap listener for the whole card, going to another dashboard. The only file that touches the page or `customElements`. | What to show and what it says |
| `ha.js` | The only file that calls Home Assistant. `watch(hass, config, onChange)` returns `{ setHass, stop }` and hands over one plain snapshot: events per column, items per to-do list, the forecast, the household settings keys the board reads, the theme, the two privacy switches, and what failed. The writes (add, change, delete, undo) join it later as plain async functions. | Layout, words |
| `when.js` | Days and times: which events fall on a day (all-day ends are exclusive, events past midnight, the 1 Nov clock change) and the words ("Tue Nov 3, 3:30 pm"). | |
| `meals.js` | The meal plan's packed format: a day's slots, and the meal in each slot (explicit, then leftover, then weekly repeat), by the week card's `_getMealForDay` rules. Later, the writer that keeps keys it doesn't know (backend note, section 2). | |
| `face.js` | The resting face: `faceModel(snapshot, now)` picks what shows (now, next, the days, dinner, weather; later "needs you"), and `faceHtml(model)` draws it. | Fetching |
| `theme.js` | The household's Family Hub theme (read only, `theme_builder/list`) turned into the board's CSS variables, with a fallback, remembered so the board opens in its own colors. | |
| `html.js` | The `html` tagged template: every value is escaped unless it is itself `html`. Event titles can come from iCloud invitations that other people write, so nothing reaches `innerHTML` any other way. | |

How they fit:
- Imports run one way: `house-board.js` uses `ha.js`, `face.js` and `theme.js`; `face.js` uses `when.js`, `meals.js` and `html.js`. Pure modules never import `ha.js` or touch the page, so Node loads them as they are.
- The one seam is `hass`, Home Assistant's own object. It has two adapters, the real one and the tests' fake (`tests/lib/fake_hass.js`, built with the first slice), so the board wraps it in no interface of its own.
- Nothing house-specific is written into the code: entity ids, column names, colors, which columns are private, and the week card's address all come from the card's config.
- Later slices add a file when they add a surface with state of its own: the capture sheet ([#49](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/49)) and the event sheet ([#45](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/45)) as small custom elements, so typing survives a redraw of the face; the phone views ([#50](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/50)) as a module like `face.js`. Wall and phones stay one card; what differs follows the card's width and the person's preferences.
- A file is one thing that changes for its own reason and has its own test. A piece under about 30 lines lives in its only caller. Each file opens with three lines: what it owns, what it leaves alone, which test covers it. The folder is small enough that this file and those headers are its map; a separate map like the week card's waits until it passes about ten files.
- Conventions: ordinary indented modern JavaScript (not the week card's column-0 style), short functions with plain names, English words in the module that shows them (no translation layer for two adults), browser storage keys starting `houseBoard`.

Server side, house Python code keeps the pattern already here: logic in a module with no Home Assistant imports (as `calendar_cache.py` and `copy_sync.py`), its wiring in a `<name>_websocket_api.py`, and one import and one register line in `__init__.py`. That is where the per-person preferences service (#43), the "last touched by" record ([#42](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/42)) and the iCloud write path ([#39](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/39)) go when their slices come.

## Plain web components, not a library or a build step

| Option | Cost to own | Call |
|---|---|---|
| **Plain custom elements**, no build | Nothing to install or upgrade; the file served is the file read and edited. The card redraws regions by hand and must escape every value, which `html.js` and one test settle. | **Chosen** |
| Lit, vendored as one file, no build | About 15 KB of minified code nobody reads or upgrades on purpose; a second way to write templates and a lifecycle to learn. Buys efficient redraws that keep typing and focus. | The fallback (below) |
| Preact with htm, vendored | Smaller than Lit, but a virtual DOM to reason about for a board that redraws once a minute. | Rejected |
| Borrowing Home Assistant's own Lit at runtime | No file to keep, but it relies on Home Assistant's internals and is missing in the test harness, which has no Home Assistant frontend. | Rejected |
| A build step (TypeScript, Lit, a bundler) | The community norm. It brings `package.json`, a lockfile, `node_modules`, a bundle committed beside its source (HACS serves the repo's files), an install in every session and in CI, and dependency alerts. Every session pays it, for a board of a few thousand lines. | Rejected |

The resting face is calm by design: it changes when the minute or the data changes, with no animation, so redrawing a region with `innerHTML` is cheap and correct. The surfaces that hold typing get their own element and are never redrawn by data. That is exactly where a library would earn its place, so that's the condition that would change this call.

## How it's tested

- **Node checks of the pure modules**, one file each: `tests/test_house_board_<module>.js` (`when`, `meals`, `face`, `theme`, `html`, `ha`). `tests/run_all.sh` already picks up `tests/*.js`, so nothing changes there. Each imports the real module with `require()`, which Node runs on ES modules as they are (checked on Node 24 here; CI uses Node 22). There's no source extraction and no stub `this`, unlike `tests/lib/card_source.js`. Most checks live here and run in milliseconds. Cases the backend note names (weekly repeats, leftovers, keys kept on write) and the clock change on 1 Nov get a check each. `face`'s checks include a hostile title that must come out as text.
- **`ha.js` against `tests/lib/fake_hass.js`**, a fake with Home Assistant's own shape (`callApi`, `callService`, `connection.sendMessagePromise`, `subscribeMessage`, `states`). It records what was asked and answers from given data. Helpers live in `tests/lib/`, because `run_all.sh` would run them as tests anywhere else in `tests/`.
- **One browser check**, `tests/browser/test_house_board.js`, with its page `tests/browser/house_board.html`. Playwright serves the real folder (routes for `/family_hub_house_board/*`), mounts `<house-board-card>` with the same fake `hass`, fixes the clock, and sets the time zone to America/New_York. It runs at 1200×800 (the tablet) and 390×844 (a phone) and checks only what needs a browser: the card opens settled, in its colors, and doesn't move when the calendars answer; titles render as text; the minute tick moves now and next; a tap goes to the configured address. It's a new page rather than the week card's `harness.html`, which is tied to the week card's storage keys and retires with it.
- **A size check**, `tests/test_house_board_size.js`: it fails when a file in the folder passes 500 lines or the folder passes 3,000 (about a ninth of the week card). Raising a limit means a line here saying why, so the rule holds for sessions that never read this file.
- **The sandbox, not CI**: `provision.py` adds the `/house-board` dashboard (hidden from the sidebar, as on the house) with the card's config, and `FH_COMMIT=<commit> bash tests/sandbox/sandbox.sh reset` installs the branch. It proves what no fake can: the versioned folder served by a real Home Assistant, real websocket answers, the dashboard resource. It also gives the screenshots and the blind reviewers' sessions, which stay outside the repo.
- The existing guards cover the folder too: `tests/test_house_lines_clean.js` reads everything under `custom_components/`.

## How it's served and cache-busted

Today each card file is served at a fixed address and registered with `?v=<hash of the file>`. That works for one file, but an import inside a module drops the `?v=`: `./meals.js` from `…/house-board.js?v=abc` is fetched as `…/meals.js`. Home Assistant serves a folder registered without cache headers with no `Cache-Control` at all (aiohttp's `StaticResource`), so a browser may keep a sibling file by its own guess for days and mix two versions after an update.

So the hash goes into the folder's address, and every relative import inherits it:

```python
board_dir = f"{integration_dir}/house_board"
board_hash = await hass.async_add_executor_job(_folder_content_hash, board_dir)  # names and bytes of every file, 10 hex
static_paths.append(StaticPathConfig(f"{HOUSE_BOARD_URL}/{board_hash}", board_dir, True))
_register_dashboard_resource(hass, f"{HOUSE_BOARD_URL}/{board_hash}/house-board.js", match=HOUSE_BOARD_URL + "/")
```

- `HOUSE_BOARD_URL` is `/family_hub_house_board`. With cache headers on, Home Assistant sends `max-age` of 31 days, which is safe because a new version is a new address. The tablet then opens from its cache.
- `_register_dashboard_resource` gets one optional argument, `match`: an existing resource is found by that prefix instead of its exact base path, then updated in place as today. That's about three changed lines in `__init__.py`, plus a `_folder_content_hash` beside `_file_content_hash`, with a check in `tests/test_dashboard_resources.py`.
- Modules import siblings only by relative path (`./when.js`), never with `?v=` and never by absolute path.
- The week card's serving doesn't change.
- A rare case gets a note only: between a HACS download and the restart, the old address serves the new files, so a browser with half the old files cached could mix them until the restart, which HACS asks for at once.

## Beside the week card during the switch-over

- **Two dashboards, one address each.** `/family-hub` keeps the week card and its config untouched: its per-copy settings are keyed to its own address, so they survive. `/house-board` holds one house board card in a panel view.
- **How a copy chooses:** it shows the address it opens. Neither card holds a per-copy flag.
  - The wall tablet: Fully Kiosk's Start URL. Moving it to the house board, or back, is that one setting.
  - The phones: Home Assistant's default dashboard. In this frontend it's per person: the person's own `default_panel`, else the household's, else the browser's old `defaultPanel`. So each adult switches on their own schedule, and either dashboard is an address away.
  - When and how each copy moves, and what Jenn sees first, is the map's switch-over question; this layout just keeps each move to one setting.
- **The week card is the detail view and the fallback.** Whatever the house board can't do yet, it reaches by going to the week card's address (from the card's config), the same way Home Assistant moves between dashboards (`history.pushState` and a `location-changed` event). How the face offers that is #38's call.
- **Back to the resting face on the wall:** Fully Kiosk's "Auto Reload on Idle", which reloads the Start URL after a set time with no touch, with "Skip Auto Reload if Showing the Start URL" ([Fully's docs](https://www.fully-kiosk.com/docs/en/configuration/web-auto-reload)). That gives the synthesis's "after 3 minutes untouched it drifts back" with no code. It reloads the page while nobody's looking, so the face must open settled; that's already a test above. Both setting names need checking on the tablet's Fully version.
- **The two never step on each other.** The house board:
  - never writes Family Hub's settings blob (#43: the week card drops every key it doesn't know);
  - never reads or writes the week card's `familyCalendar*` or `familyHub*` storage keys;
  - never reports to device settings, so it creates no per-copy entities;
  - uses element names starting `house-board`.

  On the house it changes nothing until the owner approves the HACS update and the new dashboard.

## The first slice

The resting face, read only, on the wall tablet. Built when #38's prototype decides its content; this is its shape, not its look.

1. **Serving:** the folder, the hash, `match`, and their Python check (above).
2. **Code:** the seven files above, each with only what the face needs.
   - `ha.js` reads columns from the card's config. Calendars use the week card's proven path: the server's copy first (`family_hub/calendar_cache/get`), then live per column, every 60 s, with complete live results sent back (`/put`). The meal plan and Us notes use Home Assistant's `todo/item/subscribe`. It also reads the forecast, the household settings keys the board needs, `theme_builder/list`, and the two switches from `hass.states`. Whether calendars move to subscriptions is the load-time question; it would change `ha.js` alone.
   - `meals.js` reads only. Writes come with meal editing.
   - Today's privacy, no less: columns marked private in the config drop out while `input_boolean.board_private` is on, and the face shows no events while Family Hub's privacy mode is on. The privacy question on the map decides the rest.
3. **Tests:** the Node checks, the fake, the browser check and the size check above. `bash tests/run_all.sh` green.
4. **Sandbox:** the `/house-board` dashboard in `provision.py`. Screenshots at 1200×800 and a blind first-time review before the owner sees it (#38's rule).
5. **Docs:** one line in the fork's CLAUDE.md pointing at the folder and this file.
6. **On the house**, each step explained to the owner first and done only after approval: HACS update and restart; create `/house-board`, hidden from the sidebar, with the same Kiosk Mode setup as `/family-hub` (B6); point Fully's Start URL at it and set the idle reload. To undo: Start URL back to `/family-hub`.

Not in it, each waiting for its own slice: writes, capture, echo and Undo, the event sheet, phone views, the preferences service, and anything from "needs you".

## Alternatives rejected

- **One file, like the week card.** Its serving is simplest, but it rebuilds the 26,000-line problem, and its tests need source extraction.
- **Several small cards composed in the dashboard's config** (a face card, a meals card, a vertical stack). Layout and privacy would move into dashboard config that no test sees. The Hide work calendars switch already needs two conditional copies of the week card; this would multiply that.
- **The house board hosting the week card inside itself** as its detail view. That ties the two together: the week card sizes itself to the window, has its own popups and + button, and keys its storage by address, so every week card quirk would become a house board bug.
- **A per-copy flag that tells one card to show the other** (browser storage or a device settings entity). It needs a change inside the week card and a setting nobody can see. Device settings is also what #43 retires.
- **One dashboard with cards shown per user.** It works per person only, not per copy, and it changes the week card's dashboard.
- **A view inside `/family-hub`.** It changes the week card's dashboard config for nothing: the drift back is Fully's either way.
- **`?v=` on the entry file only, or `?v=` passed to every import by hand.** The first mixes versions (above). The second turns every import into a computed one.

## What would change the call

- **Two redraw bugs** (lost typing, lost focus or flicker) in the capture or event sheets → vendor Lit as one file in the folder, still with no build step, and move one surface at a time.
- **The folder reaches 3,000 lines** → stop and question scope with the owner before splitting further.
- **Home Assistant stops letting the integration register dashboard resources** (it uses internals and already fails quietly) → a resource added by hand would need a new address every version. Then also serve the folder at a fixed `/family_hub_house_board/current/` and add that by hand once, accepting slower updates.
- **Fully's idle reload is missing, slow or visible from across the room** → the house board takes over the week card's role as the detail view sooner, or returns to the face itself from a view in its own dashboard.
- **Type mix-ups become the common bug** → add `// @ts-check` with JSDoc types, checked by `tsc --noEmit` in CI only; files are still served as written.

## Found in passing

- **#39 and #43 disagree about where an iCloud edit goes.** #39 put the iCloud write path inside Family Hub's `update_event` and `delete_event` commands. #43 decided the house board doesn't call those wrappers, because Family Hub's own permissions gate them and are off for Jenn and the wall's user by default. The layout's call: when wave 4 builds the iCloud write path, it gets its own house command, gated by Home Assistant's permission on the calendar like `calendar/event/update`, and the house board calls it for CalDAV calendars only. #39's design (find by time, edit with `icalendar`, save with `If-Match`) is unchanged.
- **Home Assistant's default dashboard is now per person**, not per browser as older guides say (the frontend reads the user's own setting first). A person can set only their own (the backend note's finding about `frontend/*_user_data`), so Jenn's phone moves from Jenn's own sign-in, or through the household's default.
