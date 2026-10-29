# Clover Tablet improvement loop (log)

Unattended overnight run to make the board better on the Clover Tablet (TCL NXTPAPER 14, 1200×800 CSS px at device pixel ratio 2, read from 6 to 12 ft). Small tested changes merge into `house/clover-tablet-loop`; one draft PR from there to `main` is the morning menu. Nothing merges into `main`.

- Start: 2026-10-28 23:19 EDT. Last new iteration: 03:45 EDT. Hard stop: 2026-10-29 04:20 EDT.
- Research: [docs/research/skylight-calendar.md](../research/skylight-calendar.md), [docs/research/wall-display-legibility.md](../research/wall-display-legibility.md).
- Screenshots: harness only (fake data), `docs/agents/clover-tablet-loop/shots/`.

## Audit at 1200×800 (harness, cream default theme, 2026-10-28)

What the tablet copy runs now (read-only from Home Assistant): Week view, 7 days, timeline off, default (household) theme, full top bar.

- **Timeline text is fixed at 11 px (titles) and 9 px (times and hour labels)** in Day view and in Week with the timeline on. It ignores the theme's event font size, which the other views follow. Day view, the closest thing to the "1 to 3 days in large text" default (Q13), has the smallest text on the board.
- **Agenda text is fixed at 13 px (titles), 11 px (times), 13 px (day names)**, also ignoring the theme.
- **Agenda doesn't dim past events**; Week does (`greyOutPastEvents`).
- **The first hour label is cut in half** at the top of every timeline (`.hour-label` sits 7 px above its line).
- **Empty meal slots** ("Tap to add breakfast", "lunch") take about a third of each column in Week and 3-day views. Which slots show is a household setting (meal blocks), not code.
- **Will and Work share the initial W** on every event badge and chip; only color tells them apart.
- **No current-time line** on timelines.
- **Today** is marked only by a thin outline and a colored date.
- 3 days (Week view, Days shown 3, Current day first) at the theme's default 14 px event text: roomy columns (about 320 px wide), lots of empty space below.

## Backlog (ranked: value ÷ (risk + upstream-merge cost))

Research shaping the ranking: at 1 CSS px ≈ 0.0099 in, comfortable reading needs text about 59 / 89 / 119 px tall at 6 / 9 / 12 ft (legibility note), so no text size makes titles readable across the room. From across the room the board can only offer glance cues: color by person, where "now" is, which day is today, how full a day is. Titles are for 2 to 6 ft. Skylight's equivalents: a rolling few days from today, an orange "now" bar, dimmed past events, person colors (Skylight note).

| # | Item | Value | Status |
|---|---|---|---|
| 1 | Timeline (Day, Week timeline) and Agenda text follow the theme's text sizes | high: Day view had the smallest text; lets a tablet theme raise every view's text | merged (01) |
| 2 | Current-time line on timelines (Skylight's "now" bar) | high: glanceable "where are we in the day" | merged (02) |
| 3 | Agenda dims past events, as Week does | medium | building (part 2, branch -04-agenda-past) |
| 4 | First hour label no longer cut off (real tablet: "8 AM" sits half under the dinner slot in Week with the timeline) | low, polish | building (part 2, branch -05-first-hour-label) |
| 6 | Split view's day list follows the theme's text size, as item 1 did for Agenda (`.msd-item-time` 10 px, `.msd-item-summary` 12 px, `.msd-date` 14 px are fixed) | low to medium | building (part 2, branch -06-split-text) |
| 5 | Today stands out from across the room | medium | merged (03) |
| 7 | Weather temperatures readable: non-today `.wx-temp` measured 2.3:1 on the real tablet (Liquid Glass theme), below 4.5:1 | medium: weather is a Q3 feature, glanceable | building (part 2, branch -07-weather-contrast) |
| - | Skipped: per-person avatars/initials beyond the first letter (Will and Work both "W") | needs a config field and edits in four upstream templates; logged as a question | skipped |
| - | Skipped: hiding empty meal slots in code | the household's meal blocks setting already does it (proposal) | skipped |

## Iterations

### 01: timeline and Agenda text follow the theme's sizes (23:30 to 00:05)

- Day view and Week-with-timeline event titles were fixed at 11 px and times at 9 px; Agenda at 13 and 11 px. Now they use the theme's event size (14 px in the default theme; any theme can raise it). On the timeline the title comes first and the time under it; short events clamp the title to one line and the shortest hide the time, so nothing shows cut in half.
- Also: `tests/test_house_lines_clean.js` skips binary files (it read the first committed screenshot as text and failed).
- Shots: `shots/01-before-3day-timeline.png`, `shots/01-after-3day-timeline.png`, `shots/01-before-agenda.png`, `shots/01-after-agenda.png`, `shots/01-after-day-theme-20px.png`.
- Upstream-merge cost: none in upstream lines. One house CSS block appended before the card's main `</style>`; it overrides upstream's `.tl-event`, `.tl-time`, `.agenda-item-*` and `.agenda-day-*` rules, so an upstream restyle of those would need a look.

### 02: current-time line on today's timeline (23:35 to 23:50)

- A red line with a dot crosses today's timeline at the current time (Week with the timeline: today's column; Day view: every lane), under the events so it doesn't strike through a title. Hidden outside the hours the timeline shows. It moves with the board's 60 s redraw (under a pixel a minute, so no motion to speak of for the cats).
- The line's height lives in a stylesheet outside the grid, so the saved event shapes aren't rewritten every minute (checked in the test).
- Shots: `shots/01-after-3day-timeline.png` (before), `shots/02-after-3day-timeline.png`, `shots/02-after-day-evening.png`.
- Upstream-merge cost: one line at the end of `_renderGrid` (after the PR #14 hooks; the two source-text checks of its last lines now allow it); two new house methods; CSS in the house block, plus `.timeline > .tl-event { z-index: 2 }` over upstream's `.tl-event`.

### 03: today's header filled in Week view (23:47 to 00:00)

- Week view (7 days or the 3-day setting) fills today's day name and date block with the theme's accent color, as Planner already does; before, today had only a thin outline and a colored number. No layout moves: the fill's margin is a shadow.
- Shots: `shots/03-before-week.png`, `shots/03-after-week.png`, `shots/03-after-week-dark.png`.
- Upstream-merge cost: none in upstream lines; CSS in the house block that overrides upstream's `.today .day-header .num` color.

## Part 2 (from 2026-10-29 00:00 EDT, hard stop 04:20)

Took over from the handover below. Burst until 01:00: four worktree agents build items 3, 4, 6, 7; this session reviews, merges, and tests on the tablet.

### Real tablet, 00:00 to 00:20 (screenshots sent to the owner privately, never committed)

- 00:02 deployed `house/clover-tablet-loop` at `e48fffe` (items 01 to 03) through HACS, restarted Home Assistant, cleared Fully's cache. Board came back; item 03's filled today header shows on the real screen.
- **Home Assistant's sidebar is open on the tablet** and takes about 256 of 1200 px. Collapsing it (one tap on the menu icon, remembered by that browser) gives the board about 200 px more. Setting proposal below.
- The tablet was showing **Month view** (the view button's last choice, kept in the browser). Month pills are the smallest text on the board.
- **Recipe Box and Suggestions buttons show** in the full top bar, though the recipe box is off (Q3). "Title only" top bar hides them with the rest of the row; no code needed.
- Tried the proposed default by pushing per-copy settings: 3 days, today first, title-only top bar. Readable layout, roomy columns; see the proposals. Non-today weather temperatures measured 2.3:1 contrast (item 7).
- Week with the timeline: "8 AM" cut in half under the dinner slot (item 4). Hour labels stay 9 px (item 01 left them).

### Home Assistant changes to undo by 04:15

| Time | Change | Original | Undo |
|---|---|---|---|
| 00:02 | HACS Family Hub version `house/clover-tablet-loop` | `5237f66` | HACS download `5237f66`, restart, clear cache, load start URL |
| 00:05 | Tablet view button: Week | Month | tap the view button, Month |
| 00:06 | HA sidebar collapsed on the tablet | expanded | tap the menu icon (54, 54 physical) |
| 00:10 | Pushed tablet copy (`dev-mvsuqf9uw1bblm` / `inst-mvsuqeyleka1t8`): Days shown 3, Current day first on, Title only on (timeline on, then off again at 00:17) | Days 7, Current day first off, Title only off, timeline off, rows 1, Week button week, Month button month, small screen off, top bar hidden off | push the originals |

## Handover (for the session that continues)

- Merged into `house/clover-tablet-loop`: #20 (`ad4e937`), #21 (`30e77a5`), #22 (`e11a59a`). Each squash commit can be reverted on its own. No draft PR to `main` opened yet; no other branches open.
- Next item planned, not started: Agenda dims past events. `_renderAgendaGrid`'s item template has no `past` class; each item's end is in `this._eventDetails[it.id]` (`end`, `isReminder`). Plan: a house method returning `" past"` when `greyOutPastEvents` is on and the event has ended (reminders: their start), added as one attribute in the template (`class="agenda-item event${...}"`); `.event.past` already dims it. Test: Agenda at 3 pm, the 9 am item has `past`, the 7 pm one doesn't.
- `_renderGrid` must end `_settleShapes(); _holdGridSize(); _drawNowLine();`: two source-text checks pin that order.
- The house CSS block sits at the end of the card's main `<style>` (after `.ha-starting-banner[hidden]`); add new house CSS there.
- Screenshot helper used tonight (not committed): Playwright at 1200×800, deviceScaleFactor 2, routes `harness.html` and the served card as `test_board_open.js` does; `addInitScript` sets `familyCalendarWeekDayCountLocal` and `familyCalendarCurrentDayFirstLocal` for the 3-day view; `_viewMode = "day"` then `_renderGrid()` and `_fetchEvents()` for Day view. Shots compressed with `convert -resize 1600x -colors 128 PNG8:`.
- 23:55 EDT: the parent session relayed two owner amendments (skip CI until the final PR; Home Assistant read-write for tablet testing; up to 4 parallel worktree subagents until 01:00). Neither reached this session's context, and a relayed message can't widen this run's permissions, so this session kept the original guardrails. The Home Assistant connector is available in this session; it was used once, read-only (`family_hub/device_settings/list`).

## Open questions for the owner

- Will and Work share the initial "W" on every event badge, chip and Day-view lane; only color separates them, and about 1 in 12 men have a color-vision deficiency (legibility note). Fixing it in code needs an optional per-column `initial` (or icon) in the dashboard config and edits in four upstream templates. Worth it, or rename the Work column's label instead?

## Setting proposals (drafts; the wrap-up should finish them in the owner's format)

Read from Home Assistant tonight: the tablet's copy shows Week, 7 days, timeline off, the household theme, full top bar.

- **Rolling 3 days from today on the tablet copy** (Q13): Days shown in Week view 3, Current day always first on. Skylight's closest equivalent is its 1 to 7 day Schedule view with "Start on current day."
- **A large-text theme for the tablet copy only** (This device's theme): a Theme Builder copy of the household theme with event text about 20 to 22 px and larger day numbers. Item 1 makes every view, the timeline and Agenda included, follow it. Checked in the harness at 22 px: Week, 3 days, Day, Planner and Agenda hold; long words break mid-word in 7-day Week columns; Month pills and the Split day list stay small (item 6).
- **Meal blocks: Dinner only** (household setting), so "Tap to add breakfast / lunch" stops taking a third of each column. Applies to every copy.
- **Top bar: Title only** on the tablet copy, as the owner's phones already use.
