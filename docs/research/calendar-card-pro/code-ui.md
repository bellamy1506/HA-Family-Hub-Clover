Research note, 2026-11-01, for [What does Calendar Card Pro do that the house board must match, and what can it borrow?](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/103).

# Calendar Card Pro: code structure and the display side

This report covers how Calendar Card Pro (CCP) is built and how it draws: its modules, its use of Lit, its render pipeline, layout and CSS, interaction, the visual editor, translations and `Intl`, bundle size and tests. For each piece it says whether the house board can use it under the decided constraint (one card of seven plain ES modules, no library, no build step, at most 500 lines a file and 3,000 for the folder, per [#44](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/44#issuecomment-6512692169)), and roughly how many plain lines a port would be. Fetching, caching, recurring events and weather are covered only where they touch drawing.

Code is cited as `path:line` at CCP commit `75bf292` (v5.0.0, MIT). Line estimates for ports, and anything else marked *(inferred)*, are my own judgment.

## Answer

- **CCP is a large, careful TypeScript and Lit 3 card.** It has 35,769 lines of card code, a 9,006-line visual editor in a second file, 6,079 lines of translation JSON, and 90,516 lines of tests (about 3,971 cases in 250 files). The card that every dashboard loads is 397 KB, or 111 KB gzipped. The editor is 577 KB and loads only when someone opens it. The house board's whole budget, 3,000 lines, is about a twelfth of CCP's card code. So nothing large ports, but its ideas and small pure functions do.
- **What it draws.** It has three views of one agenda: a list, side-by-side day columns, and an hour grid. It has no month view, no sticky day headers and no lanes per person. Columns use CSS grid, and a narrowing card first drops columns and then falls back to the list. Compact mode works in the list only: it caps events without saying so, and a tap expands it.
- **How it avoids redraws.** Mostly through Lit's diffing. It renders again, and groups every event again, on every Home Assistant state change. It gates only its costly measuring passes, by checking whether its own calendars' state objects changed. Its timers are the good part: a repaint at the next event start or end, one just after local midnight, and a minute tick only while a now line shows. All of them stop while the tab is hidden. Without Lit, the house board has to do that gating itself, before it draws anything.
- **Worth borrowing.** In all, about 150 to 200 plain lines and 60 to 80 lines of CSS, with CCP's MIT notice kept on any function copied as is:
  - the state-change gate;
  - wall-clock-aligned ticks with a day-rollover check;
  - hidden-tab handling;
  - `hass-action` for navigation and more-info;
  - calendar feature bits for Change and Delete;
  - DST-safe day arithmetic;
  - `Intl.RelativeTimeFormat` for countdown words, and cached `Intl` date formats;
  - HTML stripping for event details;
  - a filter that always shows it's on;
  - CSS: invisible touch-target growth, hover only on real pointers, tabular figures, a delayed dim instead of a flash, and person-color "ink" mixed toward the theme's text color;
  - a warning: CSS `light-dark()` follows the phone's OS, not Home Assistant's theme;
  - one test habit: run the date tests under New York and Sydney time zones as well as UTC.
- **Not worth porting:**
  - Lit itself, already the fallback in #44;
  - the editor;
  - the 36-language layer and Day.js;
  - the hour grid and its measuring code, about 5,000 lines;
  - the scrolling-title animation, since the resting face must not move;
  - the toolbar;
  - CCP's pointer recognizer: it exists for hold actions, which the house board doesn't have, so a delegated `click` listener does the house's job.
- **Where CCP is ahead on the display** (candidates for the gap list):
  - It names a calendar that failed to load and keeps showing that calendar's last events, so an empty day never hides a failure.
  - A filtered card always shows that it's filtered.
  - Each day's header shows that day's forecast.
  - It honors reduced motion.

  Where the house board is already ahead: "+N more" instead of silent caps, a month view, pinned day names and a following week strip on phones, sizes chosen for reading distance, and whose each event is, in words.
- **A free shortcut found on the way.** HACS writes a `.gz` beside every `.js` file it saves, whatever the repository's category ([HACS source](https://raw.githubusercontent.com/hacs/integration/main/custom_components/hacs/base.py), `async_save_file`). By CCP's account, Home Assistant then serves that `.gz` copy. So the house board's plain, unminified files likely already travel compressed, with no build step. The catch: a `.js` changed by hand on the Home Assistant box keeps being served from its old `.gz` until that copy is deleted.

## What was read, and what wasn't checked

Read:
- `src/` in full outline, and these in detail: `calendar-card-pro.ts`, `rendering/render.ts`, `column.ts`, `leaves.ts`, `presentation.ts`, `activation.ts`, `legend.ts`, and parts of `styles.ts`, `grid.ts` and `grid-title-fit.ts`;
- `interaction/`, `config/view.ts`, `translations/`, and `utils/format.ts`, `paging.ts`, `helpers.ts` and parts of `events.ts`;
- `rollup.config.mjs`, `package.json`, `vitest.config.mjs`, `tests/fixtures.ts`, `tests/stylesheet.test.ts` and `tests/family-stories.test.ts`;
- `docs/architecture.md` and the relevant sections of `AGENTS.md`;
- the docs pages on layout, actions, column view and performance. The live site matched the repo for the pages I opened ([architecture](https://calendar-card-pro.alexpfau.com/architecture), [installation](https://calendar-card-pro.alexpfau.com/guide/installation)).

Not checked:
- **Nothing of CCP was built, run or tested here** (its scripts are untrusted). Bundle sizes are the docs' own figures, which CCP's `scripts/check-bundle.mjs:288-296` checks against each build. I didn't measure them.
- **No behavior was seen in a browser or on the tablet.** Everything below is read from code and docs.
- **That Home Assistant serves a `.gz` sibling** is CCP's claim (`AGENTS.md:1091-1103`). I read the HACS code that writes the `.gz`, not the aiohttp code that serves it. I didn't look on the house's Home Assistant for `.js.gz` files beside the fork's card files.
- **That Home Assistant declares no `color-scheme`, so `light-dark()` tracks the OS,** is CCP's measurement (`src/rendering/styles.ts:2854-2870`), not mine.
- **The narrow no-break space in `Intl` times** (section 7) is from general knowledge of ICU 72 and later. I didn't test it here.
- **A static `getConfigForm` for cards** isn't documented on Home Assistant's English [custom card page](https://contributors.home-assistant.io/frontend/custom-ui/card/), so this report doesn't rely on it.

## 1. Modules and what each owns

| CCP module | Lines | Owns | For the house board | Plain lines if ported |
|---|---:|---|---|---:|
| `src/calendar-card-pro.ts` | 5,360 | The Lit element: its properties (`:324-344`), lifecycle (`:1383-1470`), the one gesture recognizer (`:3151-3330`), four timers (`:1593-1770`), the width observer (`:1484-1500`), the fitting passes run after each render (`updated()`, `:2451-2540`), toolbar, paging and filter state, and load orchestration | The patterns, not the file. Its lifecycle and timer rules map onto `house-board.js` | 60 to 100 |
| `src/config/` (`config.ts`, `constants.ts`, `types.ts`, `view.ts`) | 5,565 | Defaults, normalizing user values, deprecations, per-view option resolution, width fit with hysteresis (`view.ts:1789`, `:2298-2400`), which days stay when fewer fit (`view.ts:2418`) | No: the house board's config is a handful of keys. The hysteresis only, if the wall and phone layouts switch by width | 10 |
| `src/interaction/` (six files) | 908 | Tap and hold actions handed to Home Assistant (`actions.ts:36-98`), the hold indicator (`feedback.ts`), which calendars accept new events (`add-event.ts`), Edit and Delete rules (`event-details.ts`), a page-wide "calendar changed" broadcast (`calendar-changes.ts`), opening Home Assistant's own calendar dialogs (`ha-calendar-dialogs.ts`) | `hass-action` and `hass-more-info`, and the feature bits: yes. The dialog borrowing: no (it calls private methods of `ha-full-calendar`, and the house board has its own sheet) | 15 to 20 |
| `src/rendering/render.ts` | 773 | The card shell (`renderMainCardStructure`, `:98-228`), the failed-calendar notice (`:231`), the list view (`renderDay`, `:483`; `renderGroupedEvents`, `:589`) | The shell's ideas only | 0 |
| `src/rendering/column.ts` | 394 | Day columns side by side: the CSS grid (`:358-393`), per-column header, separators | The grid recipe, yes: the resting face's four day columns | about 10 CSS |
| `src/rendering/grid.ts`, `grid-accessibility.ts` | 1,878 | The hour grid: time axis, overlap lanes, all-day banners, now line, `+N` blocks | No: the house board has no hour grid | 0 |
| `src/rendering/leaves.ts`, `presentation.ts`, `accent-text.ts`, `activation.ts` | 1,764 | Pieces shared by all views: date block, event body, weather badges, today indicator, accent bar; a per-event model (past, now, colors); marking events as tap targets | The past and now rules are a few lines and match decisions already made. The rest is CCP's look | 15 |
| `src/rendering/toolbar.ts`, `legend.ts`, `view-pictograms.ts` | 1,663 | Header toolbar (add, view switch, reset, refresh, month heading, date arrows), the calendar filter (chips, or a button with a menu) | The filter's "always shows it's on" behavior, yes. The toolbar, no: the wall has its rail and the phones their tabs | 25 plus 15 CSS |
| `src/rendering/styles.ts` | 5,372 | All card CSS in one Lit `css` template. About 65% of it was comments, which the build strips (`rollup.config.mjs:24-104`) | Chosen techniques (section 4) | 60 to 80 CSS |
| `src/rendering/editor/` (27 files) | 9,006, plus 435 KB of JSON | The visual editor, built on Home Assistant's `ha-form`, its own bundle | No | 0 |
| `src/translations/` | 375, plus 36 language files | Language choice, a flat string table, Day.js relative time with 36 locales | No layer. A few `Intl` calls instead (section 7) | 10 |
| `src/utils/events.ts` | 3,003 | Fetching, the cache, grouping by day, splitting multi-day events, the next boundary (`:2451`) | The data side is for the data report. The display-relevant boundary function is covered in section 3 | 0 to 25 |
| `src/utils/format.ts`, `helpers.ts`, `paging.ts` | 2,307 | Time and date text, weekends by country, week numbers, colors, `Intl` caches | A few small helpers (section 7) | 20 |
| `src/utils/grid*.ts`, `title-*.ts` | 3,673 | Hour-grid geometry and fitting measured in the browser; scrolling long titles | No | 0 |
| `src/utils/weather*.ts`, `entity-*.ts`, `person-pictures.ts`, `templates.ts`, `view-choice.ts`, `start-date.ts`, `text-replace.ts`, `event-age.ts`, `logger.ts`, `editor-url.ts` | 2,964 | Weather, colors from the entity registry, templated titles, a per-device memory of choices in `localStorage`, small grammars | `view-choice.ts`'s idea (one storage key, pruned to 50 entries, `:24-39`) for a phone's own filter memory, if wanted | 0 to 15 |

## 2. How it uses Lit

- **One `LitElement`.** It is defined with `@customElement` (`src/calendar-card-pro.ts:318`). Nine reactive properties are declared with `@property({ attribute: false })`: `hass`, `config`, `events`, the loading flags, `isExpanded`, the forecasts and the templated title (`:324-344`). Everything else is a private field with explicit `requestUpdate()` calls, which the class counts (`:1780-1786`) so it can tell the minute repaint from other updates.
- **Render functions, not child components.** `render()` (`:3979-4080`) calls plain functions that return `TemplateResult`s: `Render.renderMainCardStructure`, `renderColumnGroupedEvents` and `renderGridGroupedEvents`. The views have no custom elements of their own.
- **Few directives.** The card uses only `classMap`, `styleMap` and `repeat` (`render.ts:6-8`, `column.ts:11-13`, `grid.ts`). `repeat` is keyed by `${event._entityId}-${event.summary}-${index}` (`render.ts:543-546`, `column.ts:272-275`). Because the key holds the index, an event added above another re-keys it *(inferred)*. The editor adds `keyed` (`editor/element.ts:453`). Nothing uses `unsafeHTML`. Titles reach the page as text bindings, so Lit escapes them.
- **Tap targets as properties, not attributes.** An event element carries its tap payload as a Lit property, `.calendarCardEventTap` (`activation.ts:17-53`, set in `column.ts` `renderColumnEvent`). The recognizer reads it off the pointer-down's `composedPath()` (`activation.ts:104-114`), so the markup carries no extra trace.
- **Static styles.** `static get styles()` returns one `css` template (`:1369-1371`). Per-config values go in as CSS custom properties built by `generateCustomPropertiesObject` (`styles.ts:54`) and set with `styleMap` on `ha-card` (`render.ts:169`). Each event sets its own accent through an inline `style` (`column.ts`, `renderColumnEvent`).
- **Lifecycle hooks:**
  - `willUpdate` resolves the language and closes an open menu before a render that would remove its button (`:2436-2449`).
  - `updated` re-arms the timers and runs every measure-after-render pass (`:2451-2540`).
  - There is no `shouldUpdate`.
- **Home Assistant elements used inside it:** `ha-card`, `ha-icon` (MDI icons by name, for example `leaves.ts:972`), `ha-ripple` (`render.ts:183`), and `ha-form` in the editor.

**For the house board:** #44 rejected Lit and kept a vendored copy as the fallback. CCP shows what Lit buys at scale: keyed lists, a stable DOM for 3,000 grid blocks, and controls that keep focus through a redraw. Those are the costs the house board avoids by redrawing whole calm regions and keeping the sheets as their own elements. Nothing here argues for reopening #44 *(inferred)*.

## 3. The render pipeline, and how it avoids needless redraws

### From a state change to the screen

1. Home Assistant hands every card a new `hass` object on every state change in the house. CCP's `hass` is a Lit property, so each one schedules an update.
2. `render()` (`:3979`) reads `groupedEvents` (`:1016-1025`). That calls `EventUtils.groupEventsByDay` on the shown events each time, with no memo.
3. The view's render function builds templates, and Lit patches whatever bindings changed.
4. `updated()` runs the timers and fitting passes. The passes run only when `_gridDisclosureChanged` (`:2365-2387`) says something they measure may have changed.

### What saves work

- **Lit's diffing.** A template is parsed once. Later renders touch only the bindings whose values changed (CCP's own summary: `docs/architecture.md`, "Progressive Rendering").
- **Memos on identity:**
  - `effectiveConfig` (`:1097-1110`);
  - `_shownEvents`, the events without hidden calendars, memoized on the `events` array and the hidden set (`:1043-1053`);
  - the effective language (`translations/localize.ts`, `languageCache`);
  - every `Intl` formatter (`utils/paging.ts:184-210`, `translations/dayjs.ts:46-66`).
- **The state-change gate.** `_gridDisclosureChanged` (`:2365-2387`) returns false when the only change is `hass` and these three things are all true:
  - the locale's language, time format and first weekday are unchanged;
  - every configured calendar's state object is the same object as before;
  - so is every person entity used as a label.

  So "unrelated Home Assistant state ticks must not remeasure thousands of unchanged blocks" (`:2358`). A minute repaint is told apart by a counter of bare update requests (`:2366-2368`).
- **Timers only while they matter, reconciled after every render** (`updated()`, `:2466-2469`), since the view can change after the card connects:
  - **A now-line tick** once a minute, only while the grid draws its now line (`_syncNowLineTimer`, `:1593-1620`). It isn't aligned to the wall-clock minute (`:1603-1604`). On each tick it compares a local day key and refetches when the day rolls over, including a rollover that passed while the timer was stopped (`_tickNowLine`, `:1754-1770`).
  - **A midnight timer** one second past local midnight, built from local date fields so a DST night is as long as it really is. It runs only while columns are being dropped for width (`_syncMidnightTimer`, `:1636-1672`, the date at `:1655`).
  - **A boundary timer** for the next instant a timed event starts or ends (`_syncNowBoundaryTimer`, `:1693-1745`; `nextEventBoundary`, `utils/events.ts:2451-2476`). It keeps an armed timer while the events array is unchanged, so `hass` renders in between skip the scan (`:1704-1711`). It fires one second late and is capped at a day to stay under `setTimeout`'s 24.8-day limit (`:1729-1733`; `constants.ts:148`).
- **The hidden tab.** `visibilitychange` stops the now-line and boundary timers. A tab coming back repaints at once, and loads from the cache if the card last loaded more than 5 minutes ago (`_handleVisibilityChange`, `:2872-2890`; `constants.ts:75`).
- **Width.** A `ResizeObserver` on the host acts inside its own callback, so the first painted frame is already the right layout (`:1484-1500`; `docs/architecture.md`, "Header Toolbar"). The layout changes only beyond a 32 px band (section 4).
- **No flash while loading.** Days about to give way to another page's dim to 50% only after 150 ms, so a quick load never flickers (`styles.ts:675-680`). Cached events up to 24 hours old are read synchronously, so they're on the first frame (`readEventSnapshot`, `utils/events.ts:275`; `docs/architecture.md`, "Event Data Flow"). That matches the house board's "opens settled".
- **Measuring after render is batched.** Reads come first, then writes. A `ResizeObserver`, a `MutationObserver`, image `load` events and `document.fonts` (`ready` and `loadingdone`) mark blocks dirty, and the work runs on `requestAnimationFrame` (`:2183-2340`, the fonts at `:2305-2325`).

### What it doesn't do

- **Nothing skips a render.** With no `shouldUpdate`, a light switching anywhere in the house re-runs the grouping and the template functions for every event shown. Lit then finds nothing to patch. That's cheap for a few dozen events in Lit *(inferred)*. Without Lit, the same habit would rebuild `innerHTML` on every tick.
- **The `repeat` keys hold the index** (above), so the list order shifts keys more than it needs to.

### For the house board

| Piece | Source | Port | Plain lines |
|---|---|---|---:|
| Gate `hass` before drawing: compare `hass.states[id]` by identity for exactly the entities the board reads (its calendars, the to-do lists, weather, the two switches), plus `hass.locale` and the theme. Redraw nothing when all are the same object | `src/calendar-card-pro.ts:2365-2387` | Yes. This is what "nothing redrawn at rest but the minute and real changes" ([#72](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/72#issuecomment-6537563054)) needs from `ha.js` | 12 |
| Redraw a region only if its new HTML string differs from the last one drawn | (the house board's own idea; Lit does the equivalent per binding) | Yes *(inferred)*: keeps focus and avoids layout work on unchanged regions | 8 |
| Align the minute tick to the wall clock, one second past the minute. On each tick, compare a local day key and refetch on rollover (also checked when the tab returns) | `:1754-1770` (day key), `:1655` (one second past, local fields) | Yes. With a tick aligned to the minute, events that start on whole minutes flip Now and Next on time. That makes CCP's separate boundary timer unnecessary *(inferred)* | 15 |
| Stop the tick while the tab is hidden. On return, repaint at once and refetch if the data is over 5 minutes old | `:2872-2890` | Yes. It is the "board must refresh itself when shown again" decision ([#67](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/67#issuecomment-6537438807)) | 15 |
| Measure again after fonts load (`document.fonts.ready` and `loadingdone`) for the lead line's shrink-to-fit and the "+N more" count | `:2305-2325` | Yes, small. Phones load Roboto as a web font *(inferred)* | 12 |
| A next-boundary scan | `utils/events.ts:2451-2476` | Only if the tick is not aligned to the minute | 25 |

## 4. Layout and CSS

### The shell and scrolling

- `:host` is a block at `height: 100%`. `ha-card` is a flex column with `overflow: hidden`, and its padding is set per view (`styles.ts:263-288`). Home Assistant's `ha-card` transitions every property, so CCP limits the transition to colors and the shadow. A view switch, which changes the padding, then draws at once (`styles.ts:280-287`).
- `.content-container` is the one scrolling box (`styles.ts:307-322`):
  - `overflow-y: auto`;
  - `max-height` and `height` from the `max_height` and `height` options;
  - a scrollbar hidden until hover;
  - `hyphens: auto`.
- **There are no sticky headers anywhere** (no `position: sticky` in `styles.ts`). The docs make this a rule: "What scrolls is the whole card, not an individual day. The columns sit inside one scrolling area, so the day headers move together with their events" ([Height in Column View](https://calendar-card-pro.alexpfau.com/features/layout-appearance#height-in-column-view)). The house board's phones pin each day's name and the week strip ([phones prototype](../../../prototypes/phones/README.md)), which is a step past CCP.

### Day columns

- **The recipe** (`column.ts:358-393`, `styles.ts:3491-3530`):
  - one CSS grid with `grid-template-columns: repeat(N, minmax(0, 1fr))` and the gap set inline;
  - two declared rows (a week-number band, then the days);
  - every item placed explicitly;
  - `align-items: start`, "so quiet days do not stretch their accent bars through empty space";
  - each `.day-column` a flex stack with `min-width: 0`, so long titles wrap instead of widening the grid.
- **Separators** are overlaid in the gutter, pulled back by half the gap, so turning one on moves no column (`column.ts`, `renderColumnSeparator`).
- **The column header** is a small two-row grid of weekday over day, month and weather, aligned on the baseline (`styles.ts:3519-3530`).
- **For the house board:** `minmax(0, 1fr)` with `min-width: 0` is the piece that matters for the resting face's four columns, so a long title can't push a column wider. About 10 CSS lines, and an idea rather than code.

### Responsive sizing

- A column card narrower than `days_to_show × min_day_width` (140 px by default) plus gutters either:
  - drops days, down to `min_days_to_show`, keeping today and moving forward from it (`config/view.ts:2418`, `visibleDayWindowStart`); or
  - falls back to the list.

  With `min_days_fallback: cramp`, the columns squeeze instead ([Column View](https://calendar-card-pro.alexpfau.com/features/column-view)).
- **The switch is a Schmitt trigger.** It enters 16 px above the threshold and leaves 16 px below, so "a card sitting on the boundary settles instead of flapping". One threshold would oscillate, because the new layout's height can change the width a masonry dashboard gives the card (`config/view.ts:1779-1789`, `:2171-2196`).
- **The day count goes the same way.** `resolveColumnFit` compares each new fit against the previous one with the same half band (`config/view.ts:2298-2340`).
- **For the house board:** #44 says "what differs follows the card's width". If the wall and phone layouts switch at one width, the same two thresholds cost about 10 lines. That is worth having only if a phone turned sideways (about 844 px) or a resizing browser can sit near the line *(inferred)*.

### Compact and expanded

- The list view can cap events across the card (`compact_events_to_show`), cap them per calendar, cap the days (`compact_days_to_show`), or keep whole days (`compact_events_complete_days`). `tap_action: expand` toggles the caps off (`utils/events.ts:1485-1600`; [Expandable Calendar Card](https://calendar-card-pro.alexpfau.com/features/actions#expandable-calendar-card)).
- **The caps are silent.** The docs say so plainly: "Nothing on the card marks that events were held back, so a compact card looks the same as one with nothing more to show."
- **Column and grid views ignore the caps** (`config/view.ts:314-316`). CCP's reason: a cap across the card would fill the first columns and leave later ones empty. Only the hour grid has a "+N" count, a bare number (`rendering/grid.ts:995-998`).
- **For the house board:** its rule (rows drop from the end, "+N more" says how many, the Next row never drops; [resting face](../../../prototypes/resting-face/README.md)) is better than CCP's here. On the phones the reviewers found "+N more" hid what they looked for ([phones](../../../prototypes/phones/README.md), layout C), which is why the phones scroll instead. Nothing to borrow.

### The hour grid (short)

Grid view places timed events by percentage on a shared hour axis and lays overlaps out cascaded or side by side. It sizes against container units (`cqh`), and uses height container queries (`@container calendar-card-grid-event (min-height: 19px)` through `96px`, `styles.ts:4656-4900`) to show more of a block as it grows taller. It scrolls sideways under `cramp`. Its fitting code (`utils/grid-title-fit.ts`, 1,000 lines) measures text by its line boxes through `Range.getClientRects()`, and uses `Intl.Segmenter` so an ellipsis never splits a grapheme. The house board has no hour grid, so none of it ports. The container-query idea (show more as a box grows) would suit an event sheet or a Month cell if ever needed *(inferred)*.

### Color and theme

- **Theme variables everywhere.** Every color falls back to a Home Assistant theme variable (`--primary-text-color`, `--card-background-color`, `--primary-color`). User options map to `--calendar-card-*` properties (`styles.ts:54-235`).
- **The "ink" a colored event writes in.** It is mixed in CSS from the accent toward `--primary-text-color`, in three tiers under `@supports` (`styles.ts:1599-1650`):
  - sRGB `color-mix` as the floor;
  - then `color-mix(in oklch, accent 45%, text)`;
  - then a relative-color step that restores chroma.

  The theme's text color is near-black in light themes and near-white in dark ones, so one declaration darkens the accent on one and lightens it on the other, "with no media query and no second code path". The running event's green "Now" ink uses the same recipe (`styles.ts:1652-1700`). Today's date tile is a wash mixed into the card background "strong enough to read as a mark across a room" (`styles.ts:1420-1450`).
- **The pitfall.** CCP first used `light-dark()`. Home Assistant declares no `color-scheme`, so the browser falls back to `prefers-color-scheme`, and the badge followed the operating system, not the Home Assistant theme. A dark Home Assistant theme on a light phone got the light ink. CCP's screenshot harness hid this by forcing a dark color scheme (`styles.ts:2854-2870`).
- **For the house board:** the house board picks person colors for each background ([#91](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/91#issuecomment-6551826184), [#92](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/92#issuecomment-6557606569)), and the phones follow Home Assistant's light or dark. Two things carry over:
  - Never decide light or dark with `prefers-color-scheme` or `light-dark()`. Read Home Assistant's own dark-mode flag or theme variables.
  - Where a pale block or a deeper edge is wanted from a person color, `color-mix(in oklch, var(--person) N%, var(--card-background-color))` does it in CSS with no per-theme table. The house board's own measured values still rule wherever they exist *(inferred)*.

### Touch and small details

- **Touch targets bigger than the drawn control.** Each control answers a 44 px press through an invisible `::before` box with negative `inset`, sized so it never overlaps a neighbor's (`styles.ts:817-868`). The house board's sizes are larger (at least 40 px, 56 px for buttons, 80 px for ticks and Undo, from [the map](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/37)). The same trick lets a small-looking control keep a big target without moving the layout. About 10 CSS lines.
- **Hover only under `@media (hover: hover)`,** "on touch a hover state sticks after the tap", while `:active` applies everywhere (`styles.ts:1107-1121`). This suits a touch-only tablet. About 5 lines.
- **`font-variant-numeric: tabular-nums`** keeps changing digits from shifting their neighbors (`styles.ts:479`, on the month heading). The resting face's minute clock needs the same, or the line jiggles each minute *(inferred)*. One line.
- **A delayed dim instead of a spinner:** `transition: opacity 120ms ease 150ms` (`styles.ts:675-680`). Opacity only, which fits the house motion rule. Two lines.
- **`prefers-reduced-motion`** turns transitions off (`styles.ts:946-950`, `:2114`). One block.
- **`text-box: trim-both cap alphabetic`** centers digits by their cap height where supported (`styles.ts:1405-1420`).
- **Logical properties and `:dir(rtl)`** throughout. The house board doesn't need these.
- **Build-time comment stripping.** `rollup.config.mjs:24-148` strips `/* */` comments from `css` templates at build time. "65% of the stylesheet" was comment. The house board has no build, so its CSS comments ship. At the house board's size that's a few kilobytes, transferred gzipped (section 8).

## 5. Interaction

- **One gesture recognizer on `ha-card`** (`src/calendar-card-pro.ts:3151-3330`):
  - A pointer-down on the primary button and primary contact records the start point and the tapped event, read from `composedPath()`. It captures the pointer, so a hold survives the finger slipping off the card (`:3118-3133`).
  - A hold timer arms only when `hold_action` is set (500 ms, `constants.ts:58`).
  - Moving more than 8 px before the hold fires turns the gesture into a drag and cancels it (`:3214-3245`; `constants.ts:155`).
  - On pointer-up, a hold runs `hold_action` wherever it landed, a tap on an event opens its details, and any other tap runs `tap_action` (`:3253-3297`).
  - For 1 second, the browser's own `click` after a gesture is swallowed, so it can't act twice (`_derivedClick`; `constants.ts:69`).
  - Enter acts on keydown and Space on keyup (`:3403`).
  - Toolbar controls stop `pointerdown` and `click`, so a near miss between buttons never runs the card's action (`toolbar.ts:235`).
- **Actions.** `none`, `expand` and `refresh` are handled by the card. Every other action is handed to Home Assistant as a bubbling, composed `hass-action` event naming the first calendar (`interaction/actions.ts:36-46`, `:64-98`), so navigate, more-info and service calls behave as on Home Assistant's own cards.
- **Event details, edit and delete.** These open Home Assistant's own `dialog-calendar-event-detail` and `dialog-calendar-event-editor`. CCP gets them by creating a core calendar card through `window.loadCardHelpers()`, calling `ha-full-calendar`'s private `_createEvent` or `_handleEventClick` on a stand-in that records the `show-dialog` event, then running the captured import (`interaction/ha-calendar-dialogs.ts:117-140`, `:217-280`). It falls back to `hass-more-info` for the calendar entity (`:366-375`), and for adding, to Home Assistant navigating to `/calendar` (`:353-355`). Whether a calendar can be changed comes from `supported_features` bits: 1 create, 2 delete, 4 update (`:30-36`, `:101-108`). In the dashboard editor and in edit mode, events are not tap targets and the dialogs refuse to open.
- **The hold indicator** is a fixed circle at the pointer that scales in over 200 ms and fades over 300 ms (`interaction/feedback.ts`).
- **The filter's menu** is a modal `<dialog>` opened with `showModal()`, which reaches the top layer past `ha-card`'s `overflow: hidden` in every browser Home Assistant serves. The popover API would need iOS 17. Every way of closing it goes through one function, because a modal makes the rest of the page inert (`rendering/legend.ts:346-435`; `docs/architecture.md`, "Header Toolbar").

**For the house board:**

| Piece | Source | Port | Plain lines |
|---|---|---|---:|
| One delegated `click` listener on the shadow root: find the tapped thing with `event.composedPath()` and a `data-` attribute, ignore other buttons | `activation.ts:104-114` (the path walk) | Yes, simplified. CCP's pointer recognizer exists for holds and pointer capture, which the house board doesn't use. Browsers send no `click` after a scroll or pan, so a plain `click` already ignores a phone list being scrolled *(inferred)* | 10 |
| `hass-action` with `{ tap_action: { action: 'navigate', navigation_path } }` to go to the week card's address for what the house board can't do yet, and `hass-more-info` to show an entity | `actions.ts:36-46`, `ha-calendar-dialogs.ts:353-375` | Yes. It uses Home Assistant's own navigation, "it closes open dialogs and lets a page with unsaved changes refuse", instead of the `history.pushState` and `location-changed` the layout note planned | 10 |
| Calendar feature bits to decide whether the event sheet offers changing and Delete | `ha-calendar-dialogs.ts:30-36`, `:101-108` | Yes. It feeds "what the board can't change says where to change it" ([#45](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/45#issuecomment-6545490784)) | 4 |
| Borrowing Home Assistant's calendar dialogs | `ha-calendar-dialogs.ts:117-280` | No. It relies on private methods, and the house board has its own sheet | 0 |
| A modal `<dialog>` for a sheet that must sit above everything | `legend.ts:346-435` | Only if a sheet gets clipped. The house board lives in a panel view, so it likely won't *(inferred)* | 20 |
| Hold actions and the hold indicator | `feedback.ts`, `:3151-3310` | No: the house spec has no holds | 0 |

## 6. The visual editor

- **What it is.** A separate bundle (`src/rendering/editor/`, 9,006 lines, plus 435 KB of translations in 11 languages) built on Home Assistant's `ha-form` with schemas per panel (`editor/schemas/`). It has search, a "customized only" filter, per-calendar panels, a workspace per view, migration of older configs, and storage that remembers which values the user actually wrote (`docs/architecture.md`, "Configuration Layers & Editor Adoption"; [Visual Configuration Editor](https://calendar-card-pro.alexpfau.com/features/editor)).
- **How it loads.** The card fetches the editor only when someone opens it, by computing its URL from `import.meta.url` (`calendar-card-pro.ts:359-378`; `utils/editor-url.ts`). Two Rollup entries, with neither file importing the other, sidestep a HACS query-string trap that made the browser load the card twice (`rollup.config.mjs`, the closing comment).
- **For the house board:** not needed. Its config is a few keys the agent writes in YAML, and the household's adjustments live on its own Settings page ([#87](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/87#issuecomment-6551496631)). Nothing to port.

## 7. Translations, and `Intl` for dates and times

- **The string table.** The card carries 36 languages, each a flat JSON of short day and month names, full day names and about 12 strings (`src/translations/languages/en.json`), 27 KB in all. `getEffectiveLanguage` picks the card's `language`, then Home Assistant's, then its base language, then English, and caches the answer (`translations/localize.ts`).
- **Relative words.** Day.js with its relative-time plugin and 36 locales gives the countdown's natural wording, such as "in a month" (`translations/dayjs.ts:1-44`). `Intl.RelativeTimeFormat` gives "tomorrow" (`numeric: 'auto'` for 1 day), "in 5 hours" and the "Now" label, each formatter cached per locale (`dayjs.ts:46-90`).
- **`Intl.DateTimeFormat`** builds the month heading and date ranges. It is cached per language and field set (`utils/paging.ts:184-210`, `:328-335`). `formatRangeToParts` finds each language's range separator (`paging.ts:272-315`), and `RelativeTimeFormat(…).format(0, 'day')` gives the word for "Today" (`paging.ts:477-487`).
- **12- or 24-hour clocks** are detected by asking `Intl` whether an afternoon hour prints a day period (`utils/helpers.ts:403-425`). Times themselves are formatted by hand as "3:30 PM" (`utils/format.ts:700-712`).
- **Weekends and week starts** come from tables keyed by Home Assistant's country and language, not `Intl.Locale.getWeekInfo`, because that API's spelling still differs between engines (`utils/format.ts:560-680`, `:802-860`). A test pins each table entry against the runtime's own CLDR data.
- **DST-safe day arithmetic:**
  - `getCalendarDayDiff` takes local date fields into `Date.UTC` before subtracting (`utils/format.ts:685-690`);
  - all-day dates are parsed from their parts, never by `new Date('YYYY-MM-DD')`, which reads them as UTC (`format.ts:496-500`);
  - local date keys come from local fields (`format.ts:508-510`).

**For the house board** (English only, two adults; #44 said "no translation layer"):

| Piece | Source | Port | Plain lines |
|---|---|---|---:|
| Countdown words: `new Intl.RelativeTimeFormat('en', { numeric: 'auto' })` for "tomorrow", `numeric: 'always'` for "in 12 days", cached | `translations/dayjs.ts:46-66` | Yes. Day.js isn't needed for "Beach trip in 12 days" | 6 |
| Whole-day difference from local fields through `Date.UTC`; all-day parse from parts; local date key | `utils/format.ts:496-510`, `:685-690` | Yes. It keeps countdowns and day columns right across the 1 Nov clock change | 10 |
| A cached `Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' })` for "Tue, Nov 3" | `utils/paging.ts:184-210` | Yes, as a pattern | 6 |
| Hand-formatted times ("3:30 pm", the house's style) instead of `Intl` for the time | `utils/format.ts:700-712` | Yes. Recent ICU versions put a narrow no-break space before "PM", which varies between Node, the tablet's WebView and iOS and trips string tests *(inferred, not tested here)* | 6 |
| `stripHtmlTags`: a regex drops tags, and a `<textarea>`'s `innerHTML` decodes entities as text without running anything | `utils/format.ts:455-472` | Yes, for showing an event's details. The data report should note that writing plain text back would drop a calendar's own formatting *(inferred)* | 8 |
| The language table, Day.js, week numbers, weekend tables | as above | No | 0 |

## 8. Bundle size

| File | Raw | Gzip level 9 | Loaded |
|---|---:|---:|---|
| CCP card, `calendar-card-pro.js` | 397 KB | 111 KB | every dashboard ([installation](https://calendar-card-pro.alexpfau.com/guide/installation)) |
| CCP editor, `editor.js` | 577 KB | 167 KB | only when the editor opens |
| The week card, `custom_components/family_hub/card/family-week-calendar-card.js` (measured here) | 1,462,881 bytes | 388,585 bytes | every dashboard today ([#97](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/97#issuecomment-6558650608)) |
| The house board at its 3,000-line cap, served unminified | about 105 to 135 KB *(inferred, at 35 to 45 bytes a line)* | about 25 to 35 KB *(inferred)* | `/house-board` |
| Vendored Lit, if the fallback is ever used | about 15 KB minified (#44's note) | | |

- **What CCP does to stay small:**
  - The editor and its translations are split off, which made the eager file 41% smaller gzipped than v3.6.0 (`docs/RELEASE_NOTES.md:488`).
  - CSS comments are stripped at build time.
  - The target is es2021 (`rollup.config.mjs`, the esbuild block).
  - Terser runs two passes, "a third shrank the raw file further but made the gzipped one larger".
  - No source maps ship.
  - Lit, Day.js and its 36 locales are bundled in.
- **The shortcut.** HACS's `async_save_file` gzips every `.js` it writes into `file.js.gz`, with no check of the repository's category ([HACS source](https://raw.githubusercontent.com/hacs/integration/main/custom_components/hacs/base.py)). CCP says Home Assistant's `http` component serves that sibling to any browser that accepts gzip (`AGENTS.md:1091-1103`). The fork's `hacs.json` has no `zip_release`, so HACS saves the fork file by file *(inferred)*.
  - **What it means for the house board:** its plain files likely transfer compressed with no build step and no minifier.
  - **The catch:** a session that patches a `.js` on the Home Assistant box by hand must delete its `.js.gz`, or browsers keep getting the old file, even under a new folder hash.
  - **One check worth doing:** list `custom_components/family_hub/card/` on the house's Home Assistant for `.js.gz` files *(not checked)*.

## 9. Tests

- **The scale.** 250 test files, 90,516 lines, about 3,971 `it`/`test` cases, run by Vitest under happy-dom (`vitest.config.mjs`). Of those files, 82 mount real DOM.
- **What they cover, by file-name prefix:**
  - the editor (27 files);
  - the grid (23);
  - weather (14);
  - events, fetching and the cache (12);
  - view resolution (11);
  - multi-day events (8);
  - host lifecycle and guards (6);
  - then today, columns, labels, titles, countdowns, compact mode and more;
  - DOM snapshots for the list and column views (`tests/__snapshots__/`, about 4,900 lines);
  - a 3,307-line `stylesheet.test.ts` that reads the CSS source as text and pins invariants that have broken before. It doesn't parse the CSS, because happy-dom's parser silently drops `display: -webkit-box` and negative `calc()` (`tests/stylesheet.test.ts:1-50`);
  - doc-story tests that hold the docs' family examples to one palette and one set of calendars (`tests/family-stories.test.ts`).
- **The time-zone matrix.** The `unit` project runs at `TZ=UTC`. Every `*.dst.test.ts` file (22 of them) runs again under `Europe/Berlin`, `Australia/Sydney` and `America/New_York`, and each zone catches a different bug class (`vitest.config.mjs`; `AGENTS.md:282-330`):
  - Berlin and Sydney catch rounding in opposite hemispheres;
  - New York catches the offset sign. A date-only string parsed as UTC failed 17 times there, while Berlin, Sydney and UTC stayed green.

  Each such file also asserts that the January and July offsets differ, so it can't silently pass under UTC.
- **A frozen clock picked away from every boundary:** a Wednesday, mid-month, 10:00 (`tests/fixtures.ts`, `FROZEN_NOW`).
- **Lessons the suite records** (`AGENTS.md:231-275`, `:1722`):
  - A suite built from defaults can't see an option that defaults off, so every new option gets a test that turns it on.
  - A test that walks a table's own keys can't notice a key leaving, so tables are pinned by value.
  - Length options are tested at a non-px unit.

**For the house board:**

| Piece | Source | Port | Lines |
|---|---|---|---:|
| Run the `when.js` checks three times in `tests/run_all.sh`, under `TZ=UTC`, `TZ=America/New_York` and `TZ=Australia/Sydney`, with a guard that the zone really has DST | `vitest.config.mjs`, `AGENTS.md:282-330` | Yes. It catches the "fine in UTC, wrong at home" class, including the 1 Nov clock change | 3 to 5 |
| A frozen "now" away from week, month and day boundaries, plus separate cases on each boundary | `tests/fixtures.ts` | Yes, as a habit | 0 |
| String snapshots of `faceHtml(model)` for a few fixed models | `tests/list-dom.test.ts` and its snapshots | Maybe. A few pinned strings, read before updating, match #44's "titles render as text" check *(inferred)* | 20 |
| Pin tables by value, such as the 12 colors and the icon table | `AGENTS.md:238-250` | Yes, as a habit | 0 |

## 10. What to borrow, ranked

Each row is small, plain, and fits #44's layout. Copying a function as written means keeping CCP's MIT copyright and permission notice in that file's header (MIT code may be combined into the GPL-3.0 fork). Rebuilding an idea needs no notice.

| # | Borrow | From | Into | Plain lines | What it saves or prevents |
|---:|---|---|---|---:|---|
| 1 | Gate `hass` on the identity of the states the board reads | `src/calendar-card-pro.ts:2365-2387` | `ha.js` | 12 | Redrawing the board each time any light or sensor in the house changes |
| 2 | Minute tick aligned to the wall clock, one second past, with a local day-key rollover check | `:1754-1770`, `:1655` | `house-board.js` | 15 | Now, Next and the clock a minute late; a stale "today" after midnight or after a tab sat hidden |
| 3 | Hidden-tab handling: stop, repaint on return, refetch after 5 minutes | `:2872-2890`, `constants.ts:75` | `house-board.js` | 15 | The phones showing old data when reopened (#67's decision) |
| 4 | DST-safe day difference, all-day parse, local date key | `utils/format.ts:496-510`, `:685-690` | `when.js` | 10 | Off-by-one days and countdowns across the clock change |
| 5 | `Intl.RelativeTimeFormat` for "tomorrow" and "in 12 days"; cached `Intl.DateTimeFormat`; times formatted by hand | `translations/dayjs.ts:46-66`, `utils/paging.ts:184-210`, `utils/format.ts:700-712` | `when.js` | 18 | A date library; engine-specific spaces in times |
| 6 | `hass-action` navigate and `hass-more-info` | `interaction/actions.ts:36-46`, `ha-calendar-dialogs.ts:353-375` | `house-board.js` | 10 | Hand-rolled navigation to the week card during the switch-over |
| 7 | Calendar feature bits (1 create, 2 delete, 4 update) | `ha-calendar-dialogs.ts:30-36`, `:101-108` | `ha.js` | 4 | Offering Change or Delete on a calendar that refuses them |
| 8 | Strip tags and decode entities for details | `utils/format.ts:455-472` | `when.js` or the sheet | 8 | `<br>` and `&amp;` showing in an event's details |
| 9 | A filter that always shows it's on: hidden people's chips stay, grayed; a dot on a folded filter; filtering what's drawn, never what's loaded, memoized on identity | `rendering/legend.ts:495-530`, `styles.ts:959-968`, `:1019`, `calendar-card-pro.ts:1043-1053` | Month and Upcoming's person filter ([#98](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/98#issuecomment-6559117623)) | 25, plus 15 CSS | Someone thinking a day is empty because a filter was left on |
| 10 | A failed-calendar line that names the calendar, while its last events stay shown | `rendering/render.ts:231-240`, `styles.ts:3226-3245`, [Performance](https://calendar-card-pro.alexpfau.com/features/performance#when-a-calendar-fails-to-load) | the face and Upcoming | 15, plus the data side | An empty column that is really a failure (see section 11) |
| 11 | CSS: `::before` target growth; `@media (hover: hover)`; `tabular-nums`; the delayed opacity dim; `prefers-reduced-motion`; `minmax(0, 1fr)` with `min-width: 0` | `styles.ts:817-868`, `:1107-1121`, `:479`, `:675-680`, `:946`; `column.ts:382`; `styles.ts:3503-3507` | the stylesheet | 40 | Sticky hover on the tablet, a clock that jiggles, load flicker, columns pushed wide |
| 12 | Person-color ink and washes with `color-mix` toward theme colors; never `light-dark()` or `prefers-color-scheme` | `styles.ts:1599-1650`, `:2854-2870` | `theme.js` and the stylesheet | 15 CSS | Colors that follow the phone's OS instead of Home Assistant's theme |
| 13 | Measure again after fonts load | `calendar-card-pro.ts:2305-2325` | the face's fit | 12 | A lead line or "+N more" fitted against a fallback font |
| 14 | Width hysteresis, if wall and phone switch by width | `config/view.ts:1779-1789`, `:2171-2196` | `house-board.js` | 10 | A layout flapping at one width |
| 15 | The test time-zone matrix | `vitest.config.mjs`, `AGENTS.md:282-330` | `tests/run_all.sh` | 5 | Date bugs invisible under UTC |

In all, about 150 to 200 plain lines and 60 to 80 CSS lines, against the 3,000-line folder cap.

**Leave alone:**
- Lit;
- the editor (9,006 lines);
- the translation layer and Day.js;
- the hour grid and its fitting (about 5,000 lines across `rendering/grid.ts` and `utils/grid*.ts`);
- the scrolling-title animation (`utils/title-motion*.ts`, 498 lines; off by default in CCP too, `scroll_long_titles: false`), against "nothing moves at rest";
- the toolbar;
- the pointer recognizer and holds;
- borrowing Home Assistant's private calendar dialogs;
- the per-device view memory (the house board's per-person settings are a service, from #43);
- `ha-icon` for the fixed icon table.

On `ha-icon`: it loads icons asynchronously from Home Assistant's frontend and is absent in the house test harness. Inline SVG paths for the dozen or so icons render on the first frame instead, which "opens settled" wants *(inferred)*.

## 11. Display gaps and leads for the gap list

Candidates where CCP shows something the decided house board doesn't. Each is marked for whether the owner would notice it.

- **A calendar that failed to load is named on the card and keeps its last events for up to 24 hours,** with retries after 1, 2, 4 and 8 minutes, up to the refresh interval ([Performance](https://calendar-card-pro.alexpfau.com/features/performance#when-a-calendar-fails-to-load); `render.ts:231`). The house board's decisions record open times and errors in Home Assistant for sessions ([#98](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/98#issuecomment-6559117623)). The wall and phones say nothing, except that the board names AnyList when it can't reach it ([wall Month and Lists](../../../prototypes/wall-month-lists/README.md)). An adult's column empty because their Google sign-in lapsed would read as a free day. **Owner would notice:** a keep-or-skip candidate.
- **Each day's header shows that day's forecast** (condition icon and high) once a weather entity is set (`config/config.ts:147-157`; `leaves.ts:32`). The resting face shows today's high and low, one icon and a rain line, and its four day columns carry no weather ([resting face](../../../prototypes/resting-face/README.md)). **Owner would notice:** a candidate, best judged with the weather report.
- **A filtered view always shows that it's filtered** (borrow 9). The person filter's look isn't specified yet. **The agent's call:** follow CCP.
- **Reduced motion is honored.** The agent's call: one CSS block.
- **The minute clock with tabular figures.** The agent's call.

Where the house board is already ahead of CCP on display, so nothing to borrow:
- "+N more" in place of silent caps;
- a Month view (CCP has none: `config/view.ts:299`, `VIEWS = ['list', 'column', 'grid']`);
- pinned day names and a following week strip on phones (CCP has no sticky headers);
- sizes chosen for reading distance;
- each row naming its person in words (CCP marks a calendar by color, an icon, an emoji or a person's picture: `leaves.ts:344-370`);
- a calm face with nothing moving.

CCP also merges an event that appears on two calendars into one row with its own accent (`filter_duplicates`, `duplicate_accent_color`; `presentation.ts:110-120`). That matches the house board's decision that a plan on two calendars shows once, in Us's green with both names ([#61](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/61#issuecomment-6536911798)). How it decides two events are the same is for the data report.

## 12. License

CCP is MIT, "Copyright (c) 2025 Alex Pfau" (`LICENSE`). MIT code can go into the GPL-3.0 fork as long as its copyright and permission notice stays with it. The lean way is to put that notice in the header of any house file that contains a function copied close to as written. Rows 1 to 15 above are small enough to rewrite from the idea, which needs no notice. CCP's `NOTICE` lists Lit (BSD-3-Clause) and Home Assistant's frontend (Apache-2.0) as sources of its own code and patterns. None of their code is suggested for copying here.
