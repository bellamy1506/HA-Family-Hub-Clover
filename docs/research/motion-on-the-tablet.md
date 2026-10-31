# Motion on the tablet: how the board moves without jitter or stutter

Research note, 2026-10-30, for [fork issue #72](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/72): what makes a Home Assistant card jitter, stutter, flash or jump on the Clover Tablet (TCL NXTPAPER 14, Fully Kiosk's Android WebView) and the iPhones, and what keeps the house board smooth. Technical side only; not repeated here: nothing moves at rest ([resting-face README](../../prototypes/resting-face/README.md)), onset draws attention ([calm-at-rest.md](calm-at-rest.md) §1.3), feedback under about 300 ms ([delight-and-discoverability.md](delight-and-discoverability.md) §1.6). The house board is seven plain ES modules, no library ([#44](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/44#issuecomment-6512692169)). **[inference]** marks my judgement; **(unverified)** what I couldn't confirm.

## Answer

The tablet is a 60 Hz panel showing 1200×800 CSS px at 2× density, and Fully draws with Android System WebView 137, 19 releases behind the tablet's own Chrome 156. Measured on it tonight, motion that only moves or fades an already-drawn layer (`transform`, `opacity`) kept 93 to 94% of frames on time and shrugged off a 150 ms burst of script. The same slide done with `bottom` lost half its frames to that burst; a four-day grid slid with `left` dropped 21% while the page's own frame clock saw nothing wrong; a sheet grown with `height` dropped 18%. Flinging a list was smoothest (98.5%), and a tap reached the next paint in 24 ms (40 ms worst). The real problem is today's week card: at rest it draws 7 to 10 frames a minute, each taking 150 to 350 ms, and it opens in three half-second frames, so any motion on it would crawl. The house board stays smooth by drawing nothing at rest but the minute and real changes, touching only what changed on a Home Assistant update, reserving every box before data lands, inheriting Home Assistant's Roboto, animating only `transform` and `opacity` for 150 to 300 ms, and passing two checks per slice: Playwright in the container, `dumpsys gfxinfo` on the tablet.

## 1. Findings by question

### 1.1 The tablet's baseline (measured 2026-10-30, 9:30 to 9:50 pm Eastern)

| What | Reading |
|---|---|
| Device | TCL `9491G`, Android 15 (SDK 35, patch 2026-01-05), MediaTek mt6789 (Helio G99), 8 cores, 8 GB |
| Display | one mode: 1600×2400 at 60.0 Hz, density 320, landscape; the page saw 1200×799 CSS px at DPR 2 |
| WebView | 137.0.7151.115, the factory copy in `/product`, never updated |
| Browsers | Chrome 156.0.8078.73, Chrome Beta 158, Fully 1.61.4-play; renderer Skia (OpenGL) |
| Motion settings | animation scales 1.0 (Remove animations off); the page read no reduced-motion preference |

PhoneArena also lists 60 Hz ([phonearena.com](https://www.phonearena.com/news/tcl-nxtpaper-14-specs-price_id162294), via search). A 60 Hz frame is 16.7 ms.

### 1.2 What each kind of motion costs (measured on the tablet)

A test page ([motion-lab.html](motion-on-the-tablet-lab/motion-lab.html), made-up content) ran in Fully while `dumpsys gfxinfo de.ozerov.fully` counted frames. "Late" is gfxinfo's count of frames that missed their display deadline. Slides are 6 open-close cycles of 280 ms; "150 ms script" blocks the main thread, standing in for a heavy render on a Home Assistant update.

| Test | Frames | Late | 90th / 99th pct (ms) |
|---|---|---|---|
| Sheet slides with `transform` | 230 | 7.0% | 31 / 34 |
| … 150 ms script as it starts | 229 | 6.6% | 30 / 36 |
| … 150 ms script mid-slide | 247 | 6.1% | 26 / 32 |
| Sheet slides with `bottom` | 215 | 7.4% | 30 / 36 |
| … 150 ms script as it starts | **113** | 10.6% | 32 / 46 |
| … 150 ms script mid-slide | **118** | **19.5%** | 27 / 42 |
| Sheet grows with `height` | 203 | **18.2%** | 42 / 57 |
| `transform` sheet with 20 px backdrop blur | 247 | 9.3% | 29 / 53 |
| Undo toast fades and rises, 200 ms | 167 | 6.6% | 25 / 28 |
| Four-day grid slides with `transform` | 255 | 6.7% | 26 / 31 |
| Four-day grid slides with `left` | 184 | **21.2%** | 23 / 32 |
| Fling a 240-row list, two swipes | 206 | 1.5% | 12 / 21 |
| Redraw a 4×12 grid 12 times | 13 | 92% | 38 / 38 |
| Change one text node 12 times | 13 | 69% | 27 / 30 |
| Lab page idle, 9 s | 2 | | |
| **Live week card at rest, 160 s** | **25** | **100%** | 300 / 450 (median 150) |
| **Live week card at rest, 62 s** | **7** | **100%** | 350 / 350 (median 150) |
| **Live week card opening, 46 s** | **3** | **100%** | 550 / 550 (median 500) |

Inside the page: redrawing the grid with `innerHTML` and layout took 15.8 ms of main thread (a whole frame), one text node 3.4 ms; a tap reached the next paint in 24 ms typically, 40 ms worst, after at most 14 ms of waiting (Event Timing).

**[inference]** What this says:
- **Compositor-only motion is the safe kind.** web.dev: "restrict animations to `opacity` and `transform`" and avoid properties that trigger layout or paint ([animations guide, 2020-10-06](https://web.dev/articles/animations-guide)); the compositor alone handles "only two properties" ([web.dev, 2015-03-20](https://web.dev/articles/stick-to-compositor-only-properties-and-manage-layer-count)). Here the `transform` slide kept its frames through a 150 ms stall; the `bottom` slide skipped about half, jumping ahead afterwards.
- **A lone late frame is invisible.** The redraw frames change nothing that moves; late frames matter only while something moves.
- **The page's frame clock can look perfect while the tablet stutters.** For the `left` slide the page counted 309 frames, none late; gfxinfo counted 184, 21% late. A container check catches script and layout jank; only the tablet catches drawing jank.
- **The week card's frames cost 10 to 30 normal frames.** Likely cause: the tablet's Liquid Glass theme puts `backdrop-filter: blur(var(--fc-glass-blur))` on every column, chip and button (card CSS), and the preset it copies sets `glass_blur=16`, `card_opacity=62` over a background image (`__init__.py`). One blurred sheet cost little here (9.3% versus 6 to 7%), so it would be many blurred surfaces over a full-screen picture **(unverified: isolating it needs a theme change)**.

### 1.3 Re-renders on Home Assistant state changes

- Home Assistant's card docs: `hass` is "Set with a new `hass` object whenever the state of Home Assistant changes. That is often. Only update what changed"; it changes "even when nothing your card shows changed" ([card docs](https://contributors.home-assistant.io/frontend/custom-ui/card/), fetched 2026-10-30).
- Home Assistant's own cards update only when `hasConfigOrEntityChanged` finds the config or the card's entity's state object changed (frontend 20260930.5, `src/panels/lovelace/common/has-changed.ts`).
- Today's week card writes about 30 CSS variables in `_applySizeVars()` on every `set hass`, redraws the grid on its 60 s poll, and reads layout in `_syncHeight` every 1.5 s. Reading layout right after writing styles forces a synchronous layout ([web.dev, 2025-05-07](https://web.dev/articles/avoid-large-complex-layouts-and-layout-thrashing)).

**[inference]** In the house board, `ha.js` compares each `hass.states[id]` the board reads with the last one and returns if none changed. Otherwise it rebuilds the face's data, compares a short signature per day column, lead line and notes block, and replaces only what differs, once, in the next animation frame. Calendar fetches take the same path.

### 1.4 The minute clock

Chrome checks chained timers only once a minute on a page hidden over 5 minutes ([Chrome blog, 2021-01-18](https://developer.chrome.com/blog/timer-throttling-in-chrome-88)); the tablet's screen is off at night. `font-variant-numeric: tabular-nums` makes every digit the same width ([MDN, 2026-09-10](https://developer.mozilla.org/en-US/docs/Web/CSS/font-variant-numeric)). **[inference]** One `setTimeout` aimed at the next whole minute and re-aimed each time (not `setInterval`, which drifts), one text node, tabular figures, and an update on `visibilitychange` when the screen wakes. A now line moves with `transform`. That's one cheap frame a minute.

### 1.5 Data arriving after event shapes; layout shift

- "Good CLS values are 0.1 or less"; shifts within 500 ms of a tap don't count; `transform` doesn't shift layout; move with `translate()`, not `top` or `left` ([web.dev, 2023-04-12](https://web.dev/articles/cls)). Reserve space with `min-height` or a placeholder and don't collapse it if nothing comes ([web.dev, 2025-02-07](https://web.dev/articles/optimize-cls)).
- Measured in the container (Chromium, CPU 4× slower): the week card harness opening Week with calendars 1.5 s late scored CLS 0 (plain) and 0.021 (Liquid Glass), so PR #14's event shapes hold, though the open had 7 to 8 long frames of up to 241 to 338 ms. A "Rain from 2 pm" line inserted above the lab grid scored 0.051; with its space held, 0. The `bottom` and `left` slides scored 2 to 4.7, since moving by layout counts as shifting.
- `content-visibility: auto` with `contain-intrinsic-size` skips off-screen drawing for long lists ([web.dev, 2025-09-23](https://web.dev/articles/content-visibility)); **[inference]** the four-day face is too small to need it.

### 1.6 Fonts

Home Assistant's frontend (20260930.5) sets `--ha-font-family-body: Roboto, Noto, sans-serif` and declares Roboto `local()` first, then its own woff2, `font-display: swap`, weights 100, 300, 400, 500, 700, 900; no 600 (`typography.globals.ts`, `roboto.ts`). The week card adds a Google Fonts stylesheet for Varela Round at load (the container check saw it load); the prototype loads Roboto from Google Fonts. Swapped-in web fonts can shift layout ([web.dev](https://web.dev/articles/optimize-cls)). **[inference]** Inheriting Home Assistant's font costs nothing on Android (system Roboto wins) and reuses Home Assistant's copy on the iPhones. Use 400, 500 and 700; a 600 asks for a face nobody declared.

### 1.7 Scrolling and swiping

The fling was the best result measured: the WebView scrolls on its compositor. `overscroll-behavior: contain` stops a list's scroll carrying into the page behind ([MDN, 2026-10-13](https://developer.mozilla.org/en-US/docs/Web/CSS/overscroll-behavior); limited availability, Safari **(unverified)**). **[inference]** Native scrolling, passive listeners, no script-driven scrolling; days change by tap, and any future drag moves with `transform` and lays out once at the end.

### 1.8 Touch response

Tap to next paint measured 24 ms, 40 ms worst, excluding the touchscreen and Android's input path (not measured). What makes taps sticky is a long animation frame, over 50 ms ([Chrome docs, 2024-10-14](https://developer.chrome.com/docs/web-platform/long-animation-frames)). **[inference]** Pressed looks come from CSS `:active`, and any render a tap starts finishes well under 50 ms.

### 1.9 Sheets and Undo

`@starting-style` and `transition-behavior: allow-discrete` let an element animate in from `display: none` without script timers (Chrome 117, [Chrome blog](https://developer.chrome.com/blog/entry-exit-animations); WebView 137 has both; Safari **(unverified)**). `will-change` is "a last resort", switched on before a change and off after ([MDN, 2026-10-07](https://developer.mozilla.org/en-US/docs/Web/CSS/will-change)). **[inference]** Build the sheet's contents first, then slide it with `transform` (script during the slide didn't stutter it; script before only delays the start). Never grow a sheet with `height`. Undo is a fixed overlay that fades and rises 8 to 12 px, so nothing moves to make room. No blur behind sheets.

### 1.10 Durations and easing

Material's tokens ([Motion.md](https://github.com/material-components/material-components-android/blob/master/docs/theming/Motion.md)): short 50 to 200 ms, medium 250 to 400 ms; standard easing `cubic-bezier(0.2, 0, 0, 1)`; decelerate for "animations that enter the screen" (`0.05, 0.7, 0.1, 1`), accelerate for those that "exit the screen" (`0.3, 0, 0.8, 0.15`). **[inference]** A 280 ms slide is 17 frames at 60 Hz. Sheet in 250 to 300 ms decelerating, out 200 ms accelerating, Undo 150 to 200 ms, nothing over 400 ms, nothing looping.

### 1.11 Reduced motion

Android's "Remove animations" and iOS's Settings > Accessibility > Motion set `prefers-reduced-motion: reduce` ([MDN, 2026-06-10](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)); WebView supports it from 74 (MDN's table, via search). **[inference]** One CSS block turns slides into short fades or nothing; logic never waits on `transitionend`, which doesn't fire without a transition.

### 1.12 The iPhones (WKWebView in the Companion app)

- **60 fps, not 120.** WebKit bug 294338 (opened 2025-06-11, NEW on 2026-09-17): WKWebView renders near 60 fps on ProMotion iPhones; Safari's 60 fps flag "only affects Safari itself"; a 2026-07-21 comment says only a private preference lifts it ([bugs.webkit.org](https://bugs.webkit.org/show_bug.cgi?id=294338)). The owner's iPhone 16 Pro gets the tablet's frame rate.
- **Low Power Mode caps animation-frame callbacks at 30 fps**, by design ([bug 215745](https://bugs.webkit.org/show_bug.cgi?id=215745)). **[inference]** CSS transitions, not script loops, carry motion.
- **Measurement.** Safari 26.2 (2025-12-12) added Event Timing ([WebKit blog](https://webkit.org/blog/17640/webkit-features-for-safari-26-2/)); layout-shift entries stay Chromium-only (MDN: `LayoutShift` limited availability). The phones rely on the rules plus a look.
- **Fonts.** iOS has no system Roboto; Home Assistant's bundled copy serves **[inference]**.

## 2. Method

**Tablet** (read-only use, owner-approved for this ticket). Fully was in front on `http://192.168.4.58/family-hub/family-hub` with the screen off (turned off 9:06 pm by the connector's account). ADB went through `androidtv.adb_command` on `media_player.clover_tablet_adb`, each command starting with a unique `echo`:
- `getprop` (`ro.product.model`, `ro.product.brand`, `ro.build.version.release`, `.sdk`, `.security_patch`, `ro.build.display.id`, `ro.board.platform`, `ro.hardware`, `ro.soc.model`, `ro.config.low_ram`); `cat /proc/meminfo | head -2`; `nproc`;
- `dumpsys display | grep -E …` (modes, refresh rate); `settings get system peak_refresh_rate`, `min_refresh_rate`; `settings get secure user_refresh_rate`;
- `dumpsys webviewupdate | grep …`; `dumpsys package <pkg> | grep -m1 versionName` (WebView, Chrome, Chrome Beta, Fully); `dumpsys package com.google.android.webview | grep -E 'versionName|lastUpdateTime|codePath='`;
- `settings get global animator_duration_scale`, `transition_animation_scale`, `window_animation_scale`; `settings get secure accessibility_display_inversion_enabled`;
- `dumpsys window | grep -m1 mCurrentFocus` before every input; `dumpsys power | grep mWakefulness` at the end;
- `dumpsys gfxinfo de.ozerov.fully [reset]` (reset prints the stats, then clears them), filtered by `grep -E 'Total frames|Janky frames:|percentile|Missed Vsync|Slow UI|Slow issue|High input'`;
- on the lab page only: `input tap 1064 752` (raw.githack's one-time "Open the page" notice), `input tap 2300 1500` (next test), `input tap 380 200` twice (test button), `input swipe 1200 1400 1200 300 150` twice.

Home Assistant: `switch.clover_tablet_screen` on at 9:33 pm and off at 9:49 pm; `fully_kiosk.load_url` three times for the lab page (this branch through raw.githack.com) and once for the board's exact address; `camera.clover_tablet_screen` seven times (viewed, deleted, not kept). The board was showing again at 9:49 (snapshot), then the screen went back off as found. Another session was using the same ADB entity; one reading returned its output and was repeated. Battery 94%, charging.

**Container.** Playwright's Chromium 153, 1200×800, DPR 2, touch, CPU 4× (one run 6×): [run-lab.js](motion-on-the-tablet-lab/run-lab.js) runs the lab tests; [frame-check.js](motion-on-the-tablet-lab/frame-check.js) measured the prototype (CLS 0, two long frames up to 181 ms at load) and the week card harness (1.5).

## 3. The repeatable check

**Container, every slice** (Chromium):

```sh
node docs/research/motion-on-the-tablet-lab/frame-check.js "harness:view=week&week=week&timeline=on&cal=1500" --throttle 4 --ms 9000
node docs/research/motion-on-the-tablet-lab/frame-check.js "http://127.0.0.1:8123/house-board" --throttle 4 --ms 12000 --tap 600,400
```

It reports CLS with the elements that moved, long animation frames, main-thread gaps over 25 ms, the slowest tap and the fonts loaded. **[inference]** Bars: CLS under 0.05 through the open (stricter than web.dev's 0.1, since "opens settled" is the house standard); no long frame over 100 ms once settled; no gap during a slide; no font from outside Home Assistant. Repeat with `page.emulateMedia({ reducedMotion: "reduce" })`.

**Tablet, before a merge to `main`** (Fully in front, not 11:20 pm to 4:20 am, each ADB call under about 5 s):
1. `dumpsys gfxinfo de.ozerov.fully reset`
2. Leave the board 2 minutes (rest), or do the one action (`input tap x y`).
3. `dumpsys gfxinfo de.ozerov.fully | grep -E 'Total frames|Janky frames:|percentile'`; add `framestats` for per-frame rows of the last 120 frames (Android's 2016 testing page, archived, via search).

**[inference]** Bars: at rest, at most 2 frames a minute (the week card draws 7 to 10); during a slide, under 10% late and a 99th percentile under 50 ms (compositor-only tests measured 6 to 7% and 28 to 36 ms).

## 4. Implications for the house board

1. **Draw nothing at rest but the minute and real changes:** at most 2 frames a minute on the tablet. (technical call; the owner can veto)
2. **On `set hass`, return unless the board's own entities changed; replace only the parts whose data changed,** in one animation frame. No timer redraws; calendar polls take the same path. (technical call; the owner can veto)
3. **Reserve every box before data lands:** fixed places for the lead line, Now, Needs you and the rain line; event shapes keep real heights; an empty slot keeps its space until the whole face redraws. (technical call; the owner can veto)
4. **Animate only `transform` and `opacity`:** sheets in 250 to 300 ms decelerating, out 200 ms accelerating; Undo 150 to 200 ms; nothing over 400 ms or looping; `will-change` only during a slide; under reduced motion, fades or nothing. (technical call; the owner can veto)
5. **Inherit Home Assistant's Roboto,** weights 400, 500 and 700, tabular figures for times, no outside fonts. (technical call; the owner can veto)
6. **Flat surfaces, no backdrop blur;** the resting-face pick is already flat. (technical call; the owner can veto)
7. **Two checks per slice:** `frame-check.js` in the container every slice (copied into `tests/` with the first slice), `dumpsys gfxinfo` on the tablet before each merge to `main`. (technical call; the owner can veto)
8. **Update the tablet's Android System WebView** from the factory 137 the next time a session may install on the tablet, then rerun the tablet check: it's the engine under every frame. (technical call; the owner can veto)
9. **Does the wall's week card keep its glass look until the house board replaces it?** The blur likely makes every frame take 150 to 550 ms, so taps on today's board feel slow; a flat theme would look different on the wall. (for the owner, at the map #37) A) keep Liquid Glass until the house board replaces the week card (0.6); B) give the tablet's copy a house theme with blur 0 and the same colors, after one tablet test confirms the blur is the cause (0.5); C) switch the tablet to a flat preset now (0.2). Recommended A: it costs nothing and the house board is the real fix; it gives up faster taps on today's board for the weeks until then.

## 5. What this says not to do

- Redraw on every `set hass`, on a timer, or by replacing the whole board's HTML.
- Animate `top`, `left`, `bottom`, `width`, `height` or `margin`, or grow a sheet to fit.
- Blur many surfaces, or put `will-change` on everything.
- Load fonts from Google or anywhere outside Home Assistant.
- Read layout on a timer or right after writing styles.
- Drive motion or scrolling from script loops, or expect 120 Hz anywhere in the house.
- Trust the page's own frame count alone.

## Gaps

- The week card's slow frames aren't pinned to the blur; that needs a theme change this ticket didn't allow.
- One run per test; spread unknown. gfxinfo counts Fully's whole window, though nothing else in Fully moved.
- The iPhones weren't measured; Jenn's iPhone model isn't recorded.
- Not measured: touch latency below the page, and how often `set hass` fires in this house.
- Why the WebView never updated is unknown; Fully's graphics acceleration setting ([Fully FAQ](https://www.fully-kiosk.com/docs/de/faq/badweb), via search) wasn't read.
- Found in passing: the lab page, which declares no color scheme, showed dark in Fully. WebView darkens pages that don't use `prefers-color-scheme` when the app allows it ([Android, 2026-10-23](https://developer.android.com/develop/ui/views/layout/webapps/dark-theme)); whether the house board's light face gets darkened wasn't checked.
- Safari support for `@starting-style` and `overscroll-behavior` wasn't read directly.
