# What the Home Assistant iPhone app gives the phone board for free

Research note, 2026-10-30, for [#67](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/67): for reading and getting around (not capture), what does the Home Assistant iPhone app offer the house board? Feeds the phones prototype ([#50](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/50)) and the lists and switch-over fogs on the [map](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/37). It doesn't repeat [capture-friction.md](capture-friction.md) (Assist, Live Activities, Shortcuts actions, Reminders Sync, share sheet).

Versions: Home Assistant 2026.10 (frontend tag `20260930.5`), iOS app 2026.10.3 (2026-10-29), iOS 27. **[inference]** marks my judgement; **(unverified)** marks what no source confirmed.

**Method.** Behavior was read from source at [frontend `20260930.5`](https://github.com/home-assistant/frontend/tree/20260930.5) and [iOS `release/2026.10.3/2026.3322`](https://github.com/home-assistant/iOS/tree/release/2026.10.3/2026.3322); file paths below are relative to those. Docs and release notes were found with WebSearch and opened with WebFetch on 2026-10-30. Nothing was run on an iPhone.

## Answer

Which board a phone opens is a **per-person setting stored in Home Assistant**, the same on the home and Cloud copies (since 2025.12), though an old per-copy choice can still win while the profile says "Auto". The app's own **Open Page** action (Home Screen and Lock Screen widgets, Control Center, Action button, Shortcuts) reaches `/house-board` inside the running page, with no prompt and no reload; raw `homeassistant://navigate/` links reload the page and ask "Open URL?" first. For the shopping list the app already has a **To-do Home Screen widget** (tick off, add, open), a Lock Screen item count, and Open Page to Home Assistant's To-do page; the Watch has only Assist. Inside the app the frontend already pads dashboards for the notch and home bar, and pull to refresh is always on. What the app doesn't give is freshness: a page left for hours comes back unchanged, so the board must refresh itself when shown again. It must also keep Save buttons above the keyboard and can't rely on iOS Text Size. Haptics and a keyboard-raising focus call come free through the frontend's bridge.

## 0. Already decided

- The house board is one card on its own `/house-board` dashboard; phones open each person's default dashboard ([#44](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/44#issuecomment-6512692169)). Per-person house preferences replace per-copy settings ([#43](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/43)).
- The walkthrough found the board's shopping button a dead end, the real list buried among twelve lists, and a form whose Save a real keyboard would cover ([walkthrough](../board-next/walkthrough-2026-10-29.md)).
- A cold open on the owner's iPhone took 7.3 s at `192.168.4.58` (plain HTTP) and 6.9 s on Cloud ([J008](https://github.com/bellamy1506/House-Modeling/blob/main/records/projects/J008-family-hub.md), 2026-10-26).

## 1. Findings by question

### 1.1 Which dashboard opens

- **Precedence** (`src/data/panel.ts`): the person's choice, then the household default an admin sets, then a legacy value in that copy's browser storage, then the built-in Home dashboard.
- The person's choice (Profile > Dashboard, first item "Auto (use system settings)") is saved on the server (`frontend/set_user_data`, `src/panels/profile/ha-pick-dashboard-row.ts`), so it follows them to every copy. Admin-only dashboards aren't offered to non-admins such as Jenn.
- The household default (Settings > Dashboards > Set as default) "will be shown to all users when opening Home Assistant"; users with their own choice "will not be affected"; an admin-only dashboard can't be the default (`src/translations/en.json`). This arrived in 2025.12, which suggests a separate user for a device that needs its own dashboard ([release notes](https://www.home-assistant.io/blog/2025/12/03/release-202512/)). Sidebar order and hiding are per person too, "Synced on all devices".
- **[inference]** A person on "Auto" with no household default still gets each copy's pre-2025.12 choice, so home and Cloud can open different boards.
- **The app adds "Remember Last Page"**: a cold launch reopens the last page. It became opt-in on 2026-08-02 (iOS PR #5324), but installs that already had a server keep it on (`SettingsStore.migrateRestoreLastURLToOptInIfNeeded`). Since app 2026.9.3, force-closing the app clears the remembered page ([releases](https://github.com/home-assistant/iOS/releases)).

### 1.2 Copies: one phone, two addresses

- A server in the app has an Internal URL, "used only while this device is on your home network" (by Wi-Fi name), and an External or Cloud URL (`Localizable.strings`). Each address has its own web storage, so one phone holds two copies **[inference]**.
- When the network changes, the app reloads at the other address and, since 2026.2.1, keeps the path (`resolvedLoadURL`, `WebViewController+URLLoading.swift`). Leaving home silently swaps copies.
- Per copy in 2026.10: Home Assistant's theme, language and vibrate setting (`src/util/ha-pref-storage.ts`), the To-do page's last list, and anything a card keeps in `localStorage`.
- iOS 27 renders plain-HTTP pages "in a hardened, much slower mode"; app 2026.9.3 turns that off by default ("Apple Enhanced Web Security"). The home address is plain HTTP.

### 1.3 Getting to `/house-board`

- **Open Page** (`Extensions/Widgets/OpenPage/`) is a Home Screen widget, a Lock Screen circular widget, a Control Center control (iOS 18), and a Shortcuts and Action button action. It lists the server's panels (dashboards with a sidebar title, plus pages such as To-do lists) and moves inside the running frontend (`openPanel`): no reload, no prompt.
- **Raw links** (`homeassistant://navigate/<path>?server=<name>`, [docs](https://companion.home-assistant.io/docs/integrations/url-handler/)) from Shortcuts, Safari or NFC do a **full page load** (`open(inline:)`) after an "Open URL?" alert; "Confirm before opening URL" defaults on (`Utils.swift`). With two servers in the app, it asks which.
- **A view inside the dashboard** (say `/house-board/lists`): Open Page reaches only the root. A Custom widget tile (app 2025.3+) can Navigate to any path without reloading (`MagicItem.navigateIntent`). A long press on the app icon offers up to four "App Icon Shortcuts" from the same kind of items (whether Navigate works there: unverified).
- **A Safari Home Screen icon** is a separate web app: "by design. Home Screen apps are created as isolated entities without shared state with the browser" ([WebKit bug 181849](https://bugs.webkit.org/show_bug.cgi?id=181849), comment of 2022-02-01): a third copy, its own sign-in, no app bridge.

### 1.4 The shopping list

- **To-do widget** (iOS 17+, Home Screen only; `Extensions/Widgets/TodoList/`): one list; open items only, 2, 3 or 6 by size, with due dates; a **tick completes an item from the widget**; + opens the To-do page with the add box open (`/todo?entity_id=<list>&add_item=true`); a tap opens that list; a refresh button. It reloads when the app goes to the background (iOS PR #4350), otherwise when iOS allows **[inference]**.
- **The To-do page** (`src/panels/todo/ha-panel-todo.ts`) leaves **hidden** lists out of its picker (`getTodoLists(hass, false)`, `src/data/todo.ts`), so hiding Family Hub's internal lists shortens the twelve. Without `entity_id` it opens that copy's last list.
- **Lock Screen:** no list widget, but the Details widget shows one entity's state without admin rights (`WidgetDetailsAppIntent`), and a to-do list's state "is the number of incomplete items" ([docs](https://www.home-assistant.io/integrations/todo/)): "Shopping list 4", no names. Open Page's circular widget can open the To-do page.
- **Control Center:** Open Page and Assist. Opening a to-do entity shows only its count; the frontend has no to-do details view.
- **Apple Watch:** to-do isn't among the watch app's domains (`Shared/Domain/Domain.swift`); complications are templates refreshed about every 15 minutes and need an admin to write ([docs](https://companion.home-assistant.io/docs/apple-watch/complications/)). For lists that leaves Assist.
- **Calendar widget** (app 2026.9.0): Home Screen only, Home Assistant calendars merged, 14 days ahead, hourly; a tap opens Home Assistant's Calendar page, **not the board** (`AppConstants.calendarOpenURL`).

### 1.5 Edges and the notch

- On Home Assistant 2026.8+, the iPhone web view runs **edge to edge** because the "Frontend handles safe-area insets itself" (`AppConstants.swift`; iOS PR #5142, 2026-07-17).
- The frontend's viewport uses `viewport-fit=cover` (`src/html/_style_base.html.template`) and defines `--safe-area-inset-top/bottom/left/right` (`src/resources/theme/main.globals.ts`). The dashboard container pads itself by them (`src/panels/lovelace/hui-root.ts`), so **a card in normal flow needs nothing**. Anything `position: fixed` (a sheet, a floating +) must add the insets itself.

### 1.6 Pull to refresh

- Always on, no setting (`HomeAssistantPullToRefreshObserver.swift`): a pull from the top past 20% of the page height (64 to 148 points), with haptic ticks. It clears the web view's caches and service workers, not `localStorage`, then reloads (`WebsiteDataStoreHandler.swift`). The app also clears those caches every 3 days, after app updates and after Home Assistant updates.
- **[inference]** The dashboard scrolls the whole page, so a pull at the board's top triggers it: a free "reload with fresh code", at a cold open's cost.

### 1.7 Coming back after hours

- **The page is kept.** The app reloads only if the address changed, the page failed while away, or iOS ended the web process (`handleSceneDidActivate`, `loadActiveURLIfNeeded`). After more than 30 s away it sends the frontend `restart`, which reconnects the websocket (`scheduleReconnectBackgroundTimer`; `src/external_app/external_app_entrypoint.ts`).
- **The 5-minute refresh is gone.** App 2026.2.1 added an automatic refresh after 5 minutes away (iOS PR #4269; it reloaded only a disconnected page). The SwiftUI rewrite (iOS PR #4748, merged 2026-06-16) removed the code that read it; in 2026.10.3 the "Refresh After 5 Min Inactive" toggle is still in Settings, but nothing reads it.
- The frontend, hidden 5 minutes, closes its websocket and detaches the panel, reattaching it when shown (`src/layouts/home-assistant.ts`, `partial-panel-resolver.ts`). **[inference]** iOS freezes timers in the background, so this rarely fires; a card should survive it anyway.
- **[inference]** So a board opened at breakfast shows breakfast's "today" at dinner until its own code refreshes. Entity states return with the reconnect; data the card fetched doesn't, unless it subscribes: the websocket library resubscribes on reconnect, and 2026.10 has `calendar/event/subscribe` and `todo/item/subscribe`.

### 1.8 The keyboard

- The viewport sets no `interactive-widget`, so the keyboard "resizes-visual": only the visual viewport shrinks ([MDN, 2026-09-23](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta/name/viewport)). **[inference]** A Save fixed to the bottom goes behind the keyboard; `window.visualViewport` gives the space left.
- "Keyboard focus only follows a scripted `focus()` while the web view is first responder" (`WebViewExternalMessageHandler.swift`). Home Assistant's own sheets therefore send the app `focus_element` with an element id, which the app finds through shadow roots (`src/components/ha-bottom-sheet.ts`); the message is [documented](https://contributors.home-assistant.io/frontend/reference/external-bus/).

### 1.9 Text size

- The frontend sizes text in pixels times a theme variable (`src/resources/theme/typography.globals.ts`). **[inference]** iOS Text Size doesn't reach it. WebKit applies Dynamic Type through `font: -apple-system-body` ([WebKit, 2015](https://webkit.org/blog/3709/using-the-system-font-in-web-content/)); inside the app (unverified).
- The app's knob is **Page Zoom**, 50% to 200%, per phone (`SettingsStore.PageZoom`). **[inference]** At 150%, a 390-point iPhone gives the board about 260 CSS pixels of width.

### 1.10 What the app offers a card

- **Haptics:** any element can fire a bubbling, composed `haptic` event (`success`, `warning`, `failure`, `light`, `medium`, `heavy`, `selection`); the frontend forwards it (`external_app_entrypoint.ts`) and the app plays the iOS haptic (`handleHaptic`). Elsewhere it does nothing, or vibrates where supported.
- **Focus:** `focus_element` (1.8), reached through `hass.auth.external`, which Home Assistant's components use but cards aren't documented to (stability unverified).
- **Navigation:** the standard `navigate` card action moves within the frontend.

### 1.11 New for the capture side

On iOS 27 the app adopts Apple's App Intent schemas for Home Assistant calendars (create, update, delete events) and to-do lists (create, update, delete), plus a "Get to-do items" Shortcuts action, with a per-server choice of which calendars and lists Siri may use (iOS PR #5819, 2026-09-16; `App/Utilities/AppIntentSchemas/`). These are the "App Intents for events and calendars" capture-friction couldn't see. Whether they need Siri's Apple Intelligence mode is (unverified).

## 2. Implications for the house board

1. **The switch-over sets each person's default explicitly, then clears the remembered page.** (technical call; the owner can veto) Each adult picks House board in Profile > Dashboard on their phone, not "Auto", so no copy's leftover default wins; then force-close the app once, since Remember Last Page is likely on. Keep the dashboard open to non-admins, with a sidebar title and icon, so it can be a default and appears in Open Page. No household default is needed (the wall uses Fully's Start URL); `/family-hub` stays in the sidebar as the fallback. A Home Assistant change, explained first.
2. **Quick ways in use Open Page, never raw links.** (technical call; the owner can veto) Lock Screen, Control Center or Action button entries use Open Page on House board; a path inside it uses a Custom widget tile's Navigate. No Safari Home Screen icons.
3. **The board refreshes itself when shown.** (technical call; the owner can veto) On `visibilitychange` to visible and on reconnect: recompute "today", refetch or resubscribe, and draw the last known content first so it opens settled. Stop timers on disconnect and restart them on connect.
4. **Layout rules for the app.** (technical call; the owner can veto) Stay in normal flow; fixed or sticky elements add `var(--safe-area-inset-*)`. Test at 390 x 844 with 47/34 point insets and at 260 CSS pixels wide. Build type from one root size so a later text-size setting (settings fog) is one variable; until then Page Zoom is each phone's knob.
5. **Phone sheets keep Save above the keyboard.** (technical call; the owner can veto) Primary button at the top of the sheet or beside the field, never fixed at the bottom; lift a bottom sheet by `visualViewport` if needed. Focus the first field inside the tap handler, or send `focus_element` when `hass.auth.external` exists.
6. **Leave pull to refresh alone.** (technical call; the owner can veto) It's the phones' free reload, and it bounds stale sibling modules there to one pull or 3 days. Make reloads cheap instead (3). The wall and browsers still need #44's folder hash.
7. **One haptic for a landed change.** (technical call; the owner can veto) `success` when an add, change or undo is saved (with the echo), `selection` for a toggle, nothing else.
8. **Browser storage is a cache.** (technical call; the owner can veto) Confirms #43: a phone swaps copies with the network, so what a person sees on both comes from house preferences.
9. **The shopping list on the phones, now.** (for the owner, at the lists fog) The owner's phone can't reach the list from the board, and the house board's lists aren't designed yet.
   - **A. The app's To-do widget** for the shopping list on both Home Screens, plus hiding Family Hub's internal lists so the To-do page shows only real ones; the house board later links to the same page. Confidence 0.70.
   - **B. Wait** for the house board's own lists, from the lists fog. Confidence 0.35.
   - **C. An Open Page button only** (Lock Screen or Control Center) to the To-do page. Confidence 0.40.
   - **D. Apple Reminders Sync** (Labs), for Siri, Watch and Lock Screen. Confidence 0.15: Labs, lags when locked, and the owner declined iCloud Reminders (J006).
   - **Recommendation: A.** No code: the list at a glance on the Home Screen, items ticked off in the store without opening anything, one-tap add. Cost: a widget on each phone (about two minutes, Jenn's included) and a Home Assistant change to hide lists, explained first and reversible. It gives up a board-styled list until the lists fog decides one, and it shows only 3 or 6 open items.

## 3. What this says not to do

- Don't count on the app to refresh a stale board; its 5-minute setting does nothing in 2026.10.3.
- Don't send daily use through `homeassistant://navigate` links: a full reload and an alert each time.
- Don't use a Safari Home Screen icon: a third copy, a separate sign-in, no bridge.
- Don't make the house-board dashboard admin-only: it can't be a default, and Jenn can't pick it.
- Don't fight pull to refresh or hide the top bar on phones with CSS.
- Don't expect iOS Text Size to resize the board, or the Calendar widget to open it.
- Don't build the floor on Labs features: the native tab bar, Reminders Sync and complications carry the Labs label in 2026.10.3.

## Gaps

- **Nothing was tried on an iPhone;** keyboard, pull threshold and `-apple-system-body` can differ on a device.
- **Unrecorded about the phones:** whether the owner's app has one server with two URLs or the same Home Assistant added twice (two adds server prompts); app and iOS versions; whether Remember Last Page is on; each person's current Profile > Dashboard.
- **Hiding Family Hub's lists:** whether Family Hub's pickers or services skip hidden entities wasn't checked.
- **Subscriptions and iCloud:** how often a CalDAV calendar pushes through `calendar/event/subscribe` wasn't measured.
- **iOS 27 intents:** the Apple Intelligence requirement, and whether "Get to-do items" runs from the Watch.
- **Release notes** were read through a summarizing fetch of the releases page.
