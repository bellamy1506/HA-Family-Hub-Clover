# A custom card on a panel dashboard: icons, coming back, height, navigation and the default dashboard

Research note, 2026-11-01, for [#110](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/110) (map [#107](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/107)). Question: how does one custom card, `house-board-card`, behave alone in a panel view on its own `/house-board` dashboard in Home Assistant 2026.10, in the wall tablet's Fully browser and in the iPhone app? It feeds the card ticket [#122](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/122).

**Versions.** Home Assistant core `2026.10.4` pins frontend `20260930.5` ([`homeassistant/package_constraints.txt:43`](https://github.com/home-assistant/core/blob/2026.10.4/homeassistant/package_constraints.txt#L43)). That frontend pins `home-assistant-js-websocket` 9.7.1 and `@mdi/js` 7.4.47 (`package.json:84`, `:109`). iOS app `release/2026.10.3/2026.3322`. Kiosk Mode `v9.0.2`, NemesisRE's HACS plugin. The records don't name which Kiosk Mode synthesis B6 means; this one is the maintained one **[inference]**.

**Method.** Source was read at those tags (shallow clones outside the repo); file and line below are at the tag:
- FE = [home-assistant/frontend@20260930.5](https://github.com/home-assistant/frontend/tree/20260930.5) (commit `901c0a6`)
- WS = [home-assistant-js-websocket@9.7.1](https://github.com/home-assistant/home-assistant-js-websocket/tree/9.7.1)
- iOS = [home-assistant/iOS@release/2026.10.3/2026.3322](https://github.com/home-assistant/iOS/tree/release/2026.10.3/2026.3322)
- core = [home-assistant/core@2026.10.4](https://github.com/home-assistant/core/tree/2026.10.4)
- KM = [NemesisRE/kiosk-mode@v9.0.2](https://github.com/NemesisRE/kiosk-mode/tree/v9.0.2)

Docs and license pages were found with WebSearch and opened with WebFetch.

Then each answer was checked in the sandbox (Home Assistant 2026.10.4, frontend 20260930.5, made-up data, `127.0.0.1` only), in Chromium through Playwright, signed in as the non-admin Wall user:
- A throwaway probe card (not committed) sat alone in a panel view on three test dashboards and logged every lifecycle call and event with a timestamp.
- It measured its own box at 1200×800 and 390×844.
- It drew one `<ha-icon>`.
- It tried each way of navigating.

Lines marked **(measured)** come from that run. **[inference]** marks my judgement. **(unverified)** marks what neither source nor run settled. Nothing was run on the tablet or an iPhone, and no Home Assistant connector was used.

## Answer

1. **Icons.** On any dashboard, `<ha-icon>` is already defined before the card's own file even runs. The dashboard's root imports it, and Home Assistant loads card files only after that (measured: defined at module load, at `setConfig`, at first render). Its picture arrives a moment later, from the browser's icon cache or a fetch, so for one frame or more the icon is blank. No wait is needed. `loadCardHelpers` has nothing to do with it. Home Assistant's docs say `ha-*` elements are "not a promised API". Material Design Icons paths are Apache-2.0, which is compatible with this repo's GPL-3.0: keep the license and a notice. **Recommendation:** copy the board's few icon paths inline. They draw in the first paint and work in the Node and browser tests, which have no Home Assistant.
2. **Shown again.** **Home Assistant rebuilds the card on every reconnect.** It refetches the dashboard config and creates a new card instance (new constructor, `setConfig`, `hass`, `connectedCallback`), and the old one gets `disconnectedCallback` (measured).
   - **iPhone app away more than about 30 s:** the app tells the frontend to reconnect, so it rebuilds.
   - **Away less than that:** only `visibilitychange`; iOS fires it on a best-effort basis.
   - **Hidden 5 minutes (browser or Android):** the panel is detached (`disconnectedCallback`) and the socket closed. On return the old card is reattached (`connectedCallback`) *before* the socket is back, and a fetch then fails with "connection lost". About 15 ms after `ready` it is replaced by a new card.
   - **`hass`:** arrives on every state change anywhere, so it says nothing about returning.
   - **`ready`:** fires once per reconnect, but on the old instance that is about to be thrown away.

   **The one start per return is a new instance's `connectedCallback` while `hass.connection.connected` is true.** Start fetching there; stop in `disconnectedCallback`. On `visibilitychange` to visible, only recompute "today". A fallback on `ready` (wait 2 s, then start only if still on the page and not started) keeps it at once even if the rebuild ever stops.
3. **Height.** The panel view already has a definite height: the viewport minus the top bar, the top safe area and the bottom safe area. That is 744 px on a 1200×800 tablet with the top bar, 800 with Kiosk Mode's header hidden, 788 on a 390×844 phone, and 707 with iPhone insets of 47/34 (measured). A card fills it with `:host { display: block; height: 100%; }`, and its insides with `height: 100%` or a grid. **Don't size by `100vh` or `--header-height`:** with Kiosk Mode's header hidden that leaves a 56 px gap, because Kiosk Mode doesn't change `--header-height` (measured). In normal flow the safe areas are already handled.
4. **Navigation.** `history.pushState` plus `location-changed` still works, but only if the event is `composed` (from a shadow root) or dispatched on `window`. A non-composed one changes the address bar and leaves the old dashboard showing (measured). It also skips what Home Assistant's own `navigate()` does: closing an open dialog, the unsaved-changes guard, and the `from` mark the back arrow uses. Two ways go through `navigate()` (measured):
   - a bubbling, composed `hass-action` event with a `navigate` action;
   - a plain same-origin `<a href>` inside the card's shadow root.

   **Recommendation:** `hass-action`, as borrow §15 already planned.
5. **Household default.** Settings > Dashboards > Set as default sends `frontend/set_system_data` with `key: "core"` and the whole `core` object with `default_panel` changed. The value replaces the object, so a session reads it with `frontend/get_system_data` first and merges. Admin only; it refuses admin-only dashboards.
   - **A person's own Profile > Dashboard choice wins.** Measured: with the household default set to a test dashboard, Wall and Owner (both on Auto) opened it, and Jenn (set to `family-hub`) opened `family-hub`.
   - Old per-browser choices only count when neither is set.

## 0. Already decided (the floor this builds on)

- One card, `custom:house-board-card`, alone in a panel view on `/house-board`; plain ES modules, no library; served from a hashed folder ([house-board-layout.md](https://github.com/bellamy1506/HA-Family-Hub-Clover/blob/research/board-layout/docs/board-next/house-board-layout.md), #44). The card owns "starting and stopping the data, a tick once a minute ... going to another dashboard".
- Going to the week card: through Home Assistant's own navigation, about 6 lines, slice 1 ([borrow §15](calendar-card-pro/borrow.md#15-navigation-through-home-assistant-rule-slice-1-house-boardjs-about-6-lines)).
- The board must refresh itself when shown again; inside the app the frontend already pads for the notch and home bar; `position: fixed` elements add `var(--safe-area-inset-*)` themselves ([iphone-app.md](https://github.com/bellamy1506/HA-Family-Hub-Clover/blob/research/iphone-app/docs/research/iphone-app.md) 1.5, 1.7; [#67](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/67#issuecomment-6537438807)).
- Switch-over 1b sets the house board as everyone's default in Settings > Dashboards ([switch-over.md](../board-next/switch-over.md#1b-house-board-as-everyones-default-dashboard-agent-then-will-and-jenn-each-close-the-app-once)). The wall opens Fully's Start URL and reloads it after 5 minutes untouched (1c).

## 1. Findings by question

### 1.1 Icons

- **Who defines `ha-icon`.** `ha-icon.ts:50` registers it.
  - The dashboard root imports it statically: `hui-root.ts:45` (`import "../../components/ha-icon"`).
  - `ha-panel-lovelace.ts:37` imports `./hui-root` statically. Static imports run before the importing module, so `ha-icon` is defined as soon as any dashboard panel's code has loaded, whatever cards it holds.
  - The sidebar imports it too (`ha-sidebar.ts:40`), but only by a dynamic import in `home-assistant-main.ts:87`, so the sidebar is not the guarantee.
- **When a card's file runs.** Dashboard resources (the integration registers the board's file as one) are loaded by the dashboard panel itself, after its own imports: `ha-panel-lovelace.ts:312-316` calls `loadLovelaceResources` (`load-resources.ts`). So a card's module can't run before `ha-icon` exists. **(measured)** At module load, constructor, `setConfig`, first `hass` and first render, `customElements.get("ha-icon")` was defined, and the `<ha-icon>` written by `innerHTML` was already upgraded. `typeof window.loadCardHelpers` was `"function"`.
- **The picture comes later.** Setting `icon` starts `_loadIcon` (`ha-icon.ts:62-70`). It looks in memory, then the browser's icon database (`getIcon`, `:148`), then fetches `/static/mdi/<chunk>.json` (`:169`). Until then it draws an empty `ha-svg-icon`. **(measured)** 6 to 10 ms after the first render on the local sandbox. **[inference]** On the tablet's first open after a cache clear it's a network fetch, so a blank icon can show for a frame or more. That's the "moves after it opens" the layout's browser check forbids.
- **What the waits do.**
  - `customElements.whenDefined("ha-icon")` would resolve at once on a dashboard. It never resolves in the house's own browser test page or in Node, which load no Home Assistant frontend, so the first draw must never wait on it.
  - `window.loadCardHelpers` is defined on the same module line as the dashboard (`ha-panel-lovelace.ts:46`) and only lazy-loads card-making helpers (`custom-card-helpers`); it doesn't define `ha-icon`.
  - Home Assistant's card docs: "`loadCardHelpers()` is available once the dashboard panel is loaded", and of `ha-card`, "Like every `ha-*` element, it is not a promised API" ([Custom card docs](https://contributors.home-assistant.io/frontend/custom-ui/card/), fetched 2026-11-01; the old developers.home-assistant.io address redirects there).
- **License for copying paths.** The frontend uses `@mdi/js` 7.4.47, `"license": "Apache-2.0"`. Its LICENSE (the "Pictogrammers Free License") says "Icons: Apache 2.0 ... The MIT license applies to all non-font and non-icon files" ([unpkg @mdi/js@7.4.47/LICENSE](https://unpkg.com/@mdi/js@7.4.47/LICENSE)). Pictogrammers' license page adds "Icons in the 'Brand / Logos' category are not covered by this license" ([pictogrammers.com](https://pictogrammers.com/docs/general/license/)). The package ships no NOTICE file (its file list has LICENSE, README, `mdi.js`, typings).
  - Apache 2.0 §4 asks a redistributor to give "a copy of this License", mark "any modified files", and "retain ... all copyright, patent, trademark, and attribution notices" ([apache.org](https://www.apache.org/licenses/LICENSE-2.0)).
  - The FSF lists Apache 2.0 as "compatible with version 3 of the GNU GPL" ([gnu.org](https://www.gnu.org/licenses/license-list.html)).
  - **[inference]** For a few paths in this GPL-3.0 repo: name the source, version, icon names and license in a comment beside them, and keep one copy of the Apache 2.0 text in the repo. Don't take brand icons.

### 1.2 What a card gets when it's shown again

What each piece of the frontend does:
- **Every state change** in the house produces a new `hass`, passed down to the card (`hui-view.ts:238-240`; `hui-card.ts:201-205`). The docs: "`hass` changes on every state change in the home". It is no return signal.
- **The connection's events.** `Connection` emits `ready`, `disconnected` and `reconnect-error` (WS `lib/connection.ts:31`).
  - `ready` fires from `_setSocket` (`:162`), which the constructor also calls (`:122`). The frontend adds its listeners after that (`connection-mixin.ts:259-260`), so from a card's view **`ready` means "reconnected"**, once per new socket.
  - Subscriptions made with `subscribeMessage` are re-sent on the new socket (`:138-151`).
  - Commands in flight are rejected with "Connection lost" (`:449-455`). A `sendMessagePromise` while there's no socket and no queue throws `ERR_CONNECTION_LOST` (`:252-255`).
- **`hass.connected`** flips to `false` on disconnect and back to `true` on reconnect (`connection-mixin.ts:414`, `:395`). The frontend then refetches `get_config` and broadcasts a window `connection-status` event, `"connected"` (`:396-409`).
- **The rebuild.** The dashboard panel listens for that broadcast whenever it's on the page (`ha-panel-lovelace.ts:101`) and answers with `_fetchConfig(false)`: "reload lovelace on reconnect so we are sure we have the latest config" (`:235-240`). That makes a new `lovelace` object (`:394`), and `hui-view` rebuilds its cards whenever the view's config object differs (`hui-view.ts:186-197`). **(measured)** After `connection.reconnect(true)` the probe logged, in order:
  1. `disconnected`, then `hass.connected` false;
  2. `ready` (+8 ms), then `hass.connected` true;
  3. (+13 ms) a **new instance's** constructor, `setConfig`, first `hass`, first render;
  4. the old instance's `disconnectedCallback`;
  5. the new one's `connectedCallback`.
- **Hidden for 5 minutes.** Both the app shell and the panel resolver listen for `visibilitychange`, `resume` and (once per hide) window `focus` (`home-assistant.ts:239-245`, `:417`; `partial-panel-resolver.ts:103-108`, `:216`).
  - After 300,000 ms still hidden, the resolver removes the panel from the page (`partial-panel-resolver.ts:187-215`; not for iframe or app panels). The shell closes the socket with `window.stop()` and `connection.suspend()` (`home-assistant.ts:397-426`) and holds reconnects until visible (`suspendReconnectUntil`, `:401`).
  - On visible, the panel is put back in the same tick (`partial-panel-resolver.ts:219-232`) and the reconnect is released (`home-assistant.ts:428-439`).
  - Both are skipped when the person turned off Profile > "Suspend background connections" ("close the server connection after 5 minutes"; `partial-panel-resolver.ts:152`, `home-assistant.ts:406`), a per-browser choice.
  - **(measured)**, with the 300,000 ms timers shortened to 2 s and `document.hidden` faked:
    1. `visibilitychange` hidden;
    2. 2 s later, `disconnectedCallback`, then `disconnected`;
    3. on visible, the **old instance's `connectedCallback` (second time)** came *before* `visibilitychange` reached the card's own listener and before the socket was back. A `sendMessagePromise` made there **failed with code 3** (connection lost);
    4. `ready` 8 to 9 ms later;
    5. about 15 ms after that, the rebuild as above: a new instance that could fetch.
  - Hidden 3 s only: just `visibilitychange` hidden and visible; no lifecycle call, no reconnect.
- **The iPhone app.**
  - When the app goes to the background it starts a 5 s repeating timer. On the first tick after returning, if the tick is more than 30 s overdue (the app was frozen), it sends the frontend `restart` once and stops the timer (iOS `WebViewController+URLLoading.swift:23-28`, `:399-427`).
  - The frontend answers `restart` with `connection.reconnect(true)` (FE `external_app_entrypoint.ts:60-61`), the call the probe made. **[inference]** So every return after more than about 35 s rebuilds the card once. A shorter absence gives only `visibilitychange` and `focus`.
  - iOS freezes the page's timers in the background, so the 5-minute detach rarely happens there **[inference]**; the frontend also checks `document.hidden` again when a late timer fires (`home-assistant.ts:410-414`).
  - If iOS ended the web process, or the load failed, the app reloads the page (`WebViewController+EmptyState.swift:147-150`): a fresh start.
- **`visibilitychange` on iOS is best-effort.** WebKit bug 207256 (open): the event "does not get always fired on background but it may on foreground"; a WebKit engineer: "we may or may not have time to fire the visibilitychange event before we get suspended ... The event normally gets fired when the process resumes" ([bugs.webkit.org](https://bugs.webkit.org/show_bug.cgi?id=207256), fetched 2026-11-01). The frontend backs it up with window `focus` for the same reason.
- **Leaving and coming back to the dashboard.** Only `lovelace`, `home` and `config` panels are kept when you leave them (`partial-panel-resolver.ts:20`, `:169`). **(measured)** Going to another dashboard made a new panel, so the house board starts fresh each time someone comes back from the week card.
- **The wall.** (unverified) Whether Fully reports the page hidden when its screen goes off at night wasn't checked. If it does for 5 minutes, the wall takes the detach path above. Either way 1c's idle reload starts the page over.

So, per return, for the rule "start in `connectedCallback` when `hass.connection.connected`, stop in `disconnectedCallback`":

| Return | What the card gets | Starts |
|---|---|---|
| iPhone app, away > ~35 s | old: `hass.connected` false, then true; `ready`; `disconnectedCallback`. New: constructor, `setConfig`, `hass`, `connectedCallback` | 1 (new instance) |
| iPhone app, away < ~30 s | `visibilitychange` and `focus` only (best-effort) | 0 (socket and subscriptions intact) |
| Hidden ≥ 5 min (browser, Android) | old: `disconnectedCallback`, then `connectedCallback` with no socket; `ready`; then replaced | 1 (new instance; the old one's start is skipped because the socket is down) |
| Reconnect while visible (Wi-Fi, Home Assistant restart) | as the first row | 1 |
| Back from another dashboard, or a reload | a new panel and card | 1 |

A `ready` listener on the old instance would add a second fetch in rows 1, 3 and 4, about 15 ms before that instance is thrown away. **[inference]** The rebuild is Home Assistant's behavior, not a promise. A fallback that keeps the count at one: on `ready`, wait 2 s, then start only if still on the page (`isConnected`) and not yet started. After a rebuild the old instance is gone by then. If Home Assistant ever stops rebuilding, the board still restarts 2 s late.

### 1.3 Height

- The layout, outside in:
  - **The view container** (`hui-root.ts:1538-1565`) is a flex box at least `100vh` tall, `box-sizing: border-box`. It's padded at the top by `var(--header-height) + var(--safe-area-inset-top)`, at the right by the right inset, at the bottom by the bottom inset, and at the left by the left inset only when narrow (`:1556-1559`).
  - **Its children** fill it (`flex: 1 1 100%`, column).
  - **The top bar** is `position: fixed` and padded by the top inset (`:1339-1354`).
  - **The panel view** is `display: block; height: 100%` (`hui-panel-view.ts:127-137`). It sets the card's `layout` to `"panel"` (`:109`, `hui-card.ts:226-230`) and clears `ha-card`'s border, radius and shadow (`:139-143`).
  - **`hui-card`** draws into itself with no box of its own (`hui-card.ts:46-48`; computed `display: inline`, measured). So the card's own `height: 100%` resolves against the panel view.
- **(measured)**, card host `display: block; height: 100%`:

| Screen | Top bar | Insets (top/bottom) | Card top | Card height | Page scrolls |
|---|---|---|---|---|---|
| 1200×800, sidebar docked (card 944 wide) | shown, 56 | 0/0 | 56 | 744 | no |
| 1200×800, Kiosk Mode header rules applied | hidden | 0/0 | 0 | **800** | no |
| 390×844 phone | shown, 56 | 0/0 | 56 | 788 | no |
| 390×844 phone | shown, 103 with inset | 47/34 | 103 | 707 (ends 34 above the bottom) | no |

- `calc(100vh - var(--header-height) - insets)` gave the same numbers with the top bar shown. With Kiosk Mode's header hidden it gave **744 instead of 800**. Kiosk Mode v9.0.2 hides `.header` and sets the view's `padding-top` to `calc(var(--kiosk-header-height) + env(safe-area-inset-top))` with `--kiosk-header-height: 0px`, but leaves `--header-height` alone (KM `src/styles/index.ts:5-11`). **[inference]** Any arithmetic on `--header-height` breaks under Kiosk Mode; `height: 100%` follows it.
- The iPhone insets were simulated by setting `--safe-area-inset-top/bottom` on the page, which Chromium leaves at 0. The frontend defines them from `env()` (iphone-app.md 1.5). **[inference]** Inside the app the page has no browser bars, so `100vh` is the full screen and the numbers carry over.
- **What the card needs:**
  - `:host { display: block; height: 100%; box-sizing: border-box; }`, with its regions as a grid or flex column of `height: 100%`.
  - `overflow: hidden` on the card, or a scrolling region inside it, so content that doesn't fit doesn't grow the page.
  - Nothing for safe areas in normal flow. A sheet or floating button that is `position: fixed` adds `var(--safe-area-inset-*)` itself, as the panel view's own floating button does (`hui-panel-view.ts:145-154`).
- **[inference]** The width depends on the sidebar, not the card: 944 with the docked sidebar at 1200 wide (256 px; `home-assistant-main.ts:165-172`), 1200 with Kiosk Mode's sidebar hidden, full width below 870 px (`:47`). The board's layout should follow its own width, which the layout already plans ("what differs follows the card's width").

### 1.4 Going to another dashboard

- **What Home Assistant listens for.**
  - The app shell reroutes on a window `location-changed` event by reading the current path (`home-assistant.ts:166-181`), and on `popstate` (`:184-186`).
  - It turns any plain left click on a same-origin `<a href>` into `navigate(href)`, finding the anchor through `composedPath()`, so through shadow roots (`home-assistant.ts:195-200`; `is-navigation-click.ts:13-16`, `:38-40`).
  - It runs `hass-action` events through `handleAction` (`action-mixin.ts:19`), whose `navigate` case calls `navigate(navigation_path, { replace })` (`handle-action.ts:121-125`).
- **What `navigate()` adds** over a bare `pushState`:
  - It asks open dialogs to close and stops if one refuses (`navigate.ts:62-82`, `:195-198`).
  - It lets a page with unsaved changes veto the move (`:84-105`, `:235-251`).
  - It stamps the new entry with `from: <previous path>` (`:220-224`). `canGoBack()` and `goBack()` read that mark (`:259-284`), so an entry without it sends a back arrow to its fallback.
  - Then it fires `location-changed` on the main window (`:228-230`).
- **(measured)**, from inside the probe's shadow root, `/probe-board/p` to `/probe-none/p`:

| Way | Address bar | Dashboard shown | `history.state` |
|---|---|---|---|
| `hass-action`, `{ config: { tap_action: { action: "navigate", navigation_path } }, action: "tap" }`, `bubbles` + `composed` | moved | moved | `{ from: "/probe-board/p" }` |
| `history.pushState` + `location-changed`, `bubbles` + `composed` | moved | moved | `null` |
| `history.pushState` + `location-changed`, `bubbles` only | moved | **stayed on the old one** | `null` |
| plain `<a href="/family-hub/family-hub">` clicked | moved | moved (the week card drew) | `{ from: "/probe-board/p" }` |

- None of these is in Home Assistant's card docs ("hass-action", "location-changed" and "navigate" aren't mentioned; [Custom card docs](https://contributors.home-assistant.io/frontend/custom-ui/card/)). Home Assistant's own button card fires `hass-action` (`hui-button-card.ts:357`; the frontend's `fireEvent` makes events bubbling and composed by default, `fire_event.ts:78-80`), as Calendar Card Pro does (borrow §15).

### 1.5 The household default dashboard

- **Set as default** (Settings > Dashboards, row menu) runs `_handleSetAsDefault` (`ha-config-lovelace-dashboards.ts:543-584`).
  - It refuses a dashboard marked admin only (`:548-558`): "This dashboard is set to admin-only. Disable this limitation before setting it as default."
  - It asks for confirmation ("This dashboard will be shown to all users when opening Home Assistant." / "Users who have chosen a specific dashboard in their profile will not be affected. They must set it back to "Auto (use system settings)" to use this dashboard."; `en.json:4891-4892`).
  - It then calls `saveFrontendSystemData(connection, "core", { ...hass.systemData, default_panel: url_path })` (`:580-583`).
- **The command.** That helper sends `frontend/set_system_data` with `key` and `value` (`frontend.ts:135-146`). The `core` value holds `default_panel`, `onboarded_version`, `onboarded_date` and `surveys` (`frontend.ts:25-32`); it is written whole, as the frontend notes ("overwrites the whole 'core' object, so spread the existing data", `onboarding-survey.ts:40-41`). On the server:
  - `frontend/set_system_data` is `@websocket_api.require_admin` (core `frontend/storage.py:265-286`, `:274`);
  - `frontend/get_system_data` needs only `key` (`:288-303`);
  - the value is stored in `.storage/frontend.system_data` (`:105-135`).
- **The session's change**, as an admin user:
  1. `{"type": "frontend/get_system_data", "key": "core"}`
  2. `{"type": "frontend/set_system_data", "key": "core", "value": {<what step 1 returned>, "default_panel": "house-board"}}`

  To undo: the same with the old value, or without `default_panel`.
- **Precedence** (`panel.ts:36-47`): `hass.userData.default_panel` (the person's Profile > Dashboard, saved with `frontend/set_user_data`, `ha-pick-dashboard-row.ts:122-135`), then `hass.systemData.default_panel`, then the browser's old `localStorage.defaultPanel`, then Home. "Auto (use system settings)" stores no `default_panel` for that person (`ha-pick-dashboard-row.ts:20`, `:127`). So **a person's own choice beats the household default**, and an old per-browser choice only counts when neither is set. The second point narrows #67's note that an old per-copy choice "can still win while the profile says 'Auto'": not once 1b sets a household default.
- **When it applies.** The default is used when the address names no panel, or one that doesn't exist (`partial-panel-resolver.ts:176-179`). Open pages get the new value live (`connection-mixin.ts:361-362`), but they aren't moved. **[inference]** The iPhone app's "Remember Last Page" can still reopen the last page; hence 1b's close the app once. Fully opens its Start URL, which names `/house-board`, so the wall is unaffected.
- **(measured)**:
  - Owner set the household default to a test dashboard; it read back as `{"default_panel": "probe-board"}`.
  - The same call from Jenn's (non-admin) sign-in was refused, `unauthorized`.
  - Jenn's own `frontend/set_user_data` to `family-hub` worked.
  - Opening `/` on a phone-sized page: Wall and Owner (Auto) landed on `/probe-board/p`, Jenn on `/family-hub/family-hub`.

## 2. Implications for the house board card (#122)

1. **Icons: inline SVG paths, copied from MDI 7.4.47.** (technical call; the owner can veto) They draw in the first paint, show the same in Node, the browser check and the sandbox, and rely on nothing in Home Assistant. Keep a comment with the icon names, version and license, and one copy of the Apache 2.0 text. If the board ever wants `<ha-icon>` (for a user-picked icon), it's safe on a dashboard with no wait; just don't block the first draw on `whenDefined`.
2. **Start, stop and refresh.** (technical call; the owner can veto)
   - `connectedCallback`: if `hass` is set and `hass.connection.connected`, draw the last snapshot, then fetch and subscribe and start the minute tick.
   - `disconnectedCallback`: unsubscribe, clear the tick, drop listeners. A thrown-away instance must leave nothing running.
   - `ready` (listened to only while waiting): after 2 s, start if `isConnected` and not started.
   - `visibilitychange` to visible: recompute "today" and redraw; no refetch.

   The browser check should cover a rebuild and a detach with a dead socket (the probe's way: fake `document.hidden`, shorten the 5-minute timer, then call `connection.reconnect(true)`).
3. **Card CSS:** `:host { display: block; height: 100%; box-sizing: border-box; overflow: hidden; }`, regions by grid. No `100vh`, no `--header-height`. Fixed sheets add safe-area insets. (technical call; the owner can veto)
4. **Navigation:** fire `hass-action` with `navigate`, `bubbles: true, composed: true`, from inside the card; test that the event leaves the shadow root with that detail (borrow §15's test). A plain `<a href>` is the no-code fallback. (technical call; the owner can veto)
5. **Switch-over 1b** can be done by a session with the two commands in 1.5, as an admin, after checking that `/house-board` isn't admin only. Each adult's Profile > Dashboard must be Auto for it to reach them. An explained Home Assistant change, done only after approval.

## 3. What this says not to do

- Don't wait on `customElements.whenDefined("ha-icon")` or `loadCardHelpers` before the first draw.
- Don't refetch in a `connectedCallback` without checking `hass.connection.connected`; after a detach that call fails.
- Don't keep state that matters only in the card instance: a reconnect throws the instance away. Typing in a sheet would be lost on a reconnect. **[inference]** If that bites, keep the draft in the module or in browser storage, not on the element.
- Don't treat a new `hass` as "shown again"; it comes many times a minute.
- Don't size the card from `100vh` or `--header-height`.
- Don't fire a non-composed `location-changed` from a shadow root, or `pushState` without the event: the address changes and the board doesn't.
- Don't make `/house-board` admin only; it couldn't be the default.

## Gaps

- **No real devices.** iOS behavior (the `restart` timing, `visibilitychange` on resume, real insets) is from source and a WebKit bug, not an iPhone; the tablet's Fully behavior on screen-off is unverified.
- **Chromium only.** The layout numbers were measured in Chromium; WebKit (the iPhone app) wasn't available in the container. **[inference]** The layout uses ordinary block and flex sizing that WebKit handles the same way.
- **Kiosk Mode** was simulated with its v9.0.2 header rules applied by hand, not installed; its sidebar rules weren't tried. Its `main` branch is newer than the tag.
- **Emulated hiding.** The 5-minute detach was run with shortened timers and a faked `document.hidden`, not a real background tab.
- **The 2 s `ready` fallback** is a margin, not a measured bound. On the sandbox the rebuild came about 15 ms after `ready`; over a slow link it could be later, and then the old instance would fetch once before being discarded.
